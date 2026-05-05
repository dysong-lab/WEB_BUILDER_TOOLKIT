# Tabs — Advanced / draggableReorder

## 기능 정의

1. **탭 항목 렌더링 (Standard 호환)** — `tabsItems` 토픽으로 수신한 배열(`[{ tabid, icon, label, badge, active }]`)을 ListRenderMixin 의 `<template>` cloneNode 로 N 개 탭을 렌더링하고, 개별 탭의 활성 상태(`active`)를 관리한다. ListRender selectorKEY 6종(tabid/active/icon/label/badge + container/template)은 Standard 호환 그대로 유지하고, template 항목 루트(`.tabs-dr__item`)에 `draggable="true"` 가 고정되어 HTML5 Drag and Drop API 가 활성화된다. Standard 의 `tabItems` 토픽도 별칭으로 동시 구독(호환).

2. **HTML5 Drag and Drop 으로 탭 순서 재배치 — 가로 축** — 드래그 시작(`dragstart`) 시 `dataTransfer.setData('text/plain', tabid)` + `effectAllowed='move'` 로 식별자를 전달하고, 드래그 중인 탭에 `data-drag-state="dragging"` 부여. 드래그 over(`dragover`) 는 `event.preventDefault()` 로 drop 을 허용하고 hover 탭에 `data-drag-target="before|after"` 를 부여(mouseX < midX → before, else after) 하여 insertion line 을 시각화한다. **수직 리스트와 달리 탭은 가로 배치이므로 mid-Y 가 아닌 mid-X 기준**. dragleave 시 target dataset 정리. drop 시 새 순서를 계산하여 ListRender 의 `renderData` 로 재렌더 + `_currentOrder` 갱신 + `@tabReordered` 발행. dragend 시 모든 dragging/dragTarget dataset 정리(드래그 외부에서 release 된 경우 cleanup 보장).

3. **재정렬 이벤트 발행 — `@tabReordered`** — drop 인정 사이클의 끝(`fromIndex !== toIndex`) 에 `@tabReordered` 1 회 발행. payload: `{ targetInstance, fromIndex, toIndex, tabid, allTabIds: [id1, id2, ...] }`. `allTabIds` 는 새 tabid 배열(전체 새 순서), `tabid` 는 드래그된 탭 id, `fromIndex`/`toIndex` 는 변경 전/후 인덱스. 페이지가 자체 데이터 배열에 적용 + 영속화 / route 동기화 / backend persist 에 즉시 사용.

4. **인스턴스 자체 순서 상태 보관** — `_currentOrder: string[]` / `_currentItems: object[]` 자체 상태로 현재 탭 id 배열과 원본 데이터를 보관. `_renderItems` 가 `tabsItems`/`tabItems` 페이로드 수신 시 초기화하고, `_handleDrop` 이 새 순서로 갱신한다. 같은 batch 가 다시 들어오면 새 진실로 재구성(이전 순서 누적 X). 추가로 `setTabOrder` 토픽(선택)이 들어오면 외부에서 강제한 순서로 `_currentItems` 를 재정렬 후 ListRender 재렌더(영속화된 정렬 복원 시나리오).

5. **드래그 시각 피드백** — 컴포넌트 자체에서 dataset 채널 두 개 부착: dragging 탭에 `data-drag-state="dragging"`, hover target 탭에 `data-drag-target="before|after"`. CSS 는 페르소나별로 dragging 상태(opacity/scale/glow)와 insertion line(target before/after — **세로 라인**, 탭 좌/우 가장자리)을 차별화. dragging 시 `cursor: grabbing` + 부드러운 transition 150~220ms.

6. **탭 클릭 호환 (Standard 와 동일 이벤트)** — 드래그가 메인이지만 탭 자체 click 도 호환. 탭 클릭 시 Standard 와 동일한 `@tabClicked` 발행 (payload: `{ targetInstance, event }`). 페이지는 `event.target.closest('.tabs-dr__item')?.dataset.tabid` 로 탭 식별. 드래그가 시작된 클릭은 native HTML5 DnD 가 자체 처리하므로 click 이벤트는 발생하지 않는다(브라우저 기본 동작) — click vs drag 는 native event 분기.

