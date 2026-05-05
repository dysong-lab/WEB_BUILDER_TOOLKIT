# Lists — Advanced / infiniteScroll

## 기능 정의

1. **리스트 항목 동적 렌더 (Standard 호환)** — `listItems` 토픽으로 수신한 초기 페이지 배열(`[{itemid, leading?, headline, supporting?}]`)을 ListRenderMixin이 `<template>` cloneNode로 N개 항목으로 렌더한다. `_items` 자체 상태로 데이터를 캐시하여 다음 페이지 append/재렌더에 사용. cssSelectors KEY는 Standard 호환(itemid/leading/headline/supporting).
2. **하단 sentinel 기반 IntersectionObserver 자동 트리거** — 컨테이너 마지막에 `<div class="list-inf__sentinel">`를 두고 outer(`.list-inf__outer`)를 root로 IntersectionObserver를 부착(`rootMargin: '200px 0px'`로 하단 도달 직전 미리 트리거). sentinel이 viewport에 진입하면 `_handleIntersect`가 호출되어 다음 페이지를 emit. **`_isLoading=true` 또는 `_hasMore=false`이면 emit 차단** (중복 요청 / 종료 후 재요청 방지).
3. **로딩 상태 머신 (`_isLoading`)** — 트리거 시 `_isLoading=true` 셋팅 + outer에 `data-loading="true"` 데이터셋 부착(CSS가 spinner 표시) + `@loadMore` emit. 외부 페이지가 다음 페이지 데이터를 `appendListItems` 토픽으로 publish하면 `_appendItems`가 _items에 push + ListRender 재렌더 + `_isLoading=false` + `data-loading="false"`. 외부에서 강제 토글이 필요하면 `setLoadingState` 토픽(선택)으로 갱신.
4. **종료 상태 (`_hasMore`)** — 외부가 `setNoMoreItems` 토픽(`{ done: true }` 또는 truthy)을 publish하면 `_hasMore=false` + `_isLoading=false` + outer에 `data-no-more="true"` 부착(CSS가 "더 이상 항목 없음" 메시지 표시 + spinner 숨김) + IntersectionObserver `disconnect` + `@listEndReached` 1회 emit. 추가 emit 차단.
5. **`@loadMore` 이벤트 발행** — payload: `{ targetInstance, currentCount, requestedAt: ISO }`. 페이지가 이 이벤트를 받아 자체 API 호출 + 결과를 `appendListItems`로 publish하는 책임을 진다. **컴포넌트는 직접 fetch하지 않는다** (SOC).
6. **항목 클릭 호환 (Standard와 동일 이벤트)** — `event.target.closest('.list-inf__item')?.dataset.itemid`로 항목 식별. native click → `bindEvents`로 `@listItemClicked` 발행.
7. **새 batch 시작 (`listItems` 재수신)** — 페이지가 새 검색/필터 컨텍스트로 `listItems`를 다시 publish하면 `_resetForNewBatch`: `_items = items.slice()` 새 진실 + `_hasMore=true` + `_isLoading=false` + IntersectionObserver 재연결(이전에 disconnect되었을 수 있음) + outer.scrollTop=0.

> **Standard와의 분리 정당성**:
> - **HTML 구조 변경 — outer/list/sentinel/loading/empty 5요소** — Standard는 `.list__items` 단일 컨테이너. infiniteScroll은 `.list-inf__outer`(스크롤 영역) + `.list-inf__items`(ListRender 컨테이너) + `.list-inf__sentinel`(IntersectionObserver target) + `.list-inf__loading`(spinner 영역, `data-loading="true"`일 때 표시) + `.list-inf__end`(end message 영역, `data-no-more="true"`일 때 표시) 5요소. 클래스명도 `list-inf__*`로 분리(`list__*` / `list-vs__*` 충돌 방지).
> - **자체 상태 4종** — `_items`(데이터 진실 보관), `_isLoading`(boolean, 중복 요청 차단), `_hasMore`(boolean, 종료 신호), `_intersectionObserver`(beforeDestroy disconnect 보관). Standard는 stateless.
> - **자체 메서드 7종** — `_renderItems`/`_appendItems`/`_setNoMoreItems`/`_setLoadingState`/`_handleIntersect`/`_emitLoadMore`/`_emitListEndReached`. Standard는 자체 메서드 0종.
> - **IntersectionObserver native lifecycle** — Standard에는 없음. observe/disconnect 라이프사이클 + rootMargin 하단 prefetch.
> - **새 이벤트 2종** — `@loadMore`(payload: `{currentCount, requestedAt}`), `@listEndReached`(payload: `{totalCount}`). Standard는 `@listItemClicked` 1종.
> - **새 구독 토픽 3종** — `appendListItems`(다음 페이지 append), `setNoMoreItems`(종료 신호), `setLoadingState`(외부 강제 toggle). Standard는 `listItems` 1종.
>
> 위 6축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.

