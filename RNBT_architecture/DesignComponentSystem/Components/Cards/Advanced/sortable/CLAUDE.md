# Cards — Advanced / sortable

## 기능 정의

1. **카드 그룹 동적 렌더** — `cardsList` 토픽으로 수신한 배열(`[{id, title, summary, icon?, ...}]`)을 ListRenderMixin이 `<template>` cloneNode로 N개의 카드로 렌더한다. 항목별 `data-action-id`로 식별. 항목(카드 루트)에 `draggable="true"`가 template에 고정되어 있어 HTML5 Drag and Drop API가 활성화된다.
2. **HTML5 Drag and Drop으로 순서 재배치** — 드래그 시작(`dragstart`) 시 `dataTransfer.setData('text/plain', actionId)` + `effectAllowed='move'`로 식별자를 전달하고, 드래그 중인 카드에 `data-drag-state="dragging"` 부여. 드래그 over(`dragover`)는 `event.preventDefault()`로 drop을 허용하고 hover 카드에 `data-drag-target="above|below"`를 부여(mouseY < midY → above, else below)하여 insertion line을 시각화. dragleave 시 target dataset 정리. drop 시 새 순서를 계산하여 ListRender의 `renderData`로 재렌더 + `_currentOrder` 갱신 + `@cardReordered` 발행. dragend 시 모든 dragging/dragTarget dataset 정리(드래그 외부에서 release된 경우 cleanup 보장).
3. **재정렬 이벤트 발행** — drop이 인정된 사이클의 끝(fromIndex !== toIndex)에 `@cardReordered` 1회 발행. payload: `{ targetInstance, newOrder: [id1, id2, ...], movedId, fromIndex, toIndex }`. `newOrder`는 새 actionId 배열, `movedId`는 드래그된 카드 id, `fromIndex`/`toIndex`는 변경 전/후 인덱스. 페이지가 자체 데이터 배열에 적용 + 영속화한다.
4. **인스턴스 자체 순서 상태 보관** — `_currentOrder: string[]` / `_currentItems: object[]` 자체 상태로 현재 카드 id 배열과 원본 데이터를 보관. `_renderItems`가 cardsList 페이로드 수신 시 초기화하고, `_handleDrop`이 새 순서로 갱신한다. 같은 batch가 다시 들어오면 새 진실로 재구성(이전 순서 누적 X).
5. **드래그 시각 피드백** — 컴포넌트 자체에서 dataset 채널 두 개 부착: dragging 카드에 `data-drag-state="dragging"`, hover target 카드에 `data-drag-target="above|below"`. CSS는 페르소나별로 dragging 상태(opacity/scale/glow)와 insertion line(target above/below)을 차별화.
6. **카드 클릭 호환** — 드래그가 메인이지만 카드 자체 click도 호환. 카드 루트 클릭 시 `@cardClicked` 발행 (payload: `{ targetInstance, event }`). 페이지는 `event.target.closest('.card-sortable__item')?.dataset.actionId`로 카드 식별. 드래그가 시작된 클릭은 native HTML5 DnD가 자체 처리하므로 click 이벤트는 발생하지 않는다(브라우저 기본 동작) — click vs drag는 native event 분기.

> **Standard와의 분리 정당성**:
> - **새 토픽** — Standard는 `cardInfo`(단일 카드 1개) + `cardActions`(액션 배열). sortable은 `cardsList`(카드 배열 N개) — N:N 패턴으로 ListRender 단일 사용.
> - **자체 상태 (`_currentOrder` / `_currentItems` / `_draggingId`)** — Standard는 stateless. sortable은 순서 진실을 컴포넌트로 흡수.
> - **자체 메서드 7종** — `_renderItems`, `_handleDragStart`, `_handleDragOver`, `_handleDragLeave`, `_handleDrop`, `_handleDragEnd`, `_emitReorder`, `_clearDragState`. Standard는 자체 메서드 0종.
> - **HTML5 DnD 5종 native 리스너** — `dragstart`/`dragover`/`dragleave`/`drop`/`dragend` 컨테이너 위임. Standard는 사용 안함.
> - **새 이벤트** — `@cardReordered`(newOrder + movedId + fromIndex + toIndex 명시 payload). Standard는 `@cardClicked` + `@cardActionClicked`만.
> - **template 변경** — Standard는 단일 카드(card 루트는 컨테이너 바깥). sortable은 카드 자체가 template 안에 있고 `draggable="true"` 고정 + 카드 그룹 컨테이너(`.card-sortable__list`).
> 
> 위 6축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.

