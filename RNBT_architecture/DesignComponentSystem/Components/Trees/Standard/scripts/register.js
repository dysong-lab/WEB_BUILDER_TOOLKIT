/**
 * Trees — Standard
 *
 * 목적: 계층형 데이터를 확장/축소 가능한 트리 구조로 표시한다
 * 기능: TreeRenderMixin 렌더링 + 내부 토글 처리 + 선택 상태 관리
 *
 * Mixin: TreeRenderMixin
 */

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

applyTreeRenderMixin(this, {
  cssSelectors: {
    container: ".tree__list",
    template: "#tree-node-template",
    node: ".tree__node",
    toggle: ".tree__toggle",
    content: ".tree__content",
    icon: ".tree__icon",
    label: ".tree__label",
    meta: ".tree__meta",
    tone: ".tree__node",
    empty: ".tree__empty",
  },
  nodeKey: "id",
  childrenKey: "children",
  datasetAttrs: {
    tone: "tone",
  },
});

this._selectedNodeId = null;
this._treeClickHandler = null;

this.syncEmptyState = function () {
  const empty = this.appendElement.querySelector(this.treeRender.cssSelectors.empty);
  const nodes = this.appendElement.querySelectorAll(this.treeRender.cssSelectors.node);
  if (!empty) return;

  empty.hidden = nodes.length > 0;
};

this.setSelectedNode = function (nodeId) {
  const nodes = this.appendElement.querySelectorAll(this.treeRender.cssSelectors.node);
  nodes.forEach((node) => {
    node.setAttribute(
      "data-selected",
      node.dataset.nodeId === String(nodeId) ? "true" : "false",
    );
  });

  this._selectedNodeId = nodeId == null ? null : String(nodeId);
};

this.renderTreeData = function (payload = {}) {
  this.treeRender.renderData(payload);
  this.treeRender.collapseAll();
  this.setSelectedNode(null);
  this.syncEmptyState();
};

this.expandAllNodes = function () {
  this.treeRender.expandAll();
};

this.collapseAllNodes = function () {
  this.treeRender.collapseAll();
};

this._treeClickHandler = (event) => {
  const toggle = event.target.closest(this.treeRender.cssSelectors.toggle);
  if (toggle) {
    const node = toggle.closest(this.treeRender.cssSelectors.node);
    const nodeId = node?.dataset.nodeId;
    if (!nodeId || node?.dataset.hasChildren !== "true") return;

    this.treeRender.toggle(nodeId);
    console.log("[Trees/Standard] toggled:", nodeId, this.treeRender.getNodeState(nodeId));
    Weventbus.emit("@treeNodeToggled", { event, targetInstance: this });
    return;
  }

  const content = event.target.closest(this.treeRender.cssSelectors.content);
  if (!content) return;

  const node = content.closest(this.treeRender.cssSelectors.node);
  const nodeId = node?.dataset.nodeId;
  if (!nodeId) return;

  this.setSelectedNode(nodeId);
  console.log("[Trees/Standard] selected:", nodeId);
  Weventbus.emit("@treeNodeSelected", { event, targetInstance: this });
};

this.appendElement.addEventListener("click", this._treeClickHandler);
this.syncEmptyState();

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {};

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = null;
