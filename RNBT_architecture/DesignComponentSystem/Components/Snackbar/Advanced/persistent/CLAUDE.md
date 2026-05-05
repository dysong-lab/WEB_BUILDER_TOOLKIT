# Snackbar — Advanced / persistent

## 기능 정의

1. **persistent flag 흡수 (Standard 기준 분리 1)** — `snackbarMessage` 토픽으로 수신한 단일 객체 `{ message, persistent?: boolean, duration?: number, level?: 'info'|'warning'|'error', action?: {actionid, actionLabel} }`를 본문 + 좌측 accent bar + level 색상으로 렌더. `persistent === true` 또는 `duration === -1`이면 dismiss 타이머를 시작하지 않음(영구 표시). 사용자 close 또는 외부 `dismissSnackbar`만 닫힘.
2. **clearTimer 조건 분기 (Standard 기준 분리 2)** — non-persistent 메시지는 표시 시점 `setTimeout(_dismiss('auto'), duration ?? 4000)` 시작. persistent 메시지는 timer를 시작하지 않음(`_autoDismissTimer === null` 보장). 표시 중 새 메시지가 도착해 교체될 때, 또는 외부 `dismissSnackbar` / close 클릭 시 `_clearAutoDismissTimer`로 안전 정리(persistent여서 timer가 null이어도 멱등).
3. **close 버튼 강조 (Standard 기준 분리 3)** — `[data-persistent="true"]`이면 close 버튼이 시각적으로 강조됨(테두리/배경/펄스 등 페르소나별 어휘). Standard와 action 변형은 close 버튼이 보조 어포던스이지만, persistent는 close가 *유일한 사용자 dismiss 진입점*이므로 강조한다.
4. **레벨 색상 (Standard 기준 분리 4)** — `level` 값에 따라 좌측 accent bar 색이 결정됨(`info` 기본, `warning` 황색계, `error` 적색계). 페르소나별 색은 다르지만 의미 매핑은 동일. action / queue 변형에는 level 개념이 없음.
5. **외부 강제 dismiss (Standard 기준 분리 5)** — `dismissSnackbar` 토픽 수신 시 표시 중이면 즉시 hide + `@snackbarDismissed`(reason: `'external'`) 발행. persistent는 자동 dismiss가 없으므로 외부 강제 dismiss가 핵심 라이프사이클 통제 수단.
6. **표시/숨김 신호 발행 (Standard 기준 분리 6)** — 메시지 표시 직후 `@snackbarShown`(payload: `{ message, persistent }`) 발행. dismiss 시점 `@snackbarDismissed`(payload: `{ message, reason: 'user'|'external'|'auto' }`) 발행. persistent 메시지는 reason이 `'user'` 또는 `'external'`만 발생(auto는 non-persistent에서만).