> **Standard 와의 분리 정당성 (6 축)**:
> - **새 자체 상태 8 종** — `_currentOrder: string[]` (현재 tabid 배열 진실 소스), `_currentItems: object[]` (drop 시 재렌더용 원본 데이터 cache), `_draggingId: string|null` (현재 dragstart 잡힌 tabid), `_dragStartHandler` / `_dragOverHandler` / `_dragLeaveHandler` / `_dropHandler` / `_dragEndHandler` (bound handler 참조 — beforeDestroy 정확 제거용). Standard 는 stateless.
> - **자체 메서드 9 종** — `_renderItems` / `_setTabOrder` / `_handleDragStart` / `_handleDragOver` / `_handleDragLeave` / `_handleDrop` / `_handleDragEnd` / `_emitReorder` / `_clearDragState`. Standard 는 자체 메서드 0 종.
> - **HTML 구조 변경 — 각 탭 루트 `.tabs-dr__item` 에 `draggable="true"`** — Standard template 은 `[icon|label|badge|indicator]` + `data-tabid` + `data-active` 만. draggableReorder template 은 동일 구조 + `draggable="true"` 속성 추가. 클래스 prefix `.tabs-dr__*` 로 Standard(`.tabs__*`) / closable(`.tabs-cl__*`) / scrollable(`.tabs-sc__*`) 와 분리.
> - **HTML5 DnD 5종 native 리스너** — `dragstart`/`dragover`/`dragleave`/`drop`/`dragend` 컨테이너 위임. Standard 는 사용 안 함.
> - **새 토픽 1 종** — `setTabOrder` (`string[]` — 영속화된 tabid 순서 복원). Standard 는 `tabItems` 1 종만 구독.
> - **새 이벤트 1 종** — `@tabReordered` (allTabIds + tabid + fromIndex + toIndex 명시 payload). `@tabClicked` 위임 발행은 Standard 호환 유지.
>
> 위 6축은 동일 register.js 로 표현 불가 → Standard 내부 variant 로 흡수 불가.

> **Tabs/Advanced/closable + scrollable + Lists/Advanced/draggableReorder 답습**: register.js top-level 평탄 작성, 자체 상태/메서드/이벤트/토픽 분리, preview `<script src>` 5단계 깊이 verbatim 복사, demo-label/hint 에 변형 의도 + 도메인 컨텍스트 명시. **Lists/draggableReorder 의 HTML5 DnD 5종 패턴(`_handleDragStart` + `_handleDragOver` + `_handleDragLeave` + `_handleDrop` + `_handleDragEnd` + bound handler 5 보관)** + `_currentOrder` / `_currentItems` 자체 상태 + `setItemOrder` → `setTabOrder` 토픽 + `@itemReordered` → `@tabReordered` 명시 payload 패턴을 동일하게 차용한다. **차이점은 가로 축 처리** — 탭은 수평 정렬이므로 `data-drag-target="before|after"` (Lists 는 above/below) + mid-X 기준 (Lists 는 mid-Y 기준). closable 의 prefix 분리(`.tabs-dr__*`) + Standard 호환 selector KEY(`tabid`/`active`/`icon`/`label`/`badge` + `container`/`template`) 도 동일.

> **다른 Tabs Advanced(closable / scrollable / lazyContent) 와의 직교성**: draggableReorder = 항목 순서(순서 진실), closable = 항목 제거(데이터 진실), scrollable = overflow 가시성(viewport 진실), lazyContent = 콘텐츠 로딩(콘텐츠 진실). 네 변형 모두 서로 다른 축. 동일한 ListRenderMixin 토대 + Standard 호환 KEY(`tabid`/`active`/`icon`/`label`/`badge`) 공유. 양립 시 prefix 가 다르므로 페이지 내 공존 가능 — `.tabs-dr__*` ↔ `.tabs-cl__*` ↔ `.tabs-sc__*` ↔ `.tabs-lz__*`.

