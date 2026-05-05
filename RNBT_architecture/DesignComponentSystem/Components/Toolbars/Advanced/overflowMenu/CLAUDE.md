# Toolbars — Advanced / overflowMenu

## 기능 정의

1. **액션 항목 렌더링 (Standard 호환)** — `toolbarItems` 토픽으로 수신한 배열을 ListRender 가 직접 표시 영역(`.toolbar-om__visible`)에 N 개 렌더한다. ListRender selectorKEY 5종(`itemid`/`disabled`/`icon`/`label`/`kind` + `container`/`template`)은 Standard(`actionid`/`disabled`/`icon`/`label`)과 호환 + 큐 설명 표기인 `itemid`/`kind`(action|divider) 추가. `priority` 필드 옵션으로 우선순위 높은 액션은 마지막에 overflow.
2. **overflow 자동 감지** — `ResizeObserver` 가 root container(`.toolbar-om`)의 `clientWidth` 와 액션 합산 너비를 비교. 공간이 부족하면 가장 우측(낮은 priority)부터 ⋯(more) 버튼 안 popup 메뉴로 이동. overflow 가 없으면 ⋯ 버튼 자체를 숨김(`data-has-overflow="false"`). 컴포넌트 너비 변경, 액션 추가/제거, 폰트 로딩 등 모든 시점 자동 반응.
3. **⋯ more 버튼 + popup toggle** — ⋯ 버튼 클릭 시 popup 메뉴를 open/close 토글. popup 은 자체 absolute-position 영역(`.toolbar-om__popup`)으로 root 안에 위치. open 시 `data-popup-open="true"` 속성으로 표시 + outside click(document) 또는 popup 항목 클릭 또는 Escape 키로 close. open 시 `@overflowOpened` / close 시 `@overflowClosed` 발행.
4. **양 채널 통합 클릭 이벤트** — 직접 보이는 `.toolbar-om__action` 클릭 → `@toolbarItemClicked { itemid, fromOverflow:false }`. popup 안 `.toolbar-om__popup-item` 클릭 → 동일 이벤트 + `fromOverflow:true` + popup 자동 close. 두 채널 모두 같은 `itemid` 식별자로 페이지가 fromOverflow flag 만으로 분기 가능.
5. **분포 추적 이벤트 — `@overflowChanged`** — overflow 재계산 후 visible/overflow 분포가 변경되면 1회 `{ visibleIds, overflowIds }` 발행. 페이지가 어떤 액션이 popup 으로 밀렸는지 추적하거나 분석 트래킹에 활용.
6. **명시 데이터 갱신 — `setToolbarItems`** — `toolbarItems` 별칭. 페이지가 외부에서 액션 목록을 명시적으로 갱신할 때 같은 핸들러(`_handleSetToolbarItems`)로 라우팅. (자체 변환 후 ListRender + overflow 재계산.)

> **Standard 와의 분리 정당성**:
> - **새 자체 상태 6종** — `_resizeObserver: ResizeObserver`, `_outsideClickHandler: function`, `_keydownHandler: function`, `_omSelectors: object`, `_lastDistribution: { visibleIds, overflowIds }`, `_popupOpen: boolean`. Standard 는 stateless.
> - **자체 메서드 7종** — `_handleSetToolbarItems` / `_recalcOverflow` / `_renderOverflowItems` / `_togglePopup` / `_openPopup` / `_closePopup` / `_handleOutsideClick`. Standard 는 자체 메서드 0종.
> - **HTML 구조 변경 — popup wrapper 추가** — Standard 는 `.toolbar > .toolbar__list > .toolbar__action[]` 만. overflowMenu 는 `.toolbar-om > [.toolbar-om__visible(ListRender 대상) | .toolbar-om__more-btn | .toolbar-om__popup > .toolbar-om__popup-list]` 구조. `.toolbar-om__visible` 이 ListRender container, popup 안 항목은 자체 cloneNode 로 채움(ListRender 는 popup 인지 X). prefix `.toolbar-om__*` 로 Standard(`.toolbar__*`) 와 분리.
> - **새 토픽 1종** — `setToolbarItems` (`{ items }` payload, 명시 갱신 채널). 큐 설명대로 `toolbarItems` 토픽 권장이며 Standard 토픽(`toolbarActions`) 과 호환되지 않음 — Standard 와 다른 데이터 모델(`itemid`/`kind`/`priority`)이 필요해 별 토픽 사용.
> - **새 이벤트 4종** — `@toolbarItemClicked` (직접+popup 통합, fromOverflow flag), `@overflowChanged` (분포 변경), `@overflowOpened` / `@overflowClosed` (popup state). Standard 의 `@toolbarActionClicked` 와는 ID 키와 페이로드가 다름.
> - **ResizeObserver + outside-click document listener + keydown listener 3쌍** — overflow 자동 감지 + popup outside dismiss + Escape close. Standard 는 사용 안 함.
> - **자체 cloneNode 추가 패스** — popup 안 항목은 ListRender container 가 아닌 별도 영역에 동일 template 으로 채움. ListRender 가 한 패스만 지원하므로 popup 패스는 자체 메서드 전담.
>
> 위 6축은 동일 register.js 로 표현 불가 → Standard 내부 variant 로 흡수 불가.

