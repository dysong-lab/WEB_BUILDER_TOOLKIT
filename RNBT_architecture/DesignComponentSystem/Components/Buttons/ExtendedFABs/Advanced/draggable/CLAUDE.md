# ExtendedFABs — Advanced / draggable

## 기능 정의

1. **아이콘/라벨 표시** — `extendedFabInfo` 토픽으로 수신한 데이터를 리딩 아이콘과 라벨 영역에 렌더(Standard와 동일한 1:1 필드 매핑).
2. **드래그 가능 위치 제어** — pointerdown 시점에 좌표를 캡처하고, pointermove로 `transform: translate3d(x, y, 0)`을 갱신해 FAB을 부모 컨테이너 안에서 자유롭게 이동시킨다. 임계 거리(5px) 이상 이동해야 "드래그"로 인정 — 그 미만이면 click을 그대로 통과시킨다.
3. **위치 확정 이벤트 발행** — 드래그가 인정된 사이클의 pointerup/cancel 시점에 `@positionChanged` 1회 발행 (payload: `{ targetInstance, x, y }`). 좌표는 부모 컨테이너 기준 px (translate3d 누적값).
4. **클릭 이벤트 분리 발행** — 임계 거리 미만 release면 일반 click → `@extendedFabClicked` (Standard와 동일). 드래그가 인정된 사이클의 native click은 capture phase에서 자동 억제(`stopImmediatePropagation` + `preventDefault`)되어 두 이벤트가 동시에 발화하지 않는다.
5. **컨테이너 경계 clamp** — 드래그 중 부모 컨테이너의 `getBoundingClientRect()`로 가용 영역을 계산해 FAB이 컨테이너 밖으로 벗어나지 않도록 좌표를 clamp.
6. **드래그 상태 시각 차별** — `data-drag-state="idle|dragging"` 속성을 FAB에 부착해 CSS가 페르소나별로 idle/dragging 2상태(elevation 상승, scale 1.04 lift, cursor: grabbing)를 차별화.

> **Standard와의 분리 정당성**: Standard는 단일 click → `@extendedFabClicked` 발행이 끝이며 위치는 정적이다. draggable은 ① 새 이벤트 `@positionChanged` (payload `{x, y}`) + click 보존, ② pointer 4종 native 리스너 + RAF 없는 즉시 transform 갱신 + `_isDraggingDetected`/`_x`/`_y`/`_startX`/`_startY` 자체 상태, ③ `_isDraggingDetected=true`일 때만 click capture 차단, ④ 부모 컨테이너 `position: relative` 의존 + 경계 clamp 로직 — 네 축 모두 Standard register.js와 직교. 따라서 같은 register.js로 표현 불가 → 별도 Advanced 변형으로 분리.

> **MD3 근거**: MD3 표준 명세는 FAB의 절대좌표 드래그를 직접 다루지 않지만, **Material Components for the web의 draggable FAB / Movable FAB 패턴**은 모바일 앱에서 키보드 가림(IME), 단일 손 도달 영역 회피, 사용자 선호 위치 기억 등 실용 이유로 널리 채택된다. 데스크톱에서도 floating widget(채팅, 도움말 위젯)에서 동일 패턴이 표준화되어 있다.

---

## 구현 명세

### Mixin

FieldRenderMixin (라벨/아이콘 렌더 전용) + 커스텀 메서드(`_handlePointerDown` / `_handlePointerMove` / `_handlePointerUp` / `_handlePointerCancel` / `_handleClickCapture` / `_clampPosition` / `_applyTransform`).

> Standard가 FieldRenderMixin으로 라벨/아이콘 렌더를 처리하므로 동일 Mixin을 재사용한다(`extendedFabInfo` payload 호환성 유지). 드래그 로직은 추가 Mixin 없이 자체 메서드 + 직접 native 이벤트 리스너로 완결한다(신규 Mixin 생성은 본 SKILL의 대상이 아님).

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| extendedFab | `.extended-fab` | 컨테이너 — pointerdown/move/up/cancel + click capture 부착 대상 + `data-drag-state` 속성 + `transform: translate3d(...)` 갱신 대상 |
| icon        | `.extended-fab__icon`  | 리딩 아이콘 (FieldRender) |
| label       | `.extended-fab__label` | 라벨 텍스트 (FieldRender) |

### datasetAttrs

