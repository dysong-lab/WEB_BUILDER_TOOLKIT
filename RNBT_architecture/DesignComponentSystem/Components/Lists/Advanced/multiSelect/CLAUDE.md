# Lists — Advanced / multiSelect

## 기능 정의

1. **리스트 항목 동적 렌더 (Standard 호환 KEY)** — `listItems` 토픽으로 수신한 배열(`[{itemid, leading?, headline, supporting?, selected?}]`)을 ListRenderMixin이 `<template>` cloneNode로 N개 행으로 렌더한다. 각 행 좌측에 영구 체크박스 마커가 template에 고정되어 있어 selected/unselected를 시각화한다. cssSelectors KEY는 Standard 호환(itemid/leading/headline/supporting).
2. **다중 선택(체크박스 의미론) — `_selectedIds: Set`** — 그룹 내 0~N개 항목이 동시에 selected 가능. 항목 본문 / 체크박스 / 어느 자식을 클릭해도 해당 항목만 토글되고 나머지는 영향 없음(누적). 초기 상태는 페이로드의 `selected:true` 항목 전체를 selected로 설정. `_selectedIds: Set<string>` 자체 상태가 진실 출처. DOM에는 `data-selected="true|false"` + `aria-selected="true|false"` 두 채널로 반영(시각/a11y 직교).
3. **헤더 전체 선택 + indeterminate (cascade tri-state)** — 헤더에 전체 체크박스(`.list-ms__select-all`)를 두고, 항목 selected 종합에 따라 `data-state="checked|unchecked|indeterminate"` 자동 표시(전체 모두 선택→checked, 모두 해제→unchecked, 일부만 선택→indeterminate). 헤더 클릭 → cascade down: `checked` 또는 `indeterminate` 상태에서는 모두 해제, `unchecked` 상태에서는 모두 선택. 항목 클릭 → cascade up: 해당 항목만 토글 후 헤더 상태 자동 재계산. 헤더에는 selected count 라벨 (`.list-ms__count`, "N / total") 동기 표시.
4. **다중 선택 변경 이벤트 (`@listMultiSelected`)** — 선택 집합이 변경될 때 `@listMultiSelected` 1종으로 통합 발행. payload: `{ targetInstance, selectedIds: Array, count, totalCount, changedId, changedTo: 'on' \| 'off' \| 'bulk' }`. 헤더 cascade 일괄 토글 / 항목 단일 토글 / 외부 강제 변경 모두 동일 이벤트로 발행 (별도 `@listSelectAll`/`@listSelectNone`을 만들지 않음 — 페이로드의 `changedTo === 'bulk'`로 분기 가능, 페이지 핸들러 단순화).
5. **항목 클릭 호환 (Standard와 동일)** — `@listItemClicked`도 함께 발행 (bindEvents 위임). 페이지가 다른 동작(상세 진입, navigate)을 선택할 수 있도록 Standard 시그니처 유지. 단, 본 변형의 주 인터랙션은 selection 토글 — 페이지가 `@listItemClicked`를 통해 navigate를 수행하면 선택과 navigate가 동시에 일어나는 의도적 UX(Gmail 다중 선택 후 본문 클릭 = 선택 + 본문 미리보기).
6. **외부 publish로 선택 강제 변경** — `setSelectedItems` 토픽 publish 시 `{ ids: [...] }` 페이로드로 외부에서 selected 집합 통째 강제 지정 (키보드 단축키, 액션바, 라우트 변경, "전체 선택"/"전체 해제" 버튼 등 클릭 외 경로). 빈 배열 허용(전체 해제). `clearSelection` 토픽도 별도 제공(편의 — `setSelectedItems({ ids: [] })`와 동일 효과). 두 경로 모두 `@listMultiSelected` `changedTo: 'bulk'` 1회 emit.

