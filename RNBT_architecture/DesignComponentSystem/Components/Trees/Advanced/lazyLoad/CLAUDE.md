# Trees — Advanced / lazyLoad

## 기능 정의

1. **트리 노드 동적 렌더 (재귀 입력 → flat 전개)** — `treeNodes` / `setTreeNodes` 토픽으로 수신한 **재귀 트리**(`[{nodeid, label, leading?, trailing?, expanded?, hasChildren?, children?, loading?}]`)를 컴포넌트가 자체 보유한 `_currentTree`에 deep clone으로 보관하고, `_flatten()`으로 visible 노드만 flat 배열로 전개해 ListRenderMixin이 `<template>` cloneNode로 N개 row로 렌더한다. 각 노드는 `data-nodeid`/`data-depth`/`data-expanded`/`data-has-children`/`data-selected`/`data-loading`로 식별·표시되어 CSS가 들여쓰기·chevron 회전·자식 숨김·선택·로딩 spinner를 제어. cssSelectors KEY는 Standard 호환(`leading`/`label`/`trailing`)이며, 추가로 본 변형 전용 `nodeid`/`loading`/`spinner` KEY를 등록한다.
2. **lazy load — 자식 노드 동적 fetch** — chevron(toggle) 클릭 시 expand 트리거. `_handleToggle(nodeid)`가:
   - **이미 펼쳐진 상태(expanded=true)** → collapse(expanded=false)로 토글, 자식은 메모리에 보존(재방문 시 즉시 표시).
   - **접혀 있고 캐시 hit(`_childrenLoaded.has(nodeid) === true`)** → 즉시 expand(expanded=true) + 재렌더 + `@nodeExpanded { nodeid, cached:true }` 발행.
   - **접혀 있고 캐시 미존재(`_childrenLoaded.has(nodeid) === false` + `hasChildren=true`)** → loading 상태(`_setLoading(nodeid, true)` → `data-loading="true"`) + `@childrenRequested { nodeid }` 1회 발행 → 페이지가 fetch → `setNodeChildren { nodeid, children }` 토픽으로 응답.
3. **자식 응답 수신 — `setNodeChildren`** — 페이지가 `setNodeChildren` 토픽으로 `{ nodeid, children: [...] }` 발행 → `_handleSetNodeChildren` 핸들러가:
   - `_findNode(_currentTree, nodeid)` 로 부모 노드 탐색 → `parent.children = children` (또는 빈 배열) → `parent.expanded = true` → `parent.loading = false` → `_childrenLoaded.add(nodeid)` 캐시.
   - `_flatten()` → ListRender 재렌더.
   - `@childrenLoaded { nodeid, count }` 발행.
4. **캐시 무효화 — `clearNodeChildren`** — 페이지가 `clearNodeChildren` 토픽으로 `{ nodeid }` 또는 `{ all: true }` 발행 → `_handleClearNodeChildren` 핸들러가 캐시 set에서 제거 + 해당 노드의 `children = []` + `expanded = false`로 복귀(refresh 시나리오). 다음 expand 시 `@childrenRequested` 재발행.
5. **노드 선택 (Standard 호환)** — 노드 본체 클릭 시 `@treeNodeClicked` 발행(bindEvents 위임). chevron 클릭은 별도 매핑 — `@treeToggleClicked` 발행 + 컴포넌트 내부에서 `_handleToggle`도 호출(lazy 트리거). 페이지는 `@treeNodeClicked`로 상세 패널 표시 등 후속 액션. (Standard 와 동일 이벤트 이름 유지.)
6. **인스턴스 자체 트리 상태 + 캐시 보관** — `_currentTree: TreeNode[]` (재귀 구조) 자체 상태로 트리 진실 보관. `_childrenLoaded: Set<nodeid>`로 lazy 캐시 추적. `_handleSetTreeNodes`가 `treeNodes` payload 수신 시 deep clone으로 보관 + 캐시 reset, `_handleSetNodeChildren`이 children 주입 + 캐시 추가, `_handleClearNodeChildren`이 캐시 무효화. 새 batch가 들어오면 새 진실로 교체(이전 누적 X) + 캐시 clear.

