# SegmentedButtons — Advanced / draggableReorder

## 기능 정의

1. **세그먼트 항목 동적 렌더** — `segmentInfo` 토픽으로 수신한 배열(`[{id, label, icon?}]`)을 ListRenderMixin이 `<template>` cloneNode로 항목 N개로 렌더한다. 항목별 `data-action-id` 속성으로 식별. 항목에는 `draggable="true"` 속성이 template에 고정되어 있어 HTML5 Drag and Drop API가 활성화된다.
2. **HTML5 Drag and Drop으로 순서 재배치** — 드래그 시작(`dragstart`) 시 `dataTransfer.setData('text/plain', actionId)` + `effectAllowed='move'`로 식별자를 전달하고, 드래그 중인 항목에 `data-drag-state="dragging"` 부여. 드래그 over(`dragover`)는 `event.preventDefault()`로 drop을 허용하고 hover 항목에 `data-drag-target="above|below"`를 부여(mouseY < midY → above, else below)하여 insertion line을 시각화. dragleave 시 target dataset 정리. drop 시 새 순서를 계산하여 ListRender의 `renderData`로 재렌더 + `_currentOrder` 갱신 + `@reorderItems` 발행. dragend 시 모든 dragging/dragTarget dataset 정리(드래그 외부에서 release된 경우 cleanup 보장).
3. **재정렬 이벤트 발행** — drop이 인정된 사이클의 끝에 `@reorderItems` 1회 발행 (payload: `{ targetInstance, newOrder: [id1, id2, ...], movedId, fromIndex, toIndex }`). `newOrder`는 새 actionId 배열, `movedId`는 드래그된 항목 id, `fromIndex`/`toIndex`는 변경 전/후 인덱스. 페이지가 자체 데이터 배열에 적용한다.
4. **인스턴스 자체 순서 상태 보관** — `_currentOrder: string[]` 자체 상태로 현재 항목 id 배열을 보관. `_renderItems`가 segmentInfo 페이로드 수신 시 초기화하고, `_handleDrop`이 새 순서로 갱신한다. 같은 batch가 다시 들어오면 새 진실로 재구성(이전 순서 누적 X).
5. **드래그 시각 피드백** — 컴포넌트 자체에서 dataset 채널 두 개 부착: dragging 항목에 `data-drag-state="dragging"`, hover target 항목에 `data-drag-target="above|below"`. CSS는 페르소나별로 dragging 상태(opacity/scale/glow)와 insertion line(target above/below)을 차별화.

> **Standard와의 분리 정당성**: Standard는 ① 토픽 `segmentedButtonItems` 단방향 렌더 + ② 이벤트 `@segmentClicked`(단순 클릭 릴레이)만 존재 — 항목 순서는 페이지가 페이로드 배열을 정렬하여 publish할 책임. draggableReorder는 ① 새 토픽 `segmentInfo`(MD3 통합 페이로드 `{id, label, icon?}`) + 항목 template에 `draggable="true"` 고정, ② **순서 정책을 컴포넌트로 흡수** — `_currentOrder` 자체 상태가 현재 순서 진실, ③ HTML5 DnD 4종 native 리스너(`dragstart`/`dragover`/`dragleave`/`drop`/`dragend`) + 자체 메서드 `_renderItems`/`_handleDragStart`/`_handleDragOver`/`_handleDragLeave`/`_handleDrop`/`_handleDragEnd`/`_emitReorder`/`_clearDragState`, ④ 새 이벤트 `@reorderItems`(payload `{newOrder, movedId, fromIndex, toIndex}`) — 단순 클릭 릴레이가 아니라 "새 순서 + 단일 이동 추적"을 함께 전달, ⑤ data-drag-state/data-drag-target 이중 dataset 시각 채널. 다섯 축 모두 Standard register.js와 직교 — 같은 register.js로 표현 불가, 페이지가 매번 순서를 재발행해야 하는 부담을 컴포넌트가 흡수.

