# Tabs — Advanced / scrollable

## 기능 정의

1. **탭 항목 렌더링 (Standard 호환)** — `tabsItems` 토픽으로 수신한 배열(다수, 일반적으로 8~30개)을 template 반복으로 렌더링하고, 개별 탭의 활성 상태(`active`)를 관리한다. ListRender selectorKEY 6종(tabid/active/icon/label/badge + container/template)은 Standard 호환 그대로 유지.
2. **overflow 자동 감지** — `ResizeObserver` 가 list container 의 `clientWidth` vs `scrollWidth` 를 비교하여 overflow 여부 결정. overflow 가 있으면 좌/우 scroll 버튼 노출, 없으면 숨김(`data-overflow="true|false"`). 컴포넌트 너비 변경, 탭 추가/제거, 폰트 로딩 등 모든 시점 자동 반응.
3. **좌/우 scroll 버튼 + 활성/비활성** — 좌/우 화살표 버튼(`.tabs-sc__nav--prev` / `.tabs-sc__nav--next`) 클릭 시 list container 의 `scrollLeft` 를 visible width 만큼 smooth 이동(`scrollTo({left, behavior: 'smooth'})`). `scrollLeft === 0` 이면 좌측 버튼 비활성(`data-disabled="true"` + `disabled` attr), `scrollLeft + clientWidth >= scrollWidth - 1` 이면 우측 버튼 비활성. scroll 이벤트 listener 가 좌/우 disabled 상태를 실시간 동기화.
4. **active tab 자동 스크롤(viewport 보장)** — `setSelectedTab` 토픽으로 수신한 tabid 의 탭이 viewport 밖이면 `scrollIntoView({inline: 'nearest', behavior: 'smooth'})` 로 가시화. 동시에 ListRender 의 `updateItemState(prev, {active:'false'})` + `updateItemState(curr, {active:'true'})` 로 상태 전환. `@tabSelected` 발행(payload: `{ tabid, targetInstance }`).
5. **Standard 호환 `@tabClicked` 이벤트** — 탭 클릭은 Standard 와 동일하게 `@tabClicked` 발행(bindEvents 위임). 페이지가 수신하여 `setSelectedTab` 토픽 publish 또는 직접 `updateItemState` 호출 가능.
6. **scroll 위치 변경 알림 — `@tabsScrolled`** — list container scroll 이벤트 발생 시 디바운스(80ms) 후 `@tabsScrolled` 1회 발행(payload: `{ scrollLeft, scrollWidth, clientWidth, atStart, atEnd, targetInstance }`). 페이지가 fade overlay 위치, 미니맵 동기화, 분석 트래킹 등에 활용 가능.

> **Standard 와의 분리 정당성**:
> - **새 자체 상태 5종** — `_resizeObserver: ResizeObserver`, `_listScrollHandler: function`, `_navClickHandler: function`, `_scrollDebounceId: number|null`, `_scSelectors: object`. Standard 는 stateless.
> - **자체 메서드 6종** — `_handleNavClick` / `_handleListScroll` / `_updateOverflowState` / `_updateNavDisabledState` / `_setSelectedTab` / `_scrollIntoActive`. Standard 는 자체 메서드 0종.
> - **HTML 구조 변경 — nav 버튼 좌/우 wrapper 추가** — Standard 는 `.tabs > .tabs__list` 만. scrollable 은 `.tabs-sc > [.tabs-sc__nav--prev | .tabs-sc__list-wrap > .tabs-sc__list | .tabs-sc__nav--next]` 3-flex-셀 구조. nav 는 fixed-width(40px), list-wrap 은 `flex:1 + overflow:hidden`, list 는 `overflow-x:auto`. 클래스 prefix `.tabs-sc__*` 로 Standard(`.tabs__*`) 와 분리.
> - **새 토픽 1종** — `setSelectedTab` (`{ tabid }` payload). Standard 는 `tabsItems` 1종(scrollable 도 동일하게 받지만 Standard 는 `tabItems`였으므로 scrollable 은 `tabsItems` 로 표기 — Standard 답습 호환을 위해 동일 컴포넌트 내에서 `tabItems` 별칭도 받을 수 있도록 둘 다 구독).
> - **새 이벤트 2종** — `@tabSelected` (페이지가 명시 payload 로 활성 전환을 통보받음 — bindEvents 위임의 `{event,targetInstance}` 와 분리), `@tabsScrolled` (list scroll 위치 변경). `@tabClicked` 는 Standard 호환 유지.
> - **ResizeObserver + native scroll listener 1쌍** — overflow 자동 감지 + scroll disabled 실시간 동기화. Standard 는 사용 안 함.
>
> 위 6축은 동일 register.js 로 표현 불가 → Standard 내부 variant 로 흡수 불가.