> **Standard와의 분리 정당성**:
> - **자체 상태 (`_currentTree` 재귀 + `_childrenLoaded` Set)** — Standard는 stateless(페이지가 flatten 후 publish). lazyLoad는 트리 진실 + lazy 캐시를 컴포넌트로 흡수.
> - **자체 메서드 9종** — `_handleSetTreeNodes`, `_handleSetNodeChildren`, `_handleClearNodeChildren`, `_handleToggle`, `_findNode`, `_flatten`, `_setLoading`, `_emitChildrenRequested`, `_emitChildrenLoaded`. Standard는 자체 메서드 0종.
> - **새 토픽 3종** — `setNodeChildren`(lazy 응답), `clearNodeChildren`(캐시 무효화), `setTreeNodes`(treeNodes 별칭). Standard는 `treeNodes` 1종만.
> - **새 이벤트 3종** — `@childrenRequested`(lazy fetch 트리거), `@childrenLoaded`(응답 적용 완료), `@nodeExpanded`(expand 시점 — `cached` 동반)/`@nodeCollapsed`. `@treeToggleClicked`/`@treeNodeClicked`는 Standard 호환 유지.
> - **HTML 구조 변경** — Standard 노드 `<div class="tree__node">`. lazyLoad는 `<div class="tree-ll__node">`로 prefix 분리(Standard `tree__*`/draggableReorder `tree-dr__*`와 충돌 방지). loading spinner 영역 `.tree-ll__spinner` 추가 + `data-loading` 속성으로 시각 제어.
> - **재귀 데이터 입력** — Standard `treeNodes` payload는 flat 배열(visible only). lazyLoad는 재귀 트리(루트만 + hasChildren flag) — 컴포넌트가 expanded/visible/lazy를 자체 결정.
>
> 위 6축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.

> **Trees/Advanced/draggableReorder 답습 + Tabs/Advanced/lazyContent 답습**:
> - draggableReorder의 패턴 차용: `_currentTree` 재귀 자체 보유 + `_flatten()` visible-only 전개 + ListRender flat 렌더 + Standard cssSelectors KEY 호환(leading/label/trailing) + `tree-ll__*` prefix 분리.
> - lazyContent의 패턴 차용: lazy + cache(Set) + `@contentRequested` → fetch → `setTabContent` 응답 → `@contentRendered` 패턴을 nodeid 단위로 구체화. `_contentLoaded: Map<tabid, content>` 대신 `_childrenLoaded: Set<nodeid>` (children은 트리 안에 있으므로 별도 cache value 불필요 — has만 검사). `@childrenRequested`/`@childrenLoaded`/`@nodeExpanded`/`@nodeCollapsed` 명시 payload + `setNodeChildren`/`clearNodeChildren` 토픽.

> **MD3 / 도메인 근거**: Trees는 MD3 공식 범주가 아니지만 hierarchical data lazy load는 모든 IDE/파일 시스템/조직도/관리 콘솔의 표준 패턴. 실사용: ① **파일 시스템 트리** (VS Code Explorer, OS 파일 매니저 — 폴더 expand 시 자식 fetch), ② **조직도 부서 expand** (HR 시스템 — 대규모 조직 lazy 로드), ③ **카테고리 트리 N차** (전자상거래 — 카테고리 → 서브 카테고리 lazy fetch), ④ **DB 스키마 explorer** (DB 관리 도구 — schema → table → column lazy expand), ⑤ **클라우드 리소스 트리** (AWS Console — Region → Service → Resource lazy fetch). 초기 페이로드 최소화 + 사용자가 실제로 펼친 가지만 전송.

---

## 구현 명세

### Mixin

ListRenderMixin (flat 배열 렌더 + datasetAttrs로 depth/상태/loading 반영) + 자체 메서드 9종(`_handleSetTreeNodes` / `_handleSetNodeChildren` / `_handleClearNodeChildren` / `_handleToggle` / `_findNode` / `_flatten` / `_setLoading` / `_emitChildrenRequested` / `_emitChildrenLoaded`).

