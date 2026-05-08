const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

this._popupScope = null;
this._isOpen = false;
this._isFullscreen = false;
this._forceFullscreen = null;
this._breakpoint = 600;
this._mediaQuery = null;
this._mediaListener = null;

applyShadowPopupMixin(this, {
    cssSelectors: {
        template: '#dialog-popup-template',
        overlay: '.dialog__overlay',
        surface: '.dialog__surface',
        closeBtn: '.dialog__close-btn',
    },
    onCreated: (shadowRoot) => {
        this._popupScope = { appendElement: shadowRoot };

        applyFieldRenderMixin(this._popupScope, {
            cssSelectors: {
                icon: '.dialog__icon',
                headline: '.dialog__headline',
                supporting: '.dialog__supporting',
            },
        });

        applyListRenderMixin(this._popupScope, {
            cssSelectors: {
                container: '.dialog__actions',
                template: '#dialog-action-template',
                actionid: '.dialog__action',
                actionLabel: '.dialog__action-label',
            },
            itemKey: 'actionid',
            datasetAttrs: {
                actionid: 'actionid',
            },
        });
    },
});

this._renderDialogInfo = function ({ response } = {}) {
    if (!this._popupScope?.fieldRender) return;
    this._popupScope.fieldRender.renderData({
        response: {
            icon: response?.icon ?? '✦',
            headline: response?.headline ?? '',
            supporting: response?.supporting ?? '',
        },
    });
};

this._renderDialogActions = function ({ response } = {}) {
    if (!this._popupScope?.listRender) return;
    const actions = Array.isArray(response) ? response : [];
    this._popupScope.listRender.renderData({
        response: actions.map((action) => ({
            actionid: String(action?.actionid ?? ''),
            actionLabel: String(action?.actionLabel ?? ''),
        })),
    });
};

this._evaluateFullscreen = function () {
    if (typeof this._forceFullscreen === 'boolean') return this._forceFullscreen;
    return Boolean(this._mediaQuery?.matches);
};

this._applyFullscreenState = function (reason = 'breakpoint') {
    const next = this._evaluateFullscreen();
    const surface = this.shadowPopup?.query(this.shadowPopup.cssSelectors.surface);
    if (!surface) return next;

    surface.dataset.fullscreen = next ? 'true' : 'false';
    surface.classList.toggle('is-fullscreen', next);

    if (this._isFullscreen !== next) {
        this._isFullscreen = next;
        Weventbus.emit('@dialogFullscreenChanged', {
            targetInstance: this,
            isFullscreen: next,
            reason,
        });
    }

    return next;
};

this._handleMediaChange = function () {
    this._applyFullscreenState('breakpoint');
};

this.setForceFullscreen = function (value) {
    if (value !== null && typeof value !== 'boolean') return;
    this._forceFullscreen = value;
    this._applyFullscreenState('force');
};

this._handleForceTopic = function ({ response } = {}) {
    this.setForceFullscreen(response?.force ?? null);
};

this.show = function () {
    this.shadowPopup.show();
    this._isOpen = true;
    this._applyFullscreenState('breakpoint');
    Weventbus.emit('@dialogOpened', {
        targetInstance: this,
        isFullscreen: this._isFullscreen,
    });
};

this.hide = function () {
    this.shadowPopup.hide();
    this._isOpen = false;
    Weventbus.emit('@dialogClosed', { targetInstance: this });
};

this._handleOpenTopic = function ({ response } = {}) {
    if (response?.open) this.show();
    else this.hide();
};

this.subscriptions = {
    dialogInfo: [this._renderDialogInfo],
    dialogActions: [this._renderDialogActions],
    setDialogOpen: [this._handleOpenTopic],
    setForceFullscreen: [this._handleForceTopic],
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) => each((handler) => subscribe(topic, this, handler), handlers)),
);

this._mediaQuery = window.matchMedia(`(max-width: ${this._breakpoint - 1}px)`);
this._mediaListener = this._handleMediaChange.bind(this);
if (this._mediaQuery.addEventListener) {
    this._mediaQuery.addEventListener('change', this._mediaListener);
} else {
    this._mediaQuery.addListener(this._mediaListener);
}

this.shadowPopup.bindPopupEvents({
    click: {
        [this.shadowPopup.cssSelectors.closeBtn]: () => {
            Weventbus.emit('@dialogClose', { targetInstance: this });
        },
        '.dialog__action': (event) => {
            Weventbus.emit('@dialogActionClicked', { event, targetInstance: this });
        },
    },
});
