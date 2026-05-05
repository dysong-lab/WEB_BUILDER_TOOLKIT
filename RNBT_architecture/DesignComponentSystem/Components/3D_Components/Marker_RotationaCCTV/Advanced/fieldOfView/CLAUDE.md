# Marker_RotationaCCTV — Advanced/fieldOfView

## 기능 정의

1. **상태 색상 표시 (Standard 승계)** — equipmentStatus 토픽으로 수신한 데이터에 따라 'MarkerRotationaCCTV_A' Mesh의 단일 material(`Material #46`) 색상 변경 (`material.color` 채널). Standard와 동일한 colorMap 사용.
2. **반투명 시야각 콘 시각화 (3D 채널)** — Marker_RotationaCCTV mesh 위치를 기준으로 별도의 자체 `THREE.Mesh`(`ConeGeometry`)를 scene에 attach하여 회전형 CCTV의 시야각(field of view) 영역을 반투명 원뿔로 표현
   - `ConeGeometry(radius, height, radialSegments=32, heightSegments=1, openEnded=true)` — `radius = height * tan(fovHalfAngleRad)`
   - `MeshBasicMaterial({ color, transparent:true, opacity, side:DoubleSide, depthWrite:false })`
   - geometry 단계에서 `translate(0, height/2, 0)` + `rotateX(-Math.PI/2)` 베이크 → base가 origin(카메라 위치), apex가 `-Z`(전방). mesh.rotation은 PTZ 회전 적용을 위해 identity로 보존.
