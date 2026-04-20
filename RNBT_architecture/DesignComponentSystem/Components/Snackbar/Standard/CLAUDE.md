# Snackbar — Standard

## 기능 정의

1. **스낵바 정보 렌더링** — `message`, `actionLabel`, `tone`, `duration`, `open` 상태를 DOM에 반영
2. **표시/숨김 제어** — 외부 데이터나 자체 메서드로 스낵바를 열고 닫는다
3. **자동 숨김** — `duration`이 0보다 크면 지정 시간 후 자동으로 숨긴다
4. **사용자 액션 이벤트 발행** — 액션 버튼과 닫기 버튼 클릭 시 이벤트를 발행한다
5. **접근성 상태 동기화** — `role`, `aria-live`, `aria-hidden`을 현재 표시 상태와 동기화한다

## 구현 명세

### Mixin

FieldRenderMixin

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| root | `.snackbar` | 루트 상태 반영 |
| message | `.snackbar__message` | 메시지 텍스트 |
| action | `.snackbar__action` | 액션 버튼 |
| actionLabel | `.snackbar__action-label` | 액션 버튼 라벨 |
| dismiss | `.snackbar__dismiss` | 닫기 버튼 |

### datasetAttrs

```javascript
{
  tone: "tone",
  open: "open",
  hasAction: "hasAction"
}
```

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| snackbarInfo | `this.renderSnackbarInfo` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `.snackbar__action` | `@snackbarActionClicked` |
| click | `.snackbar__dismiss` | `@snackbarDismissed` |

### 자체 메서드

| 메서드 | 설명 |
|--------|------|
| `this.normalizeSnackbarInfo(data)` | 렌더링용 스낵바 데이터를 정규화 |
| `this.clearHideTimer()` | 자동 숨김 타이머를 해제 |
| `this.scheduleAutoHide(duration)` | 지정 시간 뒤 자동 숨김을 예약 |
| `this.showSnackbar(payload)` | 데이터를 렌더링하고 스낵바를 표시 |
| `this.hideSnackbar(reason)` | 스낵바를 숨기고 hidden 이벤트를 발행 |
| `this.renderSnackbarInfo(payload)` | 외부 데이터로 스낵바 상태를 갱신 |

### 데이터 계약

```javascript
{
  message: "Network settings saved",
  actionLabel: "Undo",
  tone: "accent",
  duration: 5000,
  open: true
}
```

### 표시 규칙

- `tone`은 `accent`, `neutral`, `success`, `warning`, `danger` 중 하나만 허용하고, 아니면 `accent`
- `actionLabel`이 비어 있으면 액션 버튼을 숨기고 `data-has-action="false"`로 표시
- `duration`이 0 이하이거나 숫자가 아니면 자동 숨김을 예약하지 않음
- `open=true`이면 `data-open="true"`, `aria-hidden="false"`를 반영
- 루트 요소는 항상 `role="status"`와 `aria-live="polite"`를 유지

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 유리 질감과 네온 포인트를 가진 다크 스낵바 |
| 02_material | B: Material Elevated | MD3 라이트 서피스 기반 기본 스낵바 |
| 03_editorial | C: Editorial Utility | 타이포 대비를 강조한 편집형 알림 |
| 04_operational | D: Operational Console | 경고/복구 알림을 빠르게 읽는 콘솔형 스낵바 |
