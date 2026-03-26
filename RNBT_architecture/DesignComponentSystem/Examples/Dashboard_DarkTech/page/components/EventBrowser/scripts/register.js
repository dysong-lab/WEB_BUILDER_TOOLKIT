/**
 * EventBrowser — Dashboard Corporate
 */

// 이벤트 목록
applyListRenderMixin(this, {
    cssSelectors: {
        container: '.event-browser__list',
        template:  '#event-browser-item-template',
        time:      '.event-browser__item-time',
        level:     '.event-browser__item-level',
        message:   '.event-browser__item-message',
        source:    '.event-browser__item-source'
    },
    datasetAttrs: { level: 'level' }
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

Object.entries(this.subscriptions).forEach(([topic, handlers]) =>
    handlers.forEach(handler => GlobalDataPublisher.subscribe(topic, this, handler))
);

this.customEvents = {
    click: {
        [this.listRender.cssSelectors.template]: '@eventItemClicked'
    }
};

Wkit.bindEvents(this, this.customEvents);

this.shadowPopup.bindPopupEvents({
    click: {
        [this.shadowPopup.cssSelectors.closeBtn]: '@eventPopupClose'
    }
});
