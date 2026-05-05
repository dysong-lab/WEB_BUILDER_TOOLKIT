# Tabs — Advanced / lazyContent

## 기능 정의

1. **탭 항목 렌더링 (Standard 호환)** — `tabsItems` 토픽으로 수신한 배열(`[{ tabid, icon, label, badge, active }]`)을 ListRenderMixin 의 `<template>` cloneNode 로 N 개 탭을 렌더링하고, 개별 탭의 활성 상태(`active`)를 관리한다. ListRender selectorKEY 6종(tabid/active/icon/label/badge + container/template) 은 Standard 호환 그대로 유지. Standard 의 `tabItems` 토픽도 별칭으로 동시 구독(호환).
2. **활성 탭 전용 콘텐츠 패널 — `tabid` 별 panel container 매핑** — 탭과 1:1 로 대응하는 `[data-panel-tabid]` 속성을 가진 panel `<div>` 들이 `.tabs-lz__panels` 영역에 미리 N 개 존재. active 탭의 panel 만 노출(`data-active="true"`), 나머지는 hidden(`display:none`). panel 템플릿은 `<template id="tabs-lz-panel-template">` 로 정의되며, 새 batch 시 자체 메서드 `_renderPanelShells` 가 panel 골격을 새로 그리고 `_contentLoaded` 캐시는 새 batch 의 tabid set 으로 재정렬(미존재 tabid 캐시 제거).
3. **lazy load — 활성 탭만 콘텐츠 요청** — 탭 클릭 또는 외부 `setSelectedTab` 으로 활성 탭이 바뀔 때 `_contentLoaded.has(nextTabid)` 가 false 면 `@contentRequested { tabid }` 1회 발행. 페이지가 데이터를 가져와 `setTabContent { tabid, content }` 토픽으로 응답. 이미 로드된 탭(`_contentLoaded.has(tabid)`)은 즉시 표시(재요청 없음). 같은 탭 재방문 시 캐시 즉시 노출.
4. **콘텐츠 응답 수신 — `setTabContent`** — 페이지가 `setTabContent` 토픽으로 `{ tabid, content }` 발행 → `_renderTabContent` 핸들러가 해당 panel 의 `.tabs-lz__panel-body` 에 `content` 를 textContent 로 채우고 `_contentLoaded.set(tabid, content)` 캐시. panel 의 `data-loaded="true"` 토글로 로딩 indicator 제거. `@contentRendered { tabid }` 발행.
5. **외부 publish 4 토픽 동시 구독 + 호환 별칭** — 5 토픽 동시 구독:
   - `tabsItems` (전체 batch — 새 panel shells + `_contentLoaded` 재정렬)
   - `tabItems` (Standard 호환 별칭 — 동일 페이로드)
   - `setSelectedTab` (`{ tabid }` — 외부 active 강제 전환 + lazy load 트리거)
   - `setTabContent` (`{ tabid, content }` — lazy 응답 수신)
   - `clearTabContent` (`{ tabid }` 또는 `{ all: true }` — 캐시 무효화. 다음 활성화 시 재요청)
6. **Standard 호환 `@tabClicked` + 추가 명시 이벤트** — 탭 클릭은 Standard 와 동일하게 `@tabClicked` 발행(bindEvents 위임). 페이지가 `setSelectedTab` publish 또는 직접 `_setSelectedTab` 호출. `@contentRequested` / `@contentRendered` / `@tabSelected` 는 명시 payload 로 자체 emit.

