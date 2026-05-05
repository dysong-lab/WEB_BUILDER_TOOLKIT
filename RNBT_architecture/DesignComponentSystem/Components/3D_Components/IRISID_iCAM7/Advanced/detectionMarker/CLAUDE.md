# IRISID_iCAM7 — Advanced/detectionMarker

## 기능 정의

1. **상태 색상 표시 (Standard 승계)** — equipmentStatus 토픽으로 수신한 데이터에 따라 `icam7` Mesh의 단일 material 색상 변경 (`material.color` 채널). Standard와 동일한 colorMap 사용.
2. **홍채/얼굴 인식 결과 마커 스폰 (본 변형 핵심)** — 별도 커스텀 네임스페이스 `this.detectionMarkers`로 구현. type별 색상/형상 매핑(`success`=녹색 sphere, `failure`=빨강 sphere, `unknown`=회색 sphere)으로 인식 결과를 3D 마커로 임시 표시. id 키 기반 add/remove/clear, ttl 만료 자동 제거(단일 RAF), label 옵션(CanvasTexture sprite — 인식자 이름 또는 신뢰도). position 미지정 시 카메라 mesh 정면(forward) 1.2m fallback 자동 배치.
3. **외부 명령형 API** — 페이지가 `instance.detectionMarkers.*`(인식 마커 제어)를 직접 호출. 인식 이벤트 어댑터에서 add 호출 → ttl 만료 후 자동 소멸.

---

## icam7 mesh 구조

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/IRISID_iCAM7/01_default/IRISID_iCAM7.gltf` |
| mesh 이름 | `icam7` (폴더명 `IRISID_iCAM7`과 **대소문자 + 구분자 위치 불일치** — 폴더는 카멜 + 언더스코어, Node는 소문자 단일 토큰) |
| 결정 | **단일 mesh** (Standard와 동일) |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh: icam7)`와 일치. `getObjectByName`은 이름을 그대로 비교하므로 반드시 `'icam7'`(소문자)로 조회.

---

## #32 답습 명시 + 차별점

본 변형은 **직전 사이클 #32 (`Marker_AICCTV/Advanced/ai_detectionZone`)의 `aiMarkers` 네임스페이스 답습**이며, 다음만 차이가 난다:

1. **컴포넌트/메시 이름**: `MarkerAICCTV_A` → `icam7`
2. **FOV 콘 제거**: 본 변형은 마커 스폰만 — `fovCone` 채널 전체 제거 (단순화)
3. **type 의미 차이**: `person`/`vehicle`/`unknown` → `success`/`failure`/`unknown`
   - `success` (녹색 0x00ff66 sphere): 홍채/얼굴 인식 성공 — 인식자 이름 또는 신뢰도 표시
   - `failure` (빨강 0xff3344 sphere): 인식 실패 — 신뢰도 미달 또는 등록되지 않은 사용자
   - `unknown` (회색 0x888888 sphere): 분류 불가 또는 처리 중 상태
