# BATT — Advanced/cellHeatmap

## 기능 정의

1. **상태 색상 표시 (제한적 승계)** — equipmentStatus 토픽으로 수신한 데이터에 따라 'BATT' Mesh 색상 변경 (Standard 승계, `material.color` 채널). 단, **cellHeatmap 활성 시 `material.color`는 강제로 흰색(0xffffff)** 으로 reset되어 baseColorMap(Canvas 텍스처)이 그대로 보이도록 한다 — 본 변형의 핵심 가시성 정책.
2. **셀 단위 온도 열분포 시각화** — BATT 표면에 동적 CanvasTexture를 baseColorMap(material.map)으로 매핑하여 셀 그리드 단위의 온도 색상 분포를 표현
   - 그리드 차원(rows × cols)은 `setGrid(rows, cols)`로 페이지가 지정 (기본 4 × 16)
   - 셀별 온도 데이터(`[{row, col, temp}, ...]` 또는 2D 배열)를 `setData(data)`로 주입 → Canvas 즉시 redraw → 텍스처 업데이트
   - 임계값 범위 `[min, max]`를 `setRange(min, max)`로 지정 → 정규화 후 색상 그라디언트 보간
3. **외부 명령형 API** — 페이지가 `instance.cellHeatmap.setGrid/setData/setRange/setColorScale/setOpacity/enable/disable/destroy`를 직접 호출하여 셀 그리드/데이터/색상 스케일 제어 (BMS의 cell-level 온도 텔레메트리 토픽 연동은 페이지 책임)
4. **활성/비활성 토글** — `enable()`/`disable()` 메서드로 cellHeatmap 적용 여부를 런타임에 토글. disable 시 원본 material.map과 material.color를 복원하여 다른 변형(예: alarmPulse 동시 적용)과의 채널 공존 가능

---

## BATT mesh 구조 결정 — 단일 mesh 한계

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/BATT/01_default/BATT.gltf` |
| mesh 이름 | `BATT` (단일) |
| 결정 | **단일 mesh** — 셀이 별도 mesh로 분리되어 있지 않음 |

근거: 컴포넌트 루트 CLAUDE.md의 `유형 = 개별 (1 GLTF = 1 Mesh)`와 일치. Standard / 다른 모든 Advanced 변형이 단일 'BATT' 메시 기반으로 동작 중.

### 단일 mesh 한계 → CanvasTexture 매핑 채택

**문제**: 진짜 "셀 단위" 색상 변경은 셀이 별도 mesh로 분리되어 있어야 가능 (예: `BATT_cell_r0c0`, `BATT_cell_r0c1`...). 현재 BATT.gltf는 단일 'BATT' mesh이므로 mesh 단위로는 셀별 색을 칠할 수 없다.

**해결책 채택 — (A) 동적 CanvasTexture를 baseColorMap에 매핑**:

1. `OffscreenCanvas` 또는 일반 `<canvas>` 생성 (rows × cellSize_y, cols × cellSize_x 픽셀, 기본 cellSize = 32)
2. 각 셀의 온도 데이터를 색상으로 매핑 후 `ctx.fillRect(col*cellSize_x, row*cellSize_y, cellSize_x, cellSize_y)`로 그리드 셀 그리기
3. `THREE.CanvasTexture(canvas)` 생성 → `material.map`에 할당
4. `setData/setGrid/setRange/setColorScale/setOpacity` 호출 시 Canvas 즉시 redraw → `texture.needsUpdate = true`로 GPU 업로드

이 방식은 임의 그리드 차원(4×16, 8×24, …)을 지원하며 셀 mesh 분리 없이도 셀 단위 색상 표현이 가능하다.

#### 대안 검토 — (B) emissive 또는 vertex color

- **emissive 채널**: 단일 material이므로 셀별 emissive 분리 불가. alarmPulse가 이미 점유 중인 채널 — 충돌.
- **vertex color**: GLTF에 vertex color 속성이 없고, 전체 BATT mesh의 vertex 분포가 그리드와 정렬되어 있지 않아 의미 없는 보간이 발생.

→ (A) CanvasTexture 매핑이 유일하게 작동 가능한 해결책.

### 향후 확장 시나리오 (셀 mesh 분리 모델 도입 시)

향후 BATT 모델이 셀 단위 mesh로 분리(`BATT_cell_r{r}c{c}` 등)되면, 현 cellHeatmap의 API 시그니처(`setGrid/setData/setRange/setColorScale/setOpacity/enable/disable/destroy`)는 그대로 유지하고 내부 구현만 다음과 같이 확장:

```
setData([{row, col, temp}]) →
    각 셀 mesh의 material.color를 직접 색상으로 변경
    (CanvasTexture 매핑 대신 mesh-level color 매핑)
