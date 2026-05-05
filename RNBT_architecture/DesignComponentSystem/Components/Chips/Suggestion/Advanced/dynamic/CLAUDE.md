# Suggestion — Advanced / dynamic

## 기능 정의

1. **외부 컨텍스트 기반 동적 추천 갱신** — `suggestionSource` 토픽으로 외부에서 제공하는 추천 후보 풀 + 컨텍스트를 수신하여 칩 목록을 갱신한다. 페이로드: `{ context: string, suggestions: [{chipid, label, icon?, score?}] }`. score가 제공되면 내림차순 정렬, 없으면 입력 순서 유지. 컨테이너의 상태 class를 `is-loading` / `is-empty` / 정상 3가지로 분기 — 유효한 items가 1개 이상이면 정상, 0개면 `is-empty`, 외부 갱신을 기다리는 중이면 `is-loading`.

2. **컨텍스트 변경 트리거 — 외부 재요청 위임** — `setSuggestionContext` 토픽(payload: `{ context: string }`)을 수신하면 내부 `_currentContext`를 갱신하고 컨테이너를 `is-loading` 상태로 전환한 후 `@suggestionRefresh` (payload: `{ context, requestedAt: ISO }`)를 emit하여 외부 페이지/시스템에 새 추천 fetch를 위임한다. 컴포넌트는 외부 API를 직접 호출하지 않는다 — 페이지가 이 이벤트를 받아 새 데이터를 fetch한 뒤 `suggestionSource`로 publish하면 다시 정상 상태로 진입.

3. **재요청 명시 트리거** — `triggerSuggestionRefresh` 토픽(payload 없음 또는 `{}`)을 수신하면 동일 컨텍스트로 `@suggestionRefresh`를 다시 emit한다. 컨텍스트가 변경되지 않은 채 새로고침이 필요한 케이스(예: 사용자 "다시 추천" 버튼, 만료 후 갱신).

4. **칩 클릭 — 컨텍스트 동봉 명시 이벤트** — 칩 클릭 시 `@suggestionSelected` (payload: `{ chipid, label, context }`) emit. Standard의 `@suggestionChipClicked`(chipid 단독)와 달리 현재 컨텍스트를 동봉하여 페이지의 분석/라우팅을 단순화. Standard 호환 채널은 의도적으로 발행하지 않는다 — Advanced는 dynamic 시나리오에서 명시 채널만 사용한다는 정책(외부 호환은 페이지가 이벤트 리스너로 변환).

5. **컨텍스트 변경 알림 — 선택적 외부 분석용** — 컨텍스트가 실제로 변경됐을 때(이전 값과 다를 때) `@suggestionContextChanged` (payload: `{ from, to }`)를 emit. 외부 analytics/로깅용. 동일 컨텍스트로 `setSuggestionContext`가 발행되면 silent.

> **Standard와의 분리 정당성 (5축)**: ① **새 토픽 3종 추가** — `suggestionSource`(items + context 묶음), `setSuggestionContext`(컨텍스트 단독), `triggerSuggestionRefresh`(명시 재요청). Standard는 단일 토픽 `suggestionChipItems`(items만)으로 갱신을 표현 못 함. ② **상태 머신 도입** — `is-loading` / `is-empty` / 정상 3-state CSS class 분기. Standard는 단순 list render만. ③ **자체 상태 4종** — `_currentContext`(현재 컨텍스트 string), `_lastItems`(items 캐시 — context-only 갱신 시 재 render 회피), `_isLoading`(boolean), `_emptyEl`(컨테이너 내부 빈/로딩 placeholder ref 캐시). Standard는 자체 상태 0개. ④ **새 이벤트 3종** — `@suggestionRefresh`(외부 fetch 위임), `@suggestionSelected`(컨텍스트 동봉 클릭), `@suggestionContextChanged`(분석용). Standard는 `@suggestionChipClicked` 단독. ⑤ **비동기 갱신 의미 차이** — Standard는 페이지가 단순 publish, dynamic은 컴포넌트가 `@suggestionRefresh`를 emit하여 페이지에 fetch를 *요청*하는 양방향 흐름. 같은 register.js로 표현 불가.

