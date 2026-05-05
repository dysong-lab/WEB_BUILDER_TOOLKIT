# TextFields — Advanced / masking

## 기능 정의

1. **TextField 기본 렌더링 (Standard 호환 KEY)** — `textField` 토픽으로 수신한 객체 데이터(`{ label, required, value, placeholder, leadingIcon, trailingIcon, supporting, errorText, state, maskPattern? }`)를 FieldRenderMixin으로 매핑. cssSelectors KEY는 Standard 호환(`root` / `label` / `leadingIcon` / `value` / `placeholder` / `trailingIcon` / `supporting` / `errorText` / `state` / `required`).
2. **maskPattern 자체 상태** — `_maskPattern: string`(예: `"###-####-####"`, `"#### #### #### ####"`, `"###-##-#####"`). `#` 자리는 숫자 1자리, 그 외 문자는 구분자(separator)로 그대로 출력. `textField` 토픽에 `maskPattern` 필드가 포함되어 발행되면 `_maskPattern`을 갱신 후 현재 값을 재포맷한다.
3. **input 이벤트 → format 적용 + caret 보존** — 사용자가 input에 타이핑/붙여넣기 할 때마다 `_handleInput`이 ① 현재 raw(숫자만) 추출 → ② maxDigits(`#` 개수)로 자르기 → ③ `_format(raw)` 적용해 input.value 교체 → ④ caret 위치를 "타이핑 전 raw 길이 vs 새 raw 길이" 차이를 사용해 mask 좌표로 매핑(separator 건너뛰기) → ⑤ `@maskedValueChanged({ raw, formatted, valid })` 발행. `valid`는 `raw.length === maxDigits`.
4. **keydown(Backspace) — separator 건너뛰기 + 직전 자릿수 삭제** — caret 직전이 separator(숫자 아님)이면 `event.preventDefault()` 후 caret을 separator 앞으로 이동시키고 그 직전 숫자 1자리를 raw에서 제거 → 재포맷. iOS/Android 키보드 quirk를 우회한 명시적 처리.
5. **외부 토픽 `setMaskedValue` 수신** — 페이지가 `setMaskedValue` 토픽으로 `{ raw }` 또는 `{ raw, maskPattern }`을 publish하면 `_setMaskedValueFromTopic`이 raw 정규화(숫자만) → 새 mask가 있으면 `_maskPattern` 갱신 → `_format(raw)`을 input에 채움 → `@maskedValueChanged` 발행. 폼 초기화 / 외부 자동입력 / 단계 전환(전화번호 → 카드번호) 시나리오를 모두 커버.
6. **change(blur/Enter) 이벤트 — 변경 완료 통보** — Standard 호환 채널 `@textFieldChanged` 유지. 본 변형은 raw/formatted/valid를 한 번 더 동봉하지 않고 표준 시그니처(이벤트 객체)를 그대로 전달 — 마스킹 정보는 `@maskedValueChanged`가 권위 있는 채널.
7. **Trailing 클릭 — Standard 호환** — `@textFieldTrailingClicked` 발행. 페이지가 clear/모드 전환 등을 결정하고 `setMaskedValue({ raw: '' })` 또는 `textField` 재발행으로 응답.

> **Standard와의 분리 정당성 (5축)**:
> - **자체 상태 4종 추가** — `_maskPattern: string`(현재 마스크), `_inputHandler` / `_keydownHandler` (bound refs — beforeDestroy 정확 제거), `_lastFormatted: string`(역변환/디버그용 — 직전 포맷 결과 캐시). Standard는 stateless.
> - **새 토픽 1종 추가** — `setMaskedValue`(외부 raw 주입 채널). Standard는 `textField` 단일 토픽이며 raw 개념이 없다 — 외부에서 마스킹된 값을 채우려면 페이지가 직접 포맷해서 `value`로 발행해야 함.
> - **새 이벤트 1종 추가** — `@maskedValueChanged({ raw, formatted, valid })`. Standard의 `@textFieldInput`/`@textFieldChanged`는 `event.target.value`(formatted) 만 통보하므로 페이지가 raw를 다시 추출해야 함. masking은 raw를 권위 있게 동봉.
> - **자체 메서드 5종** — `_format(raw)`, `_unformat(formatted)`, `_handleInput(e)`, `_handleKeydown(e)`, `_setMaskedValueFromTopic({response})`. Standard는 자체 메서드 0개(FieldRender 단독).
> - **자체 input/keydown 핸들러로 caret 위치 + Backspace separator 건너뛰기 + maxDigits 자르기 처리** — Standard의 `customEvents` 위임만으로는 표현 불가. format은 단순한 정규식이 아니라 caret-aware한 in-place 교체이므로 native handler가 필수.