> **Standard 와의 분리 정당성 (6축)**:
> - **새 cssSelectors KEY 4종 — `panels` / `panel` / `panelBody` / `panelTemplate`** — `.tabs-lz__panels` (panel 영역 부모), `.tabs-lz__panel` (개별 panel — `[data-panel-tabid][data-active][data-loaded]`), `.tabs-lz__panel-body` (콘텐츠 텍스트 매핑 대상), `#tabs-lz-panel-template` (panel cloneNode 대상). Standard 는 panel 자체가 없음(콘텐츠는 페이지가 별도 영역에 직접 렌더).
> - **새 자체 상태 4종** — `_contentLoaded: Map<tabid, content>` (lazy 로드 캐시 + 재방문 즉시 표시), `_currentActiveTabid: string|null` (현재 활성 tabid 추적 — `_setSelectedTab` 가 prev/curr 결정에 사용), `_tabIds: Set<tabid>` (현재 batch 의 tabid set — `_contentLoaded` 재정렬 시 미존재 캐시 제거), `_lzSelectors: object` (lazyContent 전용 보조 selector — root/panels/panel/panelBody/panelTemplate). Standard 는 stateless.
> - **자체 메서드 7종** — `_renderItems` / `_renderPanelShells` / `_renderTabContent` / `_setSelectedTab` / `_clearTabContent` / `_showPanel` / `_findCurrentActiveTabid`. Standard 는 자체 메서드 0종.
> - **HTML 구조 변경 — tabs strip + panels 영역 + 2종 template** — Standard 는 `.tabs > .tabs__list + #tabs-item-template` 만. lazyContent 는 `.tabs-lz > [.tabs-lz__bar > .tabs-lz__list + #tabs-lz-item-template] + [.tabs-lz__panels + #tabs-lz-panel-template]` 5-요소 구조. 클래스 prefix `.tabs-lz__*` 로 Standard(`.tabs__*`) / scrollable(`.tabs-sc__*`) / closable(`.tabs-cl__*`) / draggableReorder(`.tabs-dr__*`) 와 분리.
> - **새 토픽 3종** — `setSelectedTab` (`{ tabid }`), `setTabContent` (`{ tabid, content }`), `clearTabContent` (`{ tabid? , all? }`). Standard 는 `tabItems` 1종만 구독.
> - **새 이벤트 3종** — `@contentRequested` (lazy 요청), `@contentRendered` (lazy 응답 적용 완료), `@tabSelected` (active 전환 통보). `@tabClicked` 위임 발행은 Standard 호환 유지.
>
> 위 6축은 동일 register.js 로 표현 불가 → Standard 내부 variant 로 흡수 불가.

> **Tabs/Advanced/closable + scrollable + Trees/Advanced/lazyLoad(개념) + Lists/Advanced/infiniteScroll(load-more) 답습**: register.js top-level 평탄 작성, 자체 상태/메서드/이벤트/토픽 분리, preview `<script src>` 5단계 깊이 verbatim 복사, demo-label/hint 에 변형 의도 + 도메인 컨텍스트 명시. closable 의 `_handleClick` native delegator 패턴은 사용하지 않음(× 영역 분기 없음 — 단일 `bindEvents` 위임으로 충분, panel 영역 click 은 페이지 책임). closable 의 `Map` 기반 자체 진실 소스 + `_findCurrentActiveTabid` DOM 조회(closable `_findNextActiveAfterClose` 패턴 차용) + `Map.has` lookup 으로 캐시 결정 + 명시 emit payload(content 자체는 emit 에서 제외 — UI 부담 방지) 패턴 동일 차용. ListRender selectorKEY 호환(`tabid`/`active`/`icon`/`label`/`badge` + `container`/`template`) 으로 Standard 디자인 토큰 재사용 + `panels`/`panel`/`panelBody`/`panelTemplate` 4종 KEY 추가.

> **다른 Tabs Advanced(scrollable / closable / draggableReorder) 와의 직교성**: lazyContent = 콘텐츠 로딩(콘텐츠 진실), scrollable = overflow 가시성(viewport 진실), closable = 항목 제거(데이터 진실), draggableReorder = 항목 순서(순서 진실). 네 변형 모두 서로 다른 축. 동일한 ListRenderMixin 토대 + Standard 호환 KEY(`tabid`/`active`/`icon`/`label`/`badge`) 공유. (양립 시 prefix 가 다르므로 페이지 내 공존 가능 — `.tabs-lz__*` ↔ `.tabs-sc__*` ↔ `.tabs-cl__*` ↔ `.tabs-dr__*`.)

