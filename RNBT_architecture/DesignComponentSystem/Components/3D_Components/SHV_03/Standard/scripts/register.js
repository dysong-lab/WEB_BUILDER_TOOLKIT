/**
 * SHV_03 — Standard / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 "`SHV-6` — **Mesh Node 이름** (장비 폴더명 `SHV_03`과 다름, GLTF 원본 Node 이름을 따른다). `getObjectByName('SHV-6')`는 자식이 없는 리프 Mesh를 반환하고, `obj.material`이 단일 객체이므로 Mesh 브랜치(`Array.isArray(material)` 미발동)로 진입하여 material을 clone 후 color만 setHex로 치환한다. FLIREx·BATT·Chiller·Pump·Partition_small·RTU(`RTU2`)·HV_1P_01·SHV_01(`SHV-1`)·SHV_02(`SHV-4-1`)의 "**단일 Mesh 직접 참조**" 패턴과 동일한 경로. 단, BATT(meshName `BATT`)·Pump(meshName `Pump`)·HV_1P_01(meshName `HV_1P_01`)처럼 **장비명과 meshName이 일치하는 대칭 명명 컴포넌트와 달리** SHV_03은 장비 폴더명(`SHV_03`, 언더스코어+숫자 suffix)과 Mesh Node 이름(`SHV-6`, 하이픈+숫자 suffix)이 다른 **비대칭 명명** 케이스다 — 접두어 `SHV` 뒤의 숫자 부분이 서로 다른(폴더 `03` vs Node `6`) 특이 패턴이며, SHV 라이브러리 내부 식별자가 폴더 번호와 독립적으로 운영됨을 드러낸다. SHV_01(폴더 `SHV_01` vs meshName `SHV-1`, 폴더번호 1 ↔ Node번호 1 일치)·SHV_02(폴더 `SHV_02` vs meshName `SHV-4-1`, 폴더번호 2 ↔ Node번호 4-1 불일치)와 대비해 SHV_03은 **가장 단순한 하이픈 1회 suffix**(SHV_02의 2단 하이픈보다 단순)이면서도 **폴더 번호와 Node 번호가 불일치**(3 ≠ 6)라는 복합적 비대칭을 가진다. RTU(폴더 `RTU` vs meshName `RTU2`)·SC_02(폴더 `SC_02` vs meshName `SC-U1`)와 동류의 2025년 빌드 비대칭 규약(폴더는 언더스코어 표기, 내부 Node는 하이픈 표기)." 메시 색상 변경
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
