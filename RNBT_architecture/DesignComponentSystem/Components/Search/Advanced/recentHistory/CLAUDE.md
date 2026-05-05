# Search — Advanced / recentHistory

## 기능 정의

1. **검색 바 렌더링 (Standard 호환 KEY)** — `searchBar` 토픽으로 수신한 객체 데이터(`{ placeholder, query, leadingIcon }`)를 검색 바에 반영. FieldRenderMixin으로 input의 `value`/`placeholder` 속성과 leading 아이콘 textContent에 매핑. cssSelectors KEY는 Standard 호환(`searchBar`/`leadingIcon`/`query`/`placeholder`/`clearBtn`).
2. **localStorage 영속화 + init 시 로드** — 컴포넌트 등록 시점에 `localStorage.getItem(this._storageKey)`로 최근 검색어 배열을 로드. 기본 storageKey = `renobit_search_history`. JSON.parse 실패 / null이면 빈 배열로 시작. 로드 후 `_history`에 저장하고 `@recentLoaded` 1회 emit (`{ count, queries }`).
3. **focus 시 dropdown 표시** — input `focus` 시 입력값이 비어있으면 dropdown open, 입력값이 있으면 닫음. dropdown은 input 바로 아래 absolute 패널에 `_history` 항목들을 cloneNode로 렌더(자체 메서드 `_renderHistory`).
4. **검색 commit 시 history 추가** — input `keydown`에서 Enter 시 현재 input value를 `_history` 맨 앞에 추가(중복 제거 + 최대 N개, 기본 10). localStorage 갱신 + `@searchSubmitted`(`{ value }`) emit + dropdown 닫음.
5. **항목 클릭 → 재검색** — dropdown 항목 클릭 시 input value를 해당 query로 갱신 + dropdown 닫음 + 그 항목을 `_history` 맨 앞으로 끌어올림(중복 제거) + localStorage 갱신 + `@recentItemClicked`(`{ query }`) emit + `@searchSubmitted`(`{ value }`) emit.
6. **항목 개별 삭제 (× 버튼)** — dropdown 항목 우측 × 버튼 클릭 시 해당 query를 `_history`에서 제거 + localStorage 갱신 + dropdown 재렌더 + `@recentItemRemoved`(`{ query, remaining }`) emit. click 이벤트는 항목 click delegator와 충돌하지 않도록 `event.stopPropagation()`.
7. **전체 삭제 (모두 지우기)** — dropdown 헤더의 "모두 지우기" 버튼 클릭 시 `_history = []` + localStorage.removeItem(storageKey) + dropdown 닫음 + `@recentCleared`(`{}`) emit.
8. **input 변경 시 dropdown 닫음** — input `input` 이벤트에서 value가 비어있지 않으면 dropdown 즉시 닫음(history는 빈 input 전용). 비어있으면 dropdown 다시 열기(`_history.length > 0`일 때만).
9. **외부 토픽으로 강제 주입 (`setRecentHistory` — 선택)** — 페이지가 서버 동기화 등으로 history를 강제 주입할 때 사용. payload가 `[string]` 또는 `[{query, ts?}]` 두 형태 모두 수용. 정규화 후 `_history` 갱신 + localStorage 갱신 + dropdown 열려있으면 재렌더 + `@recentLoaded` emit.
10. **clear 버튼 처리 (Standard 호환 `@searchCleared`)** — clear 버튼 클릭 시 input.value 비우기 + dropdown 다시 열기(history 있을 때만) + `@searchCleared` 발행. Standard 시그니처 유지.
11. **focus out 시 dropdown 닫음 (mousedown preventDefault 패턴)** — input `blur` 시 dropdown 닫음. dropdown 항목/× 버튼/clear 버튼 mousedown 중에는 `event.preventDefault()`로 input blur 차단(클릭이 정상 처리되도록) — autoComplete의 패턴 답습.