> **multiSelect와의 분리 정당성 (직교성 1줄)**: multiSelect는 **선택 의미론**(체크박스, `_selectedIds: Set`, click → 토글, `data-selected`/`aria-pressed` 채널, `@segmentMultiSelected`), draggableReorder는 **순서 의미론**(드래그, `_currentOrder: string[]`, dragstart/over/drop → 재배치, `data-drag-state`/`data-drag-target` 채널, `@reorderItems`). 두 변형은 **서로 다른 도메인 책임** — multiSelect는 *어떤 항목이 활성인가*, draggableReorder는 *항목들이 어떤 순서인가*. 동일 컴포넌트가 두 책임을 한 번에 수행할 수도 있으나 register.js가 이중 충돌(드래그 vs 클릭 토글, Set 상태 vs 배열 상태, 두 이벤트 동시 발행)을 일으키므로 별 변형으로 분리한다. 본 변형은 click 핸들링을 의도적으로 무시(드래그가 메인) — 단, customEvents의 `@segmentClicked`는 호환성 유지로 남겨 둠(click이 필요한 페이지는 본 변형 대신 Standard/multiSelect를 선택).

> **ExtendedFABs/draggable과의 차이 (1줄 핵심)**: ExtendedFABs/draggable은 **단일 요소의 절대 좌표 이동**(pointer 4종 + `transform: translate3d`, `_x/_y/_isDraggingDetected` 자체 상태, `@positionChanged`), draggableReorder는 **N개 항목의 상대 순서 재배치**(HTML5 DnD 4종 + ListRender re-render, `_currentOrder: string[]` 자체 상태, `@reorderItems`). 패턴 차이: pointer + transform vs HTML5 DnD + ListRender 재호출. ExtendedFABs는 위치 관성을 컴포넌트가 보유하지만, draggableReorder는 데이터 배열의 순서를 페이지에 위임(드래그 결과는 항상 `@reorderItems` 발행).

> **MD3 / 도메인 근거**: MD3 SegmentedButtons는 본래 정렬·필터 옵션 선택을 다루므로, "옵션 자체의 우선순위 / 표시 순서를 사용자가 커스터마이즈"하는 변형은 자연스럽다. 실사용 예: ① 정렬 우선순위(latest / popular / featured 중 사용자 선호 순서 저장), ② 운영 화면 위젯 순서(상단 KPI 카드 순서 커스터마이즈), ③ 알람 채널 우선순위(SMS / Push / Email 중 우선순위 명시), ④ 표시 순서 커스터마이즈(필터 칩, 즐겨찾기 탭 순서). HTML5 Drag and Drop API는 표준이며 키보드/스크린리더 호환은 별도 a11y 변형(향후) — 본 변형은 mouse pointer 기반 reorder의 표준 구현.

---

## 구현 명세

### Mixin

ListRenderMixin (세그먼트 항목 배열 렌더) + 자체 메서드(`_renderItems` / `_handleDragStart` / `_handleDragOver` / `_handleDragLeave` / `_handleDrop` / `_handleDragEnd` / `_emitReorder` / `_clearDragState`).

