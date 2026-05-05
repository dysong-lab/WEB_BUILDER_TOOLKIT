# IconButtons — Advanced / toggleGroup

## 기능 정의

1. **그룹 항목 동적 렌더** — `iconButtonGroup` 토픽으로 수신한 배열(`[{id, icon, label?, selected?}]`)을 ListRenderMixin이 `<template>` cloneNode로 항목 N개로 렌더한다. 항목별 `data-action-id` 속성으로 식별.
2. **단일 선택 강제(라디오 의미론)** — 그룹 내에서 선택된 항목은 항상 1개. 클릭 시 해당 항목만 selected, 나머지 자동 deselect. 초기 상태는 페이로드의 `selected:true` 항목(없으면 첫 항목)을 selected로 설정. `_selectedId` 자체 상태로 추적하며 DOM에는 `data-selected="true|false"` + `aria-checked="true|false"` 두 채널로 반영(CSS 시각 차별화는 두 채널 모두 사용 가능, a11y는 aria-checked 기준).
3. **선택 변경 이벤트** — 선택이 변경될 때 `@iconButtonToggled` 발행. payload: `{ targetInstance, selectedId, previousId }`. 페이지가 어떤 버튼이 새로 선택됐는지(selectedId)와 직전 선택(previousId)을 동시에 수신하여 분기 처리.
4. **외부 publish로 선택 강제 변경(선택)** — `toggleSelection` 토픽 publish 시 페이로드 `{ id }`로 외부에서 selected 항목을 강제 지정 가능. 사용자 클릭 외 경로(키보드 단축키, 다른 컴포넌트 동기화, 라우트 변경 등)로 선택을 갱신하는 통로.
5. **ARIA radiogroup 의미론** — 컨테이너에 `role="radiogroup"`, 항목에 `role="radio"` + `aria-checked` 부여. 스크린리더가 라디오 그룹임을 인지.

> **Standard와의 분리 정당성**: Standard는 ① 토픽 `iconButtonInfo`(단일 객체, FieldRender) + ② 이벤트 `@iconButtonClicked`(단순 클릭 릴레이)만 존재 — 그룹/선택 개념 자체 없음. toggleGroup은 ① 새 토픽 `iconButtonGroup`(배열) + 보조 토픽 `toggleSelection`(외부 강제), ② Mixin을 FieldRender → ListRender로 교체 + `<template>` 항목 반복 렌더, ③ `_selectedId` 자체 상태 + `data-selected`/`aria-checked` 이중 dataset/속성, ④ `_handleSelect`/`_renderGroup`/`_applySelection`/`_setSelected` 4종 자체 메서드, ⑤ 새 이벤트 `@iconButtonToggled`(payload `{selectedId, previousId}`) — 다섯 축 모두 Standard register.js와 직교. 같은 register.js로 표현 불가 → 별도 Advanced 변형으로 분리.

> **MD3 / 도메인 근거**: MD3 IconButton 자체는 단발 액션 트리거지만, 다중 IconButton을 하나의 그룹으로 묶어 단일 선택을 강제하는 패턴은 SegmentedButtons와 의미론이 유사하다(라디오 의미론). 본 변형은 SegmentedButtons의 시각/구조(라벨 결합 분할 버튼)가 아니라 IconButton의 컴팩트한 아이콘 전용 시각을 유지하면서 단일 선택 그룹 의미만 도입한 변형이다. 실사용 예: 정렬 방향(ascending/descending), 뷰 모드(grid/list/compact), 필터 우선순위(latest/popular/relevant), 운영 알람 단계(info/warning/critical).

> **SegmentedButtons와의 차이**: SegmentedButtons는 라벨+아이콘 결합의 명시적 옵션 선택 UI로 셰이프가 connected segment(공유 border, 인접 segment와 시각적으로 묶임)다. toggleGroup은 IconButton의 독립 버튼 시각을 유지하면서 그룹 컨테이너 안에 N개를 배치하고 선택 상태만 강제하는 변형으로, 시각이 더 컴팩트하고 라벨이 선택적(아이콘 only도 허용)이다. 따라서 같은 "그룹 단일 선택" 의미론이라도 시각/구조가 다르므로 별도 컴포넌트로 분리된다.

---

## 구현 명세

### Mixin

ListRenderMixin (그룹 항목 배열 렌더) + 자체 메서드(`_renderGroup` / `_handleSelect` / `_applySelection` / `_setSelected`).

