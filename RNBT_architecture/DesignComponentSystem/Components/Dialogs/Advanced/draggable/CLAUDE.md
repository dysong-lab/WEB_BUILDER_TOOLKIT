# Dialogs — Advanced / draggable

## 기능 정의

1. **다이얼로그 콘텐츠 렌더링 (Standard 호환)** — `dialogInfo` 토픽으로 수신한 단일 객체(`icon`/`headline`/`supporting`)를 팝업 내부에 렌더 (FieldRenderMixin, `_popupScope`).
2. **액션 버튼 렌더링 (Standard 호환)** — `dialogActions` 토픽으로 수신한 배열(`actionid`/`actionLabel`)을 template 반복으로 액션 영역에 렌더 (ListRenderMixin, `_popupScope`).
3. **다이얼로그 표시/숨김 + 라이프사이클 이벤트** — ShadowPopupMixin으로 Shadow DOM 기반 오버레이 관리. `setDialogOpen` 토픽 또는 `show()`/`hide()` 호출 시 `@dialogOpened` / `@dialogClosed` 발행. `hide()` 시점에 dialog 위치를 0/0으로 리셋(다음 open 시 중앙 재정렬).
4. **헤더 드래그로 위치 이동** — Shadow DOM 내부 `.dialog__handle` 영역에서 pointerdown 시작 → pointermove로 dialog의 `transform: translate3d(x, y, 0)` 갱신 → pointerup으로 종료. body/footer/action 버튼은 드래그 트리거가 아니다. 임계 거리(5px) 이상 이동해야 "드래그"로 인정 — 그 미만이면 일반 click 동작 유지(헤더 클릭으로 인한 의도치 않은 이동 방지).
5. **viewport 경계 clamp** — 드래그 중 dialog가 viewport 밖으로 완전히 벗어나지 않도록 `surface`의 `getBoundingClientRect()` + viewport `innerWidth/innerHeight` 기준으로 좌표 clamp (margin 8px). dialog가 viewport보다 클 경우 clamp 무효(0~음수 maxX/maxY는 0으로 처리).
6. **드래그 상태 시각 차별** — `surface` 요소에 `data-dragging="true|false"`를 부착해 CSS가 페르소나별로 idle/dragging 2상태(cursor: grabbing, user-select: none, 약한 elevation 강화)를 차별화. handle 자체는 항상 `cursor: grab`.
7. **드래그 라이프사이클 이벤트** — 드래그가 인정된 사이클의 진입 시점에 `@dialogDragStart` `{ x, y }` 발행, pointerup/cancel 시점에 `@dialogDragEnd` `{ x, y }` 1회 발행. 이동 중(`pointermove`)은 너무 자주 발화하므로 발행하지 않는다(throttle도 불필요 — 종료 시점만으로 충분).
8. **외부 명령형 위치 제어** — `setDialogPosition` 토픽 publish (`{ x, y }`) 또는 `setDialogPosition(x, y)` 호출로 강제 위치 이동(localStorage 복원, dock 영역 조정 등). 같은 clamp 로직 적용. drag 이벤트 발행 없음.
9. **액션 버튼 / 닫기 이벤트 (Standard 호환)** — Shadow DOM 내부 `.dialog__action` 클릭 시 `@dialogActionClicked`, `.dialog__close-btn` 클릭 시 `@dialogClose` 발행 (bindPopupEvents).

