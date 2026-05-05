# NavigationRail — Advanced / hoverExpand

## 기능 정의

1. **목적지 항목 렌더링 (Standard 호환)** — `navItems` 토픽으로 수신한 배열(3~7개)을 template 반복으로 수직 렌더링한다. ListRenderMixin 호출 (KEY `menuid`/`active`/`icon`/`label`/`badge`).
2. **hover 시 라벨 펼침 (자체 메서드)** — rail 컨테이너에 `mouseenter` 시 `data-expanded="true"` 부여 → CSS가 `width`(예: 80px → 240px), 라벨(`.nav-rail__label`) `opacity` 0 → 1, 항목 레이아웃을 row 정렬로 transition. `mouseleave` 시 일정 지연(120~150ms) 후 `data-expanded="false"`로 축소. 마우스가 leave delay 안에 다시 enter하면 collapse를 cancel(라벨 클릭 중 실수로 닫힘 방지).
3. **외부 강제 hover 활성화 토글 (선택 토픽)** — `setHoverExpandEnabled` 토픽 publish 시 `{ enabled: boolean }`로 hover-expand 기능 자체 on/off. 비활성화 시 mouseenter/leave를 무시하고 강제로 collapsed 상태를 유지(viewport breakpoint나 사용자 설정에서 좁은 모드 고정).
4. **expand/collapse 라이프사이클 이벤트 발행** — 상태가 실제로 바뀐 시점에만 `@navRailExpanded` / `@navRailCollapsed`를 1회씩 발행. payload: `{ targetInstance, expanded?: true | collapsed?: true }`. 페이지가 콘텐츠 영역의 margin-left를 동기화하거나, 두 번째 인스턴스를 동기화할 수 있다.
5. **항목 클릭 이벤트** — 항목 클릭 시 `@navItemSelected` 발행. payload는 Wkit 기본(`{ event, targetInstance }`)이며, 페이지가 `event.target.closest`로 menuid를 추출. (Standard의 `@navRailItemClicked`에 대응되지만, NavigationDrawer/Advanced/collapsible · nestedItems와 동일하게 `@navItemSelected`로 통일하여 Navigation/Advanced 큰 범주 일관성 — "사용자가 이 목적지를 선택" — 을 분명히 함.)

> **Standard와의 분리 정당성 (5축)**:
> ① **신규 토픽 2종 + 토픽 이름 변경** — `navItems`(이름 변경, NavigationDrawer/Advanced와 통일), `setHoverExpandEnabled`(외부 hover-expand 기능 on/off). Standard의 `navigationRail`은 항목 데이터만 받음.
> ② **신규 이벤트 2종 + 이름 변경** — `@navRailExpanded` / `@navRailCollapsed` 신규, `@navRailItemClicked` → `@navItemSelected` (Navigation/Advanced 큰 범주 일관성).
> ③ **신규 cssSelectors KEY 1종 + 신규 datasetAttrs 분기 1종** — `rail`(루트, `data-expanded` 부착 대상 + mouseenter/mouseleave 부착 대상) 신규. `data-expanded="true|false"`는 컴포넌트 내부 `_setExpanded`가 직접 갱신.
> ④ **신규 자체 상태 4종** — `_isExpanded: boolean`, `_isHoverEnabled: boolean`, `_collapseTimerId: number|null`, `_pointerHandlers: { enter, leave }|null`. Standard는 자체 상태가 0개.
> ⑤ **신규 자체 메서드 5종** — `_setExpanded`, `_handleEnter`, `_handleLeave`, `_handleSetHoverEnabled`, `setHoverExpandEnabled`(외부 명령형 API). Standard는 자체 메서드 0개 — Mixin renderData 직접 구독.
>
> 위 5축 모두 Standard와 상이 → register.js가 명백히 다르며 Standard 내부 variant로 흡수 불가.
>
> **MD3 / 도메인 근거**: MD3 Navigation rail은 "compact, persistent vertical nav" — 좁은 폭(80dp) 아이콘 모드를 기본으로 한다. 그러나 데스크톱 운영 환경에서는 **사용자가 hover만 하면 라벨이 펼쳐져 빠르게 식별**하는 패턴이 산업 표준으로 정착됨 (Material You web component 가이드, Atlassian, GitHub Codespaces, GCP/AWS 콘솔 일부 뷰). Standard는 라벨이 항상 보이는 정적 rail이지만, hoverExpand는 **마우스 거리 기반 동적 펼침** — 작업 영역을 최대화하면서 라벨 식별 비용을 0으로 만드는 패턴. Slack 사이드바 hover-expand, Discord 서버 트레이 등에서 일반화.

