# Trees — Advanced / draggableReorder

## 기능 정의

1. **트리 노드 동적 렌더 (flat 전개)** — `treeNodes` 토픽으로 수신한 **재귀 트리**(`[{nodeid, label, leading?, trailing?, expanded?, children?}]`)를 컴포넌트가 자체 보유한 `_currentTree`에 저장하고, `_flatten()`으로 visible 노드만 flat 배열로 전개해 ListRenderMixin이 `<template>` cloneNode로 N개 row로 렌더한다. 각 노드는 `data-nodeid`/`data-depth`/`data-expanded`/`data-has-children`/`data-selected`로 식별·표시되어 CSS가 들여쓰기·chevron 회전·자식 숨김·선택을 제어. row template에 `draggable="true"`가 고정되어 HTML5 Drag and Drop API가 활성화된다. cssSelectors KEY는 Standard 호환(`treeid`/`depth`/`expanded`/`hasChildren`/`selected`/`leading`/`label`/`trailing`)이며, 추가로 본 변형 전용 `nodeid`/`handle` KEY를 등록한다.
2. **HTML5 Drag and Drop으로 노드 부모/순서 재배치 (3 zone)** — 드래그 시작(`dragstart`) 시 `dataTransfer.setData('text/plain', nodeid)` + `effectAllowed='move'` + 노드에 `data-drag-state="dragging"` 부여. 드래그 over(`dragover`)는 `event.preventDefault()`로 drop을 허용하고 hover 노드 row 영역을 mid-Y 기준 **3 zone**으로 분할: **상위 1/4 → `before`(같은 부모 안에서 hover 직전 형제로 이동)**, **하위 1/4 → `after`(같은 부모 안에서 hover 직후 형제로 이동)**, **가운데 1/2 → `inside`(hover 노드의 마지막 자식으로 이동, 부모 변경)**. zone 결과를 `data-drag-target="before|after|inside"`로 부여하여 CSS가 indicator line(before/after는 위/아래 라인) 또는 노드 본체 highlight(inside는 배경 강조)로 시각화. dragleave 시 dataset 정리. drop 시 `_moveNode(srcId, targetId, position)`이 `_currentTree`를 mutate(원래 위치 제거 → 새 위치 삽입) → `_flatten()` → ListRender 재렌더 → `@nodeDropped` + `@treeOrderChanged` 발행. dragend 시 모든 dragging/dragTarget dataset 정리.
3. **사이클 방지 (자기 자신 또는 자손 안으로 drop 차단)** — `_isDescendantOrSelf(srcId, targetId)`가 srcId === targetId 이거나 targetId가 srcId의 하위 트리 안에 있는 경우 `true`를 반환. `_handleDragOver`/`_handleDrop` 양쪽에서 가드: dragover 시 `inside` zone 후보가 자손이면 zone 후보를 무효화(다른 형제 dragTarget도 정리), drop 시 거부하고 silent return + `_clearDragState()`.
4. **재정렬 이벤트 발행 (2종)** — drop 인정된 사이클의 끝에 다음 두 이벤트를 발행:
   - `@nodeDropped` — `{ targetInstance, srcId, targetId, position: 'before'|'after'|'inside', srcParentId, newParentId }`. 페이지가 단일 이동 사실(어느 노드가 어디로 갔는지) 처리.
   - `@treeOrderChanged` — `{ targetInstance, tree: [...] }`. 변경 후 `_currentTree` 전체를 1회 broadcast하여 페이지가 영속화(localStorage / API)에 사용. payload `tree`는 `_currentTree`의 deep clone(외부 mutation 방지).
