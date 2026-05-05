# Tables — Advanced / virtualScroll

## 기능 정의

1. **대용량 행 가상 렌더 (virtual rendering)** — `tableRows` 토픽으로 수신한 대규모 배열(예: 5,000~50,000행)을 모두 DOM에 렌더하지 않고, viewport에 보이는 범위 + 위/아래 buffer만 ListRenderMixin의 `renderData(slicedRows)`로 렌더한다. 전체 스크롤 영역 높이는 spacer로 시뮬레이션한다 (`spacer.height = totalCount * rowHeight`). 보이는 범위는 `_visibleStart` ~ `_visibleEnd`에 보관. 컬럼은 Standard와 동일하게 5개 고정(col1~col5).
2. **고정 행 높이 기반 인덱스 계산 (fixed row height)** — 모든 행이 동일 높이(`_rowHeight`, 기본 44px)를 가정. `scrollTop` 측정 → `startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer)` → `visibleCount = Math.ceil(viewportHeight / rowHeight)` → `endIndex = Math.min(totalCount, startIndex + visibleCount + buffer * 2)`. 가변 행 높이는 본 변형의 범위 외(반복 패턴 후보 메모만).
3. **스크롤 throttle via requestAnimationFrame** — outer 컨테이너의 `scroll` 이벤트는 native event다. 매 이벤트마다 재계산하면 빈번한 리렌더가 발생하므로 `requestAnimationFrame` 기반 coalesce: 첫 scroll 이벤트가 rAF 예약을 큐잉하고 다음 이벤트는 동일 frame에서 무시. rAF callback에서 새 범위 계산 후 변경 시에만 `_renderWindow()` 호출 + `@virtualRangeChanged` 발행. rAF id는 `_rafId`로 보관, beforeDestroy에서 `cancelAnimationFrame` 호출.
4. **renderWindow의 absolute positioning** — outer `position: relative; overflow-y: auto` + spacer `position: absolute; top:0; left:0; width:100%; height: totalCount*rowHeight; pointer-events: none` (스크롤바 영역만 만들고 visual 무관) + renderWindow `position: absolute; top: ${startIndex * rowHeight}px; left:0; right:0` (보이는 행만 ListRenderMixin이 렌더). renderWindow의 top을 갱신함으로써 스크롤 위치와 시각적 행 위치가 일치한다. 헤더 행(`.table-vs__head-row`)은 outer 외부에 고정 — 스크롤하지 않는다.
5. **ResizeObserver로 viewport 높이 추적** — outer 높이는 페이지 레이아웃에 따라 달라질 수 있다(창 리사이즈, 부모 컨테이너 변화). ResizeObserver로 outer 높이 변화 감지 → `_visibleCount = Math.ceil(viewportHeight / rowHeight)` 재계산 → `_renderWindow()` 재호출. ResizeObserver는 `_resizeObserver`로 보관, beforeDestroy에서 `disconnect`.
6. **행 클릭 호환** — Standard와 동일한 `@tableRowClicked` 발행. `event.target.closest('.table-vs__row')?.dataset.rowid`로 행 식별 가능. Standard와 cssSelectors 계약 호환을 위해 `rowid`/`col1`~`col5` KEY는 그대로 유지(디자인 자유, 데이터 그대로 패스).
7. **범위 변경 이벤트 발행** — `_visibleStart`/`_visibleEnd`가 변하면 `@virtualRangeChanged` 1회 발행. payload: `{ targetInstance, startIndex, endIndex, totalCount, rowHeight }`. 페이지가 lazy-load(서버에서 다음 페이지 가져오기), telemetry, virtualization 디버깅 등에 활용.
8. **외부 명시 스크롤 / 행 높이 변경** — `setRowHeight` / `scrollToIndex` 토픽 구독. `setRowHeight`는 양의 number 페이로드를 받아 `_rowHeight` 갱신 → spacer 높이 갱신 → `_recomputeVisibleCount()`. `scrollToIndex`는 0-based 인덱스를 받아 `outer.scrollTop = idx * rowHeight` 설정(scroll listener가 자연스럽게 trigger).

