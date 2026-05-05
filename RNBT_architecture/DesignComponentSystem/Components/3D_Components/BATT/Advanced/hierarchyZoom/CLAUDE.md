# BATT — Advanced/hierarchyZoom

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽으로 수신한 데이터에 따라 'BATT' Mesh 색상 변경 (Standard 승계, `material.color` 채널)
2. **계층 레벨 카메라 줌** — 'rack' / 'module' / 'cell' 3단계 시각적 계층을 카메라 거리(boundingBox 기반 비율)로 시뮬레이션 — `goTo(level)`로 한 번에 진입, `next()/prev()`로 인접 레벨로 이동
3. **외피/모듈 가시성 토글 (확장 대비)** — MeshVisibility를 등록만 해두어 페이지가 `instance.meshVisibility.show/hide/toggle/showOnly`를 직접 호출 가능. 향후 모듈/셀 mesh가 분리된 모델 변종이 도입되면 계층 단계마다 자동 외피 hide/모듈 show 시퀀스 연동
4. **외부 명령형 API** — 페이지가 `instance.hierarchyZoom.goTo/next/prev/reset/getLevel/getLevels` 직접 호출 (BMS UI의 "랙→모듈→셀 진입" 네비게이션 트리거)

---

## BATT mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/BATT/01_default/BATT.gltf` |
| mesh 이름 | `BATT` (단일) |
| 결정 | **단일 mesh** — 개별 단위(1 GLTF = 1 Mesh) 패턴 적용 |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh)`와 일치. 직전 사이클(chargeFlowArrow)에서 단일 mesh 'BATT'만 존재함을 재확인. 모듈/셀이 별도 mesh로 분리되어 있지 않다.

---

## 큐 정의 vs 실제 구현 — 단일 mesh 한계와 Mixin 채택 결정

**큐 설명**: "랙→모듈→셀 계층 확대 (CameraFocus+MeshVisibility+커스텀 메서드)"

**실제 채택**: **CameraFocus 적용** + **MeshVisibility 적용(노출만)** + 커스텀 메서드 `this.hierarchyZoom` 등록

### 결정 근거

1. **단일 mesh 한계 — 모듈/셀이 별도 mesh로 분리되어 있지 않다.** 따라서 "계층 확대"의 본격 동작은 카메라 거리 단계 진입(rack=원거리, module=중거리, cell=근거리)으로 시뮬레이션한다. MeshVisibility는 단일 mesh에서는 외피 toggle 정도가 한계. 계층 단계와 연동된 자동 hide/show 시퀀스는 의미가 없다(끄면 화면 자체가 빈다).
2. **MeshVisibility를 그래도 등록하는 이유** — (a) 큐 명시 Mixin 조합 충실 이행, (b) 페이지가 외부 트리거로 BATT 자체를 토글할 수 있는 채널을 유지(`Advanced/visibility`와 동일 채널, 단 본 변형은 거기에 hierarchyZoom 카메라 줌이 추가). 채널 충돌 없음 (object.visible vs camera.position).
3. **커스텀 메서드 `this.hierarchyZoom`** — 레벨별 거리 비율, 인접 레벨 이동, 현재 레벨 추적 등은 CameraFocus의 단일 focus/reset API만으로는 표현이 부족하므로 커스텀 메서드로 묶는다. `dynamicRpm/chargeFlowArrow/dataHud`의 동사 시그니처 패턴(`goTo/next/prev/reset/getLevel/getLevels/destroy`)을 답습.

### 큐 의도와의 정합

큐 설명은 "계층 단계마다 카메라 진입 + 외피/모듈 가시성 토글"이 모두 가능한 시나리오를 우선 검토하라는 가이드였다. 실제 모델이 단일 mesh이므로 가시성 토글은 부분적으로만 의미가 있고, 카메라 줌이 핵심 동작이 된다. 큐의 Mixin 명시는 "1차 후보"이지 "강제"가 아니다.

### 확장 시나리오 (모듈/셀 mesh 분리 모델 도입 시)

향후 BATT 모델이 다중 mesh(예: `BATT_rack` / `BATT_module_*` / `BATT_cell_*`)로 분리되면, `hierarchyZoom.goTo(level)`이 카메라 진입과 동시에 다음을 수행하도록 확장:

```
goTo('rack')   → cameraFocus.focusOn({ meshName: 'BATT_rack' }) + meshVisibility.showOnly(['BATT_rack'])
goTo('module') → cameraFocus.focusOn({ meshName: 'BATT_module_*' }) + meshVisibility.showOnly(['BATT_module_*'])  // 외피 hide, 모듈 show
goTo('cell')   → cameraFocus.focusOn({ meshName: 'BATT_cell_*' }) + meshVisibility.showOnly(['BATT_cell_*'])      // 모듈 hide, 셀 show
```

이때 본 변형의 시그니처(`this.hierarchyZoom.goTo/next/prev/reset`)와 MeshVisibility 등록은 그대로 유지되고, 내부 구현만 `showOnly` 호출이 추가된다 — API 호환성 보존. 모델 분리 시점은 별도 sprint(예: `BATT/02_split` 모델 변종 도입 시).

### Mixin 승격 후보 메모

본 변형의 "장비 mesh의 시각적 계층(Rack/Module/Cell 또는 동급 단위)을 카메라 줌과 가시성 토글로 진입" 패턴은 **다수 컴포넌트(LithiumionBattery/batteryHierarchyZoom #52, STATCOM_Submodule/submoduleDetailZoom #67 등)에서 거의 동일 기법으로 재사용** 가능성이 높다. ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙" 1차 — "단일 컴포넌트 전용 → 커스텀 메서드"에 따라 본 사이클은 커스텀 메서드로 완결. 2번째 컴포넌트(예: LithiumionBattery batteryHierarchyZoom) 등록 시점에 신규 Mixin 후보 검토:

- **신규 Mixin 후보 이름**: `HierarchyZoomMixin`(가칭) 또는 `LevelZoomMixin`(가칭)
- **API 호환성**: 현 시그니처(`goTo/next/prev/reset/getLevel/getLevels/destroy`)를 그대로 수용 가능
- **옵션화 후보**: `levels` 배열(이름·거리비율), `defaultLevel`, `initialLevel`(자동 진입 여부), `useVisibility`(모듈/셀 mesh 분리 모델일 때만 자동 showOnly 시퀀스 활성)
- **CameraFocus 위임**: 거리 매핑/트윈은 `cameraFocus.focusOnPosition` 위임 — Mixin은 레벨↔거리·인접 인덱스 관리만

---

## 구현 명세

### Mixin

MeshStateMixin + CameraFocusMixin + MeshVisibilityMixin + 커스텀 메서드 `this.hierarchyZoom`

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### CameraFocus 옵션

| 옵션 | 값 |
|------|-----|
| camera | `wemb.threeElements.camera` |
| controls | `wemb.threeElements.mainControls` |
| duration | 1000 |

### MeshVisibility 옵션

없음. `instance.appendElement`(THREE.Object3D)에서 `getObjectByName('BATT')` 등으로 메시를 탐색.

### 커스텀 네임스페이스 `this.hierarchyZoom`

| 메서드 | 동작 |
|--------|------|
| `goTo(level)` | `'rack'` / `'module'` / `'cell'` 중 하나로 카메라 진입. 내부에서 BATT mesh boundingBox로 maxDim 산출 → 레벨별 distanceRatio 적용 → `cameraFocus.focusOnPosition({ position, target })` 위임. 현재 레벨 갱신 |
| `next()` | 인접 다음 레벨로 이동(rack→module→cell, cell에서는 cell 유지). 내부에서 `goTo` 호출 |
| `prev()` | 인접 이전 레벨로 이동(cell→module→rack, rack에서는 rack 유지). 내부에서 `goTo` 호출 |
| `reset()` | 초기 카메라 위치로 복귀. `cameraFocus.reset()` 위임 + 현재 레벨을 `null`로 |
| `getLevel()` | 현재 레벨 반환 (`'rack'` / `'module'` / `'cell'` / `null`) |
| `getLevels()` | `['rack', 'module', 'cell']` 배열 반환 |
| `destroy()` | 진행 중 트윈은 CameraFocus가 관리(별도 RAF 없음) → 마지막 줄 `this.hierarchyZoom = null` (self-null) |

### 레벨 거리 매핑

`maxDim`을 BATT mesh boundingBox의 `max(size.x, size.y, size.z)`로 산출하고, 각 레벨마다 거리 비율을 곱한다:

| 레벨 | distanceRatio | 카메라 거리 |
|------|--------------|-----------|
| rack | 1.5 | maxDim × 1.5 (전체 가시) |
| module | 0.7 | maxDim × 0.7 (중간 영역) |
| cell | 0.3 | maxDim × 0.3 (근접) |

> 비율은 단일 mesh 한계 안에서 단계적 차등이 시각적으로 명확히 관찰 가능하도록 선정. 모듈/셀 mesh 분리 모델 도입 시 비율은 그대로 두고 `cameraFocus.focusOn({ meshName })`으로 boundingBox 기준이 자동 갱신된다.

### 카메라 위치 산정

```
center      = box.getCenter(BATT mesh)
maxDim      = max(size.x, size.y, size.z)
distance    = maxDim * distanceRatio[level]
cameraPos   = (center.x + distance, center.y + distance * 0.7, center.z + distance)
target      = center
cameraFocus.focusOnPosition({ position: cameraPos, target })
```

높이 비율(0.7)은 모델을 약간 위에서 내려다보는 isometric 느낌을 유지하기 위함. CameraFocusMixin이 동일한 트윈/easing(`easeInOutCubic`)을 위임받아 처리.

### 옵션 기본값

| 옵션 | 기본값 |
|------|--------|
| 초기 레벨 | `'rack'` (mount 후 첫 화면이 전체 가시) |
| autoEnter on mount | true (parent/THREE 가용 시 즉시 `goTo('rack')` 호출 — Phase 1.5 항목 #7 "기본값 시각적 관찰 가능성" 우선) |

> mount 직후 자동 `goTo('rack')`로 사용자가 BATT를 보는 초기 시점이 결정된다. 페이지가 다른 초기 레벨을 원하면 `this.hierarchyZoom.goTo('module' | 'cell')` 또는 `reset()` 호출. `chargeFlowArrow`와 동일한 자동 진입 정책.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

레벨 전환은 별도 토픽 없이 페이지가 외부 명령형으로 `goTo/next/prev/reset` 직접 호출. BMS UI의 네비게이션 트리거(예: "Rack/Module/Cell" 탭, 키보드 단축키)에서 호출.

### 이벤트 (customEvents)

없음. 개별 단위(meshName='BATT' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: Mixin 적용(MeshState → CameraFocus → MeshVisibility) + `this.hierarchyZoom` API 등록 + (parent/THREE 가용 시) 자동 `goTo('rack')`
- 페이지가 `goTo/next/prev/reset` 호출
- `beforeDestroy.js`: 구독 해제 → `this.hierarchyZoom?.destroy()` → `this.meshVisibility?.destroy()` → `this.cameraFocus?.destroy()` → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/hierarchyZoom |
|------|----------|------------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `applyCameraFocusMixin` | ✗ | ✓ (추가) |
| `applyMeshVisibilityMixin` | ✗ | ✓ (추가) |
| `this.hierarchyZoom` 네임스페이스 | 없음 | `goTo/next/prev/reset/getLevel/getLevels/destroy` 노출 |
| 자동 mount 동작 | 없음 | 자동 `goTo('rack')` (시각 관찰 우선) |
| beforeDestroy | meshState만 정리 | hierarchyZoom → meshVisibility → cameraFocus → meshState 역순 정리 |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/hierarchyZoom은 추가로 (a) 카메라 트윈 채널, (b) 가시성 토글 채널(향후 분리 모델 대비), (c) 레벨 네비게이션 외부 명령형 API — 세 채널을 페이지에 노출한다. register.js에 Mixin 3개 적용 + 커스텀 메서드 + 자동 진입 라이프사이클이 추가되므로 별도 폴더로 분리한다.

---

## 다른 BATT Advanced 변형과의 관계

| 변형 | 채널 | 표현 |
|------|------|------|
| camera | 카메라 (focusOn) | 클릭 시 mesh 포커스 |
| visibility | `object.visible` | 메시 전체 on/off |
| clipping | `material.clippingPlanes` | 평면 기준 부분 절단 |
| highlight | `material.emissive` (정적 강도) | 선택 강조 |
| dataHud | DOM 오버레이 + 좌표 RAF | 수치 HUD 카드 |
| alarmPulse | `material.emissive` (시간 변조) | 알람 발광 펄스 |
| chargeFlowArrow | 별도 자체 생성 mesh + 위치 RAF | 충/방전 방향 화살표 흐름 |
| **hierarchyZoom** | **카메라 위치/거리 (focusOnPosition)** + **가시성 채널 노출** | **rack/module/cell 3단계 줌 진입** |

hierarchyZoom은 `Advanced/camera`와 채널이 부분 겹친다(둘 다 카메라 채널). 그러나 camera는 "클릭된 mesh로 focus"하는 단일 동작이고, hierarchyZoom은 "사전 정의된 3개 레벨 사이를 명령형으로 이동"하는 패턴이라 의미·API·UX가 다르다. 별도 변형으로 둔다.

material 채널은 건드리지 않으므로 highlight/alarmPulse/dataHud와도 직교 — 동일 BATT에 hierarchyZoom + alarmPulse 동시 적용 변형도 향후 가능.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.battInstance = wemb.getDesignComponent('BATT');

// BMS UI 탭 클릭 핸들러
const handleHierarchyTab = (level) => {
    this.battInstance.hierarchyZoom.goTo(level);   // 'rack' | 'module' | 'cell'
};

// 키보드 단축키
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') this.battInstance.hierarchyZoom.next();
    if (e.key === 'ArrowLeft')  this.battInstance.hierarchyZoom.prev();
    if (e.key === 'Escape')     this.battInstance.hierarchyZoom.reset();
});
```

