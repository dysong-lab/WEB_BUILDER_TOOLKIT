# Lists — Advanced / draggableReorder

## 기능 정의

1. **리스트 항목 동적 렌더** — `listItems` 토픽으로 수신한 배열(`[{itemid, leading?, headline, supporting?}]`)을 ListRenderMixin이 `<template>` cloneNode로 N개의 항목으로 렌더한다. 항목별 `data-itemid`로 식별. 항목(리스트 row)에 `draggable="true"`가 template에 고정되어 있어 HTML5 Drag and Drop API가 활성화된다. Standard와 cssSelectors 호환(itemid/leading/headline/supporting).
2. **HTML5 Drag and Drop으로 항목 순서 재배치** — 드래그 시작(`dragstart`) 시 `dataTransfer.setData('text/plain', itemid)` + `effectAllowed='move'`로 식별자를 전달하고, 드래그 중인 항목에 `data-drag-state="dragging"` 부여. 드래그 over(`dragover`)는 `event.preventDefault()`로 drop을 허용하고 hover 항목에 `data-drag-target="above|below"`를 부여(mouseY < midY → above, else below)하여 insertion line을 시각화. dragleave 시 target dataset 정리. drop 시 새 순서를 계산하여 ListRender의 `renderData`로 재렌더 + `_currentOrder` 갱신 + `@itemReordered` 발행. dragend 시 모든 dragging/dragTarget dataset 정리(드래그 외부에서 release된 경우 cleanup 보장).
3. **재정렬 이벤트 발행** — drop이 인정된 사이클의 끝(fromIndex !== toIndex)에 `@itemReordered` 1회 발행. payload: `{ targetInstance, fromIndex, toIndex, itemId, allItemIds: [id1, id2, ...] }`. `allItemIds`는 새 itemid 배열(전체 순서), `itemId`는 드래그된 항목 id, `fromIndex`/`toIndex`는 변경 전/후 인덱스. 페이지가 자체 데이터 배열에 적용 + 영속화한다.
4. **인스턴스 자체 순서 상태 보관** — `_currentOrder: string[]` / `_currentItems: object[]` 자체 상태로 현재 항목 id 배열과 원본 데이터를 보관. `_renderItems`가 `listItems` 페이로드 수신 시 초기화하고, `_handleDrop`이 새 순서로 갱신한다. 같은 batch가 다시 들어오면 새 진실로 재구성(이전 순서 누적 X). 추가로 `setItemOrder` 토픽(선택)이 들어오면 외부에서 강제한 순서로 `_currentItems`를 재정렬 후 ListRender 재렌더(영속화된 정렬 복원 시나리오).
5. **드래그 시각 피드백** — 컴포넌트 자체에서 dataset 채널 두 개 부착: dragging 항목에 `data-drag-state="dragging"`, hover target 항목에 `data-drag-target="above|below"`. CSS는 페르소나별로 dragging 상태(opacity/scale/glow)와 insertion line(target above/below)을 차별화. 드래그 핸들(`drag_indicator` material symbol) 영역은 `pointer-events: none`으로 시각 신호만 — 항목 자체가 draggable이므로 핸들 클릭/드래그가 별도 분기되지 않는다.
6. **항목 클릭 호환 (Standard와 동일 이벤트)** — 드래그가 메인이지만 항목 자체 click도 호환. 항목 클릭 시 Standard와 동일한 `@listItemClicked` 발행 (payload: `{ targetInstance, event }`). 페이지는 `event.target.closest('.list-reorder__item')?.dataset.itemid`로 항목 식별. 드래그가 시작된 클릭은 native HTML5 DnD가 자체 처리하므로 click 이벤트는 발생하지 않는다(브라우저 기본 동작) — click vs drag는 native event 분기.

