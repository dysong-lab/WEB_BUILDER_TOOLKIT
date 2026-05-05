# Trees — Advanced / checkbox

## 기능 정의

1. **트리 노드 동적 렌더 (재귀 입력 → flat 전개 + checkbox 시각 채널)** — `treeNodes` / `setTreeNodes` 토픽으로 수신한 **재귀 트리**(`[{nodeid, label, leading?, trailing?, expanded?, hasChildren?, children?, selected?}]`)를 컴포넌트가 자체 보유한 `_currentTree`에 deep clone으로 보관하고, `_flatten()`으로 visible 노드만 flat 배열로 전개해 ListRenderMixin이 `<template>` cloneNode로 N개 row로 렌더한다. 각 노드는 `data-nodeid`/`data-depth`/`data-expanded`/`data-has-children`/`data-checked`/`data-indeterminate`로 식별·표시되어 CSS가 들여쓰기·chevron 회전·자식 숨김·체크 SVG·indeterminate dash bar를 제어. cssSelectors KEY는 Standard 호환(`leading`/`label`/`trailing`)이며, 추가로 본 변형 전용 `nodeid`/`checked`/`indeterminate`/`checkbox` KEY를 등록한다.
2. **checkbox tri-state 시각 (checked / unchecked / indeterminate)** — 각 노드 row에 `<input type="checkbox">` 시각 박스를 포함. `data-checked="true|false"`(자기 자신 명시 체크) + `data-indeterminate="true"`(자손이 부분 체크) 이중 dataset 채널로 CSS가 박스 채움/dash bar를 분기. native input의 `.indeterminate` property는 사용하지 않고(ListRender renderData 재호출 시마다 dataset 우선 표현 보장) data-* 속성으로만 시각 관리.
3. **부모 → 자식 cascade down (자손 일괄 set + indeterminate normalize)** — checkbox 클릭 시(또는 외부 `setSelectedNodes` 토픽 수신 시) `_cascadeDown(nodeid, checked)`이 BFS 순회로 노드 자기 자신 + 모든 자손을 `_selectedNodes` Set에 add(checked=true) 또는 delete(checked=false)한다. 자손이 indeterminate였더라도 모두 normalize. `_indeterminateNodes` Set은 매 변경마다 `_recomputeIndeterminate()`로 트리 전체 재계산하여 갱신한다.
4. **자식 → 부모 cascade up (조상 자동 재계산)** — 매 cascade 변경 후 `_recomputeIndeterminate()`가 `_currentTree`를 재귀 후위 순회하면서 각 부모 노드를 다음 규칙으로 종합:
   - **모든 자식 checked + 어떤 자식도 indeterminate 아님** → 부모 `_selectedNodes`에 add + indeterminate 제거 (전체 선택).
   - **모든 자식 unchecked + 어떤 자식도 indeterminate 아님** → 부모 `_selectedNodes`에서 delete + indeterminate 제거.
   - **그 외 (일부 checked 또는 일부 indeterminate)** → 부모 `_selectedNodes`에서 delete + `_indeterminateNodes`에 add (tri-state mixed).
