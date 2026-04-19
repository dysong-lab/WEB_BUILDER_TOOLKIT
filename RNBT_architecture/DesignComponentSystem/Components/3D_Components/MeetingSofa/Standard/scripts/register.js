/**
 * MeetingSofa — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 Mesh 'MeetingSofa'의 단일 material(Material #25192277) 색상 변경
 *
 * GLTF 구조: scene → root(scale [1000,1000,1000]) → "MeetingSofa"(mesh 0, 1 primitive, 1 material).
 * Mesh Node에 Y축 -90도 회전(rotation [0, -0.7071068, 0, 0.7071067]) 적용 — 월드 바운드는 회전 반영된 AABB로 계산됨.
 * 폴더명과 Node/Mesh 이름이 일치(MeetingSofa) — LithiumionBattery의 "폴더-Node 대소문자 불일치" 같은 특이 케이스 없음.
 * Material 이름은 3ds Max 숫자 일련번호 형식(Material #25192277) — ArmChair와 동일한 명명 패턴.
 *
 * Mesh의 material은 단일 객체 — MeshStateMixin의 단일 material 경로로 색상 치환
 * (LeakDetector처럼 배열 material이 아님).
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
