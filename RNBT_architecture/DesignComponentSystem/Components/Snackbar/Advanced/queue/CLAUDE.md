# Snackbar — Advanced / queue

## 기능 정의

1. **다중 메시지 큐 적재 (Standard 기준 분리 1)** — `enqueueSnackbar` 토픽으로 수신한 객체(`{ message, action?, duration?, level? }`)를 자체 큐(`_queue: Array<{message, action?, duration?}>`)에 push. 한 번에 여러 publish가 들어와도 순서를 보존(FIFO).
2. **순차 1개 표시 (Standard 기준 분리 2)** — 한 시점에 단 한 개의 메시지만 visible. 큐가 비어 있고 표시 중이 아니면 즉시 표시(`_isShowing=true`), 표시 중이면 큐에 적재만 한다.
3. **자동 dismiss 체이닝 (Standard 기준 분리 3)** — 메시지 표시 시 `setTimeout(_, duration ?? 4000)`으로 dismiss 타이머 시작. 만료 시 hide → 큐에서 다음 메시지 shift → 즉시 다음 표시. 큐가 비면 idle.
4. **수동 close (Standard 호환 — close 버튼)** — 사용자가 close 버튼 클릭 시 즉시 hide + 타이머 해제 + 다음 메시지 표시. `@snackbarDismissed`(reason: 'user') 발행.
5. **수동 action 클릭 (Standard 호환 — action 버튼)** — 사용자가 action 버튼 클릭 시 `@snackbarActionClicked`(payload: `{ message, actionid }`) 발행 + 자동으로 dismiss + 다음 메시지로 진행 (action 처리 = 메시지 소비 의도). reason: 'user'.
6. **외부 큐 비우기 (Standard 기준 분리 4)** — `clearQueue` 토픽 수신 시 `_queue=[]` + 현재 표시 중 메시지도 즉시 hide + 타이머 해제. 표시 중이었으면 `@snackbarDismissed`(reason: 'queue-cleared') 1회 발행.
7. **표시/숨김/idle 신호 (Standard 기준 분리 5)** — 표시 시점 `@snackbarShown`(payload: `{ message, queueLength }`) 발행. dismiss 시점 `@snackbarDismissed`(payload: `{ message, reason }`) 발행. 큐가 비고 마지막 메시지 dismiss 직후 `@queueIdle` 1회 발행. 페이지가 idle 시점에 다음 단계 진입(예: 폼 reset, 다른 토스트 publish)할 수 있게 한다.

