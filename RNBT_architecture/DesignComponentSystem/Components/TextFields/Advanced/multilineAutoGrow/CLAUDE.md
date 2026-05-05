# TextFields — Advanced / multilineAutoGrow

## 기능 정의

1. **TextField 기본 렌더링 (Standard 호환 KEY)** — `textField` 토픽으로 수신한 객체 데이터(`{ label, required, value, placeholder, leadingIcon, trailingIcon, supporting, errorText, state, minRows?, maxRows? }`)를 FieldRenderMixin으로 매핑. cssSelectors KEY는 Standard 호환(`root` / `label` / `leadingIcon` / `value` / `placeholder` / `trailingIcon` / `supporting` / `errorText` / `state` / `required`). 단, **`value`/`placeholder`의 element type이 `<input>` → `<textarea>`로 변경**된 것이 본 변형의 핵심 시각/구조 차이.
2. **textarea 기반 입력 — 단일 라인 → 다중 라인 전환** — Standard의 `<input class="text-field__input" type="text">`를 `<textarea class="text-field__input"></textarea>`로 교체. Enter 키로 줄바꿈 가능. textarea의 `value` / `placeholder` 속성은 input과 동일하게 FieldRenderMixin이 elementAttrs로 반영.
3. **`_minRows` / `_maxRows` 자체 상태** — 페이지가 ① `textField` 토픽에 `minRows` / `maxRows` 필드를 동봉해 발행하거나, ② `setRowsRange` 토픽으로 `{ minRows, maxRows }`를 publish하면 자체 상태 갱신. 갱신 즉시 textarea 높이를 재계산해 새 범위 안으로 clamp.
4. **자동 높이 계산 알고리즘 — auto/scrollHeight/clamp 3단계** — 매 input/paste/cut 이벤트에서 `_recomputeHeight()` 호출. ① `textarea.style.height = 'auto'`로 reset(현재 height의 영향 제거) → ② `textarea.style.height = textarea.scrollHeight + 'px'`로 content 기준 설정 → ③ `_minRows * lineHeight` 이하면 minHeight로, `_maxRows * lineHeight` 초과면 maxHeight로 clamp. lineHeight는 computed style에서 산출(첫 호출 시 캐시).
5. **maxRows 도달 후 overflow 스크롤** — `_maxRows * lineHeight` 도달 시 textarea의 `overflow-y: auto`로 스크롤 활성. 시각적으로 더 이상 자라지 않으며 textarea 내부에서 사용자가 스크롤. `overflow-y` 토글은 `_recomputeHeight`가 직접 style 갱신.
6. **input/paste/cut 이벤트가 grow 트리거** — 자체 native handler 3종(`_handleInput` / `_handlePaste` / `_handleCut`). 각각 ① `_recomputeHeight()` 호출(paste/cut은 next tick에 실행 — 클립보드 처리 후 value 반영 보장). 단순 `input` 이벤트만으로도 paste/cut가 잡히지만, **고해상도 paste 직후 한 번에 큰 height jump를 부드럽게**하기 위해 paste/cut 별도 핸들러를 둔다(setTimeout 0).
7. **외부 토픽 `setRowsRange` 수신 — minRows/maxRows 직접 갱신** — 페이지가 ① 단계 전환(예: 댓글 1줄 입력 → 답글 모드 3줄), ② 사용자 권한별 다른 한도 적용 시. 갱신 즉시 textarea 재계산 + emit.
8. **외부 토픽 `setMultilineValue` 수신 — value 채우고 즉시 grow** — 페이지가 외부 데이터 주입(예: 임시 저장본 복원, AI 자동완성 결과)으로 textarea에 값 set + `_recomputeHeight()` 호출. textField 토픽의 `value` 필드와 차이는 ① 다른 데이터 갱신 없이 **값과 높이만** 갱신, ② emit `@heightChanged` 명시적 통보.
9. **`@heightChanged` 발행** — 매 input/paste/cut 후(또는 `setRowsRange` / `setMultilineValue` 갱신 후 자동 재계산) `Weventbus.emit('@heightChanged', { pixelHeight, rowCount, minRows, maxRows, value })` 발행. 페이지가 컨테이너 layout 재계산(예: 모달 높이 자동 조정, 부모 grid row 갱신, sticky footer 위치 보정) 시 사용.
10. **change(blur/Enter) — Standard 호환** — `@textFieldChanged` 발행. 본 변형은 `@textFieldInput`은 의도적 미발행(masking/autoComplete/validation/characterCounter 결정 답습 — 자체 native input handler가 권위 채널).
11. **Trailing 클릭 — Standard 호환** — `@textFieldTrailingClicked` 발행. 페이지가 clear / submit 등 결정.

