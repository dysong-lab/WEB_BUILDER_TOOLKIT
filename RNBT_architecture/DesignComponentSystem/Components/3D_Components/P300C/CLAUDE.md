# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = Group(`P300C`) × 3 Mesh 자식: `P300C_01`, `P300C_02`, `P300C_03`) |
| 기본 Mixin | MeshStateMixin |
| meshName | `P300C` — **Group Node**. MeshStateMixin이 Group 타겟에 대해 `traverse`로 자식 Mesh에 color를 일괄 적용하므로 자식 3개 이름을 하드코딩할 필요 없음. |

## 장비 개요

P300C는 발전/배전 계열의 **단일 패널형 모듈**을 표현하는 3D 컴포넌트이다. P2400CH(P300C 모듈 3단 집합)의 **기본 단위**에 해당하며, 단일 GLTF(`models/P300C/01_default/P300C.gltf`)의 scene은 Group Node `P300C` 하나를 최상위로 가지고 그 아래 세 개의 자식 Mesh Node — `P300C_01`(mesh 0), `P300C_02`(mesh 1), `P300C_03`(mesh 2) — 가 배치된다. **폴더명 `P300C`와 GLTF 최상위 Node 이름 `P300C`가 완전히 일치**하며 (P2400CH·OHU103·LeakDetector·FLIREx·ExitSign 선례와 동일한 "이름 일치형" 규약), `getObjectByName('P300C')`로 Group을 얻은 뒤 MeshStateMixin의 Group-traverse 경로로 세 자식 Mesh의 material을 일괄 치환한다. OutdoorConditioner_Ani(자식 이름들을 직접 하드코딩)나 Earthquake(폴더명 = 자식 Mesh 1개 이름, 두 자식을 각각 열거)와 달리, **폴더명이 Group 이름과 일치**하므로 meshName 배열이 필요 없고 단일 이름 `P300C`로 전체 모듈을 다룬다.

GLTF 구조: `scene → "P300C"(Group Node, translation≈0, children [1,2,3])` 아래에
- `P300C_01`(mesh 0, 1 primitive, 1 material) — translation [0, 0, +0.07481] (Z축 +)
- `P300C_02`(mesh 1, 1 primitive, 1 material) — translation [0, 0, -0.00025] (원점 근처)
- `P300C_03`(mesh 2, 1 primitive, 1 material) — translation [0, -0.001, +0.003313] (근소한 Y/Z 오프셋)

의 세 Mesh Node가 Z축을 따라 배치되어 있다. **루트 `scale` 보정이 없다** — Earthquake·OHU103·OutdoorConditioner_Ani가 모두 `root(scale [1000,1000,1000])` 컨테이너를 가졌던 것과 대조적으로, P300C는 P2400CH와 동일하게 원본 유닛 크기(약 0.153 × 0.067 × 0.156 단위)를 그대로 사용한다. babylon.js glTF exporter for 3dsmax 2023 v20220628.14로 생성되었으며 P2400CH와 동일한 파이프라인이다. 자식 Mesh Node에 rotation 보정이 없으므로 3ds Max 원본 축 방향이 그대로 유지된다.

Mesh 정점 밀도(각 primitive 단위):
- `P300C_01`: POSITION 4 · 인덱스 6 — 초저밀도 판상 조각(폭 약 0.128 × 높이 0.067 × 두께 0.0). Z=0 평면의 단일 사각형(2 triangle, 6 index = 4 vertex의 1.5배 — 사각형 공유 대각선)으로, 상단 레이블 판 용도
- `P300C_02`: POSITION 212 · 인덱스 396 — 재사용 비율 약 1.87배. 중밀도 박스/판상 집합체. 바운드 약 0.153 × 0.092 × 0.156 — **본 모듈의 최대 Mesh**이며 메인 본체 케이싱
- `P300C_03`: POSITION 112 · 인덱스 168 — 재사용 비율 1.5배. 저밀도 판상(0.153 × 0.048 × 0.150). 상/전면 블랙 프레임

