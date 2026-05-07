const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

applyListRenderMixin(this, {
    cssSelectors: {
        group: '.card-selectable',
        container: '.card-selectable__list',
        template: '#card-selectable-item-template',
        item: '.card-selectable__item',
        actionId: '.card-selectable__item',
        icon: '.card-selectable__icon',
        title: '.card-selectable__title',
        summary: '.card-selectable__summary'
    },
    datasetAttrs: {
        actionId: 'action-id'
    },
    itemKey: 'actionId'
});

this._selectedIds = new Set();
this._groupClickHandler = null;

this._applySelection = () => {
    const items = this.appendElement.querySelectorAll(this.listRender.cssSelectors.item);
    items.forEach((itemEl) => {
        const id = itemEl.dataset.actionId;
        const selected = this._selectedIds.has(id);
        itemEl.dataset.selected = String(selected);
        itemEl.setAttribute('aria-selected', String(selected));
    });

    const groupEl = this.appendElement.querySelector(this.listRender.cssSelectors.group);
    if (groupEl) {
        groupEl.dataset.selectedCount = String(this._selectedIds.size);
    }
};

this._setSelected = (id, action) => {
    if (!id) return;
    const exists = this.appendElement.querySelector(
        this.listRender.cssSelectors.item + '[data-action-id="' + id + '"]'
    );
    if (!exists) return;

    const wasSelected = this._selectedIds.has(id);
    let next = wasSelected;

    if (action === 'on') next = true;
    else if (action === 'off') next = false;
    else next = !wasSelected;

    if (next === wasSelected) return;

    if (next) this._selectedIds.add(id);
    else this._selectedIds.delete(id);

    this._applySelection();

    Weventbus.emit('@cardSelected', {
        targetInstance: this,
        selectedIds: [...this._selectedIds],
        changedId: id,
        changedTo: next ? 'on' : 'off'
    });
};

this._renderItems = ({ response }) => {
    const items = Array.isArray(response) ? response : [];
    this._selectedIds = new Set();

    this.listRender.renderData({
        response: items.map((item) => {
            const normalizedId = String(item.id);
            if (item.selected) this._selectedIds.add(normalizedId);
            return {
                actionId: normalizedId,
                icon: item.icon || 'deployed_code',
                title: item.title,
                summary: item.summary
            };
        })
    });

    this._applySelection();
};

this._setSelectedFromTopic = ({ response }) => {
    const ids = Array.isArray(response?.ids) ? response.ids.map(String) : [];
    this._selectedIds = new Set(ids);
    this._applySelection();
    Weventbus.emit('@cardSelected', {
        targetInstance: this,
        selectedIds: [...this._selectedIds],
        changedId: null,
        changedTo: 'bulk'
    });
};

this._handleSelect = (event) => {
    const itemEl = event.target.closest(this.listRender.cssSelectors.item);
    if (!itemEl) return;
    this._setSelected(itemEl.dataset.actionId, 'toggle');
};

this.subscriptions = {
    cardsList: [this._renderItems],
    setSelectedCards: [this._setSelectedFromTopic]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

this._groupClickHandler = this._handleSelect.bind(this);
this.appendElement
    .querySelector(this.listRender.cssSelectors.container)
    .addEventListener('click', this._groupClickHandler);
