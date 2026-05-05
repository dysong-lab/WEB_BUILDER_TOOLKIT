# LPR — Advanced/plateDetectionOverlay

## 기능 정의

1. **번호판 mesh 강조 (MeshHighlight 채널)** — `lpr` mesh 자체에 emissive 색상을 적용하여 번호판 인식 활성 상태를 시각적으로 표시한다. 외부에서 `setColor(hex)`로 의미별 색상을 갱신한다 (성공=녹색 / 주의=주황 / 실패=빨강 등 외부 의미 매핑 — 컴포넌트는 정책을 강제하지 않고 호출자가 결정).
2. **번호 텍스트 팝업 (3DShadowPopup 채널)** — 인식된 번호판 텍스트를 Shadow DOM 팝업으로 표시한다. publishCode HTML/CSS는 페이지/에디터에서 결정하지만, 본 변형은 단일 `.plate-text` 클래스에 텍스트를 주입하는 단순 컨벤션을 사용한다 (페이지·publishCode 약속).
3. **외부 명령형 합성 API `this.plateOverlay`** — 두 채널을 합성한 외부 API. `show({ plateNumber, ttl=4000, color })`은 highlight + popup show + popup 텍스트 갱신 + ttl 자동 hide를 한 번에 처리한다. `hide()`는 두 채널을 즉시 해제한다. ttl 타이머는 destroy/hide/재호출 시 반드시 clearTimeout으로 누수 차단.

---

## lpr mesh 구조

| 항목 | 값 |
|------|-----|
| GLTF 경로 | `models/LPR/01_default/LPR.gltf` |
| mesh 이름 | `lpr` (소문자) — 폴더명/컴포넌트명(`LPR`)과 대소문자 다름 |
| 결정 | **단일 mesh** (Standard와 동일) |

근거: 컴포넌트 루트 CLAUDE.md `유형 = 개별 (1 GLTF = 1 Mesh: lpr)`. MeshHighlightMixin은 `getObjectByName('lpr')`로 단일 Mesh material의 emissive 채널을 변경한다.

---

## 본 변형의 핵심 — 기존 Mixin 두 개의 합성

