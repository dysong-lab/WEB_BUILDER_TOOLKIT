# TextFields — Standard

## MD3 정의

> Text fields let users enter text into a UI.

MD3 Text field anatomy (Outlined 기준): label(resting/floating) + input + leading icon(선택) + trailing icon(선택) + supporting text(helper/error). 상태: enabled / focused / disabled / error. Required 필드는 라벨 옆 `*` 마커로 표시. Standard는 **Outlined**를 기본 형태로 삼고, 단일 라인 입력을 다룬다. 확장(Multiline, Filled, Prefix/Suffix, IME 상태 관리 등)은 Advanced에서 다룬다.

## 기능 정의

1. **라벨 표시** — `textField` 토픽 객체의 `label` 값을 라벨 요소에 반영한다
2. **필수 표시** — `required`(boolean → `'true'`/`'false'` 문자열) 값을 루트의 `data-required`로 반영하여 CSS에서 `*` 마커를 제어한다
3. **입력값/플레이스홀더 반영** — `value`, `placeholder` 를 input 요소의 `value`/`placeholder` 속성으로 반영한다
4. **Leading icon** — `leadingIcon` 값을 leading 자리 textContent로 반영한다 (비어있으면 CSS `:empty`로 숨김)
5. **Trailing icon** — `trailingIcon` 값을 trailing 자리 textContent로 반영한다 (비어있으면 CSS `:empty`로 숨김)
6. **Supporting/helper text** — `supporting` 값을 하단 supporting 영역의 textContent로 반영한다 (비어있으면 `:empty`로 숨김)
7. **에러 텍스트** — `errorText` 값을 error 영역의 textContent로 반영한다 (비어있으면 `:empty`로 숨김)
8. **상태 표현** — `state`(`'enabled' | 'focused' | 'disabled' | 'error'`)를 루트의 `data-state`로 반영하여 CSS가 스타일을 분기한다. `state === 'disabled'`는 CSS의 `pointer-events: none` + 비활성 색상으로 비활성을 구현한다(HTML `disabled` 속성은 사용하지 않음).
9. **입력 이벤트** — input 키 입력 시 `@textFieldInput` 발행 (페이지가 `event.target.value`로 값 수신)
10. **변경 완료 이벤트** — input `change`(blur/Enter) 시 `@textFieldChanged` 발행
11. **Trailing 클릭 이벤트** — trailing 아이콘 영역 클릭 시 `@textFieldTrailingClicked` 발행 (페이지가 clear / 비밀번호 토글 등을 결정)

---

## 구현 명세

### Mixin

FieldRenderMixin (단일)

- 고정 DOM(label / input / leading / trailing / supporting / error 루트)에 단일 객체 데이터를 매핑하는 **1:N 렌더링**이 핵심이며, 배열 반복/팝업이 없으므로 FieldRenderMixin 단독으로 완결된다.
- 신규 Mixin 생성하지 않는다. Search Standard와 동일 패턴의 축약형.

### cssSelectors (`this.fieldRender`)

| KEY | VALUE | 용도 |
|-----|-------|------|
| root         | `.text-field`              | 루트 — `data-state` / `data-required` 부착 + 이벤트 스코프 |
| label        | `.text-field__label`       | 라벨 텍스트 |
| leadingIcon  | `.text-field__leading`     | 시작 아이콘 자리 |
| value        | `.text-field__input`       | 입력 필드 — `value` 속성 반영 |
| placeholder  | `.text-field__input`       | 입력 필드 — `placeholder` 속성 반영 |
| trailingIcon | `.text-field__trailing`    | 끝 아이콘 자리 — 이벤트 매핑 대상 |
| supporting   | `.text-field__supporting`  | 보조 텍스트 (helper) |
| errorText    | `.text-field__error`       | 에러 메시지 |

> `root` KEY는 `data-state` / `data-required` 반영 대상이자 이벤트/스타일 훅으로만 사용된다 (textContent 덮어씀은 없음 — 데이터에 `root` 키가 없으므로 FieldRenderMixin이 건너뜀).

### datasetAttrs (`this.fieldRender`)

| KEY | VALUE |
|-----|-------|
| state    | state    |
| required | required |

| KEY | cssSelectors 대상 | 결과 DOM |
|-----|-------------------|----------|
| state    | `.text-field` (선택자 필요)   | `data-state="enabled | focused | disabled | error"` |
| required | `.text-field` (선택자 필요)   | `data-required="true | false"` |

> **계약 추가:** `state`, `required`도 dataset 반영 대상이므로 cssSelectors에 동일 KEY로 루트 선택자를 추가한다. 즉 `cssSelectors.state = '.text-field'`, `cssSelectors.required = '.text-field'`. FieldRenderMixin은 `datasetAttrs[key]` 존재 시 textContent 대신 `data-*` 속성만 반영한다(FieldRenderMixin 구현 참고 — [FieldRenderMixin.md](/RNBT_architecture/DesignComponentSystem/Mixins/FieldRenderMixin.md)).

### elementAttrs (`this.fieldRender`)

| KEY | VALUE | 동작 |
|-----|-------|------|
| value       | value       | input의 `value` 속성에 반영 |
| placeholder | placeholder | input의 `placeholder` 속성에 반영 |

