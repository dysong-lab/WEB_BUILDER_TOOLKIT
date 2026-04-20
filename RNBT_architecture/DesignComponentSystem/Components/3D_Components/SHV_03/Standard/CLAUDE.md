# SHV_03 — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Mesh(`SHV-6`)의 material 색상 변경

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

- 경로: `models/SHV_03/01_default/SHV_03.gltf`
- meshName: **`SHV-6`** — GLTF **리프 Mesh Node** 이름. 장비 폴더명 `SHV_03`(언더스코어+숫자 3)과 **meshName이 다른 비대칭 명명** 케이스(BATT·Pump·HV_1P_01의 "장비명 = meshName" 대칭 규약과 대비). 특히 **폴더 번호(3)와 Node 번호(6)가 일치하지 않는** 특이 패턴 — SHV_01(폴더 1 = Node 1 일치)·SHV_02(폴더 2 ≠ Node 4-1)와도 다른 독립 번호 운영 케이스로, SHV 라이브러리 내부 식별자가 폴더 번호와 무관하게 운영됨을 드러낸다. RTU의 `RTU`→`RTU2`·SC_02의 `SC_02`→`SC-U1`·SHV_01의 `SHV_01`→`SHV-1`·SHV_02의 `SHV_02`→`SHV-4-1`과 동류의 2025년 빌드 babylon exporter 비대칭 명명 패턴(폴더는 언더스코어 표기, 내부 Node는 하이픈 표기). `getObjectByName('SHV-6')`으로 반환받은 Mesh는 자식이 없는 리프 Mesh이며 단일 `material`을 가지므로, MeshStateMixin은 **Mesh 브랜치**(`Array.isArray(material)` 미발동)로 진입해 material을 clone하고 color만 setHex로 치환한다. FLIREx·BATT·Chiller·Pump·Partition_small·RTU·HV_1P_01·SHV_01·SHV_02의 "**단일 Mesh 직접 참조**" 패턴과 동일하며, Partition(부모 `Group003` Group-traverse)·SDC500(부모 `SDC500` Group-traverse)·Earthquake(자식 이름 배열 열거) 패턴과는 구분된다.
- 구조:
  ```
  scene → SHV-6 (Mesh Node, mesh 0,
                  rotation [0.0, -1.0, 0.0, 4.371139E-08] ≒ Y축 π 회전,
                  material "Material #342540113")
  ```
- **루트 업스케일 없음(1:1 스케일)** — Partition·Pump·OHU103 등의 `scale [1000, 1000, 1000]` 업스케일 패턴과 달리 SHV_03은 루트에 scale 적용이 없어 **원본 미터 유닛을 그대로 사용**한다(RTU·SC_01/SC_02·BATT·HV_1P_01·SHV_01·SHV_02와 동류). Mesh Node 자체는 Y축 기준 약 π 회전(쿼터니언 `[0.0, -1.0, 0.0, 4.371139E-08]`)만 가지며 scale·translation은 없다(SHV_02와 **비트 단위로 동일한** `4.371139E-08` w값). 원본 bound 기준 장면 크기 X ∈ [-0.6000004, 0.6000004] · Y ∈ [-1.3235234, 1.3235234] · Z ∈ [-1.5, 1.5] — **약 1.2 × 2.65 × 3.0 단위의 세로로 긴 직육면체**(Z축이 가장 긴 깊이 방향, Y가 높이, X가 폭). **SHV_01·SHV_02와 완전히 동일한 바운드 수치**로, SHV 제품군의 공통 외형 템플릿을 텍스처/머티리얼만 바꿔 재활용한 바리에이션 설계임이 3종(SHV_01/02/03)에 걸쳐 확인된다. preview 카메라는 far=50, 바운드 기반 자동 거리 패턴(maxDim ≒ 3.0).
- 정점 속성 / 인덱스:
  - `SHV-6` — POSITION 26개·인덱스 48개(SCALAR, `componentType: 5123` = unsigned short). SHV_01의 `SHV-1`·SHV_02의 `SHV-4-1`과 **정점/인덱스 수치가 비트 단위로 일치**(SHV 제품군 공통 템플릿 지오메트리의 3종 확정). Pump의 `Pump`(POSITION 6090) 대비 약 235배 적은 저해상도 박스형 캐비닛 지오메트리이며 RTU의 `RTU2`(POSITION 36·인덱스 54)보다도 더 적음(26 vertices ≒ 8-10 삼각형, 인덱스 48 → 16 삼각형). TEXCOORD_0·NORMAL 있음, COLOR_0 없음. 원본 바운드 X ∈ [-0.6000004, 0.6000004] · Y ∈ [-1.3235234, 1.3235234] · Z ∈ [-1.5, 1.5].
