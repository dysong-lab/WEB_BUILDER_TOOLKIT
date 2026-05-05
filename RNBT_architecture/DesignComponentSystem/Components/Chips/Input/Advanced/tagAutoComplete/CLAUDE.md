# Input — Advanced / tagAutoComplete

## 기능 정의

1. **태그 칩 항목 렌더링** — `inputChipItems` 토픽으로 수신한 태그 배열(`[{chipid, label}]`)을 ListRenderMixin이 `<template>` cloneNode로 렌더한다. 입력 영역(`<input>`)과 동일 컨테이너에 공존한다. Standard와 동일한 토픽을 재사용하여 외부 호환성 유지(`@inputChipClicked`/`@inputChipRemoved` 칩 이벤트 채널 동일).
2. **입력 텍스트 + 자동완성 dropdown** — 입력 `<input>` 요소에 텍스트가 들어오면 외부에서 publish된 `suggestedTags` 풀(`[{id, label}]`)을 client-side로 필터링(대소문자 무관 부분 일치) 후 dropdown으로 표시한다. 이미 추가된 칩 ID는 dropdown에서 제외한다. Empty 입력 시 dropdown은 숨겨진다.
3. **입력 변경 시 외부 디바운스 emit** — 입력값이 바뀔 때마다 자체 setTimeout 디바운스(150ms) 후 `@tagInputChanged` 발행. payload: `{ value: string }`. 서버사이드 추천 갱신 등에 사용 — 클라이언트 필터와 분리된 외부 트리거 채널.
4. **dropdown 키보드 + 마우스 navigation** — `ArrowDown`/`ArrowUp`로 dropdown 항목 사이 이동(active 인덱스 갱신), `Enter`로 active 항목 선택, `Escape`로 dropdown 닫기. mouseover로도 active 인덱스 동기화. 선택된 항목은 칩으로 즉시 추가(`_addTag`) + dropdown 닫힘 + 입력 클리어. 발행: `@tagSuggestionSelected` (payload: `{ id, label }`) + `@tagAdded` (payload: `{ targetInstance, chipid, label, source: 'suggestion' }`).
5. **칩 삭제 → 즉시 DOM detach + 발행** — 칩의 remove 버튼(`removeBtn`) 클릭 시 해당 칩을 DOM에서 분리하고 자체 상태(`_tags: Map<chipid, label>`)에서 제거 + `@tagRemoved` 발행 (payload: `{ targetInstance, chipid, label, remainingTagIds }`). 본체 클릭은 `@inputChipClicked` 위임 발행. removable 변형과 동일한 두 영역 분기 native delegator + 명시 payload 패턴.
6. **외부 강제 갱신 토픽 `setInputChipItems`** — 외부에서 칩 set을 통째로 교체(예: 서버 동기화 후 권위 있는 태그 set으로 갱신). 페이로드: `[{chipid, label}]`. 기존 inputChipItems와 의미 동일하나 정책상 분리 — `inputChipItems`는 페이지가 source-of-truth로 사용, `setInputChipItems`는 다른 컴포넌트/외부 시스템이 강제 갱신할 때 명시적으로 사용.

