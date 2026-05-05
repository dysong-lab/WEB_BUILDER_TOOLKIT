# Search — Advanced / voiceInput

## 기능 정의

1. **검색 바 렌더링 (Standard 호환 KEY)** — `searchBar` 토픽으로 수신한 객체 데이터(`{ placeholder, query, leadingIcon }`)를 검색 바에 반영. FieldRenderMixin으로 input의 `value`/`placeholder` 속성과 leading 아이콘 textContent에 매핑. cssSelectors KEY는 Standard 호환(`searchBar`/`leadingIcon`/`query`/`placeholder`/`clearBtn`).
2. **마이크 버튼 (Web Speech API 토글)** — Standard에는 없는 마이크 버튼(`.search-vi__mic`)을 input 옆에 추가. 클릭 시 `_recognition.start()`/`stop()` toggle. 진행 중에는 `.search-vi__bar[data-recording="true"]`로 마이크 색 변화 + 펄스 애니메이션을 CSS가 처리.
3. **interim/final transcript 처리** — `recognition.onresult`에서 `event.results[i].isFinal`로 분기. interim 결과는 input.value에 회색/이탤릭(`data-interim="true"`)으로 미리보기. final 결과는 `data-interim="false"`로 input.value 확정 + `_query` 갱신 + `@searchInputChanged` emit + `@voiceTranscribed` emit (payload: `{ transcript, isFinal: true, confidence?, lang }`).
4. **녹음 lifecycle 이벤트** — `recognition.onstart` 시 `[data-recording="true"]` + `@voiceRecordingStart` emit. `recognition.onend` 시 `[data-recording="false"]` + `_isRecording=false` + `@voiceRecordingEnd` emit. start/stop 토글은 사용자 마이크 버튼 클릭에서 트리거.
5. **에러 처리** — `recognition.onerror`에서 `[data-recording="false"]` 복구 + `@voiceError` emit (payload: `{ error: event.error || 'unknown' }`). 권한 거부(`not-allowed`/`service-not-allowed`)도 동일 경로로 처리. 펄스 애니메이션은 `[data-recording]` 토글로 자연스럽게 멈춘다.
6. **브라우저 미지원 처리** — register 시점 `window.SpeechRecognition || window.webkitSpeechRecognition` 미존재 시 `[data-unsupported="true"]` 토글 + 마이크 버튼 `disabled` + tooltip(`title` 속성 — "이 브라우저는 음성 입력을 지원하지 않습니다") + `@voiceUnsupported` 1회 emit. 이 경우 `_recognition`은 `null`로 유지하고 click 핸들러는 등록하지 않는다.
7. **언어 옵션 (`lang` — 기본 `ko-KR`)** — 인스턴스 옵션 슬롯 `_lang`. register 시점에 `_recognition.lang`에 적용. `setVoiceLang` 토픽으로 페이지가 동적 변경 가능 (`{ lang }`) — `_lang` 갱신 + 진행 중 녹음이 있으면 `stop()` 후 다음 start부터 적용.
8. **input 입력 이벤트** — 사용자가 직접 input에 키 입력 시 `_handleInput`으로 `_query` 갱신 + `@searchInputChanged` emit (Standard 호환 — 페이지가 부분 미리보기 / 자동 검색 트리거). `data-interim`은 사용자 input 시 `false`로 강제(이전 interim 흔적 제거).
9. **clear 버튼 처리 (Standard 호환 `@searchCleared`)** — clear 버튼 클릭 시 customEvents가 `@searchCleared` 발행. 자체 핸들러도 input.value 비우기 + `_query=''` + `data-interim="false"` + 진행 중 녹음 stop. Standard 시그니처 유지.

