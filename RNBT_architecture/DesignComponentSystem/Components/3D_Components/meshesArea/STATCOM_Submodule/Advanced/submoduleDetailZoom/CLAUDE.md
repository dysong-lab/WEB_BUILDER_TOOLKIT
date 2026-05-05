# STATCOM_Submodule — Advanced/submoduleDetailZoom

## 기능 정의

1. **상태 색상 표시** — equipmentStatus 토픽 (Standard 승계) — `material.color` 채널
2. **부품(Submodule) 카메라 확대** — 외부 명령형 `zoomToPart(meshName, options?)` — CameraFocusMixin 위임 (`focusOn({ container, meshName, offset })`). meshName은 컨테이너 동적 식별 (`getPartNames()` 또는 `resolveMeshName(event)`)
3. **선택 부품 외피 자동 숨김** — zoom 활성 시 사전 등록된 외피/cover mesh 목록을 MeshVisibilityMixin으로 일괄 hide → `zoomOut()` 시 복원 (단일 mesh hide 진입 직후 다른 부품을 보러 갈 때도 동일 hide 유지)
4. **부품별 3D 온도/수명 라벨** — 부품 mesh 옆에 `THREE.Sprite + CanvasTexture` 라벨을 동적 생성. `setPartData(meshName, { temperature, lifespan })` / `setPartsData({...})`로 외부 데이터 갱신. 라벨은 zoom 활성 부품에만 표시(또는 전체 토글 가능). RAF로 라벨 위치 sync — `mesh.getWorldPosition()` 기반.
5. **외부 명령형 API** — 페이지가 `instance.submoduleDetailZoom.zoomToPart/zoomOut/setPartData/setPartsData/getPartNames/setHiddenParts/start/stop/destroy` 직접 호출

---

