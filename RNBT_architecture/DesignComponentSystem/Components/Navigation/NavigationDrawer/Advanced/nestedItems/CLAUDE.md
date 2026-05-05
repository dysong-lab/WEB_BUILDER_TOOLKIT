# NavigationDrawer — Advanced / nestedItems

## 기능 정의

1. **중첩 메뉴 항목 렌더링 (재귀 트리)** — `drawerItems` 토픽으로 수신한 **재귀 트리 배열**(`[{ navid, icon, label, badge?, children?: [같은 구조] }]`)을 자체 메서드(`_renderTree`)가 nested `<ul>` 구조로 빌드한다. ListRenderMixin은 평면 배열 전용이라 적합하지 않으므로 자체 메서드가 cloneNode 재귀로 직접 nested DOM을 만든다. children이 있는 항목은 부모(`data-has-children="true"`) — 클릭 시 expand/collapse 토글. children이 없는 항목은 leaf — 클릭 시 `@navItemSelected` 발행.
2. **expand/collapse 토글 (자체 메서드)** — 부모 항목 클릭 시 `data-expanded="true|false"` 토글로 자식 ul이 부모 li 아래에 들여쓰기되어 표시/숨김된다. chevron 아이콘이 90도 회전(닫힘 ▶ → 열림 ▼). 같은 부모 안의 형제 expand 상태는 독립 (multi-expand 허용 — drawer 메뉴는 cascading menu와 다르게 여러 카테고리를 동시에 펼쳐 보는 용도).
3. **leaf 항목 클릭 이벤트** — leaf li 클릭 시 `@navItemSelected` 발행 (Standard `@menuItemClicked`에 대응되지만 Navigation/Advanced 큰 범주 일관성을 위해 collapsible과 동일한 `@navItemSelected`로 통일). payload: `{ targetInstance, navid, label, depth, path: Array<navid> }` (명시 emit). Standard 호환 시그니처(`{ event, targetInstance }`)도 bindEvents 위임으로 동시 발행.
4. **expand/collapse 라이프사이클 이벤트** — 부모가 collapsed → expanded로 전환된 시점 1회 `@navItemExpanded { targetInstance, navid, depth, path }` 발행, expanded → collapsed로 전환된 시점 1회 `@navItemCollapsed { targetInstance, navid, depth, path }` 발행. 외부 토픽으로 인한 자동 변경도 동일 이벤트로 발행.
5. **외부 강제 expand 동기화 (`setExpandedNavs`)** — `setExpandedNavs` 토픽으로 `{ ids: [navid, ...] }` 페이로드 publish 시, 트리 안의 모든 부모 li를 순회하여 navid가 ids 배열에 포함되면 expand, 아니면 collapse. 변경된 li만 라이프사이클 이벤트 1회씩 emit. 외부 라우팅과 expand 상태 동기화에 사용 (예: `/settings/users` 경로 진입 시 settings + users 부모를 자동 expand).

> **Standard와의 분리 정당성 (5축)**:
> ① **데이터 모델 — children 재귀 배열** — Standard는 평면 배열 1차원, nestedItems는 `{ children: [...] }` 트리. Standard ListRenderMixin은 평면 N개 row만 렌더 가능 → 재귀 nested ul/li 구조를 만들 수 없으므로 자체 `_renderTree` 메서드가 cloneNode + 재귀로 직접 생성.
> ② **Mixin 0종** — ListRenderMixin 미사용(Standard는 사용). Menus/Advanced/cascading과 동일한 자체 `_renderTree` 패턴.
> ③ **신규 토픽 2종** — `drawerItems`(이름 변경 + 재귀 페이로드), `setExpandedNavs`(외부 expand 강제). Standard의 `navigationMenu`는 평면 배열만.
> ④ **신규 이벤트 3종 + 이름 변경** — `@navItemExpanded`/`@navItemCollapsed` 신규, `@menuItemClicked` → `@navItemSelected` (Navigation/Advanced 큰 범주 일관성, collapsible과 동일).
> ⑤ **신규 자체 상태 5종 + 자체 메서드 8종** — `_cssSelectors`, `_expandedIds: Set<navid>`, `_renderedRoot`, `_groupHandlers`, `_itemTemplateEl`, `_listTemplateEl` (cascading 패턴 답습). `_renderTree`/`_buildItemEl`/`_handleClick`/`_setExpanded`/`_emitExpanded`/`_emitCollapsed`/`_handleSetExpandedNavs`/`_collectAllParents`. Standard는 자체 상태 1종(`_drawerSelector`) + 자체 메서드 3종(`drawerOpen`/`drawerClose`/`drawerToggle`).
>
> 위 5축 모두 Standard와 상이 → register.js가 명백히 다르며 Standard 내부 variant로 흡수 불가.
>
> **MD3 / 도메인 근거**: MD3 Navigation drawer는 표준 명세상 **section header를 통한 그룹화**를 인정하며, 실제 운영 콘솔(GCP, AWS, Azure, GitHub, Notion sidebar, 관리자 콘솔)은 **카테고리 → 하위 메뉴 expand/collapse**가 표준 패턴이다. 실사용 예: ① **Cloud 콘솔 — Compute → VM Instances / Images / Snapshots**, ② **GitHub repo settings — General / Security / Webhooks / Pages**, ③ **Notion sidebar — Workspace / Private / Shared 카테고리**. 모든 케이스에서 사용자가 카테고리를 클릭해 자식 메뉴를 펼쳐 보고, 다른 카테고리는 독립적으로 펼침/접힘이 표준 UX.