> **virtualScroll과의 직교성 (1줄 핵심)**: virtualScroll은 **유한한 대용량 배열을 한번에 받고 viewport 외 항목을 DOM에서 제외하는 렌더링 전략**(scroll listener + spacer + sliced render). infiniteScroll은 **유한/무한 페이징 데이터를 점진적으로 받아 누적 append하는 데이터 수집 전략**(IntersectionObserver + @loadMore + appendListItems). 동일 `listItems` 데이터 모델을 공유하지만 **데이터 수령 시점(일괄 vs 페이징)과 DOM 전략(가상 vs 누적)이 직교** — 한 컴포넌트가 둘을 동시 수행하면 scroll vs IntersectionObserver 경합 + spacer 높이 vs append rendering 충돌 → 별 변형으로 분리.

> **swipeToDelete와의 직교성 (1줄 핵심)**: swipeToDelete는 **항목 삭제** 인터랙션, infiniteScroll은 **항목 페이징 추가** 데이터 흐름. 별 컴포넌트로 분리하는 것이 자연.

> **MD3 / 도메인 근거**: MD3 Lists는 텍스트와 이미지의 연속적인 수직 인덱스다. **항목 총수가 미지(서버 페이징) 또는 너무 커서 한 번에 받기 어려운 시나리오**에서, 스크롤이 끝에 다다르면 다음 페이지를 자동으로 로드해 자연스러운 연속성을 제공한다. IntersectionObserver는 W3C 표준이며 scroll listener + offsetHeight 계산 대비 효율적(브라우저가 native paint 사이클에 통합 트리거). 실사용: ① **검색 결과 스크롤 로딩**(Google/Naver 결과 페이지), ② **소셜 피드 무한 스크롤**(Twitter/Instagram 타임라인), ③ **시간순 알림 히스토리**(누적 알림 무한 로딩), ④ **상품 카탈로그**(이커머스 프로덕트 그리드). 모든 모던 모바일 앱(Twitter, Instagram, Pinterest)이 동등 기능을 제공한다.

---

## 구현 명세

### Mixin

ListRenderMixin (배열 항목을 렌더 — Mixin은 페이징 인지 X) + 자체 메서드(`_renderItems` / `_appendItems` / `_setNoMoreItems` / `_setLoadingState` / `_handleIntersect` / `_emitLoadMore` / `_emitListEndReached`).

