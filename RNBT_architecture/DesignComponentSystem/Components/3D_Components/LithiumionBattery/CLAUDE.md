# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `Lithiumionbattery`, 단일 primitive × 단일 material) |
| 기본 Mixin | MeshStateMixin |
| meshName | `Lithiumionbattery` (폴더명 `LithiumionBattery`와 **대소문자 불일치** — 'b'가 소문자) |

## 장비 개요

LithiumionBattery는 ESS(Energy Storage System) 등에 쓰이는 리튬이온 배터리 팩/모듈을 표현하는 3D 컴포넌트이다. 단일 GLTF(`models/LithiumionBattery/01_default/LithiumionBattery.gltf`)의 scene은 루트 스케일 노드 `root`(scale [1000, 1000, 1000])와 그 아래 Mesh Node `Lithiumionbattery`(mesh 0) 하나만을 가진다. **폴더명과 Node/Mesh 이름 사이에 대소문자 불일치**가 존재한다 — 폴더는 `LithiumionBattery`(카멜케이스, 'B' 대문자)이지만 GLTF 내부 Node/Mesh 이름은 `Lithiumionbattery`('b' 소문자)이다. 이것은 LV_R의 `LV-2R1` 같은 "폴더-Node 형태 불일치형"과 유사한 축의 불일치이지만, LV_R이 하이픈/숫자 형태 차이인 것과 달리 LithiumionBattery는 **순수 대소문자 차이**라는 점이 특이하다. `getObjectByName`은 대소문자를 구분하므로 반드시 `'Lithiumionbattery'`(소문자 'b')로 조회해야 한다. FLIREx·ExitSign·ElecPad·Earthquake·LeakDetector 선례의 "폴더명 = Node/Mesh 이름" 규약과는 이 한 가지 점에서 차이가 있다.

GLTF 구조: `scene → root(scale [1000,1000,1000]) → "Lithiumionbattery"(mesh 0, 1 primitive, 1 material)`. LeakDetector가 "1-Mesh × 2-primitive × 2-material"(multi-material submeshes)이고 Earthquake가 "2-Mesh Group"(Earthquake, Earthquake_A)인 것과 달리, LithiumionBattery는 **"순수 1-Node × 1-primitive × 1-material"** 구조로 LV 계열(LV_BAT, LV_R의 `LV-2R1` 등)과 동일한 가장 단순한 단일 서브메시 패턴이다.

Material은 PBR 단일 머티리얼 `Lithiumionbattery` 하나이며, baseColorTexture `textures/Lithiumionbattery.jpg`를 참조한다. metallicFactor 0.0, roughnessFactor 0.5로 **정상 범위 값**이다 — LeakDetector·FLIREx 등에서 Babylon.js glTF exporter가 3ds Max 원본 roughness를 정규화하지 않아 `-90.47056` 같은 비정상 값을 내보낸 것과 달리, 이 모델의 roughness 0.5는 PBR 사양 [0, 1] 범위 내 정상 스칼라이다. MeshStateMixin은 `material.color` 채널만 갱신하므로 이 roughness 값과 무관하게 상태 색상이 올바르게 적용된다.

Mesh 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 25200, 인덱스 25200 — 단일 primitive). LeakDetector(정점 1784)의 약 14배, LV 계열(정점 46)의 약 548배 규모로 본 저장소의 개별 3D 컴포넌트 중 매우 조밀한 정점 밀도를 가진다. 배터리 셀의 각 모서리·커넥터·라벨 영역을 세밀하게 묘사하기 위한 것으로 추정된다.

좌표 바운드(루트 스케일 적용 전): POSITION min [-0.217230, -0.113873, -0.054166] ~ max [0.217230, 0.113873, 0.054166] — 원시 크기 약 0.434 × 0.228 × 0.108 단위. 루트 `scale [1000, 1000, 1000]`이 적용되므로 실제 장면 크기는 약 **434 × 228 × 108 단위**로 본 저장소의 3D 컴포넌트 중 가장 큰 편에 속한다 (LeakDetector의 0.95 × 1.31 × 0.27 단위보다 약 250~450배 큰 스케일). 판상형으로 X축이 가장 긴 직육면체 형태이며, preview의 카메라 바운드 기반 자동 거리 조정이 이 대형 스케일을 수용한다.

**텍스처 폴더는 `textures/`** 이다. LV 시리즈의 `maps/` 규약과 달리 Earthquake·FLIREx·ExitSign·ElecPad·LeakDetector 선례의 `textures/` 규약을 따른다. GLTF 내부 `images[].uri`가 `textures/Lithiumionbattery.jpg` 단일 이미지를 참조하므로 이 파일만 `01_default/textures/` 폴더에 유지한다. 모델 폴더에는 보조 썸네일 `LithiumionBattery-P.png`도 존재한다 (Earthquake·FLIREx·ElecPad·LeakDetector 선례와 동일).

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `Lithiumionbattery` Mesh의 단일 material(Lithiumionbattery) 색상을 변경한다. 단일 Mesh × 단일 material 구조이므로 LeakDetector 같은 "배열 material 일괄 색상 치환"이 아니라 LV_BAT·LV_2P_09/10/11 등과 동일한 "단일 material 단일 색상 치환" 경로를 탄다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
