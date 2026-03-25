# 컴포넌트 가이드

## 컴포넌트를 만드는 기준

**"이 컴포넌트의 시각적 형태가 무엇인가."**

시각적 형태가 기존 컴포넌트와 다르면 새 컴포넌트다. 같으면 기존 컴포넌트의 디자인 변형(views/styles)으로 추가한다.

기능(Mixin)은 컴포넌트를 나누는 기준이 아니다. 같은 Mixin을 사용하더라도 시각적 형태가 다르면 다른 컴포넌트다.

---

## 분류 체계

대분류는 시각적 형태, 소분류는 용도를 구분한다.

```
Components/
├── [시각적 형태]/
│   └── [용도]/
│       ├── views/
│       ├── styles/
│       ├── scripts/
│       └── preview/
```

---

## 컴포넌트 구조

```
ComponentName/
├── views/              디자인 변형별 HTML
│   ├── 01_standard.html
│   └── 02_compact.html
├── styles/             디자인 변형별 CSS
│   ├── 01_standard.css
│   └── 02_compact.css
├── scripts/            조립 코드 (디자인 불변)
│   ├── register.js
│   └── beforeDestroy.js
└── preview/            디자인별 독립 확인용
    ├── 01_standard.html
    └── 02_compact.html
```

scripts/는 디자인이 달라져도 변하지 않는다. 약속된 선택자만 HTML에 유지하면 된다.

---

## 디자인 변형의 조건

같은 register.js로 여러 디자인이 동작한다. 조건:

- cssSelectors의 VALUE에 해당하는 요소가 HTML에 존재할 것
- datasetAttrs의 VALUE에 해당하는 data-* 속성이 HTML에 존재할 것

---

## 현재 컴포넌트 목록

아직 등록된 컴포넌트가 없다. 컴포넌트가 추가되면 여기에 기록한다.

> 예제 컴포넌트는 [Examples/SimpleDashboard/](/RNBT_architecture/DesignComponentSystem/Examples/SimpleDashboard/) 참조
