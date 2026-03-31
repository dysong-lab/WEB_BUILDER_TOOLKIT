/**
 * Table — Dashboard DarkTech
 *
 * 목적: 데이터를 테이블로 표시한다
 * 기능: TabulatorMixin으로 대화형 테이블을 렌더링한다
 *
 * Mixin: TabulatorMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

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

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    dashboard_tableData: [this.tabulator.renderData]
};

// ======================
// 3. 인스턴스 생성 → tableBuilt 이후 구독 활성화
// ======================

this.tabulator.init().on('tableBuilt', () => {
    go(
        Object.entries(this.subscriptions),
        each(([topic, handlers]) =>
            each(handler => subscribe(topic, this, handler), handlers)
        )
    );
});
