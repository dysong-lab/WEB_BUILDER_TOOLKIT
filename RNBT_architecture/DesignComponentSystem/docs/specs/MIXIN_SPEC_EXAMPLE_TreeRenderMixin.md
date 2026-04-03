# Mixin 명세서: TreeRenderMixin

> 이 문서는 [MIXIN_SPEC_TEMPLATE.md](MIXIN_SPEC_TEMPLATE.md)의 모범답안이다.

---

## 1. 기능 정의

| 항목 | 내용 |
|------|------|
| **목적** | 데이터를 보여준다 |
| **기능** | 트리 구조 데이터를 재귀적으로 렌더링한다 |

### 기존 Mixin과의 관계

| 항목 | 내용 |
|------|------|
| **목적이 같은 기존 Mixin** | FieldRenderMixin (데이터를 보여준다), ListRenderMixin (데이터를 보여준다) |
| **기능의 차이** | FieldRenderMixin은 이미 존재하는 DOM 요소에 값을 채움. ListRenderMixin은 flat 배열을 template 복제로 반복 생성함. TreeRenderMixin은 재귀적 배열(children)을 받아 template 복제로 계층 구조를 생성하고, 각 노드의 확장/축소 상태를 관리함. 데이터 형태도 다름 (플랫 객체 vs flat 배열 vs 재귀적 배열). |

---

## 2. 인터페이스

### cssSelectors

| KEY | 종류 | 의미 |
|-----|------|------|
| `container` | 규약 | 노드가 추가될 부모 요소 |
| `template` | 규약 | `<template>` 태그 (cloneNode 대상) |
| `node` | 규약 | 각 노드의 루트 요소 (data-node-id, data-depth, data-expanded 부여 대상) |
| `toggle` | 사용자 정의 | 확장/축소 토글 요소. customEvents에서 `[this.treeRender.cssSelectors.toggle]`로 클릭 이벤트를 매핑하기 위해 등록 |
| `icon` | 사용자 정의 | 노드 아이콘 요소 |
| `label` | 사용자 정의 | 노드 레이블 요소 |

> **규약 KEY**: Mixin 내부에서 `cssSelectors.container`, `cssSelectors.template`, `cssSelectors.node`로 직접 참조한다. 없으면 renderData에서 throw.
> **사용자 정의 KEY**: Mixin이 `Object.entries(cssSelectors)`로 순회하며, data의 같은 이름의 KEY와 매칭하여 반영한다. `toggle`은 Mixin 내부에서 직접 참조하지 않지만, customEvents에서 이벤트 매핑용으로 등록한다.

### datasetAttrs (선택)

data-* 속성으로 설정할 키를 지정한다. 등록되지 않은 키는 textContent로 설정된다.

```javascript
datasetAttrs: {
    status: 'status'     // → el.setAttribute('data-status', value)
}
```

> 규약 KEY 없음. 모든 KEY는 사용자가 정의한다. cssSelectors와 key를 공유하여 대상 요소를 찾고, VALUE가 data 속성명이 된다.

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

### 기타 옵션

| 옵션 | 필수 | 의미 |
|------|------|------|
| `nodeKey` | X (기본값: `'id'`) | 각 노드를 고유하게 식별하는 데이터 키 |
| `childrenKey` | X (기본값: `'children'`) | 자식 노드 배열을 담는 데이터 키 |

---

## 3. renderData 기대 데이터

### 데이터 형태

```
재귀적 배열. 각 항목은 cssSelectors의 KEY와 매칭되는 KEY를 가진 객체.
자식 노드는 childrenKey(기본: 'children')에 배열로 포함된다.
```

### 예시

```javascript
// renderData({ response: ??? })에 전달되는 response의 형태:
[
    {
        id: 'site-1', label: '본사', status: 'normal',
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
```

### KEY 매칭 규칙

```
Object.entries(cssSelectors)를 순회하며,
각 KEY로 nodeData[key]를 찾고, 값이 있으면 해당 요소에 반영.

반영 경로 (applyValue 4경로):
  1. datasetAttrs에 등록된 키 → data-* 속성 설정
  2. elementAttrs에 등록된 키 → 요소 속성 설정 (src, fill 등)
  3. styleAttrs에 등록된 키   → 스타일 속성 설정 (width, height 등)
  4. 등록되지 않은 키          → textContent 설정

규약 KEY(container, template, node)도 순회에 포함되지만,
template 내부에 해당 선택자 요소가 없으므로 무시된다.

id, children은 nodeKey/childrenKey로 Mixin이 내부 처리.
```

---

## 4. 주입 네임스페이스

### 네임스페이스 이름

`this.treeRender`

### 메서드/속성

| 속성/메서드 | 역할 |
|------------|------|
| `cssSelectors` | 주입된 cssSelectors. customEvents에서 computed property로 참조 |
| `datasetAttrs` | 주입된 datasetAttrs |
| `elementAttrs` | 주입된 elementAttrs |
| `styleAttrs` | 주입된 styleAttrs |
| `renderData({ response })` | 재귀적 배열을 받아 트리를 렌더링 |
| `expand(id)` | 노드를 펼친다 (직계 자식 표시, 하위 expanded 상태 반영) |
| `collapse(id)` | 노드를 접는다 (모든 하위 숨김) |
| `toggle(id)` | 노드의 펼침/접힘 상태를 전환 |
| `expandAll()` | 전체 노드를 펼친다 |
| `collapseAll()` | 전체 노드를 접는다 (루트만 표시) |
| `getNodeState(id)` | 노드의 data 속성을 조회 (복사본 반환) |
| `clear()` | 컨테이너의 모든 노드를 제거 (`innerHTML = ''`) |
| `destroy()` | Mixin이 주입한 모든 속성과 메서드를 null 처리 |

---

## 5. destroy 범위

```
- ns.renderData = null
- ns.expand = null
- ns.collapse = null
- ns.toggle = null
- ns.expandAll = null
- ns.collapseAll = null
- ns.getNodeState = null
- ns.clear = null
- ns.cssSelectors = null
- ns.datasetAttrs = null
- ns.elementAttrs = null
- ns.styleAttrs = null
- instance.treeRender = null
```

---

## 6. 사용 예시

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

### register.js

```javascript
applyTreeRenderMixin(this, {
    cssSelectors: {
        container: '.tree__list',
        template:  '#tree-node-template',
        node:      '.tree__node',
        toggle:    '.tree__toggle',
        icon:      '.tree__icon',
        label:     '.tree__label'
    },
    nodeKey: 'id',
    datasetAttrs: {
        status: 'status'
    }
});

this.subscriptions = {
    equipmentTree: [this.treeRender.renderData]
};

// customEvents에서 Mixin의 선택자를 computed property로 참조
this.customEvents = {
    click: {
        [this.treeRender.cssSelectors.toggle]: '@nodeToggled',
        [this.treeRender.cssSelectors.node]:   '@nodeSelected'
    }
};
```

---