```

이때 `setGrid`는 mesh name 패턴 추출용으로만 사용되고, Canvas/Texture 자원은 생성하지 않는다. API 호환성은 보존되어 페이지 코드 수정 불필요.

---

## 큐 정의 vs 실제 구현 — Mixin 승격 금지 + 커스텀 메서드 채택

**큐 설명**: "셀 단위 온도/이상 열분포 **(신규 Mixin: CellHeatmapMixin)**"

**실제 채택**: **신규 Mixin 미생성** + MeshState applyMixin + 커스텀 메서드 `this.cellHeatmap`만 등록

### 결정 근거

본 사이클은 **Mixin 승격 금지 규칙**이 적용된다 (메인 루프 정책 — 사이클 내 신규 Mixin 생성 금지). 이는 ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙" 1차 — "단일 컴포넌트 전용 → 커스텀 메서드"와 정합. 본 사이클은 커스텀 메서드 `this.cellHeatmap`로 완결하고, 2번째 컴포넌트(예: THERMALCAM/FLIREx/heatmapSurface, meshesArea/area_01/zonalHeatmap) 등록 시점에 Mixin 승격을 검토한다.

### 큐 의도와의 정합

큐 설명은 "셀 단위 열분포 시각화"가 가능한 Mixin 1차 후보를 명시한 것이다. 단일 mesh 한계 + 단일 컴포넌트 전용 시점 + 메인 루프의 Mixin 승격 금지 정책이 결합되어 본 사이클에서는 커스텀 메서드로 완결한다. API 시그니처는 미래 Mixin 승격 시 그대로 수용 가능하도록 설계.

### Mixin 승격 후보 메모

본 변형의 "장비 표면에 셀/존 그리드 단위로 온도/이상/스칼라 값을 색상 매핑하여 baseColorMap에 동적 CanvasTexture로 그리는" 패턴은 **다수 컴포넌트(THERMALCAM/FLIREx/heatmapSurface, meshesArea/area_01/zonalHeatmap, BATT/02_split/cellHeatmap 등)에서 동일 기법으로 재사용** 가능성이 높다. ADVANCED_QUEUE.md "커스텀 메서드 vs 신규 Mixin 판단 규칙" 1차 — "단일 컴포넌트 전용 → 커스텀 메서드"에 따라 본 사이클은 커스텀 메서드로 완결. 2번째 컴포넌트 등록 시점에 신규 Mixin 후보 검토:

- **신규 Mixin 후보 이름**: `CellHeatmapMixin`(가칭) 또는 `SurfaceHeatmapTextureMixin`(가칭)
- **API 호환성**: 현 시그니처(`setGrid/setData/setRange/setColorScale/setOpacity/enable/disable/destroy`)를 그대로 수용 가능
- **옵션화 후보**: `defaultGrid`(rows, cols), `defaultRange`(min, max), `defaultColorScale`(stops 배열), `cellSizePx`(픽셀 셀 크기), `mode`('texture' | 'meshColor' — 셀 mesh 분리 모델 자동 분기)
- **MeshState color 충돌 회피**: Mixin 본문에 `enable()` 시 `material.color = 0xffffff` 강제 reset 정책을 내장하고, `disable()` 시 원본 색상 복원 — 본 사이클의 정책 그대로 답습

---

## 구현 명세

### Mixin

MeshStateMixin + 커스텀 메서드 `this.cellHeatmap` (신규 Mixin 없음)

### colorMap (MeshStateMixin)

| 상태 | 색상 (material.color) |
|------|----------------------|
| normal | 0x34d399 |
| warning | 0xfbbf24 |
| error | 0xf87171 |
| offline | 0x6b7280 |

### MeshState 채널과의 충돌 회피 정책 — 핵심 결정

**문제**: MeshStateMixin은 `material.color`를 status별 색상으로 갱신한다. cellHeatmap은 `material.map`(baseColorMap) 채널을 점유한다. WebGL에서 `material.color`는 텍스처 위에 곱해지는 multiplier이므로, color가 빨강/노랑이면 텍스처 색상이 곱해져 왜곡된다.

**채택 정책**: cellHeatmap **활성 동안** `material.color`를 **강제로 흰색(0xffffff)** 으로 reset하여 multiplier가 텍스처 색상을 변형시키지 않도록 한다. disable 시점에 원본 색상을 복원.

| Mixin / API | 채널 | 활성 시점 정책 |
|-------------|------|-----------------|
| MeshStateMixin | `material.color` | cellHeatmap.enable() 동안 흰색(0xffffff) 강제 reset |
| cellHeatmap (커스텀) | `material.map` (CanvasTexture) | enable 시 점유, disable 시 원본 map 복원 |

이 정책은 enable/disable 시점에 원자적으로 수행된다. MeshState renderData가 enable 활성 동안에도 호출 가능하지만, color 채널은 흰색으로 강제 유지된다 (페이지가 status 변경에 따라 다른 시각화를 원하면 cellHeatmap.disable() 호출 후 원래 color 채널 복원).

> 향후 셀 mesh 분리 모델 도입 시: 셀 mesh 단위로 color를 직접 칠하는 모드(B)에서는 MeshState와 충돌하지 않으므로 본 강제 reset 정책은 불필요. Mixin 승격 시점에 `mode` 옵션으로 분기.

### 펄스 알고리즘 (Canvas redraw)

```
init / setGrid(rows, cols):
    cellSizePx = 32
    canvas.width  = cols * cellSizePx
    canvas.height = rows * cellSizePx
    cellData = 2D array [rows][cols] (모든 셀 온도 = mid of range)
    redrawAll()

