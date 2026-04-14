# Trees — Standard

## 기능 정의

1. **계층 데이터 렌더링** — 재귀 구조의 노드 배열을 트리로 렌더링한다
2. **확장/축소 토글** — 자식이 있는 노드의 토글 버튼으로 하위 노드를 펼치거나 접는다
3. **노드 선택 표시** — 콘텐츠 영역 클릭 시 현재 선택 노드를 시각적으로 표시한다
4. **트리 제어 메서드** — `renderTreeData()`, `expandAllNodes()`, `collapseAllNodes()`로 외부에서 상태를 제어한다
5. **사용자 액션 이벤트** — 노드 선택과 토글 시 대응 이벤트를 발행한다

---

## 구현 명세

### Mixin

TreeRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| container | `.tree__list` | 트리 노드 컨테이너 |
| template | `#tree-node-template` | 노드 템플릿 |
| node | `.tree__node` | 각 노드 루트 |
| toggle | `.tree__toggle` | 확장/축소 버튼 |
| content | `.tree__content` | 선택 가능한 콘텐츠 영역 |
| icon | `.tree__icon` | 아이콘 텍스트 |
| label | `.tree__label` | 노드 레이블 |
| meta | `.tree__meta` | 보조 정보 |
| tone | `.tree__node` | 상태 톤 dataset 적용 대상 |
| empty | `.tree__empty` | 빈 상태 문구 |

### 구독 (subscriptions)

해당 없음. 페이지에서 `renderTreeData({ response })`를 직접 호출한다.

### 이벤트

| 이벤트 | 조건 | 발행 |
|--------|------|------|
| click | `.tree__toggle` 클릭 | `@treeNodeToggled` |
| click | `.tree__content` 클릭 | `@treeNodeSelected` |

위 이벤트는 내부 클릭 위임 핸들러에서 직접 발행한다.

### 자체 속성

| 속성 | 용도 |
|------|------|
| `this._selectedNodeId` | 현재 선택 노드 ID |
| `this._treeClickHandler` | 내부 클릭 위임 해제용 핸들러 |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `this.renderTreeData(payload)` | TreeRenderMixin으로 데이터 렌더링 후 기본 접힘 상태를 적용 |
| `this.expandAllNodes()` | 전체 노드를 펼친다 |
| `this.collapseAllNodes()` | 전체 노드를 접고 루트만 남긴다 |
| `this.setSelectedNode(nodeId)` | 선택 노드를 시각적으로 갱신한다 |

### 데이터 계약

```javascript
[
  {
    id: "ops",
    icon: "◫",
    label: "Operations",
    meta: "12 nodes",
    tone: "accent",
    children: [
      {
        id: "ops-zone-04",
        icon: "▣",
        label: "Zone 04",
        meta: "3 alerts",
        tone: "warning",
        children: []
      }
    ]
  }
]
```

### 표시 규칙

- `id`는 필수이며 노드 고유값으로 사용한다
- `children`이 없는 노드는 리프 노드로 처리한다
- 초기 렌더 후에는 루트만 보이고 하위 노드는 접힌 상태로 시작한다
- `tone`이 없으면 기본 톤으로 처리한다
- `meta`가 없으면 빈 문자열로 처리한다

### 페이지 연결 사례

```javascript
pageEventBusHandlers["@treeNodeSelected"] = ({ event, targetInstance }) => {
    const node = event.target.closest(targetInstance.treeRender.cssSelectors.node);
    const nodeId = node?.dataset.nodeId;
    console.log("[Page] selected:", nodeId);
};

pageEventBusHandlers["@treeNodeToggled"] = ({ event, targetInstance }) => {
    const node = event.target.closest(targetInstance.treeRender.cssSelectors.node);
    const nodeId = node?.dataset.nodeId;
    console.log("[Page] toggled:", nodeId, targetInstance.treeRender.getNodeState(nodeId));
};
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 정교한 패널과 은은한 블루 하이라이트의 트리 |
| 02_material | B: Material Elevated | 라이트 서피스와 명확한 상태층을 가진 트리 |
| 03_editorial | C: Minimal Editorial | 조용한 종이 질감과 타이포 중심의 트리 |
| 04_operational | D: Dark Operational | HUD 계열의 고대비 운영 트리 |
