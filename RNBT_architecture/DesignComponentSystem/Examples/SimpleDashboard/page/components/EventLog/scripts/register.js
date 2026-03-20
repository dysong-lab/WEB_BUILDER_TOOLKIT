/**
 * EventLog — 조립 코드
 *
 * ListRenderMixin을 적용하여 이벤트 로그를 표시한다.
 * FieldRenderMixin과는 다른 Mixin — 다른 기능.
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyListRenderMixin(this, {
    cssSelectors: {
        container: '.event-log__list',
        item:      '.event-log__item',
        template:  '#event-log-item-template',
        level:     '.event-log__level',
        time:      '.event-log__time',
        message:   '.event-log__message',
        clearBtn:  '.event-log__clear-btn'
    },
    datasetSelectors: {
        level:   'level'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    events: [this.listRender.renderData]
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
        [this.listRender.cssSelectors.item]:     '@eventClicked',
        [this.listRender.cssSelectors.clearBtn]: '@clearClicked'
    }
};
bindEvents(this, this.customEvents);
