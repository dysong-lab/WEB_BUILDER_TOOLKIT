# Trees — Advanced / filterSearch

## 기능 정의

1. **트리 노드 동적 렌더 (재귀 입력 → flat 전개 + 검색 필터링)** — `treeNodes` / `setTreeNodes` 토픽으로 수신한 **재귀 트리**(`[{nodeid, label, leading?, trailing?, expanded?, hasChildren?, children?, selected?}]`)를 컴포넌트가 자체 보유한 `_currentTree`에 deep clone으로 보관하고, `_renderWithFilter()`가 현재 `_filterText`에 따라 visible flat 배열을 결정 후 ListRenderMixin이 `<template>` cloneNode로 N개 row로 렌더한다. 각 노드는 `data-nodeid`/`data-depth`/`data-expanded`/`data-has-children`/`data-matched`로 식별·표시되며 `<span class="tree-fs__label">` 내부는 매칭 단어가 `<mark class="tree-fs__hl">...</mark>`로 highlight된다. cssSelectors KEY는 Standard 호환(`leading`/`label`/`trailing`)이며, 추가로 본 변형 전용 `nodeid`/`matched`/`searchInput`/`searchClear` KEY를 등록한다.
2. **검색 input 영역 — view 상단** — view에 `.tree-fs__search > input.tree-fs__searchInput`(+ 옵션 `.tree-fs__searchClear` 버튼) 슬롯 포함. 사용자가 input에 입력하면 200ms debounce 후 `_applyFilter(text)` 호출. clear 버튼 클릭 시 input 비우기 + 필터 즉시 해제. 검색 input은 컴포넌트 view의 일부(외부 검색바 X) — Trees 인스턴스 자체로 검색 + 트리 표시를 통합.
3. **필터 매칭 정책 — case-insensitive substring (label 기준)** — `_applyFilter(text)`가 `_currentTree`를 재귀 순회하며 각 노드의 `label`을 `text.toLowerCase()`와 substring 비교 → 매칭 노드의 nodeid를 `_matchedNodes: Set<nodeid>`에 add. 그 다음 `_collectAncestors(matchedId)`로 모든 매칭 노드의 조상 chain을 `_visibleNodes: Set<nodeid>`에 add(매칭 자기 + 매칭 자손이 있는 모든 조상 = visible). text가 비어있으면 두 Set 모두 clear → 모든 노드 visible(필터 해제).
4. **조상 자동 expand + 컨텍스트 보존** — 필터링 중에는 매칭 노드의 모든 조상이 `_visibleNodes`에 포함되며 `_renderWithFilter()`가 visible flat 전개 시 조상의 `expanded`를 강제로 true로 표시(원본 `_currentTree.expanded`는 보존 — 필터 해제 시 복원). 매칭 안 되는 형제 노드는 `_visibleNodes`에 없으므로 flat 배열에서 제외(display X).
5. **label highlight (`<mark>`)** — `_renderWithFilter()`가 매칭 substring을 `<mark class="tree-fs__hl">...</mark>`로 감싼 HTML 문자열을 nodeid → labelHtml 맵으로 보관 후, ListRender renderData 호출 직후 자체 메서드 `_applyLabelHtml(labelHtmls)`가 각 row의 `.tree-fs__label` 요소를 querySelector로 찾아 `innerHTML` 직접 주입. **`label` KEY는 cssSelectors에서 제외** (ListRender가 textContent로 자동 매핑하지 않도록) — ListRenderMixin은 elementAttrs를 setAttribute로만 처리하므로 innerHTML 매핑은 post-process로 직접 처리. 검색 비활성 상태에서는 plain text(원본 label, escape 후). XSS 방어를 위해 raw label은 항상 HTML escape 후 mark 삽입.
6. **debounce + 즉시 emit 분리** — input `input` 이벤트 → 200ms debounce 후 `_applyFilter` + `@filtered` emit. `keydown` Enter / `change`(blur) / clear 버튼 클릭 → debounce 우회 즉시 emit. debounce timer는 `_debounceTimer` 자체 상태로 보관, 새 입력 시 cancel 후 재설정.
7. **외부 명령 — `setFilterText` 토픽** — 페이지가 `setFilterText` 토픽으로 `{ text: string }` 발행 → `_handleSetFilterText` 핸들러가 input.value 동기화 + `_applyFilter(text)` 즉시 적용 + `@filtered` 또는 `@filterCleared` 발행. 외부 검색바와의 동기화 시나리오(예: 페이지 상단 글로벌 검색 → 트리에 동일 필터 적용).
8. **이벤트 발행 — `@filtered` + `@filterCleared`**:
   - `@filtered` — 필터 적용 후(text 비어있지 않음) 1회 broadcast. payload: `{ targetInstance, filterText, matchedCount, matchedIds }`. 페이지가 분석/외부 동기화/검색 결과 카운터 표시.
   - `@filterCleared` — 필터 해제(text 비움) 1회. payload: `{ targetInstance }`.
