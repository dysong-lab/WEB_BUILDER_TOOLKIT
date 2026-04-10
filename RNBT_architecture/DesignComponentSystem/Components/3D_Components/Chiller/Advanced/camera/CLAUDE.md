# Chiller — Advanced/camera

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Mesh 색상 변경
2. **카메라 포커스** — 클릭 시 카메라를 해당 장비로 이동

---

## 구현 명세

### Mixin

MeshStateMixin + CameraFocusMixin

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

### 이벤트 (customEvents)

없음 (페이지 before_load.js에서 처리)

### 커스텀 메서드

없음
