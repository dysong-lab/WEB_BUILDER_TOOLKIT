# Trees — Standard

## 정의 근거

> MD3 공식 범주가 아님. Trees display hierarchical data in an expandable and collapsible structure.

## 기능 정의

1. **노드 렌더링 (flat 배열)** — `treeNodes` 토픽으로 수신한 **평탄화된 노드 배열**을 template 반복으로 렌더링한다. 각 노드는 `{ treeid, depth, expanded, hasChildren, selected, leading, label, trailing }`로 구성되며, `depth`/`expanded`/`hasChildren`/`selected`는 data-* 속성으로 반영되어 CSS가 들여쓰기·회전·숨김·선택 상태를 제어한다. 계층→flat 전개는 페이지 책임.
2. **토글 클릭** — chevron 영역 클릭 시 `@treeToggleClicked` 발행. 페이지가 대상 노드의 `expanded`를 반전하고 하위 노드 visible을 재계산하여 다시 발행한다.
3. **노드 선택** — 노드 본체 클릭 시 `@treeNodeClicked` 발행. 페이지가 후속 액션(상세 표시 등)을 수행하고 필요 시 `selected` 상태를 갱신한다.

---

## 구현 명세

### Mixin

ListRenderMixin (flat 배열 렌더 + datasetAttrs로 depth/상태 반영)

> TreeRenderMixin이 아닌 ListRenderMixin을 선택한 이유: 페이지가 계층 구조를 이미 보유하므로, 페이지에서 현재 visible한 노드만 flat 배열로 전개해 발행하는 구조가 단순하고 예측 가능하다. depth/expanded/hasChildren/selected는 datasetAttrs를 통해 CSS가 해석한다. 재귀 중첩 DOM은 필요 없다.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container     | `.tree__list`               | 노드가 추가될 부모 (규약) |
| template      | `#tree-node-template`       | cloneNode 대상 (규약) |
| treeid        | `.tree__node`               | 노드 식별 + 노드 클릭 이벤트 매핑 |
| depth         | `.tree__node`               | 들여쓰기 단계 (data-depth) |
| expanded      | `.tree__node`               | 펼침 상태 (data-expanded) |
| hasChildren   | `.tree__node`               | 자식 존재 여부 (data-has-children) |
| selected      | `.tree__node`               | 선택 상태 (data-selected) |
| toggle        | `.tree__toggle`             | 토글 영역 (chevron 클릭 이벤트 매핑) |
| leading       | `.tree__leading`            | 선행 아이콘/이모지 |
| label         | `.tree__label`              | 노드 레이블 |
| trailing      | `.tree__trailing`           | 후행 배지/수량 |

### datasetAttrs

| KEY | VALUE |
|-----|-------|
| treeid       | treeid |
| depth        | depth |
| expanded     | expanded |
| hasChildren  | has-children |
| selected     | selected |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| treeNodes | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `toggle` (computed property) | `@treeToggleClicked` |
| click | `treeid` (computed property) | `@treeNodeClicked` |

> chevron(`toggle`)은 노드 내부 요소이므로 이벤트가 bubble 되면서 `treeid` 매핑에도 도달할 수 있다. 페이지 핸들러는 `@treeToggleClicked`가 먼저 발행되면 `event.stopPropagation()` 또는 두 핸들러의 논리(토글 시 선택 이벤트 무시)로 처리한다 — 컴포넌트는 dispatch만 담당.

### 커스텀 메서드

없음.

### 페이지 연결 사례

```
[페이지]
    계층 트리 상태 유지  ──flatten(visible only)──> fetchAndPublish('treeNodes', this)
                                                   → [Trees] 렌더링

[Trees] ──@treeToggleClicked──> [페이지] expanded 반전 → 재발행
[Trees] ──@treeNodeClicked  ──> [페이지] selected 갱신 / 상세 뷰 오픈 → 재발행
```

각 노드 객체의 예시:

```javascript
{ treeid: 'room-301', depth: 2, expanded: 'false', hasChildren: 'false',
  selected: 'false', leading: '\u{1F5A5}', label: '서버실', trailing: '12' }
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined     | A: Refined Technical | 다크 퍼플, 그라디언트 깊이, Pretendard, box-shadow 금지, 8/20px 모서리 |
| 02_material    | B: Material Elevated | 라이트, elevation shadow, Roboto+Pretendard, 8px 균일 모서리 |
| 03_editorial   | C: Minimal Editorial | 웜 그레이, 세리프 레이블(DM Serif), 넓은 여백, 2px 이하 모서리 |
| 04_operational | D: Dark Operational  | 컴팩트 다크 시안, IBM Plex Mono trailing, 미세 테두리, 2-4px 모서리 |

### 결정 사항

- **flat 배열 + datasetAttrs**: 재귀 중첩 DOM 대신 단일 컨테이너 안에 모든 visible 노드를 형제 요소로 배치하고, CSS가 `data-depth`로 들여쓰기(`padding-left: calc(depth * 16px + base)`)를 계산한다. 페이지가 계층 관리를 전적으로 담당하여 컴포넌트는 "표시"에 집중.
- **숨긴 노드**: 페이지가 collapsed 상태 하위 노드를 flat 배열에 포함하지 않는 방식으로 구현. 컴포넌트는 보이는 노드만 렌더.
- **chevron 가시성**: `data-has-children="false"`일 때 CSS로 `.tree__toggle { visibility: hidden }` 처리. 공간은 유지하여 들여쓰기가 깨지지 않게 함.
- **leading/trailing**: 텍스트 기반(이모지/심볼/수량). 비어있으면 CSS `:empty`로 숨김.
- **선택 상태**: `data-selected="true"`를 CSS에서 강조(배경색/테두리/타이포 변화)로 표현.