> **Standard와의 분리 정당성 (5축)**:
> - **자체 상태 5종** — `_minRows: number`(최소 줄 수, default 1), `_maxRows: number`(최대 줄 수, default 8), `_lineHeightPx: number`(첫 측정 후 캐시 — 매 호출 reflow 회피), `_inputHandler`/`_pasteHandler`/`_cutHandler` (bound refs — beforeDestroy 정확 제거). Standard는 stateless.
> - **새 토픽 2종** — `setRowsRange`(범위 갱신), `setMultilineValue`(값 + 높이 동시 갱신). Standard는 `textField` 단일 토픽이며 multiline 개념이 없다(input type="text" 단일 라인).
> - **새 이벤트 1종** — `@heightChanged({pixelHeight, rowCount, minRows, maxRows, value})`. Standard의 `@textFieldChanged`(blur/Enter 시점)는 매 keystroke마다 높이 변화를 통보하지 않으며, 단일 라인 input은 height 자체가 고정이므로 의미 없음.
> - **자체 메서드 7종** — `_measureLineHeight()`, `_clampHeight(rawPx)`, `_recomputeHeight()`, `_renderTextField({response})`, `_handleSetRowsRange({response})`, `_handleSetMultilineValue({response})`, `_handleInput(e)` / `_handlePaste(e)` / `_handleCut(e)`. 자체 native input/paste/cut handler 3종으로 매 입력 이벤트 → height 재계산 → emit. Standard는 자체 메서드 0개.
> - **HTML element type 변경 — input → textarea** — `value` KEY가 가리키는 element가 `<input type="text">`에서 `<textarea>`로 교체. FieldRenderMixin은 element type을 가리지 않고 `setAttribute('value', ...)`를 적용하지만, **textarea는 `value` 속성보다 `value` property + textContent의 동작 차이가 있어** value KEY 매핑이 element type에 의존(elementAttrs.value="value" 그대로 사용 가능 — textarea도 `setAttribute('value', ...)`로 초기값 설정 가능, 단 사용자 입력 후엔 property가 권위). placeholder는 textarea도 그대로 지원.

> **유사 변형과의 비교**: `TextFields/Advanced/masking`이 "input 이벤트 → in-place 포맷팅 + caret 보존 + raw/formatted 분리 emit"을 자체 메서드로 흡수했고, `TextFields/Advanced/validation`이 "input 이벤트 → validators 검증 + state/errorText 토글 + emit"을, `TextFields/Advanced/characterCounter`가 "input 이벤트 → countMode 길이 산출 + 임계 토글 + autoTrim + emit"을 흡수한 것과 같은 native input handler + bound refs + beforeDestroy 정확 제거 패턴을 답습한다. 차이는 ① **HTML element 자체가 input → textarea로 변경**(masking/autoComplete/validation/characterCounter는 모두 input 유지), ② paste/cut 핸들러 추가(클립보드 paste로 한 번에 N줄 들어오는 경우 grow 처리 — 단일 라인 input은 paste가 height 변화를 일으키지 않으므로 불필요했음), ③ 새 이벤트 `@heightChanged`는 픽셀 단위 height + rowCount를 동봉해 페이지가 외부 layout 재계산에 사용(masking의 raw/formatted, validation의 errors, characterCounter의 percent와 다른 도메인 — UI layout).

> **MD3 / 도메인 근거**: MD3 spec의 "Multiline text field" — "Used for longer responses such as comments, reviews, or feedback. The field should grow to accommodate the user's input.". Material Components(MUI TextField + `multiline` + `maxRows`/`minRows` props, Vuetify VTextarea + `auto-grow` prop)에서 일반화. 실사용 예: ① **댓글/답글 입력** (minRows: 1, maxRows: 4 — 짧은 입력에서 시작하여 길어지면 자라남), ② **메모/노트 작성** (minRows: 3, maxRows: 12 — 처음부터 일정 높이 확보, 길어지면 적당히 자라남), ③ **리뷰/피드백** (minRows: 4, maxRows: 8 — 작성 가이드 시각적 확보), ④ **운영 콘솔 로그/명령어 입력** (minRows: 2, maxRows: 6 + monospace — 다중 명령 입력). 페이지가 도메인에 따라 minRows/maxRows 조합을 선택.