9. **노드 토글/선택 (Standard 호환)** — chevron(`toggle` 영역) 클릭 시 `@treeToggleClicked` 발행 (Standard 호환), 노드 본체 클릭 시 `@treeNodeClicked` 발행 (Standard 호환). 페이지는 chevron click을 받아 `setTreeNodes`로 다시 publish하면 `_handleSetTreeNodes`가 `_currentTree.expanded`를 갱신하고 재렌더한다. 단, 필터링 중에는 `_visibleNodes`가 우선 — 조상은 강제 expand 표시.
10. **인스턴스 자체 트리 + 필터 상태 보관** — `_currentTree: TreeNode[]` (재귀 구조) 자체 상태로 트리 진실 보관. `_filterText: string` (현재 필터). `_matchedNodes: Set<nodeid>` (직접 매칭). `_visibleNodes: Set<nodeid>` (매칭 + 조상). 새 `treeNodes` batch는 새 진실로 교체(이전 누적 X) + 현재 `_filterText`가 있으면 자동 재적용.

> **Standard와의 분리 정당성**:
> - **자체 상태 (`_currentTree` 재귀 + `_filterText` + `_matchedNodes` Set + `_visibleNodes` Set + `_debounceTimer`)** — Standard는 stateless(페이지가 flatten 후 publish). filterSearch는 트리 진실 + 필터 그래프를 컴포넌트로 흡수.
> - **자체 메서드 12종** — `_handleSetTreeNodes`, `_handleSetFilterText`, `_handleSearchInput`, `_handleSearchKeydown`, `_handleSearchChange`, `_handleSearchClear`, `_applyFilter`, `_collectAncestors`, `_findNode`, `_renderWithFilter`, `_applyLabelHtml`, `_emitFiltered`. Standard는 자체 메서드 0종.
> - **새 토픽 2종** — `setTreeNodes`(treeNodes 별칭, lazyLoad/checkbox 답습), `setFilterText`(외부 검색 명령). Standard는 `treeNodes` 1종만.
> - **새 이벤트 2종** — `@filtered`(매칭 결과 broadcast), `@filterCleared`(필터 해제). `@treeToggleClicked`/`@treeNodeClicked`는 Standard 호환 유지.
> - **HTML 구조 변경** — Standard 노드 `<div class="tree__node">`. filterSearch는 `<div class="tree-fs__node">` + view 상단에 `.tree-fs__search > input.tree-fs__searchInput`로 prefix 분리(Standard `tree__*` / draggableReorder `tree-dr__*` / lazyLoad `tree-ll__*` / checkbox `tree-cb__*`와 충돌 방지).
> - **재귀 데이터 입력 + label HTML 매핑** — Standard `treeNodes` payload는 flat 배열(visible only) + label은 textContent. filterSearch는 재귀 트리 + label은 highlight 적용 시 `<mark>` HTML 문자열 → cssSelectors에서 `label` KEY 제외 + 자체 `_applyLabelHtml`이 `.tree-fs__label.innerHTML` 직접 주입.
> - **datasetAttrs 추가** — `matched` 추가(직접 매칭 vs 조상 visible 구분 — 강조 시각 분기 가능). Standard는 selected 1종만.
>
> 위 7축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.

