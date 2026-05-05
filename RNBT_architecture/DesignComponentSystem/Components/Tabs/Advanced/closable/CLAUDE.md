# Tabs — Advanced / closable

## 기능 정의

1. **탭 항목 렌더링 (Standard 호환)** — `tabsItems` 토픽으로 수신한 배열(`[{ tabid, icon, label, badge, active }]`)을 ListRenderMixin 의 `<template>` cloneNode 로 N 개 탭을 렌더링하고, 개별 탭의 활성 상태(`active`)를 관리한다. ListRender selectorKEY 5종(tabid/active/icon/label/badge + container/template) + 신규 `closeBtn` KEY 1종 추가. Standard 의 `tabItems` 토픽도 별칭으로 동시 구독(호환).
2. **× (close) 버튼 클릭 시 즉시 제거** — 각 탭 우측에 `.tabs-cl__close` × 버튼을 두고, 컨테이너 native click delegator 가 `e.target.closest(closeBtn)` 매칭 시 해당 탭을 즉시 DOM 에서 분리하고 인스턴스 자체 상태(`_tabs: Map<tabid, {label, active}>`)에서도 제거한다. 본체(라벨 영역) 클릭과는 명확히 구별되며 — × 영역 매칭이 우선이고 본체 영역(`tabid`) 매칭은 그 다음. 본체 클릭은 Standard 호환 `@tabClicked` 위임 발행.
3. **active tab 제거 시 자동 이전** — 제거 대상이 현재 active 탭(`data-active="true"`) 이면 다음 형제(없으면 이전 형제)를 새 active 로 자동 승격하고 ListRender `updateItemState(newId, { active:'true' })` 적용 + `@tabSelected { tabid }` 발행. 형제가 없으면(마지막 탭 제거) `newActiveTabId` 는 null 로 발행하고 active 전환 없음.
4. **Remove 이벤트 발행 — `@tabClosed`** — × 클릭 또는 외부 토픽(`closeTab`) 으로 탭이 제거되면 `@tabClosed` 명시 payload 발행. payload: `{ targetInstance, tabid, label, removedAt: ISO, remainingTabIds: [...], newActiveTabId: string|null }`. `removedAt` 은 ISO 타임스탬프, `remainingTabIds` 는 제거 이후 전체 tabid 배열(페이지가 backend / route 동기화 즉시 사용 가능), `newActiveTabId` 는 active 자동 이전 결과(없으면 null).
5. **외부 publish 로 추가/제거/일괄 갱신/명시 active 전환** — 4 토픽 동시 구독:
   - `tabsItems` (전체 batch — 이전 탭 제거 후 다시 렌더 + `_tabs` Map 새 진실로 교체)
   - `tabItems` (Standard 호환 별칭 — 동일 페이로드)
   - `setSelectedTab` (`{ tabid }` — 외부 active 강제 전환, 동일 tabid 재요청은 멱등 no emit)
   - `closeTab` (`{ tabid }` — 외부에서 탭 제거 트리거 — × 클릭과 동일하게 `@tabClosed` 발행 + active 자동 이전)

> **Standard 와의 분리 정당성 (6축)**:
> - **새 cssSelectors KEY 1종 — `closeBtn`** — `.tabs-cl__close` (× 버튼 영역, 이벤트 매핑/분기 전용 — 데이터 바인딩 X). Standard 는 `closeBtn` 없음.
> - **새 자체 상태 3종** — `_tabs: Map<tabid, {label, active}>` (탭 set 진실 소스 + active 추적), `_clickHandler: function|null` (컨테이너 click delegator bound ref — beforeDestroy 정확 제거용), `_clSelectors: object` (closable 전용 보조 selector — root). Standard 는 stateless.
> - **자체 메서드 6종** — `_renderItems` / `_handleClick` / `_closeTab` / `_setSelectedTab` / `_findNextActiveAfterClose` / `_extractRemainingIds`. Standard 는 자체 메서드 0종.
> - **HTML 구조 변경 — 각 탭 우측에 `.tabs-cl__close` × 버튼 추가** — Standard template 은 `[icon|label|badge|indicator]` 만. closable template 은 `[icon|label|badge|close]` + indicator. 클래스 prefix `.tabs-cl__*` 로 Standard(`.tabs__*`) / scrollable(`.tabs-sc__*`) 와 분리.
> - **새 토픽 2종** — `setSelectedTab` (`{ tabid }`), `closeTab` (`{ tabid }`). Standard 는 `tabItems` 1종만 구독.
> - **새 이벤트 2종** — `@tabClosed` (명시 payload — `tabid` + `label` + `removedAt` + `remainingTabIds` + `newActiveTabId`), `@tabSelected` (active 자동 이전 통보). `@tabClicked` 위임 발행은 Standard 호환 유지.
>
> 위 6축은 동일 register.js 로 표현 불가 → Standard 내부 variant 로 흡수 불가.

