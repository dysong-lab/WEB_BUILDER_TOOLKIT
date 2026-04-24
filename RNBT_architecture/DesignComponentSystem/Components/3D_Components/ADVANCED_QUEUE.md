# 3D 컴포넌트 Advanced 생산 대기열

## 세트 정의

| 세트 | 설명 |
|------|------|
| **Standard** | 필수. 모든 3D 컴포넌트가 반드시 갖추는 기본 (MeshState만) |
| **Advanced** | 선택. 필요에 따라 조합하는 확장 기능 |

> 2D Advanced와 마찬가지로 각 변형은 사전 등록된 항목만 `produce-3d-advanced-loop`으로 생산한다.
> 후보 발굴은 `plan-3d-advanced-queue`가 담당한다.

---

## 폴더 명명 규칙

```
Components/3D_Components/<컴포넌트경로>/Advanced/<변형이름>/
├── CLAUDE.md
├── scripts/
└── page/
```

**`<컴포넌트경로>`**: `Components/3D_Components/` 아래 컴포넌트 루트 상대경로.
- 개별 장비: `<장비명>` (예: `BATT`, `CoolingTower02`)
- 컨테이너: `meshesArea/<컨테이너명>` (예: `meshesArea/area_01`)

**변형 이름**: 프리셋 이름(예: `camera`, `highlight`) 또는 자유 조합의 camelCase 설명명(예: `highlightAnimation`, `dataHud`)

**Standard와의 분리 정당성**: Advanced 변형은 Standard와 명백히 다른 register.js(Mixin 조합, 커스텀 메서드 중 하나 이상)를 가져야 한다. 동일 register.js로 표현 가능하면 Standard 내부에 둔다.

---

## 변형 프리셋 (참조용)

자주 쓰이는 Mixin 조합에 이름을 붙여둔 프리셋이며 **고정 목록이 아니다**. 필요 시 자유 조합을 직접 기재한다.

| 프리셋 이름 | Mixin 조합 |
|------------|-----------|
| camera | MeshState + CameraFocus |
| popup | MeshState + 3DShadowPopup |
| highlight | MeshState + MeshHighlight |
| camera_highlight | MeshState + CameraFocus + MeshHighlight |
| visibility | MeshState + MeshVisibility |
| animation | MeshState + AnimationMixin |
| clipping | MeshState + ClippingPlaneMixin |

> 자유 조합 예시: `highlightAnimation: MeshState+MeshHighlight+Animation`, `dataHud: MeshState+FieldRender`(컨테이너용)

---

## 커스텀 메서드 vs 신규 Mixin 판단 규칙

Advanced 변형에서 필요한 기능이 기존 Mixin으로 표현되지 않을 때, **커스텀 메서드**로 구현할지 **신규 Mixin**으로 승격할지는 다음 순서로 결정한다.

### 1차 — 단일 컴포넌트 전용인가?

- **YES → 커스텀 메서드**: `this.<name>` 네임스페이스로 register.js 내부에 직접 작성.
  - 예: `meshesArea/STATCOM_MMC/Advanced/pipeFlow`(STATCOM MMC GLTF의 Water 텍스처 UV 스크롤 — 해당 장비 전용)
- **NO → 2차로**

### 2차 — 재사용이 예상되는가?

- **2개 이상 컴포넌트에서 같은 기법으로 재사용 예상 → 신규 Mixin 후보**
  - 예: 큐 #10 `Chiller/fluidFlow`는 배관 파티클 흐름 기법으로 BATT 등에도 재사용 예상 → `FluidFlowMixin` 신규 제안
- **재사용 여부 불확실 → 1차 구현은 커스텀 메서드**, 2번째 컴포넌트 등록 시점에 Mixin 승격 검토

### 3차 — "같은 기능"이라도 기법이 다르면 통합하지 않는다

기능 카테고리가 같아 보여도 렌더링 기법이 다르면 **별도 이름 · 별도 구현**을 유지한다.

