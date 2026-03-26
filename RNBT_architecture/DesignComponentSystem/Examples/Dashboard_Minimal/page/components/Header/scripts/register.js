/**
 * Header — Dashboard Corporate
 */

applyFieldRenderMixin(this, {
    cssSelectors: {
        title:    '.header__title',
        userName: '.header__user-name',
        time:     '.header__time'
    }
});

this.subscriptions = {
    dashboard_headerInfo: [this.fieldRender.renderData]
};

Object.entries(this.subscriptions).forEach(([topic, handlers]) =>
    handlers.forEach(handler => GlobalDataPublisher.subscribe(topic, this, handler))
);
