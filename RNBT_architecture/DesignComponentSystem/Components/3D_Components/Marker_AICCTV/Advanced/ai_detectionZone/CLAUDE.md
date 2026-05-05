# Marker_AICCTV — Advanced/ai_detectionZone

## 기능 정의

1. **상태 색상 표시 (Standard 승계)** — equipmentStatus 토픽으로 수신한 데이터에 따라 'MarkerAICCTV_A' Mesh의 단일 material(`Material #30`) 색상 변경 (`material.color` 채널). Standard와 동일한 colorMap 사용.
2. **반투명 시야각 콘 시각화 (FOV 채널, #29~#31 답습)** — Marker_AICCTV mesh 위치를 기준으로 별도의 자체 `THREE.Mesh`(`ConeGeometry`)를 scene에 attach하여 AI CCTV의 시야각(field of view) 영역을 반투명 원뿔로 표현
   - `ConeGeometry(radius, height, radialSegments=32, heightSegments=1, openEnded=true)` — `radius = height * tan(fovHalfAngleRad)`
   - `MeshBasicMaterial({ color, transparent:true, opacity, side:DoubleSide, depthWrite:false })`
   - geometry 단계에서 `translate(0, height/2, 0)` + `rotateX(-Math.PI/2)` 베이크 → base가 origin(카메라 위치), apex가 `-Z`(전방).
3. **PTZ rotation 동기화 (#30 답습)** — pan/tilt 외부 명령형 회전 (mesh.rotation.y/x 직접 갱신). 트랙 회전 모드(`setTrackRotation(true)`)는 추적 대상 mesh의 world quaternion 기반 합성.
4. **이동 추적 RAF 선택적 사용 (#31 답습)** — AI CCTV는 고정형/이동형 둘 다 가능. `attach(mesh)`로 추적 대상을 지정하면 RAF가 매 프레임 cone position을 따라가게 한다. 미지정 시 mount 시점 1회 산출.
5. **AI 감지 마커 스폰 (본 변형 핵심 차이점)** — 별도 커스텀 네임스페이스 `this.aiMarkers`로 구현. type별 색상/형상 매핑(`person`=빨강 sphere, `vehicle`=주황 box, `unknown`=회색 sphere)으로 AI 감지 객체를 3D 마커로 표시. id 키 기반 add/remove/clear, ttl 만료 자동 제거(단일 RAF), label 옵션(CanvasTexture sprite). FOV 콘과 완전히 직교한 별도 자원 채널.
6. **외부 명령형 API** — 페이지가 `instance.fovCone.*` (콘 제어) + `instance.aiMarkers.*` (AI 마커 제어)를 모두 직접 호출.

---

## Marker_AICCTV mesh 구조

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/Marker_AICCTV/01_default/Marker_AICCTV.gltf` |
| mesh 이름 | `MarkerAICCTV_A` (폴더명 `Marker_AICCTV`와 **구분자 위치 + 접미 불일치** — 폴더는 중간 언더스코어, Node는 언더스코어 제거 + 뒤쪽 `_A` 접미) |
| 결정 | **단일 mesh** (Standard와 동일) |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh: MarkerAICCTV_A)`와 일치. `getObjectByName`은 이름을 그대로 비교하므로 반드시 `'MarkerAICCTV_A'`(언더스코어 제거 + A)로 조회.

---

## #29~#31 답습 명시 + AI 마커 차별점

본 변형은 **직전 사이클 #29(Marker_FixedCCTV/fieldOfView), #30(Marker_RotationaCCTV/fieldOfView), #31(Marker_MoveCCTV/fieldOfView)의 답습**이며, 다음만 차이가 난다:

1. **컴포넌트/메시 이름**: `MarkerMoveCCTV_A` → `MarkerAICCTV_A`
2. **AI 감지 마커 스폰 추가**: 별도 커스텀 네임스페이스 `this.aiMarkers`로 add/remove/clear/setTypeStyle/list/enable/disable/destroy + ttl 만료 RAF
3. **preview UI**: AI 마커 데모 컨트롤(Add Person / Add Vehicle / Add Unknown / Clear / TTL 토글)이 추가됨

**큐 설명**: "FOV 콘 + AI 감지객체 3D 마커 스폰 (CameraFOVConeMixin+커스텀 메서드)"

**실제 채택**: MeshStateMixin + 커스텀 메서드 `this.fovCone` (FOV 콘) + 커스텀 메서드 `this.aiMarkers` (AI 마커 스폰) — 신규 Mixin **없음**

### 결정 근거

본 사이클은 **메인 루프의 "신규 Mixin 생성 금지" 정책**에 따라 큐 설명에 명시된 `CameraFOVConeMixin`을 만들지 않고 **두 개의 독립 커스텀 메서드 네임스페이스**로 완결한다. FOV 콘은 #29~#31의 코드를 그대로 답습하여 검증된 시그니처를 유지하고, AI 마커 스폰은 본 컴포넌트 전용 신규 채널로 분리한다.

### Mixin 승격 메모 (필수)

> **CameraFOVConeMixin 승격 강력 권장 — #29~#32 4개 컴포넌트 동일 기법 확정. AI 마커 스폰은 본 컴포넌트 전용으로 잠정 커스텀 유지, 향후 LPR/IRISID에서 동일 기법 등장 시 별도 Mixin 승격 검토.**

- **FOV 콘**: 큐 #29(Fixed) + #30(Rotationa) + #31(Move) + #32(본 변형) = **4개 컴포넌트에서 동일 기법 확인**으로 임계점을 명백히 초과. 사용자가 메인 루프 외부에서 `create-mixin-spec` → `implement-mixin`으로 `CameraFOVConeMixin` 승격을 강력 권장.
- **AI 마커 스폰**: 본 컴포넌트 전용으로 보이지만, 만약 다른 컴포넌트(예: LPR plate marker, IRISID detection marker)에서 동일 기법이 등장하면 `WorldMarkerSpawnMixin`로 별도 승격 검토 가능 (큐 #33 IRISID/detectionMarker, #34 LPR/plateDetectionOverlay가 후보).
- **흡수할 메서드 (FOV 콘)**: `setFov/setRange/setColor/setOpacity/setPan/setTilt/setRotation/attach/detach/setTrackRotation/isTracking/enable/disable/isEnabled/getFov/getRange/getColor/getOpacity/getPan/getTilt/destroy`
- **흡수할 메서드 (AI 마커, 후보)**: `add/remove/clear/setTypeStyle/list/enable/disable/isEnabled/destroy`

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.fovCone` + 커스텀 메서드 `this.aiMarkers` (신규 Mixin 없음)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

(Standard 답습 — #29/#30/#31과 동일)

### MeshState 채널과의 충돌 회피 정책

**원칙**: fovCone과 aiMarkers는 **자체 생성 mesh만** 사용한다. MeshStateMixin이 사용하는 `material.color`(MarkerAICCTV_A) 채널은 절대 건드리지 않는다.

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | `material.color` (×1 — MarkerAICCTV_A material) | 데이터 상태 색상 (Standard 승계) |
| fovCone (커스텀) | 별도 자체 `THREE.Mesh` (ConeGeometry + 반투명 MeshBasicMaterial) | 시야각 영역 시각화 + PTZ 회전 + 선택적 이동 추적 |
| aiMarkers (커스텀) | 별도 자체 `THREE.Mesh` × N (Sphere/Box + MeshBasicMaterial) + 선택적 Sprite(CanvasTexture) | AI 감지 객체 3D 마커 (id 키 기반 add/remove/clear, ttl 만료) |

세 채널이 직교 — MeshState는 sensor mesh의 색을, fovCone은 별도 콘 mesh를, aiMarkers는 별도 mesh 풀(Map 기반)을 다룬다.

### 콘 형상 / 위치 / PTZ / RAF 추적 (#29~#31 답습)

#29~#31에서 검증된 코드를 그대로 답습. 자세한 알고리즘은 `Marker_MoveCCTV/Advanced/fieldOfView/CLAUDE.md` 참조.

### AI 감지 마커 스폰 (본 변형 핵심)

#### 자원

| 자원 | type별 매핑 |
|------|-------------|
| sphere geometry | `person`, `unknown` (반지름 0.3) |
| box geometry | `vehicle` (0.4 × 0.4 × 0.4) |
| material | `MeshBasicMaterial({ transparent:true, opacity:0.85 })` 인스턴스 per marker |
| label sprite | optional — `THREE.Sprite(SpriteMaterial(map=CanvasTexture))` (cellHeatmap/heatmapSurface 답습) |

각 type별 기본 스타일:

| type | color | shape | size |
|------|-------|-------|------|
| `person` | 0xff3030 | sphere | 0.3 |
| `vehicle` | 0xff8800 | box | 0.4 |
| `unknown` | 0x9ca3af | sphere | 0.3 |

`setTypeStyle(type, { color, shape, size })`로 사전 등록/덮어쓰기 가능.

#### 구조 (Map 기반)

내부 `markerPool: Map<id, { mesh, geometry, material, sprite?, spriteCanvas?, spriteTexture?, expireAt }>`. id 키로 add/remove를 처리한다. 같은 id로 add 호출 시 기존 자원 dispose 후 새로 생성.

#### 만료 RAF (idle 일시정지)

ttl(ms) 지정 시 `expireAt = performance.now() + ttl`. 단일 RAF가 매 프레임 모든 marker를 검사하여 expireAt를 초과한 entry를 자동 remove. **markerPool이 0개로 비어있으면 RAF 일시 정지(idle 비용 0)**, add 호출 시 다시 시작.

#### 위치

`add({ position: { x, y, z } })` world 좌표 그대로 적용. 카메라 marker 위치 기준 상대 좌표가 필요하면 사용자가 미리 계산하여 전달.

#### parent 결정 우선순위 (FOV 콘과 동일 fallback 체인)

```
1) this._aiMarkersParent      — 페이지/preview 직접 주입
2) wemb.threeElements.scene   — 운영 환경 자동
3) this.appendElement         — GLTF 루트 fallback (root scale [1000] 영향, 권장하지 않음)
4) 둘 다 없으면 add no-op (안전 가드)
```

### 커스텀 네임스페이스 `this.fovCone` (#29~#31 답습)

| 메서드 | 동작 |
|--------|------|
| `setFov/setRange/setColor/setOpacity` | 콘 형상/색상/투명도 |
| `setPan/setTilt/setRotation` | PTZ 회전 |
| `attach(mesh)/detach()/setTrackRotation/isTracking` | 이동 추적 RAF |
| `enable/disable/isEnabled` | 자원 visible 토글 |
| `getFov/getRange/getColor/getOpacity/getPan/getTilt` | 현재 값 조회 |
| `destroy` | RAF cancel + dispose + self-null `this.fovCone = null` |

### 커스텀 네임스페이스 `this.aiMarkers` (본 변형 신규)

| 메서드 | 동작 |
|--------|------|
| `add({ id, position, type, label, ttl })` | id 키로 마커 추가/갱신. type별 색상/형상 매핑. ttl(ms) 지정 시 expireAt 설정 |
| `remove(id)` | 해당 마커 즉시 제거 + dispose |
| `clear()` | 모든 마커 제거 + dispose |
| `setTypeStyle(type, { color, shape, size })` | type별 스타일 사전 등록/덮어쓰기 |
| `list()` | 현재 살아있는 id 배열 |
| `enable() / disable() / isEnabled()` | 자원 visible 토글 (기본 enabled=true) |
| `destroy()` | clear + 만료 RAF cancel + self-null `this.aiMarkers = null` |

#### add 입력 포맷

```javascript
{
    id:       string,                           // 필수 — 키
    position: { x: number, y: number, z: number },  // world 좌표
    type:     'person' | 'vehicle' | 'unknown',     // 기본 'unknown'
    label:    string | null,                        // 선택 — Sprite로 위에 표시
    ttl:      number | null                         // ms, 미지정 시 영구
}
```

### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| fov | 60 (degrees) | 보안 카메라 일반적 화각 |
| range | 10 (m) | 마커 본체 크기와 비슷한 스케일 |
| color | 0x00ffff (시안) | scene 배경 위에서 명확히 대비 |
| opacity | 0.25 | 반투명 |
| pan | 0° | 정면 |
| tilt | -10° | 약간 아래쪽 |
| autoEnable on mount (fovCone) | true | preview 시각 관찰 우선 |
| autoEnable on mount (aiMarkers) | true | 즉시 add 가능 |
| 데모 마커 (preview only) | 1~2개 즉시 스폰 | 콘 내부에 보이도록 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 색상 채널만) |

FOV/PTZ/추적/AI 마커 변경은 페이지가 외부 명령형으로 직접 호출. 별도 구독 없음.

### 이벤트 (customEvents)

없음. 개별 단위(meshName='MarkerAICCTV_A' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: MeshStateMixin 적용 + `this.fovCone` API 등록 + `this.aiMarkers` API 등록 + (parent 가용 시) **자동 enable** with 기본값 + equipmentStatus 구독
- 페이지가 추가로 `_fovConeParent` / `_aiMarkersParent` 주입 후 `attach(mesh)` / `aiMarkers.add(...)` 외부 명령형 호출
- `beforeDestroy.js`: 구독 해제 → `this.fovCone?.destroy()` → `this.aiMarkers?.destroy()` → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/ai_detectionZone |
|------|----------|---------------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `this.fovCone` 네임스페이스 | 없음 | 노출 |
| `this.aiMarkers` 네임스페이스 | 없음 | 노출 (본 변형 신규) |
| 자체 ConeGeometry mesh | 없음 | 자체 생성 + scene attach + dispose |
| 자체 marker mesh 풀 (Map 기반, type별 sphere/box) | 없음 | 있음 |
| ttl 만료 RAF (idle 일시정지) | 없음 | 있음 |
| 자동 enable on mount | 없음 | 있음 |
| beforeDestroy | meshState만 정리 | fovCone → aiMarkers → meshState 역순 정리 |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/ai_detectionZone는 추가로 (a) 자체 ConeGeometry 자원, (b) 자체 marker mesh 풀(다중, type별), (c) 만료 RAF, (d) `setFov/...`/`add/remove/clear/...` 외부 명령형 API — 네 채널을 페이지에 노출한다. register.js에 두 개의 독립 커스텀 네임스페이스 + 자체 mesh 생성/dispose가 모두 추가되므로 별도 폴더로 분리한다.

---

## #31(Move) 대비 차이 요약

| 항목 | #31 Marker_MoveCCTV/fieldOfView | #32 Marker_AICCTV/ai_detectionZone (본 변형) |
|------|-------------------------------|---------------------------------------------|
| meshName | `MarkerMoveCCTV_A` | `MarkerAICCTV_A` |
| material | `Material #43` | `Material #30` |
| FOV 콘 (this.fovCone) | 있음 | 있음 (#31 답습 — PTZ + 선택적 RAF 추적 모두 보존) |
| **AI 마커 스폰 (this.aiMarkers)** | **없음** | **있음 — id 키 add/remove/clear, type별 매핑, ttl 만료 RAF, 선택 label sprite** |
| preview UI | fov/range/opacity/color/pan/tilt + 추적 토글 + 데모 이동 토글 | + AI 마커 데모 컨트롤 (Add Person/Vehicle/Unknown / Clear / TTL 토글) |

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.cctvInst = wemb.getDesignComponent('Marker_AICCTV');
this.cctvInst._fovConeParent  = wemb.threeElements.scene;
this.cctvInst._aiMarkersParent = wemb.threeElements.scene;
this.cctvInst.fovCone.enable();
// (선택) 이동형이라면 추적 시작
const markerMesh = this.cctvInst.appendElement.getObjectByName('MarkerAICCTV_A');
this.cctvInst.fovCone.attach(markerMesh);

// AI 데이터 토픽 어댑터
const onAIDetection = (data) => {
    // data: [{ id, type, position, label, ttl }, ...]
    data.forEach(d => this.cctvInst.aiMarkers.add(d));
};

// 화각/사거리/PTZ 외부 변경
this.cctvInst.fovCone.setFov(75);
this.cctvInst.fovCone.setPan(45);

// AI 마커 즉시 제어
this.cctvInst.aiMarkers.setTypeStyle('person', { color: 0xff00ff });
this.cctvInst.aiMarkers.add({ id: 'p-001', position: {x:2,y:0,z:1}, type:'person', label:'Person 001', ttl: 5000 });
this.cctvInst.aiMarkers.remove('p-001');
this.cctvInst.aiMarkers.clear();
```

---

## 모델 주의사항

- `models/Marker_AICCTV/01_default/Marker_AICCTV.gltf`의 단일 메시 이름은 `'MarkerAICCTV_A'`(언더스코어 제거 + A)로 확정. fovCone은 `getObjectByName('MarkerAICCTV_A')`로 world position 산출.
- GLTF 루트 `root` Node가 `scale [1000, 1000, 1000]`이므로 콘과 AI 마커를 GLTF 루트(`appendElement`)에 add 하면 1000배 확대된다. 반드시 **scene 직속**에 add (preview에서는 직접 `instance._fovConeParent = scene`, `instance._aiMarkersParent = scene` 주입; 운영에서는 `wemb.threeElements.scene` 자동 fallback).
- **[MODEL_READY] placeholder 사용 안 함** — meshName='MarkerAICCTV_A'는 컴포넌트 루트 CLAUDE.md / Standard register.js에서 이미 확정.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 (#29~#31 답습) |
| 2 | self-null `this.fovCone = null` + `this.aiMarkers = null` + RAF cancel | OK — 두 destroy 마지막 줄 self-null + RAF cancelAnimationFrame + null |
| 3 | beforeDestroy.js는 호출만 | OK — `this.fovCone?.destroy(); this.aiMarkers?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachFovCone(inst)` / `attachAiMarkers(inst)` 내부 destroy도 RAF cancel + `inst.fovCone = null` / `inst.aiMarkers = null` 포함 + dispose + parent.remove |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — fovCone은 #31 그대로, aiMarkers는 add/remove/clear/setTypeStyle/list/enable/disable/destroy (동사 일관, alarmPulse/sensorAlertDirection 풀 dispose 패턴 답습) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview FOV deg ↔ `setFov`, range m ↔ `setRange`, opacity 0~1 ↔ `setOpacity`, color ↔ `setColor`, pan deg ↔ `setPan`, tilt deg ↔ `setTilt`, AI Add 버튼 ↔ `aiMarkers.add(...)`, Clear 버튼 ↔ `aiMarkers.clear()`, TTL 토글 ↔ ttl 옵션 |
| 7 | 기본값 시각 관찰 | OK — preview 로드 직후 자동 enable + fov=60° + range=10m + opacity=0.25 + color=0x00ffff + pan=0° + tilt=-10° + **데모 AI 마커 1~2개 즉시 스폰**(person + vehicle)으로 콘 내부에 보임 |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

---

## 발견한 문제 / Mixin 승격 후보

- **Mixin 승격 강력 권장 (FOV 콘, 4번째 동일 기법 도달)**: 큐 #29~#32 4개 컴포넌트에서 동일 기법 확정. ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙"의 **승격 시점 신호(2번째 컴포넌트 등록)를 명백히 초과** — 사용자가 메인 루프 외부에서 즉시 `CameraFOVConeMixin` 승격을 강력 권장.
- **AI 마커 스폰 — 본 컴포넌트 전용**: 큐 #33(IRISID/detectionMarker), #34(LPR/plateDetectionOverlay)에서 동일 기법이 등장하면 `WorldMarkerSpawnMixin`(가칭) 별도 승격 검토. 본 사이클은 단일 컴포넌트 전용으로 커스텀 메서드 유지.
- **scene parent 강제 정책**: GLTF root scale [1000, 1000, 1000]이 두 채널(콘 + AI 마커)에 전파되지 않도록 반드시 scene 직속에 add. appendElement(GLTF 루트) fallback은 1000배 확대되어 의도치 않은 결과를 만들 수 있으므로 안전 가드만 두고 실 사용은 권장하지 않는다.
- **RAF 메모리 누수 방지 (두 채널 모두)**: fovCone destroy에서 추적 RAF cancel + null. aiMarkers destroy에서 만료 RAF cancel + null. markerPool이 0개로 비어있으면 RAF 일시 정지하여 idle 비용 0으로.
