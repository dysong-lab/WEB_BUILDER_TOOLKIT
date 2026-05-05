# BottomSheets — Advanced / draggableHeight

## 기능 정의

1. **시트 헤더 렌더링 (Standard 호환)** — `bottomSheetInfo` 토픽으로 수신한 단일 객체(`headline`/`supporting`)를 시트 상단 헤더 영역에 렌더 (FieldRenderMixin, `_popupScope`).
2. **시트 액션 버튼 렌더링 (Standard 호환)** — `bottomSheetActions` 토픽으로 수신한 배열(`actionid`/`actionLabel`/`actionIcon`)을 template 반복으로 시트 하단 액션 영역에 렌더 (ListRenderMixin, `_popupScope`).
3. **시트 표시/숨김 + 라이프사이클 이벤트** — ShadowPopupMixin으로 Shadow DOM 기반 모달 Bottom Sheet 관리. `setSheetOpen` 토픽 또는 `show()`/`hide()` 호출 시 `@bottomSheetOpened` / `@bottomSheetClosed` 발행. `hide()` 시점에 시트 height 인라인 스타일 리셋(다음 open 시 기본 height로 복귀).
4. **상단 핸들 드래그로 높이 조절** — Shadow DOM 내부 핸들 영역(`.bottom-sheet__drag-handle-area`)에서 pointerdown 시작 → pointermove로 `surface.style.height` 갱신 → pointerup으로 종료. 위로 드래그(dy < 0) = height 증가, 아래로 드래그(dy > 0) = height 감소. 액션 버튼/본문은 드래그 트리거가 아니다(handle 영역에만 pointer 부착).
5. **min/max 제약 (viewport 기반 clamp)** — `_minHeight`(기본 200), `_maxHeight`(기본 viewport `innerHeight - 32`) 안에 클램프. setPointerCapture로 핸들 밖으로 나가도 추적.
6. **dragging 상태 시각 차별** — `surface` 요소에 `data-dragging="true|false"`를 부착해 CSS가 페르소나별로 idle/dragging 2상태(handle 강조 색, surface 그림자, transition off, user-select: none)를 차별화. handle 자체는 항상 `cursor: ns-resize` 또는 `cursor: grab`(페르소나별).
7. **드래그 라이프사이클 이벤트** — pointerdown 시점에 `@dragHeightStart` `{ height }` 1회 발행, pointerup/cancel 시점에 `@dragHeightEnd` `{ height }` 1회 발행. 이동 중(`pointermove`)은 너무 자주 발화하므로 발행하지 않는다 — 종료 시점만 1회 + drag 종료 후 `@heightChanged` `{ height }` 1회.
8. **외부 명령형 height 제어** — `setSheetHeight` 토픽 publish (`{ height }`) 또는 `setSheetHeight(height)` 호출로 강제 height 조절(localStorage 복원, preset 적용 등). 같은 clamp 로직 적용. drag 이벤트 발행 없음.
9. **액션 버튼 / 닫기 이벤트 (Standard 호환)** — Shadow DOM 내부 `.bottom-sheet__action` 클릭 시 `@bottomSheetActionClicked`, `.bottom-sheet__scrim` 클릭 시 `@bottomSheetClosed` 트리거(scrim은 hide 직접 호출 X — 페이지 핸들러로 위임 가능, 본 변형은 wrapper hide()로 표준화).

