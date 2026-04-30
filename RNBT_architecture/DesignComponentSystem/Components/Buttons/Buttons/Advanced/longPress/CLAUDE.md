# Buttons — Advanced / longPress

## 기능 정의

1. **라벨 표시** — `buttonInfo` 토픽으로 수신한 값을 버튼 라벨에 렌더한다.
2. **기본 클릭 유지** — 버튼 클릭 시 `@buttonClicked`를 발행한다.
3. **길게 누르기 감지** — 버튼을 500ms 이상 누르고 있으면 `@buttonLongPressed`를 1회 발행한다.
4. **누름 진행 피드백** — 누르는 동안 진행 bar와 안내 문구를 갱신해 long press 상태를 시각적으로 보여준다.

> 이 변형은 단순 클릭보다 "길게 눌러 실행"이라는 의도를 분리해 보여줘야 할 때 쓴다. 예를 들어 위험 액션의 보조 보호, 현장 제어 버튼, 실수 방지가 필요한 운영 버튼에 적합하다.

---

## 구현 명세

### Mixin

없음

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| shell | `.button-shell` | 루트 컨테이너 — press 상태 dataset 반영 |
| button | `.md-button` | 버튼 요소 — click / pointer 이벤트 대상 |
| label | `.md-button__label` | 버튼 라벨 텍스트 |
| progress | `.button-feedback__progress` | long press 진행률 표시 bar |
| hint | `.button-feedback__hint` | hold 안내/완료 문구 |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| buttonInfo | `renderButtonInfo` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `button` (cssSelectors) | `@buttonClicked` |
| long press complete | 커스텀 메서드 | `@buttonLongPressed` |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `renderButtonInfo(data)` | 라벨/aria-label 반영, semantic status 적용 |
| `setProgressState(progress, phase)` | 진행률 bar와 hint 문구를 갱신한다 |
| `startLongPress(event)` | pointerdown 시 500ms 타이머와 진행률 갱신을 시작한다 |
| `cancelLongPress(options)` | pointerup/leave/cancel 시 진행 중인 long press를 정리한다 |
| `completeLongPress(event)` | 500ms 경과 시 `@buttonLongPressed`를 발행하고 완료 상태를 반영한다 |

### 페이지 연결 사례

```
[페이지] ──buttonInfo──▶ [Buttons/Advanced/longPress]
                           └─ renderButtonInfo(...)

[Buttons/Advanced/longPress] ──click──────────────▶ [페이지]
[Buttons/Advanced/longPress] ──@buttonLongPressed─▶ [페이지]
```

### 사용 시점

- 클릭과 길게 누르기를 다른 액션으로 구분해야 할 때
- 즉시 실행보다 의도 확인이 더 중요한 버튼일 때
- 관제/운영 화면에서 실수 클릭을 줄이고 싶을 때

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined | A: Refined Technical | 다크 그라디언트 위 hold progress가 또렷한 refined 버튼 |
| 02_material | B: Material Elevated | 라이트 surface 위 명확한 진행 track을 둔 material 버튼 |
| 03_editorial | C: Minimal Editorial | 얇은 선과 절제된 copy로 hold 상태를 보여주는 editorial 버튼 |
| 04_operational | D: Dark Operational | compact density와 cyan progress를 쓴 운영형 버튼 |
