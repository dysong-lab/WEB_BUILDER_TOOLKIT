# Menus — Advanced / cascading

## 기능 정의

1. **다단계(중첩) 메뉴 항목 렌더링** — `menuItems` 토픽으로 수신한 **재귀 트리 배열**(`[{ menuid, leading?, label, trailing?, children?: [같은 구조] }]`)을 자체 메서드(`_renderTree`)가 nested `<ul>` 구조로 한 번에 렌더한다. ListRenderMixin은 항목을 인지하지만 children 재귀는 인지하지 않으므로(`children`을 selector KEY로 다루지 않음 — 중첩 구조는 컴포넌트 자체 메서드가 전담) `_renderTree`가 자식 ul을 직접 만들어 부모 li 아래에 붙인다. children이 있는 항목은 `data-has-children="true"` + 우측 ▶ caret 시각화. children이 없는 항목은 leaf — 클릭 시 `@menuItemClicked` 발행 + 트리 전체 닫기. (어떤 항목이든 children이 비어있거나 길이가 0이면 leaf 취급.)
2. **자식 메뉴 hover/click 토글 + 단일 활성 path** — 부모 li에 마우스가 enter하면 300ms 짧은 지연 없이 즉시 `data-open="true"` 부착(자식 ul이 우측에 나타남). 같은 depth 형제들의 `data-open`은 자동으로 false로 닫힘(같은 depth에서는 한 path만 활성). 마우스가 부모 li 또는 자식 ul **둘 다 떠나면** 300ms `setTimeout` 지연 후 닫힘 — 마우스가 부모→자식 ul로 이동하는 동안 의도치 않게 닫히지 않도록 `mouseleave` 지연을 둔다(`mouseenter` 시점에 active 타이머가 있으면 `clearTimeout`). click도 토글로 동작(터치/키보드 호환) — children 보유 부모를 클릭하면 즉시 열고, 다시 클릭하면 닫는다(leaf는 토글 X, `@menuItemClicked` 발행).
3. **leaf 항목 클릭 이벤트 + 트리 dismiss** — children이 없는 leaf li 클릭 시 `@menuItemClicked` 발행 (Standard 호환 payload `{ targetInstance, event }` + 자체 명시 emit `{ menuid, label, depth, path: [...ancestor menuids] }`). 발행 직후 모든 depth의 `data-open` 일괄 false 처리(트리 닫기) + active 타이머 정리. `data-disabled="true"` / `data-divider="true"` 항목은 클릭 무시(silent return). 페이지가 결정적으로 항목 액션을 받고 메뉴는 자동 dismiss되는 표준 cascading 메뉴 UX.
4. **submenu 라이프사이클 이벤트** — 부모 li가 열리는 시점 1회 `@submenuOpened { targetInstance, menuid, depth, path }` 발행, 닫히는 시점 1회 `@submenuClosed { targetInstance, menuid, depth, path }` 발행. hover 진입/이탈, click 토글, 형제 활성화로 인한 자동 닫힘, 외부 dismiss(트리 dismiss) 모두 동일 이벤트로 발행. `path`는 root → 자기자신까지의 menuid 배열(인덱싱 분기에 사용 가능).
5. **외부 publish dismiss (`setMenuOpen`)** — `setMenuOpen` 토픽으로 `{ open: false }` 페이로드 publish 시 모든 depth의 `data-open` 일괄 false 처리(트리 통째 닫기). active 타이머 정리. 트리가 이미 모두 닫혀있으면 silent no-op. (`{ open: true }`는 본 변형에서는 무의미 — 메뉴는 hover/click으로만 열린다.)

