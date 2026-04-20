# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `LEVELMonnit_Sensors`) |
| 기본 Mixin | MeshStateMixin |
| meshName | LEVELMonnit_Sensors |

## 장비 개요

LEVELMonnit_Sensors는 Monnit 사의 무선 수위(level) 감지 센서를 표현하는 3D 컴포넌트이다. GLTF는 `root`(scale 1000) 노드 아래 단일 Mesh Node `LEVELMonnit_Sensors`(Mesh 0, Material #36) 하나만 포함한다. 메시 프리미티브는 단일 material을 사용하며, 텍스처는 `textures/LEVELMonnit_Sensors.jpg` 한 장(UV 매핑)으로 구성된다. `LEVELMonnit_Sensors-P.png`는 normal/parallax 계열 보조 맵으로 파일 시스템에는 존재하지만 GLTF images 배열에는 포함되지 않는다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 단일 Mesh `LEVELMonnit_Sensors`의 material 색상을 변경한다. MeshStateMixin은 `getObjectByName('LEVELMonnit_Sensors')`로 대상을 조회하며, 대상이 단일 Mesh이므로 material이 단일 객체든 배열이든 관계없이 clone 후 color를 적용한다. 폴더/컴포넌트명과 GLTF 최상위 자식 Node 이름, Mesh 이름이 모두 `LEVELMonnit_Sensors`로 일치하므로 meshName 불일치 주의는 없다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
