# Snackbar — Standard

## 기능 정의

1. **메시지 렌더링** — `snackbarInfo` 토픽으로 수신한 단일 객체(`supporting`)를 스낵바 본문 영역에 렌더
2. **액션 버튼 렌더링** — `snackbarActions` 토픽으로 수신한 배열 데이터(0~1개 권장)를 template 반복으로 액션 영역에 렌더. 비어 있으면 영역 숨김
3. **액션 버튼 클릭 이벤트** — 액션 버튼 클릭 시 `@snackbarActionClicked` 발행
4. **닫기 버튼 클릭 이벤트** — close 아이콘 클릭 시 `@snackbarClose` 발행
5. **표시/숨김 상태 제어** — 페이지가 루트 요소의 `data-open` 속성을 토글하여 노출 여부 제어 (자동 dismiss 타이머는 페이지 책임)

---

## 구현 명세

### Mixin

FieldRenderMixin + ListRenderMixin

- FieldRenderMixin — 본문 메시지 (단일 객체: `supporting`)
- ListRenderMixin — 액션 버튼 배열 반복 (0개 또는 1개. MD3 권장: action 1개 이하)

> Snackbar는 **단일 메시지**를 표시한다 (MD3는 동시 1개 권장). 기본 배치는 fixed bottom으로 inline 구현 — ShadowPopupMixin을 사용하지 않는다. scrim/포커스 트랩이 없으며, 본문 상호작용을 막지 않는 "비침습적" 알림이기 때문이다.

### cssSelectors

#### FieldRenderMixin (`this.fieldRender`) — 스낵바 본문

| KEY | VALUE | 용도 |
|-----|-------|------|
| snackbar   | `.snackbar`            | 스낵바 루트 (이벤트 매핑 전용, data-open 토글 대상) |
| supporting | `.snackbar__supporting` | 메시지 본문 텍스트 |

#### ListRenderMixin (`this.listRender`) — 액션 버튼

| KEY | VALUE | 용도 |
|-----|-------|------|
| container   | `.snackbar__actions`           | 항목이 추가될 부모 (규약) |
| template    | `#snackbar-action-template`    | cloneNode 대상 (규약) |
| actionid    | `.snackbar__action`            | 항목 식별 + 이벤트 매핑 |
| actionLabel | `.snackbar__action-label`      | 액션 라벨 |

#### 사용자 정의 (cssSelectors 외부)

| KEY | VALUE | 용도 |
|-----|-------|------|
| closeBtn | `.snackbar__close-btn` | 닫기 아이콘 버튼 — 이벤트 매핑 전용 (고정 계약) |

> `closeBtn` 선택자는 customEvents에서 직접 문자열로 바인딩한다. Mixin 대상이 아니므로 컴포넌트 소유 고정 계약이다.

### itemKey

actionid (ListRenderMixin)

### datasetAttrs

| Mixin | KEY | VALUE |
|-------|-----|-------|
| ListRenderMixin | actionid | actionid |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| snackbarInfo    | `this.fieldRender.renderData` |
| snackbarActions | `this.listRender.renderData` |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `actionid` (listRender.cssSelectors) | `@snackbarActionClicked` |
| click | `.snackbar__close-btn` | `@snackbarClose` |

### 커스텀 메서드

없음 (자동 dismiss 타이머와 `data-open` 토글은 페이지 책임)

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('snackbarInfo', this)──> [Snackbar] 본문 렌더링
         publish data: { supporting: '연결이 복원되었습니다.' }

[페이지] ──fetchAndPublish('snackbarActions', this)──> [Snackbar] 액션 렌더링
         publish data: [{ actionid: 'retry', actionLabel: 'Retry' }]
         (빈 배열: publish data: [])

[페이지] ──rootEl.dataset.open = 'true'──> 스낵바 표시
         setTimeout(4000)으로 자동 dismiss 타이머 설정

[Snackbar] ──@snackbarActionClicked──> [페이지] ──> actionid 기반 처리 + data-open='false'
[Snackbar] ──@snackbarClose──> [페이지] ──> data-open='false' + 타이머 해제
```

> **자동 dismiss**는 MD3 권장(단문 4초, 장문 또는 액션 포함 시 최대 10초)을 따르되 페이지 레벨에서 `setTimeout` 체이닝으로 구현한다 (CODING_STYLE.md "주기적 실행" 패턴 참조).

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| 01_refined     | A: Refined Technical | 다크 퍼플 tonal, Pretendard, 그라디언트 알약형 스낵바 (border-radius 8px) |
| 02_material    | B: Material Elevated | 인버스 서피스(다크), Roboto, box-shadow elevation 3 |
| 03_editorial   | C: Minimal Editorial | 웜 베이지 배경, Georgia 세리프, 샤프 직각(border-radius 2px) + 헤어라인 테두리 |
| 04_operational | D: Dark Operational  | 다크 시안 컴팩트 바, JetBrains Mono, 얇은 테두리 + 고밀도 |

### MD3 근거

- Snackbars show short updates about app processes at the bottom of the screen. Anatomy: **container · supporting text · action (optional) · close icon (optional)**.
- Duration: `LENGTH_SHORT` / `LENGTH_LONG` / `LENGTH_INDEFINITE` — 자동 타이머는 호출자(페이지) 책임.
- "Only one snackbar displays at a time" — 동시에 하나만 표시, 기본은 fixed bottom inline.
- 출처: Material Design(M2/M3 Snackbar), material-components-android `Snackbar.md` (WebSearch + WebFetch 확인, 2026-04-19). 공식 m3.material.io 페이지는 SPA로 본문 추출 실패하여 MDC-Android 공식 문서와 M2 가이드라인을 교차 참조로 사용.
