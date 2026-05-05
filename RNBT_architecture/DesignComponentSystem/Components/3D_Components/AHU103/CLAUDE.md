# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh `AHU103`) |
| 기본 Mixin | MeshStateMixin |
| meshName | AHU103 |

## 장비 개요

AHU103은 Air Handling Unit(공기조화기) 외형을 표현하는 3D 컴포넌트이다. GLTF 내부는 최상위 `root` Node(scale [1000,1000,1000] 업스케일) 아래 단일 자식 Node `AHU103`을 가지며, 해당 Node는 단일 Mesh `AHU103`(mesh 0)을 직접 참조한다. 별도의 `fan`/`blade` mesh가 분리되어 있지 않은 **본체 통합 단일 mesh** 구조 — MeshStateMixin의 단일 Mesh 경로가 그대로 적용된다 (`getObjectByName('AHU103')`로 Mesh를 찾고, material을 clone하여 color를 교체).

> **명명 일치**: 폴더명 `AHU103`과 GLTF 내부 Node/Mesh 이름 `AHU103`이 완전히 일치한다. register.js의 하드코딩 meshName은 `'AHU103'`을 그대로 사용한다.

> GLTF의 `animations` 배열은 비어있다 — 클립 의존이 없는 컴포넌트(MeshStateMixin / mesh.rotation 직접 갱신 방식)에 자연 정합.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
| Advanced/dynamicRpm | 완료 |

> **RotaryRpmMixin 승격 강력 권장 — #38 Pump + #39 Heatexchanger + 본 컴포넌트 dynamicRpm(#40) = 3개 컴포넌트 동일 기법 임계점 명백히 초과.** setTargetRpm/setInertia/setRotationAxis/setRpmPerUnit/setMeshName/start/stop/enable/disable/destroy 시그니처 그대로 흡수 가능. **본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나 사용자가 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출로 승격 검토 강력 권장.**
