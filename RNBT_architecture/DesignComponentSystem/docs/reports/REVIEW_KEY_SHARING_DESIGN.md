# key 공유 설계 검토

> **작성일**: 2026-03-28 | **관점**: CTO 설계 판단 | **대상**: cssSelectors/datasetAttrs key 공유 메커니즘

---
1. 결론부터: key 공유는 합당하다
현재 설계에서 "data field name"을 자연스러운 join key로 사용하는 것은 올바른 판단입니다.


  incoming data        cssSelectors           datasetAttrs
  ───────────         ──────────────         ──────────────
  { severity: ... }   severity → selector    severity → attr name
  { time: ... }       time     → selector    (없음 → textContent)
  { message: ... }    message  → selector    (없음 → textContent)
세 객체가 같은 key를 공유함으로써:

하나의 key가 "이 데이터 필드를 어디에, 어떻게 반영할지"를 결정
개발자가 datasetAttrs에 등록 여부만으로 렌더링 방식을 제어
별도의 매핑 테이블이나 중복 선언이 필요 없음
대안을 생각해보면 현 설계의 합리성이 더 명확합니다:


// 대안 1: datasetAttrs가 selector를 직접 가짐 → 중복, 불일치 위험
datasetAttrs: {
    severity: { selector: '.event-browser__severity-label', attr: 'severity' }
}

// 대안 2: datasetAttrs가 key 목록만 → attr명을 다르게 지정할 수 없음
datasetAttrs: ['severity', 'ack']

// 현재: 간결하고, 의도 명확
datasetAttrs: { severity: 'severity' }
2. 그러나 문서 예시에 설계 의도와 맞지 않는 부분이 있다
StatefulListRenderMixin.md의 EventBrowser 예시를 보면:


cssSelectors: {
    // ... 
    ackBtn:    '.event-browser__ack-btn'    // ← ackBtn
},
datasetAttrs: {
    severity: 'severity',
    ack:      'ack'                          // ← ack (cssSelectors에 없음)
}
ack가 datasetAttrs에 있지만 cssSelectors에는 없습니다.

renderData의 루프는 Object.entries(cssSelectors)를 순회하므로, cssSelectors에 없는 ack는 renderData에서 절대 처리되지 않습니다:


// StatefulListRenderMixin.js:93
Object.entries(cssSelectors).forEach(([key, selector]) => {  // ← cssSelectors 기준
    // ...
    if (datasetAttrs[key]) { ... }  // ack는 여기 도달하지 않음
});
그리고 데이터 주석에는 이렇게 되어 있습니다:


ack: 'false'  // → datasetAttrs['ack'] → data-ack="false"  ← 실제로는 동작하지 않음
이것은 문서와 구현의 불일치입니다. 템플릿 HTML에 data-ack="false"가 하드코딩되어 있고, updateItemState로 나중에 변경하는 구조이므로 실제 동작에는 문제가 없지만, "datasetAttrs에 등록하면 renderData가 처리한다"는 설계 원칙과 모순됩니다.

3. 더 근본적인 질문: cssSelectors의 key가 너무 많은 역할을 하고 있는가?
현재 cssSelectors의 key는 세 가지 소비자에게 서비스합니다:

소비자	사용 방식	예시
renderData	key로 순회하며 데이터 매핑	severity, time, message
customEvents	computed property로 selector 참조	ackBtn, item
Mixin 내부 로직	고정 key 참조	container, template
이것 자체는 문제가 아닙니다. cssSelectors는 "이 컴포넌트가 알아야 하는 DOM 요소 목록"이라는 하나의 책임을 가지고 있고, 소비자가 여럿인 것은 자연스럽습니다.

하지만 renderData가 cssSelectors를 전체 순회하면서 container, template, item 같은 Mixin 전용 key도 데이터 매핑 대상으로 취급하게 됩니다. 이것은 실제 문제가 될 수 있습니다:


// 만약 데이터에 { container: '...' }가 들어오면?
// → cssSelectors['container']로 컨테이너 요소를 찾고 textContent를 덮어씀
현재는 데이터에 container 같은 key가 안 들어오니까 문제가 없지만, 방어가 코드가 아닌 관례에 의존하고 있습니다.

4. 종합 판단

설계 원칙 (key 공유)         → ✅ 합당하다
구현 (renderData 루프)       → ✅ 깔끔하다
문서 예시 (ack 처리)         → ⚠️  설계 원칙과 불일치
방어 수준 (예약 key 보호)    → ⚠️  관례 의존 (현 규모에서는 수용 가능)
key 공유 설계는 유지하되, 문서 예시에서 ack의 처리 흐름을 실제 동작과 일치시키는 것이 필요합니다. ack가 renderData가 아닌 updateItemState 경로로 관리된다면, datasetAttrs에서 빼거나 cssSelectors에 추가하여 설계 원칙과 실제 동작을 일치시켜야 합니다.

수정 방향에 대해 의견이 있으시면 말씀해 주세요.