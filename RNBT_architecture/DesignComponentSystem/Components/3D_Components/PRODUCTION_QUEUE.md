# 3D 컴포넌트 생산 대기열

## 세트 정의

| 세트 | 설명 |
|------|------|
| **Standard** | 필수. 모든 3D 컴포넌트가 반드시 갖추는 기본 (MeshState만) |
| **Advanced** | 선택. 필요에 따라 조합하는 확장 기능 |

## 변형 카탈로그

| 번호 | 이름 | 세트 | Mixin 조합 |
|------|------|------|-----------|
| 01 | status | Standard | MeshState |
| 02 | camera | Advanced | MeshState + CameraFocus |
| 03 | popup | Advanced | MeshState + 3DShadowPopup |
| 04 | highlight | Advanced | MeshState + MeshHighlight |
| 05 | camera_highlight | Advanced | MeshState + CameraFocus + MeshHighlight |
| 06 | visibility | Advanced | MeshState + MeshVisibility |
| 07 | animation | Advanced | MeshState + AnimationMixin |
| 08 | clipping | Advanced | MeshState + ClippingPlaneMixin |

> 기존 생산된 01~03은 `01_status`, `02_status_camera`, `03_status_popup` 폴더명을 유지한다.
> 신규 생산분(04~)부터 새 명명 규칙을 적용한다.

---

## 생산 대기열

### Phase A: 개별 장비 — Advanced 확장

| 순번 | 장비명 | 유형 | 기존 (완료) | 추가 대상 | 상태 |
|------|--------|------|------------|----------|------|
| 1 | BATT | 개별 | 01,02,03 | 04,05 | 대기 |
| 2 | Chiller | 개별 | 01,02,03 | 04,05 | 대기 |
| 3 | Panel | 개별 | 01,02,03 | 04,05 | 대기 |
| 4 | UPS | 개별 | 01,02,03 | 04,05 | 대기 |
| 5 | tempHumiTH2B | 개별 | 01,02,03 | 04,05 | 대기 |
| 6 | thermohygrostat | 개별 | 01,02,03 | 04,05 | 대기 |

### Phase B: 컨테이너 — Advanced 확장

| 순번 | 장비명 | 유형 | 기존 (완료) | 추가 대상 | 상태 |
|------|--------|------|------------|----------|------|
| 7 | gltf_container | 컨테이너 | 01,02,03 | 04,05,06,07,08 | 대기 |

---

## 생산 요약

| Phase | 장비 수 | 변형 수 | 총 생산량 |
|-------|--------|--------|----------|
| A (개별 Advanced) | 6 | 2 | 12 |
| B (컨테이너 Advanced) | 1 | 5 | 5 |
| **합계** | **7** | - | **17** |