> **Standard와의 분리 정당성 (5축)**:
> - **새 자체 상태 5종** — `_queue: Array<{message, action?, duration?}>` / `_isShowing: boolean` / `_autoDismissTimer: number|null` / `_currentMessage: string|null` (디스미스 시점에 payload 식별용) / `_currentDuration: number|null`. Standard는 stateless (페이지가 dismiss 타이머를 직접 관리).
> - **새 토픽 2종** — `enqueueSnackbar`(메시지 적재), `clearQueue`(큐 비우기). Standard의 `snackbarInfo`/`snackbarActions` 두 토픽은 본 변형에서 사용하지 않음(메시지가 큐로 들어와 컴포넌트가 적재 후 직접 fieldRender/listRender 호출).
> - **새 이벤트 3종 + Standard 호환 2종 유지** — 새: `@snackbarShown`(표시 1회), `@snackbarDismissed`(dismiss 1회 + reason), `@queueIdle`(큐 비고 마지막 dismiss 직후). Standard 호환: `@snackbarActionClicked`(action 버튼), `@snackbarClose`(close 버튼). 단, Standard의 `@snackbarClose`는 페이지가 dismiss 타이머를 해제하는 신호였지만, 본 변형은 컴포넌트가 자체 처리하므로 페이지에는 `@snackbarDismissed`(reason='user') 한 번으로 통합 (`@snackbarClose`는 발행하지 않음).
> - **자체 메서드 7종** — `_enqueue` / `_clearQueue` / `_showNext` / `_dismissCurrent` / `_handleCloseClick` / `_handleActionClick` / `_clearAutoDismissTimer`. Standard는 자체 메서드 0종.
> - **dismiss 타이머 흡수** — Standard는 페이지가 `setTimeout`으로 dismiss 타이머를 관리(MD3 권장 4s/10s 호출자 책임). 본 변형은 컴포넌트가 자체 흡수 + 큐 chaining까지 일관 처리. 페이지는 `enqueueSnackbar` publish만 하면 큐 흐름 전체가 자동 진행.
>
> 위 5축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.
>
> **참조 패턴**:
> - **Snackbar/Standard** (직전, 같은 컴포넌트) — FieldRenderMixin(`supporting`) + ListRenderMixin(`action[]`) + close 버튼 + `data-open` 토글 + `@snackbarClose`/`@snackbarActionClicked` 이벤트. 본 변형은 동일 토대 위에 큐 적재/순차 표시/자동 dismiss chain/idle 신호를 추가하고, 두 토픽(`snackbarInfo`/`snackbarActions`) 대신 `enqueueSnackbar` 단일 토픽으로 통합.
> - **Sliders/Range/Advanced/discreteWithMarks** (직전 6단계) — FieldRenderMixin + 자체 상태/자체 메서드/native 리스너 라이프사이클 + bound handler 참조 보관 + beforeDestroy 명시 정리 패턴 답습. 본 변형은 native 리스너 대신 setTimeout 타이머 라이프사이클 + 큐 자료구조를 동등 패턴으로 흡수.
> - **Search/Advanced/voiceInput** (5단계 직전) — preview `<script src>` 5단계 verbatim 복사 기준. 자체 상태(`_recognition`/`_isRecording` 등) + 외부 자원 라이프사이클 흡수(Web Speech API ↔ setTimeout) + 자체 발행 이벤트 5종 + `customEvents = {}` 또는 부분 사용 패턴 답습.
>
> **MD3 / 도메인 근거**: MD3 Snackbar 명세는 *"Only one snackbar displays at a time"* — 동시 1개 표시. 그러나 실서비스에서 다수 이벤트(예: 파일 업로드 5개 동시 완료, 폼 검증 다중 오류, 푸시 알림 burst)에서 페이지가 매번 setTimeout 체이닝을 직접 관리하는 것은 답습 코드가 큰 비용. 본 변형은 *"동시 1개 표시"* MD3 원칙을 보존하면서 페이지의 큐 관리 책임을 컴포넌트로 흡수. 도메인 예: ① 파일 업로드 다중 완료 알림(각 파일마다 enqueue → 4초씩 자동 표시), ② 폼 검증 다중 오류(각 필드 오류 enqueue → 사용자가 차례로 인지), ③ 채팅/소셜 알림 burst(짧은 시간에 여러 메시지 → 한 번에 한 개씩 노출), ④ 운영 콘솔 alert burst(L1/L2 동시 발생 → 우선순위와 무관하게 차례로 표시).

---

## 구현 명세

### Mixin

**FieldRenderMixin + ListRenderMixin** + 자체 상태 5종 + 자체 메서드 7종.

> Mixin 조합은 Standard와 동일(FieldRenderMixin + ListRenderMixin). Advanced 분리는 Mixin 추가가 아니라 **자체 큐 자료구조 + setTimeout 라이프사이클 + 토픽 통합 + 이벤트 3종 추가 + 페이지 책임 흡수**로 이루어진다. 신규 Mixin 생성 없음.

### cssSelectors

#### FieldRenderMixin (`this.fieldRender`) — 스낵바 본문

| KEY | VALUE | 용도 |
|-----|-------|------|
| snackbar   | `.snackbar`            | 스낵바 루트 — `data-open` 토글 대상 |
| supporting | `.snackbar__supporting` | 메시지 본문 텍스트 |

