# Lists — Advanced / virtualScroll

## 기능 정의

1. **대용량 리스트 항목 가상 렌더 (virtual rendering)** — `listItems` 토픽으로 수신한 대규모 배열(예: 5,000~50,000 항목)을 모두 DOM에 렌더하지 않고, viewport에 보이는 범위 + 위/아래 buffer만 ListRenderMixin의 `renderData(slicedItems)`로 렌더한다. 전체 스크롤 영역 높이는 spacer로 시뮬레이션한다 (`spacer.height = totalCount * rowHeight`). 보이는 범위는 `_visibleStart` ~ `_visibleEnd`에 보관.
2. **고정 행 높이 기반 인덱스 계산 (fixed row height)** — 모든 행이 동일 높이(`_rowHeight`, 기본 56px)를 가정. `scrollTop` 측정 → `startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer)` → `visibleCount = Math.ceil(viewportHeight / rowHeight)` → `endIndex = Math.min(totalCount, startIndex + visibleCount + buffer * 2)`. 가변 높이는 본 변형의 범위가 아니다 (반복 패턴 후보 메모로만).
3. **스크롤 throttle via requestAnimationFrame** — outer 컨테이너의 `scroll` 이벤트는 native event다. 매 이벤트마다 재계산하면 빈번한 리렌더가 발생하므로 `requestAnimationFrame` 기반 coalesce: 첫 scroll 이벤트가 rAF 예약을 큐잉하고 다음 이벤트는 동일 frame에서 무시. rAF callback에서 새 범위 계산 후 변경 시에만 `_renderWindow()` 호출 + `@virtualRangeChanged` 발행. rAF id는 `_rafId`로 보관, beforeDestroy에서 `cancelAnimationFrame` 호출.
4. **renderWindow의 absolute positioning** — outer `position: relative; overflow-y: auto` + spacer `position: absolute; top:0; left:0; width:100%; height: totalCount*rowHeight; pointer-events: none` (스크롤바 영역만 만들고 visual 무관) + renderWindow `position: absolute; top: ${startIndex * rowHeight}px; left:0; right:0` (보이는 항목만 ListRenderMixin이 렌더). renderWindow의 top을 갱신함으로써 스크롤 위치와 시각적 항목 위치가 일치한다. ListRenderMixin의 `container`를 renderWindow에 두면 Mixin은 sliced 데이터만 받아 그대로 렌더한다 (Mixin은 virtual 인지 X).
5. **ResizeObserver로 viewport 높이 추적** — outer 높이는 페이지 레이아웃에 따라 달라질 수 있다 (창 리사이즈, 부모 컨테이너 변화). ResizeObserver로 outer 높이 변화 감지 → `_visibleCount = Math.ceil(viewportHeight / rowHeight)` 재계산 → `_renderWindow()` 재호출. ResizeObserver는 `_resizeObserver`로 보관, beforeDestroy에서 `disconnect`.
6. **항목 클릭 호환** — Standard와 동일한 `@listItemClicked` 발행. `event.target.closest('.list-vs__item')?.dataset.itemid`로 항목 식별 가능. Standard와 cssSelectors 계약 호환을 위해 `itemid`/`leading`/`headline`/`supporting` KEY는 그대로 유지 (디자인 자유, 데이터 그대로 패스).
7. **범위 변경 이벤트 발행** — `_visibleStart`/`_visibleEnd`가 변하면 `@virtualRangeChanged` 1회 발행. payload: `{ targetInstance, startIndex, endIndex, totalCount, rowHeight }`. 페이지가 lazy-load(서버에서 다음 페이지 가져오기), telemetry, virtualization 디버깅 등에 활용.

