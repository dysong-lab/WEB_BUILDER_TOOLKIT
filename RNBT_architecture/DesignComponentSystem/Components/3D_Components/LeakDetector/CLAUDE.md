# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `LeakDetector`, 2-primitive multi-material) |
| 기본 Mixin | MeshStateMixin |
| meshName | `LeakDetector` |

## 장비 개요

LeakDetector는 누수/누유 감지 센서 장비를 표현하는 3D 컴포넌트이다. 단일 GLTF(`models/LeakDetector/01_default/LeakDetector.gltf`)의 scene은 루트 스케일 노드 `root`(scale [1000, 1000, 1000])와 그 아래 Mesh Node `LeakDetector`(mesh 0) 하나만을 가진다. Mesh는 폴더명·Node 이름·Mesh 이름이 모두 `LeakDetector`로 동일하며(폴더/Node/Mesh 이름 불일치가 관례인 LV_R의 `LV-2R1` 시리즈와 달리 **이름 일치형**), FLIREx·ExitSign·ElecPad·Earthquake 선례와 같은 "폴더명 = Node/Mesh 이름" 규약을 따른다.

GLTF 구조: `scene → root(scale [1000,1000,1000]) → "LeakDetector"(mesh 0, 2 primitives, 2 materials)`. LV_R·LV_BAT·LV_2P_02/09/10/11 계열이 단일 primitive·단일 material의 "순수 1-Node 단일 서브메시" 구조인 것과 달리, LeakDetector Mesh는 **2개의 primitive**(서브메시)로 이루어지며 각 primitive가 **서로 다른 material**을 참조한다:

- primitive 0 → material 0 (`leakEtc`): baseColorTexture `textures/leakEtc.jpg`, metallicFactor 0.0, roughnessFactor -90.47056, doubleSided=true — 센서 본체·바닥 감지부 표현
- primitive 1 → material 1 (`winBody`): baseColorTexture `textures/winBody.jpg`, metallicFactor 0.0, roughnessFactor -90.47056, doubleSided=true — 투명창·윈도우 바디 표현

이것은 Earthquake가 "2-Mesh Group"(Earthquake, Earthquake_A — 두 개의 Mesh Node)으로 구성되는 것과도 다르며, **"1-Mesh Node × 2-primitive × 2-material"** 패턴이다. MeshStateMixin은 Mesh의 `material`이 배열(multi-material mesh)인 경우를 지원하므로, `getObjectByName('LeakDetector')`로 얻은 단일 Mesh의 두 material을 clone한 뒤 일괄 색상으로 적용한다. 두 서브메시가 동시에 상태 색상으로 치환되는 것이 의도된 동작이다.

Mesh 정점: POSITION accessor count 1784 (UV·NORMAL 동일), 인덱스 총합 4542 + 7050 = 11592 (primitive 0의 indices accessor count 4542, primitive 1의 indices accessor count 7050). LV_BAT·LV_R의 정점 46/인덱스 84 규모보다 압도적으로 크다(약 39배 정점). 좌표 바운드(루트 스케일 적용 전): POSITION min [-0.000475, -0.000644, -0.000136] ~ max [0.000475, 0.000666, 0.000134] — 매우 작은 원시 크기이며, root Node의 `scale [1000, 1000, 1000]`이 적용되어 실제 장면 크기는 약 **0.95 × 1.31 × 0.27 단위**로 얇고 길쭉한 판상형이다. preview의 카메라 바운드 기반 자동 조정이 이 스케일을 수용한다.

**텍스처 폴더는 `textures/`** 이다. LV 시리즈의 `maps/` 규약과 달리, LeakDetector는 Earthquake·FLIREx·ExitSign·ElecPad 선례의 `textures/` 규약을 따른다. GLTF 내부 `images[].uri`가 `textures/leakEtc.jpg`, `textures/winBody.jpg`로 두 개의 서로 다른 텍스처를 참조하므로 두 파일 모두 `01_default/textures/` 폴더에 유지한다. 모델 폴더에는 보조 썸네일 `LeakDetector-P.png`도 존재한다 (Earthquake·FLIREx·ElecPad 선례와 동일).

**Babylon.js glTF exporter 특이점:** `roughnessFactor: -90.47056`는 PBR 스펙상 [0, 1] 범위를 벗어난 값으로, 3ds Max 2023의 Babylon.js glTF exporter가 원본 3ds Max 재질의 roughness 스칼라를 정규화하지 않고 그대로 출력한 결과이다. Three.js PBR 렌더러에서는 실질적으로 roughness=0(완전 매끈)으로 clamp되어 동작한다. MeshStateMixin은 `color` 채널만 갱신하므로 roughness 값과 무관하게 상태 색상이 올바르게 적용된다 — 이 값은 기존 3D_Components가 공통으로 가진 ACES Filmic 톤매핑 파이프라인과 충돌하지 않는다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `LeakDetector` Mesh의 두 material(leakEtc, winBody) 색상을 일괄 변경한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
