# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 1 Mesh: `Inverter`) |
| 기본 Mixin | MeshStateMixin |
| meshName | Inverter |

## 장비 개요

Inverter는 태양광/배터리/UPS 등에서 DC 전력을 AC 전력으로 변환하는 전력 변환 장치를 표현하는 3D 컴포넌트이다. GLTF는 최상위 `root` Node(scale 1000x) 아래 단일 자식 Node `Inverter`를 가지며, 이 Node가 동일 이름의 단일 Mesh(`Inverter`)를 참조한다. Mesh는 단일 primitive에 단일 material(`Inverter`)이 바인딩되어 있고 `textures/1FS100.jpg` 텍스처를 사용한다. 텍스처 폴더명은 표준인 `textures/`이며 GLTF 내부 `images[0].uri`가 이 경로를 참조하므로 리네임하지 말 것.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 `Inverter` Mesh의 material 색상을 변경한다. 폴더/컴포넌트명과 GLTF 내부 Node/Mesh 이름이 모두 `Inverter`로 일치하므로 meshName 주의 사항은 없다. register.js는 meshName을 하드코딩하지 않고, 구독 데이터가 전달한 meshName을 MeshStateMixin이 `getObjectByName`으로 해석한다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
| Advanced/powerFlowIndicator | 완료 |

> **PowerFlowIndicatorMixin 승격 후보 (#50+#51 예정)** — 본 변형(#50 Inverter)이 1차 등장. **#51 PCS/powerFlowIndicator가 본 변형 시그니처 100% 답습 예정** (시그니처 일관성 매우 중요). 2번째 채택(#51) 시점에 사용자가 `create-mixin-spec` → `implement-mixin` 호출로 `PowerFlowIndicatorMixin` 승격 검토 권장. 시그니처(`setDirection/setPowerKw/setMaxKw/setMaxArrows/setArrowAxis/setArrowSpan/setArrowSpacing/setArrowSpeed/setArrowOffset/setBaseScale/setMaxThicknessScale/setColors/setMeshName/getDirection/getPowerKw/getActiveCount/enable/disable/isEnabled/destroy`) 그대로 흡수 가능 + 충/방전(in/out/none) 도메인이 ESS/Inverter/PCS 전반에 동일.
