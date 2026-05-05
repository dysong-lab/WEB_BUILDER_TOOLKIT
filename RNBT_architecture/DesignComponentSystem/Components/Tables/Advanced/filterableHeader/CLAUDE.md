# Tables — Advanced / filterableHeader

## 기능 정의

1. **컬럼별 필터 입력 행** — 헤더 행 아래에 별도 필터 행(`.table-fh__filter-row`)을 두고, 각 컬럼마다 `<input class="table-fh__filter-input" data-col="col1">` 등 input 요소를 노출한다. 컬럼 수는 Standard와 동일한 5개 고정(`col1`~`col5`).
2. **debounce 입력 처리 (200ms)** — 사용자가 입력할 때마다 자체 `setTimeout`(`_filterDebounceMs=200`)으로 직전 타이머를 `clearTimeout` 후 재예약. 디바운스 만료 시 `_applyFilters()` 1회 호출. `setInterval`/외부 라이브러리 의존성 없음.
3. **AND 결합 클라이언트 사이드 필터링 (default)** — `_serverFilter === false` 일 때 `_allRows.filter(row => 모든 활성 컬럼 필터에 해당 셀이 substring 포함)`. 비교는 case-insensitive `String(cell).toLowerCase().includes(query.toLowerCase())`. 빈 문자열 필터는 무시(해당 컬럼은 통과).
4. **서버 사이드 필터 위임** — 옵션 `serverFilter: true` (페이지가 `setColumnFilters` 토픽으로 강제 가능, 또는 `_serverFilter` 인스턴스 플래그) 면 자체 필터를 수행하지 않고 `@filtered` 발행만. 페이지가 새 데이터를 `tableRows` 토픽으로 다시 publish 하면 새 데이터가 그대로 렌더된다 (필터 상태는 input value 로만 유지).
5. **외부 강제 필터 (setColumnFilters 토픽)** — 페이지가 `setColumnFilters` 토픽으로 `{ col1?: 'foo', col2?: 'bar', ... }` 페이로드를 publish 하면 `_setColumnFilters` 핸들러가 `_filters` 객체와 input.value를 동기화 → 클라이언트 필터 모드면 `_applyFilters()` + `_renderRows()`, 서버 필터 모드면 `@filtered` 발행만. URL state, 다른 컴포넌트 동기화, 페이지 초기 필터 강제 등에 활용.
6. **행 클릭 호환** — Standard 와 동일하게 `@tableRowClicked` 발행. `event.target.closest('.table-fh__row')?.dataset.rowid` 로 행 식별 가능. Standard ↔ filterableHeader 변형 교체 시 페이지 코드(@tableRowClicked 핸들러) 답습 가능.
7. **필터 변경 이벤트 발행** — `_applyFilters()` 마무리에 `@filtered` 1회 발행. payload: `{ targetInstance, filters, totalCount, visibleCount }`. server-filter 모드의 페이지 lazy-fetch, telemetry, URL 동기화 등에 활용.
8. **input 자체 stopPropagation** — 필터 input 의 click 이 행 click 이벤트로 버블되지 않도록 `_handleFilterInputClick` 에서 `event.stopPropagation()`. `bindEvents` 위임이 input 클릭을 행 클릭으로 오인하는 것을 차단.

> **Standard와의 분리 정당성**:
> - **새 자체 상태 5종** (`_allRows` / `_filters` / `_serverFilter` / `_filterDebounceMs` / `_filterTimerId`) — Standard 는 stateless. filterableHeader 는 필터 진실(원본 + 컬럼별 query 문자열 + debounce 타이머)을 컴포넌트로 흡수.
> - **자체 메서드 7종** (`_renderRows` / `_applyFilters` / `_matchRow` / `_handleFilterInput` / `_handleFilterInputClick` / `_setColumnFilters` / `_emitFiltered`) — Standard 는 자체 메서드 0종.
> - **새 이벤트** — `@filtered` (Standard 는 `@tableRowClicked` 만).
> - **선택 토픽 1종** — `setColumnFilters` (외부 강제 필터). Standard 는 `tableRows` 1종.
> - **필터 행 + input 직접 listener (input · click) + 200ms debounce + AND 결합 substring 매칭** — Standard 는 헤더가 정적 라벨 슬롯이며 input/debounce/필터 매칭 모두 사용 안함.
>
> 위 5축은 동일 register.js 로 표현 불가 → Standard 내부 variant 로 흡수 불가. **신규 Mixin 생성 없이** ListRenderMixin + 자체 메서드로 완결한다.

> **sortableColumn / virtualScroll 과의 직교성**: sortableColumn 은 행 순서(정렬 진실), virtualScroll 은 viewport DOM 범위(스크롤 진실), filterableHeader 는 행 가시성(필터 진실). 세 변형 모두 서로 다른 축을 다루며 독립적이다. 동일한 ListRenderMixin 토대 + Standard 호환 KEY(`rowid`/`col1~col5`)를 공유.