> **Tables/Advanced/expandableRow 직전 답습**: register.js top-level 평탄, 자체 상태/메서드/이벤트/토픽 분리, preview `<script src>` 5단계 깊이 verbatim 복사, demo-label/hint 도메인 컨텍스트 명시. native 컨테이너 listener 패턴(`_listScrollHandler` / `_navClickHandler` bound ref + addEventListener) 동일 차용. ListRender selectorKEY 호환(`tabid`/`active`/`icon`/`label`/`badge` + `container`/`template`) 으로 Standard 디자인 토큰 재사용.

> **다른 Tabs Advanced(closable / draggableReorder / lazyContent) 와의 직교성**: scrollable = overflow 가시성(viewport 진실), closable = 항목 제거(데이터 진실), draggableReorder = 항목 순서(순서 진실), lazyContent = 콘텐츠 로딩(콘텐츠 진실). 네 변형 모두 서로 다른 축. 동일한 ListRenderMixin 토대 + Standard 호환 KEY(`tabid`/`active`/`icon`/`label`/`badge`) 공유. (양립 시 prefix 가 다르므로 페이지 내 공존 가능 — `.tabs-sc__*` ↔ `.tabs-cl__*` ↔ `.tabs-dr__*` ↔ `.tabs-lz__*`.)

> **MD3 / 도메인 근거**: MD3 Tabs spec 의 Scrollable Tabs 패턴 — "When tabs cannot fit in the available width, they become scrollable." (Material Design 3 — Tabs spec, Scrollable tabs 섹션). 모든 모던 UI 라이브러리(MUI Tabs `variant="scrollable"`, Vuetify v-tabs `show-arrows`, Ant Design Tabs `tabBarExtraContent` + native overflow, Bootstrap Tabs scrollable variant) 가 동일 패턴(좌/우 nav + auto active scroll). 실사용: ① **운영 콘솔 — 다중 사이트/장비/지표 탭** (사이트 12~30개 동시 노출 — overflow 시 좌/우 nav), ② **CRM — 고객 세그먼트 다탭** (active/lead/churned/dormant/vip 등 다수), ③ **분석 대시보드 — 시간 윈도우 탭** (1H/6H/12H/1D/3D/7D/14D/30D/90D — 보통 overflow), ④ **편집 도구 — 다중 문서 탭** (탭 수 가변, overflow 자주 발생).

---

## 구현 명세

### Mixin

ListRenderMixin (탭 데이터 렌더링 — Mixin 은 overflow/scroll 인지 X) + 자체 메서드 6종(`_handleNavClick` / `_handleListScroll` / `_updateOverflowState` / `_updateNavDisabledState` / `_setSelectedTab` / `_scrollIntoActive`).

> **신규 Mixin 생성 금지** — 큐 설명에 "overflow detection + scroll buttons" 명시. SKILL 규칙상 본 루프에서 새 Mixin 을 만들지 않는다. ListRenderMixin 은 탭 배열을 받아 N 개 탭을 렌더하고(overflow 인지 X), nav click 토글 · ResizeObserver overflow 감지 · scroll listener disabled 동기화 · active tab viewport 진입 · 명시 emit 은 컴포넌트 자체 메서드가 전담.

### cssSelectors (ListRenderMixin)

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.tabs-sc__list` | 탭이 추가될 부모 (ListRenderMixin 규약 — scroll 컨테이너이기도 함). |
| template | `#tabs-sc-item-template` | `<template>` cloneNode 대상 (ListRenderMixin 규약). |
| tabid | `.tabs-sc__item` | 탭 식별 + 이벤트 매핑. |
| active | `.tabs-sc__item` | 활성 상태 (data-active). |
| icon | `.tabs-sc__icon` | 아이콘 표시 (Material Symbols 등). |
| label | `.tabs-sc__label` | 라벨 텍스트. |
| badge | `.tabs-sc__badge` | 뱃지 텍스트 (빈 값이면 `:empty` 로 숨김). |

