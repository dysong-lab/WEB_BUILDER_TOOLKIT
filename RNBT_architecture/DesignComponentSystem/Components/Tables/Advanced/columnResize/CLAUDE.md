# Tables — Advanced / columnResize

## 기능 정의

1. **헤더 셀 우측 경계 resize handle** — 각 헤더 셀(`.table-cr__head-cell--col{1..5}`) 우측 경계에 4px 폭 hit area(`.table-cr__resize-handle[data-col="col1..col5"]`)를 두고 `cursor: col-resize`로 사용자에게 드래그 가능함을 알린다. 마지막 컬럼(col5)은 우측 경계 트레일링 컨테이너 끝이므로 handle을 제공하지 않는다(col1~col4 4개).
2. **pointer 4종 + setPointerCapture로 드래그 추적** — `pointerdown`에서 `_resizingCol`/`_startX`/`_originW` 스냅샷 + `setPointerCapture` → `pointermove`에서 `dx = e.clientX - _startX` 계산 → 해당 컬럼의 새 width = `_clampWidth(_originW + dx)` → `appendElement.style.setProperty('--col{N}-w', width + 'px')` 갱신 → `pointerup`/`pointercancel`에서 종료 + `releasePointerCapture`. capture로 handle 영역을 벗어나도 동일 요소가 move/up을 계속 수신.
3. **min/max width clamp** — 컬럼별 `_minWidth`(기본 60), `_maxWidth`(기본 800) 안에 각 컬럼 width를 클램프. `_clampWidth(w)` = `Math.min(_maxWidth, Math.max(_minWidth, w))`.
4. **CSS Grid layout + CSS variable per column** — 헤더 행/필요 시 행/body의 모든 row가 `display: grid; grid-template-columns: var(--col1-w) var(--col2-w) var(--col3-w) var(--col4-w) var(--col5-w)`로 정렬된다. 페르소나별 CSS는 컴포넌트 컨테이너(`#table-container`)에 초기 `--colN-w` 값을 선언하고, 컴포넌트 자체 메서드가 인스턴스 root의 `style.setProperty('--colN-w', value)`로 동적 갱신한다(런타임 layout 즉각 반영, JS 측 row 단위 width 갱신 불필요).
5. **resize 라이프사이클 이벤트 3종** — pointerdown 시 `@columnResizeStart` `{ col, width }` 1회, 드래그 중 width가 실제로 갱신될 때마다 `@columnResized` `{ col, width, allWidths }` 발행, pointerup/cancel 시 `@columnResizeEnd` `{ col, width, allWidths }` 1회 발행. payload `allWidths`는 `{ col1, col2, col3, col4, col5 }` 평탄 객체(현재 5컬럼 width 스냅샷, localStorage 저장/URL 동기화 용도).
6. **외부 명령형 width 강제 (setColumnWidths 토픽)** — 페이지가 `setColumnWidths` 토픽으로 `{ col1?: 200, col2?: 150, ... }` 페이로드를 publish 하면 `_setColumnWidths` 핸들러가 동일 clamp + CSS variable 갱신을 수행. localStorage 복원, URL state 동기화, preset 적용에 활용. 이벤트 발행 없음.
7. **resize 상태 시각 차별 (data-resizing)** — `appendElement.dataset.resizing="true|false"`를 부착해 CSS가 페르소나별로 idle/resizing 2상태(handle 강조 색, head-row 그림자, 본문 `user-select: none`)를 차별화. handle 자체는 항상 `cursor: col-resize`.
8. **행 클릭 호환 (Standard 호환)** — Standard 와 동일하게 `@tableRowClicked` 발행. 행 click 핸들러는 ListRenderMixin item 선택자(`.table-cr__row`) computed property로 매핑. resize handle click은 stopPropagation 처리는 불필요(pointer 이벤트는 click과 별개 sequence이며, pointer 종료가 click을 트리거하는 일반 시나리오에서도 handle은 head-row 안에 있어 행 click과 분리됨).
9. **resize 진행 중 row 갱신 안전 (ListRenderMixin은 width 인지 X)** — 행 데이터 갱신은 `tableRows` 토픽 → `listRender.renderData`가 처리한다. ListRender는 width를 모르며, row template은 grid 자식이라 root의 `--colN-w`를 자동 적용. resize 도중 새 batch가 도착해도 width 상태는 보존(CSS variable이 root에 있고 ListRender는 root는 건드리지 않음).