> draggableReorder도 ListRenderMixin을 사용하지만, 본 변형은 ① `_currentTree`(재귀) + `_childrenLoaded`(Set) 자체 상태로 트리 진실 + lazy 캐시 보관, ② chevron click → `_handleToggle` → lazy 분기(즉시 expand / 캐시 hit / fetch 트리거), ③ `setNodeChildren` 응답 수신 시 트리 mutate + 재렌더 + emit, ④ `clearNodeChildren`로 refresh. Mixin 메서드 재정의는 하지 않음. 신규 Mixin 생성은 본 SKILL의 대상이 아님 — 자체 메서드로 완결.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| group       | `.tree-ll`                       | 그룹 컨테이너 — `role="tree"` |
| container   | `.tree-ll__list`                 | 노드가 추가될 부모 (ListRenderMixin 규약) |
| template    | `#tree-ll-node-template`         | `<template>` cloneNode 대상 (ListRenderMixin 규약) |
| nodeid      | `.tree-ll__node`                 | 렌더된 각 row 루트 — ListRender가 `data-nodeid` 자동 설정. 노드 본체 클릭 이벤트 매핑. |
| depth       | `.tree-ll__node`                 | 들여쓰기 단계 (data-depth) |
| expanded    | `.tree-ll__node`                 | 펼침 상태 (data-expanded) |
| hasChildren | `.tree-ll__node`                 | 자식 존재 여부 (data-has-children) |
| selected    | `.tree-ll__node`                 | 선택 상태 (data-selected) |
| loading     | `.tree-ll__node`                 | 로딩 상태 (data-loading — lazy fetch 진행 중 spinner 노출) |
| toggle      | `.tree-ll__toggle`               | chevron 토글 영역 (클릭 이벤트 매핑) |
| spinner     | `.tree-ll__spinner`              | 로딩 spinner / "Loading..." 표시 (data-loading="true"일 때 노출) |
| leading     | `.tree-ll__leading`              | 선행 아이콘/이모지 (Standard 호환 KEY) |
| label       | `.tree-ll__label`                | 노드 레이블 (Standard 호환 KEY) |
| trailing    | `.tree-ll__trailing`             | 후행 배지/수량 (Standard 호환 KEY) |

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| nodeid      | `nodeid`       | 노드 식별 — `event.target.closest('.tree-ll__node')?.dataset.nodeid`로 nodeid 추출 |
| depth       | `depth`        | 들여쓰기 |
| expanded    | `expanded`     | 펼침 상태 |
| hasChildren | `has-children` | 자식 존재 여부 |
| selected    | `selected`     | 선택 강조 |
| loading     | `loading`      | 로딩 상태(spinner 표시) |

### itemKey

`nodeid` (ListRender) — ListRender의 항목 식별 키.

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_currentTree`    | `TreeNode[]` (재귀) | 현재 트리 진실. 노드 = `{ nodeid, label, leading?, trailing?, expanded?, hasChildren?, selected?, loading?, children? }`. `_handleSetTreeNodes`가 deep clone으로 초기화, `_handleSetNodeChildren`이 children 주입, `_handleClearNodeChildren`이 캐시 무효화. |
| `_childrenLoaded` | `Set<nodeid: string>` | lazy 로드 캐시. chevron expand 시 has 검사로 fetch 결정. `_handleSetNodeChildren`이 add, `_handleClearNodeChildren`이 delete/clear. 새 batch 시 `_handleSetTreeNodes`가 clear. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `treeNodes`         | `this._handleSetTreeNodes`      | 재귀 트리 `[{nodeid, label, leading?, trailing?, expanded?, hasChildren?, children?}]` — 컴포넌트가 deep clone으로 보관. 초기 트리 = 루트만 + hasChildren flag. |
| `setTreeNodes`      | `this._handleSetTreeNodes`      | `treeNodes` 별칭 (다른 Advanced 변형 답습) |
| `setNodeChildren`   | `this._handleSetNodeChildren`   | `{ nodeid, children: [...] }` — lazy 응답. 매칭 부모 노드의 `children` 채움 + `_childrenLoaded.add(nodeid)` + 재렌더 + `@childrenLoaded` emit. |
| `clearNodeChildren` | `this._handleClearNodeChildren` | `{ nodeid }` 또는 `{ all: true }` — 캐시 무효화. 단일: 해당 노드 children=[] + collapse + cache delete. all: 모든 노드 collapse + cache clear. |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `toggle` (ListRender) | chevron 클릭 | `@treeToggleClicked` (Standard 호환 — `{ targetInstance, event }`). 추가로 컴포넌트 내부에서 `_handleToggle` 호출. |
| click | `nodeid` (ListRender) | 노드 본체 클릭 | `@treeNodeClicked` (Standard 호환 — `{ targetInstance, event }`). |

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@childrenRequested` | `_handleToggle`이 캐시 미존재 + hasChildren=true 결정 시 1회 | `{ targetInstance, nodeid }` |
| `@childrenLoaded`    | `_handleSetNodeChildren`이 children 주입 + 캐시 추가 직후 1회 | `{ targetInstance, nodeid, count }` |
| `@nodeExpanded`      | `_handleToggle`이 expand 사이클 끝(즉시 또는 캐시 hit) | `{ targetInstance, nodeid, cached: boolean }` |
| `@nodeCollapsed`     | `_handleToggle`이 collapse 사이클 끝 | `{ targetInstance, nodeid }` |