> **Standard와의 분리 정당성 (5축)**:
> - **새 영구 저장 책임 추가** — Standard는 stateless. recentHistory는 컴포넌트가 직접 `localStorage`에 접근(`getItem`/`setItem`/`removeItem`)하여 검색 이력의 영속화 책임을 흡수. 페이지가 매번 history를 publish할 필요 없음(외부 강제 주입은 선택 토픽).
> - **새 영역 추가 — dropdown 패널 + 헤더 + 항목 template** — Standard는 `.search__suggestions` 단일 컨테이너로 ListRenderMixin이 직접 렌더. recentHistory는 input 바로 아래 absolute 배치 dropdown(`.search-rh__dropdown[data-open="true"]`)에 헤더("최근 검색어" + "모두 지우기") + 항목 list. 자체 메서드 `_renderHistory`가 항목 template(`#search-recent-item-template`) cloneNode. ListRenderMixin은 사용하지 않음(Mixin 두 번 적용 회피 + 항목별 × 버튼 + 항목 끌어올림 + dropdown open/close 정책이 단일 메서드로 흡수되는 패턴 — autoComplete 결정 답습).
> - **자체 상태 4종** — `_history: Array<{query, ts}>`(현재 history — 진실 소스), `_storageKey: string`(localStorage 키 — 옵션 슬롯), `_maxItems: number`(최대 보관 개수, 기본 10), `_inputHandler` / `_keydownHandler` / `_focusHandler` / `_blurHandler` / `_dropdownClickHandler` / `_dropdownMousedownHandler` / `_clearHandler` / `_clearAllHandler` (bound refs — beforeDestroy 정확 제거용). Standard는 stateless.
> - **새 이벤트 4종 + Standard 호환 2종 유지** — `@recentLoaded`(init/주입 후), `@recentItemClicked`(항목 클릭), `@recentItemRemoved`(× 버튼), `@recentCleared`(모두 지우기). Standard 호환 `@searchSubmitted`(Enter/항목 클릭) + `@searchCleared`(× clear) 유지. Standard는 `@searchInput`/`@searchSubmitted`/`@searchCleared`/`@suggestionClicked` 4종.
> - **localStorage 영속화 + dropdown open/close 정책 + Enter→history append → emit + 항목 끌어올림 + 개별/전체 삭제 모두 흡수** — Standard는 input/change 이벤트를 단순 위임만 하고 페이지가 history 저장/로드/항목 끌어올림/삭제를 매번 재구현. recentHistory는 그 보일러를 한 곳에 정식화. 같은 register.js로 표현 불가.

> **유사 변형과의 비교**: `Search/Advanced/autoComplete`이 "입력 + 자동완성 dropdown + 키보드 navigation + 디바운스 emit + 외부 fetch 위임"을 자체 메서드로 흡수했다면, recentHistory는 "focus → 최근 검색어 dropdown + Enter commit → 영속화 + 항목 클릭 재검색 + 개별/전체 삭제"를 흡수한 패턴이다. dropdown 렌더 / blur 처리(mousedown preventDefault) / 자체 핸들러 bound refs 정리 패턴은 동일 답습. 차이는 ① 외부 fetch 트리거 없음(데이터 출처는 컴포넌트 자체 localStorage 또는 외부 강제 주입), ② keystroke마다 fetch가 아니라 commit 시점(Enter / 항목 클릭)에 history append, ③ dropdown은 빈 입력 전용(autoComplete은 입력 후 후보 표시 / recentHistory는 입력 비었을 때 history 표시), ④ 키보드 navigation은 본 변형의 1차 범위에서 제외(history 항목 클릭 + Enter commit으로 충분 — 단순 list 표시).

> **MD3 / 도메인 근거**: MD3 Search 명세는 "검색 바와 검색 뷰" 패턴에서 **focus 시 최근 검색어 표시**를 표준 인터랙션으로 제시한다(Google Search, Apple Spotlight, macOS 검색 모두 동일 패턴). 실사용 예: ① 사이트 내 검색 history(헬프 센터 / 문서 검색 — 사용자가 자주 찾는 주제 빠른 재검색), ② 이커머스 최근 본 상품 검색어, ③ 지도/배송지 최근 검색 위치, ④ 운영 콘솔 최근 호스트명/메트릭 키 검색, ⑤ 멤버/유저 최근 검색. 모든 케이스에서 "Enter commit → history append + 영속화" + "focus → history dropdown + 항목 클릭 재검색" + "개별/전체 삭제" 패턴이 보편화. localStorage는 단일 페이지 컴포넌트 자체 영속화의 표준 수단(서버 동기화는 외부 토픽으로 강제 주입 가능 — 본 변형은 두 모드 모두 지원).

---

## 구현 명세

### Mixin

