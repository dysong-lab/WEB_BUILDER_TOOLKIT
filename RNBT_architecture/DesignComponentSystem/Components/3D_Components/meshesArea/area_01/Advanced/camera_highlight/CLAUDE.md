# area_01 — Advanced/camera_highlight

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 다수 Mesh 색상 변경
2. **카메라 포커스** — 클릭된 Mesh로 카메라 이동 (resolveMeshName으로 동적 식별)
3. **선택 메시 강조** — 클릭된 Mesh에 emissive 발광 적용 (이전 선택은 자동 해제)

---

## 구현 명세

### Mixin

MeshStateMixin + CameraFocusMixin + MeshHighlightMixin

### colorMap (MeshStateMixin)

| 상태 | 색상 |
|------|------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### CameraFocus 옵션

| 옵션 | 값 |
|------|-----|
| duration | 1000 |

### highlight 옵션 (MeshHighlightMixin)

| 옵션 | 값 |
|------|-----|
| highlightColor | 0xFFFF00 |
| highlightIntensity | 0.3 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 발행 |
|--------|------|
| click | `@meshClicked` |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| resolveMeshName(event) | intersects에서 Mesh 이름 동적 추출 |

페이지의 `@meshClicked` 핸들러에서 `instance.resolveMeshName(event)`로 Mesh 이름 추출 후 `cameraFocus.focusOn({ meshName })` + `meshHighlight.clearAll() → meshHighlight.highlight(meshName)` 시퀀스로 처리한다.

---

## 세 채널 공존

| Mixin | 채널 | 용도 |
|-------|------|------|
| MeshStateMixin | material.color | 데이터 상태 표현 |
| MeshHighlightMixin | material.emissive | 사용자 선택 피드백 |
| CameraFocusMixin | 카메라/컨트롤 | 시점 이동 (material 무관) |

세 Mixin이 동일 Mesh에 동시 적용되어도 채널이 독립적이므로 충돌하지 않는다.
