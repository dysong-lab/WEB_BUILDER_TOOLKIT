# Tables — Advanced / rowSelectable

## 기능 정의

1. **행 좌측 체크박스 셀 + 다중 선택 (`_selectedIds: Set<string>`)** — 각 행 좌측에 영구 체크박스 마커(`.table-rs__cell--check`)를 두고, 0~N개 행이 동시에 selected 가능. 페이로드의 `selected:true` 항목 전체가 초기 selected. `_selectedIds: Set<string>`(rowid 키) 자체 상태가 진실 출처. DOM 에는 `data-selected="true|false"` + `aria-selected="true|false"` 두 채널로 반영.
2. **헤더 selectAll + cascade tri-state (indeterminate 표준)** — 헤더 좌측 첫 셀(`.table-rs__head-cell--check`)에 전체 체크박스(`.table-rs__select-all`)를 두고, 행 selected 종합에 따라 `data-state="checked|unchecked|indeterminate"` 자동 표시. 헤더 클릭 → cascade down: `checked` 또는 `indeterminate` → 모두 해제, `unchecked` → 모두 선택. 항목 클릭 → cascade up: 해당 행만 토글 후 헤더 상태 자동 재계산. 헤더 우측에 카운트 라벨 (`.table-rs__count`, "N / total") 동기 표시. ARIA `role="checkbox"` + `aria-checked="true|false|mixed"` 표준 채널.
3. **행 클릭 vs 체크박스 클릭 분기** — 컨테이너 단일 native click delegator 안에서 ① `e.target.closest(selectAll)` 우선 → cascade-down, ② `e.target.closest(cell--check)` (체크박스 셀 영역) → 해당 행 토글, ③ `e.target.closest(itemid)` (체크박스 셀 외부, 행 본체) → 토글 없이 `@tableRowClicked` 만 발행. 즉, 체크박스 영역만 selection 토글, 행 본체 클릭은 Standard 호환 navigate 의도. (체크박스 영역 클릭은 행 click 이벤트도 함께 트리거되지만 `@tableRowClicked` 위임 발행은 bindEvents 에 위임 — 페이지가 selectedRows 와 분리하여 처리 가능.)
4. **다중 선택 변경 이벤트 (`@rowsSelected`)** — 선택 집합이 변경될 때 `@rowsSelected` 단일 이벤트로 통합 발행. payload: `{ targetInstance, selectedIds: Array, count, totalCount, changedId, changedTo: 'item' | 'bulk' }`. 단일 행 토글 → `changedTo: 'item'`, 헤더 cascade / 외부 강제 → `changedTo: 'bulk'`. 큐 명세대로 별도 selectAll 이벤트는 두지 않음(payload 의 `changedTo === 'bulk'` 로 분기).
5. **행 클릭 호환 (Standard 호환 시그니처 유지)** — `@tableRowClicked` 도 함께 발행 (bindEvents 위임). 페이지가 row 본문 클릭 시 상세 진입 / navigate 등을 수행할 수 있도록 Standard 시그니처 유지. `@rowsSelected` 와 직교 — 페이지가 둘 다 사용 가능.
6. **외부 publish 로 선택 강제 변경** — `setSelectedRows` 토픽 publish (`{ ids: [...] }`) 시 외부에서 selected 집합 통째 강제 지정. 빈 배열 허용(전체 해제). `clearSelection` 토픽도 별도 제공(편의 — `setSelectedRows({ ids: [] })` 와 동일 효과). 두 경로 모두 `@rowsSelected` `changedTo: 'bulk'` 1회 emit. 키보드 단축키, 액션바, 라우트 변경 등 클릭 외 경로용.