5. **노드 토글 (chevron) + 선택 호환 (Standard와 동일 이벤트)** — 드래그가 메인이지만 chevron 토글과 노드 선택도 호환. chevron(`toggle` 영역) 클릭 시 `@treeToggleClicked` 발행 (Standard 호환), 노드 본체 클릭 시 `@treeNodeClicked` 발행 (Standard 호환). 페이지가 `event.target.closest('.tree-dr__node')?.dataset.nodeid`로 식별하여 `_currentTree`의 expanded를 반전한 후, 컴포넌트의 `setExpanded` 토픽으로 다시 publish하면 `_setExpanded`가 `_currentTree.expanded`를 갱신하고 재렌더한다. 드래그가 시작된 클릭은 native HTML5 DnD가 자체 처리하므로 click 이벤트는 발생하지 않는다(브라우저 기본 동작).
6. **인스턴스 자체 트리 상태 보관** — `_currentTree: TreeNode[]` (재귀 구조) 자체 상태로 트리 진실을 보관. `_renderTree`가 `treeNodes` 페이로드 수신 시 deep clone으로 보관, `_handleDrop`이 `_moveNode`로 mutate, `_setExpanded`가 expanded 플래그만 갱신. 새 batch가 들어오면 새 진실로 교체(이전 누적 X). drag 시각 피드백은 `data-drag-state="dragging"` (소스), `data-drag-target="before|after|inside"` (target) 이중 dataset 채널.

> **Standard와의 분리 정당성**:
> - **자체 상태 (`_currentTree` / `_draggingId`)** — Standard는 stateless(페이지가 flatten 후 publish). draggableReorder는 트리 진실을 컴포넌트로 흡수.
> - **자체 메서드 11종** — `_renderTree`, `_setExpanded`, `_flatten`, `_findNode`, `_findParent`, `_isDescendantOrSelf`, `_moveNode`, `_handleDragStart`, `_handleDragOver`, `_handleDragLeave`, `_handleDrop`, `_handleDragEnd`, `_emitNodeDropped`, `_emitTreeOrderChanged`, `_clearDragState`. Standard는 자체 메서드 0종.
> - **HTML5 DnD 5종 native 리스너** — `dragstart`/`dragover`/`dragleave`/`drop`/`dragend` 컨테이너 위임. Standard는 사용 안함.
> - **3 zone (before/after/inside)** — Lists/Advanced/draggableReorder는 above/below 2 zone(flat). Trees는 계층이 있어 inside가 추가됨(부모 변경). 이는 Trees 도메인 고유 요구.
> - **재귀 데이터 입력** — Standard `treeNodes` payload는 flat 배열(visible only). draggableReorder는 재귀 트리 전체 — 컴포넌트가 expanded/visible을 자체 결정.
> - **새 이벤트 2종** — `@nodeDropped` + `@treeOrderChanged`(전체 트리 broadcast). Standard는 `@treeToggleClicked`/`@treeNodeClicked`만.
> - **추가 토픽** — `setExpanded`(외부에서 expanded 노드 ID 집합 강제). Standard는 `treeNodes` 1종.
> - **template 변경** — Standard 노드 `<div class="tree__node">`. draggableReorder는 `<div class="tree-dr__node" draggable="true">`로 draggable 속성 + drag handle 영역을 추가. cssSelectors 클래스명도 `tree-dr__*`로 분리(Standard `tree__*`와 충돌 방지).
>
> 위 7축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.

> **Lists/Advanced/draggableReorder, Cards/Advanced/sortable, SegmentedButtons/Advanced/draggableReorder와의 차이 (1줄 핵심)**: 같은 reorder 의미론이지만 **데이터 모델 차원이 다름** — Lists/Cards/SegmentedButtons는 *flat 1차원* 순서 변경(above/below 2 zone), Trees/draggableReorder는 *계층 N차원* 재배치(before/after/inside 3 zone + 부모 변경 + cycle 방지). HTML5 DnD 패턴 자체는 답습. cssSelectors 계약은 Trees/Standard 호환(treeid 위치에 nodeid).

