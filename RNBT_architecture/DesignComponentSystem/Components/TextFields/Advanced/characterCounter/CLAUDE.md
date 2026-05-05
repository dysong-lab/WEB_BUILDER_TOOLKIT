# TextFields — Advanced / characterCounter

## 기능 정의

1. **TextField 기본 렌더링 (Standard 호환 KEY)** — `textField` 토픽으로 수신한 객체 데이터(`{ label, required, value, placeholder, leadingIcon, trailingIcon, supporting, errorText, state, maxChars?, countMode?, autoTrim? }`)를 FieldRenderMixin으로 매핑. cssSelectors KEY는 Standard 호환(`root` / `label` / `leadingIcon` / `value` / `placeholder` / `trailingIcon` / `supporting` / `errorText` / `state` / `required`) + 신규 KEY 3종(`counter` / `counterCurrent` / `counterMax`).
2. **`_charCount` / `_maxChars` / `_countMode` / `_autoTrim` 자체 상태** — 페이지가 ① `textField` 토픽에 `maxChars` / `countMode` / `autoTrim` 필드를 동봉해 발행하거나, ② `setMaxChars` / `setCountMode` 토픽으로 직접 갱신. 갱신 즉시 현재 input.value를 재계산해 카운터/임계 상태 동기화.
3. **input 이벤트 → 카운트 갱신 + 임계 색상 토글 + autoTrim 강제 자르기** — input element `input` 이벤트에서 `_recountAndRender(value)` 호출 → 현재 길이 계산(countMode별 chars/bytes/words) → `counterCurrent` / `counterMax` textContent 갱신 + 루트 `data-count-state` 갱신(`normal` / `warning`(80%) / `exceeded`(100%)) + autoTrim 활성 시 maxChars 초과분 자동 자름.
4. **임계 색상 정책 — 80% 경고 + 100% 초과** — `_recountAndRender`가 `count / max`로 백분율 산출 → `data-count-state="warning"` (80% ≤ percent < 100%) 또는 `data-count-state="exceeded"` (percent ≥ 100%). CSS는 페르소나별 임계 색상으로 카운터 텍스트 색상 + 루트 테두리 색상을 분기. 0% ≤ percent < 80%는 `normal`(기본).
5. **countMode 3종 — chars/bytes/words** — `chars`(default, `value.length`), `bytes`(UTF-8 byte 길이 — `new Blob([v]).size`), `words`(공백 분리 후 비어있지 않은 토큰 개수). 페이지가 도메인에 따라 선택(예: 트위터 280자, SMS 160 bytes, 에디터 단어수 1000).
6. **autoTrim 옵션 — 초과 입력 자동 자르기** — `autoTrim: true`로 발행되면 input.value가 maxChars 초과 시 즉시 잘라 input.value를 마지막 허용 길이까지 트림 + caret 위치를 끝으로 이동. autoTrim 미사용(default) 시 초과 입력 허용 + `data-count-state="exceeded"` 시각 경고만.
7. **`@charCountChanged` 발행** — 매 keystroke 후(또는 `setMaxChars` / `setCountMode` 갱신 후 자동 재계산) `Weventbus.emit('@charCountChanged', { count, max, percent, exceeded, mode, value })` 발행. 페이지가 다중 필드 합산 / submit 버튼 disable 등 결정.
8. **외부 토픽 `setMaxChars` 수신 — maxChars 직접 갱신** — 페이지가 단계 전환(예: 트윗 280 → DM 1000) 또는 사용자 권한별 다른 한도 적용 시. 갱신 즉시 카운터 재계산 + emit.
9. **외부 토픽 `setCountMode` 수신 — countMode 직접 갱신** — 페이지가 도메인 전환 시 사용. 갱신 즉시 카운터 재계산 + emit.
10. **change(blur/Enter) — Standard 호환** — `@textFieldChanged` 발행. 본 변형은 `@textFieldInput`은 의도적 미발행(masking/autoComplete/validation 결정 답습).
11. **Trailing 클릭 — Standard 호환** — `@textFieldTrailingClicked` 발행. 페이지가 clear 결정.

