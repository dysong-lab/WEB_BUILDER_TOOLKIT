# Search — Standard

## MD3 정의

> Search lets people enter a keyword or phrase to get relevant information.

MD3 Search anatomy: 검색 바(leading icon + input field + trailing clear/action) + 검색 뷰(확장 시 표시되는 제안/최근 검색 목록). 검색 바는 항상 보이며, 검색 뷰는 입력/포커스 시 제안 목록을 표시하는 영역으로, 단일 토픽으로 주입된 배열 데이터로 구성된다.

## 기능 정의

1. **검색 바 렌더링** — `searchBar` 토픽으로 수신한 객체 데이터(placeholder, query, leadingIcon)를 검색 바에 반영한다. `query`는 input의 `value` 속성에, `placeholder`는 input의 `placeholder` 속성에, `leadingIcon`은 leading 아이콘 자리 textContent에 반영된다
2. **제안 항목 렌더링** — `searchSuggestions` 토픽으로 수신한 배열 데이터를 template 반복으로 suggestions 영역에 렌더링한다. 각 항목은 선행 아이콘(leading), 라벨(label), 보조 텍스트(supporting)로 구성되며 `suggestionid`로 식별된다
3. **입력 이벤트** — input 필드에 키 입력 시 `@searchInput` 발행 (페이지가 `query`를 수신하여 제안 목록을 재요청)
4. **제출 이벤트** — input 필드에서 Enter/submit 시 `@searchSubmitted` 발행 (페이지가 전체 검색 실행)
5. **클리어 이벤트** — trailing clear 버튼 클릭 시 `@searchCleared` 발행 (페이지가 `query`/suggestions 초기화)
6. **제안 항목 클릭 이벤트** — 제안 항목 클릭 시 `@suggestionClicked` 발행 (페이지가 선택된 항목으로 검색 수행)

---

## 구현 명세

### Mixin

FieldRenderMixin + ListRenderMixin

- FieldRenderMixin — 검색 바 요소(input, leading icon)에 데이터 반영
- ListRenderMixin — 제안 목록 반복 렌더링

### cssSelectors

#### FieldRenderMixin (`this.fieldRender`) — 검색 바

| KEY | VALUE | 용도 |
|-----|-------|------|
| searchBar   | `.search__bar`         | 바 루트 — 계약 유지 (이벤트/스타일 훅) |
| leadingIcon | `.search__leading`     | 선행 검색 아이콘 자리 |
| query       | `.search__input`       | 입력 필드 — `value` 속성으로 반영 |
| placeholder | `.search__input`       | 입력 필드 — `placeholder` 속성으로 반영 |
| clearBtn    | `.search__clear`       | 클리어 버튼 — 이벤트 매핑 |
| submitBtn   | `.search__submit`      | 제출 버튼 — 이벤트 매핑 (선택적) |

#### elementAttrs (FieldRenderMixin)

| KEY | VALUE |
|-----|-------|
| query       | value |
| placeholder | placeholder |

> `query`는 input의 `value`로, `placeholder`는 input의 `placeholder`로 반영되어야 하므로 elementAttrs로 등록한다. `leadingIcon`은 textContent이므로 elementAttrs 없음.

#### ListRenderMixin (`this.listRender`) — 제안 목록

| KEY | VALUE | 용도 |
|-----|-------|------|
| container    | `.search__suggestions`             | 항목 부모 (규약) |
| template     | `#search-suggestion-template`      | cloneNode 대상 (규약) |
| suggestionid | `.search__suggestion-item`         | 항목 식별 + 이벤트 매핑 |
| leading      | `.search__suggestion-leading`      | 항목 선행 아이콘 |
| label        | `.search__suggestion-label`        | 항목 라벨 |
| supporting   | `.search__suggestion-supporting`   | 항목 보조 텍스트 (선택적) |

#### datasetAttrs (ListRenderMixin)

