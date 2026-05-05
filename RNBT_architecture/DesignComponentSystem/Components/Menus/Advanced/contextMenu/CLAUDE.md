# Menus — Advanced / contextMenu

## 기능 정의

1. **trigger 영역 contextmenu 이벤트 처리** — trigger element(기본은 컴포넌트 자신의 root container, `setTriggerArea` 토픽으로 외부 element/selector로 동적 변경 가능)에 native `contextmenu` listener를 부착하여 우클릭 시 `e.preventDefault()` + 메뉴 표시. 메뉴 위치는 click 좌표(`e.clientX`, `e.clientY`) 기준으로 fixed positioning. 동일 메뉴 인스턴스가 같은 페이지에서 여러 trigger 영역에 부착될 수 있도록 trigger 영역은 외부 publish로 전환 가능.
2. **터치 long-press 트리거** — trigger 영역에 `pointerdown`(touch/pen만, mouse는 `contextmenu`로 커버) listener를 부착하여 500ms 동안 pointermove/pointerup 없이 누르고 있으면 메뉴 표시. pointermove(>5px)/pointerup/pointercancel 발생 시 long-press 타이머 취소(스크롤 등 의도치 않은 트리거 방지). 위치는 `pointerdown`의 (clientX, clientY).
3. **메뉴 항목 렌더링** — `contextMenuItems` 토픽으로 수신한 평면 배열(`[{ itemid, leading?, label, trailing?, disabled?, divider? }]`)을 자체 메서드(`_renderItems`)가 `<template>` cloneNode로 li를 생성하여 `.context-menu__list`에 채운다. ListRenderMixin이 평면 배열 렌더 패턴과 일치하지만 본 변형은 **rendering + position + 외부 listener + viewport flip**의 4축이 한 메서드 라이프사이클에 묶여 있어 자체 메서드 1종으로 통합 처리(중복 dispatch 방지). 데이터 모델은 Standard와 동일한 평면 배열 — children/cascading 미지원.
4. **viewport reposition (flip)** — 메뉴 표시 시 `getBoundingClientRect`로 메뉴 크기를 측정 후 viewport 우측 경계를 넘으면 좌측으로(`x = clientX - menuWidth`) flip, 하단 경계를 넘으면 위로(`y = clientY - menuHeight`) flip. 이 단계는 fixed position을 갱신하기 위한 1회 reflow.
5. **외부 dismiss (document click / Escape / scroll / 새 contextmenu)** — 메뉴가 열려있는 동안 document에 capture phase로 임시 listener 4종(`click`, `keydown`, `scroll`, `contextmenu`)을 부착하여 trigger 영역 바깥 click, Escape 키, scroll(메뉴 위치가 어긋나므로 닫음), 다른 trigger의 contextmenu(다른 위치에서 다시 열기 위해 먼저 닫음) 시 메뉴 숨김. 닫을 때 임시 listener 4종을 정확히 detach.
6. **메뉴 항목 클릭 + dismiss** — disabled/divider가 아닌 항목 클릭 시 `@contextMenuItemClicked` 명시 payload(`{ itemid, label, x, y, triggerTarget }`) emit + 메뉴 dismiss. dispatch는 native click delegator(컨테이너) 1종 + bindEvents 위임 1종(Standard 호환 시그니처 `{ event, targetInstance }`) 병행.
7. **라이프사이클 이벤트** — 메뉴가 열림→1회 `@contextMenuOpened { x, y, triggerTarget, source: 'mouse' | 'touch' }` emit, 닫힘→1회 `@contextMenuClosed { reason: 'click' | 'escape' | 'scroll' | 'contextmenu' | 'item' }` emit. 페이지가 analytics/툴팁/툴바 갱신 등 부수 효과 분기 가능.

