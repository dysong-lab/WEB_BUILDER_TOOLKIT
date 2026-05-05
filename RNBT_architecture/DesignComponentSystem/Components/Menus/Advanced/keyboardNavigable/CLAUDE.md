# Menus — Advanced / keyboardNavigable

## 기능 정의

1. **메뉴 항목 렌더링 (ListRenderMixin)** — `menuItems` 토픽으로 수신한 평면 배열(`[{ itemid, leading?, label, trailing?, disabled?, divider? }]`)을 ListRenderMixin이 `<template>` cloneNode로 li 항목을 생성하여 `.kbnav-menu__list`에 채운다. 데이터 모델은 Standard와 동일한 평면 배열. `data-itemid` / `data-disabled` / `data-divider` dataset 부여로 항목 상태를 표현.
2. **roving tabindex 관리** — 메뉴가 열렸을 때 첫 항목(첫 비-disabled/divider)에 `tabindex="0"`, 나머지에 `tabindex="-1"`을 부여하여 Tab 한 번으로 메뉴에 진입한 후 화살표로 항목 간 이동하도록 한다. focus 이동 시마다 이전 항목 `tabindex="-1"`, 새 항목 `tabindex="0"` + `_focusIndex` 갱신 + `_items[_focusIndex].focus()` 호출. WAI-ARIA `role="menu"` / `role="menuitem"` 패턴 준수.
3. **키보드 네비게이션 (ArrowDown/Up/Home/End)** — 메뉴 컨테이너 capture phase에 부착된 단일 `keydown` 핸들러가 `e.key`로 분기: ① ArrowDown → 다음 비-disabled/divider로 순환 이동, ② ArrowUp → 이전 비-disabled/divider로 순환 이동, ③ Home → 첫 비-disabled/divider로, ④ End → 마지막 비-disabled/divider로. 각 키는 `e.preventDefault()` + `e.stopPropagation()`(스크롤/페이지 이동 차단) + roving tabindex 갱신.
4. **Enter/Space 활성화** — focused 항목에서 Enter 또는 Space 키 입력 시 해당 항목을 클릭한 것과 동일하게 `@menuItemClicked` 명시 payload(`{ itemid, label, source: 'keyboard' }`) emit. disabled/divider면 무시. `e.preventDefault()`(Space의 페이지 스크롤 차단).
5. **Escape 닫기 + trigger focus 복귀** — 메뉴가 열린 상태에서 Escape → `_close('escape')` + 메뉴 표시/숨김 토글 + `_lastTrigger?.focus()` 로 trigger 요소에 focus 복귀(접근성 표준 — 키보드 사용자가 메뉴 진입 직전 위치로 돌아감). `@menuClosed { reason: 'escape' }` emit.
6. **Tab 닫기 + 다음 focusable로 진행** — 메뉴가 열린 상태에서 Tab(또는 Shift+Tab) → 메뉴 dismiss 후 native Tab 동작 허용(`e.preventDefault()` 호출 X — 브라우저가 다음 focusable로 자연스럽게 이동). `@menuClosed { reason: 'tab' }` emit. 단, Escape와 달리 trigger로 복귀하지 않고 다음/이전 focusable 요소로 진행.
7. **첫 글자 quick search** — 메뉴가 열린 상태에서 영문/숫자/한글 등 단일 문자 키 입력 시 해당 글자로 시작하는 다음 항목으로 focus 이동(현재 위치 다음부터 순환 검색). 1초 이내 추가 입력은 누적 prefix로 검색(예: "fi" → "file"로 시작 항목). 1초 timeout으로 prefix 리셋. disabled/divider 항목은 검색 대상에서 제외.
8. **trigger button 토글 + 상태 동기화** — `.kbnav-menu__trigger` 버튼 click 또는 Enter/Space 시 메뉴 토글(`_open`/`_close`). `aria-expanded` / `aria-haspopup="menu"` / `aria-controls` 동기화. `_open()` 직후 첫 항목으로 `focus()` 이동. 외부 publish (`setMenuOpen { open: true|false }`)로도 동기화 가능 — 페이지 외부에서 강제 dismiss / 강제 open 시나리오 지원.
9. **외부 click dismiss** — 메뉴가 열려있는 동안 document에 capture phase로 임시 click listener 부착. trigger 영역 또는 메뉴 영역 바깥 click 시 `_close('outside')` + `@menuClosed { reason: 'outside' }` emit + trigger로 focus 복귀하지 않음(마우스 사용자는 이미 다른 곳을 보고 있음).
10. **항목 클릭/keyboard 활성화 후 dismiss** — 항목 클릭 또는 Enter/Space 활성화 시 `@menuItemClicked { itemid, label, source: 'click'|'keyboard' }` emit + `_close('item')` + trigger로 focus 복귀(`source === 'keyboard'`인 경우만 — 마우스 클릭은 복귀 X).