> **scrollable 전용 selector(자체 메서드 전담)**: `.tabs-sc`(루트 — `data-overflow` 토글 대상), `.tabs-sc__nav--prev` / `.tabs-sc__nav--next`(좌/우 scroll 버튼 — `data-disabled` 토글 대상), `.tabs-sc__list-wrap`(list 외곽 — overflow:hidden) 은 cssSelectors KEY 로 등록하지 않는다 — ListRender 가 직접 데이터 바인딩하지 않으며 자체 메서드(`_updateOverflowState` / `_updateNavDisabledState` / `_handleNavClick`)가 전담.

### itemKey (ListRender)

`tabid` — `updateItemState(tabid, { active })` 활용.

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| tabid | `tabid` | 탭 식별 — `closest('.tabs-sc__item')?.dataset.tabid` 로 추출. |
| active | `active` | 활성 상태 — `[data-active="true"]` CSS 셀렉터. |

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_resizeObserver` | `ResizeObserver \| null` | list container 크기 변경 감지(overflow 재계산). |
| `_listScrollHandler` | `function \| null` | bound `_handleListScroll` — beforeDestroy 정확 제거용. |
| `_navClickHandler` | `function \| null` | bound `_handleNavClick` — beforeDestroy 정확 제거용. |
| `_scrollDebounceId` | `number \| null` | scroll 이벤트 디바운스 timer id (`@tabsScrolled` emit 용 80ms). |
| `_scSelectors` | `object` | scrollable 전용 보조 selector(root/navPrev/navNext/listWrap). cssSelectors 에 등록되지 않은 내부 매핑. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `tabsItems` | `this.listRender.renderData` | `[{ tabid, icon, label, badge, active }]` — 새 batch (탭 전체 replace). 렌더 후 `_updateOverflowState` 가 ResizeObserver 콜백에서 자동 호출. |
| `tabItems` (Standard 호환 별칭) | `this.listRender.renderData` | 동일 페이로드 — Standard 토픽 이름으로 발행하는 페이지 호환용. |
| `setSelectedTab` | `this._setSelectedTab` | `{ tabid: 'metrics' }` — 활성 탭 외부 강제 전환 + 자동 viewport 스크롤. |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `tabid` (ListRender — `.tabs-sc__item`) | 탭 클릭 | `@tabClicked` (Standard 호환 — `{ targetInstance, event }`). |

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@tabSelected` | `_setSelectedTab` 가 활성 전환을 완료한 직후 1회 | `{ targetInstance, tabid }` |
| `@tabsScrolled` | list container scroll 이벤트 발생 80ms 디바운스 후 1회 | `{ targetInstance, scrollLeft, scrollWidth, clientWidth, atStart, atEnd }` |