> **Standard와의 분리 정당성**:
> - **자체 상태 9종** (`_columns` / `_widths` / `_minWidth` / `_maxWidth` / `_isPointerDown` / `_resizingCol` / `_startX` / `_originW` / `_pointerId`) — Standard 는 stateless. columnResize 는 컬럼 width 진실(컬럼 목록 + 컬럼별 width 스냅샷 + drag 상태)을 컴포넌트로 흡수.
> - **Shadow DOM 외부 native pointer 리스너 라이프사이클** — Standard 에는 없는 pointer 4종(down/move/up/cancel)을 head-row 직접 부착(handle 4개 위임). bound handler 4종 보관 + beforeDestroy detach.
> - **자체 메서드 9종** (`_clampWidth` / `_setWidth` / `_handlePointerDown` / `_handlePointerMove` / `_handlePointerUp` / `_handlePointerCancel` / `_setColumnWidths` / `_emitResized` / `_collectAllWidths`) — Standard 는 자체 메서드 0종.
> - **새 이벤트 3종** — `@columnResizeStart` / `@columnResized` / `@columnResizeEnd` (Standard 는 `@tableRowClicked` 만).
> - **선택 토픽 1종** — `setColumnWidths` (외부 강제 width). Standard 는 `tableRows` 1종.
> - **새 cssSelectors KEY 2종** — `headRow` (pointer 위임 부착 대상) + `resizeHandle` (handle 식별). Standard 에는 없음.
> - **CSS Grid layout + CSS variable 동적 갱신** — Standard 는 flexbox 컬럼 분배. columnResize 는 grid-template-columns + `--colN-w` CSS variable 로 각 행 width 일괄 동기화. 동일 register.js 로 표현 불가.
>
> 위 7축은 동일 register.js 로 표현 불가 → Standard 내부 variant 로 흡수 불가. **신규 Mixin 생성 없이** ListRenderMixin + 자체 메서드로 완결한다.

> **filterableHeader / sortableColumn / virtualScroll 와의 직교성**: virtualScroll 은 viewport DOM 범위(스크롤 진실), sortableColumn 은 행 순서(정렬 진실), filterableHeader 는 행 가시성(필터 진실), columnResize 는 컬럼 width(layout 진실). 네 변형 모두 서로 다른 축을 다루며 독립적이다. 동일한 ListRenderMixin 토대 + Standard 호환 KEY(`rowid`/`col1~col5`)를 공유.

> **참조 패턴**:
> - `Tables/Advanced/filterableHeader` (직전, 동일 컴포넌트, 5단계) — Standard 토대 답습 + 자체 상태/메서드/이벤트/토픽 분리, preview `<script src>` 5단계 깊이, demo-label/hint 도메인 컨텍스트 명시.
> - `Dialogs/Advanced/resizable` — pointer 4종 + setPointerCapture + clamp + bound handler 4종 보관 + data-resizing 속성 패턴. 본 변형은 width 1축(direction 분기 불필요, col1~col4 위임만 분기) + Shadow DOM 외부(head-row direct attach) + width-only(height 갱신 없음)로 응용.