> **Standard와의 분리 정당성**:
> - **자체 상태 (`_currentOrder` / `_currentItems` / `_draggingId`)** — Standard는 stateless. draggableReorder는 순서 진실을 컴포넌트로 흡수.
> - **자체 메서드 7종** — `_renderItems`, `_handleDragStart`, `_handleDragOver`, `_handleDragLeave`, `_handleDrop`, `_handleDragEnd`, `_emitReorder`, `_clearDragState`, `_setItemOrder`. Standard는 자체 메서드 0종 (Mixin 메서드를 직접 구독에 연결).
> - **HTML5 DnD 5종 native 리스너** — `dragstart`/`dragover`/`dragleave`/`drop`/`dragend` 컨테이너 위임. Standard는 사용 안함.
> - **새 이벤트** — `@itemReordered`(allItemIds + itemId + fromIndex + toIndex 명시 payload). Standard는 `@listItemClicked`만.
> - **추가 토픽** — `setItemOrder`(외부 영속화 복원). Standard는 `listItems` 1종.
> - **template 변경** — Standard 항목은 `<div class="list__item" data-itemid="">`. draggableReorder는 `<div class="list-reorder__item" draggable="true" data-itemid="">`로 draggable 속성 + drag handle 영역을 추가. cssSelectors 클래스명도 `list-reorder__*`로 분리(Standard `list__*`와 충돌 방지).
>
> 위 6축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.

> **virtualScroll과의 직교성 (1줄 핵심)**: virtualScroll은 viewport 외 항목을 DOM에서 제외하는 **렌더링 전략**(scroll/rAF/spacer 3층 구조), draggableReorder는 항목 **순서 재배치**(HTML5 DnD 5종 + ListRender 재호출). 셋(virtualScroll/draggableReorder/swipeToDelete)은 동일 `listItems` 데이터 모델을 공유하지만 책임이 직교 — 동일 컴포넌트가 둘 이상을 동시에 수행하면 register.js가 다중 충돌(scroll + DnD listener 경합, virtual renderWindow vs reorder DOM mutation)을 일으키므로 별 변형으로 분리.

> **Cards/Advanced/sortable과 SegmentedButtons/Advanced/draggableReorder와의 차이 (1줄 핵심)**: 같은 reorder 의미론이지만 **도메인 단위가 다름** — Cards/sortable은 *큰 카드 컨테이너*(title + summary + icon, `cardsList` 토픽, `@cardReordered`), SegmentedButtons는 *작은 inline 세그먼트*(label + icon, `segmentInfo`, `@reorderItems`), Lists/draggableReorder는 *수직 리스트 row*(leading + headline + supporting, `listItems`, `@itemReordered`). HTML5 DnD 패턴은 동일 차용. cssSelectors 계약은 Lists/Standard 호환(itemid/leading/headline/supporting).

> **MD3 / 도메인 근거**: MD3 Lists는 텍스트와 이미지의 연속적인 수직 인덱스이며, 사용자가 항목을 직접 드래그하여 우선순위/표시 순서를 커스터마이즈하는 패턴은 모바일/데스크탑 전반에서 표준화된 상호작용이다 — iOS Reminders·Notes의 항목 reorder, Android 알람 우선순위, Trello 카드(리스트 형식)의 카드 reorder, Notion 블록 reorder 등. 실사용 시나리오: ① **할 일(Todo) 우선순위 재정렬** (사용자가 원하는 순서로 작업 큐 정렬), ② **재생목록 순서 변경** (음악/비디오 큐 재배치), ③ **체크리스트 단계 재배치** (조립/요리 단계 등 절차 순서 사용자 정의), ④ **즐겨찾기 항목 정렬** (북마크/즐겨찾기 메뉴 사용자 선호 순서). HTML5 Drag and Drop API는 표준이며 키보드/스크린리더 호환은 별도 a11y 변형(향후) — 본 변형은 mouse pointer 기반 reorder의 표준 구현.

---

## 구현 명세

### Mixin

ListRenderMixin (리스트 항목 배열 렌더) + 자체 메서드(`_renderItems` / `_setItemOrder` / `_handleDragStart` / `_handleDragOver` / `_handleDragLeave` / `_handleDrop` / `_handleDragEnd` / `_emitReorder` / `_clearDragState`).

