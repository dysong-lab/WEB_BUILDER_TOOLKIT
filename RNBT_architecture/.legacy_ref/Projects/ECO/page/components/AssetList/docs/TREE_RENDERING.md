# 트리 렌더링 가이드

이 문서는 트리 UI의 일반적인 렌더링 전략과 AssetList 컴포넌트의 현재 구현을 설명합니다.

---

## 1. 트리 렌더링 전략 비교

트리 UI를 구현하는 세 가지 주요 전략이 있습니다.

### 1.1 전체 재렌더링 (Full Re-render)

```
데이터 변경 → 전체 DOM 삭제 → 전체 DOM 재생성
```

**구현 방식**:
```javascript
function renderTree(data) {
    container.innerHTML = '';  // 전체 삭제
    container.innerHTML = buildTreeHTML(data);  // 전체 재생성
}
```

**장점**:
- 구현이 단순함
- 상태 관리가 간단함 (데이터 = DOM)
- 버그 발생 가능성 낮음

**단점**:
- 대규모 트리에서 성능 저하
- DOM 재생성 비용
- 스크롤 위치, 포커스 상태 손실 가능

**적합한 경우**:
- 노드 수 1,000개 이하
- 빈번하지 않은 업데이트
- 단순한 구조

### 1.2 부분 DOM 삽입 (Partial DOM Insertion)

```
데이터 변경 → 변경된 부분만 찾아서 → 해당 DOM만 수정
```

**구현 방식**:
```javascript
function appendChildren(parentId, children) {
    const parentEl = document.querySelector(`[data-id="${parentId}"] > .children`);
    parentEl.innerHTML = buildChildrenHTML(children);  // 해당 부분만 수정
}
```

**장점**:
- 변경 부분만 업데이트하므로 효율적
- 기존 DOM 상태 유지

**단점**:
- 구현 복잡도 증가
- DOM과 데이터 동기화 관리 필요
- 엣지 케이스 처리 어려움

**적합한 경우**:
- 중간 규모 트리 (1,000~10,000개)
- 빈번한 부분 업데이트
- 성능이 중요한 경우

### 1.3 가상화 (Virtualization)

```
화면에 보이는 노드만 DOM 생성 → 스크롤 시 동적으로 교체
```

**구현 방식**:
```javascript
function renderVisibleNodes(scrollTop, viewportHeight) {
    const visibleRange = calculateVisibleRange(scrollTop, viewportHeight);
    const visibleNodes = flattenedData.slice(visibleRange.start, visibleRange.end);
    container.innerHTML = buildNodesHTML(visibleNodes);
}
```

**장점**:
- 수만 개 노드도 부드럽게 처리
- 메모리 효율적
- 초기 로딩 빠름

**단점**:
- 구현 매우 복잡
- 트리 구조를 평탄화해야 함
- 펼침/접기 상태 관리 복잡
- 라이브러리 의존성 (react-window, tanstack-virtual 등)

**적합한 경우**:
- 대규모 트리 (10,000개 이상)
- 무한 스크롤 필요
- 성능이 최우선

### 1.4 전략 비교표

| 전략 | 구현 복잡도 | 성능 (소규모) | 성능 (대규모) | 상태 관리 |
|------|------------|--------------|--------------|----------|
| 전체 재렌더링 | 낮음 | 우수 | 나쁨 | 단순 |
| 부분 DOM 삽입 | 중간 | 우수 | 양호 | 복잡 |
| 가상화 | 높음 | 양호 | 우수 | 매우 복잡 |

---

## 2. AssetList 현재 구현

AssetList는 **전체 재렌더링 + Lazy Loading** 조합을 사용합니다.

### 2.1 설계 결정 배경

**데이터 구조**:
- 계층 트리: Building → Floor → Room → Rack → Equipment
- 초기 로드: depth=1로 최상위 노드만 로드
- Lazy Loading: 노드 펼침 시 하위 노드 추가 로드
- 한 번에 렌더링되는 노드 수가 제한적 (전체 로드 X)

**선택 이유**:
1. **노드 수가 제한적**: 초기 로드 시 depth 제한 + Lazy Loading으로 한 번에 렌더링되는 노드 수 제어
2. **구현 단순성**: 복잡한 DOM 동기화 로직 불필요
3. **유지보수성**: 데이터 = DOM이므로 디버깅 용이
4. **CSS 최적화**: `content-visibility: auto`로 렌더링 최적화 가능