> **collapsible(NavigationDrawer)과의 차이 (1줄 핵심)**: collapsible은 사용자가 **명시적 토글 버튼**으로 영구 전환(상태가 click마다 누적), hoverExpand는 **마우스 거리만으로 일시 전환**(영구 상태 X, mouse가 떠나면 자동 복귀). 인터랙션 모델 직교 — 한 컴포넌트에 둘 다 강제하면 click vs hover 우선순위 충돌.

---

## 구현 명세

### Mixin

ListRenderMixin (`itemKey: 'menuid'`로 개별 항목 상태 변경 활성화) + 자체 상태 4종(`_isExpanded`, `_isHoverEnabled`, `_collapseTimerId`, `_pointerHandlers`) + 자체 메서드 5종(`_setExpanded`, `_handleEnter`, `_handleLeave`, `_handleSetHoverEnabled`, `setHoverExpandEnabled`).

> 신규 Mixin 생성 금지 규칙 준수. ListRenderMixin은 항목 렌더만 담당하고, rail 루트(`data-expanded`) 토글은 자체 메서드가 직접 처리. mouseenter/mouseleave는 native addEventListener로 직접 부착(이벤트 위임 매트릭스가 아니라 컨테이너 자체 이벤트이므로).

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.nav-rail__list` | 항목이 추가될 부모 (규약) |
| template  | `#nav-rail-item-template` | cloneNode 대상 (규약) |
| menuid    | `.nav-rail__item` | 항목 식별 + 클릭 위임 |
| active    | `.nav-rail__item` | 활성 상태 (data-active) |
| icon      | `.nav-rail__icon` | 아이콘 (Material Symbols) |
| label     | `.nav-rail__label` | 라벨 텍스트 (collapsed 시 시각 hidden) |
| badge     | `.nav-rail__badge` | 뱃지 텍스트 (빈 값이면 `:empty`로 숨김) |
| rail      | `.nav-rail` | **신규** — rail 루트, `data-expanded` 부착 대상 + mouseenter/mouseleave 부착 대상 |

### itemKey

`menuid`

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| menuid | menuid |
| active | active |

> `data-expanded`는 `rail` 요소(`.nav-rail`)에 대해 `_setExpanded` 내부에서 직접 setAttribute로 작성 (외부 발행 데이터가 아니므로 datasetAttrs 매핑 X). CSS는 `.nav-rail[data-expanded="true"]` 셀렉터로 두 상태를 분기.

### 인스턴스 상태

| 키 | 타입 | 기본 | 설명 |
|----|------|------|------|
| `_isExpanded`       | `boolean`              | `false` | 현재 펼침 상태. mouse hover에 따른 일시 상태이지 영구 토글이 아니다. |
| `_isHoverEnabled`   | `boolean`              | `true`  | hover-expand 기능 자체 on/off. false면 enter/leave 무시 + 강제 collapsed. |
| `_collapseTimerId`  | `number \| null`       | `null`  | mouseleave 후 collapse 예약 timer. 다시 enter하면 cancel. |
| `_pointerHandlers`  | `{ enter, leave } \| null` | `null` | rail 컨테이너에 직접 부착한 mouseenter/mouseleave 핸들러 bound 참조. beforeDestroy 정리 대상. |

