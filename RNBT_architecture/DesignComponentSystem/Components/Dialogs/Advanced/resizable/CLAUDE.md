# Dialogs — Advanced / resizable

## 기능 정의

1. **다이얼로그 콘텐츠 렌더링 (Standard 호환)** — `dialogInfo` 토픽으로 수신한 단일 객체(`icon`/`headline`/`supporting`)를 팝업 내부에 렌더 (FieldRenderMixin, `_popupScope`).
2. **액션 버튼 렌더링 (Standard 호환)** — `dialogActions` 토픽으로 수신한 배열(`actionid`/`actionLabel`)을 template 반복으로 액션 영역에 렌더 (ListRenderMixin, `_popupScope`).
3. **다이얼로그 표시/숨김 + 라이프사이클 이벤트** — ShadowPopupMixin으로 Shadow DOM 기반 오버레이 관리. `setDialogOpen` 토픽 또는 `show()`/`hide()` 호출 시 `@dialogOpened` / `@dialogClosed` 발행. `hide()` 시점에 dialog 크기를 리셋(다음 open 시 기본 크기로 복귀).
4. **모서리/가장자리 핸들 드래그로 크기 조절** — Shadow DOM 내부 3종 resize handle(`.dialog__resize-handle[data-direction="se"|"s"|"e"]`)에서 pointerdown 시작 → pointermove로 `surface.style.width` / `surface.style.height` 갱신 → pointerup으로 종료. direction에 따라 width만(`e`) / height만(`s`) / 둘 다(`se`) 갱신. 본문/액션/헤더/닫기 버튼은 resize 트리거가 아니다.
5. **min/max 제약 (viewport 기반 clamp)** — `_minWidth`(기본 320), `_minHeight`(기본 200), `_maxWidth`(기본 viewport `innerWidth - margin*2`), `_maxHeight`(기본 viewport `innerHeight - margin*2`) 안에 클램프. setPointerCapture로 outside drag 추적.
6. **resize 상태 시각 차별** — `surface` 요소에 `data-resizing="true|false"`를 부착해 CSS가 페르소나별로 idle/resizing 2상태(handle 강조 색, surface 그림자, user-select: none)를 차별화. handle 자체는 항상 cursor: nwse-resize / ns-resize / ew-resize.
7. **resize 라이프사이클 이벤트** — 드래그가 인정된 사이클의 진입 시점에 `@dialogResizeStart` `{ width, height }` 1회 발행, pointerup/cancel 시점에 `@dialogResizeEnd` `{ width, height }` 1회 발행. 이동 중(`pointermove`)은 너무 자주 발화하므로 발행하지 않는다.
8. **외부 명령형 크기 제어** — `setDialogSize` 토픽 publish (`{ width, height }`) 또는 `setDialogSize(width, height)` 호출로 강제 크기 조절(localStorage 복원, 사용자 preset 적용 등). 같은 clamp 로직 적용. resize 이벤트 발행 없음.
9. **액션 버튼 / 닫기 이벤트 (Standard 호환)** — Shadow DOM 내부 `.dialog__action` 클릭 시 `@dialogActionClicked`, `.dialog__close-btn` 클릭 시 `@dialogClose` 발행 (bindPopupEvents).

