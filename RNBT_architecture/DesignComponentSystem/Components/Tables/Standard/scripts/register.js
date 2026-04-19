/**
 * Tables — Standard
 *
 * 목적: 구조화된 데이터를 고정 5컬럼 행으로 반복 렌더링
 * 기능: ListRenderMixin 으로 행 렌더링 + 행 클릭 이벤트
 *       헤더는 정적 (HTML 에 직접 선언), 행만 동적
 *
 * Mixin: ListRenderMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyListRenderMixin(this, {
    cssSelectors: {
        container: '.table__body',
        template:  '#table-row-template',
        rowid:     '.table__row',
        col1:      '.table__cell--col1',
        col2:      '.table__cell--col2',
        col3:      '.table__cell--col3',
        col4:      '.table__cell--col4',
        col5:      '.table__cell--col5'
    },
    datasetAttrs: {
        rowid: 'rowid'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    tableRows: [this.listRender.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {
    click: {
        [this.listRender.cssSelectors.rowid]: '@tableRowClicked'
    }
};

bindEvents(this, this.customEvents);
