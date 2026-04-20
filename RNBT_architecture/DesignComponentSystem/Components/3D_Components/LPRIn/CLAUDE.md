# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `LPRIn`) |
| 기본 Mixin | MeshStateMixin |
| meshName | LPRIn |

## 장비 개요

LPRIn(License Plate Recognition, Inbound)은 진입 차량 전용 번호판 인식 카메라 장비를 표현하는 3D 컴포넌트이다. GLTF는 최상위 `root` Node(scale 1000x) 아래 단일 자식 Node `LPRIn`(Mesh 0, Material `LPRIn`)을 가지며, 메시 프리미티브는 단일 material 하나만 사용하고 UV 매핑된 `textues/LPRIn.jpg` 텍스처 한 장을 참조한다. `LPRIn-P.png`는 보조 맵으로 파일만 존재하며 GLTF `images` 배열에는 포함되지 않는다.

폴더명/컴포넌트명은 `LPRIn`이고, GLTF 내부의 Node/Mesh 이름도 동일한 대소문자 `LPRIn`이다 (sibling 컴포넌트 `LPR`은 GLTF 내부가 소문자 `lpr`로 폴더명과 달랐으나, LPRIn은 일치한다). MeshStateMixin은 `getObjectByName`으로 대상을 조회하므로 **meshName은 반드시 GLTF가 기록한 `'LPRIn'`을 사용해야 한다**. 구독으로 전달되는 `meshName` 값과 preview·페이지 레벨에서 호출하는 이름이 모두 `'LPRIn'`이어야 한다.

텍스처 폴더명은 `textues/`(원본 오타, `textures` 아님)이며 GLTF 내부 `images[0].uri`가 이 경로를 참조하므로 절대 리네임하지 말 것.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 단일 Mesh `LPRIn`의 material 색상을 변경한다. 대상이 단일 Mesh이므로 material이 단일 객체든 배열이든 MeshStateMixin의 단일 Mesh 처리 경로로 clone + color가 일괄 적용된다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
