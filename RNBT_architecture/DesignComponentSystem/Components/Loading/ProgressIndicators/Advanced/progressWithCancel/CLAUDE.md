# ProgressIndicators — Advanced / progressWithCancel

## 기능 정의

1. **확정 진행 값 표시 (Standard 호환)** — `progressInfo` 토픽으로 수신한 데이터를 진행 바, 라벨, 값 텍스트, 상태 속성에 렌더한다. 진행 비율(0~100)은 바의 가로 폭(`width: N%`)으로 반영. Standard와 동일 payload (`{ progress, label, valueText, status }`) 호환.
2. **취소 버튼 표시** — 진행 표시기 옆에 "취소(Cancel)" 버튼이 항상 노출된다. cssSelectors KEY `cancelBtn` (`.progress-indicator__cancel-btn`)으로 계약. 클릭 시 `@progressCancelled` 발행.
3. **취소 진행 중 상태 (`_isCancelling`)** — 사용자가 취소 버튼 클릭 즉시 `_isCancelling=true`로 전환되어 ① 버튼 `disabled=true` ② `data-cancelling="true"` 속성 부착 ③ 라벨/aria-label이 "취소 중..." 으로 교체. 페이지가 실제 작업 중단 후 `setProgressCancelled` 토픽으로 마무리 신호를 보내거나, 새로운 `progressInfo`(다른 작업 시작) 수신 시 자동 정리된다.
4. **외부 강제 cancel** — `setProgressCancelled` 토픽 (payload: `{ cancelled: boolean }` 또는 빈 객체) 수신 시 ① `cancelled !== false`이면 즉시 `_isCancelling=true` 전환 + `@progressCancelled` 발행 + reason `'external'`. ② `cancelled === false`이면 `_isCancelling=false`로 정리만 수행 (페이지 후처리 완료 신호).
5. **취소 가능 토글** — `setCancelEnabled` 토픽 (payload: `{ enabled: boolean }`) 수신 시 cancel 버튼의 활성화 가능 여부를 제어한다. `enabled=false`이면 progress와 무관하게 항상 disabled.
6. **완료 시 자동 cancel 비활성화** — `progress >= 100` 또는 `status==='success'` 도달 시 cancel 버튼은 자동으로 disabled (CSS는 `data-cancel-state="disabled-complete"` 분기로 시각 처리). 취소 자체가 의미 없는 시점에 사용자가 잘못 누르는 것을 방지.

> **Standard와의 분리 정당성 (5축)**:
> ① **새 cssSelectors KEY 1종** — `cancelBtn`(취소 버튼). Standard에는 cancel 영역 자체가 없다.
> ② **새 토픽 2종** — `setProgressCancelled`(외부 강제 취소/정리), `setCancelEnabled`(취소 가능 여부 토글). Standard는 단일 토픽 `progressInfo`.
> ③ **새 이벤트 1종** — `@progressCancelled`(payload: `{ atProgress, requestedAt, reason }`). Standard는 `@progressClicked` 단독.
> ④ **자체 상태 4종** — `_isCancelling`(boolean), `_cancelEnabled`(boolean, 외부 토글), `_lastProgress`(number, payload 캐시), `_clickHandler`(bound ref). Standard는 자체 상태 0개.
> ⑤ **자체 메서드 5종** — `_renderProgressInfo`, `_handleCancelClick`, `_handleExternalCancel`, `_handleCancelEnabled`, `_updateCancelUiState`. Standard는 메서드 0개(Mixin renderData 직결).
> 동일 register.js로 표현 불가 — 별도 Advanced 변형으로 분리.

> **MD3 / 도메인 근거**: MD3 Progress indicator 명세는 *"long-running operations should provide a cancel option"*을 권고한다. 운영 사례: 파일 업로드/다운로드 취소, 데이터 export 작업 중단, 장시간 분석 작업 취소, 영상 변환 중단 등. Standard는 단순 진행 표시만 가능 — 페이지가 별도 cancel 버튼 컴포넌트를 옆에 두고 직접 dispose 로직을 짜야 한다. progressWithCancel은 진행 표시 + 취소 게이트를 하나의 단위로 흡수한다.

---

## 구현 명세

### Mixin

FieldRenderMixin (`progressInfo` 1:N 매핑) + 자체 상태 4종 + 자체 메서드 5종.