> **Standard와의 분리 정당성**:
> - **자체 상태 11종** — `_isOpen` / `_minHeight` / `_maxHeight` / `_startY` / `_originH` / `_isPointerDown` / `_pointerId` / `_surfaceEl` / `_handleEl` / `_pointerDownHandler` / `_pointerMoveHandler` / `_pointerUpHandler` / `_pointerCancelHandler`. Standard는 stateless.
> - **Shadow DOM 내부 native pointer 리스너 라이프사이클** — Standard에는 없는 pointer 4종을 Shadow DOM의 `_handleEl`에 직접 부착. `onCreated` 콜백 안에서 부착하고 beforeDestroy에서 명시적으로 detach.
> - **새 이벤트 4종** — `@bottomSheetOpened` / `@bottomSheetClosed` (라이프사이클) + `@dragHeightStart` / `@dragHeightEnd` + `@heightChanged` (drag). Standard는 `@bottomSheetClose` / `@bottomSheetActionClicked` 2종만.
> - **새 구독 토픽 2종** — `setSheetOpen` (외부 명령형 open/close) + `setSheetHeight` (외부 강제 height). Standard는 데이터 구독(`bottomSheetInfo`/`bottomSheetActions`)만.
> - **새 cssSelectors KEY 2종** — `surface` (`data-dragging` 속성 + `style.height` 갱신 대상) + `handle` (드래그 트리거 영역). Standard에는 `closeBtn` 으로 핸들을 단일 닫기 버튼으로만 사용했으나, 본 변형은 핸들을 드래그 트리거로 재정의.
> - **자체 메서드 9종** — `_handlePointerDown` / `_handlePointerMove` / `_handlePointerUp` / `_handlePointerCancel` / `_clampHeight` / `setSheetHeight` / `_handleOpenTopic` / `_handleHeightTopic` + show/hide wrapper 2종.
>
> 위 6축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.
>
> **참조 패턴**:
> - `Dialogs/Advanced/draggable` — Shadow DOM 내부 pointer 4종 + setPointerCapture + Shadow DOM 내부 native 리스너 라이프사이클 + show/hide wrapper. 본 변형은 동일 라이프사이클 패턴을 채용.
> - `Dialogs/Advanced/resizable` — width/height 직접 갱신(transform이 아님) + min/max clamp + handle direction 분기. 본 변형은 height만 갱신하므로 direction 분기 없이 단일 핸들 + dy 기반 갱신으로 단순화.

> **MD3 근거**: MD3 명세는 bottom sheet의 "modal/standard/expanded" 3 상태 전환을 안내한다. 데스크톱/태블릿 환경에서 표준 패턴은 **drag handle을 사용자가 잡고 시트 높이를 자유 조절**하는 것 (Apple Maps Look Around, Google Maps directions detail, Spotify "Now Playing", iOS share sheet 등에서 일반화). Standard는 고정 높이 dismissable sheet인 반면, draggableHeight는 사용자가 콘텐츠 양에 맞춰 sheet 영역을 동적으로 조절할 수 있는 패턴.

---

## 구현 명세

### Mixin

ShadowPopupMixin + FieldRenderMixin (`_popupScope`) + ListRenderMixin (`_popupScope`) + 커스텀 메서드 9종

> Mixin 조합은 Standard와 동일하다. Advanced 분리는 mixin 추가가 아니라 **자체 상태 + Shadow DOM 내부 native pointer 리스너 라이프사이클 + height 직접 갱신 + 추가 이벤트/토픽** 으로 이루어진다. 신규 Mixin 생성 없음(기존 mixin + 자체 메서드 조합).

### cssSelectors

#### ShadowPopupMixin (`this.shadowPopup`) — 팝업 + drag 토글 대상

| KEY | VALUE | 용도 |
|-----|-------|------|
| template | `#bottom-sheet-popup-template` | 팝업 HTML/CSS가 담긴 template (규약) |
| surface | `.bottom-sheet__surface` | **drag height 적용 대상** — `data-dragging` + `style.height` 갱신 |
| handle | `.bottom-sheet__drag-handle-area` | **드래그 트리거 영역** — pointerdown 시작점 (시트 상단 grip 영역) |
| scrim | `.bottom-sheet__scrim` | 배경 오버레이 — 닫기 트리거 (Shadow DOM 내부 click) |

#### FieldRenderMixin (`this._popupScope.fieldRender`) — 시트 헤더

| KEY | VALUE | 용도 |
|-----|-------|------|
| headline | `.bottom-sheet__headline` | 시트 제목 |
| supporting | `.bottom-sheet__supporting` | 시트 보조 설명 |

#### ListRenderMixin (`this._popupScope.listRender`) — 시트 액션

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.bottom-sheet__actions` | 항목이 추가될 부모 (규약) |
| template | `#bottom-sheet-action-template` | cloneNode 대상 (규약) |
| actionid | `.bottom-sheet__action` | 항목 식별 + 이벤트 매핑 |
| actionLabel | `.bottom-sheet__action-label` | 액션 라벨 |
| actionIcon | `.bottom-sheet__action-icon` | 액션 아이콘 (선택적) |

### itemKey

actionid (ListRenderMixin)

### datasetAttrs

| Mixin | KEY | VALUE |
|-------|-----|-------|
| ListRenderMixin | actionid | actionid |

> `surface` 요소의 `data-dragging="true|false"`는 컴포넌트 내부 `_handlePointerDown`/`_handlePointerUp`이 직접 갱신한다. CSS는 `.bottom-sheet__surface[data-dragging="true"]` 셀렉터로 idle/dragging 2상태를 분기.

