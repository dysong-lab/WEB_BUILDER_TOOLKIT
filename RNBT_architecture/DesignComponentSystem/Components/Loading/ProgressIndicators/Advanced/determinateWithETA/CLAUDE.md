# ProgressIndicators — Advanced / determinateWithETA

## 기능 정의

1. **확정 진행 값 표시 (Standard 호환)** — `progressInfo` 토픽으로 수신한 데이터를 진행 바, 라벨, 값 텍스트, 상태 속성에 렌더한다. Standard와 동일 payload (`{ progress, label, valueText, status }`) 호환. 진행 비율(0~100)은 바의 가로 폭(`width: N%`)에 반영.
2. **ETA 자동 계산** — 외부에서 `progress` publish 시점을 추적하여 진행 속도(progress/sec)를 계산하고, `eta = (100 - currentProgress) / speed` 초 값을 도출한다. **smoothing**: 최근 5개 sample(`_history`)의 평균 속도를 사용하여 단발 jitter 방지.
3. **외부 ETA 우선** — 페이지가 직접 정확한 ETA를 알고 있으면 `progressInfo.etaSeconds` 필드로 publish 가능. 컴포넌트는 외부 값이 있으면 그것을 우선 사용, 없으면 자동 계산 결과를 사용.
4. **사람 친화적 포맷** — ETA 초 단위를 `Xs 남음` (60초 미만) / `Xm Ys 남음` (60~3600초) / `Xh Ym 남음` (3600초+) 형태로 포맷하여 `etaText` 영역에 렌더. 속도 0/음수/계산 불가 시 `—` 표시.
5. **etaText 필드** — view에 ETA 표시 영역. cssSelector KEY `etaText` (`.progress-indicator__eta`)로 등록. CSS는 `[data-completed="true"]` 시 ETA 영역 hidden.
6. **완료 시 한 번 발행** — `progress >= 100` 도달 시 ① `data-completed="true"` 부착(ETA 영역 CSS 숨김) ② `_completedFired` flag로 1회만 `@progressCompleted` 발행 (payload: `{ atTime, totalDurationSec }`). 새 작업이 시작되면(`progress`가 100 미만으로 다시 publish) flag/history 초기화.

> **Standard와의 분리 정당성 (5축)**:
> ① **새 cssSelectors KEY 1종** — `etaText` (`.progress-indicator__eta`). Standard는 ETA 표시 영역 자체가 없다.
> ② **payload 호환 + 신규 선택 필드** — Standard는 `{progress, label, valueText, status}` 4필드만 처리. 본 변형은 `etaSeconds` (선택) 필드를 추가로 인식.
> ③ **새 이벤트 1종** — `@progressCompleted`(payload: `{ targetInstance, atTime, totalDurationSec }`). Standard는 `@progressClicked` 단독.
> ④ **자체 상태 5종** — `_history`(Array<{progress, ts}>), `_completedFired`(boolean), `_startTs`(number|null), `_lastEtaSec`(number|null), `_externalEtaUsed`(boolean). Standard는 자체 상태 0개.
> ⑤ **자체 메서드 4종** — `_renderProgressInfo`, `_pushHistory`, `_computeEta`, `_formatEta`. Standard는 메서드 0개(Mixin renderData 직결).
> 동일 register.js로 표현 불가 — ETA 계산은 시간 차분 + 속도 평균이라는 본질적으로 stateful 로직이라 별도 Advanced 변형으로 분리.

> **MD3 / 도메인 근거**: MD3 Progress indicator 명세는 *"determinate progress should communicate completion expectations"* 권고. 운영 사례: 대용량 파일 업로드/다운로드(예상 남은 시간), ML 모델 학습 작업, 영상/오디오 인코딩, DB 백업/복구, 빌드 작업. Standard는 진행률만 — 사용자는 "끝까지 얼마나 더?"의 즉답을 받지 못한다. determinateWithETA는 진행률 + 시간 정보를 한 단위로 흡수.

---

## 구현 명세

### Mixin

FieldRenderMixin (`progressInfo` 1:N 매핑) + 자체 상태 5종 + 자체 메서드 4종.

