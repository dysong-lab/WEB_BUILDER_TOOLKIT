# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `LV03`) |
| 기본 Mixin | MeshStateMixin |
| meshName | `LV03` |

## 장비 개요

LV03는 3D 씬에서 단일 장비 하나에 대응하는 컴포넌트이다. 단일 GLTF(`models/LV03/01_default/LV03.gltf`)는 내부에 본체(`LV03`) 하나의 Mesh만을 가지며, 이 Mesh가 `root` 노드 아래에 묶여 하나의 장비를 구성한다. Standard 변형은 이 단일 Mesh를 상태 색상의 대상으로 삼는다.

GLTF 구조: `scene → root(scale=1000) → Node "LV03"(mesh 0)`. Mesh는 단일 primitive와 단일 material을 가진다. Mesh 0(`LV03`)은 material `LV03`(PBR, metallicFactor 0.2, roughnessFactor 0.5, baseColorTexture `textures/1FS010.jpg`)를 사용하며 POSITION/NORMAL/TEXCOORD_0 속성을 포함한다. 유리 커버나 보조 Mesh 없이 본체 단일 Mesh만 있는 단순 구조이다.

`root` 노드에 `scale: [1000, 1000, 1000]`이 적용되어 있으므로, GLTF 내부 좌표 바운드(약 [-0.0043, -0.0119, -0.0096] ~ [0.0040, 0.0119, 0.0096])에 스케일을 곱하면 실제 장면 크기는 대략 8.3 × 24 × 19 단위이다. preview 카메라는 이 scaled 바운드에 맞춰 배치해야 한다.

폴더/컴포넌트명은 `LV03`이며, GLTF Node/Mesh 이름 또한 `LV03`이다. `getObjectByName`은 Node 이름으로 탐색하므로 구독 데이터의 `meshName`은 반드시 `LV03`이어야 한다. 보조 자산 `LV03-P.png`는 파일로만 존재하며 GLTF에 연결되어 있지 않다 (원본 보존 차원에서 유지).

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `LV03` Mesh의 material 색상을 변경한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