> **MD3 / 도메인 근거**: MD3 Suggestion Chip 명세는 *"dynamically generated suggestions"*가 핵심으로, 검색 입력 변화·시간대·사용자 활동 등 외부 컨텍스트에 반응하는 시나리오를 직접 호명한다. 운영 사례: Google 검색의 query-as-you-type 추천, IDE의 컨텍스트 인지 자동완성, 챗봇의 다음 질문 추천, 위치 기반 액션 추천 등. Standard는 정적 publish만 가능 — 페이지가 매번 컨텍스트 추적·loading 상태·재요청 트리거 보일러를 재구현해야 한다. dynamic이 그 정책을 컴포넌트로 정식화한다.

> **유사 변형과의 비교**: 직전 `pasteMultiple`이 "다건 paste split + 토큰 검증 + 일괄 추가"를 흡수했다면, dynamic은 paste/입력 경로가 아닌 **외부 컨텍스트 → 추천 갱신 → 재요청 위임**의 양방향 흐름을 흡수. tagAutoComplete가 input 키 입력 + 디바운스 + 클라이언트 필터를 흡수한 것과 결이 다름 — dynamic은 컨텍스트 자체가 외부에서 주입되며 컴포넌트는 *어떤* 추천을 보일지를 정하지 않고 *언제 외부에 새 추천을 요청하는지*만 정한다.

---

## 구현 명세

### Mixin

ListRenderMixin (`itemKey: 'chipid'`) + 자체 메서드 7종 + 자체 상태 4종.

> Standard와 동일하게 ListRenderMixin을 사용한다(아이콘 + 라벨 칩 항목 렌더링). loading/empty 상태 분기·컨텍스트 추적·재요청 emit은 모두 자체 메서드 — 신규 Mixin 생성 금지 규칙 준수.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.dynamic-suggestion-chip__list`         | 칩이 추가될 부모 (ListRenderMixin 규약) |
| template  | `#dynamic-suggestion-chip-item-template` | 칩 cloneNode 대상 (ListRenderMixin 규약) |
| chipid    | `.dynamic-suggestion-chip__item`         | 칩 항목 식별 + 본체 클릭 위임 (data-chipid) |
| icon      | `.dynamic-suggestion-chip__icon`         | 선행 아이콘 텍스트 (icon 비어있으면 CSS `:empty`로 숨김) |
| label     | `.dynamic-suggestion-chip__label`        | 칩 라벨 텍스트 |
| stateRoot | `.dynamic-suggestion-chip`               | `.is-loading` / `.is-empty` 상태 class 부착 루트 |
| emptyMsg  | `.dynamic-suggestion-chip__empty`        | 빈 상태 안내 텍스트 영역 (loading/empty 모두 표시 가능) |

> **상태 KEY**: `stateRoot`/`emptyMsg`는 ListRenderMixin이 직접 사용하지 않지만 자체 메서드의 querySelector 진입점으로 등록한다.

### itemKey

chipid

### datasetAttrs