> **Standard와의 분리 정당성**:
> - **새 자체 상태 6종** (`_allItems`/`_rowHeight`/`_buffer`/`_visibleStart`/`_visibleEnd`/`_visibleCount`) — Standard는 stateless. virtualScroll은 viewport 슬라이스 진실을 컴포넌트로 흡수.
> - **자체 메서드 6종** (`_renderItems`/`_renderWindow`/`_handleScroll`/`_recomputeVisibleCount`/`_emitRangeChanged`/`_setRowHeight`) — Standard는 자체 메서드 0종.
> - **scroll/ResizeObserver/rAF 3종 native lifecycle** — Standard는 사용 안함.
> - **새 이벤트** — `@virtualRangeChanged` (Standard는 `@listItemClicked`만).
> - **선택적 토픽 2종** — `setRowHeight`/`scrollToIndex` (외부 강제 변경/명시 스크롤 진입). Standard는 `listItems` 1종.
> - **3층 HTML 구조** — Standard는 단일 `.list__items` 컨테이너. virtualScroll은 outer/spacer/renderWindow 3층(absolute layered)으로 가상 영역과 가시 영역 분리.
>
> 위 6축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가. **신규 Mixin 생성 없이** ListRenderMixin + 자체 메서드로 완결한다.

> **draggableReorder/swipeToDelete와의 직교성**: draggableReorder는 항목 순서 재배치(dragstart/over/drop), swipeToDelete는 좌/우 스와이프 삭제(touch move/end). virtualScroll은 viewport 외 항목을 DOM에서 제외하는 렌더링 전략. 셋은 동일한 `listItems` 데이터 모델을 공유하지만 책임이 직교 — 동일 컴포넌트가 셋을 동시에 수행하면 register.js가 다중 충돌(scroll listener vs DnD pointer 충돌, virtual renderWindow vs absolute swipe transform 충돌)을 일으킨다.

> **MD3 / 도메인 근거**: MD3 Lists는 텍스트와 이미지의 연속적인 수직 인덱스다. **항목이 수천~수만 개로 늘어나면** 모든 항목을 DOM에 렌더하는 것은 메모리/페인트 성능을 직접적으로 침해한다(브라우저는 수백~수천 노드 이후 60fps 보장 어려움). 실사용: ① **로그 뷰어**(서버/장비 이벤트 10,000+ 행), ② **사용자 디렉토리/카탈로그**(전체 직원/고객/디바이스 검색 결과), ③ **메트릭 타임라인**(분단위 24시간 = 1,440 / 초단위 = 86,400), ④ **알람/이벤트 스트림**(누적 이력 표시). 가상 스크롤은 1990년대 일반 데스크탑 GUI(WPF ListView, Win32 ListBox)부터 일반화된 표준 기법이며, react-window / vue-virtual-scroller / SwiftUI LazyVStack 등 모든 모던 UI 프레임워크가 동등 기능을 제공한다.

---

## 구현 명세

### Mixin

ListRenderMixin (sliced 항목 배열만 렌더 — Mixin은 virtual 인지 X) + 자체 메서드(`_renderItems` / `_renderWindow` / `_handleScroll` / `_recomputeVisibleCount` / `_emitRangeChanged` / `_setRowHeight`).

> **신규 Mixin 생성 금지** — 큐 설명에 "신규 VirtualScrollMixin 필요"라고 명시되었으나 SKILL 규칙상 본 루프에서 새 Mixin을 만들지 않는다. ListRenderMixin은 sliced 데이터만 받아 그대로 N개 항목을 렌더하고, virtual 로직(scroll → index 계산 → renderWindow 재배치 → ListRender 재호출)은 컴포넌트 자체 메서드가 전담한다. 반복 패턴 후보로 반환에 메모만 남긴다 (가변 높이 지원으로 확장 시 일반화 가치).

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| outer       | `.list-vs__outer`              | 스크롤 컨테이너 (`overflow-y: auto`) — scroll listener + ResizeObserver 부착 대상 |
| spacer      | `.list-vs__spacer`             | 가상 영역 높이 시뮬레이션 (`height = totalCount * rowHeight`) |
| container   | `.list-vs__window`             | renderWindow — 보이는 항목이 추가될 부모 (ListRenderMixin 규약) |
| template    | `#list-vs-item-template`       | `<template>` cloneNode 대상 (ListRenderMixin 규약) |
| itemid      | `.list-vs__item`               | 렌더된 각 항목 루트 — `data-itemid` 부착 + click 이벤트 매핑 |
| leading     | `.list-vs__leading`            | 선행 요소 (아이콘/이모지 textContent) |
| headline    | `.list-vs__headline`           | 헤드라인 텍스트 |
| supporting  | `.list-vs__supporting`         | 보조 텍스트 |

