# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `LV-2C1-U`) |
| 기본 Mixin | MeshStateMixin |
| meshName | `LV-2C1-U` |

## 장비 개요

LV_2P_01은 3D 씬에서 단일 장비 하나에 대응하는 2상(2 Phase) 저전압(Low Voltage) 계열 컴포넌트이며, 저장소에서 `LV_2P_*` 시리즈의 첫 번째 엔트리이다. 단일 GLTF(`models/LV_2P_01/01_default/LV_2P_01.gltf`)의 scene은 두 개의 Node를 참조하지만, 실제 Mesh는 최상위 Node 하나(`LV-2C1-U`, mesh 0)뿐이며 두 번째 Node는 `VRayLight001`(라이트 참조용, Three.js 로더에서는 빈 Object3D로 로드됨)로 렌더 대상이 아니다. LV_01(`LV-2D4`), LV_02(`LV-2H3`), LV_1P_01(`LV-2D2`)과 동일한 "2-Node: mesh + VRayLight001" 패턴을 따른다. Standard 변형은 유일한 Mesh `LV-2C1-U`를 상태 색상의 대상으로 삼는다.

GLTF 구조: `scene → "LV-2C1-U"(mesh 0, rotation=[0,-1,0,1.19e-8])`, 추가로 `"VRayLight001"`(라이트 메타데이터 Node, Mesh 아님). 최상위 Mesh Node는 루트 스케일 노드 없이 곧바로 Mesh를 참조한다 (LV_01/LV_02/LV_1P_01~07과 동일 패턴). Mesh는 단일 primitive와 단일 material을 가지며, POSITION/NORMAL/TEXCOORD_0 속성을 포함한다. material은 `Material #342540191`(PBR, metallicFactor 0.0, roughnessFactor 0.0, doubleSided=true)이며 baseColorTexture로 `maps/LV11.jpg`를 참조한다.

**폴더명과 meshName 불일치 (주요 결정사항):** 폴더/컴포넌트 이름은 `LV_2P_01`이지만, GLTF 내부 Node/Mesh 이름은 `LV-2C1-U`이다. `getObjectByName`은 Node 이름으로 탐색하므로 **구독 데이터의 `meshName`은 반드시 `LV-2C1-U`** 이어야 한다. 이 매핑은 `Standard/CLAUDE.md`의 모델 참조 섹션에 고정되어 있다. LV 시리즈는 폴더명-Node명 불일치가 관례이므로(`LV_01` → `LV-2D4`, `LV_02` → `LV-2H3`, `LV_1P_01` → `LV-2D2`, `LV_1P_02` → `LV-J1`, `LV_1P_03` → `LV-J2`, `LV_1P_04` → `LV-J3`, `LV_1P_05` → `LV-LO1`, `LV_1P_06` → `LV-LO2`, `LV_1P_07` → `LV-LO005`) 모델 로드 시 주의한다. `LV_2P_01`은 1P 계열의 `LV-2D2/J1/J2/J3/LO1/LO2/LO005` 명명 규칙과 다른 `LV-2C1-U` 형태(중앙 토큰 `2C1` + 접미사 `-U`)를 사용하므로 다른 LV 컴포넌트의 meshName을 그대로 유추하지 않는다.

GLTF 좌표 바운드(스케일 적용 없음): POSITION min [-0.550004959, -1.47500038, -1.09999979] ~ max [0.550004959, 1.47500038, 1.09999979] → 실제 장면 크기 약 1.1 × 2.95 × 2.2 단위. preview 카메라는 이 바운드에 맞춰 근거리로 배치한다.

> 텍스처 폴더는 `maps/` (HV_1P_01, LV_01, LV_02, LV_1P_01~07 선례와 동일). GLTF 내부 `images[].uri`가 `maps/LV11.jpg`로 참조되므로 폴더명을 유지한다. 보조 자산 `LV_2P_01-P.png`는 파일로만 존재하며 GLTF에 연결되어 있지 않다 (원본 보존). 텍스처 파일명은 1P 계열의 `LV08.jpg`(LV_1P_01), `LV07.jpg`(LV_1P_06), `LV_UPS08.jpg`(LV_1P_07)와 또 다른 `LV11.jpg` 계열명을 사용하므로 파일명을 임의로 재작성하지 않는다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `LV-2C1-U` Mesh의 material 색상을 변경한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
