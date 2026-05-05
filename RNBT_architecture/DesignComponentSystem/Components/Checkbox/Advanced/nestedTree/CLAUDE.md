# Checkbox — Advanced / nestedTree

## 기능 정의

1. **재귀 트리 체크박스 렌더** — `treeData` 토픽으로 수신한 **재귀 페이로드** (`[{id, label, selected?, children?: [...재귀]}]`)를 받아 TreeRenderMixin이 노드를 평탄 DOM(형제 요소)으로 펼쳐 렌더링한다. 각 노드는 toggle chevron(▶/▼) + 체크박스 박스 + 라벨로 구성되며, `data-depth`/`data-has-children`/`data-expanded`/`data-checked`/`data-indeterminate`가 CSS 시각 채널을 분기한다. N단계 깊이를 임의로 지원(예: 카테고리 > 서브카테고리 > 항목 > 옵션).
2. **체크 cascade down (자손 일괄 set)** — 노드 라벨/박스 클릭 시 해당 노드의 selected 토글 + **모든 자손 노드를 동일한 값으로 set**한다. 자손이 indeterminate였더라도 모두 false로 normalize. `_nodeStates: Map<id, NodeState>`가 진실 출처이며 `_cascadeDown(id, value)`이 자손 BFS 순회로 일괄 갱신.
3. **체크 cascade up (조상 재계산)** — 자손 selected가 변경되면 **모든 조상이 재계산**된다: 직계 자식이 모두 selected → 부모 checked, 모두 unselected → 부모 unchecked, 일부만 selected 또는 일부 indeterminate → 부모 indeterminate. `_cascadeUp(id)`가 부모 → 조부 → ... → 루트까지 재귀 호출. indeterminate 노드는 `data-indeterminate="true"` 부착(CSS dash mark 표시).
4. **expand/collapse 토글** — 노드의 chevron(`.tree-checkbox__toggle`) 클릭 시 해당 노드만 expand/collapse 토글한다. TreeRenderMixin의 `toggle(id)` 메서드가 자손 display 일괄 토글. 체크박스 영역 click과는 분리(chevron만 expand 트리거 — 체크박스 박스/라벨은 selected 토글만).
5. **트리 변경 이벤트** — selected 변경 시 `@treeNodeToggled` 발행. payload: `{ targetInstance, nodeId, selectedIds: [전체 selected ID 평탄 배열], indeterminateIds: [전체 indeterminate ID 평탄 배열] }`. 페이지가 이 평탄 배열로 다중 선택 적용(예: 다중 카테고리 필터 적용 / 권한 트리 일괄 적용 / 파일 트리 다중 선택 / 조직도 일괄 알림 발송).

> **Standard / indeterminate와의 분리 정당성**:
> - **새 토픽** — Standard는 `checkboxItems`(평면 배열). indeterminate는 `checkboxGroup`({parent, children}) — **2단계 고정**. nestedTree는 `treeData`(재귀 배열) — **N단계 임의 깊이**. 데이터 형태가 직교(평면 / 2층 / 재귀).
> - **새 Mixin** — Standard/indeterminate는 ListRenderMixin(평면 반복). nestedTree는 **TreeRenderMixin** (재귀 노드 렌더 + 평탄 DOM + paddingLeft 들여쓰기 + expand/collapse). Mixin 자체가 다름 = register.js 자체가 다름.
> - **자체 상태 (`_nodeStates: Map<id, {selected, indeterminate, expanded, parent, children}>`)** — indeterminate는 `_childrenStates: Map<id, boolean>`(2단계 — 자식만). nestedTree는 모든 노드를 단일 Map에 보관하고 parent/children 그래프를 함께 관리해야 cascade up/down 재귀가 가능. 그래프 구조 자체가 다름.
> - **자체 메서드 5종** — `_buildNodeStates`, `_cascadeDown`, `_cascadeUp`, `_applyNodeStateToDom`, `_handleNodeToggle`(체크박스 click), `_handleExpandToggle`(chevron click), `_emitChange`. cascade 알고리즘이 재귀(BFS down + 부모 chain up). indeterminate의 `_recomputeParentState`는 단일 자식 그룹만 처리.
> - **새 이벤트** — `@treeNodeToggled`(평탄 selectedIds + indeterminateIds 배열). indeterminate의 `@checkboxGroupChanged`는 parentState + childrenIds(단일 그룹 단위). 페이로드 의미가 다름(트리 전체 평탄 vs 단일 부모 그룹).
> - **HTML 구조 변경** — Standard/indeterminate는 `.checkbox__list` / `.checkbox-group__children` 단일 평면 컨테이너 + N개 형제. nestedTree는 `.tree-checkbox__list` 단일 컨테이너에 모든 노드를 평탄 형제로 배치하되 paddingLeft + chevron으로 시각 계층(TreeRenderMixin 표준).
>
> 위 6축은 동일 register.js로 표현 불가 → indeterminate variant로 흡수 불가.

