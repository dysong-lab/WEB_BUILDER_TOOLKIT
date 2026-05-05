# Tables — Advanced / sortableColumn

## 기능 정의

1. **컬럼 헤더 클릭 정렬** — 헤더 행(`.table-sc__head-row`)에 click 위임. `event.target.closest('.table-sc__head-cell[data-col]')` 로 컬럼 식별 → 동일 컬럼 재클릭 시 `asc → desc → unsorted` 3단계 토글, 다른 컬럼 클릭 시 새 컬럼의 `asc`로 시작. 정렬 상태는 `_sortBy: string | null`, `_sortOrder: 'asc' | 'desc' | null` 자체 보관. 컬럼은 Standard 와 동일한 5개 고정(col1~col5).
2. **클라이언트 사이드 정렬 (default)** — `_serverSort === false` 일 때 `_allRows.slice().sort()` 로 자체 정렬한다. **숫자 인지(Numeric-aware)**: 셀 값이 모두 number 또는 number-coercible 문자열이면 숫자 비교, 그 외엔 `localeCompare` 문자열 비교. unsorted 단계로 돌아가면 원본 순서(`_allRows`)를 그대로 렌더한다.
3. **서버 사이드 정렬 위임** — 옵션 `serverSort: true` (페이지가 `setSortBy` 토픽으로 강제 가능, 또는 `_serverSort` 인스턴스 플래그) 면 자체 정렬을 수행하지 않고 `@columnSorted` 발행만 한다. 페이지가 새 데이터를 `tableRows` 토픽으로 다시 publish 하면 새 데이터가 그대로 렌더된다 (정렬 상태는 헤더 인디케이터로만 유지).
4. **정렬 인디케이터 (▲ ▼)** — 정렬된 컬럼 헤더 셀에 `data-sort="asc"` 또는 `data-sort="desc"` 부착. CSS pseudo-element(`::after`)로 ▲/▼ 화살표를 표시. unsorted 컬럼은 `data-sort` 속성을 제거(또는 빈값). 헤더 라벨은 HTML 에 정적으로 작성되어 정렬에 따라 변하지 않음.
5. **외부 강제 정렬 (setSortBy 토픽)** — 페이지가 `setSortBy` 토픽으로 `{ col, order }` 페이로드를 publish 하면 `_setSortBy` 핸들러가 `_sortBy` / `_sortOrder` 갱신 → 클라이언트 정렬 모드면 `_applySort()` + `_renderRows()`, 서버 정렬 모드면 인디케이터 갱신 + `@columnSorted` 발행만. URL state, 다른 컴포넌트 동기화, 페이지 초기 정렬 강제 등에 활용.
6. **행 클릭 호환** — Standard 와 동일하게 `@tableRowClicked` 발행. `event.target.closest('.table-sc__row')?.dataset.rowid` 로 행 식별 가능. Standard ↔ sortableColumn 변형 교체 시 페이지 코드(@tableRowClicked 핸들러) 답습 가능.
7. **정렬 변경 이벤트 발행** — `_sortBy` / `_sortOrder` 변경 시 `@columnSorted` 1회 발행. payload: `{ targetInstance, col, order, totalCount }`. server-sort 모드의 페이지 lazy-fetch, telemetry, URL 동기화 등에 활용.

> **Standard와의 분리 정당성**:
> - **새 자체 상태 4종** (`_allRows` / `_sortBy` / `_sortOrder` / `_serverSort`) — Standard 는 stateless(데이터를 그대로 ListRender 에 위임). sortableColumn 은 정렬 진실(원본 + sortBy/sortOrder)을 컴포넌트로 흡수.
> - **자체 메서드 5종** (`_renderRows` / `_applySort` / `_handleHeaderClick` / `_setSortBy` / `_emitColumnSorted` / `_updateHeaderIndicator`) — Standard 는 자체 메서드 0종.
> - **새 이벤트** — `@columnSorted` (Standard 는 `@tableRowClicked` 만).
> - **선택 토픽 1종** — `setSortBy` (외부 강제 정렬). Standard 는 `tableRows` 1종.
> - **헤더 click 위임 + data-col 컬럼 식별 + data-sort 인디케이터 3채널** — Standard 는 헤더가 정적 라벨 슬롯이며 click 매핑/data-col/data-sort 모두 사용 안함.
> - **Numeric-aware 비교 로직** — Standard 는 비교 로직 자체가 없음. 컬럼 값의 number 코어시블 여부에 따라 `Number()` 또는 `localeCompare` 분기.
>
> 위 6축은 동일 register.js 로 표현 불가 → Standard 내부 variant 로 흡수 불가. **신규 Mixin 생성 없이** ListRenderMixin + 자체 메서드로 완결한다.