> **Tabs/Advanced/scrollable 직전 + Chips/Filter/Advanced/removable 답습**: register.js top-level 평탄 작성, 자체 상태/메서드/이벤트/토픽 분리, preview `<script src>` 5단계 깊이 verbatim 복사, demo-label/hint 에 변형 의도 + 도메인 컨텍스트 명시. scrollable 의 native 컨테이너 listener 패턴(`_clickHandler` bound ref + addEventListener) + removable 의 두 영역(× / 본체) 분기 click delegator + `_extractRemainingIds` Map.keys 추출 + 명시 payload `removedAt` ISO 패턴 동일 차용. ListRender selectorKEY 호환(`tabid`/`active`/`icon`/`label`/`badge` + `container`/`template`) 으로 Standard 디자인 토큰 재사용 + `closeBtn` 단일 KEY 추가.

> **다른 Tabs Advanced(scrollable / draggableReorder / lazyContent) 와의 직교성**: closable = 항목 제거(데이터 진실), scrollable = overflow 가시성(viewport 진실), draggableReorder = 항목 순서(순서 진실), lazyContent = 콘텐츠 로딩(콘텐츠 진실). 네 변형 모두 서로 다른 축. 동일한 ListRenderMixin 토대 + Standard 호환 KEY(`tabid`/`active`/`icon`/`label`/`badge`) 공유. (양립 시 prefix 가 다르므로 페이지 내 공존 가능 — `.tabs-cl__*` ↔ `.tabs-sc__*` ↔ `.tabs-dr__*` ↔ `.tabs-lz__*`.)

> **MD3 / 도메인 근거**: MD3 Tabs spec 자체에는 closable 변형이 명시되지 않으나, 모든 모던 다중 문서/세션/세그먼트 UI 가 채택하는 사실상 표준 패턴 (VSCode/Chrome/Figma/IntelliJ 다중 문서 탭, Postman/Insomnia 다중 요청 탭, Slack 다중 DM 탭 등). 실사용: ① **편집 도구 다중 문서 탭** (file-01 ~ file-N — 닫기 버튼 표준), ② **운영 콘솔 다중 세션** (session-01~N — 사용자가 임의 종료), ③ **분석 대시보드 ad-hoc 보고서 탭** (사용자 생성 보고서 — 닫기로 정리), ④ **chat 도구 다중 대화** (대화방 탭 — 닫기 시 대화 종료/숨김).

---

## 구현 명세

### Mixin

ListRenderMixin (탭 데이터 렌더링 — Mixin 은 close/제거 인지 X) + 자체 메서드 6종(`_renderItems` / `_handleClick` / `_closeTab` / `_setSelectedTab` / `_findNextActiveAfterClose` / `_extractRemainingIds`) + 자체 상태 `_tabs: Map<tabid, {label, active}>`.

> **신규 Mixin 생성 금지** — 큐 설명에 "× 버튼 + closeBtn selector + @tabClosed" 명시. SKILL 규칙상 본 루프에서 새 Mixin 을 만들지 않는다. ListRenderMixin 은 탭 배열을 받아 N 개 탭을 렌더하고(close 인지 X), × 영역 분기 · DOM detach · active 자동 이전 · 명시 emit 은 컴포넌트 자체 메서드가 전담.

### cssSelectors (ListRenderMixin)

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.tabs-cl__list` | 탭이 추가될 부모 (ListRenderMixin 규약). |
| template  | `#tabs-cl-item-template` | `<template>` cloneNode 대상 (ListRenderMixin 규약). |
| tabid     | `.tabs-cl__item` | 탭 식별 + 본체 클릭 위임 (data-tabid). |
| active    | `.tabs-cl__item` | 활성 상태 (data-active). |
| icon      | `.tabs-cl__icon` | 아이콘 표시 (Material Symbols 등). |
| label     | `.tabs-cl__label` | 라벨 텍스트. |
| badge     | `.tabs-cl__badge` | 뱃지 텍스트 (빈 값이면 `:empty` 로 숨김). |
| closeBtn  | `.tabs-cl__close` | × 버튼 — click delegator 분기 영역 (이벤트 매핑/분기 전용, 데이터 바인딩 X). |

