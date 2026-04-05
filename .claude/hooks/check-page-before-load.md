# check-page-before-load.sh

## 무엇을 검사하는가

page before_load.js에서 두 가지를 검사한다.

1. **DOM 조작 키워드 차단** — `innerHTML`, `appendChild`, `createElement`가 있으면 위반
2. **필수 패턴 존재 확인** — `pageEventBusHandlers` 또는 `onEventBusHandlers`가 없으면 위반

## 왜 DOM 조작이 안 되는가

before_load.js는 컴포넌트 register **이전에** 실행된다. 이 시점에서 컴포넌트의 DOM이 아직 완성되지 않았을 수 있다. DOM을 조작하면 타이밍 의존 버그가 발생한다.

before_load.js의 유일한 역할은 이벤트 핸들러를 미리 등록하는 것이다. 컴포넌트가 나중에 emit할 이벤트를 받을 준비를 하는 것이지, DOM을 직접 건드리는 것이 아니다.
