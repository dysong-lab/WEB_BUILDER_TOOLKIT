const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

applyListRenderMixin(this, {
  cssSelectors: {
    container: ".list-vs__window",
    template: "#list-vs-item-template",
    itemid: ".list-vs__item",
    leading: ".list-vs__leading",
    headline: ".list-vs__headline",
    supporting: ".list-vs__supporting",
  },
  itemKey: "itemid",
  datasetAttrs: {
    itemid: "itemid",
  },
});

this._allItems = [];
this._rowHeight = 56;
this._buffer = 5;
this._visibleStart = 0;
this._visibleEnd = 0;
this._visibleCount = 1;
this._rafId = null;

this._outerEl = this.appendElement.querySelector(".list-vs__outer");
this._spacerEl = this.appendElement.querySelector(".list-vs__spacer");
this._windowEl = this.appendElement.querySelector(".list-vs__window");

this._emitRangeChanged = (prevStart, prevEnd) => {
  if (prevStart === this._visibleStart && prevEnd === this._visibleEnd) return;
  Weventbus.emit("@virtualRangeChanged", {
    targetInstance: this,
    startIndex: this._visibleStart,
    endIndex: this._visibleEnd,
    totalCount: this._allItems.length,
    rowHeight: this._rowHeight,
  });
};

this._renderWindow = () => {
  const prevStart = this._visibleStart;
  const prevEnd = this._visibleEnd;
  const scrollTop = this._outerEl?.scrollTop || 0;
  const viewportHeight = this._outerEl?.clientHeight || this._rowHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / this._rowHeight) - this._buffer);
  const visibleCount = Math.max(1, Math.ceil(viewportHeight / this._rowHeight));
  const endIndex = Math.min(
    this._allItems.length,
    startIndex + visibleCount + this._buffer * 2,
  );

  this._visibleStart = startIndex;
  this._visibleEnd = endIndex;
  this._visibleCount = visibleCount;
  this._windowEl.style.top = `${startIndex * this._rowHeight}px`;
  this.listRender.renderData({
    response: this._allItems.slice(startIndex, endIndex),
  });
  this._emitRangeChanged(prevStart, prevEnd);
};

this._recomputeVisibleCount = () => {
  this._visibleCount = Math.max(
    1,
    Math.ceil((this._outerEl?.clientHeight || this._rowHeight) / this._rowHeight),
  );
  this._renderWindow();
};

this._renderItems = ({ response } = {}) => {
  this._allItems = Array.isArray(response) ? response.slice() : [];
  this._spacerEl.style.height = `${this._allItems.length * this._rowHeight}px`;
  this._renderWindow();
};

this._setRowHeight = ({ response } = {}) => {
  const nextHeight = Number(response);
  if (!Number.isFinite(nextHeight) || nextHeight <= 0) return;
  this._rowHeight = nextHeight;
  this._spacerEl.style.height = `${this._allItems.length * this._rowHeight}px`;
  this._recomputeVisibleCount();
};

this._scrollToIndex = ({ response } = {}) => {
  const index = Number(response);
  if (!Number.isFinite(index)) return;
  this._outerEl.scrollTop = Math.max(0, index) * this._rowHeight;
  this._renderWindow();
};

this._handleScroll = () => {
  if (this._rafId) return;
  this._rafId = requestAnimationFrame(() => {
    this._rafId = null;
    this._renderWindow();
  });
};

this._resizeObserver = new ResizeObserver(() => {
  this._recomputeVisibleCount();
});
this._resizeObserver.observe(this._outerEl);
this._outerEl.addEventListener("scroll", this._handleScroll);
this.appendElement.addEventListener("click", (event) => {
  const itemEl = event.target.closest(".list-vs__item");
  if (!itemEl) return;
  Weventbus.emit("@listItemClicked", { event, targetInstance: this });
});

this.subscriptions = {
  listItems: [this._renderItems],
  setRowHeight: [this._setRowHeight],
  scrollToIndex: [this._scrollToIndex],
};

go(
  Object.entries(this.subscriptions),
  each(([topic, handlers]) => each((handler) => subscribe(topic, this, handler), handlers)),
);

this.customEvents = null;
