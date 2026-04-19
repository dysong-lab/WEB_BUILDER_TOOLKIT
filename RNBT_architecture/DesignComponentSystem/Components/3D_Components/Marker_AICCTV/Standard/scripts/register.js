/**
 * Marker_AICCTV — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 Mesh 'MarkerAICCTV_A'(언더스코어 + A 접미)의 단일 material(Material #30) 색상 변경
 *
 * GLTF 구조: scene → root(scale [1000,1000,1000]) → "MarkerAICCTV_A"(mesh 0, translation [0, 0, -0.00010015742])
 *   — 단일 Mesh Node × 단일 primitive × 단일 material. LithiumionBattery와 동일한 2층 구조
 *   (LV_BAT·MT_01의 "루트 스케일 없음" 1층 구조와 대비).
 *
 * 폴더명(Marker_AICCTV, 중간 언더스코어)과 Node/Mesh 이름(MarkerAICCTV_A, 언더스코어 제거 + 뒤쪽 _A 접미)
 * 사이에 **구분자 위치 + 접미 불일치**가 존재한다 — getObjectByName은 이름을 그대로 비교하므로
 * 페이지 데이터 발행/조회 시 반드시 'MarkerAICCTV_A'(언더스코어 + A)를 사용해야 한다.
 * LV_BAT('LV-BAT1')·LV_R('LV-2R1')·MT_01('MT-M1')과 동일 축의 불일치 패턴이며,
 * FLIREx·ExitSign·ElecPad·Earthquake·LeakDetector의 "이름 일치형" 및
 * LithiumionBattery의 "순수 대소문자 차이"와도 대비된다.
 *
 * Mesh의 material은 단일 객체 — MeshStateMixin의 단일 material 경로로 색상 치환
 * (LithiumionBattery·MT_01·LV_BAT와 동일 경로; MCCB의 Group traverse 경로,
 *  LeakDetector의 배열 material 경로와 대비).
 * roughness 0.450053632는 정상 범위값이며 color 채널만 갱신되므로 치환 동작에 영향 없음.
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
