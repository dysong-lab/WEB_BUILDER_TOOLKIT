# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Group `HV`, 자식 6 Mesh) |
| 기본 Mixin | MeshStateMixin |
| meshName | HV |

## 장비 개요

HV는 고전압(High Voltage) 배전함을 표현하는 3D 컴포넌트이다. GLTF 내부는 최상위 Group 노드 `HV` 아래에 6개의 자식 Mesh로 구성된다 (본체 `HV_A111_7UA_DN` / `HV_A111_7UA_UP`, 상단 캡 `HV_A111_7UA_DN_cap` / `HV_A111_7UA_UP_cap`, 표지판 `sign01_103` / `sign01_102` / `Sign02_028`).

MeshStateMixin은 `getObjectByName('HV')`로 Group을 찾고, Group이면 자식 Mesh들을 traverse하여 material 색상을 일괄 변경한다 (MeshStateMixin.md의 Group 경로). 따라서 단일 meshName(`HV`)만 전달해도 구성 Mesh 전체가 동일 상태 색상으로 재질이 교체된다.

> 텍스처 폴더는 `maps/` (대부분의 다른 모델이 쓰는 `textures/`가 아님). GLTF 내부 `images[].uri`가 `maps/*.jpg`로 참조되므로 폴더명을 유지한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
