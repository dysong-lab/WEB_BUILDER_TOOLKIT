# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh `HV_1P_04`) |
| 기본 Mixin | MeshStateMixin |
| meshName | HV_1P_04 |

## 장비 개요

HV_1P_04는 1상(1 Phase) 고전압 유닛의 네 번째 기본형 변종을 표현하는 3D 컴포넌트이다. GLTF 내부는 최상위 Node `HV_1P_04` 하나이며, 해당 Node는 단일 Mesh `HV_1P_04`를 직접 참조한다. HV_1P_01/02/03과 구조적으로 동일하게 단일 Mesh이므로 MeshStateMixin의 단일 Mesh 경로가 적용된다 — `getObjectByName('HV_1P_04')`로 Mesh를 찾고, material을 clone하여 color를 교체한다.

Material은 단일 PBR material(`Material #342540194`)이며 `HV12.jpg` 텍스처를 사용한다.

> 텍스처 폴더는 `maps/` (대부분의 다른 모델이 쓰는 `textures/`가 아님). GLTF 내부 `images[].uri`가 `maps/HV12.jpg`로 참조되므로 폴더명을 유지한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
