# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh) |
| 기본 Mixin | MeshStateMixin |

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
| Advanced/camera | 완료 |
| Advanced/popup | 완료 |
| Advanced/upsStatus | 완료 |

> **UpsStatusLedMixin / MultiLedStateMixin 승격 후보 (#53+#54 예정)** — 본 컴포넌트(#53 UPS)의 `Advanced/upsStatus` 변형이 LED 합성(3-mode online/bypass/battery + 잔여시간 카운트다운 HUD) 1차 등장. **#54 B3F_UPS/upsStatus가 본 변형 시그니처 100% 답습 예정**. 2번째 채택(#54) 시점에 사용자가 `create-mixin-spec` → `implement-mixin` 호출로 승격 검토 권장 — 시그니처(`setMode/setRemainingSeconds/pushSecond/startCountdown/stopCountdown/setLedColors/setLedLayout/setLedOffset/setLedRadius/setLedSpacing/setHudOffset/setMeshName/getMode/getRemainingSeconds/enable/disable/isEnabled/destroy`) 그대로 흡수 가능.
>
> **MeshTrackingHudMixin 매우 강력 권장 — HUD 9번째 채택 (#13 BATT/dataHud + #21 GasDetector/sensorHud + #24/#25/#26 sensorDataHud + #41 OHU103/outdoorUnitPerformance + #42 Generator/generatorOutput + 본 컴포넌트 upsStatus(#53)) — 임계점 명백히 초과 누적.** setData(또는 텍스트 갱신)/setOffset/show/hide/start/stop/destroy + `_renderer/_camera/_hudRoot/_cardEl` 외부 주입 자원 패턴이 9개 컴포넌트에서 동일.
>
> **본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나, 사용자가 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출로 두 Mixin 승격 검토 권장 (HUD 9번째 채택은 다른 누적 mixin 후보보다 우선순위 최상위).**