setData(data):
    if Array.isArray(data) and data[0]?.row !== undefined:
        // [{row, col, temp}, ...] 형태
        each item: cellData[row][col] = temp
    else if 2D array:
        cellData[r][c] = data[r][c]
    redrawAll()

redrawAll():
    for r in [0, rows):
        for c in [0, cols):
            t  = (cellData[r][c] - range.min) / (range.max - range.min)   // 0~1 정규화
            t  = clamp(t, 0, 1)
            col = interpolateStops(colorScale, t)  // 그라디언트 보간
            ctx.fillStyle = col
            ctx.fillRect(c * cellSizePx, r * cellSizePx, cellSizePx, cellSizePx)
    texture.needsUpdate = true

interpolateStops(stops, t):
    // stops: [{t: 0, c: '#3b6cff'}, {t: 0.5, c: '#f6e96b'}, {t: 1, c: '#ff3030'}]
    // t∈[stop_i.t, stop_{i+1}.t] 구간에서 RGB 선형 보간
```

매번 `setData/setGrid/setRange/setColorScale` 호출 시 전체 redraw. 셀 수가 작으므로(기본 4×16=64셀) 부담 없음. 별도 RAF 없음 — 데이터 도착 시점에만 갱신.

### 커스텀 네임스페이스 `this.cellHeatmap`

| 메서드 | 동작 |
|--------|------|
| `setGrid(rows, cols)` | 그리드 차원 설정. Canvas 크기 재조정(`cols*cellSizePx × rows*cellSizePx`) + cellData 2D 배열 reset(모든 셀 = range mid) + redrawAll |
| `setData(data)` | 셀 데이터 갱신. `[{row, col, temp}, ...]` 또는 2D 배열 허용. 즉시 redrawAll |
| `setRange(min, max)` | 온도 색상 매핑 범위 설정 (예: 20~60℃ → 파랑~빨강). redrawAll |
| `setColorScale(stops)` | 색상 그라디언트 stops 배열 (`[{t, c}]` 형식). 기본은 viridis-inspired 3-stop. redrawAll |
| `setOpacity(alpha)` | CanvasTexture 알파(0~1). `material.opacity`/`material.transparent`을 갱신 — 다른 오버레이/라벨 위 표시용 |
| `enable()` | 원본 `material.map`/`material.color` 보관(_origMap, _origColor) → CanvasTexture 생성 → `material.map = canvasTexture` 할당 → `material.color.setHex(0xffffff)` 강제 → `material.needsUpdate = true` |
| `disable()` | `material.map = _origMap`, `material.color = _origColor` 복원 → `texture.dispose()` → `_origMap/_origColor` clear |
| `getGrid()` | `{ rows, cols }` 반환 |
| `getRange()` | `{ min, max }` 반환 |
| `destroy()` | `disable()` 호출 + Canvas/cellData reference 해제 + 마지막 줄 `this.cellHeatmap = null` (self-null) |

#### 옵션 기본값

| 키 | 기본값 |
|----|--------|
| rows | 4 |
| cols | 16 |
| range | { min: 20, max: 60 } |
| colorScale | `[{t:0, c:'#3b6cff'}, {t:0.5, c:'#f6e96b'}, {t:1, c:'#ff3030'}]` (파랑→노랑→빨강) |
| opacity | 1.0 |
| cellSizePx | 32 (Canvas 픽셀 단위 셀 크기) |
| autoEnable on mount | **true** (parent/THREE 가용 시 즉시 enable + 임의 그라디언트 데이터로 자동 redraw — Phase 1.5 항목 #7 "기본값 시각적 관찰 가능성") |

### 원본 보관/복원 정책

`_origMap: THREE.Texture | null` (enable 직전의 material.map 참조)
`_origColor: number (hex) | null` (enable 직전의 material.color hex)

- `enable()` 첫 호출 시점에 mesh의 material에서 `_origMap = material.map`, `_origColor = material.color.getHex()` 보관
- `disable()` / `destroy()` 시 `material.map = _origMap`, `material.color.setHex(_origColor)` 복원, `_origMap/_origColor`을 null로 clear
- enable→disable→enable 반복 시 `_origMap/_origColor`은 재보관 (disable에서 clear, enable에서 재보관)

> **MeshState renderData와의 상호작용**: MeshState가 매 `setMeshState` 호출 시 `material = material.clone()`을 수행하므로, enable 활성 동안 status 갱신이 발생할 수 있다. 이때:
> 1. clone된 material은 cellHeatmap이 enable 시점에 할당한 `material.map = canvasTexture`을 그대로 복제 (텍스처는 참조 복제이므로 동일 CanvasTexture 유지)
> 2. clone된 material.color는 MeshStateMixin이 status 색으로 칠한 상태가 되어 흰색(0xffffff)이 풀린다 → cellHeatmap의 강제 reset 정책이 깨진다
>
> 따라서 cellHeatmap은 enable 시점에 한 번만 흰색 reset을 수행하고, **MeshState가 활성 상태인 동안에는 페이지가 cellHeatmap을 enable로 둘지 disable로 둘지 정책 결정**한다. 본 사이클의 기본 정책은 "enable 우선, status 색은 시각적으로 무시" — preview에서 자동 enable로 즉시 관찰 가능하도록 설정.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| equipmentStatus | `this.meshState.renderData` |

셀 데이터 토픽(예: `cellTemperature`)은 본 사이클에서 별도로 구독하지 않는다. 페이지가 외부 명령형으로 `instance.cellHeatmap.setData(cellArray)` 직접 호출 (BMS UI에서 셀 단위 텔레메트리 폴링/구독 후 직접 주입). 이는 `pipeFlow/dynamicRpm/chargeFlowArrow` 외부 명령형 규약과 동일.

### 이벤트 (customEvents)

없음. 개별 단위(meshName='BATT' 확정)이므로 `@meshClicked` 같은 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`: Mixin 적용 (MeshState) + `this.cellHeatmap` API 등록 + (parent/THREE 가용 시) **자동 enable + 임의 그라디언트 데이터로 redraw** (mount 직후 시각 관찰 우선)
- 페이지가 `setGrid/setData/setRange/setColorScale/setOpacity/enable/disable` 호출하여 그리드/데이터/색상 스케일 갱신
- `beforeDestroy.js`: 구독 해제 → `this.cellHeatmap?.destroy()` → `this.meshState?.destroy()` (역순)

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/cellHeatmap |
|------|----------|----------------------|
| `applyMeshStateMixin` | ✓ | ✓ |
| `this.cellHeatmap` 네임스페이스 | 없음 | `setGrid/setData/setRange/setColorScale/setOpacity/enable/disable/getGrid/getRange/destroy` 노출 |
| Three.js CanvasTexture / Canvas 자원 | 없음 | 자체 생성/dispose |
| `material.map` 채널 사용 | 없음 | 사용 (보관/할당/복원) |
| `material.color` 강제 reset (0xffffff) | 없음 | enable 동안 강제 |
| beforeDestroy | meshState만 정리 | cellHeatmap → meshState 역순 정리 |
| 화면 표시 | 단일 색상 | 셀 그리드 단위 온도 분포 |