> **Tabs/Advanced/scrollable 답습**: register.js top-level 평탄, 자체 상태/메서드/이벤트/토픽 분리, preview `<script src>` 5단계 깊이 verbatim 복사, demo-label/hint 도메인 컨텍스트 명시. ResizeObserver overflow 감지 패턴(`clientWidth < scrollWidth`) 와 native 컨테이너 listener (`_outsideClickHandler` bound ref + addEventListener) 패턴 동일 차용. ListRender container 만 ListRender 가 알고, 자체 보조 selector 는 `_omSelectors` 로 분리(scrollable `_scSelectors` 와 동일 패턴).

> **Menus/Standard/contextMenu 답습**: ListRender 로 메뉴 항목 렌더(template + cssSelectors), `divider`/`disabled` data 속성 패턴. popup 은 자체 메서드(ShadowPopupMixin 미사용 — 단순 absolute-positioned 영역으로 충분).

> **MD3 / 도메인 근거**: MD3 Toolbars spec 자체에는 overflow 패턴이 명시되지 않으나, Material Components for the Web(`mdc-top-app-bar` overflow), MUI Toolbar(custom overflow), Ant Design `Dropdown.Button`/`Menu` overflow, IBM Carbon `OverflowMenu`, Microsoft Fluent UI `OverflowSet`, Polaris `ActionMenu` 등 모든 대표 디자인 시스템에 동일 패턴이 존재. "공간 부족 → 우측 ⋯ 메뉴" 는 데스크톱 toolbar UX 의 보편적 관행. 실사용: ① **편집기 toolbar — Bold/Italic/Link/.../Insert** (창 너비 따라 우측 액션이 ⋯ 로 이동 — Word/Notion/Confluence), ② **데이터 그리드 액션 바** (Filter/Sort/Export/Print/Share — 좁은 화면에서 print/share overflow), ③ **모바일 웹 admin 패널** (Save/Preview/Settings/Help — viewport 따라 변동), ④ **3rd-party widget toolbar** (slide-out 패널 안에 들어갈 때 ⋯ 자동).

---

## 구현 명세

### Mixin

ListRenderMixin (`itemKey` 옵션으로 `disabled` 상태 변경 가능 — visible 영역만 렌더) + 자체 메서드 7종(`_handleSetToolbarItems` / `_recalcOverflow` / `_renderOverflowItems` / `_togglePopup` / `_openPopup` / `_closePopup` / `_handleOutsideClick`).

> **신규 Mixin 생성 금지** — 큐 설명에 "overflow detection + menu popup" 명시. SKILL 규칙상 본 루프에서 새 Mixin 을 만들지 않는다. ListRenderMixin 은 visible 영역(`.toolbar-om__visible`)만 렌더 — overflow 인지 X. ResizeObserver overflow 감지 · popup toggle · outside dismiss · popup 안 항목 cloneNode · 명시 emit 은 컴포넌트 자체 메서드가 전담. ShadowPopupMixin 도 미사용 — popup 은 root 안에 absolute-positioned 영역으로 단순 구현(Shadow DOM 격리 불요).