> Standard와 동일하게 FieldRenderMixin을 사용하여 progress/label/valueText/status를 렌더한다. 취소 상태머신은 자체 메서드로 완결 — 신규 Mixin 생성 금지 규칙 준수.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| indicator | `.progress-indicator` | 컨테이너(클릭 영역, status 부착 대상) |
| track     | `.progress-indicator__track` | 배경 트랙 |
| progress  | `.progress-indicator__bar` | 전경 채움 바 — styleAttrs `progress` → `width: N%` |
| label     | `.progress-indicator__label` | 진행 항목 라벨 텍스트 |
| valueText | `.progress-indicator__value` | 값 텍스트(예: `45%`, `"450 / 1000 MB"`) |
| status    | `.progress-indicator` | datasetAttrs `status` 대상 (indicator와 동일 요소) |
| cancelBtn | `.progress-indicator__cancel-btn` | **신규** — 취소 버튼. native click 핸들러 부착 + `disabled` 토글 + `data-cancelling` 속성 |

### datasetAttrs

| KEY | VALUE | 결과 |
|-----|-------|------|
| status | `status` | `.progress-indicator`에 `data-status="{value}"` |

### styleAttrs

| KEY | property | unit | 결과 |
|-----|----------|------|------|
| progress | `width` | `%` | `.progress-indicator__bar`의 `style.width`에 `{value}%` |

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_isCancelling` | boolean | 취소 요청 후 실제 정리 신호 수신 전까지의 게이트 상태. `true` 동안 버튼 disabled + `data-cancelling="true"` + 라벨 교체. |
| `_cancelEnabled` | boolean | 외부 `setCancelEnabled`로 토글되는 취소 가능 플래그. 기본 `true`. `false`이면 progress와 무관하게 항상 disabled. |
| `_lastProgress` | number | 마지막 수신한 progress 값(0~100). `@progressCancelled` payload `atProgress`에 사용. |
| `_lastStatus` | string | 마지막 수신한 status. 완료 자동 disable 분기에 사용. |
| `_cachedLabel` | string | 마지막 수신한 label(취소 중 라벨로 교체할 때 원래 라벨로 복원하기 위한 캐시). |
| `_cancellingLabel` | string | 취소 중 표시 라벨 기본값 (`"취소 중..."`). 외부 `instance._cancellingLabel = '...'`로 override 가능. |
| `_clickHandler` | function \| null | bound `_handleCancelClick` ref — beforeDestroy에서 정확히 detach. |

### 구독 (subscriptions)

| topic | handler | payload | 의미 |
|-------|---------|---------|------|
| `progressInfo`           | `this._renderProgressInfo`     | `{ progress, label, valueText, status }` | Standard 호환 — 진행 갱신 + 새 작업 시작 시 cancel 상태 자동 정리 |
| `setProgressCancelled`   | `this._handleExternalCancel`   | `{ cancelled?: boolean }` 또는 `{}` | 외부 강제 취소 또는 취소 정리 신호 |
| `setCancelEnabled`       | `this._handleCancelEnabled`    | `{ enabled: boolean }` | 취소 가능 여부 토글 |

### 이벤트 (customEvents)

본 변형은 native click 리스너로 직접 부착한다 — `customEvents`는 비워둔다 (`{}`). cancel 버튼 클릭은 `_handleCancelClick`이 처리하여 상태머신 분기 + 이벤트 발행을 수행한다.

### 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|-----------|---------|
| `@progressCancelled` | 사용자 cancel 클릭 또는 외부 강제 취소 시 | `{ targetInstance, atProgress: number, requestedAt: ISO, reason: 'user' \| 'external' }` |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderProgressInfo({ response })` | `progressInfo` 핸들러. payload를 fieldRender.renderData로 전달 + `_lastProgress`/`_lastStatus`/`_cachedLabel` 캐시 + `_updateCancelUiState()` 호출. **새 작업 신호 감지** — 이전이 cancelling이었으나 progress가 새로 들어오고 작업이 완료(100/success)/오류 상태가 아니면 `_isCancelling=false`로 자동 정리. |
| `_handleCancelClick(e)` | cancel 버튼 native click 핸들러. 좌클릭만 허용. 이미 cancelling이거나 disabled면 무시. `_isCancelling=true` 전환 → `_updateCancelUiState()` → `@progressCancelled` emit (`reason: 'user'`). |
| `_handleExternalCancel({ response })` | `setProgressCancelled` 핸들러. `cancelled === false`이면 `_isCancelling=false`만 (정리). 그 외(`true` 또는 미지정)는 cancelling 상태 진입 + `@progressCancelled` emit (`reason: 'external'`) — 단, 이미 cancelling이면 silent. |
| `_handleCancelEnabled({ response })` | `setCancelEnabled` 핸들러. `enabled === false`이면 `_cancelEnabled=false`, 그 외는 `true`. `_updateCancelUiState()` 호출. |
| `_updateCancelUiState()` | UI 상태 일괄 갱신. `_isCancelling` / `_cancelEnabled` / `_lastProgress` / `_lastStatus`를 종합해 ① cancel 버튼 `disabled` ② `data-cancelling`/`data-cancel-state` 속성 ③ 라벨 교체 (cancelling 중에는 `_cancellingLabel`, 그 외는 `_cachedLabel`)를 결정한다. |