> **Standard와의 분리 정당성 (5축)**:
> - **새 영역 1종 추가 — 마이크 버튼** — Standard는 leading icon + input + clear button 3요소 + 제안 목록. voiceInput은 입력 영역에 마이크 버튼(`.search-vi__mic`)을 추가하고 제안 목록(`.search__suggestions`) 자체를 사용하지 않는다(검색은 voice → text 전환에 집중, suggestions는 페이지 책임 외).
> - **새 외부 라이브러리 의존 — Web Speech API (`SpeechRecognition`)** — Standard는 순수 DOM input 위임. voiceInput은 브라우저 native `SpeechRecognition` 인스턴스를 자체 보관(`_recognition`), 라이프사이클 이벤트(start/end/result/error) 4종을 컴포넌트에 흡수. 미지원 브라우저 분기 처리도 컴포넌트가 담당.
> - **새 자체 상태 4종** — `_recognition: SpeechRecognition|null`, `_isRecording: boolean`, `_lang: string` (옵션 슬롯, 기본 `ko-KR`), `_query: string`, bound handler refs 5종(`_inputHandler`/`_micClickHandler`/`_clearHandler` + recognition 콜백 4종 `_onStart`/`_onEnd`/`_onResult`/`_onError`). Standard는 stateless.
> - **새 토픽 1종 + Standard 호환 1종** — 새: `setVoiceLang`(외부 언어 변경 — 선택). Standard 호환: `searchBar`(데이터 매핑). Standard의 `searchSuggestions`는 본 변형 모델에 없음.
> - **새 이벤트 5종 + Standard 호환 2종 유지** — `@voiceRecordingStart`, `@voiceRecordingEnd`, `@voiceTranscribed`, `@voiceUnsupported`(init 1회), `@voiceError`. Standard 호환: `@searchInputChanged`(input 마다 — 음성/타이핑 모두), `@searchCleared`(clear 버튼). Standard의 `@searchSubmitted`/`@suggestionClicked`는 본 변형 모델 외(submit은 final transcript = 검색 완료 + Enter는 사용 의도 명확하지 않음 — 페이지가 `@searchInputChanged`/`@voiceTranscribed`에서 자체 판단).

> **유사 변형과의 비교**: `Search/Advanced/autoComplete`이 "input 변경 → debounce → dropdown" 흐름을 흡수했다면, `recentHistory`는 "focus 시 최근 검색어 목록 + localStorage 영속화", `filtered`는 "검색 + 필터 + 결과 통합". **voiceInput은 그 옆에 "입력 채널 자체를 음성으로 확장"이라는 직교 차원** — 다른 변형들이 검색 흐름의 다음 단계(자동완성/이력/필터+결과)를 흡수했다면, voiceInput은 검색 흐름의 진입점(입력 채널)을 음성으로 확장. 마이크 토글 + interim/final 분기 + 라이프사이클 이벤트 흡수 + 미지원 분기는 본 변형의 정체.

> **MD3 / 도메인 근거**: MD3 Search 명세는 음성 입력을 trailing icon 형태로 명시하지 않지만 실사용 검색 UI 다수가 마이크 버튼을 제공한다(Google Search, YouTube, 모바일 음성 비서, 운전 중 hands-free 검색, 접근성 도구). Web Speech API는 Chrome/Edge/Safari에서 지원되며, Firefox는 미지원이라 `@voiceUnsupported` emit으로 페이지가 fallback UI(예: 마이크 버튼 숨김)를 그릴 수 있게 한다. 도메인 예: ① 모바일/태블릿 검색(handheld 입력 대체), ② 운전 중 hands-free 검색(텍스트 입력 불가), ③ 접근성(키보드/마우스 사용 어려운 사용자), ④ 음성 메모/명령(음성 → text 변환 후 다른 처리).

---

## 구현 명세

### Mixin

FieldRenderMixin (검색 바의 query/placeholder/leadingIcon 데이터 매핑) + 자체 메서드 9종 + 자체 상태 5종.

> **신규 Mixin 생성 금지** — Web Speech API 라이프사이클 흡수는 자체 메서드(`_initRecognition` / `_onStart` / `_onEnd` / `_onResult` / `_onError` / `_handleMicClick` 등)로 처리. 음성 입력은 본 변형 외에 일반화 후보가 아직 없어 Mixin 추출 보류 — `audit-project` 시점에 재검토.

### 옵션 슬롯 (인스턴스 직접 설정)

| 옵션 | 타입 | 기본 | 설명 |
|------|------|------|------|
| `_lang` | `string` | `'ko-KR'` | `_recognition.lang`에 반영. 페이지가 register 직후 또는 `setVoiceLang` publish로 덮어쓸 수 있음. |

### cssSelectors

#### FieldRenderMixin (`this.fieldRender`) — 검색 바 + 마이크 버튼