> **closable 전용 보조 selector(자체 메서드 전담)**: `.tabs-cl`(루트) 는 cssSelectors KEY 로 등록하지 않고 `_clSelectors.root` 로만 보관 — ListRender 가 직접 데이터 바인딩하지 않으며 자체 메서드(`_handleClick` 컨테이너 매칭)가 전담.

### itemKey (ListRender)

`tabid` — `updateItemState(tabid, { active })` 활용.

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| tabid  | `tabid`  | 탭 식별 — `closest('.tabs-cl__item')?.dataset.tabid` 로 추출. |
| active | `active` | 활성 상태 — `[data-active="true"]` CSS 셀렉터. |

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_tabs` | `Map<tabid: string, {label: string, active: 'true'\|'false'}>` | 현재 렌더된 탭 set 의 진실 소스. `_renderItems` 가 새 batch 로 교체, `_closeTab` / `_setSelectedTab` 이 단일 변경. `remainingTabIds` 추출 시 `Map.keys()` 사용. |
| `_clickHandler` | `function \| null` | 컨테이너 click delegator 의 bound handler 참조 — beforeDestroy 에서 정확히 removeEventListener. |
| `_clSelectors` | `object` | closable 전용 보조 selector(`root: '.tabs-cl'`). cssSelectors 에 등록되지 않은 내부 매핑. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `tabsItems`      | `this._renderItems`     | `[{ tabid, icon, label, badge, active }]` — 새 batch (탭 전체 replace). `_tabs` Map 도 새 진실로 교체. |
| `tabItems`       | `this._renderItems`     | Standard 호환 별칭 — 동일 페이로드. |
| `setSelectedTab` | `this._setSelectedTab`  | `{ tabid: 'file-03' }` — 외부 active 강제 전환. 동일 tabid 재요청은 멱등(no emit). |
| `closeTab`       | `this._closeTab`        | `{ tabid: 'file-03' }` — 외부에서 탭 제거 트리거 (× 클릭과 동일하게 `@tabClosed` 발행 + active 자동 이전). |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `tabid` (ListRender — `.tabs-cl__item`) | 탭 본체 클릭 (× 영역 외) | `@tabClicked` (Standard 호환 — `{ targetInstance, event }`). |

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@tabClosed`   | × 클릭 또는 `closeTab` 토픽으로 탭 제거 직후 1회 | `{ targetInstance, tabid, label, removedAt: ISO, remainingTabIds: [...], newActiveTabId: string\|null }` |
| `@tabSelected` | `_setSelectedTab` 가 활성 전환을 완료한 직후 1회 + `_closeTab` 으로 active 자동 이전이 발생한 직후 1회 | `{ targetInstance, tabid }` |

> **이벤트 분리 이유**: bindEvents 위임은 `{ targetInstance, event }` 만 전달 → tabid + remainingTabIds + newActiveTabId 가 없다. closable 은 페이지가 매번 DOM 을 다시 스캔하지 않고도 어떤 탭이 닫혔는지 / 다음 active 가 누구인지 / 남은 탭 목록을 바로 받을 수 있어야 하므로(예: route 동기화, backend persist, 콘텐츠 뷰 전환) 명시 payload 채택. `@tabClicked` 위임 발행은 Standard 호환 + 사용자 액션 채널로 분리.

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderItems({ response })` | `({response}) => void` | `tabsItems` / `tabItems` 핸들러. 페이로드 배열을 ListRender selectorKEY(`tabid`/`active`/`icon`/`label`/`badge`)에 맞게 String 변환 후 `listRender.renderData` 호출. `_tabs` Map 을 새 batch 로 교체. |
| `_handleClick(e)` | `(MouseEvent) => void` | 컨테이너 native click delegator. (1) `e.target.closest(closeBtn)` 매칭 시 → `_closeTab(tabid)` 호출 (× 영역 우선). (2) 그 외 본체 영역 클릭은 bindEvents 위임이 `@tabClicked` 를 처리하므로 native delegator 는 no-op. |
| `_closeTab({ response }, source)` | `({response}, source?) => void` | `closeTab` 핸들러 + native delegator 호출 양쪽 지원. tabid 매칭 시 active 였으면 `_findNextActiveAfterClose` 로 다음 active 결정 → `_tabs.delete` + DOM 항목 detach → 새 active 로 `updateItemState` (`@tabSelected` 발행 — active 자동 이전 시) → `@tabClosed` 명시 payload 발행. |
| `_setSelectedTab({ response })` | `({response}) => void` | `setSelectedTab` 핸들러. `response = { tabid }`. 현재 active 탭 탐색 → `updateItemState(prev, {active:'false'})` + `updateItemState(curr, {active:'true'})` → `_tabs` Map 의 active 동기화 → `@tabSelected { tabid }` emit. 동일 tabid 재요청은 멱등(no emit). |
| `_findNextActiveAfterClose(closingId)` | `(string) => string \| null` | `closingId` 가 active 일 때 호출. DOM 순서 기준 다음 형제 `.tabs-cl__item` 의 `data-tabid`(없으면 이전 형제)를 반환. 형제가 없으면 null. |
| `_extractRemainingIds()` | `() => string[]` | `_tabs` Map 의 keys 배열 반환 — `@tabClosed` payload 의 `remainingTabIds` 산출용. |

### 페이지 연결 사례

```
[페이지 — 다중 문서 편집 / 다중 세션 / ad-hoc 보고서 / 다중 대화]
    │
    └─ fetchAndPublish('tabsItems', this) 또는 직접 publish
        payload 예: [
          { tabid: 'file-01', icon: 'description', label: 'main.js',     badge: '',  active: 'true'  },
          { tabid: 'file-02', icon: 'description', label: 'utils.js',    badge: '*', active: 'false' },
          { tabid: 'file-03', icon: 'description', label: 'app.css',     badge: '',  active: 'false' },
          { tabid: 'file-04', icon: 'description', label: 'index.html',  badge: '',  active: 'false' },
          { tabid: 'file-05', icon: 'description', label: 'README.md',   badge: '',  active: 'false' }
        ]

