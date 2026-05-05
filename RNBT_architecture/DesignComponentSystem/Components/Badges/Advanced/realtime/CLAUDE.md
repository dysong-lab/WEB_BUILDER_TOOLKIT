# Badges — Advanced / realtime

## 기능 정의

1. **실시간 카운트 표시** — `badgeStream` 토픽으로 수신한 `{ count }`를 배지에 렌더한다. count가 0/null이면 Small 모드(점), 1~99면 Large 모드(숫자), 100+면 Large 모드(`99+`).
2. **변화 감지 펄스** — 직전 count와 새 count가 다를 때만 펄스 애니메이션(`.badge--pulse` 클래스 토글, 600ms 후 자동 제거)을 1회 재생한다. 동일 값이 다시 publish되어도 펄스는 발생하지 않는다(visual noise 차단).
3. **변경 이벤트 발행** — count가 실제로 변할 때 `@badgeUpdate` 이벤트를 발행한다. payload 없이 의도 신호만 전달 — 페이지가 카운트 변경 시점에 사운드/하이라이트/외부 알림 등 부수 효과를 트리거할 수 있다.

---

## Standard와의 분리 정당성

| 축 | Standard | Advanced/realtime |
|----|----------|-------------------|
| **구독 토픽** | `badgeInfo` (단발) | **`badgeStream`** (스트림 컨텍스트 명시) |
| **커스텀 메서드** | `updateBadge` (count → label) | **`updateBadge`(변화 감지 + 펄스 트리거 + 이벤트 발행) + `_pulseOnce` (애니메이션 1회 재생)** |
| **상태** | 무상태 | **`_previousCount` 인스턴스 상태로 직전 값 추적** |
| **이벤트** | 없음 | **`@badgeUpdate` 발행** |
| **CSS** | 정적 모드 토글 | **`.badge--pulse` 클래스 + `@keyframes badge-realtime-pulse` (transform/box-shadow 1회)** |
| **timing 의존성** | 없음 | **`setTimeout` 기반 클래스 자동 제거 (정리 책임 발생)** |

위 6축이 모두 다르다 → register.js / beforeDestroy.js가 명백히 다름 → Standard 내부 variant로 흡수 불가.

> **AnimationMixin 미사용 사유**: 큐 설명에 AnimationMixin pulse가 명시되어 있으나, 기존 AnimationMixin은 GLTF AnimationClip 재생용 3D 전용 Mixin이다 ([Mixins/README.md](/RNBT_architecture/DesignComponentSystem/Mixins/README.md)). 2D DOM 펄스 애니메이션에는 사용 불가. 신규 Mixin 생성은 본 SKILL의 대상이 아니므로(produce-component Step 3-1) **CSS keyframe + JS class toggle 커스텀 메서드(`_pulseOnce`)**로 완결한다. (반복 패턴 후보: pulse on value-change — audit-project가 다른 컴포넌트에서 동일 패턴을 발견하면 PulseOnChangeMixin 생성 검토)

---

## 구현 명세

### Mixin

FieldRenderMixin + 커스텀 메서드(`updateBadge`, `_pulseOnce`)

### cssSelectors

| KEY | VALUE | 용도 |
|-----|-------|------|
| badge | `.badge` | 루트 요소 — Small/Large 모드 클래스 + `.badge--pulse` 토글 |
| label | `.badge__label` | 카운트 텍스트 (FieldRenderMixin renderData 대상) |

### 인스턴스 상태

| 키 | 설명 |
|----|------|
| `_previousCount` | 직전 publish 시점의 count(Number/null). 첫 publish 시 펄스 발생 X (초기 표시는 펄스 대상 아님). |
| `_pulseTimer` | 펄스 클래스 자동 제거를 위한 setTimeout 핸들. beforeDestroy에서 clearTimeout. |

### 구독 (subscriptions)

| topic | handler |
|-------|---------|
| `badgeStream` | `updateBadge` |

### 이벤트 (customEvents)

| 이벤트 | 발행 시점 | payload |
|--------|----------|---------|
| `@badgeUpdate` | `updateBadge`에서 count가 실제로 변했을 때 1회 | 없음(의도 신호) |

> 본 변형은 click 등 DOM 이벤트는 사용하지 않으므로 `customEvents = {}` + bindEvents 호출 (생명주기 일관성). `@badgeUpdate`는 `Wkit.emitEvent('@badgeUpdate', this)`로 직접 발행한다 (scrollCollapsing의 `@appBarCollapsed` 패턴과 동일).

### 커스텀 메서드

| 메서드 | 설명 |
|--------|------|
| `updateBadge({ response: data })` | count 분기(Small/Large/99+) → CSS 클래스 토글 → `fieldRender.renderData({ label })` → `_previousCount`와 비교해 다르면 `_pulseOnce()` + `Wkit.emitEvent('@badgeUpdate', this)` 호출 → `_previousCount` 갱신. |
| `_pulseOnce()` | `.badge--pulse` 클래스 추가 → 600ms 후 setTimeout으로 자동 제거. 직전 펄스가 아직 끝나지 않았으면 기존 타이머 clearTimeout 후 재시작(중첩 펄스 방지). |

### 페이지 연결 사례

```
[페이지 onLoad]
  this.pageDataMappings = [
    { topic: 'badgeStream', datasetInfo: { datasetName: 'unread_count' }, refreshInterval: 3000 }
  ];
  // → 3초 주기 publish: { count: 5 } → 7 → 7 → 12 → 12 → 0
  //    펄스 발생:        5(초기 X) → 7(O) → 7(X) → 12(O) → 12(X) → 0(O)

  Wkit.onEventBusHandlers({
    '@badgeUpdate': () => {
        notificationSound.play();   // 변화 시점에만 사운드
        flashHeader();
    }
  });
```

### 디자인 변형

| 파일 | 페르소나 | 설명 |
|------|---------|------|
| `01_refined` | A: Refined Technical | 퍼플 팔레트, 그라디언트 + 글로우 펄스, Pretendard, 다크 |
| `02_material` | B: Material Elevated | MD3 error red + elevation, 라이트, Roboto, scale + shadow 펄스 |
| `03_editorial` | C: Minimal Editorial | 웜 그레이/크림슨, Inter, 라이트, 미니멀 ring 확산 펄스 |
| `04_operational` | D: Dark Operational | 시안/노랑, IBM Plex Mono, 다크, 강한 ring + brightness 펄스(미해결 알람 강조) |
