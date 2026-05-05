# TextFields — Advanced / validation

## 기능 정의

1. **TextField 기본 렌더링 (Standard 호환 KEY)** — `textField` 토픽으로 수신한 객체 데이터(`{ label, required, value, placeholder, leadingIcon, trailingIcon, supporting, errorText, state, validators? }`)를 FieldRenderMixin으로 매핑. cssSelectors KEY는 Standard 호환(`root` / `label` / `leadingIcon` / `value` / `placeholder` / `trailingIcon` / `supporting` / `errorText` / `state` / `required`).
2. **`validators` 자체 상태 — 배열 형태** — `_validators: Array<{type, value?, message?}>`. 내장 type: `required` / `minLength` / `maxLength` / `pattern` / `email` / `numeric` / `min` / `max`. 페이지가 ① `textField` 토픽에 `validators` 필드를 동봉해 발행하거나, ② `setValidators` 토픽으로 `{ validators }`를 publish하면 `_validators` 갱신. 함수 단일 또는 함수 배열도 허용 — `(value) => string|null|true` 시그니처(falsy = pass, string = error message).
3. **input 이벤트 → 실시간 검증 + 에러 표시** — input element `input` 이벤트에서 `_runValidators(value)` 호출 → 첫 실패한 validator의 message를 errorText로 표시 + state="error" + supporting 숨김(CSS). 모두 통과 → state="" 복원 + errorText 비움 + supporting 복원. `_lastErrors`에 결과 캐시.
4. **blur 이벤트 → 검증 + 변경 완료 통보** — `change` 이벤트(blur/Enter 시점)는 `@textFieldChanged`로 위임 발행(Standard 호환) + 자체 native blur 핸들러로 `_runValidators` 다시 호출(첫 input 즉시 검증 정책 외에 blur 시에도 명시 검증). 페이지가 양쪽 신호로 폼 진행 결정.
5. **`@validationError` / `@validationPassed` 발행** — `_runValidators` 결과에 따라:
   - 실패 시 `Weventbus.emit('@validationError', { field, errors: [{type, message}, ...], value })` — `field`는 `textField.label`(또는 빈 문자열).
   - 통과 시 `Weventbus.emit('@validationPassed', { field, value })`.
6. **외부 토픽 `validateNow` 수신 — 강제 검증 트리거** — 페이지가 form submit 직전에 `validateNow` 토픽으로 `{}`(또는 임의 페이로드)를 publish하면 `_handleValidateNow`가 input.value를 읽어 `_runValidators` 호출 → emit. submit 직전 폼 전체 검증에 사용.
7. **외부 토픽 `setValidationState` 수신 — 외부 검증 결과 직접 주입** — 페이지가 서버 검증(예: 이메일 중복 체크) 결과를 `setValidationState` 토픽으로 `{ state, message }` publish → `_handleSetValidationState`가 errorText/state를 즉시 반영. 클라이언트 validator를 우회한 권위 있는 외부 결과 주입 채널.
8. **`setValidators` 토픽 — validators 배열 갱신** — 페이지가 단계 전환(예: 비밀번호 확인 단계 진입 시 minLength 추가) 또는 동적 룰 갱신 시 사용. 갱신 즉시 현재 input.value를 재검증해 일관성 유지.
9. **Trailing 클릭 — Standard 호환** — `@textFieldTrailingClicked` 발행. 페이지가 clear 결정.
10. **change(blur/Enter) — Standard 호환** — `@textFieldChanged` 발행. 본 변형은 `@textFieldInput`은 의도적 미발행(검증 시점은 자체 input 핸들러 + emit이 권위 있는 채널 — masking/autoComplete 결정 답습).

> **Standard와의 분리 정당성 (5축)**:
> - **자체 상태 4종** — `_validators: Array`(현재 룰 배열), `_lastErrors: Array<{type,message}>`(최근 검증 결과 캐시 — 디버그/외부 조회), `_inputHandler` / `_blurHandler` (bound refs — beforeDestroy 정확 제거). Standard는 stateless.
> - **새 토픽 3종** — `setValidators`(룰 배열 갱신), `validateNow`(강제 트리거), `setValidationState`(외부 검증 결과 주입). Standard는 `textField` 단일 토픽이며 검증 개념이 없다.
> - **새 이벤트 2종** — `@validationError({field, errors, value})`, `@validationPassed({field, value})`. Standard의 `@textFieldChanged`(이벤트 객체만 통보)는 검증 결과를 반영하지 않으므로 페이지가 직접 검증 코드를 작성해야 함 — validation은 검증 결과 자체를 권위 있게 동봉.
> - **자체 메서드 8종** — `_runValidators(value)`, `_runOneValidator(rule, value)`, `_normalizeValidators(input)`, `_renderTextField({response})`, `_handleSetValidators({response})`, `_handleValidateNow(_)`, `_handleSetValidationState({response})`, `_handleInput(e)`, `_handleBlur(e)`. Standard는 자체 메서드 0개.
> - **자체 native input/blur 핸들러로 실시간 검증 + state/errorText 즉시 토글** — Standard의 `customEvents` 위임만으로는 표현 불가. errorText 자동 표시 + state 토글 + 양방향 emit이 단일 keystroke 안에 일어나야 하므로 native handler가 필수.

