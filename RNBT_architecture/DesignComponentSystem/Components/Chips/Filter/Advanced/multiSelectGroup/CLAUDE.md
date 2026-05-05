# Filter — Advanced / multiSelectGroup

## 기능 정의

1. **그룹 + 칩 2단 렌더링** — `filterChipGroups` 토픽으로 수신한 그룹 배열(`[{groupId, groupLabel, items: [{chipid, label, selected?}]}]`)을 ListRenderMixin이 `<template>` cloneNode로 그룹 N개로 렌더한다. 각 그룹 cloneNode 안에는 그룹 라벨 헤더 + 빈 칩 리스트 컨테이너 + 칩 항목 `<template>`이 있고, 자체 메서드 `_renderChipsInGroup`이 각 그룹의 칩 리스트를 group 페이로드의 `items`로 cloneNode 반복 렌더한다. 즉 ListRender는 **그룹 단위 렌더만** 담당하고, **칩 항목 렌더는 자체 메서드**가 담당하는 2단 구조.
2. **그룹별 다중 선택 + 그룹 간 독립** — 각 그룹 안에서는 칩을 0~N개 동시에 selected 가능(체크박스 의미). 그러나 그룹 간 selected 상태는 서로 영향 받지 않음 — group A의 선택은 group B에 어떤 영향도 주지 않는다. `_selectedIdsByGroup: Map<groupId, Set<chipid>>` 자체 상태로 그룹별 선택 집합을 분리 추적하며, 클릭 시 해당 chipid가 속한 group의 Set만 토글한다(다른 그룹은 그대로). DOM에는 칩별 `data-selected="true|false"` + `aria-pressed` 두 채널로 반영.
3. **그룹별 선택 변경 이벤트** — 어떤 그룹의 어떤 칩이 토글되면 `@filterGroupSelectionChanged` 발행. payload: `{ targetInstance, groupId, selectedChipIds, changedChipId, changedTo, allSelections }`. `selectedChipIds`는 변경된 그룹의 현재 선택 배열, `allSelections`는 전체 그룹의 `{ groupId → selectedChipIds[] }` 스냅샷(페이지가 다중 그룹 필터를 한 번에 적용할 때 사용). `changedChipId`/`changedTo`는 단일 변경 추적용.
4. **외부 publish로 그룹별 선택 강제 변경(선택)** — `setSelectedFilterChipsByGroup` 토픽 publish 시 페이로드 `{ groupId, chipIds: [...] }` 또는 `{ allSelections: { groupId: [chipid, ...] } }`로 외부에서 selected를 강제 갱신. 키보드 단축키, "그룹 전체 해제", URL 쿼리 동기화 등 클릭 외 경로에 사용.
5. **ARIA 그룹 구조** — 각 그룹 컨테이너에 `role="group"` + `aria-labelledby={groupLabel id}`를 부여한다. 칩에는 `aria-pressed` (라디오가 아니므로 `aria-checked` 사용 안 함, 다중 선택 토글 의미). 그룹 라벨이 그룹의 의미적 헤더로 동작.

> **Standard와의 분리 정당성 (5축)**: Standard는 ① 토픽 `filterChipItems` 페이로드 `[{chipid, label, selected?}]` — **그룹 개념 없음** (단일 평탄 리스트), ② cssSelectors에 `container`/`chipid`/`selected`/`label`만 — **groupId/groupLabel/chip-list-container 개념 없음**, ③ `itemKey: 'chipid'` + `datasetAttrs.selected` — 페이지가 `updateItemState`로 selected를 직접 조작 (선택 정책 페이지 책임), ④ 이벤트 `@filterChipClicked` payload는 raw event (단일 클릭 릴레이만), ⑤ 단일 ListRender 호출 — 2단 구조 없음. multiSelectGroup은 ① 새 토픽 `filterChipGroups` (그룹 배열 강제), ② cssSelectors에 `groupItem`/`groupLabel`/`chipList`/`chipTemplate`/`chipid`/`chipLabel` 6-key + group-level template + chip-level template 2종, ③ **selected 정책 + 그룹 격리를 컴포넌트 안으로 흡수** — `_selectedIdsByGroup: Map<groupId, Set>` 자체 상태가 그룹별 다중 선택 + 그룹 간 독립을 강제, ④ 새 이벤트 `@filterGroupSelectionChanged` payload `{ groupId, selectedChipIds, changedChipId, changedTo, allSelections }` — 그룹 ID + 그룹 내 선택 + 전체 스냅샷, ⑤ ListRender(그룹 렌더) + 자체 `_renderChipsInGroup` (칩 렌더) 2단 — 같은 register.js로 표현 불가. 페이지가 매번 그룹 격리 + 다중 선택 누적 + 그룹별 분리 emit를 재구현해야 하는 부담을 컴포넌트가 흡수.