> Standard / multiSelect도 ListRenderMixin을 사용하지만, 본 변형은 ① `_currentOrder` 자체 상태로 순서 진실을 보관, ② HTML5 DnD 4종 native 리스너(컨테이너 위임)를 직접 부착, ③ drop 시 ListRender의 `renderData`를 재호출하여 새 순서로 재렌더한다. Mixin 메서드 재정의는 하지 않는다(`_renderItems`는 `listRender.renderData` 호출 후 `_currentOrder` 갱신을 한 cycle에 묶는 wrapper). 신규 Mixin 생성은 본 SKILL의 대상이 아님 — 자체 메서드로 완결.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| group     | `.segmented-button-reorder`              | 그룹 컨테이너 — `role="group"` |
| container | `.segmented-button-reorder__list`        | 항목이 추가될 부모 (ListRenderMixin 규약) — DnD 위임 부착 대상 |
| template  | `#segmented-button-reorder-item-template`| `<template>` cloneNode 대상 (ListRenderMixin 규약) |
| item      | `.segmented-button-reorder__item`        | 렌더된 각 segment 루트 — `draggable="true"` + DnD 이벤트 + `data-drag-state`/`data-drag-target` 부착 |
| actionId  | `.segmented-button-reorder__item`        | 항목 식별 (data-action-id) |
| icon      | `.segmented-button-reorder__icon`        | 아이콘 (material symbol textContent, 선택) |
| label     | `.segmented-button-reorder__label`       | 라벨 텍스트 |
| handle    | `.segmented-button-reorder__handle`      | 드래그 핸들 아이콘(시각, 선택). pointer-events: none 권장 — 항목 자체가 draggable이므로 핸들은 시각 신호만. |

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| actionId | `action-id` | 항목 식별 — `event.target.closest(item)?.dataset.actionId`로 actionId 추출. ListRender가 `data-action-id`를 항목에 자동 설정. |

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_currentOrder` | 현재 렌더된 항목 id의 `string[]`. `_renderItems`가 초기화, `_handleDrop`이 갱신. |
| `_currentItems` | 현재 렌더된 항목 데이터 `[{id, label, icon}]` — drop 시 새 순서로 재렌더하기 위해 보관 (ListRender는 한 번 렌더된 데이터를 노출하지 않으므로 자체 cache). |
| `_draggingId` | 현재 dragstart로 잡힌 항목 id (string \| null). dragstart에서 set, dragend/drop에서 null로 복귀. |
| `_dragStartHandler` / `_dragOverHandler` / `_dragLeaveHandler` / `_dropHandler` / `_dragEndHandler` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener 하기 위해 보관. (5종 모두 컨테이너 위임이며 native event 사이드이펙트는 자체 핸들러가 담당.) |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| `segmentInfo` | `this._renderItems` (페이로드 `[{ id, label, icon? }]`) — 내부에서 actionId로 키 변환 후 `this.listRender.renderData({ response })` 호출 + `_currentOrder`/`_currentItems` 갱신 |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `item` (ListRender) | 항목 클릭 | `@segmentClicked` (bindEvents 위임 발행 — 호환성 유지). 페이로드 `{ targetInstance, event }`. **본 변형의 메인은 reorder이므로 페이지는 일반적으로 click을 무시**한다. 그래도 customEvents에 등록하는 이유는 SegmentedButtons 범주의 click 호환성을 유지하여, 페이지가 click이 필요하면 본 변형 대신 Standard/multiSelect를 선택하도록 명시적 분기를 강제하기 위함. |
| `@reorderItems` | — (Weventbus.emit, 직접 발행) | drop 인정된 사이클의 끝에 1회 (단, fromIndex !== toIndex인 경우에만 발행) | `{ targetInstance, newOrder: [id1, ...], movedId, fromIndex, toIndex }` |

> **이벤트 발행 분리 이유**: bindEvents 위임 click은 SegmentedButtons 범주 호환성용이며, reorder 이벤트는 drop 사이클에서 자체 native 리스너가 명시 payload(`newOrder` + `movedId` + `fromIndex` + `toIndex`)를 emit한다. 페이지는 두 이벤트 중 `@reorderItems`만 사용하면 되며, click은 본 변형에서 의도적 무관심(중요 액션은 다른 변형 선택).

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderItems({ response })` | `segmentInfo` 핸들러. items 배열을 ListRender selectorKEY(`actionId`)에 맞게 매핑(`{id → actionId}`)한 후 `listRender.renderData` 호출. `_currentOrder = items.map(it => String(it.id))`, `_currentItems = items.slice()`로 진실 갱신. |
| `_handleDragStart(e)` | 컨테이너 위임. `e.target.closest(item)`로 시작 항목 찾음. id 없으면 무시. `e.dataTransfer.setData('text/plain', id)` + `effectAllowed='move'`. `_draggingId = id`. 항목에 `dataset.dragState='dragging'`. |
| `_handleDragOver(e)` | 컨테이너 위임. `e.target.closest(item)`로 hover target 찾음. `_draggingId`와 같으면 무시. `e.preventDefault()`로 drop 허용. mouseY < (target.getBoundingClientRect().top + height/2) ? 'above' : 'below'를 dataset.dragTarget에 적용. 다른 형제 항목의 dragTarget은 정리. |
| `_handleDragLeave(e)` | 컨테이너 위임. `e.target.closest(item)`의 dataset.dragTarget 제거(컨테이너 밖으로 leave 시 일괄 정리는 dragend가 담당). |
| `_handleDrop(e)` | 컨테이너 위임. `e.preventDefault()` + `e.stopPropagation()`. `_draggingId` 없으면 무시. drop target 찾고 dragTarget(above/below) 확인. `_currentOrder`에서 movedId의 fromIndex 추출 → 제거 → 새 위치(targetIndex + (above ? 0 : 1), fromIndex 보정 포함) 삽입 → `_currentItems`도 같은 순서로 재정렬 → `_renderItems({ response: _currentItems })` 재렌더(ListRender 전체 replace). 변경이 있으면(`fromIndex !== toIndex`) `_emitReorder(movedId, fromIndex, toIndex)`. `_clearDragState()`. |
| `_handleDragEnd(e)` | 컨테이너 위임. drop 외부에서 release되거나 ESC로 cancel된 경우 모든 dataset 정리. `_draggingId = null`. |
| `_clearDragState()` | 컨테이너 안 모든 항목 순회 → `dataset.dragState`, `dataset.dragTarget` 제거. `_draggingId = null`. |
| `_emitReorder(movedId, fromIndex, toIndex)` | `Weventbus.emit('@reorderItems', { targetInstance: this, newOrder: [..._currentOrder], movedId, fromIndex, toIndex })`. |

