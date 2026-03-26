# cssSelectors / datasetAttrs — 규약 틀로서의 이해

## 1. 본질: 바인딩 규약이지 시각적 제약이 아니다

cssSelectors와 datasetAttrs는 **"Mixin이 특정 모양을 가져야 한다"는 의미가 아니다.**
데이터와 디자인(HTML)을 연결하기 위해 존재하는 **규약 틀**이다.

```
cssSelectors / datasetAttrs가 강제하는 것:

  ✗ 레이아웃, 크기, 색상, 위치
  ✗ Mixin의 활용 방식
  ○ "이 이름의 연결점이 존재한다"는 사실만
```

### 근거: renderData의 실제 동작

```javascript
// FieldRenderMixin.js:64-80
Object.entries(data).forEach(([key, value]) => {
    if (datasetAttrs[key]) {
        const attr = datasetAttrs[key];
        const dataEl = instance.appendElement.querySelector('[data-' + attr + ']');
        if (dataEl) dataEl.dataset[attr] = value;
    }
    if (cssSelectors[key]) {
        const el = instance.appendElement.querySelector(cssSelectors[key]);
        if (el) el.textContent = value;
    }
});
```

레이아웃, 크기, 색상에 대한 코드는 없다.
순수하게 "데이터 → DOM 연결"만 수행한다.

### 실증: 같은 규약, 다른 디자인

EventLog 컴포넌트는 동일한 cssSelectors/datasetAttrs 정의로
01_list, 02_timeline, 03_table 세 가지 완전히 다른 시각적 디자인을 구현한다.
규약이 모양을 결정하지 않는다는 직접적 증거다.

---

## 2. 양방향 자유: 디자인도 자유, Mixin도 자유

### 디자인(HTML/CSS) 쪽의 자유

약속된 선택자만 HTML에서 유지하면, 나머지 디자인은 완전히 자유다.

- Grid, Flexbox, 어떤 레이아웃이든 가능
- 색상, 타이포그래피, 간격 모두 독립적
- 카드, 리스트, 테이블 어떤 형태든 가능

### Mixin(JS) 쪽의 자유

9개 Mixin이 cssSelectors/datasetAttrs를 각각 다르게 활용한다:

| 패턴 | Mixin | 활용 방식 |
|------|-------|----------|
| 모든 key를 순회하며 매핑 | FieldRender, ListRender, StatefulListRender | textContent + dataset |
| container key만 사용 | ECharts, Tabulator, HeatmapJs | 렌더링 대상 위치만 |
| template key만 사용 | ShadowPopup | Shadow DOM 쿼리용 |
| 아예 사용 안 함 | CameraFocus, MeshState | 별도 옵션 체계 사용 |

같은 cssSelectors라는 이름을 받아도 Mixin마다 어떤 key를 쓸지, 어떻게 쓸지가 완전히 다르다.

---

## 3. data의 key가 연결의 축이다

FieldRenderMixin과 StatefulListRenderMixin에서 데이터 흐름의 핵심은:

```
data의 모든 key를 순회
  → datasetAttrs에 있으면 dataset 반영
  → cssSelectors에 있으면 textContent 반영
  → 양쪽 다 있으면 양쪽 다 반영
  → 양쪽 다 없으면 무시
```

**data의 key 하나가 cssSelectors와 datasetAttrs 양쪽을 동시에 조회한다.**
따라서 key를 어떻게 배치하느냐에 따라 데이터 라우팅이 결정된다.

### 패턴 A: 같은 key로 양쪽 동시 반영

```javascript
// data: { severity: 'critical' }
cssSelectors:  { severity: '.event-severity' }   // → textContent = 'critical'
datasetAttrs:  { severity: 'severity' }           // → dataset.severity = 'critical'
```

하나의 데이터 값이 "표시"와 "상태 스타일링" 양쪽에 동시 반영된다.

### 패턴 B: key를 분리하여 역할 분담

