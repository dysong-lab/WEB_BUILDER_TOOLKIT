/**
 * MonnitTemperature_sensor — Standard / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 "`MonnitTemperature_sensor` (폴더명·Node 이름·Mesh 이름 **완전 일치** — 밑줄을 포함한 풀 네이밍을 3ds Max Node 이름으로 그대로 사용)" 메시 색상 변경
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
