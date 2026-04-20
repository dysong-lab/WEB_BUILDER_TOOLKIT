# LV_2P_02 — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `LV-H1-D029` Mesh의 material 색상을 변경

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

- 경로: `models/LV_2P_02/01_default/LV_2P_02.gltf`
- meshName: **`LV-H1-D029`** — GLTF 내부 Node/Mesh 이름이 폴더명(`LV_2P_02`)과 다르므로 주의. `getObjectByName('LV-H1-D029')`로 Mesh를 얻는다. 1P 계열의 `LV-2D2`, `LV-J1~J3`, `LV-LO1/LO2/LO005`, 2P 계열 LV_2P_01의 `LV-2C1-U`와는 다른 `H1-D029` 토큰을 가진다.
- 구조: `scene → "LV-H1-D029"(mesh 0, rotation=[0,-1,0,1.19e-8])` — 단일 Node, 단일 Mesh (LV_2P_01과 달리 `VRayLight001` 보조 Node 없음)
- 정점 속성: POSITION, NORMAL, TEXCOORD_0
- 재질: 단일 PBR material `Material #342540205` (metallicFactor 0.0, roughnessFactor 0.0, doubleSided=true)
- 텍스처 폴더: `maps/` (`maps/LV_UPS05.jpg`)
- 좌표 바운드(스케일 미적용): 약 [-0.399998665, -1.275, -1.09999979] ~ [0.399998665, 1.275, 1.09999967] (약 0.8 × 2.55 × 2.2 단위)
- MeshStateMixin은 `getObjectByName('LV-H1-D029')`로 Mesh를 얻어 material을 clone 후 color를 적용한다.
- 구독 데이터 예: `[{ meshName: 'LV-H1-D029', status }]`
