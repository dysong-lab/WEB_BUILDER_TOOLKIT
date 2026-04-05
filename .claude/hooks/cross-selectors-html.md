# cross-selectors-html.sh

## 무엇을 검사하는가

register.js의 cssSelectors와 views/*.html을 교차 비교한다. (2D만, 3D 제외)

1. cssSelectors 객체의 값(`.class-name`, `#id`)이 HTML에 존재하는지
2. `applyListRenderMixin` 사용 시 HTML에 `<template>` 태그가 있는지

## 왜 선택자가 HTML에 있어야 하는가

Mixin은 cssSelectors 계약을 통해 HTML에 접근한다. `{ status: '.card__status' }`는 "데이터의 status 필드를 .card__status 요소에 넣겠다"는 선언이다.

HTML에 `.card__status`가 없으면 Mixin이 `querySelector('.card__status')`를 실행할 때 null을 반환한다. 그 다음 줄에서 `el.textContent = data.status`를 시도하면 런타임 TypeError가 발생한다.

이것은 디자인 변경 시 가장 흔한 버그다 — HTML에서 클래스명을 바꾸고 register.js의 cssSelectors를 업데이트하지 않은 경우.

## 왜 ListRenderMixin에 template이 필수인가

ListRenderMixin은 `<template>` 태그를 찾아 `cloneNode`로 복제하여 목록 아이템을 생성한다. template이 없으면 리스트가 아예 렌더링되지 않는다.