> **draggableReorder + lazyLoad + checkbox + Search/filtered 답습**:
> - draggableReorder/lazyLoad/checkbox 패턴 차용: `_currentTree` 재귀 자체 보유 + visible-only flat 전개 + ListRender flat 렌더 + Standard cssSelectors KEY 호환(leading/label/trailing) + `tree-fs__*` prefix 분리. register.js top-level 평탄 작성, preview `<script src>` 5단계 깊이 verbatim 복사.
> - Search/Advanced/filtered 패턴 차용: `_debounceMs`(200) + `_debounceTimer` 자체 상태 + input/keydown/change/clear 별도 핸들러 + Enter/change/clear 시 debounce 우회 즉시 emit + `setFilterText` 외부 강제 갱신. 차이는 filtered가 외부 fetch 결과를 publish 받는 model이라면 본 변형은 트리 데이터를 자체 보유한 채 in-memory 필터링 — `@filteredSearchRequested` 같은 외부 fetch 트리거 이벤트가 아니라 즉시 적용된 결과를 알리는 `@filtered` 이벤트.
> - Lists/Advanced/multiSelect의 Set 그래프 패턴 차용: `_matchedNodes: Set` + `_visibleNodes: Set`로 두 Set 분리 — 직접 매칭과 조상 visible을 구분하여 시각 channel 분기 가능(matched는 강조, visible-only는 컨텍스트).

> **MD3 / 도메인 근거**: Trees는 MD3 공식 범주가 아니지만 hierarchical data + in-tree search는 모든 IDE/파일 시스템/카테고리/조직도/메일 폴더 트리의 표준 패턴. 실사용: ① **파일 시스템 검색** (VS Code Explorer / OS 파일 매니저 — 수천개 파일 중 키워드로 좁힘 + 부모 폴더 자동 expand), ② **카테고리 트리 검색** (전자상거래 / 미디어 라이브러리 — 카테고리 N차 중 검색어 입력 시 매칭 카테고리만 표시 + 조상 카테고리 가시), ③ **조직도 검색** (HR 시스템 / 글로벌 organization — 멤버 이름 검색 시 본부 > 팀 자동 expand + 매칭 멤버 highlight), ④ **메일 폴더 검색** (대규모 라벨/폴더 시스템 — 폴더 이름 검색 시 매칭 폴더 + 부모만 표시), ⑤ **DB/API 스키마 검색** (DB 관리 도구 / Swagger UI — schema/endpoint 키워드 검색 + 매칭 항목 highlight). 검색 input을 트리 컴포넌트 자체에 내장하면 페이지가 별도 검색바 + filter 보일러플레이트를 재구현할 필요 없음.

---

## 구현 명세

### Mixin

ListRenderMixin (flat 배열 렌더 + datasetAttrs로 depth/상태/matched 반영 — label은 cssSelectors 제외 후 post-process innerHTML 주입) + 자체 메서드 12종(`_handleSetTreeNodes` / `_handleSetFilterText` / `_handleSearchInput` / `_handleSearchKeydown` / `_handleSearchChange` / `_handleSearchClear` / `_applyFilter` / `_collectAncestors` / `_findNode` / `_renderWithFilter` / `_applyLabelHtml` / `_emitFiltered`).

> Trees/Advanced/draggableReorder, lazyLoad, checkbox도 ListRenderMixin을 사용하지만, 본 변형은 ① `_currentTree`(재귀) + `_filterText` + 두 Set(`_matchedNodes` / `_visibleNodes`) 자체 상태로 트리 진실 + 필터 그래프 보관, ② input 이벤트 + 200ms debounce → `_applyFilter` → 매칭/조상 계산 → 재렌더 + emit, ③ `setFilterText` 외부 강제 갱신, ④ label은 cssSelectors에서 제외 + `_applyLabelHtml` post-process로 `<mark>` HTML 주입. Mixin 메서드 재정의는 하지 않음. 신규 Mixin 생성은 본 SKILL의 대상이 아님 — 자체 메서드로 완결.