| KEY | data-* |
|-----|--------|
| chipid | `chipid` |

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_currentContext` | string | 현재 컨텍스트(검색어/키워드/화면 모드 등). 초기값 `''`. `setSuggestionContext`/`suggestionSource`가 갱신. |
| `_lastItems` | `Array<{chipid,label,icon?}>` | 마지막 렌더된 items 캐시. 정상 상태 복귀 시 재 render 정합성 확인용. |
| `_isLoading` | boolean | 현재 loading 상태 여부. true 동안에는 `.is-loading` class + emptyMsg 텍스트로 안내. |
| `_emptyMsgText` | string | empty 상태와 loading 상태에서 표시할 텍스트 옵션 슬롯 — 기본 한국어("추천 항목이 없습니다." / "추천을 불러오는 중..."). 외부에서 `instance._emptyMsgText = {empty:'No suggestions', loading:'Loading...'}`로 주입 가능. |

### 구독 (subscriptions)

| topic | handler | 페이로드 | 의미 |
|-------|---------|---------|------|
| `suggestionSource`         | `this._applySource`         | `{ context, suggestions: [{chipid,label,icon?,score?}] }` | 컨텍스트 + 새 추천 풀 일괄 갱신 |
| `setSuggestionContext`     | `this._setContext`          | `{ context }` | 컨텍스트만 변경 → loading 진입 + `@suggestionRefresh` emit |
| `triggerSuggestionRefresh` | `this._triggerRefresh`      | `{}` 또는 `null` | 동일 컨텍스트로 `@suggestionRefresh` 재 emit |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `chipid` (cssSelectors) | 칩 본체 클릭 | (bindEvents 위임 — 그러나 실제 emit은 자체 click delegator에서 컨텍스트 동봉으로 발행) |

> **추가 native 핸들러**:
> - 컨테이너 click delegator → chip 본체 매칭 시 `_handleChipClick` (`@suggestionSelected` 발행 — chipid + label + context 동봉).
> - bindEvents의 `@suggestionChipClicked`는 의도적으로 등록하지 않음 — Advanced/dynamic은 명시 채널만 사용. customEvents 객체는 비워두고 (`{}`) 일관성을 유지.

### 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|-----------|---------|
| `@suggestionRefresh`        | `setSuggestionContext` 또는 `triggerSuggestionRefresh` 수신 시 | `{ targetInstance, context, requestedAt: ISO }` |
| `@suggestionSelected`       | 칩 본체 클릭 | `{ targetInstance, chipid, label, context }` |
| `@suggestionContextChanged` | 컨텍스트가 실제 변경됐을 때 (`from !== to`) | `{ targetInstance, from, to }` |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_applySource({ response })` | `suggestionSource` 핸들러. `{context, suggestions}`을 받아 컨텍스트 갱신(다르면 `@suggestionContextChanged`) + items render + loading/empty 상태 갱신. score 내림차순 정렬(있을 때만). |
| `_setContext({ response })` | `setSuggestionContext` 핸들러. `{context}` 수신 → `_currentContext` 갱신(다르면 `@suggestionContextChanged`) → loading 진입 → `@suggestionRefresh` emit. |
| `_triggerRefresh()` | `triggerSuggestionRefresh` 핸들러. loading 진입 + `@suggestionRefresh` emit (컨텍스트 변경 없음). |
| `_renderItems(items)` | items 배열을 ListRender selector KEY로 매핑하여 `listRender.renderData` 호출 + `_lastItems` 캐시 갱신 + 상태 class 갱신. |
| `_setLoadingState(isLoading)` | stateRoot에 `.is-loading` toggle + emptyMsg 텍스트 갱신. |
| `_updateEmptyState()` | items 길이 + loading 여부로 `.is-empty` toggle + emptyMsg 텍스트 갱신. |
| `_handleChipClick(e)` | 컨테이너 click delegator. chip 본체 매칭 시 `@suggestionSelected` emit. |

### 페이지 연결 사례

```
[페이지 — 검색창 query 입력 변화 / 챗봇 다음 질문 추천 / 위치 기반 액션 추천]
    │
    ├─ 사용자가 검색창에 "weath" 입력
    │     └─ publish('setSuggestionContext', { context: 'weath' })
    │
    └─ [DynamicSuggestion]
          ├─ _setContext: from='' to='weath' → @suggestionContextChanged emit
          ├─ is-loading 진입 (emptyMsg = '추천을 불러오는 중...')
          └─ @suggestionRefresh emit { context:'weath', requestedAt: ISO }

[페이지가 @suggestionRefresh 수신]
    └─ fetch(`/api/suggestions?q=weath`)
        └─ publish('suggestionSource', {
             context: 'weath',
             suggestions: [
               {chipid:'weather-today', label:'Weather today', icon:'☀', score:0.9},
               {chipid:'weather-week', label:'Weekly forecast', icon:'📅', score:0.7}
             ]
          })

[DynamicSuggestion]
    ├─ _applySource → score sort + render 2개 chip
    └─ is-loading 해제 (정상 상태)

[사용자가 'weather-today' chip 클릭]
    └──@suggestionSelected──▶ [페이지]
       payload: { chipid:'weather-today', label:'Weather today', context:'weath' }

[사용자가 "다시 추천" 버튼 클릭]
    └─ publish('triggerSuggestionRefresh', {})
       └─ _triggerRefresh → loading 진입 → @suggestionRefresh emit (동일 context)

운영: this.pageDataMappings = [
        { topic: 'suggestionSource', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@suggestionRefresh':       async ({ context }) => {
            const data = await fetch(`/api/suggestions?q=${context}`).then(r => r.json());
            instance.subscriptions.suggestionSource.forEach(h => h.call(instance, { response: { context, suggestions: data } }));
        },
        '@suggestionSelected':      ({ chipid, context }) => router.push(`/result?q=${context}&pick=${chipid}`),
        '@suggestionContextChanged':({ from, to }) => analytics.track('context_change', {from, to})
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|-------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 + 그라디언트 칩 + Pretendard + loading 시 칩 영역 dim + skeleton placeholder pulse | 검색창 query-as-you-type 추천 (검색 키워드별 동적 갱신) |
| `02_material`    | B: Material Elevated | 라이트 + tonal `#E3F2FD` filled 칩 + Roboto + loading 시 indeterminate progress bar 상단 + elevation drop | 챗봇 인터페이스 — 사용자 메시지 후 다음 질문 추천 |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 + 1px outline 칩 + Georgia serif + loading 시 italic 안내 텍스트 + 점선 placeholder | 매거진 — 현재 글의 키워드 기반 관련 토픽 추천 |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 + 시안 stripe 칩 + JetBrains Mono uppercase + loading 시 dotted 모노 indicator + 모서리 4px | 운영 콘솔 — 현재 호스트/메트릭 컨텍스트 기반 다음 액션 추천 |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따른다. preview의 demo 버튼은 사용자 시나리오를 시연: ① 컨텍스트 A로 setSuggestionContext → loading → 페이지 시뮬 fetch → suggestionSource publish → 정상 상태, ② 컨텍스트 B로 변경 → 다시 loading → ..., ③ triggerRefresh, ④ 빈 결과(empty 상태 시연), ⑤ 외부 강제 push(컨텍스트 A에 대해 새 score).

