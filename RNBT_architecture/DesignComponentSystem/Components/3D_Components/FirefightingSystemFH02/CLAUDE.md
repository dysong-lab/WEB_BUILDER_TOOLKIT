# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh) |
| 기본 Mixin | MeshStateMixin |
| meshName | fhB |

## 장비 개요

FirefightingSystemFH02는 옥내소화전(Fire Hydrant, FH) 형태의 소방 시스템 장비를 표현하는 3D 컴포넌트이다. FH01과 동일한 소화전 장비 계열이지만 폼팩터 변형(variant B)으로, 단일 GLTF 모델이 단일 Mesh(`fhB`)로 구성된다. MeshStateMixin을 통해 상태에 따라 메시 색상을 변경한다.

> 참고: GLTF 내부의 mesh/노드 이름은 장비 폴더명(`FirefightingSystemFH02`)이 아니라 `fhB`이다 (FH01은 `fh`). meshName은 실제 GLTF 내부 식별자를 사용한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