FieldRenderMixin (검색 바의 query/placeholder/leadingIcon 데이터 매핑) + 자체 메서드 9종 + 자체 상태 4종.

> **신규 Mixin 생성 금지** — dropdown 렌더는 자체 메서드(`_renderHistory`)로 처리. ListRenderMixin을 두 번째 Mixin으로 적용하지 않는다 — autoComplete과 동일 정책(Mixin 인스턴스 네임스페이스 충돌 회피 + 자체 메서드 충분).

### 옵션 슬롯 (인스턴스 직접 설정)

| 옵션 | 타입 | 기본 | 설명 |
|------|------|------|------|
| `_storageKey` | `string` | `'renobit_search_history'` | localStorage 키. 페이지가 register 직후 다른 값으로 덮어쓸 수 있음. |
| `_maxItems` | `number` | `10` | history 최대 보관 개수. 초과 시 가장 오래된 항목 제거. |

> register.js는 기본값을 설정한다. 다른 값이 필요한 페이지는 register 후 인스턴스 속성을 직접 변경한 뒤 컴포넌트를 새로고침하거나, 컴포넌트 정의 시점에 옵션을 주입하는 방식을 따른다(본 변형은 단순 기본값 + 인스턴스 속성 노출 패턴).

### cssSelectors

#### FieldRenderMixin (`this.fieldRender`) — 검색 바 + 추가 영역 KEY

| KEY | VALUE | 용도 |
|-----|-------|------|
| searchBar         | `.search-rh__bar`                     | 바 루트 — 계약 유지 (이벤트/스타일 훅) |
| leadingIcon       | `.search-rh__leading`                 | 선행 검색 아이콘 자리 — textContent 반영 |
| query             | `.search-rh__input`                   | 입력 필드 — `value` 속성 반영 + 자체 input/keydown/focus/blur 핸들러 부착 영역 |
| placeholder       | `.search-rh__input`                   | 입력 필드 — `placeholder` 속성으로 반영 |
| clearBtn          | `.search-rh__clear`                   | 클리어 버튼 — bindEvents click + 자체 사이드이펙트 |
| dropdown          | `.search-rh__dropdown`                | dropdown 패널 컨테이너 — `[data-open="true"]`로 표시 토글 |
| dropdownHeader    | `.search-rh__dropdown-header`         | dropdown 헤더 (제목 + 모두 지우기 버튼) |
| dropdownClearAll  | `.search-rh__dropdown-clear-all`      | "모두 지우기" 버튼 |
| dropdownList      | `.search-rh__dropdown-list`           | dropdown 항목 부모 |
| historyItemTpl    | `#search-recent-item-template`        | dropdown 항목 cloneNode 대상 |
| historyItem       | `.search-rh__item`                    | dropdown 항목 (data-history-query, click delegator) |
| historyItemLabel  | `.search-rh__item-label`              | dropdown 항목 query 텍스트 |
| historyItemRemove | `.search-rh__item-remove`             | dropdown 항목 × 버튼 |

> **이벤트/UI 영역 KEY**: dropdown/dropdownHeader/dropdownClearAll/dropdownList/historyItemTpl/historyItem/historyItemLabel/historyItemRemove는 FieldRenderMixin이 데이터 바인딩에 사용하지 않는 영역이지만 자체 메서드의 querySelector 진입점 + customEvents 매핑에 사용 — autoComplete의 동일 패턴 답습.

#### elementAttrs (FieldRenderMixin)

| KEY | VALUE |
|-----|-------|
| query       | value |
| placeholder | placeholder |