> **유사 변형과의 비교**: `TextFields/Advanced/masking`이 "input 이벤트 → in-place 포맷팅 + caret 보존 + raw/formatted 분리 emit"을 자체 메서드로 흡수했고, `TextFields/Advanced/autoComplete`이 "input 이벤트 → debounce + dropdown navigation + 외부 fetch 위임"을 흡수한 것과 같은 native input handler + bound refs + beforeDestroy 정확 제거 패턴을 답습한다. 차이는 ① dropdown 영역 없음(input + supporting/error만 핸들 — masking 구조에 가까움), ② 디바운스 없이 매 keystroke 즉시 검증(검증은 client-side cheap, 사용자가 즉시 피드백 기대), ③ 외부 fetch 위임 없음(전부 클라이언트 + 선택적 서버 검증 결과 주입), ④ 새 토픽 3종(setValidators/validateNow/setValidationState)으로 외부 룰 주입 + 강제 트리거 + 외부 결과 주입의 3채널 분리.

> **MD3 / 도메인 근거**: MD3 spec의 "Input field validation" — error state는 "When user input is invalid, the field communicates the error and how to fix it". Material Components(MUI TextField, Vuetify VTextField)에서 `rules`/`error`/`error-messages` props로 일반화. 실사용 예: ① **회원가입 비밀번호** (minLength: 8 + pattern: 영문/숫자/특수문자 1개씩 + 일치 확인), ② **이메일 입력** (required + email 형식 + 서버 중복 체크 — `setValidationState`로 결과 주입), ③ **나이/금액 입력** (numeric + min/max 범위), ④ **사용자명** (required + minLength: 3 + maxLength: 20 + pattern 영문/숫자만), ⑤ **연락처/우편번호** (pattern + numeric). 클라이언트 validator로 즉시 피드백 + 서버 검증 결과는 `setValidationState`로 주입하는 분리가 핵심.

---

## 구현 명세

### Mixin

FieldRenderMixin (단일) + 자체 상태 4종 + 자체 메서드 9종.

> **신규 Mixin 생성 금지** — validation은 textField의 입력 처리 정책 확장이지 새 렌더 패턴이 아니다. FieldRenderMixin이 label/value/placeholder/leading/trailing/supporting/error/state/required 매핑을 담당하고, 자체 native handler + 자체 검증 함수가 input.value 검증 + state/errorText 토글 + emit을 담당. ListRender/ShadowPopup 등 추가 Mixin 불필요. 향후 masking/autoComplete/validation 3종이 자체 input native handler 패턴을 답습한 사실을 근거로 `InputBehaviorMixin` 일반화 검토 후보 — SKILL 회귀 규율, 본 사이클은 메모만.

### cssSelectors (`this.fieldRender`)