> **virtualScroll 과의 직교성**: virtualScroll 은 viewport 범위만 DOM 에 렌더(스크롤 진실), sortableColumn 은 행 순서 변경(정렬 진실). 두 변형은 완전히 다른 축을 다루며 서로 독립적이다. 동일한 ListRenderMixin 토대 + Standard 호환 KEY(`rowid`/`col1~col5`)를 공유.

> **TabulatorMixin 미사용 근거**: TabulatorMixin 은 Tabulator.js 라이브러리 wrapper 로 자체 sorter(`columnDefinitions[].sorter`)를 제공하지만, **본 변형은 Standard 의 ListRenderMixin 토대를 그대로 답습**한다. ① Standard 가 ListRenderMixin 기반이라 Advanced 도 동일 토대로 cssSelectors KEY 호환성 유지. ② Tabulator 는 외부 라이브러리 의존성을 가져오며 헤더 셀 구조를 라이브러리가 결정해 페르소나별 자유로운 HTML/CSS 설계를 제약. ③ 본 변형의 정렬 로직(headerClick → sortBy/sortOrder 결정 → slice+sort → renderData)은 자체 메서드로 충분히 완결. ④ 신규 Mixin 생성은 본 SKILL 의 대상이 아니며, 자체 메서드로 완결.

