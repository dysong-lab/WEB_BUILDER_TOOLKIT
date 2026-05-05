# Badges — Advanced / pulseOnChange

## 기능 정의

1. **임의 타입 값 표시** — `valueChange` 토픽 또는 `setValue` 명령형 API로 받은 `{ value, intensity? }`를 배지에 렌더한다. value는 숫자/문자/객체(`{ display, sortKey }`) 모두 지원하며, 표시 문자열은 객체일 때 `display` 키, 그 외에는 `String(value)`로 정규화한다. 빈 문자열/null/undefined/0/false는 Small 모드(점), 그 외는 Large 모드(텍스트).
2. **값 변경 감지 펄스** — 직전 정규화된 값(previousValue)과 새 값이 다를 때만 펄스 애니메이션 1회 재생. 동일 값 재발행은 무시(visual noise 차단). 페이로드의 `intensity`(`'strong'` | `'soft'`, default `'strong'`)에 따라 `.badge--pulse-strong` 또는 `.badge--pulse-soft` 클래스를 토글하여 펄스 세기를 분리한다 (예: 일반 갱신은 soft, 임계 알림은 strong).
3. **변경 이벤트 broadcast** — value가 실제로 변할 때 `@valueChanged` 이벤트를 **detail payload와 함께** 발행한다. payload: `{ previousValue, value, intensity, durationMs }`. 페이지가 변경 자체를 신호로 받아 사운드/하이라이트/알림 외에도 **이전→이후 비교 정보**를 활용할 수 있다 (예: 증가/감소 방향 구분 처리).
4. **명령형 setValue API** — 컴포넌트 인스턴스에 `setValue(value, options?)` 메서드를 노출하여 페이지가 토픽 publish 없이도 직접 호출 가능. options: `{ intensity, silent }`. `silent: true`이면 펄스/이벤트 없이 표시만 갱신(초기화 용도).

---

## Standard와의 분리 정당성

| 축 | Standard | Advanced/pulseOnChange |
|----|----------|------------------------|
| **구독 토픽** | `badgeInfo` (count 전용) | **`valueChange`** (임의 타입 value) |
| **데이터 모델** | `{ count }` 숫자만 | **`{ value, intensity }` — 숫자/문자/객체 모두** |
| **상태** | 무상태 | **`_previousValue` (임의 타입), `_pulseTimer`** |
| **이벤트** | 없음 | **`@valueChanged` + payload `{ previousValue, value, intensity, durationMs }`** |
| **공개 API** | 없음 | **`setValue(value, options)` 명령형 인터페이스** |
| **CSS** | 정적 모드 토글 | **`.badge--pulse-strong` / `.badge--pulse-soft` 두 강도 keyframe** |

위 6축이 모두 다르다 → register.js / beforeDestroy.js가 명백히 다름 → Standard 내부 variant로 흡수 불가.

---

## realtime과의 분리 정당성

| 축 | Advanced/realtime | Advanced/pulseOnChange |
|----|-------------------|------------------------|
| **사용 시나리오** | **외부 stream push 흐름** (서버/소켓이 카운트를 1초 단위로 흘려보냄). 펄스는 카운트 변경 가시화 보조. | **명령형 갱신 + 변경 시그널 broadcast 통합 포커스**. 페이지 로직이 setValue로 직접 갱신하거나 일반 `valueChange` 토픽으로 발행. |
| **데이터 모델** | 숫자 count 전용 (`{ count }`). 99+ 절단 규칙 내장. | **임의 타입 value** (`{ value, intensity? }`). 숫자/문자/객체 모두 지원. 표시 변환은 객체 `display` 키. |
| **토픽 이름** | `badgeStream` (스트림 컨텍스트 명시) | `valueChange` (일반 값 갱신). 토픽 구독은 선택적 — setValue API가 1차 인터페이스. |
| **이벤트 페이로드** | `@badgeUpdate` — payload 없음 (의도 신호만) | **`@valueChanged` — `{ previousValue, value, intensity, durationMs }` 전달**. 페이지가 이전→이후 비교 정보로 분기 가능. |
| **펄스 강도** | 단일 강도 (`.badge--pulse`) | **`strong`/`soft` 두 강도 분리** — payload `intensity`로 결정. |
| **공개 API** | 없음 (구독만) | **`setValue(value, options)` 명령형 메서드** — 페이지 코드에서 직접 호출. |

> **요약**: realtime은 "외부 스트림이 흐르며 가시화한다"는 push 패러다임 / pulseOnChange는 "명령형으로 값을 바꾸고 변경 자체를 broadcast한다"는 pull+broadcast 패러다임. 둘 다 펄스를 사용하지만 **인터페이스(API) / 데이터 표현력(임의 타입) / 페이로드 정보량 / 펄스 강도 분리**가 다르다.

