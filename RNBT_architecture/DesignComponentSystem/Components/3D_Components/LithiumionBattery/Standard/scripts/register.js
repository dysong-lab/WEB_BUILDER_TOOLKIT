/**
 * LithiumionBattery — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 Mesh 'Lithiumionbattery'(소문자 'b')의 단일 material(Lithiumionbattery) 색상 변경
 *
 * GLTF 구조: scene → root(scale [1000,1000,1000]) → "Lithiumionbattery"(mesh 0, 1 primitive, 1 material).
 * 폴더명(LithiumionBattery, 대문자 'B')과 Node/Mesh 이름(Lithiumionbattery, 소문자 'b') 사이에
 * **대소문자 불일치**가 존재한다 — getObjectByName은 대소문자 구분이므로 페이지 데이터 발행/조회 시
 * 반드시 소문자 'b'의 'Lithiumionbattery'를 사용해야 한다. FLIREx·ExitSign·ElecPad·Earthquake·LeakDetector의
 * "이름 일치형"과 대비되는 드문 케이스.
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
