/**
 * EventBrowser — SimpleDashboard
 *
 * 목적: 이벤트 목록을 표시하고 상세 팝업을 제공한다
 * 기능: ListRenderMixin + ShadowPopupMixin으로 목록과 팝업을 조합한다
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
        container:     '.event-browser__list',
        item:          '.event-browser__item',
        template:      '#event-browser-item-template',
        id:            '.event-browser__item',
        severity:      '.event-browser__item',
        severityLabel: '.event-browser__severity-label',
        time:          '.event-browser__time',
        source:        '.event-browser__source',
        message:       '.event-browser__message',
        ack:           '.event-browser__item',
        ackBtn:        '.event-browser__ack-btn'
    },
    itemKey: 'id',
    datasetAttrs: {
        id:       'id',
        severity: 'severity',
        ack:      'ack'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    eventBrowser: [this.listRender.renderData]
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
        [this.listRender.cssSelectors.ackBtn]: '@ackClicked',
        [this.listRender.cssSelectors.item]:    '@eventSelected'
    }
};
bindEvents(this, this.customEvents);