본 변형은 직전 4개 사이클(#29~#33)의 **단일 컴포넌트 mesh 풀 패턴**(자체 mesh × N 풀 + ttl RAF + dispose)과 다르게 **기존 Mixin 두 개의 합성**이 핵심이다. 새 mesh를 만들지 않고, MeshHighlight(emissive) 채널 + 3DShadowPopup(별도 DOM 레이어) 채널을 외부 API 한 줄로 묶는다.

| 채널 | Mixin | 용도 |
|------|-------|------|
| emissive | MeshHighlightMixin | 번호판 인식 활성 상태 발광 표시 |
| Shadow DOM | 3DShadowPopupMixin | 번호 텍스트 팝업 |
| 합성 API | 커스텀 `this.plateOverlay` | 두 채널의 lifecycle 동기화 (show/hide/ttl) |

### #29~#33 답습은 아님

| 사이클 | 패턴 | 본 변형 |
|--------|------|--------|
| #29~#33 | 자체 mesh × N 풀 + ttl RAF + dispose | 채택 안 함 |
| 본 변형 (#34) | 기존 Mixin 합성 + 단일 setTimeout ttl | 기존 Mixin 사용으로 자체 자원 0 |

setTimeout만으로 충분 — 단일 highlight + 단일 popup만 다루므로 RAF가 필요 없다 (다중 entry 풀이 아님).

---

## Mixin 승격 메모 (필수 — 본 변형은 다름)

본 변형은 **기존 Mixin 두 개의 합성**이라 신규 Mixin 후보가 아니다.

> 향후 유사 합성(예: 알람 강조 + 메시지 팝업, 진단 강조 + 진단 코드 팝업)이 늘면 `PlateOverlayMixin`이 아닌 `HighlightWithPopup` 같은 **합성 Mixin** 검토 가능. 다만 "어떤 데이터가 어디서 오느냐"는 본질적으로 컴포넌트 레벨 정책이라 합성 Mixin의 우선순위는 낮다.

WorldMarkerSpawnMixin(#32 + #33 임계점) 후보와는 다른 축 — 본 변형은 **자체 mesh를 만들지 않아** WorldMarkerSpawn 임계점에 카운트되지 않는다.

---

## 구현 명세

### Mixin

MeshHighlightMixin + 3DShadowPopupMixin + 커스텀 `this.plateOverlay`

> Standard의 MeshStateMixin은 본 변형에서 적용하지 않는다. 번호판 인식 활성 상태는 highlight 채널(emissive)이 의미를 가지며, MeshState(material.color)는 운영에서 별도 컴포넌트(예: status 변형)나 다른 데이터 채널이 다룬다. 두 채널을 한 변형에 묶으면 분리 정당성이 모호해진다.

### Mixin 옵션

#### MeshHighlightMixin

| 옵션 | 값 | 의미 |
|------|-----|------|
| highlightColor | 0xffaa00 | 기본 색상 (외부에서 setColor로 덮어씀) |
| highlightIntensity | 0.6 | 번호판이 밝게 보이도록 0.4보다 강하게 |

> Mixin은 `applyMeshHighlightMixin` 호출 시점의 옵션을 사용하므로, 본 변형은 매 호출마다 기본 색상을 재적용(unhighlight → 옵션 변경 → highlight)하기 위해 highlight 적용 전에 `applyMeshHighlightMixin`을 새 옵션으로 다시 부르는 대신 **호출 측 setColor가 highlightColor 옵션 자체를 mutate하지 않고**, unhighlight + clearAll 후 새 색상의 emissive를 직접 적용하는 방식 대신, 본 변형은 단순화를 위해 **MeshHighlight 옵션을 호출 시점마다 재적용하는 패턴 대신** 단일 호출 후 setColor 시점에 mesh.material.emissive를 직접 갱신한다 (Mixin clearAll → highlight 두 단계로는 새 색상 반영 불가하므로).

본 변형의 `setColor` 정책: `meshHighlight.unhighlight('lpr')` → `applyMeshHighlightMixin` 옵션 자체를 갈아끼우지 않고, `meshHighlight.highlight` 호출 후 `lpr` mesh의 `material.emissive.setHex(color)` + `material.emissiveIntensity`를 직접 재설정한다 (MeshHighlightMixin이 material clone을 끝낸 직후 한 번만). 이는 Mixin의 외부 API만으로는 색상 변경이 불가능한 한계를 보완하는 컴포넌트 레벨 정책이며, MeshHighlight Mixin의 내부 originalMap 정합성은 유지된다 (originalMap은 최초 highlight 시점의 emissive 원본이며, color 변경은 다음 unhighlight 시 그 원본으로 복원되므로 의도와 일치).

#### 3DShadowPopupMixin

| 옵션 | 값 | 의미 |
|------|-----|------|
| getHTML | `() => htmlCode` | publishCode.htmlCode (페이지/에디터 결정) |
| getStyles | `() => cssCode` | publishCode.cssCode |

publishCode가 비어있을 때를 대비해 `||` fallback. 본 변형은 페이지·publishCode가 `.plate-text` 클래스를 약속한다는 컨벤션을 따른다 (커스텀 `setText` 메서드가 이 클래스에 텍스트를 주입).

### 커스텀 네임스페이스 `this.plateOverlay`

| 메서드 | 시그니처 | 동작 |
|--------|----------|------|
| `show({ plateNumber, ttl, color })` | `plateNumber: string`, `ttl?: number=4000ms`, `color?: hex=0xffaa00` | 1) 기존 ttl 타이머 clearTimeout, 2) `setColor(color)` (highlight 적용 + emissive 색상 반영), 3) `popup.show()` + `setText(plateNumber)`, 4) ttl > 0이면 setTimeout 예약 → 만료 시 `hide()` |
| `hide()` | — | 기존 ttl clearTimeout, `meshHighlight.unhighlight('lpr')`, `shadowPopup.hide()` |
| `setColor(hex)` | `hex: number` | highlight 활성화 (이미 활성이면 유지) + lpr mesh `material.emissive.setHex` + `emissiveIntensity` 재적용 |
| `setText(text)` | `text: string` | popup의 `.plate-text` 텍스트 갱신 (popup이 미생성이면 이후 show 시점에 반영되도록 큐잉 X — 본 변형은 단순 query 기반이므로 popup 미초기화 상태에서는 no-op, 호출자는 show 후에 호출) |
| `enable()` | — | 활성화 플래그 ON. show/hide 가능 |
| `disable()` | — | 활성화 플래그 OFF. 진행 중 상태는 hide로 정리 |
| `isEnabled()` | — | 활성화 플래그 조회 |
| `destroy()` | — | clearTimeout(ttl) + hide + self-null `this.plateOverlay = null` |