> **Standard와의 분리 정당성**:
> - **새 자체 상태 6종** (`_allRows`/`_rowHeight`/`_buffer`/`_visibleStart`/`_visibleEnd`/`_visibleCount`) — Standard는 stateless(데이터를 받아 그대로 ListRender에 위임). virtualScroll은 viewport 슬라이스 진실을 컴포넌트로 흡수.
> - **자체 메서드 7종** (`_renderRows`/`_renderWindow`/`_handleScroll`/`_recomputeVisibleCount`/`_emitRangeChanged`/`_setRowHeight`/`_scrollToIndex`) — Standard는 자체 메서드 0종.
> - **scroll/ResizeObserver/rAF 3종 native lifecycle** — Standard는 사용 안함.
> - **새 이벤트** — `@virtualRangeChanged` (Standard는 `@tableRowClicked`만).
> - **선택적 토픽 2종** — `setRowHeight`/`scrollToIndex` (외부 강제 변경/명시 스크롤 진입). Standard는 `tableRows` 1종.
> - **3층 HTML 구조 (스크롤 영역)** — Standard는 단일 `.table__body` 컨테이너. virtualScroll은 outer/spacer/renderWindow 3층(absolute layered)으로 가상 영역과 가시 영역 분리. 헤더 행은 outer 외부에 sticky하게 두어 스크롤과 분리.
>
> 위 6축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가. **신규 Mixin 생성 없이** ListRenderMixin + 자체 메서드로 완결한다.

> **Lists/Advanced/virtualScroll과의 직교성**: 동일한 가상 스크롤 메커니즘을 답습하되, 도메인이 다르다 — Lists는 `leading + headline + supporting` 단일 항목 구조, Tables는 `col1~col5` 다열 행 구조. 헤더 정적 슬롯(`.table-vs__head-row`)이 outer 외부에 존재해 컬럼 라벨이 스크롤하지 않는다는 점이 Tables의 도메인 특이성. cssSelectors KEY 집합도 다름(`itemid/leading/headline/supporting` vs `rowid/col1~col5`).

> **TabulatorMixin 미사용 근거**: TabulatorMixin은 Tabulator.js 라이브러리 wrapper로 자체 virtual DOM(`virtualDom: true` + `height` 옵션)을 제공하지만, **본 변형은 Tables/Standard의 ListRenderMixin 토대를 그대로 답습**한다. ① Standard가 ListRenderMixin 기반이라 Advanced도 동일 토대로 답습하는 것이 cssSelectors KEY(`rowid/col1~col5`) 호환성과 페이지 호환성 측면에서 자연스럽다. ② Tabulator는 외부 라이브러리 의존성을 가져오며 행 구조를 라이브러리가 결정해 페르소나별 자유로운 HTML/CSS 설계를 제약한다. ③ 본 변형의 가상 로직(scroll → index 계산 → renderWindow 재배치)은 자체 메서드로 충분히 완결되며, Lists/Advanced/virtualScroll에서 검증된 패턴을 그대로 답습한다. ④ 신규 Mixin 생성은 본 SKILL의 대상이 아니며, 자체 메서드로 완결.

> **MD3 / 도메인 근거**: MD3 Data tables는 구조화된 데이터를 행과 열로 배치하여 비교/분석을 용이하게 한다. **행이 수천~수만 개로 늘어나면** 모든 행을 DOM에 렌더하는 것은 메모리/페인트 성능을 직접적으로 침해한다. 실사용: ① **이벤트/로그 테이블**(서버/장비 누적 이벤트 10,000+ 행 — Time/Target/Category/Status/Value), ② **트랜잭션 원장**(거래 수만 건 시계열), ③ **모니터링 메트릭 행**(분단위 24시간 = 1,440 / 초단위 = 86,400), ④ **장비 인벤토리/사용자 디렉토리**(수천 행 검색 결과). 가상 스크롤은 WPF DataGrid, Tabulator's virtualDom, ag-grid의 row virtualization 등 모든 모던 데이터 테이블 라이브러리가 제공하는 표준 기법.

---

## 구현 명세

### Mixin

