/**
 * SHV_02 — Standard / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 "`SHV-4-1` — **Mesh Node 이름** (장비 폴더명 `SHV_02`와 다름, GLTF 원본 Node 이름을 따른다). `getObjectByName('SHV-4-1')`는 자식이 없는 리프 Mesh를 반환하고, `obj.material`이 단일 객체이므로 Mesh 브랜치(`Array.isArray(material)` 미발동)로 진입하여 material을 clone 후 color만 setHex로 치환한다. FLIREx·BATT·Chiller·Pump·Partition_small·RTU(`RTU2`)·HV_1P_01·SHV_01(`SHV-1`)의 "**단일 Mesh 직접 참조**" 패턴과 동일한 경로. 단, BATT(meshName `BATT`)·Pump(meshName `Pump`)·HV_1P_01(meshName `HV_1P_01`)처럼 **장비명과 meshName이 일치하는 대칭 명명 컴포넌트와 달리** SHV_02는 장비 폴더명(`SHV_02`, 언더스코어+숫자 suffix)과 Mesh Node 이름(`SHV-4-1`, 하이픈 2회 구분 복합 suffix)이 다른 **비대칭+복합 명명** 케이스다 — SHV_01(폴더 `SHV_01` vs meshName `SHV-1`, 하이픈 1회)보다 한 단계 더 복합된 `SHV-4-1` 패턴으로, 동일 SHV 제품군 내 **4번째 바리에이션의 1번 유닛**이라는 라이브러리 내부 식별자를 그대로 노출한 형태. RTU(폴더 `RTU` vs meshName `RTU2`)·SC_02(폴더 `SC_02` vs meshName `SC-U1`)·SHV_01(폴더 `SHV_01` vs meshName `SHV-1`)과 동류의 2025년 빌드 비대칭 규약(폴더는 언더스코어 표기, 내부 Node는 하이픈 표기)이지만, meshName이 **2단 하이픈 복합형**인 점이 특수하다." 메시 색상 변경
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