5. **외부 선택 주입 + cascade — `setSelectedNodes` 토픽** — 페이지가 `setSelectedNodes` 토픽으로 `{ nodeIds: [...] }` 발행 → `_handleSetSelectedNodes` 핸들러가 `_selectedNodes`를 새 Set으로 교체하고 모든 명시된 nodeid에 `_cascadeDown(id, true)`을 적용한 후 `_recomputeIndeterminate()`로 전체 indeterminate 재계산 + 재렌더 + `@selectionChanged` 발행. 영속화된 선택 상태 복원 시나리오.
6. **`clearSelection` 토픽 — 모두 해제** — 페이지가 `clearSelection` 토픽으로 `{}` 발행 → `_handleClearSelection`이 `_selectedNodes.clear()` + `_indeterminateNodes.clear()` + 재렌더 + `@selectionChanged { selectedIds:[], indeterminateIds:[], totalSelected:0 }`.
7. **이벤트 발행 — `@nodeChecked` + `@selectionChanged`**:
   - `@nodeChecked` — checkbox 클릭에 의한 단일 노드 변경 사실. payload: `{ targetInstance, nodeid, checked: boolean, cascadedTo: [영향받은 자손 nodeid 배열 — 자기 자신 제외] }`. 페이지가 단일 변경 사실(어느 노드가 어떤 값으로 변경되었는지)을 처리(예: undo stack push).
   - `@selectionChanged` — 매 변경 사이클 끝(클릭 / 외부 주입 / clear) 1회 broadcast. payload: `{ targetInstance, selectedIds: [모든 명시 체크 nodeid], indeterminateIds: [모든 indeterminate nodeid], totalSelected: number }`. 페이지가 폼 검증/외부 사이드패널 sync에 사용.
8. **노드 토글 (chevron) + 선택 호환 (Standard와 동일 이벤트)** — chevron(`toggle` 영역) 클릭 시 `@treeToggleClicked` 발행 (Standard 호환), 노드 본체 클릭 시 `@treeNodeClicked` 발행 (Standard 호환) — 단, checkbox 박스 영역의 click은 `_handleCheckboxClick`이 우선 위임 흡수(`stopPropagation` 없이 양 채널 모두 흐르되, checkbox 영역 click의 시맨틱은 cascade 트리거). 페이지는 chevron click을 받아 `setTreeNodes`로 다시 publish하면 `_handleSetTreeNodes`가 `_currentTree.expanded`를 갱신하고 재렌더한다.
9. **인스턴스 자체 트리 + 선택 상태 보관** — `_currentTree: TreeNode[]` (재귀 구조) 자체 상태로 트리 진실 보관. `_selectedNodes: Set<nodeid>` (명시 체크 — `setSelectedNodes` payload + 클릭으로 갱신). `_indeterminateNodes: Set<nodeid>` (cascade 결과 — `_recomputeIndeterminate()` 매번 재계산). 새 `treeNodes` batch는 새 진실로 교체(이전 누적 X) + 두 Set 모두 페이로드 `selected:true` leaf 기준으로 재구성.

> **Standard와의 분리 정당성**:
> - **자체 상태 (`_currentTree` 재귀 + `_selectedNodes` Set + `_indeterminateNodes` Set)** — Standard는 stateless(페이지가 flatten 후 publish). checkbox는 트리 진실 + 선택 그래프를 컴포넌트로 흡수.
> - **자체 메서드 8종** — `_handleSetTreeNodes`, `_handleSetSelectedNodes`, `_handleClearSelection`, `_handleCheckboxClick`, `_cascadeDown`, `_recomputeIndeterminate`, `_findNode`, `_flatten`, `_emitSelectionChanged`. Standard는 자체 메서드 0종.
> - **새 토픽 3종** — `setTreeNodes`(treeNodes 별칭, lazyLoad 답습), `setSelectedNodes`(외부 선택 주입), `clearSelection`(모두 해제). Standard는 `treeNodes` 1종만.
> - **새 이벤트 2종** — `@nodeChecked`(단일 사실 + cascadedTo), `@selectionChanged`(전체 broadcast). `@treeToggleClicked`/`@treeNodeClicked`는 Standard 호환 유지.
> - **HTML 구조 변경** — Standard 노드 `<div class="tree__node">`. checkbox는 `<div class="tree-cb__node">` + `<input type="checkbox" class="tree-cb__checkbox">`로 prefix 분리(Standard `tree__*` / draggableReorder `tree-dr__*` / lazyLoad `tree-ll__*`와 충돌 방지).
> - **재귀 데이터 입력** — Standard `treeNodes` payload는 flat 배열(visible only). checkbox는 재귀 트리 — 컴포넌트가 expanded/visible/cascade를 자체 결정.
> - **datasetAttrs 추가** — `checked`, `indeterminate` 두 속성을 ListRender datasetAttrs로 자동 반영. Standard는 selected 1종만.
>
> 위 7축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.

