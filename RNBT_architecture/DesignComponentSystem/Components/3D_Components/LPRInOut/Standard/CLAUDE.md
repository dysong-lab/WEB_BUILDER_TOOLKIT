# LPRInOut — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 단일 Mesh `LPRInOut`의 material 색상을 변경

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

- 경로: `models/LPRInOut/01_default/LPRInOut.gltf`
- meshName: **`LPRInOut`** — GLTF 내부 Node/Mesh/Material 이름이 폴더/컴포넌트 이름과 동일한 대소문자 `LPRInOut`이다.
- 구조: `root`(scale 1000x) → Mesh `LPRInOut` (단일 primitive, Material `LPRInOut`)
- 텍스처: `textues/LPRInOut.jpg` (UV 매핑, GLTF `images[0].uri` 참조)
- 텍스처 폴더명: `textues/` (원본 오타, `textures` 아님) — GLTF 내부가 이 경로를 참조하므로 리네임 금지
- MeshStateMixin은 `getObjectByName('LPRInOut')`로 단일 Mesh를 얻어 material을 clone 후 color 적용 (single-Mesh 처리 경로)
