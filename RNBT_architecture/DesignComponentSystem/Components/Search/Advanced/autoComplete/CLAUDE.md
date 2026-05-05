# Search — Advanced / autoComplete

## 기능 정의

1. **검색 바 렌더링 (Standard 호환 KEY)** — `searchBar` 토픽으로 수신한 객체 데이터(`{ placeholder, query, leadingIcon }`)를 검색 바에 반영. FieldRenderMixin으로 input의 `value`/`placeholder` 속성과 leading 아이콘 textContent에 매핑. cssSelectors KEY는 Standard 호환(`searchBar`/`leadingIcon`/`query`/`placeholder`/`clearBtn`).
2. **입력 → debounce → 외부 fetch 위임 (`@autocompleteRequested`)** — input 이벤트에 250ms 자체 setTimeout 디바운스를 걸고, 만료 시 `@autocompleteRequested` 1회 발행. payload: `{ value, requestedAt }`. 매 keystroke마다 emit하지 않음. 페이지가 이 이벤트를 받아 외부 API 호출 후 `autocompleteSource` 토픽으로 후보를 publish — 컴포넌트는 직접 fetch 하지 않는다.
3. **dropdown 후보 렌더 (`autocompleteSource` 구독)** — `autocompleteSource` 토픽으로 수신한 후보 배열(`[{id, label, sublabel?, score?}]`)을 input 바로 아래 dropdown 패널에 cloneNode로 렌더. 자체 메서드(`_renderDropdown`)가 두 번째 template(`#search-autocomplete-suggestion-template`)을 사용해 cloneNode + textContent + dataset 채움. 빈 입력값 / 빈 후보 배열은 dropdown을 닫는다.
4. **dropdown 키보드 navigation** — input의 `keydown` 이벤트에서 ArrowDown/Up으로 `_focusIndex` 순환(0..length-1) + 시각 동기화(`is-active` 클래스), Enter로 active 항목 선택, Escape로 dropdown 닫기 (`_focusIndex = -1`). 마우스 hover로도 `_focusIndex` 동기화.
5. **선택 처리 (`@autocompleteSelected` + `@searchInputChanged`)** — dropdown 항목 클릭 또는 Enter 시 input에 `label` 채움 + dropdown 닫음 + `@autocompleteSelected` 발행 (payload: `{ id, label, value }`). 동시에 Standard 호환 채널 `@searchInputChanged` 발행 (payload: `{ value }`).
6. **Clear 처리 (`@searchCleared`)** — clear 버튼 클릭 시 input value 비우기 + dropdown 닫음 + `_focusIndex = -1` + `@searchCleared` 발행. Standard 시그니처 유지.
7. **focus out 시 dropdown 닫음** — input `blur` 시 dropdown 닫음. 단, dropdown 항목 mousedown 중에는 항목의 `mousedown`에서 `event.preventDefault()`로 input blur를 막아 클릭이 정상 처리되도록 한다.

> **Standard와의 분리 정당성 (5축)**:
> - **새 토픽 1종 추가** — `autocompleteSource`(외부 fetch 결과 후보 풀). Standard는 `searchBar` + `searchSuggestions` 2종이며 `searchSuggestions`는 페이지가 keystroke마다 직접 publish하는 단순 채널 — 디바운스/요청 트리거 로직 없음. autoComplete은 페이지의 fetch 트리거를 컴포넌트 안으로 흡수해 `@autocompleteRequested` 채널로 정식화.
> - **새 영역 추가 — dropdown 패널 + 두 번째 template** — Standard는 `.search__suggestions` 단일 컨테이너로 ListRenderMixin이 직접 렌더. autoComplete은 input 바로 아래 absolute 배치 dropdown(`.search-ac__dropdown.is-open`)에 자체 `_renderDropdown` 메서드가 두 번째 template(`#search-autocomplete-suggestion-template`)을 cloneNode. ListRenderMixin은 사용하지 않음(Mixin 두 번 적용 회피 + 자체 메서드 충분).
> - **자체 상태 5종** — `_focusIndex: number`(키보드 active 인덱스, -1 = 없음), `_suggestions: Array`(현재 dropdown 후보 — `_renderDropdown`이 갱신), `_debounceTimer: timeoutId`(setTimeout 핸들), `_inputHandler` / `_keydownHandler` / `_blurHandler` / `_dropdownClickHandler` / `_dropdownMouseoverHandler` / `_dropdownMousedownHandler` (bound refs — beforeDestroy에서 정확히 removeEventListener 보장). Standard는 stateless.
> - **새 이벤트 3종 + Standard 시그니처 유지 2종** — `@autocompleteRequested`(디바운스 후 fetch 트리거), `@autocompleteSelected`(dropdown 선택), `@searchInputChanged`(Standard 호환 — debounced 입력값 변경 통보). Standard 호환 `@searchCleared` 유지. Standard는 `@searchInput`/`@searchSubmitted`/`@searchCleared`/`@suggestionClicked` 4종.
> - **debounce + 키보드 navigation + dropdown open/close + blur 처리 정책 모두 흡수** — Standard는 input/change 이벤트를 단순 위임만 하고 페이지가 디바운스/외부 fetch/dropdown 키보드 핸들링/blur 닫기를 매번 재구현. autoComplete은 그 보일러를 한 곳에 정식화. 같은 register.js로 표현 불가.

