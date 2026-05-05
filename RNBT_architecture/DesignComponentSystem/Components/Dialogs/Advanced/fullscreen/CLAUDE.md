# Dialogs — Advanced / fullscreen

## 기능 정의

1. **다이얼로그 콘텐츠 렌더링 (Standard 호환)** — `dialogInfo` 토픽으로 수신한 단일 객체(`icon`/`headline`/`supporting`)를 팝업 내부에 렌더 (FieldRenderMixin, `_popupScope`).
2. **액션 버튼 렌더링 (Standard 호환)** — `dialogActions` 토픽으로 수신한 배열(`actionid`/`actionLabel`)을 template 반복으로 액션 영역에 렌더 (ListRenderMixin, `_popupScope`).
3. **다이얼로그 표시/숨김 + 라이프사이클 이벤트** — ShadowPopupMixin으로 Shadow DOM 기반 오버레이 관리. `setDialogOpen` 토픽 또는 `show()`/`hide()` 호출 시 `@dialogOpened` / `@dialogClosed` 발행. show 호출 직후 현재 viewport 기준 fullscreen 평가 1회 수행.
4. **breakpoint 자동 감지로 fullscreen 토글** — `window.matchMedia(`(max-width: ${breakpoint - 1}px)`)` listener로 viewport 너비를 감지. 임계값(기본 600px) 미만이면 자동 fullscreen 모드로 진입, 이상이면 일반 modal 레이아웃. listener는 onLoad에 등록, beforeDestroy에서 해제.
5. **forceFullscreen 강제 토글 (외부 토픽 + 명령형 API)** — `setForceFullscreen` 토픽 publish (`{ force: boolean | null }`) 또는 `setForceFullscreen(value)` 호출로 breakpoint와 무관하게 강제 fullscreen 표시. `null`은 자동(breakpoint) 모드 복귀.
6. **fullscreen 상태 적용** — 실제 fullscreen 평가는 `_forceFullscreen ?? (matchMedia.matches)` 결과. 변경 시 `surface` 요소에 `is-fullscreen` class를 토글하고 `data-fullscreen="true|false"`를 갱신. CSS는 두 상태(modal / fullscreen)를 분기.
7. **fullscreen 변경 이벤트** — fullscreen 상태가 실제로 바뀐 시점에만 `@dialogFullscreenChanged` 1회 발행. payload: `{ isFullscreen: boolean, reason: 'breakpoint' | 'force' }`.
8. **액션 버튼 / 닫기 이벤트 (Standard 호환)** — Shadow DOM 내부 `.dialog__action` 클릭 시 `@dialogActionClicked`, `.dialog__close-btn` 클릭 시 `@dialogClose` 발행 (bindPopupEvents).

> **Standard와의 분리 정당성**:
> - **자체 상태 4종** — `_isOpen` / `_isFullscreen` / `_forceFullscreen: boolean | null` / `_breakpoint: number`. Standard는 stateless.
> - **외부 자원(matchMedia listener) 라이프사이클** — Standard에는 없는 `_mediaQuery` / `_mediaListener` add/remove. beforeDestroy에서 명시적으로 listener를 해제해야 한다 (AppBars/Advanced/scrollCollapsing 패턴과 동등).
> - **새 이벤트 3종** — `@dialogOpened` / `@dialogClosed` (라이프사이클) + `@dialogFullscreenChanged` (상태 동기화). Standard는 `@dialogClose` / `@dialogActionClicked` 2종만.
> - **새 구독 토픽 2종** — `setDialogOpen` (외부 명령형 open/close) + `setForceFullscreen` (강제 토글). Standard는 데이터 구독(`dialogInfo`/`dialogActions`)만.
> - **새 cssSelectors KEY 1종** — `surface` (`is-fullscreen` class 부착 + `data-fullscreen` 갱신 대상). Standard에는 없음.
> - **자체 메서드 6종** — `_evaluateFullscreen` / `_applyFullscreenState` / `_handleMediaChange` / `setForceFullscreen` / `_handleForceTopic` / `_handleOpenTopic`.
>
> 위 5축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.
>
> **참조 패턴**:
> - `Cards/Advanced/expandable` — 자체 boolean 상태 + dataset 토글 + `_setExpanded` 멱등 전환 + 이벤트 발행.
> - `AppBars/Advanced/scrollCollapsing` — 외부 자원(scroll listener) 부착/해제 라이프사이클 + 명령형 API. 본 변형은 동일 패턴을 matchMedia listener로 적용.

---

## 구현 명세

### Mixin

ShadowPopupMixin + FieldRenderMixin (`_popupScope`) + ListRenderMixin (`_popupScope`) + 커스텀 메서드 6종