> **indeterminate / SegmentedButtons/multiSelect / Cards/Advanced/selectable 차용 + 차이**:
> - indeterminate에서 차용: tri-state 시각(checked/unchecked/indeterminate), `data-checked` + `data-indeterminate` 이중 채널, native input.indeterminate property 동기화 X(트리 노드는 native input 없이 SVG 마크만 — 체크 SVG + dash SVG 두 채널 CSS 분기).
> - 차이: indeterminate는 2층 고정(parent, children). nestedTree는 N층 재귀. cascade up이 단일 부모 재계산이 아니라 **루트까지 재귀 chain**.
> - SegmentedButtons/multiSelect 차용: `_selectedIds: Set` 패턴 → nestedTree는 `_nodeStates: Map<id, state>`로 확장(state에 selected + indeterminate + expanded + parent + children 모두 보관 — 평탄 Set으로는 그래프 표현 불가).
> - Cards/Advanced/selectable 차용: 명시 emit 패턴, group dataset 패턴.

> **MD3 / 도메인 근거**: MD3 Checkbox indeterminate 정의는 부모-자식 단일 단계만 명시하지만, 실사용에서는 다단계 트리 cascade가 흔하다 — ① 다중 카테고리 필터(Electronics > Phones > Smartphones / Tablets / 각 모델), ② 권한 트리(전체 시스템 > 모듈 > 기능 > 액션), ③ 파일 트리(루트 > 폴더 > 서브폴더 > 파일), ④ 조직도(회사 > 본부 > 팀 > 멤버 — 부분 알림), ⑤ 카탈로그 다중 선택(부서 > 그룹 > 항목). HTML5 `<input type="checkbox">.indeterminate` DOM property는 본 변형에서 native input을 사용하지 않으므로 채택하지 않으며, 대신 `data-indeterminate="true"` + CSS dash SVG로 시각 채널을 보장한다 (a11y는 `role="treeitem"` + `aria-checked="true|false|mixed"`로 계층 시맨틱 표현).

---

## 구현 명세

### Mixin

**TreeRenderMixin** (재귀 노드 렌더 + 평탄 DOM + paddingLeft 들여쓰기 + expand/collapse) + 자체 메서드(`_buildNodeStates` / `_cascadeDown` / `_cascadeUp` / `_applyNodeStateToDom` / `_handleNodeToggle` / `_handleExpandToggle` / `_renderTree` / `_emitChange`).

> **TreeRenderMixin 채택 이유**: Mixin 카탈로그(`Mixins/README.md`)에 "재귀 배열 → 트리 → TreeRenderMixin → Trees" 매핑이 이미 존재한다. 본 변형은 큐 메모와 달리 신규 Mixin을 만들지 않고 TreeRenderMixin을 사용한다 (`/.claude/skills/0-produce/produce-component/SKILL.md` Step 3-1 — "기존 Mixin으로 부족한 패턴이어도 본 루프에서는 커스텀 메서드로 해결"). cascade 로직(체크 down/up + selected/indeterminate 상태 그래프)은 자체 메서드로 흡수.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container       | `.tree-checkbox__list`            | 노드가 추가될 부모 (TreeRenderMixin 규약) |
| template        | `#tree-checkbox-node-template`    | cloneNode 대상 (TreeRenderMixin 규약) |
| node            | `.tree-checkbox__node`            | 각 노드의 root — `data-node-id`/`data-depth`/`data-has-children`/`data-expanded`/`data-checked`/`data-indeterminate` 부착 (TreeRenderMixin 규약) |
| toggle          | `.tree-checkbox__toggle`          | chevron 영역 — expand/collapse 클릭 이벤트 매핑 (사용자 정의 KEY) |
| label           | `.tree-checkbox__label`           | 노드 라벨 텍스트 |

> **체크 SVG / dash SVG / chevron 처리**: `.tree-checkbox__check-mark`(체크 SVG)와 `.tree-checkbox__dash-mark`(dash SVG), `.tree-checkbox__chevron`(▶/▼ 시각 회전)은 template 내부에 고정 존재하며 `data-checked` / `data-indeterminate` / `data-expanded` 값에 따라 CSS로만 표시를 제어한다. cssSelectors KEY로 등록하지 않는다 (데이터 바인딩 대상이 아니므로).

