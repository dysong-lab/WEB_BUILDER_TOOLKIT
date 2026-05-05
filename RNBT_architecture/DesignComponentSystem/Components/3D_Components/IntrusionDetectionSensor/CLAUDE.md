# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `IntrusionDetectionSensor`) |
| 기본 Mixin | MeshStateMixin |
| meshName | IntrusionDetectionSensor |

## 장비 개요

IntrusionDetectionSensor는 건물 외곽/실내 경계에 설치되어 침입(인원 접근·비인가 출입)을 감지하는 PIR/마이크로웨이브 방식 보안 센서 장비를 표현하는 3D 컴포넌트이다. GLTF는 최상위 `root` Node(scale 1000x) 아래 단일 자식 Node `IntrusionDetectionSensor`를 가지며, 이 Node가 동일 이름의 단일 Mesh(`IntrusionDetectionSensor`)를 참조한다. Mesh는 단일 primitive에 단일 material(`Material #25`)이 바인딩되어 있고 `textues/IDSensor.jpg` 텍스처를 사용한다. 텍스처 폴더명은 `textues/`(원본 오타, `textures` 아님)이며 GLTF 내부 `images[0].uri`가 이 경로를 참조하므로 절대 리네임하지 말 것.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `IntrusionDetectionSensor` Mesh의 material 색상을 변경한다. 폴더/컴포넌트명과 GLTF 내부 Node/Mesh 이름이 모두 `IntrusionDetectionSensor`로 일치하므로 meshName 주의 사항은 없다. register.js는 meshName을 하드코딩하지 않고, 구독 데이터가 전달한 meshName을 MeshStateMixin이 `getObjectByName`으로 해석한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
| Advanced/sensorAlertDirection | 완료 |
