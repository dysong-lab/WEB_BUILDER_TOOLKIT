const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

this._popupScope = null;
this._isOpen = false;
this._dragThreshold = 5;
this._x = 0;
this._y = 0;
this._startX = 0;
this._startY = 0;
this._originX = 0;
this._originY = 0;
this._isPointerDown = false;
this._isDraggingDetected = false;
this._surfaceEl = null;
this._handleEl = null;
this._pointerDownHandler = null;
this._pointerMoveHandler = null;
this._pointerUpHandler = null;
this._pointerCancelHandler = null;

applyShadowPopupMixin(this, {
    cssSelectors: {
        template: '#dialog-popup-template',
        overlay: '.dialog__overlay',
        surface: '.dialog__surface',
        handle: '.dialog__handle',
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
        this._handleEl = shadowRoot.querySelector('.dialog__handle');

        this._pointerDownHandler = this._handlePointerDown.bind(this);
        this._pointerMoveHandler = this._handlePointerMove.bind(this);
        this._pointerUpHandler = this._handlePointerUp.bind(this);
        this._pointerCancelHandler = this._handlePointerCancel.bind(this);

        if (this._handleEl) {
            this._handleEl.addEventListener('pointerdown', this._pointerDownHandler);
            this._handleEl.addEventListener('pointermove', this._pointerMoveHandler);
            this._handleEl.addEventListener('pointerup', this._pointerUpHandler);
            this._handleEl.addEventListener('pointercancel', this._pointerCancelHandler);
        }
    },
});

this._renderDialogInfo = function ({ response } = {}) {
    if (!this._popupScope?.fieldRender) return;
    this._popupScope.fieldRender.renderData({
        response: {
            icon: response?.icon ?? '↕',
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

this._clampPosition = function (nextX, nextY) {
    const margin = 8;
    const width = this._surfaceEl?.offsetWidth ?? 0;
    const height = this._surfaceEl?.offsetHeight ?? 0;
    const maxX = Math.max((window.innerWidth - width) / 2 - margin, 0);
    const maxY = Math.max((window.innerHeight - height) / 2 - margin, 0);
    return {
        x: Math.min(Math.max(nextX, -maxX), maxX),
        y: Math.min(Math.max(nextY, -maxY), maxY),
    };
};

this._applyTransform = function () {
    if (!this._surfaceEl) return;
    this._surfaceEl.style.transform = `translate3d(${this._x}px, ${this._y}px, 0)`;
};

this._handlePointerDown = function (event) {
    if (event.button !== 0) return;
    if (event.target.closest('.dialog__close-btn, .dialog__action')) return;
    this._isPointerDown = true;
    this._isDraggingDetected = false;
    this._startX = event.clientX;
    this._startY = event.clientY;
    this._originX = this._x;
    this._originY = this._y;
    if (this._handleEl?.setPointerCapture) {
        this._handleEl.setPointerCapture(event.pointerId);
    }
};

this._handlePointerMove = function (event) {
    if (!this._isPointerDown) return;
    const dx = event.clientX - this._startX;
    const dy = event.clientY - this._startY;
    if (!this._isDraggingDetected && Math.hypot(dx, dy) >= this._dragThreshold) {
        this._isDraggingDetected = true;
        if (this._surfaceEl) this._surfaceEl.dataset.dragging = 'true';
        Weventbus.emit('@dialogDragStart', {
            targetInstance: this,
            x: this._x,
            y: this._y,
        });
    }
    if (!this._isDraggingDetected) return;
    const next = this._clampPosition(this._originX + dx, this._originY + dy);
    this._x = next.x;
    this._y = next.y;
    this._applyTransform();
};

this._handlePointerUp = function (event) {
    if (!this._isPointerDown) return;
    this._isPointerDown = false;
    if (this._handleEl?.releasePointerCapture) {
        try { this._handleEl.releasePointerCapture(event.pointerId); } catch (_) {}
    }
    if (this._surfaceEl) this._surfaceEl.dataset.dragging = 'false';
    if (this._isDraggingDetected) {
        Weventbus.emit('@dialogDragEnd', {
            targetInstance: this,
            x: this._x,
            y: this._y,
        });
    }
    this._isDraggingDetected = false;
};

this._handlePointerCancel = function (event) {
    this._handlePointerUp(event);
};

this.setDialogPosition = function (x, y) {
    const next = this._clampPosition(Number(x) || 0, Number(y) || 0);
    this._x = next.x;
    this._y = next.y;
    this._applyTransform();
};

this.show = function () {
    this.shadowPopup.show();
    this._isOpen = true;
    this._applyTransform();
    Weventbus.emit('@dialogOpened', { targetInstance: this });
};

this.hide = function () {
    this.shadowPopup.hide();
    this._isOpen = false;
    this._x = 0;
    this._y = 0;
    if (this._surfaceEl) this._surfaceEl.dataset.dragging = 'false';
    this._applyTransform();
    Weventbus.emit('@dialogClosed', { targetInstance: this });
};

this._handleOpenTopic = function ({ response } = {}) {
    if (response?.open) this.show();
    else this.hide();
};

this._handlePositionTopic = function ({ response } = {}) {
    this.setDialogPosition(response?.x, response?.y);
};

this.subscriptions = {
    dialogInfo: [this._renderDialogInfo],
    dialogActions: [this._renderDialogActions],
    setDialogOpen: [this._handleOpenTopic],
    setDialogPosition: [this._handlePositionTopic],
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