```javascript
// data: { severity: 'warning', severityLabel: '경고' }
cssSelectors:  { severityLabel: '.event-severity' }  // → textContent = '경고'
datasetAttrs:  { severity: 'severity' }               // → dataset.severity = 'warning'
```

표시용 텍스트와 스타일링용 상태값을 분리한다.

### 패턴 C: datasetAttrs만 단독 사용

```javascript
// data: { machineStatus: 'running', alarmGrade: 'high' }
cssSelectors:  { /* machineStatus 없음 */ }
datasetAttrs:  { machineStatus: 'status', alarmGrade: 'alarm' }
```

텍스트 표시 없이 상태 속성만 설정한다.

---

## 4. `{ severity: 'severity' }` — 같은 값 할당의 의의

datasetAttrs에서 key와 value에 같은 값을 할당하는 패턴:

```javascript
datasetAttrs: {
    severity: 'severity',
    ack:      'ack'
}
```

이것은 단순 반복이 아니다. **key와 value가 서로 다른 세계에 속하기 때문이다.**

### key와 value는 역할이 다르다

```
datasetAttrs: { severity: 'severity' }
                ────────   ─────────
                   │           │
                   │           └─ HTML 세계: data-severity="" 속성을 찾는 선택자
                   │              → querySelector('[data-severity]')
                   │              → el.dataset.severity = value
                   │
                   └─ JavaScript 세계: data 객체에서 값을 꺼내는 key
                      → data.severity
```

- **좌변(key)**: data 객체의 필드명 — API 응답 구조에 의해 결정
- **우변(value)**: HTML의 data-* 속성명 — 퍼블리싱 마크업에 의해 결정

이 둘이 같다는 것은 **우연의 일치이거나 의도적 정렬**이지, 본질적으로 같은 것이 아니다.

### 같은 값이 아닐 때: 변환이 일어난다

```javascript
datasetAttrs: {
    machineStatus: 'status',    // API에서는 machineStatus, HTML에서는 data-status
    alarmGrade:    'alarm'      // API에서는 alarmGrade, HTML에서는 data-alarm
}
```

API 스펙과 HTML 마크업이 다른 명명 규칙을 쓸 때,
datasetAttrs가 그 **번역 테이블** 역할을 한다.

### 같은 값일 때: 번역 없이 직통 연결

```javascript
datasetAttrs: {
    severity: 'severity'       // API key === HTML 속성명 — 변환 불필요
}
```

"이 데이터 필드는 HTML 속성과 이름이 같으니 그대로 연결한다"는 **명시적 선언**이다.

### 빈 값(`''`)이 아닌 같은 값을 쓰는 이유

```javascript
// ❌ 빈 값 — 현재 코드에서 동작하지 않음 (falsy 체크에 걸림)
datasetAttrs: { severity: '' }
// if (datasetAttrs[key]) → '' 은 falsy → 블록 진입 불가

// ✅ 같은 값 — 명시적이고 정상 동작
datasetAttrs: { severity: 'severity' }
// if (datasetAttrs[key]) → 'severity' 은 truthy → 정상 진입
```

같은 값 할당은:
1. **Mixin 코드 수정 없이** 동작한다
2. 읽는 사람이 **"API key를 그대로 HTML 속성으로 쓴다"**는 의도를 즉시 파악한다
3. 나중에 HTML 속성명을 바꿔야 할 때 **value만 수정**하면 된다

---

## 5. 종합: cssSelectors / datasetAttrs의 정체

```
cssSelectors / datasetAttrs는:

  ┌─ 디자인에게 → 모양을 강제하지 않는다
  ├─ Mixin에게  → 활용 방식을 강제하지 않는다
  └─ 양쪽 사이에서 → 연결점의 이름만 약속한다

  그리고 그 약속 안에서:

  ┌─ key 배치로 데이터 라우팅을 결정하고
  ├─ key와 value가 같으면 직통 연결
  ├─ key와 value가 다르면 이름 변환
  └─ key가 한쪽에만 있으면 단방향 반영

  = 데이터와 DOM 사이의 라우팅 테이블
```