> Standard도 ListRenderMixin을 사용하지만, 본 변형은 ① `_currentOrder` / `_currentItems` 자체 상태로 순서 진실 보관, ② HTML5 DnD 5종 native 리스너(컨테이너 위임)를 직접 부착, ③ drop 시 ListRender의 `renderData`를 재호출하여 새 순서로 재렌더한다. Mixin 메서드 재정의는 하지 않는다(`_renderItems`는 `listRender.renderData` 호출 후 `_currentOrder` 갱신을 한 cycle에 묶는 wrapper). 신규 Mixin 생성은 본 SKILL의 대상이 아님 — 자체 메서드로 완결.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| group      | `.list-reorder`                  | 그룹 컨테이너 — `role="list"` |
| container  | `.list-reorder__items`           | 항목이 추가될 부모 (ListRenderMixin 규약) — DnD 위임 부착 대상 |
| template   | `#list-reorder-item-template`    | `<template>` cloneNode 대상 (ListRenderMixin 규약) |
| itemid     | `.list-reorder__item`            | 렌더된 각 row 루트 — `draggable="true"` + DnD 이벤트 + `data-drag-state`/`data-drag-target` 부착 + click 이벤트 매핑 |
| handle     | `.list-reorder__handle`          | 드래그 핸들 아이콘(시각, material symbol `drag_indicator`). pointer-events: none 권장 — 항목 자체가 draggable이므로 핸들은 시각 신호만. |
| leading    | `.list-reorder__leading`         | 선행 요소 (아이콘/이모지 textContent, 선택) — Standard 호환 KEY |
| headline   | `.list-reorder__headline`        | 헤드라인 텍스트 — Standard 호환 KEY |
| supporting | `.list-reorder__supporting`      | 보조 텍스트 — Standard 호환 KEY |

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| itemid | `itemid` | 항목 식별 — `event.target.closest(itemid)?.dataset.itemid`로 itemid 추출. ListRender가 `data-itemid`를 항목에 자동 설정. Standard와 동일 KEY. |

### itemKey

`itemid` (ListRender) — 향후 개별 항목 강조/상태 변경(`updateItemState`)이 필요할 때 활용. 본 변형은 사용하지 않지만 일관성/확장성을 위해 등록.

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_currentOrder` | 현재 렌더된 항목 id의 `string[]`. `_renderItems`가 초기화, `_handleDrop`이 갱신, `_setItemOrder`가 외부 강제. |
| `_currentItems` | 현재 렌더된 항목 데이터 `[{itemid, leading?, headline, supporting?, ...}]` — drop 시 새 순서로 재렌더하기 위해 보관 (ListRender는 한 번 렌더된 데이터를 노출하지 않으므로 자체 cache). |
| `_draggingId` | 현재 dragstart로 잡힌 항목 id (string \| null). dragstart에서 set, dragend/drop에서 null로 복귀. |
| `_dragStartHandler` / `_dragOverHandler` / `_dragLeaveHandler` / `_dropHandler` / `_dragEndHandler` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener 하기 위해 보관. (5종 모두 컨테이너 위임이며 native event 사이드이펙트는 자체 핸들러가 담당.) |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `listItems` | `this._renderItems` | `[{ itemid, leading?, headline, supporting? }]` — Standard 호환 |
| `setItemOrder` | `this._setItemOrder` | `string[]` — 영속화된 itemid 순서. 외부에서 받아 `_currentItems`를 그 순서로 재정렬 + 재렌더. 페이지가 localStorage/API에서 복원한 순서를 본 토픽으로 publish. |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `itemid` (ListRender) | 항목 클릭 (드래그가 발생하지 않은 경우만 native click 발생) | `@listItemClicked` (bindEvents 위임 발행 — Standard 호환). 페이로드 `{ targetInstance, event }`. |
| `@itemReordered` | — (Weventbus.emit, 직접 발행) | drop 인정된 사이클의 끝에 1회 (단, fromIndex !== toIndex인 경우에만 발행) | `{ targetInstance, fromIndex, toIndex, itemId, allItemIds: [id1, ...] }` |

> **이벤트 발행 분리 이유**: bindEvents 위임 click은 Standard 호환용(MD3 List 표준 상호작용)이며, reorder 이벤트는 drop 사이클에서 자체 native 리스너가 명시 payload(`fromIndex` + `toIndex` + `itemId` + `allItemIds`)를 emit한다. 페이지는 두 이벤트 모두 사용 가능 — click은 항목 상세 보기, reorder는 순서 영속화로 직교 책임.

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderItems({ response })` | `listItems` 핸들러. items 배열을 ListRender selectorKEY(`itemid`/`leading`/`headline`/`supporting`)에 맞게 그대로 전달(Standard 호환 키). `listRender.renderData` 호출. `_currentOrder = items.map(it => String(it.itemid))`, `_currentItems = items.slice()`로 진실 갱신. `_draggingId = null`. |
| `_setItemOrder({ response })` | `setItemOrder` 핸들러. response가 `string[]`이면 `_currentItems`를 해당 순서로 재정렬(Map 기반 lookup, 누락 id는 제거) → `listRender.renderData` 재호출 → `_currentOrder` 갱신. `_draggingId = null`. 변경 시 `@itemReordered`는 발행하지 않음(외부 명시 적용이므로). |
| `_handleDragStart(e)` | 컨테이너 위임. `e.target.closest(itemid)`로 시작 항목 찾음. id 없으면 무시. `e.dataTransfer.setData('text/plain', id)` + `effectAllowed='move'`. `_draggingId = id`. 항목에 `dataset.dragState='dragging'`. |
| `_handleDragOver(e)` | 컨테이너 위임. `e.target.closest(itemid)`로 hover target 찾음. `_draggingId`와 같으면 무시. `e.preventDefault()`로 drop 허용. mouseY < (target.getBoundingClientRect().top + height/2) ? 'above' : 'below'를 dataset.dragTarget에 적용. 다른 형제 항목의 dragTarget은 정리. |
| `_handleDragLeave(e)` | 컨테이너 위임. `e.target.closest(itemid)`의 dataset.dragTarget 제거(컨테이너 밖으로 leave 시 일괄 정리는 dragend가 담당). |
| `_handleDrop(e)` | 컨테이너 위임. `e.preventDefault()` + `e.stopPropagation()`. `_draggingId` 없으면 무시. drop target 찾고 dragTarget(above/below) 확인. `_currentOrder`에서 itemId의 fromIndex 추출 → 제거 → 새 위치(targetIndex + (above ? 0 : 1), fromIndex 보정 포함) 삽입 → `_currentItems`도 같은 순서로 재정렬 → `listRender.renderData` 재호출(전체 replace). 변경이 있으면(`fromIndex !== toIndex`) `_emitReorder(itemId, fromIndex, toIndex)`. `_clearDragState()`. |
| `_handleDragEnd(e)` | 컨테이너 위임. drop 외부에서 release되거나 ESC로 cancel된 경우 모든 dataset 정리. `_draggingId = null`. |
| `_clearDragState()` | 컨테이너 안 모든 항목 순회 → `dataset.dragState`, `dataset.dragTarget` 제거. `_draggingId = null`. |
| `_emitReorder(itemId, fromIndex, toIndex)` | `Weventbus.emit('@itemReordered', { targetInstance: this, fromIndex, toIndex, itemId, allItemIds: [..._currentOrder] })`. |