> **Standard와의 분리 정당성**:
> - **input source 차이** — Standard는 컴포넌트 자체에 inline 표시되며 항목 click만 처리. contextMenu는 **trigger 영역의 native `contextmenu` 이벤트 + pointerdown long-press**를 진입점으로 받음 (외부 element listener 부착). 데이터 흐름과 라이프사이클이 직교.
> - **표시 모델 차이** — Standard는 `display`-on 인라인 표면(visibility는 페이지 책임). contextMenu는 **fixed position + (clientX, clientY) 좌표 갱신 + viewport flip + `data-open` 토글**로 자기 자신이 표시/숨김을 제어.
> - **새 자체 상태 9종** — `_triggerEl`, `_triggerSelector`, `_currentPos`, `_lastTriggerTarget`, `_longPressTimer`, `_longPressStart`, `_pointerDownPos`, `_outsideHandlers`, `_triggerHandlers`, `_groupHandlers`. Standard는 stateless.
> - **자체 메서드 9종** — `_renderItems` / `_open` / `_close` / `_repositionInViewport` / `_attachTrigger` / `_detachTrigger` / `_handleContextMenu` / `_handlePointerDown` / `_handlePointerCancel` / `_handleOutsideClick` / `_handleSetTriggerArea` / `_handleClickItem`. Standard는 자체 메서드 0종.
> - **새 토픽 2종** — `contextMenuItems` (평면 배열, Standard `menuItems`와 분리 — 같은 페이지에서 inline menu와 contextmenu가 다른 데이터를 가질 수 있도록), `setTriggerArea` (외부에서 trigger element 지정).
> - **새 이벤트 3종** — `@contextMenuOpened`, `@contextMenuClosed`, `@contextMenuItemClicked` (Standard `@menuItemClicked`와 분리 — 페이지가 두 채널을 동시에 다룰 때 dispatch 모호성 제거).
> - **외부 listener 라이프사이클** — Standard는 컨테이너 내부 click 1종만. contextMenu는 **trigger 영역 외부 element에 native listener 2종 부착** + 메뉴 열린 동안 document에 임시 listener 4종 부착 + 닫힐 때 detach. 라이프사이클이 동적이며 beforeDestroy에서 정확히 정리해야 함.
>
> 위 6축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.

> **Menus/Advanced/cascading 차용 + 차이**: cascading의 `컨테이너 native click delegator + bound handler ref + beforeDestroy detach + 자체 메서드 + 라이프사이클 이벤트(@xxxOpened/@xxxClosed) + 외부 publish 토픽` 패턴 차용. 차이는 ① **데이터 모델은 평면 배열**(cascading은 재귀 트리), ② **trigger element 외부 listener 부착**(cascading은 자기 자신만), ③ **fixed position + (clientX, clientY) + viewport flip**(cascading은 inline absolute child positioning), ④ **document 외부 listener 4종 라이프사이클**(cascading은 외부 publish dismiss만), ⑤ **long-press 타이머**(cascading은 hover delay only).

> **Lists/Advanced/multiSelect 차용 + 차이**: multiSelect의 `ListRenderMixin 미사용 + 자체 평면 렌더 + 자체 명시 emit + bindEvents 위임 병행` 패턴 차용. 차이는 ① **렌더 + 표시/숨김 + position이 한 라이프사이클에 묶임**(multiSelect는 렌더만), ② **외부 trigger event 진입점**(multiSelect는 자기 자신 click), ③ **document 임시 listener 4종**.

> **Dialogs/Advanced/draggable 차용 + 차이**: draggable의 `pointer 라이프사이클 + bound handler ref + viewport 경계 클램프` 패턴 차용. 차이는 ① **드래그 없음 — pointerdown은 long-press 타이머 시작 전용**, ② **viewport 경계는 클램프가 아니라 flip**(반대편으로 위치 변경), ③ **trigger 영역이 외부 element**.

> **MD3 / 도메인 근거**: MD3 Menus 표준에는 contextMenu가 명시적으로 분리되지는 않지만, **데스크톱/모바일 application의 우클릭(또는 long-press) 메뉴**는 OS 표준 패턴이다. 실사용 예: ① **파일 매니저의 파일 우클릭 → 복사/이동/삭제/이름변경**, ② **테이블 행 우클릭 → 편집/내보내기/복제/삭제**, ③ **이미지 우클릭 → 다운로드/공유/원본 보기/검색**, ④ **그리드 셀 우클릭 → 데이터 편집/포맷/필터**, ⑤ **모바일 갤러리 long-press → 선택 모드 진입/공유/삭제**. 모든 케이스에서 trigger 좌표 기준 fixed position + viewport flip + 외부 click dismiss는 표준 UX (Windows/macOS/Linux 파일 매니저, Excel/Sheets, 모바일 앱 모두 동일 패턴).

---

## 구현 명세

### Mixin