> **Standard와의 분리 정당성 (5축)**:
> - **새 자체 상태 6종** — `_currentMessage: string|null` / `_currentAction: {actionid, actionLabel}|null` / `_isPersistent: boolean` / `_currentLevel: 'info'|'warning'|'error'` / `_autoDismissTimer: number|null` / `_isShowing: boolean`. Standard는 stateless (페이지가 dismiss 타이머를 직접 관리, 컴포넌트 자체 상태 0종).
> - **새 토픽 2종 + Standard 토픽 미사용** — `snackbarMessage`(persistent flag + level + action 결합 페이로드), `dismissSnackbar`(외부 강제 hide). Standard의 `snackbarInfo`/`snackbarActions` 두 토픽은 본 변형에서 사용하지 않음(메시지를 단일 객체로 통합).
> - **새 이벤트 2종 + Standard `@snackbarClose` 미발행** — 새: `@snackbarShown`(표시 1회 + persistent flag), `@snackbarDismissed`(reason 3종 분기: `'user'`/`'external'`/`'auto'`). Standard의 `@snackbarClose`는 `@snackbarDismissed`(reason='user')로 통합(action / queue 변형과 동일 정책).
> - **자체 메서드 6종** — `_render` / `_dismissExternal` / `_show` / `_dismiss` / `_handleCloseClick` / `_clearAutoDismissTimer`. Standard는 자체 메서드 0종.
> - **persistent 분기 + clearTimer 조건 흡수** — Standard는 페이지가 `setTimeout`으로 dismiss 타이머를 관리하며 persistent 시나리오를 직접 분기. 본 변형은 컴포넌트가 `_isPersistent` 플래그로 timer 시작 자체를 분기 + clearTimer 조건을 흡수(persistent → no timer, non-persistent → timer 시작/clear). 페이지는 단일 publish + 외부 dismiss만 알면 충분.
>
> 위 5축은 동일 register.js로 표현 불가 → Standard 내부 variant로 흡수 불가.
>
> **`action` 변형(직전 5단계)과의 차별**: `action`은 *단일 메시지 + action 버튼 강조 + reason 분기(action 포함)* 가 핵심 (`_currentAction` 강조, `@snackbarActionClicked` 명시 payload, action 클릭 시 `'action'` reason). `persistent`는 *영구 표시 + close 강조 + level 색상 + auto-dismiss 조건 분기* 가 핵심 (`_isPersistent` 플래그, `dismissSnackbar` 외부 토픽, `_currentLevel` 색 매핑, persistent → timer 미시작). 두 변형은 **자료구조(currentAction vs isPersistent+level)**, **이벤트 표면(`@snackbarActionClicked` 이중 채널 vs 없음)**, **dismiss reason 어휘(`'action'` 포함 vs `'user'`/`'external'`/`'auto'`만)**, **timer 정책(항상 시작 vs persistent면 미시작)** 가 다르다. 동일 register.js로 표현 불가 → 별도 변형으로 분리.
>
> **참조 패턴**:
> - **Snackbar/Standard** — FieldRenderMixin(`supporting`) + ListRenderMixin(`action[]`) + close 버튼 + `data-open` 토글. 본 변형은 동일 토대 위에 persistent flag + level 색상 + clearTimer 조건 분기를 추가.
> - **Snackbar/Advanced/action** (직전 5단계) — FieldRender + ListRender + 자체 상태/메서드 + setTimeout 타이머 라이프사이클 + bound handler 참조 보관 + `data-open`/`data-has-action` 토글 + reason 분기 + native + bindEvents 결합. preview `<script src>` 5단계 verbatim 복사 기준. 본 변형은 동일 라이프사이클 골격을 답습하고, `_currentAction`(action 강조)을 `_isPersistent` + `_currentLevel`(persistent 분기 + level 색상)로 치환, `@snackbarActionClicked` 이중 채널 발행을 제거(persistent는 close가 유일한 사용자 진입점이므로 action 강조 채널 불필요), `setSnackbarOpen(open=false)` 토픽을 `dismissSnackbar` 토픽으로 의미를 좁힘(open=true 외부 강제 표시는 사용자 케이스 없음 → action 변형과 동일 정책).
>
> **MD3 / 도메인 근거**: MD3 Snackbar 명세의 *"LENGTH_INDEFINITE: Show the Snackbar until it's either dismissed or another Snackbar is shown."* — 영구 표시는 명세화된 라이프사이클이며, 사용자가 명시적으로 닫을 때까지 표시. 도메인 예: ① **오프라인 상태** ("네트워크 연결이 끊겼습니다 — 자동 재시도 중"), ② **동기화 실패** ("동기화 실패 — 데이터가 저장되지 않을 수 있습니다"), ③ **시스템 점검 공지** ("일시적인 점검 중 — 서비스 이용에 제한이 있을 수 있습니다"), ④ **권한 누락** ("위치 권한이 필요합니다"). 모두 사용자가 *반드시 인지하고 결정해야* 하므로 자동 dismiss로 사라지면 안 되는 케이스. action / queue 변형은 *짧은 정보성 알림*에 적합하지만, persistent는 *지속적 상태 알림*에 적합 — 두 분리 축이 다름.