> **MD3 / 도메인 근거**: Trees는 MD3 공식 범주가 아니지만 hierarchical data를 expandable/collapsible로 표시하는 표준 패턴이다. 노드 드래그로 부모 변경/순서 변경은 데스크탑 IDE / 파일 시스템 / 조직도 / 카테고리 관리 도구에서 표준화된 상호작용 — VS Code Explorer 파일 이동, macOS Finder 폴더 이동, Trello 카드의 리스트 간 이동, Notion 블록의 페이지 간 이동, Asana subtask 부모 변경, 메일 폴더 트리 재배치 등. 실사용 시나리오: ① **파일/폴더 트리 재배치** (개발 IDE, 클라우드 스토리지), ② **조직도 부서 이동** (HR 시스템에서 팀/부서 재구성), ③ **카테고리 트리 관리** (전자상거래 카테고리 N차 트리 재편성), ④ **메뉴/네비 항목 트리 편집** (CMS 메뉴 빌더). HTML5 Drag and Drop API는 표준이며 키보드/스크린리더 호환은 별도 a11y 변형(향후) — 본 변형은 mouse pointer 기반 reorder의 표준 구현.

---

## 구현 명세

### Mixin

ListRenderMixin (flat 배열 렌더 + datasetAttrs로 depth/상태 반영) + 자체 메서드(`_renderTree` / `_setExpanded` / `_flatten` / `_findNode` / `_findParent` / `_isDescendantOrSelf` / `_moveNode` / `_handleDragStart` / `_handleDragOver` / `_handleDragLeave` / `_handleDrop` / `_handleDragEnd` / `_emitNodeDropped` / `_emitTreeOrderChanged` / `_clearDragState`).

> Standard도 ListRenderMixin을 사용하지만, 본 변형은 ① `_currentTree`(재귀) 자체 상태로 트리 진실 보관, ② HTML5 DnD 5종 native 리스너(컨테이너 위임)를 직접 부착, ③ 3 zone(before/after/inside) 계산 + cycle 방지 가드, ④ drop 시 `_moveNode`로 트리 mutate 후 flat 전개로 ListRender 재호출 + 2종 이벤트 emit. Mixin 메서드 재정의는 하지 않는다(`_renderTree`는 `_flatten` 후 `listRender.renderData` 호출을 한 cycle에 묶는 wrapper). 신규 Mixin 생성은 본 SKILL의 대상이 아님 — 자체 메서드로 완결.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| group       | `.tree-dr`                       | 그룹 컨테이너 — `role="tree"` |
| container   | `.tree-dr__list`                 | 노드가 추가될 부모 (ListRenderMixin 규약) — DnD 위임 부착 대상 |
| template    | `#tree-dr-node-template`         | `<template>` cloneNode 대상 (ListRenderMixin 규약) |
| nodeid      | `.tree-dr__node`                 | 렌더된 각 row 루트 — `draggable="true"` + DnD 이벤트 + `data-drag-state`/`data-drag-target` 부착 + click 이벤트 매핑. ListRender가 `data-nodeid` 자동 설정. |
| depth       | `.tree-dr__node`                 | 들여쓰기 단계 (data-depth) |
| expanded    | `.tree-dr__node`                 | 펼침 상태 (data-expanded) |
| hasChildren | `.tree-dr__node`                 | 자식 존재 여부 (data-has-children) |
| selected    | `.tree-dr__node`                 | 선택 상태 (data-selected) |
| toggle      | `.tree-dr__toggle`               | chevron 토글 영역 (클릭 이벤트 매핑) |
| handle      | `.tree-dr__handle`               | 드래그 핸들 아이콘 — `pointer-events: none`(시각 신호만) |
| leading     | `.tree-dr__leading`              | 선행 아이콘/이모지 (Standard 호환 KEY) |
| label       | `.tree-dr__label`                | 노드 레이블 (Standard 호환 KEY) |
| trailing    | `.tree-dr__trailing`             | 후행 배지/수량 (Standard 호환 KEY) |

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| nodeid      | `nodeid`       | 노드 식별 — `event.target.closest(nodeid)?.dataset.nodeid`로 nodeid 추출 |
| depth       | `depth`        | 들여쓰기 |
| expanded    | `expanded`     | 펼침 상태 |
| hasChildren | `has-children` | 자식 존재 여부 |
| selected    | `selected`     | 선택 강조 |

### itemKey