| KEY | VALUE | 용도 |
|-----|-------|------|
| searchBar   | `.search-vi__bar`     | 바 루트 — 계약 유지 (`[data-recording]`/`[data-unsupported]` 토글 대상) |
| leadingIcon | `.search-vi__leading` | 선행 검색 아이콘 자리 — textContent 반영 |
| query       | `.search-vi__input`   | 입력 필드 — `value` 속성 반영 + 자체 input 핸들러 부착 + `[data-interim]` 토글 |
| placeholder | `.search-vi__input`   | 입력 필드 — `placeholder` 속성으로 반영 |
| clearBtn    | `.search-vi__clear`   | 클리어 버튼 — bindEvents click + 자체 사이드이펙트 |
| micBtn      | `.search-vi__mic`     | 마이크 버튼 — 자체 click 핸들러 (toggle start/stop) + `[data-recording]`/`disabled` |

> **이벤트/UI 영역 KEY**: `micBtn`은 FieldRenderMixin이 데이터 바인딩에 사용하지 않는 영역이지만 자체 메서드의 querySelector 진입점에 사용 — filtered/recentHistory 동일 패턴.

#### elementAttrs (FieldRenderMixin)

| KEY | VALUE |
|-----|-------|
| query       | value |
| placeholder | placeholder |

> `query`는 input의 `value`로, `placeholder`는 input의 `placeholder`로 반영. `leadingIcon`은 textContent이므로 elementAttrs 없음 (Standard와 동일).

### 인스턴스 상태

| 키 | 타입 | 설명 |
|----|------|------|
| `_lang` | `string` | 음성 인식 언어 코드. 기본 `'ko-KR'`. |
| `_recognition` | `SpeechRecognition \| null` | Web Speech API 인스턴스. 미지원 환경에서는 `null`. |
| `_isRecording` | `boolean` | 현재 녹음 중 여부. start/stop 사이클 동안 동기화. |
| `_query` | `string` | 현재 input value 진실 소스. final transcript 또는 사용자 input 시 갱신. |
| `_inputHandler` / `_micClickHandler` / `_clearHandler` | `function \| null` | DOM 자체 핸들러 bound refs. |
| `_onStartBound` / `_onEndBound` / `_onResultBound` / `_onErrorBound` | `function \| null` | recognition 콜백 bound refs (본체 메서드는 `_onStart`/`_onEnd`/`_onResult`/`_onError`). |

### 구독 (subscriptions)

| topic | handler | 페이로드 |
|-------|---------|---------|
| `searchBar` | `this.fieldRender.renderData` | `{ placeholder, query, leadingIcon }` — Standard 호환 |
| `setVoiceLang` (선택) | `this._setVoiceLangFromTopic` | `{ lang }` — 외부 언어 변경 |

### 이벤트 (customEvents — bindEvents 위임)

| 이벤트 | 선택자 (computed) | 발행 시점 | payload |
|--------|------------------|-----------|---------|
| click | `clearBtn` (fieldRender) | clear 버튼 클릭 | `@searchCleared` (Standard 호환). 자체 핸들러도 추가로 input 비우기 + 진행 중 녹음 stop. |

### 자체 발행 이벤트 (Weventbus.emit — 명시 payload)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@searchInputChanged` | input 이벤트 (raw) + final transcript 시 | `{ value }` (현재 input.value — 페이지 부분 미리보기/자동 검색 트리거) |
| `@voiceRecordingStart` | `recognition.onstart` | `{ lang }` |
| `@voiceRecordingEnd` | `recognition.onend` | `{ lang }` |
| `@voiceTranscribed` | final transcript 시 (`isFinal === true`) | `{ transcript, isFinal: true, confidence?, lang }` |
| `@voiceUnsupported` | register 시점 미지원 환경 1회 | `{ reason: 'no-SpeechRecognition' }` |
| `@voiceError` | `recognition.onerror` | `{ error: event.error \|\| 'unknown' }` |

### 커스텀 메서드

