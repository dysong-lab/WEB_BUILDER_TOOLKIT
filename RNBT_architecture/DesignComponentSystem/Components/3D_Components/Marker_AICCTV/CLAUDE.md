# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `MarkerAICCTV_A`, 단일 primitive × 단일 material) |
| 기본 Mixin | MeshStateMixin |
| meshName | `MarkerAICCTV_A` (폴더명 `Marker_AICCTV`와 **구분자 위치 불일치** — 폴더는 `Marker_AICCTV`(앞쪽 언더스코어), Node는 `MarkerAICCTV_A`(언더스코어 제거 + 뒤쪽 `_A` 접미)) |

## 장비 개요

Marker_AICCTV(AI CCTV Marker)는 보안/관제 3D 장면에서 AI 기반 CCTV 카메라의 위치/상태를 표식(marker)으로 시각화하는 판상(plate)형 3D 컴포넌트이다. 실물 CCTV 장비 자체가 아니라 지면·평면에 부착되는 **아이콘 플레이트 형태의 마커**로, 매우 얇은 직사각 판에 AI CCTV 아이콘 텍스처를 입혀 3D 장면에서 객체의 존재만 시각적으로 알리는 역할을 한다.

단일 GLTF(`models/Marker_AICCTV/01_default/Marker_AICCTV.gltf`)의 scene은 루트 스케일 노드 `root`(scale [1000, 1000, 1000])와 그 자식으로 Mesh Node `MarkerAICCTV_A`(mesh 0, translation [0, 0, -0.00010015742]) 하나, 그리고 Babylon.js exporter가 함께 내보낸 `Default light` 노드(빈 노드)로 구성된다. **폴더명과 Node/Mesh 이름 사이에 구분자 위치 불일치**가 존재한다 — 폴더는 `Marker_AICCTV`(카멜케이스 + 중간 언더스코어)이지만 GLTF 내부 Node/Mesh 이름은 `MarkerAICCTV_A`(중간 언더스코어가 제거되고 대신 뒤쪽 `_A` 접미가 추가)이다. 이것은 LV_BAT(폴더 `LV_BAT`/Node `LV-BAT1`)·LV_R(폴더 `LV_R`/Node `LV-2R1`)·MT_01(폴더 `MT_01`/Node `MT-M1`)의 "폴더-Node 형태 불일치형" 선례와 동일한 축의 불일치이며, LithiumionBattery의 "순수 대소문자 차이"와는 다른 "구분자 위치 + 접미 차이"다. `getObjectByName`은 이름을 그대로 비교하므로 반드시 `'MarkerAICCTV_A'`(언더스코어 + A)로 조회해야 한다. FLIREx·ExitSign·ElecPad·Earthquake·LeakDetector 선례의 "폴더명 = Node/Mesh 이름" 규약과는 다르다.

GLTF 구조: `scene → root(scale [1000,1000,1000]) → "MarkerAICCTV_A"(mesh 0, translation [0, 0, -0.00010015742])` — 단일 Mesh Node × 단일 primitive × 단일 material. LithiumionBattery의 `root(scale 1000) → Mesh` 2층 구조와 정확히 동일한 패턴이며, LV_BAT·MT_01·LV_2P_02/09/10/11의 "루트 스케일 없음" 1층 구조와 대비된다. 자식 Node의 미세한 Z축 translation(`-0.00010015742`)은 원시 좌표계에서 바운드 min Z(`-0.000100158271`)와 거의 동일한 값으로, Babylon.js 3ds Max exporter가 3ds Max의 pivot 위치를 translation으로 내보낸 것이다 (판의 두께 절반에 해당). 실제로 root scale 1000 적용 후 translation은 약 `-0.1` 단위가 되어 판 두께(~0.2 단위)의 정확히 절반이다.