---

## 구현 명세

### Mixin

**FieldRenderMixin + ListRenderMixin** + 자체 상태 6종 + 자체 메서드 6종.

> Mixin 조합은 Standard / action / queue와 동일(FieldRenderMixin + ListRenderMixin). Advanced 분리는 Mixin 추가가 아니라 **persistent flag + level 색상 + clearTimer 조건 분기 + 외부 dismiss 토픽**으로 이루어진다. 신규 Mixin 생성 없음.

### cssSelectors

#### FieldRenderMixin (`this.fieldRender`) — 스낵바 본문

| KEY | VALUE | 용도 |
|-----|-------|------|
| snackbar   | `.snackbar`            | 스낵바 루트 — `data-open` / `data-persistent` / `data-level` 토글 대상 |
| supporting | `.snackbar__supporting` | 메시지 본문 텍스트 |

#### ListRenderMixin (`this.listRender`) — 액션 버튼 (선택, 단일 항목)

| KEY | VALUE | 용도 |
|-----|-------|------|
| container    | `.snackbar__actions`        | 항목 부모 (규약) — action 결합 페이로드일 때만 항목 1개 |
| template     | `#snackbar-action-template` | cloneNode 대상 (규약) |
| actionid     | `.snackbar__action`         | 항목 식별 (action 클릭 → `@snackbarActionClicked` 위임 발행) |
| actionLabel  | `.snackbar__action-label`   | 액션 라벨 |

> persistent 변형은 close 버튼이 *주* 어포던스이지만, 보조적으로 action 버튼도 허용한다(예: "오프라인 — [재시도]"). action이 없으면 영역 hidden.

#### 사용자 정의 (cssSelectors 외부 — 고정 계약)

| KEY | VALUE | 용도 |
|-----|-------|------|
| closeBtn | `.snackbar__close-btn` | 닫기 버튼 — persistent에서 *유일한 사용자 dismiss 진입점*. CSS는 `[data-persistent="true"] .snackbar__close-btn`을 강조 색/테두리로 처리. |

> `closeBtn`은 customEvents에서 직접 문자열로 바인딩하는 컴포넌트 소유 고정 계약(Standard / queue / action과 동일).

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
| `_currentAction` | `{actionid, actionLabel}\|null` | `null` | 현재 표시 중 action(선택) — action이 있으면 ListRender 렌더 |
| `_isPersistent` | `boolean` | `false` | persistent flag — true면 timer 미시작 |
| `_currentLevel` | `'info'\|'warning'\|'error'` | `'info'` | level 색상 매핑 키 (data-level 속성으로 CSS 분기) |
| `_autoDismissTimer` | `number\|null` | `null` | `setTimeout` id — non-persistent에서만 채워짐 |
| `_isShowing` | `boolean` | `false` | 표시 중 가드(중복 dismiss / 중복 timer 방지) |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `snackbarMessage` | `this._render` | `{ message, persistent?: boolean, duration?: number, level?: 'info'\|'warning'\|'error', action?: {actionid, actionLabel} }` |
| `dismissSnackbar` | `this._dismissExternal` | `{}` 또는 임의 객체 — 표시 중이면 즉시 dismiss(reason='external') |

### 이벤트 (customEvents — Wkit.bindEvents)

| 이벤트 | 선택자 (computed) | 발행 |
|--------|------------------|------|
| click | `actionid` (listRender.cssSelectors) | `@snackbarActionClicked` (위임 발행) — payload는 native click event, 페이지가 처리 |

