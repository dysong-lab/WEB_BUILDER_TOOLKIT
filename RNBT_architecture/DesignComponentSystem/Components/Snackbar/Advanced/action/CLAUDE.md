# Snackbar — Advanced / action

## 기능 정의

1. **단일 메시지 + 강조 액션 렌더링 (Standard 기준 분리 1)** — `snackbarMessage` 토픽으로 수신한 단일 객체 `{ message, action?: {actionid, actionLabel}, duration? }`를 본문 + 강조 색 액션 버튼으로 렌더. action이 있으면 `.snackbar__actions[data-has-action="true"]` + `.snackbar__action[data-emphasis="true"]`로 강조 표시. action이 없으면 영역 숨김.
2. **명시적 actionid 페이로드 (Standard 기준 분리 2)** — Standard는 `snackbarActions` 토픽이 배열을 받아 ListRender로 렌더(0~N개 일반화). 본 변형은 단일 메시지에 `action: { actionid, actionLabel }` 한 개를 결합해 actionid를 의미 있는 사용자 결정(Undo / Retry)으로 한정.
3. **action click 시 분기 dismiss + 결과 emit (Standard 기준 분리 3)** — action 버튼 클릭 시 `@snackbarActionClicked`(payload: `{ actionid, message }`) 발행 + 즉시 자동 dismiss + `@snackbarDismissed`(payload: `{ reason: 'action', actionid, message }`) 발행. Standard는 페이지가 별도 처리.
4. **자동 dismiss + reason 분기 (Standard 기준 분리 4)** — 표시 시점에 `setTimeout(_, duration ?? action ? 6000 : 4000)`으로 dismiss 타이머 시작(action이 있으면 6000ms 권장 — MD3 LENGTH_LONG에 근접). 만료 시 hide + `@snackbarDismissed`(reason: `'auto'`) 발행. close 버튼 클릭 시 `@snackbarDismissed`(reason: `'user'`) 발행. 세 reason은 페이지가 사용자 의도를 분기 처리할 수 있게 한다.
5. **외부 강제 표시/숨김 (Standard 기준 분리 5)** — `setSnackbarOpen` 토픽 수신 시 페이로드 `{ open: boolean }`에 따라 표시/숨김. `open=false`인 경우 현재 표시 중이면 `@snackbarDismissed`(reason: `'external'`) 발행 + 타이머 해제.
6. **표시 신호 발행 (Standard 기준 분리 6)** — 메시지가 visible 직후 `@snackbarShown`(payload: `{ message, hasAction: boolean }`) 발행. 페이지가 분석 로깅, A/B 테스트, 알림 trace에 활용 가능.

> **Standard와의 분리 정당성 (5축)**:
> - **새 자체 상태 5종** — `_currentMessage: string|null` / `_currentAction: {actionid, actionLabel}|null` / `_autoDismissTimer: number|null` / `_currentDuration: number|null` / `_isShowing: boolean`. Standard는 stateless (페이지가 dismiss 타이머를 직접 관리, 컴포넌트 자체 상태 0종).
> - **새 토픽 2종 + Standard 토픽 미사용** — `snackbarMessage`(단일 메시지+액션 결합 페이로드), `setSnackbarOpen`(외부 강제 표시/숨김). Standard의 `snackbarInfo`/`snackbarActions` 두 토픽은 본 변형에서 사용하지 않음(메시지+액션을 단일 객체로 통합).
> - **새 이벤트 2종 + Standard 호환 1종 (페이로드 확장)** — 새: `@snackbarShown`(표시 1회), `@snackbarDismissed`(reason 4종 분기). Standard 호환 + 확장: `@snackbarActionClicked`(payload에 `{actionid, message}` 명시 — Standard는 native click event 위임). Standard의 `@snackbarClose`는 본 변형에서 발행하지 않음 (`@snackbarDismissed`(reason='user')로 통합 — `queue` 변형과 동일 정책).
> - **자체 메서드 6종** — `_render` / `_show` / `_dismiss` / `_handleCloseClick` / `_handleActionClick` / `_clearAutoDismissTimer`. Standard는 자체 메서드 0종.
> - **dismiss 타이머 + reason 분기 흡수** — Standard는 페이지가 `setTimeout`으로 dismiss 타이머를 관리 + close/action 신호를 페이지가 별도 처리. 본 변형은 컴포넌트가 타이머/reason 분기를 자체 흡수 + 4가지 reason(`'action'`/`'auto'`/`'user'`/`'external'`)으로 페이지에 단일 dismiss 이벤트로 통합 발행.
>
> 위 5축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.
>
> **`queue` 변형(직전 6단계)과의 차별**: `queue`는 *다중 메시지 큐 + 순차 표시* 가 핵심 (`_queue: Array`, `enqueueSnackbar` 토픽, FIFO 자료구조, `@queueIdle`). `action`은 *단일 메시지 + action 버튼 강조 + reason 분기* 가 핵심 (`_currentAction: {actionid, actionLabel}`, `snackbarMessage` 토픽, action 클릭 시 `'action'` reason). 두 변형은 **자료구조(큐 vs 단일)**, **이벤트 표면(`@queueIdle` vs `@snackbarActionClicked`의 명시 payload)**, **dismiss reason 어휘(`queue-cleared` vs `'action'`/`'external'`)** 가 다르다. 동일 register.js로 표현 불가 → 별도 변형으로 분리.
>
> **참조 패턴**:
> - **Snackbar/Standard** — FieldRenderMixin(`supporting`) + ListRenderMixin(`action[]`) + close 버튼 + `data-open` 토글. 본 변형은 동일 토대 위에 단일 액션 결합 페이로드 + auto-dismiss + reason 분기를 추가.
> - **Snackbar/Advanced/queue** (직전 5단계) — FieldRender + ListRender + 자체 상태/메서드 + setTimeout 타이머 라이프사이클 + bound handler 참조 보관 + `data-open` 토글. 본 변형은 큐 자료구조 대신 단일 메시지 + action 강조 + reason 분기로 흡수. preview `<script src>` 5단계 verbatim 복사 기준.
>
> **MD3 / 도메인 근거**: MD3 Snackbar 명세의 *"Action button is the optional but emphasized interaction"* — 액션 버튼은 사용자가 의미 있는 결정을 내리는 명시적 진입점. 권장 duration은 `LENGTH_SHORT(4초)` / `LENGTH_LONG(10초)` — 액션이 있는 메시지는 사용자가 결정할 시간이 필요하므로 본 변형은 default 6000ms로 정책화. 도메인 예: ① **Undo** (메일 휴지통 이동 후 Undo / 사진 삭제 후 Undo), ② **Retry** (네트워크 실패 / 동기화 실패 후 재시도), ③ **View** (새 알림 도착 후 보기 / 주문 상태 변경 후 확인), ④ **Settings** (권한 누락 후 설정 이동).

