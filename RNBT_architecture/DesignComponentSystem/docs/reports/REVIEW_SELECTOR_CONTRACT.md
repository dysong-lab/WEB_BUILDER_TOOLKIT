# 선택자 계약의 역할과 설계 합당성

> **작성일**: 2026-03-28 | **관점**: 설계 근거 분석 | **대상**: cssSelectors/datasetAttrs의 역할, 분리의 합당성

---

■ cssSelectors — "어떤 요소에"

  역할: 대상 요소를 찾는다. querySelector의 인자다.

  register.js에서:
    cssSelectors: {
        statusLabel: '.system-info__status',
        version:     '.system-info__version'
    }

  Mixin 내부에서:
    const el = instance.appendElement.querySelector(cssSelectors[key]);
    //                                              ↑ '.system-info__status'

  cssSelectors가 없으면 Mixin은 요소를 찾을 수 없다.
  이것이 유일한 역할이다.

■ datasetAttrs — "어떻게 넣을지"

  역할: "이 key는 textContent가 아니라 data-* 속성으로 넣어라"라는 분기 신호다.

  register.js에서:
    datasetAttrs: {
        status: 'status'
    }

  Mixin 내부에서:
    if (datasetAttrs[key]) {
        el.setAttribute('data-' + datasetAttrs[key], value);
        // → data-status="RUNNING"
    } else {
        el.textContent = value;
        // → "정상"
    }

  datasetAttrs가 없으면 모든 값은 textContent로 들어간다.
  있으면 해당 key만 data-* 속성이 된다.

■ 두 객체가 협력하는 방식 — key 공유

  datasetAttrs 혼자서는 아무것도 할 수 없다.
  "data-status 속성을 설정하라"만으로는 부족하다.
  어떤 요소에? → cssSelectors의 같은 key가 알려준다.

  cssSelectors: { status: '.system-info__status' }
  datasetAttrs: { status: 'status' }
                  ↑ 같은 key

  1. cssSelectors['status'] → '.system-info__status' → 요소를 찾음
  2. datasetAttrs['status'] → 'status' → 그 요소에 data-status 설정

  key가 없으면?
  cssSelectors: { statusLabel: '.system-info__status' }
  datasetAttrs에 'statusLabel' 없음

  1. cssSelectors['statusLabel'] → 요소를 찾음
  2. datasetAttrs['statusLabel'] → undefined → textContent로 설정

■ 구체적인 데이터 흐름 (FieldRenderMixin 기준)

  데이터:
    { status: 'RUNNING', statusLabel: '정상', version: 'v2.4.1' }

  설정:
    cssSelectors: {
        statusLabel: '.system-info__status',   // 같은 요소를
        version:     '.system-info__version'
    }
    datasetAttrs: {
        status: 'status'                        // data-*로 넣어라
    }

  결과:
    key='status'      → cssSelectors에 없음(*)  → skip
    key='statusLabel' → 요소 찾음 → datasetAttrs에 없음 → textContent = '정상'
    key='version'     → 요소 찾음 → datasetAttrs에 없음 → textContent = 'v2.4.1'

  (*) status의 대상 요소가 필요하면 cssSelectors에도 추가해야 한다:
    cssSelectors: {
        status:      '.system-info__status',    // data-* 대상 요소
        statusLabel: '.system-info__status',    // textContent 대상 (같은 요소)
        version:     '.system-info__version'
    }
    datasetAttrs: {
        status: 'status'
    }

  이제:
    key='status'      → 요소 찾음 → datasetAttrs 있음 → data-status="RUNNING"
    key='statusLabel' → 같은 요소 → datasetAttrs 없음 → textContent = '정상'
    key='version'     → 다른 요소 → textContent = 'v2.4.1'

  DOM 결과:
    <span class="system-info__status" data-status="RUNNING">정상</span>
    <span class="system-info__version">v2.4.1</span>

  CSS가 data-status를 활용:
    [data-status="RUNNING"] { color: #22c55e; }
    [data-status="ERROR"]   { color: #ef4444; }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  이 구조는 분리를 위해 합당한가
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

■ 분리의 목표

  "같은 register.js로 디자인만 바꿀 수 있다"

  이것이 성립하려면:
    Mixin이 특정 HTML 구조를 모르는 상태에서 DOM을 조작할 수 있어야 한다.


■ cssSelectors가 이것을 가능하게 하는 방식

  Mixin 코드에 '.system-info__status'가 하드코딩되어 있으면
  HTML에서 이 클래스명을 바꾸면 깨진다.

  대신 register.js가 "이 선택자로 찾아라"고 알려준다:
    cssSelectors: { statusLabel: '.system-info__status' }

  Mixin은 cssSelectors[key]만 알면 된다.
  구체적인 '.system-info__status'는 모른다.

  → Mixin 코드에 디자인 종속성이 없다.


■ 그런데 register.js에는 선택자가 있지 않나?

  맞다. register.js에 '.system-info__status'가 있다.
  하지만 이것이 설계의 핵심이다:

  register.js = "계약서"
    "나는 이 선택자들을 제공할 테니, 너(Mixin)는 이걸 써라"

  HTML = "계약 이행"
    "약속한 선택자에 해당하는 요소가 존재한다"

  register.js가 불변인 이유:
    디자인 01_bar.html이든 02_card.html이든
    약속된 선택자(.system-info__status)만 유지하면
    HTML 구조와 CSS 스타일은 완전히 달라도 된다.

  바뀌는 것: HTML 구조, CSS 스타일
  안 바뀌는 것: 선택자 이름, register.js, Mixin 코드


■ datasetAttrs의 존재 이유

  textContent만으로도 데이터 표시는 가능하다.
  그런데 왜 data-* 속성이 필요한가?

  textContent: 사용자에게 보이는 텍스트
    → "정상", "v2.4.1"

  data-* 속성: CSS/JS가 반응하는 메타데이터
    → data-status="RUNNING" → CSS가 색상을 결정
    → data-severity="critical" → CSS가 배경색을 결정

  같은 요소에 "정상"이라는 텍스트와 "RUNNING"이라는 상태가
  동시에 필요한 상황이 있다. 이 둘은 역할이 다르다.

  datasetAttrs가 없다면?
    → 모든 값이 textContent가 됨
    → CSS가 상태에 따라 스타일을 바꿀 수 없음
    → JS로 직접 스타일을 조작해야 함
    → Mixin에 스타일 로직이 침투함 → 분리 붕괴


■ 결론: 합당한가

  cssSelectors: Mixin이 HTML을 직접 알지 않고 요소를 찾게 한다 → 필수
  datasetAttrs: 스타일 결정을 CSS에 위임하여 Mixin에 스타일이 침투하지 않게 한다 → 필수

  두 객체의 분리도 합당하다:
    cssSelectors = "어디에" (요소 위치)
    datasetAttrs = "어떻게" (표현 방식 분기)
    역할이 다르므로 별도 객체가 자연스럽다.

  이 구조 없이 분리를 달성하려면?
    Mixin이 요소를 직접 알거나, 스타일을 직접 조작해야 한다.
    어느 쪽이든 디자인 종속성이 생긴다.

  이 구조가 있으면:
    Mixin → cssSelectors/datasetAttrs만 안다 → 디자인 무관
    HTML → 약속된 선택자만 유지한다 → 구조/스타일은 자유
    CSS → data-*에 반응한다 → Mixin과 독립적으로 스타일 결정