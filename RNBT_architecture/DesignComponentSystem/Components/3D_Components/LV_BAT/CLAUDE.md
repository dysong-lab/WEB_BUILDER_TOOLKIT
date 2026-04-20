# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `LV-BAT1`) |
| 기본 Mixin | MeshStateMixin |
| meshName | `LV-BAT1` |

## 장비 개요

LV_BAT은 3D 씬에서 단일 장비 하나에 대응하는 저전압(Low Voltage) 계열의 배터리(BAT) 패널 컴포넌트이다. 단일 GLTF(`models/LV_BAT/01_default/LV_BAT.gltf`)의 scene은 단 하나의 Node(`LV-BAT1`, mesh 0)만 참조한다. LV_2P_02(`LV-H1-D029`)·LV_2P_09(`LV-H1-D012`)·LV_2P_10(`LV-H1-D013`)·LV_2P_11(`LV-H1-D028`) 시리즈와 마찬가지로 **순수 1-Node 구조**이며, LV_2P_01(`LV-2C1-U` + `VRayLight001`)·LV_2P_07(`LV-D2-U` + `VRayLight001`)·LV_2P_08(`LV-F1-U` + `VRayLight001`)이 가졌던 보조 `VRayLight001` Node가 이 엔트리에는 없다. Standard 변형은 유일한 Mesh `LV-BAT1`을 상태 색상의 대상으로 삼는다.

GLTF 구조: `scene → "LV-BAT1"(mesh 0, rotation=[0,-1,0,1.19248806e-08])` — 단일 Node, 단일 Mesh. 최상위 Mesh Node는 루트 스케일 노드 없이 곧바로 Mesh를 참조한다. Mesh는 단일 primitive와 단일 material을 가지며, POSITION/NORMAL/TEXCOORD_0 속성을 포함한다 (정점 46, 인덱스 84). 정점·인덱스 수(46/84)는 LV_2P_02·LV_2P_09·LV_2P_10·LV_2P_11과 정확히 일치한다. material은 `Material #342540167`(PBR, metallicFactor 0.0, roughnessFactor 0.0, doubleSided=true)이며 baseColorTexture로 `maps/LV_BAT.jpg`를 참조한다. LV_2P_11의 `Material #342540210`, LV_2P_10의 `Material #342540208`, LV_2P_09의 `Material #342540207`, LV_2P_02의 `Material #342540205`와 id가 다른 별도 material이다 (342540167은 이들보다 번호대가 낮은 별도 영역으로, 배터리 전용 material이다).

**폴더명과 meshName 차이 (주요 결정사항):** 폴더/컴포넌트 이름은 `LV_BAT`이지만, GLTF 내부 Node/Mesh 이름은 `LV-BAT1`이다. `getObjectByName`은 Node 이름으로 탐색하므로 **구독 데이터의 `meshName`은 반드시 `LV-BAT1`** 이어야 한다. LV 시리즈는 폴더명-Node명 불일치가 관례이며, `LV_BAT`은 `LV-BAT1`이라는 고유 접두 패밀리를 가진다. LV_2P 시리즈의 `LV-H1-D###`(LV_2P_02/09/10/11), `LV-2C1-U`(LV_2P_01), `LV-2D13`(LV_2P_03), `LV-2F3`(LV_2P_04), `LV-2J7`(LV_2P_05), `LV-B1-U`(LV_2P_06), `LV-D2-U`(LV_2P_07), `LV-F1-U`(LV_2P_08) 어느 패밀리에도 속하지 않는 **배터리 전용 접두 패밀리**다. Blank_Panel_03의 `LV-F3`, 다른 LV 컴포넌트의 meshName을 그대로 유추하지 않는다. 접미 숫자 `1`은 동일 패밀리에서 추가 엔트리(`LV-BAT2`, `LV-BAT3` 등)가 추가될 가능성을 시사하지만, 현재 저장소에는 `LV-BAT1` 하나만 존재한다.

GLTF 좌표 바운드(스케일 적용 없음): POSITION min [-0.399998844, -1.4750011, -1.0999999] ~ max [0.399998844, 1.4750011, 1.1] → 실제 장면 크기 약 0.8 × 2.95 × 2.2 단위. X(0.8)·Z(2.2)는 LV_2P_02/09/10/11과 동일하지만 **Y는 2.95로 LV_2P_06/LV_2P_07/LV_2P_08(0.8 × 2.95 × 2.2)과 정확히 일치**하며, LV_2P_02/09/10/11의 2.55보다 0.4 큰 "장신형" 패널이다. 카메라 바운드 기반 자동 조정으로 preview가 맞춰진다.

> 텍스처 폴더는 `maps/` (HV_1P_01, LV_01, LV_02, LV_1P_01~07, LV_2P_01~11 선례와 동일). GLTF 내부 `images[].uri`가 `maps/LV_BAT.jpg`로 참조되므로 폴더명을 유지한다. 텍스처 파일명은 LV_2P_01의 `LV11.jpg`, LV_2P_02의 `LV_UPS05.jpg`, LV_2P_03의 `LV_UPS14.jpg`, LV_2P_04의 `LV09.jpg`, LV_2P_05의 `LV_UPS13.jpg`, LV_2P_06의 `LV01.jpg`, LV_2P_07의 `LV04.jpg`, LV_2P_08의 `LV02.jpg`, LV_2P_09의 `LV_UPS06.jpg`, LV_2P_10의 `LV_UPS07.jpg`, LV_2P_11의 `LV_UPS09.jpg`와 다른 **`LV_BAT.jpg`(배터리 장비 전용 텍스처, `LV##` 번호 계열·`LV_UPS##` 계열 어디에도 속하지 않는 명시적 `LV_BAT` 이름)**를 사용하므로 파일명을 임의로 재작성하지 않는다. LV_2P_11의 모델 폴더에 존재했던 보조 썸네일(`LV_2P_11-P.png`)에 해당하는 보조 파일로 `LV_BAT-P.png`가 모델 폴더에 존재한다 (LV_2P_02/LV_2P_03/LV_2P_05/LV_2P_06/LV_2P_07/LV_2P_08/LV_2P_09/LV_2P_10/LV_2P_11 선례와 동일). GLTF가 참조하는 `LV_BAT.jpg`만 `maps/`에 유지한다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `LV-BAT1` Mesh의 material 색상을 변경한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
