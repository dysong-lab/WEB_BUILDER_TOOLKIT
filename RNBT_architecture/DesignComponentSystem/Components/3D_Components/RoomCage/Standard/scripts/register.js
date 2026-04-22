/**
 * RoomCage — Standard / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 "`cage01` — **Mesh Node 이름** (장비 폴더명 `RoomCage`와 다름, GLTF 원본 Node 이름을 따른다). `getObjectByName('cage01')`는 자식이 없는 리프 Mesh를 반환하고, `obj.material`이 단일 객체이므로 Mesh 브랜치(`Array.isArray(material)` 미발동)로 진입하여 material을 clone 후 color만 setHex로 치환한다. FLIREx·BATT·Chiller·Pump·Partition_small·RoadBlock의 "**단일 Mesh 직접 참조**" 패턴과 동일한 경로. 단, BATT(meshName `BATT`)·Pump(meshName `Pump`)·RoadBlock(meshName `RoadBlock`)처럼 **장비명과 meshName이 일치하는 컴포넌트와 달리** RoomCage는 장비 폴더명(`RoomCage`)과 Mesh Node 이름(`cage01`)이 다른 **비대칭 명명** 케이스다(RTU의 `RTU` ≠ `RTU2` 패턴과 동류)." 메시 색상 변경
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