---

## 구현 명세

### Mixin

FieldRenderMixin (단일) + 자체 상태 6종 + 자체 메서드 9종.

> **신규 Mixin 생성 금지** — multilineAutoGrow는 textField의 입력 element type 변경 + height 자동 계산 정책 확장이며, FieldRenderMixin이 label/value/placeholder/leading/trailing/supporting/error/state/required 매핑을 그대로 담당(elementAttrs는 textarea에도 동일 동작). ListRender/ShadowPopup 등 추가 Mixin 불필요. masking/autoComplete/validation/characterCounter/multilineAutoGrow 5종이 자체 input native handler 패턴을 답습 — `InputBehaviorMixin` 일반화 검토 후보(SKILL 회귀 규율, 본 사이클은 메모만).

### cssSelectors (`this.fieldRender`)

| KEY | VALUE | 용도 |
|-----|-------|------|
| root         | `.text-field`              | 루트 — `data-state` / `data-required` 부착 + 이벤트 스코프 |
| label        | `.text-field__label`       | 라벨 텍스트 |
| leadingIcon  | `.text-field__leading`     | 시작 아이콘 자리 |
| value        | `.text-field__input`       | **textarea** 입력 — `value` 속성 반영 + 자체 input/paste/cut 핸들러 부착 영역 |
| placeholder  | `.text-field__input`       | textarea — `placeholder` 속성 반영 |
| trailingIcon | `.text-field__trailing`    | 끝 아이콘 자리 — bindEvents click 매핑 |
| supporting   | `.text-field__supporting`  | 보조 텍스트 (helper) |
| errorText    | `.text-field__error`       | 에러 메시지 |
| state        | `.text-field`              | dataset 반영 대상 (state) |
| required     | `.text-field`              | dataset 반영 대상 (required) |

> **Standard와 동일 KEY 셋**. 차이는 KEY가 가리키는 element type만 `<input>` → `<textarea>`. 이벤트 위임/dataset/elementAttrs는 모두 textarea에서도 정상 동작.

### datasetAttrs (`this.fieldRender`)

| KEY | VALUE |
|-----|-------|
| state    | state    |
| required | required |

### elementAttrs (`this.fieldRender`)