> **Standard와의 분리 정당성**:
> - **자체 상태 14종** — `_isOpen` / `_minWidth` / `_minHeight` / `_maxWidth` / `_maxHeight` / `_startX` / `_startY` / `_originW` / `_originH` / `_isPointerDown` / `_resizeDirection` / `_pointerId` / `_surfaceEl` / `_handleEls` (Map). Standard는 stateless.
> - **Shadow DOM 내부 native pointer 리스너 라이프사이클** — Standard에는 없는 pointer 4종을 Shadow DOM의 `_handleEls`(SE/S/E 3개)에 직접 부착. `onCreated` 콜백 안에서 부착하고 beforeDestroy에서 명시적으로 detach.
> - **새 이벤트 4종** — `@dialogOpened` / `@dialogClosed` (라이프사이클) + `@dialogResizeStart` / `@dialogResizeEnd` (resize). Standard는 `@dialogClose` / `@dialogActionClicked` 2종만.
> - **새 구독 토픽 2종** — `setDialogOpen` (외부 명령형 open/close) + `setDialogSize` (외부 강제 크기). Standard는 데이터 구독(`dialogInfo`/`dialogActions`)만.
> - **새 cssSelectors KEY 4종** — `surface` (`data-resizing` 속성 + `width/height` 갱신 대상) + `resizeHandleSE` / `resizeHandleS` / `resizeHandleE` (resize 트리거 영역 3종). Standard에는 없음.
> - **자체 메서드 11종** — `_handlePointerDown` / `_handlePointerMove` / `_handlePointerUp` / `_handlePointerCancel` / `_clampSize` / `_applySize` / `setDialogSize` / `_handleOpenTopic` / `_handleSizeTopic` + show/hide wrapper 2종.
>
> 위 6축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.
>
> **Dialogs/Advanced/draggable·fullscreen과의 분리 정당성**: 세 변형은 모두 ShadowPopupMixin + FieldRenderMixin + ListRenderMixin 동일 mixin 조합을 쓰지만, 외부 자원이 다르다 — fullscreen은 `matchMedia listener` 라이프사이클 + `is-fullscreen` class 토글, draggable은 `pointer 4종 (handle 1개) + click capture` 라이프사이클 + `_x`/`_y` 상태 + `transform: translate3d` 갱신 + `data-dragging` 속성, **resizable은 `pointer 4종 (handle 3개) + direction 분기` 라이프사이클 + `_originW`/`_originH` 상태 + `style.width/height` 직접 갱신 + `data-resizing` 속성**. Standard 호환 토픽(`dialogInfo`/`dialogActions`/`setDialogOpen`)은 공유하지만, 발행 이벤트(`@dialogResize*`)와 자체 메서드 집합이 직교. resize는 layout 변경(width/height)으로 자연스러우므로 transform이 아닌 직접 style 갱신을 사용 — draggable의 transform 패턴과 명확히 구분.
>
> **참조 패턴**:
> - `Dialogs/Advanced/draggable` — pointer 4종 + 5px 임계 + setPointerCapture + clamp + Shadow DOM 내부 native 리스너 라이프사이클 + show/hide wrapper. 본 변형은 동일 패턴을 transform 대신 width/height 직접 갱신 + 3개 handle direction 분기로 응용.
> - `Dialogs/Advanced/fullscreen` — show/hide wrapper로 라이프사이클 이벤트 발행 (`@dialogOpened`/`@dialogClosed`) 패턴 동일 계열.

> **MD3 근거**: MD3 표준 명세는 dialog의 크기 조절을 직접 다루지 않지만, **데스크톱 윈도우 패러다임(Windows / macOS native 리사이즈 가능 dialog)** 과 **웹 작업 도구(코드 에디터의 settings dialog, 디자인 툴의 inspector panel, 데이터베이스 클라이언트의 query dialog)** 에서 모서리 드래그 리사이즈는 표준 패턴이다. 본문 길이/리스트 길이/표 폭에 맞춰 사용자가 dialog 크기를 자유롭게 조절할 수 있게 하여 **장문 입력 / 코드 편집 / 리스트 비교** 시나리오에서 UX를 향상시킨다.

---

## 구현 명세

### Mixin

ShadowPopupMixin + FieldRenderMixin (`_popupScope`) + ListRenderMixin (`_popupScope`) + 커스텀 메서드 11종

> Mixin 조합은 Standard / draggable / fullscreen과 동일하다. Advanced 분리는 mixin 추가가 아니라 **자체 상태 + Shadow DOM 내부 native pointer 리스너 라이프사이클(handle 3개) + width/height 직접 갱신 + 추가 이벤트/토픽** 으로 이루어진다. 신규 Mixin 생성 없음(기존 mixin + 자체 메서드 조합).

### cssSelectors

#### ShadowPopupMixin (`this.shadowPopup`) — 팝업 + resize 토글 대상

| KEY | VALUE | 용도 |
|-----|-------|------|
| template | `#dialog-popup-template` | 팝업 HTML/CSS가 담긴 template (규약) |
| surface | `.dialog__surface` | **resize width/height 적용 대상** — `data-resizing` + `style.width`/`style.height` 갱신 |
| resizeHandleSE | `.dialog__resize-handle[data-direction="se"]` | **남동(SE) 코너 핸들** — width + height 동시 갱신 |
| resizeHandleS | `.dialog__resize-handle[data-direction="s"]` | **남(S) 가장자리 핸들** — height만 갱신 |
| resizeHandleE | `.dialog__resize-handle[data-direction="e"]` | **동(E) 가장자리 핸들** — width만 갱신 |
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