### 옵션 기본값

| 옵션 | 기본값 | 시각 관찰성 |
|------|-------|----------|
| TTL_DEFAULT | 4000 (ms) | show 후 4초 후 자동 hide (인식 결과 임시 표시 의미) |
| COLOR_DEFAULT | 0xffaa00 | 주황 — 활성/주의 |
| EMISSIVE_INTENSITY | 0.6 | 번호판 mesh가 어두운 배경에서도 보이도록 |
| autoEnable on mount | true | 즉시 show 가능 |
| 데모 자동 호출 (preview only) | 마운트 직후 1회 show | 시각 관찰성 우선 (Phase 1.5 #7) |

### 구독 (subscriptions)

본 변형은 데이터 토픽 구독 없음. 모든 표시는 외부 명령형 호출(`plateOverlay.show`)로 시작된다. 운영에서는 페이지가 인식 토픽 어댑터에서 `show({ plateNumber })`를 호출한다.

### 이벤트 (customEvents)

없음. 개별 단위(meshName='lpr' 확정)이므로 동적 식별 이벤트 불필요.

### 라이프사이클

- `register.js`:
  1. MeshHighlightMixin 적용
  2. 3DShadowPopupMixin 적용
  3. `this.plateOverlay` API 등록 + 자동 enable
- 페이지가 외부 명령형으로 `plateOverlay.show(...)` / `hide()` 호출
- `beforeDestroy.js`: `this.plateOverlay?.destroy()` → `this.shadowPopup?.destroy()` → `this.meshHighlight?.destroy()` (역순)
  - plateOverlay.destroy 내부에서 hide(highlight unhighlight + popup hide)까지 호출되지만, Mixin destroy는 별도로 명시 호출 (Mixin 자체 정리는 plateOverlay 책임 밖).

---

## Standard와의 분리 정당성

| 항목 | Standard | Advanced/plateDetectionOverlay |
|------|----------|-------------------------------|
| `applyMeshStateMixin` | ✓ | **없음** (의도적 — material.color 채널은 본 변형의 의미와 무관) |
| `applyMeshHighlightMixin` | 없음 | ✓ (emissive 채널) |
| `apply3DShadowPopupMixin` | 없음 | ✓ |
| `this.plateOverlay` 합성 API | 없음 | ✓ |
| ttl 자동 hide 타이머 | 없음 | ✓ (setTimeout, RAF 불필요) |
| 외부 명령형 trigger | 없음 (구독만) | show/hide/setColor/setText |

Standard는 데이터 토픽 구독에 따라 단일 Mesh의 `material.color`를 갱신한다. Advanced/plateDetectionOverlay는 (a) emissive 채널, (b) Shadow DOM 팝업 채널, (c) 두 채널을 ttl로 묶는 외부 명령형 API — 세 채널을 페이지에 노출하며 register.js에 두 Mixin 적용 + 합성 메서드가 추가된다. 별도 폴더로 분리하는 것이 분리 기준에 부합한다.

---

## 페이지 측 연동 패턴 (운영)

```javascript
// loaded.js
this.lprInst = wemb.getDesignComponent('LPR');

// 인식 토픽 어댑터 (예시)
const onPlateRecognition = (data) => {
    // data: { recognized: bool, plateNumber: string, confidence: number }
    if (!data.recognized) {
        this.lprInst.plateOverlay.show({
            plateNumber: '인식 실패',
            color:       0xff3344,   // 빨강
            ttl:         3000
        });
        return;
    }
    const color = data.confidence > 0.9 ? 0x00ff66    // 녹색 — 신뢰 높음
                : data.confidence > 0.6 ? 0xffaa00    // 주황 — 주의
                                        : 0xff3344;   // 빨강 — 신뢰 낮음
    this.lprInst.plateOverlay.show({
        plateNumber: data.plateNumber,
        color,
        ttl: 4000
    });
};

// 즉시 hide
this.lprInst.plateOverlay.hide();
```

---

## 모델 주의사항

- `models/LPR/01_default/LPR.gltf`의 단일 메시 이름은 `'lpr'`(소문자). MeshHighlightMixin이 `getObjectByName('lpr')`로 emissive 채널을 변경.
- GLTF 루트 `root` Node가 `scale [1000, 1000, 1000]`이지만 본 변형은 `lpr` mesh 자체의 material만 다루므로 scale 영향 없음 (자체 mesh 생성 없음).
- 텍스처 폴더명 `textues/`(원본 오타) 보존 — GLTF 내부 `images[0].uri`가 이 경로를 참조.
- **[MODEL_READY] placeholder 사용 안 함** — meshName='lpr'은 Standard에서 이미 확정.

---

## Phase 1.5 자율검증 결과

| # | 항목 | 결과 |
|---|------|------|
| 1 | register.js 평탄 (IIFE 금지) | OK — top-level 평탄 (highlight 답습) |
| 2 | self-null `this.plateOverlay = null` | OK — destroy 마지막 줄 self-null + clearTimeout. Mixin 인스턴스(meshHighlight/shadowPopup)는 각자 self-null 패턴이 있어 호출만 |
| 3 | beforeDestroy.js는 호출만 | OK — `this.plateOverlay?.destroy(); this.shadowPopup?.destroy(); this.meshHighlight?.destroy();` 호출만, null 할당 생략 |
| 4 | preview attach 함수 destroy 일치 | OK — `attachPlateOverlay(inst)` 내부 destroy도 clearTimeout + `inst.plateOverlay = null` 포함 |
| 5 | 커스텀 메서드 시그니처 일관성 | OK — show/hide/setColor/setText/enable/disable/isEnabled/destroy (#33 detectionMarkers 8 메서드 패턴과 일관 — add/remove/clear에 해당하는 동사를 본 변형 의미에 맞춰 show/hide/setColor/setText로 변경) |
| 6 | UI ↔ API 인자 축 일치 | OK — Show("12가3456") ↔ plateOverlay.show({plateNumber:'12가3456'}), Hide ↔ hide(), 색상 토글 ↔ setColor(hex) |
| 7 | 기본값 시각 관찰 | OK — preview 로드 직후 자동 enable + **마운트 직후 1회 show("12가3456")** 시연 → highlight emissive + popup 즉시 보임. ttl=null로 영구 표시 |
| 8 | manifest + 컴포넌트 루트 CLAUDE.md 등록 | 본 사이클에서 처리 (ADVANCED_QUEUE는 메인 루프 담당) |

---

## 발견한 문제 / Mixin 승격 메모

- **합성 Mixin 후보 — 우선순위 낮음**: 본 변형은 MeshHighlightMixin + 3DShadowPopupMixin 합성 + 커스텀 `plateOverlay` ttl 타이머. 향후 유사 합성(알람 강조 + 메시지 팝업 등)이 추가되면 `HighlightWithPopup` 같은 합성 Mixin 검토 가능. 다만 "어떤 데이터가 어디서 오느냐"가 컴포넌트 레벨 정책이므로 합성 Mixin 우선순위는 낮다.
- **MeshHighlightMixin의 동적 색상 변경 한계**: Mixin 외부 API(`highlight`/`unhighlight`)만으로는 highlight 후 색상을 바꿀 수 없다 (옵션이 apply 시점에 고정). 본 변형은 setColor에서 lpr mesh material.emissive를 직접 재설정하여 보완 — Mixin originalMap 정합성은 유지(originalMap은 최초 highlight 직전 emissive 원본). 이 한계가 추가 변형에서 반복 등장하면 MeshHighlightMixin 자체에 `setHighlightColor(meshName, hex)` API 추가를 검토.
- **ttl 타이머 누수 방지**: setTimeout id를 모듈 스코프 변수로 보관하고 destroy/hide/show 호출 시 반드시 clearTimeout. RAF가 아니므로 idle 비용 0은 자연스러움 (타이머 없음 = 비활성).