> **Standard 와의 분리 정당성**:
> - **새 자체 상태 2종** — `_selectedIds: Set<string>`(다중 선택 누적), `_groupClickHandler`(beforeDestroy listener 정확 제거용 bound ref). Standard 는 stateless.
> - **자체 메서드 8종** — `_renderRows` / `_handleClick` / `_setSelected` / `_handleSelectAll` / `_applySelection` / `_recomputeHeader` / `_setSelectedFromTopic` / `_clearSelection`. Standard 는 자체 메서드 0종.
> - **HTML 구조 변경 — 헤더 + selectAll 셀 + check 셀 추가 + count 라벨** — Standard 는 5컬럼(col1~col5)만. rowSelectable 은 6컬럼(check + col1~col5) — `.table-rs__head-cell--check`(헤더 selectAll + count) + `.table-rs__cell--check`(행 좌측 체크박스 셀) 추가. 클래스 prefix `table-rs__*` 로 다른 변형(`table__`, `table-cr__`, `table-fh__`, `table-sc__`, `table-vs__`)과 분리.
> - **새 토픽 2종** — `setSelectedRows`, `clearSelection`. Standard 는 `tableRows` 1종.
> - **새 이벤트 1종** — `@rowsSelected` (selectedIds + count + totalCount + changedId + changedTo 명시 payload). `@tableRowClicked` 는 Standard 호환 유지.
> - **헤더 tri-state cascade native click delegator** — 컨테이너 단일 listener 로 selectAll 클릭(cascade-down) / check 셀 클릭(단일 토글) / 행 본체 클릭(토글 없음) 3분기. Standard 는 사용 안 함.
>
> 위 6축은 동일 register.js 로 표현 불가 → Standard 내부 variant 로 흡수 불가.

> **Lists/Advanced/multiSelect 차용 + 차이**: multiSelect 의 `_selectedIds: Set + ListRender + 헤더 cascade tri-state + native input.indeterminate + data-state 이중 채널 + 명시 payload emit` 패턴 그대로 차용. 차이는 ① **컴포넌트 도메인** (list row → table row), ② **HTML 구조** (단일 컬럼 row → 6컬럼 grid row, 체크박스를 첫 컬럼 셀로 통합), ③ **클릭 분기 추가** (multiSelect 는 행 어디든 클릭 시 토글 — 행 본체 = selection. rowSelectable 은 큐 핵심 의미대로 **체크박스 영역만 토글, 행 본체 클릭은 토글 없이 navigate 의도**), ④ 이벤트 이름 `@listMultiSelected` → `@rowsSelected`, ⑤ payload `changedTo` 값이 `'on'|'off'|'bulk'` 3종 → `'item'|'bulk'` 2종(테이블 도메인은 단일/일괄 분기로 충분, 페이지 핸들러 단순화).

> **Tables/Advanced/columnResize 직전 답습**: register.js top-level 평탄, 자체 상태/메서드/이벤트/토픽 분리, preview `<script src>` 5단계 깊이 verbatim 복사, demo-label/hint 도메인 컨텍스트 명시.

> **filterableHeader / sortableColumn / virtualScroll / columnResize 와의 직교성**: virtualScroll = viewport(스크롤 진실), sortableColumn = 행 순서(정렬 진실), filterableHeader = 행 가시성(필터 진실), columnResize = 컬럼 width(layout 진실), rowSelectable = 행 선택 집합(selection 진실). 다섯 변형 모두 서로 다른 축 — 독립적이다. 동일한 ListRenderMixin 토대 + Standard 호환 KEY(`rowid`/`col1~col5`) 공유.

> **MD3 / 도메인 근거**: MD3 Data tables(MD1 정의)는 "Selection" 을 표준 인터랙션 중 하나로 명시(첫 컬럼에 체크박스 + 헤더 전체 선택 + 다중 선택 후 일괄 작업 — Gmail / GitHub / 모든 admin 패널 표준). 모든 모던 테이블 라이브러리(ag-grid `rowSelection: 'multiple'`, Tabulator `selectable: true`, Material Web Data Table `multiselectable`)가 동일 패턴. 실사용: ① **알람/이벤트 다중 선택 → 일괄 ACK/삭제** (운영 콘솔), ② **이메일 인박스 다중 선택 → 일괄 보관/삭제/라벨** (Gmail), ③ **사용자 다중 선택 → 일괄 권한 변경** (admin 패널), ④ **트랜잭션 다중 선택 → 일괄 reconcile / 환불** (재무 콘솔).