> **Standard와의 분리 정당성 (5축)**:
> - **자체 상태 5종** — `_charCount: number`(현재 길이), `_maxChars: number`(허용 한도), `_countMode: 'chars'|'bytes'|'words'`, `_autoTrim: boolean`, `_inputHandler` (bound ref — beforeDestroy 정확 제거). Standard는 stateless.
> - **새 토픽 2종** — `setMaxChars`(한도 갱신), `setCountMode`(모드 갱신). Standard는 `textField` 단일 토픽이며 카운터 개념이 없다.
> - **새 이벤트 1종** — `@charCountChanged({count, max, percent, exceeded, mode, value})`. Standard의 `@textFieldChanged`(blur/Enter 시점)는 매 keystroke마다 카운터 진행도를 통보하지 않는다 — characterCounter는 percent + exceeded를 권위 있게 동봉.
> - **자체 메서드 7종** — `_computeLength(value)`, `_recountAndRender(value)`, `_renderTextField({response})`, `_handleSetMaxChars({response})`, `_handleSetCountMode({response})`, `_handleInput(e)`. 자체 native input handler로 매 keystroke 카운트 + 임계 토글 + autoTrim. Standard는 자체 메서드 0개.
> - **신규 cssSelectors KEY 3종** — `counter`(카운터 영역 컨테이너), `counterCurrent`(현재 길이 textContent), `counterMax`(허용 한도 textContent). FieldRenderMixin이 KEY 단위로 textContent 갱신 → Standard view에는 없는 영역.

> **유사 변형과의 비교**: `TextFields/Advanced/masking`이 "input 이벤트 → in-place 포맷팅 + caret 보존 + raw/formatted 분리 emit"을 자체 메서드로 흡수했고, `TextFields/Advanced/validation`이 "input 이벤트 → validators 검증 + state/errorText 토글 + emit"을 흡수한 것과 같은 native input handler + bound refs + beforeDestroy 정확 제거 패턴을 답습한다. 차이는 ① supporting/error 외 **카운터 전용 영역**이 view에 추가됨(우측 정렬, supporting과 같은 라인), ② maxChars / countMode / autoTrim 3축의 동적 갱신, ③ `@charCountChanged` 매 keystroke 발행(validation은 통과/실패 시점, masking은 매번 발행하나 raw/formatted 페어, characterCounter는 진행도), ④ data-count-state로 임계 색상 토글(validation의 data-state="error"와 별개 축 — 동시 적용 가능).

> **MD3 / 도메인 근거**: MD3 spec의 "Character counter" — "Character counters indicate how many characters are typed and the total number allowed". Material Components(MUI TextField + `helperText` + length 표시, Vuetify VTextField + `counter` prop)에서 일반화. 실사용 예: ① **Twitter 댓글** (max 280, 80% 경고), ② **SMS 입력** (max 160 bytes — UTF-8 byte 한도), ③ **블로그 요약** (max 100 words — 단어 단위 카운트), ④ **상품 설명** (max 1000 chars + autoTrim — 강제 자르기), ⑤ **사용자명** (max 20 chars — 짧은 식별자). 페이지가 도메인에 따라 mode + max + autoTrim 조합을 선택.

---

## 구현 명세

### Mixin

FieldRenderMixin (단일) + 자체 상태 5종 + 자체 메서드 7종.

> **신규 Mixin 생성 금지** — characterCounter는 textField의 입력 처리 정책 확장이며, 새 카운터 영역은 view + cssSelectors KEY 추가만으로 흡수 가능. FieldRenderMixin이 label/value/placeholder/leading/trailing/supporting/error/state/required + counter/counterCurrent/counterMax 매핑을 모두 담당. ListRender/ShadowPopup 등 추가 Mixin 불필요. masking/autoComplete/validation/characterCounter 4종이 자체 input native handler 패턴을 답습 — `InputBehaviorMixin` 일반화 검토 후보(SKILL 회귀 규율, 본 사이클은 메모만).

### cssSelectors (`this.fieldRender`)

| KEY | VALUE | 용도 |
|-----|-------|------|
| root           | `.text-field`                   | 루트 — `data-state` / `data-required` / `data-count-state` 부착 + 이벤트 스코프 |
| label          | `.text-field__label`            | 라벨 텍스트 |
| leadingIcon    | `.text-field__leading`          | 시작 아이콘 자리 |
| value          | `.text-field__input`            | 입력 필드 — `value` 속성 반영 + 자체 input 핸들러 부착 영역 |
| placeholder    | `.text-field__input`            | 입력 필드 — `placeholder` 속성 반영 |
| trailingIcon   | `.text-field__trailing`         | 끝 아이콘 자리 — bindEvents click 매핑 |
| supporting     | `.text-field__supporting`       | 보조 텍스트 (helper) |
| errorText      | `.text-field__error`            | 에러 메시지 |
| counter        | `.text-field__counter`          | 카운터 영역 컨테이너 (supporting 줄 우측) — `:empty` 안 됨(자식이 항상 존재) |
| counterCurrent | `.text-field__counter-current`  | 현재 길이 textContent — `_recountAndRender`가 직접 갱신 |
| counterMax     | `.text-field__counter-max`      | 허용 한도 textContent — `_recountAndRender`가 직접 갱신 |
| state          | `.text-field`                   | dataset 반영 대상 (state) |
| required       | `.text-field`                   | dataset 반영 대상 (required) |

