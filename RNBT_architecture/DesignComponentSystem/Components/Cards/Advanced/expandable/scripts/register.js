const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

applyFieldRenderMixin(this, {
    cssSelectors: {
        card: '.card-expandable',
        icon: '.card-expandable__icon',
        headline: '.card-expandable__headline',
        subhead: '.card-expandable__subhead',
        summary: '.card-expandable__summary',
        details: '.card-expandable__details-text',
        toggle: '.card-expandable__toggle',
        action: '.card-expandable__action'
    }
});

this._isExpanded = false;
this._cardId = null;
this._toggleHandler = null;

this._renderCardInfo = ({ response }) => {
    this._cardId = response?.id != null ? String(response.id) : this.id;
    this.fieldRender.renderData({ response });
};

this._setExpanded = (next) => {
    const normalized = Boolean(next);
    if (this._isExpanded === normalized) return;

    this._isExpanded = normalized;

    const cardEl = this.appendElement.querySelector(this.fieldRender.cssSelectors.card);
    if (cardEl) {
        cardEl.dataset.expanded = String(normalized);
    }

    Weventbus.emit(normalized ? '@cardExpanded' : '@cardCollapsed', {
        targetInstance: this,
        cardId: this._cardId || this.id
    });
};

this._expand = () => this._setExpanded(true);
this._collapse = () => this._setExpanded(false);
this.setExpanded = (value) => this._setExpanded(value);

this._handleExternalSet = ({ response }) => {
    this._setExpanded(response?.expanded);
};

this._handleToggle = (event) => {
    const actionEl = event.target.closest(this.fieldRender.cssSelectors.action);
    if (actionEl) return;

    const toggleEl = event.target.closest(this.fieldRender.cssSelectors.toggle);
    const cardEl = event.target.closest(this.fieldRender.cssSelectors.card);

    if (!toggleEl && !cardEl) return;

    this._setExpanded(!this._isExpanded);
};

this.subscriptions = {
    cardInfo: [this._renderCardInfo],
    setExpanded: [this._handleExternalSet]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

this.customEvents = {
    click: {
        [this.fieldRender.cssSelectors.action]: '@cardActionClicked'
    }
};
bindEvents(this, this.customEvents);

this._toggleHandler = this._handleToggle.bind(this);
this.appendElement.addEventListener('click', this._toggleHandler);
