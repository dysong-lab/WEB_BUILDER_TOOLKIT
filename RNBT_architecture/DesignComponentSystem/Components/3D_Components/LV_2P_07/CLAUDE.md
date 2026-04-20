# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `LV-D2-U`) |
| 기본 Mixin | MeshStateMixin |
| meshName | `LV-D2-U` |

## 장비 개요

LV_2P_07은 3D 씬에서 단일 장비 하나에 대응하는 2상(2 Phase) 저전압(Low Voltage) 계열 컴포넌트이며, `LV_2P_*` 시리즈의 일곱 번째 엔트리이다. 단일 GLTF(`models/LV_2P_07/01_default/LV_2P_07.gltf`)의 scene은 두 개의 Node를 참조한다: mesh 0을 가진 주 Node `LV-D2-U`와, mesh 속성이 없는 보조 Node `VRayLight001`. LV_2P_01(`LV-2C1-U` + `VRayLight001` 2-Node 패턴)과 동일하게 **보조 `VRayLight001` Node가 존재**한다 — LV_2P_02/LV_2P_03/LV_2P_04/LV_2P_05/LV_2P_06(순수 1-Node)와는 구별된다. Standard 변형은 유일한 Mesh인 `LV-D2-U`를 상태 색상의 대상으로 삼는다 (`VRayLight001`은 mesh가 없어 MeshStateMixin의 `traverse(applyColor)` 패턴에서 자동 스킵된다).

GLTF 구조: `scene.nodes = [0, 1]` — Node 0 `"LV-D2-U"`(mesh 0, rotation=[0,-1,0,1.19248806e-08]), Node 1 `"VRayLight001"`(translation=[-0.0419458151, -0.5, 2.241778], rotation=[-0.7071068, 0, 0, 0.7071068], mesh 없음). 최상위 Mesh Node는 루트 스케일 노드 없이 곧바로 Mesh를 참조한다 (LV_2P_01과 동일한 2-Node 패턴). Mesh는 단일 primitive와 단일 material을 가지며, POSITION/NORMAL/TEXCOORD_0 속성을 포함한다 (정점 66, 인덱스 120). LV_2P_06(정점 66, 인덱스 120)와 정점·인덱스 수가 동일하나, `VRayLight001` 보조 Node의 유무가 결정적 차이이다. material은 `Material #342540152`(PBR, metallicFactor 0.0, roughnessFactor 0.0, doubleSided=true)이며 baseColorTexture로 `maps/LV04.jpg`를 참조한다.

**폴더명과 meshName 불일치 (주요 결정사항):** 폴더/컴포넌트 이름은 `LV_2P_07`이지만, GLTF 내부 Node/Mesh 이름은 `LV-D2-U`이다. `getObjectByName`은 Node 이름으로 탐색하므로 **구독 데이터의 `meshName`은 반드시 `LV-D2-U`** 이어야 한다. LV 시리즈는 폴더명-Node명 불일치가 관례이며, `LV_2P_07`은 기존 `LV-2C`, `LV-H1`, `LV-2D`, `LV-2F`, `LV-2J`, `LV-B1` 어느 패밀리에도 속하지 않고 **새로운 `LV-D` 접두 + 접미 `2-U`** 형태를 사용한다. LV_2P_01(`LV-2C1-U`), LV_2P_06(`LV-B1-U`)과 접미 `-U`가 같고 접두/중간 토큰이 다르다. LV_2P_01의 `LV-2C1-U`, LV_2P_02의 `LV-H1-D029`, LV_2P_03의 `LV-2D13`, LV_2P_04의 `LV-2F3`, LV_2P_05의 `LV-2J7`, LV_2P_06의 `LV-B1-U`와는 접두가 전혀 다르므로 다른 LV 컴포넌트의 meshName을 그대로 유추하지 않는다.

GLTF 좌표 바운드(스케일 적용 없음): POSITION min [-0.400001526, -1.47500134, -1.10000086] ~ max [0.400003433, 1.47500134, 1.10000086] → 실제 장면 크기 약 0.8 × 2.95 × 2.2 단위. LV_2P_05(1.0 × 2.55 × 2.2)보다 X는 0.2 더 작고 Y는 0.4 더 크며, LV_2P_01/LV_2P_04/LV_2P_06(1.1 × 2.95 × 2.2)와 Y·Z는 동일하나 X가 0.3 더 작다. LV_2P_02/LV_2P_03(0.8 × 2.55 × 2.2)과 X·Z는 동일하나 Y는 0.4 더 크다. 카메라 바운드 기반 자동 조정으로 preview가 맞춰진다.

> 텍스처 폴더는 `maps/` (HV_1P_01, LV_01, LV_02, LV_1P_01~07, LV_2P_01~06 선례와 동일). GLTF 내부 `images[].uri`가 `maps/LV04.jpg`로 참조되므로 폴더명을 유지한다. 모델 폴더에 보조 썸네일(`LV_2P_07-P.png`)이 존재한다 (LV_2P_02/LV_2P_03/LV_2P_05/LV_2P_06 선례와 동일). GLTF가 참조하는 `LV04.jpg`만 `maps/`에 유지한다. 텍스처 파일명은 LV_2P_01의 `LV11.jpg`, LV_2P_02의 `LV_UPS05.jpg`, LV_2P_03의 `LV_UPS14.jpg`, LV_2P_04의 `LV09.jpg`, LV_2P_05의 `LV_UPS13.jpg`, LV_2P_06의 `LV01.jpg`와 다른 **`LV04.jpg`(LV_2P_04의 `LV09.jpg`와 다른 별도 파일)**를 사용하므로 파일명을 임의로 재작성하지 않는다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `LV-D2-U` Mesh의 material 색상을 변경한다. `VRayLight001` 보조 Node는 mesh 속성이 없으므로 색상 변경 대상이 아니다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