> **MD3 / 도메인 근거**: MD3 Tabs spec 자체에는 draggable 변형이 명시되지 않으나, 모든 모던 다중 문서/세션/세그먼트 UI 가 채택하는 사실상 표준 패턴이다 — VSCode/Chrome/Figma/IntelliJ 다중 문서 탭의 좌우 reorder, Postman/Insomnia 다중 요청 탭의 우선순위 정렬, Slack/Discord 다중 채널 탭의 사용자 선호 순서 등. 실사용: ① **편집 도구 — 다중 문서 탭** (사용자가 자주 보는 파일을 좌측으로 이동하여 빠른 접근), ② **운영 콘솔 — 사이트/세션 탭 우선순위** (Critical 사이트를 좌측으로 정렬 후 영속화), ③ **분석 대시보드 — 시간 윈도우/지표 탭 사용자 선호 순서** (1H/6H/1D/7D 중 자주 보는 윈도우를 좌측), ④ **CRM — 고객 세그먼트 탭 우선 정렬** (active/lead/vip 등 사용자가 자주 보는 세그먼트 우선).

---

## 구현 명세

### Mixin

ListRenderMixin (탭 데이터 렌더링 — Mixin 은 reorder 인지 X) + 자체 메서드 9종(`_renderItems` / `_setTabOrder` / `_handleDragStart` / `_handleDragOver` / `_handleDragLeave` / `_handleDrop` / `_handleDragEnd` / `_emitReorder` / `_clearDragState`) + 자체 상태 `_currentOrder: string[]` / `_currentItems: object[]` / `_draggingId: string|null`.

> **신규 Mixin 생성 금지** — 큐 설명에 "드래그로 탭 순서 변경 — dragstart/over/drop, @tabReordered" 명시. SKILL 규칙상 본 루프에서 새 Mixin 을 만들지 않는다. ListRenderMixin 은 탭 배열을 받아 N 개 탭을 렌더하고(reorder 인지 X), HTML5 DnD 5종 위임 · 새 순서 계산 · ListRender 재렌더 · 명시 emit 은 컴포넌트 자체 메서드가 전담.

### cssSelectors (ListRenderMixin)

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.tabs-dr__list`            | 탭이 추가될 부모 (ListRenderMixin 규약) — DnD 5종 위임 부착 대상. |
| template  | `#tabs-dr-item-template`    | `<template>` cloneNode 대상 (ListRenderMixin 규약). |
| tabid     | `.tabs-dr__item`            | 탭 식별 + 본체 클릭 위임 (data-tabid). `draggable="true"` + DnD 이벤트 + `data-drag-state`/`data-drag-target` 부착 + click 이벤트 매핑. |
| active    | `.tabs-dr__item`            | 활성 상태 (data-active). |
| icon      | `.tabs-dr__icon`            | 아이콘 표시 (Material Symbols 등). |
| label     | `.tabs-dr__label`           | 라벨 텍스트. |
| badge     | `.tabs-dr__badge`           | 뱃지 텍스트 (빈 값이면 `:empty` 로 숨김). |

> **draggableReorder 전용 보조 selector(자체 메서드 전담)**: `.tabs-dr`(루트) 는 cssSelectors KEY 로 등록하지 않는다 — ListRender 가 직접 데이터 바인딩하지 않으며 자체 메서드(컨테이너 매칭)가 전담. `.tabs-dr__indicator` (active indicator — 페르소나별 시각) 도 KEY 로 등록하지 않음.

### itemKey (ListRender)

`tabid` — 향후 `updateItemState(tabid, { active })` 활용 가능(본 변형은 사용하지 않지만 일관성/확장성을 위해 등록).

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| tabid  | `tabid`  | 탭 식별 — `closest('.tabs-dr__item')?.dataset.tabid` 로 추출. |
| active | `active` | 활성 상태 — `[data-active="true"]` CSS 셀렉터. |

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_currentOrder` | `string[]` | 현재 렌더된 tabid 배열 — 순서 진실 소스. `_renderItems` 가 새 batch 로 교체, `_handleDrop` / `_setTabOrder` 가 갱신. |
| `_currentItems` | `object[]` | 현재 렌더된 탭 데이터 배열 (`[{tabid, icon, label, badge, active}]`) — drop 시 새 순서로 재렌더하기 위해 보관. ListRender 는 한 번 렌더된 데이터를 노출하지 않으므로 자체 cache. |
| `_draggingId` | `string \| null` | 현재 dragstart 로 잡힌 탭 tabid. dragstart 에서 set, dragend/drop 에서 null 로 복귀. |
| `_dragStartHandler` / `_dragOverHandler` / `_dragLeaveHandler` / `_dropHandler` / `_dragEndHandler` | `function \| null` | bound handler 참조 — beforeDestroy 에서 정확히 removeEventListener 하기 위해 보관. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `tabsItems`   | `this._renderItems`  | `[{ tabid, icon, label, badge, active }]` — 새 batch (탭 전체 replace). `_currentOrder` / `_currentItems` 도 새 진실로 교체. |
| `tabItems`    | `this._renderItems`  | Standard 호환 별칭 — 동일 페이로드. |
| `setTabOrder` | `this._setTabOrder`  | `string[]` — 영속화된 tabid 순서. 외부에서 받아 `_currentItems` 를 그 순서로 재정렬 + 재렌더. 페이지가 localStorage / API 에서 복원한 순서를 본 토픽으로 publish. |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `tabid` (ListRender — `.tabs-dr__item`) | 탭 클릭 (드래그가 발생하지 않은 경우만 native click 발생) | `@tabClicked` (Standard 호환 — `{ targetInstance, event }`). 페이지는 `event.target.closest('.tabs-dr__item')?.dataset.tabid` 로 추출. |

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@tabReordered` | drop 인정 사이클의 끝에 1회 (단, `fromIndex !== toIndex` 인 경우에만 발행) | `{ targetInstance, fromIndex, toIndex, tabid, allTabIds: [id1, ...] }` |