> **TabulatorMixin 미사용 근거**: TabulatorMixin 은 Tabulator.js wrapper 로 자체 headerFilter 를 제공하지만, **본 변형은 Standard 의 ListRenderMixin 토대를 그대로 답습**한다. ① Standard 가 ListRenderMixin 기반이라 Advanced 도 동일 토대로 cssSelectors KEY 호환성 유지. ② Tabulator 는 외부 라이브러리 의존성 + 헤더/필터 셀 구조를 라이브러리가 결정해 페르소나별 자유로운 HTML/CSS 설계를 제약. ③ 본 변형의 필터 로직(input → debounce → filter → renderData)은 자체 메서드로 충분히 완결. ④ 신규 Mixin 생성은 본 SKILL 의 대상이 아니며, 자체 메서드로 완결.

> **MD3 / 도메인 근거**: MD3 Data tables(MD1 Data Tables 에서 정의)는 헤더 영역에 column-level 필터 입력을 표준 인터랙션으로 명시한다 (근거: [MD1 Data Tables — Filtering](https://m1.material.io/components/data-tables.html#data-tables-interaction)). 모든 모던 데이터 테이블 라이브러리(ag-grid `floatingFilter`, Tabulator `headerFilter`, Material Web Table)가 column header filter 를 1급 기능으로 제공. 실사용: ① **이벤트 로그 테이블**(time/target/category 등 substring 검색), ② **고객 디렉토리**(name/email/region 검색), ③ **장비 인벤토리**(model/site 필터), ④ **결제 검색**(account/type 텍스트 검색).

---

## 구현 명세

### Mixin

ListRenderMixin (필터 통과 행 배열만 렌더 — Mixin 은 필터 인지 X) + 자체 메서드 7종(`_renderRows` / `_applyFilters` / `_matchRow` / `_handleFilterInput` / `_handleFilterInputClick` / `_setColumnFilters` / `_emitFiltered`).

> **신규 Mixin 생성 금지** — 큐 설명에 필터 메커니즘이 명시되었으나 SKILL 규칙상 본 루프에서 새 Mixin 을 만들지 않는다. ListRenderMixin 은 필터 통과 행 배열만 받아 그대로 N 개 행을 렌더하고, 필터 로직(input → debounce → AND 결합 substring 필터 → renderData)은 컴포넌트 자체 메서드가 전담한다.

> **TabulatorMixin 미사용**: 위 "Standard와의 분리 정당성" 박스 참조. Standard 토대 답습 + 페르소나별 HTML/CSS 자유 → ListRenderMixin 이 적합.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.table-fh__body` | 행이 추가될 부모 (ListRenderMixin 규약) |
| template  | `#table-fh-row-template` | `<template>` cloneNode 대상 (ListRenderMixin 규약) |
| rowid     | `.table-fh__row` | 렌더된 각 행 루트 — `data-rowid` 부착 + click 이벤트 매핑 |
| col1      | `.table-fh__cell--col1` | 1번 컬럼 셀 (Standard 호환) |
| col2      | `.table-fh__cell--col2` | 2번 컬럼 셀 |
| col3      | `.table-fh__cell--col3` | 3번 컬럼 셀 |
| col4      | `.table-fh__cell--col4` | 4번 컬럼 셀 |
| col5      | `.table-fh__cell--col5` | 5번 컬럼 셀 |
| filterRow   | `.table-fh__filter-row` | 필터 행 — input event 위임 부착 대상 |
| filterInput | `.table-fh__filter-input` | 컬럼별 input — `data-col` 부착(컬럼 식별) |

> Standard 와 호환 의도로 사용자 정의 KEY(`rowid`/`col1`~`col5`)는 동일. 필터 전용 KEY 는 `filterRow`/`filterInput`. 클래스 prefix 는 `table-fh__` 로 Standard(`table__`), virtualScroll(`table-vs__`), sortableColumn(`table-sc__`) 와 충돌 회피.

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| rowid | `rowid` | 행 식별 (Standard 호환) |

### HTML 필터 행 규약

각 필터 input(`.table-fh__filter-input`)은 `data-col` 속성을 가져야 한다(예: `data-col="col1"`). input 핸들러가 이 값으로 `_filters[col]` 갱신.

```html
<div class="table-fh__head-row">
    <span class="table-fh__head-cell table-fh__head-cell--col1">Time</span>
    ...
</div>
<div class="table-fh__filter-row">
    <input class="table-fh__filter-input table-fh__filter-input--col1" data-col="col1" type="text" placeholder="filter...">
    ...
</div>
```

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_allRows` | 전체 행 배열(원본). `_renderRows` 가 갱신, `_applyFilters` 가 필터링. |
| `_filters` | 컬럼별 query 문자열 객체 `{ col1: '', col2: 'gateway', ... }`. 빈 문자열은 비활성. |
| `_serverFilter` | `true` 면 자체 필터를 수행하지 않고 `@filtered` 발행만. 기본 `false`. |
| `_filterDebounceMs` | input debounce 지연 (기본 200ms). |
| `_filterTimerId` | debounce setTimeout id — beforeDestroy clearTimeout 용 / input 마다 직전 타이머 cancel. |
| `_filterInputHandler` | bound input event 핸들러 — beforeDestroy removeEventListener 용. |
| `_filterClickHandler` | bound click stopPropagation 핸들러 — input 클릭이 행 click 으로 버블되지 않게. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `tableRows` | `this._renderRows` | `[{ rowid, col1, col2, col3, col4, col5 }]` (Standard 호환) |
| `setColumnFilters` | `this._setColumnFilters` | `{ col1?: string, col2?: string, ..., col5?: string }` — 외부 강제. 누락된 컬럼은 변경 없음. 빈 문자열은 해제. |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `rowid` (ListRender) | 행 클릭 | `@tableRowClicked` (bindEvents 위임 발행). 페이로드 `{ targetInstance, event }`. |
| `@filtered` | — (Weventbus.emit, 직접 발행) | `_applyFilters()` 호출 (input debounce 만료 / setColumnFilters / 신규 데이터 도착) 시 1회 | `{ targetInstance, filters, totalCount, visibleCount }` |

> 필터 input event 는 `customEvents` 에 매핑하지 않는다 — debounce + 컬럼별 `_filters` 객체 갱신 + `_applyFilters()` 트리거 의 흐름이 자체 메서드 안에서 의미적으로 완결되며, 단순 발행이 아닌 상태 전이를 동반한다. `bindEvents` 가 발행할 단일 `@event`로 표현되지 않는다. input click 도 stopPropagation 만이 목적이어서 발행 매핑 대상 아님.

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderRows({ response })` | `tableRows` 핸들러. rows 배열을 `_allRows` 에 보관 → `_applyFilters()` (필터 상태 유지). 새 batch 도 기존 필터를 유지(데이터만 교체). |
| `_applyFilters()` | server-filter 모드면 자체 필터 X — `_allRows` 그대로 렌더 + `@filtered` 발행. client-filter 모드면 `_allRows.filter(row => _matchRow(row))` 결과를 `listRender.renderData({ response })` + `@filtered` 발행. |
| `_matchRow(row)` | row 가 모든 활성 필터(`_filters[col]` 비어있지 않은 컬럼)를 통과하는지 검증. 모든 컬럼 AND. 비교는 `String(row[col]).toLowerCase().includes(query.toLowerCase())`. |
| `_handleFilterInput(event)` | 필터 행 input event 위임. `event.target.closest('.table-fh__filter-input[data-col]')` 로 컬럼 식별 → `_filters[col] = input.value`. 직전 `_filterTimerId` clearTimeout → `setTimeout(_applyFilters, _filterDebounceMs)` 재예약. |
| `_handleFilterInputClick(event)` | 필터 행 click 위임. `event.target.closest('.table-fh__filter-input')` 가 매치되면 `event.stopPropagation()` 만 호출 (행 click 으로 버블되는 것 방지). |
| `_setColumnFilters({ response })` | `setColumnFilters` 토픽 핸들러. payload 의 각 col 값을 `_filters` 와 input.value 양쪽에 동기화 → debounce 없이 즉시 `_applyFilters()` (외부 강제이므로 입력 흐름 아님). |
| `_emitFiltered(visibleCount)` | `Weventbus.emit('@filtered', { targetInstance, filters: {...}, totalCount, visibleCount })`. |

### 페이지 연결 사례

```
[페이지 — 이벤트 로그 / 고객 디렉토리 / 장비 인벤토리 / 결제 검색]
    │
    └─ fetchAndPublish('tableRows', this) — 행 배열
        payload 예: [{ rowid: 'evt-0', col1: '14:31:02', col2: 'gateway-01', col3: 'NETWORK', col4: 'ERROR', col5: '503' }, ...]

[Tables/Advanced/filterableHeader]
    ├─ _renderRows 가 _allRows 보관 → _applyFilters() (default 빈 필터 → 전체 렌더)
    └─ ListRender 가 _allRows 그대로 렌더 + @filtered { totalCount=N, visibleCount=N } 발행

[사용자가 col2 필터에 "gateway" 입력]
    ├─ _handleFilterInput 이 _filters.col2='gateway' 갱신 + 200ms debounce 재예약
    ├─ (200ms 만료) _applyFilters → _matchRow 가 col2 substring 'gateway' 매치하는 행만 통과
    │                                → ListRender.renderData(filteredRows)
    └─ @filtered: { filters: {col2:'gateway',...}, totalCount:N, visibleCount:M } 발행

[사용자가 col4 필터에 "error" 입력 (다중 필터 AND 결합)]
    ├─ _filters.col2='gateway' AND _filters.col4='error'
    └─ _matchRow 가 두 컬럼 substring 모두 통과한 행만 렌더
        @filtered { filters: {col2:'gateway', col4:'error', ...}, totalCount, visibleCount } 발행

[사용자가 col2 필터를 비움]
    ├─ _filters.col2='' (활성 필터에서 제거)
    └─ _matchRow 가 col4 단일 조건만 검사 → 더 많은 행 통과

운영: this.pageDataMappings = [
        { topic: 'tableRows', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@tableRowClicked': ({ event }) => {
          const id = event.target.closest('.table-fh__row')?.dataset.rowid;
          // 상세 페이지로 이동
        },
        '@filtered': ({ filters, totalCount, visibleCount }) => {
          // server-filter 모드면 새 필터 데이터 fetch & republish
          // URL state 동기화
        }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 / 그라디언트 호버 / Pretendard / 8/20px 모서리 | **이벤트 로그 테이블** (시간/대상/카테고리/상태/값 — gateway/error 등 substring 검색) |
| `02_material`    | B: Material Elevated | 라이트 / elevation shadow / Pretendard+Roboto / 12px 모서리 outlined input | **고객 디렉토리** (이름/이메일/지역/플랜/MRR — 이름/도메인 검색) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 / DM Serif 헤드라인 / 샤프 구분선 / underline input | **연감/도서 카탈로그** (연도/저자/제목/장르/페이지 — 저자/제목 검색) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 시안 / IBM Plex / 각진 2-4px 모서리 | **장비 인벤토리** (시각/프로브/메트릭/상태/값 — probe/site 검색) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따른다. 필터 input 의 outline/border/focus ring 컬러는 페르소나 컬러 팔레트와 일치(예: A 는 밝은 퍼플, D 는 시안 강조).

### 결정사항

- **debounce 200ms 자체 setTimeout**: lodash/외부 라이브러리 의존성 없이 인스턴스 상태(`_filterTimerId`)로만 제어. SKILL 제약(자체 setTimeout/clearTimeout)을 따른다. 200ms 는 ag-grid `quickFilterParseDelay` 기본값과 일치하며 키스트로크가 빈번한 substring 매칭에 적합.
- **AND 결합 + case-insensitive substring**: ag-grid `agTextColumnFilter` / Tabulator `like` 모드 / Material Web Table 의 default. substring 은 사용자가 가장 직관적으로 기대하는 비교(starts-with 보다 관용적). 케이스 무시는 영문 검색에서 표준.
- **빈 문자열 필터 무시**: `_filters.col2=''` 면 col2 조건 자체를 무시. "공백 검색"이 의미 없는 도메인 가정.
- **헤더 라벨 정적 + 별도 필터 행 분리**: 헤더 셀에 input을 넣는 inline 방식 대신 헤더 행 아래 별도 `.filter-row` 분리. 페르소나별 input 디자인 자유 + 헤더 영역의 폭/정렬 제약과 분리. ag-grid `floatingFilter` 와 동일한 패턴.
- **클래스 prefix 분리**: `.table-fh__*` 로 Standard(`.table__*`), sortableColumn(`.table-sc__*`), virtualScroll(`.table-vs__*`) 와 분리(같은 페이지 공존 시 CSS 충돌 X).
- **client-filter default + server-filter opt-in**: 작은 테이블(수백 행)은 클라이언트 필터가 즉시. 대용량(virtualScroll 와 결합)은 페이지가 `_serverFilter=true` + `setColumnFilters` 토픽 + 새 데이터 fetch 로 처리. 본 변형은 client-filter default 만 시연(server-filter 시연은 별도 변형 또는 페이지 콜라보).
- **input click stopPropagation**: input 클릭이 행 click 으로 버블되어 `@tableRowClicked` 가 의도치 않게 발행되는 것을 차단. ag-grid / Tabulator 도 동일 처리.
- **신규 Mixin 생성 금지**: ListRenderMixin + 자체 메서드 7종으로 완결. 큐 설명의 "필터 Mixin" 은 본 SKILL 의 대상이 아님.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions / customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서 (debounce timer clear → input/click listener remove → customEvents 제거 → 구독 해제 → 자체 상태/메서드 null + listRender.destroy)
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Tables/Advanced/filterableHeader/preview/...html` → `../`를 5번 = sortableColumn 동일 verbatim 복사)
