# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh) |
| 기본 Mixin | MeshStateMixin |

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
| Advanced/upsStatus | 완료 |

> **UpsStatusLedMixin / MultiLedStateMixin 즉시 승격 강력 권장 — 임계점 2개 도달 (#53 UPS + #54 B3F_UPS)**.
> 본 컴포넌트(`B3F_UPS`)의 `Advanced/upsStatus`는 **#53 UPS/Advanced/upsStatus와 시그니처 100% 동일**을 입증한 2번째 채택. 옵션값(`_ledOffset/_ledRadius/_ledSpacing`)만 모델 mesh local bbox 비례로 차이 (B3F_UPS는 root scale=1000으로 mesh local 좌표계가 매우 작음 → ~1/127 scale-down 적용). 시그니처(`setMode/setRemainingSeconds/pushSecond/startCountdown/stopCountdown/setLedColors/setLedLayout/setLedOffset/setLedRadius/setLedSpacing/setHudOffset/setMeshName/getMode/getRemainingSeconds/enable/disable/isEnabled/destroy`) 그대로 흡수 가능.
>
> **MeshTrackingHudMixin 매우 강력 권장 — HUD 10번째 채택 (#13 BATT/dataHud + #21 GasDetector/sensorHud + #24/#25/#26 sensorDataHud + #41 OHU103/outdoorUnitPerformance + #42 Generator/generatorOutput + #53 UPS/upsStatus + #54 B3F_UPS/upsStatus) — 임계점 명백히 초과 누적.** setData/setOffset/show/hide/start/stop/destroy + `_renderer/_camera/_hudRoot/_cardEl` 외부 주입 자원 패턴이 10개 컴포넌트에서 동일.
>
> **본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나, 사용자가 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출로 두 Mixin 승격 검토 권장 (UpsStatusLedMixin은 임계점 2개 도달 확정, HUD 10번째 채택은 다른 누적 mixin 후보보다 우선순위 최상위).**
