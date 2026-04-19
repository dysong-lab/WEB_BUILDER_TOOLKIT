# Partition — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Group Node `Group003`의 자식 Mesh(`partition`, `glass_A`)의 material 색상을 일괄 변경

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

- 경로: `models/Partition/01_default/Partition.gltf`
- meshName: **`Group003`** — GLTF 중간 **Group Node** 이름. 이 Group은 두 자식 Mesh(`partition`·`glass_A`)를 children으로 가지며, MeshStateMixin이 `getObjectByName('Group003')`으로 반환받은 Group에는 `material`이 없어서 `obj.traverse(child => child.material && applyColor(child, color))` 분기로 진입해 **자식 Mesh 두 개의 material을 일괄 clone + color 치환**한다. PTT의 "**Group-traverse 단일 참조**" 패턴과 동일하며(PTT는 `PTT_033`), Earthquake의 "자식 이름 배열 열거(`['Earthquake','Earthquake_A']`)" 패턴과는 구분된다. Group 이름이 `Group003`이라는 **모델러 자동 생성 범용명**이라는 점이 PTT(`PTT_033` — 장비명 기반)와의 차이이나, GLTF 내에 Group 노드가 하나뿐이므로 이름 충돌은 없다.
- 구조:
  ```
  scene → root (scale [1000, 1000, 1000])
          └─ Group003 (Group Node, children [2, 3])
              ├─ partition (Mesh Node, mesh 0, material "Material #25192003")
              └─ glass_A  (Mesh Node, mesh 1, material "Material #25192004")
  ```
- **루트 `root` scale [1000, 1000, 1000] 업스케일** — Earthquake·OHU103·ElecPad·PCS와 동일한 "원본 mm 유닛 → 장면 m 유닛" 업스케일 패턴. PTT·P300C·P2400CH의 "root scale 없음 → 초소형 좌표 원본 유지" 케이스와 대비된다. 두 자식 mesh 바운드 합산 기준 **원본** 장면 크기 약 0.016 × 0.012 × 0.0003 단위(매우 얇은 평면) → 업스케일 후 16 × 12 × 0.3 수준. preview 카메라 near/far는 업스케일된 장면 크기에 맞춰 "far=1000, 바운드 기반 자동 거리" 패턴으로 구성한다.
- 정점 속성 / 인덱스:
  - `partition` — POSITION 124개·인덱스 240개 (프레임/베이스 메시, 복합 형상). 바운드 X ∈ [-0.008, 0.008], Y ∈ [-0.01035, 0.00165], Z ∈ [-0.00015, 0.00015] → 얇은 판재. TEXCOORD_0 있음 (NORMAL 있음, COLOR_0 없음).
  - `glass_A` — POSITION 8개·인덱스 12개 (단순 쿼드 박스 — 사각 유리 패널). 바운드 X ∈ [-0.0078, 0.0078], Y ∈ [-0.00015, 0.00155], Z ∈ [-0.000032, 0.000032] → 매우 얇은 평면. TEXCOORD_0 있음.
- 재질: **2개 PBR material** (자식별 1개씩, 쌍 구조)
  - **`Material #25192003`** (material 0, → `partition`에 적용): `baseColorTexture` `textures/partition.jpg`(파티션 프레임 텍스처, JPG 불투명), `metallicFactor` 0.0(비금속), `roughnessFactor` 0.450053632(중간 거칠기). `baseColorFactor`·`normalTexture`·`metallicRoughnessTexture`·`doubleSided` 없음(암묵적 single-sided) → **순수 텍스처 + 비금속 + 중간 거칠기**의 프레임 셰이딩. 이름은 3ds Max MAX 머티리얼 ID 기반 자동 명명(`#25192003`).
  - **`Material #25192004`** (material 1, → `glass_A`에 적용): `baseColorTexture` `textures/glass_A.png`(유리 패널 텍스처, PNG), `metallicFactor` 0.0, `roughnessFactor` 0.450053632(동일). `baseColorFactor`·`normalTexture`·`metallicRoughnessTexture`·`alphaMode` 없음 → **순수 텍스처 + 비금속 + 중간 거칠기**의 유리 셰이딩. PNG 포맷 자체는 three.js에서 자동 알파 블렌딩을 활성화하지 않으며, glTF `alphaMode` 미지정 시 OPAQUE로 해석되므로 **명시적 투명 처리는 없음**. 이름 suffix(`#25192004`)만 바꾼 쌍(pair) material 구조.
- MeshStateMixin의 material 처리:
  - 두 material 모두 **단일 객체**(배열 아님)이므로 `Array.isArray(material)` 분기 미발동 → 각 자식에 대해 `material = material.clone(); material.color.setHex(color)` 직접 치환 경로.
  - **두 material 모두 baseColorTexture가 주 색상 소스**이므로 color setHex가 전체 색을 완전히 치환하지 않고 텍스처 색에 곱해진다(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture). PTT의 "한쪽은 texture, 다른 쪽은 factor → 반영도 불일치" 케이스와 달리 Partition은 **두 자식 모두 텍스처 주도**라 상태색 반영이 두 자식에서 균일한 강도로 나타난다.
  - 원본 속성(baseColorTexture·metallicFactor·roughnessFactor)은 clone 후에도 모두 유지되고 color 채널만 상태색으로 갱신된다.
- 텍스처 폴더: `textures/` (2개 이미지)
  - `partition.jpg` — `Material #25192003` material의 baseColorTexture (파티션 프레임/베이스 텍스처)
  - `glass_A.png` — `Material #25192004` material의 baseColorTexture (유리 패널 텍스처)
  - 텍스처 파일명은 mesh 이름(`partition`·`glass_A`)과 일치하여 1:1 대응이 명확
- 구독 데이터 예: `[{ meshName: 'Group003', status }]` — **단일 meshName(부모 Group 이름)으로 자식 2개 Mesh 일괄 제어**. PTT의 `[{meshName:'PTT_033', status}]`와 동일 패턴이며, Earthquake의 `[{meshName:'Earthquake',...}, {meshName:'Earthquake_A',...}]` 배열 방식과 대비된다.
