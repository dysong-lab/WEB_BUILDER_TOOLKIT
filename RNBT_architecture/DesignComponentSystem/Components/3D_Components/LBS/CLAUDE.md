# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Group: `LBS`) |
| 기본 Mixin | MeshStateMixin |
| meshName | LBS |

## 장비 개요

LBS(Load Break Switch)는 전력 계통에서 부하 상태로 회로를 개폐할 수 있는 부하개폐기를 표현하는 3D 컴포넌트이다. GLTF는 최상위 Node `LBS`(Group) 아래 4개의 자식 Mesh Node를 가진다: `Line012`(금속 바/라인, material `metal03_Gold`), `Circle073`(금색 원형 부품, material `metal03_Gold`), `Rectangle171`(플라스틱 바디, material `plastic01`), `Circle071`(상단 애자, material `RED`). 텍스처 폴더명은 표준인 `textures/`이며 `metal03_Gold` material이 `TexturesCom_Metal_GoldOld_1K_*` 텍스처들을 사용한다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 최상위 Group `LBS`를 대상으로 하위 Mesh들의 material 색상을 일괄 변경한다. MeshStateMixin은 `getObjectByName`으로 대상을 조회한 후 Group이면 자식 Mesh들을 traverse하여 각 material을 clone 후 color를 적용한다 (multi-material mesh도 지원). 폴더/컴포넌트명과 GLTF 최상위 Node 이름이 모두 `LBS`로 일치하므로 meshName 주의 사항은 없다. register.js는 meshName을 하드코딩하지 않고, 구독 데이터가 전달한 meshName을 MeshStateMixin이 `getObjectByName`으로 해석한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