> **Standard와의 분리 정당성**:
> - **자체 상태 8종** — `_isOpen` / `_x` / `_y` / `_startX` / `_startY` / `_originX` / `_originY` / `_isPointerDown` / `_isDraggingDetected` / `_dragThreshold` / `_surfaceEl` / `_handleEl`. Standard는 stateless.
> - **Shadow DOM 내부 native pointer 리스너 라이프사이클** — Standard에는 없는 pointer 4종 + click capture를 Shadow DOM의 `_handleEl`/`_surfaceEl`에 직접 부착. `onCreated` 콜백 안에서 부착하고 beforeDestroy에서 명시적으로 detach.
> - **새 이벤트 4종** — `@dialogOpened` / `@dialogClosed` (라이프사이클) + `@dialogDragStart` / `@dialogDragEnd` (드래그). Standard는 `@dialogClose` / `@dialogActionClicked` 2종만.
> - **새 구독 토픽 2종** — `setDialogOpen` (외부 명령형 open/close) + `setDialogPosition` (외부 강제 위치). Standard는 데이터 구독(`dialogInfo`/`dialogActions`)만.
> - **새 cssSelectors KEY 2종** — `surface` (`data-dragging` 속성 + `transform` 갱신 대상) + `handle` (드래그 핸들 영역). Standard에는 없음.
> - **자체 메서드 9종** — `_handlePointerDown` / `_handlePointerMove` / `_handlePointerUp` / `_handlePointerCancel` / `_clampPosition` / `_applyTransform` / `setDialogPosition` / `_handleOpenTopic` / `_handlePositionTopic` + show/hide wrapper 2종.
>
> 위 6축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.
>
> **Dialogs/Advanced/fullscreen과의 분리 정당성**: 두 변형은 모두 ShadowPopupMixin + FieldRenderMixin + ListRenderMixin 동일 mixin 조합을 쓰지만, 외부 자원이 다르다 — fullscreen은 `matchMedia listener` 라이프사이클 + `_isFullscreen`/`_forceFullscreen` 상태 + `is-fullscreen` class 토글, draggable은 `pointer 4종 + click capture` 라이프사이클 + `_x`/`_y`/`_isPointerDown`/`_isDraggingDetected` 상태 + `transform: translate3d` 갱신 + `data-dragging` 속성. Standard 호환 토픽(`dialogInfo`/`dialogActions`/`setDialogOpen`)은 공유하지만, 발행 이벤트와 자체 메서드 집합이 직교.
>
> **참조 패턴**:
> - `Buttons/FAB/Advanced/draggable` — pointer 4종 + 5px 임계 + `_isDraggingDetected` + click capture + clamp + `data-drag-state` 패턴. 본 변형은 동일 패턴을 Shadow DOM 내부에서 적용.
> - `Buttons/ExtendedFABs/Advanced/draggable` — 동일 드래그 패턴.
> - `Cards/Advanced/swipeAction` — pointer 4종 + 임계 + transform translate3d 패턴 동일 계열.
> - `Dialogs/Advanced/fullscreen` — show/hide wrapper로 라이프사이클 이벤트 발행 (`@dialogOpened`/`@dialogClosed`) 패턴 동일 계열.

> **MD3 근거**: MD3 표준 명세는 dialog의 위치 이동을 직접 다루지 않지만, **데스크톱 윈도우 패러다임(Windows / macOS native dialog)** 과 **웹 작업 도구(코드 에디터, 스프레드시트, 디자인 툴)의 inspector/floating panel** 에서 헤더 드래그 이동은 표준 패턴이다. 작업 영역을 가리지 않게 사용자가 dialog를 옮길 수 있게 하여 비교/참조 시나리오에서 UX를 향상시킨다.

---

## 구현 명세

### Mixin

ShadowPopupMixin + FieldRenderMixin (`_popupScope`) + ListRenderMixin (`_popupScope`) + 커스텀 메서드 9종

> Mixin 조합은 Standard / fullscreen과 동일하다. Advanced 분리는 mixin 추가가 아니라 **자체 상태 + Shadow DOM 내부 native pointer 리스너 라이프사이클 + transform 갱신 + 추가 이벤트/토픽** 으로 이루어진다. 신규 Mixin 생성 없음(기존 mixin + 자체 메서드 조합).

### cssSelectors

#### ShadowPopupMixin (`this.shadowPopup`) — 팝업 + drag 토글 대상

| KEY | VALUE | 용도 |
|-----|-------|------|
| template | `#dialog-popup-template` | 팝업 HTML/CSS가 담긴 template (규약) |
| surface | `.dialog__surface` | **드래그 transform 적용 대상** — `data-dragging` + `style.transform` 갱신 |
| handle | `.dialog__handle` | **드래그 트리거 영역** — pointerdown 시작점 (헤더 내부) |
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