### datasetAttrs

비어있음. checked/indeterminate/expanded는 자체 메서드 `_applyNodeStateToDom`이 cascade 결과를 dataset에 일괄 적용. TreeRenderMixin이 자동 부여하는 `data-node-id` / `data-depth` / `data-has-children` / `data-expanded` 외 추가 dataset은 자체 메서드 책임.

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_nodeStates` | `Map<id, NodeState>` | 모든 노드의 selected/indeterminate/expanded/parent/children 통합 진실 출처. `NodeState = { selected: boolean, indeterminate: boolean, expanded: boolean, parent: id|null, children: id[] }`. `_buildNodeStates`가 페이로드로부터 그래프 구축. |
| `_treeClickHandler` | function | bound handler 참조. 컨테이너 단일 native click delegator로 chevron(toggle) 영역 vs 노드 본체(label/box) 영역을 closest로 분기. beforeDestroy에서 정확히 removeEventListener 하기 위해 보관. |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| `treeData` | `this._renderTree` (재귀 페이로드 `[{id, label, selected?, children?: [...]}]`) — 내부에서 ① TreeRenderMixin.renderData 호출(시각 트리 펼침) + ② `_buildNodeStates` 호출(그래프 구축 + 초기 indeterminate 일괄 재계산) + ③ `_applyNodeStateToDom`(모든 dataset 일괄 적용) |

### 이벤트 (customEvents)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload 채널 |
|--------|------------------|-----------|-------------|
| click | `toggle` | chevron 클릭 (expand/collapse) | (없음 — 자체 native delegator가 `treeRender.toggle(id)` 호출 + sideeffect만) |
| click | `node` | 노드 본체 클릭 (label/box) — selected 토글 | `@treeNodeToggled` (bindEvents 위임 발행 — Weventbus 채널 등록 보장 의미) |

> **이벤트 발행 분리 이유**: register.js가 컨테이너 단일 native click delegator로 chevron click vs node body click을 분리 처리한다. chevron click은 expand/collapse만(상태 변경 없음). node body click은 cascade down/up + `_nodeStates` 갱신 + DOM dataset 갱신 사이드이펙트를 함께 수행하고, `Weventbus.emit('@treeNodeToggled', { targetInstance, nodeId, selectedIds, indeterminateIds })`을 직접 호출하여 명시 페이로드 발행. 페이지는 평탄 selectedIds + indeterminateIds 배열로 트리 전체 상태를 한 번에 수신.

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderTree({ response })` | `treeData` 핸들러. ① `treeRender.renderData({ response })` 호출하여 재귀 페이로드를 평탄 DOM으로 렌더(TreeRenderMixin이 자동 paddingLeft/data-depth/data-has-children/data-expanded 부여). ② `_buildNodeStates(data)` 호출하여 `_nodeStates: Map` 그래프 재구성(새 batch는 새 진실). ③ 페이로드 `selected:true` 노드들을 cascade up — 각 leaf selected를 따라 `_cascadeUp` 호출하여 조상 indeterminate 종합. ④ `_applyNodeStateToDom()` 호출하여 모든 dataset 일괄 적용. emit 없음(외부 publish는 silent 동기화). |
| `_buildNodeStates(data)` | 재귀 페이로드를 순회하면서 `_nodeStates: Map<id, {selected, indeterminate, expanded, parent, children}>` 재구성. parent → children 양방향 그래프 구축. 초기 selected는 페이로드 `selected:true`. expanded는 TreeRenderMixin이 자동 부여(자식 있으면 true). indeterminate는 일단 false로 초기화 후 `_cascadeUp(leafId)`로 leaf selected 기준 재계산. |
| `_cascadeDown(id, value)` | 노드 id와 그 모든 자손을 `selected = value`로 set + `indeterminate = false`로 normalize. `_nodeStates`에서 BFS 순회. DOM 적용은 호출자가 `_applyNodeStateToDom`로 통합 처리. |
| `_cascadeUp(id)` | 노드 id의 부모 → 조부 → ... → 루트까지 재계산. 각 단계: 직계 자식들의 selected/indeterminate 종합 → ① 모두 selected & indeterminate=false → 부모 selected=true, indeterminate=false ② 모두 unselected & indeterminate=false → 부모 selected=false, indeterminate=false ③ 그 외(일부 selected 또는 일부 indeterminate) → 부모 selected=false, indeterminate=true. 부모가 갱신되면 그 조부로 재귀. |
| `_applyNodeStateToDom()` | `_nodeStates` 전체를 순회하면서 각 노드 DOM에 `data-checked` / `data-indeterminate` 일괄 적용. `data-expanded`는 TreeRenderMixin이 자기 책임(toggle/expand/collapse)이므로 건드리지 않음. ARIA: 각 노드에 `aria-checked="true|false|mixed"` 적용. |
| `_handleNodeToggle(e)` | 노드 본체(`.tree-checkbox__node`) 클릭 핸들러. ① closest(node) → dataset.nodeId 추출 ② `_nodeStates`에서 현재 selected 조회 ③ `_cascadeDown(id, !current)` 호출 ④ `_cascadeUp(id)` 호출 ⑤ `_applyNodeStateToDom()` ⑥ `_emitChange(id)`. |
| `_handleExpandToggle(e)` | chevron(`.tree-checkbox__toggle`) 클릭 핸들러. ① closest(node) → dataset.nodeId 추출 ② `treeRender.toggle(id)` 호출(TreeRenderMixin이 자손 display 일괄 토글 + data-expanded 반전) ③ `_nodeStates`의 expanded 값도 동기화. emit 없음. |
| `_handleTreeClick(e)` | 컨테이너 단일 native click delegator. chevron 영역이 더 안쪽이므로 `closest(toggle)` 먼저 검사 → `_handleExpandToggle` 위임. 아니면 `closest(node)` 검사 → `_handleNodeToggle` 위임. |
| `_emitChange(nodeId)` | `@treeNodeToggled` 발행. payload: `{ targetInstance: this, nodeId, selectedIds: [..._nodeStates에서 selected=true인 모든 id], indeterminateIds: [..._nodeStates에서 indeterminate=true인 모든 id] }`. |

