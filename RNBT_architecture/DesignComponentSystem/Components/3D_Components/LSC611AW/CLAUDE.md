# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `LSC611AW`) |
| 기본 Mixin | MeshStateMixin |
| meshName | LSC611AW |

## 장비 개요

LSC611AW는 3D 씬에서 단일 장비 하나에 대응하는 컴포넌트이다. 단일 GLTF 파일이 단일 Mesh를 가지며, 상태 데이터에 따라 Mesh 색상만 변경하는 Standard 변형만 제공한다.

GLTF(`models/LSC611AW/01_default/LSC611AW.gltf`)는 최상위 scene에 노드 하나(`LSC611AW`)만 가지며, 이 노드는 Mesh 0을 참조한다. Mesh는 단일 primitive(POSITION, NORMAL만, UV 없음)와 단일 material(`RED`, baseColorFactor 어두운 적색, PBR metallic-roughness)을 가진다. **GLTF 내부에 `images`/`textures` 배열이 없으며, 어떤 텍스처도 참조하지 않는다.** 폴더의 `LSC611AW-P.png`는 보조 맵 파일로 존재만 하며 GLTF와 연결되어 있지 않다 — 삭제해도 렌더링에 영향이 없으나 원본 자산 보존 차원에서 유지한다.

폴더명/컴포넌트명은 `LSC611AW`이고, GLTF 내부 Node/Mesh 이름도 동일한 대소문자 `LSC611AW`이다. Material 이름은 `RED`이지만 `getObjectByName`은 Node/Mesh 이름을 탐색하므로 **meshName은 반드시 `'LSC611AW'`를 사용해야 한다**. 구독으로 전달되는 `meshName` 값과 preview·페이지 레벨에서 호출하는 이름이 모두 `'LSC611AW'`이어야 한다.

모델의 좌표 바운드는 대략 [-0.085, -0.170, -0.164] ~ [0.085, 0.170, 0.164]로 반지름 ~0.17 단위의 작은 크기이다. 루트 스케일 변환이 없으므로 preview의 카메라는 이 크기에 맞춰 가깝게 배치한다. Mesh primitive는 단일 material 하나만 사용하므로 MeshStateMixin이 material 단일 객체 경로로 clone + color 적용한다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 단일 Mesh `LSC611AW`의 material 색상을 변경한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