> **이벤트 분리 이유**: bindEvents 위임은 `{ targetInstance, event }` 만 전달 → tabid + allTabIds + fromIndex/toIndex 가 없다. draggableReorder 는 페이지가 매번 DOM 을 다시 스캔하지 않고도 어떤 탭이 어디로 이동했는지 + 새 전체 순서를 바로 받을 수 있어야 하므로(예: localStorage / API 영속화, route 동기화) 명시 payload 채택. `@tabClicked` 위임 발행은 Standard 호환 + 사용자 액션 채널로 분리.

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_renderItems({ response })` | `({response}) => void` | `tabsItems` / `tabItems` 핸들러. 페이로드 배열을 ListRender selectorKEY(`tabid`/`active`/`icon`/`label`/`badge`) 에 맞게 String 변환 후 `listRender.renderData` 호출. `_currentOrder` / `_currentItems` 를 새 batch 로 교체. `_draggingId = null`. |
| `_setTabOrder({ response })` | `({response}) => void` | `setTabOrder` 핸들러. response 가 `string[]` 이면 `_currentItems` 를 해당 순서로 재정렬(Map 기반 lookup, 누락 id 는 끝에 보존) → `listRender.renderData` 재호출 → `_currentOrder` 갱신. `_draggingId = null`. 변경 시 `@tabReordered` 는 발행하지 않음(외부 명시 적용이므로). |
| `_handleDragStart(e)` | `(DragEvent) => void` | 컨테이너 위임. `e.target.closest(tabid)` 로 시작 탭 찾음. id 없으면 무시. `e.dataTransfer.setData('text/plain', id)` + `effectAllowed='move'`. `_draggingId = id`. 탭에 `dataset.dragState='dragging'`. |
| `_handleDragOver(e)` | `(DragEvent) => void` | 컨테이너 위임. `e.target.closest(tabid)` 로 hover target 찾음. `_draggingId` 와 같으면 dragTarget 정리만. `e.preventDefault()` 로 drop 허용. **`mouseX < (rect.left + rect.width / 2)` ? 'before' : 'after'** 를 dataset.dragTarget 에 적용 (가로 축). 다른 형제 탭의 dragTarget 은 정리. |
| `_handleDragLeave(e)` | `(DragEvent) => void` | 컨테이너 위임. `e.target.closest(tabid)` 의 dataset.dragTarget 제거(컨테이너 밖으로 leave 시 일괄 정리는 dragend 가 담당). |
| `_handleDrop(e)` | `(DragEvent) => void` | 컨테이너 위임. `e.preventDefault()` + `e.stopPropagation()`. `_draggingId` 없으면 무시. drop target 찾고 dragTarget(before/after) 확인. `_currentOrder` 에서 tabid 의 fromIndex 추출 → 제거 → 새 위치(targetIndex + (before ? 0 : 1), fromIndex 보정 포함) 삽입 → `_currentItems` 도 같은 순서로 재정렬 → `listRender.renderData` 재호출(전체 replace). 변경이 있으면(`fromIndex !== toIndex`) `_emitReorder(tabid, fromIndex, toIndex)`. `_clearDragState()`. |
| `_handleDragEnd(e)` | `(DragEvent) => void` | 컨테이너 위임. drop 외부에서 release 되거나 ESC 로 cancel 된 경우 모든 dataset 정리. `_draggingId = null`. |
| `_clearDragState()` | `() => void` | 컨테이너 안 모든 탭 순회 → `dataset.dragState`, `dataset.dragTarget` 제거. `_draggingId = null`. |
| `_emitReorder(tabid, fromIndex, toIndex)` | `(string, number, number) => void` | `Weventbus.emit('@tabReordered', { targetInstance: this, fromIndex, toIndex, tabid, allTabIds: [..._currentOrder] })`. |

### 페이지 연결 사례

```
[페이지 — 다중 문서 편집 / 운영 콘솔 사이트 / 분석 윈도우 / CRM 세그먼트]
    │
    └─ fetchAndPublish('tabsItems', this) 또는 직접 publish
        payload 예: [
          { tabid: 'file-01', icon: 'description', label: 'main.js',     badge: '',  active: 'true'  },
          { tabid: 'file-02', icon: 'description', label: 'utils.js',    badge: '*', active: 'false' },
          { tabid: 'file-03', icon: 'description', label: 'app.css',     badge: '',  active: 'false' },
          { tabid: 'file-04', icon: 'description', label: 'index.html',  badge: '',  active: 'false' },
          { tabid: 'file-05', icon: 'description', label: 'README.md',   badge: '',  active: 'false' }
        ]

