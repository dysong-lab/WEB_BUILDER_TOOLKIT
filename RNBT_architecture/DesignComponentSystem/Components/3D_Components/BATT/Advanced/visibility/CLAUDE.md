# BATT — Advanced/visibility

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 'BATT' Mesh 색상 변경
2. **랙 외피/셀 선택 노출** — 페이지가 `meshVisibility.show/hide/toggle('BATT')`를 직접 호출하여 배터리 랙 자체의 노출 여부를 토글
   - 시스템 레벨 필터링(예: "BATT만 표시", "BATT 숨기기")
   - 정비 모드 / X-ray 뷰에서 다른 장비와의 가시성 일괄 제어 시퀀스의 일부

---

## BATT mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/BATT/01_default/BATT.gltf` |
| mesh 이름 | `BATT` (단일) |
| 결정 | **단일 mesh** — 개별 단위(1 GLTF = 1 Mesh) 패턴 적용 |

근거: BATT.gltf 내부 nodes/meshes 검사 결과 사용자 mesh가 단일 `BATT` 한 개. 이는 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh)`와 일치하며 Standard/Advanced/highlight 등 기존 변형 모두 `getObjectByName('BATT')` 단일 호출 기반으로 동작 중. 따라서 본 변형도 직전 사이클의 **`Chiller/Advanced/visibility`**(개별 단위, 단일 mesh) 패턴을 그대로 따른다. 다중 mesh 컨테이너 visibility 패턴(`meshesArea/area_01/Advanced/visibility`)은 적용하지 않는다 — 외피/모듈/셀이 분리된 다중 mesh 모델이 `02_split` 같은 별도 변종으로 도입될 경우, 그때 컨테이너 패턴으로 교체하거나 별도 컴포넌트로 분기한다.

---

## 구현 명세

### Mixin

MeshStateMixin + MeshVisibilityMixin

### colorMap (MeshStateMixin)

| 상태 | 색상 |
|------|------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### MeshVisibilityMixin 옵션

없음. `instance.appendElement`(THREE.Object3D)에서 `getObjectByName('BATT')`으로 메시를 탐색한다.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

### 이벤트 (customEvents)

없음.

> 개별 단위(meshName이 확정된 1 GLTF = 1 Mesh) 컴포넌트이므로 `@meshClicked` 같은 동적 식별 이벤트가 필요 없다. 가시성 토글은 페이지가 `instance.meshVisibility.show/hide/toggle('BATT')`를 직접 호출하거나, 페이지가 자체 정의한 외부 트리거(예: 사이드 패널 체크박스, 키보드 단축키)에 응답한다.

### 커스텀 메서드

없음. 순수 Mixin 조합.

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/visibility |
|------|----------|---------------------|
| `applyMeshStateMixin` | O | O |
| `applyMeshVisibilityMixin` | X | O (추가) |
| `this.meshVisibility` 네임스페이스 | 없음 | `show/hide/toggle/showAll/hideAll/isVisible` 노출 |
| beforeDestroy | meshState만 정리 | meshVisibility(역순) → meshState 정리 |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/visibility는 추가로 `object.visible` 채널을 페이지에 노출하여, 동일 컴포넌트가 시스템 레벨 가시성 시퀀스(필터링·정비 모드·X-ray 뷰)에 참여할 수 있게 한다. register.js에 Mixin 적용 / 정리가 추가되므로 별도 폴더로 분리한다.

---

## Mixin 공존

| Mixin | 채널 | 용도 |
|-------|------|------|
| MeshStateMixin | `material.color` | 데이터 상태 표현 |
| MeshVisibilityMixin | `object.visible` | 가시성 제어 |

상태 색상은 `material`에 보존되므로 메시가 일시적으로 숨겨졌다가 다시 보여도 색상이 그대로 복원된다.

---

## 미래 시나리오 메모

페이지에서 외부 트리거(예: 패널 체크박스 또는 키보드 단축키)가 자주 반복되어 동일 토글 로직이 N개 컴포넌트에 복제되면, 그때 ADVANCED_QUEUE.md의 "커스텀 메서드 vs 신규 Mixin 판단 규칙"에 따라 외부 토글 이벤트 ↔ visibility 토글을 묶는 어댑터(커스텀 메서드 또는 새 Mixin)를 검토한다. 또한 BATT가 향후 다중 mesh 모델(랙 외피 + 셀 분리)로 확장되면 컨테이너 visibility 패턴(`meshesArea/area_01/Advanced/visibility`) 또는 `showOnly([...])` API 활용으로 전환을 검토한다. 본 변형은 그 단계 이전, 순수 Mixin 노출만으로 끝낸다.
