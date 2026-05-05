# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Group "Generator" [자식 Mesh 3개: Generator_mesh_A, Generator_blade, Generator]) |
| 기본 Mixin | MeshStateMixin |
| meshName | Generator |

## 장비 개요

Generator는 비상/예비 전력을 공급하는 발전기를 표현하는 3D 컴포넌트이다. GLTF 내부는 루트 Group 노드 `Generator` 아래에 3개의 자식 Mesh(`Generator_mesh_A`, `Generator_blade`, `Generator`)로 구성된다. MeshStateMixin은 `getObjectByName('Generator')`로 루트 Group을 찾고, Group인 경우 자식 Mesh들을 traverse하여 색상을 일괄 적용한다(MeshStateMixin.js의 Group 지원 경로).

> 참고: GLTF 내부에는 "Generator"라는 이름이 **Group 노드(Node 2)** 와 **자식 Mesh(Node 5)** 에 중복 존재한다. `getObjectByName`은 depth-first 첫 매치를 반환하므로 부모 Group이 먼저 매칭되며, Mixin은 material이 없는 Group으로 인식하여 자식 전체를 traverse 적용한다 — 이 동작이 "발전기 전체의 상태 색상 표시"라는 기능 목적과 일치한다.
>
> 모델 폴더에는 `textures/` 대신 `maps/`가 사용된다(GLTF 내부 URI도 `maps/`로 참조). 모델 변종 자산 구조상의 변이로, 컴포넌트 코드에는 영향 없음.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
| Advanced/generatorOutput | 완료 |

> **MeshTrackingHudMixin 승격 강력 권장 — HUD 7번째 채택 (#13 BATT/dataHud + #21 GasDetector/sensorHud + #24/#25/#26 sensorDataHud + #41 OHU103/outdoorUnitPerformance + 본 컴포넌트 generatorOutput(#42)) — 임계점 명백히 초과.** setData/setOffset/show/hide/start/stop/destroy + `_renderer/_camera/_hudRoot/_cardEl` 외부 주입 자원 패턴이 7개 컴포넌트에서 동일.
>
> **GeneratorOutputBarMixin / OutputBarMixin 승격 후보 — 본 컴포넌트(#42) + 다음 #43 GeneratorSmall 예정 = 2번째 채택 후 검토.** BoxGeometry 동적 생성 + scale.y kW 비례 + 임계 색상 분기 패턴이 #43에서 100% 동일하게 답습 예정.
>
> **본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나, 사용자가 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출로 두 Mixin 승격 검토 권장.**