| KEY | data-* | 용도 |
|-----|--------|------|
| dragState | `drag-state` | `data-drag-state="idle|dragging"`. FieldRender datasetAttrs에는 등록하지 않음 — 인스턴스 메서드(`_handlePointerDown`/`_handlePointerUp`)가 직접 `_fabEl.dataset.dragState`로 갱신. |

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_dragThreshold` | 드래그 인정 임계 거리(고정 5px). 이 미만 이동 + release = 단순 click(드래그 무효). |
| `_x`, `_y` | 현재 누적 translate 좌표. pointerdown 시점에 cache, move 동안 이동량을 더함. |
| `_startX`, `_startY` | pointerdown 시점의 client 좌표. move의 dx/dy 계산 기준. |
| `_originX`, `_originY` | pointerdown 시점의 누적 `_x`/`_y` 스냅샷(드래그 시작점). |
| `_isPointerDown` | down→up 사이의 활성 상태. 중복 down 차단 + move 처리 게이트. |
| `_isDraggingDetected` | 임계(5px) 도달 후 true. true면 click capture에서 차단, pointerup 시 `@positionChanged` 발행. |
| `_fabEl` | 드래그 중 querySelector를 매 move마다 반복하지 않도록 cache. |
| `_pointerDownHandler` / `_pointerMoveHandler` / `_pointerUpHandler` / `_pointerCancelHandler` / `_clickCaptureHandler` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener 하기 위해 this에 보관. |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| `extendedFabInfo` | `this.fieldRender.renderData` (Standard와 동일한 페이로드 `{ label, icon }`) |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `extendedFab` | pointerup이 임계 미만 이동(`_isDraggingDetected=false`)일 때 | `{ targetInstance, event }` (Wkit.bindEvents 표준) — `@extendedFabClicked` |
| `@positionChanged` | — (Weventbus.emit, 직접 발행) | 드래그가 인정된 사이클의 pointerup/cancel 시점에 1회 (`_isDraggingDetected=true`) | `{ targetInstance, x, y }` (px, 부모 컨테이너 기준 누적 translate) |

> click은 `customEvents` 맵에 등록해 `bindEvents` 위임 흐름을 그대로 사용한다(Standard와 동일 호환). 드래그가 인정된 사이클은 별도 capture phase click 리스너가 같은 사이클 click을 stopImmediatePropagation으로 차단한다 → bindEvents의 bubble phase 핸들러까지 도달하지 않으므로 `@extendedFabClicked` 미발행이 보장된다(드래그 후 의도치 않은 액션 발화 방지).

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_handlePointerDown(e)` | pointerType이 mouse면 `e.button !== 0` 차단(좌클릭만). 이미 down 상태면 중복 무시. `_fabEl` cache + `setPointerCapture(e.pointerId)` 시도. `_startX/_startY = e.clientX/Y`, `_originX/_originY = _x/_y`로 스냅샷. `_isPointerDown=true`, `_isDraggingDetected=false`, `dataset.dragState="idle"`(아직 임계 미도달). |
| `_handlePointerMove(e)` | `_isPointerDown=false`면 무시. dx = clientX - startX, dy = clientY - startY. 누적 거리가 임계(5px) 도달 시 `_isDraggingDetected=true` + `dataset.dragState="dragging"`. nextX = `_originX + dx`, nextY = `_originY + dy`를 `_clampPosition`으로 컨테이너 경계 안에 clamp 후 `_x/_y`에 저장 + `_applyTransform()`. |
| `_handlePointerUp(e)` | `_isPointerDown=false`로 복귀. `_isDraggingDetected=true`면 `dataset.dragState="idle"` + `Weventbus.emit('@positionChanged', { targetInstance: this, x: this._x, y: this._y })`. **`_isDraggingDetected`는 click capture가 처리한 직후 false로 복귀**(`_handleClickCapture` 안에서). 임계 미만 release면 click capture가 통과시키고 `bindEvents`가 `@extendedFabClicked`를 발화한다. |
| `_handlePointerCancel(e)` | `_isPointerDown=false`. 드래그 중이었으면(`_isDraggingDetected=true`) `@positionChanged` 발행 후 `dataset.dragState="idle"` + `_isDraggingDetected=false`(cancel은 click이 따라오지 않으므로 즉시 복귀). |
| `_handleClickCapture(e)` | `_isDraggingDetected=true`면 `e.stopImmediatePropagation()` + `e.preventDefault()` 후 `_isDraggingDetected=false`로 복귀(다음 사이클 준비). false면 그대로 통과 → `bindEvents`가 click을 위임 처리. |
| `_clampPosition(nextX, nextY)` | 부모 컨테이너의 `getBoundingClientRect()` + FAB의 `offsetWidth/offsetHeight`로 가용 영역 = `[0 .. (containerW - fabW), 0 .. (containerH - fabH)]` 계산. 컨테이너가 FAB보다 작으면 0으로 clamp. 결과 `{x, y}` 반환. |
| `_applyTransform()` | `_fabEl.style.transform = 'translate3d(' + _x + 'px, ' + _y + 'px, 0)'`. |

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('extendedFabInfo', this)──> [ExtendedFABs/draggable] 라벨/아이콘 렌더

[ExtendedFABs/draggable] ──@extendedFabClicked──▶ [페이지]  (짧게 클릭, 5px 미만 이동)
                                                     └─ 일반 액션 실행 (작성 / 결제 추가 / 편집 등)

[ExtendedFABs/draggable] ──@positionChanged {x, y}──▶ [페이지]  (드래그 후 release)
                                                          ├─ 사용자 선호 위치 저장 (localStorage / API)
                                                          ├─ IME 가림 회피 위치 동기화
                                                          └─ 화면 dock 영역 계산

운영: this.pageDataMappings = [
        { topic: 'extendedFabInfo', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@extendedFabClicked': ({ event }) => { /* 일반 액션 */ },
        '@positionChanged':    ({ x, y }) => { /* 위치 저장 */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | dragging 시각 표현 | 도메인 라벨 예 |
|------|---------|-------------------|---------------|
| `01_refined`     | A: Refined Technical | 퍼플 그라디언트 / dragging 시 elevation 상승(box-shadow 강화) + scale 1.04 + cursor: grabbing + 퍼플 글로우 ring | "Add payment" (결제 추가) |
| `02_material`    | B: Material Elevated | 라이트 / dragging 시 surface elevation level 4 → 5 단계 상승 + scale 1.05 + cursor: grabbing | "Compose" (작성) |
| `03_editorial`   | C: Minimal Editorial | 웜 크림 outline / dragging 시 border 두께 1→2px + 약한 grey shadow + cursor: grabbing | "Edit" (편집) |
| `04_operational` | D: Dark Operational  | 다크 시안 outline / dragging 시 시안 border glow 강화 + scale 1.02 + cursor: grabbing | "EXEC" (실행) |

각 페르소나는 페르소나 프로파일(SKILL Step 5-1)을 따르며, draggable의 `data-drag-state="dragging"` 시각이 Standard click 버튼과 명확히 구분되도록 elevation/scale/cursor를 차별화한다.