### 페이지 연결 사례

```
[페이지 — 할 일 우선순위 / 재생목록 / 체크리스트 / 즐겨찾기]
    │
    └─ fetchAndPublish('listItems', this) 또는 직접 publish
        payload 예: [
          { itemid: 'task-1', leading: '✅', headline: '디자인 리뷰',     supporting: '오늘 14:00 — 디자인팀' },
          { itemid: 'task-2', leading: '📝', headline: '주간 보고서 작성', supporting: '내일 마감' },
          { itemid: 'task-3', leading: '🐛', headline: '버그 #1247 수정', supporting: 'Critical — 운영 영향' },
          { itemid: 'task-4', leading: '🚀', headline: '배포 점검 회의',   supporting: '모레 10:00' }
        ]

[Lists/Advanced/draggableReorder]
    ├─ ListRender가 items 배열을 row로 렌더 (이전 항목 전체 replace)
    ├─ _renderItems가 _currentOrder = ['task-1','task-2','task-3','task-4'], _currentItems 보관
    └─ 항목의 draggable="true"가 HTML5 DnD 활성화

[사용자가 'task-3'(버그 수정)을 첫 번째로 드래그]
    ├─ dragstart → _draggingId='task-3', dataset.dragState='dragging'
    ├─ dragover (over 'task-1') → preventDefault, dataset.dragTarget='above' on task-1
    ├─ drop (on 'task-1', above) → fromIndex=2, toIndex=0
    ├─ _currentOrder = ['task-3','task-1','task-2','task-4']
    ├─ ListRender 재렌더 (새 순서)
    ├─ @itemReordered: { fromIndex:2, toIndex:0, itemId:'task-3', allItemIds:['task-3','task-1','task-2','task-4'] } 발행
    └─ _clearDragState

[페이지]
    └─ @itemReordered → 자체 데이터 배열 재정렬 + 영속화(localStorage / API)
       (선택) 다음 세션에 setItemOrder publish로 복원

운영: this.pageDataMappings = [
        { topic: 'listItems', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@itemReordered': ({ allItemIds, itemId, fromIndex, toIndex }) => {
          // allItemIds 기준으로 자체 데이터 배열 재정렬 + 저장
          localStorage.setItem('todoOrder', JSON.stringify(allItemIds));
        },
        '@listItemClicked': ({ event }) => {
          const id = event.target.closest('.list-reorder__item')?.dataset.itemid;
          // 항목 상세 페이지로 이동
        }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | dragging / dragTarget 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|---------------------------------|------------------|
| `01_refined`     | A: Refined Technical | dragging: opacity 0.5 + scale 0.97 + 퍼플 elevated 글로우(box-shadow). dragTarget="above": row 상단에 3px 퍼플 indicator line(::before). dragTarget="below": 하단에 동일 라인. | **할 일 우선순위 재정렬** (디자인 리뷰 / 주간 보고서 / 버그 수정 / 배포 점검) |
| `02_material`    | B: Material Elevated | dragging: opacity 0.4 + scale 1.02(살짝 lift) + elevation level 4. dragTarget: 라이트 블루 4px 두꺼운 indicator bar. | **재생목록 순서 변경** (음악/비디오 큐 재배치) |
| `03_editorial`   | C: Minimal Editorial | dragging: opacity 0.5 + outline 1.5px 갈색 + serif 핸들 강조(`≡`). dragTarget: 1px 진한 갈색 dashed line. | **체크리스트 단계 재배치** (조리/조립 절차 순서 커스터마이즈) |
| `04_operational` | D: Dark Operational  | dragging: opacity 0.45 + 시안 dashed border + 모노스페이스 핸들. dragTarget: 노랑(`#FFB300`) 1.5px solid + 노랑 글로우 indicator line(운영 임계 강조 컬러). | **알람 큐 우선순위** (운영 알람 처리 순서 — Critical → Warning → Info) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, `[data-drag-state="dragging"]`, `[data-drag-target="above"]`, `[data-drag-target="below"]` 셀렉터로 시각을 분기. 드래그 transition 150~200ms로 부드럽게.