> **draggableReorder + lazyLoad + Checkbox/nestedTree 답습**:
> - draggableReorder/lazyLoad 패턴 차용: `_currentTree` 재귀 자체 보유 + `_flatten()` visible-only 전개 + ListRender flat 렌더 + Standard cssSelectors KEY 호환(leading/label/trailing) + `tree-cb__*` prefix 분리. register.js top-level 평탄 작성, preview `<script src>` 5단계 깊이 verbatim 복사.
> - Checkbox/Advanced/nestedTree 패턴 차용: cascade down/up tri-state 알고리즘(BFS down + 트리 후위 순회 up), `data-checked` + `data-indeterminate` 이중 dataset 채널, `_selectedNodes`/`_indeterminateNodes` Set 그래프 상태. 차이는 nestedTree가 TreeRenderMixin + `Map<id, NodeState>` 그래프 + 형제 처리 단순. checkbox는 ListRender flat 전개 + 두 Set + `_currentTree` 재귀 후위 순회로 _indeterminateNodes 한 번에 재계산.
> - Lists/Advanced/multiSelect 패턴 차용: `_selectedNodes: Set` 패턴 + `setSelectedNodes`/`clearSelection` 토픽 + `@selectionChanged` broadcast. 차이는 multiSelect가 flat 1차원 → checkbox는 hierarchical N차원 + indeterminate.

> **MD3 / 도메인 근거**: Trees는 MD3 공식 범주가 아니지만 hierarchical data + checkbox cascade는 모든 권한 / 카테고리 / 파일 트리의 표준 패턴. 실사용: ① **권한 트리** (admin console — 시스템 > 모듈 > 기능 > 액션 권한 일괄 부여, 부분 권한 시 상위 모듈 indeterminate), ② **카테고리 트리 다중 선택** (전자상거래 — Electronics > Phones > iPhone/Galaxy + Tablets, 카테고리 일괄 필터), ③ **파일 시스템 다중 선택** (IDE Explorer / 클라우드 스토리지 — 폴더 일괄 선택 시 자식 파일 cascade), ④ **조직도 일괄 알림** (HR — 본부 > 팀 > 멤버, 부분 발송 시 상위 부서 indeterminate), ⑤ **메일 폴더 다중 처리** (메일 클라이언트 — 라벨/폴더 cascade 일괄 archive). MD3 Checkbox indeterminate 정의는 부모-자식 단일 단계만 명시하지만 실사용은 다단계 cascade가 흔함 — Checkbox/Advanced/nestedTree와 동일한 cascade 시맨틱을 Trees 도메인에 적용.

---

## 구현 명세

### Mixin

ListRenderMixin (flat 배열 렌더 + datasetAttrs로 depth/상태/checked/indeterminate 반영) + 자체 메서드 10종(`_handleSetTreeNodes` / `_handleSetSelectedNodes` / `_handleClearSelection` / `_handleCheckboxClick` / `_cascadeDown` / `_recomputeIndeterminate` / `_syncTreeSelectedFromSets` / `_findNode` / `_flatten` / `_emitSelectionChanged`).

