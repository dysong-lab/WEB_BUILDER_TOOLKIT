# SegmentedButtons — Advanced / multiSelect

## 기능 정의

1. **세그먼트 항목 동적 렌더** — `segmentInfo` 토픽으로 수신한 배열(`[{id, label, icon?, selected?}]`)을 ListRenderMixin이 `<template>` cloneNode로 항목 N개로 렌더한다. 항목별 `data-action-id` 속성으로 식별.
2. **다중 선택 강제(체크박스 의미론)** — 그룹 내 항목 0~N개가 동시에 selected 가능. 클릭 시 해당 항목만 토글되고 나머지는 영향 없음(누적). 초기 상태는 페이로드의 `selected:true` 항목들 전체를 selected로 설정. `_selectedIds: Set<string>` 자체 상태로 추적하며 DOM에는 `data-selected="true|false"` + `aria-pressed="true|false"` 두 채널로 반영(CSS 시각 차별화는 두 채널 모두 사용 가능, a11y는 aria-pressed 기준).
3. **다중 선택 변경 이벤트** — 선택 집합이 변경될 때 `@segmentMultiSelected` 발행. payload: `{ targetInstance, selectedIds, changedId, changedTo }`. 페이지가 새 선택 배열(`selectedIds`)과 함께 어떤 항목이 어떻게 바뀌었는지(`changedId`, `changedTo: 'on' | 'off'`)까지 동시에 수신하여 분기 처리(예: 단일 변경 항목만 효율적 재계산).
4. **외부 publish로 선택 강제 변경(선택)** — `setSelectedSegments` 토픽 publish 시 페이로드 `{ ids: [...] }`로 외부에서 selected 항목 집합을 통째로 강제 지정. 사용자 클릭 외 경로(키보드 단축키, 다른 컴포넌트 동기화, 라우트 변경, "전체 해제" 액션 등)로 선택을 갱신하는 통로. 빈 배열도 허용(전체 해제).
5. **ARIA group 의미론** — 컨테이너에 `role="group"`, 항목에 `aria-pressed` 부여. 스크린리더가 토글 가능한 버튼 그룹임을 인지 (라디오 그룹이 아니다 — 단일 선택 강제가 없음).

> **Standard와의 분리 정당성**: Standard는 ① 토픽 `segmentedButtonItems` 단방향 렌더 + ② 이벤트 `@segmentClicked`(단순 클릭 릴레이, 선택 정책은 페이지 책임)만 존재 — 컴포넌트 자체에 "다중 선택"이라는 의미는 없다. 페이지가 매 클릭마다 본인의 정책(라디오/체크박스/계층 선택 등)을 적용한 후 `updateItemState`를 다시 호출해야 한다. multiSelect는 ① 새 토픽 `segmentInfo`(MD3 통합 페이로드 `{id, label, icon?, selected?}`) + 보조 토픽 `setSelectedSegments`(외부 강제), ② **selected 정책을 컴포넌트 안으로 끌어내림** — `_selectedIds: Set` 자체 상태가 다중 선택 누적을 강제, ③ `_handleSelect`/`_renderSegments`/`_applySelection`/`_setSelected`/`_setSelectedFromTopic` 5종 자체 메서드 + 자체 native click delegator + `Set` 토글, ④ 새 이벤트 `@segmentMultiSelected`(payload `{selectedIds, changedId, changedTo}`) — 단순 클릭 릴레이가 아니라 "선택 집합 변경 + 변경된 항목 정보"를 함께 전달. 다섯 축 모두 Standard register.js와 직교 — 같은 register.js로 표현 불가, 페이지가 매번 selected 정책을 재구현해야 하는 부담을 컴포넌트가 흡수.

> **IconButtons/Advanced/toggleGroup과의 차이 (1줄 핵심)**: toggleGroup은 **단일 선택 강제**(라디오, `_selectedId: string | null`, 항상 정확히 1개), multiSelect는 **다중 선택 누적**(체크박스, `_selectedIds: Set<string>`, 0~N개). 클릭 시 toggleGroup은 다른 항목 자동 deselect / multiSelect는 해당 항목만 토글(나머지 영향 없음). ARIA도 다르다: toggleGroup `role="radiogroup"` + `aria-checked` / multiSelect `role="group"` + `aria-pressed`. 이벤트 페이로드도 다르다: toggleGroup `{selectedId, previousId}` (단일 + 이전) / multiSelect `{selectedIds, changedId, changedTo}` (집합 + 단일 변경 추적).