- 재질: **1개 PBR material** (단일 material, SDC500의 2개 쌍 구조와 대비, RTU·HV_1P_01·SHV_01·SHV_02와 동일한 단일 material 구조)
  - **`Material #342540113`** (material 0, → `SHV-6` Mesh에 적용): `baseColorTexture` `maps/SHV05.jpg`(케이싱 텍스처, JPG 불투명), `metallicFactor` 0.0(비금속), `roughnessFactor` 0.0(**완전 매끈** — 기본값과 명시적으로 다름, 광택성 표면), `doubleSided: true`(**양면 렌더** — 얇은 패널 내부도 보이게 함). `baseColorFactor`·`normalTexture`·`metallicRoughnessTexture`·`alphaMode` 없음 → **순수 텍스처 + 비금속 + 완전 매끈 + 양면 렌더**의 광택성 PBR 셰이딩. material 이름이 `Material #342540113`이라는 **3ds Max 원본 material ID 기반 숫자 suffix** 형식으로 SHV_02의 `Material #342540112`보다 1 큰 ID이고 SHV_01의 `Material #342540116`보다 3 작은 ID이다 — SHV 라이브러리 내 material ID 순번 SHV_02(112) → SHV_03(113) → SHV_01(116)의 띄엄띄엄한 오름차순. RTU의 `Material #342540168`·HV_1P_01의 `Material #342540146`·BATT 계열의 자동 생성 패턴과 동일 규약이며, Pump(`Pump`)·SDC500(`SDC500`)·Partition 시리즈(`#25192003`)와 대비된다. `extras`에 babylon·Arnold 호환 다중 힌트(`babylonSeparateCullingPass: false`·`subsurface_type: ""`·`caustics: false`·`internal_reflections: true`·`exit_to_background: false`·`indirect_diffuse: 1.0`·`indirect_specular: 1.0`·`dielectric_priority: 0`·`transmit_aovs: false`·`aov_id1~8: ""`)가 선언되어 있음(SHV_01·SHV_02·SC_02와 동일한 다중 extras 패턴, SDC500의 단일 `babylonSeparateCullingPass` 항목만과 대비 — 2025년 빌드 + Arnold 호환 출력의 특성).
- MeshStateMixin의 material 처리:
  - material이 **단일 객체**(배열 아님)이므로 `Array.isArray(material)` 분기 미발동 → `material = material.clone(); material.color.setHex(color)` 직접 치환 경로.
  - material이 **baseColorTexture 주도**이므로 color setHex가 텍스처에 곱해진다(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture). RTU·HV_1P_01·Pump·SHV_01·SHV_02와 동일한 텍스처 기반 반영 특성(SDC500의 `plastic01`이 baseColorFactor 주도로 color 전체 치환인 것과 대비).
  - 원본 속성(baseColorTexture·metallicFactor·roughnessFactor·doubleSided·extras)은 clone 후에도 모두 유지되고 color 채널만 상태색으로 갱신된다. 특히 `doubleSided: true`가 보존되므로 양면 렌더 특성도 그대로 유지된다.
- 텍스처 폴더: `maps/` (1개 이미지, HV_1P_01·RTU·SHV_01·SHV_02의 `maps/` 폴더 규약과 공통 — 2025년 빌드 babylon exporter의 출력 폴더 규약, BATT·Pump의 `textures/` 규약과 대비)
  - `SHV05.jpg` — `Material #342540113`의 baseColorTexture (SHV 케이싱/외장 텍스처). 파일명 suffix `05`는 동일 SHV 라이브러리 내 **5번째 텍스처 파일**로, meshName `SHV-6`의 번호 `6`과도, 폴더 번호 `03`과도 **일치하지 않는다** — SHV_03 인스턴스는 **폴더 번호(3) · Node 번호(6) · 텍스처 번호(5) 세 가지가 모두 독립**적으로 운영되는 특수 케이스. SHV_01(폴더 1 / Node 1 / 텍스처 7 → 부분 일치)·SHV_02(폴더 2 / Node 4-1 / 텍스처 4 → Node 중간 숫자와 텍스처 번호 일치)와 달리 SHV_03은 3대 식별자 전부가 어긋나므로, 텍스처를 추측할 수 없고 GLTF에서 확인해야 한다.
- 구독 데이터 예: `[{ meshName: 'SHV-6', status }]` — **단일 meshName(리프 Mesh 이름, 하이픈 1회 단순 표기)으로 단일 Mesh 제어**. FLIREx(`[{meshName:'FLIREx', status}]`)·Pump(`[{meshName:'Pump', status}]`)·Partition_small(`[{meshName:'partitionSmall', status}]`)·RTU(`[{meshName:'RTU2', status}]`)·HV_1P_01(`[{meshName:'HV_1P_01', status}]`)·SHV_01(`[{meshName:'SHV-1', status}]`)·SHV_02(`[{meshName:'SHV-4-1', status}]`)와 동일한 최단 경로 패턴이며, Partition의 `[{meshName:'Group003', status}]`·SDC500의 `[{meshName:'SDC500', status}]` Group-traverse 경유 방식과 대비된다. **장비 폴더명(`SHV_03`)이 아닌 Mesh Node 이름(`SHV-6`, 언더스코어 → 하이픈+숫자 불일치)을 사용**해야 한다는 점에 주의 — 폴더 번호와 Node 번호가 다르므로 절대 추측하지 말 것.
