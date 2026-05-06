# ButtonGroups — Advanced / multiSelect

## 기능 정의

1. **버튼 그룹 항목 동적 렌더** — `buttonGroupMultiItems` 토픽으로 수신한 배열(`[{id, label, selected?, status?, tone?}]`)을 ListRenderMixin이 동적으로 렌더한다.
2. **다중 선택 누적(체크박스 의미론)** — 그룹 내 0~N개 항목이 동시에 선택될 수 있다. `_selectedIds: Set<string>`로 상태를 관리하고, 클릭 시 해당 항목만 토글된다.
3. **선택 집합 변경 이벤트** — 선택이 바뀌면 `@buttonGroupMultiSelected` 발행. payload: `{ targetInstance, selectedIds, changedId, changedTo }`.
4. **외부 선택 집합 강제 변경(선택)** — `setSelectedButtonGroupChoices` 토픽 publish 시 `{ ids: [...] }`로 외부에서 선택 집합을 통째로 덮어쓸 수 있다.
5. **Connected button group을 필터/태그 그룹으로 확장** — Standard가 페이지로 넘기던 누적 선택 규칙을 컴포넌트 내부로 흡수한다.

> **Standard와의 분리 정당성**: Standard는 각 버튼 클릭을 페이지로 전달할 뿐, 누적 선택이나 선택 집합 개념이 없다. multiSelect는 `_selectedIds` 상태와 토글 로직, bulk setter 토픽, 집합 payload 이벤트를 추가해 컴포넌트가 다중 선택 정책을 직접 보유한다. register.js가 구조적으로 달라 Advanced가 맞다.

## 구현 명세

### Mixin

ListRenderMixin + 자체 메서드(`_renderChoices` / `_handleSelect` / `_applySelection` / `_setSelected` / `_setSelectedFromTopic`)

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| group | `.button-group-multi` | 그룹 컨테이너 |
| container | `.button-group-multi__list` | ListRender 부모 |
| template | `#button-group-multi-item-template` | cloneNode 대상 |
| item | `.button-group-multi__item` | 클릭 위임 + 선택 상태 반영 |
| id | `.button-group-multi__item` | 항목 식별 |
| label | `.button-group-multi__label` | 라벨 |

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| id | id |
| selected | selected |
| status | status |
| tone | tone |

### 구독

| topic | handler |
|-------|---------|
| `buttonGroupMultiItems` | `this._renderChoices` |
| `setSelectedButtonGroupChoices` | `this._setSelectedFromTopic` |

### 이벤트

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `item` | `@buttonGroupMultiSelected` |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderChoices({ response })` | 렌더 후 초기 선택 집합을 `Set`으로 재구성 |
| `_handleSelect(event)` | 클릭된 항목을 토글 |
| `_setSelected(id, action)` | `on/off/toggle`에 따라 집합 갱신 |
| `_applySelection()` | 모든 항목의 `data-selected` / `aria-pressed` 및 그룹 count 동기화 |
| `_setSelectedFromTopic({ response })` | 외부 ids 배열로 선택 집합 일괄 변경 |

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| `01_refined` | A: Refined Technical | 개별 선택 필과 네온 글로우가 누적 |
| `02_material` | B: Material Elevated | 칩형 다중 필터에 가까운 M3 서피스 |
| `03_editorial` | C: Minimal Editorial | 얇은 보더와 세리프 라벨의 누적 선택 |
| `04_operational` | D: Dark Operational | 선택 count가 즉시 드러나는 운영형 버튼 그룹 |