> **Standard와의 분리 정당성 (5축)**: Standard는 ① 토픽 `inputChipItems` 단일 + 칩 본체/삭제 이벤트만, ② 자동완성/dropdown/입력 영역 자체가 없음 — HTML이 `<div class="input-chip">` 만, ③ 자체 상태 없음(ListRender만), ④ 이벤트 `@inputChipClicked`/`@inputChipRemoved` 단순 위임, ⑤ 키보드/디바운스/필터링/dropdown navigation 정책 모두 없음. tagAutoComplete은 ① 새 토픽 `suggestedTags`/`setInputChipItems` 추가 + 추천 풀 구독, ② 새 영역 추가 — `<input>` + dropdown panel + `<template id="tag-suggestion-item-template">` 두 번째 template, ③ 자체 상태 4종(`_tags: Map<chipid, label>`, `_suggestionPool: [{id,label}]`, `_filtered: [{id,label}]`, `_activeIndex: number`, `_inputDebounceId`, `_inputHandler`/`_keydownHandler`/`_clickHandler`/`_dropdownHandler` bound refs), ④ 새 이벤트 4종 — `@tagInputChanged`(디바운스), `@tagSuggestionSelected`(드롭다운 선택), `@tagAdded`/`@tagRemoved`(라이프사이클), ⑤ 입력 + 디바운스 + 클라이언트 필터 + dropdown + 키보드 navigation + 중복 차단 + 즉시 detach 정책 모두 흡수 — 같은 register.js로 표현 불가. 페이지가 매번 input 요소·디바운스·필터·dropdown DOM·ArrowDown/Up 핸들링·중복 차단·detach·remainingIds 보일러를 재구현하지 않도록 컴포넌트가 흡수.

> **유사 변형과의 비교**: Filter/Advanced/removable이 "× 버튼 + 즉시 제거 + remove 이벤트"를 자체 메서드로 흡수했다면, tagAutoComplete은 거기에 "입력 영역 + 외부 추천 풀 + 디바운스 + 클라이언트 필터 + 키보드 dropdown navigation + 중복 차단"을 추가로 흡수한다. multiSelectGroup이 그룹/선택 정책을 자체 Map으로 흡수한 것처럼 tagAutoComplete은 추천 풀 + 활성 인덱스를 자체 상태로 흡수.

> **MD3 / 도메인 근거**: MD3 Input Chips 명세는 "이메일 주소나 검색어 등 사용자가 입력한 정보의 토큰화"를 다루지만, 실제 운영에서는 "자동완성 제안 + 키보드 navigation + 중복 차단" 패턴이 거의 항상 동반된다(Gmail 수신자 입력, Slack 채널 멘션, GitHub 라벨/태그 입력, Stack Overflow 태그 입력). Standard의 단순 토큰 표시는 페이지가 dropdown UI · 디바운스 · 키보드 핸들링 · 중복 검사 보일러를 매번 재구현해야 하므로 본 변형이 그 정책을 컴포넌트로 정식화한다.

---

## 구현 명세

### Mixin

ListRenderMixin (`itemKey: 'chipid'`) + 자체 메서드 8종 + 자체 상태 6종.

> Standard와 동일하게 ListRenderMixin을 사용하지만, **칩 항목 렌더에만** 사용한다(template `#tag-autocomplete-chip-template`). dropdown 항목은 별도의 두 번째 template(`#tag-autocomplete-suggestion-template`)을 자체 메서드로 cloneNode + textContent 채움 — Mixin 두 번 적용은 인스턴스 네임스페이스 충돌이 일어나므로 dropdown은 자체 메서드로 처리. 신규 Mixin 생성 금지 규칙을 준수.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container        | `.tag-autocomplete__chip-list`            | 칩이 추가될 부모 (ListRenderMixin 규약) |
| template         | `#tag-autocomplete-chip-template`         | 칩 cloneNode 대상 (ListRenderMixin 규약) |
| chipid           | `.tag-autocomplete__chip`                 | 칩 항목 식별 + 본체 클릭 위임 (data-chipid) |
| label            | `.tag-autocomplete__chip-label`           | 칩 라벨 텍스트 |
| removeBtn        | `.tag-autocomplete__chip-remove`          | 칩 × 버튼 — click delegator 분기 영역 |
| input            | `.tag-autocomplete__input`                | 사용자 입력 `<input>` 요소 (이벤트 영역, 데이터 바인딩 X) |
| dropdown         | `.tag-autocomplete__dropdown`             | dropdown 패널 컨테이너 (open 클래스로 표시 토글) |
| dropdownList     | `.tag-autocomplete__dropdown-list`        | dropdown 항목이 추가될 부모 |
| suggestionTpl    | `#tag-autocomplete-suggestion-template`   | dropdown 항목 cloneNode 대상 (자체 메서드 사용) |
| suggestionItem   | `.tag-autocomplete__suggestion`           | dropdown 항목 (data-suggestion-id, click 영역) |
| suggestionLabel  | `.tag-autocomplete__suggestion-label`     | dropdown 항목 라벨 텍스트 |

