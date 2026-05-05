# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh) |
| 기본 Mixin | MeshStateMixin |

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
| Advanced/breaker_leverPosition | 완료 (`[MODEL_READY]` — 단일 Mesh, 본체/레버 분리 시 `setLeverMeshName` 교체) |

> **BreakerLeverPositionMixin 승격 후보 (#46~#49 예정)** — 차단기 시리즈 5개(#45 VCB Standard 미생산으로 보류 + #46 MCCB(1차) + **#47 ALTS(본) 2차 답습** + #48 ACBmetasol + #49 ACBsusol) 중 본 변형은 2차 답습. 시그니처(`setState/setAngleMap/setRotationAxis/setLeverMeshName/setInertia/getState/getCurrentAngle/enable/disable/destroy`) #46과 100% 동일, 옵션값(`_leverMeshName='ALTS-1'`)만 차이. 후속 #48/#49 답습이 누적되어 4개 컴포넌트 임계점에 도달하면 `BreakerLeverPositionMixin` 승격 검토 권장.
