# LV_2P_03 — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `LV-2D13` Mesh의 material 색상을 변경

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

- 경로: `models/LV_2P_03/01_default/LV_2P_03.gltf`
- meshName: **`LV-2D13`** — GLTF 내부 Node/Mesh 이름이 폴더명(`LV_2P_03`)과 다르므로 주의. `getObjectByName('LV-2D13')`로 Mesh를 얻는다. LV 1P/2P 계열의 다른 meshName(`LV-2D2`, `LV-J1~J3`, `LV-LO1/LO2/LO005`, `LV-2C1-U`, `LV-H1-D029`)과 다른 `LV-2D13` 토큰을 가진다 (LV_01=`LV-2D4`, LV_1P_01=`LV-2D2`와 동일한 `LV-2D` 패밀리이나 접미 숫자가 13).
- 구조: `scene → "LV-2D13"(mesh 0, rotation=[0,-1,0,1.19e-8])` — 단일 Node, 단일 Mesh (LV_2P_02와 동일하게 `VRayLight001` 보조 Node 없음)
- 정점 속성: POSITION, NORMAL, TEXCOORD_0
- 재질: 단일 PBR material `Material #342540217` (metallicFactor 0.0, roughnessFactor 0.0, doubleSided=true)
- 텍스처 폴더: `maps/` (`maps/LV_UPS14.jpg`)
- 좌표 바운드(스케일 미적용): 약 [-0.4000016, -1.275, -1.09999979] ~ [0.4000016, 1.275, 1.09999967] (약 0.8 × 2.55 × 2.2 단위)
- MeshStateMixin은 `getObjectByName('LV-2D13')`로 Mesh를 얻어 material을 clone 후 color를 적용한다.
- 구독 데이터 예: `[{ meshName: 'LV-2D13', status }]`
