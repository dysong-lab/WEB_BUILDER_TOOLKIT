# FLIREx — Advanced/heatmapSurface

## 기능 정의

1. **상태 색상 표시 (제한적 승계)** — equipmentStatus 토픽으로 수신한 데이터에 따라 'FLIREx' Mesh 색상 변경 (Standard 승계, `material.color` 채널). 단, **heatmapSurface 활성 시 `material.color`는 강제로 흰색(0xffffff)** 으로 reset되어 baseColorMap(Canvas 텍스처)이 그대로 보이도록 한다.
2. **적외선 온도 분포 표면 매핑** — FLIREx 표면에 동적 CanvasTexture를 baseColorMap(material.map)으로 매핑하여 그리드 단위의 IR 온도 색상 분포를 표현
   - 그리드 차원(rows × cols)은 `setGrid(rows, cols)`로 페이지가 지정 (기본 24 × 32 — IR 검출기 픽셀 격자 모방)
   - 셀별 온도 데이터(`[{row, col, temp}, ...]` 또는 2D 배열)를 `setData(data)`로 주입 → Canvas 즉시 redraw → 텍스처 업데이트
   - 임계값 범위 `[min, max]`를 `setRange(min, max)`로 지정 → 정규화 후 색상 그라디언트 보간
3. **스트리밍 모드 (RAF 자동 갱신)** — `startStreaming(intervalMs)` / `stopStreaming()` 호출로 RAF 기반 자동 갱신을 토글. 페이지가 외부 텔레메트리로 `setData`를 호출하지 않아도, 내부 generator(`_streamFn` — Perlin-like 잡음 시간 드리프트)가 매 프레임 셀 데이터를 갱신하여 실시간 IR 영상 시뮬레이션. **본 변형의 핵심 차별점** (BATT/cellHeatmap는 데이터 도착 시점에만 redraw; heatmapSurface는 시간 자체가 데이터 축).
4. **외부 명령형 API** — 페이지가 `instance.heatmapSurface.setGrid/setData/setRange/setColorScale/setOpacity/setStreamFn/startStreaming/stopStreaming/enable/disable/destroy`를 직접 호출하여 그리드/데이터/색상 스케일/스트리밍 제어 (실제 IR 카메라 텔레메트리 토픽 연동은 페이지 책임 — `setStreamFn(fn)`으로 실 데이터 generator 주입 가능)
5. **활성/비활성 토글** — `enable()`/`disable()` 메서드로 heatmapSurface 적용 여부를 런타임에 토글. disable 시 원본 material.map과 material.color를 복원

---

## FLIREx mesh 구조

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/FLIREx/01_default/FLIREx.gltf` |
| mesh 이름 | `FLIREx` (단일) |
| 결정 | **단일 mesh** (Standard와 동일) |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh)`와 일치. Standard가 단일 'FLIREx' 메시 기반.

### 단일 mesh 한계 → CanvasTexture 매핑 채택 (BATT/cellHeatmap 답습)

FLIREx.gltf는 단일 mesh이므로 mesh 단위 셀별 색상 변경 불가. BATT/cellHeatmap와 동일하게 **동적 CanvasTexture를 baseColorMap에 매핑**하는 우회 채택. 그리드 차원은 IR 검출기 격자(24×32)에 맞춰 기본값을 BATT(4×16)보다 조밀하게 설정.

---

## BATT/cellHeatmap와의 관계 — Mixin 승격 후보

**큐 #17 BATT/cellHeatmap, #27 THERMALCAM/heatmapSurface, #28 FLIREx/heatmapSurface는 동일 기법(동적 CanvasTexture를 baseColorMap에 매핑)을 사용한다.** ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙" 1차에 따라 본 사이클은 **커스텀 메서드 `this.heatmapSurface`로 완결**한다.

본 사이클로 동일 기법이 **3번째 컴포넌트(FLIREx)** 에 등장하므로, **Mixin 승격 임계점에 도달**했다고 판단. 향후 별도 수동 작업(`create-mixin-spec` → `implement-mixin`)으로 다음 패턴을 Mixin화하는 것을 권장:

- **승격 후보 이름**: `SurfaceHeatmapTextureMixin` (가칭) 또는 `CellHeatmapMixin`
- **흡수할 메서드**: `setGrid/setData/setRange/setColorScale/setOpacity/enable/disable/getGrid/getRange/destroy`
- **본 변형(heatmapSurface)에 추가된 차이점** (스트리밍): `setStreamFn/startStreaming/stopStreaming` — Mixin이 옵션으로 `streamFn`, `streamingDefault`, `streamIntervalMs`를 받아 흡수 가능
- **MeshState color 충돌 회피 정책** (enable 시 `material.color = 0xffffff` 강제) — Mixin이 내장하면 모든 채택 변형에서 일관