---

## 구현 명세

### Mixin

ListRenderMixin (행 데이터 렌더링 — Mixin 은 selection 인지 X) + 자체 메서드 8종(`_renderRows` / `_handleClick` / `_setSelected` / `_handleSelectAll` / `_applySelection` / `_recomputeHeader` / `_setSelectedFromTopic` / `_clearSelection`).

> **신규 Mixin 생성 금지** — 큐 설명에 "selectedRows set, @rowsSelected" 명시. SKILL 규칙상 본 루프에서 새 Mixin 을 만들지 않는다. ListRenderMixin 은 행 배열을 받아 그대로 N 개 grid row 를 렌더하고(selection 은 인지 X), selection 누적 · 헤더 cascade · DOM 갱신 · 명시 emit 은 컴포넌트 자체 메서드가 전담한다. (`_selectedIds: Set` 패턴이 Cards/selectable + Lists/multiSelect + SegmentedButtons/multiSelect + rowSelectable 누적 — `SelectionMixin` 일반화 검토 후보 — 반환 메모만, SKILL 회귀 규율).

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| group         | `.table-rs`                       | 그룹 컨테이너 — `role="group"`, `data-selected-count` dataset 부착 |
| header        | `.table-rs__header`               | 헤더 영역 (전체 체크박스 + 라벨 + 카운트). |
| selectAll     | `.table-rs__select-all`           | 헤더 전체 체크박스 root — `data-state="checked\|unchecked\|indeterminate"` + click delegator 의 cascade-down 트리거. ARIA `role="checkbox"` + `aria-checked`. |
| selectAllInput| `.table-rs__select-all-input`     | 헤더 native `<input type="checkbox">` — `.indeterminate` / `.checked` DOM property 동기화 (a11y). |
| count         | `.table-rs__count`                | 선택 카운트 표시 (`N / total`). `_applySelection` 이 textContent 갱신. |
| headRow       | `.table-rs__head-row`             | 헤더 행 — selectAll 이 포함된 grid 행. |
| checkCell     | `.table-rs__cell--check`          | 행 좌측 체크박스 셀(체크박스 영역만 토글 — click delegator 분기에 사용). |
| container     | `.table-rs__body`                 | 행이 추가될 부모 (ListRenderMixin 규약). |
| template      | `#table-rs-row-template`          | `<template>` cloneNode 대상 (ListRenderMixin 규약). |
| rowid         | `.table-rs__row`                  | 렌더된 각 row 루트 — `data-rowid` + click 매핑 + `data-selected`/`aria-selected` 부착 (Standard 호환 KEY). |
| col1          | `.table-rs__cell--col1`           | 1번 컬럼 셀 (Standard 호환). |
| col2          | `.table-rs__cell--col2`           | 2번 컬럼 셀. |
| col3          | `.table-rs__cell--col3`           | 3번 컬럼 셀. |
| col4          | `.table-rs__cell--col4`           | 4번 컬럼 셀. |
| col5          | `.table-rs__cell--col5`           | 5번 컬럼 셀. |

> **체크박스 마커 처리**: `.table-rs__check`(행 체크 마커) + `.table-rs__select-all-mark-check`/`.table-rs__select-all-mark-dash`(헤더 체크/dash 마커)는 template/고정 DOM 에 존재하며 `data-selected="true"` / `data-state` 셀렉터에 따라 CSS 로만 표시된다. cssSelectors KEY 로 등록하지 않는다(데이터 바인딩 대상이 아니므로 — 시각 채널 전담).

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| rowid | `rowid` | 행 click 시 `event.target.closest(rowid)?.dataset.rowid` 로 식별. ListRender 가 `data-rowid` 속성을 row 에 자동 설정 (Standard 호환). |

