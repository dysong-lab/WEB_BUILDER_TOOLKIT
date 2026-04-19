/**
 * MonnitTemperature_sensor — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 Mesh 'MonnitTemperature_sensor'의 단일 material(Material #26) 색상 변경
 *
 * GLTF 구조: scene → root(scale [1000,1000,1000]) → "MonnitTemperature_sensor"(mesh 0, 1 primitive, 1 material).
 * Mesh Node에 rotation 없음(식별 행렬). translation [0.0, 0.0, -7.989568E-11]은
 * 부동소수점 epsilon 범위(3ds Max → Babylon.js glTF exporter의 수치적 잔여)로 실질 원점.
 *
 * **폴더명 = Node/Mesh 이름 완전 일치** — 밑줄(_)을 포함한 복합 식별자가 그대로 승계됨
 * (LeakDetector·FLIREx·ExitSign·ElecPad·Earthquake와 같은 "이름 일치형" 규약).
 * MetalSphere의 완전 불일치나 LithiumionBattery의 대소문자 차이가 없음.
 *
 * Material 이름은 3ds Max 숫자 일련번호 형식(Material #26) — MetalSphere·MetalDetector와 동일 패턴.
 * roughnessFactor 0.0(완전 매끈), doubleSided=true — 플라스틱 센서 케이싱의 반짝이는 얇은 면.
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