### 옵션 슬롯 (인스턴스 직접 설정)

| 옵션 | 타입 | 기본 | 설명 |
|------|------|------|------|
| `_debounceMs` | `number` | `200` | input 이벤트 후 `_applyFilter` 호출까지 지연. 페이지가 register 직후 다른 값으로 덮어쓸 수 있음. |

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| group         | `.tree-fs`                       | 그룹 컨테이너 — `role="tree"` |
| searchBar     | `.tree-fs__search`               | 검색 input 영역 wrapper |
| searchInput   | `.tree-fs__searchInput`          | 검색 input 자체 — `<input type="text">`. 자체 input/keydown/change 핸들러 부착 |
| searchClear   | `.tree-fs__searchClear`          | 검색 clear 버튼(선택) — input.value 비우기 + 필터 즉시 해제 |
| container     | `.tree-fs__list`                 | 노드가 추가될 부모 (ListRenderMixin 규약) |
| template      | `#tree-fs-node-template`         | `<template>` cloneNode 대상 (ListRenderMixin 규약) |
| nodeid        | `.tree-fs__node`                 | 렌더된 각 row 루트 — ListRender가 `data-nodeid` 자동 설정. 노드 본체 클릭 이벤트 매핑. |
| depth         | `.tree-fs__node`                 | 들여쓰기 단계 (data-depth) |
| expanded      | `.tree-fs__node`                 | 펼침 상태 (data-expanded — 필터링 중에는 강제 true) |
| hasChildren   | `.tree-fs__node`                 | 자식 존재 여부 (data-has-children) |
| matched       | `.tree-fs__node`                 | 직접 매칭 여부 (data-matched — true이면 row 강조 가능) |
| toggle        | `.tree-fs__toggle`               | chevron 토글 영역 (클릭 이벤트 매핑 — Standard 호환) |
| leading       | `.tree-fs__leading`              | 선행 아이콘/이모지 (Standard 호환 KEY) |
| trailing      | `.tree-fs__trailing`             | 후행 배지/수량 (Standard 호환 KEY) |

> **`label` KEY 제외 결정**: ListRenderMixin은 cssSelectors KEY → textContent 자동 매핑 + elementAttrs는 setAttribute로만 처리(innerHTML 매핑 미지원). 본 변형은 매칭 substring을 `<mark>`로 wrap한 HTML 문자열을 label에 주입해야 하므로 cssSelectors에서 `label` KEY를 빼고, `_applyLabelHtml(labelHtmls)` post-process가 `_labelSelector` (`.tree-fs__label`)로 querySelector한 뒤 `innerHTML` 직접 설정. 자체 escape 후 mark만 삽입(XSS 방어).

### datasetAttrs (ListRender)

| KEY | data-* | 용도 |
|-----|--------|------|
| nodeid        | `nodeid`         | 노드 식별 — `event.target.closest('.tree-fs__node')?.dataset.nodeid`로 nodeid 추출 |
| depth         | `depth`          | 들여쓰기 |
| expanded      | `expanded`       | 펼침 상태 |
| hasChildren   | `has-children`   | 자식 존재 여부 |
| matched       | `matched`        | 직접 매칭 (CSS 강조 가능) |

### itemKey

