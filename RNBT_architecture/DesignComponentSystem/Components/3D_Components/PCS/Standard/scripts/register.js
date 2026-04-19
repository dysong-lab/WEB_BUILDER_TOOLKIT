/**
 * PCS — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 단일 Mesh Node 'PCS'의 material 색상 변경
 *
 * GLTF 구조: scene → root(scale [1000, 1000, 1000]) → "PCS"(Mesh Node, mesh 0, 1 material).
 * **4-이름 일치형** 규약 — 폴더명 = Mesh Node 이름 = mesh 이름 = material 이름이 모두 'PCS'로 동일.
 * getObjectByName('PCS')가 단일 Mesh를 직접 반환하므로 MeshStateMixin은 Mesh 브랜치로 직진
 * (obj.isMesh ? applyColor(obj) : traverse의 isMesh 경로), obj.material을 clone한 뒤 color만
 * setHex로 치환한다. 단일 material이며 배열이 아니므로 Array.isArray 분기 없이 직접 color 치환.
 * P300C·P2400CH의 "Group-traverse" 패턴이나 Earthquake의 "자식 이름 열거" 패턴과 달리,
 * 이름 하나로 Mesh 하나를 직접 가리키는 **단일-Mesh 개별 단위**의 가장 단순한 형태.
 *
 * Material: PCS(baseColorTexture textures/1FS090.jpg, metallicFactor 0.2, roughnessFactor 0.5,
 *               doubleSided 미지정 = single-sided, extras babylonSeparateCullingPass:false).
 * P300C가 세 material(P300C/plastic01/black)을 자식 Mesh별로 분리 적용한 것과 달리 PCS는
 * 단일 material만 보유하며, P300C의 세 material이 모두 doubleSided=true였던 것과 대비되는
 * single-sided 패턴이다. material 이름이 mesh·Node·폴더 이름과 동일(PCS)한 자기-지시적 명명 —
 * OHU103(Material #42136)·OutdoorConditioner_Ani(#42064)의 3ds Max 숫자 일련번호 규약과 달리
 * 모델러가 장비 코드를 그대로 전파한 케이스. baseColorFactor/emissive 오버라이드 없이 순수
 * 텍스처 기반 셰이딩이며, MeshStateMixin이 material.color만 갱신하므로 원본 텍스처·metallicFactor·
 * roughnessFactor·extras는 모두 그대로 유지된 채 색상 채널만 상태색으로 갱신.
 *
 * 루트 scale [1000, 1000, 1000] 적용 — Earthquake·OHU103·ElecPad와 동일한 "원본 미리미터 →
 * 장면 단위" 변환 케이스. P300C·P2400CH의 "root scale 없음 → 초소형" 케이스와 대비되며,
 * 원본 mesh 바운드(±0.01 × ±0.011 × ±0.006)가 scene 스케일 단계에서 1000배 확대되어
 * 실제 장면 크기 약 20.3 × 22.8 × 12.6 단위로 렌더된다. MeshStateMixin은 material.color만
 * 갱신하므로 스케일과 독립적으로 색상 치환 동작.
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