---

## 모델 주의사항

- `models/BATT/01_default/BATT.gltf`의 단일 메시 이름은 `'BATT'`로 확정. hierarchyZoom는 `getObjectByName('BATT')`로 boundingBox 산출.
- 카메라 거리는 maxDim 비례로 결정되므로 모델 크기가 바뀌어도 시각 비율 유지.
- 모듈/셀 mesh 분리 모델(`02_split` 등) 도입 시 register.js 수정 없이 (a) `goTo` 내부의 mesh name 식별자만 확장, (b) `meshVisibility.showOnly([...])` 추가하여 자동 외피 hide/모듈 show 시퀀스 활성. API 시그니처는 그대로.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level만, IIFE 없음 |
| 2 | self-null `this.hierarchyZoom = null` | OK — destroy 마지막 줄 |
| 3 | beforeDestroy.js는 호출만 | OK — `this.hierarchyZoom?.destroy(); this.meshVisibility?.destroy(); this.cameraFocus?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachHierarchyZoom(inst)` 내부 destroy도 `inst.hierarchyZoom = null` 포함 |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `goTo/next/prev/reset/getLevel/getLevels/destroy` (chargeFlowArrow/dataHud/dynamicRpm 동사 패턴 답습, 명사형 `getLevel/getLevels`는 cameraFocus의 `reset`과 동일하게 의미 명확성 우선) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview Rack/Module/Cell 버튼↔`goTo('rack'/'module'/'cell')` 1:1, Reset 버튼↔`reset()`, Prev/Next 화살표↔`prev()/next()` |
| 7 | 기본값 시각적 관찰 가능성 | OK — preview 로드 직후 자동 `goTo('rack')`로 첫 카메라 위치가 결정되어 즉시 관찰 가능 |
| 8 | manifest + BATT/CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