본 사이클은 메인 루프의 "신규 Mixin 생성 금지" 정책에 따라 커스텀 메서드로 완결한다.

---

## 큐 정의 vs 실제 구현

**큐 설명**: "적외선 온도 분포 표면 매핑 스트리밍 (MeshState+커스텀 메서드)"

**실제 채택**: MeshStateMixin + 커스텀 메서드 `this.heatmapSurface` (스트리밍 RAF 루프 포함)

큐 설명과 정합. **스트리밍**이 BATT/cellHeatmap와의 분리 정당성의 핵심이다 (BATT는 외부 데이터 push 모델, FLIREx는 내부 generator + RAF pull 모델).

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.heatmapSurface` (신규 Mixin 없음)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

(Standard 답습)

### MeshState 채널과의 충돌 회피 정책

`material.color`는 텍스처에 곱해지는 multiplier이므로, heatmapSurface 활성 동안 흰색(0xffffff) 강제 reset. disable 시 원본 색상 복원. (BATT/cellHeatmap와 동일 정책.)

| Mixin / API | 채널 | 활성 시점 정책 |
|-------------|------|-----------------|
| MeshStateMixin | `material.color` | heatmapSurface.enable() 동안 흰색(0xffffff) 강제 reset |
| heatmapSurface (커스텀) | `material.map` (CanvasTexture) | enable 시 점유, disable 시 원본 map 복원 |

### 스트리밍 알고리즘

```
init:
    cellData[r][c] = base 온도 (range mid + 좌표별 정적 잡음)
    streamPhase = 0

_defaultStreamFn(cellData, t, range, rows, cols):
    // t: ms 누적 시간
    span = range.max - range.min
    for r in [0, rows):
        for c in [0, cols):
            // 두 개의 sin 파를 row/col로 위상 시프트하여 IR 영상 같은 부드러운 드리프트
            wave = 0.5 + 0.25 * sin((c * 0.4) + t * 0.0010)
                       + 0.20 * sin((r * 0.6) - t * 0.0007)
            jitter = (hash(r, c, floor(t / 80)) - 0.5) * 0.04   // ~프레임 단위 미세 잡음
            cellData[r][c] = range.min + span * clamp(wave + jitter, 0, 1)

startStreaming(intervalMs = 0):
    if intervalMs <= 0:  RAF 매 프레임
    else:                setInterval 누적 ms 기반 호출

  매 호출:
    elapsed = now - streamStartedAt
    streamFn(cellData, elapsed, range, rows, cols)
    redrawAll()

stopStreaming():
    cancel RAF / clearInterval