> **유사 변형과의 비교**: `Search/Advanced/autoComplete`이 "input 이벤트 → 디바운스 → emit + dropdown 렌더 + 키보드 navigation"를 자체 메서드로 흡수했고, `Chips/Input/Advanced/pasteMultiple`이 "input/paste 파싱 + 칩 누적"을 자체 메서드로 흡수한 것과 같은 자체 native handler + bound refs + beforeDestroy 정확 제거 패턴을 답습한다. 차이는 ① dropdown 영역이 없어 단순(input element만 핸들), ② 디바운스 없이 매 keystroke 즉시 처리(format은 client-side cheap), ③ 외부 fetch 위임 없음(전부 클라이언트 처리), ④ 새 토픽 `setMaskedValue`로 외부 raw 주입 채널만 추가.

> **MD3 / 도메인 근거**: MD3 spec에 "masking" 명시 항목은 없으나 "Input field"에서 prefix/suffix · format helper text가 표준 확장. Material design components 라이브러리들(Material UI, Vuetify)이 input mask를 일반화. 실사용 예: ① **전화번호 입력**(국가별 mask: `010-####-####`, `+81-##-####-####`), ② **카드번호 입력**(4-4-4-4 그룹 — Visa/MC/Amex), ③ **주민등록번호/사업자번호**(`######-#######` / `###-##-#####`), ④ **우편번호**(`#####` / `#####-####` US ZIP+4), ⑤ **금액 입력**(`#,###,###` 천단위 콤마 — 본 변형은 prefix/suffix 미지원이라 정수 마스크 한정). 모든 케이스에서 사용자는 separator 없이 숫자만 타이핑하고, separator는 자동 삽입. **raw 보존**(서버 전송용)과 **formatted 표시**(사용자 가독성)의 분리가 핵심 — `@maskedValueChanged({raw, formatted, valid})`가 그 분리를 명시화.

---

## 구현 명세

### Mixin

FieldRenderMixin (단일) + 자체 상태 4종 + 자체 메서드 5종.

> **신규 Mixin 생성 금지** — masking은 textField의 입력 처리 정책 확장이지 새 렌더 패턴이 아니다. FieldRenderMixin이 label/value/placeholder/leading/trailing/supporting/error/state/required 매핑을 담당하고, 자체 native handler가 input.value의 in-place 교체 + caret 관리를 담당. ListRender/ShadowPopup 등 추가 Mixin 불필요.

### cssSelectors (`this.fieldRender`)

| KEY | VALUE | 용도 |
|-----|-------|------|
| root         | `.text-field`              | 루트 — `data-state` / `data-required` 부착 + 이벤트 스코프 |
| label        | `.text-field__label`       | 라벨 텍스트 |
| leadingIcon  | `.text-field__leading`     | 시작 아이콘 자리 |
| value        | `.text-field__input`       | 입력 필드 — `value` 속성 반영 + 자체 input/keydown 핸들러 부착 영역 |
| placeholder  | `.text-field__input`       | 입력 필드 — `placeholder` 속성 반영 |
| trailingIcon | `.text-field__trailing`    | 끝 아이콘 자리 — bindEvents click 매핑 |
| supporting   | `.text-field__supporting`  | 보조 텍스트 (helper) |
| errorText    | `.text-field__error`       | 에러 메시지 |
| state        | `.text-field`              | dataset 반영 대상 (state) |
| required     | `.text-field`              | dataset 반영 대상 (required) |

### datasetAttrs (`this.fieldRender`)

| KEY | VALUE |
|-----|-------|
| state    | state    |
| required | required |

### elementAttrs (`this.fieldRender`)

| KEY | VALUE | 동작 |
|-----|-------|------|
| value       | value       | input의 `value` 속성에 반영 (publish 직후 `_format(raw)` 적용을 위해 `_handlePostRender`로 후처리) |
| placeholder | placeholder | input의 `placeholder` 속성에 반영 |

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_maskPattern` | `string` | 현재 마스크 (예: `"###-####-####"`). `#` 자리는 숫자, 그 외는 구분자. 빈 문자열이면 마스킹 없이 그대로 표시. |
| `_lastFormatted` | `string` | 직전 포맷 결과 캐시 — 디버깅/외부 조회용. emit 시 `formatted`로 동봉. |
| `_inputHandler` | `function \| null` | input element `input` 핸들러 bound ref — beforeDestroy 정확 제거용. |
| `_keydownHandler` | `function \| null` | input element `keydown` 핸들러 bound ref — beforeDestroy 정확 제거용. |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `textField` | `this._renderTextField` | `{ label, required, value, placeholder, leadingIcon, trailingIcon, supporting, errorText, state, maskPattern? }` — Standard 호환 + 선택적 `maskPattern`. `_renderTextField`은 `maskPattern`을 추출해 `_maskPattern` 갱신 후 `value`를 `_format(value)`로 변환한 다음 `fieldRender.renderData`에 위임. |
| `setMaskedValue` | `this._setMaskedValueFromTopic` | `{ raw, maskPattern? }` — raw(숫자만) 또는 raw + 새 mask. 외부 자동입력 / 폼 초기화 / 모드 전환. |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 |
|--------|------------------|------|
| change | `value` (fieldRender)        | `@textFieldChanged` (Standard 호환) |
| click  | `trailingIcon` (fieldRender) | `@textFieldTrailingClicked` (Standard 호환) |