> **Disabled 처리**: MD3 disabled 상태는 `state: 'disabled'`로 발행하면 루트에 `data-state="disabled"`가 붙고, CSS가 `pointer-events: none` + 비활성 색상으로 처리한다. 실제 HTML `disabled` 속성은 사용하지 않는다 (`setAttribute('disabled', 'false')`가 HTML boolean attribute 의미와 충돌하므로). 필요 시 페이지가 input 요소에 직접 속성을 제어할 수 있지만, 표준 경로는 `data-state`다.

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| textField | `this.fieldRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| input  | `value` (fieldRender.cssSelectors)        | `@textFieldInput`            |
| change | `value` (fieldRender.cssSelectors)        | `@textFieldChanged`          |
| click  | `trailingIcon` (fieldRender.cssSelectors) | `@textFieldTrailingClicked`  |

> `change` 이벤트는 blur/Enter 시 발행된다. MD3 TextField의 "submit" 개념은 없고, 변경 완료를 페이지가 수신하여 폼 검증/저장을 수행하는 계약이다. `input`은 타이핑마다, `change`는 확정 시점.

### 커스텀 메서드

없음. 모든 상태 전환(enabled ↔ focused ↔ error ↔ disabled)은 페이지가 `textField` 토픽 재발행으로 수행한다. `state === 'disabled'`일 때 input disabled 속성은 `elementAttrs.disabled` 경로로 함께 반영된다.

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('textField', this)──> [TextField] 바 렌더링
         publish data: {
             label:        'Email address',
             required:     'true',
             value:        '',
             placeholder:  'you@example.com',
             leadingIcon:  '\u2709',      // optional (없으면 '' 발행)
             trailingIcon: '\u2715',      // optional
             supporting:   'We will never share your email.',
             errorText:    '',
             state:        'enabled'       // 'enabled' | 'focused' | 'disabled' | 'error'
         }

[TextField] ──@textFieldInput──> [페이지] ──> event.target.value로 값 수신 → 검증 → state/errorText 재발행
[TextField] ──@textFieldChanged──> [페이지] ──> 최종 값 확정 → 저장/검증
[TextField] ──@textFieldTrailingClicked──> [페이지] ──> clear/토글 결정 → textField 재발행
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined     | A: Refined Technical | 다크 퍼플 Surface, Pretendard 400-600, Outlined 8px, 라벨 상단 배치, 그라디언트 입력 배경, box-shadow 금지, focus/error는 border 색상으로만 |
| 02_material    | B: Material Elevated | 라이트, Roboto, **floating label (MD3 Outlined 정석)** — 라벨이 border 겹치며 떠오름, 4-8px 모서리, focus 시 border 두께 증가 |
| 03_editorial   | C: Minimal Editorial | 웜 그레이 바닥줄(border-bottom only), DM Serif 라벨 + Inter 입력, 넓은 여백, 2px 모서리, 정적 모션, 세리프 에러 이탤릭 |
| 04_operational | D: Dark Operational  | 컴팩트 다크 쿨 톤, IBM Plex Mono, 라벨 UPPERCASE 소형, 2px 모서리, 시안 미세 테두리, error는 빨강 테두리 + 빨강 모노 텍스트 |

### 결정사항

- **Outlined 고정 (Standard)**: MD3의 Filled 변형은 배경(fill) 기반이라 페르소나별 시각 언어가 충돌할 수 있으며, Outlined가 모든 페르소나에 적응하기 쉽다. Filled는 Advanced에서 다룬다.
- **Floating label은 02만 정석 구현**: MD3 Outlined 정의상 floating label이 기본이지만, 01/03/04는 각 페르소나의 타이포/간격 철학에 맞춰 **상단 고정 라벨**로 해석한다(동일 선택자 `.text-field__label` 유지 → register.js 불변).
- **state 전환은 페이지 책임**: focus는 CSS `:focus-within`으로 충분하지만 MD3는 'focused'를 명시 상태로 정의한다. Standard는 두 경로를 모두 지원 — CSS가 시각 처리(대부분의 경우)하고, 페이지는 `state === 'error' | 'disabled'`를 재발행으로 명시 전환한다.
- **clear 버튼 없음**: MD3 TextField Standard는 trailing 아이콘이 "의미적 아이콘"(이메일 아이콘, 자물쇠, 경고 등)이지 clear 버튼이 아니다. clear가 필요하면 페이지가 `trailingIcon = '\u2715'`로 발행하고 `@textFieldTrailingClicked`에서 value 초기화 재발행으로 처리한다. Search와 역할 분리.
- **아이콘 전략**: 페르소나별 서체 정책에 맞춤 — 01(유니코드), 02(material-symbols), 03(유니코드), 04(ASCII).
- **데이터 형식**: `required`는 boolean이 아닌 **문자열 `'true'` / `'false'`**로 발행한다. FieldRenderMixin은 값을 그대로 setAttribute하므로 문자열이어야 CSS selector(`[data-required="true"]`)가 의도대로 동작한다. `state === 'disabled'`는 HTML `disabled` 속성 대신 `data-state`로만 처리되며, CSS가 `pointer-events: none` + 색상 토큰으로 비활성을 구현한다.
- **근거**: MD3 Spec — label + input + leading/trailing + supporting + error. 단일 객체 → 다중 DOM 반영이므로 FieldRenderMixin 단독으로 완결. Search Standard(FieldRender + ListRender)에서 ListRender를 제거한 축약 구조.
