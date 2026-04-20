/**
 * 3516CS — Standard / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 4개 메시 색상 변경
 */

const MESH_NAMES = ['3516B_01', '3516B_02_A', '3516B_05', '3516B_Wing'];

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
