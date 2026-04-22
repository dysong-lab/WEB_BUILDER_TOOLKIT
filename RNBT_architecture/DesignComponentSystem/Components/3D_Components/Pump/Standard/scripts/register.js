/**
 * Pump — Standard / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 "`Pump` — **Mesh Node 이름**. `getObjectByName('Pump')`는 자식이 없는 리프 Mesh를 반환하고, MeshStateMixin은 `obj.material`이 존재(단일 객체)하므로 Mesh 브랜치로 진입해 `Array.isArray(material)` 미발동 경로로 material을 clone 후 color만 setHex로 치환. FLIREx·BATT·Chiller·Partition_small 등의 "**단일 Mesh 직접 참조**" 패턴과 동일하며, Partition(부모 Group `Group003` Group-traverse)·Earthquake(자식 이름 배열 열거)와는 대비된다." 메시 색상 변경
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
