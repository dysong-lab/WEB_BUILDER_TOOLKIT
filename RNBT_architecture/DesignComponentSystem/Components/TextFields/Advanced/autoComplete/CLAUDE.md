# TextFields — Advanced / autoComplete

## 기능 정의

1. **TextField 기본 렌더링 (Standard 호환 KEY)** — `textField` 토픽으로 수신한 객체 데이터(`{ label, required, value, placeholder, leadingIcon, trailingIcon, supporting, errorText, state }`)를 FieldRenderMixin으로 매핑. cssSelectors KEY는 Standard 호환(`root` / `label` / `leadingIcon` / `value` / `placeholder` / `trailingIcon` / `supporting` / `errorText` / `state` / `required`).
2. **입력 → debounce(200ms) → 자동완성 fetch 트리거 emit** — input element의 native `input` 이벤트에서 `clearTimeout` 후 `setTimeout(200ms)` 재설정. 만료 시 `@autoCompleteRequested({ keyword, requestedAt })` 1회 emit. 빈 입력은 즉시 dropdown 닫음 + 디바운스 취소.
3. **`suggestedValues` 토픽 구독 → dropdown 렌더** — 페이지가 `@autoCompleteRequested`를 받아 외부 fetch 후 `suggestedValues` 토픽으로 `{ keyword, items: [{ value, label?, sublabel?, meta? }] }` 또는 단순 배열 `[{value,label?,sublabel?}]`을 publish. `_renderSuggestions`가 두 번째 template(`#textfields-ac-suggestion-template`)을 cloneNode하여 input 바로 아래 absolute dropdown(`.text-field-ac__dropdown.is-open`)에 렌더. 빈 input/빈 배열은 dropdown 닫음.
4. **dropdown 키보드 navigation** — input element `keydown`에서 ArrowDown/Up으로 `_focusIndex` 순환 + `_syncActiveVisual()`(is-active 토글), Enter로 active 항목 `_selectSuggestion`, Escape로 dropdown 닫기 + `_focusIndex = -1`. 마우스 hover로도 `_focusIndex` 동기화(`_handleDropdownEvent`).
5. **항목 선택 처리 (`@autoCompleteSelected`)** — dropdown 항목 click 또는 Enter 시 input.value에 선택된 `value`(또는 `label` fallback) 채움 + dropdown 닫음 + `_focusIndex = -1` + `@autoCompleteSelected({ value, item })` emit. masking과 달리 raw 분리 개념이 없으므로 selected payload에 항목 객체를 그대로 동봉.
6. **focus out 시 dropdown 닫음 + mousedown preventDefault** — input element `blur` 시 dropdown 닫기. dropdown 항목 mousedown에서 `event.preventDefault()`로 input blur 차단(클릭이 정상 처리되도록).
7. **change(blur/Enter) 이벤트 — Standard 호환** — 본 변형은 Standard의 `@textFieldChanged`(blur/Enter 시 변경 완료 통보)는 그대로 유지하고 `@textFieldInput`은 의도적으로 미발행(`@autoCompleteRequested`가 권위 있는 디바운스 채널). `@textFieldTrailingClicked`도 Standard 호환 유지(페이지가 clear 또는 모드 전환 결정).