`nodeid` (ListRender) — ListRender의 항목 식별 키.

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_currentTree` | 현재 트리 진실 `[{nodeid, label, leading?, trailing?, expanded?, selected?, children?}]` 재귀 구조. `_renderTree`가 deep clone으로 초기화, `_handleDrop`이 `_moveNode`로 mutate, `_setExpanded`가 expanded 플래그만 갱신. |
| `_draggingId` | 현재 dragstart로 잡힌 노드 id (string \| null). dragstart에서 set, dragend/drop에서 null로 복귀. |
| `_dragStartHandler` / `_dragOverHandler` / `_dragLeaveHandler` / `_dropHandler` / `_dragEndHandler` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener 하기 위해 보관. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `treeNodes`   | `this._renderTree`   | 재귀 트리 `[{nodeid, label, leading?, trailing?, expanded?, selected?, children?}]` — 컴포넌트가 deep clone으로 보관 |
| `setExpanded` | `this._setExpanded`  | `string[]` — 펼친 상태로 만들 nodeid 배열. 컴포넌트가 `_currentTree`의 모든 노드 `expanded`를 이 집합 기준으로 갱신 후 재렌더 (영속화된 펼침 상태 복원 시나리오). |

### 이벤트 (customEvents + Weventbus.emit)

| 이벤트 | 선택자 (computed) / 직접 emit | 발행 시점 | payload |
|--------|------------------------------|-----------|---------|
| click | `toggle` (ListRender computed) | chevron 클릭 | `@treeToggleClicked` (bindEvents 위임 발행 — Standard 호환). `{ targetInstance, event }`. |
| click | `nodeid` (ListRender computed) | 노드 클릭 (드래그가 발생하지 않은 클릭만) | `@treeNodeClicked` (bindEvents 위임 발행 — Standard 호환). `{ targetInstance, event }`. |
| `@nodeDropped` | (Weventbus.emit, 직접 발행) | drop 인정된 사이클 (`srcId !== targetId` + cycle 통과) | `{ targetInstance, srcId, targetId, position: 'before'\|'after'\|'inside', srcParentId, newParentId }` |
| `@treeOrderChanged` | (Weventbus.emit, 직접 발행) | drop 인정된 사이클의 끝(@nodeDropped 직후 1회) | `{ targetInstance, tree: <_currentTree deep clone> }` |

> **이벤트 발행 분리 이유**: bindEvents 위임 click은 Standard 호환용 (chevron 토글 + 노드 선택), drag/drop 결과는 자체 native 리스너가 명시 payload(`@nodeDropped` 단일 이동 + `@treeOrderChanged` 전체 broadcast)를 emit. 페이지는 두 채널을 직교로 사용 — `@nodeDropped`는 단일 사실 처리(예: undo stack push), `@treeOrderChanged`는 영속화 sink.

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderTree({ response })` | `treeNodes` 핸들러. response가 배열이면 deep clone으로 `_currentTree` 갱신, `_flatten()` 후 `listRender.renderData` 호출. `_draggingId = null`. |
| `_setExpanded({ response })` | `setExpanded` 핸들러. response가 `string[]`이면 `_currentTree`의 모든 노드를 재귀 순회하여 `expanded`를 (해당 집합에 포함됐는가) 기준으로 갱신 → `_flatten()` → 재렌더. `@treeOrderChanged`는 발행하지 않음(외부 명시 적용이므로). |
| `_flatten(nodes, depth, out)` | 재귀 트리를 visible flat 배열로 전개. 각 노드를 `{ nodeid, depth: String, expanded: String, hasChildren: String, selected: String, leading, label, trailing }`로 변환. `expanded === false`인 노드의 children은 건너뜀 — Standard와 동일한 visible-only 정책. |
| `_findNode(tree, id)` | 재귀 검색으로 nodeid에 해당하는 노드 객체 반환 (없으면 null). |
| `_findParent(tree, id, parent)` | 재귀 검색으로 nodeid를 자식으로 가진 부모 노드 반환 (루트면 null — `'__root__'` 사용). 두 번째 반환값으로 인덱스 함께 반환은 호출자가 `_findParent`의 결과의 children에서 indexOf로 처리. |
| `_isDescendantOrSelf(srcId, targetId)` | targetId가 srcId 자기 자신이거나 srcId 노드의 하위 트리 안에 있으면 `true`. cycle 방지 가드. |
| `_moveNode(srcId, targetId, position)` | `_currentTree` mutate. (1) src 노드를 원래 부모의 children에서 제거. (2) position에 따라 새 부모/위치에 삽입: `before` → targetParent.children의 target 직전, `after` → targetParent.children의 target 직후, `inside` → target.children의 마지막에 push (target.children이 없으면 생성). srcParentId/newParentId 반환 (이벤트 payload용). 자기 자신 제거 후 같은 children에 다시 삽입 시 인덱스 보정. |
| `_handleDragStart(e)` | 컨테이너 위임. `e.target.closest(nodeid)`로 시작 노드 찾음. id 없으면 무시. `dataTransfer.setData('text/plain', id)` + `effectAllowed='move'`. `_draggingId = id`. row에 `dataset.dragState='dragging'`. |
| `_handleDragOver(e)` | 컨테이너 위임. hover row 찾음. `_draggingId === overId` 이거나 `_isDescendantOrSelf(_draggingId, overId)`이면 cycle 차단(다른 형제 dragTarget 정리 + 자기 자신 dragTarget 제거 + 무시). `e.preventDefault()`로 drop 허용. mid-Y 기준 3 zone 계산: `mouseY < top + height/4` → before, `mouseY > top + 3*height/4` → after, else → inside. `dataset.dragTarget = position`. 다른 형제 dragTarget 정리. |
| `_handleDragLeave(e)` | 컨테이너 위임. row 단위 leave 시 dragTarget 정리(자식 간 leave는 무시). |
| `_handleDrop(e)` | 컨테이너 위임. `e.preventDefault()` + `e.stopPropagation()`. `_draggingId` 없으면 무시. drop target row + dragTarget(position) 추출. cycle 가드. position이 `inside` + targetId === srcId면 거부. `_moveNode(srcId, targetId, position)` 실행. `_flatten()` → 재렌더. `@nodeDropped` + `@treeOrderChanged` 발행. `_clearDragState()`. |
| `_handleDragEnd(e)` | 컨테이너 위임. drop 외부 release / ESC cancel 시 cleanup. |
| `_clearDragState()` | 모든 row의 `dataset.dragState`/`dataset.dragTarget` 제거. `_draggingId = null`. |
| `_emitNodeDropped({ srcId, targetId, position, srcParentId, newParentId })` | `Weventbus.emit('@nodeDropped', { targetInstance: this, ... })`. |
| `_emitTreeOrderChanged()` | `Weventbus.emit('@treeOrderChanged', { targetInstance: this, tree: <_currentTree deep clone> })`. |