> **Standard와의 분리 정당성**:
> - **input source 차이** — Standard는 inline 항상 표시 + 항목 click만 처리. keyboardNavigable은 **trigger 버튼 toggle + 키보드 네비게이션 6종(Arrow×2, Home, End, Enter/Space, Escape, Tab) + 첫 글자 quick search**가 핵심. 데이터 흐름과 라이프사이클이 직교.
> - **표시 모델 차이** — Standard는 `display`-on inline. keyboardNavigable은 **trigger 토글 + `data-open` + roving tabindex 관리 + focus state 추적**으로 자기 자신이 표시/숨김/포커스를 제어.
> - **새 자체 상태 8종** — `_focusIndex`, `_items`(현재 렌더된 li 배열 cache), `_isOpen`, `_lastTrigger`, `_searchPrefix`, `_searchTimer`, `_searchDelay`, `_keydownHandler`, `_outsideHandler`, `_triggerHandler`. Standard는 stateless.
> - **자체 메서드 10종** — `_renderHook` (ListRenderMixin renderData 후 후처리 — items cache + tabindex 초기화) / `_open` / `_close` / `_focusItem(index)` / `_findNextEnabled(start, dir)` / `_findFirstEnabled` / `_findLastEnabled` / `_findByPrefix` / `_handleKeydown` / `_handleTriggerClick` / `_handleTriggerKeydown` / `_handleOutsideClick` / `_handleSetMenuOpen` / `_handleClickItem`. Standard는 자체 메서드 0종.
> - **새 토픽 1종** — `setMenuOpen` (외부 dismiss / open 동기화). Standard는 `menuItems` 1종.
> - **새 이벤트 2종 + 1종 payload 확장** — `@menuOpened { source: 'click'|'keyboard' }`, `@menuClosed { reason: 'item'|'outside'|'escape'|'tab'|'external' }` 신설. `@menuItemClicked`는 Standard 호환 시그니처 + 자체 명시 emit으로 `source: 'click'|'keyboard'` 추가.
> - **외부 listener 라이프사이클** — Standard는 컨테이너 내부 click 1종만. keyboardNavigable은 **컨테이너 capture phase keydown 1종 + trigger button click/keydown 2종 + 메뉴 열린 동안 document click 1종**. 라이프사이클이 동적이며 beforeDestroy에서 정확히 정리해야 함.
>
> 위 7축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.

> **Menus/Advanced/contextMenu 차용 + 차이**: contextMenu의 `자체 _open/_close 메서드 + bound handler ref + beforeDestroy detach + 라이프사이클 이벤트(@xxxOpened/@xxxClosed) + setMenuOpen 외부 publish` 패턴 차용. 차이는 ① **렌더는 ListRenderMixin 사용**(contextMenu는 자체 `_renderItems`로 통합 — keyboardNavigable은 데이터 렌더 ↔ 키보드 네비 직교, ListRenderMixin이 평면 배열 렌더에 충분), ② **trigger는 fixed coordinate가 아닌 inline button** (우클릭/long-press 좌표 X — button click + Enter/Space로 토글), ③ **focus 관리 + roving tabindex**(contextMenu는 focus state 없음), ④ **키보드 네비 6종 + quick search**(contextMenu는 Escape 1종만), ⑤ **document click 1종만**(contextMenu는 4종 — keyboardNavigable은 Escape를 자체 keydown에서 처리).

