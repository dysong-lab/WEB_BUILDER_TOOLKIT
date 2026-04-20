# SC_02 — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Mesh(`SC-U1`)의 material 색상 변경

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

- 경로: `models/SC_02/01_default/SC_02.gltf`
- meshName: **`SC-U1`** — GLTF **리프 Mesh Node** 이름. 장비 폴더명 `SC_02`와 **meshName이 다른 비대칭 명명** 케이스(SC_01의 `SC_01` ≠ `SC-2U1`, RTU의 `RTU` ≠ `RTU2`, RoomCage의 `RoomCage` ≠ `cage01`, RoomCageSmall의 `RoomCageSmall` ≠ `cage02` 패턴과 동류). `getObjectByName('SC-U1')`으로 반환받은 Mesh는 자식이 없는 리프 Mesh이며 단일 `material`을 가지므로, MeshStateMixin은 **Mesh 브랜치**(`Array.isArray(material)` 미발동)로 진입해 material을 clone하고 color만 setHex로 치환한다. FLIREx·BATT·Chiller·Pump·Partition_small·RTU·RoadBlock·RoomCage·RoomCageSmall·SC_01의 "**단일 Mesh 직접 참조**" 패턴과 동일하며, Partition(부모 `Group003` Group-traverse)·Earthquake(자식 이름 배열 열거) 패턴과는 구분된다. meshName에 **하이픈(`-`)이 포함**된 특수 케이스로, `getObjectByName` 호출 시 정확히 `'SC-U1'` 문자열을 사용해야 한다(SC_01의 `SC-2U1`과 구분되는 **`2U` 없이 `U`만 있는** 규격 차이).
- 구조:
  ```
  scene → SC-U1 (Mesh Node, mesh 0,
                  rotation [0, -1, 0, 1.19e-08] ≒ Y축 π 회전,
                  material "Material #342540149")
  ```
- **루트 업스케일 없음(1:1 스케일)** — Partition·Pump·OHU103·RoomCage·RoomCageSmall·RoadBlock 등의 `scale [1000, 1000, 1000]` 업스케일 패턴과 달리 SC_02는 루트에 scale 적용이 없어 **원본 미터 유닛을 그대로 사용**한다(SC_01·RTU와 동일한 규약). Mesh Node 자체는 Y축 기준 약 π 회전(쿼터니언 `[0, -1, 0, 1.19e-08]`)만 가지며 scale은 없다. 원본 bound 기준 장면 크기 X ∈ [-0.4, 0.4] · Y ∈ [-1.275, 1.275] · Z ∈ [-1.1, 1.1] — **약 0.8 × 2.55 × 2.2 단위의 세로로 긴 직육면체**(Y축이 높이 방향, Z축 깊이 방향). **SC_01(0.8 × 2.95 × 2.2) 대비 Y축 높이만 약 0.4 단위 짧은 형제 변종**으로, X·Z 프로포션은 완전 동일. preview 카메라는 far=50, 바운드 기반 자동 거리 패턴.
- 정점 속성 / 인덱스:
  - `SC-U1` — POSITION 26개·인덱스 48개(SCALAR, `componentType: 5123` = unsigned short). SC_01의 `SC-2U1`(POSITION 46·인덱스 84) 대비 정점 약 0.57배·인덱스 약 0.57배 **더 단순한 박스형 캐비닛 지오메트리**(26 vertices ≒ 8 삼각형, 인덱스 48 → 16 삼각형 기준). RTU의 `RTU2`(POSITION 36·인덱스 54) 대비도 정점 약 0.72배로 더 단순. Pump의 `Pump`(POSITION 6090·인덱스 6090) 대비 약 234배 적은 **초저해상도 지오메트리**. TEXCOORD_0·NORMAL 있음, COLOR_0 없음. 원본 바운드 X ∈ [-0.4, 0.4] · Y ∈ [-1.275, 1.275] · Z ∈ [-1.1, 1.1].