> **유사 변형과의 비교**: SegmentedButtons/Advanced/multiSelect가 단일 그룹 안의 다중 선택을 흡수했다면, multiSelectGroup은 **그 위에 "그룹 격리"라는 한 차원**을 추가했다. `_selectedIds: Set` (multiSelect) → `_selectedIdsByGroup: Map<groupId, Set>` (multiSelectGroup) 으로 자료구조 1단 승격. Chips/Assist/Advanced/coloredByType이 type 분류를 흡수한 것과 같은 패턴 — "페이지가 매번 똑같이 짜야 하는 분기 + 격리 코드"를 컴포넌트로 끌어내림.

> **MD3 / 도메인 근거**: MD3 Filter Chips는 단일 set으로 정의되지만 실사용에서 **여러 카테고리(정렬 / 카테고리 / 가격대 / 평점)를 한 화면에 배치하고 카테고리별 다중 선택 필터를 동시에 적용**하는 패턴이 빈번하다(쇼핑몰 사이드바, 검색 결과 필터, 데이터 대시보드 필터링). 본 변형은 페이지 레벨에서 매번 분기 처리되던 "group 식별 + 그룹별 selected Set 관리 + 그룹 간 독립성 보장"을 컴포넌트로 통합한다. 도메인 예: 쇼핑 필터(카테고리 + 브랜드 + 가격대), 검색 필터(정렬 + 기간 + 출처 + 형식), 데이터 대시보드(상태 + 우선순위 + 담당자), 미디어 필터(장르 + 연도 + 평점).

---

## 구현 명세

### Mixin

ListRenderMixin (그룹 항목 배열 렌더 — 그룹 단위) + 자체 메서드 6종 (`_renderGroups` / `_renderChipsInGroup` / `_handleChipClick` / `_setSelected` / `_applySelectionInGroup` / `_setSelectedFromTopic`).

> Standard도 ListRenderMixin을 사용하지만, Standard는 `chipid`/`label`/`selected` 단일 리스트 매핑이며 group 개념이 없고 selected 정책을 페이지가 `updateItemState`로 조작한다. multiSelectGroup은 ListRender를 **그룹 단위 렌더에만** 사용하고(`groupId`/`groupLabel`/`chipList`/`chipTemplate` 4-key), 칩 항목 렌더는 자체 `_renderChipsInGroup`이 각 그룹 cloneNode 내부의 chip-template를 cloneNode 반복으로 처리한다. selected 정책은 `_selectedIdsByGroup: Map`이 그룹별로 격리된 Set으로 흡수. Mixin 메서드 재정의는 하지 않는다 (`_renderGroups`는 `listRender.renderData` 호출 후 그룹별로 칩 렌더 + 선택 적용을 한 cycle에 묶는 wrapper). 신규 Mixin 생성은 본 SKILL의 대상이 아님 — 자체 메서드로 완결.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container    | `.filter-multi-group__list`             | 그룹이 추가될 부모 (ListRenderMixin 규약) |
| template     | `#filter-multi-group-item-template`     | 그룹 단위 cloneNode 대상 (ListRenderMixin 규약) |
| groupItem    | `.filter-multi-group__group`            | 렌더된 각 그룹 루트 — `role="group"`, `data-group-id`, `data-selected-count` |
| groupId      | `.filter-multi-group__group`            | 그룹 식별 (data-group-id) |
| groupLabel   | `.filter-multi-group__group-label`      | 그룹 헤더 라벨 텍스트 |
| chipList     | `.filter-multi-group__chip-list`        | 그룹 내부 칩이 추가될 컨테이너 (자체 `_renderChipsInGroup`이 사용) |
| chipTemplate | `.filter-multi-group__chip-template`    | 그룹 cloneNode 안에 포함된 칩 단위 `<template>` (자체 메서드가 cloneNode) |
| chipItem     | `.filter-multi-group__chip-item`        | 렌더된 각 칩 루트 — click 위임 + `data-chipid`/`data-selected`/`aria-pressed` |
| chipLabel    | `.filter-multi-group__chip-label`       | 칩 라벨 텍스트 |

