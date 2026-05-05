# Sliders/Basic — Advanced / keyboardArrowControl

## 기능 정의

1. **슬라이더 상태 렌더링 (Standard 호환)** — `sliderInfo` 토픽으로 수신한 객체(`{ label, value, min, max, step, disabled, valueText?, fineStep?, coarseStep?, superCoarseStep? }`)를 라벨/값 표시/핸들 위치/활성 트랙 길이에 반영한다 (Standard와 동일한 FieldRenderMixin + `updateSliderValue` 파생).
2. **자체 step 키보드 미세 조정 (핵심 차별)** — `input[type=range]`에 `keydown` 핸들러를 부착하여 native ←/→/Home/End/PageUp/PageDown 동작을 `preventDefault`하고 자체 step 단위로 처리한다.
   - **ArrowLeft / ArrowDown** → `value - fineStep`
   - **ArrowRight / ArrowUp** → `value + fineStep`
   - **Shift + Arrow** → `coarseStep` 단위 점프 (기본 10)
   - **Ctrl/Meta + Arrow** → `superCoarseStep` 단위 점프 (기본 25)
   - **Home** → `min`으로 이동
   - **End** → `max`로 이동
   - **PageUp** → `value + coarseStep`
   - **PageDown** → `value - coarseStep`
   - 결과는 `[min, max]`로 clamp 후 input.value 갱신 + 활성 트랙 width + valueText 즉시 동기 갱신.
3. **focus ring 강화 (시각 차별)** — input이 keyboard focus를 가지면 루트 `.slider`에 `data-focused="true"`를 토글하여 thumb에 강한 focus ring을 적용한다(`blur` 시 false). pointer 클릭으로만 focus되는 경우에도 동일하게 강조하여 키보드 접근성을 시각적으로 노출.
4. **ariaValueText 동기화** — input의 `aria-valuenow`와 `aria-valuetext`(displayText)를 매 갱신마다 동기화하여 스크린리더가 실제 표시값을 읽도록 한다.
5. **값 변경 이벤트** — keydown으로 값이 바뀐 직후 `@valueChanged` 발행 (payload: `{ targetInstance, event, value, source: 'keyboard' }`). pointer 드래그(native input 이벤트)도 동일 이벤트로 통합 발행 (`source: 'pointer'`). 키보드 점프 분류(fine/coarse/superCoarse/home/end/page) 1회 보조 이벤트 `@keyboardJump` 발행 (payload: `{ targetInstance, key, modifier, value }`).

> **Standard와의 분리 정당성**:
> - **자체 상태 6종** — `_fineStep` / `_coarseStep` / `_superCoarseStep`(매 publish 마다 갱신되는 step 트리오) / `_inputEl` / `_sliderEl` / `_handlers`(keydown / focus / blur / input 4종 bound 참조). Standard는 stateless.
> - **새 이벤트 2종** — `@valueChanged`(Standard `@sliderChanged` 대체 — `source` 필드로 키보드/포인터 구분) + `@keyboardJump`(키 분류 + 모디파이어 1회). Standard는 `@sliderChanged` 1종만.
> - **새 cssSelectors KEY 0종 + datasetAttr 신설 1종(focused)** — 기존 KEY 재활용. `slider`의 `data-focused`가 신설.
> - **자체 메서드 5종** — `updateSliderValue`(확장 — fineStep/coarseStep/superCoarseStep 흡수) / `_handleKeyDown`(키 디스패치 + preventDefault + clamp + 즉시 동기 갱신) / `_handleFocus` / `_handleBlur` / `_handleInput`(pointer source).
> - **native step 무시 + 자체 step 트리오** — Standard는 input의 native `step`을 그대로 쓰지만, 본 변형은 `keydown`을 가로채 modifier 별로 다른 step을 적용한다. native `step` 속성은 pointer 드래그 해상도용으로만 유지(elementAttrs 동일).
>
> 위 5축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.
>
> **참조 패턴**:
> - **Sliders/Basic/Standard** (직전, 같은 컴포넌트) — FieldRenderMixin + `updateSliderValue` 파생 + `input` 이벤트로 양방향 흐름. 본 변형은 동일 토대 위에 `keydown` 가로채기 + 자체 step 디스패치 + focus ring 토글을 추가.
> - **Sliders/Basic/Advanced/discreteWithMarks** (직전, 동일 컴포넌트, 6단계) — bound handler 참조 보관 + native pointer/key 라이프사이클 + beforeDestroy 명시 detach 패턴 + preview `<script src>` 6단계. 본 변형도 동일 패턴을 답습.
> - **Sliders/Basic/Advanced/tooltip** (동일 컴포넌트, 6단계) — focus/blur로 키보드 조작 흡수 + visibility 라이프사이클. 본 변형은 focus/blur로 `data-focused` 토글.
>
> **MD3 / 도메인 근거**: MD3 Slider 명세는 키보드 접근성을 표준화한다(WAI-ARIA "slider" 패턴 — Arrow/Home/End/PageUp/PageDown 필수). native input range는 step 1개만 받아 modifier 조합(Shift/Ctrl)을 통한 점프를 지원하지 않는다. 정밀 색상 hue 조정(0~360 hue, fine=1°/coarse=15°/super=45°) / 오디오 master gain(-60~+12 dB, fine=0.5/coarse=3/super=6) / 비디오 timeline 미세 시킹(1/15/60s) / 접근성 보조 등 **세밀+점프 양방향 키보드 정밀 조작**이 필요한 시나리오에서 modifier 분기 step이 필수.

