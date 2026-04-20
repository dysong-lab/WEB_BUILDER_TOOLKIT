# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `LV-2D13`) |
| 기본 Mixin | MeshStateMixin |
| meshName | `LV-2D13` |

## 장비 개요

LV_2P_03은 3D 씬에서 단일 장비 하나에 대응하는 2상(2 Phase) 저전압(Low Voltage) 계열 컴포넌트이며, `LV_2P_*` 시리즈의 세 번째 엔트리이다. 단일 GLTF(`models/LV_2P_03/01_default/LV_2P_03.gltf`)의 scene은 단 하나의 Node(`LV-2D13`, mesh 0)만 참조한다. 직전 엔트리 LV_2P_02(`LV-H1-D029`)와 동일하게 보조 `VRayLight001` Node가 **이 엔트리에는 없다** — 순수 1-Node 구조이다 (LV_2P_01은 2-Node 패턴이었다). Standard 변형은 유일한 Mesh `LV-2D13`을 상태 색상의 대상으로 삼는다.

GLTF 구조: `scene → "LV-2D13"(mesh 0, rotation=[0,-1,0,1.19e-8])` — 단일 Node, 단일 Mesh. 최상위 Mesh Node는 루트 스케일 노드 없이 곧바로 Mesh를 참조한다 (LV_2P_02와 동일한 1-Node 패턴). Mesh는 단일 primitive와 단일 material을 가지며, POSITION/NORMAL/TEXCOORD_0 속성을 포함한다. material은 `Material #342540217`(PBR, metallicFactor 0.0, roughnessFactor 0.0, doubleSided=true)이며 baseColorTexture로 `maps/LV_UPS14.jpg`를 참조한다.

**폴더명과 meshName 불일치 (주요 결정사항):** 폴더/컴포넌트 이름은 `LV_2P_03`이지만, GLTF 내부 Node/Mesh 이름은 `LV-2D13`이다. `getObjectByName`은 Node 이름으로 탐색하므로 **구독 데이터의 `meshName`은 반드시 `LV-2D13`** 이어야 한다. LV 시리즈는 폴더명-Node명 불일치가 관례이며, `LV_2P_03`은 `LV-2D` 접두 + 접미 토큰 `13` 형태를 사용한다. 이는 LV_01(`LV-2D4`), LV_1P_01(`LV-2D2`)과 동일한 `LV-2D` 패밀리에 속하면서도 접미 숫자가 13으로 가장 큰 엔트리다. LV_02(`LV-2H3`), LV_1P_02~04(`LV-J1~J3`), LV_1P_05~07(`LV-LO1/LO2/LO005`), LV_2P_01(`LV-2C1-U`), LV_2P_02(`LV-H1-D029`)와는 접두/접미 토큰이 다르므로 다른 LV 컴포넌트의 meshName을 그대로 유추하지 않는다.

GLTF 좌표 바운드(스케일 적용 없음): POSITION min [-0.4000016, -1.275, -1.09999979] ~ max [0.4000016, 1.275, 1.09999967] → 실제 장면 크기 약 0.8 × 2.55 × 2.2 단위. LV_2P_02(0.8 × 2.55 × 2.2)와 X/Y/Z 바운드가 사실상 동일(X는 0.4000016 vs 0.399998665로 극소 차)이며, LV_2P_01(1.1 × 2.95 × 2.2)보다 X·Y 방향이 좁다. 카메라 바운드 기반 자동 조정으로 preview가 맞춰진다.

> 텍스처 폴더는 `maps/` (HV_1P_01, LV_01, LV_02, LV_1P_01~07, LV_2P_01~02 선례와 동일). GLTF 내부 `images[].uri`가 `maps/LV_UPS14.jpg`로 참조되므로 폴더명을 유지한다. `LV_2P_03-P.png` 같은 보조 자산은 존재하지 않으며(`maps/`에만 `LV_UPS14.jpg` 하나), GLTF가 참조하는 것만 유지한다. 텍스처 파일명은 LV_2P_01의 `LV11.jpg`, LV_2P_02의 `LV_UPS05.jpg`와 다른 `LV_UPS14.jpg` 계열명을 사용하므로 파일명을 임의로 재작성하지 않는다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `LV-2D13` Mesh의 material 색상을 변경한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