---

## 구현 명세

### Mixin

**FieldRenderMixin + ListRenderMixin** + 자체 상태 5종 + 자체 메서드 6종.

> Mixin 조합은 Standard / queue와 동일(FieldRenderMixin + ListRenderMixin). Advanced 분리는 Mixin 추가가 아니라 **단일 메시지+액션 결합 토픽 + setTimeout 라이프사이클 + reason 분기 + 이벤트 페이로드 명시화**로 이루어진다. 신규 Mixin 생성 없음.

### cssSelectors

#### FieldRenderMixin (`this.fieldRender`) — 스낵바 본문

| KEY | VALUE | 용도 |
|-----|-------|------|
| snackbar   | `.snackbar`            | 스낵바 루트 — `data-open` / `data-has-action` 토글 대상 |
| supporting | `.snackbar__supporting` | 메시지 본문 텍스트 |

#### ListRenderMixin (`this.listRender`) — 액션 버튼 (단일 항목)

| KEY | VALUE | 용도 |
|-----|-------|------|
| container    | `.snackbar__actions`        | 항목 부모 (규약) — `data-has-action` 토글 대상 |
| template     | `#snackbar-action-template` | cloneNode 대상 (규약) |
| actionid     | `.snackbar__action`         | 항목 식별 + 이벤트 매핑 (= **actionButton selector**) |
| actionLabel  | `.snackbar__action-label`   | 액션 라벨 |

> `actionid` KEY = **actionButton selector**. action 버튼은 강조 색을 받는 단일 의미 있는 진입점이며, ListRender의 itemKey + customEvents 위임 대상으로 동시 사용된다. CSS는 `[data-has-action="true"] .snackbar__action`을 emphasis 색으로 처리.

#### 사용자 정의 (cssSelectors 외부 — 고정 계약)

| KEY | VALUE | 용도 |
|-----|-------|------|
| closeBtn | `.snackbar__close-btn` | 닫기 버튼 — 이벤트 매핑 전용 |

> `closeBtn`은 customEvents에서 직접 문자열로 바인딩하는 컴포넌트 소유 고정 계약(Standard / queue와 동일).

### itemKey

actionid (ListRenderMixin)

### datasetAttrs

| Mixin | KEY | VALUE |
|-------|-----|-------|
| ListRenderMixin | actionid | actionid |

### 인스턴스 상태