> **MD3 / 도메인 근거**: MD3 Tabs spec 자체에는 lazy 변형이 명시되지 않으나, 모든 모던 SPA / 다중 콘텐츠 탭 UI 가 채택하는 사실상 표준 패턴 (MUI Tabs `keepMounted=false`, Ant Design Tabs `destroyInactiveTabPane`, Vuetify v-window-item lazy 렌더, React Router lazy load route, Quasar QTabPanel `keep-alive=false`). 실사용: ① **분석 대시보드 탭 — 비싼 차트/테이블 (예: Overview / Sales / Logs / Geo / Audit)** — 처음부터 모두 fetch 하면 초기 로딩 비용 큼 → 활성 탭만 fetch + 캐시, ② **관리 콘솔 — 사용자/장비/정책/감사/설정 5탭** — 사용자가 자주 가는 탭만 hit 되도록 lazy, ③ **상세 페이지 — Detail / Activity / Notes / Files / Permissions** — 큰 첨부 파일 / 활동 로그는 활성 시점에 lazy fetch, ④ **편집 도구 인스펙터 — Properties / Styles / Events / Bindings** — 비싼 컴퓨테이션은 활성 탭만.

---

## 구현 명세

### Mixin

ListRenderMixin (탭 strip 데이터 렌더링 — Mixin 은 lazy/panel 인지 X) + 자체 메서드 7종(`_renderItems` / `_renderPanelShells` / `_renderTabContent` / `_setSelectedTab` / `_clearTabContent` / `_showPanel` / `_findCurrentActiveTabid`) + 자체 상태 `_contentLoaded: Map<tabid, content>` / `_currentActiveTabid` / `_tabIds: Set<tabid>` / `_lzSelectors`.

> **신규 Mixin 생성 금지** — 큐 설명에 "활성 탭만 콘텐츠 로드 + contentLoaded map + @contentRequested" 명시. SKILL 규칙상 본 루프에서 새 Mixin 을 만들지 않는다. ListRenderMixin 은 탭 strip 배열을 받아 N 개 탭을 렌더하고(panel/lazy 인지 X), panel shell 생성 · 활성 panel 토글 · lazy 요청 분기 · 캐시 갱신 · 명시 emit 은 컴포넌트 자체 메서드가 전담.

### cssSelectors (ListRenderMixin)

| KEY | VALUE | 용도 |
|-----|-------|------|
| container       | `.tabs-lz__list` | 탭 strip 의 부모 (ListRenderMixin 규약). |
| template        | `#tabs-lz-item-template` | tab `<template>` cloneNode 대상 (ListRenderMixin 규약). |
| tabid           | `.tabs-lz__item` | 탭 식별 + 본체 클릭 위임 (data-tabid). |
| active          | `.tabs-lz__item` | 활성 상태 (data-active). |
| icon            | `.tabs-lz__icon` | 아이콘 표시 (Material Symbols 등). |
| label           | `.tabs-lz__label` | 라벨 텍스트. |
| badge           | `.tabs-lz__badge` | 뱃지 텍스트 (빈 값이면 `:empty` 로 숨김). |
| panels          | `.tabs-lz__panels` | panel 영역 부모 (panel shells 가 추가될 곳 — ListRender 외 자체 메서드 전용 KEY). |
| panel           | `.tabs-lz__panel` | 개별 panel (data-panel-tabid + data-active + data-loaded — 자체 메서드 전용). |
| panelBody       | `.tabs-lz__panel-body` | panel 내부 콘텐츠 매핑 대상 (자체 메서드 전용). |
| panelTemplate   | `#tabs-lz-panel-template` | panel `<template>` cloneNode 대상 (자체 메서드 전용). |

> **lazyContent 전용 보조 selector(자체 메서드 전담)**: `panels` / `panel` / `panelBody` / `panelTemplate` 4종은 cssSelectors 에 등록만 하고(ListRender 가 데이터 바인딩 시 무시 — 데이터 KEY 와 매칭되지 않음), 실제 사용은 자체 메서드(`_renderPanelShells` / `_renderTabContent` / `_showPanel`) 가 전담. ListRender 의 `renderData` 는 5종 데이터 KEY(tabid/active/icon/label/badge)만 처리하므로 panel 관련 KEY 는 무해. `.tabs-lz`(루트) / `.tabs-lz__bar`(strip 외곽) 는 cssSelectors KEY 로 등록하지 않고 `_lzSelectors.root` / `_lzSelectors.bar` 로만 보관.

