# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `LV-LO2`) |
| 기본 Mixin | MeshStateMixin |
| meshName | `LV-LO2` |

## 장비 개요

LV_1P_06은 3D 씬에서 단일 장비 하나에 대응하는 1상(1 Phase) 저전압(Low Voltage) 계열 컴포넌트이다. 단일 GLTF(`models/LV_1P_06/01_default/LV_1P_06.gltf`)의 scene은 최상위 Node 하나만 포함하며, 이 Node가 곧 장비 Mesh(`LV-LO2`, mesh 0)이다. LV_1P_02(`LV-J1`), LV_1P_03(`LV-J2`), LV_1P_04(`LV-J3`), LV_1P_05(`LV-LO1`)와 동일한 단일-Mesh 패턴을 이어받으며, LV_1P_06은 Node/Mesh 이름이 `LV-LO2`로 정해져 있다. scene은 오직 `LV-LO2` Mesh 하나로 구성되며 라이트 메타 Node(`VRayLight001` 등)는 포함되어 있지 않다. Standard 변형은 유일한 Mesh `LV-LO2`를 상태 색상의 대상으로 삼는다.

GLTF 구조: `scene → "LV-LO2"(mesh 0, rotation=[0,-1,0,1.19e-8])`. 루트 스케일 노드 없이 곧바로 Mesh를 참조한다 (LV_01/LV_02/LV_1P_01~05와 동일한 패턴). Mesh는 단일 primitive와 단일 material을 가지며, POSITION/NORMAL/TEXCOORD_0 속성을 포함한다. material은 `Material #342540184`(PBR, metallicFactor 0.0, roughnessFactor 0.0, doubleSided=true)이며 baseColorTexture로 `maps/LV07.jpg`를 참조한다.

**폴더명과 meshName 불일치 (주요 결정사항):** 폴더/컴포넌트 이름은 `LV_1P_06`이지만, GLTF 내부 Node/Mesh 이름은 `LV-LO2`이다. `getObjectByName`은 Node 이름으로 탐색하므로 **구독 데이터의 `meshName`은 반드시 `LV-LO2`** 이어야 한다. 이 매핑은 `Standard/CLAUDE.md`의 모델 참조 섹션에 고정되어 있다. LV 시리즈는 폴더명-Node명 불일치가 관례이므로(`LV_01` → `LV-2D4`, `LV_02` → `LV-2H3`, `LV_1P_01` → `LV-2D2`, `LV_1P_02` → `LV-J1`, `LV_1P_03` → `LV-J2`, `LV_1P_04` → `LV-J3`, `LV_1P_05` → `LV-LO1`) 모델 로드 시 주의한다. `LV_1P_06`은 `LV_1P_05`의 `LV-LO1` 뒤를 잇는 `LV-LO2` 이름을 사용하므로 다른 LV 컴포넌트의 meshName을 유추하지 않는다.

GLTF 좌표 바운드(스케일 적용 없음): POSITION min [-0.450003624, -1.4750011, -1.09999967] ~ max [0.450003624, 1.4750011, 1.09999967] → 실제 장면 크기 약 0.9 × 2.95 × 2.2 단위. preview 카메라는 이 바운드에 맞춰 근거리로 배치한다.

> 텍스처 폴더는 `maps/` (HV_1P_01, LV_01, LV_02, LV_1P_01~05 선례와 동일). GLTF 내부 `images[].uri`가 `maps/LV07.jpg`로 참조되므로 폴더명을 유지한다. 보조 자산 `LV_1P_06-P.png`는 파일로만 존재하며 GLTF에 연결되어 있지 않다 (원본 보존).

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `LV-LO2` Mesh의 material 색상을 변경한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