> **이벤트 분리 이유**: bindEvents 위임은 `{ targetInstance, event }` 만 전달 → tabid 가 없다. scrollable 은 페이지가 매번 DOM 을 다시 스캔하지 않고도 어떤 탭이 활성화되었는지 바로 받을 수 있어야 하므로(예: lazy content fetch, 라우팅 동기화) `@tabSelected` 를 자체 emit. `@tabClicked` 위임 발행은 Standard 호환 + 사용자 액션 채널로 분리.

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_handleNavClick(e)` | `(MouseEvent) => void` | 컨테이너 root native click delegator. `e.target.closest('.tabs-sc__nav')` → prev/next 분기 → list `scrollLeft` 를 visible width 만큼 ±이동(`scrollTo({left, behavior:'smooth'})`). disabled 버튼은 no-op. |
| `_handleListScroll()` | `() => void` | list scroll 이벤트 listener. 즉시 `_updateNavDisabledState()` 호출(좌/우 disabled 실시간 동기화) + `_scrollDebounceId` 디바운스로 80ms 후 `@tabsScrolled` 1회 emit. |
| `_updateOverflowState()` | `() => void` | `clientWidth < scrollWidth - 1` 이면 `.tabs-sc[data-overflow="true"]`, 아니면 `false`. ResizeObserver 콜백 + `renderData` 후속에서 호출. overflow 상태 변경 시 `_updateNavDisabledState` 도 함께 호출. |
| `_updateNavDisabledState()` | `() => void` | list 의 `scrollLeft` 와 `scrollWidth - clientWidth` 비교 → 좌/우 nav 의 `data-disabled` + `disabled` attr 동기화. `scrollLeft <= 0` → prev disabled, `scrollLeft + clientWidth >= scrollWidth - 1` → next disabled. overflow 가 false 면 둘 다 disabled. |
| `_setSelectedTab({ response })` | `({response}) => void` | `setSelectedTab` 토픽 핸들러. `response = { tabid: 'metrics' }`. 현재 active 탭 탐색 → ListRender `updateItemState(prevTabid, {active:'false'})` + `updateItemState(currTabid, {active:'true'})` → `_scrollIntoActive(currTabid)` → `@tabSelected { tabid }` emit. 동일 tabid 재요청은 멱등(no emit). |
| `_scrollIntoActive(tabid)` | `(string) => void` | 활성 탭이 viewport 밖이면 `scrollIntoView({inline:'nearest', behavior:'smooth'})` 호출. 이미 viewport 안이면 no-op. |

### 페이지 연결 사례

```
[페이지 — 운영 콘솔 사이트 탭 / CRM 세그먼트 / 분석 윈도우 / 편집 도구 다중 문서]
    │
    └─ fetchAndPublish('tabsItems', this) 또는 직접 publish
        payload 예: [
          { tabid: 'site-01', icon: 'place', label: 'Site-Seoul-01',  badge: '',  active: 'true' },
          { tabid: 'site-02', icon: 'place', label: 'Site-Seoul-02',  badge: '3', active: 'false' },
          { tabid: 'site-03', icon: 'place', label: 'Site-Busan-01',  badge: '',  active: 'false' },
          ... 12~30개 ...
        ]

[Tabs/Advanced/scrollable]
    ├─ ListRender 가 탭 배열을 N 개 .tabs-sc__item 으로 렌더
    ├─ ResizeObserver 가 .tabs-sc__list 의 width 변경 감지 → _updateOverflowState
    ├─ overflow 면 .tabs-sc[data-overflow="true"] → 좌/우 nav 노출(CSS)
    ├─ scrollLeft = 0 → prev nav data-disabled="true" + disabled attr
    └─ scrollLeft + clientWidth >= scrollWidth → next nav data-disabled="true"

[사용자가 next nav 클릭]
    ├─ _handleNavClick → next 분기 → scrollTo({left: scrollLeft + clientWidth, behavior:'smooth'})
    ├─ list scroll 이벤트 → _handleListScroll → _updateNavDisabledState (실시간)
    └─ 80ms 후 @tabsScrolled { scrollLeft, scrollWidth, clientWidth, atStart, atEnd }

[사용자가 site-15 탭 클릭]
    ├─ bindEvents 위임 → @tabClicked { event, targetInstance }
    └─ 페이지 핸들러: instance._setSelectedTab({ response: { tabid: 'site-15' } })

[Tabs/Advanced/scrollable — setSelectedTab 수신]
    ├─ _setSelectedTab → updateItemState(prev,{active:'false'}) + updateItemState(curr,{active:'true'})
    ├─ _scrollIntoActive('site-15') → 탭이 viewport 밖이면 자동 scroll
    └─ @tabSelected { tabid: 'site-15' }

