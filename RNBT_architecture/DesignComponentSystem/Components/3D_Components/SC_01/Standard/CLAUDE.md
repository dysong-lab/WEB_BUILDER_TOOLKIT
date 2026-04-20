# SC_01 — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Mesh(`SC-2U1`)의 material 색상 변경

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

- 경로: `models/SC_01/01_default/SC_01.gltf`
- meshName: **`SC-2U1`** — GLTF **리프 Mesh Node** 이름. 장비 폴더명 `SC_01`과 **meshName이 다른 비대칭 명명** 케이스(RTU의 `RTU` ≠ `RTU2`, RoomCage의 `RoomCage` ≠ `cage01`, RoomCageSmall의 `RoomCageSmall` ≠ `cage02` 패턴과 동류). `getObjectByName('SC-2U1')`으로 반환받은 Mesh는 자식이 없는 리프 Mesh이며 단일 `material`을 가지므로, MeshStateMixin은 **Mesh 브랜치**(`Array.isArray(material)` 미발동)로 진입해 material을 clone하고 color만 setHex로 치환한다. FLIREx·BATT·Chiller·Pump·Partition_small·RTU·RoadBlock·RoomCage·RoomCageSmall의 "**단일 Mesh 직접 참조**" 패턴과 동일하며, Partition(부모 `Group003` Group-traverse)·Earthquake(자식 이름 배열 열거) 패턴과는 구분된다. meshName에 **하이픈(`-`)이 포함**된 특수 케이스로, `getObjectByName` 호출 시 정확히 `'SC-2U1'` 문자열을 사용해야 한다(영문자·숫자만 사용하는 다른 컴포넌트들과의 표기 차이).
- 구조:
  ```
  scene → SC-2U1 (Mesh Node, mesh 0,
                   rotation [0, -1, 0, 1.19e-08] ≒ Y축 π 회전,
                   material "Material #342540189")
  ```
- **루트 업스케일 없음(1:1 스케일)** — Partition·Pump·OHU103·RoomCage·RoomCageSmall·RoadBlock 등의 `scale [1000, 1000, 1000]` 업스케일 패턴과 달리 SC_01은 루트에 scale 적용이 없어 **원본 미터 유닛을 그대로 사용**한다(RTU와 동일한 규약). Mesh Node 자체는 Y축 기준 약 π 회전(쿼터니언 `[0, -1, 0, 1.19e-08]`)만 가지며 scale은 없다. 원본 bound 기준 장면 크기 X ∈ [-0.4, 0.4] · Y ∈ [-1.475, 1.475] · Z ∈ [-1.1, 1.1] — **약 0.8 × 2.95 × 2.2 단위의 세로로 긴 직육면체**(Y축이 높이 방향, Z축 깊이 방향). RTU(0.8 × 2.95 × 1.0) 대비 **Z축 깊이가 약 2.2배 더 깊은** 서버 캐비닛형 프로포션. preview 카메라는 far=50, 바운드 기반 자동 거리 패턴.
- 정점 속성 / 인덱스:
  - `SC-2U1` — POSITION 46개·인덱스 84개(SCALAR, `componentType: 5123` = unsigned short). RTU의 `RTU2`(POSITION 36·인덱스 54) 대비 정점 약 1.28배, 인덱스 약 1.56배 **약간 더 조밀한 박스형 캐비닛 지오메트리**(46 vertices ≒ 14 삼각형, 인덱스 84 → 28 삼각형 기준). Pump의 `Pump`(POSITION 6090·인덱스 6090) 대비 약 132배 적은 **저해상도 지오메트리**. TEXCOORD_0·NORMAL 있음, COLOR_0 없음. 원본 바운드 X ∈ [-0.4, 0.4] · Y ∈ [-1.475, 1.475] · Z ∈ [-1.1, 1.1].