ListRenderMixin (sliced 행 배열만 렌더 — Mixin은 virtual 인지 X) + 자체 메서드 7종(`_renderRows` / `_renderWindow` / `_handleScroll` / `_recomputeVisibleCount` / `_emitRangeChanged` / `_setRowHeight` / `_scrollToIndex`).

> **신규 Mixin 생성 금지** — 큐 설명에 "신규 VirtualScrollMixin 필요"라고 명시되었으나 SKILL 규칙상 본 루프에서 새 Mixin을 만들지 않는다. ListRenderMixin은 sliced 데이터만 받아 그대로 N개 행을 렌더하고, virtual 로직(scroll → index 계산 → renderWindow 재배치 → ListRender 재호출)은 컴포넌트 자체 메서드가 전담한다. 반복 패턴 후보로 반환에 메모만 남긴다(Lists/virtualScroll과 동일 메커니즘 → 일반화 가치 후보).

> **TabulatorMixin 미사용**: 위 "Standard와의 분리 정당성" 마지막 박스 참조. Standard 토대 답습 + 페르소나별 HTML/CSS 자유 + Lists/virtualScroll 메커니즘 답습 → ListRenderMixin이 적합.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| outer       | `.table-vs__outer`              | 스크롤 컨테이너 (`overflow-y: auto`) — scroll listener + ResizeObserver 부착 대상 |
| spacer      | `.table-vs__spacer`             | 가상 영역 높이 시뮬레이션 (`height = totalCount * rowHeight`) |
| container   | `.table-vs__window`             | renderWindow — 보이는 행이 추가될 부모 (ListRenderMixin 규약) |
| template    | `#table-vs-row-template`        | `<template>` cloneNode 대상 (ListRenderMixin 규약) |
| rowid       | `.table-vs__row`                | 렌더된 각 행 루트 — `data-rowid` 부착 + click 이벤트 매핑 |
| col1        | `.table-vs__cell--col1`         | 1번 컬럼 셀 (Standard 호환) |
| col2        | `.table-vs__cell--col2`         | 2번 컬럼 셀 |
| col3        | `.table-vs__cell--col3`         | 3번 컬럼 셀 |
| col4        | `.table-vs__cell--col4`         | 4번 컬럼 셀 |
| col5        | `.table-vs__cell--col5`         | 5번 컬럼 셀 |