Standard는 `material.color` 채널만 데이터에 결합한다. Advanced/cellHeatmap은 추가로 (a) `material.map` 채널, (b) 동적 Canvas → CanvasTexture 자원, (c) MeshState color 채널과의 강제 충돌 회피 (white reset), (d) 그리드/데이터/스케일/opacity 외부 명령형 API — 네 채널을 페이지에 노출한다. register.js에 Mixin 적용 + 커스텀 메서드 + Canvas/Texture 라이프사이클이 모두 추가되므로 별도 폴더로 분리한다.

---

## 다른 BATT Advanced 변형과의 관계

| 변형 | 채널 | 표현 |
|------|------|------|
| visibility | `object.visible` | 메시 전체 on/off |
| clipping | `material.clippingPlanes` | 평면 기준 부분 절단 |
| highlight | `material.emissive` (정적 강도) | 선택 강조 |
| dataHud | DOM 오버레이 + 좌표 RAF | 수치 HUD 카드 |
| alarmPulse | `material.emissive` (시간 변조) | 알람 발광 펄스 |
| chargeFlowArrow | 별도 자체 생성 mesh + 위치 RAF | 충/방전 방향 화살표 흐름 |
| hierarchyZoom | 카메라 위치/거리 | rack/module/cell 3단계 줌 진입 |
| **cellHeatmap** | **`material.map` (CanvasTexture)** + **`material.color` 강제 white** | **셀 그리드 단위 온도 분포** |