### 페이지 연결 사례

```
[페이지 — 다중 카테고리 필터 / 권한 트리 / 파일 트리 / 조직도]
    │
    └─ fetchAndPublish('treeData', this) 또는 직접 publish
        payload 예: [
          { id: 'electronics', label: 'Electronics',
            children: [
              { id: 'phones', label: 'Phones',
                children: [
                  { id: 'iphone',  label: 'iPhone',  selected: true  },
                  { id: 'galaxy',  label: 'Galaxy',  selected: false }
                ]},
              { id: 'tablets', label: 'Tablets',
                children: [
                  { id: 'ipad',    label: 'iPad',    selected: true  }
                ]}
            ]},
          { id: 'books', label: 'Books', selected: false }
        ]

[Checkbox/Advanced/nestedTree]
    ├─ _renderTree → treeRender.renderData → 평탄 DOM 펼침
    ├─ _buildNodeStates → _nodeStates Map 그래프 구축
    │   electronics → children [phones, tablets], parent: null
    │   phones      → children [iphone, galaxy], parent: electronics
    │   iphone      → children [], parent: phones, selected: true
    │   ...
    ├─ _cascadeUp(iphone) + _cascadeUp(ipad) (leaf selected들 기준)
    │   phones: 자식 [iphone(true), galaxy(false)] → indeterminate
    │   tablets: 자식 [ipad(true)] → selected
    │   electronics: 자식 [phones(indeterminate), tablets(selected)] → indeterminate
    ├─ _applyNodeStateToDom — 모든 노드 dataset.checked/indeterminate 적용

[사용자가 'phones' 노드 클릭 (현재 indeterminate)]
    ├─ _handleNodeToggle → cascadeDown(phones, true) — phones, iphone, galaxy 모두 true
    ├─ _cascadeUp(phones) → electronics 재계산 (phones=true, tablets=true) → selected
    ├─ _applyNodeStateToDom
    └─ @treeNodeToggled: { nodeId: 'phones',
                          selectedIds: ['iphone', 'galaxy', 'phones', 'ipad', 'tablets', 'electronics'],
                          indeterminateIds: [] }

[사용자가 'galaxy' chevron이 아닌 노드 본체 클릭 (현재 true)]
    ├─ _handleNodeToggle → cascadeDown(galaxy, false) — galaxy false
    ├─ _cascadeUp(galaxy) → phones (자식 [iphone(true), galaxy(false)]) → indeterminate
    │                     electronics (자식 [phones(indeterminate), tablets(selected)]) → indeterminate
    └─ @treeNodeToggled: { nodeId: 'galaxy',
                          selectedIds: ['iphone', 'phones'? — phones는 indeterminate],
                          indeterminateIds: ['phones', 'electronics'] }

운영: this.pageDataMappings = [
        { topic: 'treeData', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@treeNodeToggled': ({ nodeId, selectedIds, indeterminateIds }) => {
          // selectedIds 기준 다중 카테고리 필터 적용 / 권한 트리 일괄 / 파일 트리 다중 선택
        }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | nestedTree 시각 차별화 (재귀 cascade tri-state) | 도메인 컨텍스트 예 |
|------|---------|--------------------------------------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 그라디언트 fill, **tree connector line**(점선 vertical/horizontal connector로 노드 계층을 시각화 — depth마다 부모로 향하는 점선 leader). chevron은 회전(▶ → ▼). indeterminate는 가로 dash bar(2.4px purple). Pretendard. | 다중 카테고리 필터(Electronics > Phones > iPhone/Galaxy + Tablets > iPad) — 부분 선택 시 부모 indeterminate cascade |
| `02_material`    | B: Material Elevated | secondary container `#1A73E8` fill, **level indicator**(노드 좌측 vertical bar 색상이 depth마다 다른 tone — 0:진한 블루, 1:중간 블루, 2:연한 블루). 카드 elevation. chevron은 Material chevron_right → expand_more. Roboto. | 권한 트리(System > Module > Feature > Action) — 부분 권한 부여 시 상위 모듈 indeterminate |
| `03_editorial`   | C: Minimal Editorial | outline 1.5px(thicker) box + serif 라벨, **3D depth count badge**가 노드 우측에 미세 표시(depth=2 → ".. .."). chevron은 simple `→` / `↓` 화살표. indeterminate는 1.6px serif 느낌 dash. 1px ECE6DC bottom border. Georgia. | 추천 카탈로그(Featured > Editor's Pick > Article — 부분 선택 시 부모 dash) |
| `04_operational` | D: Dark Operational  | 시안(`#00BCD4`) box + dash, **트리 depth 카운트** 우측 미니 라벨(`L0`/`L1`/`L2`/`L3` 모노 폰트). chevron은 `[+]` / `[-]` 모노 ASCII. 컴팩트 다크 +`data-indeterminate="true"` 노드에 시안 dash bar. JetBrains Mono. | 파일 트리(Root > Folder > SubFolder > File — 다중 파일 일괄 선택, 부분 선택 시 폴더 dash) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, `[data-checked="true|false"]` + `[data-indeterminate="true"]` 셀렉터로 시각을 분기. depth는 TreeRenderMixin이 자동 부여한 `paddingLeft = depth * 20px`을 그대로 활용하거나 CSS로 재정의(페르소나별 들여쓰기 스타일).

### 결정사항

- **TreeRenderMixin 채택 (큐 메모 무시 — TreeCheckboxMixin 신규 생성 금지)**: Mixin 카탈로그에 TreeRenderMixin이 이미 존재. produce-component SKILL Step 3-1은 신규 Mixin 생성을 본 루프 대상으로 보지 않음. cascade 로직만 자체 메서드(`_cascadeDown`/`_cascadeUp`)로 추가.
- **tri-state 시각 (데이터 채널 분리)**: `data-checked="true|false"`(자기 자신 selected) + `data-indeterminate="true"`(자손이 부분 selected). 두 속성 직교(checked=true이면 indeterminate=false 보장). CSS는 `[data-indeterminate="true"]`이 `[data-checked]`을 덮어쓰는 우선순위로 dash 표시.
- **expand/collapse는 click 분리**: chevron(`.tree-checkbox__toggle`) click만 expand 트리거, 노드 본체(label/box) click은 selected 토글. 컨테이너 단일 native click delegator가 `closest(toggle)` 우선 검사로 분기. cascade 로직과 expand 로직이 의미적으로 직교.
- **페이로드 새 batch는 새 진실**: 새 `treeData` 페이로드 도착 시 `_nodeStates: Map`은 페이로드 기반으로 통째 재구성(이전 cascade 결과 누적 X).
- **a11y**: 각 노드 root에 `role="treeitem"` + `aria-checked="true|false|mixed"`. 컨테이너에 `role="tree"`. 키보드 내비게이션은 본 변형 범위 외(향후 확장 시 별도).
- **자손 0개 노드**: leaf 노드는 `data-has-children="false"` → chevron CSS visibility hidden. cascade down/up 모두 적용 가능(leaf의 cascadeDown은 자기 자신만 갱신).
