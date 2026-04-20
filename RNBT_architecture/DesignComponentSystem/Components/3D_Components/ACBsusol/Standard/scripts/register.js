/**
 * ACBsusol — Standard / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 8개 메시 색상 변경
 */

const MESH_NAMES = [
    'DDH016',
    'DDH017',
    'DDH018',
    'DDH019',
    'DDH020',
    'Line007',
    'Object237',
    'Rectangle074'
];

applyMeshStateMixin(this, {
    colorMap: {
        normal:  0x34d399,
        warning: 0xfbbf24,
        error:   0xf87171,
        offline: 0x6b7280
    }
});

const baseRenderData = this.meshState.renderData;

this.meshState.renderData = ({ response }) => {
    if (!Array.isArray(response)) return;

    const expanded = response.flatMap((item) =>
        MESH_NAMES.map((meshName) => ({
            meshName,
            status: item.status
        }))
    );

    baseRenderData({ response: expanded });
};

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
