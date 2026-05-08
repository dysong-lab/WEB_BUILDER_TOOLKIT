const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

applyTreeRenderMixin(this, {
    cssSelectors: {
        container: '.tree-checkbox__list',
        template: '#tree-checkbox-node-template',
        node: '.tree-checkbox__node',
        toggle: '.tree-checkbox__toggle',
        label: '.tree-checkbox__label',
    },
    nodeKey: 'id',
    childrenKey: 'children',
});

this._nodeStates = new Map();

this._buildNodeStates = function (nodes, parentId = null) {
    (Array.isArray(nodes) ? nodes : []).forEach((node) => {
        const id = String(node?.id ?? '');
        const childNodes = Array.isArray(node?.children) ? node.children : [];
        this._nodeStates.set(id, {
            selected: Boolean(node?.selected),
            indeterminate: false,
            expanded: childNodes.length ? node?.expanded !== false : false,
            parent: parentId,
            children: childNodes.map((child) => String(child?.id ?? '')),
        });
        this._buildNodeStates(childNodes, id);
    });
};

this._cascadeDown = function (id, value) {
    const queue = [String(id)];
    while (queue.length) {
        const currentId = queue.shift();
        const state = this._nodeStates.get(currentId);
        if (!state) continue;
        state.selected = value;
        state.indeterminate = false;
        queue.push(...state.children);
    }
};

this._recomputeAncestors = function (id) {
    let parentId = this._nodeStates.get(String(id))?.parent ?? null;
    while (parentId) {
        const parentState = this._nodeStates.get(parentId);
        if (!parentState) break;
        const childStates = parentState.children
            .map((childId) => this._nodeStates.get(childId))
            .filter(Boolean);
        const allSelected = childStates.length > 0 && childStates.every((child) => child.selected && !child.indeterminate);
        const allUnselected = childStates.every((child) => !child.selected && !child.indeterminate);
        if (allSelected) {
            parentState.selected = true;
            parentState.indeterminate = false;
        } else if (allUnselected) {
            parentState.selected = false;
            parentState.indeterminate = false;
        } else {
            parentState.selected = false;
            parentState.indeterminate = true;
        }
        parentId = parentState.parent;
    }
};

this._recomputeWholeTree = function (nodes) {
    const visit = (node) => {
        const id = String(node?.id ?? '');
        const state = this._nodeStates.get(id);
        if (!state) return { selected: false, indeterminate: false };
        const childNodes = Array.isArray(node?.children) ? node.children : [];
        if (!childNodes.length) return state;
        const childStates = childNodes.map(visit);
        const allSelected = childStates.length > 0 && childStates.every((child) => child.selected && !child.indeterminate);
        const allUnselected = childStates.every((child) => !child.selected && !child.indeterminate);
        if (allSelected) {
            state.selected = true;
            state.indeterminate = false;
        } else if (allUnselected) {
            state.selected = false;
            state.indeterminate = false;
        } else {
            state.selected = false;
            state.indeterminate = true;
        }
        return state;
    };

    (Array.isArray(nodes) ? nodes : []).forEach(visit);
};

this._applyNodeStateToDom = function () {
    this._nodeStates.forEach((state, id) => {
        const el = this.appendElement.querySelector(
            `${this.treeRender.cssSelectors.node}[data-node-id="${id}"]`,
        );
        if (!el) return;
        const depth = Number(el.dataset.depth || 0);
        const indicator = el.querySelector('.tree-checkbox__depth-indicator');
        el.dataset.checked = state.selected ? 'true' : 'false';
        el.dataset.indeterminate = state.indeterminate ? 'true' : 'false';
        el.style.setProperty('--depth-guide', `${depth * 20}px`);
        el.setAttribute(
            'aria-checked',
            state.indeterminate ? 'mixed' : state.selected ? 'true' : 'false',
        );
        el.setAttribute('role', 'treeitem');
        if (indicator) indicator.dataset.depthBadge = String(depth);
        if (state.children.length) {
            el.dataset.expanded = state.expanded ? 'true' : 'false';
            if (state.expanded) this.treeRender.expand(id);
            else this.treeRender.collapse(id);
        }
    });
};

this._emitChange = function (nodeId) {
    Weventbus.emit('@treeNodeToggled', {
        targetInstance: this,
        nodeId,
        selectedIds: [...this._nodeStates.entries()]
            .filter(([, state]) => state.selected)
            .map(([id]) => id),
        indeterminateIds: [...this._nodeStates.entries()]
            .filter(([, state]) => state.indeterminate)
            .map(([id]) => id),
    });
};

this._handleNodeToggle = function (nodeEl) {
    const id = nodeEl?.dataset.nodeId;
    const state = this._nodeStates.get(String(id));
    if (!state) return;
    const nextValue = state.indeterminate ? true : !state.selected;
    this._cascadeDown(id, nextValue);
    this._recomputeAncestors(id);
    this._applyNodeStateToDom();
    this._emitChange(String(id));
};

this._handleExpandToggle = function (nodeEl) {
    const id = nodeEl?.dataset.nodeId;
    const state = this._nodeStates.get(String(id));
    if (!id || !state || !state.children.length) return;
    state.expanded = !state.expanded;
    if (state.expanded) this.treeRender.expand(String(id));
    else this.treeRender.collapse(String(id));
};

this._renderTree = function ({ response } = {}) {
    const safeTree = Array.isArray(response) ? response : [];
    this.treeRender.renderData({ response: safeTree });
    this._nodeStates = new Map();
    this._buildNodeStates(safeTree);

    this._nodeStates.forEach((state, id) => {
        if (state.selected) this._cascadeDown(id, true);
    });

    this._recomputeWholeTree(safeTree);

    const tree = this.appendElement.querySelector(this.treeRender.cssSelectors.container);
    if (tree) tree.setAttribute('role', 'tree');

    this._applyNodeStateToDom();
};

this.subscriptions = {
    treeData: [this._renderTree],
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) => each((handler) => subscribe(topic, this, handler), handlers)),
);

this._treeClickHandler = (event) => {
    const toggle = event.target.closest(this.treeRender.cssSelectors.toggle);
    if (toggle) {
        event.preventDefault();
        const node = toggle.closest(this.treeRender.cssSelectors.node);
        this._handleExpandToggle(node);
        return;
    }

    const node = event.target.closest(this.treeRender.cssSelectors.node);
    if (!node) return;
    event.preventDefault();
    this._handleNodeToggle(node);
};

this.appendElement.addEventListener('click', this._treeClickHandler);