### 페이지 연결 사례

```
[페이지 — 정렬 우선순위 커스터마이즈 / 위젯 순서 / 알람 채널 우선순위]
    │
    └─ fetchAndPublish('segmentInfo', this) 또는 직접 publish
        payload 예: [
          { id: 'sms',   icon: 'sms',           label: 'SMS' },
          { id: 'push',  icon: 'notifications', label: 'Push' },
          { id: 'email', icon: 'mail',          label: 'Email' },
          { id: 'slack', icon: 'forum',         label: 'Slack' }
        ]

[SegmentedButtons/Advanced/draggableReorder]
    ├─ ListRender가 items 배열을 항목으로 렌더 (이전 항목 전체 replace)
    ├─ _renderItems가 _currentOrder = ['sms','push','email','slack'], _currentItems 보관
    └─ 항목의 draggable="true"가 HTML5 DnD 활성화

[사용자가 'email'을 첫 번째로 드래그]
    ├─ dragstart → _draggingId='email', dataset.dragState='dragging'
    ├─ dragover (over 'sms') → preventDefault, dataset.dragTarget='above' on sms
    ├─ drop (on 'sms', above) → fromIndex=2, toIndex=0
    ├─ _currentOrder = ['email','sms','push','slack']
    ├─ ListRender 재렌더 (새 순서)
    ├─ @reorderItems: { newOrder, movedId='email', fromIndex=2, toIndex=0 } 발행
    └─ _clearDragState

[페이지]
    └─ @reorderItems → 자체 데이터 배열 재정렬 + 영속화(localStorage / API)

운영: this.pageDataMappings = [
        { topic: 'segmentInfo', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@reorderItems': ({ newOrder, movedId, fromIndex, toIndex }) => {
          // newOrder 기준으로 자체 데이터 배열 재정렬 + 저장
        }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | dragging / dragTarget 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|---------------------------------|------------------|
| `01_refined`     | A: Refined Technical | dragging: opacity 0.5 + scale 0.96 + 퍼플 elevated 글로우(box-shadow). dragTarget="above": 항목 상단에 2px 퍼플 indicator line(box-shadow 또는 ::before). dragTarget="below": 하단에 동일 라인. | 정렬 우선순위(latest / popular / featured 순서 저장) |
| `02_material`    | B: Material Elevated | dragging: opacity 0.4 + scale 1.04(살짝 lift) + elevation level 4. dragTarget: 라이트 블루 4px 두꺼운 indicator bar. | 운영 화면 위젯 순서 커스터마이즈(KPI 카드 우선순위) |
| `03_editorial`   | C: Minimal Editorial | dragging: opacity 0.5 + outline 2px + serif 핸들 강조(`⠿` 또는 `≡`). dragTarget: 1px 진한 갈색 dashed line. | 표시 순서 커스터마이즈(즐겨찾기 탭 순서) |
| `04_operational` | D: Dark Operational  | dragging: opacity 0.45 + 시안 dashed border + 모노스페이스 핸들. dragTarget: 노랑(`#FFB300`) 1px solid + 노랑 글로우 indicator line(운영 임계 강조 컬러). | 알람 채널 우선순위(SMS / Push / Email / Slack 운영 우선순위) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, `[data-drag-state="dragging"]`, `[data-drag-target="above"]`, `[data-drag-target="below"]` 셀렉터로 시각을 분기. 드래그 transition 150~200ms로 부드럽게.