> **collapsible과의 차이 (1줄 핵심)**: collapsible은 **drawer 폭 토글**(rail/expanded 두 모드, `data-collapsed`), nestedItems는 **메뉴 항목 자체의 트리 expand/collapse**(부모-자식 계층, `data-expanded`). 두 변형은 인터랙션 모델이 직교 — 한 컴포넌트에서 둘 다 강제하면 ListRenderMixin과 자체 _renderTree의 데이터 모델 충돌(평면 vs 재귀) → 별 변형으로 분리.

> **Menus/Advanced/cascading과의 차이 (1줄 핵심)**: cascading은 **hover로 자식 ul을 부모 li 우측에 absolute positioned**(데스크톱 메뉴바, 단일 활성 path), nestedItems는 **click으로 자식 ul을 부모 li 아래에 인라인 들여쓰기 표시**(drawer 사이드 nav, multi-expand 허용). 시각/이벤트/상태 모델 모두 다름.

> **Checkbox/Advanced/nestedTree와의 차이 (1줄 핵심)**: nestedTree는 **TreeRenderMixin + 체크박스 cascade**(parent/children selected 동기화), nestedItems는 **자체 _renderTree + 메뉴 expand/collapse**(체크박스 없음, 활성 단일 항목 + 부모 expand 상태). 데이터 모델은 모두 재귀 트리지만 인터랙션 직교.

---

## 구현 명세

### Mixin

**Mixin 0종**(ListRenderMixin도 사용 안 함). 자체 `_renderTree` 메서드가 `<template>` 2종(item hull, list hull)을 cloneNode 재귀로 조립하여 nested ul/li 구조를 만든다. 자체 메서드 8종 + 자체 상태 5종으로 완결.

> **신규 Mixin 생성 금지** — 큐 설명에 "신규 NestedMenuMixin 필요"가 적혀 있으나 SKILL 규칙(produce-component Step 3-1)에 따라 본 루프에서 새 Mixin을 만들지 않는다. ListRenderMixin은 평면 배열 전용이라 재귀 trees에 부적합 — 자체 `_renderTree` 메서드가 cloneNode 재귀로 nested DOM을 빌드한다(Menus/Advanced/cascading 동일 패턴). **반복 패턴 후보 메모**: `NestedMenuMixin`(또는 `RecursiveListRenderMixin`) — 재귀 트리 nested ul/li 빌드 + expand/collapse 토글 + multi-expand + leaf 발행 패턴이 cascading과 본 변형에서 누적됨. 향후 contextMenu/folderTree/sidebarMenu 등에서 재사용된다면 일반화 검토 (SKILL 회귀 규율 — 1번 회귀 = 즉시 검토).

### cssSelectors (자체 사용 — Mixin에 전달 X)

| KEY | VALUE | 용도 |
|-----|-------|------|
| drawer       | `.nav-drawer`                  | drawer 루트 컨테이너 |
| list         | `.nav-drawer__list`            | top-level ul — `_renderTree` 결과가 채워지는 부모 요소 |
| listTemplate | `#nav-drawer-list-template`    | 자식 ul hull `<template>` (재귀 cloneNode 대상) |
| itemTemplate | `#nav-drawer-item-template`    | li hull `<template>` (cloneNode 대상) |
| item         | `.nav-drawer__item`            | 렌더된 각 li 루트 — `data-navid`/`data-has-children`/`data-expanded`/`data-active`/`data-depth` 부착 + click 매핑 |
| sublist      | `.nav-drawer__sublist`         | 자식 ul (item에 자식이 있을 때 cloneNode로 li 안에 부착됨) |
| caret        | `.nav-drawer__caret`           | chevron — children 보유 항목에서만 보임 (`data-has-children="true"` 셀렉터 CSS) |
| icon         | `.nav-drawer__icon`            | 선행 아이콘 (Standard 호환 KEY) |
| label        | `.nav-drawer__label`           | 라벨 텍스트 (Standard 호환 KEY) |
| badge        | `.nav-drawer__badge`           | 뱃지 (Standard 호환 KEY) |

