# IRISID_iCAM7 — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 `icam7` Mesh의 material 색상 변경

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

- 경로: `models/IRISID_iCAM7/01_default/IRISID_iCAM7.gltf`
- meshName: `icam7` (GLTF 최상위 `root` 아래 단일 자식 Node/Mesh)
- 구조: `root`(scale 1000x) → `icam7` Mesh (단일)
- Material: 단일 PBR material(`Material #42086`), 텍스처 `textures/icam7.jpg`
- MeshStateMixin은 meshName에 대해 `getObjectByName` → material clone + color 적용

### 폴더명과 meshName 불일치 주의

폴더/컴포넌트명은 `IRISID_iCAM7`이지만 GLTF 내부 Node/Mesh 이름은 `icam7`이다. 페이지에서 `equipmentStatus`를 발행할 때 `meshName`을 반드시 `icam7`으로 지정해야 MeshStateMixin이 대상 Mesh를 탐색(`getObjectByName`)할 수 있다. register.js는 meshName을 하드코딩하지 않으므로, 데이터 발행 측에서만 주의하면 된다.