### 인스턴스 상태

| 키 | 타입 | 기본 | 설명 |
|----|------|------|------|
| `_isOpen` | `boolean` | `false` | 시트 표시 여부 |
| `_minHeight` | `number` | `200` | 최소 height(px) |
| `_maxHeight` | `number \| null` | `null` | 최대 height(px). `null`이면 viewport 기준 자동(`innerHeight - 32`) |
| `_startY` | `number` | `0` | pointerdown 시점의 client Y. dy 기준 |
| `_originH` | `number` | `0` | pointerdown 시점의 surface height 스냅샷 |
| `_isPointerDown` | `boolean` | `false` | down→up 사이의 활성 상태. 중복 down 차단 + move 처리 게이트 |
| `_pointerId` | `number \| null` | `null` | setPointerCapture/release용 |
| `_surfaceEl` | `Element \| null` | `null` | onCreated에서 cache. height/data-dragging 갱신 대상 |
| `_handleEl` | `Element \| null` | `null` | onCreated에서 cache. pointerdown 부착 대상 |
| `_pointerDownHandler` / `_pointerMoveHandler` / `_pointerUpHandler` / `_pointerCancelHandler` | `Function \| null` | `null` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener |

### 구독 (subscriptions)

| topic | handler | 비고 |
|-------|---------|------|
| `bottomSheetInfo` | `this._renderBottomSheetInfo` | Standard 호환. `_popupScope.fieldRender.renderData` 위임 |
| `bottomSheetActions` | `this._renderBottomSheetActions` | Standard 호환. `_popupScope.listRender.renderData` 위임 |
| `setSheetOpen` | `this._handleOpenTopic` | `{ open: boolean }` 수신 → `show()` / `hide()` |
| `setSheetHeight` | `this._handleHeightTopic` | `{ height: number }` 수신 → `setSheetHeight(height)` |

### 이벤트 (customEvents — Shadow DOM 내부, bindPopupEvents)

| 이벤트 | 선택자 (computed) | 발행 |
|--------|------------------|------|
| click | `scrim` (shadowPopup.cssSelectors) | `@bottomSheetClose` |
| click | `.bottom-sheet__action` (직접 셀렉터 — Shadow DOM 내부) | `@bottomSheetActionClicked` |

### 자체 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@bottomSheetOpened` | closed → open 전환된 시점 1회 | `{ targetInstance }` |
| `@bottomSheetClosed` | open → closed 전환된 시점 1회 | `{ targetInstance }` |
| `@dragHeightStart` | pointerdown 시점 1회 (drag 시작) | `{ targetInstance, height }` |
| `@dragHeightEnd` | pointerup/cancel 시점 1회 (drag 종료) | `{ targetInstance, height }` |
| `@heightChanged` | drag 종료 후 1회 (또는 setSheetHeight 후 1회) | `{ targetInstance, height }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderBottomSheetInfo({ response })` | `({response}) => void` | Standard 호환 핸들러. `_popupScope.fieldRender.renderData` 위임 |
| `_renderBottomSheetActions({ response })` | `({response}) => void` | Standard 호환 핸들러. `_popupScope.listRender.renderData` 위임 |
| `_clampHeight(h)` | `(number) => number` | min/max 안에 height clamp. `_maxHeight` `null`이면 viewport 기준 자동(`innerHeight - 32`) |
| `_handlePointerDown(e)` | `(PointerEvent) => void` | mouse는 좌클릭만. `setPointerCapture`. surface rect 스냅샷 + `_isPointerDown=true` + `data-dragging="true"` + `@dragHeightStart` 1회 발행. preventDefault. |
| `_handlePointerMove(e)` | `(PointerEvent) => void` | dy 계산 → `_originH - dy` (위로 드래그 = height 증가) → `_clampHeight` → surface.style.height 갱신 |
| `_handlePointerUp(e)` | `(PointerEvent) => void` | `_isPointerDown=false`. `data-dragging="false"` + `@dragHeightEnd` + `@heightChanged` 1회 발행. `releasePointerCapture` 시도 |
| `_handlePointerCancel(e)` | `(PointerEvent) => void` | pointerup과 동일 처리 |
| `setSheetHeight(height)` | `(number) => void` | 외부 명령형 API. clamp 후 height 갱신 + `@heightChanged` 발행. drag 이벤트 발행 없음 |
| `_handleOpenTopic({ response })` | `({response}) => void` | `setSheetOpen` 토픽 수신 → `response.open` 으로 `show()` / `hide()` |
| `_handleHeightTopic({ response })` | `({response}) => void` | `setSheetHeight` 토픽 수신 → `setSheetHeight(response.height)` |
| `show()` (오버라이드) | `() => void` | `shadowPopup.show()` 호출 후 `_isOpen` 갱신 + `@bottomSheetOpened` 발행 |
| `hide()` (오버라이드) | `() => void` | `shadowPopup.hide()` 호출 후 `_isOpen` 갱신 + height 인라인 스타일 리셋 + `@bottomSheetClosed` 발행 |

