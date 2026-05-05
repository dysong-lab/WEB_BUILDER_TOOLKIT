# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh) |
| 기본 Mixin | MeshStateMixin |

## 장비 설명

ACB(Air Circuit Breaker) Susol — 기중차단기. DC ACB Switch Disconnector 타입(DDH 시리즈). 전력 설비의 회로 차단/투입을 담당한다. ACBmetasol과 동일한 차단기군에 속하며, 모델링 파트(DDH001/DDH016~020) 차이만 있다.

## 모델 구조

- 루트 노드: `ACBsusol` (Group, 자식 4)
  - `DC_ACB_Switch_DisconnectorDDH001`(Group, 자식 5) → `DDH016`/`DDH017`/`DDH018`/`DDH019`/`DDH020` (본체 부품)
  - `Line007`(mesh)
  - `Object237`(mesh)
  - **`Rectangle074`(mesh)** — 토글/트립 레버 (3ds Max 기본 명명 패턴 — MCCB Rectangle180 / ACBmetasol Rectangle070과 동일 패턴, bit-identical quaternion `[0.7071068, 0, 0, 0.7071067]`)
- meshName(MeshState 타겟): `ACBsusol` (루트 Group, traverse로 자식 mesh 일괄 색상)

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
| Advanced/breaker_leverPosition | 완료 |

> **BreakerLeverPositionMixin 승격 임계점 명백히 초과 (4개 컴포넌트 시그니처 100% 동일 입증)** — 본 변형(`Advanced/breaker_leverPosition`)은 차단기 시리즈 4번째이자 **마지막**. #46 MCCB(1차 등장) → #47 ALTS(2차 답습) → #48 ACBmetasol(3차 답습) → **#49 ACBsusol(본, 4차 답습)** 누적 완료. 시그니처(`setState/setAngleMap/setRotationAxis/setLeverMeshName/setInertia/getState/getCurrentAngle/enable/disable/destroy`) 4개 컴포넌트 100% 동일, 차이는 `_leverMeshName='Rectangle074'` (MCCB `'Rectangle180'`, ACBmetasol `'Rectangle070'`) 옵션값뿐. **사용자 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출 권장**.