ListRenderMixin / ShadowPopupMixin 모두 사용하지 않는다. 본 변형의 핵심은 **렌더 + 표시 + position + 외부 trigger/document listener 라이프사이클**이 단일 사이클로 묶여 있고, ShadowPopup의 shadow boundary는 (clientX, clientY) 기반 fixed positioning에 불필요한 격리를 더한다(우클릭 → host 위치 fixed 갱신만 필요). 따라서 **Mixin 0종 + 자체 메서드 9종**으로 완결한다.

> **신규 Mixin 생성 금지** — produce-component Step 3-1에 따라 본 루프에서 새 Mixin을 만들지 않는다. 자체 메서드로 완결. **반복 패턴 후보 메모**: `ContextMenuMixin`(또는 `TriggerPopupMixin`) — trigger 영역 외부 listener 부착 + (clientX, clientY) 좌표 fixed positioning + viewport flip + document 임시 listener 4종 라이프사이클 패턴이 향후 floatingMenu/tooltip-on-hover/popover 등에서 재사용된다면 일반화 검토 (SKILL 회귀 규율).

### cssSelectors (자체 사용 — Mixin에 전달 X)

| KEY | VALUE | 용도 |
|-----|-------|------|
| group        | `.context-menu`              | 그룹 컨테이너 — `role="menu"`, fixed positioning host. `data-open="true"` / `data-source="mouse"\|"touch"` 부착 |
| list         | `.context-menu__list`        | ul — `_renderItems` 결과가 채워지는 부모 요소 |
| itemTemplate | `#context-menu-item-template`| li hull `<template>` (cloneNode 대상) |
| item         | `.context-menu__item`        | 렌더된 각 li 루트 — `data-itemid` / `data-disabled` / `data-divider` 부착 + click 매핑 |
| leading      | `.context-menu__leading`     | 선행 아이콘 (Standard 호환 KEY) |
| label        | `.context-menu__label`       | 항목 레이블 (Standard 호환 KEY) |
| trailing     | `.context-menu__trailing`    | 후행 텍스트 (Standard 호환 KEY) |

> **note**: cssSelectors는 ListRenderMixin 등에 전달하지 않는다(미사용). 자체 메서드(`_renderItems`/`_open`/`_close`/`_handleClickItem` 등)가 직접 querySelector로 사용한다. 본 컴포넌트의 cssSelectors는 `this._cssSelectors`로 인스턴스 자체에 보관(Mixin 네임스페이스 패턴 흡수).

### 인스턴스 상태