> **Menus/Advanced/cascading 차용 + 차이**: cascading의 `컨테이너 native click delegator + 자체 메서드 + 명시 payload emit` 패턴 차용. 차이는 ① **평면 배열 데이터 모델**(cascading은 재귀 트리), ② **trigger button 토글**(cascading은 hover로 자식 ul 표시), ③ **키보드 네비 + roving tabindex** (cascading은 hover/click only).

> **MD3 / 도메인 근거**: MD3 Menus 표준은 키보드 네비게이션을 명시적으로 권장한다 (W3C [WAI-ARIA Authoring Practices — Menu and Menubar Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) 표준 준수). 실사용 예: ① **드롭다운 메뉴 — 키보드 사용자가 마우스 없이 액션 선택**(예: 파일 메뉴 → ↓↓↓ → Enter), ② **접근성 보조 — 스크린리더 사용자가 메뉴 항목 sequential 탐색**, ③ **파워유저 단축키 — quick search로 긴 메뉴를 1-2글자로 점프**(예: "fi" → File 메뉴), ④ **키오스크/터치 + 보조 키패드 — 마우스 없는 환경**, ⑤ **VS Code/JetBrains 스타일 명령 팔레트 보조 메뉴**. 모든 케이스에서 ArrowDown/Up/Home/End/Enter/Space/Escape/Tab + roving tabindex + 첫 글자 검색은 표준 UX (Windows/macOS native menu, GTK/Qt, 모든 주요 IDE, 모든 운영체제 동일 패턴).

---

## 구현 명세

### Mixin

ListRenderMixin (평면 배열 렌더 — Standard와 동일 모델). 키보드 네비/focus/trigger toggle/외부 dismiss는 **자체 메서드 + 자체 상태**로 구성한다.

> **신규 Mixin 생성 금지** — produce-component Step 3-1에 따라 본 루프에서 새 Mixin을 만들지 않는다. ListRenderMixin이 평면 배열 렌더에 적합하므로 그대로 사용 + 키보드 네비게이션 layer는 자체 메서드로 완결. **반복 패턴 후보 메모**: `KeyboardNavigationMixin` / `RovingTabindexMixin` — roving tabindex + Arrow/Home/End/Enter/Space/Escape 매핑 + 첫 글자 quick search 패턴이 향후 menubar/listbox/tabs/grid 등에서 누적되면 일반화 검토 (SKILL 회귀 규율 — 1번 회귀 = 즉시 검토).

### cssSelectors

ListRenderMixin에 전달되는 KEY (Standard와 호환되는 KEY 일부 + keyboardNavigable 자체 KEY 추가):

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.kbnav-menu__list` | ListRenderMixin 규약 — 항목이 추가될 부모 ul |
| template  | `#kbnav-menu-item-template` | ListRenderMixin 규약 — cloneNode 대상 |
| item      | `.kbnav-menu__item` | 렌더된 각 li 루트 — `data-itemid` / `data-disabled` / `data-divider` 부착 + click/keydown 매핑 |
| itemid    | `.kbnav-menu__item` | 항목 식별 (datasetAttrs와 함께 작동) |
| disabled  | `.kbnav-menu__item` | 비활성 상태 (data-disabled) |
| divider   | `.kbnav-menu__item` | 구분선 상태 (data-divider) |
| leading   | `.kbnav-menu__leading` | 선행 아이콘 |
| label     | `.kbnav-menu__label` | 항목 레이블 |
| trailing  | `.kbnav-menu__trailing` | 후행 텍스트 (단축키/보조) |

