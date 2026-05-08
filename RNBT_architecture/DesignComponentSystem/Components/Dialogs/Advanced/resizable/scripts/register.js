const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

this._popupScope = null;
this._isOpen = false;
this._minWidth = 320;
this._minHeight = 200;
this._maxWidth = null;
this._maxHeight = null;
this._startX = 0;
this._startY = 0;
this._originW = 0;
this._originH = 0;
this._isPointerDown = false;
this._resizeDirection = null;
this._pointerId = null;
this._surfaceEl = null;
this._handleEls = null;
this._pointerDownHandler = null;
this._pointerMoveHandler = null;
this._pointerUpHandler = null;
this._pointerCancelHandler = null;

applyShadowPopupMixin(this, {
    cssSelectors: {
        template: '#dialog-popup-template',
        overlay: '.dialog__overlay',
        surface: '.dialog__surface',
        resizeHandleSE: '.dialog__resize-handle[data-direction="se"]',
        resizeHandleS: '.dialog__resize-handle[data-direction="s"]',
        resizeHandleE: '.dialog__resize-handle[data-direction="e"]',
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

        this._surfaceEl = shadowRoot.querySelector('.dialog__surface');
        this._handleEls = new Map([
            ['se', shadowRoot.querySelector('.dialog__resize-handle[data-direction="se"]')],
            ['s', shadowRoot.querySelector('.dialog__resize-handle[data-direction="s"]')],
            ['e', shadowRoot.querySelector('.dialog__resize-handle[data-direction="e"]')],
        ]);

        this._pointerDownHandler = this._handlePointerDown.bind(this);
        this._pointerMoveHandler = this._handlePointerMove.bind(this);
        this._pointerUpHandler = this._handlePointerUp.bind(this);
        this._pointerCancelHandler = this._handlePointerCancel.bind(this);

        this._handleEls.forEach((el) => {
            if (!el) return;
            el.addEventListener('pointerdown', this._pointerDownHandler);
            el.addEventListener('pointermove', this._pointerMoveHandler);
            el.addEventListener('pointerup', this._pointerUpHandler);
            el.addEventListener('pointercancel', this._pointerCancelHandler);
        });
    },
});

this._renderDialogInfo = function ({ response } = {}) {
    if (!this._popupScope?.fieldRender) return;
    this._popupScope.fieldRender.renderData({
        response: {
            icon: response?.icon ?? '▣',
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

this._clampSize = function (width, height) {
    const margin = 16;
    const maxWidth = this._maxWidth ?? (window.innerWidth - margin * 2);
    const maxHeight = this._maxHeight ?? (window.innerHeight - margin * 2);
    return {
        width: Math.min(Math.max(width, this._minWidth), maxWidth),
        height: Math.min(Math.max(height, this._minHeight), maxHeight),
    };
};

this._applySize = function (width = this._originW, height = this._originH) {
    if (!this._surfaceEl) return;
    this._surfaceEl.style.width = `${width}px`;
    this._surfaceEl.style.height = `${height}px`;
};

this._handlePointerDown = function (event) {
    if (event.button !== 0) return;
    this._isPointerDown = true;
    this._pointerId = event.pointerId;
    this._resizeDirection = event.currentTarget?.dataset.direction || null;
    this._startX = event.clientX;
    this._startY = event.clientY;
    this._originW = this._surfaceEl?.offsetWidth ?? 448;
    this._originH = this._surfaceEl?.offsetHeight ?? 280;
    if (this._surfaceEl) this._surfaceEl.dataset.resizing = 'true';
    if (event.currentTarget?.setPointerCapture) {
        event.currentTarget.setPointerCapture(event.pointerId);
    }
    Weventbus.emit('@dialogResizeStart', {
        targetInstance: this,
        width: this._originW,
        height: this._originH,
    });
};

this._handlePointerMove = function (event) {
    if (!this._isPointerDown || !this._resizeDirection) return;
    const dx = event.clientX - this._startX;
    const dy = event.clientY - this._startY;
    let width = this._originW;
    let height = this._originH;
    if (this._resizeDirection === 'se' || this._resizeDirection === 'e') {
        width += dx;
    }
    if (this._resizeDirection === 'se' || this._resizeDirection === 's') {
        height += dy;
    }
    const next = this._clampSize(width, height);
    this._applySize(next.width, next.height);
};

this._handlePointerUp = function (event) {
    if (!this._isPointerDown) return;
    this._isPointerDown = false;
    if (this._surfaceEl) this._surfaceEl.dataset.resizing = 'false';
    if (event.currentTarget?.releasePointerCapture) {
        try { event.currentTarget.releasePointerCapture(event.pointerId); } catch (_) {}
    }
    Weventbus.emit('@dialogResizeEnd', {
        targetInstance: this,
        width: this._surfaceEl?.offsetWidth ?? this._originW,
        height: this._surfaceEl?.offsetHeight ?? this._originH,
    });
    this._resizeDirection = null;
    this._pointerId = null;
};

this._handlePointerCancel = function (event) {
    this._handlePointerUp(event);
};

this.setDialogSize = function (width, height) {
    const next = this._clampSize(Number(width) || this._minWidth, Number(height) || this._minHeight);
    this._applySize(next.width, next.height);
};

this.show = function () {
    this.shadowPopup.show();
    this._isOpen = true;
    Weventbus.emit('@dialogOpened', { targetInstance: this });
};

this.hide = function () {
    this.shadowPopup.hide();
    this._isOpen = false;
    if (this._surfaceEl) {
        this._surfaceEl.dataset.resizing = 'false';
        this._surfaceEl.style.width = '';
        this._surfaceEl.style.height = '';
    }
    Weventbus.emit('@dialogClosed', { targetInstance: this });
};

this._handleOpenTopic = function ({ response } = {}) {
    if (response?.open) this.show();
    else this.hide();
};

this._handleSizeTopic = function ({ response } = {}) {
    this.setDialogSize(response?.width, response?.height);
};

this.subscriptions = {
    dialogInfo: [this._renderDialogInfo],
    dialogActions: [this._renderDialogActions],
    setDialogOpen: [this._handleOpenTopic],
    setDialogSize: [this._handleSizeTopic],
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) => each((handler) => subscribe(topic, this, handler), handlers)),
);

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