> **Standard와의 분리 정당성**:
> - **새 자체 상태 2종** — `_selectedIds: Set<string>`(다중 선택 누적), `_groupClickHandler`(beforeDestroy listener 정확 제거용 bound ref). Standard는 stateless.
> - **자체 메서드 7종** — `_renderItems` / `_handleSelect` / `_setSelected` / `_applySelection` / `_setSelectedFromTopic` / `_clearSelection` / `_recomputeHeader`. Standard는 자체 메서드 0종.
> - **HTML 구조 변경 — 헤더 + outer/list 3요소 + template 내부 체크 마커** — Standard는 `.list__items` 단일 컨테이너. multiSelect는 `.list-ms`(그룹) + `.list-ms__header`(헤더 영역, 전체 체크박스 + 라벨 + 카운트) + `.list-ms__items`(ListRender container) + template 내부 `.list-ms__check`(체크 마커 시각 채널 — KEY 등록 X). 클래스 prefix `list-ms__*`로 분리(`list__*` / `list-inf__*` 충돌 방지).
> - **새 토픽 3종** — `setSelectedItems`, `clearSelection`. Standard는 `listItems` 1종.
> - **새 이벤트 1종** — `@listMultiSelected` (selectedIds + count + totalCount + changedId + changedTo 명시 payload). `@listItemClicked`는 Standard와 호환 유지.
> - **헤더 tri-state cascade native click delegator** — 헤더 클릭 일괄 토글 + 항목 클릭 단일 토글 + 헤더 자동 재계산 + DOM `data-selected`/`aria-selected`/`data-state` 갱신을 한 cycle에 묶음. Standard는 사용 안 함.
>
> 위 6축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.

> **Cards/Advanced/selectable과 차용 + 차이**: selectable의 `_selectedIds: Set + ListRender + ARIA + group dataset + 자체 native click delegator + Weventbus 명시 emit` 패턴을 그대로 차용. 차이는 ① **헤더 전체 선택(cascade tri-state)** 추가 — selectable은 헤더 없이 평면 다중 선택, multiSelect는 헤더 영역에 `data-state="checked|unchecked|indeterminate"` 자동 종합 + cascade down(헤더 → 모든 항목), ② 도메인 단위(카드 → 리스트 항목) 변경, ③ 이벤트 페이로드에 `count` / `totalCount` 추가(헤더 카운트 라벨 + 페이지의 액션바 카운트 직접 사용용).

> **Checkbox/Advanced/indeterminate와 차용 + 차이**: indeterminate의 `cascade tri-state(자식 종합 → 부모 자동 / 부모 클릭 → 자식 일괄) + native input.indeterminate + data-state 이중 채널 + Map<id, boolean>` 패턴을 차용한다. 차이는 ① **자식 데이터 모델이 평면 단일 페이로드(`listItems`, Lists Standard 호환 KEY)** — indeterminate는 `{parent, children}` 중첩 구조. ② **`Set` 사용**(selectable과 일관성) — indeterminate가 `Map<id, boolean>`을 쓰는 이유는 cascade down 시 자식 명시적 false도 보존하기 위함이지만, multiSelect는 페이로드 자체에 모든 `itemid`가 명시되므로 Set으로 충분. 헤더 cascade는 `_selectedIds`와 `appendElement.querySelectorAll(item)`의 itemid 집합을 비교하여 결정. ③ 헤더는 ARIA `role="checkbox"` + `aria-checked="true|false|mixed"` 표준 채널 사용.

> **SegmentedButtons/Advanced/multiSelect와 차이 (1줄 핵심)**: SegmentedButtons/multiSelect는 **세그먼트 버튼 항목**(작은 inline button, `aria-pressed`, `@segmentMultiSelected`)의 다중 선택, Lists/multiSelect는 **리스트 행**(MD3 리스트 row, `aria-selected`, `@listMultiSelected`)의 다중 선택 + 헤더 전체 선택. 패턴(`_selectedIds: Set` + 자체 click delegator + 명시 emit)은 동일하지만 ① 헤더 cascade가 추가됨, ② 도메인 단위 (button → list row) 다름, ③ ARIA 시그니처 다름.