`nodeid` (ListRender) — ListRender의 항목 식별 키.

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_currentTree`   | `TreeNode[]` (재귀) | 현재 트리 진실. 노드 = `{ nodeid, label, leading?, trailing?, expanded?, hasChildren?, children?, selected? }`. `_handleSetTreeNodes`가 deep clone으로 초기화. |
| `_filterText`    | `string` | 현재 활성 필터. 빈 문자열이면 필터 비활성. trim 적용. |
| `_matchedNodes`  | `Set<nodeid: string>` | 직접 매칭된 노드. label substring 매칭 결과. `_applyFilter`가 갱신. |
| `_visibleNodes`  | `Set<nodeid: string>` | 매칭 노드 + 모든 조상. `_renderWithFilter`가 visible 결정 시 사용. |
| `_debounceMs`    | `number` | input 이벤트 debounce 지연(기본 200). |
| `_debounceTimer` | `number \| null` | 진행 중 setTimeout id. cancel 후 재설정용. |
| `_inputHandler` / `_keydownHandler` / `_changeHandler` / `_clearHandler` | `function \| null` | search input element 자체 bound handler refs. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `treeNodes`     | `this._handleSetTreeNodes`   | 재귀 트리 `[{nodeid, label, leading?, trailing?, expanded?, hasChildren?, children?, selected?}]` — 컴포넌트가 deep clone으로 보관. 현재 `_filterText`가 있으면 자동 재적용. |
| `setTreeNodes`  | `this._handleSetTreeNodes`   | `treeNodes` 별칭 (lazyLoad/checkbox 답습 — 페이지가 둘 중 하나로 publish 가능). |
| `setFilterText` | `this._handleSetFilterText`  | `{ text: string }` — 외부 검색 명령. input.value 동기화 + `_applyFilter` 즉시 적용 + emit. |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `toggle` (ListRender) | chevron 클릭 | `@treeToggleClicked` (Standard 호환 — `{ targetInstance, event }`). 페이지가 expanded 반전 후 `setTreeNodes` 재발행. |
| click | `nodeid` (ListRender) | 노드 본체 클릭 | `@treeNodeClicked` (Standard 호환 — `{ targetInstance, event }`). |

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@filtered`       | `_applyFilter` 적용 후 text가 비어있지 않을 때 1회 broadcast | `{ targetInstance, filterText, matchedCount, matchedIds }`. matchedIds는 `[..._matchedNodes]`. matchedCount는 `_matchedNodes.size`. |
| `@filterCleared`  | `_applyFilter`가 빈 text 적용 후 1회 (필터 해제) | `{ targetInstance }`. |

