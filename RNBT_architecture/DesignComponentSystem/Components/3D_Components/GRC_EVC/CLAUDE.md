# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh) |
| 기본 Mixin | MeshStateMixin |
| meshName | GRC_EVC |

## 장비 개요

GRC_EVC는 전기차(EV) 충전기 계열 전기 장비를 표현하는 3D 컴포넌트이다. 단일 GLTF 모델이 루트 `root` 스케일 노드 아래 단일 Mesh(`GRC_EVC`)로 구성되며, MeshStateMixin은 이 Mesh의 material 색상을 직접 변경한다.

> 참고: GLTF 내부 루트 스케일 노드 이름은 `root`, 실제 기하를 가진 단일 Mesh 이름은 `GRC_EVC`이다. meshName으로 `GRC_EVC`를 지정하면 MeshStateMixin이 해당 Mesh의 material color를 직접 적용한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
