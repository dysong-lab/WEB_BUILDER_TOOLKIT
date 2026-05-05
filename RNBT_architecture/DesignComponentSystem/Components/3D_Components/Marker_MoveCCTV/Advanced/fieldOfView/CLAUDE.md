# Marker_MoveCCTV — Advanced/fieldOfView

## 기능 정의

1. **상태 색상 표시 (Standard 승계)** — equipmentStatus 토픽으로 수신한 데이터에 따라 'MarkerMoveCCTV_A' Mesh의 단일 material(`Material #43`) 색상 변경 (`material.color` 채널). Standard와 동일한 colorMap 사용.
2. **반투명 시야각 콘 시각화 (3D 채널)** — Marker_MoveCCTV mesh 위치를 기준으로 별도의 자체 `THREE.Mesh`(`ConeGeometry`)를 scene에 attach하여 이동형 CCTV의 시야각(field of view) 영역을 반투명 원뿔로 표현
   - `ConeGeometry(radius, height, radialSegments=32, heightSegments=1, openEnded=true)` — `radius = height * tan(fovHalfAngleRad)`
   - `MeshBasicMaterial({ color, transparent:true, opacity, side:DoubleSide, depthWrite:false })`
   - geometry 단계에서 `translate(0, height/2, 0)` + `rotateX(-Math.PI/2)` 베이크 → base가 origin(카메라 위치), apex가 `-Z`(전방). mesh.rotation은 PTZ 회전 적용을 위해 identity로 보존.