> **이벤트 분리 이유**: bindEvents 위임은 `{ targetInstance, event }`만 전달 → nodeid가 없다. lazyLoad는 페이지가 (a) 어떤 노드의 자식을 fetch 해야 하는지 즉시 알아야 하고(`@childrenRequested.nodeid`), (b) 응답이 적용되었음을 확인해야 하며(`@childrenLoaded.nodeid` — 분석 트래킹/스피너 종료), (c) expand/collapse가 캐시 hit였는지 알면 lazy 비율 계산 가능(`@nodeExpanded.cached`). 명시 payload 채택. `@treeToggleClicked`/`@treeNodeClicked` 위임 발행은 Standard 호환 + 사용자 액션 채널로 분리.

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_handleSetTreeNodes({ response })` | `({response}) => void` | `treeNodes` / `setTreeNodes` 핸들러. response가 배열이면 deep clone으로 `_currentTree` 갱신, `_childrenLoaded.clear()`(새 batch는 새 캐시 시작), `_flatten()` 후 `listRender.renderData` 호출. |
| `_handleSetNodeChildren({ response })` | `({response}) => void` | `setNodeChildren` 핸들러. response = `{ nodeid, children }`. `_findNode(_currentTree, nodeid)`로 부모 탐색 → `parent.children = children` (배열 보장) → `parent.expanded = true` → `parent.loading = false` → `_childrenLoaded.add(nodeid)`. `_flatten()` → 재렌더 → `@childrenLoaded { nodeid, count }` emit. |
| `_handleClearNodeChildren({ response })` | `({response}) => void` | `clearNodeChildren` 핸들러. response = `{ nodeid }` 또는 `{ all: true }`. 단일: `_childrenLoaded.delete(nodeid)` + 해당 노드 `children=[]` + `expanded=false`. all: `_childrenLoaded.clear()` + 모든 노드 재귀 순회하여 `children=[]` + `expanded=false`. `_flatten()` → 재렌더. emit 없음(silent). 다음 expand 시 재요청. |
| `_handleToggle(nodeid)` | `(string) => void` | chevron click 또는 외부 진입점. `_findNode`로 노드 탐색 후 분기: (a) 이미 expanded=true → expanded=false + 재렌더 + `@nodeCollapsed` emit. (b) hasChildren=false → no-op. (c) 캐시 hit (`_childrenLoaded.has`) → expanded=true + 재렌더 + `@nodeExpanded { cached:true }`. (d) 캐시 미존재 + hasChildren=true → `_setLoading(nodeid, true)` + 재렌더 + `@childrenRequested { nodeid }` emit. |
| `_findNode(nodes, id)` | `(Array, string) => Object\|null` | 재귀 검색으로 nodeid 매칭 노드 객체 반환 (없으면 null). |
| `_flatten(nodes, depth, out)` | `(Array, number, Array) => Array` | 재귀 트리를 visible flat 배열로 전개. 각 노드를 `{ nodeid, depth: String, expanded: String, hasChildren: String, selected: String, loading: String, leading, label, trailing }`로 변환. `expanded === false`인 노드의 children은 건너뜀. `hasChildren`은 `Array.isArray(children) && children.length > 0` OR 명시적 `node.hasChildren === true` (lazy 미로드 + flag만 있는 경우). |
| `_setLoading(nodeid, on)` | `(string, boolean) => void` | `_findNode`로 노드 탐색 후 `node.loading = on`. `_flatten()` 후 재렌더(spinner 노출/숨김). |
| `_emitChildrenRequested(nodeid)` | `(string) => void` | `Weventbus.emit('@childrenRequested', { targetInstance: this, nodeid })`. |
| `_emitChildrenLoaded(nodeid, count)` | `(string, number) => void` | `Weventbus.emit('@childrenLoaded', { targetInstance: this, nodeid, count })`. |

### 페이지 연결 사례

```
[페이지 — 파일 시스템 / 조직도 / 카테고리 트리 / DB 스키마]
    │
    └─ fetchAndPublish('treeNodes', this) — 초기 트리 (루트만 + hasChildren flag)
        payload: [
          { nodeid: 'src',     leading: '📁', label: 'src',     hasChildren: true  },
          { nodeid: 'tests',   leading: '📁', label: 'tests',   hasChildren: true  },
          { nodeid: 'package', leading: '📦', label: 'package', hasChildren: false, trailing: 'json' }
        ]

