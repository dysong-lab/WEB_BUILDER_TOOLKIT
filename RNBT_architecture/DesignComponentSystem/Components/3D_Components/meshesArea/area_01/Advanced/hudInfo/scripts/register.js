/**
 * area_01 — Advanced/hudInfo / scripts / register
 *
 * MeshStateMixin + FieldRenderMixin + renderHud
 */

applyMeshStateMixin(this, {
    colorMap: {
        normal:  0x34d399,
        warning: 0xfbbf24,
        error:   0xf87171,
        offline: 0x6b7280
    }
});

applyFieldRenderMixin(this, {
    cssSelectors: {
        population: '.hud-population',
        assets:     '.hud-assets',
        stateLabel: '.hud-state',
        state:      '.hud-state'
    },
    datasetAttrs: {
        state: 'state'
    }
});

this.renderHud = ({ response: data }) => {
    if (!data) throw new Error('[FieldRenderMixin] data is null');
    if (!this.hudRoot || !Array.isArray(data)) return;

    const { cssSelectors, datasetAttrs, elementAttrs, styleAttrs } = this.fieldRender;

    const applyValue = (el, key, value) => {
        if (datasetAttrs[key]) {
            el.setAttribute('data-' + datasetAttrs[key], value);
        } else if (elementAttrs[key]) {
            el.setAttribute(elementAttrs[key], value);
        } else if (styleAttrs[key]) {
            const { property, unit = '' } = styleAttrs[key];
            el.style[property] = value + unit;
        } else {
            el.textContent = value;
        }
    };

    data.forEach((item) => {
        const meshName = item?.meshName;
        if (!meshName) return;

        const card = Array.from(this.hudRoot.querySelectorAll('[data-mesh-name]'))
            .find((el) => el.getAttribute('data-mesh-name') === meshName);
        if (!card) return;

        Object.entries(item).forEach(([key, value]) => {
            if (key === 'meshName' || value == null) return;
            if (!cssSelectors[key]) return;

            const el = card.querySelector(cssSelectors[key]);
            if (!el) return;

            applyValue(el, key, value);
        });
    });
};

this.subscriptions = {
    equipmentStatus: [this.meshState.renderData],
    zoneHud:         [this.renderHud]
};

const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);