> Standard는 FieldRenderMixin으로 단일 IconButton의 아이콘만 처리한다. toggleGroup은 그룹 항목 N개를 렌더해야 하므로 ListRenderMixin으로 교체한다. `_renderGroup`은 `listRender.renderData` 호출 후 초기 selected 결정을 한 cycle에 묶는 wrapper다(Mixin 메서드 재정의 금지 규칙 준수). 신규 Mixin 생성은 본 SKILL의 대상이 아님 — 자체 메서드로 완결.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| group     | `.icon-button-group`              | 라디오그룹 컨테이너 — `role="radiogroup"`, `data-selected-id` dataset 부착 대상 |
| container | `.icon-button-group__list`        | 항목이 추가될 부모 (ListRenderMixin 규약) |
| template  | `#icon-button-group-item-template`| `<template>` cloneNode 대상 (ListRenderMixin 규약) |
| item      | `.icon-button-group__item`        | 렌더된 각 IconButton 루트 — click 위임 + `data-selected`/`aria-checked` 부착 |
| actionId  | `.icon-button-group__item`        | 항목 식별 (data-action-id) |
| icon      | `.icon-button-group__item-icon`   | 아이콘 (material symbol textContent) |
| label     | `.icon-button-group__item-label`  | 라벨 (선택 — 아이콘 only도 허용, 빈 문자열이면 `:empty` CSS로 숨김) |

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| actionId | `action-id` | 항목 click 시 `event.target.closest(item)?.dataset.actionId`로 actionId 추출. ListRender가 `data-action-id` 속성을 항목에 자동 설정. |

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_selectedId` | 현재 선택된 항목 id(string \| null). `_setSelected`가 갱신. `_renderGroup`이 초기값 결정. |
| `_groupClickHandler` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener 하기 위해 보관. (bindEvents가 `@iconButtonToggled`를 위임 발행하지만, 단일 선택 강제 + DOM dataset 갱신 사이드이펙트는 자체 native click delegator가 담당하여 `_selectedId` 상태 갱신과 `data-selected`/`aria-checked` 일괄 적용을 한 cycle에 묶는다.) |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| `iconButtonGroup`  | `this._renderGroup` (페이로드 `[{ actionId, icon, label?, selected? }]`) — 내부에서 `this.listRender.renderData({ response: items })` 호출 + 초기 selected 결정 + `_applySelection` 호출 |
| `toggleSelection`  | `this._setSelectedFromTopic` (페이로드 `{ id }`) — 외부에서 강제로 selected 항목 변경. `_setSelected(id)` wrapping. |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `item` (ListRender) | 항목 클릭 | `@iconButtonToggled` (bindEvents가 위임 발행). 페이로드 `{ targetInstance, event }` — 페이지가 `event.target.closest('.icon-button-group__item')?.dataset.actionId`로 새 selectedId 추출. 단, 본 변형은 register.js가 자체 native delegator로 `_selectedId` 갱신 + DOM `data-selected`/`aria-checked` 갱신 사이드이펙트를 함께 수행하고, `Weventbus.emit('@iconButtonToggled', { targetInstance: this, selectedId, previousId })`을 직접 호출하여 `selectedId` + `previousId`를 명시 페이로드로 추가 발행한다. 따라서 페이지는 두 페이로드 형태 중 명시 payload(`selectedId`, `previousId`)를 받는다. |

> **이벤트 발행 분리 이유**: bindEvents의 위임 발행은 `{ targetInstance, event }`만 전달하므로 `previousId` 정보가 없다. toggleGroup은 직전 선택을 명시 정보로 페이지에 전달해야 하므로(예: 정렬 방향이 asc → desc로 바뀌었음을 알아야 함) 자체 native delegator에서 `Weventbus.emit('@iconButtonToggled', { targetInstance, selectedId, previousId })`을 직접 호출한다. customEvents의 위임 발행은 본 변형에서는 trigger 알림 의미 + Weventbus 채널 등록 보장 의미로 유지하되, 페이지가 사용하는 페이로드는 명시 emit이 우선한다.

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderGroup({ response })` | `iconButtonGroup` 핸들러. items 배열을 ListRender로 렌더한 후 ① 페이로드에서 `selected:true` 항목 탐색 → `_selectedId` 결정, ② 없으면 `items[0]?.actionId`를 fallback, ③ `_applySelection()` 호출하여 DOM에 반영. |
| `_handleSelect(e)` | 컨테이너 native click delegator. `e.target.closest(item)`로 클릭된 항목 찾음 → `dataset.actionId` 추출 → 같으면 no-op(이미 선택된 것을 다시 누름) → 다르면 `_setSelected(newId)` 호출. |
| `_setSelected(newId)` | `previousId = this._selectedId` 저장 → `_selectedId = newId` 갱신 → `_applySelection()` 호출 → `Weventbus.emit('@iconButtonToggled', { targetInstance: this, selectedId: newId, previousId })`. newId가 null이거나 그룹에 없는 id면 silent return. |
| `_applySelection()` | 모든 항목 순회하며 `dataset.selected = (id === _selectedId ? 'true' : 'false')`, `setAttribute('aria-checked', ...)` 동기화. 그룹 컨테이너의 `dataset.selectedId`도 갱신(CSS 컨텍스트 셀렉터 옵션). |
| `_setSelectedFromTopic({ response })` | `toggleSelection` 토픽 핸들러. `response = { id }` 페이로드를 받아 `_setSelected(response.id)` 호출. 외부에서 클릭 외 경로로 선택을 강제할 때 사용. |