> `surface` 요소의 `data-resizing="true|false"`는 컴포넌트 내부 `_handlePointerDown`/`_handlePointerUp`이 직접 갱신한다. CSS는 `.dialog__surface[data-resizing="true"]` 셀렉터로 idle/resizing 2상태를 분기.

### 인스턴스 상태

| 키 | 타입 | 기본 | 설명 |
|----|------|------|------|
| `_isOpen` | `boolean` | `false` | 다이얼로그 표시 여부 |
| `_minWidth` | `number` | `320` | 최소 width(px) |
| `_minHeight` | `number` | `200` | 최소 height(px) |
| `_maxWidth` | `number \| null` | `null` | 최대 width(px). `null`이면 viewport 기준 자동(`innerWidth - margin*2`) |
| `_maxHeight` | `number \| null` | `null` | 최대 height(px). `null`이면 viewport 기준 자동(`innerHeight - margin*2`) |
| `_startX`, `_startY` | `number` | `0` | pointerdown 시점의 client 좌표. dx/dy 기준 |
| `_originW`, `_originH` | `number` | `0` | pointerdown 시점의 surface width/height 스냅샷 |
| `_isPointerDown` | `boolean` | `false` | down→up 사이의 활성 상태. 중복 down 차단 + move 처리 게이트 |
| `_resizeDirection` | `'se' \| 's' \| 'e' \| null` | `null` | 현재 활성 핸들 direction. width/height 갱신 분기에 사용 |
| `_pointerId` | `number \| null` | `null` | setPointerCapture/release용 |
| `_surfaceEl` | `Element \| null` | `null` | onCreated에서 cache. width/height/data-resizing 갱신 대상 |
| `_handleEls` | `Map<string, Element> \| null` | `null` | onCreated에서 cache. SE/S/E handle 3개 |
| `_pointerDownHandler` / `_pointerMoveHandler` / `_pointerUpHandler` / `_pointerCancelHandler` | `Function \| null` | `null` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener |

### 구독 (subscriptions)

| topic | handler | 비고 |
|-------|---------|------|
| `dialogInfo` | `this._renderDialogInfo` | Standard 호환. `_popupScope.fieldRender.renderData` 위임 |
| `dialogActions` | `this._renderDialogActions` | Standard 호환. `_popupScope.listRender.renderData` 위임 |
| `setDialogOpen` | `this._handleOpenTopic` | `{ open: boolean }` 수신 → `show()` / `hide()` |
| `setDialogSize` | `this._handleSizeTopic` | `{ width: number, height: number }` 수신 → `setDialogSize(width, height)` |

### 이벤트 (customEvents — Shadow DOM 내부, bindPopupEvents)

| 이벤트 | 선택자 (computed) | 발행 | payload |
|--------|------------------|------|---------|
| click | `closeBtn` (shadowPopup.cssSelectors) | `@dialogClose` | `{ event, targetInstance }` |
| click | `.dialog__action` (직접 셀렉터 — Shadow DOM 내부) | `@dialogActionClicked` | `{ event, targetInstance }` |