> Standard와 호환 의도로 사용자 정의 KEY(`itemid`/`leading`/`headline`/`supporting`)는 동일. 가상 스크롤 전용 KEY는 `outer`/`spacer`/`container`(=window)/`template`.

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| itemid | `itemid` | 항목 식별 (Standard 호환) |

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_allItems` | 전체 항목 배열(원본). `_renderItems`가 갱신, `_renderWindow`가 슬라이스. |
| `_rowHeight` | 행 높이 px (기본 56). `setRowHeight` 토픽 또는 페이지 직접 호출로 변경. |
| `_buffer` | 위/아래 buffer 행 수 (기본 5). |
| `_visibleStart` | 현재 렌더된 첫 항목 인덱스(0-based). |
| `_visibleEnd` | 현재 렌더된 마지막 항목 인덱스 + 1 (slice end exclusive). |
| `_visibleCount` | viewport에 동시 보이는 행 수 (`Math.ceil(viewportHeight / rowHeight)`). |
| `_rafId` | `requestAnimationFrame` 예약 id. throttle용. beforeDestroy에서 cancel. |
| `_scrollHandler` | bound scroll 핸들러 — beforeDestroy removeEventListener용. |
| `_resizeObserver` | ResizeObserver 인스턴스 — beforeDestroy disconnect. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `listItems` | `this._renderItems` | `[{ itemid, leading?, headline, supporting? }]` (대용량 가능) |
| `setRowHeight` | `this._setRowHeight` | `number` (px) — viewport 재계산 트리거 |
| `scrollToIndex` | `this._scrollToIndex` | `number` (0-based 인덱스) — 외부에서 명시 스크롤 |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `itemid` (ListRender) | 항목 클릭 | `@listItemClicked` (bindEvents 위임 발행). 페이로드 `{ targetInstance, event }`. |
| `@virtualRangeChanged` | — (Weventbus.emit, 직접 발행) | scroll/resize/setRowHeight로 `_visibleStart` 또는 `_visibleEnd` 변경 시 1회 | `{ targetInstance, startIndex, endIndex, totalCount, rowHeight }` |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderItems({ response })` | `listItems` 핸들러. items 배열을 `_allItems`에 보관 → spacer 높이 갱신(`totalCount * rowHeight`) → `_recomputeVisibleCount()` → `_renderWindow()`. 새 batch는 새 진실로 처리 (이전 누적 X). |
| `_renderWindow()` | 현재 `_allItems`에서 `[_visibleStart, _visibleEnd)` 범위를 슬라이스 → `listRender.renderData({ response: slice })` → renderWindow의 `style.top = _visibleStart * _rowHeight + 'px'`. 변경이 있으면 `_emitRangeChanged()`. |
| `_handleScroll()` | scroll 이벤트 위임. `_rafId`가 이미 있으면 무시(이번 frame 이미 큐잉됨). 없으면 `requestAnimationFrame(() => { _rafId=null; 새 startIndex 계산 → _visibleStart/_visibleEnd 갱신 → _renderWindow() })`. |
| `_recomputeVisibleCount()` | outer 높이 측정 → `_visibleCount = Math.max(1, Math.ceil(viewportHeight / _rowHeight))` → `_visibleEnd` 재계산 후 `_renderWindow()`. |
| `_setRowHeight({ response })` | `setRowHeight` 핸들러. payload가 양의 number면 `_rowHeight` 갱신 → spacer 높이 갱신 → `_recomputeVisibleCount()` → `_renderWindow()`. |
| `_scrollToIndex({ response })` | `scrollToIndex` 핸들러. payload가 number면 `outer.scrollTop = response * _rowHeight` 설정. scroll listener가 자연스럽게 `_renderWindow`를 트리거. |
| `_emitRangeChanged(prevStart, prevEnd)` | `_visibleStart`/`_visibleEnd`가 prev와 다르면 `Weventbus.emit('@virtualRangeChanged', { targetInstance, startIndex, endIndex, totalCount, rowHeight })`. |

### 페이지 연결 사례