> input 이벤트는 customEvents에서 위임하지 않고 자체 native handler(`_handleInput`)로 처리한다 — formatted/raw/valid를 함께 동봉한 `@maskedValueChanged` 발행이 권위 있는 채널이며, 단순 위임의 `@textFieldInput`은 raw가 빠져 페이지가 다시 추출해야 하므로 본 변형에서는 의도적으로 생략.

### 자체 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@maskedValueChanged` | input/keydown(Backspace)/setMaskedValue 처리 후 | `{ raw, formatted, valid }` (`raw`: 숫자만 ≤ maxDigits, `formatted`: input.value, `valid`: raw.length === maxDigits) |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_format(raw)` | `(string) => string` | maskPattern을 따라 raw를 formatted로 변환. raw는 숫자만, maxDigits로 자른 뒤 mask의 `#` 자리에 1글자씩 채우고 raw가 끝나면 mask도 멈춤(나머지 separator/자리 표시 안 함). `_maskPattern === ''`이면 raw 그대로 반환. |
| `_unformat(formatted)` | `(string) => string` | formatted 문자열에서 숫자만 추출 — `String.replace(/\D/g, '')`. mask와 무관(범용). |
| `_renderTextField({ response })` | `({response}) => void` | `textField` 토픽 핸들러. `response.maskPattern`이 있으면 `_maskPattern` 갱신. `response.value`가 string이면 `_format(_unformat(value))`로 안전하게 정규화 후 fieldRender.renderData 위임. `_lastFormatted` 갱신. |
| `_handleInput(e)` | `(InputEvent) => void` | input element `input` 이벤트. raw 추출 → maxDigits 자르기 → `_format` → input.value 교체 → caret 위치를 "raw 길이 → mask 인덱스"로 매핑 → `setSelectionRange` 복원 → `@maskedValueChanged` emit. |
| `_handleKeydown(e)` | `(KeyboardEvent) => void` | input element `keydown` 이벤트. `e.key === 'Backspace'`이고 caret 직전이 separator(숫자 아님)이면 `e.preventDefault()` → caret 직전 separator를 건너뛰며 그 앞 숫자 1자리를 raw에서 제거 → 재포맷 → caret을 새 위치로 복원 → emit. 그 외 키는 native input 이벤트가 처리하도록 통과. |
| `_setMaskedValueFromTopic({ response })` | `({response}) => void` | `setMaskedValue` 토픽 핸들러. `response.maskPattern`이 있으면 `_maskPattern` 갱신. raw 정규화(`_unformat(String(response.raw))`) → maxDigits 자르기 → `_format` → input.value = formatted → caret을 끝으로 → `@maskedValueChanged` emit. |

### 페이지 연결 사례

```
[페이지 — 가입 폼 / 결제 폼 / 주민번호 / 우편번호 / 사업자번호]
    │
    ├─ fetchAndPublish('textField', this) 또는 직접 publish
    │     payload 예: {
    │         label: 'Phone number', required: 'true', value: '', placeholder: '010-####-####',
    │         leadingIcon: '☎', trailingIcon: '✕',
    │         supporting: 'We will text you a verification code.',
    │         errorText: '', state: 'enabled',
    │         maskPattern: '###-####-####'   // ← 선택. 없으면 _maskPattern 유지.
    │     }
    │
    └─ '@maskedValueChanged' 수신 → 폼 검증 / 서버 raw 전송 / errorText 재발행
          payload 예: { raw: '01012345678', formatted: '010-1234-5678', valid: true }

[TextFields/Advanced/masking]
    ├─ FieldRender가 label/placeholder/leadingIcon/trailingIcon/supporting/errorText 매핑
    ├─ _renderTextField가 maskPattern 갱신 + value를 _format해서 fieldRender 위임
    ├─ 사용자 '01012345678' 타이핑 → 매 keystroke마다 _handleInput
    │   → formatted = '010-1234-5678' 으로 input.value 교체 + caret 보존
    │   → @maskedValueChanged({raw:'01012345678', formatted:'010-1234-5678', valid:true})
    ├─ Backspace → caret 직전 '-' 이면 separator 건너뛰며 그 앞 숫자 1자리 제거
    └─ blur/Enter → @textFieldChanged (Standard 호환)

[setMaskedValue 토픽 publish]
    └─ ex: { raw: '01098765432', maskPattern: '###-####-####' }
        → _setMaskedValueFromTopic
        → input.value = '010-9876-5432'
        → @maskedValueChanged emit

[trailing × 클릭]
    └──@textFieldTrailingClicked──▶ [페이지] ──> setMaskedValue({raw:''}) 발행해서 클리어

운영: this.pageDataMappings = [
        { topic: 'textField',       datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setMaskedValue',  datasetInfo: {...}, refreshInterval: 0 }   // 외부 자동입력 / 모드 전환 시 사용
      ];
      Wkit.onEventBusHandlers({
        '@maskedValueChanged':       ({ raw, formatted, valid }) => { /* 검증 / 서버 전송 트리거 */ },
        '@textFieldChanged':         (e)                          => { /* blur/Enter 시 폼 저장 */ },
        '@textFieldTrailingClicked': ()                           => { /* clear / 모드 전환 */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|-------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 + Pretendard + 8px 모서리 + 그라디언트 입력 배경 + box-shadow 금지 + focus는 border 색상으로만. | **전화번호 입력 (회원가입)** — `010-####-####` mask, leadingIcon=☎, trailingIcon=×, supporting="We'll text you a verification code." |
