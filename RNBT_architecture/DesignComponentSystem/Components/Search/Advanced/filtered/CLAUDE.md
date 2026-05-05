# Search — Advanced / filtered

## 기능 정의

1. **검색 바 렌더링 (Standard 호환 KEY)** — `searchBar` 토픽으로 수신한 객체 데이터(`{ placeholder, query, leadingIcon }`)를 검색 바에 반영. FieldRenderMixin으로 input의 `value`/`placeholder` 속성과 leading 아이콘 textContent에 매핑. cssSelectors KEY는 Standard 호환(`searchBar`/`leadingIcon`/`query`/`placeholder`/`clearBtn`).
2. **필터 칩 영역 렌더링** — `filterChips` 토픽으로 수신한 배열(`[{ chipid, label, selected? }]`)을 자체 메서드 `_renderFilterChips`가 chip-template cloneNode로 칩 영역에 렌더한다. ListRenderMixin은 두 번째 적용하지 않는다(컴포넌트 통합 시 두 번째 ListRender 회피 — multiSelectGroup 결정 답습). 칩 클릭 시 toggle. `_selectedFilterIds: Set<chipid>` 자체 상태로 다중 선택 누적.
3. **검색 결과 영역 렌더링** — `searchResults` 토픽으로 수신한 배열(`[{ id, title, sublabel? }]`)을 자체 메서드 `_renderResults`가 result-template cloneNode로 결과 영역에 렌더. 빈 배열이면 결과 영역에 "결과 없음" 안내(별도 `.search-fl__empty` 영역) 표시. 데이터가 비어있는 초기 상태(undefined publish 전)에는 안내도 결과도 모두 비어있다.
4. **필터 또는 query 변경 → 통합 트리거 emit (debounced)** — input `input` 이벤트 + 필터 칩 click 토글 모두 250ms debounce 후 `@filteredSearchRequested` 1회 emit (payload: `{ query, selectedFilterIds, requestedAt }`). 페이지가 외부 fetch(query + filter 결합) 후 `searchResults` 토픽 republish. debounce timer는 `_debounceTimer` 자체 상태로 보관, 새 입력/토글 시 cancel 후 재설정.
5. **input change/Enter 시 즉시 emit** — input `keydown` Enter 또는 `change`(blur) 시 debounce 우회하고 즉시 `@filteredSearchRequested` emit. `@searchInputChanged` 이벤트는 input마다 발행(Standard 호환 — 페이지가 `query`만으로 부분 검색 미리보기 등에 사용 가능). Enter는 `event.preventDefault()`.
6. **필터 칩 toggle 이벤트** — 필터 칩 클릭 시 `_selectedFilterIds` Set toggle + DOM 동기화(`data-selected="true|false"` + `aria-pressed`) + `@filterToggled` 즉시 emit (payload: `{ chipid, selected, allSelectedIds }`). 그 다음 debounce 트리거를 통해 `@filteredSearchRequested`도 250ms 후 emit.
7. **결과 항목 클릭 이벤트** — 결과 항목 클릭 시 dataset.resultid + textContent로 식별 → `@resultClicked` emit (payload: `{ id, title }`). 항목은 클릭 시 visual feedback만(컴포넌트는 selection 상태 보관 X — 페이지가 navigate 또는 detail open).
8. **clear 버튼 처리 (Standard 호환 `@searchCleared`)** — clear 버튼 클릭 시 input.value 비우기 + `@searchCleared` 발행 + 즉시 `@filteredSearchRequested`(빈 query + 현재 selectedFilterIds) emit. Standard 시그니처 유지.
9. **외부 토픽으로 강제 필터 갱신 (`setSelectedFilters` — 선택)** — 페이지가 URL 쿼리 동기화 / 키보드 단축키 / "필터 모두 해제" 등 클릭 외 경로로 필터 강제 갱신할 때 사용. payload `[chipid]` 정규화 → `_selectedFilterIds` 갱신 + DOM 동기화 + `@filterToggled`(`changedTo: 'bulk'`) + `@filteredSearchRequested` emit.