> **infiniteScroll과의 직교성 (1줄 핵심)**: infiniteScroll은 **페이징 데이터 수집**(IntersectionObserver + @loadMore + appendListItems), multiSelect는 **다중 선택 인터랙션**(_selectedIds Set + 헤더 cascade + @listMultiSelected). 두 변형은 데이터 흐름과 인터랙션 책임이 완전히 직교 — 한 컴포넌트에서 둘 다 강제하면 register.js가 이중 충돌(상태/이벤트/native event 중복) → 별 변형으로 분리. 페이지가 둘이 동시에 필요하면 합성 변형(`infiniteMultiSelect` 등, 향후 큐 후보)이 별도 필요.

> **MD3 / 도메인 근거**: MD3 Lists의 다중 선택 패턴은 모바일 메일/파일/태스크/알림 앱에서 표준화된 인터랙션이다. 실사용 예: ① **이메일 다중 선택 후 일괄 처리** (Gmail 인박스 다중 선택 → 보관/삭제/라벨), ② **파일 다중 선택 후 일괄 작업** (모바일 파일 매니저 → 이동/공유/삭제), ③ **할 일 다중 선택 후 일괄 완료/이관** (Todoist/Apple Reminders), ④ **알림 다중 선택 후 일괄 읽음 처리** (시스템 알림 센터), ⑤ **연락처/멤버 다중 선택 후 그룹 추가** (Contacts 앱). 모든 실사용 케이스에서 **헤더 전체 선택 + indeterminate**는 표준 UX이며(WAI-ARIA `aria-checked="mixed"` 표준), 본 변형이 그 표준을 차용.

---

## 구현 명세

### Mixin

ListRenderMixin (배열 항목 렌더 — Mixin은 selection 인지 X) + 자체 메서드(`_renderItems` / `_handleSelect` / `_setSelected` / `_applySelection` / `_setSelectedFromTopic` / `_clearSelection` / `_recomputeHeader`).

> **신규 Mixin 생성 금지** — 큐 설명에 "selectedItems 배열, @listMultiSelected" 명시. SKILL 규칙상 본 루프에서 새 Mixin을 만들지 않는다. ListRenderMixin은 페이로드 배열을 그대로 N개 row로 렌더하고(selection은 인지하지 않음), selection 누적·헤더 cascade·DOM 갱신·명시 emit은 컴포넌트 자체 메서드가 전담한다. (selectable + indeterminate + multiSelect의 `_selectedIds: Set` 패턴이 누적되면 `SelectionMixin` 일반화 검토 후보 — 반환 메모만, SKILL 회귀 규율).

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| group         | `.list-ms`                       | 그룹 컨테이너 — `role="group"`, `data-selected-count` dataset 부착 |
| header        | `.list-ms__header`               | 헤더 영역 (전체 체크박스 + 라벨 + 카운트). 자체 native click delegator의 cascade-down 분기 영역. |
| selectAll     | `.list-ms__select-all`           | 헤더 전체 체크박스 root — `data-state="checked\|unchecked\|indeterminate"` + click delegator의 cascade-down 트리거. ARIA `role="checkbox"` + `aria-checked="true\|false\|mixed"`. |
| selectAllInput| `.list-ms__select-all-input`     | 헤더 native `<input type="checkbox">` — `.indeterminate` / `.checked` DOM property 동기화 (a11y). |
| selectAllLabel| `.list-ms__select-all-label`     | 헤더 라벨 텍스트 ("전체 선택" 등 페르소나별 문구). |
| count         | `.list-ms__count`                | 선택 카운트 표시 (`N / total`). `_applySelection`이 textContent 갱신. |
| container     | `.list-ms__items`                | 항목이 추가될 부모 (ListRenderMixin 규약) — click 위임 부착 대상. |
| template      | `#list-ms-item-template`         | `<template>` cloneNode 대상 (ListRenderMixin 규약). |
| itemid        | `.list-ms__item`                 | 렌더된 각 row 루트 — `data-itemid` + click 매핑 + `data-selected`/`aria-selected` 부착 (Standard 호환 KEY). |
| leading       | `.list-ms__leading`              | 선행 요소 (아이콘/이모지) — Standard 호환 KEY. |
| headline      | `.list-ms__headline`             | 헤드라인 텍스트 — Standard 호환 KEY. |
| supporting    | `.list-ms__supporting`           | 보조 텍스트 — Standard 호환 KEY. |