> Trees/Advanced/draggableReorder, lazyLoad도 ListRenderMixin을 사용하지만, 본 변형은 ① `_currentTree`(재귀) + `_selectedNodes`(Set) + `_indeterminateNodes`(Set) 자체 상태로 트리 진실 + 선택 그래프 보관, ② checkbox click → `_handleCheckboxClick` → cascade down + 전체 indeterminate 재계산, ③ `setSelectedNodes`/`clearSelection` 외부 주입 + cascade 자동 적용. Mixin 메서드 재정의는 하지 않음. 신규 Mixin 생성은 본 SKILL의 대상이 아님 — 자체 메서드로 완결.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| group         | `.tree-cb`                       | 그룹 컨테이너 — `role="tree"` |
| container     | `.tree-cb__list`                 | 노드가 추가될 부모 (ListRenderMixin 규약) |
| template      | `#tree-cb-node-template`         | `<template>` cloneNode 대상 (ListRenderMixin 규약) |
| nodeid        | `.tree-cb__node`                 | 렌더된 각 row 루트 — ListRender가 `data-nodeid` 자동 설정. 노드 본체 클릭 이벤트 매핑. |
| depth         | `.tree-cb__node`                 | 들여쓰기 단계 (data-depth) |
| expanded      | `.tree-cb__node`                 | 펼침 상태 (data-expanded) |
| hasChildren   | `.tree-cb__node`                 | 자식 존재 여부 (data-has-children) |
| checked       | `.tree-cb__node`                 | 명시 체크 상태 (data-checked) |
| indeterminate | `.tree-cb__node`                 | indeterminate 상태 (data-indeterminate — 부분 자식 체크) |
| toggle        | `.tree-cb__toggle`               | chevron 토글 영역 (클릭 이벤트 매핑 — Standard 호환) |
| checkbox      | `.tree-cb__checkbox`             | `<input type="checkbox">` 박스 — checkbox click 위임 대상 |
| leading       | `.tree-cb__leading`              | 선행 아이콘/이모지 (Standard 호환 KEY) |
| label         | `.tree-cb__label`                | 노드 레이블 (Standard 호환 KEY) |
| trailing      | `.tree-cb__trailing`             | 후행 배지/수량 (Standard 호환 KEY) |

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| nodeid        | `nodeid`         | 노드 식별 — `event.target.closest('.tree-cb__node')?.dataset.nodeid`로 nodeid 추출 |
| depth         | `depth`          | 들여쓰기 |
| expanded      | `expanded`       | 펼침 상태 |
| hasChildren   | `has-children`   | 자식 존재 여부 |
| checked       | `checked`        | 명시 체크 (CSS check SVG 표시) |
| indeterminate | `indeterminate`  | indeterminate (CSS dash bar 표시 — checked보다 우선순위 높음) |

### itemKey

`nodeid` (ListRender) — ListRender의 항목 식별 키.

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_currentTree`         | `TreeNode[]` (재귀) | 현재 트리 진실. 노드 = `{ nodeid, label, leading?, trailing?, expanded?, hasChildren?, children?, selected? }`. `_handleSetTreeNodes`가 deep clone으로 초기화. |
| `_selectedNodes`       | `Set<nodeid: string>` | 명시 체크된 노드. checkbox click + `setSelectedNodes` 토픽으로 갱신. cascade down으로 자손까지 add/delete. |
| `_indeterminateNodes`  | `Set<nodeid: string>` | indeterminate 노드. 매 변경마다 `_recomputeIndeterminate()`로 트리 후위 순회 재계산. |
| `_checkboxClickHandler`| function | bound handler 참조 — 컨테이너 native click delegator(checkbox 영역만 흡수). beforeDestroy에서 정확히 removeEventListener. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `treeNodes`         | `this._handleSetTreeNodes`        | 재귀 트리 `[{nodeid, label, leading?, trailing?, expanded?, hasChildren?, children?, selected?}]` — 컴포넌트가 deep clone으로 보관 + `selected:true` leaf 기준으로 두 Set 재구성 + `_recomputeIndeterminate()`. |
| `setTreeNodes`      | `this._handleSetTreeNodes`        | `treeNodes` 별칭 (lazyLoad/draggableReorder 답습 — 페이지가 둘 중 하나로 publish 가능). |
| `setSelectedNodes`  | `this._handleSetSelectedNodes`    | `{ nodeIds: string[] }` — 외부에서 명시 체크할 nodeid 배열. 컴포넌트가 `_selectedNodes`를 새 Set으로 교체 + 각 id에 cascade down 적용 + 전체 재계산 + 재렌더 + `@selectionChanged` emit. |
| `clearSelection`    | `this._handleClearSelection`      | `{}` 또는 `{ silent?: boolean }` — 두 Set 모두 clear + 재렌더. silent=false(기본) 시 `@selectionChanged { selectedIds:[], indeterminateIds:[], totalSelected:0 }` emit. |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `toggle` (ListRender) | chevron 클릭 | `@treeToggleClicked` (Standard 호환 — `{ targetInstance, event }`). 페이지가 expanded 반전 후 `setTreeNodes` 재발행. |
| click | `nodeid` (ListRender) | 노드 본체 클릭 | `@treeNodeClicked` (Standard 호환 — `{ targetInstance, event }`). |

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@nodeChecked` | checkbox click 후 cascade down 직후 1회 | `{ targetInstance, nodeid, checked: boolean, cascadedTo: [영향받은 자손 nodeid 배열 — 자기 자신 제외] }` |
| `@selectionChanged` | 매 변경 사이클 끝(클릭 / setSelectedNodes / clearSelection) 1회 | `{ targetInstance, selectedIds: [..._selectedNodes], indeterminateIds: [..._indeterminateNodes], totalSelected: _selectedNodes.size }` |

