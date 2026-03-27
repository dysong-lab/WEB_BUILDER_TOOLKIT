/**
 * EventBrowser — Dashboard Corporate
 */

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

this.subscriptions = {
    dashboard_events: [this.listRender.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => GlobalDataPublisher.subscribe(topic, this, handler), handlers)
    )
);

this.customEvents = {
    click: {
        [this.listRender.cssSelectors.container]: '@eventItemClicked'
    }
};

Wkit.bindEvents(this, this.customEvents);

this.shadowPopup.bindPopupEvents({
    click: {
        [this.shadowPopup.cssSelectors.closeBtn]: '@eventPopupClose'
    }
});
