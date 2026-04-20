const { unsubscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
  Object.entries(this.subscriptions),
  each(([topic, _]) => unsubscribe(topic, this)),
);
this.subscriptions = null;

this._rowClickBound = null;
this.normalizeTableInfo = null;
this.bindRowClick = null;
this.renderTableInfo = null;
this.cssSelectors = null;
this.tabulator.destroy();