> **MD3 / 도메인 근거**: MD3 Data tables(MD1 Data Tables 에서 정의)는 column resize 를 표준 인터랙션으로 명시하지 않으나, 모든 모던 데이터 테이블 라이브러리(ag-grid `resizable`, Tabulator `resizableColumns`, Material Web Table)가 column header resize 를 1급 기능으로 제공. Native OS 윈도우 패러다임(file explorer 컬럼 resize, spreadsheet 컬럼 resize)에서 표준. 실사용: ① **로그/이벤트 테이블**(긴 메시지 컬럼을 넓혀 가독성 확보), ② **고객 디렉토리**(이메일/이름 컬럼 균형), ③ **연감/도서 카탈로그**(제목/저자 컬럼 가변 폭), ④ **장비 인벤토리**(prober/host name 컬럼 비대칭 width).

---

## 구현 명세

### Mixin

ListRenderMixin (행 데이터 렌더링 — Mixin 은 width 인지 X) + 자체 메서드 9종(`_clampWidth` / `_setWidth` / `_handlePointerDown` / `_handlePointerMove` / `_handlePointerUp` / `_handlePointerCancel` / `_setColumnWidths` / `_emitResized` / `_collectAllWidths`).

> **신규 Mixin 생성 금지** — 큐 설명에 resize 메커니즘이 명시되었으나 SKILL 규칙상 본 루프에서 새 Mixin 을 만들지 않는다. ListRenderMixin 은 행 배열을 받아 그대로 N 개 grid row 를 렌더하고, resize 로직(pointer → clamp → CSS variable 갱신 → 이벤트 발행)은 컴포넌트 자체 메서드가 전담한다. CSS Grid + CSS variable 갱신은 컴포넌트 root 에서 일괄 동기화되므로 row 단위 갱신 불필요.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.table-cr__body` | 행이 추가될 부모 (ListRenderMixin 규약) |
| template  | `#table-cr-row-template` | `<template>` cloneNode 대상 (ListRenderMixin 규약) |
| rowid     | `.table-cr__row` | 렌더된 각 행 루트 — `data-rowid` 부착 + click 이벤트 매핑 |
| col1      | `.table-cr__cell--col1` | 1번 컬럼 셀 (Standard 호환) |
| col2      | `.table-cr__cell--col2` | 2번 컬럼 셀 |
| col3      | `.table-cr__cell--col3` | 3번 컬럼 셀 |
| col4      | `.table-cr__cell--col4` | 4번 컬럼 셀 |
| col5      | `.table-cr__cell--col5` | 5번 컬럼 셀 |
| headRow   | `.table-cr__head-row` | 헤더 행 — pointerdown/move/up/cancel 위임 부착 대상 |
| resizeHandle | `.table-cr__resize-handle` | 컬럼별 resize handle — `data-col` 부착(컬럼 식별) |

> Standard 와 호환 의도로 사용자 정의 KEY(`rowid`/`col1`~`col5`)는 동일. resize 전용 KEY 는 `headRow`/`resizeHandle`. 클래스 prefix 는 `table-cr__` 로 Standard(`table__`), virtualScroll(`table-vs__`), sortableColumn(`table-sc__`), filterableHeader(`table-fh__`) 와 충돌 회피.

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| rowid | `rowid` | 행 식별 (Standard 호환) |

### HTML resize handle 규약

각 resize handle(`.table-cr__resize-handle`)은 `data-col="col1..col4"` 속성을 가져야 한다. handle 핸들러가 이 값으로 `_resizingCol` 갱신. col5(마지막 컬럼)에는 handle 을 두지 않는다.

```html
<div class="table-cr__head-row">
    <span class="table-cr__head-cell table-cr__head-cell--col1">Time
        <span class="table-cr__resize-handle" data-col="col1"></span>
    </span>
    ...
    <span class="table-cr__head-cell table-cr__head-cell--col5">Value</span>
</div>
```

CSS 는 각 행을 `display: grid; grid-template-columns: var(--col1-w) var(--col2-w) var(--col3-w) var(--col4-w) var(--col5-w)` 로 layout 한다. `#table-container` 또는 `.table-cr` 에 초기 `--colN-w` 값을 선언한다(예: `--col1-w: 100px; --col2-w: 160px; ...`). 컴포넌트가 inline 으로 `appendElement.style.setProperty('--colN-w', ...)` 를 갱신해 우선순위를 가진다.