### datasetAttrs (`this.fieldRender`)

| KEY | VALUE |
|-----|-------|
| state    | state    |
| required | required |

### elementAttrs (`this.fieldRender`)

| KEY | VALUE | 동작 |
|-----|-------|------|
| value       | value       | input의 `value` 속성에 반영 |
| placeholder | placeholder | input의 `placeholder` 속성에 반영 |

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_charCount` | `number` | 현재 길이 (countMode별 산출). emit 시 `count`로 동봉. |
| `_maxChars`  | `number` | 허용 한도. 0 또는 null이면 카운터 비활성(초기 권장 280). |
| `_countMode` | `'chars' \| 'bytes' \| 'words'` | 길이 계산 모드 (default: `'chars'`). |
| `_autoTrim`  | `boolean` | 초과 시 자동 자르기 (default: `false`). |
| `_inputHandler` | `function \| null` | input element 자체 핸들러 bound ref — beforeDestroy 정확 제거용. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `textField`     | `this._renderTextField`     | `{ label, required, value, placeholder, leadingIcon, trailingIcon, supporting, errorText, state, maxChars?, countMode?, autoTrim? }` — Standard 호환 + 선택적 카운터 설정. `_renderTextField`가 maxChars/countMode/autoTrim 추출해 자체 상태 갱신, fieldRender.renderData에 위임 후 `_recountAndRender` 호출(초기 카운트 표시). |
| `setMaxChars`   | `this._handleSetMaxChars`   | `{ maxChars }` — 한도 직접 갱신. 갱신 즉시 현재 input.value 재계산 + emit. |
| `setCountMode`  | `this._handleSetCountMode`  | `{ countMode }` — 모드 직접 갱신. 갱신 즉시 재계산 + emit. |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 |
|--------|------------------|------|
| change | `value` (fieldRender)        | `@textFieldChanged` (Standard 호환) |
| click  | `trailingIcon` (fieldRender) | `@textFieldTrailingClicked` (Standard 호환) |

> input 이벤트는 customEvents에서 위임하지 않고 자체 native handler(`_handleInput`)로 처리 — 카운트 + 임계 토글 + autoTrim + emit이 한 번에 일어나야 하므로 native handler가 권위 있는 채널. `@textFieldInput`은 의도적 미발행(masking/autoComplete/validation 결정 답습 — 중복 채널 방지).

### 자체 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@charCountChanged` | 매 input keystroke / `setMaxChars` 갱신 / `setCountMode` 갱신 / 초기 `textField` 렌더 후 | `{ count, max, percent, exceeded, mode, value }` (`count`: 현재 길이, `max`: 한도, `percent`: 0~100+ 정수, `exceeded`: `count > max`, `mode`: 현재 countMode, `value`: 현재 input 값 — autoTrim 후 값) |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_computeLength(value)`              | `(string) => number` | countMode 기반 길이 산출. `chars`: `value.length` / `bytes`: `new Blob([value]).size` / `words`: 공백 split 후 비어있지 않은 토큰 개수. `value`가 null/undefined이면 0. |
| `_recountAndRender(value)`           | `(string) => {count, max, percent, exceeded, mode}` | 현재 길이 산출 → `_charCount` 갱신 → fieldRender.renderData로 counterCurrent/counterMax textContent 갱신 → `data-count-state` 토글(normal/warning/exceeded) → emit. autoTrim 활성 시 input.value 트림 + caret 끝 이동. |
| `_renderTextField({ response })`     | `({response}) => void` | `textField` 토픽 핸들러. `response.maxChars` / `countMode` / `autoTrim`이 있으면 자체 상태 갱신. fieldRender.renderData 위임 후 `_recountAndRender(response.value)` 호출. |
| `_handleSetMaxChars({ response })`   | `({response}) => void` | `setMaxChars` 토픽 핸들러. `_maxChars` 갱신 + 현재 input.value 재계산 + emit. |
| `_handleSetCountMode({ response })`  | `({response}) => void` | `setCountMode` 토픽 핸들러. `_countMode` 갱신 + 재계산 + emit. |
| `_handleInput(e)`                    | `(InputEvent) => void` | input element `input` 이벤트. 현재 value 추출 → `_recountAndRender` 호출(autoTrim 시 value 갱신). |

### 페이지 연결 사례

```
[페이지 — Twitter 댓글 / SMS 입력 / 블로그 요약 / 상품 설명]
    │
    ├─ fetchAndPublish('textField', this) 또는 직접 publish
    │     payload 예: {
    │         label: '댓글', required: 'false', value: '', placeholder: 'What is happening?',
    │         leadingIcon: '', trailingIcon: '✕',
    │         supporting: '280자 이내로 작성해 주세요.', errorText: '', state: 'enabled',
    │         maxChars: 280, countMode: 'chars', autoTrim: false
    │     }
    │
    ├─ '@charCountChanged' 수신 → submit 버튼 활성/비활성 / 다중 필드 합산 표시
    │     payload 예: { count: 224, max: 280, percent: 80, exceeded: false, mode: 'chars', value: '...' }
    │
    └─ '@textFieldChanged' 수신 → blur/Enter 시 폼 저장