### 자체 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@dialogOpened` | closed → open 전환된 시점 1회 | `{ targetInstance }` |
| `@dialogClosed` | open → closed 전환된 시점 1회 | `{ targetInstance }` |
| `@dialogResizeStart` | pointerdown → 첫 pointermove 시점 1회 (drag 시작) | `{ targetInstance, width, height }` |
| `@dialogResizeEnd` | resize가 인정된 사이클의 pointerup/cancel 시점 1회 | `{ targetInstance, width, height }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderDialogInfo({ response })` | `({response}) => void` | Standard 호환 핸들러. `_popupScope.fieldRender.renderData` 위임 |
| `_renderDialogActions({ response })` | `({response}) => void` | Standard 호환 핸들러. `_popupScope.listRender.renderData` 위임 |
| `_clampSize(w, h)` | `(number, number) => {width, height}` | min/max 안에 width/height clamp. `_maxWidth`/`_maxHeight` `null`이면 viewport 기준 자동(`innerWidth/innerHeight - margin*2`, margin 16px) |
| `_applySize()` | `() => void` | `_surfaceEl.style.width/height` 직접 갱신. `_surfaceEl` 없으면 무시 |
| `_handlePointerDown(e)` | `(PointerEvent) => void` | mouse는 좌클릭만. `e.currentTarget.dataset.direction` 기준 `_resizeDirection` 결정. `setPointerCapture`. surface rect 스냅샷 + `_isPointerDown=true` + `data-resizing="true"` + `@dialogResizeStart` 1회 발행 |
| `_handlePointerMove(e)` | `(PointerEvent) => void` | direction 별 dx/dy 적용해 `_originW + dx` / `_originH + dy` 계산 → `_clampSize` → surface.style.width/height 갱신 |
| `_handlePointerUp(e)` | `(PointerEvent) => void` | `_isPointerDown=false`. `data-resizing="false"` + `@dialogResizeEnd` 1회 발행. `releasePointerCapture` 시도 |
| `_handlePointerCancel(e)` | `(PointerEvent) => void` | pointerup과 동일 처리 |
| `setDialogSize(width, height)` | `(number, number) => void` | 외부 명령형 API. clamp 후 width/height 갱신. resize 이벤트 발행 없음 |
| `_handleOpenTopic({ response })` | `({response}) => void` | `setDialogOpen` 토픽 수신 → `response.open` 으로 `show()` / `hide()` |
| `_handleSizeTopic({ response })` | `({response}) => void` | `setDialogSize` 토픽 수신 → `setDialogSize(response.width, response.height)` |
| `show()` (오버라이드) | `() => void` | `shadowPopup.show()` 호출 후 `_isOpen` 갱신 + `@dialogOpened` 발행 |
| `hide()` (오버라이드) | `() => void` | `shadowPopup.hide()` 호출 후 `_isOpen` 갱신 + width/height 인라인 스타일 리셋 + `@dialogClosed` 발행 |

> **show/hide 오버라이드의 정당성**: `Dialogs/Advanced/fullscreen` / `draggable`과 동일 — 라이프사이클 이벤트 발행을 단일 진입점으로 모으기 위해 인스턴스 레벨에서 wrapper를 둔다. `this.shadowPopup.show()`는 그대로 호출(Mixin 메서드 재정의 아님).

> **resize 트리거 분리**: pointerdown 핸들러는 resize handle 자체에만 부착되어 있으므로 본문/헤더/액션 버튼/닫기 버튼은 트리거 대상이 아니다 (closest 분기 불필요).

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
   ├─ // localStorage 복원 — 사용자가 마지막으로 조절한 크기 적용
   │  const saved = JSON.parse(localStorage.getItem('dialogSize') || '{"width":480,"height":360}');
   │  dialogInstance.subscriptions.setDialogSize.forEach(h => h.call(dialogInstance, { response: { width: saved.width, height: saved.height } }));
   │
   └─ Wkit.onEventBusHandlers({
        '@dialogOpened':        () => state.lockBackdrop(),
        '@dialogClosed':        () => state.unlockBackdrop(),
        '@dialogResizeStart':   ({ width, height }) => analytics.track('dialog_resize_start', { width, height }),
        '@dialogResizeEnd':     ({ width, height }) => localStorage.setItem('dialogSize', JSON.stringify({ width, height })),
        '@dialogActionClicked': ({ event }) => { /* actionid 분기 */ },
        '@dialogClose':         ({ targetInstance }) => targetInstance.hide()
      });
```

### 디자인 변형

| 파일 | 페르소나 | resizing 시각 차별 |
|------|---------|-------------------|
| `01_refined` | A: Refined Technical | 다크 퍼플 tonal — handle 3종은 cursor: nwse/ns/ew-resize, resizing 시 surface 그림자 강화(퍼플 글로우) + handle 컬러 lift |
| `02_material` | B: Material Elevated | 라이트 elevation — resizing 시 box-shadow elevation level 4→5 강화 + cursor: resize 별, SE corner에 grip dots |
| `03_editorial` | C: Minimal Editorial | 웜 그레이 헤어라인 — resizing 시 미세 grey shadow + 헤어라인 강화, SE corner에 점선 indicator |
| `04_operational` | D: Dark Operational | 다크 시안 컴팩트 — resizing 시 cyan border glow 강화 + handle 컬러 lift, SE corner에 monospace 표식 |

각 페르소나는 surface 우측 하단에 SE handle(`data-direction="se"`, 16x16), 우측 가장자리에 E handle(`data-direction="e"`, 6px width × 100% height), 하단 가장자리에 S handle(`data-direction="s"`, 100% width × 6px height)을 명시하고 cursor: nwse-resize / ew-resize / ns-resize 기본 + `[data-resizing="true"] .dialog__resize-handle { ... }` 으로 idle/resizing 분기.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 5단계 (../를 5번)
