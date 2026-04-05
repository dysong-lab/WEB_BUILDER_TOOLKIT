# check-page-loaded.sh

## 무엇을 검사하는가

page loaded.js에서 두 가지를 검사한다.

1. **DOM 조작 키워드 차단** — `innerHTML`, `appendChild`, `createElement`, `querySelector`가 있으면 위반
2. **필수 패턴 존재 확인** — `pageDataMappings` 또는 `registerMapping`이 없으면 위반

## 왜 DOM 조작이 안 되는가

페이지의 역할은 오케스트레이션이다. 어떤 데이터를 얼마나 자주 누구에게 보낼지만 결정한다.

페이지가 직접 `querySelector`로 DOM을 건드리면, 페이지가 컴포넌트의 내부 구조를 알게 된다. 컴포넌트의 HTML이 바뀔 때 페이지 코드도 수정해야 하고, 페이지와 컴포넌트 사이의 느슨한 결합이 깨진다.

페이지는 "데이터를 보내라"만 말하고, "어떻게 보여줄지"는 컴포넌트가 결정해야 한다.

## 왜 데이터 매핑이 필수인가

loaded.js는 컴포넌트 register 완료 후 실행된다. 이 시점에서 데이터 매핑을 정의하고 최초 데이터를 발행해야 컴포넌트가 데이터를 받을 수 있다. 데이터 매핑이 없으면 구독만 있고 발행이 없는 상태가 된다.
