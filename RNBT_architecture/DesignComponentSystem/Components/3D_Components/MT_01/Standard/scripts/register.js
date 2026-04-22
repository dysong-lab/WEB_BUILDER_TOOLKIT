/**
 * MT_01 — Standard / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 "`MT-M1` (폴더명 `MT_01`과 **이름 불일치** — 폴더는 장비 번호 접미 `_01`, Node는 Mesh 접두 `MT-M` + 접미 `1`)" 메시 색상 변경
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