### cssSelectors (ListRenderMixin — visible 영역 전용)

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.toolbar-om__visible` | 직접 표시 액션이 추가될 부모 (ListRenderMixin 규약 — visible 만). |
| template | `#toolbar-om-action-template` | `<template>` cloneNode 대상 (visible + popup 양쪽에서 사용). |
| itemid | `.toolbar-om__action` | 항목 식별 + 이벤트 매핑 (visible 영역 클릭 위임). |
| disabled | `.toolbar-om__action` | 비활성 상태 (data-disabled). |
| kind | `.toolbar-om__action` | 항목 종류 (data-kind: action|divider). |
| icon | `.toolbar-om__icon` | 아이콘 표시 (Material Symbols 등). |
| label | `.toolbar-om__label` | 라벨 텍스트 (선택적 — 빈 값이면 `:empty`로 숨김). |

> **overflowMenu 전용 selector(자체 메서드 전담)**: `.toolbar-om`(루트 — `data-has-overflow` / `data-popup-open` 토글 대상), `.toolbar-om__more-btn`(⋯ 버튼 — popup toggle), `.toolbar-om__popup`(popup 컨테이너 — `data-popup-open`), `.toolbar-om__popup-list`(popup 안 항목 부모 — 자체 cloneNode 대상), `.toolbar-om__popup-item`(popup 안 항목 — 클릭 위임 대상) 은 cssSelectors KEY 로 등록하지 않는다 — ListRender 가 직접 데이터 바인딩하지 않으며 자체 메서드(`_recalcOverflow` / `_renderOverflowItems` / `_togglePopup` / `_handleOutsideClick`)가 전담.

### itemKey (ListRender)

`itemid` — `updateItemState(itemid, { disabled })` 활용 가능 (visible 영역만).

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| itemid | `itemid` | 항목 식별 — `closest('.toolbar-om__action')?.dataset.itemid`. |
| disabled | `disabled` | 비활성 상태 — `[data-disabled="true"]` CSS. |
| kind | `kind` | 종류 — `[data-kind="divider"]` CSS (divider 시각 분리). |

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_resizeObserver` | `ResizeObserver \| null` | root container 크기 변경 감지(overflow 재계산). |
| `_outsideClickHandler` | `function \| null` | bound 메서드 — popup 외부 클릭 시 close. document 에 등록. |
| `_keydownHandler` | `function \| null` | bound — Escape 키 popup close. document 에 등록. |
| `_omSelectors` | `object` | overflowMenu 전용 보조 selector(root/visible/moreBtn/popup/popupList/popupItem). cssSelectors 미등록. |
| `_allItems` | `Array` | 마지막으로 받은 toolbarItems 원본(분포 재계산 시 visible/overflow 분리에 사용). |
| `_lastDistribution` | `{ visibleIds, overflowIds } \| null` | 마지막 분포 — `@overflowChanged` 변경 감지용. |
| `_popupOpen` | `boolean` | popup 상태 캐시. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `toolbarItems` | `this._handleSetToolbarItems` | `[{ itemid, icon, label, kind:'action'|'divider', priority?, disabled? }]` — 새 batch 전체 replace. 핸들러가 `_allItems` 저장 + `_recalcOverflow()` 호출. |
| `setToolbarItems` | `this._handleSetToolbarItems` | 동일 페이로드 — 큐 설명 명시 토픽 alias. |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `itemid` (ListRender — `.toolbar-om__action`) | visible 영역 액션 클릭 | `@toolbarItemClicked` (위임 — `{ targetInstance, event }`). 핸들러가 fromOverflow=false 로 자체 emit 추가 발행 — popup 패스와 통합. |

> **이벤트 통합 처리** — visible 영역은 bindEvents 위임으로 `@toolbarItemClicked { event }` 1회 발행 후, register.js 가 `Wkit.onEventBusHandlers` 가 아닌 native click handler 를 root 에 추가하지 않고, **bindEvents 위임 페이로드(`{event, targetInstance}`) 만으로 fromOverflow=false 케이스를 페이지가 받음**. popup 클릭은 자체 native click delegator(`_handlePopupClick`)가 `@toolbarItemClicked { itemid, fromOverflow:true }` 자체 emit 으로 분리 처리. 페이지는 두 emit 을 한 핸들러로 받아 fromOverflow flag 로 분기.

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@toolbarItemClicked` | popup 안 항목 클릭 시 1회 | `{ targetInstance, itemid, fromOverflow: true }` |
| `@overflowChanged` | `_recalcOverflow` 결과 분포(visible/overflow)가 직전 분포와 달라질 때 1회 | `{ targetInstance, visibleIds, overflowIds }` |
| `@overflowOpened` | popup open 직후 1회 | `{ targetInstance }` |
| `@overflowClosed` | popup close 직후 1회 | `{ targetInstance }` |

