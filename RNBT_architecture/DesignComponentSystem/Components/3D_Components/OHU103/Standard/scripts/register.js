/**
 * OHU103 — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 Mesh 'OHU103'의 단일 material(Material #42136) 색상 변경
 *
 * GLTF 구조: scene → root(scale [1000,1000,1000]) → "OHU103"(mesh 0, 1 primitive, 1 material).
 * Mesh Node에 rotation [0.0, -1.0, 0.0, 4.371139E-08] — 쿼터니언 Y축 180도 회전
 * (3ds Max forward → glTF -Z-forward 보정). MeshStateMixin은 material.color만 갱신하므로
 * 회전/metallic/roughness 값과 독립적으로 색상 치환 동작.
 *
 * **폴더명 = Node/Mesh 이름 완전 일치** — 영문 약어(OHU) + 숫자 모델 번호(103)의 짧은 식별자
 * (LeakDetector·FLIREx·ExitSign·ElecPad·Earthquake·MonnitTemperature_sensor와 같은 "이름 일치형" 규약).
 *
 * Material 이름은 3ds Max 숫자 일련번호 형식(Material #42136, 5자리) —
 * MetalSphere·MetalDetector·MonnitTemperature_sensor의 2자리와 MeetingSofa·ArmChair의 8자리의 중간 규모.
 * roughnessFactor 0.45(정상 중간값), doubleSided 없음(일반 backface culling) —
 * 두꺼운 박스형 공조 유닛 외장 특성.
 *
 * Mesh의 material은 단일 객체 — MeshStateMixin의 단일 material 경로로 색상 치환
 * (LeakDetector의 배열 material 경로가 아님).
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