세 Mesh는 POSITION/NORMAL/TEXCOORD_0의 표준 속성 셋만 가진다 (OutdoorConditioner_Ani의 COLOR_0 추가 속성과 대비되는 OHU103·P2400CH와 동일한 표준 패턴). 정점 총합은 328개, 인덱스 총합은 570개로 P2400CH와 동일한 통계 — **즉 P2400CH는 P300C의 노드 3세트 복제본이라기보다 동일한 mesh 지오메트리를 공유/재배치한 것으로 보인다** (정점 밀도 분포가 완전히 동일).

Material은 3개 PBR material이며, **P2400CH와 다른 중간(2번) material 이름·값**을 사용한다:
- `P300C` (material 0) — `P300C_01`에 적용. baseColorTexture `textures/P300C.jpg`, **doubleSided=true**. 외관 상단 표지판/레이블 판(양면 가시) 용도
- `plastic01` (material 1) — `P300C_02`에 적용. baseColorFactor [0.692, 0.661, 0.610, 1.0] (**밝은 베이지·그레이**, 피부색에 가까운 중간 톤), roughnessFactor 0.5, **metallicRoughnessTexture `textures/TexturesCom_Plastic_Polymer_1K_roughness255.jpg`**, doubleSided=true. 본체 메인 케이싱의 플라스틱 폴리머 질감
- `black` (material 2) — `P300C_03`에 적용. baseColorFactor [0.052, 0.052, 0.052, 1.0] (거의 검정), roughnessFactor 0.5, **doubleSided=true**. 상/전면 블랙 프레임

**P2400CH와의 material 차이**: P2400CH의 2번 material `dGRAY` (baseColorFactor [0.0645, 0.0699, 0.0806, 1.0], 어두운 회색 factor만)에 비해 P300C의 2번 material `plastic01`은 **훨씬 밝은 베이지/그레이**(0.69 대 0.065로 약 10배 밝음)이며, **추가로 metallicRoughnessTexture를 참조**한다. 세 material 이름이 모두 **의미 있는 문자열**(`P300C`, `plastic01`, `black`)이다 — MeetingSofa·ArmChair·MetalSphere·OHU103 선례의 3ds Max 숫자 일련번호(`Material #42136` 등)나 OutdoorConditioner_Ani의 `#42064`·`#42066` 규약과 달리, 모델러가 수동으로 의미 있는 이름을 부여한 케이스. baseColorTexture는 `P300C` material만 참조하며, `plastic01`은 metallicRoughnessTexture만, `black`은 factor만 사용한다.

좌표 바운드(루트 스케일 없음, 원시 로컬):
- Group `P300C` 전체: 대략 [-0.077, -0.046, -0.078] ~ [0.077, 0.046, 0.156] (Z축은 `P300C_01`의 translation +0.075까지 확장) — **약 0.153 × 0.092 × 0.234 단위**
- X축(폭) · Y축(높이)은 원점 대칭, **Z축(깊이)이 주축**이며 세 모듈이 Z축을 따라 적층/나열되는 배치

**루트 scale이 없으므로 실제 장면 크기도 약 0.15 × 0.09 × 0.23 단위**의 초소형이다. P2400CH와 동일한 스케일 특성이므로 preview 카메라 near/far 및 grid 사이즈도 P2400CH와 동일한 "root scale 없음 + far 10" 패턴으로 축소 구성한다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에서 `meshName: 'P300C'`로 Group 전체 색상을 변경한다. MeshStateMixin은 `getObjectByName('P300C')`로 Group을 얻은 뒤 `obj.material`이 없으므로 `obj.traverse`로 자식 Mesh들의 material을 각각 clone하여 색상을 일괄 적용하는 Group 경로로 동작한다. 세 Mesh 각각의 material이 다르더라도(`P300C`/`plastic01`/`black`) MeshStateMixin이 각 child Mesh에 대해 material을 clone한 뒤 color만 치환하므로, 원본 material 속성(doubleSided, roughness, metallicRoughnessTexture 등)은 그대로 유지된다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
