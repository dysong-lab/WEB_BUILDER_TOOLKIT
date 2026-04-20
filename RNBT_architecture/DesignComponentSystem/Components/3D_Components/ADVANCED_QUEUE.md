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

## 생산 대기열

| 순번 | 컴포넌트경로 | 유형 | 변형 이름 | 설명 | 상태 |
|------|-------------|------|----------|------|------|
| 1 | meshesArea/area_01 | 컨테이너 | highlight | 선택 메시 아웃라인 강조 (MeshState+MeshHighlight) | 대기 |
| 2 | meshesArea/area_01 | 컨테이너 | camera_highlight | 카메라 이동과 발광 강조 동시 적용 (MeshState+CameraFocus+MeshHighlight) | 대기 |
| 3 | meshesArea/area_01 | 컨테이너 | visibility | 층별/구역별 선택적 표시 (MeshState+MeshVisibility) | 대기 |
| 4 | meshesArea/area_01 | 컨테이너 | animation | 레이어/시간 GLTF 애니메이션 재생 (MeshState+AnimationMixin) | 대기 |
| 5 | meshesArea/area_01 | 컨테이너 | clipping | 건물 단면 분석 (MeshState+ClippingPlane) | 대기 |
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

> `plan-3d-advanced-queue`로 후보를 발굴하여 등록한다.
>
> 등록 예시 — 개별: `| 1 | Panel | 개별 | highlight | ... | 대기 |`
> 등록 예시 — 컨테이너: `| 2 | meshesArea/area_01 | 컨테이너 | clipping | ... | 대기 |`

---

## 상태 값

- **대기**: 아직 착수하지 않음 (`produce-3d-advanced-loop`의 다음 대상)
- **진행 중**: 현재 사이클에서 생산 중
- **완료**: 생산 완료, 폴더 존재
