/**
 * LPRInOut — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 단일 Mesh 'LPRInOut'의 material 색상 변경
 *
 * GLTF 내부 구조: root(scale 1000x) → Mesh 'LPRInOut' (단일, Material 'LPRInOut')
 * 폴더/컴포넌트 이름(`LPRInOut`)과 GLTF Node/Mesh 이름(`LPRInOut`)의 대소문자가 동일하다.
 * 구독 데이터의 meshName은 반드시 'LPRInOut'이어야 하며, MeshStateMixin이 getObjectByName으로 해석한다.
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
