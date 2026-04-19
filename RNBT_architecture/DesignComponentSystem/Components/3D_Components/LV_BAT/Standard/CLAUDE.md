# LV_BAT — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `LV-BAT1` Mesh의 material 색상을 변경

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

- 경로: `models/LV_BAT/01_default/LV_BAT.gltf`
- meshName: **`LV-BAT1`** — GLTF 내부 Node/Mesh 이름이 폴더명(`LV_BAT`)과 다르므로 주의. `getObjectByName('LV-BAT1')`로 Mesh를 얻는다. LV_2P 시리즈의 어떤 접두 패밀리(`LV-H1-D###`, `LV-2C1-U`, `LV-2D13`, `LV-2F3`, `LV-2J7`, `LV-B1-U`, `LV-D2-U`, `LV-F1-U`)에도 속하지 않는 **`LV-BAT#` 고유 접두 패밀리**이며, 현재 저장소에는 접미 숫자 `1`의 단일 엔트리만 존재한다. Blank_Panel_03의 `LV-F3`와도 접두가 다르다.
- 구조: `scene → "LV-BAT1"(mesh 0, rotation=[0,-1,0,1.19248806e-8])` — 단일 Node, 단일 Mesh (LV_2P_01·LV_2P_07·LV_2P_08과 달리 `VRayLight001` 보조 Node 없음, LV_2P_02/09/10/11과 동일 패턴)
- 정점 속성: POSITION, NORMAL, TEXCOORD_0 (정점 46, 인덱스 84 — LV_2P_02/09/10/11과 정확히 일치)
- 재질: 단일 PBR material `Material #342540167` (metallicFactor 0.0, roughnessFactor 0.0, doubleSided=true). LV_2P_11의 `Material #342540210` 등과 다른 배터리 전용 번호.
- 텍스처 폴더: `maps/` (`maps/LV_BAT.jpg`)
- 좌표 바운드(스케일 미적용): 약 [-0.399998844, -1.4750011, -1.0999999] ~ [0.399998844, 1.4750011, 1.1] (약 0.8 × 2.95 × 2.2 단위 — Y(2.95)는 LV_2P_06/07/08과 동일한 "장신형", LV_2P_02/09/10/11의 2.55보다 0.4 큼)
- MeshStateMixin은 `getObjectByName('LV-BAT1')`로 Mesh를 얻어 material을 clone 후 color를 적용한다.
- 구독 데이터 예: `[{ meshName: 'LV-BAT1', status }]`
