# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Group + 2 Mesh) |
| 기본 Mixin | MeshStateMixin |

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
| Advanced/steamEjection | 완료 |

> **Mixin 승격 강력 권장 — #35 CoolingTower/steamEjection + #36 CoolingTower02/steamEjection + 본 변형(#37 CoolingTower03/steamEjection) = 3개 컴포넌트 동일 기법 임계점 명백히 초과.** 본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나, 사용자가 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출로 `SteamParticleMixin`(또는 더 일반적인 `RisingParticleMixin`) 승격 검토 권장. 시그니처 15개(setEmissionRate/setTemperature/setTemperatureMap/setRiseSpeed/setLifetime/setSpread/setColor/setOpacity/setEmissionOriginOffset/start/stop/isRunning/enable/disable/destroy) 그대로 흡수 가능. 모델 scale 보정은 setEmissionOriginOffset 외부 파라미터로 흡수 가능.