| 키 | 타입 | 기본 | 설명 |
|----|------|------|------|
| `_currentMessage` | `string\|null` | `null` | 현재 표시 중 메시지 (dismiss payload 발행용) |
| `_currentAction` | `{actionid, actionLabel}\|null` | `null` | 현재 표시 중 action — actionid는 dismiss(reason='action') payload 발행용 |
| `_autoDismissTimer` | `number\|null` | `null` | `setTimeout` id — beforeDestroy / setSnackbarOpen / close / action 시 clear |
| `_currentDuration` | `number\|null` | `null` | (옵션 — 디버깅/추적용) 현재 메시지의 duration |
| `_isShowing` | `boolean` | `false` | 표시 중 가드(중복 dismiss / 중복 timer 방지) |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `snackbarMessage` | `this._render` | `{ message, action?: {actionid, actionLabel}, duration? }` |
| `setSnackbarOpen` | `this._setOpen` | `{ open: boolean }` — `false`이면 즉시 dismiss(reason='external') |

### 이벤트 (customEvents — Wkit.bindEvents)

| 이벤트 | 선택자 (computed) | 발행 |
|--------|------------------|------|
| click | `actionid` (listRender.cssSelectors) | `@snackbarActionClicked` (위임 발행) — payload는 native click event |

> `closeBtn`은 native click 핸들러로 직접 부착(`_handleCloseClick`). `actionid` 셀렉터에는 bindEvents 위임 + native click 결합(queue 변형 답습): bindEvents가 `@snackbarActionClicked` 위임 발행, native 핸들러(`_handleActionClick`)는 사이드이펙트(자체 발행 `{actionid, message}` payload + dismiss(reason='action'))를 담당.

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@snackbarShown` | `_show` 진입 후 메시지 visible 직후 | `{ message, hasAction: boolean }` |
| `@snackbarDismissed` | dismiss 시점 (action / auto / user / external) | `{ message, reason: 'action' \| 'auto' \| 'user' \| 'external', actionid?: string }` |
| `@snackbarActionClicked` | action 버튼 클릭 시 — bindEvents 위임 + native 핸들러 결합 | bindEvents: `{ event }` (Wkit 위임 표준) / native: `{ actionid, message }` (명시 payload) |

> 이벤트 분리 사유: bindEvents 위임은 페이지가 native click event를 받아 표준 패턴으로 처리(action 버튼이 여러 개일 때 dataset 추출). native 핸들러는 컴포넌트가 명시 payload `{ actionid, message }`로 알려줘 페이지 코드를 단순화. 두 채널은 동일 click에 대해 1회씩 발행되며, 페이지는 둘 중 한쪽만 핸들러를 등록하면 충분(보통 명시 payload 쪽).

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_render({ response: data })` | `({response}) => void` | `snackbarMessage` 핸들러. 표시 중이면 기존 메시지 dismiss(reason='external') 후 새 메시지로 교체. `_show()` 호출. |
| `_setOpen({ response: data })` | `({response}) => void` | `setSnackbarOpen` 핸들러. `data.open === false`이면 표시 중인 경우 `_dismiss('external')` 호출. `true`인 경우 마지막 메시지 재표시 X(이미 표시 중이면 no-op). |
| `_show()` | `() => void` | 본문/액션 렌더 + rootEl `data-open=true` + `data-has-action` 토글 + `setTimeout(_dismiss('auto'), duration)` + `@snackbarShown` 발행. |
| `_dismiss(reason)` | `('action'\|'auto'\|'user'\|'external') => void` | 타이머 clear + rootEl `data-open=false` + `@snackbarDismissed` 발행 + 자체 상태 초기화. action reason의 경우 actionid를 payload에 포함. |
| `_handleCloseClick(e)` | `(MouseEvent) => void` | close 버튼 native click. `_dismiss('user')` 호출. |
| `_handleActionClick(e)` | `(MouseEvent) => void` | action 버튼 native click 사이드이펙트. `Weventbus.emit('@snackbarActionClicked', { actionid, message })` 명시 발행 + `_dismiss('action')` 호출. bindEvents 위임은 별도 `@snackbarActionClicked` 발행 (위임 표준 payload). |
| `_clearAutoDismissTimer()` | `() => void` | `clearTimeout(_autoDismissTimer)` + `_autoDismissTimer=null`. |

### 페이지 연결 사례