> **이벤트 분리 이유**: bindEvents 위임은 `{ targetInstance, event }`만 전달 → filterText/matchedCount/matchedIds가 없다. filterSearch는 페이지가 (a) 검색어 + 매칭 결과 카운트(`@filtered.filterText + matchedCount + matchedIds` — 분석/검색 결과 카운터 표시), (b) 필터 해제 사실(`@filterCleared`) 두 채널을 직교로 사용. `@treeToggleClicked`/`@treeNodeClicked` bindEvents 위임은 Standard 호환 + 사용자 액션 채널로 분리.

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_handleSetTreeNodes({ response })` | `({response}) => void` | `treeNodes` / `setTreeNodes` 핸들러. response가 배열이면 deep clone으로 `_currentTree` 갱신. 현재 `_filterText`가 비어있지 않으면 `_applyFilter(_filterText)` 자동 재적용(같은 필터로 새 트리에 적용 후 재렌더 + emit). 비어있으면 `_renderWithFilter()`만 호출. |
| `_handleSetFilterText({ response })` | `({response}) => void` | `setFilterText` 핸들러. response = `{ text }`. input.value 동기화 + `_applyFilter(text)` 즉시 적용. |
| `_handleSearchInput(e)` | `(InputEvent) => void` | search input element `input`. `_debounceTimer` cancel + `setTimeout(_debounceMs)` → 만료 시 `_applyFilter(e.target.value)`. |
| `_handleSearchKeydown(e)` | `(KeyboardEvent) => void` | search input `keydown`. Enter: `e.preventDefault()` → debounce cancel → `_applyFilter` 즉시. Escape: input.value 비우기 + `_applyFilter('')` 즉시. |
| `_handleSearchChange(e)` | `(Event) => void` | search input `change`(blur). debounce cancel → `_applyFilter(e.target.value)` 즉시. |
| `_handleSearchClear()` | `() => void` | clear 버튼 click 핸들러. input.value 비우기 + debounce cancel + `_applyFilter('')` 즉시. |
| `_applyFilter(text)` | `(string) => void` | 필터 적용 핵심. trim 후 `_filterText`에 저장. 빈 text면 두 Set clear → `_renderWithFilter()` → `@filterCleared` emit. 비어있지 않으면 `_currentTree` 재귀 순회하며 label substring(case-insensitive) 매칭 → `_matchedNodes`에 add → 각 매칭 노드의 조상을 `_collectAncestors`로 수집 → `_visibleNodes`에 add(매칭 자기 + 조상) → `_renderWithFilter()` → `@filtered` emit. |
| `_collectAncestors(nodeid)` | `(string) => string[]` | `_currentTree`를 재귀 순회하며 nodeid의 조상 chain을 수집(자기 자신 제외). 부모 path를 추적하며 매칭되면 path 그대로 반환. |
| `_findNode(nodes, id)` | `(Array, string) => Object\|null` | 재귀 검색으로 nodeid 매칭 노드 객체 반환 (없으면 null). |
| `_renderWithFilter()` | `() => void` | `_currentTree`를 visible flat 배열로 전개. 필터 비활성(_filterText 빈 문자열) 시 모든 노드 visible + 원본 expanded 사용 + label 원본. 필터 활성 시 `_visibleNodes`에 있는 노드만 포함 + 조상의 expanded 강제 true(원본 보존) + 매칭 노드의 labelHtml은 `<mark>` highlight 적용. matched dataset = `_matchedNodes.has(id)`. ListRender.renderData 호출 후 `_applyLabelHtml(labelHtmls)`로 .tree-fs__label.innerHTML 주입. |
| `_applyLabelHtml(labelHtmls)` | `(Map<nodeid, string>) => void` | renderData 직후 post-process — 컨테이너의 모든 row를 querySelectorAll로 순회하며 nodeid 매칭 row의 `.tree-fs__label.innerHTML`에 labelHtml 주입. 빈 Map이면 no-op. |
| `_emitFiltered()` | `() => void` | `Weventbus.emit('@filtered', { targetInstance: this, filterText: this._filterText, matchedCount: this._matchedNodes.size, matchedIds: [..._matchedNodes] })`. |

### 페이지 연결 사례

```
[페이지 — 파일 시스템 / 카테고리 트리 / 조직도 / 메일 폴더 / DB 스키마]
    │
    └─ fetchAndPublish('treeNodes', this) — 초기 트리 (재귀 구조 + expanded flag)
        payload: [
          { nodeid: 'src', leading: '\u{1F4C1}', label: 'src', expanded: true, children: [
              { nodeid: 'app', leading: '\u{1F4C1}', label: 'app', expanded: true, children: [
                  { nodeid: 'main.js',   leading: '\u{1F4C4}', label: 'main.js' },
                  { nodeid: 'router.js', leading: '\u{1F4C4}', label: 'router.js' }
              ]},
              { nodeid: 'lib', leading: '\u{1F4C1}', label: 'lib', expanded: false, children: [
                  { nodeid: 'utils.js', leading: '\u{1F4C4}', label: 'utils.js' }
              ]}
          ]},
          { nodeid: 'tests',   leading: '\u{1F4C1}', label: 'tests',   expanded: false },
          { nodeid: 'package', leading: '\u{1F4E6}', label: 'package', trailing: 'json' }
        ]

[Trees/Advanced/filterSearch]
    ├─ _handleSetTreeNodes가 _currentTree에 deep clone으로 보관
    ├─ _filterText 빈 문자열 → 두 Set 비어있음 → _renderWithFilter()로 모든 노드 원본 expanded로 표시
    └─ 각 row의 data-nodeid/data-depth/data-expanded/data-has-children/data-matched가 CSS에서 시각화

