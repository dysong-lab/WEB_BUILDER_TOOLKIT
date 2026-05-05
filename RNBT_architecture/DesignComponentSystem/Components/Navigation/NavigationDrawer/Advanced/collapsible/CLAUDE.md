# NavigationDrawer — Advanced / collapsible

## 기능 정의

1. **메뉴 항목 렌더링 (Standard 호환)** — `navItems` 토픽으로 수신한 배열을 template 반복으로 렌더링한다. ListRenderMixin 호출 (KEY `menuid`/`active`/`icon`/`label`/`badge`).
2. **축소/확장 토글 (자체 메서드)** — drawer 헤더 영역의 toggle 버튼(`.nav-drawer__toggle`) 클릭 시 `expanded ↔ collapsed` 상태가 토글된다. drawer 루트의 `data-collapsed="true|false"` 속성으로 CSS가 `width`(예: 64px ↔ 240px), 라벨(`.nav-drawer__label`)/배지(`.nav-drawer__badge`) `opacity`/`visibility`, 그리고 toggle 아이콘 회전을 transition한다.
3. **외부 강제 토글 (선택 토픽)** — `setCollapsed` 토픽 publish 시 `{ collapsed: boolean }`로 강제 collapse/expand. 페이지가 viewport breakpoint 리스너로 자동 collapse하거나, "전체 축소" 컨트롤을 구현할 수 있다.
4. **확장/축소 이벤트 발행** — 상태가 실제로 바뀐 시점에만 `@drawerCollapseChanged`를 1회 발행. payload: `{ collapsed: boolean }`. 페이지가 콘텐츠 영역의 margin-left를 동기화하거나, 다른 drawer 인스턴스를 동기화할 수 있다.
5. **항목 클릭 이벤트** — Standard와 동일하게 항목 클릭 시 `@navItemSelected` 발행. payload는 Wkit 기본(`{ event, targetInstance }`)이며, 페이지가 `event.target.closest`로 navid를 추출. (Standard의 `@menuItemClicked`에 대응되지만, 같은 큰 범주의 NavigationBar/Advanced/badgeNotification과 동일하게 `@navItemSelected`로 통일하여 변형 의도 — "사용자가 이 목적지를 선택" — 를 분명히 함.)

> **Standard와의 분리 정당성 (5축)**:
> ① **신규 토픽 1종** — `setCollapsed` (외부 collapse 강제). Standard의 `navigationMenu`는 항목 데이터만 받음.
> ② **신규 이벤트 1종 + 이름 변경** — `@drawerCollapseChanged` 신규, `@menuItemClicked` → `@navItemSelected` (변형 의도 명시 + Navigation/Advanced 큰 범주 일관성).
> ③ **신규 cssSelectors KEY 2종 + datasetAttrs 분기 1종** — `drawer`(루트, `data-collapsed` 부착 대상), `toggle`(헤더의 토글 버튼) 신규. `data-collapsed="true|false"`는 컴포넌트 내부 `_setCollapsed`가 직접 갱신.
> ④ **신규 자체 상태 1종** — `_isCollapsed: boolean` (현재 축소 상태). Standard는 자체 상태로 `_drawerSelector` 문자열만 보유.
> ⑤ **신규 자체 메서드 4종** — `_setCollapsed`, `_handleToggleClick`, `_handleExternalSetCollapsed`, `setCollapsed`(외부 명령형 API). Standard는 `drawerOpen`/`drawerClose`/`drawerToggle` 3종이지만 **모바일용 transform: translateX 표시/숨김** — 본 변형의 데스크톱 width 토글과 의도/구현이 다름.
>
> 위 5축 모두 Standard와 상이 → register.js가 명백히 다르며 Standard 내부 variant로 흡수 불가.
>
> **MD3 / 도메인 근거**: MD3 Navigation drawer는 "Standard navigation drawer"(persistent 240dp, 항상 보이는 라벨 + 아이콘)와 "Modal navigation drawer"(scrim, 모바일) 두 변형을 정의. 본 컴포넌트의 Standard는 후자(open/close transform). **collapsible 변형은 데스크톱 사이드 nav에서 작업 영역 공간 절약을 위해 아이콘 모드(rail)와 풀 라벨 모드를 사용자가 토글하는 패턴** — Slack, Discord, VS Code, 관리 콘솔(GCP/AWS)에서 널리 사용. NavigationRail이 별도 컴포넌트로 존재하나 그것은 항상 컴팩트, 본 변형은 **사용자 의지로 두 모드 간 전환**이 핵심이라 별도 변형으로 분리.

---

## 구현 명세

### Mixin