### 데이터 형식

`progressInfo` payload (Standard와 동일):

```json
{ "progress": 45, "label": "Uploading files", "valueText": "45%", "status": "normal" }
```

`setProgressCancelled` payload:

```json
{ "cancelled": true }   // 외부에서 강제 취소
{ "cancelled": false }  // 페이지가 cancel 후 정리 완료 신호
{}                      // (cancelled 미지정) → true로 간주
```

`setCancelEnabled` payload:

```json
{ "enabled": false }    // cancel 비활성
{ "enabled": true }     // cancel 활성 (기본)
```

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('progressInfo', this)──> [progressWithCancel] 렌더
   ({ progress: 45, label: 'Uploading files', valueText: '45%', status: 'normal' })

[사용자 cancel 버튼 클릭]
   └─ _handleCancelClick
        ├─ _isCancelling=true (버튼 disabled, 라벨 "취소 중...")
        └─ Weventbus.emit('@progressCancelled', { atProgress:45, reason:'user', requestedAt:ISO })

[페이지가 @progressCancelled 수신]
   └─ uploadController.abort()
       └─ publish('setProgressCancelled', { cancelled: false })  // 정리 완료
           └─ [progressWithCancel] _isCancelling=false 복귀

[다른 작업 시작 — 새 progressInfo publish]
   └─ _renderProgressInfo: cancelling 상태 자동 정리 + 새 progress 렌더

운영: this.pageDataMappings = [
        { topic: 'progressInfo', datasetInfo: {...}, refreshInterval: 1000 }
      ];
      Wkit.onEventBusHandlers({
        '@progressCancelled': async ({ targetInstance, atProgress, reason }) => {
            await uploadController.abort();
            targetInstance.subscriptions.setProgressCancelled.forEach(h => h.call(targetInstance, { response: { cancelled: false } }));
        }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|-------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플, 그라디언트 바, cancel 버튼은 텍스트 + 작은 X 글리프(저채도 회색→hover 크림슨), cancelling 중 진동 펄스 | 파일 업로드 진행 중 사용자 취소 |
| `02_material`    | B: Material Elevated | 라이트, elevation 카드, cancel은 라이트 텍스트 버튼(에러 톤), cancelling 중 ripple-style 그림자 | 데이터 export(CSV/PDF) 작업 중단 |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이, 세리프 라벨, cancel은 underline 링크 스타일, cancelling 중 italic + 점선 | 장문 콘텐츠 매거진 인덱싱/분석 작업 취소 |
| `04_operational` | D: Dark Operational  | 컴팩트 다크, 시안 stripe, cancel은 outline 버튼(노랑 hover), cancelling 중 깜빡이는 dotted border | 운영 콘솔 — 백엔드 분석 작업 강제 중단 |

### 결정사항

- **컴포넌트는 abort()를 직접 호출하지 않는다**: 실제 작업 중단 로직(fetch abort, websocket close, worker terminate 등)은 페이지가 `@progressCancelled` 수신 후 수행. 컴포넌트는 *언제* 사용자가 취소를 원하는지만 알린다.
- **취소 정리는 양방향**: 사용자 클릭 → emit → 페이지 abort → publish `setProgressCancelled {cancelled:false}` → 컴포넌트 정리. 페이지가 정리 신호를 안 보내도 다음 새 progressInfo 수신 시 자동 정리(safety net).
- **완료 시 자동 disable**: `progress >= 100` 또는 `status==='success'`이면 cancel 버튼 disabled + `data-cancel-state="disabled-complete"`. CSS가 시각적으로 흐리게 처리. 사용자 혼동 방지.
- **`_cancellingLabel` 슬롯**: 다국어/도메인별 메시지 차이를 흡수. 기본값 `"취소 중..."`, 외부에서 `instance._cancellingLabel = 'Cancelling...'`로 override 가능.
- **`@progressCancelled` payload `reason`**: `'user'` (사용자 클릭) / `'external'` (외부 강제 취소). 페이지가 분기 처리할 수 있도록 동봉.
- **이벤트 한 번 보장**: 이미 `_isCancelling=true`인 상태에서 추가 클릭이나 외부 cancel은 silent — 중복 emit 방지.
- **disable 우선순위**: `_cancelEnabled=false` > `_isCancelling=true` > 완료 자동 > 정상. CSS `data-cancel-state` 속성에 `disabled-by-toggle | cancelling | disabled-complete | active` 4값으로 분기.