> **Standard와의 분리 정당성 (5축)**:
> - **새 토픽 1종 추가** — `suggestedValues`(외부 fetch 결과 자동완성 후보 풀). Standard는 `textField` 단일 토픽 — 자동완성 개념 없음. 페이지가 `@autoCompleteRequested`를 받아 외부 API 호출 후 `suggestedValues`로 publish하는 표준 흐름.
> - **새 영역 추가 — dropdown 패널 + 두 번째 template** — Standard의 view는 라벨/입력/leading/trailing/supporting/error 6요소만. autoComplete은 input 바로 아래 absolute 배치 dropdown(`.text-field-ac__dropdown.is-open`) + suggestion template. 자체 `_renderSuggestions`가 cloneNode(ListRenderMixin 미사용 — 두 번째 Mixin 인스턴스 네임스페이스 회피, Search/Advanced/autoComplete 결정 답습).
> - **자체 상태 4종 + bound handler refs 7종** — `_focusIndex: number`(-1 = 없음), `_suggestions: Array`(현재 후보), `_debounceTimer: timeoutId`, `_lastKeyword: string`(emit 시점 키워드 캐시 — 늦게 도착한 응답 필터링용 + 디버그). `_inputHandler` / `_keydownHandler` / `_blurHandler` / `_dropdownClickHandler` / `_dropdownMouseoverHandler` / `_dropdownMousedownHandler`(beforeDestroy 정확 제거용). Standard는 stateless.
> - **새 이벤트 2종 + Standard 시그니처 유지 2종** — `@autoCompleteRequested({keyword, requestedAt})`(디바운스 후 fetch 트리거), `@autoCompleteSelected({value, item})`(dropdown 선택 결과). Standard 호환 `@textFieldChanged` / `@textFieldTrailingClicked` 유지. `@textFieldInput`은 의도적 미발행(중복 채널 방지 — Search/autoComplete 결정 답습).
> - **자체 input/keydown/blur 핸들러 + dropdown 영역 click/mouseover/mousedown delegator로 디바운스 + dropdown navigation + blur 처리 정책 모두 흡수** — Standard의 `customEvents` 위임만으로는 표현 불가. 같은 register.js로 표현 불가능.

> **유사 변형과의 비교**: `Search/Advanced/autoComplete`이 "입력 + debounce + dropdown navigation + 외부 fetch 위임 + 선택 시 단일 input.value 채움"을 자체 메서드로 흡수했고, `Chips/Input/Advanced/tagAutoComplete`이 "입력 + debounce + dropdown + 칩 누적"을 흡수한 것과 동일 패턴. 차이는 ① 토픽 이름이 `searchBar` ↔ `textField`(Standard 호환 KEY 차이), ② 후보 토픽 이름이 `autocompleteSource` ↔ `suggestedValues`(큐 명세 토픽 이름), ③ 이벤트 이름이 `@autocompleteRequested/Selected` ↔ `@autoCompleteRequested/Selected`(camelCase의 두 단어 분리), ④ TextField는 clear 버튼이 별도 영역이 아니라 trailing 아이콘으로 구현 → `@textFieldTrailingClicked`로 통일된 시그니처. 디바운스는 200ms로 설정(Search 250ms와 차이 — TextField는 폼 입력으로 사용자가 더 짧은 응답을 기대; tagAutoComplete의 150ms보다는 김).

> **MD3 / 도메인 근거**: MD3 spec의 "Combobox / Autocomplete" 패턴 — text field에 자동완성 제안을 dropdown으로 표시하는 표준 패턴. Material Components(Vuetify, MUI) Autocomplete, GitHub Primer 등이 동일 패턴 일반화. 실사용 예: ① **회원가입 폼의 회사/소속 자동완성**(이미 등록된 회사명 추천), ② **결제/배송지 폼의 도시·국가 자동완성**, ③ **태그/카테고리 자동완성**(블로그 작성 태그 추천), ④ **운영 콘솔의 호스트명/메트릭 키 자동완성**, ⑤ **이메일 도메인 자동완성**(`@gmail.com`, `@naver.com` 추천). 모든 케이스에서 keystroke마다 fetch 비효율 → debounce 200~300ms 표준 + 외부 fetch는 페이지 책임(컴포넌트 출처 unaware 원칙).

---

## 구현 명세

### Mixin

FieldRenderMixin (단일) + 자체 상태 4종 + 자체 메서드 8종 + bound handler refs 7종.

> **신규 Mixin 생성 금지** — autoComplete는 textField의 입력 처리 정책 + dropdown 표시 패턴이지 새 렌더 패턴이 아니다. FieldRenderMixin이 textField 데이터 매핑을 담당하고, 자체 native handler가 디바운스 emit + dropdown navigation + blur 처리 + suggestion 렌더를 담당. ListRenderMixin은 두 번째 Mixin 적용 시 네임스페이스 충돌 회피 + 외부 fetch 결과를 그대로 표시하는 단순 cloneNode 패턴이라 자체 메서드로 충분(Search/Advanced/autoComplete + tagAutoComplete 결정 답습).