> **note**: selected 는 `datasetAttrs` 에 등록하지 않는다 — selected 정책을 자체 상태(`_selectedIds: Set`)로 흡수한다. 초기 selected 는 `_renderRows` 가 페이로드 `selected:true` 항목들을 `_selectedIds` 에 누적한 뒤 `_applySelection` 이 일괄로 DOM 에 적용.

### itemKey (ListRender)

`rowid` — 일관성 + 향후 `updateItemState` 활용용으로 등록.

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_selectedIds` | `Set<string>` | 현재 선택된 rowid 집합. `_setSelected` / `_setSelectedFromTopic` / `_handleSelectAll` 가 갱신. `_renderRows` 가 초기값 결정. |
| `_groupClickHandler` | `function \| null` | bound `_handleClick` 참조 — beforeDestroy 에서 정확히 removeEventListener. 컨테이너 단일 native click delegator 로 부착하여 selectAll(cascade-down) / check 셀(단일 토글) / 행 본체(토글 없음) 분기. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `tableRows` | `this._renderRows` | `[{ rowid, col1, col2, col3, col4, col5, selected? }]` — 새 batch (이전 누적 X). |
| `setSelectedRows` | `this._setSelectedFromTopic` | `{ ids: [...] }` — 외부에서 강제로 selected 집합 통째로 변경. 빈 배열 허용(전체 해제). |
| `clearSelection` | `this._clearSelection` | 임의 페이로드(무시) — 편의 토픽. `setSelectedRows({ ids: [] })` 와 동일 효과. |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `rowid` (ListRender) | 행 클릭 (체크박스 셀 포함) | `@tableRowClicked` (bindEvents 위임 발행 — Standard 호환 시그니처). 페이로드 `{ targetInstance, event }`. |

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@rowsSelected` | check 셀 토글 1회 / 헤더 cascade-down 1회 / `setSelectedRows` 1회 / `clearSelection` 1회 | `{ targetInstance, selectedIds: Array, count, totalCount, changedId, changedTo: 'item' \| 'bulk' }` |

