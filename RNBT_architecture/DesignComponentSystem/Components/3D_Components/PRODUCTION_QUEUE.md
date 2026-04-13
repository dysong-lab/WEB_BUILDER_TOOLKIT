# 3D 컴포넌트 생산 대기열

## 세트 정의

| 세트 | 설명 |
|------|------|
| **Standard** | 필수. 모든 3D 컴포넌트가 반드시 갖추는 기본 (MeshState만) |
| **Advanced** | 선택. 필요에 따라 조합하는 확장 기능 |

## 변형 프리셋 (자주 쓰는 조합)

아래는 **고정 목록이 아니라** 자주 쓰이는 Mixin 조합에 이름을 붙여둔 프리셋이다.
장비 특성에 따라 이 프리셋을 쓰지 않고 자유 조합을 직접 기재해도 된다.

| 프리셋 이름 | 세트 | Mixin 조합 |
|------------|------|-----------|
| status | Standard | MeshState |
| camera | Advanced | MeshState + CameraFocus |
| popup | Advanced | MeshState + 3DShadowPopup |
| highlight | Advanced | MeshState + MeshHighlight |
| camera_highlight | Advanced | MeshState + CameraFocus + MeshHighlight |
| visibility | Advanced | MeshState + MeshVisibility |
| animation | Advanced | MeshState + AnimationMixin |
| clipping | Advanced | MeshState + ClippingPlaneMixin |

**사용 가능한 Mixin (3D 관련)**: MeshState, CameraFocus, 3DShadowPopup, MeshHighlight, MeshVisibility, Animation, ClippingPlane, HeatmapJs, 그리고 컨테이너의 경우 2D Mixin(FieldRender, ListRender 등)도 조합 가능.

### 폴더 명명 규칙

- **Standard**: `Standard/` (status 프리셋 고정)
- **Advanced — 프리셋 사용**: `Advanced/<프리셋이름>/` (예: `Advanced/camera`)
- **Advanced — 자유 조합**: `Advanced/<camelCase 설명명>/` (예: `Advanced/highlightAnimation`, `Advanced/dataHud`)

자유 조합은 CLAUDE.md에 사용한 Mixin 목록과 선택 이유를 명시한다.

---

## 생산 대기열

**"추가 대상" 표기법**:
- 프리셋 이름 (예: `highlight`, `camera_highlight`)
- 또는 자유 조합 (예: `highlightAnimation: MeshState+MeshHighlight+Animation`)
- 여러 변형을 한 장비에 생산할 경우 `;`로 구분

### Phase A: 개별 장비 — Advanced 확장

| 순번 | 장비명 | 유형 | 기존 (완료) | 추가 대상 | 상태 |
|------|--------|------|------------|----------|------|
| 1 | BATT | 개별 | status, camera, popup, highlight, camera_highlight | — | 완료 |
| 2 | Chiller | 개별 | status, camera, popup, highlight, camera_highlight | — | 완료 |
| 3 | Panel | 개별 | status, camera, popup | highlight; camera_highlight | 대기 |
| 4 | UPS | 개별 | status, camera, popup | highlight; camera_highlight | 대기 |
| 5 | tempHumiTH2B | 개별 | status, camera, popup | highlight; camera_highlight | 대기 |
| 6 | thermohygrostat | 개별 | status, camera, popup | highlight; camera_highlight | 대기 |

### Phase B: 컨테이너 — Advanced 확장

| 순번 | 장비명 | 유형 | 기존 (완료) | 추가 대상 | 상태 |
|------|--------|------|------------|----------|------|
| 7 | gltf_container | 컨테이너 | status, camera, popup | highlight; camera_highlight; visibility; animation; clipping | 대기 |

---

## 생산 요약

| Phase | 장비 수 | 변형 수 | 총 생산량 |
|-------|--------|--------|----------|
| A (개별 Advanced) | 6 | 2 | 12 |
| B (컨테이너 Advanced) | 1 | 5 | 5 |
| **합계** | **7** | - | **17** |