> **note**: cssSelectors는 ListRenderMixin에 전달하지 않는다(미사용). 자체 메서드(`_renderTree`/`_buildItemEl`/`_handleClick`/`_setExpanded`/`_handleSetExpandedNavs`)가 직접 querySelectorAll/closest로 사용한다. 본 컴포넌트의 cssSelectors는 `this._cssSelectors`로 인스턴스 자체에 보관(cascading과 동일 패턴).

### 인스턴스 상태

| 키 | 타입 | 기본 | 설명 |
|----|------|------|------|
| `_cssSelectors`   | `object`                   | (위 표) | 자체 메서드의 단일 진실 출처. customEvents 하드코딩 회피. |
| `_expandedIds`    | `Set<string>`              | 빈 Set  | 현재 expanded 상태인 부모 navid 집합. dataset과 동기화. |
| `_renderedRoot`   | `HTMLElement \| null`      | `null`  | top-level `.nav-drawer__list` cache. |
| `_groupHandlers`  | `{ click } \| null`        | `null`  | 컨테이너 native delegator bound refs. beforeDestroy 정리 대상. |
| `_itemTemplateEl` | `HTMLTemplateElement \| null` | `null` | item template cache. |
| `_listTemplateEl` | `HTMLTemplateElement \| null` | `null` | list template cache. |

### 구독 (subscriptions)

| topic | handler | payload |
|-------|---------|---------|
| `drawerItems`     | `this._renderTree`             | `[{ navid, icon, label, badge?, active?, children?: [...같은 구조] }]` — 재귀 트리. 새 batch는 새 진실(이전 누적 X). 새 페이로드 도착 시 트리 통째 재빌드 (`_expandedIds`는 유지 — 사용자가 펼쳐둔 상태가 데이터 갱신으로 닫히지 않도록). |
| `setExpandedNavs` | `this._handleSetExpandedNavs`  | `{ ids: [navid, ...] }` — 외부에서 expand 상태 강제 동기화. ids에 포함된 부모는 expand, 나머지 부모는 collapse. 변경된 li만 라이프사이클 이벤트 emit. |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 | payload |
|--------|------------------|------|---------|
| click | `item` (`_cssSelectors.item`) | `@navItemSelected` | `{ event, targetInstance }` (Standard 호환 시그니처) |

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@navItemSelected`  | leaf li 클릭 시 (children 없음). 1회. 명시 emit. | `{ targetInstance, navid, label, depth, path: Array<navid> }` |
| `@navItemExpanded`  | 부모 li가 collapsed → expanded로 전환된 시점. 1회. | `{ targetInstance, navid, depth, path }` |
| `@navItemCollapsed` | 부모 li가 expanded → collapsed로 전환된 시점. 1회. | `{ targetInstance, navid, depth, path }` |

> **이벤트 발행 분리 이유**: bindEvents 위임 발행은 `{ event, targetInstance }`만 전달하므로 nestedItems 컨텍스트(`navid`, `depth`, `path`)가 없다. 페이지가 leaf 액션을 분기할 때 매번 DOM을 다시 스캔하지 않아도 되도록 자체 native click delegator에서 명시 payload를 추가 emit한다 (cascading과 동일 패턴).

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderTree({ response })`         | `({response}) => void`        | `drawerItems` 핸들러. `_renderedRoot.innerHTML = ''` 후 response 배열을 순회하며 `_buildItemEl(item, depth=0, parentPath=[])`로 li 생성, `_renderedRoot.appendChild`. 빈 배열이면 트리 비움. `_expandedIds`는 유지(사용자 expand 상태 보존). 재빌드 후 `_expandedIds`에 있는 navid는 dataset에 다시 반영. |
| `_buildItemEl(item, depth, parentPath)` | `(object, number, Array) => HTMLElement` | item template clone → `data-navid`/`data-active`/`data-depth` dataset 부여 → icon/label/badge textContent 반영 → children 있으면 `data-has-children="true"` + list template clone(자식 ul) → 자식 항목 재귀 호출하여 자식 ul에 appendChild. li에 `data-path`(JSON 직렬화된 path 배열)도 부여. `_expandedIds.has(navid)`면 `data-expanded="true"` 초기 설정. |
| `_handleClick(e)`                   | `(MouseEvent) => void`        | 컨테이너 native `click` 위임. `e.target.closest(item)` 매치. children 보유 부모면 `_setExpanded(li, !current)` 토글. leaf면 `@navItemSelected` 명시 payload emit. |
| `_setExpanded(liEl, next)`          | `(HTMLElement, boolean) => void` | 멱등 expand/collapse. 현재 dataset 값과 같으면 silent return. `data-expanded` dataset 갱신 + `_expandedIds` Set add/delete + `_emitExpanded`/`_emitCollapsed` 발행. |
| `_emitExpanded(liEl)`               | `(HTMLElement) => void`       | `@navItemExpanded { targetInstance, navid, depth, path }` 1회 emit (data-* 추출). |
| `_emitCollapsed(liEl)`              | `(HTMLElement) => void`       | `@navItemCollapsed { targetInstance, navid, depth, path }` 1회 emit. |
| `_handleSetExpandedNavs({response})`| `({response}) => void`        | `setExpandedNavs` 토픽 핸들러. `response.ids`가 배열이면 모든 has-children li를 순회, navid가 ids에 포함되면 `_setExpanded(li, true)`, 아니면 `_setExpanded(li, false)`. 변경된 li만 이벤트 emit (멱등). |
| `_collectAllParents()`              | `() => Array<HTMLElement>`    | 모든 has-children li를 querySelectorAll로 수집. `_handleSetExpandedNavs`에서 사용. |