> `closeBtn`은 native click 핸들러로 직접 부착(`_handleCloseClick` → `_dismiss('user')`). action 버튼은 bindEvents 위임만 사용(action 변형과 달리 native 핸들러 + 명시 payload 결합 미사용 — persistent에서 action은 보조적).

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@snackbarShown` | `_show` 진입 후 메시지 visible 직후 | `{ message, persistent: boolean }` |
| `@snackbarDismissed` | dismiss 시점 (user / external / auto) | `{ message, reason: 'user' \| 'external' \| 'auto' }` |

> `@snackbarActionClicked`는 bindEvents 위임 발행만(payload는 native event). 페이지가 action을 사용하면 위임으로 처리.

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_render({ response: data })` | `({response}) => void` | `snackbarMessage` 핸들러. 표시 중이면 기존 메시지 dismiss(reason='external') 후 새 메시지로 교체. persistent 분기 흡수: `data.persistent === true \|\| data.duration === -1`이면 `_isPersistent=true`. `_show()` 호출. |
| `_dismissExternal()` | `() => void` | `dismissSnackbar` 핸들러. 표시 중이면 `_dismiss('external')` 호출(persistent / non-persistent 모두). |
| `_show()` | `() => void` | 본문/액션 렌더 + rootEl `data-open=true` + `data-persistent` / `data-level` 토글 + (non-persistent면) `setTimeout(_dismiss('auto'), duration)` + `@snackbarShown` 발행. persistent면 timer 시작 안 함. |
| `_dismiss(reason)` | `('user'\|'external'\|'auto') => void` | 타이머 clear(persistent여서 null이어도 멱등) + rootEl `data-open=false` + `@snackbarDismissed` 발행 + 자체 상태 초기화. |
| `_handleCloseClick(e)` | `(MouseEvent) => void` | close 버튼 native click. `_dismiss('user')` 호출. |
| `_clearAutoDismissTimer()` | `() => void` | `clearTimeout(_autoDismissTimer)` + `_autoDismissTimer=null` (멱등). |

### 페이지 연결 사례

