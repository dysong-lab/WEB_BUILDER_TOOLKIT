/**
 * Table 컴포넌트
 *
 * 목적: 데이터를 보여준다
 * 기능: TabulatorMixin으로 데이터를 테이블로 표시한다
 *
 * Mixin: TabulatorMixin
 */


// ── 1. Mixin 적용 ──
applyTabulatorMixin(this, {
    cssSelectors: {
        container: '.tabular__body'
    },
    columns: [
        { title: 'ID',       field: 'id',       width: 80 },
        { title: 'Name',     field: 'name',     minWidth: 120 },
        { title: 'Type',     field: 'type',     width: 100 },
        { title: 'Status',   field: 'status',   width: 100 },
        { title: 'Value',    field: 'value',    width: 100, hozAlign: 'right' },
        { title: 'Updated',  field: 'updated',  width: 140 }
    ]
});

// ── 2. 구독 선언 ──
this.subscriptions = {
    tableData: [this.tabulator.renderData]
};

// ── 3. 인스턴스 생성 → tableBuilt 이후 구독 활성화 ──
this.tabulator.init().on('tableBuilt', () => {
    Object.entries(this.subscriptions).forEach(([topic, handlers]) =>
        handlers.forEach(handler => GlobalDataPublisher.subscribe(topic, this, handler))
    );
});