### 결정사항

- **컴포넌트는 fetch하지 않는다**: 외부 API 호출은 컴포넌트 책임이 아니다. `@suggestionRefresh` emit으로 페이지에 위임 — 컴포넌트는 *언제* 새 추천이 필요한지만 안다. 도메인별 fetch 정책(엔드포인트, 인증, 캐시 정책)이 다양하므로 컴포넌트 내부에 결정하지 않음.
- **Standard `@suggestionChipClicked` 미발행**: Advanced/dynamic은 컨텍스트 동봉이 핵심이므로 단일 명시 채널 `@suggestionSelected`로 통일. Standard 호환이 필요하면 페이지가 listener에서 변환(예: `@suggestionSelected → @suggestionChipClicked`).
- **score 정렬은 옵션**: 모든 suggestions에 score가 있을 때만 정렬. 일부에만 있으면 입력 순서 유지(혼합 정렬은 의외성 유발). score `null`/`undefined`는 정렬 키 없음으로 간주.
- **loading state CSS class**: `is-loading`은 stateRoot(`.dynamic-suggestion-chip`)에 부착 — list 자체가 아닌 컴포넌트 루트. CSS는 칩 영역을 dim 처리하고 emptyMsg를 표시하는 책임. 인라인 style 조작 금지.
- **`_lastItems` 캐시**: items 자체는 `_lastItems`에 그대로 보관. 컨텍스트만 변경되는 시나리오에서 외부가 fetch 실패해도 마지막 상태로 복귀 가능(향후 보강 여지). 현재는 단순 캐시.
- **`_currentContext` 초기값 `''`**: 첫 마운트 시 컨텍스트 미정 상태. `_applySource`/`_setContext`가 첫 컨텍스트를 받으면 `'' (빈 from) → 새 컨텍스트` 전이로 `@suggestionContextChanged` emit (외부 분석에 첫 컨텍스트 진입 시점 기록 가능).
- **컨텍스트 변경 silent 분기**: 동일 컨텍스트로 `setSuggestionContext`가 들어와도 `@suggestionContextChanged`는 미발행, `@suggestionRefresh`는 발행(외부가 명시적으로 재요청). `triggerSuggestionRefresh`도 동일 — 컨텍스트 미변경.
- **`_emptyMsgText` 슬롯**: 다국어/도메인별 메시지 차이를 흡수. 컴포넌트 내부에 하드코딩된 한국어 기본값을 두되, 외부 주입으로 override 가능.
- **빈 상태 표시 영역**: emptyMsg는 list 컨테이너 외부의 `.dynamic-suggestion-chip__empty` 영역(stateRoot 내부). list가 비어있을 때만 CSS로 표시(`.is-empty .__empty { display:block }` / 정상 시 `display:none`). loading 시에도 동일 영역에 다른 텍스트로 표시.