> **체크 마커 처리**: `.list-ms__check`(항목 체크 마커) + `.list-ms__select-all-mark-check`/`.list-ms__select-all-mark-dash`(헤더 체크/dash 마커)는 template/고정 DOM에 존재하며 `data-selected="true"` / `data-state` 셀렉터에 따라 CSS로만 표시된다. cssSelectors KEY로 등록하지 않는다(데이터 바인딩 대상이 아니므로 — 시각 채널 전담).

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| itemid | `itemid` | 항목 click 시 `event.target.closest(itemid)?.dataset.itemid`로 식별. ListRender가 `data-itemid` 속성을 row에 자동 설정 (Standard 호환). |

> **note**: selected는 `datasetAttrs`에 등록하지 않는다 — selected 정책을 자체 상태(`_selectedIds: Set`)로 흡수하므로 ListRender의 데이터 바인딩 경로에서는 selected를 다루지 않는다. 초기 selected는 `_renderItems`가 페이로드 `selected:true` 항목들을 `_selectedIds`에 누적한 뒤 `_applySelection`이 일괄로 DOM에 적용한다.

### itemKey

`itemid` (ListRender) — 일관성 + 향후 `updateItemState` 활용용으로 등록.

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_selectedIds` | `Set<string>` | 현재 선택된 itemid 집합. `_setSelected`/`_setSelectedFromTopic`/`_handleSelect`가 갱신. `_renderItems`가 초기값 결정. |
| `_groupClickHandler` | `function \| null` | bound `_handleSelect` 참조 — beforeDestroy에서 정확히 removeEventListener 하기 위해 보관. 컨테이너 단일 native click delegator로 부착하여 헤더(cascade-down) / 항목(단일 토글) 분기. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `listItems` | `this._renderItems` | `[{ itemid, leading?, headline, supporting?, selected? }]` — 새 batch (이전 누적 X). 새 검색/필터/페이지 컨텍스트 진입 시 사용. |
| `setSelectedItems` | `this._setSelectedFromTopic` | `{ ids: [...] }` — 외부에서 강제로 selected 집합 통째로 변경. 빈 배열 허용(전체 해제). |
| `clearSelection` | `this._clearSelection` | 임의 페이로드(무시) — 편의 토픽. `setSelectedItems({ ids: [] })`와 동일 효과. |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `itemid` (ListRender) | 항목 클릭 | `@listItemClicked` (bindEvents 위임 발행 — Standard 호환 시그니처). 페이로드 `{ targetInstance, event }`. |
| click | `selectAll` (ListRender) | 헤더 전체 체크박스 클릭 | `@listMultiSelected` (bindEvents 위임 발행 — Weventbus 채널 등록 보장 의미. 단, 페이지가 사용하는 selectedIds/count 명시 페이로드는 자체 delegator가 추가 발행). |

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@listMultiSelected` | 항목 토글 1회 / 헤더 cascade-down 1회 / `setSelectedItems` 1회 / `clearSelection` 1회 | `{ targetInstance, selectedIds: Array, count, totalCount, changedId, changedTo: 'on' \| 'off' \| 'bulk' }` |