| `02_material`    | B: Material Elevated | 라이트 + Roboto + floating label (MD3 정석) + 4px 모서리 + focus 시 border 두께 증가. | **카드번호 입력 (결제)** — `#### #### #### ####` mask, leadingIcon=💳(material-symbols), supporting="16자리 카드번호" |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 + DM Serif 라벨 + Inter 입력 + 바닥줄(border-bottom only) + 2px 모서리 + 정적 모션. | **주민등록번호 입력 (정부 서식 / 매거진형)** — `######-#######` mask, supporting=ITALIC "본인 확인용으로만 사용됩니다." |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 쿨 톤 + IBM Plex Mono + UPPERCASE 라벨 + 2px 모서리 + 시안 미세 테두리. | **사업자등록번호 입력 (운영 콘솔)** — `###-##-#####` mask, leadingIcon=`B/N`(ASCII), trailingIcon=`CLR`(ASCII), supporting="ENTER REGISTRATION NUMBER" |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따른다. 한 변형 안에서 mask 1종 + 초기 value 비어있음 → 사용자 타이핑 시 자동 포맷을 시연하며, preview에서 `setMaskedValue` 토픽 시뮬도 데모 컨트롤로 노출한다.

### 결정사항

- **`#` 자리 표시 문법**: 1자리당 1개의 `#`. 그 외 모든 문자는 separator로 그대로 출력. 흔한 문법이고 외부 라이브러리 없이도 작성 가능. 향후 `*`(임의 문자) 또는 `A`(영문) 확장은 후속 변형에서 검토.
- **maxDigits 자르기**: raw의 숫자 길이를 mask의 `#` 개수로 자른다 — 사용자가 18자리 입력해도 11자리에서 멈춤(전화번호 mask 기준). 자르기 위치는 `slice(0, maxDigits)`.
- **caret 보존**: input.value 교체 후 caret이 끝으로 점프하는 기본 동작을 막기 위해 raw 좌표 → mask 좌표 매핑 후 `setSelectionRange` 호출. 매핑 규칙: caret 이전의 raw 길이만큼 mask를 순회하며 `#`을 카운트해 위치 산출.
- **Backspace separator 건너뛰기**: caret 직전이 separator이면 separator만 지우는 것은 의미 없으므로(다음 키 입력 시 다시 separator가 자동 삽입됨) 그 앞 숫자 1자리를 함께 제거하는 정책. iOS quirk 우회.
- **Standard 호환 유지 (`@textFieldChanged` + `@textFieldTrailingClicked`)**: 페이지가 Standard에서 masking으로 마이그레이션할 때 핸들러를 그대로 재사용 가능. 신규 채널 `@maskedValueChanged`만 추가 구독하면 됨.
- **`@textFieldInput` 의도적 미발행**: Standard와 달리 본 변형은 raw 동봉이 핵심 가치이므로 `event.target.value`만 통보하는 단순 위임 채널은 가치가 0이며, 동시에 두 채널을 같은 keystroke에서 발행하면 페이지 핸들러가 중복 호출되는 문제 — `@maskedValueChanged`로 통일.
- **외부 라이브러리 금지**: cleave.js/imask 같은 라이브러리 없이 native String + `setSelectionRange`만으로 구현. 의존성 추가 회피 + 컴포넌트 시스템 일관성.
- **신규 Mixin 생성 금지**: FieldRenderMixin + 자체 메서드로 완결. mask/format/unformat 패턴이 향후 여러 input 변형에서 답습되면(예: validation, characterCounter도 input native handler 추가 필요) `InputBehaviorMixin` 일반화 후보 — SKILL 회귀 규율, 본 사이클은 메모만.