> **이벤트 분리 이유**: bindEvents 위임은 `{ targetInstance, event }` 만 전달 — popup 안 항목은 root 컨테이너 안이지만 bindEvents selector(`itemid` = `.toolbar-om__action`)와 매칭되지 않음(popup item 은 `.toolbar-om__popup-item`). 페이지가 매번 DOM 을 다시 스캔하지 않고도 어떤 itemid 가 어디서 클릭되었는지 바로 받을 수 있어야 하므로 popup 패스는 자체 emit. visible 패스 호환을 위해 페이지 핸들러는 `event.target.closest('.toolbar-om__action').dataset.itemid` + `fromOverflow:false` 로 통합.

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_handleSetToolbarItems({ response })` | `({response}) => void` | `toolbarItems` / `setToolbarItems` 토픽 핸들러. `response = [{itemid,...}]` 배열 또는 `{items: [...]}` 둘 다 수용. `_allItems` 저장 → `_recalcOverflow()` 호출. |
| `_recalcOverflow()` | `() => void` | root container 의 `clientWidth` 측정 → 1차 simulation: 모든 항목 visible 으로 ListRender 렌더 → 각 액션 너비 측정 → priority desc 로 시뮬 → 가용폭 초과 시점부터 popup 으로 분리 → visible/overflow 두 배열 도출 → ListRender `renderData` 로 visible 만 다시 렌더 → `_renderOverflowItems(overflow)` → root `data-has-overflow` 토글 → `_lastDistribution` 비교 → 변경되면 `@overflowChanged` 발행. ResizeObserver 콜백 + `_handleSetToolbarItems` 후속에서 호출. |
| `_renderOverflowItems(items)` | `(Array) => void` | popup-list 영역 비우고 template cloneNode 로 N 개 popup-item 채움(`.toolbar-om__popup-item` 클래스 지정 + data-itemid + data-kind + .toolbar-om__icon + .toolbar-om__label 채움). visible 과 동일 template 재사용 — 클래스만 교체. |
| `_togglePopup()` | `() => void` | `_popupOpen` 토글 + `_openPopup` / `_closePopup` 분기. |
| `_openPopup()` | `() => void` | `_popupOpen = true` → root `data-popup-open="true"` → document outside-click + keydown listener attach → `@overflowOpened` 발행. |
| `_closePopup()` | `() => void` | `_popupOpen = false` → root `data-popup-open="false"` → document listener detach → `@overflowClosed` 발행. |
| `_handleOutsideClick(e)` | `(MouseEvent) => void` | document click — popup 또는 more-btn 안의 클릭이 아니면 close. popup 안 popup-item 클릭은 자체 핸들러가 fromOverflow:true emit + close. |

### 페이지 연결 사례

```
[페이지 — 편집기 toolbar / 데이터 그리드 액션 바 / 모바일 admin / 3rd-party widget]
    │
    └─ fetchAndPublish('toolbarItems', this) 또는 직접 publish
        payload 예: [
          { itemid: 'save',     icon: 'save',          label: 'Save',     kind: 'action', priority: 10, disabled: 'false' },
          { itemid: 'undo',     icon: 'undo',          label: 'Undo',     kind: 'action', priority: 9 },
          { itemid: 'redo',     icon: 'redo',          label: 'Redo',     kind: 'action', priority: 8 },
          { itemid: 'div-1',    kind: 'divider' },
          { itemid: 'bold',     icon: 'format_bold',   label: 'Bold',     kind: 'action', priority: 7 },
          { itemid: 'italic',   icon: 'format_italic', label: 'Italic',   kind: 'action', priority: 6 },
          { itemid: 'link',     icon: 'link',          label: 'Link',     kind: 'action', priority: 5 },
          { itemid: 'div-2',    kind: 'divider' },
          { itemid: 'comment',  icon: 'comment',       label: 'Comment',  kind: 'action', priority: 4 },
          { itemid: 'share',    icon: 'share',         label: 'Share',    kind: 'action', priority: 3 },
          { itemid: 'print',    icon: 'print',         label: 'Print',    kind: 'action', priority: 2 },
          { itemid: 'settings', icon: 'settings',      label: 'Settings', kind: 'action', priority: 1 }
        ]

