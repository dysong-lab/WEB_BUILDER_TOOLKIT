# Marker_FixedCCTV — Advanced/fieldOfView

## 기능 정의

1. **상태 색상 표시 (Standard 승계)** — equipmentStatus 토픽으로 수신한 데이터에 따라 'MarkerFixedCCTV_A' Mesh의 단일 material(`Material #39`) 색상 변경 (`material.color` 채널). Standard와 동일한 colorMap 사용.
2. **반투명 시야각 콘 시각화 (3D 채널)** — Marker_FixedCCTV mesh 위치를 기준으로 별도의 자체 `THREE.Mesh`(`ConeGeometry`)를 scene에 attach하여 고정 CCTV의 시야각(field of view) 영역을 반투명 원뿔로 표현
   - `ConeGeometry(radius, height, radialSegments=32, heightSegments=1, openEnded=true)` — `radius = height * tan(fovHalfAngleRad)`
   - `MeshBasicMaterial({ color, transparent:true, opacity, side:DoubleSide, depthWrite:false })`
   - 콘 base가 카메라 mesh 쪽으로 향하도록 `rotateX(Math.PI/2)` 보정 — 기본적으로 ConeGeometry의 축은 +Y이므로 -Z 전방으로 누인 뒤 base를 카메라 위치에, apex를 전방으로 둠
   - 위치: 카메라 mesh의 world position을 기준으로 콘 base를 정렬 (앞쪽 길이의 절반만큼 +Z 방향으로 이동하여 apex 방향이 전방)
