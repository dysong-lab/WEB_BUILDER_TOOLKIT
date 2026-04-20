# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh) |
| 기본 Mixin | MeshStateMixin |
| meshName | GateWaySensor |

## 장비 개요

GateWay_Sensor는 현장 센서 데이터를 상위 시스템으로 중계하는 게이트웨이 센서(게이트웨이 겸 센서 허브)를 표현하는 3D 컴포넌트이다. 단일 GLTF 모델이 루트 스케일 노드(`root`) 아래 단일 Mesh(`GateWaySensor`)로 구성되며, MeshStateMixin은 이 Mesh의 material 색상을 직접 변경한다.

> 참고: GLTF 내부 루트 스케일 노드 이름은 `root`, 실제 기하를 가진 단일 Mesh 이름은 `GateWaySensor`이다. 폴더명(`GateWay_Sensor`)과 meshName(`GateWaySensor`)이 다르므로(언더스코어 유무), register.js 및 preview에서는 반드시 `GateWaySensor`를 사용한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