> Mixin 조합은 Standard와 동일하다. Advanced 분리는 mixin 추가가 아니라 **자체 상태 + matchMedia 라이프사이클 + 멱등 상태 전환 메서드 + 추가 이벤트/토픽** 으로 이루어진다.

### cssSelectors

#### ShadowPopupMixin (`this.shadowPopup`) — 팝업 + fullscreen 토글 대상

| KEY | VALUE | 용도 |
|-----|-------|------|
| template | `#dialog-popup-template` | 팝업 HTML/CSS가 담긴 template (규약) |
| surface | `.dialog__surface` | **fullscreen 상태 적용 대상** — `is-fullscreen` class + `data-fullscreen` |
| closeBtn | `.dialog__close-btn` | 닫기 버튼 — Shadow DOM 내부 이벤트 |

#### FieldRenderMixin (`this._popupScope.fieldRender`)

| KEY | VALUE | 용도 |
|-----|-------|------|
| icon | `.dialog__icon` | 헤드라인 아이콘 |
| headline | `.dialog__headline` | 다이얼로그 제목 |
| supporting | `.dialog__supporting` | 본문 텍스트 |

#### ListRenderMixin (`this._popupScope.listRender`)

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.dialog__actions` | 항목이 추가될 부모 (규약) |
| template | `#dialog-action-template` | cloneNode 대상 (규약) |
| actionid | `.dialog__action` | 항목 식별 + 이벤트 매핑 |
| actionLabel | `.dialog__action-label` | 액션 라벨 |

### itemKey

actionid (ListRenderMixin)

### datasetAttrs

| Mixin | KEY | VALUE |
|-------|-----|-------|
| ListRenderMixin | actionid | actionid |

> `surface` 요소의 `data-fullscreen="true|false"`는 컴포넌트 내부 `_applyFullscreenState()`가 직접 갱신한다. CSS는 `.dialog__surface[data-fullscreen="true"]` 또는 `.dialog__surface.is-fullscreen` 셀렉터로 두 상태를 분기.

### 인스턴스 상태

| 키 | 타입 | 기본 | 설명 |
|----|------|------|------|
| `_isOpen` | `boolean` | `false` | 다이얼로그 표시 여부 |
| `_isFullscreen` | `boolean` | `false` | 현재 fullscreen 적용 여부 (실제 화면 상태) |
| `_forceFullscreen` | `boolean \| null` | `null` | 강제 모드. `null`이면 자동(breakpoint), boolean이면 강제 |
| `_breakpoint` | `number` | `600` | fullscreen 진입 임계 viewport 너비(px). 옵션으로 변경 가능 |
| `_mediaQuery` | `MediaQueryList \| null` | `null` | matchMedia 객체 |
| `_mediaListener` | `Function \| null` | `null` | bound listener (remove 시 같은 참조 필요) |

### 구독 (subscriptions)

| topic | handler | 비고 |
|-------|---------|------|
| `dialogInfo` | `this._renderDialogInfo` | Standard 호환. `_popupScope.fieldRender.renderData` 위임 |
| `dialogActions` | `this._renderDialogActions` | Standard 호환. `_popupScope.listRender.renderData` 위임 |
| `setDialogOpen` | `this._handleOpenTopic` | `{ open: boolean }` 수신 → `show()` / `hide()` |
| `setForceFullscreen` | `this._handleForceTopic` | `{ force: boolean \| null }` 수신 → `setForceFullscreen(value)` |

### 이벤트 (customEvents — Shadow DOM 내부, bindPopupEvents)

| 이벤트 | 선택자 (computed) | 발행 | payload |
|--------|------------------|------|---------|
| click | `closeBtn` (shadowPopup.cssSelectors) | `@dialogClose` | `{ event, targetInstance }` |
| click | `.dialog__action` (직접 셀렉터 — Shadow DOM 내부) | `@dialogActionClicked` | `{ event, targetInstance }` |