### 페이지 연결 사례

```
[페이지 — 파일 시스템 / 조직도 / 카테고리 트리 / 메뉴 빌더]
    │
    └─ fetchAndPublish('treeNodes', this) 또는 직접 publish
        payload (재귀 트리 — 컴포넌트가 expanded/visible을 자체 결정):
        [
          { nodeid: 'src',         leading: '📁', label: 'src',        expanded: true,  children: [
              { nodeid: 'app',     leading: '📁', label: 'app',        expanded: true,  children: [
                  { nodeid: 'a.js',  leading: '📄', label: 'app.js',     trailing: '14kB' },
                  { nodeid: 'b.js',  leading: '📄', label: 'utils.js',   trailing: '3kB'  }
              ]},
              { nodeid: 'lib',     leading: '📁', label: 'lib',        expanded: false, children: [
                  { nodeid: 'c.js',  leading: '📄', label: 'logger.js',  trailing: '2kB' }
              ]}
          ]},
          { nodeid: 'tests',       leading: '📁', label: 'tests',      expanded: false, children: [...] }
        ]

[Trees/Advanced/draggableReorder]
    ├─ _renderTree가 _currentTree에 deep clone으로 보관
    ├─ _flatten()이 visible 노드만 flat 배열로 전개 (expanded:false인 부모의 자식은 제외)
    ├─ ListRender가 flat 배열을 row로 렌더 (각 row에 draggable="true")
    └─ 각 row의 data-depth/data-expanded/data-has-children/data-selected가 CSS에서 들여쓰기·chevron·시각 표시

[사용자가 'a.js'를 'lib' 노드 inside zone(가운데)으로 드래그]
    ├─ dragstart on 'a.js' → _draggingId='a.js', dataset.dragState='dragging'
    ├─ dragover on 'lib' (mid-Y zone) → _isDescendantOrSelf('a.js', 'lib')? No → preventDefault, dataset.dragTarget='inside' on lib
    ├─ drop on 'lib' (inside)
    │   ├─ srcParent = 'app' (a.js의 부모), newParent = 'lib'
    │   ├─ _moveNode: app.children에서 a.js 제거 → lib.children 마지막에 push
    │   ├─ _flatten() → 재렌더 (a.js가 lib 자식으로 표시, lib는 expanded=true 자동 처리는 페이지 책임)
    │   ├─ @nodeDropped: { srcId:'a.js', targetId:'lib', position:'inside', srcParentId:'app', newParentId:'lib' }
    │   └─ @treeOrderChanged: { tree: <_currentTree deep clone> }
    └─ _clearDragState

[사용자가 'lib'을 'src' 위로 'before' zone(상단 1/4)으로 드래그]
    ├─ dragstart on 'lib' → _draggingId='lib', dataset.dragState='dragging'
    ├─ dragover on 'src' (top quarter) → preventDefault, dataset.dragTarget='before' on src
    ├─ drop on 'src' (before)
    │   ├─ srcParent = 'src' (원래 부모) → 잠깐, lib의 부모는 'src'이고 target도 'src' 자신이면 cycle? No, srcId='lib', targetId='src', 'src'는 'lib'의 부모 — _isDescendantOrSelf('lib','src')는 false (반대 방향)
    │   ├─ position='before' → src의 형제로 가서 src 직전에 삽입 → newParent = src의 부모 (루트면 '__root__')
    │   ├─ _moveNode: src.children에서 lib 제거 → 루트 배열에서 src 직전에 lib 삽입
    │   ├─ _flatten() → 재렌더 (lib이 루트 레벨로 승격, src는 lib 다음 형제)
    │   ├─ @nodeDropped: { srcId:'lib', targetId:'src', position:'before', srcParentId:'src', newParentId:'__root__' }
    │   └─ @treeOrderChanged: { tree }
    └─ _clearDragState

[페이지]
    └─ @nodeDropped → undo stack push, @treeOrderChanged → 자체 모델 교체 + 영속화(localStorage / API)
       (선택) 다음 세션에 setExpanded publish로 펼침 상태 복원

운영: this.pageDataMappings = [
        { topic: 'treeNodes', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@nodeDropped': ({ srcId, targetId, position, srcParentId, newParentId }) => {
          // undo stack에 푸시
          undoStack.push({ srcId, srcParentId, oldPosition: ... });
        },
        '@treeOrderChanged': ({ tree }) => {
          // 영속화
          localStorage.setItem('fileTree', JSON.stringify(tree));
        },
        '@treeToggleClicked': ({ event }) => {
          const id = event.target.closest('.tree-dr__node')?.dataset.nodeid;
          // _currentTree에서 해당 노드의 expanded를 반전한 후 setExpanded publish
        },
        '@treeNodeClicked': ({ event }) => {
          const id = event.target.closest('.tree-dr__node')?.dataset.nodeid;
          // 노드 상세 패널 표시
        }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | dragging / dragTarget 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|---------------------------------|------------------|
| `01_refined`     | A: Refined Technical | dragging: opacity 0.5 + scale 0.97 + 퍼플 elevated 글로우. dragTarget="before": row 상단에 3px 퍼플 indicator line(::before). dragTarget="after": 하단에 동일 라인. dragTarget="inside": row 본체 배경 퍼플 그라디언트 강조 + 1.5px 퍼플 outline. | **파일/폴더 트리 재배치** (개발 IDE / 클라우드 스토리지 — src/app/utils/lib 폴더 재구성) |
| `02_material`    | B: Material Elevated | dragging: opacity 0.4 + scale 1.02(살짝 lift) + elevation level 4. dragTarget="before"/"after": 라이트 블루 4px 두꺼운 indicator bar. dragTarget="inside": 라이트 블루 #F2EEFA 배경 + 2px 퍼플 outline. | **조직도 부서 이동** (HR — 팀/부서 부모 변경 / 순서 재구성) |
| `03_editorial`   | C: Minimal Editorial | dragging: opacity 0.5 + outline 1.5px 갈색 + serif 핸들 강조. dragTarget="before"/"after": 1.5px 진한 갈색 dashed line. dragTarget="inside": warm beige(#EFE9DF) 배경 + 1.5px 갈색 outline. | **카테고리 트리 관리** (전자상거래 — 의류 → 상의 → T-Shirts 카테고리 트리 재편) |
| `04_operational` | D: Dark Operational  | dragging: opacity 0.45 + 시안 dashed border + 모노스페이스 핸들. dragTarget="before"/"after": 노랑(#FFB300) 1.5px solid + 노랑 글로우. dragTarget="inside": 노랑(#FFB300) 1px solid + 노랑 4% 배경. | **메뉴/네비 트리 편집** (CMS / 운영 콘솔 — 사이드바 메뉴 트리 N차 재편) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, `[data-drag-state="dragging"]`, `[data-drag-target="before"]`, `[data-drag-target="after"]`, `[data-drag-target="inside"]` 셀렉터로 시각을 분기. 드래그 transition 150~200ms로 부드럽게.

### 결정사항

- **Standard cssSelectors KEY 호환**: `leading`/`label`/`trailing`은 Standard와 동일 KEY명. `treeid` → `nodeid`로 KEY명 변경(이 변형의 도메인 — "node"가 더 명확). 클래스명만 `tree-dr__*`로 분리(`tree__*`와 충돌 방지).
- **draggable handle은 시각 신호만**: `.tree-dr__handle` 영역은 `pointer-events: none` — 노드 row 자체가 `draggable="true"`이므로 핸들 영역에서만 dragstart가 발생하는 분기는 사용하지 않는다. 핸들은 사용자에게 "여기를 잡고 드래그"라는 어포던스만 제공.
- **3 zone 비율 (1/4 / 1/2 / 1/4)**: 큐 설명 "mid-Y 위 1/4: before, 아래 1/4: after, 가운데 1/2: inside" 그대로. Trees는 inside가 부모 변경이라 비중이 크므로 가운데에 50%를 배정.
- **재귀 트리 input + flat 전개**: ListRenderMixin이 flat만 받는다는 제약 때문에 `_flatten`을 자체 구현. 컴포넌트가 expanded 상태를 보유하여 visible-only 전개 — Standard는 페이지가 flatten 후 publish하지만, draggableReorder는 mutate가 컴포넌트 안에서 일어나므로 트리 전체를 보유해야 한다.
- **cycle 방지**: `_isDescendantOrSelf`가 dragover에서 inside zone 후보를 차단하고 drop에서도 재가드. position이 `before`/`after`이면 형제 위치이므로 cycle 위험 없음 — but `inside`만 검사. (단, 자기 자신을 자기 부모의 다른 위치로 옮기는 before/after는 정상 — `srcId === targetId`만 거부.)
- **`@treeOrderChanged` payload deep clone**: 외부에서 페이로드를 mutate해도 컴포넌트 `_currentTree`가 영향받지 않도록 `JSON.parse(JSON.stringify(_currentTree))`로 deep clone 후 emit.
- **신규 Mixin 생성 금지**: 큐의 변형 설명에 따라 ListRenderMixin + 자체 메서드 조합으로 완결. drag reorder 패턴(Cards/sortable, SegmentedButtons/draggableReorder, Lists/draggableReorder, Trees/draggableReorder)이 4회 반복 — 일반화 가능성 검토 후보(반환에 메모만 — SKILL 회귀 규율).
- **`setExpanded` 토픽**: 영속화된 펼침 상태를 외부에서 복원하는 시나리오. Lists의 `setItemOrder`와 유사한 영속화 복원 패턴 — Trees는 펼침 상태가 핵심 영속화 대상.
