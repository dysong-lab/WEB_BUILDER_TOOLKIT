# B3F_UPS — Advanced/upsStatus

## 기능 정의

1. **상태 색상 표시 (Standard 승계)** — equipmentStatus 토픽으로 수신한 데이터에 따라 `UPS` Mesh의 `material.color`를 colorMap에 맞춰 변경. Standard와 동일한 colorMap 사용.
2. **3-모드 LED (Online / Bypass / Battery)** — B3F_UPS 본체 위쪽에 3개의 작은 발광 SphereGeometry mesh를 자식으로 add (가로 배열). 현재 모드의 LED만 강하게 점등(`emissive` 강도 1.0 + 짙은 base color), 나머지는 약하게(0.1) 표시. 모드 ↔ 색상: `online`=녹색(0x4ade80), `bypass`=황색(0xfbbf24), `battery`=적색(0xef4444).
3. **잔여시간 카운트다운 HUD** — `mode === 'battery'`일 때만 표시. UPS mesh의 월드 좌표를 카메라 projection으로 화면 좌표로 변환하여, 이를 따라가는 absolute-position된 DOM 카드에 mm:ss 형식의 잔여시간을 실시간 표시 (#13 BATT/dataHud + #41 OHU103 + #42 Generator/generatorOutput HUD 패턴 답습). online/bypass 모드에서는 카드 hide.
4. **자동 카운트다운** — `mode='battery'` 진입 시 1초 간격으로 `pushSecond()` 자동 호출 (autoCountdown=true 기본). 0 도달 시 자동 정지. 외부에서 `setRemainingSeconds(s)`로 갱신 가능.
5. **외부 명령형 API** — 페이지가 `instance.upsStatus.setMode/setRemainingSeconds/pushSecond/startCountdown/stopCountdown/setLedColors/setLedLayout/setLedOffset/setLedRadius/setLedSpacing/setHudOffset/setMeshName/getMode/getRemainingSeconds/enable/disable/isEnabled/destroy`를 직접 호출하여 모드 + 잔여시간 제어.

---

## #53 UPS/Advanced/upsStatus 답습 (시그니처 100% 동일)

> **본 변형은 #53 UPS/Advanced/upsStatus를 100% 답습**(시그니처/알고리즘/destroy 규약 동일). meshName/scale 보정만 차이.
>
> 이로써 **UpsStatusLedMixin / MultiLedStateMixin 승격 임계점 2개 도달 (#53 + #54)** — 즉시 승격 강력 권장. 두 변형은 시그니처/알고리즘이 100% 동일하며 LED offset/radius/spacing 옵션값만 모델 bbox 비례로 차이.

---

## B3F_UPS mesh 구조 결정

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/B3F_UPS/01_default/B3F_UPS.gltf` |
| GLTF 구조 | 루트 nodes(`root`(scale=1000) → `UPS`(mesh)) — 단일 Mesh `UPS` (자식 없음) |
| GLTF 내부 mesh 이름 | **`'UPS'`** (B3F_UPS 아님 — 폴더/컴포넌트명만 B3F_UPS이고 내부 mesh는 'UPS') |
| mesh local 좌표 바운드 | `[-0.0095, -0.00925, -0.0044] ~ [0.0095, 0.00925, 0.0044]` (정점 550) |
| 월드(root scale 1000 적용) 바운드 | 가로 ~19 × 세로 ~18.5 × 깊이 ~8.8 단위 (UPS 4.84 × 2.32 × 0.94 대비 약 4× 큼) |
| 추적 대상 mesh 이름 | `UPS` (#53과 동일) |
| 결정 | **단일 Mesh 추적** — 개별 단위(1 GLTF = 1 Mesh) 패턴 (Standard 동일) |

근거: B3F_UPS Standard register.js의 `meshName: 'UPS'` 및 GLTF 내부 정의(node `UPS` + mesh `UPS`)와 일치. **#53 UPS와 meshName이 'UPS'로 동일** (둘 다 GLTF 내부 mesh 이름이 'UPS') — 변경 없음.

---

## #53 UPS/Advanced/upsStatus와의 차이점 (옵션값만)

| 항목 | #53 UPS | #54 B3F_UPS | 비고 |
|------|---------|-------------|------|
| `_meshName` | `'UPS'` | `'UPS'` | **동일** — GLTF 내부 mesh 이름 동일 |
| GLTF 루트 scale | 자식 노드 의존 (별도 scale 없음) | **1000** (root node scale 1000) | mesh 자식으로 add되는 LED는 mesh local 좌표계 사용 |
| mesh local bbox max | `(2.42, 1.16, 0.47)` | `(0.0095, 0.00925, 0.0044)` | 약 1/254 비율 |
| `_ledOffset` | `{x:0, y:1.4, z:0.5}` | `{x:0, y:0.0112, z:0.0047}` | bbox 비례 scale-down (y_max 비율 1.21 동일) |
| `_ledRadius` | `0.12` | `0.001` | bbox max 0.10 비율 동일 |
| `_ledSpacing` | `0.45` | `0.0036` | bbox 비례 scale-down |
| `_hudOffset` | `{x:0, y:-10}` | `{x:0, y:-10}` | 화면 픽셀 단위 — 동일 |
| 시그니처 (모든 set/get/enable/disable/destroy) | (X) | (X) | **100% 동일** |
| destroy 규약 (clearInterval + RAF cancel + LED dispose + self-null) | (X) | (X) | **100% 동일** |
| `colorMap` (MeshStateMixin) | normal/warning/error/offline 4종 | (X) | **100% 동일** |
| 자동 데모 시퀀스 (online → bypass → battery → online) | 0/2/4/7s | 0/2/4/7s | **100% 동일** |

> **핵심**: 시그니처/알고리즘/destroy 규약은 100% 동일. **mesh local 좌표계의 bbox 크기 차이로 LED offset/radius/spacing만 비례 조정**. UpsStatusLedMixin 승격 시 모델별 옵션값으로 이 4개만 외부 주입하면 코드는 완전 공유 가능.

---

## 답습 모범

본 변형은 **#53 UPS/Advanced/upsStatus를 직접 답습**한다. 시그니처/알고리즘/destroy 규약 100% 동일. 간접 답습은 #53과 동일:

| 답습 | 항목 |
|------|------|
| `#53 UPS/Advanced/upsStatus` | **시그니처/알고리즘/destroy 규약 100% 직접 답습** (옵션값 차이만) |
| `#41 OHU103/Advanced/outdoorUnitPerformance` | HUD 좌표 추적·setData·외부 주입 자원·통합 네임스페이스·RAF idle 정책 (간접) |
| `#42 Generator/Advanced/generatorOutput` | HUD overlay + 외부 주입 자원(_renderer/_camera/_hudRoot/_cardEl) + start/stop 라이프사이클 (간접) |
| `#50 Inverter/Advanced/powerFlowIndicator` | 자식 mesh 동적 생성 + parent.add + dispose 규약 (간접) |
| `#46 MCCB/Advanced/breaker_leverPosition` | 3-state 절대 모드 setState 시그니처 (간접) |

### Mixin 승격 메모 (UpsStatusLedMixin 임계점 2개 도달 — 즉시 승격 권장)

> **UpsStatusLedMixin / MultiLedStateMixin 승격 임계점 2개 도달 (#53 UPS + #54 B3F_UPS)** — 본 변형은 #53과 시그니처 100% 동일을 입증. 옵션값만 모델 bbox 비례로 차이. 승격 시점에 `_ledOffset/_ledRadius/_ledSpacing`을 모델별 옵션으로 외부 주입하고 알고리즘은 완전 공유. 사용자가 `create-mixin-spec` → `implement-mixin` 호출로 승격 즉시 검토 강력 권장.

> **MeshTrackingHudMixin 매우 강력 권장 — HUD 10번째 채택 (#13 + #21 + #24/#25/#26 + #41 + #42 + #53 + #54) — 임계점 명백히 초과 누적.** setData/setOffset/show/hide/start/stop/destroy + `_renderer/_camera/_hudRoot/_cardEl` 외부 주입 자원 패턴이 10개 컴포넌트에서 동일. 본 사이클은 신규 Mixin 금지 정책으로 커스텀 유지하나 사용자가 메인 외부에서 즉시 `create-mixin-spec` → `implement-mixin` 호출로 승격 검토 권장 (다른 누적 mixin 후보보다 우선순위 최상위).

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.upsStatus` (신규 Mixin **없음** — #53 답습)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

(Standard / #53 UPS 동일)

### 채널 직교성 정책

세 채널은 완전 직교 — 본체 색상, LED group, HUD DOM은 서로 간섭하지 않는다 (#53 동일).

| Mixin / API | 채널 | 책임 |
|-------------|------|------|
| MeshStateMixin | `UPS.material.color` | 데이터 상태 색상 (Standard 승계) |
| upsStatus (LED) | 자체 `THREE.Group` + 3 SphereGeometry mesh × MeshStandardMaterial(emissive) | 운전 모드 (online/bypass/battery) |
| upsStatus (HUD) | DOM (`_cardEl.style.transform` + textContent) | 잔여시간 mm:ss (battery 모드 한정) |

### 옵션 기본값 (B3F_UPS bbox 비례 보정)

| 옵션 | 기본값 (B3F_UPS) | 시각 관찰성 |
|------|-------|----------|
| `_meshName` | `'UPS'` | Standard 동일 (GLTF 내부 mesh 이름) |
| `_mode` | `'online'` | preview 마운트 시 녹색 LED 점등 |
| `_remainingSeconds` | 600 | preview battery 진입 시 mm:ss = 10:00 시작 |
| `_ledLayout` | `'horizontal'` | 가로 배열 |
| `_ledOffset` | `{ x: 0, y: 0.0112, z: 0.0047 }` | mesh local bbox 비례 — 본체 위쪽 + 약간 앞 (y_max=0.00925, z_max=0.0044) |
| `_ledRadius` | `0.001` | bbox max의 ~10% |
| `_ledSpacing` | `0.0036` | 3개 LED 간격 (가로 총 폭 0.0072 — 본체 가로 0.019 대비 적절) |
| `_autoCountdown` | true | battery 모드 진입 시 자동 카운트다운 |
| `_hudOffset` | `{ x: 0, y: -10 }` | UPS mesh 위로 약간 띄움 (화면 픽셀 단위 — 모델 무관) |
| autoEnable on mount | true | preview 시각 관찰 우선 (#29~#53 동일 정책) |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` (Standard 승계 — 본체 색상 채널) |

### 이벤트 (customEvents)

없음. 개별 단위(meshName='UPS' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: MeshStateMixin 적용 + `this.upsStatus` API 등록 + 기본값 시드(_mode='online', _remainingSeconds=600) + (THREE 가용 시) 자동 enable + LED group 생성/attach + equipmentStatus 구독 + 자동 데모 시퀀스(setMode 순환).
- 페이지가 `_hudRoot/_renderer/_camera` 주입 → `setMode('battery')` 호출 시 → HUD RAF 시작 + 카운트다운 시작
- `beforeDestroy.js`: 구독 해제 → `this.upsStatus?.destroy()` (clearInterval + cancelAnimationFrame + LED dispose + 외부 자원 null 포함) → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/upsStatus |
|------|----------|--------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `this.upsStatus` 네임스페이스 | 없음 | `setMode/setRemainingSeconds/pushSecond/startCountdown/stopCountdown/setLedColors/setLedLayout/setLedOffset/setLedRadius/setLedSpacing/setHudOffset/setMeshName/getMode/getRemainingSeconds/enable/disable/isEnabled/destroy` 노출 |
| 자체 `THREE.Group` + 3 SphereGeometry mesh × MeshStandardMaterial(emissive) | 없음 | 자체 생성 + UPS mesh 자식 attach + dispose |
| RAF 매 프레임 월드→화면 projection HUD 좌표 추적 | 없음 | 있음 — battery 모드일 때만 active, 다른 모드 시 RAF stop |
| setInterval 1초 카운트다운 | 없음 | 있음 — battery 모드일 때 active, 0 도달 시 자동 정지 |
| DOM 오버레이 채널 | 없음 | 사용 |
| LED emissive 채널 | 없음 | 사용 (3개 material 독립 emissiveIntensity 토글) |
| beforeDestroy | meshState만 정리 | upsStatus(setInterval clear + RAF cancel + LED dispose + 외부 자원 null) → meshState 역순 정리 |
| 화면 표시 | 단일 색상 UPS 본체 | 단일 색상 + 본체 위 3-LED + (battery 시) HUD mm:ss 카드 |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/upsStatus는 추가로 (a) 자체 Group + 3 SphereGeometry mesh + 3 material 자원 (b) UPS mesh 자식 attach 절차 (c) DOM overlay 채널 (d) `setMode/setRemainingSeconds/...` 외부 명령형 API (e) HUD RAF + 카운트다운 setInterval (f) 모드별 emissive 강도 토글 — 여섯 채널을 페이지에 노출한다.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 (#53 답습) |
| 2 | self-null `this.upsStatus = null` + clearInterval + RAF cancel | OK — destroy 마지막 줄 self-null + clearInterval(_countdownIntervalId) + cancelAnimationFrame(_hudRafId) + LED group parent.remove + 3 material dispose + 1 geometry dispose + 외부 자원 null |
| 3 | beforeDestroy.js는 호출만 | OK — `this.upsStatus?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachUpsStatus(inst)` 내부 destroy도 clearInterval + RAF cancel + LED dispose + 외부 자원 null + `inst.upsStatus = null` 포함 |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — #53 UPS/upsStatus와 시그니처 100% 동일. 모든 set/get/enable/disable/destroy 시그니처 일치. 옵션값만 mesh local bbox 비례로 차이 |
| 6 | UI ↔ API 인자 축 일치 | OK — preview 3-mode 버튼 ↔ `setMode('online'/'bypass'/'battery')`, 잔여시간 슬라이더 0~1800초 ↔ `setRemainingSeconds`, status 4버튼 ↔ `meshState.renderData` |
| 7 | 기본값 시각 관찰 | OK — preview 로드 직후 자동 데모(`setMode('online') → 2s → 'bypass' → 4s → 'battery'(300초) → 7s → 'online'`)로 LED 색상 변화 + battery 시 HUD 카운트다운 시각 분명 관찰. `_ledOffset/_ledRadius/_ledSpacing`이 B3F_UPS mesh local bbox에 맞춰 비례 보정되어 LED가 본체 위에 적절한 크기로 표시 |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 |

**8항목 모두 통과.**

---

## 페이지 측 연동 패턴 (운영)

```javascript
// 페이지 HTML (정적 마운트)
<div id="b3f-ups-hud-overlay" style="position:absolute; inset:0; pointer-events:none;">
    <div class="ups-hud-card" data-mesh-name="UPS">
        <div class="ups-hud-header">B3F_UPS-01 · Battery Mode</div>
        <div class="ups-hud-row">
            <span class="ups-hud-label">잔여 시간</span>
            <span class="ups-remaining-time">--:--</span>
        </div>
    </div>
</div>

// loaded.js
const overlay = document.getElementById('b3f-ups-hud-overlay');
this.upsInstance = wemb.getDesignComponent('B3F_UPS');
this.upsInstance.upsStatus._hudRoot = overlay;
this.upsInstance.upsStatus.setMode('online');

// SCADA 어댑터
const onUpsTelemetry = ({ response: data }) => {
    this.upsInstance.upsStatus.setMode(data.mode);
    if (data.mode === 'battery' && typeof data.remainingSeconds === 'number') {
        this.upsInstance.upsStatus.setRemainingSeconds(data.remainingSeconds);
    }
};
```

---

## 모델 주의사항

- `models/B3F_UPS/01_default/B3F_UPS.gltf`의 단일 Mesh 이름은 **`'UPS'`** (폴더/컴포넌트명은 `B3F_UPS`이지만 GLTF 내부 mesh 이름은 `UPS`). LED 부착 / HUD 추적 모두 `getObjectByName('UPS')`로 mesh를 직접 조회한다.
- root node에 `scale: [1000, 1000, 1000]`이 적용되어 있어 화면상에는 UPS 모델보다 약 4배 크게 보인다. 그러나 LED는 mesh의 자식으로 add되어 mesh **local 좌표계**를 사용하므로 LED offset/radius/spacing은 mesh local bbox(±0.0095 × ±0.00925 × ±0.0044)에 비례하여 #53 UPS 옵션값을 ~1/127 로 scale-down하여 적용했다.
- LED 3개는 UPS mesh의 자식으로 add — UPS 이동/회전 시 LED가 그대로 따라온다.
- HUD 카드는 화면 픽셀 좌표 기반이므로 `_hudOffset`은 모델 scale과 무관 — UPS와 동일한 `{x:0, y:-10}` 사용.
- mode='battery' 진입 시 카운트다운 시작 / 종료 시 정지 자동 처리 (setMode 내부에서). pushSecond는 외부에서도 호출 가능 (수동 카운트다운 테스트 등).
- **[MODEL_READY] placeholder 사용 안 함** — meshName='UPS'은 컴포넌트 루트 CLAUDE.md / Standard register.js / GLTF 파일 / Standard preview에서 직접 검증으로 이미 확정.

---

## 발견한 문제 / Mixin 승격 강력 권장

- **UpsStatusLedMixin / MultiLedStateMixin 승격 임계점 2개 도달 (#53 + #54)**: 본 변형(#54 B3F_UPS)은 #53 UPS와 시그니처/알고리즘/destroy 규약 100% 동일을 입증. 옵션값(`_ledOffset/_ledRadius/_ledSpacing`)만 모델 bbox 비례로 차이. 승격 시 옵션값을 모델별 외부 주입하고 코드는 완전 공유 가능 — **사용자가 `create-mixin-spec` → `implement-mixin` 호출로 승격 즉시 검토 강력 권장**.
- **MeshTrackingHudMixin 승격 매우 강력 권장 — HUD 10번째 채택 (#13 + #21 + #24/#25/#26 + #41 + #42 + #53 + #54)**: setData/setOffset/show/hide/start/stop/destroy + `_renderer/_camera/_hudRoot/_cardEl` 외부 주입 자원 패턴이 10개 컴포넌트에서 동일. 임계점 명백히 초과 누적.
- **단일 통합 네임스페이스 (#42/#53 동일 정책)**: 두 채널(LED, HUD)이 단일 도메인(UPS 운전 모드 표시)에 종속되어 페이지가 동시 호출(`setMode` + `setRemainingSeconds`)하므로 단일 `upsStatus` 네임스페이스로 통합 유지.
- **mode==='battery'일 때만 HUD 활성 정책**: HUD RAF는 mode==='battery'일 때만 active, online/bypass 시 즉시 stop + cardEl.style.display='none'. setMode 진입/이탈 시 자동 처리. #53과 동일.
- **카운트다운은 setInterval (RAF 아님)**: 1초 단위로 차감하므로 setInterval이 자연스럽다. #53과 동일.
