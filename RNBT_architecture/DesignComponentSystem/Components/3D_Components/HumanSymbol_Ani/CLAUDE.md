# 컴포넌트 정보

| 항목 | 값 |
|------|-----|
| 유형 | 개별 (1 GLTF = 2 Mesh: `symbol`, `circle_A`) |
| 기본 Mixin | MeshStateMixin |

## 장비 개요

HumanSymbol_Ani는 대피/인명 안전 표지의 휴먼 심볼을 표현하는 3D 컴포넌트이다. GLTF는 최상위 `root` Node(scale 1000x) 아래에 두 개의 자식 Node를 가진다: `symbol`(사람 실루엣 Mesh)과 `circle_A`(원형 배경/링 Mesh). 각 Node는 동일 이름의 단일 Mesh를 참조한다.

Standard 변형은 MeshStateMixin만 적용하여 `equipmentStatus` 데이터에 따라 두 Mesh의 색상을 일괄 변경한다. **GLTF에 애니메이션 클립(`All Animations`)이 내장되어 있지만 Standard에서는 재생하지 않는다** — 애니메이션 재생은 Advanced 변형(예: `animation`)에서 AnimationMixin 조합으로 처리한다.

> **명명 불일치 주의**: 폴더명은 `HumanSymbol_Ani`지만 GLTF 내부에는 이 이름의 Node/Mesh가 **존재하지 않는다**. 실제 Mesh는 `symbol`, `circle_A`이며, register.js는 두 이름을 직접 하드코딩한다.

> 텍스처 폴더는 `textures/`. GLTF 내부 `images[].uri`가 `symbol.jpg`, `circle_A.png`로 참조된다.

## 세트 현황

| 세트 | 상태 |
|------|------|
| Standard | 완료 |