> **Standard와의 분리 정당성 (5축)**:
> - **새 영역 2종 추가 — filter chips bar + search results panel** — Standard는 검색 바 + 제안 목록(`.search__suggestions` 단일 컨테이너) 두 영역. filtered는 검색 바 + filter chips bar(`.search-fl__chips`) + search results panel(`.search-fl__results-list` + `.search-fl__empty`) 세 영역으로 확장. 컴포넌트가 검색 + 필터 + 결과 표시를 한 인스턴스로 통합한 패턴.
> - **새 자체 상태 4종** — `_selectedFilterIds: Set<chipid>` (필터 선택 진실 소스), `_query: string` (현재 입력값 — debounce 시점 캡처), `_debounceMs: number` (옵션 슬롯, 기본 250), `_debounceTimer: number|null` + bound handler refs(`_inputHandler`/`_keydownHandler`/`_chipsClickHandler`/`_resultsClickHandler`/`_clearHandler`). Standard는 stateless.
> - **새 토픽 2종 + Standard 호환 1종** — 새: `filterChips`(필터 정의 배열) + `searchResults`(결과 배열) + `setSelectedFilters`(외부 강제 갱신 — 선택). Standard 호환: `searchBar`(데이터 매핑). Standard의 `searchSuggestions`는 사용하지 않음(filtered는 외부 fetch 결과를 `searchResults`로 받는 모델).
> - **새 이벤트 4종 + Standard 호환 2종 유지** — `@filterToggled`, `@filteredSearchRequested`(통합 트리거), `@resultClicked`, `@searchInputChanged`(Standard 호환 — input마다). Standard 호환 `@searchCleared`(clear 버튼) 유지. Standard의 `@searchSubmitted`/`@suggestionClicked`는 본 변형의 모델과 다름(submit 의미가 통합 트리거로 흡수, 항목 클릭은 결과 클릭으로 변경).
> - **debounce + 통합 트리거 + 필터 toggle 정책 + 결과 빈 상태 처리** — Standard는 input/change 이벤트 단순 위임만, suggestions는 외부에서 매번 publish. filtered는 ① 250ms debounce, ② query + selectedFilterIds 통합 payload로 emit, ③ filter chips toggle 정책 + Set 누적, ④ 결과 빈 배열 시 empty 영역 표시까지 모두 흡수. 같은 register.js로 표현 불가.

> **유사 변형과의 비교**: `Search/Advanced/autoComplete`이 "입력 시 자동완성 dropdown + debounce + 외부 fetch 위임"을 흡수했다면, `recentHistory`는 "focus 시 최근 검색어 dropdown + Enter commit + localStorage 영속화"를 흡수. **filtered는 그 위에 "필터 칩 영역 + 결과 영역을 한 컴포넌트로 통합"이라는 한 차원 추가** — autoComplete의 dropdown 자리 대신 항상 보이는 결과 panel + 별도 filter chips bar 영역. debounce는 autoComplete 답습(timer 자체 상태 + cancel + 재설정 + clear 시 즉시 emit). filter chips toggle 정책은 `Chips/Filter/Advanced/multiSelectGroup` 결정 답습(`_selectedFilterIds: Set` 자체 상태 + DOM 양방향 동기화 + 명시 payload emit). 두 패턴(검색 + 필터 + 결과)을 한 컴포넌트로 묶은 점이 본 변형의 정체.

> **MD3 / 도메인 근거**: 실사용 검색 UI 대다수는 "검색어 + 카테고리/형식/기간 필터를 함께 적용한 결과 표시"가 한 화면에서 이루어진다(이커머스 검색 결과, 문서 검색, 이미지 검색, 검색 콘솔, 멤버 디렉토리). MD3 Search는 검색 바 + 제안 목록만 정의하지만, 실사용에서 필터 + 결과까지 한 컴포넌트로 통합하면 페이지가 매번 필터 토글 → fetch debounce → 결과 렌더 보일러플레이트를 재구현해야 한다. filtered는 그 보일러를 단일 인스턴스로 흡수. 도메인 예: ① 이커머스 검색(카테고리/가격대/평점 필터), ② 문서 검색(형식/날짜/저자 필터), ③ 운영 콘솔 회원/콘텐츠/결제 검색(타입 필터), ④ 미디어 라이브러리(장르/연도 필터).