### 페이지 연결 사례

```
[페이지 — 정렬 컨트롤]
    │
    └─ fetchAndPublish('iconButtonGroup', this) 또는 직접 publish
        payload 예: [
          { actionId: 'asc',  icon: 'arrow_upward',   label: '오름차순', selected: true },
          { actionId: 'desc', icon: 'arrow_downward', label: '내림차순' }
        ]

[IconButtons/Advanced/toggleGroup]
    ├─ ListRender가 items 배열을 항목으로 렌더 (이전 항목 전체 replace)
    ├─ _renderGroup이 selected:true 항목(또는 첫 항목)을 _selectedId로 설정
    ├─ _applySelection이 모든 항목에 data-selected + aria-checked 부여
    └─ CSS .icon-button-group__item[data-selected="true"]가 선택 시각(글로우/border/fill) 적용

[IconButtons/Advanced/toggleGroup]
    └──@iconButtonToggled──▶ [페이지]
            ├─ payload: { targetInstance, selectedId: 'desc', previousId: 'asc' }
            └─ 페이지가 selectedId 기준으로 정렬 방향 적용 + 데이터 재요청

[페이지 — 키보드 단축키 등]
    └─ instance.subscriptions.toggleSelection.forEach(h => h.call(instance, { response: { id: 'asc' } }))
        → _setSelectedFromTopic이 _setSelected('asc') 호출
        → @iconButtonToggled 동일하게 발행 (clickToggle과 동일 경로)

운영: this.pageDataMappings = [
        { topic: 'iconButtonGroup',  datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'toggleSelection',  datasetInfo: {...}, refreshInterval: 0 }   // 선택
      ];
      Wkit.onEventBusHandlers({
        '@iconButtonToggled': ({ selectedId, previousId }) => {
          // selectedId 기준 분기 (정렬/뷰 모드/필터 등)
        }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | 선택 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|-----------------|------------------|
| `01_refined`     | A: Refined Technical | 선택 항목: 퍼플 그라데이션 fill + 글로우(rgba(80,46,233,.45) box-shadow) + 아이콘 화이트. 비선택: 투명 배경 + 아이콘 muted. | 정렬 방향 (asc / desc) — 데이터 정렬 방향을 단일 선택 |
| `02_material`    | B: Material Elevated | 선택 항목: secondary container surface tint(`#C0CAFF`) + level 2 elevation. 비선택: 투명 + 아이콘 outline. | 뷰 모드 (grid / list / compact) — 콘텐츠 표시 모드 단일 선택 |
| `03_editorial`   | C: Minimal Editorial | 선택 항목: outline border thicken(2px solid `#4A3F35`) + 배경 미세 톤(`rgba(140,123,107,.08)`). 비선택: 1px outline `#C9BFB1` + 배경 transparent. | 필터 우선순위 (latest / popular / relevant) — 검색/피드 정렬 우선 단일 선택 |
| `04_operational` | D: Dark Operational  | 선택 항목: 시안 ring(`box-shadow: 0 0 0 1px #00E5FF, 0 0 14px rgba(0,229,255,.45)`) + 아이콘 시안 컬러. 그룹 컨테이너에 노랑 accent 라벨로 active 상태 표시. 비선택: 회색 outline + 아이콘 muted. | 운영 알람 단계 (info / warning / critical) — 모니터링 임계 단일 선택 |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, `[data-selected="true"]`(또는 `[aria-checked="true"]`) 셀렉터로 선택 시각을 분기한다. 선택 변경 시 transition 200~300ms로 부드럽게 시각 전환.
