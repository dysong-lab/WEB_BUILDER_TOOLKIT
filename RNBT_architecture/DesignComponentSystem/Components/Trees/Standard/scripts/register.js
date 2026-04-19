/**
 * Trees — Standard
 *
 * 목적: 계층적 데이터를 확장/축소 가능한 트리로 표시
 * 기능: ListRenderMixin으로 flat 노드 배열 렌더 + 토글/노드 클릭 이벤트
 *
 * Mixin: ListRenderMixin
 *
 * 데이터 전제: 페이지가 계층 트리에서 현재 visible한 노드만 flat 배열로 전개해 발행한다.
 * 각 노드는 { treeid, depth, expanded, hasChildren, selected, leading, label, trailing }.
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyListRenderMixin(this, {
    cssSelectors: {
        container:   '.tree__list',
        template:    '#tree-node-template',
        treeid:      '.tree__node',
        depth:       '.tree__node',
        expanded:    '.tree__node',
        hasChildren: '.tree__node',
        selected:    '.tree__node',
        toggle:      '.tree__toggle',
        leading:     '.tree__leading',
        label:       '.tree__label',
        trailing:    '.tree__trailing'
    },
    datasetAttrs: {
        treeid:      'treeid',
        depth:       'depth',
        expanded:    'expanded',
        hasChildren: 'has-children',
        selected:    'selected'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    treeNodes: [this.listRender.renderData]
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
        [this.listRender.cssSelectors.toggle]: '@treeToggleClicked',
        [this.listRender.cssSelectors.treeid]: '@treeNodeClicked'
    }
};

bindEvents(this, this.customEvents);
