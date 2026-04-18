/**
 * HumanSymbol_Ani — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 "symbol", "circle_A" 두 Mesh의 material 색상 변경
 *
 * GLTF 내부 구조: root(scale 1000x) → symbol Mesh + circle_A Mesh
 * 폴더명(HumanSymbol_Ani)과 GLTF 내부 Node/Mesh 이름이 다르므로
 * 실제 Mesh 이름인 'symbol', 'circle_A'를 사용한다.
 *
 * GLTF에 'All Animations' 애니메이션 클립이 포함되어 있으나
 * Standard에서는 재생하지 않는다 — Advanced(animation) 변형에서 처리.
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
