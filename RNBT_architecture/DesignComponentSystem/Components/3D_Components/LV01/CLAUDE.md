# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 2 Mesh: `LV01`, `glass_A`) |
| 기본 Mixin | MeshStateMixin |
| meshName | `LV01`, `glass_A` |

## 장비 개요

LV01은 3D 씬에서 단일 장비 하나에 대응하는 컴포넌트이다. 단일 GLTF(`models/LV01/01_default/LV01.gltf`)는 내부에 본체(`LV01`)와 유리 커버(`glass_A`) 두 개의 Mesh를 형제 노드로 가지며, 이들이 `root` 노드 아래에 함께 묶여 하나의 장비를 구성한다. Standard 변형은 두 Mesh 모두를 상태 색상의 대상으로 삼는다.

GLTF 구조: `scene → root(scale=1000) → [ Node "LV01"(mesh 0) , Node "glass_A"(mesh 1) ]`. 두 Mesh는 각각 단일 primitive와 단일 material을 가진다. Mesh 0(`LV01`)은 material `LV01`(PBR, roughness 0.1, baseColorTexture `textures/1FS020.jpg`)를, Mesh 1(`glass_A`)은 material `glass_A`(PBR, roughness 0.8, baseColorTexture `textures/glass_A.png`, **`alphaMode: BLEND`·`doubleSided: true`** — 반투명 유리)를 사용한다. 두 Mesh 모두 POSITION/NORMAL/TEXCOORD_0 속성을 포함한다.

`root` 노드에 `scale: [1000, 1000, 1000]`이 적용되어 있으므로, GLTF 내부 좌표 바운드(약 [-0.0040, -0.0119, -0.0096] ~ [0.0040, 0.0119, 0.0096])에 스케일을 곱하면 실제 장면 크기는 대략 8 × 24 × 19 단위이다. preview 카메라는 이 scaled 바운드에 맞춰 배치해야 한다.

폴더/컴포넌트명은 `LV01`이며, GLTF Node/Mesh 이름은 `LV01`, `glass_A`이다. `getObjectByName`은 Node 이름으로 탐색하므로 구독 데이터의 `meshName`은 반드시 이 두 값 중 하나여야 한다. 보조 자산 `LV01-P.png`는 파일로만 존재하며 GLTF에 연결되어 있지 않다 (원본 보존 차원에서 유지).

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `LV01`과 `glass_A` 두 Mesh의 material 색상을 함께 변경한다. 유리(`glass_A`)는 BLEND 모드이므로 색상 변경 후에도 반투명 특성이 유지된다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