| 키 | 타입 | 기본 | 설명 |
|----|------|------|------|
| `_cssSelectors` | `object` | (위 표) | 자체 메서드의 단일 진실 출처. `customEvents`에서 computed property로 참조 가능. |
| `_groupEl` | `HTMLElement \| null` | `null` | `.context-menu` cache. open/close 시 `data-open` / `style.left` / `style.top` 갱신 대상. |
| `_listEl` | `HTMLElement \| null` | `null` | `.context-menu__list` cache (`_renderItems`가 채움). |
| `_itemTemplateEl` | `HTMLTemplateElement \| null` | `null` | item template cache. |
| `_triggerEl` | `HTMLElement` | `this.appendElement` | contextmenu/pointerdown listener 부착 대상. 기본 root container. `setTriggerArea` 토픽으로 동적 교체. |
| `_triggerSelector` | `string \| null` | `null` | 외부 trigger selector 메모(setTriggerArea 페이로드). |
| `_currentPos` | `{x, y}` | `{x:0, y:0}` | 현재 메뉴 위치 (viewport flip 후 최종 좌표). |
| `_lastTriggerTarget` | `HTMLElement \| null` | `null` | 마지막 trigger element (pointerdown/contextmenu의 `e.target`). 이벤트 페이로드 포함. |
| `_longPressTimer` | `number \| null` | `null` | pointerdown 후 500ms long-press 타이머 ID. |
| `_longPressDelay` | `number` | `500` | long-press 트리거 지연(ms). |
| `_pointerDownPos` | `{x, y} \| null` | `null` | pointerdown 시점 좌표. pointermove > 5px이면 long-press 취소. |
| `_pointerMoveThreshold` | `number` | `5` | pointermove 취소 임계값(px). |
| `_triggerHandlers` | `{contextmenu, pointerdown, pointermove, pointerup, pointercancel} \| null` | `null` | trigger element에 부착된 native listener bound refs. |
| `_outsideHandlers` | `{click, keydown, scroll, contextmenu} \| null` | `null` | 메뉴 열린 동안 document에 부착된 임시 listener bound refs. open/close 시점에 부착/제거. |
| `_groupHandlers` | `{click} \| null` | `null` | 메뉴 컨테이너 자체의 native click delegator bound ref. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `contextMenuItems` | `this._renderItems` | `[{ itemid, leading?, label, trailing?, disabled?, divider? }]` — 평면 배열. 새 batch는 새 진실. |
| `setTriggerArea` | `this._handleSetTriggerArea` | `{ selector?: string, element?: HTMLElement }` — selector 또는 element로 trigger 영역 동적 교체. selector가 우선. element도 selector도 없으면 root container로 복원. |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 | payload |
|--------|------------------|------|---------|
| click | `item` (`_cssSelectors.item`) | `@contextMenuItemClicked` | `{ event, targetInstance }` (Standard 호환 시그니처). |

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@contextMenuOpened` | trigger의 contextmenu 또는 long-press → `_open()` 시 1회 | `{ targetInstance, x, y, triggerTarget, source: 'mouse' \| 'touch' }` |
| `@contextMenuClosed` | `_close()` 시 1회. 모든 dismiss 경로(item click / outside click / Escape / scroll / 다른 contextmenu) 공통 | `{ targetInstance, reason: 'item' \| 'click' \| 'escape' \| 'scroll' \| 'contextmenu' }` |
| `@contextMenuItemClicked` | item li click 시 (disabled/divider 아님). 1회. | `{ targetInstance, itemid, label, x, y, triggerTarget }` (Standard 호환 + contextmenu 컨텍스트 추가) |

> **이벤트 발행 분리 이유 (cascading과 동일 패턴)**: bindEvents 위임 발행은 `{ event, targetInstance }`만 전달하므로 contextmenu 컨텍스트(`itemid`, `x`, `y`, `triggerTarget`)가 없다. 페이지가 dispatch할 때 매번 DOM/state를 다시 스캔하지 않아도 되도록 자체 native click delegator에서 명시 payload를 추가 emit한다.

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderItems({ response })` | `({response}) => void` | `contextMenuItems` 핸들러. `_listEl.innerHTML = ''` 후 response 배열을 순회하며 item template clone → li 생성하여 `_listEl.appendChild`. 빈 배열이면 list 비움. (new batch is new truth — 이전 누적 X) |
| `_open(x, y, triggerTarget, source)` | `(number, number, HTMLElement, 'mouse'\|'touch') => void` | 메뉴를 (x, y)에 표시. `_groupEl.dataset.open = 'true'` + `data-source` + `style.left/top`. `_repositionInViewport()` 호출(viewport flip). document 임시 listener 4종 부착. `_currentPos = {x, y}`. `_lastTriggerTarget = triggerTarget`. `@contextMenuOpened` 1회 emit. 이미 열려있으면 위치만 갱신(다른 trigger에서 다시 열린 경우). |
| `_close(reason)` | `(string) => void` | `_groupEl.dataset.open = 'false'`. document 임시 listener 4종 detach. `_outsideHandlers = null`. `_currentPos = {0, 0}`. `_lastTriggerTarget = null`. `@contextMenuClosed { reason }` 1회 emit. 이미 닫혀있으면 silent return. |
| `_repositionInViewport()` | `() => void` | `_groupEl.getBoundingClientRect()` 측정 → 우측 경계 초과 시 `left = clientX - menuWidth`로 flip(좌측이 음수면 0으로 클램프), 하단 경계 초과 시 `top = clientY - menuHeight`로 flip(상단 음수면 0으로 클램프). `_currentPos` 갱신. |
| `_attachTrigger(el)` | `(HTMLElement) => void` | `el`에 contextmenu/pointerdown listener 부착. `_triggerHandlers`에 bound refs 보관. 이전 `_triggerEl`이 다르면 먼저 `_detachTrigger()` 호출. |
| `_detachTrigger()` | `() => void` | `_triggerEl`에서 contextmenu/pointerdown listener 제거 + pointermove/pointerup/pointercancel 제거(부착되어 있는 경우). `_triggerHandlers = null`. long-press 타이머 정리. |
| `_handleContextMenu(e)` | `(MouseEvent) => void` | trigger의 contextmenu listener. `e.preventDefault()` + `_open(e.clientX, e.clientY, e.target, 'mouse')`. |
| `_handlePointerDown(e)` | `(PointerEvent) => void` | trigger의 pointerdown listener. `pointerType === 'mouse'`면 무시(우클릭은 contextmenu가 처리). `_pointerDownPos = {clientX, clientY}` 저장 + 500ms `setTimeout(_open, _longPressDelay)` 시작. pointermove/pointerup/pointercancel listener 임시 부착. |
| `_handlePointerCancel(e)` | `(PointerEvent) => void` | pointermove(>5px) / pointerup / pointercancel 핸들러. long-press 타이머 정리(취소). 임시 listener detach. |
| `_handleOutsideClick(e)` | `(MouseEvent / KeyboardEvent / ScrollEvent) => void` | document 임시 listener. event.type별로 분기: ① click → 메뉴 컨테이너 contains이면 무시(item click은 별도 채널), 아니면 `_close('click')`. ② keydown → key === 'Escape'면 `_close('escape')`. ③ scroll → `_close('scroll')`. ④ contextmenu → 메뉴 자기자신 위 contextmenu가 아니면 `_close('contextmenu')` (다음 contextmenu 처리는 trigger의 listener가 별도로 처리). |
| `_handleSetTriggerArea({ response })` | `({response}) => void` | `setTriggerArea` 토픽 핸들러. `response.selector`가 있으면 `document.querySelector(selector)`로 element 조회 후 `_attachTrigger`. `response.element`가 있으면 직접 사용. 둘 다 null/undefined면 root container로 복원. |
| `_handleClickItem(e)` | `(MouseEvent) => void` | 컨테이너 native click delegator. `e.target.closest(item)` 확인 → disabled/divider면 silent return. itemid/label 추출 + `@contextMenuItemClicked` 명시 payload emit + `_close('item')`. (bindEvents 위임은 별도로 Standard 시그니처 발행) |