> **2단 template 구조**: 그룹 단위 `<template id="filter-multi-group-item-template">`은 HTML 루트 `<template>`(ListRenderMixin이 cloneNode), 그 내부에 `<template class="filter-multi-group__chip-template">`(자체 메서드가 cloneNode)이 중첩된다. ListRender가 그룹 cloneNode를 `container`에 append하면 그 안의 chip-template은 `cloneNode(true)` 시 함께 복제되어 각 그룹 인스턴스가 자기 chip-template를 갖는다. 자체 메서드는 `groupEl.querySelector('.filter-multi-group__chip-template')`으로 그 cloneNode 내부의 chip-template을 직접 찾아 칩 항목을 cloneNode 반복으로 추가한다.

> **체크마크 처리**: `.filter-multi-group__chip-check` SVG는 chip-template에 고정 존재하며 `data-selected="true"` 시 CSS로만 표시된다. cssSelectors KEY로 등록하지 않는다 (데이터 바인딩 대상이 아니므로).

### datasetAttrs (ListRender 그룹 단위)

| KEY | data-* | 용도 |
|-----|--------|------|
| groupId | `group-id` | 그룹 식별. ListRender가 `data-group-id` 자동 부착. 클릭 시 `chipEl.closest(.filter-multi-group__group)?.dataset.groupId`로 그룹 컨텍스트 추출. |

> **note**: 칩 단위 dataset(`data-chipid`, `data-selected`)은 자체 `_renderChipsInGroup`이 직접 setAttribute로 처리한다(ListRender 데이터 바인딩 경로 X — chip은 ListRender가 모르는 영역).

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_selectedIdsByGroup` | `Map<groupId: string, Set<chipid: string>>`. 그룹별 선택 집합. `_setSelected`가 add/delete로 갱신. `_renderGroups`가 초기값(페이로드 `selected:true` 항목들)을 그룹별로 분리하여 결정. |
| `_groupClickHandler` | 컨테이너 click delegator의 bound handler 참조 — beforeDestroy에서 정확히 removeEventListener 하기 위해 보관. |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| `filterChipGroups` | `this._renderGroups` (페이로드 `[{ groupId, groupLabel, items: [{chipid, label, selected?}] }]`) — ListRender로 그룹 렌더 + 자체 메서드로 그룹별 칩 렌더 + 초기 `_selectedIdsByGroup` 설정 + `_applySelectionInGroup` 일괄 호출 |
| `setSelectedFilterChipsByGroup` | `this._setSelectedFromTopic` (페이로드 `{ groupId, chipIds: [...] }` 또는 `{ allSelections: { groupId: [chipid, ...] } }`) — 외부에서 강제로 그룹별 selected 갱신. 한 그룹만 갱신 또는 전체 그룹 일괄 갱신 두 모드. |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `chipItem` (cssSelectors) | 칩 클릭 | `@filterGroupSelectionChanged` (bindEvents가 위임 발행 — Weventbus 채널 등록 보장). 자체 native click delegator가 `dataset.chipid` + 부모 그룹 `dataset.groupId` 추출 후 `_setSelected(groupId, chipid, 'toggle')` → 그룹의 Set 토글 + DOM 갱신 + `Weventbus.emit('@filterGroupSelectionChanged', { targetInstance, groupId, selectedChipIds, changedChipId, changedTo, allSelections })` 명시 payload 추가 발행. |

> **이벤트 발행 분리 이유**: bindEvents의 위임 발행은 `{ targetInstance, event }`만 전달하므로 페이지가 변경된 그룹/칩 정보를 알려면 raw event에서 dataset과 closest 그룹을 다시 추출해야 한다. multiSelectGroup은 페이지가 그룹 단위로 분기 처리하는 시나리오가 본질이므로(예: 정렬 그룹 변경 → 정렬 재계산, 카테고리 그룹 변경 → 카테고리 필터만 갱신), 자체 native delegator에서 명시 payload(groupId + selectedChipIds + allSelections)를 emit하여 페이지의 dataset 재추출 부담을 제거한다.

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderGroups({ response })` | `filterChipGroups` 핸들러. 페이로드 그룹 배열을 ListRender selectorKEY(`groupId`/`groupLabel`)에 맞게 매핑하여 `listRender.renderData` 호출. 그 다음 ① 각 그룹 cloneNode를 순회하며 `_renderChipsInGroup(groupEl, items)` 호출, ② 페이로드의 `items[].selected:true` 항목들을 그룹별로 분리하여 `_selectedIdsByGroup` Map에 누적, ③ 모든 그룹에 대해 `_applySelectionInGroup(groupEl)` 호출하여 DOM 반영. 새 batch는 새 진실(이전 선택 누적 X). |
| `_renderChipsInGroup(groupEl, items)` | 한 그룹 cloneNode 안에서 `chipList` 컨테이너를 비우고 그 그룹의 `chipTemplate`을 `items` 배열로 cloneNode 반복하여 칩을 추가. 각 칩에 `data-chipid` + `data-selected="false"` + `aria-pressed="false"` 초기 부착, label textContent 적용. |
| `_handleChipClick(e)` | 컨테이너 native click delegator. `e.target.closest(chipItem)`로 칩 찾음 → `dataset.chipid` 추출 + `closest(groupItem).dataset.groupId` 추출 → `_setSelected(groupId, chipid, 'toggle')` 호출. |
| `_setSelected(groupId, chipid, action)` | `action: 'on' | 'off' | 'toggle'`. 그룹의 Set이 없으면 새로 생성. 변경 없으면 silent return. 변경 시 `_applySelectionInGroup(groupEl)` 호출 → `Weventbus.emit('@filterGroupSelectionChanged', { ... })`. |
| `_applySelectionInGroup(groupEl)` | 한 그룹 안의 모든 칩 순회하며 `dataset.selected` + `aria-pressed` 동기화. 그룹 컨테이너의 `dataset.selectedCount`도 갱신(CSS 옵션). |
| `_setSelectedFromTopic({ response })` | `setSelectedFilterChipsByGroup` 핸들러. `response = { groupId, chipIds }` (한 그룹 갱신) 또는 `{ allSelections: { gid → [...] } }` (전체 갱신) 두 모드 지원. `_selectedIdsByGroup` 갱신 → 영향받은 모든 그룹에 `_applySelectionInGroup` 호출 → `@filterGroupSelectionChanged` 발행 (`changedChipId: null`, `changedTo: 'bulk'`). |