| 변형 | 기법 | 구현 |
|------|------|------|
| `pipeFlow` (STATCOM_MMC) | `baseColorTexture.offset` UV 누적 스크롤 | 커스텀 메서드 `this.pipeFlow` |
| `fluidFlow` (Chiller, #10 대기) | 배관 경로 파티클 시스템 생성/이동 | 신규 Mixin `FluidFlowMixin` |

이유: 텍스처 vs 파티클 버퍼로 자원·정리 순서·파라미터 셋이 달라 하나의 API로 추상화하기 어렵다. 무리한 통합은 분기·옵션 폭발을 낳는다.

### 승격 기준 — 커스텀 메서드 → Mixin

기존 커스텀 메서드를 Mixin으로 승격하려면 아래를 모두 만족해야 한다.

1. **기법 동일성**: 2번째 컴포넌트가 같은 구현 기법을 채택해야 함
2. **API 호환성**: 기존 호출 시그니처(`start/stop/setSpeed/destroy` 등)를 Mixin이 그대로 수용 가능해야 함
3. **이름**: 기법 중심으로 짓는다 (예: `UvScrollFlowMixin` > `PipeFlowMixin`)
4. **커밋 분리**: Mixin 신설 커밋과 기존 컴포넌트 적용 커밋을 분리하여 변경 단위를 추적 가능하게 한다

승격이 불가능하면(기법이 달라짐) 기존 커스텀 메서드는 **그대로 유지**한다. 네이밍이 비슷하다는 이유로 강제 통합하지 않는다.

---

## 생산 대기열

| 순번 | 컴포넌트경로 | 유형 | 변형 이름 | 설명 | 상태 |
|------|-------------|------|----------|------|------|
| 1 | meshesArea/area_01 | 컨테이너 | highlight | 선택 메시 아웃라인 강조 (MeshState+MeshHighlight) | 완료 |
| 2 | meshesArea/area_01 | 컨테이너 | camera_highlight | 카메라 이동과 발광 강조 동시 적용 (MeshState+CameraFocus+MeshHighlight) | 완료 |
| 3 | meshesArea/area_01 | 컨테이너 | visibility | 층별/구역별 선택적 표시 (MeshState+MeshVisibility) | 완료 |
| 4 | meshesArea/area_01 | 컨테이너 | animation | 레이어/시간 GLTF 애니메이션 재생 (MeshState+AnimationMixin) | 완료 |
| 5 | meshesArea/area_01 | 컨테이너 | clipping | 건물 단면 분석 (MeshState+ClippingPlane) | 완료 |
| 6 | meshesArea/area_01 | 컨테이너 | hudInfo | 구역별 인원/자산/상태 오버레이 (MeshState+FieldRender+meshName) | 대기 |
| 7 | Chiller | 개별 | visibility | 하우징/내부 컴포넌트 선택 노출 (MeshState+MeshVisibility) | 대기 |
| 8 | Chiller | 개별 | clipping | 압축기 내부 단면 분석 (MeshState+ClippingPlane) | 대기 |
| 9 | Chiller | 개별 | dynamicRpm | RPM 데이터 비례 압축기 동작 속도 (AnimationMixin+커스텀 메서드) | 대기 |
| 10 | Chiller | 개별 | fluidFlow | 냉매 배관 파티클 흐름 시각화 (신규 Mixin: FluidFlowMixin) | 대기 |
| 11 | BATT | 개별 | visibility | 랙 외피/셀 선택 노출 (MeshState+MeshVisibility) | 대기 |
| 12 | BATT | 개별 | clipping | 셀 팩 내부 구조 단면 분석 (MeshState+ClippingPlane) | 대기 |
| 13 | BATT | 개별 | dataHud | SOC/SOH/전압 수치 표시 (MeshState+FieldRender+커스텀 메서드) | 대기 |
| 14 | BATT | 개별 | alarmPulse | error 상태 셀 색상 펄스 (커스텀 RAF 루프) | 대기 |
| 15 | BATT | 개별 | chargeFlowArrow | 충/방전 방향 화살표 애니메이션 (AnimationMixin+커스텀 메서드) | 대기 |
| 16 | BATT | 개별 | hierarchyZoom | 랙→모듈→셀 계층 확대 (CameraFocus+MeshVisibility+커스텀 메서드) | 대기 |
| 17 | BATT | 개별 | cellHeatmap | 셀 단위 온도/이상 열분포 (신규 Mixin: CellHeatmapMixin) | 대기 |
| 18 | meshesArea/STATCOM_MMC | 컨테이너 | pipeFlow | 파이프 mesh의 baseColorTexture UV 스크롤로 유체 흐름 시각화 (MeshState+커스텀 메서드) | 완료 |
| 19 | meshesArea/STATCOM_BD | 컨테이너 | animation | GLTF 내장 rotation 클립 재생으로 장비 동작 시각화 (MeshState+Animation) | 완료 |
| 20 | meshesArea/STATCOM_Submodule | 컨테이너 | animation | GLTF 내장 다채널 translation/rotation 클립 재생으로 서브모듈 동작 시각화 (MeshState+Animation) | 완료 |
| 21 | GasDetector | 개별 | sensorHud | 실시간 가스농도 3D 수치 라벨 + 감지반경 반투명 구체 시각화 (MeshState+커스텀 메서드) | 대기 |
| 22 | LeakDetector | 개별 | leakAlarmPulse | 누수 감지 시 색상 펄스 + 누수 방향 화살표 표시 (MeshState+커스텀 메서드) | 대기 |
| 23 | IntrusionDetectionSensor | 개별 | sensorAlertDirection | 침입 방향 화살표 + 경고 원형 펄스 웨이브 방사 (MeshState+커스텀 메서드) | 대기 |
| 24 | tempHumiTH2B | 개별 | sensorDataHud | 실시간 온습도 3D 라벨 + 임계값 초과 시 색상/펄스 (MeshState+커스텀 메서드) | 대기 |
| 25 | thermohygrostat | 개별 | sensorDataHud | 실시간 온습도 3D 라벨 + 임계값 초과 시 색상/펄스 (MeshState+커스텀 메서드) | 대기 |
| 26 | MonnitTemperature_sensor | 개별 | sensorDataHud | 실시간 온도 3D 라벨 + 임계값 초과 펄스 (MeshState+커스텀 메서드) | 대기 |
| 27 | THERMALCAM | 개별 | heatmapSurface | 열화상 온도 분포를 표면 color gradient texture로 동적 매핑 (MeshState+커스텀 메서드) | 대기 |
| 28 | FLIREx | 개별 | heatmapSurface | 적외선 온도 분포 표면 매핑 스트리밍 (MeshState+커스텀 메서드) | 대기 |
| 29 | Marker_FixedCCTV | 개별 | fieldOfView | 반투명 원뿔 시야각 콘 표시 (신규 Mixin: CameraFOVConeMixin) | 대기 |
| 30 | Marker_RotationaCCTV | 개별 | fieldOfView | PTZ rotation 동기화 시야각 콘 (신규 Mixin: CameraFOVConeMixin) | 대기 |
| 31 | Marker_MoveCCTV | 개별 | fieldOfView | 이동형 시야각 콘 (신규 Mixin: CameraFOVConeMixin) | 대기 |
| 32 | Marker_AICCTV | 개별 | ai_detectionZone | FOV 콘 + AI 감지객체 3D 마커 스폰 (CameraFOVConeMixin+커스텀 메서드) | 대기 |
| 33 | IRISID_iCAM7 | 개별 | detectionMarker | 홍채/얼굴 인식 성공/실패 위치 임시 마커 (MeshState+커스텀 메서드) | 대기 |
| 34 | LPR | 개별 | plateDetectionOverlay | 번호판 bbox 강조 + 번호 팝업 표시 (MeshHighlight+3DShadowPopup+커스텀 메서드) | 대기 |
| 35 | CoolingTower | 개별 | steamEjection | 상부 수증기 파티클 (온도 비례 생성률) (MeshState+커스텀 메서드) | 대기 |
| 36 | CoolingTower02 | 개별 | steamEjection | 상부 수증기 파티클 (MeshState+커스텀 메서드) | 대기 |
| 37 | CoolingTower03 | 개별 | steamEjection | 상부 수증기 파티클 (MeshState+커스텀 메서드) | 대기 |
| 38 | Pump | 개별 | dynamicRpm | RPM 비례 임펠러 회전 + 관성 감쇠 (MeshState+커스텀 메서드) | 대기 |
| 39 | Heatexchanger | 개별 | dynamicRpm | RPM 비례 팬 회전 (MeshState+커스텀 메서드) | 대기 |
| 40 | AHU103 | 개별 | dynamicRpm | 팬/블레이드 RPM 비례 회전 (MeshState+커스텀 메서드) | 대기 |
| 41 | OHU103 | 개별 | outdoorUnitPerformance | 냉매 압력/온도 3D 게이지 + 팬 회전 (MeshState+커스텀 메서드) | 대기 |
| 42 | Generator | 개별 | generatorOutput | 출력 kW 3D 바그래프 실시간 (MeshState+커스텀 메서드) | 대기 |
| 43 | GeneratorSmall | 개별 | generatorOutput | 출력 kW 3D 바그래프 (MeshState+커스텀 메서드) | 대기 |
| 44 | Aircon_Ceiling01 | 개별 | indoorUnitTemperature | 모드/설정온도 HUD + 실내온도 미니차트 texture (MeshState+ECharts Canvas+커스텀 메서드) | 대기 |
| 45 | VCB | 개별 | breaker_leverPosition | ON/OFF/TRIP 레버 회전 애니메이션 (MeshState+커스텀 메서드) | 대기 |
| 46 | MCCB | 개별 | breaker_leverPosition | ON/OFF/TRIP 레버 회전 (MeshState+커스텀 메서드) | 대기 |
| 47 | ALTS | 개별 | breaker_leverPosition | ON/OFF/TRIP 레버 회전 (MeshState+커스텀 메서드) | 대기 |
| 48 | ACBmetasol | 개별 | breaker_leverPosition | ON/OFF/TRIP 레버 회전 (MeshState+커스텀 메서드) | 대기 |
| 49 | ACBsusol | 개별 | breaker_leverPosition | ON/OFF/TRIP 레버 회전 (MeshState+커스텀 메서드) | 대기 |
| 50 | Inverter | 개별 | powerFlowIndicator | 충/방전 방향 화살표 + 전력량 선 굵기 (MeshState+커스텀 메서드) | 대기 |
| 51 | PCS | 개별 | powerFlowIndicator | 전력 흐름 방향 화살표 (MeshState+커스텀 메서드) | 대기 |
| 52 | LithiumionBattery | 개별 | batteryHierarchyZoom | Rack→Module→Cell 계층 확대 + 각 레벨 HUD (MeshVisibility+CameraFocus+커스텀 메서드) | 대기 |
| 53 | UPS | 개별 | upsStatus | 3모드 LED(정상/바이패스/배터리) + 잔여시간 카운트다운 (MeshState+커스텀 메서드) | 대기 |
| 54 | B3F_UPS | 개별 | upsStatus | 3모드 LED + 방전 카운트다운 (MeshState+커스텀 메서드) | 대기 |
| 55 | AutomaticDoor2P | 개별 | doorOpenClose | 문 개폐 애니메이션 + 불허 시 경광 펄스 (MeshState+커스텀 메서드) | 대기 |
| 56 | UBio-XFace | 개별 | facialRecognitionFeedback | 인식 성공/실패 하이라이트 + 이름 팝업 (MeshHighlight+3DShadowPopup+커스텀 메서드) | 대기 |
| 57 | UBio-XFacePremium | 개별 | facialRecognitionFeedback | 인식 성공/실패 피드백 + 팝업 (MeshHighlight+3DShadowPopup+커스텀 메서드) | 대기 |
| 58 | SpeedGateSet01 | 개별 | gateAccessEvent | 게이트 암 회전 애니메이션 + LED 허가/거부 피드백 (MeshState+커스텀 메서드) | 대기 |
| 59 | SpeedGateSet02 | 개별 | gateAccessEvent | 게이트 암 회전 + LED 피드백 (MeshState+커스텀 메서드) | 대기 |
| 60 | SpeedGateSet03 | 개별 | gateAccessEvent | 게이트 암 회전 + LED 피드백 (MeshState+커스텀 메서드) | 대기 |
| 61 | CardReader_T40 | 개별 | cardAccessFeedback | 카드 태깅 LED 상태(녹/황/적) + 사운드 피드백 (MeshState+커스텀 메서드) | 대기 |
| 62 | Marker_Firealarm | 개별 | emergencyZoneRadius | 보호 영역 반투명 구체 + 비상 시 발광 증가 (MeshState+커스텀 메서드) | 대기 |
| 63 | Marker_IndoorHydrant | 개별 | emergencyZoneRadius | 보호 영역 반투명 구체 (MeshState+커스텀 메서드) | 대기 |
| 64 | Marker_OutdoorHydrant | 개별 | emergencyZoneRadius | 보호 영역 반투명 구체 (MeshState+커스텀 메서드) | 대기 |
| 65 | meshesArea/area_01 | 컨테이너 | zonalHeatmap | 구역별 점유율/온도/위험도 color gradient 매핑 (신규 Mixin: ZonalHeatmapMixin) | 대기 |
| 66 | meshesArea/STATCOM_BD | 컨테이너 | statcom_powerFlow | 무효전력 투입 진행 3D 바/원형 progress (MeshState+커스텀 메서드) | 대기 |
| 67 | meshesArea/STATCOM_Submodule | 컨테이너 | submoduleDetailZoom | 서브모듈 부품 확대 + 부품별 온도/수명 라벨 (CameraFocus+MeshVisibility+커스텀 메서드) | 대기 |

> `plan-3d-advanced-queue`로 후보를 발굴하여 등록한다.
>
> 등록 예시 — 개별: `| 1 | Panel | 개별 | highlight | ... | 대기 |`
> 등록 예시 — 컨테이너: `| 2 | meshesArea/area_01 | 컨테이너 | clipping | ... | 대기 |`

---

## 상태 값

- **대기**: 아직 착수하지 않음 (`produce-3d-advanced-loop`의 다음 대상)
- **진행 중**: 현재 사이클에서 생산 중
- **완료**: 생산 완료, 폴더 존재
