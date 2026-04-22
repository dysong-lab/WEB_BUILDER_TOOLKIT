/**
 * PTT — Standard / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 "`PTT_033` — **Group Node 이름**. `getObjectByName('PTT_033')`는 자식 2개(`PTT_034`, `PTT_035`)를 가진 Group을 반환하고, MeshStateMixin은 `obj.material`이 없으므로 traverse 분기로 진입해 자식 Mesh들의 material을 일괄 clone+setHex. Earthquake의 "자식 이름 배열 열거(`['Earthquake', 'Earthquake_A']`)" 패턴과 달리, 부모 Group 이름 하나로 자식 전체를 관리하는 **Group-traverse 단일 참조** 패턴." 메시 색상 변경
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