---

## 구현 명세

### Mixin

**FieldRenderMixin** + 커스텀 메서드 5종 (`updateSliderValue`, `_handleKeyDown`, `_handleFocus`, `_handleBlur`, `_handleInput`).

> Mixin 조합은 Standard와 동일(FieldRenderMixin 단일). Advanced 분리는 mixin 추가가 아니라 **자체 step 트리오 상태 + native keydown 가로채기 + focus ring 토글 + 추가 이벤트 2종**으로 이루어진다. 신규 Mixin 생성 없음.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| slider      | `.slider`               | 루트 — `data-disabled` + `data-focused` 대상 |
| label       | `.slider__label`        | 라벨 텍스트 (textContent) |
| valueText   | `.slider__value-label`  | 포맷된 현재 값 (textContent) |
| input       | `.slider__input`        | `input[type=range]` — value/min/max/step 속성 + native keydown/focus/blur/input 리스너 부착 대상 |
| min         | `.slider__input`        | input의 `min` 속성 대상 (elementAttrs) |
| max         | `.slider__input`        | input의 `max` 속성 대상 (elementAttrs) |
| step        | `.slider__input`        | input의 `step` 속성 대상 (elementAttrs) — pointer 드래그 해상도용 |
| value       | `.slider__input`        | input의 `value` 속성 대상 (elementAttrs) |
| progress    | `.slider__track-active` | 활성 트랙 — `style.width = N%` (styleAttrs) |

### datasetAttrs

(없음 — `slider`의 `data-disabled` / `data-focused`는 컴포넌트가 직접 갱신하며 KEY로 관리하지 않는다.)

### elementAttrs

| KEY | VALUE (HTML attribute) |
|-----|-----------------------|
| min   | `min`   |
| max   | `max`   |
| step  | `step`  |
| value | `value` |

### styleAttrs

| KEY | VALUE |
|-----|-------|
| progress | `{ property: 'width', unit: '%' }` |

### 인스턴스 상태

| 키 | 타입 | 기본 | 설명 |
|----|------|------|------|
| `_fineStep` | `number` | `1` | 단순 ←/→ 입력 단위. publish의 `fineStep`을 우선, 없으면 `step` 속성 값 |
| `_coarseStep` | `number` | `10` | Shift+Arrow / PageUp / PageDown 단위. publish의 `coarseStep` 우선 |
| `_superCoarseStep` | `number` | `25` | Ctrl/Meta+Arrow 단위. publish의 `superCoarseStep` 우선 |
| `_inputEl` | `Element \| null` | `null` | register.js에서 cache. native 리스너 부착 대상 |
| `_sliderEl` | `Element \| null` | `null` | register.js에서 cache. `data-focused` 토글 대상 |
| `_keyDownHandler` / `_focusHandler` / `_blurHandler` / `_inputHandler` | `Function \| null` | `null` | bound handler 참조 — beforeDestroy에서 정확히 removeEventListener |

### 구독 (subscriptions)

| topic | handler | 비고 |
|-------|---------|------|
| `sliderInfo` | `this.updateSliderValue` | Standard 호환. payload에 `fineStep?` / `coarseStep?` / `superCoarseStep?` 추가 슬롯. |

### 이벤트 (customEvents — Wkit.bindEvents, 일반 DOM)

(없음 — discreteWithMarks/tooltip 변형과 동일 이유. native 리스너 단일 채널로 통일하여 키보드/포인터 양쪽의 발행 순서를 일관되게 유지. `customEvents = {}` (빈 객체)는 라이프사이클 호환성 확보용으로 유지.)

### 자체 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@valueChanged` | input 이벤트(pointer 드래그) 또는 keydown으로 값 변경 직후 | `{ targetInstance, event, value, source: 'keyboard' \| 'pointer' }` |
| `@keyboardJump` | 키보드 점프(미세/굵은/매우 굵은/Home/End/Page) 시점 1회 | `{ targetInstance, key, modifier, value }` (modifier: `'none' \| 'shift' \| 'ctrl'`) |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `updateSliderValue({ response })` | `({response}) => void` | Standard 호환 + `fineStep/coarseStep/superCoarseStep` 슬롯 흡수. `progress`/`valueText` 파생 + `fieldRender.renderData` 위임 + `data-disabled` 갱신 + `aria-valuenow`/`aria-valuetext` 동기 + step 트리오 갱신 |
| `_handleKeyDown(e)` | `(KeyboardEvent) => void` | 대상 키만 `preventDefault` + modifier별 step 결정 + clamp + input.value 갱신 + progress 즉시 동기 갱신 + valueText 즉시 동기 갱신 + `aria-*` 동기 + `@valueChanged(source: 'keyboard')` + `@keyboardJump` 발행 |
| `_handleFocus(e)` | `(FocusEvent) => void` | `_sliderEl.dataset.focused = 'true'` |
| `_handleBlur(e)` | `(FocusEvent) => void` | `_sliderEl.dataset.focused = 'false'` |
| `_handleInput(e)` | `(InputEvent) => void` | pointer 드래그용. `@valueChanged(source: 'pointer')` 발행 |