### 페이지 연결 사례

```
[페이지 — 쇼핑 필터 / 검색 필터 / 대시보드 필터]
    │
    └─ fetchAndPublish('filterChipGroups', this) 또는 직접 publish
        payload 예: [
          { groupId: 'sort',     groupLabel: '정렬',
            items: [
              { chipid: 'latest',   label: '최신순',   selected: true },
              { chipid: 'popular',  label: '인기순' },
              { chipid: 'price',    label: '가격순' }
            ] },
          { groupId: 'category', groupLabel: '카테고리',
            items: [
              { chipid: 'clothes',  label: '의류',     selected: true },
              { chipid: 'shoes',    label: '신발' },
              { chipid: 'bags',     label: '가방',     selected: true }
            ] },
          { groupId: 'price',    groupLabel: '가격대',
            items: [
              { chipid: 'low',      label: '~10만' },
              { chipid: 'mid',      label: '10~30만' },
              { chipid: 'high',     label: '30만~' }
            ] }
        ]

[Chips/Filter/Advanced/multiSelectGroup]
    ├─ ListRender가 3개 그룹 cloneNode를 container에 append
    ├─ _renderChipsInGroup이 그룹별로 chip-template를 items 수만큼 cloneNode → 칩 N개 렌더
    ├─ _selectedIdsByGroup = Map { 'sort'→Set('latest'), 'category'→Set('clothes','bags'), 'price'→Set() }
    └─ _applySelectionInGroup이 모든 그룹 칩에 data-selected + aria-pressed 부여

[칩 클릭 — 카테고리 그룹의 'shoes' 토글]
    └──@filterGroupSelectionChanged──▶ [페이지]
            payload: {
              targetInstance,
              groupId: 'category',
              selectedChipIds: ['clothes','bags','shoes'],
              changedChipId: 'shoes',
              changedTo: 'on',
              allSelections: {
                sort:     ['latest'],
                category: ['clothes','bags','shoes'],   // ← 변경됨
                price:    []                             // ← 그대로 (그룹 간 독립)
              }
            }
            → 페이지가 allSelections로 다중 그룹 필터를 한 번에 적용

운영: this.pageDataMappings = [
        { topic: 'filterChipGroups',                datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setSelectedFilterChipsByGroup',   datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@filterGroupSelectionChanged': ({ groupId, selectedChipIds, allSelections }) => {
          // groupId 단독 분기 또는 allSelections로 다중 그룹 필터 일괄 적용
        }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 그룹 시각 + 선택 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|---------------------------|------------------|
| `01_refined`     | A: Refined Technical | 그룹 라벨: 퍼플 secondary 텍스트(`#92A8F4`) + 작은 letter-spacing. 칩 선택: 퍼플 그라데이션 fill + 체크마크. 그룹 간 12px 수직 gap. | 쇼핑 필터 — 정렬 / 카테고리 / 가격대 그룹 동시 활성, 각 그룹 독립 다중 선택 |
| `02_material`    | B: Material Elevated | 그룹 라벨: 라이트 회색 caption(`#616161`) + Roboto Medium. 칩 선택: secondary container `#E3F2FD` fill + 작은 elevation + 체크마크. 그룹 간 16px gap + 미세 divider. | 검색 필터 — 정렬 / 기간 / 출처 / 형식 그룹 다중 활성 |
| `03_editorial`   | C: Minimal Editorial | 그룹 라벨: Georgia serif italic + 웜 그레이(`#5F5750`) + 작은 underline. 칩 선택: 1px → 2px outline 두꺼움 + 체크마크 + 미세 톤 배경. 그룹 간 18px gap + 점선 divider. | 미디어 필터 — 장르 / 연도 / 평점 / 형식 그룹 다중 활성 |
| `04_operational` | D: Dark Operational  | 그룹 라벨: JetBrains Mono uppercase + 시안(`#4DD0E1`) + `data-selected-count` 카운트 표시(`SORT(2)` 형식). 칩 선택: 시안 fill(`rgba(77,208,225,0.15)`) + 시안 좌측 stripe + 체크마크. 그룹 간 컴팩트 8px gap. | 데이터 대시보드 필터 — 상태 / 우선순위 / 담당자 / 카테고리 그룹 다중 활성 (운영 카운트 표시) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따른다. `[data-selected="true"]` 셀렉터로 칩 선택을 분기하며, 3~4개 그룹 + 각 그룹 3~5개 칩 + 일부 selected 초기 상태로 그룹별 다중 선택 + 그룹 간 독립을 한 변형 안에서 시연한다.

