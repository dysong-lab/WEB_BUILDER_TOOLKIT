const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

applyListRenderMixin(this, {
    cssSelectors: {
        container: '.card-sortable__list',
        template: '#card-sortable-item-template',
        item: '.card-sortable__item',
        actionId: '.card-sortable__item',
        icon: '.card-sortable__icon',
        title: '.card-sortable__title',
        summary: '.card-sortable__summary'
    },
    datasetAttrs: {
        actionId: 'action-id'
    },
    itemKey: 'actionId'
});

this._currentOrder = [];
this._currentItems = [];
this._draggingId = null;

this._renderItems = ({ response }) => {
    const items = Array.isArray(response) ? response : [];
    this._currentItems = items.map(item => ({ ...item, id: String(item.id) }));
    this._currentOrder = this._currentItems.map(item => item.id);
    this.listRender.renderData({
        response: this._currentItems.map(item => ({
            actionId: item.id,
            icon: item.icon || 'drag_indicator',
            title: item.title,
            summary: item.summary
        }))
    });
};

this._clearDragState = () => {
    this.appendElement.querySelectorAll(this.listRender.cssSelectors.item).forEach((el) => {
        delete el.dataset.dragState;
        delete el.dataset.dragTarget;
    });
    this._draggingId = null;
};

this._emitReorder = (movedId, fromIndex, toIndex) => {
    Weventbus.emit('@cardReordered', {
        targetInstance: this,
        newOrder: [...this._currentOrder],
        movedId,
        fromIndex,
        toIndex
    });
};

this._handleDragStart = (event) => {
    const itemEl = event.target.closest(this.listRender.cssSelectors.item);
    if (!itemEl || !event.dataTransfer) return;
    this._draggingId = itemEl.dataset.actionId;
    event.dataTransfer.setData('text/plain', this._draggingId);
    event.dataTransfer.effectAllowed = 'move';
    itemEl.dataset.dragState = 'dragging';
};

this._handleDragOver = (event) => {
    const targetEl = event.target.closest(this.listRender.cssSelectors.item);
    if (!targetEl || !this._draggingId || targetEl.dataset.actionId === this._draggingId) return;
    event.preventDefault();

    const box = targetEl.getBoundingClientRect();
    const direction = event.clientY < box.top + box.height / 2 ? 'above' : 'below';

    this.appendElement.querySelectorAll(this.listRender.cssSelectors.item).forEach((el) => {
        if (el !== targetEl) delete el.dataset.dragTarget;
    });

    targetEl.dataset.dragTarget = direction;
};

this._handleDragLeave = (event) => {
    const targetEl = event.target.closest(this.listRender.cssSelectors.item);
    if (targetEl) delete targetEl.dataset.dragTarget;
};

this._handleDrop = (event) => {
    event.preventDefault();
    const targetEl = event.target.closest(this.listRender.cssSelectors.item);
    if (!targetEl || !this._draggingId) return;

    const movedId = this._draggingId;
    const fromIndex = this._currentOrder.indexOf(movedId);
    const targetId = targetEl.dataset.actionId;
    let toIndex = this._currentOrder.indexOf(targetId);
    if (fromIndex === -1 || toIndex === -1) return this._clearDragState();

    const direction = targetEl.dataset.dragTarget === 'below' ? 1 : 0;
    const nextOrder = [...this._currentOrder];
    nextOrder.splice(fromIndex, 1);
    if (fromIndex < toIndex) toIndex -= 1;
    toIndex += direction;
    nextOrder.splice(toIndex, 0, movedId);

    if (fromIndex !== toIndex) {
        this._currentOrder = nextOrder;
        this._currentItems.sort((a, b) => this._currentOrder.indexOf(a.id) - this._currentOrder.indexOf(b.id));
        this._renderItems({ response: this._currentItems });
        this._emitReorder(movedId, fromIndex, toIndex);
    }

    this._clearDragState();
};

this._handleDragEnd = () => this._clearDragState();

this.subscriptions = {
    cardsList: [this._renderItems]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

this.customEvents = {
    click: {
        [this.listRender.cssSelectors.item]: '@cardClicked'
    }
};
bindEvents(this, this.customEvents);

this._boundDragStart = this._handleDragStart.bind(this);
this._boundDragOver = this._handleDragOver.bind(this);
this._boundDragLeave = this._handleDragLeave.bind(this);
this._boundDrop = this._handleDrop.bind(this);
this._boundDragEnd = this._handleDragEnd.bind(this);

this.appendElement.addEventListener('dragstart', this._boundDragStart);
this.appendElement.addEventListener('dragover', this._boundDragOver);
this.appendElement.addEventListener('dragleave', this._boundDragLeave);
this.appendElement.addEventListener('drop', this._boundDrop);
this.appendElement.addEventListener('dragend', this._boundDragEnd);