---

## 발견한 문제 / Mixin 승격 후보

- **단일 mesh 한계**: BATT 모델이 단일 'BATT' mesh이므로 MeshVisibility의 `showOnly([...])` 시퀀스는 의미가 없다. 현 변형은 카메라 줌만으로 계층 단계를 시뮬레이션. 모듈/셀 mesh 분리 모델 도입 시 자동 시퀀스 활성 — 위 "확장 시나리오" 섹션 참조.
- **CameraFocus 거리 매핑 방식**: maxDim 비례(rack=1.5, module=0.7, cell=0.3)로 시각 차등 명확. 향후 옵션화 후보.
- **MeshVisibility 결합 정도**: 등록만 (자동 시퀀스 없음) — 페이지가 `instance.meshVisibility.show/hide/toggle('BATT')` 직접 호출 가능. `Advanced/visibility`와 동일 채널.
- **Mixin 승격 후보**: `HierarchyZoomMixin`(가칭) — `LithiumionBattery batteryHierarchyZoom #52`, `STATCOM_Submodule submoduleDetailZoom #67`이 동일 패턴 예상. 본 사이클은 커스텀 메서드로 완결, 2번째 컴포넌트 등록 시점에 승격 검토. `levels` 옵션화·`useVisibility` 자동 시퀀스 옵션화 권장.
