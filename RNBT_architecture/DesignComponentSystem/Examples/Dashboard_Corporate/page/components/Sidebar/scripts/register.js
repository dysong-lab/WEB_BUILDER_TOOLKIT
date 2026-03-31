/**
 * Sidebar — Dashboard Corporate
 */

applyStatefulListRenderMixin(this, {
    cssSelectors: {
        container: '.sidebar__menu',
        template:  '#sidebar-menu-item-template',
        menuid:    '.sidebar__item',
        active:    '.sidebar__item',
        icon:      '.sidebar__item-icon',
        label:     '.sidebar__item-label',
        badge:     '.sidebar__item-badge'
    },
    itemKey: 'menuid',
    datasetAttrs: {
        menuid:  'menuid',
        active:  'active'
    }
});

this.subscriptions = {
    dashboard_menuItems: [this.statefulList.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => GlobalDataPublisher.subscribe(topic, this, handler), handlers)
    )
);

this.customEvents = {
    click: {
        [this.statefulList.cssSelectors.menuid]: '@menuItemClicked'
    }
};

Wkit.bindEvents(this, this.customEvents);