### 2.2 데이터 흐름

```
┌─────────────────────────────────────────────────────────────────┐
│  1. 데이터 로딩 (API → 상태)                                      │
│                                                                  │
│     API 호출                    상태 저장                         │
│     ─────────────────────────────────────────────────            │
│     /api/hierarchy?depth=1  →  this._treeData = items            │
│                                                                  │
│     /api/hierarchy/:id/     →  addChildrenToNode()               │
│        children                 (parentId로 위치 찾아서 삽입)      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. DOM 렌더링 (상태 → DOM)                                       │
│                                                                  │
│     renderTreeNodes(this._treeData)                              │
│         │                                                        │
│         ├─→ rootEl.innerHTML = ''     // 전체 초기화              │
│         │                                                        │
│         └─→ items.forEach(item => {                              │
│                 rootEl.appendChild(                              │
│                     createTreeNode(item)  // 재귀적 DOM 생성      │
│                 );                                                │
│             });                                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Lazy Loading 흐름

```
초기 로드: depth=1
─────────────────────────────────────────────────────

this._treeData = [
    {
        id: "building-001",
        name: "본관",
        hasChildren: true,      // 하위 있음
        children: []            // 아직 안 불러옴
    }
]

        │
        ▼  사용자가 ▶ 클릭

API 호출: GET /api/hierarchy/building-001/children
─────────────────────────────────────────────────────

응답: {
    data: {
        parentId: "building-001",    ← 부모 위치 정보
        children: [
            { id: "floor-001", name: "1층", ... },
            { id: "floor-002", name: "2층", ... }
        ]
    }
}

        │
        ▼  addChildrenToNode()

this._treeData 갱신
─────────────────────────────────────────────────────

this._treeData = [
    {
        id: "building-001",
        name: "본관",
        hasChildren: true,
        children: [                 ← children 채워짐
            { id: "floor-001", name: "1층", ... },
            { id: "floor-002", name: "2층", ... }
        ]
    }
]

        │
        ▼  renderTreeNodes()

DOM 전체 재렌더링
─────────────────────────────────────────────────────
```

### 2.4 핵심 함수 상세

#### addChildrenToNode()

API 응답의 `parentId`를 사용해 트리 데이터에서 부모 노드를 찾고 children을 할당합니다.

```javascript
// register.js:408-423
function addChildrenToNode(items, parentId, children) {
    for (const item of items) {
        // parentId와 일치하는 노드 발견
        if (item.id === parentId) {
            item.children = children;
            return true;
        }
        // 재귀적으로 하위 탐색
        if (item.children && item.children.length > 0) {
            if (addChildrenToNode.call(this, item.children, parentId, children)) {
                return true;
            }
        }
    }
    return false;
}
```

**시간 복잡도**: O(n) - 최악의 경우 전체 트리 순회

#### renderTreeNodes()

트리 데이터를 DOM으로 변환합니다. 전체 재렌더링 방식입니다.

```javascript
// register.js:305-340
function renderTreeNodes(items, searchTerm = '') {
    const rootEl = this.element.querySelector('.tree-root');
    rootEl.innerHTML = '';  // 전체 초기화

    items.forEach(item => {
        const nodeEl = createTreeNode.call(this, item, searchTerm);
        if (nodeEl) {
            rootEl.appendChild(nodeEl);
        }
    });
}
```

#### createTreeNode()

단일 노드를 재귀적으로 생성합니다.

```javascript
// register.js:342-406 (단순화)
function createTreeNode(item, searchTerm) {
    const { id, name, type, status, hasChildren, children = [] } = item;

    // 검색 필터링
    if (searchTerm && !matchesSearch(item, searchTerm)) {
        return null;
    }

    const li = document.createElement('li');
    li.className = 'tree-node';
    li.dataset.nodeId = id;

    // 노드 콘텐츠 (토글, 아이콘, 라벨, 상태)
    li.innerHTML = `
        <div class="node-content">
            <span class="node-toggle ${hasChildren ? '' : 'hidden'}">▶</span>
            <span class="node-icon" data-type="${type}"></span>
            <span class="node-label">${name}</span>
            <span class="node-status ${status}"></span>
        </div>
    `;

    // 하위 노드 컨테이너
    if (hasChildren) {
        const childrenUl = document.createElement('ul');
        childrenUl.className = 'node-children';

        if (children.length > 0) {
            // children이 로드된 경우 재귀 렌더링
            children.forEach(child => {
                const childEl = createTreeNode.call(this, child, searchTerm);
                if (childEl) childrenUl.appendChild(childEl);
            });
        } else {
            // Lazy Loading placeholder
            childrenUl.innerHTML = '<li class="loading">Loading...</li>';
        }

        li.appendChild(childrenUl);
    }

    return li;
}
```

### 2.5 성능 최적화

현재 구현에서 사용하는 최적화 기법:

#### CSS content-visibility

```css
/* component.css */
.tree-node {
    content-visibility: auto;
    contain-intrinsic-size: 0 32px;
}
```

- 화면 밖 노드의 렌더링 비용 절감
- 브라우저가 자동으로 lazy rendering 수행

#### 펼침/접기 상태 보존

```javascript
// 펼침 상태를 Set으로 관리
this._expandedNodes = new Set();  // ['building-001', 'floor-001', ...]

