/**
 * area_01 — Advanced/highlight / scripts / register
 *
 * MeshStateMixin + MeshHighlightMixin
 */

applyMeshStateMixin(this, {
    colorMap: {
        normal:  0x34d399,
        warning: 0xfbbf24,
        error:   0xf87171,
        offline: 0x6b7280
    }
});

applyMeshHighlightMixin(this, {
    highlightColor:     0xffff00,
    highlightIntensity: 0.3
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
