# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 장비) |
| 기본 Mixin | MeshStateMixin |
| meshName | GIPAM3000 |

## 장비 개요

GIPAM3000은 GIPAM 시리즈의 3000 모델 — 디지털 보호·계측·감시 통합 릴레이(IED, Intelligent Electronic Device) 계열 전기 장비를 표현하는 3D 컴포넌트이다. 단일 GLTF 모델이 루트 Group(`GIPAM3000`) 아래 2개의 자식 Mesh(`Object210`, `Rectangle051`)로 구성되며, MeshStateMixin은 Group을 traverse하여 모든 자식 Mesh의 색상을 일괄 변경한다.

> 참고: GLTF 내부 루트 노드 이름은 장비 폴더명과 동일한 `GIPAM3000`이지만, 실제 기하는 자식 Mesh들이 가진다. meshName으로 Group 이름(`GIPAM3000`)을 지정하면 MeshStateMixin이 자식 Mesh들을 일괄 처리한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
