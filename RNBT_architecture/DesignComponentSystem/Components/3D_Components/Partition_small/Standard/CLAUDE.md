# Partition_small — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Mesh(`partitionSmall`)의 material 색상 변경

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

- 경로: `models/Partition_small/01_default/Partition_small.gltf`
- meshName: **`partitionSmall`** — GLTF **리프 Mesh Node** 이름. 이 Mesh는 자식이 없는 단일 Mesh이며, MeshStateMixin이 `getObjectByName('partitionSmall')`으로 반환받은 Mesh에는 단일 `material`이 있어서 **Mesh 브랜치**(`Array.isArray(material)` 미발동)로 진입해 material을 clone하고 color만 setHex로 치환한다. FLIREx·BATT 등의 "**단일 Mesh 직접 참조**" 패턴과 동일하며, Partition(부모 `Group003` Group-traverse)·Earthquake(자식 이름 배열 열거) 패턴과는 구분된다.
- 구조:
  ```
  scene → root (scale [1000, 1000, 1000])
          └─ partitionSmall (Mesh Node, mesh 0, rotation [0, 0.7071068, 0, 0.7071067],
                             material "Material #25192005")
  ```
- **루트 `root` scale [1000, 1000, 1000] 업스케일** — Partition·Earthquake·OHU103·ElecPad·PCS와 동일한 "원본 mm 유닛 → 장면 m 유닛" 업스케일 패턴. Mesh Node 자체는 Y축 +90° 회전(quaternion `[0, 0.7071068, 0, 0.7071067]`)만 가지며 scale은 가지지 않는다. 원본 bound 기준 **원본** 장면 크기 약 0.00018 × 0.00379 × 0.0135 단위(얇고 좁은 판재, Z축이 길이 방향) → 업스케일 후 **0.18 × 3.79 × 13.5** 수준. Partition의 16 × 12 × 0.3 "가로로 넓은 얇은 평면"과 비교해 **훨씬 작고 세로로 긴** 프로포션. preview 카메라 near/far는 업스케일된 장면 크기에 맞춰 "far=100, 바운드 기반 자동 거리" 패턴으로 구성한다(Partition의 far=1000보다 작음 — 모델이 더 작음).
- 정점 속성 / 인덱스:
  - `partitionSmall` — POSITION 128개·인덱스 294개 (프레임/베이스 메시, 복합 형상). 바운드 X ∈ [-9.19e-05, 9.19e-05], Y ∈ [9.54e-10, 0.003789], Z ∈ [-0.00675, 0.00675] → 얇고 좁으며 Z축으로 길쭉한 판재. TEXCOORD_0·NORMAL 있음, COLOR_0 없음. Partition의 `partition` 자식(POSITION 124·인덱스 240)과 유사 복잡도이나 삼각형 수 54개 더 많음.
- 재질: **1개 PBR material** (단일 material, Partition의 2개 쌍 구조와 대비)
  - **`Material #25192005`** (material 0, → `partitionSmall`에 적용): `baseColorTexture` `textures/partitionSmall.jpg`(파티션 프레임 텍스처, JPG 불투명), `metallicFactor` 0.0(비금속), `roughnessFactor` 0.450053632(Partition의 두 material과 정확히 동일). `baseColorFactor`·`normalTexture`·`metallicRoughnessTexture`·`alphaMode`·`doubleSided` 없음 → **순수 텍스처 + 비금속 + 중간 거칠기**의 프레임 셰이딩. 이름 suffix `#25192005`는 Partition의 `#25192003`·`#25192004`를 잇는 연속 번호(동일 씬 또는 연속 씬에서 export된 시리즈).
- MeshStateMixin의 material 처리:
  - material이 **단일 객체**(배열 아님)이므로 `Array.isArray(material)` 분기 미발동 → `material = material.clone(); material.color.setHex(color)` 직접 치환 경로.
  - material이 **baseColorTexture 주도**이므로 color setHex가 텍스처에 곱해진다(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture). Partition과 동일한 텍스처 기반 반영 특성.
  - 원본 속성(baseColorTexture·metallicFactor·roughnessFactor)은 clone 후에도 모두 유지되고 color 채널만 상태색으로 갱신된다.
- 텍스처 폴더: `textures/` (1개 이미지)
  - `partitionSmall.jpg` — `Material #25192005` material의 baseColorTexture (파티션 프레임/베이스 텍스처). 파일명이 mesh·material 이름과 일치하여 1:1 대응이 명확(Partition의 `partition.jpg`/`glass_A.png` 쌍과 동일 명명 규약).
- 구독 데이터 예: `[{ meshName: 'partitionSmall', status }]` — **단일 meshName(리프 Mesh 이름)으로 단일 Mesh 제어**. FLIREx의 `[{meshName:'FLIREx', status}]`와 동일한 최단 경로 패턴이며, Partition의 `[{meshName:'Group003', status}]` Group-traverse 경유 방식과 대비된다.