| KEY | VALUE | 동작 |
|-----|-------|------|
| value       | value       | textarea의 `value` 속성에 반영 |
| placeholder | placeholder | textarea의 `placeholder` 속성에 반영 |

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_minRows` | `number` | 최소 줄 수 (default: 1). textarea의 최소 높이 = `_minRows * _lineHeightPx`. |
| `_maxRows` | `number` | 최대 줄 수 (default: 8). 도달 시 overflow-y:auto로 스크롤. |
| `_lineHeightPx` | `number` | 첫 `_measureLineHeight()` 호출 후 캐시. lineHeight가 'normal'이면 fontSize * 1.2로 fallback. |
| `_inputHandler` | `function \| null` | textarea `input` 이벤트 bound ref — beforeDestroy 정확 제거용. |
| `_pasteHandler` | `function \| null` | textarea `paste` 이벤트 bound ref. |
| `_cutHandler`   | `function \| null` | textarea `cut` 이벤트 bound ref. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `textField`         | `this._renderTextField`         | `{ label, required, value, placeholder, leadingIcon, trailingIcon, supporting, errorText, state, minRows?, maxRows? }` — Standard 호환 + 선택적 행 범위. `_renderTextField`가 minRows/maxRows 추출해 자체 상태 갱신, fieldRender.renderData에 위임 후 `_recomputeHeight()` 호출(초기 높이 적용). |
| `setRowsRange`      | `this._handleSetRowsRange`      | `{ minRows, maxRows }` — 범위 직접 갱신. 갱신 즉시 textarea 재계산 + emit. |
| `setMultilineValue` | `this._handleSetMultilineValue` | `{ value }` — 값 채우고 즉시 grow. textarea.value 직접 set + `_recomputeHeight()` + emit. |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 |
|--------|------------------|------|
| change | `value` (fieldRender)        | `@textFieldChanged` (Standard 호환) |
| click  | `trailingIcon` (fieldRender) | `@textFieldTrailingClicked` (Standard 호환) |

> input/paste/cut 이벤트는 customEvents에서 위임하지 않고 자체 native handler(`_handleInput` / `_handlePaste` / `_handleCut`)로 처리 — height 재계산 + emit이 한 번에 일어나야 하므로 native handler가 권위 있는 채널. paste/cut은 setTimeout 0으로 next tick에 호출(클립보드 처리 후 textarea.value 반영 보장). `@textFieldInput`은 의도적 미발행(masking/autoComplete/validation/characterCounter 결정 답습).

### 자체 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@heightChanged` | 매 input/paste/cut keystroke / `setRowsRange` 갱신 / `setMultilineValue` 갱신 / 초기 `textField` 렌더 후 | `{ pixelHeight, rowCount, minRows, maxRows, value }` (`pixelHeight`: clamp 적용 후 textarea.style.height 픽셀 정수, `rowCount`: pixelHeight / lineHeight 반올림, `minRows`/`maxRows`: 현재 범위, `value`: 현재 textarea 값) |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_measureLineHeight()`              | `() => number` | textarea computed style의 `lineHeight`를 pixel로 반환. `'normal'`이면 `fontSize * 1.2` fallback. 첫 호출 후 `_lineHeightPx`에 캐시. |
| `_clampHeight(rawPx)`               | `(number) => number` | `_minRows * _lineHeightPx ≤ rawPx ≤ _maxRows * _lineHeightPx`로 clamp. 양쪽 boundary 포함. |
| `_recomputeHeight()`                | `() => {pixelHeight, rowCount}` | 핵심 알고리즘. ① `textarea.style.height = 'auto'` reset, ② `textarea.scrollHeight` 측정, ③ `_clampHeight(scrollHeight)` 적용, ④ `textarea.style.height = clamped + 'px'`, ⑤ scrollHeight ≥ maxRowsPx면 `overflow-y: auto`, 미만이면 `overflow-y: hidden`. ⑥ `@heightChanged` emit. |
| `_renderTextField({ response })`    | `({response}) => void` | `textField` 토픽 핸들러. `response.minRows` / `maxRows`가 있으면 자체 상태 갱신. fieldRender.renderData 위임 후 `_recomputeHeight()`. |
| `_handleSetRowsRange({ response })` | `({response}) => void` | `setRowsRange` 토픽 핸들러. `_minRows` / `_maxRows` 갱신 + `_recomputeHeight()` + emit. |
| `_handleSetMultilineValue({ response })` | `({response}) => void` | `setMultilineValue` 토픽 핸들러. textarea.value set + `_recomputeHeight()`. |
| `_handleInput(e)`                   | `(InputEvent) => void` | textarea `input` 이벤트. `_recomputeHeight()` 호출. |
| `_handlePaste(e)`                   | `(ClipboardEvent) => void` | textarea `paste` 이벤트. setTimeout 0으로 next tick에 `_recomputeHeight()` (붙여넣기 처리 후 value 반영 보장). |
| `_handleCut(e)`                     | `(ClipboardEvent) => void` | textarea `cut` 이벤트. setTimeout 0으로 next tick에 `_recomputeHeight()`. |

### 페이지 연결 사례

```
[페이지 — 댓글/답글 / 메모/노트 / 리뷰/피드백 / 운영 콘솔]
    │
    ├─ fetchAndPublish('textField', this) 또는 직접 publish
    │     payload 예: {
    │         label: '댓글', required: 'false', value: '', placeholder: '댓글을 입력하세요...',
    │         leadingIcon: '', trailingIcon: '✕',
    │         supporting: 'Enter로 줄바꿈, 최대 4줄까지 자동 확장됩니다.',
    │         errorText: '', state: 'enabled',
    │         minRows: 1, maxRows: 4
    │     }
    │
    ├─ '@heightChanged' 수신 → 모달 layout 재계산 / 부모 grid row 갱신 / sticky footer 위치 보정
    │     payload 예: { pixelHeight: 84, rowCount: 4, minRows: 1, maxRows: 4, value: '...' }
    │
    └─ '@textFieldChanged' 수신 → blur/Enter 시 폼 저장

