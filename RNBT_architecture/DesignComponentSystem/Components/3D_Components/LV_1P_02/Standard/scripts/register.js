/**
 * LV_1P_02 — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 Mesh 'LV-J1'의 material 색상 변경
 *
 * GLTF 구조: scene → "LV-J1"(mesh 0). 라이트 메타 Node는 없음.
 * 폴더/컴포넌트 이름(LV_1P_02)과 GLTF Node/Mesh 이름(LV-J1)이 다르므로
 * 구독 데이터의 meshName은 반드시 'LV-J1' 이어야 한다.
 * MeshStateMixin이 getObjectByName('LV-J1')으로 해석한다.
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