### cssSelectors (`this.fieldRender`)

| KEY | VALUE | 용도 |
|-----|-------|------|
| root              | `.text-field`                              | 루트 — `data-state` / `data-required` 부착 + 이벤트 스코프 |
| label             | `.text-field__label`                       | 라벨 텍스트 |
| leadingIcon       | `.text-field__leading`                     | 시작 아이콘 자리 |
| value             | `.text-field__input`                       | 입력 필드 — `value` 속성 반영 + 자체 input/keydown/blur 핸들러 부착 영역 |
| placeholder       | `.text-field__input`                       | 입력 필드 — `placeholder` 속성 반영 |
| trailingIcon      | `.text-field__trailing`                    | 끝 아이콘 자리 — bindEvents click 매핑 |
| supporting        | `.text-field__supporting`                  | 보조 텍스트 (helper) |
| errorText         | `.text-field__error`                       | 에러 메시지 |
| state             | `.text-field`                              | dataset 반영 대상 (state) |
| required          | `.text-field`                              | dataset 반영 대상 (required) |
| dropdown          | `.text-field-ac__dropdown`                 | dropdown 패널 컨테이너 — `.is-open` 클래스로 표시 토글 |
| dropdownList      | `.text-field-ac__dropdown-list`            | suggestion 항목이 추가될 부모 — 자체 메서드 진입점 |
| suggestionTpl     | `#textfields-ac-suggestion-template`       | suggestion 항목 cloneNode 대상 |
| suggestionItem    | `.text-field-ac__suggestion`               | suggestion 항목 (data-suggestion-value, click/mouseover delegator 영역) |
| suggestionLabel   | `.text-field-ac__suggestion-label`         | suggestion 항목 라벨 텍스트 |
| suggestionSublabel| `.text-field-ac__suggestion-sublabel`      | suggestion 항목 보조 텍스트 (sublabel 있을 때만) |

> dropdown/suggestion 영역 KEY는 FieldRenderMixin 데이터 바인딩 대상이 아니지만 자체 메서드의 querySelector 진입점 + customEvents 매핑 통일을 위해 cssSelectors에 등록(Search/Advanced/autoComplete 패턴 답습).

### datasetAttrs (`this.fieldRender`)

| KEY | VALUE |
|-----|-------|
| state    | state    |
| required | required |

### elementAttrs (`this.fieldRender`)