> **expandable과의 분리 정당성 (직교성)**:
> - **단위 차이** — expandable은 **단일 카드**의 펼침/접힘(`_isExpanded: boolean`, `cardInfo` 단일 객체, `@cardExpanded`/`@cardCollapsed`). sortable은 **N개 카드 그룹**의 상대 순서 재배치(`_currentOrder: string[]`, `cardsList` 배열, `@cardReordered`).
> - **상호작용 차이** — expandable은 click → 토글(상태머신), sortable은 dragstart/over/drop → 재배치(HTML5 DnD). Native event 자체가 다름.
> - **Mixin 차이** — expandable은 FieldRenderMixin(고정 DOM 1개에 매핑), sortable은 ListRenderMixin(template N개 cloneNode). 데이터 패턴 자체가 다름.
> - **dataset 채널 차이** — expandable은 `data-expanded="true|false"`(단일 boolean), sortable은 `data-drag-state="dragging"` + `data-drag-target="above|below"`(이중 채널). 시각 의미가 다름.
> 
> 그러나 2D Advanced 변형은 단일 컴포넌트 단위로 register.js가 1개. cardsList 다중 카드 처리는 sortable 변형 내부에서만 의미가 있고(Standard / expandable에는 cardsList 토픽이 없음), expandable은 단일 카드 한 개 인스턴스 단위로만 의미가 있음 — 동일 컴포넌트가 두 책임을 한 번에 수행하면 register.js가 이중 충돌(상태/이벤트/Mixin/dataset 중복)을 일으키므로 별 변형으로 분리.

> **SegmentedButtons/draggableReorder와의 차이 (1줄 핵심)**: SegmentedButtons/draggableReorder는 **세그먼트 버튼 항목**(작은 inline button, `@reorderItems`, label + icon)의 순서 재배치, sortable은 **카드 그룹**(큰 카드 컨테이너, `@cardReordered`, title + summary + icon + ...)의 순서 재배치. HTML5 DnD 패턴은 동일 차용하되 카드 항목은 더 큰 컨테이너(MD3 표준 카드 크기). 두 변형은 같은 reorder 의미론이지만 도메인 단위(button vs card)가 다름.

> **MD3 / 도메인 근거**: MD3 Cards는 단일 주제의 콘텐츠와 액션을 담는 컨테이너이며, 카드들이 그룹으로 노출될 때 **사용자가 우선순위/관심도에 따라 순서를 커스터마이즈**하는 시나리오는 자연스럽다. 실사용 예: ① 대시보드 KPI 카드 우선순위(전력 / 매출 / 알람 / 점검 카드 사용자 선호 순서 저장), ② 즐겨찾기 위젯 순서, ③ 작업 큐(Kanban) 항목 우선순위 재정렬(하위는 SortableJS 같은 외부 라이브러리 패턴이 일반화), ④ 추천 카테고리 카드 순서 커스터마이즈. HTML5 Drag and Drop API는 표준이며 키보드/스크린리더 호환은 별도 a11y 변형(향후) — 본 변형은 mouse pointer 기반 reorder의 표준 구현.

---

## 구현 명세

### Mixin

ListRenderMixin (카드 항목 배열 렌더) + 자체 메서드(`_renderItems` / `_handleDragStart` / `_handleDragOver` / `_handleDragLeave` / `_handleDrop` / `_handleDragEnd` / `_emitReorder` / `_clearDragState`).

> Standard는 FieldRender(단일 카드 본문) + ListRender(액션 배열) 조합이지만, 본 변형은 ① 카드 자체가 배열 항목이므로 ListRenderMixin 단일 사용, ② `_currentOrder` / `_currentItems` 자체 상태로 순서 진실 보관, ③ HTML5 DnD 5종 native 리스너(컨테이너 위임)를 직접 부착, ④ drop 시 ListRender의 `renderData`를 재호출하여 새 순서로 재렌더한다. Mixin 메서드 재정의는 하지 않는다(`_renderItems`는 `listRender.renderData` 호출 후 `_currentOrder` 갱신을 한 cycle에 묶는 wrapper). 신규 Mixin 생성은 본 SKILL의 대상이 아님 — 자체 메서드로 완결.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| group     | `.card-sortable`                   | 그룹 컨테이너 — `role="list"` |
| container | `.card-sortable__list`             | 카드가 추가될 부모 (ListRenderMixin 규약) — DnD 위임 부착 대상 |
| template  | `#card-sortable-item-template`     | `<template>` cloneNode 대상 (ListRenderMixin 규약) |
| item      | `.card-sortable__item`             | 렌더된 각 카드 루트 — `draggable="true"` + DnD 이벤트 + `data-drag-state`/`data-drag-target` 부착 + click 이벤트 매핑 |
| actionId  | `.card-sortable__item`             | 카드 식별 (data-action-id) |
| icon      | `.card-sortable__icon`             | 카드 미디어 아이콘 (material symbol textContent, 선택) |
| title     | `.card-sortable__title`            | 카드 제목 텍스트 |
| summary   | `.card-sortable__summary`          | 카드 요약 본문 |
| handle    | `.card-sortable__handle`           | 드래그 핸들 아이콘(시각, 선택). pointer-events: none 권장 — 카드 자체가 draggable이므로 핸들은 시각 신호만. |

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| actionId | `action-id` | 카드 식별 — `event.target.closest(item)?.dataset.actionId`로 actionId 추출. ListRender가 `data-action-id`를 카드에 자동 설정. |