### 페이지 연결 사례

```
[페이지 onLoad]
   │
   ├─ this.pageDataMappings = [
   │     { topic: 'sliderInfo', datasetInfo: {...} }
   │  ];
   │
   └─ Wkit.onEventBusHandlers({
        '@valueChanged': ({ event, value, source, targetInstance }) => {
            const next = source === 'pointer' ? Number(event.target.value) : value;
            state.value = next;
            targetInstance.updateSliderValue({ response: { ...state } });
        },
        '@keyboardJump': ({ key, modifier, value }) => {
            analytics.track('slider_keyboard_jump', { key, modifier, value });
        }
      });
```

publish 예 (color hue):
```javascript
publish('sliderInfo', {
    label: 'Hue',
    value: 180,
    min: 0, max: 360, step: 1,
    fineStep: 1,           // ← / →
    coarseStep: 15,        // Shift+ ← / →, PageUp/Down
    superCoarseStep: 45,   // Ctrl+ ← / →
    valueText: '180°',
    disabled: false
});
```

### 디자인 변형

| 파일 | 페르소나 | focus ring 시각 차별 + 도메인 컨텍스트 |
|------|---------|-----------------------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 tonal — focus 시 thumb 주위 6px 라벤더 글로우 + 1px 내부 화이트 보더. **도메인**: 디자이너 색상 패널의 **hue 정밀 조정** (0~360°, fine=1° / coarse=15° / super=45°) — 키보드만으로 360단계 빠른 탐색 |
| `02_material`    | B: Material Elevated | 라이트 블루 Filled — focus 시 thumb 주위 8px state layer (rgba blue 24%) + box-shadow elevation. **도메인**: 미디어 플레이어 **오디오 master gain 미세 조정** (-60~+12 dB, fine=0.5 / coarse=3 / super=6) — 청각 보조용 정밀 조작 |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 헤어라인 — focus 시 thumb 주위 1px 차콜 outline + 4px 오프셋 (서리 frost). **도메인**: 비디오 편집 툴의 **timeline 미세 시킹** (0~3600s, fine=1s / coarse=15s / super=60s) — 프레임 단위 키보드 컨트롤 |
| `04_operational` | D: Dark Operational  | 다크 시안 컴팩트 — focus 시 thumb 주위 3px solid cyan ring + 2px glow. **도메인**: 관제 콘솔 **detection threshold 접근성 보조** (0~100%, fine=1 / coarse=10 / super=25) — 키보드 only 시나리오 |

각 페르소나는 `.slider[data-focused="true"]`일 때 thumb pseudo-element(`::-webkit-slider-thumb`, `::-moz-range-thumb`)에 추가 box-shadow/outline을 적용한다.

### 결정사항

- **wkit.bindEvents 비사용**: discreteWithMarks/tooltip 변형과 동일 이유. native 리스너 단일 채널로 키보드/포인터 발행 순서를 일관되게 유지. `customEvents = {}` (빈 객체)는 라이프사이클 호환성 확보용.
- **keydown preventDefault 범위 제한**: 본 변형이 처리하는 키(`ArrowLeft/Right/Up/Down/Home/End/PageUp/PageDown`)만 preventDefault. Tab/Enter/Escape 등 시스템 키는 native 동작 유지.
- **즉시 동기 갱신**: keydown으로 값이 바뀌면 페이지 응답을 기다리지 않고 input.value/progress/valueText/aria 모두 동기 갱신 — 페이지 미응답 환경에서도 시각 일관성 보장. 페이지가 sliderInfo 재publish하면 동일 값으로 다시 그려져 차이 없음.
- **focus ring 토글 위치**: `data-focused`는 input이 아니라 루트 `.slider`에 토글 — CSS에서 thumb pseudo-element를 `data-focused` 부모 셀렉터로 강조하기 위함.
- **modifier 우선순위**: Ctrl/Meta(superCoarse) > Shift(coarse) > 모디파이어 없음(fine). Ctrl과 Shift 동시 입력은 superCoarse 우선.
- **단방향 데이터 흐름**: 컴포넌트는 step 트리오 캐시만 보관, value 결정은 페이지가 담당. native input/keydown → `@valueChanged` 발행 → 페이지가 새 value 결정 → `sliderInfo` 재publish → `updateSliderValue`에서 progress + valueText 동시 갱신.
- **신규 Mixin 생성 금지**: FieldRenderMixin + 자체 메서드 조합으로 완결.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 6단계 (`Components/Sliders/Basic/Advanced/keyboardArrowControl/preview/...html` → `../`를 6번)