### 구독 (subscriptions)

| topic | handler | payload | 의미 |
|-------|---------|---------|------|
| `navItems` | `this.listRender.renderData` | `Array<{menuid, icon, label, badge?, active}>` | Standard의 `navigationRail`과 동일 형태(이름만 변경하여 NavigationDrawer Advanced와 통일) |
| `setHoverExpandEnabled` | `this._handleSetHoverEnabled` | `{ enabled: boolean }` | 외부에서 hover-expand 기능 on/off |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 |
|--------|------------------|------|
| click  | `menuid`          | `@navItemSelected` |

> mouseenter/mouseleave는 `customEvents` 위임이 아니라 `appendElement` 안의 rail 컨테이너에 native `addEventListener`로 직접 부착한다. (`customEvents`/`bindEvents`는 click delegation 패턴이라 mouseenter/mouseleave에 부적합 — bubbling이 다르고, 위임 시 자식 요소 enter/leave에서도 fire되어 toggle이 깜빡임.)

### 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@navRailExpanded`  | collapsed → expanded로 전환된 시점 1회 | `{ targetInstance, expanded: true }` |
| `@navRailCollapsed` | expanded → collapsed로 전환된 시점 1회 | `{ targetInstance, collapsed: true }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_setExpanded(next)` | `(boolean) => void` | 멱등 expand/collapse. 현재 `_isExpanded`와 같으면 silent return. `data-expanded` 갱신 + `@navRailExpanded`/`@navRailCollapsed` 1회 발행. |
| `_handleEnter()` | `() => void` | rail mouseenter 핸들러. `_isHoverEnabled` false면 무시. 예약된 collapse timer가 있으면 cancel. `_setExpanded(true)`. |
| `_handleLeave()` | `() => void` | rail mouseleave 핸들러. 120ms 지연 timer로 `_setExpanded(false)` 예약. |
| `_handleSetHoverEnabled({response})` | `({response}) => void` | `setHoverExpandEnabled` 토픽 핸들러. `response.enabled` boolean으로 기능 토글. false 전환 시 즉시 collapse + 예약 timer cancel. |
| `setHoverExpandEnabled(value)` | `(boolean) => void` | 외부 명령형 API. 내부 `_handleSetHoverEnabled`와 동일 로직. |

### 데이터 형식

`navItems` payload (Standard 호환):
```json
[
  { "menuid": "dashboard", "icon": "dashboard",     "label": "Dashboard", "badge": "",  "active": "true"  },
  { "menuid": "explore",   "icon": "explore",       "label": "Explore",   "badge": "",  "active": "false" },
  { "menuid": "alerts",    "icon": "notifications", "label": "Alerts",    "badge": "3", "active": "false" },
  { "menuid": "reports",   "icon": "insert_chart",  "label": "Reports",   "badge": "",  "active": "false" },
  { "menuid": "profile",   "icon": "person",        "label": "Profile",   "badge": "",  "active": "false" }
]
```

`setHoverExpandEnabled` payload:
```json
{ "enabled": true }
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
        const menuid = item?.dataset.menuid;
        if (!menuid) return;
        router.go(menuid);
    },
    '@navRailExpanded':  () => { document.querySelector('.app-content').dataset.navRailExpanded = 'true';  },
    '@navRailCollapsed': () => { document.querySelector('.app-content').dataset.navRailExpanded = 'false'; }
  });

  // 좁은 viewport에서 hover-expand 비활성화 (터치 환경)
  const mql = window.matchMedia('(hover: none)');
  const sync = (e) => instance.subscriptions.setHoverExpandEnabled.forEach(h => h.call(instance, { response: { enabled: !e.matches } }));
  mql.addEventListener('change', sync); sync(mql);
```

### 디자인 변형