---

## 구현 명세

### Mixin

FieldRenderMixin (검색 바의 query/placeholder/leadingIcon 데이터 매핑) + 자체 메서드 11종 + 자체 상태 4종.

> **신규 Mixin 생성 금지** — filter chips 영역 렌더 + results panel 렌더는 자체 메서드(`_renderFilterChips` / `_renderResults`)로 처리. ListRenderMixin을 두 번째 Mixin으로 적용하지 않는다 — multiSelectGroup과 동일 정책(Mixin 인스턴스 네임스페이스 충돌 회피 + 자체 메서드 충분).

### 옵션 슬롯 (인스턴스 직접 설정)

| 옵션 | 타입 | 기본 | 설명 |
|------|------|------|------|
| `_debounceMs` | `number` | `250` | 필터/입력 변경 후 `@filteredSearchRequested` emit까지 지연. 페이지가 register 직후 다른 값으로 덮어쓸 수 있음. |

### cssSelectors

#### FieldRenderMixin (`this.fieldRender`) — 검색 바 + 추가 영역 KEY

| KEY | VALUE | 용도 |
|-----|-------|------|
| searchBar       | `.search-fl__bar`              | 바 루트 — 계약 유지 (이벤트/스타일 훅) |
| leadingIcon     | `.search-fl__leading`          | 선행 검색 아이콘 자리 — textContent 반영 |
| query           | `.search-fl__input`            | 입력 필드 — `value` 속성 반영 + 자체 input/keydown/change 핸들러 부착 |
| placeholder     | `.search-fl__input`            | 입력 필드 — `placeholder` 속성으로 반영 |
| clearBtn        | `.search-fl__clear`            | 클리어 버튼 — bindEvents click + 자체 사이드이펙트 |
| chipsBar        | `.search-fl__chips`            | filter chips 영역 컨테이너 |
| chipTpl         | `#search-filter-chip-template` | 칩 cloneNode 대상 |
| chipItem        | `.search-fl__chip`             | 칩 항목 — click delegator + `data-chipid`/`data-selected`/`aria-pressed` |
| chipLabel       | `.search-fl__chip-label`       | 칩 라벨 텍스트 |
| resultsPanel    | `.search-fl__results`          | 결과 panel 루트 |
| resultsList     | `.search-fl__results-list`     | 결과 항목 부모 |
| resultsEmpty    | `.search-fl__empty`            | "결과 없음" 영역 — `[data-shown="true"]`로 표시 토글 |
| resultTpl       | `#search-filter-result-template` | 결과 항목 cloneNode 대상 |
| resultItem      | `.search-fl__result`           | 결과 항목 (data-resultid, click delegator) |
| resultTitle     | `.search-fl__result-title`     | 결과 항목 제목 |
| resultSublabel  | `.search-fl__result-sublabel`  | 결과 항목 보조 텍스트 (선택) |

> **이벤트/UI 영역 KEY**: chipsBar/chipTpl/chipItem/chipLabel/resultsPanel/resultsList/resultsEmpty/resultTpl/resultItem/resultTitle/resultSublabel는 FieldRenderMixin이 데이터 바인딩에 사용하지 않는 영역이지만 자체 메서드의 querySelector 진입점 + customEvents 매핑에 사용 — multiSelectGroup/recentHistory 동일 패턴.

#### elementAttrs (FieldRenderMixin)

| KEY | VALUE |
|-----|-------|
| query       | value |
| placeholder | placeholder |