[Tabs/Advanced/closable]
    ├─ ListRender 가 5개 .tabs-cl__item 을 렌더 (각 우측에 .tabs-cl__close 버튼)
    ├─ _tabs Map: { 'file-01'→{label:'main.js',active:'true'}, ... }
    └─ 컨테이너 single click delegator 부착

[× 클릭 — 'file-02' 제거 (active 가 아닌 탭)]
    ├─ _handleClick → e.target.closest('.tabs-cl__close') 매칭 → _closeTab('file-02')
    ├─ _tabs.delete('file-02') + DOM detach
    └─ @tabClosed { tabid:'file-02', label:'utils.js', removedAt:'...', remainingTabIds:[...4개...], newActiveTabId:null }

[× 클릭 — 'file-01' 제거 (active 탭)]
    ├─ _handleClick → _closeTab('file-01')
    ├─ _findNextActiveAfterClose('file-01') → 'file-02' (다음 형제)
    ├─ updateItemState('file-02', {active:'true'}) + _tabs 의 active 동기화
    ├─ DOM detach('file-01')
    ├─ @tabSelected { tabid:'file-02' }   (active 자동 이전)
    └─ @tabClosed { tabid:'file-01', label:'main.js', removedAt:'...', remainingTabIds:['file-02','file-03',...], newActiveTabId:'file-02' }

[탭 본체 클릭 — 'file-03' (× 영역 외)]
    └─ bindEvents 위임 → @tabClicked { event, targetInstance }
        페이지 핸들러: instance._setSelectedTab({ response: { tabid: 'file-03' } })
        → _setSelectedTab → updateItemState 활성 전환 + @tabSelected { tabid:'file-03' }

[외부 closeTab publish — 'file-04']
    └─ _closeTab → DOM detach + @tabClosed (× 클릭과 동일 시그널)