[TextFields/Advanced/characterCounter]
    ├─ FieldRender가 label/placeholder/leading/trailing/supporting/error 매핑
    ├─ _renderTextField가 maxChars/countMode/autoTrim 갱신 + fieldRender 위임 + 초기 _recountAndRender
    ├─ 사용자 5자 타이핑 → _handleInput → _recountAndRender('hello')
    │   → counterCurrent="5" / counterMax="280" / data-count-state="normal"
    │   → @charCountChanged({count:5, max:280, percent:1, exceeded:false, mode:'chars', value:'hello'})
    ├─ 사용자 224자(80%) 타이핑 → data-count-state="warning" → 카운터 노란색
    │   → @charCountChanged({count:224, max:280, percent:80, exceeded:false, ...})
    ├─ 사용자 280자 도달 → data-count-state="exceeded" → 카운터 빨간색
    │   → @charCountChanged({count:280, max:280, percent:100, exceeded:true, ...})
    └─ blur/Enter → @textFieldChanged (Standard 호환)

[setMaxChars 토픽 publish — 트윗 280 → DM 1000으로 전환]
    └─ ex: { maxChars: 1000 }
        → _handleSetMaxChars
        → _maxChars 갱신 + 현재 input.value 재계산 + counterMax 갱신 + emit

[setCountMode 토픽 publish — 도메인 전환]
    └─ ex: { countMode: 'bytes' }
        → _handleSetCountMode
        → _countMode 갱신 + 재계산 + emit

[trailing × 클릭]
    └──@textFieldTrailingClicked──▶ [페이지] (페이지가 textField 재발행으로 클리어 결정)