```

기본 generator는 페이지 측 텔레메트리 generator로 `setStreamFn(fn)`을 통해 교체 가능. 페이지가 실 IR 카메라 데이터를 받으면:

```javascript
instance.heatmapSurface.setStreamFn((cellData, t, range, rows, cols) => {
    // 페이지 측 IR 텔레메트리 reading을 cellData에 채움
});
```

### 커스텀 네임스페이스 `this.heatmapSurface`

| 메서드 | 동작 |
|--------|------|
| `setGrid(rows, cols)` | 그리드 차원 설정 (Canvas 크기 재조정 + cellData reset + redrawAll) |
| `setData(data)` | 셀 데이터 주입. `[{row, col, temp}]` 또는 2D 배열. 즉시 redrawAll. (스트리밍 활성 동안에도 호출 가능 — 다음 프레임에 streamFn에 의해 덮어씌워질 수 있음) |
| `setRange(min, max)` | 온도 색상 매핑 범위 설정. redrawAll |
| `setColorScale(stops)` | 색상 그라디언트 stops 배열. 기본은 IR 카메라 표준에 가까운 5-stop (검정→자주→빨강→노랑→흰색) |
| `setOpacity(alpha)` | CanvasTexture 알파(0~1). `material.opacity`/`material.transparent` 갱신 |
| `setStreamFn(fn)` | 스트리밍 시 호출되는 generator 함수 교체. 시그니처: `(cellData, elapsedMs, range, rows, cols) => void` |
| `startStreaming(intervalMs)` | 스트리밍 시작. intervalMs ≤ 0 또는 생략 시 RAF, > 0 이면 setInterval(intervalMs) |
| `stopStreaming()` | 스트리밍 중지 (RAF cancel + clearInterval) |
| `isStreaming()` | 현재 스트리밍 활성 여부 |
| `enable()` | 원본 material.map/color 보관 → CanvasTexture 생성 + 할당 + material.color = 0xffffff 강제 |
| `disable()` | material.map/color 원복 + texture.dispose. **stopStreaming 자동 호출** |
| `getGrid()` | `{ rows, cols }` |
| `getRange()` | `{ min, max }` |
| `destroy()` | `disable()` 호출 (스트리밍/RAF/텍스처 모두 정리) + Canvas/cellData reference 해제 + `this.heatmapSurface = null` (self-null) |

#### 옵션 기본값

| 키 | 기본값 |
|----|--------|
| rows | 24 (IR 검출기 격자 모방, BATT 4보다 조밀) |
| cols | 32 |
| range | { min: 18, max: 80 } (FLIR Ex 시리즈의 -20~250℃ 중 일반 운영 범위) |
| colorScale | `[{t:0,c:'#000010'},{t:0.25,c:'#5b00b3'},{t:0.5,c:'#ff3030'},{t:0.75,c:'#fbbf24'},{t:1,c:'#ffffff'}]` (검정→자주→빨강→노랑→흰색, IR 카메라 표준 hot 그라디언트) |
| opacity | 1.0 |
| cellSizePx | 16 (Canvas 픽셀 단위 셀 크기. 24×32 그리드 = 384×512 px) |
| 자동 enable on mount | **true** (parent/THREE 가용 시 즉시 enable + 임의 시드 데이터 + 자동 startStreaming) — Phase 1.5 #7 (기본값 시각적 관찰 가능성) |

### 원본 보관/복원 정책

`_origMap`, `_origColor` 보관/복원은 BATT/cellHeatmap와 동일.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

IR 카메라 텔레메트리 토픽은 본 사이클에서 별도로 구독하지 않는다. 페이지가 외부 명령형으로 `instance.heatmapSurface.setStreamFn(generator)` 또는 `setData(...)`를 직접 호출. 이는 BATT/cellHeatmap, pipeFlow와 동일한 외부 명령형 규약.

### 이벤트 (customEvents)

없음. 개별 단위(meshName='FLIREx' 확정).

### 라이프사이클

- `register.js`: MeshStateMixin 적용 + `this.heatmapSurface` API 등록 + (parent/THREE 가용 시) **자동 enable + 임의 시드 데이터 + 자동 startStreaming**
- 페이지가 `setStreamFn/setRange/setGrid/startStreaming/stopStreaming/enable/disable` 호출하여 제어
- `beforeDestroy.js`: 구독 해제 → `this.heatmapSurface?.destroy()` (스트리밍/RAF/텍스처 모두 정리) → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/heatmapSurface |
|------|----------|------------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `this.heatmapSurface` 네임스페이스 | 없음 | `setGrid/setData/setRange/setColorScale/setOpacity/setStreamFn/startStreaming/stopStreaming/enable/disable/getGrid/getRange/isStreaming/destroy` |
| Three.js CanvasTexture / Canvas 자원 | 없음 | 자체 생성/dispose |
| **RAF 스트리밍 루프** | 없음 | **있음 (본 변형의 핵심 차별점)** |
| `material.map` 채널 사용 | 없음 | 사용 (보관/할당/복원) |
| `material.color` 강제 reset (0xffffff) | 없음 | enable 동안 강제 |
| beforeDestroy | meshState만 정리 | heatmapSurface(스트리밍/RAF/텍스처 정리) → meshState 역순 |
| 화면 표시 | 단일 색상 | 시간 드리프트되는 IR 온도 분포 |

Standard는 `material.color`만 사용. Advanced/heatmapSurface는 추가로 (a) `material.map` 채널, (b) 동적 Canvas → CanvasTexture 자원, (c) **RAF 스트리밍 루프 (시간 자체가 데이터 축)**, (d) MeshState color 채널과의 충돌 회피 (white reset), (e) generator 교체/스트리밍 토글 외부 명령형 API — 다섯 채널을 페이지에 노출. register.js에 모든 자원/루프 라이프사이클이 추가되므로 별도 폴더로 분리.

---

## BATT/cellHeatmap와의 차이 (분리 정당성)

| 항목 | BATT/cellHeatmap | FLIREx/heatmapSurface |
|------|------------------|----------------------|
| 데이터 모델 | 외부 push (페이지가 setData 호출) | 내부 pull + 스트리밍 (RAF generator + setStreamFn 교체 가능) |
| 기본 그리드 | 4 × 16 (셀 그리드) | 24 × 32 (IR 검출기 픽셀 격자 모방) |
| 색상 스케일 | 3-stop (파랑→노랑→빨강) — 셀 온도 분포 | 5-stop (검정→자주→빨강→노랑→흰색) — IR 카메라 표준 hot |
| RAF 루프 | 없음 (데이터 도착 시점에만 redraw) | **있음 (스트리밍 시 매 프레임 generator + redraw)** |
| 도메인 | 배터리 셀 단위 BMS 텔레메트리 | 적외선 카메라 표면 온도 영상 |

기법 카테고리는 동일(CanvasTexture 매핑)이나 데이터 모델·기본값·RAF 동작이 명확히 다르다. 본 변형 등장으로 동일 기법이 3번째 컴포넌트에 사용되어 Mixin 승격 임계점 도달.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.flirexInstance = wemb.getDesignComponent('FLIREx');

// (1) 자동 스트리밍을 그대로 사용 (default streamFn으로 시뮬레이션)
//      register.js에서 자동 enable + startStreaming 진입하므로 추가 호출 불필요

// (2) 실 IR 카메라 텔레메트리로 generator 교체
this.flirexInstance.heatmapSurface.setStreamFn((cellData, t, range, rows, cols) => {
    // 실 IR 텔레메트리 reading을 cellData에 채움 (외부 latest reading 참조)
    const irFrame = window._latestIrFrame;
    if (!irFrame) return;
    for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++)
            cellData[r][c] = irFrame[r][c];
});

// (3) 임계값 변경
this.flirexInstance.heatmapSurface.setRange(0, 120);

// (4) 일시 중지
this.flirexInstance.heatmapSurface.stopStreaming();
```

