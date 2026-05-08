const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

this.appendElement.removeEventListener('click', this._treeClickHandler);

go(
    Object.entries(this.subscriptions),
    each(([topic]) => unsubscribe(topic, this)),
);

this.subscriptions = null;
this._treeClickHandler = null;
this._nodeStates = null;
this._buildNodeStates = null;
this._cascadeDown = null;
this._recomputeAncestors = null;
this._recomputeWholeTree = null;
this._applyNodeStateToDom = null;
this._emitChange = null;
this._handleNodeToggle = null;
this._handleExpandToggle = null;
this._renderTree = null;

if (this.treeRender) this.treeRender.destroy();