### itemKey (ListRender)

`tabid` — `updateItemState(tabid, { active })` 활용.

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| tabid  | `tabid`  | 탭 식별 — `closest('.tabs-lz__item')?.dataset.tabid` 로 추출. |
| active | `active` | 활성 상태 — `[data-active="true"]` CSS 셀렉터. |

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_contentLoaded` | `Map<tabid: string, content: string>` | lazy 로드 캐시. `_setSelectedTab` 가 `has(tabid)` 로 fetch 결정. `_renderTabContent` 가 `set(tabid, content)`. `_clearTabContent` 가 `delete(tabid)` / `clear()`. 새 batch 시 `_renderItems` 가 미존재 tabid 의 캐시를 제거. |
| `_currentActiveTabid` | `string \| null` | 현재 활성 tabid 추적. `_setSelectedTab` prev/curr 결정 + `_renderItems` 후 초기 panel 표시 결정에 사용. |
| `_tabIds` | `Set<string>` | 현재 batch 의 tabid set. `_contentLoaded` 재정렬 + `_clearTabContent({all:true})` panel `data-loaded` 토글 시 사용. |
| `_lzSelectors` | `object` | lazyContent 전용 보조 selector(`root: '.tabs-lz'`, `bar: '.tabs-lz__bar'`). cssSelectors 에 등록되지 않은 내부 매핑. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `tabsItems`        | `this._renderItems`     | `[{ tabid, icon, label, badge, active }]` — 새 batch (탭 strip + panel shells 전체 replace + `_contentLoaded` 재정렬). active 탭 결정 후 lazy load 트리거 가능. |
| `tabItems`         | `this._renderItems`     | Standard 호환 별칭 — 동일 페이로드. |
| `setSelectedTab`   | `this._setSelectedTab`  | `{ tabid: 'overview' }` — 외부 active 강제 전환. 동일 tabid 재요청은 멱등(no emit). 캐시 미존재 시 `@contentRequested` 발행. |
| `setTabContent`    | `this._renderTabContent`| `{ tabid: 'overview', content: '...' }` — lazy 응답. panel body 텍스트 매핑 + `_contentLoaded` 캐시 + `data-loaded="true"` + `@contentRendered` emit. |
| `clearTabContent`  | `this._clearTabContent` | `{ tabid: 'overview' }` 또는 `{ all: true }` — 캐시 무효화. 다음 활성화 시 재요청. |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `tabid` (ListRender — `.tabs-lz__item`) | 탭 본체 클릭 | `@tabClicked` (Standard 호환 — `{ targetInstance, event }`). |

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@tabSelected`      | `_setSelectedTab` 가 활성 전환을 완료한 직후 1회 | `{ targetInstance, tabid, cached: boolean }` |
| `@contentRequested` | `_setSelectedTab` 가 캐시 미존재(`!_contentLoaded.has(tabid)`) 결정 시 1회 | `{ targetInstance, tabid }` |
| `@contentRendered`  | `_renderTabContent` 가 panel body 매핑 + 캐시 갱신 직후 1회 | `{ targetInstance, tabid }` |