// 재렌더링 시 상태 복원
function renderTreeNodes(items) {
    // ... DOM 생성 후
    this._expandedNodes.forEach(nodeId => {
        const nodeEl = this.element.querySelector(`[data-node-id="${nodeId}"]`);
        if (nodeEl) {
            nodeEl.classList.add('expanded');
        }
    });
}
```

#### Lazy Loading 완료 추적

```javascript
// 이미 로드한 노드 추적
this._loadedNodes = new Set();

function toggleNode(nodeId) {
    const needsLazyLoad = hasChildren && !this._loadedNodes.has(nodeId);

    if (needsLazyLoad) {
        // API 호출
        Weventbus.emit('@hierarchyChildrenRequested', { assetId: nodeId });
    }
    // ...
}

function appendChildren({ response }) {
    const { parentId, children } = response.data;
    addChildrenToNode(this._treeData, parentId, children);
    this._loadedNodes.add(parentId);  // 중복 요청 방지
    renderTreeNodes(this._treeData);
}
```

---

## 3. 성능 고려사항

### 3.1 현재 구현의 한계

| 항목 | 현재 상태 | 영향 |
|------|----------|------|
| 전체 재렌더링 | O(n) DOM 재생성 | 대규모 트리에서 깜빡임 가능 |
| 검색 시 재렌더링 | 타이핑마다 전체 재렌더 | 디바운싱 필요 |
| 선택 상태 | CSS 클래스로 관리 | 재렌더링 시 복원 필요 |

### 3.2 예상 성능 (참고용)

| 노드 수 | 전체 재렌더링 | 부분 DOM 삽입 |
|---------|--------------|--------------|
| 100개 | ~5ms | ~2ms |
| 500개 | ~20ms | ~5ms |
| 1,000개 | ~50ms | ~10ms |
| 5,000개 | ~250ms | ~30ms |

*실제 성능은 노드 복잡도, 브라우저, 하드웨어에 따라 다름*

### 3.3 향후 개선 방향

현재 구현으로 충분하지만, 대규모 확장 시 고려할 사항:

1. **검색 디바운싱**: 타이핑 완료 후 렌더링
   ```javascript
   const debouncedSearch = debounce(renderTreeNodes, 300);
   ```

2. **부분 DOM 업데이트**: Lazy Loading 시 해당 노드만 업데이트
   ```javascript
   function appendChildrenPartial(parentId, children) {
       const parentEl = document.querySelector(`[data-node-id="${parentId}"]`);
       const childrenEl = parentEl.querySelector('.node-children');
       childrenEl.innerHTML = children.map(createTreeNode).join('');
   }
   ```

3. **가상화**: 대규모 트리 시 tanstack-virtual 등 도입

---

## 4. 요약

| 항목 | 현재 구현 |
|------|----------|
| 렌더링 전략 | 전체 재렌더링 |
| 데이터 로딩 | Lazy Loading (API 분리) |
| 상태 관리 | 단일 `_treeData` + Set으로 펼침/로드 상태 |
| 부모 노드 탐색 | `parentId`로 재귀 검색 (O(n)) |
| 성능 최적화 | CSS content-visibility |
| 적합한 규모 | 1,000개 이하 컨테이너 노드 |

---

## 참고 자료

- [React Virtualized](https://github.com/bvaughn/react-virtualized) - 가상화 라이브러리
- [TanStack Virtual](https://tanstack.com/virtual/latest) - 프레임워크 독립적 가상화
- [content-visibility CSS](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility) - 브라우저 최적화

---

*최종 업데이트: 2026-01-15*
