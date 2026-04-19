/**
 * LeakDetector — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 Mesh 'LeakDetector'의 두 material(leakEtc, winBody) 색상 일괄 변경
 *
 * GLTF 구조: scene → root(scale [1000,1000,1000]) → "LeakDetector"(mesh 0, 2 primitives, 2 materials).
 * 폴더명 = Node/Mesh 이름 = 'LeakDetector' (FLIREx·ExitSign·ElecPad·Earthquake 선례와 동일한 "이름 일치형";
 * LV_R의 'LV-2R1' 같은 폴더-Node 불일치형과 대비).
 *
 * Mesh의 material은 배열 [leakEtcMat, winBodyMat] — MeshStateMixin의 배열 material 지원에 의존해
 * 두 서브메시(센서 본체·투명창)가 동시에 상태 색상으로 치환된다.
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
