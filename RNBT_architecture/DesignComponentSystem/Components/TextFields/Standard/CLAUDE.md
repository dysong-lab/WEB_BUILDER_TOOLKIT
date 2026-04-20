# TextFields — Standard

## 기능 정의

1. **필드 정보 렌더링** — 레이블, 플레이스홀더, 값, 보조문구, 오류문구를 입력 필드에 반영
2. **상태 반영** — `disabled`, `readonly`, `required`, `invalid` 상태를 DOM과 접근성 속성에 동기화
3. **클리어 액션 지원** — 값이 있을 때 clear 버튼으로 입력값을 비우고 상태를 갱신
4. **입력 이벤트 발행** — input, change, focus, blur, clear 시 페이지 이벤트를 발행
5. **보조문구 전환** — 에러 상태에서는 supporting text 대신 error text를 우선 표시

## 구현 명세

### Mixin

FieldRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| root | `.text-field` | 루트 상태 반영 |
| label | `.text-field__label` | 필드 레이블 |
| input | `.text-field__input` | 실제 입력 요소 |
| supportingText | `.text-field__supporting` | 보조문구 |
| errorText | `.text-field__error` | 오류문구 |
| clearButton | `.text-field__clear` | 값 비우기 버튼 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| textFieldInfo | `this.renderTextFieldInfo` |

### 이벤트 (customEvents)

| DOM 이벤트 | selector | 발행 이벤트 |
|-----------|----------|-------------|
| input | `.text-field__input` | `@textFieldInputChanged` |
| change | `.text-field__input` | `@textFieldChanged` |
| focusin | `.text-field__input` | `@textFieldFocused` |
| focusout | `.text-field__input` | `@textFieldBlurred` |

### 자체 메서드

| 메서드 | 설명 |
|--------|------|
| `this.getElement(key)` | 선택자 키로 DOM 요소를 반환 |
| `this.normalizeTextFieldInfo(payload)` | 렌더링 가능한 형태로 데이터를 정규화 |
| `this.syncState(info)` | 입력 상태와 접근성 속성을 동기화 |
| `this.clearValue()` | 입력값을 비우고 clear 이벤트를 발행 |
| `this.renderTextFieldInfo(payload)` | 필드 텍스트와 상태를 함께 반영 |

### 데이터 계약

```javascript
{
  label: "Project name",
  placeholder: "Enter a title",
  value: "Control Center",
  supportingText: "Used in page navigation and exports.",
  errorText: "",
  disabled: false,
  readonly: false,
  required: true,
  invalid: false
}
```

### 표시 규칙

- `invalid === true`이면 `errorText`를 우선 표시하고 `supportingText`는 숨김 처리
- `clearButton`은 값이 있을 때만 표시
- `readonly === true`이면 clear 버튼을 숨김 처리
- `required === true`이면 input에 `required`, label에 `aria-required="true"`를 반영

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 청색 글래스 기반 관리형 입력 필드 |
| 02_material | B: Material Balance | 밝은 서피스 기반 기본 폼 필드 |
| 03_editorial | C: Editorial Utility | 타이포그래피 강조형 에디토리얼 필드 |
| 04_operational | D: Operational Console | 다크 콘솔용 상태 중심 입력 필드 |
