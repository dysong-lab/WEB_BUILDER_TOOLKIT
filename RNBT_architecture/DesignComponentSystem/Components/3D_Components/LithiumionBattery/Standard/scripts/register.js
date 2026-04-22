/**
 * LithiumionBattery — Standard / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 "`Lithiumionbattery` (폴더명 `LithiumionBattery`와 **대소문자 불일치** — 'b'가 소문자)" 메시 색상 변경
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