> Standard와 호환 의도로 사용자 정의 KEY(`rowid`/`col1`~`col5`)는 동일. 가상 스크롤 전용 KEY는 `outer`/`spacer`/`container`(=window)/`template`. 클래스 prefix는 `table-vs__`로 Standard(`table__`)와 충돌 회피.

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| rowid | `rowid` | 행 식별 (Standard 호환) |

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_allRows` | 전체 행 배열(원본). `_renderRows`가 갱신, `_renderWindow`가 슬라이스. |
| `_rowHeight` | 행 높이 px (기본 44). `setRowHeight` 토픽 또는 페이지 직접 호출로 변경. |
| `_buffer` | 위/아래 buffer 행 수 (기본 5). |
| `_visibleStart` | 현재 렌더된 첫 행 인덱스(0-based). |
| `_visibleEnd` | 현재 렌더된 마지막 행 인덱스 + 1 (slice end exclusive). |
| `_visibleCount` | viewport에 동시 보이는 행 수 (`Math.ceil(viewportHeight / rowHeight)`). |
| `_rafId` | `requestAnimationFrame` 예약 id. throttle용. beforeDestroy에서 cancel. |
| `_scrollHandler` | bound scroll 핸들러 — beforeDestroy removeEventListener용. |
| `_resizeObserver` | ResizeObserver 인스턴스 — beforeDestroy disconnect. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `tableRows` | `this._renderRows` | `[{ rowid, col1, col2, col3, col4, col5 }]` (대용량 가능, Standard 호환) |
| `setRowHeight` | `this._setRowHeight` | `number` (px) — viewport 재계산 트리거 |
| `scrollToIndex` | `this._scrollToIndex` | `number` (0-based 인덱스) — 외부에서 명시 스크롤 |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `rowid` (ListRender) | 행 클릭 | `@tableRowClicked` (bindEvents 위임 발행). 페이로드 `{ targetInstance, event }`. |
| `@virtualRangeChanged` | — (Weventbus.emit, 직접 발행) | scroll/resize/setRowHeight로 `_visibleStart` 또는 `_visibleEnd` 변경 시 1회 | `{ targetInstance, startIndex, endIndex, totalCount, rowHeight }` |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderRows({ response })` | `tableRows` 핸들러. rows 배열을 `_allRows`에 보관 → spacer 높이 갱신(`totalCount * rowHeight`) → `outer.scrollTop = 0` → `_recomputeVisibleCount()`. 새 batch는 새 진실로 처리(이전 누적 X). |
| `_renderWindow()` | 현재 `_allRows`에서 `[_visibleStart, _visibleEnd)` 범위를 슬라이스 → `listRender.renderData({ response: slice })` → renderWindow의 `style.top = _visibleStart * _rowHeight + 'px'`. |
| `_handleScroll()` | scroll 이벤트 위임. `_rafId`가 이미 있으면 무시(이번 frame 이미 큐잉됨). 없으면 `requestAnimationFrame(() => { _rafId=null; 새 startIndex 계산 → _visibleStart/_visibleEnd 갱신 → _renderWindow() + _emitRangeChanged() })`. |
| `_recomputeVisibleCount()` | outer 높이 측정 → `_visibleCount = Math.max(1, Math.ceil(viewportHeight / _rowHeight))` → 현재 scrollTop 기준 `_visibleStart`/`_visibleEnd` 재계산 후 `_renderWindow()`. 변경이 있으면 `_emitRangeChanged()`. |
| `_setRowHeight({ response })` | `setRowHeight` 핸들러. payload가 양의 number면 `_rowHeight` 갱신 → spacer 높이 갱신 → `_recomputeVisibleCount()`. |
| `_scrollToIndex({ response })` | `scrollToIndex` 핸들러. payload가 number면 `outer.scrollTop = response * _rowHeight` 설정. scroll listener가 자연스럽게 `_renderWindow`를 트리거. |
| `_emitRangeChanged()` | `Weventbus.emit('@virtualRangeChanged', { targetInstance, startIndex, endIndex, totalCount, rowHeight })`. |

### 페이지 연결 사례