> **이벤트 발행 분리 이유**: bindEvents 의 위임 발행은 `{ targetInstance, event }` 만 전달하므로 `selectedIds` / `count` / `totalCount` / `changedTo` 가 없다. rowSelectable 은 페이지가 매번 DOM 을 다시 스캔하지 않고도 현재 선택 집합 · 카운트 · 변경 종류를 바로 받을 수 있어야 하므로(예: 다중 선택 후 액션바의 "N개 선택됨" 라벨 / 일괄 작업 활성화) 자체 native delegator 에서 명시 payload 를 emit. customEvents 의 `@tableRowClicked` 위임 발행은 Standard 호환 navigate 채널로 분리 — `@rowsSelected` 와 직교.

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderRows({ response })` | `({response}) => void` | `tableRows` 핸들러. rows 배열을 ListRender selectorKEY(rowid/col1~col5)에 그대로 전달 (Standard 호환). 페이로드의 `selected:true` 항목들을 `_selectedIds` 에 새 Set 으로 재구성(새 batch 는 새 진실). `_applySelection()` 호출하여 DOM 에 반영 + 헤더 tri-state 자동 결정 + 카운트 갱신. emit 없음 (외부 publish 는 통보 없는 silent 동기화). |
| `_handleClick(e)` | `(MouseEvent) => void` | 컨테이너 single native click delegator. ① `e.target.closest(selectAll)` 먼저 검사 → 매치 시 `_handleSelectAll()` 호출. ② `e.target.closest(checkCell)` 검사 → 매치 시 `closest(rowid)` 로 행 식별 후 `_setSelected(rowid, 'toggle')` 호출. ③ 그 외(행 본체) → 토글 없음 (Standard 호환 `@tableRowClicked` 만 bindEvents 위임으로 발행). |
| `_setSelected(id, action)` | `(string, 'on'\|'off'\|'toggle') => void` | 그룹 안에 실제 존재하는 rowid 인지 확인 후 진행(없으면 silent return). `'on'` → Set.add, `'off'` → Set.delete, `'toggle'` → 현재 상태 반대. 변경 없으면 silent return. 변경 시 `_applySelection()` 호출 → `Weventbus.emit('@rowsSelected', {selectedIds, count, totalCount, changedId: id, changedTo: 'item'})`. |
| `_handleSelectAll()` | `() => void` | 헤더 cascade-down. `_recomputeHeader()` 로 현재 state 조회 → `checked` 또는 `indeterminate` 상태에서는 `_selectedIds = new Set()`(전체 해제), `unchecked` 상태에서는 `_selectedIds = new Set(allRowIds)`(전체 선택). `_applySelection()` → `Weventbus.emit('@rowsSelected', {selectedIds, count, totalCount, changedId: null, changedTo: 'bulk'})`. |
| `_applySelection()` | `() => void` | 모든 행 순회하며 `dataset.selected = (set.has(id) ? 'true' : 'false')` + `setAttribute('aria-selected', ...)`. 그룹 컨테이너의 `dataset.selectedCount` 갱신. count textContent (`{n} / {total}`) 갱신. `_recomputeHeader()` 호출하여 헤더 tri-state 자동 결정. |
| `_recomputeHeader()` | `() => 'checked'\|'unchecked'\|'indeterminate'` | 모든 행 rowid 집합과 `_selectedIds` 비교. 항목 0개 → `unchecked` 강제. 모두 selected → `checked`. 모두 unselected → `unchecked`. 일부 selected → `indeterminate`. 헤더 root 에 `data-state` 부착 + native input 의 `.indeterminate` / `.checked` DOM property 동기화 + ARIA `aria-checked="true\|false\|mixed"`. 결정된 state 반환. |
| `_setSelectedFromTopic({ response })` | `({response}) => void` | `setSelectedRows` 토픽 핸들러. `response = { ids: [...] }` 페이로드를 받아 `_selectedIds` 를 페이로드 ids 집합으로 통째로 교체(존재하지 않는 id 는 자동 필터링) → `_applySelection()` 호출 → 일괄 emit 1회: `{selectedIds, count, totalCount, changedId: null, changedTo: 'bulk'}`. 빈 배열은 전체 해제. |
| `_clearSelection()` | `() => void` | `clearSelection` 토픽 핸들러(편의). `_setSelectedFromTopic({ response: { ids: [] } })` 와 동일 효과. |

### 페이지 연결 사례

```
[페이지 — 알람 큐 다중 선택 → 일괄 ACK / 사용자 다중 선택 → 일괄 권한 변경]
    │
    └─ fetchAndPublish('tableRows', this) 또는 직접 publish
        payload 예: [
          { rowid: 'evt-001', col1: '14:32:11', col2: 'gateway-01',  col3: 'NETWORK', col4: 'INFO',  col5: '200', selected: false },
          { rowid: 'evt-002', col1: '14:30:08', col2: 'auth.session', col3: 'AUTH',   col4: 'WARN',  col5: '401', selected: true  },
          { rowid: 'evt-003', col1: '14:35:42', col2: 'db.replicator', col3: 'DB',    col4: 'ERROR', col5: '503', selected: false }
        ]

[Tables/Advanced/rowSelectable]
    ├─ ListRender 가 rows 배열을 grid row 로 렌더 (이전 row 전체 replace)
    ├─ _renderRows 가 selected:true 항목들(['evt-002'])을 _selectedIds: Set 로 설정
    ├─ _applySelection 이 모든 row 에 data-selected + aria-selected 부여 + count "1 / 3"
    └─ _recomputeHeader: 일부 selected → 'indeterminate' → 헤더 input.indeterminate=true + aria-checked="mixed"

