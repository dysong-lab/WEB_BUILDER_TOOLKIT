/**
 * MT_01 — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 Mesh 'MT-M1'(하이픈)의 단일 material(Material #342540102) 색상 변경
 *
 * GLTF 구조: scene → "MT-M1"(mesh 0, rotation=[0,-1,0,4.371139e-08]) — 단일 Node, 단일 Mesh, 루트 스케일 없음.
 * 폴더명(MT_01, 언더스코어 + 2자리 번호)과 Node/Mesh 이름(MT-M1, 하이픈 + M + 1자리) 사이에
 * **폴더-Node 형태 불일치**가 존재한다 — getObjectByName은 이름을 그대로 비교하므로 페이지 데이터 발행/조회 시
 * 반드시 하이픈의 'MT-M1'을 사용해야 한다. LV_BAT('LV-BAT1')·LV_R('LV-2R1')과 동일 축의 불일치 패턴이며,
 * FLIREx·ExitSign·ElecPad·Earthquake·LeakDetector의 "이름 일치형"과 대비된다.
 *
 * Mesh의 material은 단일 객체 — MeshStateMixin의 단일 material 경로로 색상 치환
 * (LV_BAT·LithiumionBattery와 동일 경로; MCCB의 Group traverse 경로,
 *  LeakDetector의 배열 material 경로와 대비).
 * roughness/metallic 0.0은 경계 정상값이며 color 채널만 갱신되므로 치환 동작에 영향 없음.
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