cellHeatmap은 `material.map` 채널 + `material.color` 강제 reset 채널을 점유한다. emissive 채널은 건드리지 않으므로 alarmPulse/highlight와 직교 — 동일 BATT에 cellHeatmap + alarmPulse 동시 적용 가능. clipping/visibility/카메라/hierarchyZoom과도 직교.

> **MeshStateMixin과의 채널 경합 주의**: cellHeatmap이 enable 동안에는 status 색상이 시각적으로 묻힌다(흰색 강제 + 텍스처 표시). 페이지가 status 색상도 함께 보고 싶으면 cellHeatmap.disable() 후 status 갱신 또는 별도 outline 강조(MeshHighlight)를 활용해야 한다. 현 사이클에서는 별도 변형(예: `cellHeatmap_with_status_outline`)을 만들지 않는다.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.battInstance = wemb.getDesignComponent('BATT');

// BMS의 셀 단위 온도 텔레메트리 수신
const handleCellTemperature = (data) => {
    // data: [{row: 0, col: 0, temp: 25.3}, {row: 0, col: 1, temp: 28.7}, ...]
    this.battInstance.cellHeatmap.setData(data);
};

// 그리드 차원 변경 (BATT 모듈 재구성 시)
this.battInstance.cellHeatmap.setGrid(8, 32);