> `query`는 input의 `value`로, `placeholder`는 input의 `placeholder`로 반영. `leadingIcon`은 textContent이므로 elementAttrs 없음 (Standard와 동일).

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_storageKey` | `string` | localStorage 키 (옵션 슬롯). 기본 `'renobit_search_history'`. |
| `_maxItems` | `number` | history 최대 보관 개수 (옵션 슬롯). 기본 10. |
| `_history` | `Array<{query, ts}>` | 현재 history 진실 소스. localStorage 로드 / append / remove / 강제 주입 시 모두 갱신. dropdown DOM 의 진실 소스 + 항목 클릭 시 인덱스 → query 매핑. |
| `_inputHandler` / `_keydownHandler` / `_focusHandler` / `_blurHandler` | `function \| null` | input element 자체 핸들러 bound refs. |
| `_dropdownClickHandler` / `_dropdownMousedownHandler` | `function \| null` | dropdown 영역 자체 핸들러 bound refs. |
| `_clearHandler` | `function \| null` | clear 버튼 native 사이드이펙트 핸들러 bound ref. |
| `_clearAllHandler` | `function \| null` | "모두 지우기" 버튼 핸들러 bound ref. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `searchBar` | `this.fieldRender.renderData` | `{ placeholder, query, leadingIcon }` — Standard 호환 |
| `setRecentHistory` (선택) | `this._setHistory` | `[string]` 또는 `[{query, ts?}]` — 외부 강제 주입(서버 동기화) |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `clearBtn` (fieldRender) | clear 버튼 클릭 | `@searchCleared` (Standard 호환). 자체 핸들러도 추가로 input/dropdown 정리. |

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@recentLoaded` | init 시 localStorage 로드 후 1회 + `setRecentHistory` 강제 주입 후 | `{ count, queries: [string] }` |
| `@searchSubmitted` | Enter commit / 항목 클릭 | `{ value }` (Standard 호환 시그니처 — 현재 검색어) |
| `@recentItemClicked` | dropdown 항목 클릭 | `{ query }` |
| `@recentItemRemoved` | dropdown 항목 × 버튼 클릭 | `{ query, remaining: [string] }` |
| `@recentCleared` | "모두 지우기" 버튼 클릭 | `{}` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_loadHistory()` | `() => void` | init 시 localStorage.getItem(storageKey) 로드 + JSON.parse + 정규화 → `_history`에 저장. 실패/null이면 `_history = []`. emit 없음(`_emitLoaded`가 별도). |
| `_persistHistory()` | `() => void` | `_history`를 `localStorage.setItem(storageKey, JSON.stringify(...))`로 영속화. 항상 호출. try/catch로 감싸 quota / private mode 실패 시 silent. |
| `_renderHistory()` | `() => void` | `_history`로 dropdown 항목 list 재렌더. cloneNode + textContent + dataset 채움. 빈 history면 dropdown 자동 닫음(open 안 함). |
| `_openDropdown()` | `() => void` | dropdown `[data-open="true"]` 설정 + `_renderHistory` 호출. `_history.length === 0`이면 silent return. |
| `_closeDropdown()` | `() => void` | dropdown `[data-open="false"]` 설정. |
| `_addToHistory(query)` | `(string) => void` | query 정규화(trim + 빈값 거부). 기존 항목에 같은 query 있으면 제거(맨 앞으로 끌어올림). 맨 앞에 `{query, ts: now}` 추가. `_maxItems` 초과 분 슬라이스. `_persistHistory` 호출. |
| `_removeFromHistory(query)` | `(string) => void` | `_history`에서 해당 query 제거. `_persistHistory` 호출. |
| `_setHistory({ response })` | `({response}) => void` | 외부 강제 주입 핸들러. 정규화(`[string]` 또는 `[{query, ts?}]` 모두 수용) → `_history` 갱신 → `_persistHistory` → dropdown 열려있으면 `_renderHistory` 재호출 → `@recentLoaded` emit. |
| `_emitLoaded()` | `() => void` | `@recentLoaded` emit. payload: `{ count: _history.length, queries: _history.map(h => h.query) }`. |
| `_handleInput(e)` | `(InputEvent) => void` | input element `input`. value가 비어있지 않으면 즉시 dropdown 닫음. 비어있으면 `_openDropdown`(history 있을 때만). |
| `_handleKeydown(e)` | `(KeyboardEvent) => void` | input element `keydown`. Enter: input.value commit → `_addToHistory` + `@searchSubmitted` emit + dropdown 닫음. Escape: dropdown 닫음. 빈 value Enter는 silent. |
| `_handleFocus()` | `(FocusEvent) => void` | input element `focus`. value가 비어있고 history 있으면 `_openDropdown`. |
| `_handleBlur()` | `(FocusEvent) => void` | input element `blur`. dropdown 닫음 (mousedown preventDefault로 항목/버튼 클릭은 차단됨). |
| `_handleDropdownEvent(e)` | `(MouseEvent) => void` | dropdown 영역 click delegator. × 버튼 매칭 → `_removeFromHistory` + `_renderHistory` + `@recentItemRemoved` emit + `event.stopPropagation()`. 항목 매칭(× 아닌 영역) → input.value = query + `_addToHistory`(끌어올림) + dropdown 닫음 + `@recentItemClicked` + `@searchSubmitted` emit. |
| `_handleDropdownMousedown(e)` | `(MouseEvent) => void` | dropdown 영역 mousedown delegator. dropdown 내부 어떤 요소든 매칭 시 `event.preventDefault()`로 input blur 차단. |
| `_handleClear()` | `() => void` | clear 버튼 native 사이드이펙트. input.value = '' + history 있으면 `_openDropdown` 아니면 `_closeDropdown`. (`@searchCleared`는 bindEvents가 발행). |
| `_handleClearAll()` | `() => void` | "모두 지우기" 버튼. `_history = []` + `localStorage.removeItem(storageKey)` + dropdown 닫음 + `@recentCleared` emit. |

> **bindEvents의 `@searchCleared` ↔ 자체 사이드이펙트 분리**: `@searchCleared`는 customEvents의 위임 발행으로 외부에 알리고, 컴포넌트 자체 사이드이펙트(input 비우기 + dropdown 재오픈)는 별도 native click 핸들러(`_handleClear`)에서 수행한다 — autoComplete 패턴 답습.

### 페이지 연결 사례

```
[페이지 — 사이트 내 검색 / 이커머스 / 지도 / 운영 콘솔 / 멤버 검색]
    │
    ├─ fetchAndPublish('searchBar', this) 또는 직접 publish
    │     payload 예: { placeholder: 'Search docs...', query: '', leadingIcon: '\u{1F50D}' }
    │
    ├─ (선택) '@searchSubmitted' 수신 → 전체 검색 실행 / navigate
    ├─ (선택) '@recentItemClicked' 수신 → 분석 로깅
    ├─ (선택) '@recentLoaded' 수신 → "최근 검색어 N개" UI 동기화
    └─ (선택) 'setRecentHistory' publish → 서버 sync된 history 강제 주입