> **이벤트 분리 이유**: bindEvents 위임은 `{ targetInstance, event }` 만 전달 → tabid 가 없다. lazyContent 는 페이지가 (a) 어떤 탭의 콘텐츠를 fetch 해야 하는지 즉시 알아야 하고(`@contentRequested.tabid`), (b) 응답이 적용되었음을 확인해야 하며(`@contentRendered.tabid` — 분석 트래킹/스피너 종료), (c) active 전환이 캐시 hit 였는지 알면 lazy 비율 계산 가능(`@tabSelected.cached`). 명시 payload 채택. `@tabClicked` 위임 발행은 Standard 호환 + 사용자 액션 채널로 분리.

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderItems({ response })` | `({response}) => void` | `tabsItems` / `tabItems` 핸들러. (1) 페이로드 배열을 ListRender selectorKEY(`tabid`/`active`/`icon`/`label`/`badge`)에 맞게 String 변환 후 `listRender.renderData` 호출. (2) `_renderPanelShells(items)` 로 panel shells 새로 그리기. (3) `_tabIds` Set 새 batch 로 교체. (4) `_contentLoaded` 의 미존재 tabid 캐시 제거. (5) `_currentActiveTabid` 갱신 + active 탭 panel 즉시 표시. (6) active 탭 캐시 미존재 시 `@contentRequested { tabid }` 1회 발행. |
| `_renderPanelShells(items)` | `(Array) => void` | `.tabs-lz__panels` 비움 → items 마다 `#tabs-lz-panel-template` cloneNode → `data-panel-tabid` + `data-active` + `data-loaded="false"` 세팅 → panels 영역 append. 이미 캐시된 tabid 는 panelBody 텍스트도 즉시 채우고 `data-loaded="true"`. |
| `_renderTabContent({ response })` | `({response}) => void` | `setTabContent` 핸들러. `response = { tabid, content }`. 매칭 panel 의 `.tabs-lz__panel-body` textContent 매핑 + `data-loaded="true"` + `_contentLoaded.set(tabid, content)`. `@contentRendered { tabid }` emit. |
| `_setSelectedTab({ response })` | `({response}) => void` | `setSelectedTab` 핸들러. 본체 click 시에도 페이지가 publish 가능. `response = { tabid }`. 현재 active 탭 탐색(`_currentActiveTabid` 또는 DOM) → `updateItemState(prev, {active:'false'})` + `updateItemState(curr, {active:'true'})` → `_showPanel(curr)` (panel data-active 토글) → `_currentActiveTabid` 갱신 → 캐시 결정: `has(curr)` 면 `cached=true`, 아니면 `@contentRequested { tabid }` 발행 + `cached=false`. `@tabSelected { tabid, cached }` emit. 동일 tabid 재요청은 멱등(no emit). |
| `_clearTabContent({ response })` | `({response}) => void` | `clearTabContent` 핸들러. `response = { tabid }` 또는 `{ all: true }`. 단일: `_contentLoaded.delete(tabid)` + 매칭 panel `data-loaded="false"` + panel body textContent 비움. all: `_contentLoaded.clear()` + 모든 panel `data-loaded="false"` + body 비움. emit 없음(silent). 다음 활성화 시 재요청. |
| `_showPanel(tabid)` | `(string) => void` | 모든 panel 의 `data-active` false → 매칭 panel `data-active="true"`. tabid null/empty/미존재 시 모든 panel 비활성화. |
| `_findCurrentActiveTabid()` | `() => string \| null` | DOM 에서 `.tabs-lz__item[data-active="true"]` 의 `data-tabid` 반환. 없으면 null. `_currentActiveTabid` 가 null 이거나 신뢰 어려울 때 폴백. |

### 페이지 연결 사례