[사용자가 'evt-001' 행의 체크박스 셀 클릭]
    ├─ 컨테이너 click delegator → _handleClick → checkCell 매치 → _setSelected('evt-001', 'toggle')
    ├─ Set.add('evt-001'), _selectedIds = {evt-002, evt-001}
    ├─ _applySelection 이 'evt-001' 에 data-selected="true" + aria-selected="true" + count "2 / 3"
    ├─ _recomputeHeader: 일부 → 'indeterminate' (그대로, 라벨 카운트만 변화)
    └─ @rowsSelected: { selectedIds: ['evt-002','evt-001'], count: 2, totalCount: 3, changedId: 'evt-001', changedTo: 'item' }

[사용자가 'evt-001' 행의 본문(체크박스 외 영역) 클릭]
    ├─ 컨테이너 click delegator → _handleClick → selectAll/checkCell 매치 X → return
    ├─ bindEvents 위임 → @tableRowClicked { event, targetInstance } 발행 (Standard 호환)
    └─ 페이지가 row 본문 클릭으로 상세 진입 / navigate (selection 변화 없음)

[사용자가 헤더 전체 체크박스 클릭 (현재 indeterminate)]
    ├─ click delegator → _handleSelectAll
    ├─ 현재 'indeterminate' → 전체 해제: _selectedIds = new Set()
    ├─ _applySelection 이 모든 row 에 data-selected="false" + count "0 / 3"
    ├─ _recomputeHeader: 모두 unselected → 'unchecked' (헤더 input.checked=false, indeterminate=false, aria-checked="false")
    └─ @rowsSelected: { selectedIds: [], count: 0, totalCount: 3, changedId: null, changedTo: 'bulk' }

[페이지 — 키보드 단축키(Cmd+A 전체 선택) / 액션바의 "전체 해제"]
    └─ instance._clearSelection({ response: null })
        → _clearSelection() → _selectedIds = new Set()
        → @rowsSelected: { selectedIds: [], count: 0, totalCount: 3, changedId: null, changedTo: 'bulk' }

