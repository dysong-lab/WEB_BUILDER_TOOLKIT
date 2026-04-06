# TreeRenderMixin

## 설계 의도

계층적 데이터를 트리 구조로 렌더링한다.

재귀적 배열(children)을 받아 template의 cloneNode로 노드를 생성하고, depth에 따라 들여쓰기를 적용한다. 각 노드의 확장/축소 상태를 관리한다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조
> **구독/이벤트/정리 패턴**: 설계 문서의 "라이프사이클" 참조

### ListRenderMixin과의 차이

| | ListRenderMixin | TreeRenderMixin |
|---|---|---|
| 데이터 | flat 배열 | 재귀적 배열 (children) |
| 렌더링 | 1차원 반복 | 재귀적 중첩 |
| 상태 관리 | itemKey 기반 항목 상태 | 노드별 확장/축소 상태 |
| 규약 KEY | container, template | container, template, node |

---

## 인터페이스

### cssSelectors

CSS 선택자로 HTML 요소를 참조한다.

| KEY | 종류 | 의미 |
|-----|------|------|
| `container` | 규약 | 노드가 추가될 부모 요소 |
| `template` | 규약 | `<template>` 태그 (cloneNode 대상) |
| `node` | 규약 | 각 노드의 루트 요소 (data-node-id 부여 대상) |
| `toggle` | 사용자 정의 | 확장/축소 토글 요소. Mixin 내부에서 직접 참조하지 않으며, customEvents에서 `[this.treeRender.cssSelectors.toggle]`로 클릭 이벤트를 매핑하기 위해 등록 |

```javascript
cssSelectors: {
    container: '.tree__list',               // 노드가 추가될 부모
    template:  '#tree-node-template',       // cloneNode 대상
    node:      '.tree__node',               // 각 노드의 루트
    toggle:    '.tree__toggle',             // 확장/축소 토글 버튼
    icon:      '.tree__icon',               // 노드 아이콘
    label:     '.tree__label'               // 노드 레이블
}
```

> **KEY의 두 종류:** `container`, `template`, `node`, `toggle`은 Mixin이 규약으로 요구하는 KEY다. 나머지(`icon`, `label` 등)는 사용자 정의 KEY다. `toggle`은 Mixin 내부에서 직접 참조하지 않지만, customEvents에서 `[this.treeRender.cssSelectors.toggle]`로 클릭 이벤트를 매핑하기 위해 등록한다.

### datasetAttrs (선택)

data-* 속성으로 설정할 키를 지정한다. 등록되지 않은 키는 textContent로 설정된다.

```javascript
datasetAttrs: {
    status: 'status'     // → el.setAttribute('data-status', value)
}
```

### elementAttrs (선택)

요소 속성(src, fill 등)으로 설정할 키를 지정한다.

```javascript
elementAttrs: {
    icon: 'src'     // → el.setAttribute('src', value)
}
```

### styleAttrs (선택)

스타일 속성(width, height 등)으로 설정할 키를 지정한다.

```javascript
styleAttrs: {
    progress: { property: 'width', unit: '%' }   // → el.style.width = value + '%'
}
```

### nodeKey (기본값: 'id')

각 노드를 고유하게 식별하는 데이터 키. 기본값은 `'id'`.

### childrenKey (기본값: 'children')

자식 노드 배열을 담는 데이터 키. 기본값은 `'children'`.

### renderData가 기대하는 데이터

재귀적 배열. 데이터의 KEY 이름과 cssSelectors의 KEY 이름이 같으면 매칭된다.
매칭된 KEY의 cssSelectors VALUE(선택자)로 요소를 찾고, 데이터 VALUE를 반영한다.

```javascript
// cssSelectors 정의:
cssSelectors: {
    container: '.tree__list',          // ← 규약 KEY (Mixin이 내부 참조)
    template:  '#tree-node-template',  // ← 규약 KEY
    node:      '.tree__node',          // ← 규약 KEY (data-node-id 부여 대상)
    toggle:    '.tree__toggle',        // ← 이벤트 매핑용
    icon:      '.tree__icon',          // ← 데이터 KEY "icon"과 매칭
    label:     '.tree__label',         // ← 데이터 KEY "label"과 매칭
    status:    '.tree__node'           // ← 데이터 KEY "status"과 매칭 (node 요소에 data-status 부여)
}
datasetAttrs: { status: 'status' }

// renderData에 전달되는 데이터:
[
    {
        id: 'site-1', label: '본사', status: 'normal',
        //             ↑ KEY          ↑ KEY
        //             ↓ 매칭         ↓ 매칭
        //  cssSelectors.label       cssSelectors.status → datasetAttrs.status
        //             ↓              ↓
        //  .tree__label.textContent  .tree__node에 data-status="normal"
        children: [
            {
                id: 'floor-3', label: '3층',
                children: [
                    { id: 'room-301', label: '서버실', status: 'warning' },
                    { id: 'room-302', label: '전기실', status: 'normal' }
                ]
            }
        ]
    },
    {
        id: 'site-2', label: '지사', status: 'normal', children: []
    }
]
// container, template, node, toggle은 데이터에 없으므로 건너뜀
// id, children은 nodeKey/childrenKey로 Mixin이 내부 처리
```