> **Standard와의 분리 정당성**:
> - **데이터 모델 — children 재귀 배열** — Standard는 평면 배열 1차원, cascading은 `{children: [...]}` 트리. Standard ListRenderMixin은 평면 N개 row만 렌더 가능 → 재귀 nested ul/li 구조를 만들 수 없으므로 자체 `_renderTree` 메서드가 cloneNode + 재귀로 직접 생성.
> - **새 자체 상태 4종** — `_closeTimer: number | null`(mouseleave 300ms 지연 ID), `_renderedRoot: HTMLElement | null`(top-level ul cache, dismiss 시 일괄 querySelectorAll 대상), `_groupHandlers: { mouseenter, mouseleave, click } | null`(컨테이너 native delegator bound refs), `_itemTemplateEl: HTMLTemplateElement | null` + `_listTemplateEl`(template cache). Standard는 stateless.
> - **자체 메서드 7종** — `_renderTree` / `_buildItemEl` / `_handleEnter` / `_handleLeave` / `_handleClick` / `_closeAll` / `_handleSetMenuOpen`. Standard는 자체 메서드 0종.
> - **HTML 구조 변경** — Standard는 `.menu__items` 단일 컨테이너 + `<template id="menu-item-template">` 1개. cascading은 `.menu` + `.menu__list`(top-level ul) + `<template id="menu-item-template">` (li hull) + `<template id="menu-list-template">` (자식 ul hull, 재귀 cloneNode 대상). leaf/parent 구분은 `data-has-children` + caret element. submenu는 같은 popup 내부에 nested로 표현(별도 ShadowPopup 띄우지 않음 — 단일 컨테이너 단순화).
> - **새 토픽 1종** — `setMenuOpen` (외부 dismiss). Standard는 `menuItems` 1종.
> - **새 이벤트 2종** — `@submenuOpened` / `@submenuClosed` (라이프사이클). `@menuItemClicked`는 Standard 호환 시그니처 + 자체 명시 emit으로 `depth`/`path` 추가.
> - **native pointer 라이프사이클** — Standard는 bindEvents 위임 click 1종만. cascading은 컨테이너 native `mouseenter` / `mouseleave` / `click` 3종 + setTimeout 라이프사이클(타이머 정리 책임). Standard는 사용 안 함.
>
> 위 6축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.

> **Lists/Advanced/multiSelect 차용 + 차이**: multiSelect의 `컨테이너 native click delegator + bound handler ref + beforeDestroy detach + ListRenderMixin + 자체 명시 emit` 패턴을 그대로 차용. 차이는 ① **데이터 모델이 재귀 트리**(평면 N개 row → nested children), ② **mouseenter / mouseleave 라이프사이클 + setTimeout 지연 추가**(multiSelect는 click only), ③ **`_renderTree` 자체 렌더 메서드**(ListRenderMixin은 평면만 처리 가능 — 재귀는 컴포넌트 책임), ④ **hover/click 두 입력 모드 동시 지원**, ⑤ submenu 단일 활성 path(같은 depth 형제는 자동 닫힘).

> **Dialogs/Advanced/draggable 차용 + 차이**: draggable의 `bound handler ref + 자체 메서드 + 라이프사이클 이벤트(@xxxOpened/@xxxClosed) + 외부 publish 토픽(setDialogOpen)` 패턴을 차용. 차이는 ① **ShadowPopupMixin 미사용**(메뉴는 페이지가 외부에서 띄우는 인라인 표면 — Menus Standard와 일관, ShadowPopup은 향후 contextual/floating 변형에서 사용), ② **pointer 4종 미사용**(드래그 없음), ③ **mouseenter/mouseleave/click 3종 + setTimeout 라이프사이클**, ④ **재귀 nested DOM 빌드**.

