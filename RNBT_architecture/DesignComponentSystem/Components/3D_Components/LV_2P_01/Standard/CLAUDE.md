# LV_2P_01 — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `LV-2C1-U` Mesh의 material 색상을 변경

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

- 경로: `models/LV_2P_01/01_default/LV_2P_01.gltf`
- meshName: **`LV-2C1-U`** — GLTF 내부 Node/Mesh 이름이 폴더명(`LV_2P_01`)과 다르므로 주의. `getObjectByName('LV-2C1-U')`로 Mesh를 얻는다. 1P 계열의 `LV-2D2`, `LV-J1~J3`, `LV-LO1/LO2/LO005`와는 다른 `2C1-U` 접미 토큰을 가진다.
- 구조: `scene → "LV-2C1-U"(mesh 0, rotation=[0,-1,0,1.19e-8])` + `"VRayLight001"`(라이트 메타, Mesh 아님) — 루트 스케일 노드 없이 단일 Mesh
- 정점 속성: POSITION, NORMAL, TEXCOORD_0
- 재질: 단일 PBR material `Material #342540191` (metallicFactor 0.0, roughnessFactor 0.0, doubleSided=true)
- 텍스처 폴더: `maps/` (`maps/LV11.jpg`)
- 좌표 바운드(스케일 미적용): 약 [-0.550004959, -1.47500038, -1.09999979] ~ [0.550004959, 1.47500038, 1.09999979] (약 1.1 × 2.95 × 2.2 단위)
- MeshStateMixin은 `getObjectByName('LV-2C1-U')`로 Mesh를 얻어 material을 clone 후 color를 적용한다.
- 구독 데이터 예: `[{ meshName: 'LV-2C1-U', status }]`