자체 사용 KEY (Mixin 미전달 — `this._cssSelectors`에 별도 보관):

| KEY | VALUE | 용도 |
|-----|-------|------|
| group   | `.kbnav-menu` | 그룹 컨테이너 — `role="menu"`, `data-open` 토글 대상 |
| trigger | `.kbnav-menu__trigger` | trigger 버튼 — click/keydown(Enter/Space/Down) 부착, `aria-expanded` 동기화 |

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| itemid   | itemid |
| disabled | disabled |
| divider  | divider |

### 인스턴스 상태

| 키 | 타입 | 기본 | 설명 |
|----|------|------|------|
| `_cssSelectors` | `object` | (위 표) | 자체 사용 KEY (group/trigger) — 자체 메서드의 단일 진실 출처. |
| `_groupEl` | `HTMLElement \| null` | `null` | `.kbnav-menu` cache. open/close 시 `data-open` 토글. |
| `_triggerEl` | `HTMLElement \| null` | `null` | `.kbnav-menu__trigger` cache. `aria-expanded` 토글. |
| `_listEl` | `HTMLElement \| null` | `null` | `.kbnav-menu__list` cache. focus 관리/keydown 부착 host. |
| `_items` | `Array<HTMLElement>` | `[]` | 현재 렌더된 li 항목 캐시 (querySelectorAll 결과). renderData 직후 갱신. |
| `_focusIndex` | `number` | `-1` | 현재 focused 항목 인덱스. -1이면 미정. |
| `_isOpen` | `boolean` | `false` | 메뉴 열림 상태 (display visibility와 동기화). |
| `_lastTrigger` | `HTMLElement \| null` | `null` | Escape/keyboard activation 시 focus 복귀 대상. trigger 진입 시 저장. |
| `_searchPrefix` | `string` | `''` | 첫 글자 quick search 누적 prefix. |
| `_searchTimer` | `number \| null` | `null` | quick search 1초 timeout ID. |
| `_searchDelay` | `number` | `1000` | quick search prefix 리셋 지연(ms). |
| `_keydownHandler` | `function \| null` | `null` | 컨테이너 keydown bound ref. |
| `_outsideHandler` | `function \| null` | `null` | document click bound ref (메뉴 열린 동안만 부착). |
| `_triggerClickHandler` | `function \| null` | `null` | trigger click bound ref. |
| `_triggerKeydownHandler` | `function \| null` | `null` | trigger keydown bound ref (Enter/Space/Down). |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `menuItems` | `this._handleMenuItems` (내부에서 ListRenderMixin renderData 호출 + `_renderHook` 후처리) | `[{ itemid, leading?, label, trailing?, disabled?, divider? }]` — 평면 배열 (Standard 호환). 새 batch는 새 진실 — `_focusIndex` 리셋 + `_items` 재캐시 + roving tabindex 초기화. |
| `setMenuOpen` | `this._handleSetMenuOpen` | `{ open: true \| false }` — 외부에서 메뉴 강제 open/close. true면 `_open('external')`, false면 `_close('external')`. |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 | payload |
|--------|------------------|------|---------|
| click | `item` (`this.listRender.cssSelectors.item`) | `@menuItemClicked` | `{ event, targetInstance }` (Standard 호환 시그니처). |

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@menuOpened` | `_open()` 시 1회 | `{ targetInstance, source: 'click' \| 'keyboard' \| 'external' }` |
| `@menuClosed` | `_close()` 시 1회. 모든 dismiss 경로 공통 | `{ targetInstance, reason: 'item' \| 'outside' \| 'escape' \| 'tab' \| 'external' }` |
| `@menuItemClicked` | leaf li 클릭(mouse) 또는 Enter/Space(keyboard) 활성화 시. 1회. | `{ targetInstance, itemid, label, source: 'click' \| 'keyboard' }` (Standard 호환 + keyboard source 추가) |

> **이벤트 발행 분리 이유 (cascading/contextMenu와 동일 패턴)**: bindEvents 위임 발행은 `{ event, targetInstance }`만 전달하므로 keyboard 컨텍스트(`source`)가 없다. 페이지가 dispatch할 때 매번 DOM/state를 다시 스캔하지 않아도 되도록 자체 native 핸들러에서 명시 payload를 추가 emit한다.

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_handleMenuItems({ response })` | `({response}) => void` | `menuItems` 핸들러. ListRenderMixin renderData 호출 → `_renderHook` 후처리(items cache + roving tabindex 초기화). |
| `_renderHook()` | `() => void` | renderData 직후 후처리: `_items = querySelectorAll(item)` 캐시 + 첫 비-disabled/divider에 `tabindex="0"`, 나머지 `tabindex="-1"` 부여 + `_focusIndex` 리셋(-1). |
| `_open(source)` | `('click'\|'keyboard'\|'external') => void` | 메뉴 열기. `_groupEl.dataset.open = 'true'` + `_triggerEl.aria-expanded = 'true'` + `_isOpen = true`. document click listener 부착. `source === 'keyboard'`면 첫 비-disabled/divider 항목으로 `_focusItem`. `@menuOpened { source }` 1회 emit. 이미 열려있으면 silent return. |
| `_close(reason)` | `(string) => void` | 메뉴 닫기. `_groupEl.dataset.open = 'false'` + `_triggerEl.aria-expanded = 'false'` + `_isOpen = false`. document click listener detach. quick search timer 정리. `_focusIndex = -1`. `@menuClosed { reason }` 1회 emit. 이미 닫혀있으면 silent return. |
| `_focusItem(index)` | `(number) => void` | 인덱스 검증 → 이전 focused li `tabindex="-1"`, 새 li `tabindex="0"` + `.focus()` + `_focusIndex = index`. -1이면 모든 항목 `tabindex="-1"`. |
| `_findNextEnabled(start, dir)` | `(number, +1\|-1) => number` | start부터 dir 방향으로 순환 검색하여 첫 비-disabled/divider 항목 인덱스 반환. 없으면 -1. |
| `_findFirstEnabled()` / `_findLastEnabled()` | `() => number` | 처음/마지막 비-disabled/divider 항목 인덱스. |
| `_findByPrefix(prefix, fromIndex)` | `(string, number) => number` | fromIndex 다음(순환)부터 label이 prefix로 시작하는 비-disabled/divider 항목 검색. 없으면 -1. case-insensitive. |
| `_handleKeydown(e)` | `(KeyboardEvent) => void` | 컨테이너 capture keydown. ArrowDown/Up/Home/End → roving tabindex 갱신 + `e.preventDefault/stopPropagation`. Enter/Space → 현재 focused 항목 활성화 + `@menuItemClicked` + `_close('item')`. Escape → `_close('escape')` + `_lastTrigger?.focus()`. Tab → `_close('tab')` (preventDefault X). 단일 문자 → quick search. |
| `_handleTriggerClick(e)` | `(MouseEvent) => void` | trigger button click → `_isOpen` 토글: 열려있으면 `_close('item')` 비슷한 toggle, 닫혀있으면 `_open('click')`. `_lastTrigger = _triggerEl` 저장. |
| `_handleTriggerKeydown(e)` | `(KeyboardEvent) => void` | trigger button keydown. Enter/Space → `_open('keyboard')` + 첫 항목으로 focus + `e.preventDefault`. ArrowDown → `_open('keyboard')` + 첫 항목으로 focus + `e.preventDefault` (표준 패턴). |
| `_handleOutsideClick(e)` | `(MouseEvent) => void` | document capture click. trigger/group 모두 contains 아니면 `_close('outside')`. |
| `_handleSetMenuOpen({ response })` | `({response}) => void` | `setMenuOpen` 토픽. `response.open === true` → `_open('external')`, `false` → `_close('external')`. |
| `_handleClickItem(e)` | `(MouseEvent) => void` | 컨테이너 native click delegator. closest(item) → disabled/divider면 silent. itemid/label 추출 + `@menuItemClicked { source: 'click' }` emit + `_close('item')`. (bindEvents 위임은 별도 Standard 호환 발행) |

