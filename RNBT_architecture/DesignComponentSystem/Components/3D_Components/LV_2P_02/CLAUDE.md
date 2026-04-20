# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `LV-H1-D029`) |
| 기본 Mixin | MeshStateMixin |
| meshName | `LV-H1-D029` |

## 장비 개요

LV_2P_02는 3D 씬에서 단일 장비 하나에 대응하는 2상(2 Phase) 저전압(Low Voltage) 계열 컴포넌트이며, `LV_2P_*` 시리즈의 두 번째 엔트리이다. 단일 GLTF(`models/LV_2P_02/01_default/LV_2P_02.gltf`)의 scene은 단 하나의 Node(`LV-H1-D029`, mesh 0)만 참조한다. 직전 엔트리인 LV_2P_01이 가졌던 보조 `VRayLight001` Node(라이트 메타용 빈 Object3D)가 **이 엔트리에는 없다** — 순수 1-Node 구조이다. Standard 변형은 유일한 Mesh `LV-H1-D029`를 상태 색상의 대상으로 삼는다.

GLTF 구조: `scene → "LV-H1-D029"(mesh 0, rotation=[0,-1,0,1.19e-8])` — 단일 Node, 단일 Mesh. 최상위 Mesh Node는 루트 스케일 노드 없이 곧바로 Mesh를 참조한다. Mesh는 단일 primitive와 단일 material을 가지며, POSITION/NORMAL/TEXCOORD_0 속성을 포함한다. material은 `Material #342540205`(PBR, metallicFactor 0.0, roughnessFactor 0.0, doubleSided=true)이며 baseColorTexture로 `maps/LV_UPS05.jpg`를 참조한다.

**폴더명과 meshName 불일치 (주요 결정사항):** 폴더/컴포넌트 이름은 `LV_2P_02`이지만, GLTF 내부 Node/Mesh 이름은 `LV-H1-D029`이다. `getObjectByName`은 Node 이름으로 탐색하므로 **구독 데이터의 `meshName`은 반드시 `LV-H1-D029`** 이어야 한다. LV 시리즈는 폴더명-Node명 불일치가 관례이며, 직전 엔트리 LV_2P_01(`LV-2C1-U`)과도 다른 `LV-H1-D029` 형태(중앙 토큰 `H1` + 접미 토큰 `D029`)를 사용한다. 이는 LV_01(`LV-2D4`), LV_02(`LV-2H3`), LV_1P_01~07(`LV-2D2`, `LV-J1~J3`, `LV-LO1/LO2/LO005`), LV_2P_01(`LV-2C1-U`)과도 다른 고유한 명명이므로 다른 LV 컴포넌트의 meshName을 그대로 유추하지 않는다.

GLTF 좌표 바운드(스케일 적용 없음): POSITION min [-0.399998665, -1.275, -1.09999979] ~ max [0.399998665, 1.275, 1.09999967] → 실제 장면 크기 약 0.8 × 2.55 × 2.2 단위. LV_2P_01(1.1 × 2.95 × 2.2)보다 X·Y 방향이 좁으며, 카메라 바운드 기반 자동 조정으로 preview가 맞춰진다.

> 텍스처 폴더는 `maps/` (HV_1P_01, LV_01, LV_02, LV_1P_01~07, LV_2P_01 선례와 동일). GLTF 내부 `images[].uri`가 `maps/LV_UPS05.jpg`로 참조되므로 폴더명을 유지한다. 보조 자산 `LV_2P_02-P.png`는 파일로만 존재하며 GLTF에 연결되어 있지 않다 (원본 보존). 텍스처 파일명은 LV_2P_01의 `LV11.jpg`, LV_1P_07의 `LV_UPS08.jpg`와 다른 `LV_UPS05.jpg` 계열명을 사용하므로 파일명을 임의로 재작성하지 않는다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `LV-H1-D029` Mesh의 material 색상을 변경한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