3. **PTZ rotation 동기화 (#30 답습)** — 이동형 CCTV도 회전형과 마찬가지로 pan(수평)/tilt(수직)으로 시야 방향이 바뀐다. `setPan(deg)`, `setTilt(deg)`, `setRotation({pan, tilt})`로 cone mesh의 `rotation.y`(pan)와 `rotation.x`(tilt)를 직접 갱신. 트랙 회전 모드(`setTrackRotation(true)`)에서는 추적 대상 mesh의 world quaternion을 베이스로 적용하고 pan/tilt를 추가 회전으로 합성.
4. **이동 추적 RAF (#31 핵심 차이점)** — 이동형 CCTV는 마커 자체가 GLTF 애니메이션 또는 외부 위치 갱신으로 움직일 수 있다. 시야각 콘은 매 프레임 마커 위치를 따라가야 한다. `attach(mesh)` 호출로 추적 대상 mesh를 지정하면 RAF 루프가 시작되어 매 프레임 `cone.position.copy(mesh.getWorldPosition(_v3))` 적용. `detach()`로 RAF 중단 + 콘 위치 고정. RAF self-null 패턴 — destroy에서 반드시 cancel 보장.
5. **외부 명령형 API** — 페이지가 `instance.fovCone.setFov/setRange/setColor/setOpacity/setPan/setTilt/setRotation/attach/detach/setTrackRotation/isTracking/enable/disable/destroy`를 직접 호출하여 시야각/사거리/색상/투명도/회전(PTZ)/이동 추적/활성 토글 제어.

---

## Marker_MoveCCTV mesh 구조

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/Marker_MoveCCTV/01_default/Marker_MoveCCTV.gltf` |
| mesh 이름 | `MarkerMoveCCTV_A` (앞쪽 언더스코어 제거 + 뒤쪽 `_A` 접미 — 폴더명 `Marker_MoveCCTV`와 구분자 위치 + 접미 불일치) |
| 결정 | **단일 mesh** (Standard와 동일) |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh: MarkerMoveCCTV_A)`와 일치. `getObjectByName`은 이름을 그대로 비교하므로 반드시 `'MarkerMoveCCTV_A'`(언더스코어 제거 + A)로 조회. Marker_AICCTV·Marker_FixedCCTV·Marker_RotationaCCTV 등과 완전히 동일한 축의 폴더-Node 형태 불일치 패턴.

---

## #29 + #30 답습 명시 + Mixin 채택 결정

본 변형은 **직전 사이클 #29 `Marker_FixedCCTV/Advanced/fieldOfView`(커밋 `d96bec24`) + #30 `Marker_RotationaCCTV/Advanced/fieldOfView`(커밋 `72886751`)의 답습**이며, 다음만 차이가 난다:

1. **컴포넌트/메시 이름**: `MarkerRotationaCCTV_A` → `MarkerMoveCCTV_A`
2. **이동 추적 RAF 추가**: `attach(mesh)` + 매 프레임 mesh 위치 추적 RAF + `detach()` + `setTrackRotation(bool)` + `isTracking()` 메서드
3. **preview UI**: 추적 토글 버튼 + 데모 이동 토글 버튼(preview 전용 — 마커 mesh를 사인파로 흔들어 추적이 시각적으로 관찰되게)
4. **기본값**: pan=0°, tilt=-10°, fov=60°, range=10m, opacity=0.25, color=0x00ffff

**큐 설명**: "이동형 시야각 콘 (신규 Mixin: CameraFOVConeMixin)"

**실제 채택**: MeshStateMixin + 커스텀 메서드 `this.fovCone` (신규 Mixin **없음**)

### 결정 근거

본 사이클은 **메인 루프의 "신규 Mixin 생성 금지" 정책**(`create-mixin-spec` / `implement-mixin` 호출 금지)에 따라 큐 설명에 명시된 `CameraFOVConeMixin`을 만들지 않고 **커스텀 메서드 `this.fovCone`로 완결**한다. ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙"에서 #29(Fixed) + #30(Rotationa) + #31(Move, 본 변형) = **3개 컴포넌트에서 동일 기법 확인**으로 임계점을 명백히 넘는다. 사용자가 메인 루프 외부에서 `create-mixin-spec` → `implement-mixin`을 호출해 `CameraFOVConeMixin` 승격을 강력 권장한다.

### Mixin 승격 메모 (필수 — 3번째 동일 기법 도달)

**CameraFOVConeMixin 승격 강력 권장 — 큐 #29~#31 3개 컴포넌트가 동일 기법으로 완결됨.** `setFov/setRange/setColor/setOpacity/setPan/setTilt/setRotation/attach/detach/setTrackRotation/isTracking/enable/disable/destroy`를 그대로 흡수 가능. #32 AICCTV ai_detectionZone는 FOV 콘 + AI 감지 marker 스폰의 합성이므로 Mixin 적용 후 ai_marker 스폰만 추가 커스텀으로 처리.

- **승격 후보 이름**: `CameraFOVConeMixin` (큐 설명 명시명 그대로)
- **흡수할 메서드 (#29 + #30 + #31 합산)**: `setFov/setRange/setColor/setOpacity/setPan/setTilt/setRotation/attach/detach/setTrackRotation/isTracking/enable/disable/isEnabled/getFov/getRange/getColor/getOpacity/getPan/getTilt/destroy`
- **#32에서 추가될 차이점**: AI 감지 marker 스폰(별도 sphere/billboard mesh 생성 + AI 감지 데이터 토픽 구독). FOV 콘 자체는 동일.
- **MeshState color 채널과의 직교성**: fovCone은 별도 자체 mesh만 다루므로 sensor mesh의 `material.color`는 절대 건드리지 않는다 (#29/#30 동일 정책). MeshState 승계가 그대로 보존됨.

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.fovCone` (신규 Mixin 없음)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

(Standard 답습 — #29/#30과 동일)

### MeshState 채널과의 충돌 회피 정책

**원칙**: fovCone은 **자체 생성 mesh만** 사용한다. MeshStateMixin이 사용하는 `material.color`(MarkerMoveCCTV_A) 채널은 절대 건드리지 않는다.

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | `material.color` (×1 — MarkerMoveCCTV_A material) | 데이터 상태 색상 (Standard 승계) |
| fovCone (커스텀) | 별도 자체 `THREE.Mesh` (ConeGeometry + 반투명 MeshBasicMaterial) | 시야각 영역 시각화 + PTZ 회전 + 이동 추적 — sensor mesh material 무관 |

두 채널이 직교 — MeshState는 sensor mesh의 색을, fovCone은 별도 콘 mesh를 다룬다. 정지 시 단순 visible=false, 종료 시 RAF cancel + `geometry.dispose() + material.dispose() + parent.remove + this.fovCone = null` (self-null).

### 콘 형상 (#29/#30 동일)

```
ConeGeometry(radius, height, radialSegments=32, heightSegments=1, openEnded=true)
  height = range
  radius = range * Math.tan(fov / 2)
```

material:

```javascript
new THREE.MeshBasicMaterial({
    color:       0x00ffff,
    transparent: true,
    opacity:     0.25,
    side:        THREE.DoubleSide,
    depthWrite:  false
});
```

### 콘 위치/자세 결정 (#30 + 이동 추적 RAF 추가)

**geometry 단위 베이크** (#29/#30 동일):
- `geom.translate(0, height/2, 0)` + `geom.rotateX(-Math.PI / 2)` — base가 origin, apex가 z=-height

**mesh 단위 PTZ 회전** (#30 답습):
- `mesh.rotation.y = panRad` — pan(수평): world up축 회전
- `mesh.rotation.x = tiltRad` — tilt(수직): pitch up/down

**이동 추적 RAF** (본 변형 핵심 추가):
- `attach(mesh)` — 추적 대상 mesh 지정 → 매 프레임 `cone.position.copy(mesh.getWorldPosition(_v3))` (RAF 자동 시작)
- `detach()` — RAF 중단 + cone position 고정 (현 위치 유지)
- `setTrackRotation(bool)` — true면 매 프레임 추적 대상 mesh의 `getWorldQuaternion(_q)`을 cone.quaternion 베이스로 적용 후 pan/tilt를 추가 회전으로 합성. false(기본)면 mesh의 위치만 추적하고 회전은 pan/tilt만 적용
- `isTracking()` — RAF 활성 boolean

> RAF 루프는 `pipeFlow`/`heatmapSurface`/`alarmPulse`의 self-null `requestAnimationFrame`/`cancelAnimationFrame` 패턴 답습. destroy에서 RAF 취소 보장.

### 위치 결정

- **추적 OFF (attach 미호출)**: mount 시점에 1회 산출 (#29/#30과 동일). `enable()` 호출 시마다 위치 재산출.
- **추적 ON (attach 호출)**: 매 프레임 추적 대상 mesh의 world position을 따라감. mesh가 GLTF 애니메이션이나 외부 위치 갱신으로 움직이면 콘도 즉시 따라간다.
- **추적 대상 부재 시 fallback**: `attach(null)` 호출은 attach 무시. 추적 대상 mesh가 detach 시점에 disposed 되어도 RAF는 cancel된다. attach 시점에 mesh가 없으면 attach 자체가 no-op.

### 커스텀 네임스페이스 `this.fovCone`

| 메서드 | 동작 |
|--------|------|
| `setFov(deg)` | 시야각 변경 (degrees, 0 < deg < 180). geometry 재생성 |
| `setRange(m)` | 사거리 변경 (height, m > 0). geometry 재생성 |
| `setColor(hex)` | 색상 변경 — `material.color.setHex` (number) 또는 `.set(string)` |
| `setOpacity(alpha)` | 알파 변경 (0~1) |
| `setPan(deg)` | 수평 회전 (degrees, mesh.rotation.y = deg * π/180) |
| `setTilt(deg)` | 수직 회전 (degrees, mesh.rotation.x = deg * π/180) |
| `setRotation({ pan, tilt })` | 두 축 동시 설정 (둘 다 선택적) |
| **`attach(mesh)`** | **추적 대상 mesh 지정. RAF 자동 시작** |
| **`detach()`** | **RAF 중단 + cone position 고정** |
| **`setTrackRotation(bool)`** | **추적 대상 mesh의 회전까지 따라갈지 여부 (기본 false)** |
| **`isTracking()`** | **RAF 활성 상태 boolean** |
| `enable()` | 자원 ensure + parent에 add + `visible=true` |
| `disable()` | `visible=false` (자원 유지) |
| `isEnabled()` | 현재 활성 여부 (boolean) |
| `getFov()/getRange()/getColor()/getOpacity()/getPan()/getTilt()` | 현재 값 조회 |
| `destroy()` | RAF cancel + parent.remove + geometry/material dispose + 모든 reference null + 마지막 줄 `this.fovCone = null` (self-null) |

#### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| fov | 60 (degrees) | 보안 카메라 일반적 화각 |
| range | 10 (m) | 마커 본체 크기(~6 단위)와 비슷한 스케일 |
| color | 0x00ffff (시안) | scene 배경 #1a1a2e 위에서 명확히 대비 |
| opacity | 0.25 | 반투명 — 다른 객체와 겹쳐도 가독성 유지 |
| pan | 0° | 정면 (기본 — 데모 이동 토글로 시각 관찰) |
| tilt | -10° | 약간 아래쪽 — 지면 감시 시나리오 |
| trackRotation | false | 위치만 추적, 회전은 pan/tilt만 |
| autoEnable on mount | true | preview 시각 관찰 우선 (#29/#30 동일 정책) |

> **자동 enable 규약**: parent(scene 또는 appendElement)가 register 시점에 가용하면 즉시 enable + 콘 생성 + add + 기본 pan/tilt 적용. 가용하지 않으면 페이지가 직접 `enable()` 호출.

#### parent 결정 우선순위 (#29/#30 동일)

```
1) this._fovConeParent       — 페이지/preview가 직접 주입 (scene)
2) wemb.threeElements.scene  — 운영 환경 scene fallback
3) this.appendElement        — GLTF 루트 fallback (root scale [1000] 영향, 권장하지 않음)
4) 둘 다 없으면 enable no-op (안전 가드)
```

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 색상 채널만) |

FOV/PTZ/추적 변경은 페이지가 외부 명령형으로 직접 호출. 별도 구독 없음.

### 이벤트 (customEvents)

없음. 개별 단위(meshName='MarkerMoveCCTV_A' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: MeshStateMixin 적용 + `this.fovCone` API 등록 + (parent 가용 시) **자동 enable** with 기본값 + equipmentStatus 구독
- 페이지가 추가로 `_fovConeParent` 주입 후 `attach(mesh)` 호출로 추적 시작 / `setFov/setRange/setColor/setOpacity/setPan/setTilt/setRotation/setTrackRotation/disable/enable` 외부 명령형 호출
- `beforeDestroy.js`: 구독 해제 → `this.fovCone?.destroy()` (RAF cancel + dispose 포함) → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성 (register.js 차이 명시)

| 항목 | Standard | Advanced/fieldOfView |
|------|----------|----------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `this.fovCone` 네임스페이스 | 없음 | `setFov/setRange/setColor/setOpacity/setPan/setTilt/setRotation/attach/detach/setTrackRotation/isTracking/enable/disable/isEnabled/destroy` 노출 |
| 자체 `THREE.Mesh`(ConeGeometry) | 없음 | 자체 생성 + scene attach + dispose |
| RAF 이동 추적 루프 | 없음 | 있음 — attach 호출 시 자동 시작, destroy에서 cancel |
| parent 결정 우선순위 (`_fovConeParent` → scene) | 없음 | 있음 (sensor mesh의 GLTF root scale [1000]에서 격리) |
| 자동 enable on mount | 없음 (단순 색상만) | 있음 — mount 직후 콘 시각 관찰 |
| PTZ rotation API | 없음 | 있음 — pan/tilt 외부 명령형 |
| beforeDestroy | meshState만 정리 | fovCone(RAF cancel 포함) → meshState 역순 정리 |
| 화면 표시 | 단일 색상 마커 판 | 단일 색상 + 이동 추적되는 회전된 반투명 시야각 콘 |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/fieldOfView는 추가로 (a) 자체 ConeGeometry/MeshBasicMaterial 자원 (b) scene 직속 attach 절차 (c) `setFov/setRange/setColor/setOpacity/setPan/setTilt/setRotation/attach/detach/setTrackRotation` 외부 명령형 API (d) RAF 이동 추적 루프 — 네 채널을 페이지에 노출한다. register.js에 Mixin 적용 + 커스텀 메서드 + 자체 mesh 생성/회전/추적/dispose가 모두 추가되므로 별도 폴더로 분리한다.

---

## #29/#30 (Fixed/Rotationa)와의 분리 정당성

| 항목 | #29 Marker_FixedCCTV | #30 Marker_RotationaCCTV | #31 Marker_MoveCCTV (본 변형) |
|------|-----------------------|---------------------------|-------------------------------|
| 카메라 유형 | 고정형 (Fixed) | 회전형 (Rotational, PTZ 유사) | 이동형 (Movable/Portable) |
| meshName | `MarkerFixedCCTV_A` | `MarkerRotationaCCTV_A` | `MarkerMoveCCTV_A` |
| material | `Material #39` | `Material #46` | `Material #43` |
| PTZ 회전 API | 없음 | `setPan/setTilt/setRotation` | `setPan/setTilt/setRotation` (#30 답습) |
| **이동 추적 RAF** | **없음** | **없음** | **있음 — `attach/detach/setTrackRotation/isTracking`** |
| mesh 위치 | mount 시점 1회 산출 | mount 시점 1회 산출 | 매 프레임 추적 (attach ON 시) |
| preview UI | fov/range/opacity/color | + pan/tilt | + 추적 토글 + 데모 이동 토글 |

이동형 CCTV는 마커 자체가 동적으로 움직일 수 있으므로 RAF 추적이 필수적이다. #29/#30의 정적 위치 콘으로는 이동형 CCTV의 본질적 기능(이동 + 추적)을 표현할 수 없으므로 별도 폴더로 분리한다.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.cctvInst = wemb.getDesignComponent('Marker_MoveCCTV');
this.cctvInst._fovConeParent = wemb.threeElements.scene;
this.cctvInst.fovCone.enable();   // register.js 자동 enable 한 경우 no-op

// 이동 추적 시작 — 마커 mesh 직접 attach
const markerMesh = this.cctvInst.appendElement.getObjectByName('MarkerMoveCCTV_A');
this.cctvInst.fovCone.attach(markerMesh);

// 화각/사거리/PTZ 외부 변경
this.cctvInst.fovCone.setFov(75);
this.cctvInst.fovCone.setRange(15);
this.cctvInst.fovCone.setPan(45);
this.cctvInst.fovCone.setTilt(-30);

// 추적 회전 합성 ON (mesh 회전까지 따라가기)
this.cctvInst.fovCone.setTrackRotation(true);

// 추적 일시 정지
this.cctvInst.fovCone.detach();

// 콘 일시 숨김 (자원 유지)
this.cctvInst.fovCone.disable();
```

---

## 모델 주의사항

- `models/Marker_MoveCCTV/01_default/Marker_MoveCCTV.gltf`의 단일 메시 이름은 `'MarkerMoveCCTV_A'`(언더스코어 제거 + A)로 확정. fovCone은 `getObjectByName('MarkerMoveCCTV_A')`로 world position 산출 대상 mesh를 직접 조회.
- GLTF 루트 `root` Node가 `scale [1000, 1000, 1000]`이므로 콘을 GLTF 루트(`appendElement`)에 add 하면 1000배 확대된다. 반드시 **scene 직속**에 add (preview에서는 직접 `instance._fovConeParent = scene`을 주입; 운영에서는 `wemb.threeElements.scene` 자동 fallback).
- 콘은 매 프레임 `MarkerMoveCCTV_A` mesh의 world position을 절대 좌표로 사용하므로, root scale 효과를 거친 실제 화면 위치(±5.94 × ±6.86 × ±0.20 단위)에 정확히 정렬됨.
- **[MODEL_READY] placeholder 사용 안 함** — meshName='MarkerMoveCCTV_A'는 컴포넌트 루트 CLAUDE.md / Standard register.js에서 이미 확정.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 (#29/#30 답습) |
| 2 | self-null `this.fovCone = null` + RAF cancel | OK — destroy 마지막 줄 self-null + RAF cancelAnimationFrame + null |
| 3 | beforeDestroy.js는 호출만 | OK — `this.fovCone?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachFovCone(inst)` 내부 destroy도 RAF cancel + `inst.fovCone = null` 포함 + geometry/material dispose + parent.remove |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setFov/setRange/setColor/setOpacity/setPan/setTilt/setRotation/attach/detach/setTrackRotation/isTracking/enable/disable/isEnabled/destroy` (#29/#30 동사 형태 답습 + attach/detach/setTrackRotation/isTracking 추가, alarmPulse/pipeFlow의 RAF self-null 패턴 답습) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview FOV deg ↔ `setFov`, range m ↔ `setRange`, opacity 0~1 ↔ `setOpacity`, color picker ↔ `setColor`, pan deg ↔ `setPan`, tilt deg ↔ `setTilt`, **추적 토글 ↔ `attach/detach`**, **데모 이동 토글 ↔ preview 전용 (mesh.position 사인파)** |
| 7 | 기본값 시각적 관찰 가능성 | OK — preview 로드 직후 자동 enable + fov=60° + range=10m + opacity=0.25 + color=0x00ffff + pan=0° + tilt=-10° → 콘이 마커 위에 즉시 관찰. **데모 이동 토글 ON일 때 마커가 X축 사인파로 흔들리며 콘이 추적하는 것이 명확히 관찰** |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

---

## 발견한 문제 / Mixin 승격 후보 (3번째 동일 기법 — 강력 권장)

- **Mixin 승격 강력 권장 — 3번째 동일 기법 도달**: 큐 #29 (Marker_FixedCCTV/fieldOfView) + #30 (Marker_RotationaCCTV/fieldOfView) + #31 (본 변형) = **3개 컴포넌트에서 동일 기법 확인**. ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙"의 **승격 시점 신호(2번째 컴포넌트 등록)를 명백히 초과** — 사용자가 메인 루프 외부에서 즉시 승격 권장.
  - **승격 후보 이름**: `CameraFOVConeMixin` (큐 설명 명시명 그대로 보존)
  - **API 호환성**: 현 시그니처(`setFov/setRange/setColor/setOpacity/setPan/setTilt/setRotation/attach/detach/setTrackRotation/isTracking/enable/disable/isEnabled/getFov/getRange/getColor/getOpacity/getPan/getTilt/destroy`) 그대로 흡수 가능
  - **#32 AICCTV ai_detectionZone 확장 시 추가 차이점**: AI 감지 marker 스폰(별도 sphere/billboard mesh). FOV 콘 자체는 동일 → Mixin 적용 후 ai_marker 스폰만 추가 커스텀으로 처리 가능
  - **본 사이클은 신규 Mixin 금지 정책으로 커스텀 메서드 유지** — 메인 루프 외부에서 사용자가 `create-mixin-spec` → `implement-mixin` 호출로 승격 권장
- **scene parent 강제 정책**: GLTF root scale [1000, 1000, 1000]이 콘에 전파되지 않도록 반드시 `_fovConeParent` 또는 `wemb.threeElements.scene`에 add. appendElement(GLTF 루트) fallback은 콘이 1000배 확대되어 의도치 않은 결과를 만들 수 있으므로 안전 가드만 두고 실 사용은 권장하지 않는다.
- **Fixed/Rotation/Move 분리 유지**: 본 변형은 이동형이므로 RAF 추적이 추가된다. 이 차이가 #29(정적)/#30(회전형)와의 분리 정당성 핵심이며, 동일 폴더에 두지 않는다. 향후 Mixin 승격 시 옵션화로 단일 Mixin에 흡수 가능.
- **RAF 메모리 누수 방지**: destroy에서 반드시 cancelAnimationFrame + null 처리. attach 시점에 이미 RAF가 돌고 있으면 중복 시작 금지(no-op). detach는 RAF cancel + null만 수행하고 enable 상태는 유지(콘 visible은 그대로).
