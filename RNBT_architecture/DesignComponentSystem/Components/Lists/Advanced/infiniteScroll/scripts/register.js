const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

applyListRenderMixin(this, {
  cssSelectors: {
    container: ".list-inf__items",
    template: "#list-inf-item-template",
    itemid: ".list-inf__item",
    leading: ".list-inf__leading",
    headline: ".list-inf__headline",
    supporting: ".list-inf__supporting",
  },
  itemKey: "itemid",
  datasetAttrs: {
    itemid: "itemid",
  },
});

this._items = [];
this._isLoading = false;
this._hasMore = true;
this._intersectionRootMargin = "200px 0px";

this._outerEl = this.appendElement.querySelector(".list-inf__outer");
this._sentinelEl = this.appendElement.querySelector(".list-inf__sentinel");

this._renderList = () => {
  this.listRender.renderData({ response: this._items });
};

this._emitLoadMore = () => {
  Weventbus.emit("@loadMore", {
    targetInstance: this,
    currentCount: this._items.length,
    requestedAt: new Date().toISOString(),
  });
};

this._emitListEndReached = () => {
  Weventbus.emit("@listEndReached", {
    targetInstance: this,
    totalCount: this._items.length,
  });
};

this._handleIntersect = (entries) => {
  const first = entries[0];
  if (!first?.isIntersecting || this._isLoading || !this._hasMore) return;
  this._isLoading = true;
  this._outerEl.dataset.loading = "true";
  this._emitLoadMore();
};

this._renderItems = ({ response } = {}) => {
  this._items = Array.isArray(response) ? response.slice() : [];
  this._isLoading = false;
  this._hasMore = true;
  this._outerEl.dataset.loading = "false";
  this._outerEl.dataset.noMore = "false";
  this._renderList();
  this._outerEl.scrollTop = 0;
  this._intersectionObserver?.observe?.(this._sentinelEl);
};

this._appendItems = ({ response } = {}) => {
  const items = Array.isArray(response) ? response : [];
  this._items = this._items.concat(items);
  this._isLoading = false;
  this._outerEl.dataset.loading = "false";
  this._renderList();
};

this._setNoMoreItems = ({ response } = {}) => {
  const done = Boolean(response?.done ?? response);
  if (!done || !this._hasMore) return;
  this._hasMore = false;
  this._isLoading = false;
  this._outerEl.dataset.loading = "false";
  this._outerEl.dataset.noMore = "true";
  this._intersectionObserver?.disconnect?.();
  this._emitListEndReached();
};

this._setLoadingState = ({ response } = {}) => {
  this._isLoading = Boolean(response);
  this._outerEl.dataset.loading = this._isLoading ? "true" : "false";
};

this._intersectionObserver = new IntersectionObserver(this._handleIntersect, {
  root: this._outerEl,
  rootMargin: this._intersectionRootMargin,
});
this._intersectionObserver.observe(this._sentinelEl);

this.appendElement.addEventListener("click", (event) => {
  const itemEl = event.target.closest(".list-inf__item");
  if (!itemEl) return;
  Weventbus.emit("@listItemClicked", { event, targetInstance: this });
});

this.subscriptions = {
  listItems: [this._renderItems],
  appendListItems: [this._appendItems],
  setNoMoreItems: [this._setNoMoreItems],
  setLoadingState: [this._setLoadingState],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) => each((handler) => subscribe(topic, this, handler), handlers)),
);

this.customEvents = null;
