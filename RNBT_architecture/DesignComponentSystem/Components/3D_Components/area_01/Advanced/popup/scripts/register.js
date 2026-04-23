/**
 * area_01 — Advanced/popup / scripts / register
 *
 * MeshStateMixin + 3DShadowPopupMixin
 */

applyMeshStateMixin(this, {
    colorMap: {
        normal:  0x34d399,
        warning: 0xfbbf24,
        error:   0xf87171,
        offline: 0x6b7280
    }
});

this.subscriptions = {
    equipmentStatus: [this.meshState.renderData]
};

const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

const { htmlCode, cssCode } = this.properties.publishCode || {};
apply3DShadowPopupMixin(this, {
    getHTML: () => htmlCode || '',
    getStyles: () => cssCode || ''
});

const { bind3DEvents } = Wkit;
this.customEvents = { click: '@meshClicked' };
bind3DEvents(this, this.customEvents);

this.resolveMeshName = (event) => {
    if (!event.intersects || !event.intersects.length) return null;
    let current = event.intersects[0].object;
    while (current) {
        if (current.name) return current.name;
        current = current.parent;
    }
    return null;
};