> **유사 변형과의 비교**: `Chips/Input/Advanced/tagAutoComplete`이 "입력 + 자동완성 dropdown + 키보드 navigation + 칩 추가/제거 + 디바운스 emit"을 자체 메서드로 흡수했다면, Search/autoComplete은 칩 누적이 없는(검색 단일 선택) 패턴이다. dropdown 렌더 / 키보드 navigation / 디바운스 emit / 외부 fetch 위임 패턴은 동일 답습. 차이는 ① 칩 누적(`_tags: Map`) 자체 상태가 없고, ② 선택 시 input에 label 채움 + 단일 선택 emit으로 종결, ③ `autocompleteSource` 토픽이 페이지에서 fetch 결과로 publish되어 컴포넌트는 그대로 표시(클라이언트 필터링 없음 — 서버가 결과를 정렬·자름).

> **MD3 / 도메인 근거**: MD3 Search 명세는 "검색 바와 검색 뷰" 패턴에서 자동완성 제안을 표준 인터랙션으로 제시한다. 실사용 예: ① 사이트 내 검색 자동완성(헬프 센터 / 문서 검색), ② 제품 검색 추천(이커머스), ③ 도시명/주소 자동완성(지도/배송지), ④ 호스트명/메트릭 키 자동완성(운영 콘솔), ⑤ 멤버/유저 검색 자동완성. 모든 케이스에서 keystroke마다 서버 호출은 비효율적 → debounce(150~300ms) 표준. 본 변형은 250ms로 한국어/영어 입력에 자연스러운 타이밍 채택(tagAutoComplete은 150ms — 칩 추가가 빈번한 작업 흐름이라 더 짧음).

---

## 구현 명세

### Mixin

FieldRenderMixin (검색 바의 query/placeholder/leadingIcon 데이터 매핑) + 자체 메서드 7종 + 자체 상태 5종.

> **신규 Mixin 생성 금지** — dropdown 렌더는 자체 메서드(`_renderDropdown`)로 처리. ListRenderMixin을 두 번째 Mixin으로 적용하지 않는다 — Standard와 달리 dropdown은 input의 absolute overlay이고 외부 fetch 결과를 그대로 표시하는 단순 cloneNode 패턴이라 Mixin 인스턴스 네임스페이스를 추가할 필요가 없다(tagAutoComplete 결정사항과 동일 정책).

### cssSelectors

#### FieldRenderMixin (`this.fieldRender`) — 검색 바 + 추가 영역 KEY

| KEY | VALUE | 용도 |
|-----|-------|------|
| searchBar          | `.search-ac__bar`                          | 바 루트 — 계약 유지 (이벤트/스타일 훅) |
| leadingIcon        | `.search-ac__leading`                      | 선행 검색 아이콘 자리 — textContent 반영 |
| query              | `.search-ac__input`                        | 입력 필드 — `value` 속성으로 반영 + 자체 input/keydown/blur 핸들러 부착 영역 |
| placeholder        | `.search-ac__input`                        | 입력 필드 — `placeholder` 속성으로 반영 |
| clearBtn           | `.search-ac__clear`                        | 클리어 버튼 — bindEvents click 매핑 |
| dropdown           | `.search-ac__dropdown`                     | dropdown 패널 컨테이너 — `.is-open` 클래스로 표시 토글 |
| dropdownList       | `.search-ac__dropdown-list`                | dropdown 항목이 추가될 부모 — 자체 메서드 진입점 |
| suggestionTpl      | `#search-autocomplete-suggestion-template` | dropdown 항목 cloneNode 대상 |
| suggestionItem     | `.search-ac__suggestion`                   | dropdown 항목 (data-suggestion-id, click/mouseover delegator 영역) |
| suggestionLabel    | `.search-ac__suggestion-label`             | dropdown 항목 라벨 텍스트 |
| suggestionSublabel | `.search-ac__suggestion-sublabel`          | dropdown 항목 보조 텍스트 (sublabel 있을 때만) |

