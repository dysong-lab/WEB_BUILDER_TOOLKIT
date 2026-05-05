# Tables — Advanced / expandableRow

## 기능 정의

1. **행 좌측 chevron(▶) 버튼 — 상세 영역 확장/접힘** — 각 row 의 좌측 첫 컬럼(`.table-er__chevron`) 클릭 시 해당 row 의 detail 영역(`.table-er__detail`)이 펼쳐진다. row 와 detail 은 동일한 그룹 wrapper(`.table-er__group`)로 감싸져 있어 detail 은 항상 row **아래**에 위치(다음 row 와 분리). `_expandedRows: Set<string>` 자체 상태가 단일 진실 출처 — 다중 행 동시 expand 가능. expand 상태는 wrapper 의 `data-expanded="true|false"` 로 표시되어 CSS transition(`max-height` / `opacity`)이 시각 변환을 담당. chevron icon 은 90° 회전(▶ → ▼).
2. **detail 콘텐츠 — `details` 필드 직접 매핑** — `tableRows` 페이로드의 각 row 에 `details` 필드(string)가 포함되며 `_renderRows` 가 이 값을 row 의 detail 영역(`.table-er__detail-text`) textContent 로 직접 셋팅. ListRenderMixin selectorKEY 5종(col1~col5)은 Standard 호환 그대로 유지하고, `details` 만 자체 메서드가 별도 매핑(ListRender 옵션에 `details` KEY 를 추가하지 않는다 — Standard 호환 contract 우선).
3. **다중 expand — `_expandedRows: Set` 진실 출처** — 여러 row 를 동시에 펼칠 수 있다(아코디언 강제 X). 외부에서 단일 expansion 강제하려면 `setExpandedRows` 토픽으로 `{ ids: ['sku-002'] }` publish.
4. **외부 강제 expand/collapse — `setExpandedRows` 토픽** — 외부 publish 로 expand 상태를 일괄 동기화 (`{ ids: [...] }` — 새 set). 빈 배열 publish 시 전체 collapse. 페이지가 "전체 펼침" 컨트롤이나 검색 결과 자동 펼침을 구현 가능.
5. **expand/collapse 이벤트 분리 발행** — 상태가 실제로 바뀐 시점에만 `@rowExpanded`(collapsed → expanded) / `@rowCollapsed`(expanded → collapsed) 1회 발행 (payload: `{ rowid, targetInstance }`). 동일 상태 재요청은 멱등(no emit).
6. **행 본문 클릭 호환 (`@tableRowClicked`)** — group wrapper 클릭은 Standard 호환 `@tableRowClicked` 발행(bindEvents 위임). chevron 도 wrapper 내부이므로 chevron click 시 `@tableRowClicked` 가 함께 발행될 수 있다 — 페이지 핸들러가 `event.target.closest('.table-er__chevron')` 으로 분기하여 무시(inlineEdit 의 "편집 중에도 @tableRowClicked 발행 — 페이지가 무시 가능" 규약과 동일).

> **Standard 와의 분리 정당성**:
> - **새 자체 상태 5종** — `_expandedRows: Set<string>` (단일 진실), `_rowData: Map<rowid, row>` (페이지가 외부 store 동기화 시 참고), `_groupClickHandler` (delegator bound ref). Standard 는 stateless.
> - **자체 메서드 5종** — `_renderRows` / `_handleClick` / `_toggleRow` / `_setExpandedRows` / `_refreshExpandedMarkers`. Standard 는 자체 메서드 0종.
> - **HTML 구조 변경 — group wrapper + chevron + detail 영역 추가** — Standard 는 `.table__row` 만. expandableRow 는 row 를 `.table-er__group` 으로 감싸고 그 내부에 `.table-er__row`(헤더 셀) + `.table-er__detail`(접힘 영역) 2개를 둠. row 좌측에 `.table-er__chevron` 버튼 추가. 클래스 prefix `.table-er__*` 로 다른 변형(`table__`, `table-rs__`, `table-cr__`, `table-fh__`, `table-sc__`, `table-vs__`, `table-ie__`)과 분리.
> - **새 토픽 1종** — `setExpandedRows`. Standard 는 `tableRows` 1종.
> - **새 이벤트 2종** — `@rowExpanded` / `@rowCollapsed`. `@tableRowClicked` 는 Standard 호환 유지.
> - **컨테이너 native click delegator 1종** — chevron 토글과 행 본문 click 을 분기하기 위한 자체 delegator. Standard 는 사용 안 함.
>
> 위 6축은 동일 register.js 로 표현 불가 → Standard 내부 variant 로 흡수 불가.

