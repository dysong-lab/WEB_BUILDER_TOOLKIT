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
Components/3D_Components/<장비명>/Advanced/<변형이름>/
├── CLAUDE.md
├── scripts/
└── page/
```

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

| 순번 | 장비명 | 유형 | 변형 이름 | 설명 | 상태 |
|------|--------|------|----------|------|------|

> `plan-3d-advanced-queue`로 후보를 발굴하여 등록한다.

---

## 상태 값

- **대기**: 아직 착수하지 않음 (`produce-3d-advanced-loop`의 다음 대상)
- **진행 중**: 현재 사이클에서 생산 중
- **완료**: 생산 완료, 폴더 존재