> `surface` 요소의 `data-dragging="true|false"`는 컴포넌트 내부 `_handlePointerDown`/`_handlePointerUp`이 직접 갱신한다. CSS는 `.dialog__surface[data-dragging="true"]` 셀렉터로 idle/dragging 2상태를 분기.

### 인스턴스 상태

| 키 | 타입 | 기본 | 설명 |
|----|------|------|------|
| `_isOpen` | `boolean` | `false` | 다이얼로그 표시 여부 |
| `_dragThreshold` | `number` | `5` | 드래그 인정 임계 거리(px). 미만 이동 = 단순 click(드래그 무효). |
| `_x`, `_y` | `number` | `0` | 현재 누적 translate 좌표(px). hide() 시 0으로 리셋. |
| `_startX`, `_startY` | `number` | `0` | pointerdown 시점의 client 좌표. dx/dy 기준. |
| `_originX`, `_originY` | `number` | `0` | pointerdown 시점의 누적 `_x`/`_y` 스냅샷. |
| `_isPointerDown` | `boolean` | `false` | down→up 사이의 활성 상태. 중복 down 차단 + move 처리 게이트. |
| `_isDraggingDetected` | `boolean` | `false` | 임계(5px) 도달 후 true. true면 pointerup 시 `@dialogDragEnd` 발행. |
| `_surfaceEl` | `Element \| null` | `null` | onCreated에서 cache. transform/data-dragging 갱신 대상. |
| `_handleEl` | `Element \| null` | `null` | onCreated에서 cache. pointerdown 부착 대상. |
| `_pointerDownHandler` / `_pointerMoveHandler` / `_pointerUpHandler` / `_pointerCancelHandler` | `Function \| null` | `null` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener. |

### 구독 (subscriptions)

| topic | handler | 비고 |
|-------|---------|------|
| `dialogInfo` | `this._renderDialogInfo` | Standard 호환. `_popupScope.fieldRender.renderData` 위임 |
| `dialogActions` | `this._renderDialogActions` | Standard 호환. `_popupScope.listRender.renderData` 위임 |
| `setDialogOpen` | `this._handleOpenTopic` | `{ open: boolean }` 수신 → `show()` / `hide()` |
| `setDialogPosition` | `this._handlePositionTopic` | `{ x: number, y: number }` 수신 → `setDialogPosition(x, y)` |

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
| `@dialogDragStart` | pointermove에서 임계(5px) 도달한 시점 1회 | `{ targetInstance, x, y }` |
| `@dialogDragEnd` | 드래그가 인정된 사이클의 pointerup/cancel 시점 1회 | `{ targetInstance, x, y }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderDialogInfo({ response })` | `({response}) => void` | Standard 호환 핸들러. `_popupScope.fieldRender.renderData` 위임 |
| `_renderDialogActions({ response })` | `({response}) => void` | Standard 호환 핸들러. `_popupScope.listRender.renderData` 위임 |
| `_clampPosition(nextX, nextY)` | `(number, number) => {x, y}` | viewport 경계 안에 좌표 clamp. `surface` rect + viewport innerWidth/innerHeight + margin(8px). |
| `_applyTransform()` | `() => void` | `_surfaceEl.style.transform = 'translate3d(_x, _y, 0)'`. `_surfaceEl` 없으면 무시. |
| `_handlePointerDown(e)` | `(PointerEvent) => void` | mouse는 좌클릭만. close 버튼/action 버튼 위에서는 무시(`closest`). `setPointerCapture`. 좌표 스냅샷 + `_isPointerDown=true`. |
| `_handlePointerMove(e)` | `(PointerEvent) => void` | dx/dy 누적 거리 5px 도달 시 `_isDraggingDetected=true` + `data-dragging="true"` + `@dialogDragStart` 1회. 이후 `_clampPosition` + `_applyTransform`. |
| `_handlePointerUp(e)` | `(PointerEvent) => void` | `_isPointerDown=false`. drag 인정 사이클이면 `data-dragging="false"` + `@dialogDragEnd`. `_isDraggingDetected=false`. |
| `_handlePointerCancel(e)` | `(PointerEvent) => void` | pointerup과 동일 처리. |
| `setDialogPosition(x, y)` | `(number, number) => void` | 외부 명령형 API. clamp 후 `_x/_y` 갱신 + `_applyTransform`. drag 이벤트 발행 없음. |
| `_handleOpenTopic({ response })` | `({response}) => void` | `setDialogOpen` 토픽 수신 → `response.open` 으로 `show()` / `hide()` |
| `_handlePositionTopic({ response })` | `({response}) => void` | `setDialogPosition` 토픽 수신 → `setDialogPosition(response.x, response.y)` |
| `show()` (오버라이드) | `() => void` | `shadowPopup.show()` 호출 후 `_isOpen` 갱신 + `@dialogOpened` 발행 |
| `hide()` (오버라이드) | `() => void` | `shadowPopup.hide()` 호출 후 `_isOpen` 갱신 + 위치 0/0 리셋 + `@dialogClosed` 발행 |