- 재질: **1개 PBR material** (단일 material, Partition의 2개 쌍 구조와 대비)
  - **`Material #342540189`** (material 0, → `SC-2U1` Mesh에 적용): `baseColorTexture` `maps/SC04.jpg`(케이싱 텍스처, JPG 불투명), `metallicFactor` 0.0(비금속), `roughnessFactor` 0.0(**완전 매끈** — 기본값과 명시적으로 다름, 광택성 표면), `doubleSided: true`(**양면 렌더** — 얇은 패널 내부도 보이게 함, Pump의 doubleSided 미지정과 대비, RTU와 동일한 양면 렌더 규약). `baseColorFactor`·`normalTexture`·`metallicRoughnessTexture`·`alphaMode` 없음 → **순수 텍스처 + 비금속 + 완전 매끈 + 양면 렌더**의 광택성 PBR 셰이딩. material 이름이 `Material #342540189`라는 **3ds Max 원본 material ID 기반 숫자 suffix** 형식으로, RTU의 `Material #342540168`(ID `...168`)과 **ID 차이 21의 유사 범위**를 가져 동일 시기·동일 씬에서 생성된 형제 자산임을 시사한다. BATT 계열의 자동 생성 패턴과 유사. `extras`에 Arnold 호환 힌트(`babylonSeparateCullingPass`, `internal_reflections`, `indirect_diffuse/specular` 등)가 다수 선언되어 있으나 MeshStateMixin의 클로닝/color 치환에는 영향을 주지 않는다.
- MeshStateMixin의 material 처리:
  - material이 **단일 객체**(배열 아님)이므로 `Array.isArray(material)` 분기 미발동 → `material = material.clone(); material.color.setHex(color)` 직접 치환 경로.
  - material이 **baseColorTexture(불투명 JPG) 주도**이므로 color setHex가 텍스처에 곱해진다(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture). RTU·Pump·Partition_small과 동일한 텍스처 기반 반영 특성.
  - 원본 속성(baseColorTexture·metallicFactor·roughnessFactor·doubleSided)은 clone 후에도 모두 유지되고 color 채널만 상태색으로 갱신된다. 특히 `doubleSided: true`가 보존되므로 양면 렌더 특성도 그대로 유지된다(RTU와 동일). `alphaMode` 미선언이므로 OPAQUE 기본값이 유지되어 **전체 외장이 단일 상태색으로 균일하게 착색**된다(RoomCage/RoomCageSmall의 BLEND 반투명 착색과 대비).
- 텍스처 폴더: `maps/` (RTU의 `maps/` 규약과 공통, BATT/Pump/RoadBlock/RoomCage/RoomCageSmall의 `textures/` 규약과 대비 — 2025년 빌드 babylon exporter의 기본 출력 폴더 규약)
  - `SC04.jpg` — `Material #342540189`의 baseColorTexture (SC 캐비닛 외장 텍스처). 파일명의 `04` suffix는 meshName(`SC-2U1`)의 번호(`1`)와 다르며 원본 3ds Max 씬의 텍스처 라이브러리 인덱스를 따른 것으로 보인다(**메시 번호 ≠ 텍스처 번호**의 비대칭 명명 패턴).
- 구독 데이터 예: `[{ meshName: 'SC-2U1', status }]` — **단일 meshName(리프 Mesh 이름)으로 단일 Mesh 제어**. FLIREx(`[{meshName:'FLIREx', status}]`)·Pump(`[{meshName:'Pump', status}]`)·RTU(`[{meshName:'RTU2', status}]`)·RoomCage(`[{meshName:'cage01', status}]`)·RoomCageSmall(`[{meshName:'cage02', status}]`)와 동일한 최단 경로 패턴이며, Partition의 `[{meshName:'Group003', status}]` Group-traverse 경유 방식과 대비된다. **장비 폴더명(`SC_01`)이 아닌 Mesh Node 이름(`SC-2U1`)을 사용**해야 한다는 점에 주의(하이픈 포함 문자열 그대로 전달).