**Material은 PBR 단일 머티리얼 `Material #30` 하나**이며, baseColorTexture로 `textures/MarkerAICCTV_A.png`를 참조한다. metallicFactor 0.0, roughnessFactor **0.450053632**로 **정상 범위 값**이다 — LeakDetector·FLIREx의 Babylon exporter 범위 이탈 값 `-90.47056`이나 MT_01·LV_BAT의 경계값 `0.0`과 달리 PBR 사양 `[0, 1]` 범위 내 자연스러운 중간값으로, LithiumionBattery(roughness 0.5)·MCCB(0.5) 계열에 가깝다. Material id `#30`은 LV 계열의 `#342540XXX` 계열이나 MT_01의 `#342540102`와 전혀 다른 낮은 번호대로, 3ds Max 소스 파일에서 독립적으로 정의된 마커 전용 material slot임을 시사한다. MeshStateMixin은 `material.color` 채널만 갱신하므로 이 roughness/metallic 값과 무관하게 상태 색상이 올바르게 적용된다. doubleSided 플래그가 명시되지 않았는데 판상형 마커가 한쪽 면만 렌더되면 카메라 각도에 따라 사라져 보일 수 있으나, three.js의 기본 렌더링과 마커 용도 특성상 위쪽(또는 아래쪽) 단일 면만 보여도 무방하다.

Mesh 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 60, 인덱스 60 — 단일 primitive, 양면 판상형 지오메트리). LithiumionBattery(25200)의 1/420, LeakDetector(1784)의 1/30, MT_01(26)의 약 2배 규모로, **본 저장소 개별 3D 컴포넌트 중 아이콘 마커에 어울리는 매우 적은 정점 수**다. 인덱스 60 / 정점 60 비율(1:1)은 인덱스 재사용이 거의 없는 저복잡도 판 구조를 시사한다 (MT_01의 정점 26 / 인덱스 48의 1.85:1 재사용비와 대비).

좌표 바운드(루트 스케일 적용 전): POSITION min [-0.0029696722, -0.00342908176, -0.000100158271] ~ max [0.0029696722, 0.00342908176, 0.000100158279] — 원시 크기 약 0.00594 × 0.00686 × 0.000200 단위. 루트 `scale [1000, 1000, 1000]`이 적용되므로 실제 장면 크기는 약 **5.94 × 6.86 × 0.20 단위**로 **X·Y는 수 단위 크기이지만 Z축이 약 0.2 단위로 극단적으로 얇은 판상형**이다. LithiumionBattery(~434 × 228 × 108, root scale 1000 후 대형 판상)의 1/75 스케일이며, Y축이 약간 더 긴 거의 정사각에 가까운 판(X:Y ≈ 1:1.15)이다. MT_01의 3.70 × 3.72 × 3.00 입방에 가까운 블록형과 비교하면 훨씬 얇은 형태로, 마커/아이콘의 전형적 비율이다. preview의 카메라 바운드 기반 자동 거리 조정(`maxDim * 2.2 ≈ 15.1`)으로 적절한 시야가 확보된다.

**텍스처 폴더는 `textures/`** 이다. LV 계열의 `maps/` 규약이나 MT_01의 `maps/` 규약과 달리 Earthquake·FLIREx·ExitSign·ElecPad·LeakDetector·LithiumionBattery 선례의 `textures/` 규약을 따른다. GLTF 내부 `images[].uri`가 `textures/MarkerAICCTV_A.png` 단일 이미지를 참조하므로 이 파일만 `01_default/textures/` 폴더에 유지한다. 텍스처 파일명 `MarkerAICCTV_A.png`는 Node/Mesh 이름과 정확히 일치하며, PNG 포맷은 마커 아이콘의 투명도/알파 채널을 활용할 가능성을 시사한다 (LithiumionBattery의 `Lithiumionbattery.jpg`·MT_01의 `MT.jpg`의 JPG와 대비 — JPG는 알파 미지원). 모델 폴더에는 보조 썸네일 `Marker_AICCTV-P.png`도 존재한다 (Earthquake·FLIREx·ExitSign·ElecPad·LeakDetector·LithiumionBattery·MT_01 선례와 동일).

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `MarkerAICCTV_A` Mesh의 단일 material(`Material #30`) 색상을 변경한다. 단일 Mesh × 단일 material 구조이므로 LeakDetector 같은 "배열 material 일괄 색상 치환"이 아니라 LithiumionBattery·MT_01·LV_BAT·LV_2P_09/10/11과 동일한 **"단일 material 단일 색상 치환"** 경로를 탄다. MCCB의 "루트 Group 1-항목 × 자식 N-Mesh traverse 일괄 치환"과도 구분되는 가장 단순한 단일 객체 경로다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