[Trees/Advanced/lazyLoad]
    ├─ _handleSetTreeNodes가 _currentTree에 deep clone으로 보관 + _childrenLoaded.clear()
    ├─ _flatten()이 visible 노드만 flat 배열로 전개 (모두 expanded:false → 루트만 표시)
    ├─ ListRender가 flat 배열을 row로 렌더 (각 row에 chevron + leading + label)
    └─ 각 row의 data-depth/data-expanded/data-has-children/data-loading가 CSS에서 시각화

[사용자가 'src' chevron 클릭 — 캐시 미존재]
    ├─ bindEvents 위임 → @treeToggleClicked emit (Standard 호환)
    ├─ _handleToggle('src') 호출
    ├─ src.expanded=false + _childrenLoaded.has('src')=false + hasChildren=true
    ├─ _setLoading('src', true) → src.loading=true → 재렌더 (src row에 spinner)
    └─ @childrenRequested { nodeid:'src' } emit

[페이지가 fetch 후 publish('setNodeChildren', { nodeid:'src', children:[...] })]
    payload: { nodeid: 'src', children: [
        { nodeid: 'app',     leading: '📁', label: 'app',     hasChildren: true  },
        { nodeid: 'lib',     leading: '📁', label: 'lib',     hasChildren: true  },
        { nodeid: 'main.js', leading: '📄', label: 'main.js', hasChildren: false, trailing: '14kB' }
    ]}

[Trees/Advanced/lazyLoad — _handleSetNodeChildren]
    ├─ _findNode('src')로 부모 탐색
    ├─ parent.children = [...] + parent.expanded = true + parent.loading = false
    ├─ _childrenLoaded.add('src')
    ├─ _flatten() → 재렌더 (src 자식 3개 visible)
    └─ @childrenLoaded { nodeid:'src', count:3 } emit

[사용자가 'src' chevron 다시 클릭 — collapse]
    ├─ _handleToggle('src')
    ├─ src.expanded=true → false (collapse)
    ├─ _flatten() → 재렌더 (자식 hidden, 메모리는 보존)
    └─ @nodeCollapsed { nodeid:'src' } emit

[사용자가 'src' chevron 다시 클릭 — 캐시 hit]
    ├─ _handleToggle('src')
    ├─ _childrenLoaded.has('src') === true → 즉시 expand (재요청 없음)
    ├─ src.expanded=true + 재렌더
    └─ @nodeExpanded { nodeid:'src', cached:true } emit

[페이지가 'src' refresh 필요 — clearNodeChildren publish]
    payload: { nodeid: 'src' }
    ├─ _childrenLoaded.delete('src')
    ├─ src.children = [] + src.expanded = false
    ├─ _flatten() → 재렌더
    └─ 다음 expand 시 @childrenRequested 재발행