### 페이지 연결 사례

```
[페이지 — 키보드 접근성 메뉴 / 파워유저 단축키]
   │
   ├─ this.pageDataMappings = [
   │     { topic: 'menuItems',   datasetInfo: {...}, refreshInterval: 0 },
   │     { topic: 'setMenuOpen', datasetInfo: {...}, refreshInterval: 0 }   // 선택
   │  ];
   │
   └─ // 평면 메뉴 항목 (Standard와 동일 시그니처)
      [
        { itemid: 'find',     leading: '\u{1F50D}', label: 'Find',           trailing: '\u{2318}F' },
        { itemid: 'replace',  leading: '\u{1F501}', label: 'Replace',        trailing: '\u{2318}H' },
        { itemid: 'div-1',    label: '', divider: true },
        { itemid: 'goto',     leading: '\u{2192}',  label: 'Go to Line',     trailing: '\u{2318}G' },
        { itemid: 'fold',     leading: '\u{1F4C1}', label: 'Fold',           trailing: 'Alt+F', disabled: true },
        { itemid: 'div-2',    label: '', divider: true },
        { itemid: 'format',   leading: '\u{1F4D0}', label: 'Format Document',trailing: '\u{21E7}\u{2325}F' }
      ]

[Menus/Advanced/keyboardNavigable]
    ├─ Tab으로 trigger 진입 → Enter/Space/Down → _open('keyboard')
    │   → 첫 항목 'find'로 focus (@menuOpened source='keyboard')
    ├─ ArrowDown → 'replace'로 focus (divider 'div-1' 건너뜀)
    ├─ ArrowDown → 'goto'로 focus
    ├─ ArrowDown → 'format'으로 focus ('fold' disabled 건너뜀)
    ├─ End → 마지막 'format'으로 focus
    ├─ Home → 첫 'find'으로 focus
    ├─ "g" 입력 → 'goto' (Go to Line)로 focus (quick search)
    ├─ Enter → @menuItemClicked { itemid: 'goto', label: 'Go to Line', source: 'keyboard' }
    │   → _close('item') → @menuClosed { reason: 'item' } → trigger로 focus 복귀
    │
    └─ 또는: Escape → _close('escape') + trigger 복귀
        외부 click → _close('outside')
        Tab → _close('tab') + 다음 focusable로

운영: Wkit.onEventBusHandlers({
        '@menuItemClicked': ({ itemid, label, source }) => {
          if (source === 'keyboard') console.log('keyboard activated:', itemid);
          // itemid로 액션 분기
        },
        '@menuOpened':      ({ source }) => analytics.track('menu_open', {source}),
        '@menuClosed':      ({ reason }) => { /* optional */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별 (data-focused / [data-disabled] / data-open) | 도메인 컨텍스트 예 |
|------|---------|--------------------------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 / 그라디언트 / Pretendard / 16px 모서리 / box-shadow 금지. focus ring: 2px 시안 inset + 좌측 2px accent bar. trigger button: 그라디언트 fill + caret ▾, `aria-expanded="true"` 시 caret rotate 180deg. | **코드 에디터 명령 메뉴 — 키보드 사용자 (Tab → Enter → ↓↓ → Enter)** (다크 IDE의 편집 메뉴 — 마우스 없이 명령 선택) |
| `02_material`    | B: Material Elevated | 라이트 / Roboto / 8px 모서리 / Material elevation level 2. focus ring: 3px primary container fill (`#EADDFF`) + outline 2px primary. trigger button: outlined `Material Symbols` 캐럿. | **접근성 보조 메뉴 — 스크린리더 사용자 (NVDA/VoiceOver의 menu 패턴 안내)** (관리 콘솔의 사용자 액션 메뉴) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 / DM Serif label / 1.5px 헤어라인 / 2px 모서리 / 정적 모션. focus: 좌측 2px serif 두꺼운 indicator + 항목 italic accent. trigger button: 우측 "›" U+203A 단일 문자. | **에세이 편집 메뉴 — 키보드 워크플로우 사용자 (typewriter 스타일 워크플로우)** (편집 도구의 단축 액션) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 / 시안 1px ring / IBM Plex Mono trailing / 4px 모서리 / 압축 padding. focus: 시안 fill (`rgba(77,208,225,.18)`) + 1px solid 시안 ring. trigger button: 시안 모노 `▾`. | **운영 콘솔 단축키 메뉴 — 파워유저 (Tab → quick search "g" → Enter)** (NOC 운영자가 마우스 없이 명령 실행) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, 메뉴 항목의 focus state는 `[tabindex="0"]:focus` + `[data-focused="true"]`(JS에서도 토글) 셀렉터로 시각 강조. 메뉴 컨테이너는 `[data-open="true"]`일 때만 표시(기본 `display: none`).

