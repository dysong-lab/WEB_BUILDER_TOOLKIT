# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `LV-2J7`) |
| 기본 Mixin | MeshStateMixin |
| meshName | `LV-2J7` |

## 장비 개요

LV_2P_05는 3D 씬에서 단일 장비 하나에 대응하는 2상(2 Phase) 저전압(Low Voltage) 계열 컴포넌트이며, `LV_2P_*` 시리즈의 다섯 번째 엔트리이다. 단일 GLTF(`models/LV_2P_05/01_default/LV_2P_05.gltf`)의 scene은 단 하나의 Node(`LV-2J7`, mesh 0)만 참조한다. LV_2P_02(`LV-H1-D029`), LV_2P_03(`LV-2D13`), LV_2P_04(`LV-2F3`)와 마찬가지로 보조 `VRayLight001` Node가 **이 엔트리에는 없다** — 순수 1-Node 구조이다 (LV_2P_01만 2-Node 패턴이었다). Standard 변형은 유일한 Mesh `LV-2J7`을 상태 색상의 대상으로 삼는다.

GLTF 구조: `scene → "LV-2J7"(mesh 0, rotation=[0,-1,0,-7.54979e-08])` — 단일 Node, 단일 Mesh. 최상위 Mesh Node는 루트 스케일 노드 없이 곧바로 Mesh를 참조한다 (LV_2P_02/LV_2P_03/LV_2P_04와 동일한 1-Node 패턴). Mesh는 단일 primitive와 단일 material을 가지며, POSITION/NORMAL/TEXCOORD_0 속성을 포함한다 (정점 36, 인덱스 84). LV_2P_04(정점 56, 인덱스 120)보다 더 단순한 지오메트리이다. material은 `Material #342540215`(PBR, metallicFactor 0.0, roughnessFactor 0.0, doubleSided=true)이며 baseColorTexture로 `maps/LV_UPS13.jpg`를 참조한다.

**폴더명과 meshName 불일치 (주요 결정사항):** 폴더/컴포넌트 이름은 `LV_2P_05`이지만, GLTF 내부 Node/Mesh 이름은 `LV-2J7`이다. `getObjectByName`은 Node 이름으로 탐색하므로 **구독 데이터의 `meshName`은 반드시 `LV-2J7`** 이어야 한다. LV 시리즈는 폴더명-Node명 불일치가 관례이며, `LV_2P_05`는 기존 `LV-2D`, `LV-2H`, `LV-J`, `LV-LO`, `LV-2C`, `LV-H1`, `LV-2F` 어느 패밀리에도 속하지 않고 **새로운 `LV-2J` 접두 + 접미 토큰 `7`** 형태를 사용한다. LV_2P_01(`LV-2C1-U`), LV_2P_02(`LV-H1-D029`), LV_2P_03(`LV-2D13`), LV_2P_04(`LV-2F3`)와는 접두가 전혀 다르므로 다른 LV 컴포넌트의 meshName을 그대로 유추하지 않는다. 접미 토큰도 단일 숫자 `7`이며 직전 `3`(LV_2P_04)과 다르다.

GLTF 좌표 바운드(스케일 적용 없음): POSITION min [-0.5000048, -1.275, -1.09999979] ~ max [0.5000048, 1.275, 1.09999967] → 실제 장면 크기 약 1.0 × 2.55 × 2.2 단위. LV_2P_02/LV_2P_03(0.8 × 2.55 × 2.2)과 Y·Z는 동일하고 X만 0.2 단위 더 크며, LV_2P_01·LV_2P_04(1.1 × 2.95 × 2.2)보다 X·Y가 각각 0.1 / 0.4 단위 작다. 카메라 바운드 기반 자동 조정으로 preview가 맞춰진다.

> 텍스처 폴더는 `maps/` (HV_1P_01, LV_01, LV_02, LV_1P_01~07, LV_2P_01~04 선례와 동일). GLTF 내부 `images[].uri`가 `maps/LV_UPS13.jpg`로 참조되므로 폴더명을 유지한다. LV_2P_04 모델 폴더에는 없던 보조 썸네일이 **LV_2P_05 모델 폴더에는 `LV_2P_05-P.png`로 존재한다** (LV_2P_02의 `LV_2P_02-P.png`, LV_2P_03의 `LV_2P_03-P.png` 선례와 동일). GLTF가 참조하는 `LV_UPS13.jpg`만 `maps/`에 유지한다. 텍스처 파일명은 LV_2P_01의 `LV11.jpg`, LV_2P_02의 `LV_UPS05.jpg`, LV_2P_03의 `LV_UPS14.jpg`, LV_2P_04의 `LV09.jpg`와 다른 `LV_UPS13.jpg`(LV_UPS 접두 계열로 LV_2P_02/LV_2P_03과 동일 계열, LV_2P_03의 `LV_UPS14.jpg`와는 한 자리 차이)를 사용하므로 파일명을 임의로 재작성하지 않는다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `LV-2J7` Mesh의 material 색상을 변경한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
