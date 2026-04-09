# Buttons — Standard

## 기능 정의

1. **기본 레이블 표시** — 전달된 `label` 값을 버튼 텍스트에 렌더링
2. **접근성 속성 동기화** — 버튼의 `aria-label`을 현재 레이블과 동일하게 유지
3. **클릭 이벤트 발행** — 버튼 루트 클릭 시 `@buttonClicked` 이벤트를 발행

---

## 구현 명세

### Mixin

없음

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| button | `.md-button` | 클릭 이벤트 타깃 |
| label | `.md-button__label` | 레이블 텍스트 렌더링 |

### 구독 (subscriptions)

없음

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `.md-button` | `@buttonClicked` |

### 페이지 연결 사례

```text
[Buttons/Standard] ──@buttonClicked──▶ [페이지] ──▶ 저장 요청
                                              또는 상세 패널 열기
                                              또는 다음 단계 이동
```

### 자체 메서드

| 메서드 | 설명 |
|--------|------|
| `this.renderButtonInfo(data)` | `label` 값을 버튼 텍스트와 `aria-label`에 동기화 |

### 데이터 계약

```javascript
{
    label: 'Save'
}
```

### 표시 규칙

- `label`이 `null` 또는 `undefined`면 빈 문자열로 처리
- 공백 포함 원본 문자열을 버튼 레이블에 그대로 반영
- 버튼은 항상 표시 상태를 유지하며, 숨김 처리는 이번 범위에 포함하지 않음

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 정제된 블루 계열, 유리질 하이라이트 |
| 02_material | B: Material Elevated | MD3 기준 라이트 Filled Button |
| 03_editorial | C: Minimal Editorial | 웜 뉴트럴, 미니멀 에디토리얼 |
| 04_operational | D: Dark Operational | 다크 HUD, 시안 포인트 |