3. **PTZ rotation 동기화 (#29 대비 차이점)** — 회전형 CCTV는 한 방향 고정이 아니라 pan(수평)/tilt(수직)으로 시야 방향이 바뀐다. `setPan(deg)`, `setTilt(deg)`, `setRotation({pan, tilt})`로 cone mesh의 `rotation.y`(pan, world up축)와 `rotation.x`(tilt, 카메라 좌우축)를 직접 갱신. ConeGeometry는 이미 base-rotated bake 상태이므로 mesh.rotation은 identity → pan/tilt만 추가 회전으로 동작.
4. **외부 명령형 API** — 페이지가 `instance.fovCone.setFov/setRange/setColor/setOpacity/setPan/setTilt/setRotation/enable/disable/destroy`를 직접 호출하여 시야각/사거리/색상/투명도/회전(PTZ)/활성 토글 제어. 본 변형은 회전형 CCTV이므로 #29의 정적 API에 PTZ pan/tilt가 추가되었다. 이동 추적은 별도 변형(#31 Marker_MoveCCTV/fieldOfView)에서 추가 예정.

---

## Marker_RotationaCCTV mesh 구조

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/Marker_RotationaCCTV/01_default/Marker_RotationaCCTV.gltf` |
| mesh 이름 | `MarkerRotationaCCTV_A` (앞쪽 언더스코어 제거 + 뒤쪽 `_A` 접미 — 폴더명 `Marker_RotationaCCTV`와 구분자 위치 + 접미 불일치) |
| 결정 | **단일 mesh** (Standard와 동일) |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh: MarkerRotationaCCTV_A)`와 일치. `getObjectByName`은 이름을 그대로 비교하므로 반드시 `'MarkerRotationaCCTV_A'`(언더스코어 제거 + A)로 조회. Marker_AICCTV·Marker_Anemometer·Marker_AntiDrugGoods·Marker_Bridge·Marker_Firealarm·Marker_FixedCCTV·Marker_GD·Marker_IndoorHydrant·Marker_MonitorNozzle·Marker_MoveCCTV·Marker_OdorDetector·Marker_OutdoorHydrant와 완전히 동일한 축의 폴더-Node 형태 불일치 패턴.

---

## #29 답습 명시 + Mixin 채택 결정

본 변형은 **직전 사이클 #29 `Marker_FixedCCTV/Advanced/fieldOfView`(커밋 `d96bec24`)의 답습**이며, 다음만 차이가 난다:

1. **컴포넌트/메시 이름**: `MarkerFixedCCTV_A` → `MarkerRotationaCCTV_A` (폴더-Node 형태 불일치 동일 패턴)
2. **PTZ rotation 동기화 1축 추가**: `setPan(deg)`/`setTilt(deg)`/`setRotation({pan,tilt})` + `getPan/getTilt` 메서드 + cone mesh의 `rotation.y/x` 직접 갱신
3. **preview UI**: pan(-180~180°)/tilt(-60~60°) 슬라이더 2개 추가
4. **기본값**: pan=30°, tilt=-15° (정면 정지 상태와 명확히 구별되어 회전형 콘이 시각 관찰 가능)

**큐 설명**: "PTZ rotation 동기화 시야각 콘 (신규 Mixin: CameraFOVConeMixin)"

**실제 채택**: MeshStateMixin + 커스텀 메서드 `this.fovCone` (신규 Mixin **없음**)

### 결정 근거

본 사이클은 **메인 루프의 "신규 Mixin 생성 금지" 정책**(`create-mixin-spec` / `implement-mixin` 호출 금지)에 따라 큐 설명에 명시된 `CameraFOVConeMixin`을 만들지 않고 **커스텀 메서드 `this.fovCone`으로 완결**한다. ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙"에서 #29(Fixed) + #30(Rotationa) = 2개 컴포넌트로 동일 기법이 확인된 시점이 **Mixin 승격 임계점**이다. #31 Marker_MoveCCTV/fieldOfView에서 동일 기법(자체 ConeGeometry + setFov/setRange/setColor/setOpacity)이 추가 적용되면 3번째 컴포넌트로 임계점을 명백히 넘으므로 그 시점에 사용자가 직접 `create-mixin-spec` → `implement-mixin`을 호출해 `CameraFOVConeMixin` 승격을 권장한다.

### Mixin 승격 메모

**CameraFOVConeMixin 승격 후보가 #30 등록으로 임계점 도달.** 향후 Mixin 신설 시 `setFov/setRange/setColor/setOpacity/setPan/setTilt/enable/disable/destroy`를 그대로 흡수 가능. #31 Move CCTV는 attach(mesh) RAF 추적만 추가하면 됨.

- **승격 후보 이름**: `CameraFOVConeMixin` (큐 설명 명시명 그대로)
- **흡수할 메서드 (#29 + #30 합산)**: `setFov/setRange/setColor/setOpacity/setPan/setTilt/setRotation/enable/disable/isEnabled/getFov/getRange/getColor/getOpacity/getPan/getTilt/destroy`
- **#31에서 추가될 차이점**:
  - 이동 추적: `attach(mesh)` + 매 프레임 mesh 위치 추적 RAF (Fixed/Rotationa는 mount 시점 1회 위치 산출)
- **MeshState color 채널과의 직교성**: fovCone은 별도 자체 mesh만 다루므로 sensor mesh의 `material.color`는 절대 건드리지 않는다 (#29 동일 정책). MeshState 승계가 그대로 보존됨.

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

(Standard 답습 — #29와 동일)

### MeshState 채널과의 충돌 회피 정책

**원칙**: fovCone은 **자체 생성 mesh만** 사용한다. MeshStateMixin이 사용하는 `material.color`(MarkerRotationaCCTV_A) 채널은 절대 건드리지 않는다.

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | `material.color` (×1 — MarkerRotationaCCTV_A material) | 데이터 상태 색상 (Standard 승계) |
| fovCone (커스텀) | 별도 자체 `THREE.Mesh` (ConeGeometry + 반투명 MeshBasicMaterial) | 시야각 영역 시각화 + PTZ 회전 — sensor mesh material 무관 |

두 채널이 직교 — MeshState는 sensor mesh의 색을, fovCone은 별도 콘 mesh를 다룬다. 정지 시 단순 visible=false, 종료 시 `geometry.dispose() + material.dispose() + parent.remove + this.fovCone = null` (self-null).

### 콘 형상 (#29 동일)

```
ConeGeometry(radius, height, radialSegments=32, heightSegments=1, openEnded=true)
  height = range
  radius = range * Math.tan(fov / 2)  // fov = 전체 각도(degrees)를 라디안으로 환산
```

`openEnded=true`로 base 면을 비워 내부가 보이도록(시야 영역 안쪽에 들어와 있는 객체가 시각적으로 가리지 않게).

material:

```javascript
new THREE.MeshBasicMaterial({
    color:       0x00ffff,   // 시안 — 보안 카메라 시각화 표준
    transparent: true,
    opacity:     0.25,
    side:        THREE.DoubleSide,   // 콘 안쪽에서도 보이도록
    depthWrite:  false                // 다른 mesh를 가리지 않음
});
```

### 콘 위치/자세 결정 (#29 + PTZ 회전 추가)

**geometry 단위 베이크** (#29 동일):
- `geom.translate(0, height/2, 0)` — base를 +Y/2 평행이동 → base가 y=0 평면, apex가 y=+height
- `geom.rotateX(-Math.PI / 2)` — apex가 -Z 방향(전방)으로 누움 → base가 origin, apex가 z=-height

**mesh 단위 PTZ 회전** (본 변형 추가):
- `mesh.rotation.y = panRad` — pan(수평): world up축 회전. 양수 = 시계 반대 방향(top view 기준), 음수 = 시계 방향
- `mesh.rotation.x = tiltRad` — tilt(수직): pitch up/down. 양수 = 위쪽(천장 향함), 음수 = 아래쪽(지면 향함)
- ConeGeometry는 이미 base-rotated bake 상태이므로 mesh.rotation은 identity → pan/tilt만 추가 회전

> mesh.rotation의 적용 순서는 three.js 기본 `XYZ Euler order`. PTZ 카메라의 일반적 회전 순서(Yaw → Pitch)를 정확히 재현하려면 `mesh.rotation.order = 'YXZ'`로 변경 가능 — 본 변형은 시각화 정확도가 그렇게 엄격하지 않으므로 기본 XYZ 유지(mesh 회전이 두 축뿐이라 차이 무시 가능). 운영 환경에서 다축 회전 데이터가 들어올 경우 `setRotation`에 order 옵션 추가 검토.

### 위치 결정

- **앵커**: `MarkerRotationaCCTV_A` mesh의 world position(getObjectByName + getWorldPosition)
- 회전형 CCTV이지만 **위치는 고정** — 즉 mount 시점에 1회 산출하면 충분하며, 페이지가 mesh를 옮긴 경우에 대비해 `enable()` 호출 시마다 위치 재산출. mesh 이동 추적 RAF는 본 변형 대상이 아니다(#31 Move CCTV 이동형에서 추가).

### 커스텀 네임스페이스 `this.fovCone`

| 메서드 | 동작 |
|--------|------|
| `setFov(deg)` | 시야각 변경 (degrees, 0 < deg < 180). geometry 재생성(`_rebuild`) — radius·height 갱신 |
| `setRange(m)` | 사거리 변경 (height, m > 0). geometry 재생성(`_rebuild`) |
| `setColor(hex)` | 색상 변경 — `material.color.setHex` (number) 또는 `.set(string)` |
| `setOpacity(alpha)` | 알파 변경 (0~1). `material.opacity` + `material.transparent` 동기 |
| **`setPan(deg)`** | **수평 회전 (degrees, mesh.rotation.y = deg * π/180)** |
| **`setTilt(deg)`** | **수직 회전 (degrees, mesh.rotation.x = deg * π/180)** |
| **`setRotation({ pan, tilt })`** | **두 축 동시 설정 (둘 다 선택적, 누락 시 기존 값 유지)** |
| `enable()` | 자원 ensure + parent에 add + `visible=true`. 동일 호출 중복은 no-op |
| `disable()` | `visible=false` (자원 유지 — 재활성 가능) |
| `isEnabled()` | 현재 활성 여부 (boolean) |
| `getFov()/getRange()/getColor()/getOpacity()` | 현재 값 조회 |
| **`getPan()/getTilt()`** | **현재 PTZ 각도 조회 (degrees)** |
| `destroy()` | parent에서 remove + geometry.dispose + material.dispose + 모든 reference null + 마지막 줄 `this.fovCone = null` (self-null) |

#### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| fov | 60 (degrees) | 보안 카메라 일반적 화각 |
| range | 10 (m) | 마커 본체 크기(~6 단위)와 비슷한 스케일이므로 콘이 마커보다 약간 더 크게 형성되어 명확히 관찰 |
| color | 0x00ffff (시안) | scene 배경 #1a1a2e 위에서 명확히 대비 |
| opacity | 0.25 | 반투명 — 다른 객체와 겹쳐도 가독성 유지 |
| **pan** | **30°** | **#29 정면 정지(pan=0) 상태와 명확히 구별** — 회전형 CCTV임이 시각적으로 즉시 인식 |
| **tilt** | **-15°** | **약간 아래쪽 — 지면 감시 시나리오 가정** |
| autoEnable on mount | true | preview 시각 관찰 우선 (#29 동일 정책) |

> **자동 enable 규약**: parent(scene 또는 appendElement)가 register 시점에 가용하면 즉시 enable + 콘 생성 + add + 기본 pan/tilt 적용. 가용하지 않으면 페이지가 직접 `enable()` 호출.

#### parent 결정 우선순위 (#29 동일)

```
1) this._fovConeParent       — 페이지/preview가 직접 주입 (scene)
2) wemb.threeElements.scene  — 운영 환경 scene fallback
3) this.appendElement        — GLTF 루트 fallback (root scale [1000] 영향, 권장하지 않음)
4) 둘 다 없으면 enable no-op (안전 가드)
```

> appendElement(GLTF 루트)에 add하면 root scale [1000, 1000, 1000]이 콘에도 적용되어 콘이 1000배 커진다. 반드시 **scene 직속**(`_fovConeParent` 또는 `wemb.threeElements.scene`)에 add 한다. position은 mesh world position을 산출하여 절대 좌표로 둔다.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 색상 채널만) |

FOV/PTZ 변경(시야각/사거리/색상/pan/tilt)은 페이지가 외부 명령형으로 `setFov/setRange/setColor/setOpacity/setPan/setTilt/setRotation` 직접 호출. 별도 구독 없음. 운영 환경에서는 PTZ 데이터를 별도 토픽(예: `cctvPtz`)으로 받아 페이지가 명령형 API로 위임 가능 — 향후 Mixin 승격 시 `subscriptions` 자동 매핑 추가 검토.

### 이벤트 (customEvents)

없음. 개별 단위(meshName='MarkerRotationaCCTV_A' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: MeshStateMixin 적용 + `this.fovCone` API 등록 + (parent 가용 시) **자동 enable** with `fov=60, range=10, color=0x00ffff, opacity=0.25, pan=30°, tilt=-15°` + equipmentStatus 구독(`meshState.renderData`)
- 페이지가 추가로 `_fovConeParent` 주입 후 `setFov/setRange/setColor/setOpacity/setPan/setTilt/setRotation/disable/enable` 외부 명령형 호출
- `beforeDestroy.js`: 구독 해제 → `this.fovCone?.destroy()` → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성 (register.js 차이 명시)

| 항목 | Standard | Advanced/fieldOfView |
|------|----------|----------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `this.fovCone` 네임스페이스 | 없음 | `setFov/setRange/setColor/setOpacity/setPan/setTilt/setRotation/enable/disable/isEnabled/destroy` 노출 |
| 자체 `THREE.Mesh`(ConeGeometry) | 없음 | 자체 생성 + scene attach + dispose |
| parent 결정 우선순위 (`_fovConeParent` → scene) | 없음 | 있음 (sensor mesh의 GLTF root scale [1000]에서 격리) |
| 자동 enable on mount | 없음 (단순 색상만) | 있음 — mount 직후 콘 시각 관찰 (pan=30°, tilt=-15° 회전 적용 상태) |
| PTZ rotation API | 없음 | 있음 — pan/tilt 외부 명령형 |
| beforeDestroy | meshState만 정리 | fovCone → meshState 역순 정리 |
| 화면 표시 | 단일 색상 마커 판 | 단일 색상 + 회전된 반투명 시야각 콘 |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/fieldOfView는 추가로 (a) 자체 ConeGeometry/MeshBasicMaterial 자원 (b) scene 직속 attach 절차 (c) `setFov/setRange/setColor/setOpacity/setPan/setTilt/setRotation` 외부 명령형 API — 세 채널을 페이지에 노출한다. register.js에 Mixin 적용 + 커스텀 메서드 + 자체 mesh 생성/회전/dispose가 모두 추가되므로 별도 폴더로 분리한다.

---

## #29 (Marker_FixedCCTV/fieldOfView)와의 분리 정당성

| 항목 | #29 Marker_FixedCCTV | #30 Marker_RotationaCCTV (본 변형) |
|------|-----------------------|------------------------------------|
| 카메라 유형 | 고정형 (Fixed) | 회전형 (Rotational, PTZ 유사) |
| meshName | `MarkerFixedCCTV_A` | `MarkerRotationaCCTV_A` |
| material | `Material #39` | `Material #46` |
| PTZ 회전 API | 없음 | `setPan/setTilt/setRotation/getPan/getTilt` 추가 |
| mesh.rotation 사용 | identity 유지 | `rotation.y = panRad`, `rotation.x = tiltRad` 적용 |
| 기본 자세 | 정면 정지 (pan=0, tilt=0) | pan=30°, tilt=-15° (회전 시각 관찰 우선) |
| preview UI | fov/range/opacity/color | + pan(-180~180°) / tilt(-60~60°) 슬라이더 |

회전형 CCTV는 시야 방향이 동적으로 바뀌므로 PTZ rotation API가 필수적이다. #29의 정적 콘으로는 회전형 CCTV의 본질적 기능(다방향 감시)을 표현할 수 없으므로 별도 폴더로 분리한다. mesh 위치 자체는 고정이므로 Move CCTV(#31)의 RAF 추적과는 또 다른 분리.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.cctvInst = wemb.getDesignComponent('Marker_RotationaCCTV');
this.cctvInst._fovConeParent = wemb.threeElements.scene;
this.cctvInst.fovCone.enable();   // register.js 자동 enable 한 경우 no-op

// 화각/사거리 외부 변경
this.cctvInst.fovCone.setFov(75);     // 광각 카메라
this.cctvInst.fovCone.setRange(15);   // 15m 사거리
this.cctvInst.fovCone.setColor(0xffaa00);   // 알람 시 주황
this.cctvInst.fovCone.setOpacity(0.4);

// PTZ 회전 (본 변형 추가)
this.cctvInst.fovCone.setPan(45);     // 수평 45° 회전
this.cctvInst.fovCone.setTilt(-30);   // 아래쪽 30° 기울임
this.cctvInst.fovCone.setRotation({ pan: 90, tilt: 0 });  // 동시 설정

// 운영에서 PTZ 데이터 수신 시 (예시)
subscribe('cctvPtz', this, ({ response: { pan, tilt } }) => {
    this.cctvInst.fovCone.setRotation({ pan, tilt });
});

// 콘 일시 숨김 (자원 유지)
this.cctvInst.fovCone.disable();
```

---

## 모델 주의사항

- `models/Marker_RotationaCCTV/01_default/Marker_RotationaCCTV.gltf`의 단일 메시 이름은 `'MarkerRotationaCCTV_A'`(언더스코어 제거 + A)로 확정. fovCone은 `getObjectByName('MarkerRotationaCCTV_A')`로 world position 산출 대상 mesh를 직접 조회.
- GLTF 루트 `root` Node가 `scale [1000, 1000, 1000]`이므로 콘을 GLTF 루트(`appendElement`)에 add 하면 1000배 확대된다. 반드시 **scene 직속**에 add (preview에서는 직접 `instance._fovConeParent = scene`을 주입; 운영에서는 `wemb.threeElements.scene` 자동 fallback).
- 콘은 `MarkerRotationaCCTV_A` mesh의 world position을 절대 좌표로 사용하므로, root scale 효과를 거친 실제 화면 위치(±5.94 × ±6.86 × ±0.20 단위)에 정확히 정렬됨.
- **[MODEL_READY] placeholder 사용 안 함** — meshName='MarkerRotationaCCTV_A'는 컴포넌트 루트 CLAUDE.md / Standard register.js에서 이미 확정.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 (#29 답습) |
| 2 | self-null `this.fovCone = null` | OK — destroy 마지막 줄 |
| 3 | beforeDestroy.js는 호출만 | OK — `this.fovCone?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachFovCone(inst)` 내부 destroy도 `inst.fovCone = null` 포함 + geometry/material dispose + parent.remove |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setFov/setRange/setColor/setOpacity/setPan/setTilt/setRotation/enable/disable/isEnabled/destroy` (#29 동사 형태 답습 + setPan/setTilt/setRotation 추가) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview FOV deg ↔ `setFov(deg)`, range m ↔ `setRange(m)`, opacity 0~1 ↔ `setOpacity(alpha)`, color picker ↔ `setColor(hex)`, **pan deg ↔ `setPan(deg)` (mesh.rotation.y)**, **tilt deg ↔ `setTilt(deg)` (mesh.rotation.x)** |
| 7 | 기본값 시각적 관찰 가능성 | OK — preview 로드 직후 자동 enable + fov=60° + range=10m + opacity=0.25 + color=0x00ffff + **pan=30° + tilt=-15°** → 정면 정지 콘과 명확히 구별되는 회전된 콘으로 즉시 시각 관찰 가능 |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

---

## 발견한 문제 / Mixin 승격 후보

- **Mixin 승격 후보 — 임계점 도달**: 큐 #29 (Marker_FixedCCTV/fieldOfView) + #30 (본 변형) = **2개 컴포넌트에서 동일 기법 확인**. ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙"의 **승격 시점 신호(2번째 컴포넌트 등록)에 도달**.
  - **승격 후보 이름**: `CameraFOVConeMixin` (큐 설명 명시명 그대로 보존)
  - **API 호환성**: 현 시그니처(`setFov/setRange/setColor/setOpacity/setPan/setTilt/setRotation/enable/disable/isEnabled/getFov/getRange/getColor/getOpacity/getPan/getTilt/destroy`) 그대로 흡수 가능
  - **#31에서 추가될 차이점**: `attach(mesh)` + 매 프레임 mesh 위치 추적 RAF (Move CCTV 이동형). Fixed/Rotationa는 `attach` 미호출 = 정적 위치 유지 옵션으로 처리 가능
  - **본 사이클은 신규 Mixin 금지 정책으로 커스텀 메서드 유지** — 메인 루프 외부에서 사용자가 `create-mixin-spec` → `implement-mixin` 호출로 승격 권장 (#31 Move CCTV에서 3번째 동일 기법 확정 시 권장 강도 최대)
- **scene parent 강제 정책**: GLTF root scale [1000, 1000, 1000]이 콘에 전파되지 않도록 반드시 `_fovConeParent` 또는 `wemb.threeElements.scene`에 add. appendElement(GLTF 루트) fallback은 콘이 1000배 확대되어 의도치 않은 결과를 만들 수 있으므로 안전 가드만 두고 실 사용은 권장하지 않는다 (preview에서도 항상 `instance._fovConeParent = scene` 명시).
- **Fixed/Rotation/Move 분리 유지**: 본 변형은 회전형이므로 PTZ rotation API가 추가되지만 위치 추적 RAF는 없다. 이 차이가 #29(정적)/#31(이동)와의 분리 정당성 핵심이며, 동일 폴더에 두지 않는다. 향후 Mixin 승격 시 옵션화로 단일 Mixin에 흡수 가능.
- **PTZ Euler order 한계**: 본 변형은 three.js 기본 `XYZ` Euler order로 mesh.rotation.x/y를 적용한다. 두 축뿐이라 일반적으로 차이가 없으나, 운영 환경에서 PTZ 카메라 본체의 Yaw → Pitch 순서를 엄격히 재현하려면 `mesh.rotation.order = 'YXZ'`로 변경 필요. 현 수준 시각화에는 무시 가능하므로 본 변형은 기본 유지.