> **신규 Mixin 생성 금지** — 큐 설명에 "scroll listener, @loadMore" 명시. SKILL 규칙상 본 루프에서 새 Mixin을 만들지 않는다. ListRenderMixin은 누적 _items 배열을 받아 그대로 N개 항목을 렌더하고(전체 렌더 — 본 변형은 가상화 안함, virtualScroll과 직교), 페이징 로직(IntersectionObserver → @loadMore → appendListItems → ListRender 재호출)은 컴포넌트 자체 메서드가 전담한다. swipe 패턴(swipeAction/swipeToDelete) + 페이징 패턴(infiniteScroll)이 누적되면 향후 일반화 검토 후보(반환에 메모만 — SKILL 회귀 규율).

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| group        | `.list-inf`              | 그룹 컨테이너 |
| outer        | `.list-inf__outer`       | 스크롤 컨테이너 (`overflow-y: auto`) — IntersectionObserver root + `data-loading`/`data-no-more` 부착 대상 |
| container    | `.list-inf__items`       | 항목이 추가될 부모 (ListRenderMixin 규약) |
| template     | `#list-inf-item-template`| `<template>` cloneNode 대상 (ListRenderMixin 규약) |
| itemid       | `.list-inf__item`        | 렌더된 각 row 루트 — `data-itemid` + native click 매핑 (Standard 호환 KEY) |
| leading      | `.list-inf__leading`     | 선행 요소 (아이콘/이모지) — Standard 호환 KEY |
| headline     | `.list-inf__headline`    | 헤드라인 텍스트 — Standard 호환 KEY |
| supporting   | `.list-inf__supporting`  | 보조 텍스트 — Standard 호환 KEY |
| sentinel     | `.list-inf__sentinel`    | IntersectionObserver target (items 뒤, end 영역 앞) |
| loading      | `.list-inf__loading`     | 로딩 인디케이터 영역 — `data-loading="true"`일 때만 표시 |
| end          | `.list-inf__end`         | 종료 메시지 영역 — `data-no-more="true"`일 때만 표시 |

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| itemid | `itemid` | 항목 식별 (Standard 호환) |

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_items` | object[] | 누적된 모든 항목(현재까지 페이징으로 받은 합계). `_renderItems`/`_appendItems`가 갱신, ListRender가 N개 row로 렌더. |
| `_isLoading` | boolean | 현재 로딩 중 여부. true면 IntersectionObserver callback에서 emit 차단. UI는 `data-loading="true"`로 spinner 표시. |
| `_hasMore` | boolean | 다음 페이지 존재 여부. false면 emit 차단 + observer disconnect + `data-no-more="true"`로 end message 표시. |
| `_intersectionRootMargin` | string | IntersectionObserver `rootMargin` (기본 `'200px 0px'`). 하단 도달 직전 200px에서 미리 트리거. |
| `_intersectionObserver` | IntersectionObserver \| null | observer 인스턴스 — beforeDestroy `disconnect`. |
| `_intersectHandler` | function \| null | bound IntersectionObserver callback. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `listItems` | `this._renderItems` | `[{ itemid, leading?, headline, supporting? }]` — **새 batch (이전 누적 X)**. 새 검색/필터 진입 시 사용. |
| `appendListItems` | `this._appendItems` | `[{ itemid, leading?, headline, supporting? }]` — **누적 append**. `@loadMore` 응답 또는 외부에서 추가 항목 publish. |
| `setNoMoreItems` | `this._setNoMoreItems` | `boolean \| { done: true }` — truthy면 `_hasMore=false` + observer disconnect + end message + `@listEndReached`. |
| `setLoadingState` | `this._setLoadingState` | `boolean` — 외부 강제 toggle. true면 `_isLoading=true` + spinner, false면 해제. |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `itemid` (ListRender) | 항목 클릭 | `@listItemClicked` (bindEvents 위임 발행 — Standard 호환). 페이로드 `{ targetInstance, event }`. |

### 자체 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@loadMore` | sentinel이 viewport에 진입 + `_isLoading=false` + `_hasMore=true`인 사이클 1회 | `{ targetInstance, currentCount, requestedAt: ISO }` |
| `@listEndReached` | `setNoMoreItems` 수신 → `_hasMore=true → false` 전이 시 1회 | `{ targetInstance, totalCount }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderItems({ response })` | `({response}) => void` | `listItems` 핸들러. items 배열을 ListRender selectorKEY에 맞게 그대로 전달(Standard 호환). `_items = items.slice()` 새 진실. `_hasMore=true`, `_isLoading=false`, outer dataset reset (`data-loading="false"`, `data-no-more="false"`). observer가 disconnect되었으면 재연결. outer.scrollTop=0. |
| `_appendItems({ response })` | `({response}) => void` | `appendListItems` 핸들러. items 배열을 `_items`에 push concat → `listRender.renderData` 전체 재호출. `_isLoading=false`, `data-loading="false"`. 빈 배열 또는 미배열 시 isLoading만 해제 후 무시. |
| `_setNoMoreItems({ response })` | `({response}) => void` | `setNoMoreItems` 핸들러. truthy 시 `_hasMore=false`, `_isLoading=false`, outer `data-no-more="true"` + `data-loading="false"`, observer disconnect, `_emitListEndReached()`. 이미 `_hasMore=false`이면 무시. |
| `_setLoadingState({ response })` | `({response}) => void` | `setLoadingState` 핸들러. response를 boolean으로 변환. true면 `_isLoading=true` + `data-loading="true"`, false면 해제. 단순 외부 toggle (emit 안함). |
| `_handleIntersect(entries)` | `(IntersectionObserverEntry[]) => void` | IntersectionObserver callback. `entries[0].isIntersecting`가 true이고 `_isLoading=false`이고 `_hasMore=true`이면 `_isLoading=true` + `data-loading="true"` + `_emitLoadMore()`. 그 외 무시. |
| `_emitLoadMore()` | `() => void` | `Weventbus.emit('@loadMore', {targetInstance, currentCount: _items.length, requestedAt: new Date().toISOString()})`. |
| `_emitListEndReached()` | `() => void` | `Weventbus.emit('@listEndReached', {targetInstance, totalCount: _items.length})`. |

### 페이지 연결 사례

