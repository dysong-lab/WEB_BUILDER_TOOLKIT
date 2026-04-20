# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `MarkerGD_A`, 단일 primitive × 단일 material) |
| 기본 Mixin | MeshStateMixin |
| meshName | `MarkerGD_A` (폴더명 `Marker_GD`과 **구분자 위치 불일치** — 폴더는 `Marker_GD`(앞쪽 언더스코어 1개 + 중간 언더스코어 없음, 단축어 `GD`), Node는 `MarkerGD_A`(앞쪽 언더스코어 제거 + 뒤쪽 `_A` 접미)) |

## 장비 개요

Marker_GD(GD Marker, "GD" 유형 표식 마커)는 보안/관제 3D 장면에서 특정 감시 대상 위치/상태를 표식(marker)으로 시각화하는 판상(plate)형 3D 컴포넌트이다. 실물 장비가 아니라 지면·평면에 부착되는 **아이콘 플레이트 형태의 마커**로, 매우 얇은 직사각 판에 "GD" 아이콘 텍스처를 입혀 관측 지점의 존재만 시각적으로 알리는 역할을 한다. Marker_AICCTV(AI CCTV 마커) → Marker_Anemometer(풍속계 마커) → Marker_AntiDrugGoods(마약퇴치 물품 마커) → Marker_Bridge(교량 마커) → Marker_Firealarm(화재 경보기 마커) → Marker_FixedCCTV(고정형 CCTV 마커) → Marker_GD의 순서로 이어지는 동일 "Marker_*" 시리즈의 **일곱 번째** 컴포넌트이며, 마커 유형만 AI CCTV/풍속계/마약퇴치 물품/교량/화재 경보기/고정형 CCTV에서 "GD"로 바뀐다. 폴더명이 축약어 `GD`인 점은 선행 6개 Marker(전체 철자 유형명 사용) 중 유일한 예외이며, 원본 3ds Max 소스의 슬롯 명명 관례가 그대로 노출된 것으로 보인다.

단일 GLTF(`models/Marker_GD/01_default/Marker_GD.gltf`)의 scene은 루트 스케일 노드 `root`(scale [1000, 1000, 1000])와 그 자식으로 Mesh Node `MarkerGD_A`(mesh 0, translation [0, 0, -0.00010015742]) 하나, 그리고 Babylon.js exporter가 함께 내보낸 `Default light` 노드(빈 노드)로 구성된다. **폴더명과 Node/Mesh 이름 사이에 구분자 위치 불일치**가 존재한다 — 폴더는 `Marker_GD`(`Marker` + `_` + `GD`)이지만 GLTF 내부 Node/Mesh 이름은 `MarkerGD_A`(앞쪽 언더스코어가 제거되고 대신 뒤쪽 `_A` 접미가 추가)이다. 이것은 Marker_AICCTV(폴더 `Marker_AICCTV`/Node `MarkerAICCTV_A`)·Marker_Anemometer(폴더 `Marker_Anemometer`/Node `MarkerAnemometer_A`)·Marker_AntiDrugGoods(폴더 `Marker_AntiDrugGoods`/Node `MarkerAntiDrugGoods_A`)·Marker_Bridge(폴더 `Marker_Bridge`/Node `MarkerBridge_A`)·Marker_Firealarm(폴더 `Marker_Firealarm`/Node `MarkerFirealarm_A`)·Marker_FixedCCTV(폴더 `Marker_FixedCCTV`/Node `MarkerFixedCCTV_A`) 직전 선례와 **완전히 동일한 축의 불일치**이며, LV_BAT·LV_R·MT_01의 "폴더-Node 형태 불일치형"과도 같은 패턴이다. LithiumionBattery의 "순수 대소문자 차이"와는 다른 "구분자 위치 + 접미 차이"다. `getObjectByName`은 이름을 그대로 비교하므로 반드시 `'MarkerGD_A'`(언더스코어 + A)로 조회해야 한다. FLIREx·ExitSign·ElecPad·Earthquake·LeakDetector 선례의 "폴더명 = Node/Mesh 이름" 규약과는 다르다.

GLTF 구조: `scene → root(scale [1000,1000,1000]) → "MarkerGD_A"(mesh 0, translation [0, 0, -0.00010015742])` — 단일 Mesh Node × 단일 primitive × 단일 material. Marker_AICCTV·Marker_Anemometer·Marker_AntiDrugGoods·Marker_Bridge·Marker_Firealarm·Marker_FixedCCTV와 **정확히 동일한 2층 구조이며 수치까지 완전 일치**(정점/인덱스 수, 바운드, translation 모두 동일). LithiumionBattery의 `root(scale 1000) → Mesh` 2층 구조와 동일한 패턴이며, LV_BAT·MT_01·LV_2P_02/09/10/11의 "루트 스케일 없음" 1층 구조와 대비된다. 자식 Node의 미세한 Z축 translation(`-0.00010015742`)은 원시 좌표계에서 바운드 min Z(`-0.000100158271`)와 거의 동일한 값으로, Babylon.js 3ds Max exporter가 3ds Max의 pivot 위치를 translation으로 내보낸 것이다 (판의 두께 절반에 해당). 실제로 root scale 1000 적용 후 translation은 약 `-0.1` 단위가 되어 판 두께(~0.2 단위)의 정확히 절반이다.