| KEY | VALUE | 용도 |
|-----|-------|------|
| root         | `.text-field`              | 루트 — `data-state` / `data-required` 부착 + 이벤트 스코프 |
| label        | `.text-field__label`       | 라벨 텍스트 |
| leadingIcon  | `.text-field__leading`     | 시작 아이콘 자리 |
| value        | `.text-field__input`       | 입력 필드 — `value` 속성 반영 + 자체 input/blur 핸들러 부착 영역 |
| placeholder  | `.text-field__input`       | 입력 필드 — `placeholder` 속성 반영 |
| trailingIcon | `.text-field__trailing`    | 끝 아이콘 자리 — bindEvents click 매핑 |
| supporting   | `.text-field__supporting`  | 보조 텍스트 (helper) |
| errorText    | `.text-field__error`       | 에러 메시지 — 자체 검증 시 직접 textContent 갱신 |
| state        | `.text-field`              | dataset 반영 대상 (state) — 자체 검증 시 직접 dataset 갱신 |
| required     | `.text-field`              | dataset 반영 대상 (required) |

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
| `_validators` | `Array<{type, value?, message?}> \| Array<Function>` | 현재 검증 룰 배열. 내장 type 또는 함수. 페이지가 `setValidators` / `textField.validators`로 갱신. 빈 배열이면 검증 없음(통과). |
| `_lastErrors` | `Array<{type, message}>` | 최근 `_runValidators` 결과 — 디버그/외부 조회용. emit 시 `errors`로 동봉. |
| `_label` | `string` | 현재 라벨 — emit 시 `field`로 동봉(`textField` publish 시 갱신). |
| `_inputHandler` / `_blurHandler` | `function \| null` | input element 자체 핸들러 bound refs — beforeDestroy 정확 제거용. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `textField` | `this._renderTextField` | `{ label, required, value, placeholder, leadingIcon, trailingIcon, supporting, errorText, state, validators? }` — Standard 호환 + 선택적 `validators`. `_renderTextField`이 `validators`를 추출해 `_validators` 갱신, `label`을 `_label`에 캐시 후 fieldRender.renderData에 위임. 빈 errorText/state="enabled"로 발행되면 검증 상태 초기화. |
| `setValidators` | `this._handleSetValidators` | `{ validators }` 또는 `{validators: Array}` — 룰 배열 직접 갱신. 갱신 즉시 현재 input.value 재검증. |
| `validateNow` | `this._handleValidateNow` | `{}`(또는 임의) — 강제 검증 트리거. 현재 input.value를 읽어 `_runValidators` 호출 + emit. |
| `setValidationState` | `this._handleSetValidationState` | `{ state, message }` — 외부 검증 결과 직접 주입. errorText/state를 즉시 반영. 클라이언트 validator를 우회. |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 |
|--------|------------------|------|
| change | `value` (fieldRender)        | `@textFieldChanged` (Standard 호환) |
| click  | `trailingIcon` (fieldRender) | `@textFieldTrailingClicked` (Standard 호환) |

> input/blur 이벤트는 customEvents에서 위임하지 않고 자체 native handler(`_handleInput` / `_handleBlur`)로 처리 — 검증 결과 + state/errorText 토글 + emit이 한 번에 일어나야 하므로 native handler가 권위 있는 채널. `@textFieldInput`은 의도적 미발행(masking/autoComplete 결정 답습 — 중복 채널 방지).

### 자체 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@validationError`  | `_runValidators` 실패 시(input/blur/validateNow/setValidators 갱신 후) | `{ field, errors: [{type, message}, ...], value }` (`field`: 현재 라벨, `errors`: 실패한 룰 배열, `value`: 현재 input 값) |
| `@validationPassed` | `_runValidators` 통과 시                                           | `{ field, value }` (폼 submit 가능 신호 — 페이지가 submit 버튼 활성화 등 결정) |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_normalizeValidators(input)` | `(any) => Array` | 입력 정규화 — 단일 객체/함수면 배열로, 배열이면 그대로, falsy면 `[]`. 함수는 그대로, 객체는 `{type, value?, message?}` 형태로 검증. |
| `_runOneValidator(rule, value)` | `(rule, string) => {ok, message?}` | 단일 룰 실행. 함수면 호출 결과(`null/true/undefined` = pass / `string` = error message). 객체면 type별 분기(`required`/`minLength`/`maxLength`/`pattern`/`email`/`numeric`/`min`/`max`). custom message 우선. |
| `_runValidators(value)` | `(string) => {valid, errors}` | 모든 룰 순회 — 첫 실패 시점에서 멈추지 않고 모두 수집(페이지가 다중 에러 표시 가능). DOM 갱신 + `_lastErrors` 캐시 + emit. errors 배열이 비어있으면 통과. |
| `_renderTextField({ response })` | `({response}) => void` | `textField` 토픽 핸들러. `response.validators`가 있으면 `_validators` 갱신. `response.label`을 `_label` 캐시. fieldRender.renderData 위임. `state === 'enabled'` + `errorText === ''`로 발행되면 `_lastErrors` 초기화. |
| `_handleSetValidators({ response })` | `({response}) => void` | `setValidators` 토픽 핸들러. `response.validators`(또는 `response` 자체가 배열)를 `_normalizeValidators` → `_validators` 갱신. 현재 input.value 재검증 + emit. |
| `_handleValidateNow(_)` | `(_) => void` | `validateNow` 토픽 핸들러. 현재 input.value 읽어 `_runValidators` 호출 + emit. submit 직전 강제 검증. |
| `_handleSetValidationState({ response })` | `({response}) => void` | `setValidationState` 토픽 핸들러. `response.state`(예: `'error'`/`'enabled'`)와 `response.message`(errorText)를 fieldRender.renderData로 즉시 반영. emit은 하지 않음 — 외부 결과 주입은 페이지가 권위. |
| `_handleInput(e)` | `(InputEvent) => void` | input element `input` 이벤트. 현재 value 추출 → `_runValidators` 호출. |
| `_handleBlur(e)` | `(FocusEvent) => void` | input element `blur` 이벤트. 현재 value 추출 → `_runValidators` 호출(blur 시점 명시 검증). |

### 페이지 연결 사례

```
[페이지 — 회원가입 폼 / 이메일 입력 / 비밀번호 / 사용자명]
    │
    ├─ fetchAndPublish('textField', this) 또는 직접 publish
    │     payload 예: {
    │         label: 'Email', required: 'true', value: '', placeholder: 'you@example.com',
    │         leadingIcon: '✉', trailingIcon: '✕',
    │         supporting: 'We will never share your email.',
    │         errorText: '', state: 'enabled',
    │         validators: [
    │           { type: 'required', message: '이메일은 필수입니다.' },
    │           { type: 'email',    message: '이메일 형식이 올바르지 않습니다.' }
    │         ]
    │     }
    │
    ├─ '@validationError' 수신 → submit 버튼 비활성화 / 다른 필드 상태 갱신
    │     payload 예: { field: 'Email', errors: [{type:'email', message:'이메일 형식이 올바르지 않습니다.'}], value: 'abc' }
    │
    └─ '@validationPassed' 수신 → submit 버튼 활성화

