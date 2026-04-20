# HV — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `HV` Group 하위 Mesh들의 색상 일괄 변경

---

## 구현 명세

### Mixin

MeshStateMixin

### colorMap

| 상태 | 색상 |
|------|------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

### 이벤트 (customEvents)

없음

### 커스텀 메서드

없음

### 모델 참조

- 경로: `models/HV/01_default/HV.gltf`
- meshName: `HV` (GLTF 최상위 Group 이름; 폴더명과 동일)
- 구조: Group `HV` → 자식 Mesh 6개 (`HV_A111_7UA_DN`, `HV_A111_7UA_DN_cap`, `sign01_103`, `sign01_102`, `HV_A111_7UA_UP`, `HV_A111_7UA_UP_cap`, `Sign02_028`)
- 텍스처 폴더: `maps/` (`maps/HV_A121_CH1.jpg`, `maps/cap01.jpg`, `maps/sign01.jpg`, `maps/Sign02.jpg`)
- MeshStateMixin의 Group 경로를 탄다 — Group 한 번 매칭으로 자식 Mesh들에 일괄 material clone + color 적용
