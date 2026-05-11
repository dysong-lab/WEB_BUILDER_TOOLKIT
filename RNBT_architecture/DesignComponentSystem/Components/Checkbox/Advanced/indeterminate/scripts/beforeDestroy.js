const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

this.appendElement.removeEventListener("click", this._groupClickHandler);

go(
  Object.entries(this.subscriptions),
  each(([topic]) => unsubscribe(topic, this)),
);

this.subscriptions = null;
this._groupClickHandler = null;
this._childrenStates = null;
this._parentId = null;
this._parentLabel = null;
this._applyChildDom = null;
this._renderChildren = null;
this._recomputeParentState = null;
this._emitChange = null;
this._renderGroup = null;
this._handleParentClick = null;
this._handleChildClick = null;

if (this.listRender) this.listRender.destroy();