> **이벤트 발행 분리 이유**: bindEvents의 위임 발행은 `{ targetInstance, event }`만 전달하므로 `selectedIds` / `count` / `totalCount` / `changedTo` 가 없다. multiSelect는 페이지가 매번 DOM을 다시 스캔하지 않고도 현재 선택 집합·카운트·변경 종류를 바로 받을 수 있어야 하므로(예: 다중 선택 후 액션바의 "N개 선택됨" 라벨 / 일괄 작업 활성화 / cascade일 경우 일괄 갱신 / 단일일 경우 효율 처리) 자체 native delegator에서 명시 payload를 emit한다. customEvents의 위임 발행은 본 변형에서는 trigger 알림 의미 + Weventbus 채널 등록 보장 의미로 유지하되, 페이지가 사용하는 페이로드는 명시 emit이 우선한다.

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderItems({ response })` | `({response}) => void` | `listItems` 핸들러. items 배열을 ListRender selectorKEY(itemid/leading/headline/supporting)에 그대로 전달 (Standard 호환). 페이로드의 `selected:true` 항목들을 `_selectedIds`에 새 Set으로 재구성(새 batch는 새 진실). `_applySelection()` 호출하여 DOM에 반영 + 헤더 tri-state 자동 결정 + 카운트 갱신. emit 없음 (외부 publish는 통보 없는 silent 동기화). |
| `_handleSelect(e)` | `(MouseEvent) => void` | 컨테이너 single native click delegator. `e.target.closest(selectAll)` 먼저 검사 → 매치 시 `_handleSelectAll()` 호출. 그 외 `e.target.closest(itemid)` 검사 → 매치 시 `_setSelected(id, 'toggle')` 호출. (헤더가 항목보다 우선되도록 헤더 매칭 우선) |
| `_setSelected(id, action)` | `(string, 'on'\|'off'\|'toggle') => void` | 그룹 안에 실제 존재하는 itemid인지 확인 후 진행(없으면 silent return). `'on'` → Set.add, `'off'` → Set.delete, `'toggle'` → 현재 상태 반대. 변경 없으면 silent return. 변경 시 `changedTo` 결정 후 `_applySelection()` 호출 → `Weventbus.emit('@listMultiSelected', {selectedIds, count, totalCount, changedId: id, changedTo: 'on'\|'off'})`. |
| `_handleSelectAll()` | `() => void` | 헤더 cascade-down. `_recomputeHeader()`로 현재 state 조회 → `checked` 또는 `indeterminate` 상태에서는 `_selectedIds = new Set()`(전체 해제), `unchecked` 상태에서는 `_selectedIds = new Set(allItemIds)`(전체 선택). `_applySelection()` → `Weventbus.emit('@listMultiSelected', {selectedIds, count, totalCount, changedId: null, changedTo: 'bulk'})`. |
| `_applySelection()` | `() => void` | 모든 항목 순회하며 `dataset.selected = (set.has(id) ? 'true' : 'false')` + `setAttribute('aria-selected', ...)`. 그룹 컨테이너의 `dataset.selectedCount` 갱신. count textContent (`{n} / {total}`) 갱신. `_recomputeHeader()` 호출하여 헤더 tri-state 자동 결정. |
| `_recomputeHeader()` | `() => 'checked'\|'unchecked'\|'indeterminate'` | 모든 항목 itemid 집합과 `_selectedIds` 비교. 항목 0개 → `unchecked` 강제. 모두 selected → `checked`. 모두 unselected → `unchecked`. 일부 selected → `indeterminate`. 헤더 root에 `data-state` 부착 + native input의 `.indeterminate` / `.checked` DOM property 동기화 + ARIA `aria-checked="true\|false\|mixed"`. 결정된 state 반환. |
| `_setSelectedFromTopic({ response })` | `({response}) => void` | `setSelectedItems` 토픽 핸들러. `response = { ids: [...] }` 페이로드를 받아 `_selectedIds`를 페이로드 ids 집합으로 통째로 교체(존재하지 않는 id는 자동 필터링) → `_applySelection()` 호출 → 일괄 emit 1회: `{selectedIds, count, totalCount, changedId: null, changedTo: 'bulk'}`. 빈 배열은 전체 해제. |
| `_clearSelection()` | `() => void` | `clearSelection` 토픽 핸들러(편의). `_setSelectedFromTopic({ response: { ids: [] } })`와 동일 효과 — `_selectedIds = new Set()` + `_applySelection()` + bulk emit. |

### 페이지 연결 사례

```
[페이지 — 이메일 다중 선택 / 파일 일괄 작업 / 할 일 일괄 완료 / 알림 일괄 읽음]
    │
    └─ fetchAndPublish('listItems', this) 또는 직접 publish
        payload 예: [
          { itemid: 'mail-001', leading: '✉', headline: 'Q4 보고서 검토 요청', supporting: '김부장 · 2시간 전', selected: false },
          { itemid: 'mail-002', leading: '✉', headline: '3분기 성과 리뷰',     supporting: '인사팀 · 4시간 전', selected: true  },
          { itemid: 'mail-003', leading: '✉', headline: '신규 프로젝트 킥오프', supporting: '프로젝트팀 · 어제',  selected: false }
        ]

