const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

this.cssSelectors = {
  root: ".data-table",
  title: ".data-table__title",
  supportingText: ".data-table__supporting",
  rowCount: ".data-table__count",
  container: ".data-table__container",
};

this._rowClickBound = false;

applyTabulatorMixin(this, {
  cssSelectors: {
    container: this.cssSelectors.container,
  },
  columns: [
    { title: "ID", field: "id", width: 92 },
    { title: "Name", field: "name", minWidth: 140 },
    { title: "Type", field: "type", width: 110 },
    { title: "Status", field: "status", width: 110 },
    { title: "Value", field: "value", width: 110, hozAlign: "right" },
    { title: "Updated", field: "updated", width: 150 },
  ],
  tabulatorOptions: {
    layout: "fitColumns",
  },
});

this.normalizeTableInfo = function ({ response: data } = {}) {
  const nextData = data || {};
  const rows = Array.isArray(nextData.rows) ? nextData.rows : [];

  return {
    title:
      nextData.title === null || nextData.title === undefined
        ? ""
        : String(nextData.title),
    supportingText:
      nextData.supportingText === null || nextData.supportingText === undefined
        ? ""
        : String(nextData.supportingText),
    rows,
  };
};

this.bindRowClick = function () {
  const table = this.tabulator.getInstance();
  if (!table || this._rowClickBound) return;

  table.on("rowClick", (event, row) => {
    Weventbus.emit("@tableRowClicked", {
      event,
      targetInstance: this,
      response: row && typeof row.getData === "function" ? row.getData() : null,
    });
  });
  this._rowClickBound = true;
};

this.renderTableInfo = function (payload = {}) {
  const root = this.appendElement.querySelector(this.cssSelectors.root);
  const title = this.appendElement.querySelector(this.cssSelectors.title);
  const supportingText = this.appendElement.querySelector(this.cssSelectors.supportingText);
  const rowCount = this.appendElement.querySelector(this.cssSelectors.rowCount);
  if (!root || !title || !supportingText || !rowCount) return;

  const nextData = this.normalizeTableInfo(payload);

  title.textContent = nextData.title;
  supportingText.textContent = nextData.supportingText;
  supportingText.hidden = nextData.supportingText === "";
  rowCount.textContent = `${nextData.rows.length} rows`;
  root.dataset.empty = nextData.rows.length === 0 ? "true" : "false";

  this.tabulator.renderData({ response: nextData.rows });
  this.bindRowClick();
};

this.subscriptions = {
  tableInfo: [this.renderTableInfo],
};

this.tabulator.init().on("tableBuilt", () => {
  this.bindRowClick();
  go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
      each((handler) => subscribe(topic, this, handler), handlers),
    ),
  );
});
