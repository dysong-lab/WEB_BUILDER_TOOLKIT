/**
 * Lists — Standard
 *
 * 목적: 텍스트와 아이콘의 연속적인 수직 목록 표시
 * 기능: ListRenderMixin으로 리스트 항목 렌더링 + 클릭 이벤트
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
        container:  '.list__items',
        template:   '#list-item-template',
        itemid:     '.list__item',
        leading:    '.list__leading',
        headline:   '.list__headline',
        supporting: '.list__supporting'
    },
    datasetAttrs: {
        itemid: 'itemid'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    listItems: [this.listRender.renderData]
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
        [this.listRender.cssSelectors.itemid]: '@listItemClicked'
    }
};

bindEvents(this, this.customEvents);
