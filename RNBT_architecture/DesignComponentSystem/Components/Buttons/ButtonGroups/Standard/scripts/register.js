const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

applyListRenderMixin(this, {
    cssSelectors: {
        container: '.button-group',
        template: '#button-group-item-template',
        item: '.button-group__item',
        id: '.button-group__item',
        selected: '.button-group__item',
        label: '.button-group__label'
    },
    itemKey: 'id',
    datasetAttrs: {
        id: 'id',
        selected: 'selected'
    }
});

this.selectItem = function(id) {
    const items = this.appendElement.querySelectorAll(this.listRender.cssSelectors.item);
    items.forEach(item => item.setAttribute('data-selected', item.dataset.id === String(id) ? 'true' : 'false'));
};

this.subscriptions = {
    buttonGroupItems: [this.listRender.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) => each(handler => subscribe(topic, this, handler), handlers))
);

this.customEvents = {
    click: {
        [this.listRender.cssSelectors.item]: '@buttonGroupItemClicked'
    }
};
bindEvents(this, this.customEvents);