- 재질: **1개 PBR material** (단일 material, Partition의 2개 쌍 구조와 대비)
  - **`Material #342540149`** (material 0, → `SC-U1` Mesh에 적용): `baseColorTexture` `maps/SC01.jpg`(케이싱 텍스처, JPG 불투명), `metallicFactor` 0.0(비금속), `roughnessFactor` 0.0(**완전 매끈** — 기본값과 명시적으로 다름, 광택성 표면), `doubleSided: true`(**양면 렌더** — 얇은 패널 내부도 보이게 함, SC_01·RTU와 동일한 양면 렌더 규약). `baseColorFactor`·`normalTexture`·`metallicRoughnessTexture`·`alphaMode` 없음 → **순수 텍스처 + 비금속 + 완전 매끈 + 양면 렌더**의 광택성 PBR 셰이딩. material 이름이 `Material #342540149`라는 **3ds Max 원본 material ID 기반 숫자 suffix** 형식으로, SC_01의 `Material #342540189`(ID `...189`)와 **ID 차이 40의 동일 범위**를 가져 동일 씬·동일 배치 export 시 생성된 **형제 material**임을 시사한다(SC 시리즈의 형제 관계가 material ID 레벨에서도 드러남). `extras`에 Arnold 호환 힌트(`babylonSeparateCullingPass`, `internal_reflections`, `indirect_diffuse/specular` 등)가 다수 선언되어 있으나 MeshStateMixin의 클로닝/color 치환에는 영향을 주지 않는다.
- MeshStateMixin의 material 처리:
  - material이 **단일 객체**(배열 아님)이므로 `Array.isArray(material)` 분기 미발동 → `material = material.clone(); material.color.setHex(color)` 직접 치환 경로.
  - material이 **baseColorTexture(불투명 JPG) 주도**이므로 color setHex가 텍스처에 곱해진다(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture). SC_01·RTU·Pump·Partition_small과 동일한 텍스처 기반 반영 특성.
  - 원본 속성(baseColorTexture·metallicFactor·roughnessFactor·doubleSided)은 clone 후에도 모두 유지되고 color 채널만 상태색으로 갱신된다. 특히 `doubleSided: true`가 보존되므로 양면 렌더 특성도 그대로 유지된다(SC_01·RTU와 동일). `alphaMode` 미선언이므로 OPAQUE 기본값이 유지되어 **전체 외장이 단일 상태색으로 균일하게 착색**된다(RoomCage/RoomCageSmall의 BLEND 반투명 착색과 대비).
- 텍스처 폴더: `maps/` (SC_01·RTU의 `maps/` 규약과 공통, BATT/Pump/RoadBlock/RoomCage/RoomCageSmall의 `textures/` 규약과 대비 — 2025년 빌드 babylon exporter의 기본 출력 폴더 규약)
  - `SC01.jpg` — `Material #342540149`의 baseColorTexture (SC 캐비닛 외장 텍스처). 파일명의 `01` suffix는 meshName(`SC-U1`)의 번호(`1`)와 **일치**하며(SC_01의 `SC04.jpg`는 `SC-2U1` 번호와 불일치였음) 원본 3ds Max 씬의 텍스처 라이브러리 인덱스를 따른 것으로 보인다.
- 구독 데이터 예: `[{ meshName: 'SC-U1', status }]` — **단일 meshName(리프 Mesh 이름)으로 단일 Mesh 제어**. FLIREx(`[{meshName:'FLIREx', status}]`)·Pump(`[{meshName:'Pump', status}]`)·RTU(`[{meshName:'RTU2', status}]`)·RoomCage(`[{meshName:'cage01', status}]`)·RoomCageSmall(`[{meshName:'cage02', status}]`)·SC_01(`[{meshName:'SC-2U1', status}]`)와 동일한 최단 경로 패턴이며, Partition의 `[{meshName:'Group003', status}]` Group-traverse 경유 방식과 대비된다. **장비 폴더명(`SC_02`)이 아닌 Mesh Node 이름(`SC-U1`)을 사용**해야 한다는 점에 주의(하이픈 포함 문자열 그대로 전달, `2U`가 아닌 `U`로 표기).
