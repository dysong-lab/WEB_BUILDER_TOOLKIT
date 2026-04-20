# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `Infodesk`) |
| 기본 Mixin | MeshStateMixin |
| meshName | Infodesk |

## 장비 개요

Infodesk는 로비/출입구 영역의 안내 데스크(인포메이션 데스크) 가구를 표현하는 3D 컴포넌트이다. GLTF는 최상위 `root` Node(scale 1000x) 아래 단일 자식 Node `Infodesk`를 가지며, 이 Node가 동일 이름의 단일 Mesh(`Infodesk`)를 참조한다. Mesh는 단일 primitive에 단일 material이 바인딩되어 있고 `textures/Infodesk.jpg` 텍스처를 사용한다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `Infodesk` Mesh의 material 색상을 변경한다. 폴더/컴포넌트명과 GLTF 내부 Node/Mesh 이름이 모두 `Infodesk`로 일치하므로 meshName 주의 사항은 없다. register.js는 meshName을 하드코딩하지 않고, 구독 데이터가 전달한 meshName을 MeshStateMixin이 `getObjectByName`으로 해석한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
