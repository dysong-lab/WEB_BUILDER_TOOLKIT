# HV_2P_04 — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `HV-M7-U` Mesh의 material 색상 변경

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

- 경로: `models/HV_2P_04/01_default/HV_2P_04.gltf`
- meshName: `HV-M7-U` (GLTF 최상위 Node 이름 = Mesh 이름; **폴더명 `HV_2P_04`와 다름 — 하이픈 구분의 별도 명명 체계**)
- 구조: 단일 Mesh `HV-M7-U` (자식 없음). `VRayLight001` Node가 존재하지만 Mesh 참조가 없어 MeshState 대상에서 제외된다
- Material: 단일 PBR material (`Material #342540139`)
- 텍스처 폴더: `maps/` (`maps/HV04.jpg`)
- MeshStateMixin의 단일 Mesh 경로를 탄다 — material clone + color 적용
