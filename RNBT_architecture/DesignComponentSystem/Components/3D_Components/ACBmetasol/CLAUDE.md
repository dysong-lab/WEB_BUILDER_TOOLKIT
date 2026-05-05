# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh) |
| 기본 Mixin | MeshStateMixin |

## 장비 설명

ACB(Air Circuit Breaker) Metasol — 기중차단기. DC ACB Switch Disconnector 타입. 전력 설비의 회로 차단/투입을 담당한다.

## 모델 구조

- 루트 노드: `ACBmetasol`
- meshName: `ACBmetasol`

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
| Advanced/breaker_leverPosition | 완료 |

> **BreakerLeverPositionMixin 승격 후보 (#46~#49 진행 중)** — 본 변형(`Advanced/breaker_leverPosition`)은 차단기 시리즈 #48 (3차 답습). #46 MCCB(1차 등장) → #47 ALTS(2차 답습) → **#48 ACBmetasol(본)** → #49 ACBsusol(예정). 시그니처 100% 동일, `_leverMeshName='Rectangle070'` (MCCB `'Rectangle180'`) 옵션값만 차이. **#49 ACBsusol 4차 답습 완료 시 4개 임계점 도달** — 그 시점에 `BreakerLeverPositionMixin` 승격 검토 권장.