[Toolbars/Advanced/overflowMenu]
    ├─ ListRender 가 visible 영역에 액션을 렌더
    ├─ ResizeObserver 가 root 의 width 변경 감지 → _recalcOverflow
    ├─ 가용폭 부족 시 priority asc 순으로 우측부터 popup 으로 이동
    │   (priority 미지정 항목은 0 취급 — 가장 먼저 overflow)
    ├─ overflow 면 root data-has-overflow="true" → ⋯ 버튼 노출
    └─ 분포 변경 시 @overflowChanged { visibleIds:['save','undo','redo','div-1','bold','italic'], overflowIds:['link','div-2','comment','share','print','settings'] }

[사용자가 visible 영역 'bold' 클릭]
    └─ bindEvents 위임 → @toolbarItemClicked { event, targetInstance, fromOverflow:false (페이지가 추론) }

[사용자가 ⋯ 클릭]
    ├─ root native click delegator → _togglePopup → _openPopup
    ├─ root data-popup-open="true" → popup 표시
    ├─ document outside-click + keydown listener attach
    └─ @overflowOpened { targetInstance }

[사용자가 popup 안 'share' 클릭]
    ├─ popup native click delegator → @toolbarItemClicked { itemid:'share', fromOverflow:true } 자체 emit
    └─ 자동 close → @overflowClosed

[사용자가 popup 외부 클릭]
    └─ _handleOutsideClick → close → @overflowClosed

