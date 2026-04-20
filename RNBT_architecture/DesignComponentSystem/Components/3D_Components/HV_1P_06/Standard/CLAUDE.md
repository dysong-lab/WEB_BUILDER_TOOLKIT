# HV_1P_06 — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `HV_1P_06` Mesh의 material 색상 변경

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

- 경로: `models/HV_1P_06/01_default/HV_1P_06.gltf`
- meshName: `HV_1P_06` (GLTF 최상위 Node 이름 = Mesh 이름; 폴더명과 동일)
- 구조: 단일 Mesh `HV_1P_06` (자식 없음, scene에 추가 VRayLight001 Node가 있으나 Mesh가 아니므로 색상 적용 대상 외)
- Material: 단일 PBR material (`Material #342540134`)
- 텍스처 폴더: `maps/` (`maps/HV10.jpg`)
- MeshStateMixin의 단일 Mesh 경로를 탄다 — material clone + color 적용
