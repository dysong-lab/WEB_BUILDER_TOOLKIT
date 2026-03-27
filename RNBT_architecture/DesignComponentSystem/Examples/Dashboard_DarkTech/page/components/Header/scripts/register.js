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

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => GlobalDataPublisher.subscribe(topic, this, handler), handlers)
    )
);
