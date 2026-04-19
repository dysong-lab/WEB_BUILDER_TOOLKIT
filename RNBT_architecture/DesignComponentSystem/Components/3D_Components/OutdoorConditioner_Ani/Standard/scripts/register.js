/**
 * OutdoorConditioner_Ani — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 'winConditioner', 'metalFan03', 'metalFan04' 세 Mesh의 material 색상 변경
 *
 * GLTF 구조: root(scale [1000,1000,1000]) → winConditioner(mesh 0) + metalFan03(mesh 1) + metalFan04(mesh 2).
 * 세 자식 Node 모두 rotation [0, -0.7071068, 0, 0.7071067](Y축 +90도 쿼터니언)과 scale 0.15 적용.
 * 폴더명(OutdoorConditioner_Ani)과 GLTF 내부 Node/Mesh 이름이 다르므로
 * 페이지에서 실제 Mesh 이름 'winConditioner', 'metalFan03', 'metalFan04'로 발행한다
 * (HumanSymbol_Ani 선례와 동일한 명명 불일치 패턴).
 *
 * Material: winConditioner = Material #42064(textures/OutdoorConditioner.jpg),
 *           metalFan03·metalFan04 = Material #42066(textures/fan.jpg, 공유).
 * MeshStateMixin은 각 Mesh 단위로 material을 clone하여 color를 적용하므로
 * 팬 간 material 공유에도 불구하고 개별 색상 제어가 가능하다.
 *
 * GLTF에 'Ani01' 애니메이션 클립(metalFan03·metalFan04 rotation 41 keyframes)이
 * 포함되어 있으나 Standard에서는 재생하지 않는다 — Advanced(animation) 변형에서 처리.
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