[사용자가 검색 input에 "router" 입력 — 200ms debounce]
    ├─ _handleSearchInput → _debounceTimer 설정 → 200ms 만료
    ├─ _applyFilter("router")
    │   ├─ _filterText = "router"
    │   ├─ _currentTree 순회: "router.js" label에 "router" 포함 → _matchedNodes.add('router.js')
    │   ├─ _collectAncestors('router.js') → ['app', 'src']
    │   ├─ _visibleNodes = {'router.js', 'app', 'src'}
    │   ├─ _renderWithFilter():
    │   │   src(visible, expanded=강제true) → app(visible, expanded=강제true) → router.js(matched, label="<mark>router</mark>.js")
    │   │   tests, package, lib, main.js, utils.js → 제외
    │   └─ Weventbus.emit('@filtered', { filterText:'router', matchedCount:1, matchedIds:['router.js'] })

[사용자가 검색 input 비우기 (× 또는 Escape)]
    ├─ _handleSearchClear / Escape → debounce cancel → _applyFilter('')
    ├─ _filterText = '', 두 Set clear
    ├─ _renderWithFilter()로 원본 expanded 복원 (src=true, lib=false, tests=false 그대로)
    └─ Weventbus.emit('@filterCleared', {})

[페이지가 setFilterText publish — 외부 글로벌 검색바와 동기화]
    payload: { text: 'main' }
    ├─ _handleSetFilterText
    │   ├─ input.value = 'main' (DOM 동기화)
    │   ├─ _applyFilter('main') 즉시 적용
    │   │   ├─ matched: 'main.js'
    │   │   ├─ visible: ['main.js', 'app', 'src']
    │   │   └─ @filtered emit
    │   └─ (debounce 우회)

