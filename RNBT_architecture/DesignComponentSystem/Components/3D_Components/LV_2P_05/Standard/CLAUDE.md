# LV_2P_05 — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `LV-2J7` Mesh의 material 색상을 변경

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

- 경로: `models/LV_2P_05/01_default/LV_2P_05.gltf`
- meshName: **`LV-2J7`** — GLTF 내부 Node/Mesh 이름이 폴더명(`LV_2P_05`)과 다르므로 주의. `getObjectByName('LV-2J7')`로 Mesh를 얻는다. LV 1P/2P 계열의 다른 meshName(`LV-2D2`/`LV-2D4`/`LV-2D13`, `LV-J1~J3`, `LV-LO1/LO2/LO005`, `LV-2C1-U`, `LV-H1-D029`, `LV-2H3`, `LV-2F3`)과 전혀 다른 **`LV-2J` 접두 패밀리**의 첫 엔트리로, 접미 토큰은 `7`이다.
- 구조: `scene → "LV-2J7"(mesh 0, rotation=[0,-1,0,-7.54979e-08])` — 단일 Node, 단일 Mesh (LV_2P_02/LV_2P_03/LV_2P_04와 동일하게 `VRayLight001` 보조 Node 없음)
- 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 36, 인덱스 84 — LV_2P_04보다 단순)
- 재질: 단일 PBR material `Material #342540215` (metallicFactor 0.0, roughnessFactor 0.0, doubleSided=true)
- 텍스처 폴더: `maps/` (`maps/LV_UPS13.jpg`)
- 좌표 바운드(스케일 미적용): 약 [-0.5000048, -1.275, -1.09999979] ~ [0.5000048, 1.275, 1.09999967] (약 1.0 × 2.55 × 2.2 단위 — LV_2P_02/LV_2P_03과 Y·Z 동일, X만 0.2 단위 더 큼)
- MeshStateMixin은 `getObjectByName('LV-2J7')`로 Mesh를 얻어 material을 clone 후 color를 적용한다.
- 구독 데이터 예: `[{ meshName: 'LV-2J7', status }]`
