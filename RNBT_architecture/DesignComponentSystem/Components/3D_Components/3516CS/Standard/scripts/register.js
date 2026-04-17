/**
 * 3516CS — 01_status / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 3516CS 장비 메시 색상 변경
 * meshName: 3516B_01, 3516B_02_A, 3516B_05, 3516B_Wing
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