> **Tables/Advanced/inlineEdit 직전 답습**: register.js top-level 평탄, 자체 상태/메서드/이벤트/토픽 분리, preview `<script src>` 5단계 깊이 verbatim 복사, demo-label/hint 도메인 컨텍스트 명시. native 컨테이너 delegator 패턴(`_groupClickHandler` bound ref + addEventListener) 동일 차용. group wrapper + data-expanded 토글은 Cards/Advanced/expandable 의 `.card[data-expanded]` 패턴 차용.

> **inlineEdit / rowSelectable 와의 직교성**: rowSelectable = 선택 집합(selection 진실), inlineEdit = 셀 값 편집(데이터 진실), expandableRow = 행 펼침 집합(visibility 진실). 세 변형 모두 서로 다른 축. 동일한 ListRenderMixin 토대 + Standard 호환 KEY(`rowid`/`col1~col5`) 공유. (양립 시 prefix 가 다르므로 페이지 내 공존 가능.)

> **MD3 / 도메인 근거**: MD3 Lists 와 Material Web Data Table 모두 "expandable row" 를 표준 인터랙션으로 명시(클릭 시 row 아래 detail 영역 노출). 모든 모던 admin/data 라이브러리(ag-grid `masterDetail`, Tabulator `rowFormatter` + child row, MUI DataGrid `getDetailPanelContent`, Notion DB row peek) 가 동일 패턴. 실사용: ① **주문 항목별 명세 expand**(주문 ID/상품/금액/상태/일자 + 상세는 배송지/메모 — E-commerce admin), ② **알람 row 별 raw payload + ack 메모**(시각/프로브/사이트/상태/임계값 + 상세는 stack trace — 운영 콘솔), ③ **고객 row 별 사용 history**(이름/플랜/지역/MRR + 상세는 결제/계약 메모 — admin), ④ **출판물 row 별 abstract**(연도/저자/제목/장르/페이지 + 상세는 abstract — 사서 도구).

---

## 구현 명세

### Mixin

ListRenderMixin (행 데이터 렌더링 — Mixin 은 expand 인지 X) + 자체 메서드 5종(`_renderRows` / `_handleClick` / `_toggleRow` / `_setExpandedRows` / `_refreshExpandedMarkers`).

> **신규 Mixin 생성 금지** — 큐 설명에 "expandedRows set + detail content" 명시. SKILL 규칙상 본 루프에서 새 Mixin 을 만들지 않는다. ListRenderMixin 은 row 배열을 받아 N 개 group 을 렌더하고(detail 영역 인지 X), chevron click 토글 · `_expandedRows` 갱신 · detail textContent 매핑 · 명시 emit 은 컴포넌트 자체 메서드가 전담.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| group         | `.table-er`                        | 그룹 컨테이너 — `role="group"`. |
| header        | `.table-er__header`                | 헤더 영역 (제목 + expand 카운트). |
| expandLabel   | `.table-er__expand-label`          | 현재 expand 된 row 수 표시 라벨(`expanded: 3`). `_renderRows` / `_toggleRow` / `_setExpandedRows` 가 textContent 갱신. |
| headRow       | `.table-er__head-row`              | 헤더 행. |
| container     | `.table-er__body`                  | row group 이 추가될 부모 (ListRenderMixin 규약). |
| template      | `#table-er-row-template`           | `<template>` cloneNode 대상 (ListRenderMixin 규약). 내부에 group wrapper + row + detail 모두 포함. |
| rowid         | `.table-er__group`                 | 렌더된 각 row group **wrapper** — `data-rowid` + `data-expanded` 토글 대상. ListRender 의 `rowid` selector 가 group wrapper 를 가리킴(detail 까지 wrapper 안에 둠으로써 다중 expand 시 row 와 detail 의 시각적 인접 보장). |
| col1          | `.table-er__cell--col1`            | 1번 컬럼 셀. |
| col2          | `.table-er__cell--col2`            | 2번 컬럼 셀. |
| col3          | `.table-er__cell--col3`            | 3번 컬럼 셀. |
| col4          | `.table-er__cell--col4`            | 4번 컬럼 셀. |
| col5          | `.table-er__cell--col5`            | 5번 컬럼 셀. |