> **이벤트 분리 이유**: bindEvents 위임은 `{ targetInstance, event }`만 전달 → checked 값/cascade 결과/선택 set이 없다. checkbox는 페이지가 (a) 어떤 노드가 어떤 값으로 변경되었는지(`@nodeChecked.nodeid + checked + cascadedTo` — undo stack push), (b) 전체 선택 set 평탄 배열(`@selectionChanged.selectedIds + indeterminateIds + totalSelected` — 폼 검증/외부 sync) 두 채널을 직교로 사용. `@treeToggleClicked`/`@treeNodeClicked` bindEvents 위임은 Standard 호환 유지.

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_handleSetTreeNodes({ response })` | `({response}) => void` | `treeNodes` / `setTreeNodes` 핸들러. response가 배열이면 deep clone으로 `_currentTree` 갱신. 페이로드 `selected:true` 노드들을 `_selectedNodes`에 add(cascade down 적용 — 부모 selected:true이면 자손도 모두 add). `_recomputeIndeterminate()` → `_flatten()` → `listRender.renderData` 호출. emit 없음 (외부 publish는 silent 동기화). |
| `_handleSetSelectedNodes({ response })` | `({response}) => void` | `setSelectedNodes` 핸들러. response = `{ nodeIds: string[] }`. `_selectedNodes`를 새 Set으로 시작 → 각 id에 `_cascadeDown(id, true)` 적용(자손 자동 add) → `_recomputeIndeterminate()` → 재렌더 → `_emitSelectionChanged()`. |
| `_handleClearSelection({ response })` | `({response}) => void` | `clearSelection` 핸들러. response = `{}` 또는 `{ silent: boolean }`. 두 Set 모두 clear → 재렌더. silent=false(기본)이면 `_emitSelectionChanged()`. |
| `_handleCheckboxClick(nodeid, checked)` | `(string, boolean) => void` | checkbox click 핸들러. ① checked=true이면 `_cascadeDown(nodeid, true)`(자기 + 모든 자손 `_selectedNodes`에 add), false이면 `_cascadeDown(nodeid, false)`(자기 + 모든 자손 delete). cascade 적용 전 자손 nodeid 목록을 미리 수집(이벤트 payload용). ② `_recomputeIndeterminate()` 호출. ③ `_flatten()` → 재렌더. ④ `Weventbus.emit('@nodeChecked', { nodeid, checked, cascadedTo: [...] })` + `_emitSelectionChanged()`. |
| `_cascadeDown(nodeid, value)` | `(string, boolean) => string[]` | `_findNode`로 노드 탐색 → BFS로 자기 자신 + 모든 자손 순회 → value=true면 `_selectedNodes.add`, false면 `_selectedNodes.delete`. `_indeterminateNodes`에서도 모두 delete(cascade는 indeterminate normalize). 영향받은 자손 nodeid 배열 반환(자기 자신 제외 — `@nodeChecked.cascadedTo`용). |
| `_recomputeIndeterminate()` | `() => void` | `_currentTree` 재귀 후위 순회. 각 부모 노드에 대해 직계 자식들의 `_selectedNodes` / `_indeterminateNodes` 종합: 모두 selected & indeterminate=false → 부모 selected=true(`_selectedNodes`에 add, `_indeterminateNodes`에서 delete), 모두 unselected & indeterminate=false → 부모 selected=false(둘 다 delete), 그 외 → 부모 indeterminate=true(`_selectedNodes`에서 delete, `_indeterminateNodes`에 add). leaf 노드는 자기 cascadeDown 결과 그대로 보존. |
| `_syncTreeSelectedFromSets()` | `() => void` | `_currentTree` 재귀 순회 — 각 노드의 `selected` 필드를 `_selectedNodes` 멤버십으로 동기화. 외부에서 `setTreeNodes`로 expand 상태만 바꿔 재발행하는 시나리오에서 cascade 결과가 보존되도록 트리 진실(`selected` 필드)을 두 Set과 일치시킨다. checkbox click / setSelectedNodes / clearSelection 직후 호출. |
| `_findNode(nodes, id)` | `(Array, string) => Object\|null` | 재귀 검색으로 nodeid 매칭 노드 객체 반환 (없으면 null). |
| `_flatten(nodes, depth, out)` | `(Array, number, Array) => Array` | 재귀 트리를 visible flat 배열로 전개. 각 노드를 `{ nodeid, depth: String, expanded: String, hasChildren: String, checked: String, indeterminate: String, leading, label, trailing }`로 변환. `expanded === false`인 노드의 children은 건너뜀(visible-only 정책). `checked`/`indeterminate`는 `_selectedNodes` / `_indeterminateNodes` 멤버십 검사로 결정. |
| `_emitSelectionChanged()` | `() => void` | `Weventbus.emit('@selectionChanged', { targetInstance: this, selectedIds: [..._selectedNodes], indeterminateIds: [..._indeterminateNodes], totalSelected: _selectedNodes.size })`. |

### 페이지 연결 사례

```
[페이지 — 권한 트리 / 카테고리 트리 / 파일 트리 / 조직도 / 메일 폴더]
    │
    └─ fetchAndPublish('treeNodes', this)
        payload (재귀 트리 + 초기 selected):
        [
          { nodeid: 'electronics', leading: '📱', label: 'Electronics', expanded: true,  children: [
              { nodeid: 'phones',   leading: '📞', label: 'Phones',     expanded: true,  children: [
                  { nodeid: 'iphone', leading: '📱', label: 'iPhone',   selected: true  },
                  { nodeid: 'galaxy', leading: '📱', label: 'Galaxy',   selected: false }
              ]},
              { nodeid: 'tablets',  leading: '📋', label: 'Tablets',    expanded: false, children: [
                  { nodeid: 'ipad',   leading: '📋', label: 'iPad',     selected: true  }
              ]}
          ]},
          { nodeid: 'books',  leading: '📚', label: 'Books',      selected: false }
        ]