> **이벤트/UI 영역 KEY**: `input`/`dropdown`/`dropdownList`/`suggestionTpl`/`suggestionItem`/`suggestionLabel`은 ListRenderMixin이 직접 사용하지 않는 영역이지만(데이터 바인딩 X), customEvents 매핑 + 자체 메서드의 querySelector 진입점으로 등록한다. dropdown open 상태는 `.tag-autocomplete__dropdown.is-open` 클래스로 표현.

### itemKey

chipid

### datasetAttrs

| KEY | data-* |
|-----|--------|
| chipid | `chipid` |

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_tags` | `Map<chipid, label>`. 현재 칩 set의 진실 소스. `_renderItems`/`_addTag`/`_removeTag` 변경. dropdown 필터에서 "이미 추가된 ID 제외"에 사용. |
| `_suggestionPool` | `Array<{id, label}>`. `suggestedTags` 토픽으로 수신된 외부 추천 풀. 클라이언트 필터의 source. |
| `_filtered` | `Array<{id, label}>`. 현재 입력값으로 필터링된 추천 항목. dropdown DOM의 진실 소스. |
| `_activeIndex` | dropdown active 항목의 인덱스 (-1: 없음). ArrowDown/Up/mouseover로 갱신. |
| `_inputDebounceId` | setTimeout 핸들. `_handleInput`에서 `clearTimeout` 후 재설정. beforeDestroy에서 clear. |
| `_inputHandler` / `_keydownHandler` / `_clickHandler` / `_dropdownHandler` | bound handler refs — beforeDestroy에서 정확히 removeEventListener. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|--------|
| `inputChipItems` | `this._renderItems` | `[{chipid, label}]` — 초기/페이지 source-of-truth 갱신 |
| `setInputChipItems` | `this._renderItems` | `[{chipid, label}]` — 외부 강제 갱신 (동일 핸들러) |
| `suggestedTags` | `this._setSuggestionPool` | `[{id, label}]` — 외부 추천 풀 갱신 |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `chipid` (cssSelectors) | 칩 본체 영역 클릭 | `@inputChipClicked` (bindEvents 위임 — Weventbus 채널 등록 보장) |

> **추가 native 핸들러** (bindEvents와 분리):
> - 컨테이너 click delegator → × 영역 매칭 시 `_removeTag` (`@inputChipRemoved` + `@tagRemoved` 명시 payload). 본체는 bindEvents가 처리.
> - input element `input` 이벤트 → 디바운스 후 `@tagInputChanged` emit + 즉시 클라이언트 필터 갱신 + dropdown 표시.
> - input element `keydown` → ArrowDown/Up/Enter/Escape 분기.
> - dropdown click delegator → suggestion 매칭 시 `_selectSuggestion` (`@tagSuggestionSelected` + `@tagAdded`).
> - dropdown mouseover → suggestion 매칭 시 `_activeIndex` 갱신.

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderItems({ response })` | `inputChipItems`/`setInputChipItems` 핸들러. 배열을 ListRender selectorKEY에 매핑하여 `listRender.renderData` 호출 + `_tags` Map 새 batch 교체 + dropdown 필터 재계산. |
| `_setSuggestionPool({ response })` | `suggestedTags` 핸들러. 외부 풀을 `_suggestionPool`에 저장 + 현재 입력값 기준 dropdown 재필터. |
| `_handleInput(e)` | input element `input` 이벤트. 클라이언트 필터 즉시 갱신 + dropdown 렌더 + open. setTimeout 디바운스(150ms) 후 `@tagInputChanged` emit. |
| `_handleKeydown(e)` | input element `keydown`. ArrowDown/Up: `_activeIndex` 이동 + 시각 동기화. Enter: active 항목 `_selectSuggestion` 호출. Escape: dropdown 닫기. |
| `_handleClick(e)` | 컨테이너 click delegator. removeBtn 매칭 시 `_removeTag` 호출 + `@inputChipRemoved`/`@tagRemoved` emit. |
| `_handleDropdownEvent(e)` | dropdown click + mouseover delegator. click → `_selectSuggestion`, mouseover → `_activeIndex` 갱신. |
| `_filterAndRender()` | 현재 입력값 + `_suggestionPool` + `_tags`(중복 차단)로 `_filtered` 재계산 + dropdown DOM 재렌더 + `_activeIndex` 0 또는 -1 초기화 + open/close 토글. |
| `_addTag(item, source)` | 칩 추가(중복 체크) — template cloneNode + textContent + dataset 채움 + container append + `_tags` Map 추가 + dropdown 닫기 + input 클리어 + `@tagAdded` emit. |
| `_removeTag(chipid)` | 칩 제거 — DOM detach + `_tags` Map delete + `@inputChipRemoved`(Standard 호환)/`@tagRemoved` 두 채널 emit + dropdown 재필터(이미 추가된 ID 제외 정책 동기화). |
| `_selectSuggestion(id)` | dropdown에서 항목 선택 — `_filtered`에서 매칭 → `_addTag(item, 'suggestion')` + `@tagSuggestionSelected` emit. |
| `_extractRemainingIds()` | `_tags` Map의 keys 배열 반환. `@tagRemoved` payload의 `remainingTagIds` 산출. |