#### ListRenderMixin (`this.listRender`) — 액션 버튼

| KEY | VALUE | 용도 |
|-----|-------|------|
| container   | `.snackbar__actions`        | 항목 부모 (규약) |
| template    | `#snackbar-action-template` | cloneNode 대상 (규약) |
| actionid    | `.snackbar__action`         | 항목 식별 + 이벤트 매핑 |
| actionLabel | `.snackbar__action-label`   | 액션 라벨 |

#### 사용자 정의 (cssSelectors 외부 — 고정 계약)

| KEY | VALUE | 용도 |
|-----|-------|------|
| closeBtn | `.snackbar__close-btn` | 닫기 버튼 — 이벤트 매핑 전용 |

> `closeBtn`은 customEvents에서 직접 문자열로 바인딩하는 컴포넌트 소유 고정 계약(Standard와 동일).

### itemKey

actionid (ListRenderMixin)

### datasetAttrs

| Mixin | KEY | VALUE |
|-------|-----|-------|
| ListRenderMixin | actionid | actionid |

### 인스턴스 상태

| 키 | 타입 | 기본 | 설명 |
|----|------|------|------|
| `_queue` | `Array<{message, action?, duration?}>` | `[]` | 대기 중 메시지 큐 (FIFO) |
| `_isShowing` | `boolean` | `false` | 현재 메시지 표시 중 여부 |
| `_autoDismissTimer` | `number\|null` | `null` | `setTimeout` id — beforeDestroy/clearQueue/close 시 clear |
| `_currentMessage` | `string\|null` | `null` | dismiss payload 발행 시 식별용 |
| `_currentDuration` | `number\|null` | `null` | (옵션 — 디버깅/추적용) 현재 메시지의 duration |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `enqueueSnackbar` | `this._enqueue` | `{ message, action?, duration?, level? }` — `action`은 `{actionid, actionLabel}`. `duration` 미지정 시 4000ms 기본. |
| `clearQueue` | `this._clearQueue` | `{}` (또는 미지정) |

### 이벤트 (customEvents — Wkit.bindEvents)

| 이벤트 | 선택자 (computed) | 발행 |
|--------|------------------|------|
| click | `actionid` (listRender.cssSelectors) | `@snackbarActionClicked` (위임 발행) — payload는 native click event |

> `closeBtn`은 native click 핸들러로 직접 부착(`_handleCloseClick`). bindEvents의 `@xxx` 위임을 사용하지 않는 이유: close 클릭은 컴포넌트가 즉시 dismiss/타이머 해제/큐 진행을 수행해야 하므로, 이벤트 발행과 사이드이펙트를 한 핸들러에서 일관 처리. action 클릭도 동일 이유로 native 핸들러를 부가로 부착(bindEvents 위임 + 자체 사이드이펙트 결합 — voiceInput / Range/discreteWithMarks 패턴 답습).

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@snackbarShown` | `_showNext` 진입 후 메시지 visible 직후 | `{ message, queueLength }` (queueLength: 표시 직후 큐에 남은 개수) |
| `@snackbarDismissed` | dismiss 시점 (auto / user / queue-cleared) | `{ message, reason: 'auto' \| 'user' \| 'queue-cleared' }` |
| `@queueIdle` | 마지막 메시지 dismiss 직후 큐가 비었을 때 1회 | `{}` |
| `@snackbarActionClicked` | action 버튼 클릭 시(bindEvents 위임 + native 핸들러 사이드이펙트 결합) | `{ event }` (Wkit 위임 표준 payload) |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_enqueue({ response: data })` | `({response}) => void` | `enqueueSnackbar` 핸들러. payload `{message, action?, duration?, level?}`를 큐에 push. `_isShowing=false`이면 즉시 `_showNext()` 호출. |
| `_clearQueue({ response: data })` | `({response}) => void` | `clearQueue` 핸들러. `_queue=[]` + 현재 표시 중이면 `_dismissCurrent('queue-cleared')` 호출. |
| `_showNext()` | `() => void` | 큐에서 1개 shift → `fieldRender.renderData({response: {supporting: msg}})` + `listRender.renderData({response: action ? [action] : []})` + rootEl `data-open=true` + `setTimeout(_dismissCurrent('auto'), duration)` + `@snackbarShown` 발행. 큐가 비어있으면 no-op. |
| `_dismissCurrent(reason)` | `('auto'\|'user'\|'queue-cleared') => void` | 타이머 clear + rootEl `data-open=false` + `@snackbarDismissed` 발행. `_isShowing=false` + `_currentMessage=null`. 다음 단계: queue 비어있으면 `@queueIdle` 발행, 비어있지 않으면 `_showNext()` 재진입. queue-cleared의 경우 다음 진행 X. |
| `_handleCloseClick(e)` | `(MouseEvent) => void` | close 버튼 native click. `_dismissCurrent('user')` 호출. |
| `_handleActionClick(e)` | `(MouseEvent) => void` | action 버튼 native click 사이드이펙트(bindEvents `@snackbarActionClicked` 위임은 별도 발행). `_dismissCurrent('user')` 호출(action 처리 완료 = 메시지 소비). |
| `_clearAutoDismissTimer()` | `() => void` | `clearTimeout(_autoDismissTimer)` + `_autoDismissTimer=null`. |

