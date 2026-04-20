# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `MeetingSofa`, 단일 primitive × 단일 material) |
| 기본 Mixin | MeshStateMixin |
| meshName | `MeetingSofa` (폴더명 = Node/Mesh 이름 일치) |

## 장비 개요

MeetingSofa는 사무/라운지 공간을 구성하는 미팅용 소파 가구를 표현하는 3D 컴포넌트이다. 단일 GLTF(`models/MeetingSofa/01_default/MeetingSofa.gltf`)의 scene은 루트 스케일 노드 `root`(scale [1000, 1000, 1000])와 그 아래 Mesh Node `MeetingSofa`(mesh 0) 하나만을 가진다. 폴더명과 Node/Mesh 이름이 동일(`MeetingSofa`)하므로 LithiumionBattery의 "폴더-Node 대소문자 불일치" 같은 특이 케이스가 없고, ArmChair·Chair_Cafe 같은 다수 가구 선례의 "이름 일치형" 규약을 그대로 따른다.

GLTF 구조: `scene → root(scale [1000,1000,1000]) → "MeetingSofa"(mesh 0, 1 primitive, 1 material)`. Mesh Node에는 `translation [0, ~0, 0]`(수치상 0)과 `rotation [0, -0.7071068, 0, 0.7071067]`(Y축 기준 -90도 회전)이 적용되어 있다. ArmChair의 Y축 거의 0도 회전(`-5.96e-08`)과 달리 실제 회전이 유의하게 들어가 있으므로 preview의 카메라 프레이밍이 기본 바운드 기준으로 자동 조정되는지 확인이 필요하다 (Three.js `Box3.setFromObject`는 월드 변환 후 AABB를 계산하므로 회전이 반영된 바운드가 잡힌다). LithiumionBattery의 "1-Node × 1-primitive × 1-material", ArmChair의 "1-Node × 1-primitive × 1-material"과 동일한 가장 단순한 단일 서브메시 패턴이다.

Material은 PBR 단일 머티리얼 `Material #25192277` 하나이며, baseColorTexture `textures/MeetingSofa.jpg`를 참조한다. material 이름은 3ds Max 원본에서 생성된 숫자 일련번호 형식(`Material #NNNNNNNN`)으로 ArmChair의 `Material #25191008`와 동일한 명명 패턴이다 — LithiumionBattery의 `Lithiumionbattery` 같은 "장비명 material"과 달리 가구 계열 일부가 이 숫자 패턴을 가진다. metallicFactor 0.0, roughnessFactor 0.450053632로 **정상 범위 값**이다 (ArmChair와 동일 수치; LeakDetector·FLIREx 등 Babylon.js glTF exporter가 내보낸 범위 이탈 roughness(`-90.47056`)와 대비되는 정상 스칼라). MeshStateMixin은 `material.color` 채널만 갱신하므로 material 이름이 숫자 형식이어도 색상 치환 경로는 동일하다.

Mesh 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 395, 인덱스 726 — 단일 primitive). ArmChair(정점 630)의 약 0.63배, LithiumionBattery(25200 정점)의 약 0.016배로 본 저장소 개별 3D 컴포넌트 중 **매우 낮은 정점 밀도**에 속한다. 가구의 실루엣을 최소 폴리곤으로 단순화한 로우폴리 모델로 추정된다.

좌표 바운드(루트 스케일 적용 전): POSITION min [-0.00740001, -3.81E-09, -0.00484999] ~ max [0.00739999, 0.0300000, 0.00485000] — 원시 크기 약 0.01480 × 0.03 × 0.00970 단위. 루트 `scale [1000, 1000, 1000]`이 적용되므로 실제 장면 크기는 약 **14.8 × 30 × 9.7 단위**로 ArmChair(~11 × 10.8 × 10)보다 Y축으로 약 3배 높은 세로 긴 형태이다. Mesh Node의 Y축 -90도 회전이 적용되면 월드 바운드는 축이 교체되어 대략 `{X, Z} ≈ {9.7, 14.8}`, `Y ≈ 30` 형태로 나타난다. preview의 카메라 바운드 기반 자동 거리 조정(`maxDim * distanceFactor`)이 이 수치를 수용한다.

**텍스처 폴더는 `textures/`** 이다. ArmChair·Earthquake·FLIREx·ExitSign·ElecPad·LeakDetector 선례와 동일한 `textures/` 규약을 따른다. GLTF 내부 `images[].uri`가 `textures/MeetingSofa.jpg` 단일 이미지를 참조하므로 이 파일만 `01_default/textures/` 폴더에 유지한다. 모델 폴더에는 보조 썸네일 `MeetingSofa-P.png`도 존재한다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `MeetingSofa` Mesh의 단일 material(`Material #25192277`) 색상을 변경한다. 단일 Mesh × 단일 material 구조이므로 LeakDetector 같은 "배열 material 일괄 색상 치환"이 아니라 ArmChair·LithiumionBattery와 동일한 "단일 material 단일 색상 치환" 경로를 탄다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