### 자체 발행 이벤트 (Wkit.emitEvent / Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@dialogOpened` | closed → open 전환된 시점 1회 | `{ targetInstance, isFullscreen }` |
| `@dialogClosed` | open → closed 전환된 시점 1회 | `{ targetInstance }` |
| `@dialogFullscreenChanged` | fullscreen 상태가 실제로 바뀐 시점 1회 | `{ targetInstance, isFullscreen, reason: 'breakpoint' \| 'force' }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderDialogInfo({ response })` | `({response}) => void` | Standard 호환 핸들러. `_popupScope.fieldRender.renderData` 위임 |
| `_renderDialogActions({ response })` | `({response}) => void` | Standard 호환 핸들러. `_popupScope.listRender.renderData` 위임 |
| `_evaluateFullscreen()` | `() => boolean` | `_forceFullscreen ?? _mediaQuery.matches` 평가하여 boolean 반환 |
| `_applyFullscreenState(reason)` | `('breakpoint' \| 'force') => void` | 평가 → 실제로 바뀐 경우에만 surface class/dataset 갱신 + `@dialogFullscreenChanged` 발행 (멱등) |
| `_handleMediaChange()` | `() => void` | matchMedia listener — `_applyFullscreenState('breakpoint')` 호출 |
| `setForceFullscreen(value)` | `(boolean \| null) => void` | 외부 명령형 API. `null`/`true`/`false` 외 값은 무시. `_forceFullscreen` 갱신 + `_applyFullscreenState('force')` |
| `_handleForceTopic({ response })` | `({response}) => void` | `setForceFullscreen` 토픽 수신 → `setForceFullscreen(response.force)` |
| `_handleOpenTopic({ response })` | `({response}) => void` | `setDialogOpen` 토픽 수신 → `response.open` 으로 `show()` / `hide()` |
| `show()` (오버라이드) | `() => void` | shadowPopup.show() 호출 후 `_isOpen` 갱신 + open 평가 + fullscreen 1회 평가 + `@dialogOpened` 발행 |
| `hide()` (오버라이드) | `() => void` | shadowPopup.hide() 호출 후 `_isOpen` 갱신 + `@dialogClosed` 발행 |

> **show/hide 오버라이드의 정당성**: 라이프사이클 이벤트(`@dialogOpened` / `@dialogClosed`) 발행을 단일 진입점으로 모으기 위해 인스턴스 레벨에서 wrapper를 둔다. shadowPopup의 내부 메서드는 그대로 두고, `instance.show/hide`만 추가한다 (Mixin 메서드 재정의 아님 — `this.shadowPopup.show()`는 그대로).

### 페이지 연결 사례

```
[페이지 onLoad]
   │
   ├─ this.pageDataMappings = [
   │     { topic: 'dialogInfo',    datasetInfo: {...} },
   │     { topic: 'dialogActions', datasetInfo: {...} }
   │  ];
   │
   ├─ // 외부 트리거로 다이얼로그 열기
   │  document.querySelector('#open').addEventListener('click', () => {
   │     dialogInstance.show();
   │     // 또는 dialogInstance.subscriptions.setDialogOpen.forEach(h => h.call(dialogInstance, { response: { open: true } }));
   │  });
   │
   ├─ // 모바일 환경에서 강제 fullscreen
   │  dialogInstance.subscriptions.setForceFullscreen.forEach(h => h.call(dialogInstance, { response: { force: true } }));
   │
   └─ Wkit.onEventBusHandlers({
        '@dialogOpened':            ({ isFullscreen }) => analytics.track('dialog_open', { isFullscreen }),
        '@dialogClosed':            () => state.unlockScroll(),
        '@dialogFullscreenChanged': ({ isFullscreen, reason }) => updateChrome(isFullscreen, reason),
        '@dialogActionClicked':     ({ event }) => { /* actionid 분기 */ },
        '@dialogClose':             ({ targetInstance }) => targetInstance.hide()
      });
```

### 디자인 변형

| 파일 | 페르소나 | modal → fullscreen 차별화 |
|------|---------|---------------------------|
| `01_refined` | A: Refined Technical | 다크 퍼플 tonal modal → fullscreen에서 surface가 viewport 100%, border-radius 0, AppBar-style 헤더(좌측 close + 우측 confirm) 노출, scrim 제거 |
| `02_material` | B: Material Elevated | 라이트 elevation modal → fullscreen에서 surface 100%, shadow 제거, 상단 액션 바 헤더(close + Save), Roboto 14px 액션 라벨 |
| `03_editorial` | C: Minimal Editorial | 웜 그레이 modal (헤어라인) → fullscreen에서 surface 100%, 헤어라인 보존, 32px 좌우 여백 + 세리프 헤드라인 유지 |
| `04_operational` | D: Dark Operational | 컴팩트 다크 시안 modal → fullscreen에서 surface 100%, 시안 ring 강화, 좌측 close + 모노스페이스 액션, 컴팩트 행 |

각 페르소나는 `.dialog__surface[data-fullscreen="true"]` 또는 `.dialog__surface.is-fullscreen` 셀렉터로 width/height 100%, border-radius 0, fullscreen 헤더(close + action), scrim 제거 등을 동시에 분기한다. modal 모드의 `.dialog__close-btn`은 hidden, fullscreen 모드의 `.dialog__close-btn`은 헤더 좌측에 표시.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 5단계 (../를 5번)