### itemKey

`actionId` (ListRender) — 항목별 상태 변경/조회 활성화는 사용하지 않지만, 일관성을 위해 등록. 향후 `updateItemState`로 개별 카드 강조 등이 필요할 때 활용.

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_currentOrder` | 현재 렌더된 카드 id의 `string[]`. `_renderItems`가 초기화, `_handleDrop`이 갱신. |
| `_currentItems` | 현재 렌더된 카드 데이터 `[{id, title, summary, icon?, ...}]` — drop 시 새 순서로 재렌더하기 위해 보관 (ListRender는 한 번 렌더된 데이터를 노출하지 않으므로 자체 cache). |
| `_draggingId` | 현재 dragstart로 잡힌 카드 id (string \| null). dragstart에서 set, dragend/drop에서 null로 복귀. |
| `_dragStartHandler` / `_dragOverHandler` / `_dragLeaveHandler` / `_dropHandler` / `_dragEndHandler` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener 하기 위해 보관. (5종 모두 컨테이너 위임이며 native event 사이드이펙트는 자체 핸들러가 담당.) |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| `cardsList` | `this._renderItems` (페이로드 `[{ id, title, summary, icon? }]`) — 내부에서 actionId로 키 변환 후 `this.listRender.renderData({ response })` 호출 + `_currentOrder`/`_currentItems` 갱신 |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `item` (ListRender) | 카드 클릭 (드래그가 발생하지 않은 경우만 native click 발생) | `@cardClicked` (bindEvents 위임 발행). 페이로드 `{ targetInstance, event }`. 페이지는 `event.target.closest('.card-sortable__item')?.dataset.actionId`로 카드 식별. |
| `@cardReordered` | — (Weventbus.emit, 직접 발행) | drop 인정된 사이클의 끝에 1회 (단, fromIndex !== toIndex인 경우에만 발행) | `{ targetInstance, newOrder: [id1, ...], movedId, fromIndex, toIndex }` |

> **이벤트 발행 분리 이유**: bindEvents 위임 click은 카드 클릭 호환성용(MD3 카드 표준 상호작용)이며, reorder 이벤트는 drop 사이클에서 자체 native 리스너가 명시 payload(`newOrder` + `movedId` + `fromIndex` + `toIndex`)를 emit한다. 페이지는 두 이벤트 모두 사용 가능 — click은 카드 상세 보기, reorder는 순서 영속화로 직교 책임.

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderItems({ response })` | `cardsList` 핸들러. items 배열을 ListRender selectorKEY(`actionId`/`title`/`summary`/`icon`)에 맞게 매핑(`{id → actionId}`)한 후 `listRender.renderData` 호출. `_currentOrder = items.map(it => String(it.id))`, `_currentItems = items.slice()`로 진실 갱신. |
| `_handleDragStart(e)` | 컨테이너 위임. `e.target.closest(item)`로 시작 카드 찾음. id 없으면 무시. `e.dataTransfer.setData('text/plain', id)` + `effectAllowed='move'`. `_draggingId = id`. 카드에 `dataset.dragState='dragging'`. |
| `_handleDragOver(e)` | 컨테이너 위임. `e.target.closest(item)`로 hover target 찾음. `_draggingId`와 같으면 무시. `e.preventDefault()`로 drop 허용. mouseY < (target.getBoundingClientRect().top + height/2) ? 'above' : 'below'를 dataset.dragTarget에 적용. 다른 형제 카드의 dragTarget은 정리. |
| `_handleDragLeave(e)` | 컨테이너 위임. `e.target.closest(item)`의 dataset.dragTarget 제거(컨테이너 밖으로 leave 시 일괄 정리는 dragend가 담당). |
| `_handleDrop(e)` | 컨테이너 위임. `e.preventDefault()` + `e.stopPropagation()`. `_draggingId` 없으면 무시. drop target 찾고 dragTarget(above/below) 확인. `_currentOrder`에서 movedId의 fromIndex 추출 → 제거 → 새 위치(targetIndex + (above ? 0 : 1), fromIndex 보정 포함) 삽입 → `_currentItems`도 같은 순서로 재정렬 → `listRender.renderData` 재호출(전체 replace). 변경이 있으면(`fromIndex !== toIndex`) `_emitReorder(movedId, fromIndex, toIndex)`. `_clearDragState()`. |
| `_handleDragEnd(e)` | 컨테이너 위임. drop 외부에서 release되거나 ESC로 cancel된 경우 모든 dataset 정리. `_draggingId = null`. |
| `_clearDragState()` | 컨테이너 안 모든 카드 순회 → `dataset.dragState`, `dataset.dragTarget` 제거. `_draggingId = null`. |
| `_emitReorder(movedId, fromIndex, toIndex)` | `Weventbus.emit('@cardReordered', { targetInstance: this, newOrder: [..._currentOrder], movedId, fromIndex, toIndex })`. |