**Material은 PBR 단일 머티리얼 `Material #40` 하나**이며, baseColorTexture로 `textures/MarkerGD_A.png`를 참조한다. metallicFactor 0.0, roughnessFactor **0.450053632**로 **정상 범위 값**이다 — Marker_AICCTV의 `Material #30`·Marker_Anemometer의 `Material #32`·Marker_AntiDrugGoods의 `Material #33`·Marker_Bridge의 `Material #37`·Marker_Firealarm의 `Material #38`·Marker_FixedCCTV의 `Material #39`와 **동일한 roughness 수치**로, 3ds Max 소스에서 마커 계열이 공통 템플릿을 공유한 일곱 번째 증거다. LeakDetector·FLIREx의 Babylon exporter 범위 이탈 값 `-90.47056`이나 MT_01·LV_BAT의 경계값 `0.0`과 달리 PBR 사양 `[0, 1]` 범위 내 자연스러운 중간값으로, LithiumionBattery(roughness 0.5)·MCCB(0.5) 계열에 가깝다. Material id `#40`는 Marker_FixedCCTV의 `#39`에서 1 증가한 번호로, **마커 계열 전용 material slot이 3ds Max 소스 파일에서 증가 순서(`#30` AICCTV → `#32` Anemometer → `#33` AntiDrugGoods → `#37` Bridge → `#38` Firealarm → `#39` FixedCCTV → `#40` GD)로 정의되었음을 재확인시켜준다**. FixedCCTV → GD 간 gap은 1로 동일하게 유지되어 마커 슬롯이 소스에서 연속 배정되었음이 확실해진다. LV 계열의 `#342540XXX`나 MT_01의 `#342540102`와는 전혀 다른 번호대다. MeshStateMixin은 `material.color` 채널만 갱신하므로 이 roughness/metallic 값과 무관하게 상태 색상이 올바르게 적용된다. doubleSided 플래그가 명시되지 않았는데 판상형 마커가 한쪽 면만 렌더되면 카메라 각도에 따라 사라져 보일 수 있으나, three.js의 기본 렌더링과 마커 용도 특성상 위쪽(또는 아래쪽) 단일 면만 보여도 무방하다.

Mesh 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 60, 인덱스 60 — 단일 primitive, 양면 판상형 지오메트리). Marker_AICCTV·Marker_Anemometer·Marker_AntiDrugGoods·Marker_Bridge·Marker_Firealarm·Marker_FixedCCTV와 **정점/인덱스 수 완전 동일** — 마커 계열은 동일 베이스 판 지오메트리를 공유하고 텍스처만 교체하는 3ds Max 템플릿 패턴임을 일곱 번째 사례로 재확인한다. LithiumionBattery(25200)의 1/420, LeakDetector(1784)의 1/30, MT_01(26)의 약 2배 규모로 본 저장소 개별 3D 컴포넌트 중 아이콘 마커에 어울리는 매우 적은 정점 수다. 인덱스 60 / 정점 60 비율(1:1)은 인덱스 재사용이 거의 없는 저복잡도 판 구조를 시사한다.

좌표 바운드(루트 스케일 적용 전): POSITION min [-0.0029696722, -0.00342908176, -0.000100158271] ~ max [0.0029696722, 0.00342908176, 0.000100158279] — 원시 크기 약 0.00594 × 0.00686 × 0.000200 단위. **Marker_AICCTV·Marker_Anemometer·Marker_AntiDrugGoods·Marker_Bridge·Marker_Firealarm·Marker_FixedCCTV와 바운드 완전 동일** — 동일 판 지오메트리 재사용의 일곱 번째 증거다. 루트 `scale [1000, 1000, 1000]`이 적용되므로 실제 장면 크기는 약 **5.94 × 6.86 × 0.20 단위**로 **X·Y는 수 단위 크기이지만 Z축이 약 0.2 단위로 극단적으로 얇은 판상형**이다. LithiumionBattery(~434 × 228 × 108)의 1/75 스케일이며, Y축이 약간 더 긴 거의 정사각에 가까운 판(X:Y ≈ 1:1.15)이다. MT_01의 3.70 × 3.72 × 3.00 입방에 가까운 블록형과 비교하면 훨씬 얇은 형태로, 마커/아이콘의 전형적 비율이다. preview의 카메라 바운드 기반 자동 거리 조정(`maxDim * 2.2 ≈ 15.1`)으로 적절한 시야가 확보된다.

**텍스처 폴더는 `textures/`** 이다. LV 계열의 `maps/` 규약이나 MT_01의 `maps/` 규약과 달리 Earthquake·FLIREx·ExitSign·ElecPad·LeakDetector·LithiumionBattery·Marker_AICCTV·Marker_Anemometer·Marker_AntiDrugGoods·Marker_Bridge·Marker_Firealarm·Marker_FixedCCTV 선례의 `textures/` 규약을 따른다. GLTF 내부 `images[].uri`가 `textures/MarkerGD_A.png` 단일 이미지를 참조하므로 이 파일만 `01_default/textures/` 폴더에 유지한다. 텍스처 파일명 `MarkerGD_A.png`는 Node/Mesh 이름과 정확히 일치하며, PNG 포맷은 마커 아이콘의 투명도/알파 채널을 활용할 가능성을 시사한다 (JPG를 쓰는 LithiumionBattery·MT_01과 대비 — JPG는 알파 미지원). 모델 폴더에는 보조 썸네일 `Marker_GD-P.png`도 존재하지만 런타임에서는 무시한다 (선례와 동일).

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `MarkerGD_A` Mesh의 단일 material(`Material #40`) 색상을 변경한다. 단일 Mesh × 단일 material 구조이므로 LeakDetector 같은 "배열 material 일괄 색상 치환"이 아니라 Marker_AICCTV·Marker_Anemometer·Marker_AntiDrugGoods·Marker_Bridge·Marker_Firealarm·Marker_FixedCCTV·LithiumionBattery·MT_01·LV_BAT·LV_2P_09/10/11과 동일한 **"단일 material 단일 색상 치환"** 경로를 탄다. MCCB의 "루트 Group 1-항목 × 자식 N-Mesh traverse 일괄 치환"과도 구분되는 가장 단순한 단일 객체 경로다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
