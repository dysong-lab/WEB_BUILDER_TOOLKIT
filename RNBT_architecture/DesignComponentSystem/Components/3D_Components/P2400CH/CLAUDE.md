# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = Group(`P2400CH`) × 3 Mesh 자식: `P300C_004`, `P300C_006`, `P300C_008`) |
| 기본 Mixin | MeshStateMixin |
| meshName | `P2400CH` — **Group Node**. MeshStateMixin이 Group 타겟에 대해 `traverse`로 자식 Mesh에 color를 일괄 적용하므로 자식 3개 이름을 하드코딩할 필요 없음. |

## 장비 개요

P2400CH는 발전/배전 계열 패널형(P300C 모듈 3단 집합) 장비를 표현하는 3D 컴포넌트이다. 단일 GLTF(`models/P2400CH/01_default/P2400CH.gltf`)의 scene은 Group Node `P2400CH` 하나를 최상위로 가지며, 그 아래 세 개의 자식 Mesh Node — `P300C_004`(mesh 0), `P300C_006`(mesh 1), `P300C_008`(mesh 2) — 가 배치된다. **폴더명 `P2400CH`와 GLTF 최상위 Node 이름 `P2400CH`가 완전히 일치**하며 (OHU103·LeakDetector·FLIREx·ExitSign 선례와 동일한 "이름 일치형" 규약), `getObjectByName('P2400CH')`로 Group을 얻은 뒤 MeshStateMixin의 Group-traverse 경로로 세 자식 Mesh의 material을 일괄 치환한다. OutdoorConditioner_Ani(폴더명 ≠ 자식 Mesh 3개 이름, 자식 이름들을 직접 하드코딩)나 Earthquake(폴더명 = 자식 Mesh 1개 이름, 두 자식을 각각 열거)와 달리, **폴더명이 Group 이름과 일치**하므로 meshName 배열이 필요 없고 단일 이름 `P2400CH`로 전체 그룹을 다룬다.

GLTF 구조: `scene → "P2400CH"(Group Node, translation≈0, children [1,2,3])` 아래에
- `P300C_004`(mesh 0, 1 primitive, 1 material) — translation [0, 0, 0.07481] (Z축 +)
- `P300C_006`(mesh 1, 1 primitive, 1 material) — translation [0, 0, -0.000244] (원점 근처)
- `P300C_008`(mesh 2, 1 primitive, 1 material) — translation [0, -0.000999, 0.003307] (근소한 Y/Z 오프셋)

의 세 Mesh Node가 Z축을 따라 배치되어 있다. **루트 `scale` 보정이 없다** — Earthquake·OHU103·OutdoorConditioner_Ani가 모두 `root(scale [1000,1000,1000])` 컨테이너를 가졌던 것과 대조적으로, P2400CH는 원본 유닛 크기(약 0.153 × 0.092 × 0.156 단위)를 그대로 사용한다. babylon.js glTF exporter for 3dsmax 2023 v20220628.14로 생성되었으며, 타 선례(`v20221031.2`, `v20220628.14` 혼재)와 동일한 파이프라인 계열이다. 자식 Mesh Node에 rotation 보정이 없으므로 3ds Max 원본 축 방향이 그대로 유지된다.

Mesh 정점 밀도(각 primitive 단위):
- `P300C_004`: POSITION 4 · 인덱스 6 — 초저밀도 판상 조각(폭 약 0.128 × 높이 0.067 × 두께 0.0). Z=0 평면의 단일 사각형(2 triangle, 6 index = 4 vertex의 1.5배 — 사각형 공유 대각선)으로 보인다
- `P300C_006`: POSITION 212 · 인덱스 396 — 재사용 비율 약 1.87배. 중밀도 박스/판상 집합체. 바운드 약 0.153 × 0.092 × 0.156 — **본 그룹의 최대 Mesh**이며 메인 본체
- `P300C_008`: POSITION 112 · 인덱스 168 — 재사용 비율 1.5배. 저밀도 판상(0.153 × 0.048 × 0.150)

세 Mesh는 POSITION/NORMAL/TEXCOORD_0의 표준 속성 셋만 가진다 (OutdoorConditioner_Ani의 COLOR_0 추가 속성과 대비되는 OHU103과 동일한 표준 패턴).

Material은 3개 PBR material:
- `P2400CH` (material 0) — `P300C_004`에 적용. baseColorTexture `textures/P2400CH.jpg`, **doubleSided=true**. 외관 상단 표지판/레이블 판(양면 가시) 용도로 추정
- `dGRAY` (material 1) — `P300C_006`에 적용. baseColorFactor [0.0645, 0.0699, 0.0806, 1.0] (어두운 회색), roughnessFactor 0.5. 본체 메인 케이싱의 매트한 다크그레이
- `black` (material 2) — `P300C_008`에 적용. baseColorFactor [0.052, 0.052, 0.052, 1.0] (거의 검정), roughnessFactor 0.5, **doubleSided=true**. 상단 또는 전면 패널의 블랙 프레임

세 material 이름이 모두 **의미 있는 문자열**(`P2400CH`, `dGRAY`, `black`)이다 — MeetingSofa·ArmChair·MetalSphere·OHU103 선례의 3ds Max 숫자 일련번호(`Material #42136` 등)나 OutdoorConditioner_Ani의 `#42064`·`#42066` 규약과 달리, 모델러가 수동으로 의미 있는 이름을 부여한 드문 케이스. baseColorTexture는 1개만 존재하며(`textures/P2400CH.jpg`) `dGRAY`·`black`은 factor만 사용한다. metallicFactor는 지정되지 않아 glTF 기본값 1.0이 적용될 수 있으나 baseColorFactor로 표현되는 어두운 톤이 주된 외형 결정 요소이다.

좌표 바운드(루트 스케일 없음, 원시 로컬):
- Group `P2400CH` 전체: 대략 [-0.076, -0.046, -0.078] ~ [0.076, 0.046, 0.156] (Z축은 `P300C_004`의 translation +0.075까지 확장) — **약 0.153 × 0.092 × 0.234 단위**
- X축(폭) · Y축(높이)은 원점 대칭, **Z축(깊이)이 주축**이며 세 모듈이 Z축을 따라 적층/나열되는 배치

**루트 scale이 없으므로 실제 장면 크기도 약 0.15 × 0.09 × 0.23 단위**의 초소형이다. 이는 OHU103(실제 32 × 17.6 × 10.5 단위, root scale 1000)이나 OutdoorConditioner_Ani(실제 ~12 × 17 × 19 단위, root scale 1000 + child scale 0.15)에 비해 **2~3 자릿수 더 작은** 스케일이므로 preview 카메라 near/far 및 grid 사이즈도 이에 맞춰 축소된 값으로 구성한다(본 저장소 다수 선례의 "root scale 1000 + far 100~500" 패턴이 아닌 "root scale 없음 + far 10" 패턴).

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에서 `meshName: 'P2400CH'`로 Group 전체 색상을 변경한다. MeshStateMixin은 `getObjectByName('P2400CH')`로 Group을 얻은 뒤 `obj.material`이 없으므로 `obj.traverse`로 자식 Mesh들의 material을 각각 clone하여 색상을 일괄 적용하는 Group 경로로 동작한다. 세 Mesh 각각의 material이 다르더라도(`P2400CH`/`dGRAY`/`black`) MeshStateMixin이 각 child Mesh에 대해 material을 clone한 뒤 color만 치환하므로, 원본 material 속성(doubleSided, roughness 등)은 그대로 유지된다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