### 인스턴스 상태

| 키 | 타입 | 기본 | 설명 |
|----|------|------|------|
| `_columns` | `string[]` | `['col1','col2','col3','col4','col5']` | 컬럼 KEY 목록(고정 5개). resize 가능 컬럼은 마지막 제외 4개. |
| `_widths` | `{col1, col2, col3, col4, col5}` | `null` (페르소나별 CSS 의 `--colN-w` 가 진실) | 컴포넌트가 직접 설정한 width 스냅샷. drag/외부 강제로 갱신될 때 채워진다. |
| `_minWidth` | `number` | `60` | 컬럼별 최소 width(px). |
| `_maxWidth` | `number` | `800` | 컬럼별 최대 width(px). |
| `_isPointerDown` | `boolean` | `false` | down→up 사이의 활성 상태. 중복 down 차단 + move 처리 게이트. |
| `_resizingCol` | `string \| null` | `null` | 현재 활성 컬럼 KEY(`'col1'` 등). pointerup 에서 `null` 로 복귀. |
| `_startX` | `number` | `0` | pointerdown 시점의 client X. dx 기준. |
| `_originW` | `number` | `0` | pointerdown 시점의 컬럼 width 스냅샷. clamp 기준. |
| `_pointerId` | `number \| null` | `null` | setPointerCapture/release 용. |
| `_pointerDownHandler` / `_pointerMoveHandler` / `_pointerUpHandler` / `_pointerCancelHandler` | `Function \| null` | `null` | bound handler 참조 — beforeDestroy 에서 정확히 removeEventListener |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `tableRows` | `this.listRender.renderData` | `[{ rowid, col1, col2, col3, col4, col5 }]` (Standard 호환) |
| `setColumnWidths` | `this._setColumnWidths` | `{ col1?: number, col2?: number, ..., col5?: number }` — 외부 강제. 누락된 컬럼은 변경 없음. |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `rowid` (ListRender) | 행 클릭 | `@tableRowClicked` (bindEvents 위임 발행). |

### 자체 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@columnResizeStart` | pointerdown 시점 1회 | `{ targetInstance, col, width }` |
| `@columnResized` | pointermove 에서 width 가 실제로 갱신될 때마다 | `{ targetInstance, col, width, allWidths }` |
| `@columnResizeEnd` | pointerup/cancel 시점 1회 | `{ targetInstance, col, width, allWidths }` |

