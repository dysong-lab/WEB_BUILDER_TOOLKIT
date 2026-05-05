# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh) |
| 기본 Mixin | MeshStateMixin |
| meshName | Generator |

## 장비 개요

GeneratorSmall은 소형 발전기를 표현하는 3D 컴포넌트이다. GLTF 내부는 `root`(scale 1000) 노드 아래에 단일 Mesh `Generator` 하나로 구성된 단순 구조다. MeshStateMixin은 `getObjectByName('Generator')`로 해당 Mesh를 찾아 material 색상을 직접 변경한다.

> 참고: 폴더명은 `GeneratorSmall`이지만 GLTF 내부 Mesh 이름은 `Generator`다(3ds Max babylon.js 익스포터 생성 메타데이터). 동일 이름이 Generator(대형) 컴포넌트에도 존재하지만, 각 3D 컴포넌트 인스턴스는 자신의 `appendElement`(THREE.Object3D) 범위 안에서만 `getObjectByName`을 수행하므로 네임스페이스 충돌이 발생하지 않는다.
>
> Generator(대형) 모델은 `Generator`라는 이름이 Group 노드와 자식 Mesh에 중복 존재하여 Group 경로가 선택되지만, GeneratorSmall은 단일 Mesh 구조이므로 Mesh가 직접 매칭되어 material 단일 적용 경로를 탄다(MeshStateMixin.js의 Mesh 단독 경로).

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
| Advanced/generatorOutput | 완료 |

> **GeneratorOutputBarMixin / OutputBarMixin 승격 임계점 도달 (#42 Generator + #43 본 컴포넌트 generatorOutput) — 2번째 채택 시그니처 100% 동일 입증.** BoxGeometry 동적 생성 + scale.y kW 비례 + 임계 색상 분기 패턴이 두 컴포넌트에서 동일. 본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나 사용자가 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출로 승격 즉시 검토 권장.
>
> **MeshTrackingHudMixin 승격 강력 권장 — HUD 8번째 채택 (#13 BATT/dataHud + #21 GasDetector/sensorHud + #24/#25/#26 sensorDataHud + #41 OHU103/outdoorUnitPerformance + #42 Generator/generatorOutput + 본 컴포넌트 generatorOutput(#43)) — 임계점 명백히 초과.** setData/setOffset/show/hide/start/stop/destroy + `_renderer/_camera/_hudRoot/_cardEl` 외부 주입 자원 패턴이 8개 컴포넌트에서 동일.