[TextFields/Advanced/validation]
    ├─ FieldRender가 label/placeholder/leading/trailing/supporting/error 매핑
    ├─ _renderTextField가 validators 갱신 + label 캐시 + fieldRender 위임
    ├─ 사용자 'ab' 타이핑 → 매 keystroke마다 _handleInput
    │   → _runValidators('ab') → {valid:false, errors:[{type:'email', message:'...'}]}
    │   → state='error' / errorText='이메일 형식이 올바르지 않습니다.'
    │   → @validationError({field:'Email', errors:[...], value:'ab'})
    ├─ 사용자 'a@b.c' 타이핑 → 통과
    │   → state='enabled' / errorText=''
    │   → @validationPassed({field:'Email', value:'a@b.c'})
    └─ blur/Enter → @textFieldChanged (Standard 호환) + _runValidators 재호출

[setValidators 토픽 publish — 비밀번호 확인 단계로 전환]
    └─ ex: { validators: [{type:'required'}, {type:'minLength', value:8}, {type:'pattern', value:'^(?=.*[A-Z])(?=.*[0-9]).+$', message:'대문자/숫자 1자 이상'}] }
        → _handleSetValidators
        → _validators 갱신 + 현재 input.value 재검증 + emit

[validateNow 토픽 publish — submit 직전]
    └─ {} → _handleValidateNow → 현재 value 검증 + emit (페이지가 결과로 submit 진행 결정)

[setValidationState 토픽 publish — 서버 중복 체크 결과 주입]
    └─ ex: { state: 'error', message: '이미 사용 중인 이메일입니다.' }
        → _handleSetValidationState → state='error' / errorText 즉시 반영
        (emit 없음 — 외부 권위)

[trailing × 클릭]
    └──@textFieldTrailingClicked──▶ [페이지] (페이지가 textField 재발행으로 클리어 결정)