> **MD3 / 도메인 근거**: MD3 SegmentedButtons는 multi-select 모드를 명시적으로 지원하며(공식 문서: "Single-select segmented button" / "Multi-select segmented button" 두 모드 명시), 본 변형은 후자를 구현한다. 라벨 결합 connected segment의 시각/구조는 그대로 유지하되 selected 정책만 다중 누적으로 변경. 실사용 예: 다중 필터(상태 + 우선순위 + 담당자 동시 활성), 카테고리 다중 적용(태그 N개 동시 토글), 알람 채널 동시 활성화(SMS + Push + Email 중 임의 조합), 다중 데이터 소스 합성(센서 그룹 동시 표시).

---

## 구현 명세

### Mixin

ListRenderMixin (세그먼트 항목 배열 렌더) + 자체 메서드(`_renderSegments` / `_handleSelect` / `_applySelection` / `_setSelected` / `_setSelectedFromTopic`).

> Standard도 ListRenderMixin을 사용하지만, Standard는 `itemKey` 옵션과 `datasetAttrs.selected`를 사용해 페이지가 `updateItemState`로 selected를 직접 조작하는 패턴이다. multiSelect는 selected 정책을 컴포넌트가 내부 `Set` 상태로 흡수하므로 `itemKey`/`datasetAttrs.selected`를 사용하지 않고 자체 native delegator + `_applySelection`이 DOM dataset을 일괄 적용한다. Mixin 메서드 재정의는 하지 않는다(`_renderSegments`는 `listRender.renderData` 호출 후 selected 결정/적용을 한 cycle에 묶는 wrapper). 신규 Mixin 생성은 본 SKILL의 대상이 아님 — 자체 메서드로 완결.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| group     | `.segmented-button-multi`              | 그룹 컨테이너 — `role="group"`, `data-selected-count` dataset 부착 대상(시각 옵션) |
| container | `.segmented-button-multi__list`        | 항목이 추가될 부모 (ListRenderMixin 규약) |
| template  | `#segmented-button-multi-item-template`| `<template>` cloneNode 대상 (ListRenderMixin 규약) |
| item      | `.segmented-button-multi__item`        | 렌더된 각 segment 루트 — click 위임 + `data-selected`/`aria-pressed` 부착 |
| actionId  | `.segmented-button-multi__item`        | 항목 식별 (data-action-id) |
| icon      | `.segmented-button-multi__icon`        | 아이콘 (material symbol textContent, 선택) |
| label     | `.segmented-button-multi__label`       | 라벨 텍스트 |

> **체크마크 처리**: `.segmented-button-multi__check`는 template에 고정 존재하며 `data-selected="true"` 시 CSS로만 표시된다. cssSelectors KEY로 등록하지 않는다 (데이터 바인딩 대상이 아니므로).

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| actionId | `action-id` | 항목 click 시 `event.target.closest(item)?.dataset.actionId`로 actionId 추출. ListRender가 `data-action-id` 속성을 항목에 자동 설정. |

