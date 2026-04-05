# check-register.sh

## 무엇을 검사하는가

register.js에서 두 가지를 검사한다.

1. **렌더링/fetch 키워드 차단** — `innerHTML`, `appendChild`, `createElement`, `fetch(`, `XMLHttpRequest`, `axios`가 있으면 위반
2. **필수 구조 존재 확인** — `apply*Mixin`과 `subscribe(`가 없으면 위반

## 왜 렌더링/fetch가 안 되는가

register.js는 조립 코드다. Mixin을 HTML에 연결하고, topic을 구독에 연결한다.

올바른 register.js는 **이름만** 안다:

```javascript
applyFieldRenderMixin(this, {
    cssSelectors: { status: '.card__status' }
});
```

`.card__status`가 `<span>`인지 `<div>`인지, 안에 아이콘이 있는지 — register.js는 모른다. 디자인이 바뀌어도 `.card__status`라는 약속만 유지되면 register.js는 수정할 필요가 없다.

register.js가 직접 렌더링하면 HTML 구조 지식이 JS에 박힌다. 디자인이 바뀔 때마다 JS도 수정해야 하고, 다른 디자인에서 재사용할 수 없다.

register.js가 직접 fetch하면 컴포넌트가 데이터 출처를 알게 된다. API 주소가 바뀌면 컴포넌트를 수정해야 하고, 같은 컴포넌트를 다른 데이터 소스에 연결할 수 없다.

## 왜 Mixin과 구독이 필수인가

Mixin이나 구독이 없으면 컴포넌트는 런타임 데이터를 받을 수 없다. 구독이 없으면 데이터를 받을 수 없다. 화면에 정적 HTML만 보이고 런타임 데이터는 영원히 도착하지 않는다.