### 페이지 연결 사례

```
[페이지 — 파일 매니저 / 테이블]
   │
   ├─ this.pageDataMappings = [
   │     { topic: 'contextMenuItems', datasetInfo: {...}, refreshInterval: 0 },
   │     { topic: 'setTriggerArea',   datasetInfo: {...}, refreshInterval: 0 }   // 선택
   │  ];
   │
   └─ // trigger element 지정 (선택 — 기본은 root container)
      instance.subscriptions.setTriggerArea.forEach(h =>
          h.call(instance, { response: { selector: '#file-grid' } }));

      // 평면 메뉴 항목
      [
        { itemid: 'copy',     leading: '\u{1F4CB}', label: '복사',  trailing: '\u{2318}C' },
        { itemid: 'paste',    leading: '\u{1F4CC}', label: '붙여넣기', trailing: '\u{2318}V', disabled: true },
        { itemid: 'div-1',    label: '', divider: true },
        { itemid: 'rename',   leading: '\u{270F}',  label: '이름 변경' },
        { itemid: 'delete',   leading: '\u{1F5D1}', label: '삭제' }
      ]

[Menus/Advanced/contextMenu]
    ├─ trigger 영역(#file-grid) 우클릭 → _handleContextMenu
    │   → e.preventDefault() + _open(clientX, clientY, e.target, 'mouse')
    │   → @contextMenuOpened { x, y, triggerTarget, source: 'mouse' }
    ├─ viewport 우측 초과 시 좌측으로 flip
    ├─ document 임시 listener 4종 부착
    ├─ 사용자가 '삭제' 클릭 → _handleClickItem
    │   → @contextMenuItemClicked { itemid: 'delete', label: '삭제', x, y, triggerTarget }
    │   → _close('item') → @contextMenuClosed { reason: 'item' }
    │
    └─ 또는: document click 바깥, Escape, scroll, 새 contextmenu
        → _close(reason) → @contextMenuClosed { reason }

운영: this.pageDataMappings = [
        { topic: 'contextMenuItems', datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setTriggerArea',   datasetInfo: {...}, refreshInterval: 0 }   // 선택
      ];
      Wkit.onEventBusHandlers({
        '@contextMenuItemClicked': ({ itemid, label, x, y, triggerTarget }) => {
          // itemid로 액션 분기
        },
        '@contextMenuOpened': ({ x, y, triggerTarget, source }) => analytics.track('cm_open', {source}),
        '@contextMenuClosed': ({ reason }) => { /* optional */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별 (data-open / data-source) | 도메인 컨텍스트 예 |
|------|---------|--------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 / 그라디언트 / Pretendard / 16px 모서리 / box-shadow 금지 — 1px 글로우 outline + 그라디언트로 깊이. data-open 시 fade-in 180ms. | **파일 매니저 우클릭 — 파일 항목 우클릭 → 복사/붙여넣기/이름 변경/삭제** (다크 데스크톱 앱) |
| `02_material`    | B: Material Elevated | 라이트 / Roboto / 4px 모서리 / Material elevation level 4 shadow. data-open 시 scale-in transform-origin 좌상단. | **테이블 행 우클릭 — 데이터 행 우클릭 → 편집/복제/내보내기/삭제** (관리 콘솔) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 / DM Serif label / 1.5px 헤어라인 / 2px 모서리 / 정적 모션. | **이미지 우클릭 — 이미지 프리뷰 우클릭 → 다운로드/공유/원본 보기/구글 검색** (편집 도구) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 / IBM Plex Mono trailing / 시안 1px ring / 4px 모서리 / 압축 padding. | **그리드 셀 우클릭 — 데이터 그리드 셀 우클릭 → 편집/포맷/필터/숨기기** (운영 콘솔) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, `[data-open="true"]` 셀렉터로 visibility 분기. 컨테이너는 `position: fixed`로 stack 위에 표시되며 `style.left` / `style.top`이 `_open()` / `_repositionInViewport()`에서 갱신된다.

### 결정사항

- **Mixin 0종 — 자체 메서드로 완결**: ListRenderMixin은 평면 배열 렌더 패턴은 일치하지만 본 변형의 핵심은 **렌더 + 표시/숨김 + position + 외부 trigger/document listener 라이프사이클**이 단일 사이클로 묶여있고 cssSelectors도 자체 보유로 충분. ShadowPopup은 (clientX, clientY) 기반 fixed positioning에 shadow boundary 격리가 불필요. → 자체 메서드 + 인스턴스 상태로 완결. 큐 메모: `ContextMenuMixin` / `TriggerPopupMixin` 일반화 검토 후보(반환 메모만, SKILL 회귀 규율).
- **Standard와 토픽/이벤트 분리**: `menuItems` / `@menuItemClicked` (Standard) ↔ `contextMenuItems` / `@contextMenuItemClicked` (본 변형). 같은 페이지에서 inline menu와 contextmenu를 동시에 사용할 때 dispatch 모호성 제거 + 데이터 모델을 분리해서 운영(예: inline menu는 항상 표시되는 toolbar, contextmenu는 grid 셀 액션).
- **mouse(contextmenu)와 touch(long-press) 진입점 분리**: `pointerType === 'mouse'`인 pointerdown은 무시(우클릭은 native contextmenu가 더 안정적). touch/pen만 long-press 타이머 시작.
- **viewport flip (클램프 아니라 반대편으로)**: 데스크톱 OS 표준 — 우측이 부족하면 좌측 펼침, 하단이 부족하면 위로 펼침. 단, flip 후에도 음수면 0으로 클램프(extreme small viewport).
- **document 임시 listener 4종**: capture phase로 부착하여 trigger 영역의 다른 listener보다 먼저 dismiss 결정. 메뉴가 닫힐 때 정확히 4종 모두 detach (open/close 라이프사이클 짝).
- **새 batch는 새 진실**: `contextMenuItems` 새 publish 시 `_listEl.innerHTML = ''` + 재빌드. 이전 메뉴가 열려있으면 `_close('contextmenu')` 후 다시 열지는 않음(데이터 갱신은 silent). 일반적으로 다음 contextmenu 트리거에서 새 데이터로 표시.
- **신규 Mixin 생성 금지**: 자체 메서드로 완결. **반복 패턴 후보 메모**: `ContextMenuMixin` / `TriggerPopupMixin` — trigger 영역 외부 listener + (clientX, clientY) fixed positioning + viewport flip + document 임시 listener 4종 패턴이 향후 floatingMenu/popover/tooltipOnHover 등에서 누적되면 일반화 검토(SKILL 회귀 규율).

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 5단계 (../를 5번)