운영: this.pageDataMappings = [
        { topic: 'treeNodes',         datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setNodeChildren',   datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'clearNodeChildren', datasetInfo: {...}, refreshInterval: 0 }   // 선택
      ];
      Wkit.onEventBusHandlers({
        '@childrenRequested': ({ nodeid, targetInstance }) => {
          // 페이지가 fetch 후 publish('setNodeChildren', { nodeid, children })
          fetchChildren(nodeid).then(children =>
            GlobalDataPublisher.fetchAndPublish? /* publish */ : null
          );
        },
        '@childrenLoaded':  ({ nodeid, count }) => { /* 트래킹 */ },
        '@nodeExpanded':    ({ nodeid, cached }) => { /* lazy hit 비율 */ },
        '@nodeCollapsed':   ({ nodeid }) => { /* 분석 트래킹 */ },
        '@treeNodeClicked': ({ event }) => {
          const id = event.target.closest('.tree-ll__node')?.dataset.nodeid;
          // 노드 상세 패널 표시
        }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | loading spinner / domain | 도메인 컨텍스트 예 |
|------|---------|--------------------------|------------------|
| `01_refined`     | A: Refined Technical | spinner: 12px 퍼플 회전 ring + "Loading…" Pretendard. data-loading="true" row는 chevron 숨김 + spinner 노출. | **파일/폴더 트리 lazy 로드** (IDE Explorer / 클라우드 스토리지 — 폴더 expand 시 자식 fetch) |
| `02_material`    | B: Material Elevated | spinner: Material circular indeterminate progress(보라 14px) + "Loading…" Roboto. | **조직도 부서 expand** (HR — 대규모 조직 lazy 로드) |
| `03_editorial`   | C: Minimal Editorial | spinner: serif italic "(loading…)" 텍스트만(애니메이션 없음). | **카테고리 트리 N차** (전자상거래 — 의류 → 상의 → T-Shirts lazy fetch) |
| `04_operational` | D: Dark Operational  | spinner: Mono ">> FETCHING…" 시안 blink. | **DB 스키마 explorer** (DB 관리 — schema → table → column lazy expand) |

각 페르소나는 `[data-loading="true"]` / `[data-expanded="true"]` / `[data-has-children="true"]` 셀렉터로 시각을 분기.

### 결정사항

- **prefix `.tree-ll__*`** — Standard `.tree__*` / draggableReorder `.tree-dr__*` 와 분리(같은 페이지 공존 시 CSS 충돌 X).
- **`treeNodes` + `setTreeNodes` 별칭 동시 구독** — Tabs/lazyContent의 `tabsItems`+`tabItems` 답습. 페이지가 둘 중 하나로 publish 해도 동작.
- **`_childrenLoaded: Set<nodeid>` Set (Map 아님)** — children value는 `_currentTree` 안에 이미 있으므로 별도 cache value 불필요. has 검사만으로 fetch 결정.
- **chevron click → bindEvents 위임 + `_handleToggle` 직접 호출 양쪽 동작** — `@treeToggleClicked` (Standard 호환) bindEvents 위임은 그대로 유지하되, lazyLoad 핵심 동작 `_handleToggle`은 native click 리스너로 컨테이너 위임 부착(bindEvents 위임 이후 stopPropagation 가능 — 단, 둘 다 이벤트 흘러가게 하기 위해 stopPropagation 사용 안함). 페이지가 추가 처리 가능.
- **`_setLoading(nodeid, true)` + 재렌더로 spinner 표시** — `data-loading="true"` 속성이 ListRender datasetAttrs로 자동 반영. CSS에서 `[data-loading="true"]` 셀렉터로 spinner 노출.
- **`hasChildren` 결정 — flag 우선 / children 보조** — lazy 트리는 자식이 아직 없어도 hasChildren=true일 수 있음. `_flatten` 시 `Array.isArray(children) && children.length > 0` OR 명시적 `node.hasChildren === true` 모두 hasChildren='true'로 표시.
- **lazy 응답 `parent.expanded = true` 자동** — 사용자가 expand를 트리거했으므로 응답 시 자동 펼침.
- **`@childrenRequested` 는 emit 만, 실제 fetch 는 페이지 책임** — 컴포넌트는 직접 fetch 하지 않는다(SHARED 금지 사항).
- **`@nodeExpanded.cached` 명시** — 페이지가 lazy hit 비율 트래킹 가능. `cached:true` 면 캐시 hit, false (실제로 첫 expand이지만 fetch는 별도 사이클이라 false 가능 — 본 컴포넌트는 캐시 hit/lazy fetch 트리거 양쪽 다 expand 사이클은 별도, 캐시 hit만 `@nodeExpanded` 발행하고 lazy fetch는 `@childrenRequested` → `@childrenLoaded` 라인이 별도라 `@nodeExpanded`는 cached:true 로만 발행). 단순화 위해 `cached`는 항상 true(fetch 트리거 시는 emit 안함 — `@childrenLoaded`가 응답 사이클 종료를 알림).
- **신규 Mixin 생성 금지** — ListRenderMixin + 자체 메서드 9종으로 완결.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions / customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서 (이벤트 제거 → 구독 해제 → 자체 상태/메서드 null + listRender.destroy)
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Trees/Advanced/lazyLoad/preview/...html` → `../`를 5번 = draggableReorder 동일 verbatim 복사)