> **show/hide 오버라이드의 정당성**: `Dialogs/Advanced/fullscreen`과 동일 — 라이프사이클 이벤트 발행을 단일 진입점으로 모으기 위해 인스턴스 레벨에서 wrapper를 둔다. `this.shadowPopup.show()`는 그대로 호출(Mixin 메서드 재정의 아님).

> **드래그 트리거 분리**: pointerdown 핸들러는 `event.target.closest('.dialog__close-btn')` 또는 `closest('.dialog__action')`이 truthy면 즉시 return. 닫기 버튼/액션 버튼 클릭이 드래그로 오인되지 않도록 한다.

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
   ├─ // localStorage 복원
   │  const saved = JSON.parse(localStorage.getItem('dialogPos') || '{"x":0,"y":0}');
   │  dialogInstance.subscriptions.setDialogPosition.forEach(h => h.call(dialogInstance, { response: { x: saved.x, y: saved.y } }));
   │
   └─ Wkit.onEventBusHandlers({
        '@dialogOpened':        () => state.lockBackdrop(),
        '@dialogClosed':        () => state.unlockBackdrop(),
        '@dialogDragStart':     ({ x, y }) => analytics.track('dialog_drag', { x, y }),
        '@dialogDragEnd':       ({ x, y }) => localStorage.setItem('dialogPos', JSON.stringify({ x, y })),
        '@dialogActionClicked': ({ event }) => { /* actionid 분기 */ },
        '@dialogClose':         ({ targetInstance }) => targetInstance.hide()
      });
```

### 디자인 변형

| 파일 | 페르소나 | dragging 시각 차별 |
|------|---------|-------------------|
| `01_refined` | A: Refined Technical | 다크 퍼플 tonal — handle은 cursor: grab, dragging 시 surface 그림자 강화(퍼플 글로우) + cursor: grabbing |
| `02_material` | B: Material Elevated | 라이트 elevation — dragging 시 box-shadow elevation level 4→5 강화 + cursor: grabbing |
| `03_editorial` | C: Minimal Editorial | 웜 그레이 헤어라인 — dragging 시 미세 grey shadow + cursor: grabbing, handle에 점선 dot indicator |
| `04_operational` | D: Dark Operational | 다크 시안 컴팩트 — dragging 시 cyan border glow 강화 + cursor: grabbing, monospace handle 라벨 |

각 페르소나는 헤더에 `.dialog__handle` 영역을 명시하고(상단 16~24px 안에 drag-grip 아이콘 또는 점 indicator) `cursor: grab` 기본 + `[data-dragging="true"] { cursor: grabbing; user-select: none; }` 으로 idle/dragging 분기. close 버튼은 handle과 같은 행에 두되 `closest('.dialog__close-btn')` 분기로 드래그 trigger와 분리.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 5단계 (../를 5번)