[TextFields/Advanced/multilineAutoGrow]
    ├─ FieldRender가 label/placeholder/leading/trailing/supporting/error/value/state 매핑(textarea 대상)
    ├─ _renderTextField가 minRows/maxRows 갱신 + fieldRender 위임 + 초기 _recomputeHeight()
    ├─ 사용자 1줄 입력 → _handleInput → _recomputeHeight()
    │   → textarea.style.height = (1 * lineHeight)px / overflow-y: hidden
    │   → @heightChanged({pixelHeight: ~24, rowCount: 1, ...})
    ├─ 사용자 Enter로 4줄까지 입력 → 매 keystroke마다 _recomputeHeight()
    │   → textarea.style.height = (rowCount * lineHeight)px (clamped to maxRows)
    │   → @heightChanged({pixelHeight: ~96, rowCount: 4, ...})
    ├─ 사용자 Ctrl+V로 5줄 paste → _handlePaste → setTimeout 0 → _recomputeHeight()
    │   → maxRows 도달 → overflow-y: auto + height clamped
    │   → @heightChanged({pixelHeight: 96, rowCount: 4(maxRows로 clamp), ...})
    └─ blur/Enter → @textFieldChanged (Standard 호환)

[setRowsRange 토픽 publish — 댓글 1~4 → 답글 모드 3~8로 전환]
    └─ ex: { minRows: 3, maxRows: 8 }
        → _handleSetRowsRange
        → _minRows/_maxRows 갱신 + 현재 textarea 재계산 + emit

[setMultilineValue 토픽 publish — 임시 저장본 복원 / AI 자동완성 결과 주입]
    └─ ex: { value: '복원된 텍스트...\n다음 줄' }
        → _handleSetMultilineValue
        → textarea.value 갱신 + _recomputeHeight() + emit

[trailing × 클릭]
    └──@textFieldTrailingClicked──▶ [페이지] (페이지가 textField 재발행으로 클리어 결정 — value:'' 발행 시 height도 _minRows로 자동 축소)

