this.customEvents = null;

if (this._treeClickHandler) {
  this.appendElement.removeEventListener("click", this._treeClickHandler);
}
this._treeClickHandler = null;

if (this.treeRender) {
  this.treeRender.destroy();
}

this._selectedNodeId = null;
this.syncEmptyState = null;
this.setSelectedNode = null;
this.renderTreeData = null;
this.expandAllNodes = null;
this.collapseAllNodes = null;
this.subscriptions = null;
