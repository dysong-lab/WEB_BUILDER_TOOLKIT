# Buttons — Advanced / confirmation

## 기능 정의

1. **라벨 표시** — `buttonInfo` 토픽으로 수신한 값을 버튼 라벨과 보조 문구에 렌더한다.
2. **1차 클릭 보호** — 첫 클릭에서는 즉시 액션을 실행하지 않고 확인 상태로 전환한다.
3. **확인 요청 이벤트** — 확인 상태 진입 시 `@confirmationNeeded`를 발행한다.
4. **2차 클릭 실행** — 확인 상태에서 다시 클릭하면 실제 액션으로 `@buttonClicked`를 발행한다.
5. **취소/타임아웃 복귀** — 취소 버튼 클릭 또는 제한 시간 경과 시 기본 상태로 돌아간다.

> 이 변형은 실수 클릭을 줄이기 위해 "한 번 더 확인"이 필요한 버튼에 쓴다. 삭제, 해제, 전환, 승인 같은 돌이키기 어려운 액션에 적합하다.

---

## 구현 명세

### Mixin

없음

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| shell | `.button-shell` | 루트 컨테이너 — phase dataset 반영 |
| button | `.md-button` | 주 액션 버튼 |
| label | `.md-button__label` | 버튼 라벨 텍스트 |
| helper | `.button-feedback__hint` | 상태 안내 문구 |
| cancel | `.button-feedback__cancel` | 확인 취소 버튼 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| buttonInfo | `renderButtonInfo` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| primary click (1차) | `button` | `@confirmationNeeded` |
| primary click (2차) | `button` | `@buttonClicked` |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `renderButtonInfo(data)` | 기본 라벨/확인 라벨/도움말을 반영한다 |
| `applyConfirmationState()` | 확인 상태 라벨/안내 문구를 적용한다 |
| `resetConfirmationState()` | 기본 상태로 복귀한다 |
| `enterConfirmationState(event)` | 1차 클릭 시 확인 상태 진입과 `@confirmationNeeded` 발행을 수행한다 |
| `confirmAction(event)` | 2차 클릭 시 실제 액션으로 `@buttonClicked`를 발행한다 |

### 페이지 연결 사례

```
[페이지] ──buttonInfo──▶ [Buttons/Advanced/confirmation]
                           └─ renderButtonInfo(...)

[Buttons/Advanced/confirmation] ──1st click──▶ @confirmationNeeded
[Buttons/Advanced/confirmation] ──2nd click──▶ @buttonClicked
```

### 사용 시점

- 실수 클릭이 비용이 큰 버튼
- destructive action 전에 한 번 더 의도 확인이 필요할 때
- modal 없이 가벼운 2단계 확인 UX가 필요한 경우

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 다크 배경 위 confirm 상태가 명확한 refined 버튼 |
| 02_material | B: Material Elevated | 라이트 surface와 soft confirm cue를 가진 material 버튼 |
| 03_editorial | C: Minimal Editorial | 얇은 경고선과 절제된 copy의 editorial 버튼 |
| 04_operational | D: Dark Operational | compact control-room tone의 confirmation 버튼 |
