# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `LV-H1-D012`) |
| 기본 Mixin | MeshStateMixin |
| meshName | `LV-H1-D012` |

## 장비 개요

LV_2P_09는 3D 씬에서 단일 장비 하나에 대응하는 2상(2 Phase) 저전압(Low Voltage) 계열 컴포넌트이며, `LV_2P_*` 시리즈의 아홉 번째 엔트리이다. 단일 GLTF(`models/LV_2P_09/01_default/LV_2P_09.gltf`)의 scene은 단 하나의 Node(`LV-H1-D012`, mesh 0)만 참조한다. 직전 엔트리 LV_2P_08(`LV-F1-U` + `VRayLight001`)이나 LV_2P_01(`LV-2C1-U` + `VRayLight001`)·LV_2P_07(`LV-D2-U` + `VRayLight001`)이 가졌던 보조 `VRayLight001` Node가 **이 엔트리에는 없다** — LV_2P_02(`LV-H1-D029`)·LV_2P_03(`LV-2D13`)·LV_2P_04(`LV-2F3`)·LV_2P_05(`LV-2J7`)·LV_2P_06(`LV-B1-U`)과 동일한 **순수 1-Node 구조**이다. Standard 변형은 유일한 Mesh `LV-H1-D012`를 상태 색상의 대상으로 삼는다.

GLTF 구조: `scene → "LV-H1-D012"(mesh 0, rotation=[0,-1,0,1.19248806e-08])` — 단일 Node, 단일 Mesh. 최상위 Mesh Node는 루트 스케일 노드 없이 곧바로 Mesh를 참조한다. Mesh는 단일 primitive와 단일 material을 가지며, POSITION/NORMAL/TEXCOORD_0 속성을 포함한다 (정점 46, 인덱스 84). 정점·인덱스 수(46/84)는 LV_2P_02(46/84)와 정확히 일치하며, LV_2P_06/LV_2P_07/LV_2P_08(정점 66, 인덱스 120)과는 다르다. material은 `Material #342540207`(PBR, metallicFactor 0.0, roughnessFactor 0.0, doubleSided=true)이며 baseColorTexture로 `maps/LV_UPS06.jpg`를 참조한다. LV_2P_02의 `Material #342540205`, LV_2P_08의 `Material #342540147`과 id가 다른 별도 material이다.

**폴더명과 meshName 불일치 (주요 결정사항):** 폴더/컴포넌트 이름은 `LV_2P_09`이지만, GLTF 내부 Node/Mesh 이름은 `LV-H1-D012`이다. `getObjectByName`은 Node 이름으로 탐색하므로 **구독 데이터의 `meshName`은 반드시 `LV-H1-D012`** 이어야 한다. LV 시리즈는 폴더명-Node명 불일치가 관례이며, `LV_2P_09`는 **LV_2P_02(`LV-H1-D029`)와 동일한 `LV-H1-D###` 패밀리의 두 번째 엔트리**이다 (접두 `LV-H1-D` 공유 + 접미 숫자 `012` vs `029`로 구분). `LV-H1-D` 패밀리는 LV_2P 시리즈 내에서 LV_2P_02와 LV_2P_09 두 엔트리가 공유하는 유일한 접두 패밀리이며, LV_2P_01의 `LV-2C1-U`, LV_2P_03의 `LV-2D13`, LV_2P_04의 `LV-2F3`, LV_2P_05의 `LV-2J7`, LV_2P_06의 `LV-B1-U`, LV_2P_07의 `LV-D2-U`, LV_2P_08의 `LV-F1-U` 어느 패밀리에도 속하지 않는다. Blank_Panel_03의 `LV-F3`, 다른 LV 컴포넌트의 meshName을 그대로 유추하지 않는다.

GLTF 좌표 바운드(스케일 적용 없음): POSITION min [-0.399998665, -1.275, -1.09999979] ~ max [0.399998665, 1.275, 1.09999967] → 실제 장면 크기 약 0.8 × 2.55 × 2.2 단위. **LV_2P_02(0.8 × 2.55 × 2.2)와 X·Y·Z 모두 정확히 동일**하며(정점 46, 인덱스 84도 동일), LV_2P_03(0.8 × 2.55 × 2.2)과도 X·Z가 같고 Y는 동일하다. LV_2P_06/07/08(0.8 × 2.95 × 2.2)과는 Y가 0.4 작다. 카메라 바운드 기반 자동 조정으로 preview가 맞춰진다.

> 텍스처 폴더는 `maps/` (HV_1P_01, LV_01, LV_02, LV_1P_01~07, LV_2P_01~08 선례와 동일). GLTF 내부 `images[].uri`가 `maps/LV_UPS06.jpg`로 참조되므로 폴더명을 유지한다. 모델 폴더에 보조 썸네일(`LV_2P_09-P.png`)이 존재한다 (LV_2P_02/LV_2P_03/LV_2P_05/LV_2P_06/LV_2P_07/LV_2P_08 선례와 동일). GLTF가 참조하는 `LV_UPS06.jpg`만 `maps/`에 유지한다. 텍스처 파일명은 LV_2P_01의 `LV11.jpg`, LV_2P_02의 `LV_UPS05.jpg`, LV_2P_03의 `LV_UPS14.jpg`, LV_2P_04의 `LV09.jpg`, LV_2P_05의 `LV_UPS13.jpg`, LV_2P_06의 `LV01.jpg`, LV_2P_07의 `LV04.jpg`, LV_2P_08의 `LV02.jpg`와 다른 **`LV_UPS06.jpg`(LV_UPS 계열 첫 사용 이후 LV_2P_02의 `LV_UPS05.jpg`·LV_2P_03의 `LV_UPS14.jpg`·LV_2P_05의 `LV_UPS13.jpg`와 동일 계열이나 별도 번호 파일)**를 사용하므로 파일명을 임의로 재작성하지 않는다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `LV-H1-D012` Mesh의 material 색상을 변경한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