### 페이지 연결 사례

```
[페이지 — 대시보드 KPI 카드 우선순위 / 즐겨찾기 위젯 순서 / 작업 큐 우선순위]
    │
    └─ fetchAndPublish('cardsList', this) 또는 직접 publish
        payload 예: [
          { id: 'energy',    icon: 'bolt',          title: 'Energy',    summary: '실시간 전력 패턴 분석' },
          { id: 'revenue',   icon: 'paid',          title: 'Revenue',   summary: '오늘 매출 +12.4%' },
          { id: 'alerts',    icon: 'notifications', title: 'Alerts',    summary: '활성 알람 3건' },
          { id: 'maintenance', icon: 'build',       title: 'Maintenance', summary: '예정 점검 5/12' }
        ]

[Cards/Advanced/sortable]
    ├─ ListRender가 items 배열을 카드로 렌더 (이전 카드 전체 replace)
    ├─ _renderItems가 _currentOrder = ['energy','revenue','alerts','maintenance'], _currentItems 보관
    └─ 카드의 draggable="true"가 HTML5 DnD 활성화

[사용자가 'alerts'를 첫 번째로 드래그]
    ├─ dragstart → _draggingId='alerts', dataset.dragState='dragging'
    ├─ dragover (over 'energy') → preventDefault, dataset.dragTarget='above' on energy
    ├─ drop (on 'energy', above) → fromIndex=2, toIndex=0
    ├─ _currentOrder = ['alerts','energy','revenue','maintenance']
    ├─ ListRender 재렌더 (새 순서)
    ├─ @cardReordered: { newOrder, movedId='alerts', fromIndex=2, toIndex=0 } 발행
    └─ _clearDragState

[페이지]
    └─ @cardReordered → 자체 데이터 배열 재정렬 + 영속화(localStorage / API)

운영: this.pageDataMappings = [
        { topic: 'cardsList', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@cardReordered': ({ newOrder, movedId, fromIndex, toIndex }) => {
          // newOrder 기준으로 자체 데이터 배열 재정렬 + 저장
        },
        '@cardClicked': ({ event }) => {
          const id = event.target.closest('.card-sortable__item')?.dataset.actionId;
          // 카드 상세 페이지로 이동
        }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | dragging / dragTarget 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|---------------------------------|------------------|
| `01_refined`     | A: Refined Technical | dragging: opacity 0.5 + scale 0.96 + 퍼플 elevated 글로우(box-shadow). dragTarget="above": 카드 상단에 3px 퍼플 indicator line(::before). dragTarget="below": 하단에 동일 라인. | 대시보드 KPI 카드 우선순위(Energy / Revenue / Alerts / Maintenance) |
| `02_material`    | B: Material Elevated | dragging: opacity 0.4 + scale 1.04(살짝 lift) + elevation level 4. dragTarget: 라이트 블루 4px 두꺼운 indicator bar. | 즐겨찾기 위젯 순서 커스터마이즈 |
| `03_editorial`   | C: Minimal Editorial | dragging: opacity 0.5 + outline 2px 갈색 + serif 핸들 강조(`≡`). dragTarget: 1.5px 진한 갈색 dashed line. | 추천 카테고리 카드 순서(읽기 우선순위) |
| `04_operational` | D: Dark Operational  | dragging: opacity 0.45 + 시안 dashed border + 모노스페이스 핸들. dragTarget: 노랑(`#FFB300`) 2px solid + 노랑 글로우 indicator line(운영 임계 강조 컬러). | 알람 카드 우선순위(작업 큐 운영 우선순위) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, `[data-drag-state="dragging"]`, `[data-drag-target="above"]`, `[data-drag-target="below"]` 셀렉터로 시각을 분기. 드래그 transition 150~220ms로 부드럽게.