> **note**: Standard는 `selected`도 `datasetAttrs`에 등록하지만, multiSelect는 selected 정책을 자체 상태(`_selectedIds`)로 흡수하므로 ListRender의 데이터 바인딩 경로에서는 selected를 다루지 않는다. 초기 selected는 `_renderSegments`가 페이로드 `selected:true` 항목들을 `_selectedIds`에 누적한 뒤 `_applySelection`이 일괄로 DOM에 적용한다.

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_selectedIds` | 현재 선택된 항목 id의 `Set<string>`. `_setSelected`가 add/delete로 갱신. `_renderSegments`가 초기값 결정. |
| `_groupClickHandler` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener 하기 위해 보관. (bindEvents가 `@segmentMultiSelected`를 위임 발행하지만, 다중 선택 토글 + DOM dataset 갱신 사이드이펙트는 자체 native click delegator가 담당하여 `_selectedIds` 상태 갱신과 `data-selected`/`aria-pressed` 일괄 적용을 한 cycle에 묶는다.) |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| `segmentInfo`         | `this._renderSegments` (페이로드 `[{ id, label, icon?, selected? }]`) — 내부에서 actionId로 키 변환 후 `this.listRender.renderData({ response })` 호출 + 초기 `_selectedIds` 결정 + `_applySelection` 호출 |
| `setSelectedSegments` | `this._setSelectedFromTopic` (페이로드 `{ ids: [...] }`) — 외부에서 강제로 selected 집합 통째로 변경. 빈 배열도 허용(전체 해제). |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `item` (ListRender) | 항목 클릭 | `@segmentMultiSelected` (bindEvents가 위임 발행). 페이로드 `{ targetInstance, event }` — 페이지가 `event.target.closest('.segmented-button-multi__item')?.dataset.actionId`로 변경 항목 추출 가능. 단, 본 변형은 register.js가 자체 native delegator로 `_selectedIds` 토글 + DOM `data-selected`/`aria-pressed` 갱신 사이드이펙트를 함께 수행하고, `Weventbus.emit('@segmentMultiSelected', { targetInstance: this, selectedIds: [...this._selectedIds], changedId, changedTo })`을 직접 호출하여 명시 페이로드를 추가 발행한다. 따라서 페이지는 두 페이로드 형태 중 명시 payload(`selectedIds`, `changedId`, `changedTo`)를 받는다. |

> **이벤트 발행 분리 이유**: bindEvents의 위임 발행은 `{ targetInstance, event }`만 전달하므로 `selectedIds` 집합과 변경된 항목 정보가 없다. multiSelect는 페이지가 매번 DOM을 다시 스캔하지 않고도 현재 선택 집합과 단일 변경 항목을 바로 받을 수 있어야 하므로(예: 다중 필터링에서 단일 토글만 효율적으로 적용/해제) 자체 native delegator에서 명시 payload를 emit한다. customEvents의 위임 발행은 본 변형에서는 trigger 알림 의미 + Weventbus 채널 등록 보장 의미로 유지하되, 페이지가 사용하는 페이로드는 명시 emit이 우선한다.

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderSegments({ response })` | `segmentInfo` 핸들러. items 배열을 ListRender selectorKEY(`actionId`)에 맞게 매핑(`{id → actionId}`)한 후 `listRender.renderData` 호출. 그 다음 ① 페이로드의 `selected:true` 항목들을 `_selectedIds`에 누적, ② `_applySelection()` 호출하여 DOM에 반영. 새 batch가 들어올 때마다 `_selectedIds`는 새 페이로드 기준으로 재구성(이전 선택 누적 X — 새 batch는 새 진실). |
| `_handleSelect(e)` | 컨테이너 native click delegator. `e.target.closest(item)`로 클릭된 항목 찾음 → `dataset.actionId` 추출 → `_setSelected(id, toggleAction)` 호출(현재 상태 반대로). |
| `_setSelected(id, action)` | `action: 'on' | 'off' | 'toggle'`. `'on'` → Set.add, `'off'` → Set.delete, `'toggle'` → 현재 상태 반대. 변경 없으면 silent return. 변경 시 `changedTo` 값을 결정한 후 `_applySelection()` 호출 → `Weventbus.emit('@segmentMultiSelected', { targetInstance: this, selectedIds: [...this._selectedIds], changedId: id, changedTo })`. |
| `_applySelection()` | 모든 항목 순회하며 `dataset.selected = (set.has(id) ? 'true' : 'false')`, `setAttribute('aria-pressed', ...)` 동기화. 그룹 컨테이너의 `dataset.selectedCount`도 갱신(CSS 컨텍스트 셀렉터 옵션). |
| `_setSelectedFromTopic({ response })` | `setSelectedSegments` 토픽 핸들러. `response = { ids: [...] }` 페이로드를 받아 `_selectedIds`를 페이로드 ids 집합으로 통째로 교체 → `_applySelection()` 호출 → 변경된 항목 집합에 대해 emit (선택 — 본 구현은 일괄 emit 한 번: `{ selectedIds, changedId: null, changedTo: 'bulk' }`). 외부에서 클릭 외 경로로 선택을 강제할 때 사용. 빈 배열은 전체 해제. |

