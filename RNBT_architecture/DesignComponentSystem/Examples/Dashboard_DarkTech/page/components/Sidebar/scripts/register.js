/**
 * Sidebar — Dashboard Corporate
 */

applyStatefulListRenderMixin(this, {
    cssSelectors: {
        container: '.sidebar__menu',
        template:  '#sidebar-menu-item-template',
        icon:      '.sidebar__item-icon',
        label:     '.sidebar__item-label',
        badge:     '.sidebar__item-badge'
    },
    datasetAttrs: {
        itemKey: 'menuId',
        active:  'active'
    }
});

this.subscriptions = {
    dashboard_menuItems: [this.statefulList.renderData]
};

Object.entries(this.subscriptions).forEach(([topic, handlers]) =>
    handlers.forEach(handler => GlobalDataPublisher.subscribe(topic, this, handler))
);

this.customEvents = {
    click: {
        [this.statefulList.cssSelectors.template]: '@menuItemClicked'
    }
};

Wkit.bindEvents(this, this.customEvents);