> **Checkbox/Advanced/nestedTree와의 차이 (1줄 핵심)**: nestedTree는 **TreeRenderMixin + 체크박스 cascade**(`{parent, children}` 재귀 데이터를 트리 체크박스로, `_nodeStates: Map`으로 cascade up/down). cascading은 **재귀 메뉴 hover/click 토글**(`menuItems` 트리 데이터를 메뉴 nested ul로, `_closeTimer + data-open`으로 단일 활성 path). 데이터 모델은 모두 재귀 트리지만 **인터랙션이 직교** — 한 컴포넌트에서 둘 다 강제하면 register.js 이중 충돌(상태/이벤트/native event 중복) → 별 변형으로 분리. 또한 cascading은 `TreeRenderMixin`을 사용하지 않는다(TreeRenderMixin은 expanded/collapsed 토글 + 데이터 표시 패턴이고, cascading 메뉴는 hover로 즉시 자식 ul을 우측에 띄우는 다른 인터랙션 — 시각/이벤트 모델이 다르므로 자체 `_renderTree`로 직접 구성).

> **MD3 / 도메인 근거**: MD3 Menus는 표준 명세상 평면 메뉴를 다루며 다단계는 명시되지 않지만, **데스크톱 애플리케이션의 메뉴바 + context menu**(파일/편집/뷰/도구 메뉴, OS native context menu, 개발 IDE의 "변환 → 형식" 다단계 액션)에서 **cascading submenu**는 표준 패턴이다. 실사용 예: ① **파일 메뉴 → 내보내기 → 형식 선택**(코드 에디터의 export submenu), ② **설정 메뉴 → 사용자 → 권한 관리**(관리 콘솔의 nested 설정 카테고리), ③ **도구 메뉴 → 분석 → 알고리즘 선택**(데이터 분석 도구의 알고리즘 카테고리), ④ **우클릭 컨텍스트 메뉴 → 정렬 → 기준 선택**(파일 매니저). 모든 실사용 케이스에서 hover/click 토글 + 단일 활성 path + leaf 클릭 dismiss는 표준 UX (Windows/macOS native menu, JetBrains, VS Code 모두 동일 패턴).

---

## 구현 명세

### Mixin

ListRenderMixin은 cascading의 재귀 트리 데이터에 적합하지 않다(평면 N개 row 전용). cascading은 **자체 `_renderTree` 메서드**가 `<template>` 2종(item hull, list hull)을 cloneNode 재귀로 조립하여 nested ul/li 구조를 만든다. 따라서 본 변형은 **Mixin 0종**(기존 ListRenderMixin도 사용 안 함) + 자체 메서드 7종으로 완결한다.

> **신규 Mixin 생성 금지** — 큐 설명에 "신규 CascadingMenuMixin 필요"가 적혀 있으나 SKILL 규칙(produce-component Step 3-1)에 따라 본 루프에서 새 Mixin을 만들지 않는다. ListRenderMixin은 평면 배열 전용이라 재귀 trees에 부적합 — 자체 `_renderTree` 메서드가 cloneNode 재귀로 nested DOM을 빌드한다. **반복 패턴 후보 메모**: `CascadingMenuMixin`(또는 `RecursiveListRenderMixin`) — 트리 메뉴 hover/click 토글 + 단일 활성 path + leaf 클릭 발행 패턴이 향후 contextMenu/floatingMenu/sideMenu 등에서 재사용된다면 일반화 검토 (SKILL 회귀 규율 — 1번 회귀 = 즉시 검토).

### cssSelectors (자체 사용 — Mixin에 전달 X)

| KEY | VALUE | 용도 |
|-----|-------|------|
| group        | `.menu`               | 그룹 컨테이너 — `role="menu"`, container의 컨테이너 native event 부착 대상 |
| list         | `.menu__list`         | top-level ul — `_renderTree` 결과가 채워지는 부모 요소 |
| listTemplate | `#menu-list-template` | 자식 ul hull `<template>` (재귀 cloneNode 대상) |
| itemTemplate | `#menu-item-template` | li hull `<template>` (cloneNode 대상) |
| item         | `.menu__item`         | 렌더된 각 li 루트 — `data-menuid` / `data-has-children` / `data-open` / `data-disabled` / `data-divider` 부착 + click/hover 매핑 |
| sublist      | `.menu__sublist`      | 자식 ul (item에 자식이 있을 때 cloneNode로 li 안에 부착됨) |
| caret        | `.menu__caret`        | 우측 ▶ 표시 (children 보유 항목에서만 보임 — `data-has-children="true"` 셀렉터 CSS) |
| leading      | `.menu__leading`      | 선행 아이콘 (Standard 호환 KEY) |
| label        | `.menu__label`        | 항목 레이블 (Standard 호환 KEY) |
| trailing     | `.menu__trailing`     | 후행 텍스트 (Standard 호환 KEY) |

