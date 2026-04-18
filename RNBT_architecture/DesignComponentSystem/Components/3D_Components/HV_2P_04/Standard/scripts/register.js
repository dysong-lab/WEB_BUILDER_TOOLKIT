/**
 * HV_2P_04 — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 "HV-M7-U" Mesh의 material 색상 변경
 * (GLTF 최상위가 단일 Mesh이므로 MeshStateMixin의 Mesh 경로를 탄다)
 *
 * 주의: 폴더명은 HV_2P_04이지만 GLTF 내부 Node/Mesh 이름은 "HV-M7-U"다.
 * HV_2P_01과 유사하게 폴더명과 GLTF 내부 이름이 다르다.
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