[Tabs/Advanced/draggableReorder]
    ├─ ListRender 가 5개 .tabs-dr__item 을 가로로 렌더 (각 draggable="true")
    ├─ _currentOrder = ['file-01','file-02','file-03','file-04','file-05']
    ├─ _currentItems = items.slice()
    └─ 컨테이너 HTML5 DnD 5종 위임 부착

[사용자가 'file-04' 를 'file-01' 좌측(before)으로 드래그]
    ├─ dragstart → _draggingId='file-04', dataset.dragState='dragging'
    ├─ dragover (over 'file-01') → preventDefault, mid-X 기준 'before' 판정 → dataset.dragTarget='before' on file-01
    ├─ drop (on 'file-01', before) → fromIndex=3, toIndex=0
    ├─ _currentOrder = ['file-04','file-01','file-02','file-03','file-05']
    ├─ ListRender 재렌더 (새 순서)
    ├─ @tabReordered: { fromIndex:3, toIndex:0, tabid:'file-04', allTabIds:['file-04','file-01','file-02','file-03','file-05'] } 발행
    └─ _clearDragState

[탭 본체 클릭 — 'file-02' (드래그 미발생)]
    └─ bindEvents 위임 → @tabClicked { event, targetInstance } (Standard 호환)

[페이지]
    └─ @tabReordered → 자체 데이터 배열 재정렬 + 영속화(localStorage / API)
       (선택) 다음 세션에 setTabOrder publish 로 복원