> **show/hide 오버라이드의 정당성**: `Dialogs/Advanced/draggable` / `resizable`과 동일 — 라이프사이클 이벤트 발행을 단일 진입점으로 모으기 위해 인스턴스 레벨에서 wrapper를 둔다. `this.shadowPopup.show()`는 그대로 호출(Mixin 메서드 재정의 아님).

> **drag 트리거 분리**: pointer 핸들러는 `_handleEl`(`.bottom-sheet__drag-handle-area`)에만 부착되어 있으므로 본문/액션 버튼은 트리거 대상이 아니다 (closest 분기 불필요).

### 페이지 연결 사례

```
[페이지 onLoad]
   │
   ├─ this.pageDataMappings = [
   │     { topic: 'bottomSheetInfo',    datasetInfo: {...} },
   │     { topic: 'bottomSheetActions', datasetInfo: {...} }
   │  ];
   │
   ├─ // 외부 트리거로 시트 열기
   │  document.querySelector('#open').addEventListener('click', () => {
   │     sheetInstance.show();
   │  });
   │
   ├─ // localStorage 복원 — 사용자가 마지막으로 조절한 height 적용
   │  const saved = JSON.parse(localStorage.getItem('sheetHeight') || '{"height":420}');
   │  sheetInstance._handleHeightTopic({ response: { height: saved.height } });
   │
   └─ Wkit.onEventBusHandlers({
        '@bottomSheetOpened':       () => state.lockBackdrop(),
        '@bottomSheetClosed':       () => state.unlockBackdrop(),
        '@dragHeightStart':         ({ height }) => analytics.track('sheet_drag_start', { height }),
        '@dragHeightEnd':           ({ height }) => analytics.track('sheet_drag_end',   { height }),
        '@heightChanged':           ({ height }) => localStorage.setItem('sheetHeight', JSON.stringify({ height })),
        '@bottomSheetActionClicked': ({ event }) => { /* actionid 분기 */ },
        '@bottomSheetClose':         ({ targetInstance }) => targetInstance.hide()
      });
```

### 디자인 변형

| 파일 | 페르소나 | dragging 시각 차별 + 도메인 컨텍스트 |
|------|---------|--------------------------------------|
| `01_refined` | A: Refined Technical | 다크 퍼플 tonal — handle은 cursor: ns-resize, dragging 시 surface 그림자 강화(퍼플 글로우) + handle 컬러 lift. 도메인: 운영 분석 콘솔 detail sheet — 사용자가 차트/로그 양에 맞춰 sheet 높이 조절. |
| `02_material` | B: Material Elevated | 라이트 elevation — dragging 시 box-shadow elevation level 4→5 강화 + cursor: grabbing. 도메인: 음악 player "Now Playing" — 곡 정보 + 가사 + 큐 사이를 드래그로 조절. |
| `03_editorial` | C: Minimal Editorial | 웜 그레이 헤어라인 — dragging 시 미세 grey shadow + 헤어라인 강화. 도메인: 지도 위 장소 detail sheet — peek/half/full 사이를 사용자 정의 위치로 자유 조절. |
| `04_operational` | D: Dark Operational | 다크 시안 컴팩트 — dragging 시 cyan border glow + handle 컬러 lift, 무딘 transition으로 즉각 반응. 도메인: 관제 alert detail sheet — 다중 alert 비교 시 사용자 시야 확보. |

각 페르소나는 시트 상단 핸들 영역에 명확한 `cursor` (ns-resize 또는 grab) 기본 + `[data-dragging="true"] { cursor: grabbing; user-select: none; }` 으로 idle/dragging 분기. dragging 동안 `transition`을 off하여 즉각 반응 보장.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 6단계 (../를 6번)