| KEY | VALUE |
|-----|-------|
| suggestionid | suggestionid |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| searchBar         | `this.fieldRender.renderData` |
| searchSuggestions | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| input  | `query` (fieldRender.cssSelectors)      | `@searchInput` |
| change | `query` (fieldRender.cssSelectors)      | `@searchSubmitted` |
| click  | `clearBtn` (fieldRender.cssSelectors)   | `@searchCleared` |
| click  | `submitBtn` (fieldRender.cssSelectors)  | `@searchSubmitted` |
| click  | `suggestionid` (listRender.cssSelectors) | `@suggestionClicked` |

> `change` 이벤트는 Enter/blur 시 발행된다. MD3 Search의 "submit" 의미는 페이지가 `@searchSubmitted` 수신 시 최종 검색을 수행하는 계약으로 해석한다. `input` 이벤트는 타이핑마다, `change`는 완료 시점에 해당.

### 커스텀 메서드

없음 (비어있을 때 `.search__clear`의 표시/숨김은 CSS의 `:placeholder-shown` 혹은 페이지의 `data-empty` 토글로 관리. Standard는 스타일 훅만 제공)

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('searchBar', this)──> [Search] 바 렌더링
         publish data: { placeholder: 'Search devices...', query: '', leadingIcon: '\u{1F50D}' }

[페이지] ──fetchAndPublish('searchSuggestions', this)──> [Search] 제안 렌더링
         publish data: [{ suggestionid, leading, label, supporting }, ...]

[Search] ──@searchInput──> [페이지] ──> query 추출(event.target.value) → 제안 재요청

[Search] ──@searchSubmitted──> [페이지] ──> 전체 검색 실행

[Search] ──@searchCleared──> [페이지] ──> query/suggestions 초기화 후 republish

[Search] ──@suggestionClicked──> [페이지] ──> event.target.closest(...).dataset.suggestionid로
                                               선택 항목 식별 후 해당 항목으로 검색 수행
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined     | A: Refined Technical | 다크 퍼플, 그라디언트 깊이, Pretendard, pill 바(30px), 20px 제안 컨테이너 — box-shadow 금지 |
| 02_material    | B: Material Elevated | 라이트, elevation shadow, Roboto, 28px pill 바 + 4px 제안 컨테이너 (MD3 Search 표준에 가장 근접) |
| 03_editorial   | C: Minimal Editorial | 웜 그레이, 세리프 라벨, 2px 샤프 모서리, 바닥줄(border-bottom) 바, 넓은 여백 |
| 04_operational | D: Dark Operational  | 컴팩트 다크 쿨 톤, 모노스페이스 input, 시안 미세 테두리, 2-4px 모서리 |

### 결정사항

- **검색 바 vs 검색 뷰 통합**: Standard는 검색 바와 제안 목록(검색 뷰)을 하나의 인라인 컴포넌트로 제공한다. 오버레이/모달 형태의 확장 검색 뷰는 Advanced 변형(ShadowPopupMixin 조합)에서 다룬다 — Standard는 항상 보이는 인라인 표면으로 시작한다.
- **체크마크 없음**: Menus와 달리 제안 항목에는 선택 상태(selected)가 없다. 클릭 즉시 검색 실행이므로 `itemKey`/`datasetAttrs.selected` 없음.
- **아이콘 전략**: MD3는 material-symbols 폰트를 권장하지만, 페르소나 A/C는 유니코드 심볼(🔍, ✕)을 사용하고, B는 material-symbols, D는 컴팩트 ASCII 심볼로 대체한다 — 각 페르소나의 서체 정책에 맞춘다.
- **clear 버튼 노출**: input이 비어있으면 `.search__clear:empty` 또는 `:has(:placeholder-shown)`로 숨기지 않고, 페이지가 필요 시 `.search__bar[data-empty="true"]` 토글로 관리한다. Standard CSS는 기본적으로 clear 버튼을 항상 표시한다.
- **근거**: MD3 Search는 "검색 바 + 제안 목록"이 한 쌍으로 동작. 바는 단일 객체(query/placeholder) → FieldRender, 제안은 배열 → ListRender. 기존 Mixin 조합(SplitButtons 패턴과 동일)으로 완결되므로 신규 Mixin 불필요.