운영: this.pageDataMappings = [
        { topic: 'toolbarItems', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@toolbarItemClicked':  ({ event, targetInstance, itemid, fromOverflow }) => {
                                  // fromOverflow 가 정의되어 있으면 popup 클릭(자체 emit), 없으면 visible 클릭(bindEvents 위임)
                                  const id = (itemid != null) ? itemid
                                           : event.target.closest('.toolbar-om__action')?.dataset.itemid;
                                  const isOverflow = (fromOverflow === true);
                                  if (id) executeAction(id, { fromOverflow: isOverflow });
                                },
        '@overflowChanged':     ({ visibleIds, overflowIds }) => { /* 분석/미니맵 */ },
        '@overflowOpened':      ()                              => { /* z-index/aria-expanded 동기화 */ },
        '@overflowClosed':      ()                              => { /* 동기화 해제 */ }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | popup 시각 차별화 (more-btn · popup 외형 · indicator) | 도메인 컨텍스트 예 |
|------|---------|-----------------------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 그라디언트 / Pretendard / 8px 모서리. more-btn: 다크 퍼플 fill + 시안 ⋯ icon. popup: `linear-gradient(180deg, #191D50, #12153D)` 배경 + 시안 1px 테두리 + 12px 모서리. divider 는 시안 1px 라인. | **편집기 toolbar — Save/Undo/Redo/Bold/Italic/Link/Comment/Share/Print/Settings 12개** (좁은 viewport — Comment/Share/Print/Settings 가 popup) |
| `02_material`    | B: Material Elevated | 라이트 / box-shadow elevation / Roboto / 4px 모서리. more-btn: secondary container surface + Material ⋯. popup: 흰색 배경 + 8dp shadow + 8px 모서리. divider 는 라이트 그레이 1px. | **데이터 그리드 액션 바 — Filter/Sort/Group/Export/Print/Share/Refresh/Settings** (admin 패널 좁을 때 Print/Share/Refresh/Settings popup) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 / DM Serif Display 라벨 / 0px 모서리. more-btn: serif 이탤릭 ⋯. popup: 베이지 배경 + 1px 위 테두리(샤프) + 0~2px 모서리. divider 는 웜 그레이 thin 라인 + 넓은 여백. | **모바일 admin — New/Edit/Duplicate/Archive/Share/Settings/Help** (콘솔 폭에 따라 Share/Settings/Help 가 popup) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 시안 / IBM Plex Mono / 2px 모서리. more-btn: 시안 ring + Mono ⋯. popup: 다크 배경 + 시안 1px 보더 + 2px 모서리 + tabular-nums label. divider 는 시안 1px 점선. | **3rd-party widget toolbar — Acquire/Calibrate/Measure/Trigger/Save/Export/Settings** (관제 좁은 사이드 패널 — Save/Export/Settings 가 popup) |

각 페르소나는 `.toolbar-om[data-has-overflow="true|false"]` / `.toolbar-om[data-popup-open="true|false"]` 셀렉터로 more-btn 및 popup 표시/숨김을 동시 토글. popup 항목 hover 는 페르소나별로 분기.

### 결정사항

- **prefix `.toolbar-om__*`** — Standard `.toolbar__*` 와 분리(같은 페이지 공존 시 CSS 충돌 X).
- **2 토픽 동시 구독(`toolbarItems` + `setToolbarItems`)** — 큐 설명대로 `toolbarItems` 권장이지만, 명시적 설정 채널(`setToolbarItems`) 도 동시 구독.
- **priority desc → 가장 우측 = priority 가장 작은 항목** — priority 가 클수록 중요(좌측 고정). 미지정은 0(가장 먼저 overflow). divider 는 양쪽 항목과 함께 이동(고립 divider 방지 — `_recalcOverflow` 가 좌우 인접 액션 없는 divider 자동 hide).
- **가용폭 simulation** — 1차 모든 항목을 visible 로 렌더 → 각 액션 `offsetWidth` 측정 → `_omGap` (CSS gap 8px 가정) 더해 누적 → root clientWidth 와 비교. `more-btn` 너비(고정 36px) 도 예약. `accumulated + moreBtnWidth + gap > clientWidth` 시점부터 우측을 popup 으로 분리.
- **자체 cloneNode 추가 패스** — popup 안 항목은 ListRender container 가 아니므로 자체 메서드가 template 을 cloneNode 하여 `.toolbar-om__popup-list` 에 append. visible 과 동일 template 재사용 — 항목 루트 클래스만 `.toolbar-om__action` → `.toolbar-om__popup-item` 으로 swap.
- **popup 은 자체 absolute 영역(ShadowPopupMixin 미사용)** — popup 은 root 안 absolute-positioned 영역. 단순한 dropdown 메뉴이고 Shadow DOM 격리(z-index/CSS leak)가 필요 없으므로 ShadowPopupMixin 도입은 과대. outside click 은 document listener 로 직접 처리.
- **outside click — `composedPath()` / `contains` 둘 다 시도** — popup 자식이거나 more-btn 자식이면 close 안함. 그 외는 close.
- **Escape 키 close** — popup open 시 document keydown listener 부착, Escape 시 close. Tab 트랩은 본 변형에서 미구현(과대 — popup 은 short-lived).
- **신규 Mixin 생성 금지** — ListRenderMixin (visible) + 자체 메서드 7종 + 자체 cloneNode 패스(popup) 로 완결.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions / customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서 (ResizeObserver disconnect → document outside-click listener remove → document keydown listener remove → root native click delegator(more+popup) remove → customEvents 제거 → 구독 해제 → 자체 상태/메서드 null + listRender.destroy)
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Toolbars/Advanced/overflowMenu/preview/...html` → `../`를 5번 = scrollable 동일 verbatim 복사)
