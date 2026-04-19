/**
 * P2400CH — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 Group Node 'P2400CH' 아래 세 자식 Mesh
 * (P300C_004, P300C_006, P300C_008)의 material 색상을 일괄 변경
 *
 * GLTF 구조: scene → "P2400CH"(Group Node) → P300C_004 + P300C_006 + P300C_008.
 * **폴더명 = 최상위 Group Node 이름 완전 일치** (OHU103·LeakDetector·FLIREx·ExitSign 선례와 동일한
 * "이름 일치형" 규약). MeshStateMixin이 Group 타겟에 대해 obj.traverse로 자식 Mesh에 color를
 * 일괄 적용하므로 자식 3개 이름을 register에 하드코딩할 필요 없이 Group 이름 'P2400CH' 하나로
 * 전체 장비를 다룬다 — OutdoorConditioner_Ani·Earthquake의 "자식 이름 열거" 패턴과 대비되는
 * "Group-traverse" 패턴.
 *
 * Material: P2400CH(P300C_004, textures/P2400CH.jpg, doubleSided),
 *           dGRAY(P300C_006, baseColorFactor 어두운 회색, roughness 0.5),
 *           black(P300C_008, baseColorFactor 거의 검정, doubleSided).
 * 세 material 이름이 모두 의미 있는 문자열 — 3ds Max 숫자 일련번호 규약(`Material #NN`)의
 * OHU103·OutdoorConditioner_Ani와 달리 모델러가 수동 명명한 드문 케이스.
 * MeshStateMixin은 각 child Mesh 단위로 material을 clone 후 color만 setHex 치환하므로
 * 세 material의 원본 속성(doubleSided, roughness, factor)은 그대로 유지된 채 색상 채널만 갱신.
 *
 * 루트 scale 보정 없음 — Earthquake·OHU103·OutdoorConditioner_Ani의 root(scale 1000) 컨테이너
 * 패턴과 대비되는 "원본 유닛 크기 그대로" 로드 케이스. 실제 장면 크기도 약 0.15 × 0.09 × 0.23 단위의
 * 초소형이지만, MeshStateMixin은 material.color만 갱신하므로 스케일과 독립적으로 색상 치환 동작.
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
