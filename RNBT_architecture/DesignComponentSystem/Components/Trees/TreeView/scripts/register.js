/**
 * TreeView 컴포넌트
 *
 * 목적: 계층적 데이터를 트리 구조로 표시한다
 * 기능: TreeRenderMixin으로 재귀 배열을 렌더링하고 확장/축소를 관리한다
 *
 * Mixin: TreeRenderMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyTreeRenderMixin(this, {
    cssSelectors: {
        container:   '.tree-view__list',
        template:    '#tree-view-node-template',
        node:        '.tree-view__node',
        toggle:      '.tree-view__toggle',
        icon:        '.tree-view__icon',
        label:       '.tree-view__label',
        badge:       '.tree-view__badge',
        status:      '.tree-view__node',
        expandAll:   '.tree-view__expand-all-btn',
        collapseAll: '.tree-view__collapse-all-btn'
    },
    nodeKey: 'id',
    childrenKey: 'children',
    datasetAttrs: {
        status: 'status'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    treeData: [this.treeRender.renderData]
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
        [this.treeRender.cssSelectors.toggle]:      '@nodeToggled',
        [this.treeRender.cssSelectors.node]:         '@nodeSelected',
        [this.treeRender.cssSelectors.expandAll]:    '@expandAll',
        [this.treeRender.cssSelectors.collapseAll]:  '@collapseAll'
    }
};
bindEvents(this, this.customEvents);