> resize handle 의 pointerdown/move/up/cancel 은 `customEvents` 에 매핑하지 않는다 — drag 4단계 + 컬럼별 `_widths` + clamp + CSS variable 갱신이 자체 메서드 안에서 의미적으로 완결되며, 단순 발행이 아닌 상태 전이를 동반한다. `bindEvents` 가 발행할 단일 `@event` 로 표현되지 않는다.

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_clampWidth(w)` | `(number) => number` | `Math.min(_maxWidth, Math.max(_minWidth, w))` 로 컬럼 width clamp. |
| `_setWidth(col, width)` | `(string, number) => boolean` | `_widths[col]` 갱신 + `appendElement.style.setProperty('--' + col + '-w', width + 'px')`. 동일 width 면 `false` 반환(이벤트 발행 억제). 갱신되었으면 `true`. |
| `_collectAllWidths()` | `() => {col1, col2, col3, col4, col5}` | 현재 5컬럼 width 평탄 객체. `_widths` 에 값이 있으면 그 값, 없으면 `getComputedStyle(appendElement).getPropertyValue('--colN-w')` 의 px 정수. |
| `_emitResized(col, eventName)` | `(string, string) => void` | `Weventbus.emit(eventName, { targetInstance, col, width: _widths[col], allWidths: _collectAllWidths() })`. start 는 allWidths 생략 가능하지만 일관성 위해 동일 payload. |
| `_handlePointerDown(e)` | `(PointerEvent) => void` | mouse 는 좌클릭(0)만 허용. `e.target.closest('.table-cr__resize-handle[data-col]')` 로 컬럼 식별. `_resizingCol`/`_startX`/`_originW` 스냅샷 + `_isPointerDown=true` + `setPointerCapture` 시도 + `appendElement.dataset.resizing='true'` + `@columnResizeStart` 1회 발행. `e.preventDefault()` 로 텍스트 선택 방지. |
| `_handlePointerMove(e)` | `(PointerEvent) => void` | `_isPointerDown` 활성 + `_pointerId` 매치 시 `dx = e.clientX - _startX` → `nextW = _clampWidth(_originW + dx)` → `_setWidth(_resizingCol, nextW)` → 갱신되었으면 `_emitResized(col, '@columnResized')` 발행. |
| `_handlePointerUp(e)` | `(PointerEvent) => void` | `_isPointerDown=false` + `appendElement.dataset.resizing='false'` + `@columnResizeEnd` 1회 발행. `releasePointerCapture` 시도. `_resizingCol`/`_pointerId` 복귀. |
| `_handlePointerCancel(e)` | `(PointerEvent) => void` | `_handlePointerUp` 동일 처리. |
| `_setColumnWidths({ response })` | `({response}) => void` | `setColumnWidths` 토픽 핸들러. payload 의 각 col 값을 clamp 후 `_setWidth` 로 갱신. resize 이벤트 발행 없음(외부 강제이므로). |

### 페이지 연결 사례

```
[페이지 — 로그/이벤트, 고객 디렉토리, 연감/카탈로그, 장비 인벤토리]
    │
    └─ fetchAndPublish('tableRows', this) — 행 배열
        payload 예: [{ rowid: 'evt-0', col1: '14:31:02', col2: 'gateway-01', col3: 'NETWORK', col4: 'ERROR', col5: '503' }, ...]

[Tables/Advanced/columnResize]
    ├─ ListRender 가 행 배열 그대로 N 개 grid row 렌더 (CSS variable 자동 적용)
    └─ 페르소나 CSS 의 초기 --col1-w ~ --col5-w 값으로 layout

[사용자가 col2 헤더 우측 handle 드래그]
    ├─ pointerdown — _resizingCol='col2', _startX, _originW 스냅샷
    │              + appendElement.dataset.resizing='true' + setPointerCapture
    │              + @columnResizeStart { col:'col2', width:_originW } 1회 발행
    ├─ pointermove — dx 계산 → _clampWidth(_originW + dx)
    │              → appendElement.style.setProperty('--col2-w', value + 'px') 갱신
    │              → @columnResized { col:'col2', width, allWidths:{...} } 발행
    └─ pointerup — appendElement.dataset.resizing='false' + releasePointerCapture
                + @columnResizeEnd { col:'col2', width, allWidths:{...} } 1회 발행

[페이지가 localStorage 복원 / 외부 preset 적용]
    └─ instance._setColumnWidths({ response: { col1: 100, col2: 220, col3: 160, col4: 100, col5: 80 } })
        → _setColumnWidths 가 각 col 을 clamp 후 CSS variable 갱신 (이벤트 발행 없음)

