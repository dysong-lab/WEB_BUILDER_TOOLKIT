const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyListRenderMixin(this, {
    cssSelectors: {
        container: '.checkbox-group',
        template:  '#checkbox-item-template',
        item:      '.checkbox-item',
        id:        '.checkbox-item',
        checked:   '.checkbox-item',
        disabled:  '.checkbox-item',
        label:     '.checkbox-item__label',
    },
    itemKey: 'id',
    datasetAttrs: {
        id:       'id',
        checked:  'checked',
        disabled: 'disabled',
    },
});

this.toggleItem = function (id) {
    const target = this.appendElement.querySelector(
        `${this.listRender.cssSelectors.item}[data-id="${String(id)}"]`,
    );
    if (!target || target.dataset.disabled === 'true') return;

    target.setAttribute(
        'data-checked',
        target.dataset.checked === 'true' ? 'false' : 'true',
    );
};

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    checkboxItems: [this.listRender.renderData],
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
        [this.listRender.cssSelectors.item]: '@checkboxChanged',
    },
};
bindEvents(this, this.customEvents);