// 임계값 범위 조정 (계절별 운영 정책)
this.battInstance.cellHeatmap.setRange(15, 70);   // 여름철 50→70℃ 확장

// 임계값 초과 시 일시 disable + alarmPulse 우선
const handleCellOvertemp = (cellInfo) => {
    if (cellInfo.maxTemp > 80) {
        this.battInstance.cellHeatmap.disable();
        this.battInstance.alarmPulse?.start('BATT', { color: 0xff3030, period: 500 });
    }
};
```

---

## 모델 주의사항

- `models/BATT/01_default/BATT.gltf`의 단일 메시 이름은 `'BATT'`로 확정. cellHeatmap은 `getObjectByName('BATT')`로 추적 대상 mesh를 직접 조회하여 material.map/material.color에 mutation을 가한다.
- BATT mesh의 material이 `MeshStandardMaterial`/`MeshPhysicalMaterial`/`MeshBasicMaterial` 등 `map` 속성을 지원하는 타입이면 cellHeatmap 동작. 미지원 타입이면 silent skip.
- **셀 mesh 분리 모델 도입 시(`02_split` 등)**: 본 사이클의 register.js는 그대로 유지하고, 내부 구현만 mode='meshColor'로 분기 (CanvasTexture 대신 셀 mesh 단위 material.color 직접 칠하기). API 시그니처 보존.
- preview는 ACESFilmic 톤매핑 환경에서 색상 그라디언트(파랑→노랑→빨강)가 명확히 관찰 가능.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level만, IIFE 없음 |
| 2 | self-null `this.cellHeatmap = null` | OK — destroy 마지막 줄 |
| 3 | beforeDestroy.js는 호출만 | OK — `this.cellHeatmap?.destroy(); this.meshState?.destroy();` 만 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachCellHeatmap(inst)` 내부 destroy도 `inst.cellHeatmap = null` 포함 + 원본 material.map/color 복원 + texture dispose |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — `setGrid/setData/setRange/setColorScale/setOpacity/enable/disable/getGrid/getRange/destroy` (pipeFlow/alarmPulse/chargeFlowArrow/dataHud의 동사·명사 패턴 답습 — `set*` getter/setter, `enable/disable` 토글, `destroy` self-null) |
| 6 | UI ↔ API 인자 축 일치 | OK — preview rows/cols 슬라이더↔`setGrid(rows, cols)` 1:1, lowT/highT 슬라이더↔`setRange(min, max)`, "Random Data" 버튼↔`setData([...])` 1:1 |
| 7 | 기본값 시각적 관찰 가능성 | OK — preview 로드 직후 자동 enable + 임의 그라디언트 데이터 자동 주입으로 즉시 색상 분포 관찰 |
| 8 | manifest + BATT/CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

---

## 발견한 문제 / Mixin 승격 후보

- **단일 mesh 한계 → CanvasTexture 우회**: BATT.gltf가 단일 'BATT' mesh이므로 진짜 셀 mesh 단위 색상은 불가. 동적 CanvasTexture를 baseColorMap에 매핑하여 우회. 셀 mesh 분리 모델(`02_split`) 도입 시 mode='meshColor'로 분기 가능.
- **MeshState color 채널 강제 reset 정책**: cellHeatmap.enable 동안 `material.color = 0xffffff` 강제. status 색상이 시각적으로 묻힘. 페이지가 status도 보고 싶으면 outline 강조(MeshHighlight) 별도 적용 필요.
- **신규 Mixin (CellHeatmapMixin) 생성 금지** — 메인 루프 정책에 따라 본 사이클은 커스텀 메서드로 완결.
- **Mixin 승격 후보**: cellHeatmap — THERMALCAM/FLIREx/heatmapSurface, meshesArea/area_01/zonalHeatmap 등에서 동일 매핑 기법 재사용 예상