> **chevron / detail textContent 매핑은 자체 메서드 전담**: `.table-er__chevron`(좌측 토글 버튼) + `.table-er__row`(시각적 row 행) + `.table-er__detail`(접힘 컨테이너) + `.table-er__detail-text`(detail 본문 textContent 대상)은 cssSelectors KEY 로 등록하지 않는다 — ListRender 가 직접 데이터 바인딩하지 않으며 `_renderRows` 가 ListRender.renderData 후속 단계에서 직접 매핑/토글한다.

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| rowid | `rowid` | group wrapper 에 부착 — chevron click 시 `closest('.table-er__group')?.dataset.rowid` 로 식별 (Standard 호환). |

### itemKey (ListRender)

`rowid` — 일관성 + 향후 `updateItemState` 활용용.

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_expandedRows` | `Set<string>` | 현재 expand 된 row 의 rowid 집합. 단일 진실 출처. |
| `_rowData` | `Map<string, object>` | 가장 최근 페이로드의 row 객체를 rowid 키로 보관(페이지가 외부 store 동기화 시 참고). |
| `_groupClickHandler` | `function \| null` | bound `_handleClick` — beforeDestroy 정확 제거용. |
| `_erSelectors` | `object` | expandableRow 전용 보조 selector(chevron / row visible / detail / detailText). cssSelectors 에 등록되지 않은 내부 매핑. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `tableRows` | `this._renderRows` | `[{ rowid, col1, col2, col3, col4, col5, details? }]` — 새 batch (이전 누적 X — `_rowData` 통째 재구성, expand 상태는 새 batch 에 존재하는 rowid 만 유지 — 사라진 rowid 는 자동 제거). |
| `setExpandedRows` | `this._setExpandedRows` | `{ ids: ['sku-002', 'sku-005'] }` — 외부에서 expand 상태 일괄 동기화. 빈 배열 허용(전체 collapse). |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `rowid` (ListRender — group wrapper) | 행 본문 클릭(chevron 제외 — `_handleClick` 가 chevron 클릭은 stopPropagation) | `@tableRowClicked` (Standard 호환 — `{ targetInstance, event }`). |

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@rowExpanded` | row 가 collapsed → expanded 전환된 시점 1회 | `{ targetInstance, rowid }` |
| `@rowCollapsed` | row 가 expanded → collapsed 전환된 시점 1회 | `{ targetInstance, rowid }` |