```
[페이지 — Undo / Retry / View / Settings]
    │
    ├─ publish('snackbarMessage', {
    │     message: '이메일이 휴지통으로 이동되었습니다.',
    │     action:  { actionid: 'undo', actionLabel: 'Undo' },
    │     duration: 6000
    │   })
    │
    ├─ '@snackbarShown'        수신 → 분석 로깅 (선택)
    ├─ '@snackbarDismissed'    수신 → reason 별 처리:
    │     'action'   → 사용자가 결정 — actionid에 따라 비즈니스 처리(Undo 복원 등)
    │     'auto'     → 시간 만료 — 사용자가 결정 안 함, 기본 의도 채택
    │     'user'     → 사용자가 close — 명시적 무시
    │     'external' → 페이지가 강제 hide (라우팅 변경 등)
    ├─ '@snackbarActionClicked' 수신 → { actionid, message } 명시 payload로 비즈니스 처리
    │
    └─ (선택) publish('setSnackbarOpen', { open: false }) — 페이지 전환 시 강제 hide

[Snackbar/Advanced/action]
    ├─ snackbarMessage 수신 → _render → (표시 중이면 dismiss('external')) → _show
    ├─ _show → fieldRender + listRender + data-open=true + data-has-action 토글
    │        + setTimeout(_dismiss('auto'), duration ?? (action ? 6000 : 4000))
    │        + @snackbarShown 발행
    ├─ 자동 timeout → _dismiss('auto') → @snackbarDismissed (reason='auto')
    ├─ close 클릭 → _handleCloseClick → _dismiss('user') → @snackbarDismissed (reason='user')
    ├─ action 클릭 → bindEvents @snackbarActionClicked 위임 발행 (event payload)
    │              + _handleActionClick → @snackbarActionClicked 명시 발행 ({actionid, message})
    │              + _dismiss('action') → @snackbarDismissed (reason='action', actionid)
    └─ setSnackbarOpen 수신 (open=false) → _dismiss('external') (표시 중이면)

운영: this.pageDataMappings = [
        { topic: 'snackbarMessage', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@snackbarShown':         ({ message, hasAction })           => { /* analytics */ },
        '@snackbarDismissed':     ({ message, reason, actionid })    => { /* reason 분기 */ },
        '@snackbarActionClicked': ({ actionid, message })            => {
            // actionid 기반 사용자 결정 처리 (Undo / Retry / View / Settings)
        }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별 + 도메인 컨텍스트 |
|------|---------|-----------------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 tonal — Pretendard 14px, action 버튼 라벤더 강조 색 + 좌측 4px accent bar(액션 강조). **도메인**: 메일 클라이언트 — *"이메일이 휴지통으로 이동되었습니다. [Undo]"*. |
| `02_material`    | B: Material Elevated | 인버스 서피스(다크), Roboto, box-shadow elevation 3, action 버튼은 inverse-primary tonal 강조. **도메인**: 동기화 콘솔 — *"동기화 실패. [Retry]"*. |
| `03_editorial`   | C: Minimal Editorial | 웜 베이지, Georgia 세리프, 직각 + 헤어라인. action 버튼은 italic + underline 강조. **도메인**: 출판/CMS — *"초안이 저장되었습니다. [View]"*. |
| `04_operational` | D: Dark Operational  | 다크 시안 컴팩트 + JetBrains Mono. action 버튼은 시안 outline + uppercase 라벨 강조. **도메인**: 운영 콘솔 — *"권한 누락. [Settings]"*. |

각 페르소나는 Standard / queue와 같은 4종 색/타이포 토큰을 답습하면서, **action 버튼 강조**(좌측 accent bar, 강조 색, italic/underline, outline 등 페르소나별 강조 어휘)로 *"이 메시지는 사용자가 결정해야 한다"*를 시각화한다. action이 없는 메시지는 `data-has-action="false"`로 액션 영역 hidden + 강조 어휘 미적용.

### 결정사항

- **dismiss 타이머는 컴포넌트 책임**: Standard는 페이지 위임, 본 변형은 흡수(queue 변형 답습). reason 분기 일관성 + 페이지 코드 단순화.
- **default duration**: action 있으면 6000ms, 없으면 4000ms. MD3 LENGTH_SHORT(4초)는 단순 정보, action 있는 메시지는 사용자 결정 시간 필요 → LENGTH_LONG(10초) 근접한 6초 정책 (페이지가 명시 시 그 값 사용).
- **action 클릭 = 'action' reason**: 사용자가 의미 있는 결정을 내림. 'user'(명시적 무시)와 구분.
- **`@snackbarActionClicked` 이중 채널**: bindEvents 위임(event payload) + native 핸들러(명시 payload). 페이지는 보통 명시 payload만 쓰지만, 기존 Standard 코드 마이그레이션 시 위임 패턴도 호환 — 하나의 인터페이스로 두 사용 패턴 흡수.
- **`@snackbarClose` 미발행**: queue 변형과 동일 정책. 페이지에는 `@snackbarDismissed`(reason='user') 한 번이면 충분(이벤트 표면 축소).
- **`setSnackbarOpen(open=false)`만 의미 있음**: `open=true`로 외부에서 강제 표시는 "어떤 메시지를?"이 정의되지 않으므로 미지원. 메시지 표시는 항상 `snackbarMessage` publish로만.
- **신규 Mixin 생성 금지**: FieldRender + ListRender + 자체 상태/메서드 조합으로 완결.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Snackbar/Advanced/action/preview/...html` → `../`를 5번 = Snackbar/Advanced/queue와 동일 verbatim 복사)