> **note**: cssSelectors는 ListRenderMixin에 전달하지 않는다(미사용). 자체 메서드(`_renderTree`/`_buildItemEl`/`_handleEnter`/`_handleLeave`/`_handleClick`/`_closeAll`)가 직접 querySelectorAll/closest로 사용한다. 본 컴포넌트의 cssSelectors는 `this._cssSelectors`로 인스턴스 자체에 보관(Mixin 네임스페이스 패턴 흡수).

### 인스턴스 상태

| 키 | 타입 | 기본 | 설명 |
|----|------|------|------|
| `_cssSelectors` | `object` | (위 표) | 자체 메서드의 단일 진실 출처. `customEvents`에서 computed property로 참조 가능. |
| `_closeTimer` | `number \| null` | `null` | mouseleave 후 300ms 지연 dismiss 타이머 ID. mouseenter 시 clearTimeout으로 취소. |
| `_closeDelay` | `number` | `300` | mouseleave dismiss 지연(ms). |
| `_renderedRoot` | `HTMLElement \| null` | `null` | top-level `.menu__list` cache. `_closeAll`이 일괄 querySelectorAll 대상. |
| `_groupHandlers` | `{mouseenter, mouseleave, click} \| null` | `null` | 컨테이너 native delegator bound refs — beforeDestroy에서 정확히 removeEventListener. |
| `_itemTemplateEl` | `HTMLTemplateElement \| null` | `null` | item template cache. |
| `_listTemplateEl` | `HTMLTemplateElement \| null` | `null` | list template cache. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `menuItems` | `this._renderTree` | `[{ menuid, leading?, label, trailing?, disabled?, divider?, children?: [...같은 구조] }]` — root 레벨 항목 배열. children 재귀로 임의 depth 가능. 새 batch는 새 진실(이전 누적 X). 새 페이로드 도착 시 `_closeAll` 후 트리 통째 재빌드. |
| `setMenuOpen` | `this._handleSetMenuOpen` | `{ open: false }` — 외부 dismiss (트리 통째 닫기). `{ open: true }`는 무시 (메뉴는 hover/click으로만 열린다). |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 | payload |
|--------|------------------|------|---------|
| click | `item` (`_cssSelectors.item`) | `@menuItemClicked` | `{ event, targetInstance }` (Standard 호환 시그니처). |

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@menuItemClicked` | leaf li 클릭 시 (children 없음 + disabled/divider 아님). 1회. | `{ targetInstance, menuid, label, depth, path: Array<menuid> }` (Standard 호환 + cascading 컨텍스트 추가) |
| `@submenuOpened` | 부모 li가 닫힘→열림으로 전환된 시점. 1회. | `{ targetInstance, menuid, depth, path }` |
| `@submenuClosed` | 부모 li가 열림→닫힘으로 전환된 시점. 1회 (sibling 활성/dismiss/외부 토픽 모두 포함). | `{ targetInstance, menuid, depth, path }` |

> **이벤트 발행 분리 이유**: bindEvents 위임 발행은 `{ event, targetInstance }`만 전달하므로 cascading 컨텍스트(`menuid`, `depth`, `path`)가 없다. 페이지가 leaf 액션을 분기할 때 매번 DOM을 다시 스캔하지 않아도 되도록 자체 native click delegator에서 명시 payload를 추가 emit한다. customEvents의 위임 발행은 trigger 알림 의미 + Weventbus 채널 등록 보장 의미로 유지하되, 페이지가 사용하는 페이로드는 명시 emit이 우선한다 (multiSelect와 동일 패턴).

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderTree({ response })` | `({response}) => void` | `menuItems` 핸들러. `_closeAll()` 후 `_renderedRoot.innerHTML = ''`. response 배열을 순회하며 `_buildItemEl(item, depth=0, parentPath=[])`로 li 생성, `_renderedRoot.appendChild`. 빈 배열이면 트리 비움. (new batch is new truth — 이전 누적 X) |
| `_buildItemEl(item, depth, parentPath)` | `(object, number, Array<string>) => HTMLElement` | item template clone → `data-menuid`/`data-disabled`/`data-divider` dataset 부여 → leading/label/trailing textContent 반영 → children 있으면 `data-has-children="true"` + list template clone(자식 ul) → 자식 항목 재귀 호출하여 자식 ul에 appendChild → 자식 ul을 li에 appendChild. li에 `data-path`(JSON 직렬화된 path 배열)도 부여(closest로 path 추출). |
| `_handleEnter(e)` | `(MouseEvent) => void` | 컨테이너 native `mouseenter` 위임(capture). `e.target.closest(item)` 확인. 매치 + `data-has-children="true"` + 비-disabled/divider면: 같은 depth 형제 닫기 → 자기 자신 `data-open="true"` → `_closeTimer` clearTimeout(pending dismiss 취소) → `@submenuOpened` 1회 emit (이미 열려있으면 silent). |
| `_handleLeave(e)` | `(MouseEvent) => void` | 컨테이너 native `mouseleave` 위임(capture). 컨테이너 자체에서 마우스가 나간 경우만 처리(자식 li 간 이동은 무시). `_closeTimer` 설정(`setTimeout(_closeAll, _closeDelay)`). |
| `_handleClick(e)` | `(MouseEvent) => void` | 컨테이너 native `click` 위임. `e.target.closest(item)` 매치 → disabled/divider면 silent return. children 보유 부모면 토글(이미 열려있으면 닫고 `@submenuClosed` emit, 닫혀있으면 형제 닫기 후 열고 `@submenuOpened` emit). leaf면 `@menuItemClicked` 명시 payload emit + `_closeAll`. (bindEvents 위임은 별도로 `@menuItemClicked` Standard 시그니처 발행 — 두 채널 직교) |
| `_closeAll()` | `() => void` | `_closeTimer = null`. `_renderedRoot.querySelectorAll('[data-open="true"]')` 순회 → 각 li `data-open="false"` 부여 + `@submenuClosed` 1회 emit (이미 닫힌 li는 건너뜀 — `getAttribute('data-open') === 'true'` 검사). |
| `_handleSetMenuOpen({ response })` | `({response}) => void` | `setMenuOpen` 토픽 핸들러. `response.open === false`면 `_closeAll()` 호출. true 또는 기타는 무시. |

