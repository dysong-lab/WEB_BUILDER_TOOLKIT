# ButtonGroups — Advanced / toggleGroup

## 기능 정의

1. **버튼 그룹 항목 동적 렌더** — `buttonGroupChoiceItems` 토픽으로 수신한 배열(`[{id, label, selected?, status?, tone?}]`)을 ListRenderMixin이 `<template>` cloneNode로 항목 N개로 렌더한다.
2. **단일 선택 강제(라디오 의미론)** — 그룹 내 선택 항목은 항상 1개다. 클릭 시 해당 항목만 selected, 나머지는 자동 해제된다. `_selectedId` 자체 상태로 추적하며 DOM에는 `data-selected="true|false"` + `aria-pressed="true|false"`를 반영한다.
3. **선택 변경 이벤트** — 선택이 바뀌면 `@buttonGroupToggled` 발행. payload: `{ targetInstance, selectedId, previousId }`.
4. **외부 선택 강제 변경(선택)** — `setSelectedButtonGroupChoice` 토픽 publish 시 `{ id }`로 외부에서 선택 항목을 강제 지정할 수 있다.
5. **Connected button group 의미론 보강** — Standard의 단순 클릭 릴레이를 넘어, ButtonGroups 자체가 선택 정책을 흡수한다.

> **Standard와의 분리 정당성**: Standard는 `buttonGroupItems` 렌더 + `@buttonGroupItemClicked` 클릭 릴레이만 제공하고, 선택 규칙은 페이지가 책임진다. toggleGroup은 `_selectedId` 상태, `_renderChoices`/`_handleSelect`/`_applySelection`/`_setSelected`/`_setSelectedFromTopic` 메서드, 보조 토픽, 명시 이벤트 payload를 추가해 컴포넌트 내부가 단일 선택을 강제한다. 같은 register.js로 표현 불가하므로 Advanced로 분리한다.

## 구현 명세

### Mixin

ListRenderMixin + 자체 메서드(`_renderChoices` / `_handleSelect` / `_applySelection` / `_setSelected` / `_setSelectedFromTopic`)

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| group | `.button-group-toggle` | 그룹 컨테이너 |
| container | `.button-group-toggle__list` | ListRender 부모 |
| template | `#button-group-toggle-item-template` | cloneNode 대상 |
| item | `.button-group-toggle__item` | 클릭 위임 + 선택 상태 반영 |
| id | `.button-group-toggle__item` | 항목 식별 |
| label | `.button-group-toggle__label` | 라벨 |

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
| `buttonGroupChoiceItems` | `this._renderChoices` |
| `setSelectedButtonGroupChoice` | `this._setSelectedFromTopic` |

### 이벤트

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `item` | `@buttonGroupToggled` |

> bindEvents의 기본 payload는 `{ targetInstance, event }`다. 본 변형은 페이지가 `selectedId`, `previousId`를 즉시 사용할 수 있어야 하므로 register.js에서 `Weventbus.emit('@buttonGroupToggled', { targetInstance, selectedId, previousId })`를 직접 추가 발행한다.

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderChoices({ response })` | 배열 렌더 후 초기 selected 항목 결정 |
| `_handleSelect(event)` | 클릭된 항목 id를 추출하고 `_setSelected` 호출 |
| `_setSelected(nextId)` | 이전 선택과 비교 후 상태 갱신 + 이벤트 발행 |
| `_applySelection()` | 모든 항목의 `data-selected` / `aria-pressed` 동기화 |
| `_setSelectedFromTopic({ response })` | 외부 토픽으로 선택 강제 변경 |

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| `01_refined` | A: Refined Technical | 깊은 남색 배경 위 밝은 선택 필 |
| `02_material` | B: Material Elevated | 라이트 서피스 + M3 톤 선택 강조 |
| `03_editorial` | C: Minimal Editorial | 종이 톤 연결 버튼 + 섬세한 보더 |
| `04_operational` | D: Dark Operational | 시안 액티브 링 + 모니터링형 컴팩트 그룹 |
