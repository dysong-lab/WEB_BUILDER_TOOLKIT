const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

applyListRenderMixin(this, {
    cssSelectors: {
        container: '.radio-group',
        template: '#radio-item-template',
        item: '.radio-item',
        id: '.radio-item',
        selected: '.radio-item',
        disabled: '.radio-item',
        label: '.radio-item__label',
    },
    itemKey: 'id',
    datasetAttrs: {
        id: 'id',
        selected: 'selected',
        disabled: 'disabled',
    },
});

this._radioKeydownHandler = null;

this.getItemElement = function (id) {
    return this.appendElement.querySelector(
        `${this.listRender.cssSelectors.item}[data-id="${String(id)}"]`,
    );
};

this.syncAccessibility = function () {
    const items = Array.from(
        this.appendElement.querySelectorAll(this.listRender.cssSelectors.item),
    );
    const selectedItem = items.find(item => item.dataset.selected === 'true');
    const firstEnabledItem = items.find(item => item.dataset.disabled !== 'true');
    const focusTarget = selectedItem || firstEnabledItem || null;

    items.forEach((item) => {
        const isSelected = item.dataset.selected === 'true';
        const isDisabled = item.dataset.disabled === 'true';

        item.setAttribute('role', 'radio');
        item.setAttribute('aria-checked', isSelected ? 'true' : 'false');
        item.setAttribute('aria-disabled', isDisabled ? 'true' : 'false');
        item.setAttribute(
            'tabindex',
            !isDisabled && item === focusTarget ? '0' : '-1',
        );
    });
};

this.selectItem = function (id) {
    const target = this.getItemElement(id);
    if (!target || target.dataset.disabled === 'true') return;

    const items = this.appendElement.querySelectorAll(this.listRender.cssSelectors.item);
    items.forEach((item) => {
        item.setAttribute(
            'data-selected',
            item.dataset.id === String(id) ? 'true' : 'false',
        );
    });

    this.syncAccessibility();
};

this.selectAdjacent = function (step) {
    const items = Array.from(
        this.appendElement.querySelectorAll(this.listRender.cssSelectors.item),
    ).filter(item => item.dataset.disabled !== 'true');

    if (!items.length) return;

    const currentIndex = items.findIndex(item => item.dataset.selected === 'true');
    const startIndex = currentIndex >= 0 ? currentIndex : 0;
    const nextIndex = (startIndex + step + items.length) % items.length;
    const target = items[nextIndex];

    if (!target?.dataset.id) return null;
    this.selectItem(target.dataset.id);
    target.focus();
    return target.dataset.id;
};

this.renderRadioItems = function ({ response } = {}) {
    const items = Array.isArray(response) ? response : [];
    const normalized = items.map((item = {}) => ({
        id: item.id == null ? '' : String(item.id),
        label: item.label || '',
        selected: item.selected === 'true' ? 'true' : 'false',
        disabled: item.disabled === 'true' ? 'true' : 'false',
    }));

    const hasSelected = normalized.some(item => item.selected === 'true');
    if (!hasSelected) {
        const firstEnabled = normalized.find(item => item.disabled !== 'true');
        if (firstEnabled) firstEnabled.selected = 'true';
    }

    this.listRender.renderData({ response: normalized });

    const group = this.appendElement.querySelector(this.listRender.cssSelectors.container);
    if (group) {
        group.setAttribute('role', 'radiogroup');
        group.setAttribute('aria-label', group.getAttribute('aria-label') || 'Radio options');
    }

    this.syncAccessibility();
};

this._radioKeydownHandler = (event) => {
    const item = event.target.closest(this.listRender.cssSelectors.item);
    if (!item || !this.appendElement.contains(item)) return;
    if (item.dataset.disabled === 'true') return;

    if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        Weventbus.emit('@radioChanged', { event, targetInstance: this });
        return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        event.preventDefault();
        const itemId = this.selectAdjacent(1);
        if (itemId) Weventbus.emit('@radioChanged', { event, targetInstance: this, itemId });
        return;
    }

    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        event.preventDefault();
        const itemId = this.selectAdjacent(-1);
        if (itemId) Weventbus.emit('@radioChanged', { event, targetInstance: this, itemId });
    }
};

this.appendElement.addEventListener('keydown', this._radioKeydownHandler);

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    radioItems: [this.renderRadioItems],
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {
    click: {
        [this.listRender.cssSelectors.item]: '@radioChanged',
    },
};
bindEvents(this, this.customEvents);