### 페이지 연결 사례

```
[페이지 — 코드 에디터의 파일 메뉴]
   │
   ├─ this.pageDataMappings = [
   │     { topic: 'menuItems', datasetInfo: {...}, refreshInterval: 0 },
   │     { topic: 'setMenuOpen', datasetInfo: {...}, refreshInterval: 0 }   // 선택
   │  ];
   │
   └─ // 트리 데이터 (재귀 children)
      [
        { menuid: 'file',     leading: '📄', label: 'File',
          children: [
            { menuid: 'new',      leading: '✨', label: 'New File',  trailing: '⌘N' },
            { menuid: 'open',     leading: '📂', label: 'Open...',   trailing: '⌘O' },
            { menuid: 'export',   leading: '📤', label: 'Export',
              children: [
                { menuid: 'export-pdf',  label: 'PDF' },
                { menuid: 'export-html', label: 'HTML' },
                { menuid: 'export-md',   label: 'Markdown', trailing: '⌘M' }
              ]
            }
          ]
        },
        { menuid: 'edit',     leading: '✏', label: 'Edit',
          children: [
            { menuid: 'undo', label: 'Undo', trailing: '⌘Z' },
            { menuid: 'redo', label: 'Redo', trailing: '⌘⇧Z' }
          ]
        }
      ]

[Menus/Advanced/cascading]
    ├─ _renderTree가 root 'file'/'edit' 2개 li를 top-level ul에 빌드
    ├─ 'file'에 children 있음 → data-has-children="true" + 자식 ul 부착(자식 li 'new'/'open'/'export')
    ├─ 'export'에 children 있음 → 또 자식 ul 부착 (depth=2)
    └─ 'export-pdf'/'-html'/'-md'는 leaf (data-has-children 없음)

[사용자가 'file'에 mouseenter]
    ├─ _handleEnter → data-has-children="true" 매치
    ├─ 같은 depth 형제 'edit'은 닫혀있음 (이미 닫힘 — 변경 없음)
    ├─ 'file' data-open="true"
    └─ @submenuOpened: { menuid: 'file', depth: 0, path: ['file'] }

[사용자가 'file' → 'export' 위로 마우스 이동 (depth 1)]
    ├─ 'file' 자체는 contains 영역이라 mouseleave 안 일어남
    ├─ 'export' mouseenter → data-has-children="true" 매치
    ├─ 같은 depth(1) 형제 'new'/'open'은 has-children 없음 — 영향 없음
    ├─ 'export' data-open="true"
    └─ @submenuOpened: { menuid: 'export', depth: 1, path: ['file', 'export'] }

[사용자가 'export-md' (leaf, depth=2) 클릭]
    ├─ _handleClick → leaf 매치 + 비-disabled
    ├─ Weventbus.emit('@menuItemClicked', { menuid: 'export-md', label: 'Markdown', depth: 2, path: ['file', 'export', 'export-md'] })
    ├─ _closeAll() → 'file', 'export' 순회하며 data-open="false" + @submenuClosed 2회 emit
    └─ 트리 통째 닫힘

[사용자가 메뉴 바깥 클릭 → 페이지가 외부 dismiss]
    └─ instance.subscriptions.setMenuOpen.forEach(h => h.call(instance, { response: { open: false } }))
        → _handleSetMenuOpen → _closeAll() → 트리 dismiss

운영: this.pageDataMappings = [
        { topic: 'menuItems',   datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setMenuOpen', datasetInfo: {...}, refreshInterval: 0 }   // 선택
      ];
      Wkit.onEventBusHandlers({
        '@menuItemClicked': ({ menuid, label, depth, path }) => {
          // path 배열로 액션 분기 (path[0]==='file' && path[1]==='export' 등)
          // depth로 leaf 레벨 검증 가능
        },
        '@submenuOpened': ({ menuid, depth, path }) => analytics.track('submenu_open', {menuid, depth}),
        '@submenuClosed': ({ menuid, depth, path }) => { /* optional */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | submenu 시각 차별 (data-open / data-has-children) | 도메인 컨텍스트 예 |
|------|---------|---------------------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 / 그라디언트 호버 / Pretendard. 자식 ul: 부모 li 우측에 absolute positioned, 같은 다크 퍼플 토널 + 1px 글로우 outline. caret ▶: 퍼플 글로우 시안. data-open 시 caret rotate 90deg + 부모 li 배경 active fill. | **코드 에디터 파일 메뉴 → 내보내기 → 형식 선택** (File → Export → PDF/HTML/Markdown) |
| `02_material`    | B: Material Elevated | 라이트 / elevation shadow / Roboto. 자식 ul: 부모 li 우측 + Material elevation level 4. caret ▶: 표준 shape `Material Symbols`. data-open 시 부모 li `secondary container` 색 active. | **설정 메뉴 → 사용자 → 권한 관리** (관리 콘솔의 nested 설정) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 / DM Serif label / 1px 헤어라인. 자식 ul: 부모 li 우측 + 1.5px serif 두꺼운 outline + 페이드 배경. caret ▶: serif "›" U+203A 단일 문자. data-open 시 부모 li italic accent. | **추천 기사 분류 → 카테고리 선택** (편집 도구의 nested taxonomy) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 / 시안 ring / IBM Plex Mono trailing. 자식 ul: 부모 li 우측 + 시안 1px ring(`box-shadow: 0 0 0 1px #4DD0E1`) + 매우 컴팩트 padding. caret ▶: 시안 모노 `>`. data-open 시 부모 li 시안 fill(`rgba(77,208,225,.12)`). | **도구 메뉴 → 분석 → 알고리즘 선택** (운영 콘솔의 분석 카테고리) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, `[data-open="true"]` / `[data-has-children="true"]` / `[data-disabled="true"]` / `[data-divider="true"]` 셀렉터로 시각을 분기. 자식 ul은 `position: absolute; left: 100%; top: 0`으로 부모 li 우측에 띄우며 `data-open="true"` 일 때만 `display: block` (기본 `display: none`).