## STATCOM_Submodule mesh 구조

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/meshesArea/STATCOM_Submodule/01_default/STATCOM_Submodule.gltf` |
| 컨테이너 mesh | `STATCOM_SubModule_00` ~ `STATCOM_SubModule_36` (37개 부품 mesh, 폴더명 `STATCOM_Submodule`과 달리 mesh 측은 `SubModule` 대문자 M) |
| 동적 식별 | `getPartNames()` = `appendElement.traverse(child => child.isMesh && child.name)` 결과 |
| 외피 mesh | 페이지 측이 `setHiddenParts([...])`로 등록 — 컨테이너 mesh 이름 규약 의존 (예: 케이스 부품 식별자) |

근거: 컴포넌트 루트 CLAUDE.md `STATCOM_SubModule_{n}` 식별자, Standard register.js / Advanced/animation 모두 동적 mesh 색상 패턴(클릭 식별자 미고정) 사용. 본 변형은 동일한 동적 식별 방식을 답습한다.

---

## 큐 정의 vs 실제 구현 — Mixin 조합 + 라벨 sprite 추가

**큐 설명**: "서브모듈 부품 확대 + 부품별 온도/수명 라벨 (CameraFocus+MeshVisibility+커스텀 메서드)"

**실제 채택**: **MeshState + CameraFocus + MeshVisibility + 커스텀 `this.submoduleDetailZoom`** (Sprite/CanvasTexture 라벨은 커스텀 메서드 내부 자체 자원)

### 결정 근거

1. **컨테이너 + 동적 식별** — STATCOM_Submodule은 1 GLTF = N mesh 컨테이너 패턴. 부품 식별자(`STATCOM_SubModule_00`~`_36`)는 페이지가 사전에 알지만 본 변형은 컨테이너 표준대로 `getPartNames()`로 동적 노출 — 변종 모델 전환에도 register.js 무수정.
2. **CameraFocus + MeshVisibility 조합 (#16/#52 답습)** — `meshesArea/area_01/Advanced/camera_highlight` 컨테이너 표준 (CameraFocus+MeshHighlight) 패턴에서 MeshHighlight만 MeshVisibility로 교체. zoom 시 외피 mesh를 일시 hide하여 부품 가시성을 확보하는 X-ray 패턴 (MeshVisibility 본연 용도). zoomOut 시 `showAll()`로 일괄 복원 — 페이지가 `setHiddenParts([...])`로 외피 목록을 사전 주입한 경우만 작동.
3. **라벨 sprite — Sprite/CanvasTexture (#21 GasDetector/sensorHud + #24~#26 sensorDataHud 답습)** — 3D 공간 카메라 추종 라벨은 `THREE.Sprite + CanvasTexture` 패턴이 본 저장소에서 5번 이상 채택된 표준. DOM HUD overlay(#41/#42/#52)는 페이지 외부 자원 주입을 요구하나, sprite는 컴포넌트가 자체 자원을 만들고 dispose하므로 라이프사이클이 자기완결. 부품별로 mesh 옆에 항상 따라가는 라벨이 본 변형 요구사항이라 sprite가 적합.
4. **단일 통합 네임스페이스 `this.submoduleDetailZoom`** — 카메라 채널(zoom) + 가시성 채널(외피 hide) + 라벨 채널(sprite)의 세 채널이 단일 도메인(부품 상세 보기)에 종속 — #41/#42/#52 단일 네임스페이스 정책 답습.
5. **자동 데모 정책** — preview는 `getPartNames()` 첫 부품에 자동 `zoomToPart` → 2초 후 두 번째 부품 → 4초 후 `zoomOut` 순환으로 즉시 시각 관찰 보장. mount 시점에는 `zoomToPart` 자동 호출 없음(부품 식별자 사전 미정 — 페이지/preview가 식별자 결정 후 호출).
6. **신규 Mixin 미생성 정책 준수** — 본 사이클은 신규 Mixin 금지. 라벨 sprite는 `MeshTrackingHudMixin` 승격 후보(이미 8번째 임계점 도달 — DOM 버전), sprite 버전은 별개 임계점 진행. 본 변형은 sprite 패턴 5번째 채택(#21 + #24 + #25 + #26 + #67).

### 시그니처 답습 (#52 batteryHierarchyZoom)

| 메서드 | 설명 | 비교 |
|--------|------|------|
| `zoomToPart(meshName, options?)` | CameraFocus.focusOn 위임 + MeshVisibility로 외피 hide + 라벨 활성 | #52 `goTo(level)`의 컨테이너 버전 (level → meshName) |
| `zoomOut()` | CameraFocus.reset() + MeshVisibility.showAll() + 라벨 hide | #52 `reset()` 동등 |
| `setPartData(meshName, data)` | sprite 텍스트 갱신 (해당 부품 활성 시 즉시 반영) | #52 `setLabelData(level, data)` 컨테이너 버전 |
| `setPartsData({...})` | 다중 일괄 갱신 | #52 `setLabels(map)` 동등 |
| `getPartNames()` | 동적 식별 (`appendElement.traverse`) | 컨테이너 표준 — `LEVELS` 고정 배열 대신 동적 |
| `setHiddenParts([...])` | zoom 시 자동 hide 대상 등록 (페이지 책임) | 새로운 — MeshVisibility 활용 |
| `setOffset({x,y,z})` | sprite 위치 오프셋 (월드 좌표) | #52 DOM offset의 sprite 버전 |
| `start()/stop()/isRunning()` | sprite 위치 sync RAF | #52 동일 |
| `destroy()` | 라벨 자원 dispose + Mixin restore + self-null | #52 동일 |

---

## 구현 명세

### Mixin

MeshStateMixin + CameraFocusMixin + MeshVisibilityMixin + 커스텀 메서드 `this.submoduleDetailZoom`

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

(Standard 승계)

### CameraFocus 옵션

| 옵션 | 값 |
|------|-----|
| camera | `wemb.threeElements.camera` |
| controls | `wemb.threeElements.mainControls` |
| duration | 800 |

### MeshVisibility 옵션

없음. `instance.appendElement`(THREE.Object3D) 하위 모든 named 객체를 `traverse`로 자율 탐색.

### cssSelectors

없음 — sprite/CanvasTexture는 DOM 선택자가 불필요.

### 채널 직교성 정책

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | `material.color` | 데이터 상태 색상 (Standard 승계) |
| CameraFocusMixin | `camera.position` + `controls.target` | 부품으로 카메라 트윈 |
| MeshVisibilityMixin | `object.visible` | 외피 mesh hide/showAll |
| submoduleDetailZoom (라벨) | sprite world position + CanvasTexture | 라벨 그리기 + carry-along |

네 채널 완전 직교 — 색상, 카메라, 가시성, 라벨이 서로 간섭하지 않는다.

### 커스텀 네임스페이스 `this.submoduleDetailZoom`

| 메서드 | 동작 |
|--------|------|
| `zoomToPart(meshName, options?)` | `appendElement.getObjectByName(meshName)` 조회 → CameraFocus.focusOn({ container, meshName, offset }) 위임 → 외피 자동 hide(`_hiddenParts` 등록 시) → 해당 부품 라벨 sprite 활성 |
| `zoomOut()` | CameraFocus.reset() + MeshVisibility.showAll() + 모든 라벨 sprite hide. 활성 부품 `null`. |
| `setPartData(meshName, { temperature, lifespan })` | 부품의 sprite CanvasTexture 재그리기. 활성 부품이면 즉시 표시, 아니면 데이터만 보관 |
| `setPartsData({ meshName: {temperature, lifespan} })` | 다중 부품 일괄 갱신 |
| `getPartNames()` | `appendElement.traverse`로 모든 isMesh+name인 자식 이름 배열 반환 |
| `setHiddenParts([meshName])` | zoom 시 자동 hide 대상 외피 mesh 이름 배열 등록 |
| `setOffset({ x, y, z })` | sprite 위치 오프셋 (월드 단위 — mesh boundingBox 중심에 더해짐) |
| `setActivePartLabelOnly(bool)` | true면 활성 부품 라벨만 표시(기본), false면 setPartData 호출된 모든 부품 라벨 표시 |
| `getActivePart()` | 현재 zoom 활성 부품 mesh 이름 반환 (`null`이면 zoomOut 상태) |
| `start()` | sprite 위치 sync RAF 시작 (이미 시작되어 있으면 no-op) |
| `stop()` | sprite 위치 sync RAF 정지 |
| `isRunning()` | RAF 활성 여부 |
| `enable()` / `disable()` / `isEnabled()` | 동적 활성 토글 |
| `destroy()` | RAF cancel + 모든 sprite/CanvasTexture/Material/Geometry dispose + parent.remove + MeshVisibility.showAll() + CameraFocus.reset() + self-null `this.submoduleDetailZoom = null` |

### 라벨 sprite 자원 정책

각 부품별 sprite 자원:

```
sprite        = THREE.Sprite(spriteMaterial)
spriteMaterial = THREE.SpriteMaterial({ map: canvasTexture, transparent: true, depthTest: false })
canvasTexture = THREE.CanvasTexture(offscreenCanvas)
canvas        = document.createElement('canvas') (256 × 128)
```

dispose 순서 (destroy 시):

```
1. parent.remove(sprite)               (scene에서 제거)
2. sprite.material.map.dispose()       (CanvasTexture)
3. sprite.material.dispose()           (SpriteMaterial)
4. (Sprite는 내부적으로 plane geometry를 공유 — 별도 dispose 불필요)
```

라벨 카드 텍스트 포맷:

```
┌────────────────┐
│ partName       │  ← 위 12px bold
│ 28.4 ℃         │  ← 가운데 18px (temperature)
│ Life: 87%      │  ← 아래 12px (lifespan)
└────────────────┘
```

상태별 배경색은 `temperature` 임계값으로 결정:
- temperature < 50 → `rgba(15,15,30,0.92)` (정상)
- 50 ≤ temperature < 75 → `rgba(120,80,0,0.92)` (주의)
- temperature ≥ 75 → `rgba(180,40,40,0.92)` (경고)

### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| 외피 hidden parts | `[]` | 페이지 측 등록 |
| sprite offset | `{ x: 0, y: 0.06, z: 0 }` | 부품 위쪽으로 띄움 (월드 단위) |
| sprite scale | `{ x: 0.06, y: 0.03 }` | mesh 크기 비례 |
| activePartLabelOnly | true | 활성 부품 라벨만 표시 |
| autoStart on mount | true | RAF는 항상 idle 상태로 시작(라벨이 있어야 실제 sync) |
| 자동 데모 (preview) | parts[0] zoom → 2s parts[1] zoom → 4s zoomOut 순환 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계) |

부품 zoom 트리거는 별도 토픽 없이 페이지가 외부 명령형으로 `zoomToPart` 직접 호출.

### 이벤트 (customEvents)

```javascript
this.customEvents = { click: '@meshClicked' };
```

페이지 측은 `@meshClicked` 핸들러에서 `instance.resolveMeshName(event)`로 부품 식별 후 `zoomToPart(meshName)` 호출. (선택적 — preview에서는 버튼 컨트롤로 시뮬레이션)

### 커스텀 메서드 `resolveMeshName`

```javascript
this.resolveMeshName = (event) => {
    if (!event.intersects || !event.intersects.length) return null;
    let current = event.intersects[0].object;
    while (current) {
        if (current.name) return current.name;
        current = current.parent;
    }
    return null;
};
```

### 라이프사이클

- `register.js`: Mixin 적용(MeshState → CameraFocus → MeshVisibility) + `this.submoduleDetailZoom` API 등록 + `bind3DEvents` 클릭 매핑 + (parent/THREE 가용 시) RAF 자동 시작 — 라벨이 있어야 sync 동작
- 페이지가 `setHiddenParts` 등록 + `setPartsData` 데이터 시드 + `zoomToPart(meshName)` 호출
- `beforeDestroy.js`: 이벤트 제거 → 구독 해제 → `this.submoduleDetailZoom?.destroy()` (라벨 dispose + RAF cancel + Mixin restore 위임) → `this.meshVisibility?.destroy()` → `this.cameraFocus?.destroy()` → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/submoduleDetailZoom |
|------|----------|-----------------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `applyCameraFocusMixin` | ✗ | ✓ (추가) |
| `applyMeshVisibilityMixin` | ✗ | ✓ (추가) |
| `this.submoduleDetailZoom` 네임스페이스 | 없음 | `zoomToPart/zoomOut/setPartData/setPartsData/getPartNames/setHiddenParts/setOffset/setActivePartLabelOnly/getActivePart/start/stop/isRunning/enable/disable/isEnabled/destroy` |
| 자체 sprite 라벨 자원 (CanvasTexture × N) | 없음 | 있음 (활성 부품에 따라 동적 생성/표시) |
| RAF 매 프레임 sprite carry-along | 없음 | 있음 |
| `customEvents` `@meshClicked` | 없음 | 있음 (선택적) |
| beforeDestroy | meshState만 정리 | submoduleDetailZoom(sprite/RAF 정리) → meshVisibility → cameraFocus → meshState 역순 + customEvents 제거 |

Standard는 mesh 색상 채널만 데이터에 결합. Advanced/submoduleDetailZoom은 추가로 (a) 카메라 채널, (b) 가시성 채널, (c) sprite 라벨 채널, (d) 외부 명령형 API 4채널 노출.

---

## 가까운 선행 사례 비교

| 항목 | #52 LithiumionBattery/batteryHierarchyZoom | #21 GasDetector/sensorHud | 본 #67 |
|------|--------------------------------------------|----------------------------|---------|
| 컴포넌트 유형 | 개별 (단일 mesh) | 개별 (단일 mesh) | 컨테이너 (다수 mesh) |
| 카메라 진입 단위 | 거리 단계 (rack/module/cell) | 없음 | 부품 mesh 단위 |
| Mixin 조합 | MeshState+CameraFocus+MeshVisibility+FieldRender | MeshState+커스텀 | MeshState+CameraFocus+MeshVisibility+커스텀 |
| 라벨 종류 | DOM 카드 (`_hudRoot` 외부 주입) | sprite/CanvasTexture (자체) | **sprite/CanvasTexture (자체)** |
| RAF 주체 | DOM transform (페이지 자원) | sprite world position | **sprite world position** |
| 외피 hide | 단일 mesh 한계로 등록만 | 없음 | **컨테이너 — 페이지 등록 + 활성 hide** |
| 이벤트 | 없음 | 없음 | **`@meshClicked` (선택)** |
| 자동 진입 | mount 시 `goTo('rack')` | mount 시 자동 sync 시작 | **mount 시 RAF idle 시작** (zoom은 페이지/preview가 트리거) |
| 통합 네임스페이스 | `this.batteryHierarchyZoom` | `this.sensorHud` | **`this.submoduleDetailZoom`** |

본 변형은 (a) #52 카메라 채널 시그니처(zoom/zoomOut/get*) + (b) #21~#26 sprite 라벨 자원 관리 + (c) `meshesArea/area_01/Advanced/camera_highlight` 컨테이너 동적 식별 표준 — 세 사례를 결합.

---

## Mixin 승격 검토 메모 (필수)

> **HierarchyZoomMixin / LevelZoomMixin (#52에서 임계점 도달)** — #16/#52는 **개별 단위 + 거리 단계 진입** 패턴. 본 변형은 **컨테이너 + 부품 mesh 진입** 패턴으로 시그니처가 유사하지만 진입 단위가 LEVELS 배열(고정) → meshName(동적)으로 다름. **본 변형은 별개 임계점**(컨테이너 변종)으로 카운트. 동일 컨테이너+부품 진입 패턴이 다음 채택될 경우 `PartDetailZoomMixin` 신규 후보. 본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지.

> **MeshTrackingSpriteLabelMixin (가칭) — sprite 라벨 임계점 5번째 도달**: #21 GasDetector/sensorHud + #24 tempHumiTH2B/sensorDataHud + #25 thermohygrostat/sensorDataHud + #26 MonnitTemperature_sensor/sensorDataHud + 본 변형(#67 sprite 라벨 부분) = 5번째 채택. setData/setOffset/setScale/start/stop/destroy + Sprite/CanvasTexture/SpriteMaterial 자원 관리 패턴이 5개 컴포넌트에서 동일. 본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나 사용자가 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출로 두 Mixin 승격 검토 권장.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js — 부품 식별자 사전 등록 + 데이터 시드
this.submoduleInstance = wemb.getDesignComponent('STATCOM_Submodule');

// 외피 부품 등록 (zoom 시 자동 hide)
this.submoduleInstance.submoduleDetailZoom.setHiddenParts([
    'STATCOM_SubModule_Cover_Front',
    'STATCOM_SubModule_Cover_Back'
]);

// 부품별 데이터 시드
this.submoduleInstance.submoduleDetailZoom.setPartsData({
    STATCOM_SubModule_00: { temperature: 28.4, lifespan: 92 },
    STATCOM_SubModule_01: { temperature: 31.2, lifespan: 88 },
    // ...
});

// SCADA 데이터로 갱신
const onPartTelemetry = ({ response: data }) => {
    data.parts.forEach(({ meshName, temperature, lifespan }) => {
        this.submoduleInstance.submoduleDetailZoom.setPartData(meshName, { temperature, lifespan });
    });
};

// before_load.js — 클릭 핸들러
this.pageEventBusHandlers = {
    '@meshClicked': ({ targetInstance, event }) => {
        const meshName = targetInstance.resolveMeshName(event);
        if (!meshName) return;
        targetInstance.submoduleDetailZoom.zoomToPart(meshName);
    },
    '@zoomOutClicked': ({ targetInstance }) => {
        targetInstance.submoduleDetailZoom.zoomOut();
    }
};
onEventBusHandlers(this.pageEventBusHandlers);
```