> **이벤트 발행 분리 이유**: bindEvents 위임은 `{ targetInstance, event }` 만 전달 → rowid 가 없다. expandableRow 는 페이지가 매번 DOM 을 다시 스캔하지 않고도 어떤 row 가 펼쳐졌는지 바로 받을 수 있어야 하므로(예: 첫 expand 시 lazy 상세 fetch) 자체 native delegator 에서 명시 payload 를 emit. `@tableRowClicked` 위임 발행은 Standard 호환 navigate 채널로 분리.

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderRows({ response })` | `({response}) => void` | `tableRows` 핸들러. rows 배열을 ListRender selectorKEY(rowid/col1~col5)에 그대로 전달(Standard 호환). 이후 각 group wrapper 의 `.table-er__detail-text` 에 `row.details` 텍스트 매핑. `_rowData` 를 새 Map 으로 통째 재구성. 새 batch 에 존재하지 않는 rowid 는 `_expandedRows` 에서 자동 제거(데이터-시각 일관성). 모든 group wrapper 의 `data-expanded` 와 expandLabel textContent 동기화. emit 없음. |
| `_handleClick(e)` | `(MouseEvent) => void` | 컨테이너 single native click delegator. ① `e.target.closest('.table-er__chevron')` → chevron click 인 경우: `closest('.table-er__group')?.dataset.rowid` 로 rowid 식별 → `_toggleRow(rowid)` 호출. ② chevron 외부 row 본체 / 셀 → no-op (bindEvents 위임이 `@tableRowClicked` 발행). chevron click 도 같은 element 의 click listener 인 bindEvents 위임을 차단하지 못하므로 `@tableRowClicked` 가 함께 발행될 수 있다(페이지가 chevron target 검사로 무시). |
| `_toggleRow(rowid)` | `(string) => void` | 단일 row expand 토글의 단일 진입점(멱등). `_expandedRows` 에 포함되어 있으면 제거 + `@rowCollapsed` 발행, 아니면 추가 + `@rowExpanded` 발행. group wrapper 의 `data-expanded` 갱신 + expandLabel textContent 갱신. 이미 동일 상태면 no-op + no emit. |
| `_setExpandedRows({ response })` | `({response}) => void` | `setExpandedRows` 토픽 핸들러. `response = { ids: [...] }` → 새 Set 으로 교체(이전 set 과 차이만 emit — 추가된 rowid 는 `@rowExpanded`, 제거된 rowid 는 `@rowCollapsed`). 이후 `_refreshExpandedMarkers()` 로 dataset 일괄 동기화. |
| `_refreshExpandedMarkers()` | `() => void` | 모든 group wrapper 를 순회하며 `_expandedRows` 멤버십에 따라 `data-expanded="true|false"` 재계산. expandLabel textContent 도 `_expandedRows.size` 로 갱신. |

### 페이지 연결 사례

```
[페이지 — 주문 명세 / 알람 stack trace / 고객 history / 문헌 abstract]
    │
    └─ fetchAndPublish('tableRows', this) 또는 직접 publish
        payload 예: [
          { rowid: 'sku-001', col1: 'TB-Air-13',  col2: 'Apparel',  col3: 'M', col4: 'In Stock',  col5: '142',
            details: '입고일 2026-04-22 / 공급사 ATX / 위치 W-A-12 / 최근 30일 출고 38' },
          { rowid: 'sku-002', col1: 'TB-Pro-14',  col2: 'Apparel',  col3: 'L', col4: 'Low Stock', col5: '8',
            details: '재주문 임계 10 미만 / 추정 소진 5일 / 발주 PO-0247 미입고' },
          ...
        ]

[Tables/Advanced/expandableRow]
    ├─ ListRender 가 rows 배열을 group wrapper N 개로 렌더 (이전 row 전체 replace)
    ├─ _renderRows 가 각 group 의 .table-er__detail-text 에 row.details 매핑
    ├─ _rowData = Map(rowid → row) 재구성
    ├─ 새 batch 에 없는 rowid 는 _expandedRows 에서 자동 제거

[사용자가 'sku-002' chevron 클릭]
    ├─ _handleClick → chevron 분기 → _toggleRow('sku-002')
    │     ├─ _expandedRows.has('sku-002') === false → 추가
    │     ├─ group wrapper.dataset.expanded = 'true' → CSS transition 으로 detail 영역 펼침
    │     ├─ expandLabel.textContent = 'expanded: 1'
    │     └─ @rowExpanded { rowid: 'sku-002' }
    │   stopPropagation → 행 본문 click 으로 발행되는 @tableRowClicked 차단

[사용자가 'sku-002' chevron 다시 클릭]
    ├─ _toggleRow('sku-002') → _expandedRows.delete('sku-002')
    ├─ wrapper.dataset.expanded = 'false' → 접힘 transition
    └─ @rowCollapsed { rowid: 'sku-002' }

[페이지 — 전체 펼침 / 검색 결과 자동 펼침]
    └─ instance._setExpandedRows({ response: { ids: ['sku-002', 'sku-005'] } })
        → _setExpandedRows
        → 추가/제거 차이만 @rowExpanded / @rowCollapsed 발행
        → _refreshExpandedMarkers 로 모든 group dataset 일괄 동기화