### 결정사항

- **ListRenderMixin 사용 + 자체 메서드 layer**: 데이터 렌더는 Standard와 동일한 평면 배열이므로 ListRenderMixin이 적합. 키보드 네비게이션은 렌더와 직교하는 **focus 관리 layer**로 자체 메서드로 분리. contextMenu는 렌더+표시+position+listener가 단일 사이클로 묶여 자체 _renderItems로 통합 — keyboardNavigable은 그렇지 않음(렌더 ↔ 키보드 네비 직교).
- **roving tabindex (단일 tabindex=0)**: WAI-ARIA Authoring Practices 권장 표준 패턴 — 메뉴 진입은 Tab 1번, 항목 간 이동은 화살표. 모든 항목에 tabindex=0을 부여하면 Tab 키로 메뉴를 빠져나갈 수 없음(접근성 위반).
- **Escape는 trigger로 focus 복귀 / Tab은 다음 focusable로**: WAI-ARIA 표준 분기. Escape는 사용자가 의도적 취소 → trigger로 복귀. Tab은 사용자가 진행 의지 → native Tab 동작 허용.
- **quick search 1초 timeout + 누적 prefix**: 1초 이내 입력은 누적 prefix(예: "fi" → "file"), 1초 후 prefix 리셋. 단일 문자만 단일 항목 검색은 같은 글자로 시작하는 항목이 여러 개일 때 순환 — Windows 메뉴와 같은 표준 동작.
- **disabled/divider 항목은 네비/검색 모두 건너뜀**: 모든 키보드 인터랙션이 active 항목만 대상. mouse hover/click도 동일.
- **keyboard source emit**: `@menuItemClicked`에 `source: 'click'|'keyboard'` 포함 → 페이지가 분기 가능 (예: keyboard 활성화는 analytics 강조, mouse 클릭은 확인 모달 추가).
- **trigger button 토글 + setMenuOpen 외부 동기화**: trigger click/Enter/Space로 자체 토글. 외부 publish (`setMenuOpen`)는 페이지가 강제 dismiss/open이 필요한 시나리오(예: 다른 메뉴 열림으로 인한 dismiss, 키보드 단축키로 강제 open) 지원.
- **신규 Mixin 생성 금지**: ListRenderMixin은 평면 렌더에 충분, 키보드 네비 layer는 자체 메서드로 완결. **반복 패턴 후보 메모**: `KeyboardNavigationMixin` / `RovingTabindexMixin` — Arrow/Home/End/Enter/Space/Escape 매핑 + roving tabindex + 첫 글자 quick search 패턴이 향후 menubar/listbox/tabs/grid 등에서 누적되면 일반화 검토(SKILL 회귀 규율).

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 5단계 (../를 5번)