### 데이터 형식

`drawerItems` payload (재귀 트리):
```json
[
  { "navid": "dashboard",    "icon": "dashboard",   "label": "Dashboard",    "active": "true"  },
  { "navid": "compute",      "icon": "memory",      "label": "Compute",      "children": [
      { "navid": "vms",         "icon": "computer",    "label": "VM Instances", "badge": "12" },
      { "navid": "images",      "icon": "image",       "label": "Images" },
      { "navid": "snapshots",   "icon": "photo_camera","label": "Snapshots",    "badge": "3" }
  ]},
  { "navid": "settings",     "icon": "settings",    "label": "Settings",    "children": [
      { "navid": "general",     "icon": "tune",        "label": "General" },
      { "navid": "security",    "icon": "shield",      "label": "Security" },
      { "navid": "users",       "icon": "people",      "label": "Users",        "badge": "8" }
  ]}
]
```

`setExpandedNavs` payload:
```json
{ "ids": ["compute", "settings"] }
```

### 페이지 연결 사례

```
[페이지 — 클라우드 콘솔 사이드 nav]

  this.pageDataMappings = [
    { topic: 'drawerItems',     datasetInfo: { datasetName: 'drawer_items' } },
    { topic: 'setExpandedNavs', datasetInfo: { datasetName: 'expanded_navs' } }   // 선택
  ];

  Wkit.onEventBusHandlers({
    '@navItemSelected':  ({ navid, label, depth, path }) => {
        // path 배열로 라우팅 (예: ['compute', 'vms'] → /compute/vms)
        router.go('/' + path.join('/'));
    },
    '@navItemExpanded':  ({ navid, path }) => analytics.track('drawer_expand', { navid, path }),
    '@navItemCollapsed': ({ navid, path }) => analytics.track('drawer_collapse', { navid, path })
  });

  // 라우터가 경로 변경 시 부모 자동 expand
  router.onChange(({ pathSegments }) => {
    const ancestors = pathSegments.slice(0, -1);   // leaf 빼고 모두 ancestor
    instance.subscriptions.setExpandedNavs.forEach(h => h.call(instance, { response: { ids: ancestors } }));
  });

[NavigationDrawer/Advanced/nestedItems]
    ├─ _renderTree가 root 'dashboard'/'compute'/'settings' 3개 li를 top-level ul에 빌드
    ├─ 'compute', 'settings'에 children 있음 → data-has-children="true" + 자식 ul 부착
    └─ 'dashboard'는 leaf

[사용자가 'compute' 클릭]
    ├─ _handleClick → has-children 매치 → _setExpanded(li, true)
    ├─ data-expanded="true" + _expandedIds.add('compute')
    ├─ CSS — 자식 ul 표시 + chevron 90deg 회전
    └─ @navItemExpanded: { navid: 'compute', depth: 0, path: ['compute'] }

[사용자가 자식 'vms' (leaf, depth=1) 클릭]
    ├─ _handleClick → leaf 매치
    └─ Weventbus.emit('@navItemSelected', { navid: 'vms', label: 'VM Instances', depth: 1, path: ['compute', 'vms'] })

[외부 라우팅 → /settings/users 진입 → 페이지가 ancestors publish]
    └─ instance.subscriptions.setExpandedNavs.forEach(h => h.call(instance, { response: { ids: ['settings'] } }))
        → _handleSetExpandedNavs → 'compute' 자동 collapse + 'settings' expand 동기화 (변경된 li만 이벤트 emit)
```