운영: this.pageDataMappings = [
        { topic: 'treeNodes',     datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setFilterText', datasetInfo: {...}, refreshInterval: 0 }   // 선택
      ];
      Wkit.onEventBusHandlers({
        '@filtered':         ({ filterText, matchedCount, matchedIds }) => {
          // 검색 결과 카운터 표시 / 분석 로깅
        },
        '@filterCleared':    () => { /* 검색 결과 카운터 숨김 */ },
        '@treeToggleClicked': ({ event }) => {
          const id = event.target.closest('.tree-fs__node')?.dataset.nodeid;
          // 페이지가 _currentTree에서 해당 노드 expanded 반전 후 setTreeNodes publish
        },
        '@treeNodeClicked': ({ event }) => {
          const id = event.target.closest('.tree-fs__node')?.dataset.nodeid;
          // 노드 상세 패널 표시
        }
      });
```

---

## 디자인 변형

| 파일 | 페르소나 | 검색 input + highlight 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|-----------------------------------|------------------|
| `01_refined`     | A: Refined Technical | 검색 input: 다크 퍼플 그라디언트 pill(32px height, 14px radius), Pretendard, leading 검색 SVG 텍스트("\u{1F50D}"). highlight `<mark>`: 시안(#4DD0E1) 그라디언트 배경 + 다크 텍스트, 4px 라운드. data-matched="true": row 좌측 시안 2px 보더. | **파일 시스템 트리 검색** (IDE Explorer / 클라우드 스토리지 — 수천개 파일 중 키워드로 좁히기, 부모 폴더 자동 expand) |
| `02_material`    | B: Material Elevated | 검색 input: 라이트 회색 fill 28px Material textfield + leading icon. highlight `<mark>`: secondary container(#E8DEF8) 배경 + 다크 텍스트 + 4px radius. data-matched="true": row 좌측 4px 퍼플 보더. elevation shadow on hover. | **카테고리 트리 검색** (전자상거래 — 카테고리 N차 중 검색어 매칭 카테고리만 표시) |
| `03_editorial`   | C: Minimal Editorial | 검색 input: 바닥줄 1px brown underline only(no fill), DM Serif placeholder. highlight `<mark>`: warm yellow(#F8E89A) 배경 + brown 텍스트 + 0 radius(샤프). data-matched="true": row 좌측 brown 1.5px 보더. 정적(no anim). | **조직도 검색** (HR — 본부 > 팀 > 멤버 검색 시 조상 자동 expand + 매칭 멤버 highlight) |
| `04_operational` | D: Dark Operational  | 검색 input: 시안 1px outline mono(#4DD0E1), IBM Plex Mono `> _filter` placeholder. highlight `<mark>`: 시안(#4DD0E1) 배경 + 다크 텍스트 + 0 radius. data-matched="true": row 시안 fill 강조 + ASCII `[*]` prefix(via CSS pseudo). | **로그/이벤트/메일 폴더 트리 검색** (운영 모니터링 — 라벨/폴더 키워드 검색 + 매칭 폴더만 표시) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따르며, `[data-matched="true"]` 셀렉터로 직접 매칭 row 강조, `<mark class="tree-fs__hl">`로 label 내부 단어 highlight를 분기.

### 결정사항

- **prefix `.tree-fs__*`** — Standard `.tree__*` / draggableReorder `.tree-dr__*` / lazyLoad `.tree-ll__*` / checkbox `.tree-cb__*`와 분리(같은 페이지 공존 시 CSS 충돌 X).
- **`treeNodes` + `setTreeNodes` 별칭 동시 구독** — lazyLoad/checkbox 답습.
- **`_matchedNodes` + `_visibleNodes` 두 Set 분리** — 직접 매칭과 조상 visible을 구분 → 시각 channel 분기 가능(matched는 강조, visible-only는 컨텍스트). nestedTree/checkbox의 두 Set 패턴 답습.
- **debounce 200ms (기본)** — Search/filtered는 250ms, autoComplete도 250ms이지만 in-tree 즉시 필터링은 fetch가 아닌 in-memory 계산이라 더 짧은 200ms 채택. 옵션 슬롯 `_debounceMs`로 페이지가 덮어쓸 수 있음.
- **Enter / Escape / change(blur) / clear는 debounce 우회** — 사용자 명시 의도 → 즉시. Enter는 `preventDefault`(form submit 차단). Escape는 input 비우기 + 즉시 해제(IDE 관례).
- **label은 cssSelectors 제외 + post-process innerHTML 주입** — ListRenderMixin의 elementAttrs는 setAttribute로만 처리되어 innerHTML 매핑이 불가능하므로, cssSelectors에서 label KEY를 제외하고 `_applyLabelHtml(labelHtmls)` post-process가 ListRender renderData 직후 `.tree-fs__label.innerHTML`을 직접 주입. 자체 escape 적용 후 mark만 삽입(XSS 방어 — `_renderWithFilter` 내부에서 escape).
- **조상 강제 expand (filter 활성 시)** — 원본 `_currentTree.expanded`는 보존, `_renderWithFilter`만 visible flat 전개 시 조상의 expanded를 true로 표시. 필터 해제 시 원본 복원.
- **새 batch 시 현재 필터 자동 재적용** — `_handleSetTreeNodes`가 `_filterText` 비어있지 않으면 `_applyFilter(_filterText)` 자동 호출. 사용자가 검색 중에 페이지가 트리를 갱신해도 필터 유지.
- **chevron click과 search input 분리** — chevron(`.tree-fs__toggle`) click은 `@treeToggleClicked` (Standard 호환) bindEvents 위임만, search input은 별도 native input/keydown/change 핸들러. 노드 본체 click은 `@treeNodeClicked` (Standard 호환). 세 채널이 closest로 분기되어 직교.
- **신규 Mixin 생성 금지** — ListRenderMixin + 자체 메서드 11종으로 완결.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions / customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서 (이벤트 제거 → 구독 해제 → 자체 상태/메서드 null + listRender.destroy)
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Trees/Advanced/filterSearch/preview/...html` → `../`를 5번 = checkbox/lazyLoad 동일 verbatim 복사)