```
[페이지 — 오프라인 / 동기화 실패 / 점검 / 권한 누락]
    │
    ├─ publish('snackbarMessage', {
    │     message:    '네트워크 연결이 끊겼습니다 — 자동 재시도 중',
    │     persistent: true,
    │     level:      'warning'
    │   })
    │
    ├─ '@snackbarShown'        수신 → 분석 로깅 (선택)
    ├─ '@snackbarDismissed'    수신 → reason 별 처리:
    │     'user'     → 사용자가 close — 명시적 무시(중요 메시지를 사용자가 인지함)
    │     'external' → 페이지가 강제 hide (네트워크 복구 등 상태 변화 시 자동 dismiss)
    │     'auto'     → 시간 만료 (non-persistent 메시지에서만 발생)
    │
    └─ (네트워크 복구 시) publish('dismissSnackbar', {}) — 외부 강제 hide

[Snackbar/Advanced/persistent]
    ├─ snackbarMessage 수신 → _render → (표시 중이면 dismiss('external')) → _show
    ├─ _show → fieldRender + listRender(action 있으면) + data-open=true
    │        + data-persistent / data-level 토글
    │        + (non-persistent면) setTimeout(_dismiss('auto'), duration ?? 4000)
    │        + @snackbarShown(persistent flag 포함) 발행
    ├─ 자동 timeout → _dismiss('auto') (non-persistent에서만)
    ├─ close 클릭 → _handleCloseClick → _dismiss('user')
    └─ dismissSnackbar 수신 → _dismissExternal → _dismiss('external')

운영: this.pageDataMappings = [
        { topic: 'snackbarMessage', datasetInfo: {...}, refreshInterval: 0 }
      ];
      Wkit.onEventBusHandlers({
        '@snackbarShown':         ({ message, persistent })          => { /* analytics */ },
        '@snackbarDismissed':     ({ message, reason })              => { /* reason 분기 */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별 + 도메인 컨텍스트 |
|------|---------|-----------------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 tonal — Pretendard 14px. `[data-persistent="true"]`이면 좌측 4px accent bar(level별 색: info=라벤더, warning=앰버, error=코랄) + close 버튼 강조 (라벤더 테두리 + pulse glow). **도메인**: 클라우드 동기 — *"네트워크 연결이 끊겼습니다 — 자동 재시도 중"* (warning, persistent). |
| `02_material`    | B: Material Elevated | 인버스 서피스(다크), Roboto, box-shadow elevation 3. persistent면 inverse-primary tonal accent bar(level별: info=primary, warning=tertiary, error=error 색) + close 버튼 outlined elevation. **도메인**: 동기화 콘솔 — *"동기화 실패 — 데이터가 저장되지 않을 수 있습니다"* (error, persistent). |
| `03_editorial`   | C: Minimal Editorial | 웜 베이지, Georgia 세리프, 직각 + 헤어라인. persistent면 좌측 2px solid bar(level별: info=차콜, warning=올리브, error=다크 레드) + close 버튼 헤어라인 사각 박스. **도메인**: 출판/CMS — *"일시적인 점검 중 — 서비스 이용에 제한이 있을 수 있습니다"* (info, persistent). |
| `04_operational` | D: Dark Operational  | 다크 시안 컴팩트 + JetBrains Mono. persistent면 좌측 3px inset accent(level별: info=시안, warning=앰버, error=레드) + close 버튼 시안 outline + uppercase 라벨 미사용. **도메인**: 운영 콘솔 — *"위치 권한이 필요합니다"* (warning, persistent). |

각 페르소나는 Standard / action / queue와 같은 4종 색/타이포 토큰을 답습하면서, **`[data-persistent="true"]` 분기** + **level별 accent 색**으로 *"이 메시지는 시간이 지나도 사라지지 않으며, 사용자가 인지/결정해야 한다"*를 시각화한다. close 버튼은 persistent일 때만 강조 어휘(테두리, glow, outline 등 페르소나별)가 적용되어 *유일한 사용자 dismiss 진입점*임을 알린다.

### 결정사항

- **dismiss 타이머는 컴포넌트 책임**: Standard는 페이지 위임, 본 변형은 흡수(action / queue 변형 답습). persistent 분기를 일관 처리.
- **persistent 진입 조건**: `data.persistent === true` 또는 `data.duration === -1` (LENGTH_INDEFINITE 호환). 두 시그널 모두 OR 조건으로 인식하여 페이지가 사용하기 쉽게.
- **default duration (non-persistent)**: 4000ms (MD3 LENGTH_SHORT). action 결합 시점을 별도 분기하지 않음(action 변형이 그 책임).
- **`@snackbarClose` 미발행**: action / queue 변형과 동일 정책. 페이지에는 `@snackbarDismissed`(reason='user') 한 번이면 충분(이벤트 표면 축소).
- **`dismissSnackbar` 토픽 명명**: 의미가 명확함(action 변형의 `setSnackbarOpen({open:false})`보다 더 직접적). open=true 외부 강제 표시는 미지원(action 변형과 동일 정책 — 메시지 표시는 항상 `snackbarMessage` publish로만).
- **`@snackbarActionClicked` 이중 채널 미사용**: action 변형은 native + bindEvents 결합으로 명시 payload 채널을 추가했으나, persistent 변형은 close가 주 어포던스이므로 action 위임 발행 1채널만 유지(페이지가 action을 쓰면 native event payload로 처리).
- **`level` 분기**: data-level 속성 + CSS만으로 색 매핑(컴포넌트 로직은 분기 없음). 비표준 레벨이 들어와도 CSS 디폴트(info)로 안전 폴백.
- **신규 Mixin 생성 금지**: FieldRender + ListRender + 자체 상태/메서드 조합으로 완결.

---

## Hook 검증 체크리스트

- P0-2 / P0-4: cssSelectors KEY 일관성 (CLAUDE.md ↔ HTML ↔ register.js)
- P1-1 / P1-4: subscriptions/customEvents 핸들러 배선
- P2-1 / P2-2: manifest.json 등록 일치
- P3-1~3: register.js / beforeDestroy.js 정리 순서
- P3-5: preview `<script src>` 깊이 5단계 (`Components/Snackbar/Advanced/persistent/preview/...html` → `../`를 5번 = Snackbar/Advanced/action과 동일 verbatim 복사)