[Lists/Advanced/multiSelect]
    ├─ ListRender가 items 배열을 row로 렌더 (이전 row 전체 replace)
    ├─ _renderItems가 selected:true 항목들(['mail-002'])을 _selectedIds: Set로 설정
    ├─ _applySelection이 모든 row에 data-selected + aria-selected 부여 + count "1 / 3"
    └─ _recomputeHeader: 일부 selected → 'indeterminate' → 헤더 input.indeterminate=true + aria-checked="mixed"

[사용자가 'mail-001' row 클릭]
    ├─ 컨테이너 click delegator → _handleSelect → _setSelected('mail-001', 'toggle')
    ├─ Set.add('mail-001'), _selectedIds = {mail-002, mail-001}
    ├─ _applySelection이 'mail-001'에 data-selected="true" + aria-selected="true" + count "2 / 3"
    ├─ _recomputeHeader: 일부 → 'indeterminate' (그대로 indeterminate, 라벨 카운트만 변화)
    └─ @listMultiSelected: { selectedIds: ['mail-002','mail-001'], count: 2, totalCount: 3, changedId: 'mail-001', changedTo: 'on' }

[사용자가 헤더 전체 체크박스 클릭 (현재 indeterminate)]
    ├─ click delegator → _handleSelectAll
    ├─ 현재 'indeterminate' → 전체 해제: _selectedIds = new Set()
    ├─ _applySelection이 모든 row에 data-selected="false" + count "0 / 3"
    ├─ _recomputeHeader: 모두 unselected → 'unchecked' (헤더 input.checked=false, indeterminate=false, aria-checked="false")
    └─ @listMultiSelected: { selectedIds: [], count: 0, totalCount: 3, changedId: null, changedTo: 'bulk' }

[사용자가 헤더 전체 체크박스 다시 클릭 (현재 unchecked)]
    ├─ _handleSelectAll → 전체 선택: _selectedIds = new Set(['mail-001','mail-002','mail-003'])
    ├─ _applySelection → count "3 / 3"
    ├─ _recomputeHeader → 'checked' (헤더 input.checked=true, aria-checked="true")
    └─ @listMultiSelected: { selectedIds: [...], count: 3, totalCount: 3, changedId: null, changedTo: 'bulk' }

[페이지 — 키보드 단축키(Cmd+A 전체 선택) / 액션바의 "전체 해제"]
    └─ instance.subscriptions.clearSelection.forEach(h => h.call(instance, { response: null }))
        → _clearSelection() → _selectedIds = new Set()
        → @listMultiSelected: { selectedIds: [], count: 0, totalCount: 3, changedId: null, changedTo: 'bulk' }