ListRenderMixin (`itemKey: 'menuid'`로 개별 항목 상태 변경 활성화) + 자체 상태 1종(`_isCollapsed: boolean`) + 자체 메서드 4종(`_setCollapsed`, `_handleToggleClick`, `_handleExternalSetCollapsed`, `setCollapsed`).

> 신규 Mixin 생성 금지 규칙 준수. ListRenderMixin은 항목 렌더만 담당하고, drawer 루트(`data-collapsed`) 토글은 자체 메서드가 직접 처리. toggle 버튼은 항목이 아니라 헤더 고정 요소이므로 customEvents의 click 위임으로 이벤트 처리.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.nav-drawer__list` | 항목이 추가될 부모 (규약) |
| template  | `#nav-drawer-item-template` | cloneNode 대상 (규약) |
| menuid    | `.nav-drawer__item` | 항목 식별 + 클릭 위임 |
| active    | `.nav-drawer__item` | 활성 상태 (data-active) |
| icon      | `.nav-drawer__icon` | 아이콘 (Material Symbols) |
| label     | `.nav-drawer__label` | 라벨 텍스트 (collapsed 시 시각 hidden) |
| badge     | `.nav-drawer__badge` | 뱃지 텍스트 (collapsed 시 시각 hidden) |
| drawer    | `.nav-drawer` | **신규** — drawer 루트, `data-collapsed` 부착 대상 |
| toggle    | `.nav-drawer__toggle` | **신규** — 헤더의 토글 버튼 (chevron). 클릭 위임 대상 |

### itemKey

`menuid`

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| menuid | menuid |
| active | active |

> `data-collapsed`는 `drawer` 요소(`.nav-drawer`)에 대해 `_setCollapsed` 내부에서 직접 setAttribute로 작성 (외부 발행 데이터가 아니므로 datasetAttrs 매핑 X). CSS는 `.nav-drawer[data-collapsed="true"]` 셀렉터로 두 상태를 분기.

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_isCollapsed` | `boolean` | 현재 축소 상태 (기본 `false` = 확장). |

### 구독 (subscriptions)

| topic | handler | payload | 의미 |
|-------|---------|---------|------|
| `navItems` | `this.listRender.renderData` | `Array<{menuid, icon, label, badge?, active}>` | Standard의 `navigationMenu`와 동일 형태(이름만 변경하여 NavigationBar Advanced와 통일) |
| `setCollapsed` | `this._handleExternalSetCollapsed` | `{ collapsed: boolean }` | 외부에서 collapse 강제 |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 |
|--------|------------------|------|
| click | `menuid` | `@navItemSelected` |
| click | `toggle` | (직접 분기 — `_handleToggleClick`) |

> toggle 클릭은 컴포넌트 내부에서 처리(상태 토글)되므로 버스로 발행하지 않는다. customEvents의 핸들러 슬롯에 `@drawerCollapseChanged`를 직접 넣지 않고, `_handleToggleClick`에서 `_setCollapsed(!this._isCollapsed)` 호출 → `_setCollapsed`가 실제 변경 시 1회 emit.

### 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@drawerCollapseChanged` | collapse 상태가 실제로 바뀐 시점 1회 | `{ targetInstance, collapsed: boolean }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_setCollapsed(next)` | `(boolean) => void` | 상태가 실제로 바뀔 때만 `_isCollapsed` 갱신 + `data-collapsed` 갱신 + `@drawerCollapseChanged` 발행 (멱등) |
| `_handleToggleClick(event)` | `(MouseEvent) => void` | toggle 버튼 클릭 핸들러. customEvents의 click delegator가 호출 — `_setCollapsed(!this._isCollapsed)` |
| `_handleExternalSetCollapsed({ response })` | `({response}) => void` | `setCollapsed` 토픽 수신. `response.collapsed` boolean으로 강제 토글 |
| `setCollapsed(value)` | `(boolean) => void` | 외부 명령형 API. `_setCollapsed(Boolean(value))` 호출 |

> `customEvents.click[toggle]` 슬롯에는 버스 이벤트 이름 대신 직접 함수 참조를 넣을 수 없으므로, `bindEvents`가 인식하는 형태로 처리한다. **본 변형은 toggle click을 자체 메서드로 처리하기 위해, expandable 패턴과 동일하게 `appendElement.addEventListener('click', this._clickHandler)`로 native delegator를 직접 부착한다** (event.target.closest로 toggle 분기).

### 데이터 형식

