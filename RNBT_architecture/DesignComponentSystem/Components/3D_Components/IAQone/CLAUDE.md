# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `IAQone`) |
| 기본 Mixin | MeshStateMixin |

## 장비 개요

IAQone은 실내 공기질(Indoor Air Quality, IAQ) 측정을 위한 단일 센서 장비를 표현하는 3D 컴포넌트이다. GLTF는 최상위 `root` Node(scale 1000x) 아래 단일 자식 Node `IAQone`을 가지며, 이 Node가 동일 이름의 단일 Mesh(`IAQone`)를 참조한다. Mesh는 하나의 PBR material(`Material #25192306`)을 보유하고 `textures/IAQone.jpg` 텍스처를 사용한다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `IAQone` Mesh의 material 색상을 일괄 변경한다. meshName이 폴더명과 일치하므로 register.js는 직접 하드코딩 없이 Mixin 호출만으로 동작한다(meshName은 구독 데이터가 전달한다).

> **이름 일치**: 폴더명 `IAQone`, GLTF 내부 Node/Mesh 이름 `IAQone`, manifest 컴포넌트명 `IAQone` 모두 일치한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