### 페이지 연결 사례

```
[페이지 — 파일 업로드 5개 동시 완료 / 폼 검증 다중 오류 / 채팅 알림 burst / 운영 alert burst]
    │
    ├─ publish('enqueueSnackbar', { message: '파일 1 업로드 완료', duration: 3000 })
    ├─ publish('enqueueSnackbar', { message: '파일 2 업로드 완료', duration: 3000 })
    ├─ publish('enqueueSnackbar', { message: '파일 3 업로드 실패', action: {actionid:'retry', actionLabel:'Retry'}, duration: 6000 })
    │
    ├─ '@snackbarShown'        수신 → 분석 로깅 (선택)
    ├─ '@snackbarDismissed'    수신 → reason 별 처리 (선택)
    ├─ '@queueIdle'            수신 → 다음 화면 진입 / 폼 reset / 다른 알림 publish
    ├─ '@snackbarActionClicked' 수신 → actionid 기반 사용자 의도 처리 (예: retry)
    │
    └─ (선택) publish('clearQueue', {}) — 다른 화면 전환 시 모든 대기 메시지 폐기

[Snackbar/Advanced/queue]
    ├─ enqueueSnackbar 수신 → _queue.push → _isShowing=false면 _showNext
    ├─ _showNext → 1개 shift → render + data-open=true + setTimeout(_dismissCurrent('auto'))
    │                       + @snackbarShown 발행
    ├─ 자동 timeout → _dismissCurrent('auto') → @snackbarDismissed → 다음 _showNext
    ├─ close 클릭 → _handleCloseClick → _dismissCurrent('user') → 다음 _showNext
    ├─ action 클릭 → bindEvents @snackbarActionClicked 발행
    │              + _handleActionClick → _dismissCurrent('user') → 다음 _showNext
    ├─ clearQueue 수신 → _queue=[] + _dismissCurrent('queue-cleared') (표시 중이면)
    └─ 큐 비고 마지막 dismiss → @queueIdle 1회 발행

운영: this.pageDataMappings = [
        { topic: 'enqueueSnackbar', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@snackbarShown':         ({ message, queueLength }) => { /* analytics */ },
        '@snackbarDismissed':     ({ message, reason })      => { /* analytics */ },
        '@queueIdle':             ()                          => { /* next step */ },
        '@snackbarActionClicked': ({ event })                 => {
            const item = event.target.closest('.snackbar__action');
            const actionid = item?.dataset.actionid;
            // actionid 기반 사용자 의도 처리
        }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별 + 도메인 컨텍스트 |
|------|---------|-----------------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 tonal — Pretendard 14px, 큐 카운터 뱃지(있을 때) 라벤더, 그라디언트 알약형. **도메인**: 모바일 알림센터 — 푸시 알림 burst 시 차례로 노출. |
| `02_material`    | B: Material Elevated | 인버스 서피스(다크), Roboto, box-shadow elevation 3, 큐 카운터는 액션 옆 미니 chip(라이트 톤). **도메인**: 파일 업로드 다중 완료 — 각 파일 결과를 4초씩 차례로. |
| `03_editorial`   | C: Minimal Editorial | 웜 베이지, Georgia 세리프, 직각 + 헤어라인. 큐 카운터는 텍스트 inline `(2 more)` 형태. **도메인**: 폼 검증 다중 오류 — 각 필드 오류를 사용자가 차례로 인지. |
| `04_operational` | D: Dark Operational  | 다크 시안 컴팩트 + JetBrains Mono. 큐 카운터는 `[3+]` ASCII 뱃지. **도메인**: 운영 콘솔 alert burst — L1/L2 alert 동시 발생 시 차례로 표시. |

각 페르소나는 Standard와 같은 4종 색/타이포 토큰을 답습하면서, 큐 카운터 영역(`.snackbar__queue-count`)을 supporting 텍스트 옆에 추가해 "현재 외에 N개 더 대기 중"임을 시각화한다(컴포넌트가 `_showNext` 시점에 `data-pending="N"` 속성으로 갱신, 0일 때 hidden).

### 결정사항

- **dismiss 타이머는 컴포넌트 책임**: Standard는 페이지에 위임, 본 변형은 흡수. 큐 chain 일관성 + 페이지 코드 단순화. clearQueue/close/action에서 모두 동일한 단일 진입점(`_dismissCurrent`)으로 통일.
- **default duration 4000ms**: MD3 LENGTH_SHORT 기본. duration이 명시되면 그 값 사용(MD3 LENGTH_LONG = 10000ms 등 페이지가 결정). action이 있는 메시지의 권장은 페이지가 8000~10000ms로 명시.
- **action 클릭은 자동 dismiss**: action 처리 = 메시지 소비 의도(retry/undo 등). reason: 'user'.
- **`@snackbarClose` 미발행**: Standard에서는 페이지가 타이머를 관리해야 했기 때문에 close 시점 신호가 필요했음. 본 변형은 컴포넌트가 흡수하므로 페이지에는 `@snackbarDismissed`(reason='user') 한 번이면 충분(이벤트 표면 축소).
- **큐 자료구조는 단순 배열 FIFO**: 우선순위 큐 / dedup / level 필터링은 본 변형 외 — 페이지가 enqueue 전에 처리. (향후 priorityQueue 변형 후보.)
- **queue-cleared 시 `@queueIdle` 미발행**: queue-cleared는 사용자/페이지 의도적 중단으로, idle은 *자연 종료* 의미. 페이지가 두 케이스를 구분 가능.
- **bindEvents + native 핸들러 결합**: action click은 `@snackbarActionClicked` 위임 + 자체 dismiss 사이드이펙트를 한 흐름으로 — Search/voiceInput / Range/discreteWithMarks 답습.
- **신규 Mixin 생성 금지**: FieldRender + ListRender + 자체 상태/메서드 조합으로 완결. `setTimeout` chain + 큐 자료구조 패턴이 본 변형 외에 일반화 후보가 아직 없음 — `audit-project` 시점에 다른 *순차 표시* 변형(Toast/Banner queue 등)이 추가되면 `QueueLifecycleMixin` 일반화 후보 검토.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Snackbar/Advanced/queue/preview/...html` → `../`를 5번 = Search/Advanced/voiceInput과 동일)