운영: this.pageDataMappings = [
        { topic: 'tabsItems',      datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setSelectedTab', datasetInfo: {...}, refreshInterval: 0 },   // 선택
        { topic: 'closeTab',       datasetInfo: {...}, refreshInterval: 0 }    // 선택
      ];
      Wkit.onEventBusHandlers({
        '@tabClicked':  ({ event, targetInstance }) => {
                          const tabid = event.target.closest('.tabs-cl__item')?.dataset.tabid;
                          if (tabid) targetInstance._setSelectedTab({ response: { tabid } });
                        },
        '@tabSelected': ({ tabid })                                  => { /* 라우팅 / 콘텐츠 뷰 전환 */ },
        '@tabClosed':   ({ tabid, remainingTabIds, newActiveTabId }) => { /* persist / route 동기화 */ }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | × 버튼 시각 차별화 (영역/hover/위치) | 도메인 컨텍스트 예 |
|------|---------|-------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 그라디언트 / Pretendard / 16px 모서리. × 영역: 18px 원형 hover 배경(시안 12%) + ✕ Pretendard 12px. hover 시 배경 + scale(1.1) 220ms cubic. 활성 탭은 하단 4px pill indicator(시안→퍼플 그라디언트). | **운영 콘솔 — 다중 세션 5~8개 탭** (Session-Seoul/Busan-NN, badge=알람 카운트, 임의 종료 가능) |
| `02_material`    | B: Material Elevated | 라이트 / elevation shadow / Roboto / 12px 모서리. × 영역: 24px 원형 ripple 배경(rgba blue 8%) + Material `close` 16px. 활성 탭은 3px bottom indicator + 하단 divider. | **CRM — ad-hoc 고객 보고서 탭 6개** (사용자 생성 — 닫기 버튼으로 정리) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 / DM Serif Display 라벨 / 0~2px 모서리 + 큰 여백. × 영역: 12px 점선 underline ✕ + hover 시 색상 진해짐. 활성 탭 하단 2px 얇은 indicator. | **편집 도구 — 매거진 ad-hoc 카드 탭 5개** (사용자가 동시 작업하는 카드 — 닫기로 정리) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 시안 / IBM Plex Mono / 각진 2px 모서리. × 영역: 명시적 사각 16px hover 시안 배경 + Mono ✕ 12px. 활성 탭 각진 2px bottom indicator + tabular-nums badge. | **편집 도구 — 다중 문서 탭 8~12개** (file-01.json ~ file-NN.json — 닫기로 세션 정리) |

각 페르소나는 `.tabs-cl__item:hover .tabs-cl__close` 셀렉터로 호버 시 × 영역을 강조하지만, persona 03(editorial)은 항상 노출이 더 자연스러운 톤. × 의 시각적 위상은 페르소나별로 분기.

### 결정사항

- **prefix `.tabs-cl__*`** — Standard `.tabs__*` / scrollable `.tabs-sc__*` / draggableReorder `.tabs-dr__*` / lazyContent `.tabs-lz__*` 와 분리(같은 페이지 공존 시 CSS 충돌 X).
- **2 토픽 동시 구독(`tabsItems` + `tabItems`)** — Advanced 변형은 큐 설명대로 `tabsItems` 토픽 권장이지만, Standard 호환을 위해 `tabItems` 도 구독. 페이지가 둘 중 하나로 publish 해도 동작 (scrollable 답습).
- **× 영역 우선 매칭**: 컨테이너 단일 native delegator + `closest(closeBtn)` 우선 → tabid 매칭은 `bindEvents` 위임이 처리 (이중 emit 방지). bindEvents 의 `click@tabid` 위임은 본체/× 구분 없이 모든 탭 클릭을 잡으므로, 페이지 핸들러가 `@tabClicked` 에서 `e.target.closest('.tabs-cl__close')` 가 있으면 무시하는 가드를 하거나, register.js 의 native delegator 가 × 클릭 시 `e.stopPropagation()` 또는 별도 처리. 본 컴포넌트는 **native delegator 가 × 영역 우선 매칭 + `_closeTab` 호출 후 `e.stopPropagation()` 으로 본체 위임을 차단**한다 — bindEvents 위임은 전혀 발화하지 않음. 페이지 가드 불필요.
- **active tab 제거 시 자동 이전 — 다음 형제 우선, 없으면 이전 형제** — VSCode/Chrome 다중 문서 탭 관례. DOM 순서를 진실로 사용 (좌→우). 마지막 탭 1개일 때 제거하면 `newActiveTabId = null`.
- **`_tabs: Map<tabid, {label, active}>`** — Set 이 아닌 Map (label 보존이 `@tabClosed.label` payload 에 필요). active 도 함께 추적하여 `_setSelectedTab` 동기화 + `_findNextActiveAfterClose` 의 active 재확인 비용 감소.
- **`removedAt: ISO`** — removable 답습. 페이지가 backend 동기화 / 분석 트래킹 시 timestamp 즉시 사용 가능.
- **`remainingTabIds` 명시 payload** — 페이지가 매번 DOM 재스캔하지 않도록. removable 답습.
- **`newActiveTabId`** — closable 고유. active 자동 이전 결과를 명시 payload 로 — 페이지가 콘텐츠 뷰 전환 / route 동기화에 즉시 활용. null 이면 active 없음.
- **신규 Mixin 생성 금지** — ListRenderMixin + 자체 메서드 6종으로 완결.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions / customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서 (컨테이너 native click delegator remove → customEvents 제거 → 구독 해제 → 자체 상태/메서드 null + listRender.destroy)
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Tabs/Advanced/closable/preview/...html` → `../`를 5번 = scrollable 동일 verbatim 복사)
