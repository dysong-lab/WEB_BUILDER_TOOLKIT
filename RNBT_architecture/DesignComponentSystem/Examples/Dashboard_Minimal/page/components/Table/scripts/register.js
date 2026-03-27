/**
 * Table — Dashboard Corporate
 */

applyTabulatorMixin(this, {
    cssSelectors: { container: '.tabular__body' },
    columns: [
        { title: 'ID',      field: 'id',      width: 80 },
        { title: 'Name',    field: 'name',    minWidth: 120 },
        { title: 'Type',    field: 'type',    width: 100 },
        { title: 'Status',  field: 'status',  width: 100 },
        { title: 'Value',   field: 'value',   width: 100, hozAlign: 'right' },
        { title: 'Updated', field: 'updated', width: 160 }
    ]
});

this.subscriptions = {
    dashboard_tableData: [this.tabulator.renderData]
};

this.tabulator.init().on('tableBuilt', () => {
    go(
        Object.entries(this.subscriptions),
        each(([topic, handlers]) =>
            each(handler => GlobalDataPublisher.subscribe(topic, this, handler), handlers)
        )
    );
});
