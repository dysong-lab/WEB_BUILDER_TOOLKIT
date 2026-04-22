/**
 * P2400CH — Standard / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 "`P2400CH` — **Group Node**. MeshStateMixin이 Group 타겟에 대해 `traverse`로 자식 Mesh에 color를 일괄 적용하므로 자식 3개 이름을 하드코딩할 필요 없음." 메시 색상 변경
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
