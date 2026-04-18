/**
 * LV01 — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 본체 'LV01'과 유리 커버 'glass_A' 두 Mesh의 material 색상 변경
 *
 * GLTF 구조: scene → root(scale=1000) → [ "LV01"(mesh 0) , "glass_A"(mesh 1) ]
 * 구독 데이터의 meshName은 'LV01' 또는 'glass_A' 이어야 하며,
 * MeshStateMixin이 각각에 대해 getObjectByName으로 해석한다.
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