> `query`는 input의 `value`로, `placeholder`는 input의 `placeholder`로 반영. `leadingIcon`은 textContent이므로 elementAttrs 없음 (Standard와 동일).

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_debounceMs` | `number` | debounce 지연(ms). 기본 250. |
| `_debounceTimer` | `number \| null` | 진행 중 setTimeout id. cancel 후 재설정용. |
| `_query` | `string` | 현재 input value 진실 소스(공백 trim 전 raw). debounce 시점 캡처. |
| `_selectedFilterIds` | `Set<string>` | 현재 선택된 chipid 집합. toggle/bulk로 갱신. |
| `_inputHandler` / `_keydownHandler` / `_changeHandler` | `function \| null` | input element 자체 핸들러 bound refs. |
| `_chipsClickHandler` | `function \| null` | filter chips 영역 click delegator. |
| `_resultsClickHandler` | `function \| null` | results panel click delegator. |
| `_clearHandler` | `function \| null` | clear 버튼 native 사이드이펙트 핸들러. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `searchBar` | `this.fieldRender.renderData` | `{ placeholder, query, leadingIcon }` — Standard 호환 |
| `filterChips` | `this._renderFilterChips` | `[{ chipid, label, selected? }]` — 필터 정의 |
| `searchResults` | `this._renderResults` | `[{ id, title, sublabel? }]` — 외부에서 검색+필터 fetch 결과 |
| `setSelectedFilters` (선택) | `this._setSelectedFiltersFromTopic` | `[chipid]` — 외부 강제 필터 갱신 |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `clearBtn` (fieldRender) | clear 버튼 클릭 | `@searchCleared` (Standard 호환). 자체 핸들러도 추가로 input 비우기 + 즉시 `@filteredSearchRequested` emit. |

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@searchInputChanged` | input 이벤트마다 (raw) | `{ value }` (현재 input.value, debounce 무시 — 페이지 부분 미리보기용) |
| `@filterToggled` | 필터 칩 클릭 / `setSelectedFilters` 강제 갱신 | `{ chipid, selected, allSelectedIds, changedTo }`. 단일 토글: `chipid`/`selected`/`changedTo: 'on'\|'off'`. bulk: `chipid: null`/`selected: null`/`changedTo: 'bulk'`. |
| `@filteredSearchRequested` | input/필터/clear 변경 후 `_debounceMs` 후 1회. Enter/change/clear/`setSelectedFilters` 시 즉시. | `{ query, selectedFilterIds, requestedAt }`. `query`는 `_query.trim()`, `selectedFilterIds`는 `[...this._selectedFilterIds]`, `requestedAt`은 `Date.now()`. |
| `@resultClicked` | 결과 항목 클릭 | `{ id, title }`. 페이지가 navigate 또는 detail open. |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderFilterChips({ response })` | `({response}) => void` | `filterChips` 핸들러. 페이로드 배열로 chip-template cloneNode 반복하여 chips bar 채움. 초기 `selected:true` 항목들로 `_selectedFilterIds` Set 갱신 + DOM 동기화(`data-selected` + `aria-pressed`). 새 batch는 새 진실(이전 누적 X). |
| `_applyChipsSelection()` | `() => void` | chips bar 안의 모든 칩 순회하며 `dataset.selected` + `aria-pressed`를 `_selectedFilterIds` 기준으로 동기화. |
| `_renderResults({ response })` | `({response}) => void` | `searchResults` 핸들러. 결과 list를 비우고 result-template cloneNode 반복하여 채움. 빈 배열이면 `.search-fl__empty[data-shown="true"]` + list 비움. 비빈 배열이면 empty 영역 숨김. |
| `_setSelectedFiltersFromTopic({ response })` | `({response}) => void` | `setSelectedFilters` 핸들러. `[chipid]` 정규화 → `_selectedFilterIds` 갱신 → `_applyChipsSelection` → `@filterToggled`(bulk) emit → `_emitFilteredImmediate()` 호출(즉시). |
| `_toggleFilter(chipid)` | `(string) => void` | 단일 chipid toggle. `_selectedFilterIds` add/delete → `_applyChipsSelection` 호출 → `@filterToggled` emit (단일) → `_scheduleEmitFiltered()` 호출(debounce). |
| `_scheduleEmitFiltered()` | `() => void` | `_debounceTimer` cancel + 새 setTimeout(`_debounceMs`) → 만료 시 `_emitFilteredImmediate()`. |
| `_emitFilteredImmediate()` | `() => void` | `_debounceTimer` cancel(존재 시) + `Weventbus.emit('@filteredSearchRequested', {...})`. |
| `_handleInput(e)` | `(InputEvent) => void` | input element `input`. `_query` = e.target.value 갱신 → `@searchInputChanged` 즉시 emit → `_scheduleEmitFiltered()`(debounce). |
| `_handleKeydown(e)` | `(KeyboardEvent) => void` | input element `keydown`. Enter: `e.preventDefault()` → `_query` 갱신 → `_emitFilteredImmediate()`(즉시). |
| `_handleChange(e)` | `(Event) => void` | input element `change`(blur). `_query` 갱신 → `_emitFilteredImmediate()`. |
| `_handleChipsClick(e)` | `(MouseEvent) => void` | chips bar click delegator. `e.target.closest(chipItem)` → `dataset.chipid` 추출 → `_toggleFilter(chipid)`. |
| `_handleResultsClick(e)` | `(MouseEvent) => void` | results list click delegator. `e.target.closest(resultItem)` → `dataset.resultid` + title textContent 추출 → `Weventbus.emit('@resultClicked', { id, title })`. |
| `_handleClear()` | `() => void` | clear 버튼 native 사이드이펙트. input.value = '' + `_query = ''` + `_emitFilteredImmediate()`(즉시). (`@searchCleared`는 bindEvents가 발행). |

> **bindEvents의 `@searchCleared` ↔ 자체 사이드이펙트 분리**: `@searchCleared`는 customEvents의 위임 발행으로 외부에 알리고, 컴포넌트 자체 사이드이펙트(input 비우기 + 즉시 통합 트리거 emit)는 별도 native click 핸들러(`_handleClear`)에서 수행 — recentHistory 패턴 답습.

### 페이지 연결 사례

```
[페이지 — 이커머스 검색 / 문서 검색 / 운영 콘솔 / 미디어 라이브러리]
    │
    ├─ fetchAndPublish('searchBar',    this) — 초기 바 데이터
    ├─ fetchAndPublish('filterChips',  this) — 필터 정의 배열(초기 selected 포함 가능)
    ├─ fetchAndPublish('searchResults',this) — 초기 결과(또는 빈 배열)
    │
    ├─ '@filteredSearchRequested' 수신 → 외부 fetch(query + selectedFilterIds 결합)
    │     → 결과를 'searchResults' 토픽으로 republish (cycle 종료)
    ├─ '@filterToggled' 수신 → URL 쿼리 동기화 / 분석 로깅 (선택)
    ├─ '@searchInputChanged' 수신 → 부분 미리보기 / 분석 (선택)
    ├─ '@resultClicked' 수신 → navigate / detail open
    ├─ '@searchCleared' 수신 → 페이지 전체 reset (선택)
    └─ (선택) 'setSelectedFilters' publish → 외부에서 필터 강제 갱신