| 메서드 | 시그니처 | 설명 |
|--------|---------|------|
| `_initRecognition()` | `() => void` | `window.SpeechRecognition \|\| window.webkitSpeechRecognition` 검사. 존재 시 인스턴스 생성 + `lang`/`interimResults=true`/`continuous=false` 설정 + start/end/result/error 콜백 부착. 미존재 시 `_recognition=null` + `[data-unsupported="true"]` + 마이크 버튼 disabled + `@voiceUnsupported` emit. |
| `_handleMicClick()` | `() => void` | 마이크 버튼 click. 미지원 시 무시. `_isRecording` 기준 toggle: `false` → `_recognition.start()`, `true` → `_recognition.stop()`. 예외(`InvalidStateError` 등) 발생 시 `@voiceError` emit. |
| `_onStart()` | `() => void` | `recognition.onstart`. `_isRecording=true` + `searchBar [data-recording="true"]` + `@voiceRecordingStart` emit. |
| `_onEnd()` | `() => void` | `recognition.onend`. `_isRecording=false` + `searchBar [data-recording="false"]` + `@voiceRecordingEnd` emit. |
| `_onResult(event)` | `(SpeechRecognitionEvent) => void` | `event.results` 순회. interim과 final 분리 — interim은 input.value에 미리보기(`[data-interim="true"]`), final은 input.value 확정(`[data-interim="false"]`) + `_query` 갱신 + `@searchInputChanged`(현재 input.value) + `@voiceTranscribed`({transcript, isFinal:true, confidence?, lang}) emit. |
| `_onError(event)` | `(SpeechRecognitionErrorEvent) => void` | `searchBar [data-recording="false"]` + `_isRecording=false` + `@voiceError` emit. recognition은 자동으로 onend도 호출. |
| `_handleInput(e)` | `(InputEvent) => void` | input element `input`. `_query` = e.target.value 갱신 + `[data-interim="false"]` 강제 + `@searchInputChanged` emit. |
| `_handleClear()` | `() => void` | clear 버튼 native 사이드이펙트. input.value=''+`_query=''`+`[data-interim="false"]` + 진행 중 녹음 stop. (`@searchCleared`는 bindEvents 발행). |
| `_setVoiceLangFromTopic({ response })` | `({response}) => void` | `setVoiceLang` 핸들러. payload `{ lang }`에서 `_lang` 갱신 + `_recognition.lang` 갱신. 진행 중 녹음 stop(다음 start부터 새 lang 적용). |

> **bindEvents의 `@searchCleared` ↔ 자체 사이드이펙트 분리**: `@searchCleared`는 customEvents의 위임 발행으로 외부에 알리고, 컴포넌트 자체 사이드이펙트(input 비우기 + 녹음 stop)는 별도 native click 핸들러(`_handleClear`)에서 수행 — recentHistory/filtered 패턴 답습.

### 페이지 연결 사례

```
[페이지 — 모바일 검색 / 운전 중 hands-free / 접근성 도구 / 음성 메모]
    │
    ├─ fetchAndPublish('searchBar', this) — 초기 바 데이터(placeholder/leadingIcon)
    │
    ├─ '@voiceTranscribed'   수신 → final transcript로 자체 검색 실행 / 다른 화면 navigate
    ├─ '@searchInputChanged' 수신 → 부분 미리보기 / 자동 검색 트리거 (음성+타이핑 모두)
    ├─ '@voiceRecordingStart'수신 → 마이크 권한 요청 UI / 분석 로깅 (선택)
    ├─ '@voiceRecordingEnd'  수신 → 녹음 종료 안내 (선택)
    ├─ '@voiceError'         수신 → 사용자 토스트 메시지 ("음성 인식 실패: " + error)
    ├─ '@voiceUnsupported'   수신 → 페이지 자체 음성 입력 메뉴 숨김 / 안내 표시
    ├─ '@searchCleared'      수신 → 페이지 검색 결과 reset (선택)
    └─ (선택) 'setVoiceLang' publish → 외부 언어 강제 변경 (예: 다국어 사이트 lang switch)

[Search/Advanced/voiceInput]
    ├─ FieldRender가 검색 바 데이터 매핑
    ├─ 마이크 클릭 → _recognition.start() → onstart → @voiceRecordingStart
    ├─ 음성 인식 진행 → onresult interim → input.value 미리보기 (data-interim="true")
    ├─ 음성 인식 final → input.value 확정 + @searchInputChanged + @voiceTranscribed
    ├─ onend → @voiceRecordingEnd
    ├─ onerror → @voiceError + 녹음 상태 해제
    ├─ 사용자 input 직접 타이핑 → @searchInputChanged (Standard 호환)
    └─ × clear → input 비움 + 녹음 stop + @searchCleared (Standard 호환)

운영: this.pageDataMappings = [
        { topic: 'searchBar',    datasetInfo: {...}, refreshInterval: 0 },
        { topic: 'setVoiceLang', datasetInfo: {...}, refreshInterval: 0 }   // 선택
      ];
      Wkit.onEventBusHandlers({
        '@voiceTranscribed':    ({ transcript }) => { /* 검색 실행 */ },
        '@searchInputChanged':  ({ value })      => { /* 부분 미리보기 / auto search */ },
        '@voiceRecordingStart': ({ lang })       => { /* UI hint */ },
        '@voiceRecordingEnd':   ()               => { /* 종료 안내 */ },
        '@voiceError':          ({ error })      => { /* 토스트 */ },
        '@voiceUnsupported':    ()               => { /* 메뉴 숨김 */ },
        '@searchCleared':       ()               => { /* reset */ }
      });
```

