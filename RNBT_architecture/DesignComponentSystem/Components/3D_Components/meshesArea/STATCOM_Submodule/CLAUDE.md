# STATCOM_Submodule

## 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 컨테이너 (1 GLTF = N Mesh) |
| 기본 Mixin | MeshStateMixin |
| 특징 | STATCOM Submodule 장비 내부 37개 Mesh(`STATCOM_SubModule_00`~`STATCOM_SubModule_36` 연속 번호). mesh name은 모델 원본 식별자(`STATCOM_SubModule_{n}` 형식, 폴더명 `STATCOM_Submodule`과 달리 mesh 측은 `SubModule` 대문자 M 유지) 그대로 두어 데이터 제공자 측에서 키로 매핑 |

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
| Advanced/animation | 완료 |
| Advanced/submoduleDetailZoom | 완료 |

> **MeshTrackingSpriteLabelMixin (가칭) 임계점 도달 — sprite 라벨 5번째 채택 (#21 GasDetector/sensorHud + #24 tempHumiTH2B/sensorDataHud + #25 thermohygrostat/sensorDataHud + #26 MonnitTemperature_sensor/sensorDataHud + 본 submoduleDetailZoom의 sprite 라벨 부분)**: setPartData/setOffset/start/stop/destroy + Sprite/CanvasTexture/SpriteMaterial 자체 자원 관리 패턴이 5개 컴포넌트에서 동일. 본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지.
>
> **PartDetailZoomMixin (가칭) — 컨테이너 + 부품 mesh 진입 패턴 1번째 채택**: #16 BATT/hierarchyZoom + #52 LithiumionBattery/batteryHierarchyZoom의 개별 거리 단계 시그니처(`goTo/next/prev`)를 컨테이너 mesh 단위(`zoomToPart(meshName)`)로 변형. 다음 컨테이너 변형(예: 다른 meshesArea 부품 zoom)에서 동일 시그니처 채택될 경우 승격 검토.
>
> **본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나, 사용자가 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출로 두 Mixin 승격 검토 권장.**