운영: this.pageDataMappings = [
        { topic: 'tabsItems',      datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setSelectedTab', datasetInfo: {...}, refreshInterval: 0 }   // 선택
      ];
      Wkit.onEventBusHandlers({
        '@tabClicked':    ({ event, targetInstance }) => {
                            const tabid = event.target.closest('.tabs-sc__item')?.dataset.tabid;
                            if (tabid) targetInstance._setSelectedTab({ response: { tabid } });
                          },
        '@tabSelected':   ({ tabid })                  => { /* 라우팅 / 콘텐츠 뷰 전환 */ },
        '@tabsScrolled':  ({ atStart, atEnd })         => { /* fade overlay 토글 / 미니맵 동기화 */ }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | scroll 시각 차별화 (nav 버튼 · indicator · overflow 표현) | 도메인 컨텍스트 예 |
|------|---------|-------------------------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 그라디언트 / Pretendard / 16px 모서리. nav: 다크 퍼플 fill + 시안 ▶ icon (220ms cubic). 활성 탭은 하단 4px pill indicator(시안→퍼플 그라디언트). overflow 시 list 좌/우에 시안 12px fade gradient 오버레이. | **운영 콘솔 — 사이트 16개 탭** (Site-Seoul-01~16, badge=알람 카운트 — viewport 좁아 nav 활성) |
| `02_material`    | B: Material Elevated | 라이트 / elevation shadow / Roboto / 12px 모서리. nav: secondary container surface + Material 화살표. 활성 탭은 3px bottom indicator + 하단 divider. overflow 시 list 좌/우에 라이트 그레이 fade. | **CRM — 고객 세그먼트 14개 탭** (active/lead/churned/dormant/vip/... — admin 패널) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 / DM Serif Display 라벨 / 0~2px 모서리. nav: serif italic ▸ / ◂ (transform 360ms ease-out). 활성 탭 하단 2px 얇은 indicator + 넓은 여백. overflow 시 좌/우 fade 없이 nav 만 노출. | **분석 — 시간 윈도우 탭** (1H/6H/12H/1D/3D/7D/14D/30D/90D — 9개 + 라벨 길이 → overflow) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 시안 / IBM Plex Mono / 각진 2px 모서리. nav: 시안 ring + Mono ◀ ▶. 활성 탭 각진 2px bottom indicator + tabular-nums badge. overflow 시 nav 양쪽에 시안 1px 보더. | **편집 도구 — 다중 문서 탭** (file-01.json ~ file-22.json — 다수 동시 편집 + overflow) |

각 페르소나는 `.tabs-sc[data-overflow="true|false"]` 셀렉터로 nav 표시/숨김을 동시 토글. nav `[data-disabled="true"]` 는 opacity 30% + `pointer-events:none`. 활성 탭의 indicator/색은 페르소나별로 분기.

### 결정사항

- **prefix `.tabs-sc__*`** — Standard `.tabs__*` / closable `.tabs-cl__*` / draggableReorder `.tabs-dr__*` / lazyContent `.tabs-lz__*` 와 분리(같은 페이지 공존 시 CSS 충돌 X).
- **2 토픽 동시 구독(`tabsItems` + `tabItems`)** — Advanced 변형은 큐 설명대로 `tabsItems` 토픽 권장이지만, Standard 호환을 위해 `tabItems` 도 구독. 페이지가 둘 중 하나로 publish 해도 동작.
- **scroll 위치 변경 emit 은 디바운스(80ms)** — scroll 이벤트는 16ms 단위로 발생 → 매번 emit 하면 페이지 부하. 80ms 디바운스로 "스크롤 멈춤 시점" 1회만 emit.
- **`scrollIntoView({inline:'nearest', behavior:'smooth'})`** — `'start'` 면 항상 좌측 끝으로 스크롤하여 viewport 내부에 있는 탭도 이동. `'nearest'` 는 이미 viewport 안이면 no-op + 밖이면 가장 가까운 가장자리로.
- **ResizeObserver — list element 만 관찰** — root `.tabs-sc` 가 아닌 `.tabs-sc__list` 를 관찰. list 의 clientWidth/scrollWidth 가 직접적인 overflow 판단 기준.
- **scrollLeft 비교는 1px tolerance** — `scrollLeft + clientWidth >= scrollWidth - 1` (정수 반올림 오차 흡수).
- **신규 Mixin 생성 금지** — ListRenderMixin + 자체 메서드 6종으로 완결.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions / customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서 (ResizeObserver disconnect → list scroll listener remove → root native click delegator remove → debounce timer clear → customEvents 제거 → 구독 해제 → 자체 상태/메서드 null + listRender.destroy)
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Tabs/Advanced/scrollable/preview/...html` → `../`를 5번 = expandableRow 동일 verbatim 복사)