> **이벤트/UI 영역 KEY**: `dropdown`/`dropdownList`/`suggestionTpl`/`suggestionItem`/`suggestionLabel`/`suggestionSublabel`은 FieldRenderMixin이 데이터 바인딩에 사용하지 않는 영역이지만(query/placeholder/leadingIcon만 데이터 바인딩) customEvents 매핑 + 자체 메서드의 querySelector 진입점으로 등록한다 — tagAutoComplete의 `input`/`dropdown`/`dropdownList`/`suggestionTpl` 등록 패턴 답습.

#### elementAttrs (FieldRenderMixin)

| KEY | VALUE |
|-----|-------|
| query       | value |
| placeholder | placeholder |

> `query`는 input의 `value`로, `placeholder`는 input의 `placeholder`로 반영. `leadingIcon`은 textContent이므로 elementAttrs 없음 (Standard와 동일).

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_focusIndex` | `number` | dropdown active 항목 인덱스 (-1: 없음). ArrowDown/Up/mouseover로 갱신. Enter는 active 항목 선택. |
| `_suggestions` | `Array<{id, label, sublabel?}>` | 현재 dropdown 후보 — `autocompleteSource` 토픽 갱신 시 `_renderDropdown`이 저장. dropdown DOM의 진실 소스 + 키보드 선택 시 인덱스 → 항목 매핑. |
| `_debounceTimer` | `number \| null` | setTimeout 핸들. `_handleInput`에서 `clearTimeout` 후 재설정. beforeDestroy에서 clear. |
| `_inputHandler` / `_keydownHandler` / `_blurHandler` | `function \| null` | input element 자체 핸들러 bound refs — beforeDestroy 정확 제거용. |
| `_dropdownClickHandler` / `_dropdownMouseoverHandler` / `_dropdownMousedownHandler` | `function \| null` | dropdown element 자체 핸들러 bound refs — beforeDestroy 정확 제거용. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `searchBar` | `this.fieldRender.renderData` | `{ placeholder, query, leadingIcon }` — Standard 호환 |
| `autocompleteSource` | `this._renderDropdown` | `[{ id, label, sublabel?, score? }]` — 외부 fetch 결과 후보 풀 |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `clearBtn` (fieldRender) | clear 버튼 클릭 | `@searchCleared` (Standard 호환 시그니처). 자체 핸들러도 추가로 input/dropdown 정리. |

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@searchInputChanged` | input 이벤트 디바운스 만료(250ms) | `{ value }` (Standard와 호환되도록 단순 페이로드 — 현재 입력값) |
| `@autocompleteRequested` | input 이벤트 디바운스 만료(250ms) | `{ value, requestedAt: ISO string }` (페이지가 외부 API 호출 트리거로 사용) |
| `@autocompleteSelected` | dropdown 항목 click 또는 active 항목 Enter | `{ id, label, value }` (`value`는 input에 채워진 최종 텍스트 = label) |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderDropdown({ response })` | `({response}) => void` | `autocompleteSource` 핸들러. items 배열을 정규화 후 `_suggestions`에 저장 + dropdown DOM 재렌더 + `_focusIndex = (length>0 ? 0 : -1)` + `is-open` 토글. 빈 배열 / 빈 입력 시 dropdown 닫음. emit 없음. |
| `_handleInput(e)` | `(InputEvent) => void` | input element `input` 이벤트. 빈 값이면 즉시 dropdown 닫음. 비어있지 않으면 `clearTimeout` 후 setTimeout(250ms) 재설정 → 만료 시 `@searchInputChanged`(`{value}`) + `@autocompleteRequested`(`{value, requestedAt}`) 1회 emit. |
| `_handleKeydown(e)` | `(KeyboardEvent) => void` | input element `keydown`. ArrowDown/Up: `_focusIndex` 순환 + `_syncActiveVisual()`. Enter: active 항목 `_selectSuggestion(item)`. Escape: dropdown 닫기 + `_focusIndex = -1`. dropdown이 열려있지 않거나 후보가 없으면 silent return. |
| `_handleBlur(e)` | `(FocusEvent) => void` | input element `blur`. dropdown 닫음 + `_focusIndex = -1`. 단, dropdown 항목의 mousedown에서 `event.preventDefault()`로 blur를 막아 항목 click이 정상 동작하도록 한다(아래 `_handleDropdownMousedown`). |
| `_handleDropdownEvent(e)` | `(MouseEvent) => void` | dropdown 영역 click + mouseover delegator. click → 항목 매칭 시 `_selectSuggestion`, mouseover → `_focusIndex` 갱신 + `_syncActiveVisual()`. |
| `_handleDropdownMousedown(e)` | `(MouseEvent) => void` | dropdown 영역 mousedown delegator. 항목 매칭 시 `event.preventDefault()`로 input blur 차단(블러로 인한 dropdown 닫힘 방지). |
| `_syncActiveVisual()` | `() => void` | `_focusIndex` 변경 시 모든 dropdown 항목 순회하며 `is-active` 클래스 토글. |
| `_selectSuggestion(item)` | `(item) => void` | 후보 선택 — input.value = label + dropdown 닫음 + `_focusIndex = -1` + `@autocompleteSelected` + `@searchInputChanged`(value=label) emit. |
| `_handleClear()` | `() => void` | `@searchCleared` 발행 후 자체 호출(또는 bindEvents 발행 후 사이드이펙트). input value 비우기 + dropdown 닫음 + `_focusIndex = -1` + `_suggestions = []` + dropdownList innerHTML 비움. |

> **bindEvents의 `@searchCleared` ↔ 자체 사이드이펙트 분리**: `@searchCleared`는 customEvents의 위임 발행으로 외부에 알리고, 컴포넌트 자체 사이드이펙트(input/dropdown 초기화)는 별도 native click 핸들러(`_clearHandler`)에서 수행한다(Standard 페이지 호환을 위해 페이로드는 customEvents의 단순 위임 시그니처 유지).

### 페이지 연결 사례

```
[페이지 — 사이트 내 검색 / 제품 검색 / 도시 자동완성 / 호스트명 자동완성]
    │
    ├─ fetchAndPublish('searchBar', this) 또는 직접 publish
    │     payload 예: { placeholder: 'Search docs...', query: '', leadingIcon: '\u{1F50D}' }
    │
    └─ '@autocompleteRequested' 수신 → 외부 API 호출 → 'autocompleteSource' publish
          payload 예: [
            { id: 'doc-001', label: 'Getting Started', sublabel: 'Docs · 2 min read' },
            { id: 'doc-014', label: 'Getting an API key', sublabel: 'Docs · 4 min read' }
          ]