| 파일 | 페르소나 | collapsed/expanded 폭 + transition | 도메인 컨텍스트 예 |
|------|---------|------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | 84px ↔ 232px, 220ms ease-out width + 180ms label opacity | 산업 모니터링 콘솔 — 운영자가 hover만으로 메뉴 식별 + 차트 영역 최대화 |
| `02_material`    | B: Material Elevated | 80px ↔ 256px, 250ms standard easing + elevation 유지 | 일반 관리 콘솔 (Atlassian/Material 스타일) — hover로 라벨 fly-out |
| `03_editorial`   | C: Minimal Editorial | 104px ↔ 280px, 300ms slow ease, 라벨 fade only | 에디터/문서 도구 — 본문 가독성을 위해 nav를 좁힘 + hover로 임시 식별 |
| `04_operational` | D: Dark Operational | 68px ↔ 192px, 120ms snappy linear, 라벨 instant show | 관제실 콘솔 — 다중 모니터링 시 좁게 유지 + hover 즉시 펼침 |

각 페르소나는 `[data-expanded="true|false"]` 셀렉터로 `.nav-rail`의 `width`, `.nav-rail__label`의 `opacity`/`visibility`, 그리고 `.nav-rail__item` 레이아웃(아이콘+라벨 row vs 아이콘 단독 column)을 동시에 transition한다.

### 결정사항

- **mouseenter/mouseleave native 부착 vs customEvents 위임**: customEvents는 click 위임이 핵심이며 mouseenter/leave는 bubbling 동작이 달라 자식 enter/leave마다 fire된다. → rail 컨테이너에 직접 native addEventListener를 부착하여 한 번만 fire하도록 한다 (보너스: pointer 이동 시 자식 항목 hover transition과 분리).
- **leave 후 120ms collapse delay**: 즉시 collapse 시 사용자가 라벨 클릭하려는 순간 라벨이 사라지는 문제를 방지. delay 동안 다시 enter하면 timer cancel — Slack 사이드바, JetBrains gutter 동일 패턴.
- **`setHoverExpandEnabled` 단방향**: 외부 → 컴포넌트만 흐름. 컴포넌트가 자동 publish하지 않는다 — 다중 인스턴스 동기화는 페이지가 직접 publish.
- **이벤트 이름 분리**: collapsible은 단일 `@drawerCollapseChanged { collapsed }`이지만 hoverExpand는 `@navRailExpanded` / `@navRailCollapsed` 2종. 이유: hover는 사용자가 "펼침"을 의도해 hover했고 leave가 자동 collapse라 두 액션의 의미가 비대칭. 페이지가 expand 시점에만 고비용 작업(다른 panel 닫기, 측정 등)을 트리거하기 쉽게 분리.
- **Standard `@navRailItemClicked` 미제공**: 본 변형은 click 이벤트를 `@navItemSelected`로 통일(NavigationDrawer/Advanced 답습). Standard 페이지가 같은 dataset을 구독하면 토픽 이름만 `navigationRail` → `navItems` 매핑하면 변경 폭 최소.
- **`active` dataset과 `expanded` dataset 직교**: `data-active`는 항목 단위 1개에만 부착, `data-expanded`는 rail 루트에 1개. 둘은 서로 영향 없음 — collapsed 상태에서도 active 항목은 시각적 표식 유지(좌측 인디케이터 등 페르소나별 처리).
- **신규 Mixin 생성 금지** — 자체 메서드 5종 + 자체 상태 4종으로 완결. **반복 패턴 후보 메모**: `HoverExpandMixin` (또는 `PointerToggleMixin`) — pointerenter/leave + delay timer + dataset 토글 + 라이프사이클 이벤트 패턴이 1회 첫 등장. 향후 다른 Navigation/Sheets 변형(예: drawer mini-rail hover, sheet preview hover)에서 1~2회 더 누적되면 일반화 검토 (SKILL 회귀 규율).

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서 (mouseenter/leave + timer 정리 추가)
- P3-5: preview `<script src>` 깊이 6단계 (../를 6번)
