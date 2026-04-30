const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

applyFieldRenderMixin(this, {
    cssSelectors: {
        title: '.top-app-bar__title',
        bar: '.top-app-bar',
        navIcon: '.top-app-bar__nav-icon',
        action: '.top-app-bar__action'
    }
});

this.scrollState = {
    collapsed: false,
    threshold: 72,
    container: null,
    handler: null
};

this.collapse = () => {
    const bar = this.appendElement.querySelector(this.fieldRender.cssSelectors.bar);
    if (!bar) return;
    bar.dataset.collapsed = 'true';
    this.scrollState.collapsed = true;
};

this.expand = () => {
    const bar = this.appendElement.querySelector(this.fieldRender.cssSelectors.bar);
    if (!bar) return;
    bar.dataset.collapsed = 'false';
    this.scrollState.collapsed = false;
};

this.syncScrollState = (scrollTop = 0) => {
    if (scrollTop >= this.scrollState.threshold) this.collapse();
    else this.expand();
};

this.detachScrollListener = () => {
    if (!this.scrollState.container || !this.scrollState.handler) return;
    this.scrollState.container.removeEventListener('scroll', this.scrollState.handler);
    this.scrollState.container = null;
    this.scrollState.handler = null;
};

this.attachScrollListener = ({ container, threshold = 72 } = {}) => {
    const target = container || window;
    this.detachScrollListener();
    this.scrollState.threshold = threshold;
    this.scrollState.container = target;
    this.scrollState.handler = () => {
        const scrollTop = target === window
            ? (window.scrollY || document.documentElement.scrollTop || 0)
            : (target.scrollTop || 0);
        this.syncScrollState(scrollTop);
    };
    target.addEventListener('scroll', this.scrollState.handler, { passive: true });
    this.scrollState.handler();
};

this.subscriptions = {
    appBarInfo: [this.fieldRender.renderData]
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
        [this.fieldRender.cssSelectors.action]: '@actionClicked'
    }
};
bindEvents(this, this.customEvents);
