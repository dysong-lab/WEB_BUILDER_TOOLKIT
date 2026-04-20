# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `MT-M1`, 단일 primitive × 단일 material) |
| 기본 Mixin | MeshStateMixin |
| meshName | `MT-M1` (폴더명 `MT_01`과 **이름 불일치** — 폴더는 장비 번호 접미 `_01`, Node는 Mesh 접두 `MT-M` + 접미 `1`) |

## 장비 개요

MT_01(Mold Transformer #01, 몰드 변압기)은 중저압 배전반/변전실에 설치되어 고전압을 저전압으로 강압하는 건식 몰드 변압기를 표현하는 3D 컴포넌트이다. 단일 GLTF(`models/MT_01/01_default/MT_01.gltf`)의 scene은 루트 스케일 노드 없이 곧바로 Mesh Node `MT-M1`(mesh 0) 하나만을 가진다. **폴더명과 Node/Mesh 이름 사이에 형태 불일치**가 존재한다 — 폴더는 `MT_01`(언더스코어 + 2자리 장비 번호)이지만 GLTF 내부 Node/Mesh 이름은 `MT-M1`(하이픈 + Mesh 접두 `M` + 1자리 숫자)이다. 이것은 LV_BAT(폴더 `LV_BAT`/Node `LV-BAT1`)과 LV_R(폴더 `LV_R`/Node `LV-2R1`)의 "폴더-Node 형태 불일치형" 선례와 정확히 같은 축의 불일치이며, LithiumionBattery의 "순수 대소문자 차이"와는 다른 "구분자 + 번호 체계 차이"다. `getObjectByName`은 이름을 그대로 비교하므로 반드시 `'MT-M1'`(하이픈)로 조회해야 한다. FLIREx·ExitSign·ElecPad·Earthquake·LeakDetector 선례의 "폴더명 = Node/Mesh 이름" 규약과는 다르다.

GLTF 구조: `scene → "MT-M1"(mesh 0, rotation=[0,-1,0,4.371139e-08])` — 단일 Node, 단일 Mesh. 최상위 Mesh Node는 루트 스케일 노드 없이 곧바로 Mesh를 참조한다 (LV_BAT, LV_2P_02/09/10/11과 동일 패턴; LithiumionBattery의 `root(scale [1000,1000,1000]) → Mesh` 2층 구조와 대비). Node의 rotation `[0, -1, 0, 4.371139e-08]`은 Y축 180° 회전에 해당하는 quaternion으로, Babylon.js 3ds Max exporter가 좌표계 변환을 위해 루트 회전을 내보낸 것이다 (LV_BAT의 `[0,-1,0,1.19248806e-08]`와 동일 패턴). Mesh는 단일 primitive와 단일 material을 가지며, POSITION/NORMAL/TEXCOORD_0 속성을 포함한다 (정점 26, 인덱스 48). LV_BAT(46/84)·LithiumionBattery(25200/25200)·MCCB(352/672, 3개 자식 합산)와 비교해 본 저장소에서 가장 적은 정점 수 중 하나로, **몰드 변압기 본체를 매우 단순화한 블록 지오메트리**(사각 기둥 또는 박스형 몰드 케이스 형태)로 추정된다.

**Material은 PBR 단일 머티리얼 `Material #342540102` 하나**이며, baseColorTexture로 `maps/MT.jpg`를 참조한다. metallicFactor 0.0, roughnessFactor **0.0**, doubleSided `true`로 LV_BAT(metallic 0.0, roughness 0.0, doubleSided true)와 완전히 동일한 babylon.js 3ds Max exporter 출력 패턴을 보인다. LithiumionBattery(roughness 0.5)·MCCB(GRAY/WHITE의 roughness 0.5)의 "정상 범위 스칼라"와 달리 0.0 값이지만, `[0, 1]` 범위 내 경계값이므로 LeakDetector·FLIREx의 `-90.47056` 같은 Babylon exporter 범위 이탈 값과는 구분되는 "경계 정상값"이다. MeshStateMixin은 `material.color` 채널만 갱신하므로 이 roughness/metallic 값과 무관하게 상태 색상이 올바르게 적용된다. material id `#342540102`는 LV_BAT의 `#342540167`, LV_2P_11의 `#342540210`, LV_2P_10의 `#342540208`, LV_2P_09의 `#342540207`, LV_2P_02의 `#342540205`와 다른 **MT 계열 고유 번호**로, 3ds Max 소스 파일에서 별개의 material slot에서 내보내진 것임을 시사한다 (342540102는 342540167보다 작은 번호대로, 배터리 계열보다 먼저 정의된 것으로 보인다).

좌표 바운드(루트 스케일 없음): POSITION min [-1.8499999, -1.85944676, -1.5] ~ max [1.8499999, 1.85944676, 1.5] — 실제 장면 크기 약 **3.70 × 3.72 × 3.00 단위**. X·Y가 거의 동일한 약 3.7 단위, Z가 약 3.0 단위로 **정사각 기둥에 가까운 직육면체** 형태이다. LV_BAT의 0.8 × 2.95 × 2.2(판상, Y축이 가장 김), LithiumionBattery의 434 × 228 × 108(root scale 1000 적용 후, 판상형), MCCB의 0.10 × 0.09 × 0.20(원시 소형)과 비교하면 **본 저장소 개별 3D 컴포넌트 중 중형 크기대의 블록형** 장비다. 몰드 변압기 실제 장비가 약 1.5~2m 입방체 규모의 바닥 설치형이라는 점을 고려하면 이 바운드는 장면 단위를 미터로 해석한 원시 스케일로 보인다. preview의 카메라 바운드 기반 자동 거리 조정(`maxDim * 2.2 ≈ 8.2`)으로 적절한 시야가 확보된다.

**텍스처 폴더는 `maps/`** 이다. Earthquake·FLIREx·ExitSign·ElecPad·LeakDetector·LithiumionBattery·MCCB 선례의 `textures/` 규약이 아니라 LV 계열(LV_BAT, LV_01, LV_02, LV_1P_01~07, LV_2P_01~11, HV_1P_01)의 `maps/` 규약을 따른다. GLTF 내부 `images[].uri`가 `maps/MT.jpg` 단일 이미지를 참조하므로 이 파일만 `01_default/maps/` 폴더에 유지한다. 텍스처 파일명은 LV 계열의 `LV##.jpg`/`LV_UPS##.jpg`/`LV_BAT.jpg` 계열 어디에도 속하지 않는 **`MT.jpg`(Mold Transformer 약어, 장비 번호 접미 없는 기본명)** 를 사용한다. MCCB 선례처럼 동일 장비 계열의 추가 엔트리(`MT_02`, `MT_03` 등)가 생길 경우에도 텍스처 파일명이 `MT.jpg`로 공유될 가능성이 있음을 시사한다. 모델 폴더에는 보조 썸네일 `MT_01-P.png`도 존재한다 (Earthquake·FLIREx·ElecPad·LeakDetector·LithiumionBattery·MCCB 선례와 동일).

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `MT-M1` Mesh의 단일 material(`Material #342540102`) 색상을 변경한다. 단일 Mesh × 단일 material 구조이므로 LeakDetector 같은 "배열 material 일괄 색상 치환"이 아니라 LV_BAT·LithiumionBattery·LV_2P_09/10/11 등과 동일한 **"단일 material 단일 색상 치환"** 경로를 탄다. MCCB의 "루트 Group 1-항목 × 자식 N-Mesh traverse 일괄 치환"과도 구분되는 가장 단순한 단일 객체 경로다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