### 결정사항

- **그룹 격리 (그룹 간 독립)**: 변형 설명의 "그룹 간 배타"는 "한 그룹의 선택이 다른 그룹에 영향을 주지 않는다(독립/직교)"라는 의미로 해석. 그룹 X 그룹 cross-exclusion이 아닌 그룹 간 independence. `_selectedIdsByGroup: Map`이 그룹별 Set을 분리하여 자연스럽게 보장.
- **2단 template 구조**: 그룹 단위 ListRender `<template>` 안에 칩 단위 `<template>`을 **중첩**한다. ListRender가 그룹 cloneNode를 만들 때 chip-template도 함께 복제되어 각 그룹 인스턴스가 자기 chip-template을 갖는다 → 자체 메서드가 querySelector로 안전하게 발견.
- **칩 ID는 그룹 내에서만 unique 가정**: 페이로드 설계상 한 그룹 안에서는 chipid가 unique지만, 그룹 간 같은 chipid가 있어도 무방하다(자체 상태가 `Map<groupId, Set>`로 분리되어 있으므로). DOM 레벨에서도 칩 클릭 시 closest(group) → groupId 추출하므로 그룹 컨텍스트가 항상 따라온다.
- **선택 비즈니스 룰은 페이지 책임**: 컴포넌트는 그룹 격리 + 다중 선택 누적 + 그룹별 emit만 보장. 그룹 간 cross-exclusion(그룹 A 선택 시 그룹 B 해제 등)이 필요한 경우 페이지가 `setSelectedFilterChipsByGroup` 토픽으로 강제 갱신.
- **체크마크 아이콘**: chip-template에 SVG 체크 마크 고정 배치 + CSS visibility로만 토글. Standard와 동일.