### 페이지 연결 사례

```
[페이지 — 이메일 수신자 입력 / 기술 스택 태그 입력 / GitHub 라벨 추가]
    │
    ├─ fetchAndPublish('inputChipItems', this) 또는 직접 publish
    │     payload 예: [{ chipid: 'react', label: 'React' }, { chipid: 'vue', label: 'Vue.js' }]
    │
    └─ fetchAndPublish('suggestedTags', this) 또는 직접 publish (서버 추천 풀)
          payload 예: [
            { id: 'react',   label: 'React' },
            { id: 'angular', label: 'Angular' },
            { id: 'svelte',  label: 'Svelte' },
            { id: 'solid',   label: 'Solid.js' },
            ...
          ]

[Chips/Input/Advanced/tagAutoComplete]
    ├─ ListRender가 칩 N개 cloneNode를 chip-list에 append
    ├─ _tags: Map { 'react' → 'React', 'vue' → 'Vue.js' }
    ├─ _suggestionPool: [{id, label}, ...]
    └─ <input> + dropdown(.is-open 토글) 영역 활성

[입력 텍스트 "ang" 입력]
    ├─ 즉시 _filtered 계산 (label 부분일치 + _tags ID 제외) → ['Angular']
    ├─ dropdown 렌더 + .is-open 추가 + _activeIndex = 0
    └─ 150ms 디바운스 → @tagInputChanged emit { value: 'ang' }

[ArrowDown → Enter (또는 클릭)]
    ├─ @tagSuggestionSelected emit { id: 'angular', label: 'Angular' }
    ├─ _addTag → 칩 추가 + _tags Map.set + input 클리어
    ├─ @tagAdded emit { targetInstance, chipid: 'angular', label: 'Angular', source: 'suggestion' }
    └─ dropdown 닫힘

[× 클릭 — 'react' 제거]
    └──@inputChipRemoved (Standard 호환) + @tagRemoved 명시 payload──▶ [페이지]
            payload(@tagRemoved): {
              targetInstance, chipid: 'react', label: 'React',
              remainingTagIds: ['vue', 'angular']
            }

운영: this.pageDataMappings = [
        { topic: 'inputChipItems',     datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'suggestedTags',      datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setInputChipItems',  datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@tagInputChanged':       ({ value }) => { /* 서버 추천 갱신 */ },
        '@tagSuggestionSelected': ({ id, label }) => { /* 분석 로깅 */ },
        '@tagAdded':              ({ chipid, label }) => { /* 백엔드 sync */ },
        '@tagRemoved':            ({ chipid, remainingTagIds }) => { /* 백엔드 sync */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|-------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 베이스 + 그라디언트 fill 칩 + Pretendard + dropdown 그라디언트 깊이 + active 항목 시안 강조. | 기술 스택 태그 입력 (개발자 프로파일 / 프로젝트 태그) — React/Vue 등 추천 |
| `02_material`    | B: Material Elevated | 라이트 그레이 베이스 + tonal `#E3F2FD` filled 칩 + Roboto + dropdown elevation shadow + Material list ripple hover. | 이메일 수신자 자동완성 (Gmail 스타일) — 주소록 추천 |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 + 1px outline 칩 + Georgia serif 라벨 + dropdown 미니멀 hairline 보더 + active 항목 inverted 강조. | 매거진 카테고리 태그 입력 (편집자 도구) — 분류 태그 추천 |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 + 시안 stripe 좌측 + JetBrains Mono uppercase + dropdown 모노스페이스 list + active 항목 시안 배경. | 검색 필터 자동완성 (운영 콘솔 — 호스트명 / 메트릭 키 자동완성) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따른다. 4~6개 추천 풀(label 길이 다양) + 2~3개 초기 칩으로 자동완성 + 키보드 navigation + 칩 제거를 한 변형 안에서 시연한다.