> **AnimationMixin 미사용 사유**: 큐 설명에 펄스 애니메이션이 명시되어 있으나, 기존 AnimationMixin은 GLTF AnimationClip 재생용 3D 전용 Mixin이다 ([Mixins/README.md](/RNBT_architecture/DesignComponentSystem/Mixins/README.md)). 2D DOM 펄스 애니메이션에는 사용 불가. 신규 Mixin 생성은 본 SKILL의 대상이 아니므로(produce-component Step 3-1) **CSS keyframe + JS class toggle 커스텀 메서드(`_pulseOnce`)**로 완결한다. realtime과 pulseOnChange 두 변형이 펄스 패턴을 공유하므로 audit-project 시점에 **PulseOnChangeMixin** 생성 후보로 백로그 등록 (본 사이클은 별도 mixin 추출 없이 두 변형이 각자 독립 register.js로 완결).

---

## 구현 명세

### Mixin

FieldRenderMixin + 커스텀 메서드(`setValue`, `_applyValue`, `_pulseOnce`)

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| badge | `.badge` | 루트 요소 — Small/Large 모드 클래스 + `.badge--pulse-strong` / `.badge--pulse-soft` 토글 |
| label | `.badge__label` | 표시 문자열 (FieldRenderMixin renderData 대상) |

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_previousValue` | 직전 정규화 값(any \| `undefined`). 첫 publish/setValue 시점에는 `undefined` → 펄스 대상 아님. |
| `_pulseTimer` | 펄스 클래스 자동 제거 setTimeout 핸들. beforeDestroy에서 clearTimeout. |
| `_pulseDurationMs` | 펄스 지속(고정 600ms). `@valueChanged` payload에 포함되어 페이지가 동기화 가능. |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| `valueChange` | `_applyValue` (내부 dispatcher) |

### 이벤트 (customEvents)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@valueChanged` | `_applyValue`에서 정규화된 value가 실제로 변했을 때(silent=false) 1회 | `{ previousValue, value, intensity, durationMs }` |

> 본 변형은 click 등 DOM 이벤트는 사용하지 않으므로 `customEvents = {}` + bindEvents 호출(생명주기 일관성). `@valueChanged`는 `Wkit.emitEvent('@valueChanged', this, payload)`로 직접 발행. payload가 instance 다음 인자로 전달된다 (`scrollCollapsing`/`searchEmbedded` 검색 패턴 동일).

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `setValue(value, options?)` | 공개 명령형 API. `options = { intensity, silent }`. 내부적으로 `_applyValue({ response: { value, intensity } })` 호출하되 silent=true이면 변경 감지/펄스/이벤트 발행 단계 건너뜀(표시 갱신만). |
| `_applyValue({ response: data })` | 내부 dispatcher. 값 정규화(객체 `display` 추출, null/undefined 처리) → Small/Large CSS 클래스 토글 → `fieldRender.renderData({ label })` → `_previousValue`와 비교해 다르면 `_pulseOnce(intensity)` + `Wkit.emitEvent('@valueChanged', this, payload)` 호출 → `_previousValue` 갱신. |
| `_pulseOnce(intensity)` | `.badge--pulse-strong` 또는 `.badge--pulse-soft` 클래스 추가 → 600ms 후 setTimeout으로 자동 제거. 직전 펄스가 아직 끝나지 않았으면 기존 타이머 clearTimeout + 두 클래스 모두 제거 후 재시작(중첩 펄스 방지). |

### 페이지 연결 사례

```javascript
// 사례 A — 토픽 구독 (대기 큐 길이 추적)
this.pageDataMappings = [
    { topic: 'valueChange', datasetInfo: { datasetName: 'queue_size' }, refreshInterval: 5000 }
];
// publish: { value: 3, intensity: 'soft' } → { value: 3 } → { value: 'OVER', intensity: 'strong' }
// 펄스:    초기 X → 동일값 X → 변경 + strong 펄스

Wkit.onEventBusHandlers({
    '@valueChanged': ({ previousValue, value, intensity, durationMs }) => {
        if (intensity === 'strong') alertSound.play();
        if (typeof previousValue === 'number' && typeof value === 'number') {
            console.log(value > previousValue ? '증가' : '감소');
        }
    }
});

// 사례 B — 명령형 setValue (부모 컴포넌트가 직접 호출)
const badgeInstance = wkit.getComponent('alert-badge');
badgeInstance.setValue(0, { silent: true });          // 초기값, 펄스/이벤트 없음
badgeInstance.setValue(7);                             // strong 펄스(default) + @valueChanged
badgeInstance.setValue('OVER', { intensity: 'strong' });
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| `01_refined` | A: Refined Technical | 퍼플 그라디언트, Pretendard, 다크. strong=scale+glow 확산 / soft=opacity ripple |
| `02_material` | B: Material Elevated | MD3 secondary container(틸/시안), Roboto, 라이트. strong=elevation pop / soft=tonal flash |
| `03_editorial` | C: Minimal Editorial | 인디고 액센트 + 웜 크림 배경, Inter, 라이트. strong=ring 두 겹 / soft=fade |
| `04_operational` | D: Dark Operational | 그린/엠버 듀얼 액센트, IBM Plex Mono, 다크. strong=brightness+ring / soft=border 깜박임 (정상/경고 대비) |