### 디자인 변형

| 파일 | 페르소나 | 시각 차별화 | 도메인 컨텍스트 예 |
|------|---------|-------------|------------------|
| `01_refined`     | A: Refined Technical | 다크 퍼플 + 그라디언트 깊이 + Pretendard + pill 바(30px) + 시안 마이크 액센트 + 녹음 중 바 외곽 펄스(시안 → 마젠타 그라디언트). | **모바일 검색 — 음성 메모 변환** (음성으로 빠른 검색어 입력 — Naver/Daum 모바일 패턴) |
| `02_material`    | B: Material Elevated | 라이트 + elevation shadow + Roboto + 28px pill 바 + Material 마이크 IconButton(filled tonal) + 녹음 중 빨간 dot pulse + Material ripple. | **접근성 음성 입력 — Voice Search** (키보드 사용 어려운 사용자 보조 — Google Search 모바일 패턴) |
| `03_editorial`   | C: Minimal Editorial | 웜 그레이 + 세리프 라벨 + 바닥줄 바 + 2px 샤프 모서리 + 미니멀 outline 마이크 + 녹음 중 점선 외곽 회전(애니메이션 보다 정적 강조). | **음성 메모 검색 — 인터뷰/회의 기록** (말하는 키워드로 인터뷰 노트 검색 — Editorial/Journal 패턴) |
| `04_operational` | D: Dark Operational  | 컴팩트 다크 쿨 톤 + IBM Plex Mono input + 시안 미세 테두리 + 마이크 ASCII `[MIC]` 토글 + 녹음 중 깜빡임(blink) + 시안 액센트. | **운전 중 hands-free 명령 검색 — 차량 콘솔** (운전 중 음성으로 차량 시스템 검색 — 차량 인포테인먼트 패턴) |

각 페르소나는 페르소나 프로파일(produce-component SKILL Step 5-1)을 따른다. preview에는 시연 시나리오(마이크 클릭 → 녹음 → transcript)를 demo-hint에 명시하고, 마이크 권한이 필요하므로 demo 버튼으로 simulate-final-transcript 트리거를 함께 제공해 권한 없이도 이벤트 흐름을 검증 가능하게 한다.

### 결정사항

- **Web Speech API 직접 의존**: polyfill / fallback 라이브러리 없이 native API에 직접 의존. 미지원 분기는 `@voiceUnsupported` emit + UI 비활성화로 처리(페이지가 fallback 결정).
- **interim results 활성**: `interimResults=true`로 진행 중 미리보기 — 사용자 피드백 즉시성. `data-interim` 토글로 시각적 구분(회색/이탤릭).
- **continuous=false**: 한 번 발화 → 한 번 final → end. 연속 듣기 모드는 본 변형 외(향후 dictation 변형 후보).
- **lang 기본 `ko-KR`**: 한국어 사이트 기본. 페이지가 영문 사이트면 register 직후 `_lang='en-US'` 또는 `setVoiceLang` publish.
- **마이크 권한 요청은 Web Speech API에 위임**: 컴포넌트는 권한 요청 UI를 그리지 않음. `recognition.start()` 호출 시 브라우저가 자동으로 권한 다이얼로그 표시. 거부 시 `onerror`(`not-allowed`) → `@voiceError` emit.
- **input 직접 타이핑도 허용**: 음성과 키보드 병행. interim 표시 중 사용자가 직접 타이핑하면 `_handleInput`에서 `[data-interim="false"]`로 강제(이전 흔적 제거).
- **`@voiceTranscribed`는 final만**: interim은 `@searchInputChanged`로만 통보(input.value 변경). `@voiceTranscribed`는 사용자 발화 완료 시점(검색 실행 의도 명확) 1회.
- **clear 시 녹음 stop**: 사용자 의도(검색 reset)와 녹음 진행은 양립 불가. clear 시 강제 stop.
- **신규 Mixin 생성 금지**: FieldRenderMixin + 자체 메서드로 완결. 음성 입력 패턴 재사용 후보가 단일 변형뿐이므로 일반화는 보류 — `audit-project` 시점에 dictation/voiceCommand 변형이 추가되면 재검토.
