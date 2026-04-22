// 3. 이벤트 제거

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
// 2. 구독 해제

this.subscriptions = null;
// 1. 자체 상태 및 Mixin 정리
