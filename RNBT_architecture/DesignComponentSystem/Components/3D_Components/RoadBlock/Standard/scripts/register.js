/**
 * RoadBlock — Standard / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 "`RoadBlock` — **Mesh Node 이름이 장비명과 일치**하는 대칭 명명 케이스. BATT(`BATT`)·Pump(`Pump`)·Chiller(`Chiller`)의 "장비명 = meshName" 규약과 동일하며, RTU(장비 `RTU` ≠ Mesh `RTU2`)의 비대칭 명명과 대비된다. `getObjectByName('RoadBlock')`는 자식이 없는 리프 Mesh를 반환하고, `obj.material`이 단일 객체이므로 MeshStateMixin의 Mesh 브랜치(`Array.isArray(material)` 미발동)로 진입하여 material을 clone 후 color만 setHex로 치환한다." 메시 색상 변경
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
