# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 장비) |
| 기본 Mixin | MeshStateMixin |
| meshName | GIMACV |

## 장비 개요

GIMACV는 V(Voltage/전압) 계측 모듈(GIMAC 시리즈의 V 변형) 형태의 전기 장비를 표현하는 3D 컴포넌트이다. 단일 GLTF 모델이 루트 Group(`GIMACV`) 아래 3개의 자식 Mesh(`Rectangle194`, `Object318`, `Rectangle193`)로 구성되며, MeshStateMixin은 Group을 traverse하여 모든 자식 Mesh의 색상을 일괄 변경한다.

> 참고: GLTF 내부 루트 노드 이름은 장비 폴더명과 동일한 `GIMACV`이지만, 실제 기하는 자식 Mesh들이 가진다. meshName으로 Group 이름(`GIMACV`)을 지정하면 MeshStateMixin이 자식 Mesh들을 일괄 처리한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
