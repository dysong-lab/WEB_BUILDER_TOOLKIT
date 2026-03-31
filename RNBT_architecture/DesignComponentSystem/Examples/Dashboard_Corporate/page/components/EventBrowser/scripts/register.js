/**
 * EventBrowser — Dashboard Corporate
 *
 * 목적: 이벤트 목록을 표시하고 상세 팝업을 제공한다
 * 기능: ListRenderMixin + ShadowPopupMixin으로 목록과 팝업을 조합한다
 *
 * Mixin: ListRenderMixin, ShadowPopupMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

// 이벤트 목록
applyListRenderMixin(this, {
    cssSelectors: {
        container: '.event-browser__list',
        template:  '#event-browser-item-template',
        item:      '.event-browser__item',
        time:      '.event-browser__item-time',
        level:     '.event-browser__item-level',
        message:   '.event-browser__item-message',
        source:    '.event-browser__item-source'
    }
});

// 상세 팝업
applyShadowPopupMixin(this, {
    cssSelectors: {
        template: '#event-detail-popup-template',
        closeBtn: '.popup-close-btn'
    },
    onCreated: (shadowRoot) => {
        this._popupScope = { appendElement: shadowRoot };
        applyListRenderMixin(this._popupScope, {
            cssSelectors: {
                container: '.popup-detail-list',
                template:  '#popup-detail-item-template',
                label:     '.popup-field__label',
                value:     '.popup-field__value'
            }
        });
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    dashboard_events: [this.listRender.renderData]
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
        [this.listRender.cssSelectors.item]: '@eventItemClicked'
    }
};

bindEvents(this, this.customEvents);

this.shadowPopup.bindPopupEvents({
    click: {
        [this.shadowPopup.cssSelectors.closeBtn]: '@eventPopupClose'
    }
});