`navItems` payload (Standard 호환):
```json
[
  { "menuid": "dashboard",     "icon": "dashboard",     "label": "Dashboard",     "badge": "",   "active": "true"  },
  { "menuid": "devices",       "icon": "devices",       "label": "Devices",       "badge": "12", "active": "false" },
  { "menuid": "analytics",     "icon": "analytics",     "label": "Analytics",     "badge": "",   "active": "false" },
  { "menuid": "settings",      "icon": "settings",      "label": "Settings",      "badge": "",   "active": "false" },
  { "menuid": "notifications", "icon": "notifications", "label": "Notifications", "badge": "3",  "active": "false" }
]
```

`setCollapsed` payload:
```json
{ "collapsed": true }
```

### 페이지 연결 사례

```
[페이지 onLoad]
  this.pageDataMappings = [
    { topic: 'navItems', datasetInfo: { datasetName: 'nav_items' } }
  ];

  Wkit.onEventBusHandlers({
    '@navItemSelected': ({ event, targetInstance }) => {
        const item = event.target.closest(targetInstance.listRender.cssSelectors.menuid);
        const navid = item?.dataset.menuid;
        if (!navid) return;
        router.go(navid);
    },
    '@drawerCollapseChanged': ({ collapsed }) => {
        // 본문 영역의 margin-left를 collapsed에 맞춰 transition
        document.querySelector('.app-content').dataset.navCollapsed = String(collapsed);
    }
  });

  // viewport breakpoint 리스너
  const mql = window.matchMedia('(max-width: 1024px)');
  const sync = (e) => instance.subscriptions.setCollapsed.forEach(h => h.call(instance, { response: { collapsed: e.matches } }));
  mql.addEventListener('change', sync); sync(mql);
```

### 디자인 변형

| 파일 | 페르소나 | collapsed/expanded 폭 + transition | 도메인 컨텍스트 예 |
|------|---------|------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | 280px ↔ 72px, 220ms ease-out width + label opacity | 산업 모니터링 콘솔 — 운영자가 차트 영역 확대를 위해 사이드 nav 축소 |
| `02_material`    | B: Material Elevated | 256px ↔ 80px, 250ms standard easing + elevation 유지 | 일반 관리 콘솔 (admin dashboard) — Gmail 스타일 전환 |
| `03_editorial`   | C: Minimal Editorial | 320px ↔ 88px, 300ms slow ease, 라벨 fade only(폭은 천천히) | 에디터/문서 도구 — 본문 가독성을 위해 nav를 좁힘 |
| `04_operational` | D: Dark Operational | 240px ↔ 56px, 120ms snappy linear, 라벨 instant hide | 관제실 콘솔 — 다중 모니터링 시 즉각 축소로 화면 밀도 극대화 |

각 페르소나는 `[data-collapsed="true|false"]` 셀렉터로 `.nav-drawer`의 `width`, `.nav-drawer__label`/`.nav-drawer__badge`의 `opacity`/`visibility`, `.nav-drawer__toggle` 아이콘 회전(180°)을 동시에 transition한다.

### 결정사항

- **width 토글 vs translateX(-100%) Standard 유지**: Standard의 `data-open` translateX 모달 패턴은 본 변형이 건드리지 않음(서로 다른 의도). collapsed/expanded는 `data-collapsed` 별도 dataset로 분리 — 두 dataset이 동시에 사용 가능(예: 모바일에서 `data-open="false"` + 데스크톱 `data-collapsed="true"`).
- **toggle 버튼은 template 밖**: 헤더에 고정 1개라서 ListRenderMixin의 template 안에 두지 않는다. 항목별 토글이 아니라 drawer 전체 토글이므로 정적 위치.
- **`setCollapsed` 단방향**: 외부 → 컴포넌트만 흐름. 컴포넌트가 자동 publish하지 않는다 — 다중 인스턴스 동기화는 페이지가 `@drawerCollapseChanged` 수신 후 publish할지 결정.
- **이벤트 이름 통일**: `@drawerCollapseChanged` 단일 이벤트 (collapse/expand 분리 X). payload `{ collapsed }`로 방향이 자명. expandable의 2종 이벤트 분리(`@cardExpanded`/`@cardCollapsed`)와 다른 선택 — drawer는 한 인스턴스에 두 모드 토글이라 단일 이벤트가 자연스러움.
- **Standard `drawerOpen/Close/Toggle` 메서드 미제공**: 본 변형은 모달 표시/숨김(translateX)이 아니라 width 토글이므로, 같은 이름을 재정의하면 의미 충돌. 대신 `setCollapsed` (외부 명령) + 토픽 (외부 publish)로 외부 제어를 단일화. 모바일 모달 전환이 필요하면 별도 wrapper Advanced 변형 후보.