3. **외부 명령형 API** — 페이지가 `instance.fovCone.setFov/setRange/setColor/setOpacity/enable/disable/destroy`를 직접 호출하여 시야각/사거리/색상/투명도/활성 토글 제어. 본 변형은 Fixed CCTV 단일 정적 mesh이므로 PTZ 회전 동기화·이동 추적은 불필요(다음 큐 #30/#31에서 추가).

---

## Marker_FixedCCTV mesh 구조

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/Marker_FixedCCTV/01_default/Marker_FixedCCTV.gltf` |
| mesh 이름 | `MarkerFixedCCTV_A` (앞쪽 언더스코어 제거 + 뒤쪽 `_A` 접미 — 폴더명 `Marker_FixedCCTV`와 구분자 위치 + 접미 불일치) |
| 결정 | **단일 mesh** (Standard와 동일) |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh: MarkerFixedCCTV_A)`와 일치. `getObjectByName`은 이름을 그대로 비교하므로 반드시 `'MarkerFixedCCTV_A'`(언더스코어 + A)로 조회. Marker_AICCTV·Marker_Anemometer·Marker_AntiDrugGoods·Marker_Bridge·Marker_Firealarm과 완전히 동일한 축의 폴더-Node 형태 불일치 패턴.

---

## 큐 정의 vs 실제 구현 — Mixin 채택 결정

**큐 설명**: "반투명 원뿔 시야각 콘 표시 (신규 Mixin: CameraFOVConeMixin)"

**실제 채택**: MeshStateMixin + 커스텀 메서드 `this.fovCone` (신규 Mixin **없음**)

### 결정 근거

본 사이클은 **메인 루프의 "신규 Mixin 생성 금지" 정책**(`create-mixin-spec` / `implement-mixin` 호출 금지)에 따라 큐 설명에 명시된 `CameraFOVConeMixin`을 만들지 않고 **커스텀 메서드 `this.fovCone`로 완결**한다. ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙" 1차 — "단일 컴포넌트 전용 → 커스텀 메서드"에 따라 1차 구현은 커스텀 메서드. 큐 #30(Marker_RotationaCCTV/fieldOfView, PTZ 회전 동기화), #31(Marker_MoveCCTV/fieldOfView, 이동형), #32(Marker_AICCTV/ai_detectionZone, FOV 콘 + AI 감지객체 마커) 순으로 동일 기법(별도 ConeGeometry attach + setFov/setRange/setColor/setOpacity)이 재사용될 것이 확정적이므로 **2번째 컴포넌트(#30) 등록 시점에 Mixin 승격 검토** 시점에 도달하게 된다.

### Mixin 승격 후보 메모

향후 Mixin 승격 후보 — 큐 #30 Marker_RotationaCCTV/fieldOfView 등록 시점에 **CameraFOVConeMixin** 승격 검토. 본 변형의 API 형태(`setFov/setRange/setColor/setOpacity/enable/disable/destroy`)를 그대로 보존하면 호환 가능.

- **승격 후보 이름**: `CameraFOVConeMixin` (큐 설명 명시명 그대로)
- **흡수할 메서드**: `setFov/setRange/setColor/setOpacity/enable/disable/isEnabled/destroy`
- **#30/#31에서 추가될 차이점**:
  - #30 PTZ rotation: `setYaw(deg)`/`setPitch(deg)` 또는 `setRotation({yaw,pitch})` 추가 + 매 프레임 회전 동기화 RAF
  - #31 이동 추적: `attach(mesh)` + 매 프레임 mesh 위치 추적 RAF
- **MeshState color 채널과의 직교성**: fovCone은 별도 자체 mesh만 다루므로 sensor mesh의 `material.color`는 절대 건드리지 않는다 (sensorAlertDirection 동일 정책). MeshState 승계가 그대로 보존됨.

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

(Standard 답습)

### MeshState 채널과의 충돌 회피 정책

**원칙**: fovCone은 **자체 생성 mesh만** 사용한다. MeshStateMixin이 사용하는 `material.color`(MarkerFixedCCTV_A) 채널은 절대 건드리지 않는다.

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | `material.color` (×1 — MarkerFixedCCTV_A material) | 데이터 상태 색상 (Standard 승계) |
| fovCone (커스텀) | 별도 자체 `THREE.Mesh` (ConeGeometry + 반투명 MeshBasicMaterial) | 시야각 영역 시각화 — sensor mesh material 무관 |

두 채널이 직교 — MeshState는 sensor mesh의 색을, fovCone은 별도 콘 mesh를 다룬다. 정지 시 단순 visible=false, 종료 시 `geometry.dispose() + material.dispose() + parent.remove + this.fovCone = null` (self-null).

### 콘 형상

```
ConeGeometry(radius, height, radialSegments=32, heightSegments=1, openEnded=true)
  height = range
  radius = range * Math.tan(fov / 2)  // fov = 전체 각도(degrees)를 라디안으로 환산
```

`openEnded=true`로 base 면을 비워 내부가 보이도록(시야 영역 안쪽에 들어와 있는 객체가 시각적으로 가리지 않게) — Standard 마커 판이 콘 내부에 위치할 가능성 + scene의 다른 객체가 콘 영역 안에서도 자연스럽게 관찰되도록.

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

### 콘 위치/자세 결정

ConeGeometry는 기본적으로 +Y 축을 중심축으로 하며 base가 -Y, apex가 +Y에 위치한다. Fixed CCTV 마커의 "전방"을 +Z(또는 -Z) 방향으로 가정하고 콘을 누여 base가 카메라 위치, apex가 전방으로 향하도록 한다.

- group rotation: `rotateX(Math.PI/2)` 적용 시 +Y 축이 -Z 방향으로 누움 → base가 -Z(카메라 방향), apex가 +Z(전방). 또는 반대로 `rotateX(-Math.PI/2)` → apex가 -Z(전방). Marker_FixedCCTV는 판상형 마커이므로 카메라 모델 자체에 명확한 "전방"이 없으나, scene의 보안 영역을 직관적으로 표시하려면 Y(상)에서 본 시야각이 명확해야 한다 → 본 구현은 `rotateX(-Math.PI/2)`로 apex를 -Z로 보낸다 (필요 시 페이지가 `setRotationY(deg)`로 추가 회전 가능, 큐 #30에서 확장 예정).
- 위치: cone group의 origin은 base 면이 아니라 ConeGeometry 중심(높이의 절반 위치)이므로, base가 카메라 위치에 정확히 오도록 `cone.position += forward * (height / 2)` 평행이동.
  - 본 구현은 group을 한 단계 wrapping하여 `inner.geometry.translate(0, height/2, 0)`로 base를 origin에 맞춰 처리(geometry 단위 평행이동) 후 group을 카메라 mesh world position에 배치. height 변경(re-build) 시 geometry가 재생성되므로 translate는 매 rebuild마다 다시 적용.

### 위치 결정

- **앵커**: `MarkerFixedCCTV_A` mesh의 world position(getObjectByName + getWorldPosition)
- 본 변형은 **Fixed**이므로 mount 시점에 1회 산출하면 충분 (큐 #31 이동 추적은 별도 변형). 단, 페이지가 mesh를 옮긴 경우에 대비해 `enable()` 호출 시마다 위치 재산출.

### 커스텀 네임스페이스 `this.fovCone`

| 메서드 | 동작 |
|--------|------|
| `setFov(deg)` | 시야각 변경 (degrees, 0 < deg < 180). geometry 재생성(`_rebuild`) — radius·height 갱신 |
| `setRange(m)` | 사거리 변경 (height, m > 0). geometry 재생성(`_rebuild`) |
| `setColor(hex)` | 색상 변경 — `material.color.setHex` (number) 또는 `.set(string)` |
| `setOpacity(alpha)` | 알파 변경 (0~1). `material.opacity` + `material.transparent` 동기 |
| `enable()` | 자원 ensure(geometry/material/group lazy 생성) + parent에 add + `visible=true`. 동일 호출 중복은 no-op |
| `disable()` | `visible=false` (자원 유지 — 재활성 가능). 토글 빈도 높을 때 dispose/생성 비용 회피 |
| `isEnabled()` | 현재 활성 여부 (boolean) |
| `destroy()` | parent에서 remove + geometry.dispose + material.dispose + 모든 reference null + 마지막 줄 `this.fovCone = null` (self-null) |

#### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| fov | 60 (degrees) | 보안 카메라 일반적 화각 |
| range | 10 (m) | 마커 본체 크기(~6 단위)와 비슷한 스케일이므로 콘이 마커보다 약간 더 크게 형성되어 명확히 관찰 |
| color | 0x00ffff (시안) | scene 배경 #1a1a2e 위에서 명확히 대비 |
| opacity | 0.25 | 반투명 — 다른 객체와 겹쳐도 가독성 유지 |
| autoEnable on mount | true | preview 시각 관찰 우선 (chargeFlowArrow / leakAlarmPulse / sensorAlertDirection 동일 정책 — Phase 1.5 항목 #7) |

> **자동 enable 규약**: parent(scene 또는 appendElement)가 register 시점에 가용하면 즉시 enable + 콘 생성 + add. 가용하지 않으면 페이지가 직접 `enable()` 호출.

#### parent 결정 우선순위

```
1) this._fovConeParent       — 페이지/preview가 직접 주입 (scene)
2) this.appendElement        — GLTF 루트 (Marker_FixedCCTV gltf scene)
3) wemb.threeElements.scene  — 운영 환경 scene fallback
4) 둘 다 없으면 enable no-op (안전 가드)
```

> appendElement(GLTF 루트)에 add하면 root scale [1000, 1000, 1000]이 콘에도 적용되어 콘이 1000배 커진다. 반드시 **scene 직속**(`_fovConeParent` 또는 `wemb.threeElements.scene`)에 add 한다. position은 mesh world position을 산출하여 절대 좌표로 둔다 (sensorAlertDirection의 `_sensorAlertDirectionParent` 패턴 + GasDetector/sensorHud의 `_sphereParent` 패턴 답습).

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 색상 채널만) |

FOV 변경(시야각/사거리/색상)은 페이지가 외부 명령형으로 `setFov/setRange/setColor/setOpacity` 직접 호출. 별도 구독 없음 (BATT/dataHud, Chiller/fluidFlow, sensorAlertDirection 동일 정책).

### 이벤트 (customEvents)

없음. 개별 단위(meshName='MarkerFixedCCTV_A' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: MeshStateMixin 적용 + `this.fovCone` API 등록 + (parent 가용 시) **자동 enable** with `fov=60, range=10, color=0x00ffff, opacity=0.25` + equipmentStatus 구독(`meshState.renderData`)
- 페이지가 추가로 `_fovConeParent` 주입 후 `setFov/setRange/setColor/setOpacity/disable/enable` 외부 명령형 호출
- `beforeDestroy.js`: 구독 해제 → `this.fovCone?.destroy()` → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성 (register.js 차이 명시)

| 항목 | Standard | Advanced/fieldOfView |
|------|----------|----------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `this.fovCone` 네임스페이스 | 없음 | `setFov/setRange/setColor/setOpacity/enable/disable/isEnabled/destroy` 노출 |
| 자체 `THREE.Mesh`(ConeGeometry) | 없음 | 자체 생성 + scene attach + dispose |
| parent 결정 우선순위 (`_fovConeParent` → scene) | 없음 | 있음 (sensor mesh의 GLTF root scale [1000]에서 격리) |
| 자동 enable on mount | 없음 (단순 색상만) | 있음 — mount 직후 콘 시각 관찰 |
| beforeDestroy | meshState만 정리 | fovCone → meshState 역순 정리 |
| 화면 표시 | 단일 색상 마커 판 | 단일 색상 + 반투명 시야각 콘 |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/fieldOfView는 추가로 (a) 자체 ConeGeometry/MeshBasicMaterial 자원 (b) scene 직속 attach 절차 (c) `setFov/setRange/setColor/setOpacity` 외부 명령형 API — 세 채널을 페이지에 노출한다. register.js에 Mixin 적용 + 커스텀 메서드 + 자체 mesh 생성/dispose가 모두 추가되므로 별도 폴더로 분리한다.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.cctvInst = wemb.getDesignComponent('Marker_FixedCCTV');
this.cctvInst._fovConeParent = wemb.threeElements.scene;
this.cctvInst.fovCone.enable();   // register.js 자동 enable 한 경우 no-op

// 화각/사거리 외부 변경
this.cctvInst.fovCone.setFov(75);     // 광각 카메라
this.cctvInst.fovCone.setRange(15);   // 15m 사거리
this.cctvInst.fovCone.setColor(0xffaa00);   // 알람 시 주황
this.cctvInst.fovCone.setOpacity(0.4);

// 콘 일시 숨김 (자원 유지)
this.cctvInst.fovCone.disable();
```

---

## 모델 주의사항

- `models/Marker_FixedCCTV/01_default/Marker_FixedCCTV.gltf`의 단일 메시 이름은 `'MarkerFixedCCTV_A'`(언더스코어 + A)로 확정. fovCone은 `getObjectByName('MarkerFixedCCTV_A')`로 world position 산출 대상 mesh를 직접 조회.
- GLTF 루트 `root` Node가 `scale [1000, 1000, 1000]`이므로 콘을 GLTF 루트(`appendElement`)에 add 하면 1000배 확대된다. 반드시 **scene 직속**에 add (preview에서는 직접 `instance._fovConeParent = scene`을 주입; 운영에서는 `wemb.threeElements.scene` 자동 fallback).
- 콘은 `MarkerFixedCCTV_A` mesh의 world position을 절대 좌표로 사용하므로, root scale 효과를 거친 실제 화면 위치(±5.94 × ±6.86 × ±0.20 단위)에 정확히 정렬됨.
- **[MODEL_READY] placeholder 사용 안 함** — meshName='MarkerFixedCCTV_A'는 컴포넌트 루트 CLAUDE.md / Standard register.js에서 이미 확정.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 |
| 2 | self-null `this.fovCone = null` | OK — destroy 마지막 줄 |
| 3 | beforeDestroy.js는 호출만 | OK — `this.fovCone?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachFovCone(inst)` 내부 destroy도 `inst.fovCone = null` 포함 + geometry/material dispose + parent.remove |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setFov/setRange/setColor/setOpacity/enable/disable/isEnabled/destroy` (sensorAlertDirection의 `setAlert/setWaveOptions/...`와 동사 형태 일관 — `set*/enable/disable/destroy`) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview FOV 슬라이더 deg ↔ `setFov(deg)`, range 슬라이더 m ↔ `setRange(m)`, opacity 슬라이더 0~1 ↔ `setOpacity(alpha)`, color picker ↔ `setColor(hex)` |
| 7 | 기본값 시각적 관찰 가능성 | OK — preview 로드 직후 자동 enable + fov=60° + range=10m + opacity=0.25 + color=0x00ffff 시안으로 마커 위에 명확히 관찰. 마커 본체(~6 단위)와 비슷한 스케일이라 콘이 묻히지 않음 |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

---

## 발견한 문제 / Mixin 승격 후보

- **Mixin 승격 후보**: 큐 #30 (Marker_RotationaCCTV/fieldOfView, PTZ 회전 동기화) 등록 시점에 동일 기법(자체 ConeGeometry + setFov/setRange/setColor/setOpacity)이 2번째로 적용된다. ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙"의 **승격 시점 신호**(2번째 컴포넌트 등록)에 도달할 예정.
  - **승격 후보 이름**: `CameraFOVConeMixin` (큐 설명 명시명 그대로 보존)
  - **API 호환성**: 현 시그니처(`setFov/setRange/setColor/setOpacity/enable/disable/isEnabled/destroy`) 그대로 흡수 가능
  - **#30/#31/#32 확장 시 추가 메서드**: `setRotation({yaw,pitch})`(PTZ), `attach(mesh)`(이동 추적). 본 변형은 Fixed이므로 미포함 — 향후 Mixin 옵션화 가능
  - **본 사이클은 신규 Mixin 금지 정책으로 커스텀 메서드 유지** — 메인 루프 외부에서 사용자가 `create-mixin-spec` → `implement-mixin` 호출로 승격 권장 (3번째 동일 기법 등록 시점 권장)
- **scene parent 강제 정책**: GLTF root scale [1000, 1000, 1000]이 콘에 전파되지 않도록 반드시 `_fovConeParent` 또는 `wemb.threeElements.scene`에 add. appendElement(GLTF 루트) fallback은 콘이 1000배 확대되어 의도치 않은 결과를 만들 수 있으므로 안전 가드만 두고 실 사용은 권장하지 않는다 (preview에서도 항상 `instance._fovConeParent = scene` 명시).
- **Fixed/Rotation/Move 분리 유지**: 본 변형은 정적이므로 RAF 회전/추적 루프 없음. 이 차이가 #30/#31/#32와의 분리 정당성 핵심이며, 동일 폴더에 두지 않는다.