운영: this.pageDataMappings = [
        { topic: 'tableRows',       datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setExpandedRows', datasetInfo: {...}, refreshInterval: 0 }   // 선택
      ];
      Wkit.onEventBusHandlers({
        '@rowExpanded':     ({ rowid }) => { /* lazy 상세 fetch / 분석 트래킹 */ },
        '@rowCollapsed':    ({ rowid }) => { /* 임시 표시 정리 */ },
        '@tableRowClicked': ({ event, targetInstance }) => { /* 행 본문 → 상세 페이지 진입 */ }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | expand 시각 차별화 (chevron · detail 영역) | 도메인 컨텍스트 예 |
|------|---------|------------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 / 그라디언트 / Pretendard / 8/20px 모서리. chevron: 다크 퍼플 fill + 시안 90° 회전(220ms cubic). detail: 다크 퍼플 background gradient + max-height 280ms transition. expandLabel: 시안 ring badge. | **재고 SKU 명세 expand** (제품/카테고리/사이즈/상태/재고수 + detail: 입고일/공급사/위치/30일 출고 — E-commerce admin) |
| `02_material`    | B: Material Elevated | 라이트 / elevation shadow / Pretendard+Roboto / 12px 모서리. chevron: secondary container surface + Material 90° 회전. detail: surface variant fill + Roboto body. expandLabel: filled chip(`#6750A4`). | **고객 history expand** (이름/이메일/지역/플랜/MRR + detail: 가입일/결제 수단/계약 메모 — admin 패널) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 / DM Serif 헤드라인 / 샤프 구분선. chevron: serif italic ▸ → ▾ (transform 360ms ease-out). detail: 여백 + serif italic body. expandLabel: serif italic + underline. | **문헌 abstract expand** (연도/저자/제목/장르/페이지 + detail: abstract — 사서 도구) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 시안 / IBM Plex / 각진 2-4px 모서리. chevron: 시안 ring + Mono ▶ 80ms 회전. detail: dark background + IBM Plex Mono raw payload + tabular-nums. expandLabel: 시안 monospace tag. | **알람 raw payload expand** (시각/프로브/사이트/상태/임계값 + detail: stack trace — 운영 콘솔) |

각 페르소나는 `.table-er__group[data-expanded="true|false"]` 셀렉터로 `.table-er__detail` 의 `max-height` / `opacity` 와 `.table-er__chevron` 의 회전 각도를 동시에 transition. detail 영역 padding/typography 만 페르소나별로 분기.

### 결정사항

- **다중 expand (아코디언 X)**: 큐 핵심 의미 그대로 — `expandedRows: Set` 으로 다중 동시 펼침 가능. 단일 expansion 강제는 페이지가 `setExpandedRows` 토픽 publish 로 처리(예: `{ ids: [clickedRowid] }`).
- **wrapper 는 `.table-er__group` (rowid selector 가 wrapper 를 가리킴)**: detail 을 row 와 같은 group 안에 두어 다중 expand 시 row 와 detail 의 시각적 인접 보장. ListRender 의 `rowid` 셀렉터를 group wrapper 로 매핑하면 `data-rowid` 가 wrapper 에 부착되어 chevron click 분기에서 `closest('.table-er__group')` 한 번으로 rowid 추출 가능.
- **`details` 필드 직접 매핑(자체 메서드)**: ListRender selectorKEY 에 `details` 를 추가하면 Standard 호환 5컬럼 contract 가 깨진다(Standard 는 col1~col5 만). `_renderRows` 가 `listRender.renderData` 호출 후 후속 단계에서 각 group 의 `.table-er__detail-text` 에 직접 textContent 매핑.
- **chevron click 도 `@tableRowClicked` 함께 발행(stopPropagation X)**: bindEvents 의 `@tableRowClicked` 위임과 native delegator 는 같은 `appendElement` 의 click listener 이므로 stopPropagation 으로 차단되지 않는다. 페이지가 `event.target.closest('.table-er__chevron')` 검사로 무시(inlineEdit 의 동일 규약 답습).
- **새 batch 도착 시 사라진 rowid 는 자동 collapse**: 데이터-시각 일관성. `_renderRows` 가 새 batch rowid 집합과 `_expandedRows` 의 교집합만 유지. 사라진 rowid 는 `@rowCollapsed` 발행 없이 silent 정리(데이터 사라짐은 emit 통보 책임 외).
- **`_rowData: Map<rowid, row>`**: 페이지가 외부 store 동기화하거나 detail 영역 lazy 갱신 시 참조용 캐시. 단일 진실은 페이지 store(컴포넌트는 캐시).
- **클래스 prefix `.table-er__*`**: Standard / virtualScroll / sortableColumn / filterableHeader / columnResize / rowSelectable / inlineEdit 와 분리(같은 페이지 공존 시 CSS 충돌 X).
- **신규 Mixin 생성 금지**: ListRenderMixin + 자체 메서드 5종으로 완결.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions / customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서 (컨테이너 click delegator remove → customEvents 제거 → 구독 해제 → 자체 상태/메서드 null + listRender.destroy)
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Tables/Advanced/expandableRow/preview/...html` → `../`를 5번 = inlineEdit 동일 verbatim 복사)