운영: this.pageDataMappings = [
        { topic: 'textField',         datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setRowsRange',      datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setMultilineValue', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@heightChanged':            ({ pixelHeight, rowCount, minRows, maxRows, value }) => { /* 모달 layout 재계산 */ },
        '@textFieldChanged':         (e) => { /* blur/Enter 시 폼 저장 */ },
        '@textFieldTrailingClicked': () => { /* clear → textField 재발행 */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|-------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 + Pretendard 400-600 + 8px 모서리 + 그라디언트 입력 배경 + box-shadow 금지 + focus는 border 색상으로만. textarea는 `resize: none` + 매끈한 grow transition. | **댓글 입력 (1줄 → 자동 확장 → 최대 4줄)** — `minRows: 1, maxRows: 4`, supporting=`"Enter로 줄바꿈, 최대 4줄까지 자동 확장됩니다."`, trailingIcon=`✕` |
| `02_material`    | B: Material Elevated | 라이트 + Roboto + MD3 floating label + 4px 모서리 + focus 시 border 두께 증가. textarea의 floating label은 textarea가 비어있을 때 좌측 상단(textarea가 멀티라인이라 vertically centered가 어색하므로 정렬 약간 다름). | **메모/노트 작성 (3줄 시작 → 12줄까지)** — `minRows: 3, maxRows: 12`, supporting=`"Write your notes here. Auto-grows up to 12 lines."`, leadingIcon=`description`(material-symbols) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 + DM Serif 라벨 + Inter 입력 + 바닥줄(border-bottom only) + 2px 모서리 + 정적 모션 + 세리프 라벨. textarea는 transparent 배경 + 바닥줄. | **리뷰/피드백 (4줄 시작 → 8줄까지)** — `minRows: 4, maxRows: 8`, supporting=ITALIC `"Share your experience in your own words."`, trailingIcon=`✕` |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 쿨 톤 + IBM Plex Mono + UPPERCASE 라벨 소형 + 2px 모서리 + 시안 미세 테두리. textarea는 모노 폰트로 다중 명령/로그 입력에 적합. | **운영 콘솔 — 다중 명령어 입력 (2줄 시작 → 6줄까지, monospace)** — `minRows: 2, maxRows: 6`, supporting=`"ENTER MULTI-LINE COMMAND (UP TO 6 LINES)"`, leadingIcon=`>_`(ASCII), trailingIcon=`CLR`(ASCII) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따른다. 한 변형 안에서 minRows/maxRows 1세트 + 초기 빈 value → 사용자 타이핑 + Enter 줄바꿈 시 textarea 자동 확장 + maxRows 도달 시 overflow 스크롤을 시연하며, preview에서 `setRowsRange` / `setMultilineValue` 토픽 시뮬도 데모 컨트롤로 노출한다.

### 결정사항

- **HTML element 변경 — input → textarea**: Standard와 같은 cssSelectors KEY를 유지하되 `value`/`placeholder` KEY가 가리키는 element를 `<input type="text">`에서 `<textarea>`로 교체. FieldRenderMixin은 `setAttribute('value', ...)`를 적용하므로 textarea 초기값 설정에 동일 작동(textarea의 `setAttribute('value', ...)`는 초기값 설정만 동작 — 사용자가 입력한 후엔 property가 권위지만 본 변형은 property 갱신은 page가 `setMultilineValue`로 명시 트리거). placeholder는 textarea도 그대로 지원.
- **자동 grow 알고리즘 — auto/scrollHeight/clamp 3단계**: 표준 알고리즘 답습. `style.height = 'auto'` reset이 필수(이전 height 영향 제거). scrollHeight는 content가 차지할 height를 reflow로 계산. clamp는 lineHeight 단위로 — pixel 단위로 직접 max/min 비교. 더 정밀한 row 수 산출은 `pixelHeight / lineHeight` 반올림.
- **lineHeight 캐시 — 첫 호출 후 재사용**: 매 호출마다 getComputedStyle은 reflow를 유발할 수 있으므로 첫 측정 후 `_lineHeightPx`에 캐시. font-family/font-size 변경 시 부정확해지지만, 본 변형은 페르소나 변경이 없는 한 lineHeight는 일정. 페이지가 동적으로 폰트 변경 시 limitation으로 메모(향후 `setLineHeight` 토픽 추가 후보).
- **`'normal'` lineHeight fallback — fontSize × 1.2**: CSS lineHeight가 'normal'(unitless)이면 `getComputedStyle`이 'normal' 문자열을 반환할 수 있다. 이 때 fontSize에서 1.2배로 fallback(MD3 권장 비율). 페르소나는 모두 명시 lineHeight를 설정하므로 실제 fallback은 거의 안 일어남.
- **paste/cut은 setTimeout 0 — 클립보드 처리 후 재계산**: paste 이벤트 시점은 textarea.value가 아직 업데이트되기 전. setTimeout 0으로 마이크로태스크 큐에 미뤄 다음 tick에 value가 반영된 후 `_recomputeHeight()`. cut도 동일 — 잘라내기 후 textarea.value가 줄어든 시점에 재계산.
- **input 이벤트와 paste/cut 중복 방지**: input 이벤트도 paste/cut 후 발화하므로 이론적으로 중복 호출. 그러나 `_recomputeHeight()`는 멱등이며(같은 value면 같은 height), 비용은 미미(한 reflow). 명시적 paste/cut 핸들러는 간헐적 race condition(paste 직후 input이 발화하지 않거나 너무 빨리 발화) 방어용 — defensive duplicate.
- **maxRows 도달 시 overflow-y:auto, 미만 시 hidden**: 도달 전엔 스크롤바가 안 보이고 매끈한 grow, 도달 후엔 스크롤바 노출 + 더 자라지 않음. `overflow-y` 토글은 _recomputeHeight가 직접 style 갱신 — CSS data-* 분기보다 명시적이고 일관성 있음.
- **`resize: none` (CSS) — 사용자 수동 리사이즈 차단**: textarea의 native resize 핸들(우하단 corner)은 자동 grow와 충돌. 모든 페르소나에서 `resize: none`로 비활성화. 사용자는 입력만으로 height를 결정.
- **rowCount 계산 — pixelHeight / lineHeight 반올림**: clamp 후 pixelHeight를 lineHeight로 나누고 반올림(`Math.round`). emit 시 사용자/페이지가 직관적으로 행 수 확인 가능. minRows ≤ rowCount ≤ maxRows 보장.
- **Standard 호환 채널 유지 (`@textFieldChanged` + `@textFieldTrailingClicked`)**: 페이지가 Standard에서 multilineAutoGrow로 마이그레이션할 때 핸들러 그대로 재사용 가능. 신규 채널 `@heightChanged`만 추가 구독.
- **`@textFieldInput` 의도적 미발행**: masking/autoComplete/validation/characterCounter 결정 답습 — 본 변형은 height 변화가 핵심 가치이므로 `event.target.value`만 통보하는 단순 위임 채널은 가치가 0이며, 동시에 두 채널을 같은 keystroke에서 발행하면 페이지 핸들러 중복 호출.
- **신규 Mixin 생성 금지**: FieldRenderMixin + 자체 메서드로 완결. masking/autoComplete/validation/characterCounter/multilineAutoGrow 5종이 자체 input native handler 패턴을 답습 — `InputBehaviorMixin` 일반화 검토 후보(SKILL 회귀 규율, 본 사이클은 메모만).
