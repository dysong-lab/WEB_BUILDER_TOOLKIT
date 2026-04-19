# PTT — Standard

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 Group Node `PTT_033`의 자식 Mesh(`PTT_034`, `PTT_035`)의 material 색상을 일괄 변경

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

- 경로: `models/PTT/01_default/PTT.gltf`
- meshName: **`PTT_033`** — GLTF 루트 **Group Node** 이름. 이 Group은 두 자식 Mesh(`PTT_034`·`PTT_035`)를 children으로 가지며, MeshStateMixin이 `getObjectByName('PTT_033')`으로 반환받은 Group에는 `material`이 없어서 `obj.traverse(child => child.material && applyColor(child, color))` 분기로 진입해 **자식 Mesh 두 개의 material을 일괄 clone + color 치환**한다. Earthquake의 "자식 이름 배열 열거(`['Earthquake','Earthquake_A']`)" 패턴 대신, 부모 Group 이름 하나로 자식 전체를 관리하는 **Group-traverse 단일 참조** 패턴이며, PCS의 "폴더 = mesh = material 4-이름 일치 단일 Mesh" 패턴과도 구분된다.
- 구조:
  ```
  scene → PTT_033 (Group Node, rotation Y=-90°, children [1, 2])
          ├─ PTT_034 (Mesh Node, mesh 0, translation [0.035, 0, 0], material "etc11")
          └─ PTT_035 (Mesh Node, mesh 1, material "MetalNoReflecred")
  ```
- **루트 scale 보정 없음** — P300C·P2400CH와 동일한 "원본 유닛 유지" 패턴. Earthquake·OHU103·ElecPad·PCS의 `root(scale [1000, 1000, 1000])` 업스케일 케이스와 대비된다. 두 자식 mesh 바운드 합산 기준 장면 크기 약 **0.07 × 0.04 × 0.07 단위**의 초소형. preview 카메라 near/far는 P300C 선례와 유사한 "far=100, position ≈ 0.15~0.3 + 바운드 기반 자동 거리" 패턴으로 구성한다.
- 정점 속성 / 인덱스:
  - `PTT_034` — POSITION 4개·인덱스 6개 (사각형 2 삼각형, 평면 쿼드). 바운드 X=0, Y ∈ [-0.02, 0.02], Z ∈ [-0.035, 0.035] → YZ 평면 사각형, translation [0.035, 0, 0]로 X축 0.035 오프셋. TEXCOORD_0 있음 (COLOR_0 없음).
  - `PTT_035` — POSITION 44개·인덱스 78개 (박스 본체, 재사용 비율 약 1.77배). 바운드 X ∈ [-0.035, 0.035], Y ∈ [-0.02, 0.02], Z ∈ [-0.035, 0.035] → 중앙 박스. TEXCOORD_0 있음.
- 재질: **2개 PBR material** (자식별 1개씩)
  - **`etc11`** (material 0, → `PTT_034`에 적용): `baseColorTexture` `textures/PTT.jpg`(PTT 정면 텍스처), `roughnessFactor` 0.5(중간 거칠기), `doubleSided: true`(양면 렌더링 — 평면 쿼드에 필수). `baseColorFactor`·`metallicFactor`·`normalTexture`·`metallicRoughnessTexture` 없음 → **순수 텍스처 + 양면 + 중간 거칠기** 패널 셰이딩. 이름 `etc11`은 모델러 임시 명명(의미 없는 etc + 번호).
  - **`MetalNoReflecred`** (material 1, → `PTT_035`에 적용): `baseColorFactor [0.2227, 0.0415, 0.0317, 1.0]`(어두운 적갈색), `roughnessFactor` 0.3, `metallicRoughnessTexture` `textures/76MetalCladdingFrame002_REFL_2K.jpg`(2K 반사/거칠기 맵), `normalTexture` `textures/MetalCladdingFrame002_NRM_2K.jpg`(2K 노멀 맵). `baseColorTexture` 없음·`metallicFactor` 없음·`doubleSided` 미지정(암묵적 false = single-sided) → **baseColorFactor + normal/MR 맵 + 금속 외장** 셰이딩. 이름이 "NoReflecred"(reflection 없음 오타)임에도 `metallicRoughnessTexture`와 `normalTexture`가 활성이라 **명명과 실제 채널이 불일치** — 모델러 주석 수준의 명명, 런타임 동작에는 영향 없음.
- MeshStateMixin의 material 처리:
  - 두 material 모두 **단일 객체**(배열 아님)이므로 `Array.isArray(material)` 분기 미발동 → 각 자식에 대해 `material = material.clone(); material.color.setHex(color)` 직접 치환 경로.
  - **`etc11`은 baseColorTexture가 주 색상 소스**이므로 color setHex가 전체 색을 완전히 치환하지 않고 텍스처 색에 곱해진다(three.js 기본 동작 — MeshStandardMaterial.color × baseColorTexture). **`MetalNoReflecred`는 baseColorTexture가 없어서** color setHex가 baseColorFactor 역할을 대체하여 색이 더 크게 반영된다. 두 material의 시각적 색상 반영도가 다를 수 있다는 점이 **이 컴포넌트의 특이 동작**이다. Group-traverse로 두 자식에 **동일한 상태색**이 적용되지만 최종 렌더 색조는 각 material의 텍스처 여부에 따라 달라진다.
  - 원본 속성(baseColorTexture·baseColorFactor·metallicRoughnessTexture·normalTexture·roughnessFactor·doubleSided)은 clone 후에도 모두 유지되고 color 채널만 상태색으로 갱신된다.
- 텍스처 폴더: `textures/` (3개 이미지)
  - `PTT.jpg` — `etc11` material의 baseColorTexture (PTT 정면 장비 텍스처)
  - `MetalCladdingFrame002_NRM_2K.jpg` — `MetalNoReflecred` material의 normalTexture (2K 노멀 맵)
  - `76MetalCladdingFrame002_REFL_2K.jpg` — `MetalNoReflecred` material의 metallicRoughnessTexture (2K 반사/거칠기 맵)
  - 텍스처 파일명은 mesh·material 이름과 별개로 자산 원본명(장비코드 + Metal/Cladding 프로파일명)을 유지
- 구독 데이터 예: `[{ meshName: 'PTT_033', status }]` — **단일 meshName(부모 Group 이름)으로 자식 2개 Mesh 일괄 제어**. Earthquake의 `[{meshName:'Earthquake',...}, {meshName:'Earthquake_A',...}]` 배열 방식과 달리 항목 1개만 필요.
