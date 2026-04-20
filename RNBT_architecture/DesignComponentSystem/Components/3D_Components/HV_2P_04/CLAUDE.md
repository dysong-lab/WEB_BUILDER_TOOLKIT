# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh `HV-M7-U`) |
| 기본 Mixin | MeshStateMixin |
| meshName | HV-M7-U |

## 장비 개요

HV_2P_04는 2상(2 Phase) 고전압 유닛의 네 번째 기본형 변종을 표현하는 3D 컴포넌트이다. GLTF 내부는 최상위 Node `HV-M7-U` 하나이며(추가로 `VRayLight001` Node가 있으나 Mesh 참조가 없어 MeshState 대상에서 자연스럽게 제외된다), 해당 Node는 단일 Mesh `HV-M7-U`를 직접 참조한다. HV_2P_01 / HV_2P_02 / HV_2P_03과 구조적으로 동일하게 단일 Mesh이므로 MeshStateMixin의 단일 Mesh 경로가 적용된다 — `getObjectByName('HV-M7-U')`로 Mesh를 찾고, material을 clone하여 color를 교체한다.

Material은 단일 PBR material(`Material #342540139`)이며 `HV04.jpg` 텍스처를 사용한다.

> **명명 주의**: 폴더명은 `HV_2P_04`이지만 GLTF 내부 Node/Mesh 이름은 **`HV-M7-U`** (하이픈 구분, 완전히 다른 명명 체계)이다. HV_2P_03은 폴더명과 GLTF 내부 이름이 일치했으나, HV_2P_04는 HV_2P_01과 유사하게 폴더명과 GLTF 내부 이름이 다르다. register.js의 하드코딩 meshName은 GLTF 내부 이름 `HV-M7-U`를 그대로 사용한다.

> 텍스처 폴더는 `maps/` (대부분의 다른 모델이 쓰는 `textures/`가 아님). GLTF 내부 `images[].uri`가 `maps/HV04.jpg`로 참조되므로 폴더명을 유지한다. HV_2P_01은 `HV08.jpg`, HV_2P_03은 `HV06.jpg`를 쓰는 것과 달리 HV_2P_04는 `HV04.jpg`를 사용한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