[Search/Advanced/filtered]
    ├─ FieldRender가 검색 바 데이터 매핑
    ├─ filterChips 수신 → chips bar에 칩 N개 렌더 + 초기 _selectedFilterIds 결정
    ├─ searchResults 수신 → results list 갱신 또는 empty 영역 표시
    ├─ input 변경 → @searchInputChanged 즉시 + 250ms debounce 후 @filteredSearchRequested
    ├─ Enter/change(blur) → 즉시 @filteredSearchRequested
    ├─ 칩 클릭 → toggle + @filterToggled 즉시 + 250ms 후 @filteredSearchRequested
    ├─ × clear → input 비움 + @searchCleared(Standard 호환) + 즉시 @filteredSearchRequested
    └─ 결과 클릭 → @resultClicked

운영: this.pageDataMappings = [
        { topic: 'searchBar',          datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'filterChips',        datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'searchResults',      datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setSelectedFilters', datasetInfo: {...}, refreshInterval: 0 }   // 선택
      ];
      Wkit.onEventBusHandlers({
        '@filteredSearchRequested': ({ query, selectedFilterIds }) => {
            /* 외부 fetch → 결과를 searchResults 토픽으로 republish */
        },
        '@filterToggled':       ({ chipid, selected, allSelectedIds }) => { /* 분석 / URL sync */ },
        '@searchInputChanged':  ({ value }) => { /* 선택 — 부분 미리보기 */ },
        '@resultClicked':       ({ id, title })  => { /* navigate / detail */ },
        '@searchCleared':       ()           => { /* 선택 — 페이지 reset */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|-------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 + 그라디언트 깊이 + Pretendard + pill 바(30px) + 칩 pill(시안 액센트) + results panel 그라디언트 보더. | **이커머스 검색 — 카테고리/가격대 필터** (의류/신발/가방 + 가격대 칩 다중 선택 후 결과 갱신 — Coupang/SSG 스타일) |
| `02_material`    | B: Material Elevated | 라이트 + elevation shadow + Roboto + 28px pill 바 + Material Filter Chips(8px radius) + results 카드 + ripple hover. | **문서 검색 — 형식 필터** (PDF/Word/PPT/이미지 칩 다중 선택 + 검색어 결합 — Notion/Confluence 검색 결과) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 + 세리프 라벨 + 바닥줄 바 + 2px 샤프 모서리 칩 + results 점선 separator + 미니멀 hairline. | **회원/콘텐츠/결제 검색 — 운영 콘솔 분류 필터** (회원/콘텐츠/결제/문의 카테고리 칩 + 키워드 결합 — 백오피스 패턴) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 쿨 톤 + IBM Plex Mono input + 시안 미세 테두리(2-4px 모서리) + 칩 모노 uppercase + results compact list + 시안 액센트. | **로그/이벤트 검색 — 레벨/소스 필터** (ERROR/WARN/INFO + service 칩 다중 선택 + 검색어 — 운영 모니터링 콘솔) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따른다. preview에는 4~6개 chip seed + 5~10개 result seed로 query 입력 → debounce → @filteredSearchRequested → 페이지가 결과 mock filter → searchResults republish 시나리오를 한 변형 안에서 시연한다.

### 결정사항

- **컴포넌트 통합 (검색 바 + 필터 + 결과)**: 세 영역을 하나의 인스턴스에 묶음으로써 페이지 책임을 최소화. 페이지는 `@filteredSearchRequested` 1개 채널로만 외부 fetch 트리거 받고 `searchResults` 1개 토픽으로만 결과 republish. 분리되었을 때(Search + Chips + List 3개 컴포넌트) 페이지가 직접 두 채널 결합 + debounce 보일러를 재구현해야 함.
- **debounce는 250ms 고정 기본 + 옵션 슬롯**: autoComplete과 동일 정책. 입력 키스트로크 + 칩 토글 모두 동일 timer 공유(둘 중 하나만 변경되어도 1회 emit 의도).
- **Enter/change/clear는 debounce 우회**: 사용자 명시적 commit 의도 → 즉시 fetch 트리거. Enter는 `preventDefault`(form submit 차단).
- **결과 항목 selection 상태 미보관**: 컴포넌트는 `@resultClicked` emit만, selection 상태는 페이지 책임(navigate or detail open). multiSelectGroup이 칩 selected를 보관하는 것과 다른 결정 — 결과는 navigation 대상이지 toggle 대상이 아님.
- **빈 결과 시 empty 영역 표시**: `.search-fl__empty[data-shown="true"]`로 토글. 초기 미수신 상태(undefined publish 전)에는 empty도 list도 모두 비어있음(자연 비움 — `_renderResults` 호출 전).
- **필터 chip multi-select**: filter chips는 다중 선택 누적(체크박스 의미). 클릭 시 toggle. 단일 선택 강제 정책은 본 변형 범위 외(향후 변형 또는 페이지가 `setSelectedFilters`로 강제 갱신).
- **신규 Mixin 생성 금지**: FieldRenderMixin + 자체 메서드로 완결. ListRenderMixin 두 번째 적용 회피 — autoComplete/recentHistory/multiSelectGroup 답습. 향후 `SearchFilteredMixin` 또는 `MultiAreaRenderMixin` 일반화 검토 후보(SKILL 회귀 규율, 본 사이클은 메모만).
