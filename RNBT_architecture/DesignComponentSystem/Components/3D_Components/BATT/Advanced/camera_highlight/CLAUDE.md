# BATT — Advanced/camera_highlight

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Mesh 색상 변경
2. **카메라 포커스** — 클릭 시 카메라를 BATT로 이동
3. **선택 강조** — 클릭 시 emissive 강조 적용 (이전 강조는 자동 해제)

---

## 구현 명세

### Mixin

MeshStateMixin + CameraFocusMixin + MeshHighlightMixin

### colorMap

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

### highlight 옵션

| 옵션 | 값 |
|------|-----|
| highlightColor | 0xffaa00 |
| highlightIntensity | 0.4 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 발행 |
|--------|------|
| click | `@battClicked` |

### 커스텀 메서드

없음. 페이지 `@battClicked` 핸들러가 `cameraFocus.focusOn({ meshName: 'BATT' })` + `meshHighlight.clearAll() → meshHighlight.highlight('BATT')`를 호출한다.

---

## Mixin 공존

MeshState는 `material.color`, MeshHighlight는 `material.emissive`를 사용하여 채널이 독립적이다. CameraFocus는 카메라/컨트롤만 조작하므로 material과 무관하다. 세 Mixin이 동시에 적용되어도 충돌하지 않는다.