### 결정사항

- **Standard cssSelectors KEY 호환**: `itemid`/`leading`/`headline`/`supporting`은 Standard와 동일 KEY명. 클래스명만 `list-reorder__*`로 분리(`list__*`와 충돌 방지). 이로써 페이로드 형태(`{itemid, leading, headline, supporting}`)가 Standard와 호환되어 페이지가 동일한 `listItems` 토픽 데이터를 양쪽에 publish 가능.
- **draggable handle은 시각 신호만**: `.list-reorder__handle` 영역은 `pointer-events: none` — 항목 row 자체가 `draggable="true"`이므로 핸들 영역에서만 dragstart가 발생하는 분기는 사용하지 않는다. 핸들은 사용자에게 "여기를 잡고 드래그"라는 어포던스만 제공.
- **신규 Mixin 생성 금지**: 큐의 변형 설명에 따라 ListRenderMixin + 자체 메서드 조합으로 완결. drag reorder 패턴(Cards/sortable, SegmentedButtons/draggableReorder, Lists/draggableReorder)이 3회 반복된 시점에 일반화 가능성 검토 후보(반환에 메모만 — SKILL 회귀 규율).
- **`setItemOrder` 토픽**: 영속화된 정렬을 외부에서 복원하는 시나리오를 위한 선택 토픽. 페이지가 localStorage/API에서 읽은 itemid 순서 배열을 publish하면 컴포넌트가 그 순서로 재렌더. 기존 두 reorder 변형(Cards/sortable, SegmentedButtons/draggableReorder)에는 없던 추가 기능 — Lists 도메인이 가장 영속화 빈도가 높은 변형(할 일/재생목록/즐겨찾기 모두 영속 정렬 표준)이라는 도메인 차이 반영.