```
[페이지 — 분석 대시보드 / 관리 콘솔 / 상세 페이지 / 인스펙터]
    │
    └─ fetchAndPublish('tabsItems', this) 또는 직접 publish
        payload 예: [
          { tabid: 'overview', icon: 'dashboard', label: 'Overview', badge: '',  active: 'true'  },
          { tabid: 'sales',    icon: 'trending_up', label: 'Sales',  badge: '',  active: 'false' },
          { tabid: 'logs',     icon: 'description', label: 'Logs',   badge: '12',active: 'false' },
          { tabid: 'geo',      icon: 'public',     label: 'Geo',     badge: '',  active: 'false' },
          { tabid: 'audit',    icon: 'verified',   label: 'Audit',   badge: '!', active: 'false' }
        ]

[Tabs/Advanced/lazyContent]
    ├─ ListRender 가 5개 .tabs-lz__item 을 strip 에 렌더
    ├─ _renderPanelShells 가 5개 .tabs-lz__panel 을 panels 영역에 렌더 (전부 data-loaded="false")
    ├─ active 탭(overview) panel 만 data-active="true"
    ├─ _contentLoaded.has('overview') === false → @contentRequested { tabid: 'overview' }
    └─ 페이지가 fetch + publish('setTabContent', { tabid: 'overview', content: '...' })

[Tabs/Advanced/lazyContent — setTabContent 수신]
    ├─ _renderTabContent → panel body 매핑 + data-loaded="true" + _contentLoaded.set('overview', content)
    └─ @contentRendered { tabid: 'overview' }

[사용자가 'sales' 탭 본체 클릭 — 미캐시]
    ├─ bindEvents 위임 → @tabClicked { event, targetInstance }
    └─ 페이지 핸들러: instance._setSelectedTab({ response: { tabid: 'sales' } })

[Tabs/Advanced/lazyContent — _setSelectedTab('sales')]
    ├─ updateItemState('overview', {active:'false'}) + updateItemState('sales', {active:'true'})
    ├─ _showPanel('sales') → panel data-active 토글
    ├─ _contentLoaded.has('sales') === false → @contentRequested { tabid: 'sales' }
    ├─ @tabSelected { tabid: 'sales', cached: false }
    └─ 페이지: fetch + publish('setTabContent', { tabid:'sales', content:'...' }) → @contentRendered

[사용자가 'overview' 다시 클릭 — 캐시 hit]
    ├─ _setSelectedTab('overview')
    ├─ _showPanel('overview') (즉시 표시 — body 텍스트 그대로)
    ├─ _contentLoaded.has('overview') === true → @contentRequested 발행 안 함
    └─ @tabSelected { tabid: 'overview', cached: true }

[외부 clearTabContent { tabid: 'logs' } publish — logs 캐시 무효화]
    └─ panel data-loaded="false" + body 비움 + _contentLoaded.delete('logs')
       → 다음에 logs 활성화 시 @contentRequested 재발행

운영: this.pageDataMappings = [
        { topic: 'tabsItems',        datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setSelectedTab',   datasetInfo: {...}, refreshInterval: 0 },   // 선택
        { topic: 'setTabContent',    datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'clearTabContent',  datasetInfo: {...}, refreshInterval: 0 }    // 선택
      ];
      Wkit.onEventBusHandlers({
        '@tabClicked':       ({ event, targetInstance }) => {
                               const tabid = event.target.closest('.tabs-lz__item')?.dataset.tabid;
                               if (tabid) targetInstance._setSelectedTab({ response: { tabid } });
                             },
        '@tabSelected':      ({ tabid, cached })          => { /* 라우팅 / 분석 트래킹 */ },
        '@contentRequested': ({ tabid, targetInstance })  => {
                               // 페이지가 fetch 후 publish
                               fetchTabData(tabid).then(content =>
                                 GlobalDataPublisher.subscribe ? null /* 직접 publish */ : null
                               );
                             },
        '@contentRendered':  ({ tabid })                  => { /* 스피너 종료 / 트래킹 */ }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | tab strip + panel 시각 차별화 (active indicator · panel 배경 · loading state) | 도메인 컨텍스트 예 |
|------|---------|----------------------------------------------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 그라디언트 / Pretendard / 16px 모서리. tab: 하단 4px pill indicator(시안→퍼플 그라디언트). panel: rgba(80,46,233,0.06) bg + 16px 패딩 + scroll. loading: 점선 박스 + "콘텐츠 로딩 중..." Pretendard. | **분석 대시보드 5탭** (Overview / Sales / Logs / Geo / Audit — 비싼 차트는 활성 탭만 fetch + 캐시) |
| `02_material`    | B: Material Elevated | 라이트 / elevation shadow / Roboto / 12px 모서리. tab: 3px bottom indicator + divider. panel: 흰 surface + Material elevation 1 + 16px padding. loading: 가로 1px Material progress bar + "Loading…" Roboto. | **관리 콘솔 5탭** (Users / Devices / Policies / Audit / Settings — 사용자 자주 가는 탭만 hit) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 / DM Serif Display 라벨 / 0~2px 모서리 + 큰 여백. tab: 하단 2px 얇은 indicator. panel: faint warm bg + 24px padding + serif 본문. loading: "(Loading the page…)" DM Serif italic. | **상세 페이지 5탭** (Detail / Activity / Notes / Files / Permissions — 첨부 큰 콘텐츠 lazy) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 시안 / IBM Plex Mono / 각진 2px 모서리. tab: 각진 2px bottom indicator + tabular-nums badge. panel: #161b22 surface + 1px 시안 보더 + 12px padding. loading: ">> WAITING…" Mono blink. | **편집 도구 인스펙터 5탭** (Properties / Styles / Events / Bindings / Output — 비싼 컴퓨테이션 lazy) |

각 페르소나는 panel 의 `[data-active="true"]` / `[data-loaded="true"]` / `[data-loaded="false"]` 3상태를 시각적으로 분리. loading 표시는 panel body 의 `:empty` 또는 `[data-loaded="false"]` 셀렉터로 페르소나별 분기.

### 결정사항

- **prefix `.tabs-lz__*`** — Standard `.tabs__*` / scrollable `.tabs-sc__*` / closable `.tabs-cl__*` / draggableReorder `.tabs-dr__*` 와 분리(같은 페이지 공존 시 CSS 충돌 X).
- **2 토픽 동시 구독(`tabsItems` + `tabItems`)** — Advanced 변형은 큐 설명대로 `tabsItems` 토픽 권장이지만, Standard 호환을 위해 `tabItems` 도 구독. 페이지가 둘 중 하나로 publish 해도 동작 (closable / scrollable 답습).
- **`_contentLoaded: Map<tabid, content>` Map (Set 아님)** — 단순히 "로드되었는지" 가 아니라 "재방문 시 즉시 표시" 가 lazyContent 의 핵심 가치. content 자체를 캐시. Map 메모리 비용은 페이지 라이프사이클(컴포넌트 destroy 시 GC)로 한정.
- **panel shells 미리 생성** — active 탭만 표시하고 나머지는 hidden(`data-active="false"`) — DOM 엘리먼트는 미리 N 개 만들어 둠. 새 batch 마다 panel shells 재생성. 큰 콘텐츠는 panel body 만 lazy 채워짐.
- **active 탭 캐시 미존재 시 자동 lazy 트리거** — `_renderItems` 직후 + `_setSelectedTab` 둘 다에서 `has` 체크 후 미존재면 `@contentRequested` 발행. 페이지가 응답하지 않으면 panel 이 `data-loaded="false"` 로 남아 loading indicator 노출.
- **`@contentRequested` 는 emit 만, 실제 fetch 는 페이지 책임** — 컴포넌트는 직접 fetch 하지 않는다(SHARED 금지 사항). 페이지가 핸들러에서 `fetchAndPublish` 또는 직접 publish.
- **`@tabSelected.cached` 명시** — 페이지가 lazy hit 비율을 트래킹 가능. `cached:true` 면 캐시 hit, `false` 면 `@contentRequested` 동반 발행.
- **`clearTabContent { all: true }`** — refresh 시나리오 (사용자가 데이터 새로고침 버튼 클릭) — 모든 캐시 무효화 + 다음 활성화 시 재요청. 단일 tabid clear 도 지원.
- **`@contentRendered` 별도 emit** — `setTabContent` 수신 후 panel body 매핑 직후. 페이지가 스피너 종료 / 트래킹 / "다음 화면 진입" 가드에 사용. content 자체는 emit payload 에서 제외(payload 가벼움 유지 + 페이지가 이미 보유).
- **`_currentActiveTabid` self-tracking + DOM 폴백** — `_setSelectedTab` 가 prev/curr 결정 시 self field 우선, 없으면 `_findCurrentActiveTabid` 로 DOM 조회. 새 batch 시 `_renderItems` 가 active 데이터에서 갱신.
- **신규 Mixin 생성 금지** — ListRenderMixin + 자체 메서드 7종으로 완결.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions / customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서 (customEvents 제거 → 구독 해제 → 자체 상태/메서드 null + listRender.destroy)
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Tabs/Advanced/lazyContent/preview/...html` → `../`를 5번 = closable 동일 verbatim 복사)
