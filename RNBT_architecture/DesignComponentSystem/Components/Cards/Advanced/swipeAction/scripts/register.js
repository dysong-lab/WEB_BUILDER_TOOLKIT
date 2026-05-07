const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

applyFieldRenderMixin(this, {
    cssSelectors: {
        card: '.card-swipe',
        face: '.card-swipe__face',
        icon: '.card-swipe__icon',
        title: '.card-swipe__title',
        summary: '.card-swipe__summary',
        action: '.card-swipe__action'
    }
});

this._revealThreshold = 80;
this._dragThreshold = 5;
this._offsetX = 0;
this._startX = 0;
this._originX = 0;
this._revealedSide = null;
this._revealedOffsetLeft = 96;
this._revealedOffsetRight = 96;
this._isPointerDown = false;
this._isDraggingDetected = false;
this._cardId = null;

this._renderCardInfo = ({ response }) => {
    this._cardId = response?.id != null ? String(response.id) : this.id;
    this.fieldRender.renderData({ response });
};

this._applyOffset = () => {
    const faceEl = this.appendElement.querySelector(this.fieldRender.cssSelectors.face);
    if (faceEl) {
        faceEl.style.transform = 'translate3d(' + this._offsetX + 'px, 0, 0)';
    }
};

this._close = () => {
    this._offsetX = 0;
    this._revealedSide = null;
    this._applyOffset();
    const cardEl = this.appendElement.querySelector(this.fieldRender.cssSelectors.card);
    if (cardEl) {
        cardEl.dataset.revealedSide = 'none';
        cardEl.dataset.swiping = 'false';
    }
};

this._settle = () => {
    const cardEl = this.appendElement.querySelector(this.fieldRender.cssSelectors.card);
    if (this._offsetX <= -this._revealThreshold) {
        this._offsetX = -this._revealedOffsetRight;
        this._revealedSide = 'right';
    } else if (this._offsetX >= this._revealThreshold) {
        this._offsetX = this._revealedOffsetLeft;
        this._revealedSide = 'left';
    } else {
        return this._close();
    }

    this._applyOffset();
    if (cardEl) {
        cardEl.dataset.revealedSide = this._revealedSide;
        cardEl.dataset.swiping = 'false';
    }
};

this._handleExternalClose = () => this._close();

this._handlePointerDown = (event) => {
    if (event.button !== 0) return;
    const faceEl = event.target.closest(this.fieldRender.cssSelectors.face);
    if (!faceEl) return;

    this._isPointerDown = true;
    this._isDraggingDetected = false;
    this._startX = event.clientX;
    this._originX = this._offsetX;

    const cardEl = this.appendElement.querySelector(this.fieldRender.cssSelectors.card);
    if (cardEl) cardEl.dataset.swiping = 'false';
};

this._handlePointerMove = (event) => {
    if (!this._isPointerDown) return;
    const dx = event.clientX - this._startX;
    if (Math.abs(dx) >= this._dragThreshold) {
        this._isDraggingDetected = true;
        const cardEl = this.appendElement.querySelector(this.fieldRender.cssSelectors.card);
        if (cardEl) cardEl.dataset.swiping = 'true';
    }

    this._offsetX = this._originX + dx;
    this._applyOffset();
};

this._handlePointerUp = (event) => {
    if (!this._isPointerDown) return;
    this._isPointerDown = false;

    const faceEl = event.target.closest(this.fieldRender.cssSelectors.face);
    if (!this._isDraggingDetected) {
        if (this._revealedSide) {
            this._close();
        } else if (faceEl) {
            Weventbus.emit('@cardClicked', { targetInstance: this, cardId: this._cardId || this.id });
        }
        return;
    }

    this._settle();
};

this._handlePointerCancel = () => {
    this._isPointerDown = false;
    this._close();
};

this._handleClickCapture = (event) => {
    if (!this._isDraggingDetected) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    this._isDraggingDetected = false;
};

this._handleActionClick = (event) => {
    const actionEl = event.target.closest(this.fieldRender.cssSelectors.action);
    if (!actionEl) return;

    Weventbus.emit('@swipeActionClicked', {
        targetInstance: this,
        actionId: actionEl.dataset.actionid,
        cardId: this._cardId || this.id
    });
    this._close();
};

this.subscriptions = {
    cardInfo: [this._renderCardInfo],
    closeSwipe: [this._handleExternalClose]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

this._boundPointerDown = this._handlePointerDown.bind(this);
this._boundPointerMove = this._handlePointerMove.bind(this);
this._boundPointerUp = this._handlePointerUp.bind(this);
this._boundPointerCancel = this._handlePointerCancel.bind(this);
this._boundClickCapture = this._handleClickCapture.bind(this);
this._boundActionClick = this._handleActionClick.bind(this);

this.appendElement.addEventListener('pointerdown', this._boundPointerDown);
this.appendElement.addEventListener('pointermove', this._boundPointerMove);
this.appendElement.addEventListener('pointerup', this._boundPointerUp);
this.appendElement.addEventListener('pointercancel', this._boundPointerCancel);
this.appendElement.addEventListener('click', this._boundClickCapture, true);
this.appendElement.addEventListener('click', this._boundActionClick);