운영: this.pageDataMappings = [
        { topic: 'tableRows',       datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setSelectedRows', datasetInfo: {...}, refreshInterval: 0 }   // 선택
      ];
      Wkit.onEventBusHandlers({
        '@rowsSelected': ({ selectedIds, count, totalCount, changedId, changedTo }) => {
          // selectedIds 기준 액션바 상태 갱신 (선택 카운트, 일괄 ACK/삭제 활성화)
          // changedTo === 'bulk' 시 일괄 갱신, 'item' 시 단일 변경 효율 처리
        },
        '@tableRowClicked': ({ event, targetInstance }) => {
          // 행 본문 클릭 → 상세 진입 / navigate (selection 과 직교)
        }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | selected/header 시각 차별화 (cascade tri-state) | 도메인 컨텍스트 예 |
|------|---------|------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 / 그라디언트 호버 / Pretendard / 8/20px 모서리. selected row: 퍼플 fill(linear-gradient) + 글로우 outline + 체크 V 표시. 헤더: indeterminate 시 가로 dash bar(2px stroke), checked 시 V, unchecked 시 빈 box. | **이벤트/알람 큐 다중 선택 → 일괄 ACK** (시간/대상/카테고리/상태/값 — 다중 선택 후 운영 콘솔에서 일괄 처리) |
| `02_material`    | B: Material Elevated | 라이트 / elevation shadow / Pretendard+Roboto / 12px 모서리. selected row: secondary container surface(`#E8DEF8`) + Material 체크 마커. 헤더: indeterminate 시 Material 표준 dash, checked 시 흰 V on `#6750A4` fill. | **고객 다중 선택 → 일괄 플랜 변경/이메일** (이름/이메일/지역/플랜/MRR — admin 패널 일괄 작업) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 / DM Serif 헤드라인 / 샤프 구분선. selected row: outline 1.5px 두꺼운 다크 갈색 + serif 체크 마크 prefix + 미세 배경 톤. 헤더: 1px outline + serif italic dash. | **카탈로그/문헌 일괄 추가** (연도/저자/제목/장르/페이지 — 추천 책장 일괄 추가) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 시안 / IBM Plex / 각진 2-4px 모서리. selected row: 시안 ring(`box-shadow: 0 0 0 1px #4DD0E1`) + 시안 fill(`rgba(77,208,225,.12)`) + 시안 체크. 헤더: 시안 dash bar(MONO 2px stroke) on indeterminate, 시안 V on checked. | **알람 큐 다중 선택 → 일괄 ACK** (시각/프로브/사이트/상태/값 — 운영 콘솔 누적 알람 다중 처리) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, `[data-selected="true"]`(행) + `[data-state="checked\|unchecked\|indeterminate"]`(헤더) 셀렉터로 시각을 분기. 토글 시 transition 150~250ms 로 부드럽게 시각 전환.

### 결정사항

- **체크박스 채널 영구 표시 채택**: 큐 핵심 의미 그대로 — 행 좌측에 영구 체크박스 셀(첫 컬럼 선행). 모바일 selection 모드(롱프레스 진입)는 별도 변형(향후) — 본 변형은 표준 admin 일괄 처리 UX(Gmail / GitHub / MD3 표준).
- **`@rowsSelected` 1종 통합 발행**: 큐 설명대로 selectedRows set 을 단일 이벤트로 발행. payload `changedTo: 'item' | 'bulk'` 로 페이지 핸들러 분기. (Lists/multiSelect 와 일관)
- **changedTo `'item' | 'bulk'` 2종 (multiSelect 의 `'on'|'off'|'bulk'` 3종 단순화)**: 테이블 도메인은 단일 vs 일괄 분기로 충분 — 페이지가 `selectedIds.length` / `selectedIds.includes(changedId)` 로 on/off 추론 가능. 핸들러 단순화.
- **체크박스 영역만 selection 토글 + 행 본체는 navigate**: 큐 핵심 의미 — "체크박스 클릭만 토글, 행 본체 클릭은 `@tableRowClicked`". multiSelect 와 다른 분기. 행 본체 클릭은 `@tableRowClicked` 만 발행 → 페이지가 상세 진입 / 추가 내비게이션 자유롭게 결정.
- **`@tableRowClicked` 호환 유지**: 페이지가 selection 과 navigate 를 동시에 사용할 수 있도록 Standard 시그니처 유지.
- **헤더 tri-state**: `indeterminate` 진입은 항목 1개 이상 selected 이지만 모두 selected 는 아닌 상태. `_recomputeHeader` 가 `_selectedIds` size 와 전체 rowid 집합 크기를 비교하여 결정. native input.indeterminate(a11y) + data-state(CSS 시각) 두 채널 직교.
- **페이로드 새 batch 는 새 진실**: 새 `tableRows` 페이로드 도착 시 `_selectedIds` 는 페이로드 `selected:true` 기반으로 통째 재구성(이전 누적 X) — Lists/multiSelect 와 일관.
- **클래스 prefix `.table-rs__*`**: Standard / virtualScroll / sortableColumn / filterableHeader / columnResize 와 분리(같은 페이지 공존 시 CSS 충돌 X).
- **선택 셀(check)은 cssSelectors KEY 로 등록**: `checkCell` KEY 로 click delegator 가 영역 식별. 6컬럼 grid layout(check + col1~col5).
- **신규 Mixin 생성 금지**: ListRenderMixin + 자체 메서드 8종으로 완결. `_selectedIds: Set` 패턴이 Cards/selectable + Lists/multiSelect + SegmentedButtons/multiSelect + rowSelectable 누적 — `SelectionMixin` 일반화 검토 후보(반환 메모만, SKILL 회귀 규율).

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions / customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서 (컨테이너 click delegator remove → customEvents 제거 → 구독 해제 → 자체 상태/메서드 null + listRender.destroy)
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Tables/Advanced/rowSelectable/preview/...html` → `../`를 5번 = columnResize 동일 verbatim 복사)