운영: this.pageDataMappings = [
        { topic: 'textField',     datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setMaxChars',   datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setCountMode',  datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@charCountChanged':         ({ count, max, percent, exceeded, mode, value }) => { /* submit 버튼 토글 */ },
        '@textFieldChanged':         (e) => { /* blur/Enter 시 폼 저장 */ },
        '@textFieldTrailingClicked': () => { /* clear → textField 재발행 */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|-------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 + Pretendard 400-600 + 8px 모서리 + 그라디언트 입력 배경 + box-shadow 금지 + focus는 border 색상으로만 + 임계 색상 (warning: 호박, exceeded: 빨강). | **Twitter 댓글 입력 (max 280 chars — 80% 경고)** — supporting=`"280자 이내로 작성해 주세요."`, `maxChars: 280, countMode: 'chars'` |
| `02_material`    | B: Material Elevated | 라이트 + Roboto + MD3 floating label + 4px 모서리 + focus 시 border 두께 증가 + 임계 색상 (warning: 머스타드, exceeded: M3 빨강). | **블로그 요약 (max 100 words — 단어 단위)** — supporting=`"Write a 100-word summary."`, `maxChars: 100, countMode: 'words'` |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 + DM Serif 라벨 + Inter 입력 + 바닥줄(border-bottom only) + 2px 모서리 + 정적 모션 + 세리프/이탤릭 + 임계 색상 (warning: 머스타드, exceeded: 와인). | **상품 설명 (max 1000 chars + autoTrim ON — 강제 자르기)** — supporting=`"Up to 1,000 characters."`, `maxChars: 1000, countMode: 'chars', autoTrim: true` |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 쿨 톤 + IBM Plex Mono + UPPERCASE 라벨 소형 + 2px 모서리 + 시안 미세 테두리 + UPPERCASE 카운터 모노 + 임계 색상 (warning: 시안→앰버, exceeded: 빨강). | **운영 콘솔 — SMS 입력 (max 160 bytes — UTF-8)** — supporting=`"SMS LIMIT 160 BYTES (UTF-8)"`, `maxChars: 160, countMode: 'bytes'` |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따른다. 한 변형 안에서 maxChars 1세트 + 초기 빈 value → 사용자 타이핑 시 카운터 갱신 + 80%/100% 임계 색상 변화 + emit을 시연하며, preview에서 `setMaxChars` / `setCountMode` 토픽 시뮬도 데모 컨트롤로 노출한다.

### 결정사항

- **카운터 영역 — supporting 줄과 같은 라인 우측 정렬**: MD3 표준 위치(supporting 줄 trailing 끝). HTML은 supporting + counter를 같은 row(`.text-field__supporting-row` flex 컨테이너)로 묶고 supporting 좌측 + counter 우측. 비어있지 않으므로 `:empty` 숨김 적용 안 됨.
- **임계 색상 — 80%/100% 두 단계**: MD3는 한도 초과만 강조하지만 UX 표준(Twitter, GitHub)에 따라 80%부터 사전 경고 추가. `data-count-state` 3종(normal/warning/exceeded)으로 CSS가 카운터 텍스트 색상 + 루트 테두리 색상 분기. 페이지가 추가 단계(95% 등) 원하면 함수 validator 보강 — 본 변형은 80/100 고정.
- **countMode 3종 (chars/bytes/words)**: MD3 spec은 chars만 정의하나 실사용 도메인 다양성을 흡수. `bytes`는 `new Blob([v]).size`로 UTF-8 정확 산출 (한글 3바이트, ASCII 1바이트). `words`는 `value.trim().split(/\s+/).filter(Boolean).length`로 공백 분리. 추가 모드는 페이지가 함수 mode로 우회 불가 — countMode는 enum이므로 이 3종 한정.
- **autoTrim — 옵션 (default false)**: 초과 입력 자동 자르기. true 시 maxChars 도달 후 추가 입력 무시 + caret 위치를 끝으로 이동 (UX: 사용자가 입력 중단). false 시 초과 허용 + 시각 경고만. autoTrim는 chars/words 모드에서만 정확 작동 (bytes 모드는 byte 단위 자르기가 한글 부분 자르기 위험으로 보수적으로 chars 단위 자름 — 페이지가 정확한 byte 자르기 필요하면 setCountMode를 chars로 전환 후 처리).
- **`@charCountChanged` 매 keystroke 발행**: validation은 통과/실패 시점만 발행하지만 characterCounter는 매번 진행도 통보가 가치 (페이지가 다중 필드 합산, submit 버튼 disable 등 즉시 결정). 비용 부담은 미미 (텍스트 입력은 사용자 타이핑 속도로 제한적).
- **percent 정수 (0~100+)**: `Math.floor((count / max) * 100)`. max=0이면 0 반환(카운터 비활성). 100 초과 가능 (exceeded 시 110, 150 등) — 페이지가 시각화 결정.
- **maxChars 0 또는 null이면 카운터 비활성**: 카운터 영역은 항상 렌더되지만 textContent="" → CSS가 `[data-count-state="off"]`로 숨김. 페이지가 `maxChars: 0` 발행하면 카운터 OFF.
- **Standard 호환 채널 유지 (`@textFieldChanged` + `@textFieldTrailingClicked`)**: 페이지가 Standard에서 characterCounter로 마이그레이션할 때 핸들러 그대로 재사용 가능. 신규 채널 `@charCountChanged`만 추가 구독.
- **`@textFieldInput` 의도적 미발행**: masking/autoComplete/validation 결정 답습 — 본 변형은 카운터 진행도 통보가 핵심 가치이므로 `event.target.value`만 통보하는 단순 위임 채널은 가치가 0이며, 동시에 두 채널을 같은 keystroke에서 발행하면 페이지 핸들러 중복 호출.
- **HTML5 maxlength 미사용**: maxlength 속성은 native enforced 자르기 + 카운터/emit 흐름과 충돌. autoTrim를 자체 구현으로 흡수 → maxlength 속성 안 씀(input 요소에 set 안 함).
- **신규 Mixin 생성 금지**: FieldRenderMixin + 자체 메서드로 완결. masking/autoComplete/validation/characterCounter 4종이 자체 input native handler 패턴을 답습 — `InputBehaviorMixin` 일반화 검토 후보(SKILL 회귀 규율, 본 사이클은 메모만).
