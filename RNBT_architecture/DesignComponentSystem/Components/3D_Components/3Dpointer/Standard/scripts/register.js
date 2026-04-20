/**
 * 3Dpointer — Standard / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 "geo", "sphere_A" 메시 색상 변경
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
    equipmentStatus: [({ response }) => {
        if (!Array.isArray(response)) return;

        response.forEach((item) => {
            this.meshState.setMeshState('geo', item.status);
            this.meshState.setMeshState('sphere_A', item.status);
        });
    }]
};

const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);