[Search/Advanced/recentHistory]
    ├─ register 시점: _loadHistory + _emitLoaded 호출 — '@recentLoaded' 1회 emit
    ├─ FieldRender가 검색 바 데이터 매핑
    ├─ input focus + 빈 value → dropdown open(history 있을 때) → 헤더 + 항목 list 렌더
    ├─ input 비어있는 동안 입력 시작 → dropdown 즉시 닫음
    ├─ 항목 클릭 → input.value = query + _addToHistory(끌어올림) + dropdown 닫음
    │            + @recentItemClicked({query}) + @searchSubmitted({value}) emit
    ├─ × 버튼 → _removeFromHistory + dropdown 재렌더 + @recentItemRemoved emit
    ├─ Enter (current value) → _addToHistory(value) + @searchSubmitted({value}) emit + dropdown 닫음
    ├─ "모두 지우기" → _history=[] + localStorage 제거 + @recentCleared emit
    └─ × clear → @searchCleared(Standard 호환) + input 비우기 + dropdown 재오픈

운영: this.pageDataMappings = [
        { topic: 'searchBar',         datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setRecentHistory',  datasetInfo: {...}, refreshInterval: 0 }   // 선택 — 서버 동기화 시
      ];
      Wkit.onEventBusHandlers({
        '@recentLoaded':       ({ count, queries })   => { /* "최근 N개" UI 동기화 */ },
        '@searchSubmitted':    ({ value })            => { /* 전체 검색 실행 */ },
        '@recentItemClicked':  ({ query })            => { /* 분석 로깅 */ },
        '@recentItemRemoved':  ({ query, remaining }) => { /* 서버 동기화 (선택) */ },
        '@recentCleared':      ()                     => { /* 서버 reset (선택) */ },
        '@searchCleared':      ()                     => { /* query 초기화 */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|-------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 + 그라디언트 깊이 + Pretendard + pill 바(30px) + dropdown 그라디언트 + 헤더 시안 액센트 + 항목 hover 시안 fill. | **사이트 내 검색 history — 헬프센터 / 문서** (Renobit 문서 빠른 재검색 — `getting started`, `mixin spec` 등) |
| `02_material`    | B: Material Elevated | 라이트 + elevation shadow + Roboto + 28px pill + dropdown elevation 카드 + Material 헤더 분리선 + 리스트 ripple hover. | **이커머스 최근 본 상품 검색** (사용자가 검색했던 상품/카테고리 — Amazon/쿠팡 스타일) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 + DM Serif 입력 + 바닥줄(border-bottom) 바 + dropdown 미니멀 hairline + 헤더 작은 caps + 항목 hover inverted. | **사이트 검색 history — 매거진/카탈로그** (저널/매거진 사이트의 최근 키워드 — 정적 출판물 패턴) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 + IBM Plex Mono input + 시안 미세 테두리(2-4px 모서리) + dropdown 모노스페이스 list + 헤더 uppercase mono + × 시안 액센트. | **운영 콘솔 최근 검색 history** (호스트명 / 메트릭 키 / 로그 쿼리 — 자주 쓰는 패턴 빠른 재실행) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따른다. preview에는 4~6개 history seed로 dropdown + Enter commit + 항목 클릭 + × 삭제 + "모두 지우기" 시나리오를 한 변형 안에서 시연한다.

### 결정사항

- **컴포넌트 직접 localStorage 접근 (의도적)**: 페이지 책임을 최소화. 서버 동기화가 필요한 페이지는 `setRecentHistory` 토픽으로 강제 주입 가능(두 모드 모두 지원). preview에서는 storageKey를 변형별로 고유하게(`renobit_search_history__refined` 등) 두어 4개 변형이 같은 페이지에서 동시 시연되어도 충돌하지 않도록 한다.
- **dropdown은 빈 입력 전용**: autoComplete은 입력 후 후보 표시, recentHistory는 빈 입력에서 history 표시. 두 패턴이 같은 컴포넌트에 공존하지 않음(향후 `searchView`로 일반화 검토 후보).
- **키보드 navigation 제외**: ArrowDown/Up + Enter 항목 선택은 본 변형의 1차 범위에서 제외(autoComplete은 외부 fetch 결과를 위에서 아래로 빠르게 탐색하는 시나리오, recentHistory는 평균 5~10개의 짧은 list — 항목 클릭이 더 자연스러움). Enter는 "현재 input value를 새 검색으로 commit + history append"로 사용.
- **history 항목 끌어올림**: 항목 클릭 시 그 query를 맨 앞으로 끌어올린다(중복 제거). LRU 패턴 — 자주 쓰는 검색어가 위로 올라온다.
- **개별 × 삭제 stopPropagation**: × 버튼 click이 항목 click delegator로 bubbling되면 항목 클릭(검색)도 함께 트리거되어 의도와 어긋난다. `_handleDropdownEvent`에서 × 매칭 시 `event.stopPropagation()` 호출.
- **mousedown preventDefault (autoComplete 답습)**: dropdown 어떤 요소든 mousedown 시 input blur를 차단하여 클릭이 정상 처리되도록 한다(blur 핸들러는 그 외 모든 외부 클릭에서 dropdown을 닫는다).
- **focus 시 자동 open + 입력 시 닫음**: 사용자가 다시 검색하려고 input을 클릭(focus) → history 즉시 노출. 입력 시작 시 history 가림(autoComplete의 자동완성 영역과 겹치지 않도록 — 향후 같은 컴포넌트에서 두 패턴을 통합한다면 두 영역을 위/아래로 분리하거나 모드 전환).
- **외부 강제 주입 데이터 형태 두 가지 수용**: `[string]`(단순 query 배열 — 서버에서 정렬된 상태) + `[{query, ts}]`(timestamp 포함 — 다단계 정렬 가능). 정규화 로직은 `_setHistory`에 흡수.
- **Standard 호환 채널 유지**: `@searchSubmitted` + `@searchCleared`는 Standard 시그니처 그대로. 페이지가 Standard에서 recentHistory로 마이그레이션할 때 핸들러를 그대로 재사용 가능. 신규 채널(`@recentLoaded`/`@recentItemClicked`/`@recentItemRemoved`/`@recentCleared`)은 본 변형 전용.
- **dropdown 위치**: input 바로 아래 absolute 배치(컨테이너 relative 기준). overflow visible 필요 — autoComplete과 동일.
- **신규 Mixin 생성 금지**: FieldRenderMixin + 자체 메서드로 완결. dropdown + blur 처리(mousedown preventDefault) + 자체 핸들러 bound refs 패턴이 autoComplete + recentHistory 누적 — 향후 `SearchDropdownMixin` 일반화 검토 후보(SKILL 회귀 규율, 본 사이클은 메모만).
