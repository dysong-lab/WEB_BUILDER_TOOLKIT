/**
 * Table — Dashboard Corporate
 */

applyTabulatorMixin(this, {
    cssSelectors: { container: '.table__body' },
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
    Object.entries(this.subscriptions).forEach(([topic, handlers]) =>
        handlers.forEach(handler => GlobalDataPublisher.subscribe(topic, this, handler))
    );
});