운영: this.pageDataMappings = [
        { topic: 'listItems',        datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setSelectedItems', datasetInfo: {...}, refreshInterval: 0 }   // 선택
      ];
      Wkit.onEventBusHandlers({
        '@listMultiSelected': ({ selectedIds, count, totalCount, changedId, changedTo }) => {
          // selectedIds 기준 액션바 상태 갱신 (선택 카운트, 일괄 작업 활성화)
          // changedTo === 'bulk' 시 일괄 갱신, 'on'/'off' 시 단일 변경 효율 처리
        },
        '@listItemClicked': ({ event, targetInstance }) => {
          // 항목 본문 미리보기 / navigate (선택과 직교)
        }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | selected/header 시각 차별화 (cascade tri-state) | 도메인 컨텍스트 예 |
|------|---------|------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 / 그라디언트 호버 / Pretendard. selected row: 퍼플 fill(linear-gradient) + 글로우 outline + 체크 V 표시. 헤더: indeterminate 시 가로 dash bar(2px stroke 두꺼움), checked 시 V, unchecked 시 빈 box. | **이메일 다중 선택 → 일괄 보관/삭제** (인박스 행 다중 선택, 헤더 indeterminate로 부분 선택 시각화) |
| `02_material`    | B: Material Elevated | 라이트 / elevation shadow / Roboto. selected row: secondary container surface(`#E8DEF8`) + Material 체크 마커. 헤더: indeterminate 시 Material 표준 dash, checked 시 흰 V on `#6750A4` fill. | **파일 다중 선택 → 일괄 이동/공유** (파일 매니저 리스트, MD3 표준 다중 선택) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 / DM Serif 헤드라인 / 미니멀 구분선. selected row: outline 1.5px 두꺼운 다크 갈색 + serif 체크 마크 prefix + 미세 배경 톤. 헤더: 1px outline + serif italic dash. | **추천 기사 일괄 추가** (읽기 목록 다중 추가, "Selected 3 of 12" italic 표기) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 / 시안 ring / IBM Plex Mono. selected row: 시안 ring(`box-shadow: 0 0 0 1px #4DD0E1`) + 시안 fill(`rgba(77,208,225,.12)`) + 시안 체크. 헤더: 시안 dash bar(MONO 2px stroke) on indeterminate, 시안 V on checked. 그룹 컨테이너에 `data-selected-count` 기반 ACTIVE 카운트 운영 라벨. | **알람 큐 다중 선택 → 일괄 ACK** (운영 콘솔 누적 알람 다중 처리) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, `[data-selected="true"]`(항목) + `[data-state="checked\|unchecked\|indeterminate"]`(헤더) 셀렉터로 시각을 분기. 토글 시 transition 150~250ms로 부드럽게 시각 전환.

### 결정사항

- **체크박스 채널 (a) 영구 표시 채택**: 큐 핵심 의미 권장(a) 영구 체크박스 + 헤더 전체 선택. 모바일 친화 selection 모드(b)는 별도 변형(향후) — 본 변형은 표준 일괄 처리 UX(Gmail/MD3 표준).
- **`@listMultiSelected` 1종 통합 발행**: 큐 설명대로 selectedIds 배열을 단일 이벤트로 발행. `@listSelectAll`/`@listSelectNone` 별도 이벤트는 만들지 않음 — 페이로드의 `changedTo === 'bulk'`로 분기 가능, 페이지 핸들러 단순화. (Cards/selectable + Checkbox/indeterminate 패턴과 일관)
- **`@listItemClicked` 호환 유지**: 페이지가 selection과 navigate를 동시에 사용할 수 있도록 Standard 시그니처 유지. multiSelect의 주 인터랙션은 `@listMultiSelected`.
- **헤더 tri-state**: `indeterminate` 진입은 항목 1개 이상 selected이지만 모두 selected는 아닌 상태. `_recomputeHeader`가 `_selectedIds.size`와 전체 itemid 집합 크기를 비교하여 결정. native input.indeterminate(a11y) + data-state(CSS 시각) 두 채널 직교.
- **페이로드 새 batch는 새 진실**: 새 `listItems` 페이로드 도착 시 `_selectedIds`는 페이로드 `selected:true` 기반으로 통째 재구성(이전 누적 X) — Cards/selectable과 일관. 페이지가 검색/필터/페이지 변경 시 이전 선택은 의도적으로 버린다(필요하면 `setSelectedItems`로 복원).
- **신규 Mixin 생성 금지**: ListRenderMixin + 자체 메서드로 완결. `_selectedIds: Set` 패턴이 selectable + multiSelect + (indeterminate Map) 누적 — `SelectionMixin` 일반화 검토 후보(반환 메모만, SKILL 회귀 규율).