[Trees/Advanced/checkbox]
    ├─ _handleSetTreeNodes가 _currentTree에 deep clone으로 보관
    ├─ payload selected:true (iphone, ipad)을 _selectedNodes에 add
    ├─ _recomputeIndeterminate():
    │    phones (자식 [iphone(true), galaxy(false)]) → indeterminate
    │    tablets (자식 [ipad(true)]) → selected (cascade up: 부모 add)
    │    electronics (자식 [phones(indeterminate), tablets(true)]) → indeterminate
    ├─ _flatten() + ListRender 렌더 (모든 노드의 data-checked/data-indeterminate 표시)

[사용자가 'phones' checkbox 클릭 (현재 indeterminate 상태에서 → true로)]
    ├─ bindEvents 위임 → @treeToggleClicked / @treeNodeClicked는 발행 안 됨 (checkbox 영역)
    ├─ _handleCheckboxClick('phones', true)
    │   ├─ cascadedDescendants = _cascadeDown('phones', true)
    │   │   → _selectedNodes에 phones, iphone, galaxy 모두 add
    │   │   → 반환: ['iphone', 'galaxy']
    │   ├─ _recomputeIndeterminate():
    │   │   phones: 자식 모두 selected → selected (변동 X)
    │   │   electronics: 자식 [phones(selected), tablets(selected)] → selected (cascade up: 부모 add)
    │   ├─ _flatten() → 재렌더
    │   ├─ @nodeChecked: { nodeid: 'phones', checked: true, cascadedTo: ['iphone', 'galaxy'] }
    │   └─ @selectionChanged: { selectedIds: ['iphone','galaxy','ipad','phones','tablets','electronics'],
    │                           indeterminateIds: [], totalSelected: 6 }

