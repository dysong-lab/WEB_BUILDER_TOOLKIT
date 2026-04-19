/**
 * MetalSphere — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 Mesh 'metal001'의 단일 material(Material #14) 색상 변경
 *
 * GLTF 구조: scene → root(scale [1000,1000,1000]) → "metal001"(mesh 0, 1 primitive, 1 material).
 * Mesh Node에 rotation [-0.7071068, 0, 0, 0.7071067] (X축 -90도 회전) 설정
 *  — MeetingSofa의 Y축 -90도 회전과 축이 다른 회전이며,
 *    3ds Max Z-up → glTF Y-up 좌표계 보정(Y↔Z 축 교체)에 해당.
 *    Mesh가 대칭 구(sphere)이므로 회전이 시각적으로 드러나지 않음.
 *
 * **폴더명과 Node/Mesh 이름 완전 상이** — 폴더는 'MetalSphere'(카멜케이스)이지만
 * Node/Mesh 이름은 'metal001'(소문자 + 숫자, 텍스처 파일명 기반 3ds Max 재질 이름).
 * LithiumionBattery의 순수 대소문자 차이보다 강한 불일치 — getObjectByName은 대소문자 구분이므로
 * 반드시 'metal001'로 조회.
 *
 * Material 이름은 3ds Max 숫자 일련번호 형식(Material #14) — MeetingSofa·ArmChair·MetalDetector와 동일 패턴.
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