4. **ttl 기본값**: 인식 마커는 임시 표시이므로 사용자가 `ttl` 미지정 시 기본값 3000ms 자동 소멸 (#32는 미지정 시 영구). 사용자가 명시적으로 `ttl: null` 또는 `ttl: 0`을 지정하면 영구.
5. **position fallback**: 사용자가 `position` 미지정 시 카메라 mesh world position + forward 방향 1.2m 자동 배치 (#32는 position 미지정 시 add 거부).
6. **단일 네임스페이스**: `this.detectionMarkers` (변형 이름과 일치)

**큐 설명**: "홍채/얼굴 인식 성공/실패 위치 임시 마커 (MeshState+커스텀 메서드)"

**실제 채택**: MeshStateMixin + 커스텀 메서드 `this.detectionMarkers` (인식 마커 스폰) — 신규 Mixin **없음**

### 결정 근거

본 사이클은 **메인 루프의 "신규 Mixin 생성 금지" 정책**에 따라 #32의 `aiMarkers` 코드를 답습하여 검증된 시그니처를 유지하며, FOV 콘은 본 변형의 의미(인식 결과 임시 마커만)와 무관하므로 제거하여 단순화한다.

### Mixin 승격 메모 (필수)

> **WorldMarkerSpawnMixin 승격 후보 — 큐 #32 Marker_AICCTV/aiMarkers + 본 변형 = 2개 임계점. 향후 LPR plate marker / 기타 위치 마커 등장 시 즉시 승격 검토. add/remove/clear/setTypeStyle/list/enable/disable/destroy 시그니처를 그대로 흡수 가능.**

- **WorldMarkerSpawnMixin 후보**: id 키 풀 + type별 매핑 + ttl 만료 RAF idle 일시정지 + 선택 label sprite 패턴이 #32 + 본 변형 2개 컴포넌트에서 확인됨. ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙"의 **승격 시점 신호(2번째 컴포넌트 등록)에 도달**. 향후 큐 #34(LPR/plateDetectionOverlay) 등에서 동일 기법이 등장하면 즉시 사용자가 메인 루프 외부에서 `create-mixin-spec` → `implement-mixin`으로 승격.
- **흡수할 메서드**: `add({ id?, position?, type, label, ttl }) / remove(id) / clear() / setTypeStyle(type, { color, shape, size, opacity }) / list() / enable() / disable() / isEnabled() / destroy()`
- **흡수할 옵션**: type별 default style 등록 + position fallback policy(카메라 mesh forward 거리) + ttl default policy

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.detectionMarkers` (신규 Mixin 없음)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

(Standard 답습 — 동일)

### MeshState 채널과의 충돌 회피 정책

**원칙**: detectionMarkers는 **자체 생성 mesh만** 사용한다. MeshStateMixin이 사용하는 `material.color`(icam7) 채널은 절대 건드리지 않는다.

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | `material.color` (×1 — icam7 material) | 데이터 상태 색상 (Standard 승계) |
| detectionMarkers (커스텀) | 별도 자체 `THREE.Mesh` × N (Sphere + MeshBasicMaterial) + 선택적 Sprite(CanvasTexture) | 인식 결과 임시 3D 마커 (id 키 add/remove/clear, ttl 만료) |

두 채널이 직교 — MeshState는 sensor mesh의 색을, detectionMarkers는 별도 mesh 풀(Map 기반)을 다룬다.

### 인식 결과 마커 스폰 (본 변형 핵심)

#### 자원

| 자원 | type별 매핑 |
|------|-------------|
| sphere geometry | `success`, `failure`, `unknown` (반지름 0.3) |
| material | `MeshBasicMaterial({ transparent:true, opacity })` 인스턴스 per marker |
| label sprite | optional — `THREE.Sprite(SpriteMaterial(map=CanvasTexture))` |

각 type별 기본 스타일:

| type | color | shape | size | opacity |
|------|-------|-------|------|---------|
| `success` | 0x00ff66 | sphere | 0.3 | 0.9 |
| `failure` | 0xff3344 | sphere | 0.3 | 0.9 |
| `unknown` | 0x888888 | sphere | 0.3 | 0.7 |

`setTypeStyle(type, { color, shape, size, opacity })`로 사전 등록/덮어쓰기 가능.

#### 구조 (Map 기반)

내부 `markerPool: Map<id, { mesh, geometry, material, sprite?, spriteCanvas?, spriteTexture?, spriteMaterial?, expireAt }>`. id 키로 add/remove를 처리한다. 같은 id로 add 호출 시 기존 자원 dispose 후 새로 생성. id 미지정 시 자동 생성(`auto-${counter}`).

#### 만료 RAF (idle 일시정지)

ttl(ms) 지정 시 `expireAt = performance.now() + ttl`. ttl 미지정 시 기본 3000ms 자동 적용 (인식 마커는 임시 표시 의미). 명시적으로 `ttl: null` 또는 `ttl: 0`/`ttl: -1`을 전달하면 영구. 단일 RAF가 매 프레임 모든 marker를 검사하여 expireAt 초과한 entry를 자동 remove. **markerPool이 0개로 비어있으면 RAF 일시 정지(idle 비용 0)**, add 호출 시 다시 시작.

#### 위치 fallback

`add({ position })`에서 position 미지정 시:
1. 카메라 mesh(`icam7`) world position 산출
2. 카메라 mesh의 forward 방향(local -Z를 world로 변환) × 1.2m
3. (1) + (2) = 자동 fallback 좌표

mesh 미발견 또는 THREE 미가용 시 `(0, 0, 0)` 사용. 사용자가 `position: { x, y, z }` 명시 시 그대로 사용.

#### parent 결정 우선순위 (#32 동일 fallback 체인)

```
1) this._detectionMarkersParent — 페이지/preview 직접 주입
2) wemb.threeElements.scene     — 운영 환경 자동
3) this.appendElement           — GLTF 루트 fallback (root scale [1000] 영향, 권장 X)
4) 둘 다 없으면 add no-op (안전 가드)
```

### 커스텀 네임스페이스 `this.detectionMarkers`

| 메서드 | 동작 |
|--------|------|
| `add({ id?, position?, type, label, ttl })` | id 미지정 시 auto 생성, position 미지정 시 카메라 forward 1.2m fallback. type별 색상/형상 매핑. ttl 미지정 시 기본 3000ms |
| `remove(id)` | 해당 마커 즉시 제거 + dispose |
| `clear()` | 모든 마커 제거 + dispose |
| `setTypeStyle(type, { color, shape, size, opacity })` | type별 스타일 사전 등록/덮어쓰기 |
| `list()` | 현재 살아있는 id 배열 |
| `enable() / disable() / isEnabled()` | 자원 visible 토글 (기본 enabled=true) |
| `destroy()` | clear + 만료 RAF cancel + self-null `this.detectionMarkers = null` |

#### add 입력 포맷

```javascript
{
    id?:       string | undefined,                  // 미지정 시 'auto-${counter}'
    position?: { x: number, y: number, z: number }, // 미지정 시 카메라 forward 1.2m fallback
    type:      'success' | 'failure' | 'unknown',   // 기본 'unknown'
    label?:    string | null,                       // 선택 — Sprite로 위에 표시 (인식자 이름 / 신뢰도)
    ttl?:      number | null                        // ms, 미지정 시 3000ms / null·0·-1 시 영구
}
```

### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| TTL_DEFAULT | 3000 (ms) | 인식 마커 임시 표시 |
| FORWARD_FALLBACK | 1.2 (m) | 카메라 정면 자동 배치 |
| autoEnable on mount | true | 즉시 add 가능 |
| 데모 마커 (preview only) | success + failure 1개씩 즉시 스폰 | 시각 관찰성 우선 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 색상 채널만) |

마커 변경은 페이지가 외부 명령형으로 직접 호출. 별도 구독 없음.

### 이벤트 (customEvents)

없음. 개별 단위(meshName='icam7' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: MeshStateMixin 적용 + `this.detectionMarkers` API 등록 + (parent 가용 시) **자동 enable** + equipmentStatus 구독
- 페이지가 추가로 `_detectionMarkersParent` 주입 후 `detectionMarkers.add(...)` 외부 명령형 호출
- `beforeDestroy.js`: 구독 해제 → `this.detectionMarkers?.destroy()` → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/detectionMarker |
|------|----------|--------------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `this.detectionMarkers` 네임스페이스 | 없음 | 노출 (본 변형 신규) |
| 자체 marker mesh 풀 (Map 기반, type별 sphere) | 없음 | 있음 |
| ttl 만료 RAF (idle 일시정지) | 없음 | 있음 |
| 자동 enable on mount | 없음 | 있음 |
| beforeDestroy | meshState만 정리 | detectionMarkers → meshState 역순 정리 |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/detectionMarker는 추가로 (a) 자체 marker mesh 풀(다중, type별), (b) 만료 RAF + idle 일시정지, (c) `add/remove/clear/...` 외부 명령형 API — 세 채널을 페이지에 노출한다. register.js에 독립 커스텀 네임스페이스 + 자체 mesh 생성/dispose가 추가되므로 별도 폴더로 분리한다.

---

## #32 대비 차이 요약

| 항목 | #32 Marker_AICCTV/ai_detectionZone | #33 IRISID_iCAM7/detectionMarker (본 변형) |
|------|-----------------------------------|------------------------------------------|
| meshName | `MarkerAICCTV_A` | `icam7` |
| FOV 콘 (this.fovCone) | 있음 | **없음 (제거 — 단순화)** |
| 마커 스폰 네임스페이스 | `this.aiMarkers` | `this.detectionMarkers` |
| type 종류 | person / vehicle / unknown | success / failure / unknown |
| type 형상 | sphere / box / sphere | sphere / sphere / sphere |
| type 색상 | 빨강 / 주황 / 회색 | 녹색 / 빨강 / 회색 |
| label 의미 | 객체 분류 라벨 | 인식자 이름 또는 신뢰도 |
| ttl 기본값 | 미지정 시 영구 | 미지정 시 3000ms 자동 소멸 |
| position fallback | 미지정 시 add 거부 | 미지정 시 카메라 forward 1.2m 자동 배치 |
| preview UI | FOV 슬라이더 + AI 마커 데모 | 마커 데모만 (FOV 영역 제거) |

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.cameraInst = wemb.getDesignComponent('IRISID_iCAM7');
this.cameraInst._detectionMarkersParent = wemb.threeElements.scene;

// 인식 이벤트 토픽 어댑터
const onIrisRecognition = (data) => {
    // data: { recognized: bool, userName, confidence, position?, id? }
    this.cameraInst.detectionMarkers.add({
        id:       data.id,
        type:     data.recognized ? 'success' : 'failure',
        label:    data.userName || data.confidence?.toFixed(2),
        position: data.position,        // 미지정 시 카메라 forward fallback
        ttl:      3000                  // 명시 또는 미지정 시 기본 3000ms
    });
};

// 즉시 제어
this.cameraInst.detectionMarkers.setTypeStyle('success', { color: 0x00ffaa });
this.cameraInst.detectionMarkers.clear();
```

