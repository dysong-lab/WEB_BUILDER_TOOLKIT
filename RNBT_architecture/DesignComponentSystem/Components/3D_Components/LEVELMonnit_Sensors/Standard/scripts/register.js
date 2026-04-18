/**
 * LEVELMonnit_Sensors — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 단일 Mesh 'LEVELMonnit_Sensors'의 material 색상 변경
 *
 * GLTF 내부 구조: root → Mesh 'LEVELMonnit_Sensors' (단일 Mesh, Material #36)
 * 폴더명/컴포넌트명/GLTF Mesh 이름이 모두 'LEVELMonnit_Sensors'로 일치한다.
 * MeshStateMixin은 단일 Mesh를 받아 material을 clone 후 color를 적용한다.
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