> Standard와 동일하게 FieldRenderMixin을 사용하여 progress/label/valueText/status를 렌더한다. ETA 계산/포맷은 자체 메서드로 완결 — 신규 Mixin 생성 금지 규칙 준수. `etaText`는 cssSelectors에 KEY로 등록만 해두면 FieldRenderMixin이 외부 publish의 etaText 필드를 자동 textContent에 반영하는 부수효과도 얻는다(외부에서 etaText를 명시 전달하는 경우). 컴포넌트는 외부 etaSeconds 또는 자동 계산값을 자체적으로 textContent로 직접 쓴다.

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| indicator | `.progress-indicator` | 컨테이너(클릭 영역, status 부착 대상, data-completed 부착 대상) |
| track     | `.progress-indicator__track` | 배경 트랙 |
| progress  | `.progress-indicator__bar` | 전경 채움 바 — styleAttrs `progress` → `width: N%` |
| label     | `.progress-indicator__label` | 진행 항목 라벨 텍스트 |
| valueText | `.progress-indicator__value` | 값 텍스트 (예: `45%`, `"450 / 1000 MB"`) |
| status    | `.progress-indicator` | datasetAttrs `status` 대상 (indicator와 동일 요소) |
| etaText   | `.progress-indicator__eta` | **신규** — ETA 표시 영역. 자동 계산 또는 외부 etaSeconds 기반 사람 친화적 포맷. |

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
| `_history` | `Array<{ progress: number, ts: number }>` | 최근 progress sample (최대 5개). FIFO. 첫 sample 추가 시 `_startTs`도 함께 기록. |
| `_completedFired` | boolean | 본 작업 사이클에서 `@progressCompleted` 1회 발행 보장 flag. progress가 100 도달 시 true. 새 작업(progress<100 신규)이 들어오면 false로 리셋. |
| `_startTs` | number \| null | 본 작업 첫 progress(>0) 수신 시각(ms). `@progressCompleted` payload `totalDurationSec` 계산용. |
| `_lastEtaSec` | number \| null | 마지막 계산된 ETA(초). 디버깅/외부 인스펙션용. |
| `_externalEtaUsed` | boolean | 마지막 갱신에서 외부 `etaSeconds`가 사용됐는지 여부. (자동 계산 vs 외부값 trace) |

### 구독 (subscriptions)

| topic | handler | payload | 의미 |
|-------|---------|---------|------|
| `progressInfo` | `this._renderProgressInfo` | `{ progress, label, valueText, status, etaSeconds? }` | Standard 호환 + 선택 etaSeconds 인식 |

### 이벤트 (customEvents)

| 이벤트 | 선택자 | 발행 |
|--------|--------|------|
| click | `indicator` (cssSelectors) | `@progressClicked` (Standard와 동일 — 부수 액션 연결용) |

### 발행 이벤트 (Weventbus.emit)

| 이벤트 | 발행 시점 | payload |
|--------|-----------|---------|
| `@progressCompleted` | progress >= 100 도달 시 사이클당 1회 | `{ targetInstance, atTime: ISO, totalDurationSec: number \| null }` |
| `@progressClicked` | indicator 클릭 시 | (Standard와 동일 — Wkit이 자동 동봉) |

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `_renderProgressInfo({ response })` | `progressInfo` 핸들러. ① payload를 fieldRender.renderData에 위임 ② `_pushHistory`로 sample 갱신 ③ ETA 결정(외부 etaSeconds > 자동 계산) ④ etaText DOM에 textContent로 직접 작성(라벨 영역 외) ⑤ progress >= 100이면 `data-completed="true"` + `@progressCompleted` 1회 발행. 새 작업 신호(progress<100이고 이전 cycle이 fired였음) 감지 시 history/flag 초기화. |
| `_pushHistory(progress, ts)` | `_history`에 새 sample 추가. 길이 5 초과 시 oldest 제거. 첫 sample이면 `_startTs` 기록. |
| `_computeEta()` | history 기반 평균 속도(`(last.progress - first.progress) / dt_seconds`)에서 ETA(초) 계산. sample 2개 미만 또는 속도 0/음수면 `null` 반환. |
| `_formatEta(seconds)` | 사람 친화적 문자열 변환. `null` → `'—'`. `<60` → `'Xs 남음'`. `<3600` → `'Xm Ys 남음'`. `else` → `'Xh Ym 남음'`. |

### 데이터 형식

`progressInfo` payload (Standard 호환 + 선택 필드):

```json
{
    "progress": 45,
    "label": "Uploading files",
    "valueText": "45%",
    "status": "normal",
    "etaSeconds": 35
}
```

`etaSeconds`는 선택. 미지정 시 컴포넌트가 자동 계산.

