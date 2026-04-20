# OutdoorConditioner_Ani — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `winConditioner`, `metalFan03`, `metalFan04` Mesh의 material 색상 변경

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

- 경로: `models/OutdoorConditioner_Ani/01_default/OutdoorConditioner_Ani.gltf`
- meshName: `winConditioner`, `metalFan03`, `metalFan04` (GLTF 최상위 `root` 아래 자식 Node/Mesh 3개). 폴더명(`OutdoorConditioner_Ani`)과 GLTF 내부 Node/Mesh 이름이 **불일치**하므로 — HumanSymbol_Ani 선례와 동일 — register.js는 세 Mesh 이름에 의존하지 않고 MeshStateMixin이 페이지에서 발행된 데이터(`{ meshName, status }` 배열)를 받아 `getObjectByName`으로 탐색한다.
- 구조: `scene → root(scale [1000,1000,1000]) → winConditioner(mesh 0, 1 primitive, 1 material) + metalFan03(mesh 1, 1 primitive, 1 material) + metalFan04(mesh 2, 1 primitive, 1 material)`. 세 자식 Node 모두 `rotation [0, -0.7071068, 0, 0.7071067]`(Y축 +90도 보정 쿼터니언)과 `scale 0.15`이 적용되어 있다. Node별 translation으로 본체 상단에 좌우 팬이 올라가는 배치를 구성.
- 정점 속성: POSITION, NORMAL, **COLOR_0**, TEXCOORD_0. `winConditioner`는 정점 3352·인덱스 15498, 팬들은 각 정점 1058·인덱스 4068. OHU103 선례와 달리 정점 컬러 속성 COLOR_0이 포함되어 있으나 MeshStateMixin은 `material.color`만 갱신하므로 색상 치환 동작은 동일.
- 재질: 2개 PBR material
  - `Material #42064` (material 0) — `winConditioner` 전용, baseColorTexture `textures/OutdoorConditioner.jpg`
  - `Material #42066` (material 1) — `metalFan03`·`metalFan04` 공유, baseColorTexture `textures/fan.jpg`
  - 두 material이 공유되더라도 MeshStateMixin은 각 Mesh 단위로 material을 clone하여 color를 적용하므로 한쪽 팬의 색상 변경이 다른 쪽에 전파되지 않는다.
  - metallicFactor 0.0, roughnessFactor 0.450053632(정상 중간값), doubleSided 설정 없음(일반 backface culling) — OHU103과 동일한 표준 공조 장비 외장 특성
  - material 이름 3ds Max 5자리 숫자 일련번호 형식(`Material #42064`, `#42066`) — OHU103의 `#42136`와 인접한 번호대
- 텍스처 폴더: `textures/` (2개 이미지 — `OutdoorConditioner.jpg`, `fan.jpg`)
- 애니메이션: GLTF 내부 `Ani01` 클립(41 keyframes, metalFan03·metalFan04 rotation)이 존재하나 **Standard에서는 재생하지 않는다** — Advanced(animation) 변형에서 AnimationMixin으로 처리 예정. HumanSymbol_Ani 선례와 동일 원칙.
- 구독 데이터 예: `[{ meshName: 'winConditioner', status }, { meshName: 'metalFan03', status }, { meshName: 'metalFan04', status }]`