```
[페이지 — 이벤트 테이블 / 트랜잭션 원장 / 메트릭 타임라인 / 장비 인벤토리]
    │
    └─ fetchAndPublish('tableRows', this) — 대용량 배열 (5,000~50,000)
        payload 예: [{ rowid: 'evt-0', col1: '14:31:02', col2: 'gateway-01', col3: 'NETWORK', col4: 'ERROR', col5: '503' }, ...] x 10000

[Tables/Advanced/virtualScroll]
    ├─ _renderRows가 _allRows 보관, spacer.height = 10000*44 = 440000px 설정
    ├─ _recomputeVisibleCount() → viewportHeight=380 / rowHeight=44 → _visibleCount=9
    ├─ scrollTop=0이므로 _visibleStart=0, _visibleEnd=19 (9 + buffer*2=10)
    ├─ ListRender가 sliced 19개 행만 DOM에 렌더 (전체 10,000 중)
    ├─ renderWindow의 top=0px (sliced.first * rowHeight)
    └─ @virtualRangeChanged: { startIndex:0, endIndex:19, totalCount:10000, rowHeight:44 } 발행

[사용자가 5000번째 행으로 스크롤 (scrollTop=220000)]
    ├─ scroll 이벤트 → rAF 예약
    ├─ rAF callback → startIndex=Math.floor(220000/44)-5=4995, endIndex=4995+19=5014
    ├─ ListRender 재렌더 (slice [4995, 5014))
    ├─ renderWindow.style.top = 4995*44 = 219780px
    └─ @virtualRangeChanged: { startIndex:4995, endIndex:5014, totalCount:10000, rowHeight:44 } 발행

운영: this.pageDataMappings = [
        { topic: 'tableRows', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@tableRowClicked': ({ event }) => {
          const id = event.target.closest('.table-vs__row')?.dataset.rowid;
          // 상세 페이지로 이동 / 행 선택 토글
        },
        '@virtualRangeChanged': ({ startIndex, endIndex, totalCount }) => {
          // 필요 시 다음 페이지 lazy load 트리거
        }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 / 그라디언트 호버 / Pretendard / rowHeight 44px / outer height 420px | **이벤트 테이블** (10,000행 INFO/WARN/ERROR 누적 — Time / Target / Category / Status / Value) |
| `02_material`    | B: Material Elevated | 라이트 / elevation shadow / Roboto / rowHeight 48px / outer height 480px | **트랜잭션 원장** (8,000건 결제 시계열 — Time / Account / Type / Status / Amount) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 / DM Serif / 넓은 여백 / rowHeight 56px / outer height 540px | **연감/도서 인덱스** (6,000행 도서 카탈로그 — Year / Author / Title / Genre / Pages) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 / 시안 테두리 / IBM Plex Mono / rowHeight 32px / outer height 360px | **메트릭 타임라인** (1,440행 24h 분단위 — Timestamp / Probe / Metric / Status / Value) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따른다. rowHeight는 페르소나 간격 리듬에 맞춰 차등(32~56px). outer height도 페르소나 레이아웃에 따라 차등.

### 결정사항

- **고정 행 높이 가정**: 본 변형은 모든 행이 동일 height라고 가정한다(각 변형의 CSS가 행 높이를 상수로 잠금). 가변 높이 지원은 별도 변형(예: `virtualScrollDynamic`)에서 다룬다 — 측정 캐시 + binary search 기반 `cumulativeOffset`을 요구하므로 본 변형의 inline 계산보다 복잡도가 1단계 높음.
- **rowHeight 일치**: 페르소나별 CSS의 `.table-vs__row { height: Npx; }`와 register.js의 `_rowHeight` 기본값이 정확히 일치해야 한다(불일치 시 spacer 영역과 시각 행이 어긋난다). 본 변형은 default 44px이며 페르소나 CSS도 44px(또는 페르소나별 차등 시 `setRowHeight` 토픽으로 동기화).
- **buffer 5행**: 빠른 스크롤 시 빈 영역 노출 방지. Vue/React 가상 스크롤 라이브러리 일반값.
- **헤더 정적 슬롯**: Standard와 동일하게 헤더 라벨은 HTML에 직접 작성. 컬럼 5개 고정. 헤더가 스크롤하지 않도록 outer 외부에 두어 sticky 효과(헤더용 ListRenderMixin은 본 변형의 범위 외).
- **Standard 호환 cssSelectors KEY 일부**: `rowid`/`col1~col5`는 동일. Standard ↔ Advanced 변형 교체 시 페이지 코드 답습 가능. 가상 스크롤 전용 KEY(`outer`/`spacer`/`container`/`template`)만 추가.
- **클래스 prefix 분리**: Standard는 `.table__*`, Advanced/virtualScroll은 `.table-vs__*`로 분리(같은 페이지에 두 변형이 공존해도 CSS 충돌 X).
- **Lists/virtualScroll 메커니즘 답습**: 자체 상태/메서드 명명, scroll/ResizeObserver/rAF 라이프사이클, `@virtualRangeChanged` payload 모두 Lists/Advanced/virtualScroll의 검증된 패턴을 그대로 답습. 차이는 행 구조(list-vs vs table-vs)와 도메인.
- **신규 Mixin 생성 금지**: 큐 설명의 "신규 VirtualScrollMixin 필요"는 본 SKILL의 대상이 아님. 자체 메서드로 완결. 반복 패턴 후보로 메모만(Lists/virtualScroll + Tables/virtualScroll 동일 메커니즘 → 일반화 가치 누적).

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions / customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서 (rAF cancel + scroll listener remove + ResizeObserver disconnect → customEvents 제거 → 구독 해제 → 자체 상태/메서드 null + listRender.destroy)
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Tables/Advanced/virtualScroll/preview/...html` → `../`를 5번 = Lists/Advanced/virtualScroll, Switch/Advanced/confirmBeforeToggle 동일 verbatim 복사)