### 결정사항

- **Mixin 0종 — 자체 `_renderTree`로 nested DOM 직접 빌드**: ListRenderMixin은 평면 N개 row 전용이라 재귀 트리에 부적합. TreeRenderMixin은 expanded/collapsed 토글 + 데이터 표시 패턴이며 cascading 메뉴(hover로 즉시 자식 ul을 우측에 띄움)와 시각·이벤트 모델이 다르다 → 자체 메서드로 `<template>` 2종(item hull, list hull)을 cloneNode 재귀로 조립. 큐 메모: `CascadingMenuMixin` 일반화 검토 후보(반환 메모만, SKILL 회귀 규율).
- **hover 즉시 열기 + leave 300ms 지연 닫기**: 마우스가 부모 li → 자식 ul로 이동하는 동안 트리가 닫히지 않도록 `mouseleave` 후 `setTimeout(300)` 지연. `mouseenter` 시점에 active 타이머가 있으면 `clearTimeout`. click 토글도 함께 지원(터치/키보드 호환).
- **leaf 클릭 시 트리 통째 dismiss**: 표준 cascading 메뉴 UX(Windows/macOS native menu, IDE). leaf 액션이 결정되면 페이지가 dismiss를 명시 publish할 필요 없이 컴포넌트가 자동 dismiss + `@submenuClosed` 일괄 emit.
- **단일 활성 path** (같은 depth 형제 자동 닫기): `_handleEnter`/`_handleClick`이 자기 자신을 열기 전에 같은 부모의 sibling li를 모두 닫는다 → 사용자 시야에 한 번에 하나의 path만 표시되어 인지 부하 감소(Windows/macOS native menu와 일관).
- **`@submenuOpened`/`@submenuClosed` 라이프사이클 발행**: 페이지가 anaytics/툴팁/툴바 갱신 등 부수 효과를 분기할 수 있도록 hover 진입/이탈, click 토글, sibling 자동 닫힘, 외부 dismiss 모두 동일 이벤트로 발행. `path` 포함하여 분기 단순화.
- **`_renderTree`는 새 batch가 새 진실** (`menuItems` 새 publish 시 트리 통째 재빌드 + `_closeAll`): 이전 누적 X — Cards/selectable + Lists/multiSelect와 일관. 페이지가 메뉴 데이터를 동적으로 바꿀 때 이전 활성 path는 의도적으로 버린다.
- **신규 Mixin 생성 금지**: 자체 메서드로 완결. **반복 패턴 후보 메모**: `CascadingMenuMixin`(또는 `RecursiveListRenderMixin`) — 재귀 트리 nested ul/li 빌드 + hover/click 토글 + 단일 활성 path + leaf 발행 패턴이 향후 contextMenu/floatingMenu/sideMenu 등 추가 변형에서 누적되면 일반화 검토(SKILL 회귀 규율).

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 5단계 (../를 5번)
