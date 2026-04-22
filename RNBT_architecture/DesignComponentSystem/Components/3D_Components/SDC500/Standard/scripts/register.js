/**
 * SDC500 — Standard / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 "`SDC500` — **Group Node 이름**. 장비 폴더명과 meshName이 **일치하는 대칭 명명** 케이스(BATT의 `BATT`, Pump의 `Pump`, RoadBlock의 `RoadBlock`, FLIREx의 `FLIREx`와 동류). `getObjectByName('SDC500')`은 두 자식 Mesh(`sdc500_003`, `sdc500_004`)를 가진 Group Node를 반환하고, MeshStateMixin은 `obj.material`이 없으므로 `obj.traverse(child => child.material && applyColor(child, color))` 분기로 진입해 자식 Mesh들의 material을 일괄 clone+setHex. Partition(`Group003`)의 "**Group-traverse 단일 참조**" 패턴과 동일하되, Partition의 모델러 자동 생성 범용 Group명(`Group003`)과 달리 SDC500은 **장비명 그대로**를 Group명으로 사용한다는 점이 구분점(PTT의 `PTT_033` 장비명 기반 Group명 규약과 동일 계열). Earthquake의 "자식 이름 배열 열거(`['Earthquake', 'Earthquake_A']`)" 패턴과는 대비된다." 메시 색상 변경
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