### 페이지 연결 사례

```
[페이지 — 다중 필터 컨트롤]
    │
    └─ fetchAndPublish('segmentInfo', this) 또는 직접 publish
        payload 예: [
          { id: 'sms',   icon: 'sms',   label: 'SMS',   selected: true },
          { id: 'push',  icon: 'notifications', label: 'Push' },
          { id: 'email', icon: 'mail',  label: 'Email', selected: true }
        ]

[SegmentedButtons/Advanced/multiSelect]
    ├─ ListRender가 items 배열을 항목으로 렌더 (이전 항목 전체 replace)
    ├─ _renderSegments가 selected:true 항목들(['sms','email'])을 _selectedIds: Set로 설정
    ├─ _applySelection이 모든 항목에 data-selected + aria-pressed 부여
    └─ CSS .segmented-button-multi__item[data-selected="true"]가 선택 시각(fill 누적/check) 적용

[SegmentedButtons/Advanced/multiSelect]
    └──@segmentMultiSelected──▶ [페이지]
            ├─ payload: { targetInstance, selectedIds: ['sms','email','push'], changedId: 'push', changedTo: 'on' }
            └─ 페이지가 selectedIds 기준으로 다중 필터 적용 + 데이터 재요청

[페이지 — 키보드 단축키 / 전체 해제 등]
    └─ instance.subscriptions.setSelectedSegments.forEach(h => h.call(instance, { response: { ids: [] } }))
        → _setSelectedFromTopic이 _selectedIds = new Set() 설정
        → @segmentMultiSelected: { selectedIds: [], changedId: null, changedTo: 'bulk' } 발행

운영: this.pageDataMappings = [
        { topic: 'segmentInfo',         datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setSelectedSegments', datasetInfo: {...}, refreshInterval: 0 }   // 선택
      ];
      Wkit.onEventBusHandlers({
        '@segmentMultiSelected': ({ selectedIds, changedId, changedTo }) => {
          // selectedIds 기준 분기 (다중 필터/카테고리/채널 등)
        }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | 선택 시각 차별화 (누적 가능) | 도메인 컨텍스트 예 |
|------|---------|---------------------------|------------------|
| `01_refined`     | A: Refined Technical | 선택 항목 각각: 퍼플 그라데이션 fill + 글로우. 비선택은 transparent + muted. 인접 selected가 시각적으로 묶이지 않고 **개별로** 누적 표시(체크박스 의미). | 다중 알람 채널(SMS / Push / Email) — 동시 활성화할 채널 누적 선택 |
| `02_material`    | B: Material Elevated | 선택 항목 각각: secondary container surface(`#C0CAFF`) + 작은 elevation. 비선택은 transparent + 회색 outline. | 다중 카테고리 태그(전자 / 가전 / 도서 / 식품) — 카테고리 누적 적용 |
| `03_editorial`   | C: Minimal Editorial | 선택 항목 각각: outline 두께 2px + serif 체크 마크 prefix + 미세 배경 톤. 비선택은 1px outline + transparent. | 다중 필터 우선순위(latest / popular / featured) — 동시 활성 필터 |
| `04_operational` | D: Dark Operational  | 선택 항목 각각: 시안 fill(`rgba(0,229,255,.16)`) + 시안 ring(`box-shadow: 0 0 0 1px #00E5FF`) + 시안 텍스트. 그룹 컨테이너에 `data-selected-count` 기반 카운트 라벨 표시(운영 임계 동시 활성). | 다중 센서 그룹 표시(temp / pressure / humidity / vibration) — 모니터링 채널 누적 |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, `[data-selected="true"]`(또는 `[aria-pressed="true"]`) 셀렉터로 선택 시각을 분기한다. 선택 변경 시 transition 200~300ms로 부드럽게 시각 전환.