운영: this.pageDataMappings = [
        { topic: 'tabsItems',   datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setTabOrder', datasetInfo: {...}, refreshInterval: 0 }   // 선택
      ];
      Wkit.onEventBusHandlers({
        '@tabClicked':    ({ event, targetInstance }) => {
                            const tabid = event.target.closest('.tabs-dr__item')?.dataset.tabid;
                            // 콘텐츠 뷰 전환 / route 동기화
                          },
        '@tabReordered':  ({ allTabIds, tabid, fromIndex, toIndex }) => {
                            localStorage.setItem('tabOrder', JSON.stringify(allTabIds));
                          }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | dragging / dragTarget 시각 차별화 (탭 가로 축) | 도메인 컨텍스트 예 |
|------|---------|--------------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | dragging: opacity 0.5 + scale 0.97 + 퍼플 elevated 글로우(box-shadow). dragTarget="before": 탭 좌측 가장자리에 3px 세로 퍼플 indicator line(::before). dragTarget="after": 우측 가장자리에 동일 라인. 활성 탭 하단 4px pill indicator(시안→퍼플 그라디언트). | **편집 도구 — 다중 문서 탭 5개** (main.js / utils.js / app.css / index.html / README.md — 자주 보는 파일을 좌측으로 reorder + localStorage 영속화) |
| `02_material`    | B: Material Elevated | dragging: opacity 0.4 + scale 1.03(살짝 lift) + elevation level 4. dragTarget: 라이트 블루 4px 두꺼운 세로 indicator bar (탭 좌/우 가장자리). 활성 탭 3px bottom indicator + 하단 divider. | **CRM — 고객 세그먼트 탭 우선 정렬** (active/lead/vip/churned/dormant — 사용자가 자주 보는 세그먼트 좌측 정렬 + admin 영속화) |
| `03_editorial`   | C: Minimal Editorial | dragging: opacity 0.5 + outline 1.5px 갈색 + serif 핸들 강조. dragTarget: 1px 진한 갈색 dashed 세로 line (탭 좌/우). 활성 탭 하단 2px 얇은 indicator + 넓은 여백. | **분석 대시보드 — 시간 윈도우 탭 사용자 선호 정렬** (1H/6H/12H/1D/7D — 사용자 선호 순서로 reorder, 영속화) |
| `04_operational` | D: Dark Operational  | dragging: opacity 0.45 + 시안 dashed border + 모노스페이스. dragTarget: 노랑(`#FFB300`) 1.5px solid 세로 line + 노랑 글로우(운영 임계 강조 컬러). 활성 탭 각진 2px bottom indicator + tabular-nums badge. | **운영 콘솔 — 사이트/세션 탭 우선 정렬** (Site-Seoul-01/02 / Site-Busan / Critical 우선 좌측 reorder — 운영자 선호 순서 영속화) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, `[data-drag-state="dragging"]`, `[data-drag-target="before"]`, `[data-drag-target="after"]` 셀렉터로 시각을 분기. 드래그 transition 150~220ms 로 부드럽게.

### 결정사항

- **prefix `.tabs-dr__*`** — Standard `.tabs__*` / closable `.tabs-cl__*` / scrollable `.tabs-sc__*` / lazyContent `.tabs-lz__*` 와 분리(같은 페이지 공존 시 CSS 충돌 X).
- **2 토픽 동시 구독(`tabsItems` + `tabItems`)** — Advanced 변형은 큐 설명대로 `tabsItems` 토픽 권장이지만, Standard 호환을 위해 `tabItems` 도 구독. 페이지가 둘 중 하나로 publish 해도 동작 (closable / scrollable 답습).
- **가로 축 처리 — `data-drag-target="before|after"`, mid-X 기준** — Lists/draggableReorder 는 수직 리스트라서 above/below + mid-Y. 탭은 가로 정렬이므로 좌측/우측 = before/after + mid-X. 의미는 동일(insertion line 위치) 하지만 축이 다르므로 변수명을 명시적으로 분리.
- **탭 자체가 `draggable="true"`** — handle 영역 분리 없이 탭 전체가 draggable. closable 의 × 버튼처럼 별도 분기 영역이 없으므로 ① 본체 click(드래그 미발생) → `@tabClicked`(Standard 호환), ② 드래그 → DnD 5종이 native 분기 처리. 둘이 native event 분기로 자동 분리되므로 `e.stopPropagation` 등 추가 가드 불필요.
- **`_currentOrder` / `_currentItems` 두 자체 상태** — `_currentOrder` 는 빠른 index lookup, `_currentItems` 는 ListRender 재렌더용 데이터 cache. ListRender 가 한 번 렌더된 후 데이터를 노출하지 않으므로 drop 시 새 순서로 재렌더하려면 cache 가 필수. (Lists/draggableReorder 답습.)
- **`setTabOrder` 토픽** — 영속화된 정렬을 외부에서 복원하는 시나리오를 위한 선택 토픽. 페이지가 localStorage / API 에서 읽은 tabid 순서 배열을 publish 하면 컴포넌트가 그 순서로 재렌더. (Lists/draggableReorder 의 `setItemOrder` 패턴을 그대로 답습.)
- **신규 Mixin 생성 금지** — ListRenderMixin + 자체 메서드 9종으로 완결.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions / customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서 (HTML5 DnD 5종 native 위임 remove → customEvents 제거 → 구독 해제 → 자체 상태/메서드 null + listRender.destroy)
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Tabs/Advanced/draggableReorder/preview/...html` → `../`를 5번 = closable 동일 verbatim 복사)