| KEY | VALUE | 동작 |
|-----|-------|------|
| value       | value       | input의 `value` 속성에 반영 |
| placeholder | placeholder | input의 `placeholder` 속성에 반영 |

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_focusIndex` | `number` | dropdown active 항목 인덱스 (-1: 없음). ArrowDown/Up/mouseover로 갱신. Enter는 active 항목 선택. |
| `_suggestions` | `Array<{value, label, sublabel}>` | 현재 dropdown 후보 — `suggestedValues` 토픽 갱신 시 `_renderSuggestions`가 저장. dropdown DOM의 진실 소스 + 키보드 선택 시 인덱스 → 항목 매핑. |
| `_debounceTimer` | `number \| null` | setTimeout 핸들. `_handleInput`에서 `clearTimeout` 후 재설정. beforeDestroy에서 clear. |
| `_lastKeyword` | `string` | emit 시점 키워드 캐시 — 디버그/추후 구식 응답 필터링용. |
| `_inputHandler` / `_keydownHandler` / `_blurHandler` | `function \| null` | input element 자체 핸들러 bound refs — beforeDestroy 정확 제거용. |
| `_dropdownClickHandler` / `_dropdownMouseoverHandler` / `_dropdownMousedownHandler` | `function \| null` | dropdown element 자체 핸들러 bound refs — beforeDestroy 정확 제거용. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `textField` | `this.fieldRender.renderData` | `{ label, required, value, placeholder, leadingIcon, trailingIcon, supporting, errorText, state }` — Standard 호환 |
| `suggestedValues` | `this._renderSuggestions` | `{ keyword, items: [{value, label?, sublabel?, meta?}] }` 또는 단순 배열 `[{value,label?,sublabel?}]` — 외부 fetch 결과 후보 풀. `_renderSuggestions`가 양쪽 형태 정규화. |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 |
|--------|------------------|------|
| change | `value` (fieldRender)        | `@textFieldChanged` (Standard 호환) |
| click  | `trailingIcon` (fieldRender) | `@textFieldTrailingClicked` (Standard 호환) |

> input 이벤트는 customEvents에서 위임하지 않고 자체 native handler(`_handleInput`)로 처리한다 — 디바운스 + dropdown 닫기 + emit이 권위 있는 채널이며, 단순 위임의 `@textFieldInput`은 raw 키워드 + requestedAt이 빠지므로 본 변형에서는 의도적으로 생략(masking 결정 답습).

### 자체 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@autoCompleteRequested` | input 디바운스 만료(200ms) | `{ keyword, requestedAt: ISO string }` (페이지가 외부 API 호출 트리거로 사용) |
| `@autoCompleteSelected` | dropdown 항목 click 또는 active 항목 Enter | `{ value, item }` (`value`는 input에 채워진 최종 텍스트, `item`은 후보 객체 전체) |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderSuggestions({ response })` | `({response}) => void` | `suggestedValues` 토픽 핸들러. 객체(`{keyword, items}`) / 배열(`[]`) 양쪽 형태 정규화. items를 `_suggestions`에 저장 + dropdown DOM 재렌더 + `_focusIndex = (length>0 ? 0 : -1)` + `is-open` 토글. 빈 input / 빈 배열은 dropdown 닫음. emit 없음. |
| `_handleInput(e)` | `(InputEvent) => void` | input element `input` 이벤트. 빈 값 → 즉시 dropdown 닫음 + 디바운스 취소. 비어있지 않으면 `clearTimeout` 후 setTimeout(200ms) 재설정 → 만료 시 `@autoCompleteRequested({keyword, requestedAt})` 1회 emit + `_lastKeyword` 갱신. |
| `_handleKeydown(e)` | `(KeyboardEvent) => void` | input element `keydown`. ArrowDown/Up: `_focusIndex` 순환 + `_syncActiveVisual()`. Enter: active 항목 `_selectSuggestion`. Escape: dropdown 닫기 + `_focusIndex = -1`. dropdown이 열려있지 않거나 후보가 없으면 silent return. |
| `_handleBlur(e)` | `(FocusEvent) => void` | input element `blur`. dropdown 닫음 + `_focusIndex = -1`. 단, dropdown 항목 mousedown에서 `event.preventDefault()`로 blur를 차단해 클릭이 정상 처리되도록 한다. |
| `_handleDropdownEvent(e)` | `(MouseEvent) => void` | dropdown 영역 click + mouseover delegator. click → 항목 매칭 시 `_selectSuggestion`, mouseover → `_focusIndex` 갱신 + `_syncActiveVisual()`. |
| `_handleDropdownMousedown(e)` | `(MouseEvent) => void` | dropdown 영역 mousedown delegator. 항목 매칭 시 `event.preventDefault()`로 input blur 차단. |
| `_syncActiveVisual()` | `() => void` | `_focusIndex` 변경 시 모든 dropdown 항목 순회하며 `is-active` 클래스 토글. |
| `_selectSuggestion(item)` | `(item) => void` | 후보 선택 — input.value = item.value(또는 item.label fallback) + dropdown 닫음 + `_focusIndex = -1` + `@autoCompleteSelected({value, item})` emit + 진행 중 디바운스 취소. |

### 페이지 연결 사례

```
[페이지 — 회원가입 회사명 / 결제 도시 / 운영 콘솔 호스트명 / 이메일 도메인 자동완성]
    │
    ├─ fetchAndPublish('textField', this) 또는 직접 publish
    │     payload 예: {
    │         label: 'Country', required: 'true', value: '', placeholder: 'Type to search countries...',
    │         leadingIcon: '🌐', trailingIcon: '✕',
    │         supporting: 'We will use this for shipping calculation.',
    │         errorText: '', state: 'enabled'
    │     }
    │
    └─ '@autoCompleteRequested' 수신 → 외부 API 호출 → 'suggestedValues' publish
          payload 예: {
            keyword: 'kor',
            items: [
              { value: 'Korea',       label: 'Korea, Republic of', sublabel: 'KR · Asia' },
              { value: 'Korean Air',  label: 'Korean Air',         sublabel: 'Airline · KE' },
              { value: 'North Korea', label: 'Korea, DPR',         sublabel: 'KP · Asia' }
            ]
          }

