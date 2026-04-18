# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `icam7`) |
| 기본 Mixin | MeshStateMixin |

## 장비 개요

IRISID_iCAM7은 IrisID 사의 iCAM7 시리즈 홍채 인식(Iris Recognition) 카메라 장비를 표현하는 3D 컴포넌트이다. GLTF는 최상위 `root` Node(scale 1000x) 아래 단일 자식 Node `icam7`을 가지며, 이 Node가 동일 이름의 단일 Mesh(`icam7`)를 참조한다. Mesh는 하나의 PBR material(`Material #42086`)을 보유하고 `textures/icam7.jpg` 텍스처를 사용한다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `icam7` Mesh의 material 색상을 일괄 변경한다. 폴더명(`IRISID_iCAM7`)과 GLTF 내부 Node/Mesh 이름(`icam7`)이 일치하지 않으므로, preview와 페이지 연동 시 **meshName은 반드시 `icam7`**을 사용해야 한다. register.js 자체는 meshName을 하드코딩하지 않으며, 구독 데이터가 전달한 meshName을 MeshStateMixin이 해석한다.

> **이름 불일치 주의**: 폴더명 `IRISID_iCAM7` ≠ GLTF 내부 Node/Mesh 이름 `icam7`. 데이터 발행 측에서 meshName을 `icam7`으로 지정해야 한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
