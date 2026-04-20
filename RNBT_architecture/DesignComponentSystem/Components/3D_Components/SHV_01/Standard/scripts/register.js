/**
 * SHV_01 — Standard (01_status) / scripts / register
 *
 * MeshStateMixin 단독 적용
 * 상태에 따라 단일 Mesh 'SHV-1'의 material 색상 변경
 *
 * GLTF 구조:
 *   scene → SHV-1 (Mesh Node, mesh 0,
 *                   rotation [0.0, -1.0, 0.0, 1.19e-08] ≒ Y축 π 회전,
 *                   material "Material #342540116"
 *                    = baseColorTexture maps/SHV07.jpg,
 *                      metallicFactor 0, roughnessFactor 0, doubleSided true,
 *                      extras: babylon+Arnold 호환 다중 힌트)
 *
 * **단일 Mesh 직접 참조** — meshName='SHV-1'은 리프 Mesh Node 이름.
 * 장비 폴더명(`SHV_01`, 언더스코어+숫자) ≠ meshName(`SHV-1`, 하이픈+숫자)의
 * **비대칭 명명** 주의. 2025년 빌드 babylon exporter의 공통 비대칭 패턴
 * (RTU: 폴더 `RTU` vs meshName `RTU2`, SC_02: 폴더 `SC_02` vs meshName `SC-U1`와 동류).
 *
 * getObjectByName('SHV-1')은 단일 리프 Mesh를 반환하고, MeshStateMixin은
 * obj.material이 단일 객체이므로 Mesh 브랜치로 진입해 material을 clone하고
 * color만 setHex로 치환. BATT·Pump·Chiller·Partition_small·RTU·HV_1P_01의
 * 동일 패턴(Partition의 Group003·SDC500의 Group-traverse 경유 방식과 대비).
 *
 * material이 baseColorTexture 주도이므로 color setHex가 텍스처에 곱해진다
 * (three.js 기본 — MeshStandardMaterial.color × baseColorTexture).
 * SDC500의 `plastic01`이 baseColorFactor 주도로 전체 치환인 것과 대비되는
 * 텍스처 기반 부분 반영 특성.
 *
 * doubleSided:true가 clone 후에도 유지되므로 양면 렌더도 보존된다.
 * extras의 babylon·Arnold 호환 힌트(babylonSeparateCullingPass / subsurface_type /
 * caustics / internal_reflections / exit_to_background / indirect_diffuse /
 * indirect_specular / dielectric_priority / transmit_aovs / aov_id1~8)도
 * clone 후 유지되며, MeshStateMixin은 color 채널만 갱신한다.
 *
 * 루트 Mesh Node scale 업스케일 **없음(1:1 스케일)** — Partition·Pump·OHU103의
 * `scale [1000,1000,1000]` 업스케일과 대비되는 원본 미터 유닛 유지 패턴
 * (RTU·SC_01/SC_02·BATT·HV_1P_01과 동류). Mesh Node 자체는 Y축 π 회전
 * (`[0.0, -1.0, 0.0, 1.19248806E-08]`)만 가지며, 바운드 X ∈ ±0.6 · Y ∈ ±1.32 ·
 * Z ∈ ±1.5 → 약 1.2 × 2.65 × 3.0 단위의 세로+깊이형 직육면체.
 * MeshStateMixin은 material.color만 갱신하므로 회전·스케일과 독립적으로 색상 치환 동작.
 *
 * babylon.js glTF exporter for 3dsmax 2025 v20250127.3 (RTU·SC_01/SC_02와 완전 동일한
 * 2025년 빌드). SDC500·PTT의 2022년 빌드와는 구분. 텍스처 폴더 `maps/`
 * (HV_1P_01·RTU의 `maps/` 규약과 공통, BATT·Pump의 `textures/` 규약과 대비).
 * 확장 선언 없이 표준 core glTF 2.0.
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
