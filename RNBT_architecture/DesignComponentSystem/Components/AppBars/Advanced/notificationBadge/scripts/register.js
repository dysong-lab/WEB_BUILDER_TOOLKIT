const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

applyFieldRenderMixin(this, {
    cssSelectors: {
        title: '.top-app-bar__title',
        bar: '.top-app-bar',
        navIcon: '.top-app-bar__nav-icon',
        badgeAction: '.top-app-bar__action--badge',
        utilityAction: '.top-app-bar__action--utility',
        badgeCount: '.top-app-bar__badge-count',
        badge: '.top-app-bar__badge'
    }
});

this.renderBadge = ({ response }) => {
    const badge = this.appendElement.querySelector(this.fieldRender.cssSelectors.badge);
    const badgeAction = this.appendElement.querySelector(this.fieldRender.cssSelectors.badgeAction);
    const count = response?.count ?? '';
    const tone = response?.tone || 'info';
    const normalized = String(count).trim();
    const visible = response?.visible === false
        ? false
        : Boolean(normalized.length) && normalized !== '0';

    this.fieldRender.renderData({
        response: {
            badgeCount: visible ? normalized : ''
        }
    });

    if (badge) {
        badge.dataset.visible = visible ? 'true' : 'false';
        badge.dataset.tone = tone;
        badge.setAttribute('aria-hidden', visible ? 'false' : 'true');
    }

    if (badgeAction) {
        const suffix = visible ? ` (${normalized})` : '';
        badgeAction.setAttribute('aria-label', `Notifications${suffix}`);
    }
};

this.subscriptions = {
    appBarInfo: [this.fieldRender.renderData],
    badgeInfo: [this.renderBadge]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each((handler) => subscribe(topic, this, handler), handlers)
    )
);

this.customEvents = {
    click: {
        [this.fieldRender.cssSelectors.navIcon]: '@navigationClicked',
        [this.fieldRender.cssSelectors.badgeAction]: '@badgeClicked',
        [this.fieldRender.cssSelectors.utilityAction]: '@actionClicked'
    }
};
bindEvents(this, this.customEvents);