### 페이지 연결 사례

```
[페이지] ──fetchAndPublish('progressInfo', this)──> [determinateWithETA] 렌더
   ({ progress: 45, label: 'Uploading files', valueText: '45%', status: 'normal' })
   → 컴포넌트가 _history 갱신 → 평균 속도 계산 → ETA = (100-45)/속도 도출
   → etaText 영역에 "1m 22s 남음" 표시

[페이지가 ETA를 직접 알고 있을 때 — 외부값 우선]
   publish('progressInfo', { progress: 45, label: '...', etaSeconds: 28 })
   → 컴포넌트가 자동 계산 무시, "28s 남음" 표시

[progress = 100 도달]
   → data-completed="true" 부착(ETA 영역 hidden)
   → Weventbus.emit('@progressCompleted', { atTime: ISO, totalDurationSec: 73 })
   → 페이지가 후속 처리 (성공 토스트, 다음 단계 진행 등)

운영: this.pageDataMappings = [
        { topic: 'progressInfo', datasetInfo: {...}, refreshInterval: 1000 }
      ];
      Wkit.onEventBusHandlers({
        '@progressCompleted': ({ atTime, totalDurationSec }) => {
            showToast(`완료 (${totalDurationSec}s)`);
            navigator.vibrate?.([100, 50, 100]);
        }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|-------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플, 그라디언트 바, ETA 영역은 헤더 우측 작은 텍스트(라이트 라벤더), 모노스페이스. completed 시 페이드아웃 | 대용량 파일 업로드 ETA — 1.4GB 영상 파일 |
| `02_material`    | B: Material Elevated | 라이트, elevation 카드, ETA는 valueText 아래 caption(에러/주의 톤 없음, 보조 텍스트 회색). completed 시 collapse | DB 백업 작업 — 예상 잔여 시간 |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이, 세리프 라벨, ETA는 라벨 옆 italic 보조 문구(별도 행). completed 시 fade + 선 strikethrough | 장문 매거진 인덱싱 작업 잔여 시간 |
| `04_operational` | D: Dark Operational  | 컴팩트 다크, 시안 stripe, ETA는 헤더 우측 모노스페이스(`ETA 03:42` 형식, 노랑). completed 시 hidden | ML 모델 학습 작업 잔여 epoch 시간 |

### 결정사항

- **외부 ETA 우선**: `etaSeconds`가 payload에 있고 number이면 자동 계산을 무시. 페이지가 더 정확한 정보를 알고 있는 경우(서버에서 직접 계산해서 내려줌)를 존중.
- **smoothing 윈도우 5개**: EMA 대신 sliding window 평균을 채택 — 구현 단순 + 디버깅 용이. 5개는 700~1000ms 간격 publish에서 3.5~5초 스무딩(체감 jitter 차단에 충분).
- **속도 0/음수 처리**: 진행이 정체(같은 progress 연속 publish)이거나 역행(예외 케이스)이면 ETA `null` → `—` 렌더. 가짜 ETA보다 명시적 미지값이 안전.
- **`@progressCompleted` 1회 보장**: `_completedFired` flag로 100 도달 후 추가 100 publish가 들어와도 silent. 새 작업이 시작되면(`progress < 100` 신규) flag/`_history`/`_startTs` 초기화 — 두 번째 사이클부터 다시 1회 발행 가능.
- **`totalDurationSec` 계산**: `_startTs`(첫 progress>0 수신 시각)와 완료 시각 차이. `_startTs`가 없으면(첫 progress가 100인 즉시 완료 케이스) `null`.
- **etaText 직접 textContent**: FieldRenderMixin이 cssSelectors에 KEY로 등록되어 있어 외부에서 `etaText`로 publish하면 자동 매칭되지만, 본 변형은 자체 계산값/포맷 문자열을 우선이므로 `_renderProgressInfo` 내부에서 querySelector로 직접 textContent 작성. 외부 etaText 필드 publish가 들어오면 fieldRender.renderData가 먼저 그것을 textContent로 쓴 후, 우리 로직이 자동/외부 ETA로 즉시 덮어쓰는 순서.
- **`data-completed` 분기**: progress 100 도달 시 indicator 요소에 `data-completed="true"` 부착. CSS는 이 속성으로 ETA 영역을 `display:none`(또는 fade) 처리. 시각적으로 "완료된 작업의 ETA는 의미 없음"을 즉시 표현.