운영: this.pageDataMappings = [
        { topic: 'textField',           datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setValidators',       datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'validateNow',         datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setValidationState',  datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@validationError':          ({ field, errors, value }) => { /* submit 비활성화 / 폼 상태 갱신 */ },
        '@validationPassed':         ({ field, value })         => { /* submit 활성화 후보 */ },
        '@textFieldChanged':         (e) => { /* blur/Enter 시 폼 저장 */ },
        '@textFieldTrailingClicked': () => { /* clear → textField 재발행 */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|-------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 + Pretendard 400-600 + 8px 모서리 + 그라디언트 입력 배경 + box-shadow 금지 + focus는 border 색상으로만 + 에러 시 빨강 테두리. | **회원가입 — 이메일 입력 (실시간 형식 검증)** — `required` + `email` validators, leadingIcon=✉, trailingIcon=✕, supporting="We will never share your email." |
| `02_material`    | B: Material Elevated | 라이트 + Roboto + MD3 floating label + 4px 모서리 + focus 시 border 두께 증가 + 에러 시 빨강 두꺼운 테두리. | **비밀번호 입력 (minLength 8 + 대문자/숫자 패턴)** — `required` + `minLength:8` + `pattern` validators, leadingIcon=lock(material-symbols), supporting="At least 8 chars with uppercase and number" |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 + DM Serif 라벨 + Inter 입력 + 바닥줄(border-bottom only) + 2px 모서리 + 정적 모션 + 세리프 에러 이탤릭. | **사용자명 입력 (required + minLength 3 + maxLength 20)** — supporting=ITALIC "3-20 characters." |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 쿨 톤 + IBM Plex Mono + UPPERCASE 라벨 소형 + 2px 모서리 + 시안 미세 테두리 + error는 빨강 테두리 + 모노 에러 텍스트 (UPPERCASE). | **운영 콘솔 — 호스트명 입력 (pattern 영문/숫자/하이픈)** — `required` + `pattern:^[a-z0-9-]{3,32}$`, leadingIcon=`H/N`(ASCII), trailingIcon=`CLR`(ASCII), supporting="ENTER HOSTNAME (a-z, 0-9, -)" |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따른다. 한 변형 안에서 validators 배열 1세트 + 초기 빈 value → 사용자 타이핑 시 실시간 검증 + 에러 표시를 시연하며, preview에서 `setValidators` / `validateNow` / `setValidationState` 토픽 시뮬도 데모 컨트롤로 노출한다.

### 결정사항

- **검증 시점 — input + blur 양쪽**: input(매 keystroke)으로 즉시 피드백 + blur(필드 떠날 때)로 명시 검증. 첫 input 즉시 검증은 사용자 경험 개선(MUI/Vuetify 표준 정책 답습) — 단, 빈 input + required는 첫 input 후에만 표시(초기 빈 상태에서 에러 보이지 않음).
- **다중 에러 수집 (첫 실패에서 stop 안 함)**: `_runValidators`는 모든 룰을 순회해 errors 배열을 수집한다. 본 변형 UI는 첫 errors[0].message만 errorText로 표시하지만, 페이지가 `@validationError({errors:[...]})`로 다중 에러 표시(예: 비밀번호 룰 체크리스트 UI)를 자유롭게 구현 가능.
- **함수 validator 지원**: `_validators`에 함수가 들어올 수 있다 — `(value) => null|true|string`. 페이지가 도메인 특화 검증(서버 호출 제외, 단순 비교)을 자유롭게 작성. 객체 + 함수 혼용 가능.
- **내장 type 8종 (확장 우선순위)**: `required` / `minLength` / `maxLength` / `pattern` / `email` / `numeric` / `min` / `max`. MUI/Vuetify/HTML5 input validation 교집합 + 폼 표준 패턴. 추가 type(date 범위, 정규식 라이브러리 등)은 후속 변형 또는 함수 validator로 우회.
- **`setValidationState`로 서버 검증 결과 주입**: 클라이언트 validator는 형식 검증만, 서버 검증(이메일 중복, 사용자명 가용성)은 `setValidationState`로 권위 있게 주입. emit하지 않음 — 외부 결과 주입은 페이지가 권위.
- **`validateNow`로 강제 트리거**: form submit 직전 페이지가 publish — 모든 필드의 검증 상태를 한 번에 점검. 통상 `@validationPassed` 다중 수신 후 submit 진행.
- **검증 통과 시 supporting 복원**: `state="error"`이면 CSS가 `.text-field__supporting { display:none }`로 숨김. 통과 시 `state=""`로 복원되면 supporting이 다시 표시 — 사용자가 도움말을 다시 보게 됨.
- **Standard 호환 채널 유지 (`@textFieldChanged` + `@textFieldTrailingClicked`)**: 페이지가 Standard에서 validation으로 마이그레이션할 때 핸들러 그대로 재사용 가능. 신규 채널 `@validationError`/`@validationPassed`만 추가 구독.
- **`@textFieldInput` 의도적 미발행**: masking/autoComplete 결정 답습 — 본 변형은 검증 결과(errorText/state) 토글이 핵심 가치이므로 `event.target.value`만 통보하는 단순 위임 채널은 가치가 0이며, 동시에 두 채널을 같은 keystroke에서 발행하면 페이지 핸들러 중복 호출.
- **외부 라이브러리 금지**: yup/joi/zod 같은 검증 라이브러리 없이 native String/Regex/Number만으로 구현. 의존성 추가 회피 + 컴포넌트 시스템 일관성.
- **신규 Mixin 생성 금지**: FieldRenderMixin + 자체 메서드로 완결. masking/autoComplete/validation 3종이 자체 input native handler 패턴을 답습 — `InputBehaviorMixin` 일반화 검토 후보(SKILL 회귀 규율, 본 사이클은 메모만).