> **MD3 / 도메인 근거**: MD3 Data tables(MD1 Data Tables 에서 정의)는 컬럼 헤더 클릭에 의한 정렬을 표준 인터랙션으로 명시한다 (근거: [MD1 Data Tables — Sorting](https://m1.material.io/components/data-tables.html#data-tables-interaction)). 모든 모던 데이터 테이블 라이브러리(ag-grid, Tabulator, Material Web)가 column sort 를 1급 기능으로 제공. 실사용: ① **이벤트 로그 테이블**(시간순 / 심각도순 / 대상순 토글), ② **트랜잭션 원장**(금액순 / 시간순), ③ **장비 인벤토리**(이름순 / 상태순), ④ **메트릭 표**(최신순 / 값 큰 순).

---

## 구현 명세

### Mixin

ListRenderMixin (정렬된 행 배열만 렌더 — Mixin 은 정렬 인지 X) + 자체 메서드 6종(`_renderRows` / `_applySort` / `_handleHeaderClick` / `_setSortBy` / `_emitColumnSorted` / `_updateHeaderIndicator`).

> **신규 Mixin 생성 금지** — 큐 설명에 정렬 메커니즘이 명시되었으나 SKILL 규칙상 본 루프에서 새 Mixin 을 만들지 않는다. ListRenderMixin 은 정렬된 행 배열만 받아 그대로 N 개 행을 렌더하고, 정렬 로직(headerClick → sortBy/sortOrder → slice+sort → renderData)은 컴포넌트 자체 메서드가 전담한다.

> **TabulatorMixin 미사용**: 위 "Standard와의 분리 정당성" 박스 참조. Standard 토대 답습 + 페르소나별 HTML/CSS 자유 → ListRenderMixin 이 적합.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.table-sc__body` | 행이 추가될 부모 (ListRenderMixin 규약) |
| template  | `#table-sc-row-template` | `<template>` cloneNode 대상 (ListRenderMixin 규약) |
| rowid     | `.table-sc__row` | 렌더된 각 행 루트 — `data-rowid` 부착 + click 이벤트 매핑 |
| col1      | `.table-sc__cell--col1` | 1번 컬럼 셀 (Standard 호환) |
| col2      | `.table-sc__cell--col2` | 2번 컬럼 셀 |
| col3      | `.table-sc__cell--col3` | 3번 컬럼 셀 |
| col4      | `.table-sc__cell--col4` | 4번 컬럼 셀 |
| col5      | `.table-sc__cell--col5` | 5번 컬럼 셀 |
| headRow   | `.table-sc__head-row` | 헤더 행 — click 위임 부착 대상 |
| headCell  | `.table-sc__head-cell` | 헤더 셀 — `data-col` 부착(컬럼 식별), `data-sort` 부착(정렬 인디케이터) |

> Standard 와 호환 의도로 사용자 정의 KEY(`rowid`/`col1`~`col5`)는 동일. 정렬 전용 KEY 는 `headRow`/`headCell`. 클래스 prefix 는 `table-sc__` 로 Standard(`table__`), virtualScroll(`table-vs__`)과 충돌 회피.

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| rowid | `rowid` | 행 식별 (Standard 호환) |

### HTML 헤더 규약

각 헤더 셀(`.table-sc__head-cell`)은 `data-col` 속성을 가져야 한다(예: `data-col="col1"`). click 핸들러가 이 값으로 `_sortBy` 갱신.

```html
<div class="table-sc__head-row">
    <span class="table-sc__head-cell table-sc__head-cell--col1" data-col="col1">Time</span>
    <span class="table-sc__head-cell table-sc__head-cell--col2" data-col="col2">Target</span>
    ...
</div>
```

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_allRows` | 전체 행 배열(원본). `_renderRows` 가 갱신, `_applySort` 가 슬라이스+정렬. |
| `_sortBy` | 현재 정렬 중인 컬럼명 (`'col1'`..`'col5'` 또는 null). |
| `_sortOrder` | `'asc'` / `'desc'` / null. null 이면 unsorted(원본 순서). |
| `_serverSort` | `true` 면 자체 정렬을 수행하지 않고 `@columnSorted` 발행만. 기본 `false`. |
| `_headerClickHandler` | bound 헤더 click 핸들러 — beforeDestroy removeEventListener 용. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `tableRows` | `this._renderRows` | `[{ rowid, col1, col2, col3, col4, col5 }]` (Standard 호환) |
| `setSortBy` | `this._setSortBy` | `{ col: 'col1'..'col5' \| null, order: 'asc' \| 'desc' \| null }` — 외부 강제 |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `rowid` (ListRender) | 행 클릭 | `@tableRowClicked` (bindEvents 위임 발행). 페이로드 `{ targetInstance, event }`. |
| `@columnSorted` | — (Weventbus.emit, 직접 발행) | 헤더 click / setSortBy 로 `_sortBy` 또는 `_sortOrder` 변경 시 1회 | `{ targetInstance, col, order, totalCount }` |

> 헤더 click 은 `customEvents` 에 매핑하지 않는다 — 위임 로직(같은 컬럼 ↔ 다른 컬럼 분기 + 3단계 토글) 이 자체 메서드 안에서 의미적으로 완결되며, 단순 발행이 아닌 상태 전이를 동반하기 때문. `bindEvents` 가 발행할 단일 `@event`로 표현되지 않는다.

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderRows({ response })` | `tableRows` 핸들러. rows 배열을 `_allRows` 에 보관 → `_applySort()` (정렬 상태 유지). 새 batch 도 기존 정렬을 유지(데이터만 교체). |
| `_applySort()` | `_sortBy`/`_sortOrder` 가 모두 truthy 이면 `_allRows.slice().sort(...)` 로 정렬한 배열을 `listRender.renderData({ response })`. 그 외엔 `_allRows` 그대로 렌더. server-sort 모드면 정렬 없이 `_allRows` 그대로 렌더. |
| `_compareRows(a, b)` | 두 행을 `_sortBy` 컬럼 값으로 비교. 양쪽 모두 number-coercible 이면 `Number(a)-Number(b)`, 아니면 `String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' })`. |
| `_handleHeaderClick(event)` | 헤더 행 click 위임. `event.target.closest('.table-sc__head-cell[data-col]')` 로 컬럼 식별 → 동일 컬럼이면 `asc→desc→null` 토글, 다른 컬럼이면 새 컬럼 `asc`. → `_updateHeaderIndicator()` + `_applySort()` (server-sort 모드면 `_applySort` 는 무시되고 인디케이터만 갱신) + `_emitColumnSorted()`. |
| `_setSortBy({ response })` | `setSortBy` 토픽 핸들러. `{ col, order }` 페이로드 검증 후 `_sortBy`/`_sortOrder` 갱신 → `_updateHeaderIndicator()` + `_applySort()` + `_emitColumnSorted()`. |
| `_updateHeaderIndicator()` | 모든 `.table-sc__head-cell[data-col]` 에서 `data-sort` 제거 → `_sortBy` 가 truthy 이면 해당 셀에 `data-sort=_sortOrder` 부착. CSS `::after` 가 ▲/▼ 표시. |
| `_emitColumnSorted()` | `Weventbus.emit('@columnSorted', { targetInstance, col, order, totalCount })`. |

### 페이지 연결 사례

```
[페이지 — 이벤트 로그 / 트랜잭션 원장 / 장비 인벤토리 / 메트릭 표]
    │
    └─ fetchAndPublish('tableRows', this) — 행 배열
        payload 예: [{ rowid: 'evt-0', col1: '14:31:02', col2: 'gateway-01', col3: 'NETWORK', col4: 'ERROR', col5: '503' }, ...]

[Tables/Advanced/sortableColumn]
    ├─ _renderRows 가 _allRows 보관 → _applySort() (default unsorted)
    └─ ListRender 가 _allRows 그대로 렌더

[사용자가 "Status" 헤더 click]
    ├─ _handleHeaderClick → col=col4, order='asc' (이전 sortBy=null)
    ├─ _updateHeaderIndicator → col4 head-cell 에 data-sort="asc" 부착 (▲ 표시)
    ├─ _applySort → _allRows.slice().sort(col4 asc) → listRender.renderData
    └─ @columnSorted: { col:'col4', order:'asc', totalCount:N } 발행

[사용자가 같은 "Status" 헤더 재 click]
    ├─ _handleHeaderClick → col=col4, order='desc'
    ├─ _updateHeaderIndicator → data-sort="desc" (▼ 표시)
    ├─ _applySort → desc 정렬
    └─ @columnSorted: { col:'col4', order:'desc' } 발행

[사용자가 같은 "Status" 헤더 3 click]
    ├─ _handleHeaderClick → col=null, order=null (unsorted 복귀)
    ├─ _updateHeaderIndicator → 모든 data-sort 제거
    ├─ _applySort → _allRows 원본 순서 그대로 렌더
    └─ @columnSorted: { col:null, order:null } 발행

운영: this.pageDataMappings = [
        { topic: 'tableRows', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@tableRowClicked': ({ event }) => {
          const id = event.target.closest('.table-sc__row')?.dataset.rowid;
          // 상세 페이지로 이동
        },
        '@columnSorted': ({ col, order }) => {
          // server-sort 모드면 새 정렬 데이터 fetch & republish
          // URL state 동기화
        }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 / 그라디언트 호버 / Pretendard / 8/20px 모서리 | **이벤트 로그 테이블** (시간/대상/카테고리/상태/값 — 헤더 클릭으로 심각도순/시간순 토글) |
| `02_material`    | B: Material Elevated | 라이트 / elevation shadow / Pretendard+Roboto / 12px 모서리 | **트랜잭션 원장** (금액/계정/유형/상태/시간 — 금액순/시간순 정렬) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 / DM Serif 헤드라인 / 샤프 구분선 / 정적 | **연감/도서 카탈로그** (연도/저자/제목/장르/페이지 — 연도순/저자명순) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 시안 / IBM Plex / 각진 2-4px 모서리 | **장비 메트릭 표** (시각/프로브/메트릭/상태/값 — 값 큰 순/심각도순) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따른다. 정렬 인디케이터(▲/▼)는 페르소나 컬러 팔레트와 일치(예: A 는 밝은 퍼플 강조, D 는 시안 강조).

### 결정사항

- **3단계 토글 (asc → desc → unsorted)**: ag-grid / Tabulator / Material Web Table 의 표준 패턴. asc-only 또는 asc/desc-only 는 unsorted 복귀가 불가능해 사용성 떨어짐.
- **Numeric-aware 비교**: `localeCompare(..., { numeric: true })` 또는 명시적 `Number()` 분기 — `'9'` < `'10'` 이 자연스럽게 처리됨. ag-grid 의 default comparator 와 동일.
- **헤더 라벨 정적**: Standard 와 동일하게 라벨은 HTML 에 직접 작성. 정렬에 따라 라벨이 변하지 않음(인디케이터만 동적). 헤더 라벨 데이터 바인딩은 별도 변형(`dynamicHeaders`) 이 다룸.
- **클래스 prefix 분리**: `.table-sc__*` 로 Standard(`.table__*`), virtualScroll(`.table-vs__*`) 와 분리(같은 페이지 공존 시 CSS 충돌 X).
- **client-sort default + server-sort opt-in**: 작은 테이블(수백 행)은 클라이언트 정렬이 즉시. 대용량(virtualScroll 와 결합)은 페이지가 `_serverSort=true` + `setSortBy` 토픽 + 새 데이터 fetch 로 처리. 본 변형은 client-sort default 만 시연(server-sort 시연은 별도 변형 또는 페이지 콜라보).
- **신규 Mixin 생성 금지**: ListRenderMixin + 자체 메서드 6종으로 완결. 큐 설명의 "정렬 Mixin" 은 본 SKILL 의 대상이 아님.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions / customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서 (header click listener remove → customEvents 제거 → 구독 해제 → 자체 상태/메서드 null + listRender.destroy)
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Tables/Advanced/sortableColumn/preview/...html` → `../`를 5번 = virtualScroll 동일 verbatim 복사)