```
[페이지 — 로그 뷰어 / 사용자 디렉토리 / 메트릭 타임라인 / 알람 스트림]
    │
    └─ fetchAndPublish('listItems', this) — 대용량 배열 (5,000~50,000)
        payload 예: [{ itemid: 'log-0', leading: '[INFO]', headline: '...', supporting: '14:31:02' }, ...] x 10000

[Lists/Advanced/virtualScroll]
    ├─ _renderItems가 _allItems 보관, spacer.height = 10000*56 = 560000px 설정
    ├─ _recomputeVisibleCount() → viewportHeight=420 / rowHeight=56 → _visibleCount=8
    ├─ scrollTop=0이므로 _visibleStart=0, _visibleEnd=18 (8 + buffer*2=10)
    ├─ ListRender가 sliced 18개 항목만 DOM에 렌더 (전체 10,000 중)
    ├─ renderWindow의 top=0px (sliced.first * rowHeight)
    └─ @virtualRangeChanged: { startIndex:0, endIndex:18, totalCount:10000, rowHeight:56 } 발행

[사용자가 5000번째 행으로 스크롤 (scrollTop=280000)]
    ├─ scroll 이벤트 → rAF 예약
    ├─ rAF callback → startIndex=Math.floor(280000/56)-5=4995, endIndex=4995+18=5013
    ├─ ListRender 재렌더 (slice [4995, 5013))
    ├─ renderWindow.style.top = 4995*56 = 279720px
    └─ @virtualRangeChanged: { startIndex:4995, endIndex:5013, totalCount:10000, rowHeight:56 } 발행

운영: this.pageDataMappings = [
        { topic: 'listItems', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@listItemClicked': ({ event }) => {
          const id = event.target.closest('.list-vs__item')?.dataset.itemid;
          // 상세 페이지로 이동
        },
        '@virtualRangeChanged': ({ startIndex, endIndex, totalCount }) => {
          // 필요 시 다음 페이지 lazy load 트리거 (서버 페이징 + virtual scroll 결합)
        }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 / 그라디언트 호버 / Pretendard / rowHeight 56px / outer height 420px | **로그 뷰어** (10,000행 INFO/WARN/ERROR 이벤트 스트림 — leading=레벨 마커, supporting=timestamp) |
| `02_material`    | B: Material Elevated | 라이트 / elevation shadow / Roboto / rowHeight 64px / outer height 480px | **사용자 디렉토리** (5,000명 직원 검색 결과 — leading=이니셜 아바타, supporting=부서) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 / DM Serif / 넓은 여백 / rowHeight 72px / outer height 540px | **추천 카탈로그** (전 도서 8,000권 인덱스 — leading=장르 글리프, supporting=저자) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 / 시안 테두리 / IBM Plex Mono / rowHeight 40px (조밀) / outer height 360px | **메트릭 타임라인** (24시간 분단위 = 1,440행, leading=상태 dot, supporting=수치) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따른다. rowHeight는 페르소나 간격 리듬에 맞춰 차등(40~72px). outer height도 페르소나 레이아웃에 따라 차등.

### 결정사항

- **고정 행 높이 가정**: 본 변형은 모든 행이 동일 height라고 가정한다 (각 변형의 CSS가 행 높이를 상수로 잠금). 가변 높이 지원은 별도 변형(예: `virtualScrollDynamic`)에서 다룬다 — 측정 캐시 + binary search 기반 `cumulativeOffset`을 요구하므로 본 변형의 inline 계산보다 복잡도가 1단계 높음.
- **rowHeight 일치**: 페르소나별 CSS의 `.list-vs__item { height: Npx; }`와 register.js의 `_rowHeight` 기본값이 정확히 일치해야 한다 (불일치 시 spacer 영역과 시각 항목이 어긋난다). 본 변형은 default 56px이며 페르소나 CSS도 56px(또는 페르소나별 차등 시 setRowHeight 토픽으로 동기화).
- **buffer 5행**: 빠른 스크롤 시 빈 영역 노출 방지. Vue/React 가상 스크롤 라이브러리 일반값.
- **신규 Mixin 생성 금지**: 큐 설명의 "신규 VirtualScrollMixin 필요"는 본 SKILL의 대상이 아님. 자체 메서드로 완결. 반복 패턴 후보로 메모만.