[TextFields/Advanced/autoComplete]
    ├─ FieldRender가 textField 데이터 매핑
    ├─ 사용자 'kor' 입력 → 200ms debounce → @autoCompleteRequested({keyword:'kor', requestedAt}) 1회 emit
    ├─ 페이지가 fetch 후 suggestedValues publish → _renderSuggestions 갱신
    ├─ dropdown 열림(_suggestions = 3개, _focusIndex = 0)
    ├─ ArrowDown/Up으로 _focusIndex 순환 → is-active 시각 동기화
    └─ Enter / 클릭 → _selectSuggestion → input.value = 'Korea'
                      → @autoCompleteSelected({value: 'Korea', item: {...}})

[× trailing 클릭]
    └──@textFieldTrailingClicked──▶ [페이지]
            (페이지가 textField 재발행으로 value='' 클리어 결정)

[blur/Enter]
    └──@textFieldChanged──▶ [페이지] (Standard 호환 — 폼 검증/저장)

운영: this.pageDataMappings = [
        { topic: 'textField',       datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'suggestedValues', datasetInfo: {...}, refreshInterval: 0 }   // @autoCompleteRequested 수신 후 publish
      ];
      Wkit.onEventBusHandlers({
        '@autoCompleteRequested':    ({ keyword, requestedAt }) => { /* 외부 API 호출 후 suggestedValues publish */ },
        '@autoCompleteSelected':     ({ value, item })          => { /* 폼 저장 / navigate */ },
        '@textFieldChanged':         (e)                        => { /* blur/Enter 시 폼 저장 */ },
        '@textFieldTrailingClicked': ()                         => { /* clear → textField 재발행 */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|-------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 + 그라디언트 깊이 + Pretendard 400-500 + 8px 모서리 + dropdown 그라디언트 + active 시안 강조 + box-shadow 금지. | **회원가입 — 회사명 자동완성** (이미 등록된 회사 추천 — Renobit, Notion, Supabase 등) |
| `02_material`    | B: Material Elevated | 라이트 + Roboto + MD3 Outlined floating label + 4px 모서리 + dropdown elevation 카드 + Material list ripple hover. | **결제 폼 — 국가/도시 자동완성** (배송지 국가 추천 — Korea, Japan, United States, etc.) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 + DM Serif 라벨 + IBM Plex Mono 입력 + 바닥줄(border-bottom) + 2px 모서리 + dropdown 미니멀 hairline + 정적 모션 + 세리프 sublabel 이탤릭. | **블로그 작성 — 태그 자동완성** (이미 사용된 태그 풀 — design, typography, editorial 등 — 매거진 카탈로그 패턴) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 쿨 톤 + IBM Plex Mono 입력/Sans + UPPERCASE 라벨 소형 + 2px 모서리 + 시안 미세 테두리 + dropdown 모노스페이스 list + active 시안 배경. | **운영 콘솔 — 호스트명/메트릭 키 자동완성** (`web-prd-01`, `web-prd-02` 호스트명 / `cpu.usage`, `mem.rss` 메트릭 키 추천) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따른다. 4~6개 추천 풀(value 길이 다양 + sublabel 일부)로 자동완성 + 키보드 navigation을 한 변형 안에서 시연한다. preview는 mock fetch(setTimeout 200ms)로 페이지 fetch 흐름을 시뮬레이션.

### 결정사항

- **두 template 분리 (의도적)**: dropdown suggestion template(`#textfields-ac-suggestion-template`)은 자체 메서드(`_renderSuggestions`)가 cloneNode. ListRenderMixin을 두 번째 Mixin으로 적용하지 않음 — Mixin 인스턴스 네임스페이스 충돌 회피 + 외부 fetch 결과를 그대로 표시하는 단순 패턴이라 자체 메서드로 충분 (Search/Advanced/autoComplete + tagAutoComplete 결정 답습).
- **debounce 200ms**: 폼 입력으로 사용자가 빠른 응답 기대 → Search의 250ms보다 짧게. tagAutoComplete의 150ms는 칩 누적이 빈번한 상황 — TextField는 단일 선택이므로 중간값. 외부 라이브러리 도입 금지(setTimeout/clearTimeout만).
- **외부 fetch 위임 (`@autoCompleteRequested`)**: 컴포넌트는 직접 fetch 하지 않는다. 페이지가 이 이벤트를 받아 외부 API 호출 후 `suggestedValues`로 publish — 컴포넌트 책임 분리(컴포넌트는 출처를 모른다 원칙).
- **suggestedValues 페이로드 dual 형태 지원**: `{keyword, items: [...]}` 객체 형태 + `[{value,label?,sublabel?}]` 배열 형태 양쪽 정규화. 큐 명세에서는 단순 토픽 이름만 있고 페이로드 형태는 자유 — 페이지가 keyword 컨텍스트를 함께 보낼 수 있도록 객체 형태도 지원하되, 단순 배열로도 작동(Search/autoComplete의 `autocompleteSource`는 배열만 — 본 변형은 더 유연한 입력 허용).
- **Standard 호환 채널 유지 (`@textFieldChanged` + `@textFieldTrailingClicked`)**: 페이지가 Standard에서 autoComplete으로 마이그레이션할 때 핸들러를 그대로 재사용 가능. `@textFieldInput`은 의도적 미발행(중복 채널 방지 — `@autoCompleteRequested`가 권위 있는 디바운스 채널).
- **focus out 시 dropdown 닫음 + mousedown preventDefault**: blur로 인해 dropdown이 클릭 처리 전에 닫혀 click이 무효화되는 것을 방지하기 위해 dropdown 항목 mousedown에서 `event.preventDefault()`를 호출 — input blur 차단. blur 핸들러는 그 외 모든 외부 클릭에서 dropdown을 닫는다.
- **클라이언트 필터링 없음**: 페이지가 keyword와 함께 fetch 후 결과 정렬·자른 상태로 push한다고 가정 — `suggestedValues`로 publish된 후보를 그대로 dropdown에 표시한다. (정렬·자르기·하이라이트는 페이지 책임 또는 서버 책임 — 컴포넌트는 표시만).
- **선택 시 input.value = item.value (label fallback)**: dropdown 선택 시 input에 `value`(없으면 `label`)를 채운다. 폼 제출 시 사용할 정식 값 우선. `@autoCompleteSelected`에 `item` 전체 동봉으로 페이지가 추가 메타(id, sublabel 등)를 자유롭게 활용 가능.
- **dropdown 위치**: input 바로 아래 absolute 배치(컨테이너 `position: relative` 기준). overflow visible 필요 — dropdown이 컨테이너 바깥으로 펼쳐질 수 있어야 하므로 컨테이너는 자체적으로 overflow 자르지 않는다.
- **clear 버튼 — trailing 아이콘으로 통일**: Search/autoComplete은 별도 `.search-ac__clear` 버튼이 있지만 TextField는 trailing 아이콘으로 통일 (Standard 호환). `@textFieldTrailingClicked`를 받아 페이지가 clear 결정.
- **신규 Mixin 생성 금지**: FieldRenderMixin + 자체 메서드로 완결. autocomplete 패턴이 Search/autoComplete + Chips/tagAutoComplete + TextFields/autoComplete 3종으로 누적 — 향후 `AutoCompleteMixin` 일반화 검토 후보(SKILL 회귀 규율, 본 사이클은 메모만).
