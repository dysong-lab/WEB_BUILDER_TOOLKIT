# gltf_container — Advanced/camera

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 다수 Mesh 색상 변경
2. **카메라 포커스** — 클릭된 Mesh로 카메라 이동 (resolveMeshName으로 동적 식별)

---

## 구현 명세

### Mixin

MeshStateMixin + CameraFocusMixin

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