### 자동 부여 속성

Mixin이 각 노드에 자동으로 부여하는 data 속성:

| 속성 | 설명 | 값 |
|------|------|-----|
| `data-node-id` | 노드 고유 ID (nodeKey 값) | 문자열 |
| `data-depth` | 깊이 (루트 = 0) | 숫자 |
| `data-has-children` | 자식 존재 여부 | `"true"` / `"false"` |
| `data-expanded` | 펼침 상태 (자식이 있을 때만) | `"true"` / `"false"` |

---

## 사용 예시

### HTML

```html
<div class="tree">
    <div class="tree__list"></div>

    <template id="tree-node-template">
        <div class="tree__node">
            <span class="tree__toggle">▶</span>
            <span class="tree__icon"></span>
            <span class="tree__label"></span>
        </div>
    </template>
</div>
```

### CSS

```css
.tree__node { display: flex; align-items: center; cursor: pointer; }
.tree__node[data-has-children="false"] .tree__toggle { visibility: hidden; }
.tree__node[data-expanded="true"] .tree__toggle { transform: rotate(90deg); }
.tree__node[data-status="warning"] { color: #f59e0b; }
.tree__node[data-status="critical"] { color: #ef4444; }
```

### register.js

```javascript
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyTreeRenderMixin(this, {
    cssSelectors: {
        container: '.tree__list',
        template:  '#tree-node-template',
        node:      '.tree__node',
        toggle:    '.tree__toggle',
        icon:      '.tree__icon',
        label:     '.tree__label',
        status:    '.tree__node'
    },
    nodeKey: 'id',
    datasetAttrs: {
        status: 'status'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    equipmentTree: [this.treeRender.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {
    click: {
        [this.treeRender.cssSelectors.toggle]: '@nodeToggled',
        [this.treeRender.cssSelectors.node]:   '@nodeSelected'
    }
};
bindEvents(this, this.customEvents);
```

### 페이지에서 토글/선택 처리

```javascript
'@nodeToggled': ({ targetInstance, event }) => {
    const nodeEl = event.target.closest('.tree__node');
    const nodeId = nodeEl?.dataset.nodeId;
    if (nodeId) targetInstance.treeRender.toggle(nodeId);
},
'@nodeSelected': ({ targetInstance, event }) => {
    const nodeEl = event.target.closest('.tree__node');
    const nodeId = nodeEl?.dataset.nodeId;
    console.log('[Page] Node selected:', nodeId);
}
```

---

## 주입되는 네임스페이스

`this.treeRender`

| 속성/메서드 | 역할 |
|------------|------|
| `cssSelectors` | 주입된 cssSelectors (customEvents에서 computed property로 참조) |
| `datasetAttrs` | 주입된 datasetAttrs |
| `elementAttrs` | 주입된 elementAttrs |
| `styleAttrs` | 주입된 styleAttrs |
| `renderData({ response })` | 재귀적 배열을 받아 트리를 렌더링 |
| `expand(id)` | 노드를 펼친다 (직계 자식 표시) |
| `collapse(id)` | 노드를 접는다 (모든 하위 숨김) |
| `toggle(id)` | 노드의 펼침/접힘 상태를 전환 |
| `expandAll()` | 전체 노드를 펼친다 |
| `collapseAll()` | 전체 노드를 접는다 (루트만 표시) |
| `getNodeState(id)` | 노드의 data 속성을 조회 (복사본 반환) |
| `clear()` | 컨테이너의 모든 노드를 제거 |
| `destroy()` | Mixin이 주입한 모든 속성과 메서드를 정리 |

---

## 렌더링 구조

트리는 flat한 DOM 구조로 렌더링된다. 중첩 `<ul>`/`<li>` 방식이 아닌, 동일 레벨의 노드에 `data-depth`와 `paddingLeft`로 시각적 계층을 표현한다.

```
렌더링 결과 (DOM):
  <div class="tree__node" data-node-id="site-1" data-depth="0" data-expanded="true">
  <div class="tree__node" data-node-id="floor-3" data-depth="1" data-expanded="true">
  <div class="tree__node" data-node-id="room-301" data-depth="2" data-has-children="false">
  <div class="tree__node" data-node-id="room-302" data-depth="2" data-has-children="false">

장점:
  - template 하나로 모든 depth의 노드를 생성 (재귀적 template 불필요)
  - 확장/축소가 display:none 토글로 단순화
  - nextElementSibling 순회로 하위 노드를 빠르게 찾음
```

---

## 디자인 변형

같은 register.js로 HTML/CSS만 교체할 수 있다. 조건:

1. `container` VALUE에 해당하는 요소가 존재
2. `template` VALUE에 해당하는 `<template>` 태그가 존재
3. template 내부에 `node`, `toggle`의 VALUE에 해당하는 요소가 존재
4. 들여쓰기는 CSS로 재정의 가능 (Mixin이 paddingLeft를 설정하지만 CSS로 덮어쓸 수 있음)