### 디자인 변형

| 파일 | 페르소나 | expand/collapse 시각 + chevron 회전 | 도메인 컨텍스트 예 |
|------|---------|-------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 / chevron 90deg / 자식 ul 좌측 16px 들여쓰기 + 좌측 1px 퍼플 가이드 라인 / 220ms ease-out | **클라우드 콘솔 — Compute / Storage / Network 카테고리 → VM/Bucket/VPC 서브 메뉴** |
| `02_material`    | B: Material Elevated | 라이트 / chevron rotate 180→90 / Material elevation level 1 / 자식 항목 padding-left 56px (icon 정렬) / 250ms standard easing | **GitHub 레포 settings — General / Security / Webhooks / Pages** |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 / chevron serif "›" U+203A 회전 / 자식 ul 좌측 24px + 1.5px 헤어라인 / 300ms slow ease | **Notion 사이드바 — Workspace / Private / Shared 카테고리 → 페이지 트리** |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 / chevron 시안 모노 ">" / 자식 ul 들여쓰기 12px + 시안 좌측 1px ring / 120ms snappy linear | **관제 콘솔 — Sites / Devices / Alerts 카테고리 → 트리 네비** |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, `[data-expanded="true|false"]` / `[data-has-children="true"]` / `[data-active="true"]` 셀렉터로 시각을 분기. 자식 ul은 부모 li 아래에 `display: none` (기본) ↔ `display: flex` (`data-expanded="true"`)로 토글되며, depth에 따라 padding-left가 누적된다(CSS `data-depth` 셀렉터 분기 또는 자식 ul 자체의 padding-left).

### 결정사항

- **Mixin 0종 — 자체 `_renderTree`로 nested DOM 직접 빌드**: ListRenderMixin은 평면 N개 row 전용이라 재귀 트리에 부적합. TreeRenderMixin은 데이터 표시 + cascade 패턴이며 nestedItems(메뉴 expand/collapse)와는 다르다 → 자체 메서드로 `<template>` 2종을 cloneNode 재귀로 조립 (Menus/Advanced/cascading 동일 패턴 답습).
- **multi-expand 허용** (cascading의 단일 활성 path와 다름): drawer 사이드 nav는 사용자가 여러 카테고리를 동시에 펼쳐 보는 패턴(GCP, GitHub, Notion 모두 동일). 같은 부모의 형제 expand는 독립적으로 토글 — `_expandedIds: Set` 자체 보관.
- **`_renderTree`는 새 batch가 새 진실 + `_expandedIds` 보존**: `drawerItems` 새 publish 시 트리 통째 재빌드(이전 트리 누적 X). 단 `_expandedIds`는 유지 — 사용자가 expand 해둔 카테고리가 데이터 갱신으로 자동 닫히지 않도록(Notion sidebar UX).
- **`@navItemSelected` 이름 통일** (collapsible과 동일): Navigation/Advanced 큰 범주 일관성. Standard `@menuItemClicked` → `@navItemSelected`.
- **leaf 클릭 시 트리 dismiss 안 함** (cascading과 다름): drawer 메뉴는 leaf 선택 후에도 부모 카테고리는 펼쳐진 상태 유지(사용자가 형제 메뉴로 빠르게 이동할 수 있도록). cascading은 임시 표면이므로 dismiss하지만 drawer는 영구 표면.
- **컨테이너 native click delegator** (cascading 답습): bindEvents 위임 + 자체 native click delegator 두 채널 직교. bindEvents는 Standard 호환 시그니처(`@navItemSelected` `{ event, targetInstance }`), 자체 delegator는 명시 payload + expand 토글 분기.
- **신규 Mixin 생성 금지** — 자체 메서드로 완결. **반복 패턴 후보 메모**: `NestedMenuMixin`(또는 `RecursiveListRenderMixin`) — 재귀 트리 nested ul/li 빌드 + expand/collapse 토글 + multi-expand + leaf 발행. cascading + nestedItems 2회 누적 (회귀 규율 — 향후 contextMenu/folderTree/sidebarMenu에서 1회 더 누적되면 일반화 검토).

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 6단계 (../를 6번)
