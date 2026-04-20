# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `LV-2R1`) |
| 기본 Mixin | MeshStateMixin |
| meshName | `LV-2R1` |

## 장비 개요

LV_R은 3D 씬에서 단일 장비 하나에 대응하는 저전압(Low Voltage) 계열의 R(Reactor/분기·전용) 패널 컴포넌트이다. 단일 GLTF(`models/LV_R/01_default/LV_R.gltf`)의 scene은 단 하나의 Node(`LV-2R1`, mesh 0)만 참조한다. LV_BAT(`LV-BAT1`)·LV_2P_02(`LV-H1-D029`)·LV_2P_09(`LV-H1-D012`)·LV_2P_10(`LV-H1-D013`)·LV_2P_11(`LV-H1-D028`) 시리즈와 마찬가지로 **순수 1-Node 구조**이며, LV_2P_01(`LV-2C1-U` + `VRayLight001`)·LV_2P_07(`LV-D2-U` + `VRayLight001`)·LV_2P_08(`LV-F1-U` + `VRayLight001`)이 가졌던 보조 `VRayLight001` Node가 이 엔트리에는 없다. Standard 변형은 유일한 Mesh `LV-2R1`을 상태 색상의 대상으로 삼는다.

GLTF 구조: `scene → "LV-2R1"(mesh 0, rotation=[0,-1,0,1.19248806e-08])` — 단일 Node, 단일 Mesh. 최상위 Mesh Node는 루트 스케일 노드 없이 곧바로 Mesh를 참조한다. Mesh는 단일 primitive와 단일 material을 가지며, POSITION/NORMAL/TEXCOORD_0 속성을 포함한다 (정점 46, 인덱스 84). 정점·인덱스 수(46/84)는 LV_BAT·LV_2P_02·LV_2P_09·LV_2P_10·LV_2P_11과 정확히 일치한다. material은 `Material #342540166`(PBR, metallicFactor 0.0, roughnessFactor 0.0, doubleSided=true)이며 baseColorTexture로 `maps/LV_R.jpg`를 참조한다. LV_BAT의 `Material #342540167`과 한 번호 차이(166 ↔ 167)로 인접한 별도 material이며, LV_2P_11의 `Material #342540210`·LV_2P_10의 `Material #342540208`·LV_2P_09의 `Material #342540207`·LV_2P_02의 `Material #342540205`와 id가 다른 **Reactor 전용 material**이다.

**폴더명과 meshName 차이 (주요 결정사항):** 폴더/컴포넌트 이름은 `LV_R`이지만, GLTF 내부 Node/Mesh 이름은 `LV-2R1`이다. `getObjectByName`은 Node 이름으로 탐색하므로 **구독 데이터의 `meshName`은 반드시 `LV-2R1`** 이어야 한다. LV 시리즈는 폴더명-Node명 불일치가 관례이며, `LV_R`은 `LV-2R#` 고유 접두 패밀리를 가진다. LV_BAT의 `LV-BAT#`, LV_2P 시리즈의 `LV-H1-D###`(LV_2P_02/09/10/11)·`LV-2C1-U`(LV_2P_01)·`LV-2D13`(LV_2P_03)·`LV-2F3`(LV_2P_04)·`LV-2J7`(LV_2P_05)·`LV-B1-U`(LV_2P_06)·`LV-D2-U`(LV_2P_07)·`LV-F1-U`(LV_2P_08) 어느 패밀리에도 속하지 않는 **Reactor 전용 접두 패밀리**다. `LV-2R1`의 `2R` 토큰은 LV_2P_03의 `LV-2D13`·LV_2P_04의 `LV-2F3`·LV_2P_05의 `LV-2J7` 같은 `2-` 계열의 단문자 알파벳 시리즈(`2D`, `2F`, `2J`)에 이어지는 `2R` 슬롯이며, 접미 숫자 `1`은 동일 패밀리에서 추가 엔트리(`LV-2R2`, `LV-2R3` 등)가 추가될 가능성을 시사하지만 현재 저장소에는 `LV-2R1` 하나만 존재한다. Blank_Panel_03의 `LV-F3`와도 접두가 다르며 meshName을 그대로 유추하지 않는다.

GLTF 좌표 바운드(스케일 적용 없음): POSITION min [-0.5000051, -1.4750011, -1.1] ~ max [0.5000051, 1.4750011, 1.10000014] → 실제 장면 크기 약 1.0 × 2.95 × 2.2 단위. Y(2.95)·Z(2.2)는 LV_BAT·LV_2P_06/07/08과 동일한 "장신형" 치수이지만 **X는 1.0으로 LV_BAT·LV_2P_02/09/10/11의 0.8보다 0.2 큰 "광폭형"**이다 (LV_2P_06의 0.8, LV_2P_07의 0.8과도 다르다). 카메라 바운드 기반 자동 조정으로 preview가 맞춰진다.

> 텍스처 폴더는 `maps/` (HV_1P_01, LV_01, LV_02, LV_1P_01~07, LV_2P_01~11, LV_BAT 선례와 동일). GLTF 내부 `images[].uri`가 `maps/LV_R.jpg`로 참조되므로 폴더명을 유지한다. 텍스처 파일명은 LV_BAT의 `LV_BAT.jpg`와 마찬가지로 **`LV_R.jpg`(Reactor 장비 전용 텍스처, `LV##` 번호 계열·`LV_UPS##` 계열 어디에도 속하지 않는 명시적 `LV_R` 이름)**를 사용하므로 파일명을 임의로 재작성하지 않는다. LV_BAT와 같이 모델 폴더에 보조 썸네일 `LV_R-P.png`가 존재한다 (LV_2P_02/03/05/06/07/08/09/10/11, LV_BAT 선례와 동일). GLTF가 참조하는 `LV_R.jpg`만 `maps/`에 유지한다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `LV-2R1` Mesh의 material 색상을 변경한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