```
[페이지 — 검색 결과 / 소셜 피드 / 알림 히스토리 / 상품 카탈로그]
    │
    ├─ fetchAndPublish('listItems', this) — 1페이지 (예: 20개)
    │
    └─ Wkit.onEventBusHandlers({
         '@loadMore': async ({ currentCount }) => {
           const nextPage = await api.fetchPage(Math.floor(currentCount / 20) + 1);
           if (nextPage.length === 0) {
             targetInstance.subscriptions.setNoMoreItems.forEach(h => h.call(targetInstance, { response: true }));
           } else {
             targetInstance.subscriptions.appendListItems.forEach(h => h.call(targetInstance, { response: nextPage }));
           }
         },
         '@listEndReached': ({ totalCount }) => { /* 분석 / "전체 N개 로드됨" 토스트 */ },
         '@listItemClicked': ({ event }) => {
           const id = event.target.closest('.list-inf__item')?.dataset.itemid;
           // 상세 페이지로 이동
         }
       });

[Lists/Advanced/infiniteScroll]
    ├─ _renderItems가 _items 보관 + ListRender N행 렌더
    ├─ IntersectionObserver가 .list-inf__sentinel 관찰
    └─ 사용자가 스크롤 → sentinel이 viewport 200px 진입
        ├─ _handleIntersect 호출 → _isLoading=true + data-loading="true" + spinner 노출
        └─ @loadMore { currentCount: 20, requestedAt: '2026-05-05T...' } emit

[페이지]
    └─ @loadMore 수신 → API 호출 → appendListItems publish (다음 20개)

[Lists/Advanced/infiniteScroll]
    ├─ _appendItems가 _items에 push concat (총 40개)
    ├─ ListRender 전체 재렌더 (40행)
    └─ _isLoading=false + data-loading="false" → spinner 숨김

[사용자가 N번째 페이지에서 끝 도달]
    └─ 페이지가 setNoMoreItems publish → _hasMore=false + observer disconnect + data-no-more="true" + end message + @listEndReached
```

---

## 디자인 변형

| 파일 | 페르소나 | 시각 차별화 | 도메인 컨텍스트 |
|------|---------|------------|----------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 / 그라디언트 호버 / Pretendard / 회전형 spinner ring(다크 퍼플 → 라이트) / end message: 미세한 separator + dim text | **검색 결과 스크롤 로딩** (검색 키워드별 결과 페이지를 20개씩 점진 로드) |
| `02_material`    | B: Material Elevated | 라이트 / elevation shadow / Roboto / Material circular progress / end message: 중앙 정렬 + 작은 아이콘 | **소셜 피드 무한 스크롤** (타임라인 포스트 페이징) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 / DM Serif / 넓은 여백 / dot pulse spinner(3 dots wave) / end message: 세리프 italic "—끝—" | **시간순 알림 히스토리** (구독 알림 누적 무한 로딩) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 / 시안 테두리 / IBM Plex Mono / linear progress bar(시안) / end message: 모노 "[ END ]" 모노스페이스 | **상품 카탈로그 / 누적 알람 큐** (운영 콘솔에서 알람 누적 무한 로딩) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따른다. `[data-loading="true"]` / `[data-no-more="true"]` 셀렉터로 spinner / end message 가시성을 분기.

### 결정사항

- **IntersectionObserver vs scroll listener**: IntersectionObserver를 채택. scroll listener는 매 픽셀마다 트리거되어 throttle 필요(rAF). IntersectionObserver는 native paint 사이클에 통합되어 트리거 빈도가 낮고, root + rootMargin 옵션으로 prefetch도 자연스럽게 가능. 큐 설명에 "scroll listener"가 명시되어 있으나 의도(하단 도달 감지)는 IntersectionObserver가 더 효율적이며 모던 표준. 동작은 동일.
- **rootMargin '200px 0px' (하단 prefetch)**: 사용자 스크롤이 sentinel에 도달하기 200px 전에 미리 트리거하여 spinner/page latency 체감 감소. 0이면 사용자가 끝에 닿은 후 로딩 시작 = UX 단절 발생.
- **누적 vs 가상 스크롤**: virtualScroll과 달리 `_items`에 모두 누적하고 모든 항목을 DOM에 렌더한다. 페이징 후 항목 수가 수천 단위로 커지면 메모리/DOM 비용이 증가하지만, 본 변형의 의도는 "페이징 데이터 수집"이지 "메모리 최적화"가 아니다. 두 변형은 직교 — 페이지가 둘 다 필요하면 둘을 결합한 별 변형(`virtualInfinite`, 큐 후보)이 필요.
- **컴포넌트는 직접 fetch하지 않음**: SOC. `@loadMore` emit으로 페이지가 API 호출 책임. 페이지가 응답을 `appendListItems`로 publish.
- **새 batch (`listItems` 재수신)**: 검색/필터 컨텍스트 변경 시 이전 누적 데이터를 버리고 새 배열로 reset. observer 재연결 + scrollTop=0 + 모든 상태 reset.
- **신규 Mixin 생성 금지**: ListRenderMixin + 자체 메서드 조합으로 완결. swipe(2회) + 페이징(1회) 패턴 누적 — 향후 일반화 검토 후보(반환에 메모만 — SKILL 회귀 규율).