---

## 모델 주의사항

- `models/FLIREx/01_default/FLIREx.gltf`의 단일 메시 이름은 `'FLIREx'`로 확정. heatmapSurface는 `getObjectByName('FLIREx')`로 mesh를 조회.
- FLIREx mesh의 material이 `MeshStandardMaterial` 등 `map` 속성을 지원하면 동작. 미지원 타입이면 silent skip.
- **[MODEL_READY] placeholder 사용 안 함** — meshName='FLIREx' 확정.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 |
| 2 | self-null `this.heatmapSurface = null` | OK — destroy 마지막 줄 |
| 3 | beforeDestroy.js는 호출만 | OK — `this.heatmapSurface?.destroy(); this.meshState?.destroy();` |
| 4 | preview attach 함수 destroy 일치 | OK — `attachHeatmapSurface(inst)` 내부 destroy도 `inst.heatmapSurface = null` 포함, 원본 material.map/color 복원, texture dispose, 스트리밍/RAF 정리 |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setGrid/setData/setRange/setColorScale/setOpacity/enable/disable/getGrid/getRange/destroy`는 BATT/cellHeatmap와 1:1 일치. 추가된 `setStreamFn/startStreaming/stopStreaming/isStreaming`는 RAF 패턴(`pipeFlow.start/stop`, `alarmPulse.start/stop`)과 동사·인자 형태 일관 |
| 6 | UI ↔ API 인자 축 일치 | OK — preview rows/cols 슬라이더↔`setGrid(rows, cols)`, low/high↔`setRange`, Start/Stop↔`startStreaming/stopStreaming`, Random Data↔`setData(...)` 1:1 |
| 7 | 기본값 시각적 관찰 가능성 | OK — preview 로드 직후 자동 enable + 자동 startStreaming → 즉시 시간 드리프트되는 IR 색상 분포 관찰 가능 |
| 8 | manifest + FLIREx/CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

---

## 발견한 문제 / Mixin 승격 후보

- **Mixin 승격 임계점 도달**: BATT/cellHeatmap (#17), THERMALCAM/heatmapSurface (#27 대기), FLIREx/heatmapSurface (#28, 본 변형) — 3개 컴포넌트가 동일 기법 사용. 메인 루프의 "신규 Mixin 생성 금지" 정책에 따라 본 사이클은 커스텀 메서드로 완결. 향후 수동 `create-mixin-spec` → `implement-mixin` 호출 권장.
  - **승격 후보 이름**: `SurfaceHeatmapTextureMixin`(가칭)
  - **옵션화 후보**: `defaultGrid`, `defaultRange`, `defaultColorScale`, `cellSizePx`, `streamFn`, `streamingDefault`, `streamIntervalMs`
  - **API 호환성**: 현 시그니처 그대로 흡수 가능
- **BATT/cellHeatmap 정책 답습**: enable 동안 `material.color = 0xffffff` 강제 정책, `_origMap/_origColor` 보관/복원, MeshState clone 시 흰색 reset이 풀릴 수 있다는 주의사항 — 모두 동일.