[Search/Advanced/autoComplete]
    ├─ FieldRender가 검색 바 데이터 매핑
    ├─ 사용자 'gett' 입력 → 250ms debounce → @autocompleteRequested + @searchInputChanged 1회 emit
    ├─ 페이지가 fetch 후 autocompleteSource publish → _renderDropdown 갱신
    ├─ dropdown 열림(_suggestions = 2개, _focusIndex = 0)
    ├─ ArrowDown/Up으로 _focusIndex 순환 → is-active 시각 동기화
    └─ Enter / 클릭 → _selectSuggestion → input.value = 'Getting Started'
                      → @autocompleteSelected({id, label, value})
                      → @searchInputChanged({value})

[× clear 클릭]
    └──@searchCleared (Standard 호환)──▶ [페이지]
            + 자체 사이드이펙트: input 초기화 + dropdown 닫음

운영: this.pageDataMappings = [
        { topic: 'searchBar',          datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'autocompleteSource', datasetInfo: {...}, refreshInterval: 0 }   // 페이지가 @autocompleteRequested 수신 후 publish
      ];
      Wkit.onEventBusHandlers({
        '@autocompleteRequested': ({ value, requestedAt }) => { /* 외부 API 호출 후 autocompleteSource publish */ },
        '@searchInputChanged':    ({ value })             => { /* 분석 로깅 */ },
        '@autocompleteSelected':  ({ id, label })         => { /* navigate / 검색 실행 */ },
        '@searchCleared':         ()                      => { /* query 초기화 */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|-------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 베이스 + 그라디언트 깊이 + Pretendard + pill 바(30px) + dropdown 그라디언트 + active 항목 시안 강조. | **사이트 내 검색 자동완성** (Renobit 문서/헬프센터 검색 — getting started, API key 등 추천) |
| `02_material`    | B: Material Elevated | 라이트 + elevation shadow + Roboto + 28px pill + dropdown elevation 카드 + Material list ripple hover. | **이커머스 제품 검색 추천** (사용자 검색어로 제품명/브랜드 자동완성 — Amazon/쿠팡 스타일) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 + DM Serif 입력 + 바닥줄(border-bottom) 바 + dropdown 미니멀 hairline + active 항목 inverted. | **도시명/주소 자동완성** (배송지/지도 검색 — 매거진형 출판물 / 여행 카탈로그 패턴) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 + IBM Plex Mono input + 시안 미세 테두리(2-4px 모서리) + dropdown 모노스페이스 list + active 항목 시안 배경. | **호스트명/메트릭 키 자동완성** (운영 콘솔 — `web-prd-01` 같은 호스트명 / `cpu.usage` 같은 메트릭 키 추천) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따른다. 4~6개 추천 풀(label 길이 다양 + 일부 sublabel 포함)로 자동완성 + 키보드 navigation을 한 변형 안에서 시연한다.

### 결정사항

- **두 template 분리 (의도적)**: dropdown suggestion template(`#search-autocomplete-suggestion-template`)은 자체 메서드(`_renderDropdown`)가 cloneNode. ListRenderMixin을 두 번째 Mixin으로 적용하지 않음 — Mixin 인스턴스 네임스페이스 충돌 회피 + 외부 fetch 결과를 그대로 표시하는 단순 패턴이라 자체 메서드로 충분 (tagAutoComplete 결정 답습).
- **debounce 250ms**: 한국어/영어 IME 입력에 자연스러운 타이밍. tagAutoComplete의 150ms보다 길게 — 검색은 외부 API 호출이 동반되므로 keystroke 빈도를 더 줄이는 것이 합리적. 외부 라이브러리 도입 금지(setTimeout/clearTimeout만).
- **외부 fetch 위임 (`@autocompleteRequested`)**: 컴포넌트는 직접 fetch 하지 않는다. 페이지가 이 이벤트를 받아 외부 API 호출 후 `autocompleteSource`로 publish — 컴포넌트 책임 분리(컴포넌트는 출처를 모른다 원칙).
- **Standard 호환 채널 유지 (`@searchCleared` + `@searchInputChanged`)**: 페이지가 Standard에서 autoComplete으로 마이그레이션할 때 핸들러를 그대로 재사용 가능. 신규 채널 `@autocompleteRequested`/`@autocompleteSelected`은 본 변형 전용.
- **focus out 시 dropdown 닫음 + mousedown preventDefault**: blur로 인해 dropdown이 클릭 처리 전에 닫혀 click이 무효화되는 것을 방지하기 위해 dropdown 항목 mousedown에서 `event.preventDefault()`를 호출 — input blur 차단. blur 핸들러는 그 외 모든 외부 클릭에서 dropdown을 닫는다.
- **클라이언트 필터링 없음**: tagAutoComplete은 추천 풀을 받아 client-side에서 필터(이미 추가된 ID 제외 + 부분 일치)했지만, autoComplete은 서버가 결과를 정렬/자른 상태로 push한다고 가정 — `autocompleteSource`로 publish된 후보를 그대로 dropdown에 표시한다. (정렬·자르기·하이라이트는 페이지 책임 또는 서버 책임 — 컴포넌트는 표시만).
- **선택 시 input.value = label**: dropdown 선택 시 input에 `label`을 채운다(검색어 visualizing). 페이지가 `@autocompleteSelected`를 받아 navigate 또는 추가 검색 수행. 일부 도메인(코드 검색 등)에서는 id를 input에 채우는 것을 선호할 수 있으나, 본 변형은 사람이 읽는 텍스트(label)를 채우는 표준 UX 채택.
- **dropdown 위치**: input 바로 아래 absolute 배치(컨테이너 relative 기준). overflow visible 필요 — dropdown이 컨테이너 바깥으로 펼쳐질 수 있어야 하므로 컨테이너는 자체적으로 overflow 자르지 않는다.
- **신규 Mixin 생성 금지**: FieldRenderMixin + 자체 메서드로 완결. dropdown + 디바운스 + 키보드 + 외부 fetch 위임 패턴이 tagAutoComplete + autoComplete 누적 — 향후 `AutoCompleteMixin` 일반화 검토 후보(SKILL 회귀 규율, 본 사이클은 메모만).