---

## 모델 주의사항

- `models/IRISID_iCAM7/01_default/IRISID_iCAM7.gltf`의 단일 메시 이름은 `'icam7'`(소문자)로 확정. detectionMarkers는 `getObjectByName('icam7')`로 world position + forward 산출.
- GLTF 루트 `root` Node가 `scale [1000, 1000, 1000]`이므로 마커를 GLTF 루트(`appendElement`)에 add 하면 1000배 확대된다. 반드시 **scene 직속**에 add (preview에서는 직접 `instance._detectionMarkersParent = scene` 주입; 운영에서는 `wemb.threeElements.scene` 자동 fallback).
- **[MODEL_READY] placeholder 사용 안 함** — meshName='icam7'은 컴포넌트 루트 CLAUDE.md / Standard register.js에서 이미 확정.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 (#32 답습) |
| 2 | self-null `this.detectionMarkers = null` + RAF cancel | OK — destroy 마지막 줄 self-null + RAF cancelAnimationFrame + null |
| 3 | beforeDestroy.js는 호출만 | OK — `this.detectionMarkers?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachDetectionMarkers(inst)` 내부 destroy도 RAF cancel + `inst.detectionMarkers = null` 포함 + dispose + parent.remove |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — add/remove/clear/setTypeStyle/list/enable/disable/isEnabled/destroy (#32 aiMarkers와 동일 동사 + position fallback / ttl 기본값 추가) |
| 6 | UI ↔ API 인자 축 일치 | OK — Add Success/Failure/Unknown 버튼 ↔ `detectionMarkers.add({ type })`, Clear ↔ `clear()`, TTL 토글 ↔ ttl 옵션(default 3000) vs null |
| 7 | 기본값 시각 관찰 | OK — preview 로드 직후 자동 enable + **데모 마커 success + failure 1개씩 즉시 스폰** + position 미지정 fallback이 즉시 보임 (카메라 정면 1.2m) |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

---

## 발견한 문제 / Mixin 승격 후보

- **WorldMarkerSpawnMixin 승격 후보 (2개 임계점 도달)**: 큐 #32 Marker_AICCTV/aiMarkers + 본 변형(#33) IRISID_iCAM7/detectionMarkers = 2개 컴포넌트에서 동일 기법 확인. ADVANCED_QUEUE.md "승격 시점 신호(2번째 컴포넌트 등록)" 도달 — 향후 큐 #34(LPR/plateDetectionOverlay) 등에서 동일 기법 등장 시 즉시 사용자가 메인 루프 외부에서 `create-mixin-spec` → `implement-mixin`으로 승격 검토. 흡수할 시그니처는 `add/remove/clear/setTypeStyle/list/enable/disable/isEnabled/destroy` + position fallback policy + ttl default policy.
- **scene parent 강제 정책**: GLTF root scale [1000, 1000, 1000]이 마커 채널에 전파되지 않도록 반드시 scene 직속에 add. appendElement(GLTF 루트) fallback은 1000배 확대되어 의도치 않은 결과를 만들 수 있으므로 안전 가드만 두고 실 사용은 권장하지 않는다.
- **RAF 메모리 누수 방지**: detectionMarkers destroy에서 만료 RAF cancel + null. markerPool이 0개로 비어있으면 RAF 일시 정지하여 idle 비용 0으로.