---

## 모델 주의사항

- mesh 이름 식별자는 `STATCOM_SubModule_{n}`(`SubModule` 대문자 M, 폴더명 `STATCOM_Submodule`과 다름) — 페이지 데이터의 `meshName` 키, `setHiddenParts` 인자 모두 동일 케이스 유지.
- `getObjectByName`은 대소문자 구분.
- 모델 변종 도입 시 mesh 이름 규약 유지 — register.js 무수정 가능.
- **[MODEL_READY] placeholder 사용 안 함** — Standard·animation 변형이 완료된 모델로 식별자 검증 완료. 동적 식별이라 사전 식별자 미고정.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level, IIFE 없음 (#52 답습) |
| 2 | self-null `this.submoduleDetailZoom = null` + RAF cancel + sprite dispose | OK — destroy 마지막 줄 self-null + cancelAnimationFrame + 모든 sprite map.dispose/material.dispose/parent.remove |
| 3 | beforeDestroy.js는 호출만 | OK — `removeCustomEvents` + `unsubscribe go` + `this.submoduleDetailZoom?.destroy(); this.meshVisibility?.destroy(); this.cameraFocus?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachSubmoduleDetailZoom(inst)` 내부 destroy도 RAF cancel + sprite dispose + `inst.submoduleDetailZoom = null` 포함 |
| 5 | 시그니처 일관 — 선행 사례 + 가이드 답습 | OK — 카메라(`zoomToPart/zoomOut/getActivePart/getPartNames`) #52/#41/#42 답습, 라벨(`setPartData/setPartsData/setOffset/start/stop/isRunning`) #21/#24~#26 답습 |
| 6 | UI ↔ API 인자 축 일치 | OK — preview 부품 select↔`zoomToPart(meshName)`, zoomOut↔`zoomOut()`, temperature/lifespan 슬라이더↔`setPartData({temperature, lifespan})`, setHiddenParts 입력↔`setHiddenParts([...])` |
| 7 | 기본값 시각 관찰 | OK — preview 로드 후 자동 데모: parts[0] zoom (0s) → parts[1] zoom (2s) → zoomOut (4s) 순환으로 카메라 진입 + 라벨 sprite 갱신 즉시 관찰. 라벨은 `setPartsData` 시드 + 활성 부품 자동 표시 |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 |

**모든 항목 통과.** 컨테이너 동적 식별 + 카메라/가시성/sprite 세 채널 결합이 8항목 어느 것도 깨뜨리지 않음.