운영: this.pageDataMappings = [
        { topic: 'tableRows', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@tableRowClicked': ({ event }) => {
          const id = event.target.closest('.table-cr__row')?.dataset.rowid;
          // 상세 페이지로 이동
        },
        '@columnResizeStart': ({ col, width }) => analytics.track('column_resize_start', { col, width }),
        '@columnResized':     ({ col, width, allWidths }) => { /* 잦은 발화 — sample/throttle 권장 */ },
        '@columnResizeEnd':   ({ col, width, allWidths }) => {
          localStorage.setItem('tableColumnWidths', JSON.stringify(allWidths));
        }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | resize 시각 차별 | 도메인 컨텍스트 예 |
|------|---------|-----------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 / 그라디언트 호버 / Pretendard / 8/20px 모서리. handle hover 시 퍼플 글로우, resizing 시 head-row 그림자 강화 | **이벤트 로그 테이블**(시간/대상/카테고리/상태/값 — 메시지 폭 가변) |
| `02_material`    | B: Material Elevated | 라이트 / elevation shadow / Pretendard+Roboto / 12px 모서리. handle hover 시 primary 컬러 line, resizing 시 elevation 4→5 | **고객 디렉토리**(이름/이메일/지역/플랜/MRR — 이메일 폭 가변) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 / DM Serif 헤드라인 / 샤프 구분선 / 헤어라인 handle. resizing 시 미세 grey shadow + 헤어라인 강화 | **연감/도서 카탈로그**(연도/저자/제목/장르/페이지 — 제목 폭 가변) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 시안 / IBM Plex / 각진 2-4px 모서리. handle hover 시 cyan border, resizing 시 cyan border glow | **장비 인벤토리**(시각/프로브/사이트/상태/값 — probe 폭 가변) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따른다. handle 의 cursor/border/glow 컬러는 페르소나 컬러 팔레트와 일치(예: A 는 밝은 퍼플, D 는 시안 강조). `[data-resizing="true"]` 셀렉터로 idle/resizing 2상태 분기.

### 결정사항

- **CSS Grid + CSS variable per column**: row 단위 width 일괄 동기화 + JS 측 row 갱신 불필요(컨테이너 root 의 `--colN-w` 갱신만으로 모든 행 자동 layout). flexbox 기반 Standard / filterableHeader 와 layout 패턴이 다르지만, resize 에 가장 자연스러운 패턴(spec 의 "CSS Grid 또는 col[width] 활용" 명시 근거).
- **handle 4개 (col1~col4 트레일링 경계)**: 마지막 컬럼 (col5) 의 우측 경계는 컨테이너 끝이라 trailing handle 의미 없음. ag-grid / Tabulator 도 동일 패턴(마지막 컬럼은 fill).
- **min/max default 60/800**: 작은 컬럼(상태/값) 가독성 + 큰 컬럼(메시지/이메일) 비대칭 허용. ag-grid `minWidth` 기본 50, `maxWidth` unbounded 와 비교해 보수적 max(viewport overflow 방지).
- **pointer 4종 + setPointerCapture**: handle 영역을 벗어나도 동일 요소가 move/up 을 계속 수신. Dialogs/Advanced/resizable, draggable 동일 패턴.
- **width 갱신 시점에만 @columnResized 발행 (clamp 동일값 억제)**: clamp 결과 동일 width 면 `_setWidth` 가 `false` 반환 → 발행 억제. min/max 경계에서 잦은 발화 방지.
- **외부 강제 setColumnWidths 는 이벤트 발행 X**: drag-driven 만 이벤트 발행. localStorage 복원 / preset 적용은 ack 불필요.
- **클래스 prefix `.table-cr__*`**: Standard / virtualScroll / sortableColumn / filterableHeader 와 분리(같은 페이지 공존 시 CSS 충돌 X).
- **handle 4px 폭 + 우측 절반 overflow**: handle 은 헤더 셀 우측 안쪽 -2px ~ +2px 로 이중 정렬(셀 padding 안에서 동작). `position: absolute; right: -2px; top: 0; bottom: 0; width: 4px` 패턴.
- **head-row 1개 listener + closest 위임**: handle 4개에 각각 attach 하지 않고 head-row 에 1개 attach 후 `e.target.closest('.table-cr__resize-handle[data-col]')` 로 컬럼 식별. listener 4배 절약 + DOM cache 불필요.
- **신규 Mixin 생성 금지**: ListRenderMixin + 자체 메서드 9종으로 완결. 큐 설명의 "resize Mixin" 은 본 SKILL 의 대상이 아님.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions / customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서 (head-row pointer listener remove → customEvents 제거 → 구독 해제 → 자체 상태/메서드 null + listRender.destroy)
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Tables/Advanced/columnResize/preview/...html` → `../`를 5번 = filterableHeader 동일 verbatim 복사)