### 결정사항

- **두 template 분리**: 칩 template(`#tag-autocomplete-chip-template`)은 ListRenderMixin이 사용, dropdown suggestion template(`#tag-autocomplete-suggestion-template`)은 자체 메서드(`_filterAndRender`)가 cloneNode. Mixin 두 번 적용 회피.
- **이벤트 채널 이중화 (`@inputChipRemoved` + `@tagRemoved`)**: Standard와의 외부 호환성 유지를 위해 `@inputChipRemoved`도 함께 발행(Standard 페이지가 그대로 동작). `@tagRemoved`는 `remainingTagIds`를 포함한 명시 payload로, tagAutoComplete 전용 페이지 핸들러용.
- **디바운스 자체 구현**: setTimeout/clearTimeout 사용. 외부 라이브러리 도입 금지. 150ms 고정 — 한국어/영어 입력 모두 자연스러운 체감 타이밍.
- **클라이언트 필터 + 외부 emit 분리**: `@tagInputChanged` 디바운스 emit은 서버 추천 갱신용(외부 트리거). 클라이언트 필터는 즉시 갱신(드롭다운 반응성). 두 채널 완전 분리.
- **이미 추가된 칩은 dropdown에서 제외**: `_filterAndRender`에서 `_tags.has(item.id)` 체크로 차단. 동일 ID 칩 중복 추가 방지(중복 시 `_addTag`도 silent skip).
- **키보드 navigation**: ArrowDown/Up은 `_filtered` 인덱스 순환(0..length-1). Enter는 active 항목 선택. Escape는 dropdown 닫기 + `_activeIndex = -1`. mouseover는 시각 동기화.
- **dropdown 위치**: input 바로 아래 absolute 배치(컨테이너 relative 기준). overflow visible 필요 — chip-list 컨테이너는 자체적으로 overflow 자르지 않는다.
- **ID 정책**: 칩의 식별자는 `chipid`(Standard와 동일), 추천의 식별자는 `id`. dropdown 선택 시 `_addTag({chipid: item.id, label: item.label}, 'suggestion')`로 통일된 키로 변환.