[페이지가 setSelectedNodes publish — 외부 폼 저장값 복원]
    payload: { nodeIds: ['galaxy','ipad'] }
    ├─ _handleSetSelectedNodes
    │   ├─ _selectedNodes = new Set, _indeterminateNodes.clear
    │   ├─ each id: _cascadeDown(id, true) — galaxy, ipad만 add(자손 없음 — leaf)
    │   ├─ _recomputeIndeterminate():
    │   │   phones: [iphone(false), galaxy(true)] → indeterminate
    │   │   tablets: [ipad(true)] → selected
    │   │   electronics: [phones(indeterminate), tablets(selected)] → indeterminate
    │   ├─ _flatten() → 재렌더
    │   └─ @selectionChanged broadcast

[페이지가 clearSelection publish]
    payload: {}
    ├─ _handleClearSelection
    │   ├─ 두 Set 모두 clear
    │   ├─ _flatten() → 재렌더 (모두 unchecked)
    │   └─ @selectionChanged: { selectedIds: [], indeterminateIds: [], totalSelected: 0 }

운영: this.pageDataMappings = [
        { topic: 'treeNodes',        datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setSelectedNodes', datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'clearSelection',   datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@nodeChecked': ({ nodeid, checked, cascadedTo }) => {
          // undo stack에 푸시 (이전 상태 복원용)
        },
        '@selectionChanged': ({ selectedIds, indeterminateIds, totalSelected }) => {
          // 폼 검증, 외부 사이드패널 sync
        },
        '@treeToggleClicked': ({ event }) => {
          const id = event.target.closest('.tree-cb__node')?.dataset.nodeid;
          // _currentTree에서 해당 노드의 expanded를 반전한 후 setTreeNodes publish
        },
        '@treeNodeClicked': ({ event }) => {
          const id = event.target.closest('.tree-cb__node')?.dataset.nodeid;
          // 노드 상세 패널 표시
        }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | checkbox / indeterminate 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|-------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 그라디언트 fill 박스(18×18px), checked: 퍼플 grad + white SVG check, indeterminate: 가로 dash bar 2.4px purple. 8px 라운드. | **권한 트리** (admin console — 시스템 > 모듈 > 기능 > 액션 권한 일괄 부여 / 부분 권한 부여 시 상위 모듈 indeterminate dash) |
| `02_material`    | B: Material Elevated | secondary container(`#6750A4`) fill 박스(18×18px), checked: 퍼플 fill + white SVG check, indeterminate: 가로 dash bar 2px white(박스 안). elevation shadow on hover. | **카테고리 트리 다중 선택** (전자상거래 — Electronics > Phones > iPhone/Galaxy 카테고리 일괄 필터) |
| `03_editorial`   | C: Minimal Editorial | outline 1.5px(brown) box(16×16px), checked: serif `✓`(brown), indeterminate: serif `–` 14px italic. radius 2px(샤프). 정적(no anim). | **추천 카탈로그 다중** (Featured > Editor's Pick > Article — 부분 선택 시 부모 dash) |
| `04_operational` | D: Dark Operational  | 시안(`#4DD0E1`) outline 1.5px box(14×14px), checked: 시안 fill + 모노 ASCII `[X]` 대체 안 함(시안 SVG check), indeterminate: 시안 가로 dash 1.5px. 컴팩트 다크. | **파일 트리 다중 선택** (IDE Explorer — 다중 파일 일괄 선택, 폴더 부분 선택 시 폴더 dash bar) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, `[data-checked="true"]` / `[data-indeterminate="true"]` 셀렉터로 시각을 분기. indeterminate가 checked보다 시각 우선순위(CSS source order로 indeterminate가 뒤에 정의 → checked rules를 덮어씀).

### 결정사항

- **prefix `.tree-cb__*`** — Standard `.tree__*` / draggableReorder `.tree-dr__*` / lazyLoad `.tree-ll__*`와 분리(같은 페이지 공존 시 CSS 충돌 X).
- **`treeNodes` + `setTreeNodes` 별칭 동시 구독** — lazyLoad/Tabs/lazyContent 답습. 페이지가 둘 중 하나로 publish 해도 동작.
- **`_selectedNodes` + `_indeterminateNodes` 두 Set 분리** — Checkbox/nestedTree는 `Map<id, NodeState>`로 통합 관리하지만 본 변형은 ListRender 기반 + flat 전개라 두 Set이 더 단순. `_recomputeIndeterminate()` 한 번에 두 Set 모두 갱신.
- **checkbox click → `@nodeChecked` + `@selectionChanged` 두 이벤트 모두 발행** — 페이지가 (a) 단일 사실(undo stack), (b) 전체 broadcast(폼 sync) 채널을 직교로 사용.
- **`@selectionChanged.cascadedTo` 미포함** — `cascadedTo`는 단일 변경 사실이므로 `@nodeChecked` 전용. `@selectionChanged`는 매 사이클 종료 broadcast(외부 동기화 sink).
- **`_recomputeIndeterminate()` 후위 순회** — 자식 결과를 부모가 종합하므로 후위 순회 필수. 사전 순회 시 부모 갱신 후 자식 갱신이라 cascade up이 깨짐.
- **chevron click과 checkbox click 분리** — chevron(`.tree-cb__toggle`) click은 `@treeToggleClicked` (Standard 호환) bindEvents 위임만, checkbox(`.tree-cb__checkbox`) click은 native click 컨테이너 위임으로 `_handleCheckboxClick` 호출. 노드 본체 click은 `@treeNodeClicked` (Standard 호환). 세 채널이 closest로 분기되어 직교.
- **native input.indeterminate property 미사용** — ListRender renderData가 batch마다 DOM 재렌더하므로 native property는 즉시 손실. data-* 속성으로만 시각 관리(Checkbox/nestedTree 답습). a11y는 `aria-checked="true|false|mixed"` 부착.
- **새 batch 시 두 Set 재구성** — payload `selected:true`인 leaf 기준으로 `_selectedNodes`에 add + `_recomputeIndeterminate()`로 cascade up 자동 적용. 부모 노드의 `selected:true`도 cascade down 적용.
- **신규 Mixin 생성 금지** — ListRenderMixin + 자체 메서드 9종으로 완결. cascade tri-state 패턴이 Checkbox/nestedTree + 본 변형 2회 반복 — 일반화 가능성 검토 후보(반환에 메모만 — SKILL 회귀 규율).

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions / customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서 (이벤트 제거 → 구독 해제 → 자체 상태/메서드 null + listRender.destroy)
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Trees/Advanced/checkbox/preview/...html` → `../`를 5번 = lazyLoad 동일 verbatim 복사)
