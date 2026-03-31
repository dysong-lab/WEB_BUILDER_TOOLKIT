# ListRenderMixin

## 설계 의도

배열 데이터를 template 기반으로 반복 렌더링한다.

배열의 각 항목을 HTML `<template>` 태그의 cloneNode로 생성하는 **N:N 생성** 패턴이다. FieldRenderMixin과 달리 DOM을 생성한다. HTML 구조는 template 태그 안에 정의되므로 JS에 HTML 문자열이 없다.

`itemKey` 옵션을 제공하면 **개별 항목의 상태 변경/조회** 기능이 활성화된다.

> **설계 원칙**: [COMPONENT_SYSTEM_DESIGN.md](../../docs/architecture/COMPONENT_SYSTEM_DESIGN.md) 참조
> **구독/이벤트/정리 패턴**: 설계 문서의 "라이프사이클" 참조

### FieldRenderMixin과의 차이

| | FieldRenderMixin | ListRenderMixin |
|---|---|---|
| 데이터 | 플랫 객체 1개 | 배열 N개 |
| DOM | 이미 존재하는 요소에 값 채움 | template에서 복제하여 생성 |
| 규약 KEY | — | container, template |

---

## 인터페이스

### cssSelectors

CSS 선택자로 HTML 요소를 참조한다.

| KEY | 종류 | 의미 |
|-----|------|------|
| `container` | 규약 | 항목이 추가될 부모 요소 |
| `template` | 규약 | `<template>` 태그 (cloneNode 대상) |

```javascript
cssSelectors: {
    container: '.event-log__list',           // 항목이 추가될 부모
    item:      '.event-log__item',           // 각 항목의 루트
    template:  '#event-log-item-template',   // cloneNode 대상
    level:     '.event-log__level',          // 로그 레벨 표시
    time:      '.event-log__time',           // 시간 표시
    message:   '.event-log__message',        // 메시지 표시
    clearBtn:  '.event-log__clear-btn'       // 이벤트 매핑 전용 (template 밖)
}
```

> **KEY의 두 종류:** `container`, `template`은 Mixin이 규약으로 요구하는 KEY다. Mixin 내부에서 직접 참조한다. 나머지(`item`, `level`, `time`, `message`, `clearBtn` 등)는 사용자 정의 KEY다. `item`은 Mixin 내부에서 참조하지 않지만, customEvents에서 항목 클릭 이벤트를 매핑할 때 `[this.listRender.cssSelectors.item]`으로 참조하기 때문에 등록한다. 사용자 정의 KEY가 없으면 template은 복제되지만 값은 채워지지 않는다.

### datasetAttrs (선택)

data-* 속성으로 설정할 키를 지정한다. 등록되지 않은 키는 textContent로 설정된다.

```javascript
datasetAttrs: {
    menuid: 'menuid',    // → el.setAttribute('data-menuid', value)
    active: 'active'     // → el.setAttribute('data-active', value)
}
```

### elementAttrs (선택)

요소 속성(src, fill 등)으로 설정할 키를 지정한다.

```javascript
elementAttrs: {
    icon: 'src'     // → el.setAttribute('src', value)
}
```

### styleAttrs (선택)

스타일 속성(width, height 등)으로 설정할 키를 지정한다.

```javascript
styleAttrs: {
    progress: { property: 'width', unit: '%' }   // → el.style.width = value + '%'
}
```

### itemKey (선택)

항목을 식별하는 키 이름. 이 옵션을 제공하면 `updateItemState`, `getItemState` 메서드가 활성화된다.

```javascript
itemKey: 'menuid'    // → cssSelectors.menuid 선택자로 항목을 찾음
```

### renderData가 기대하는 데이터

배열. 데이터의 KEY 이름과 cssSelectors의 KEY 이름이 같으면 매칭된다.
매칭된 KEY의 cssSelectors VALUE(선택자)로 요소를 찾고, 데이터 VALUE를 반영한다.

```javascript
// cssSelectors 정의:
cssSelectors: {
    container: '.event-log__list',     // ← 규약 KEY (Mixin이 내부 참조)
    template:  '#event-log-item-template', // ← 규약 KEY
    item:      '.event-log__item',     // ← 이벤트 매핑용
    level:     '.event-log__level',    // ← 데이터 KEY "level"과 매칭
    time:      '.event-log__time',     // ← 데이터 KEY "time"과 매칭
    message:   '.event-log__message'   // ← 데이터 KEY "message"와 매칭
}

// renderData에 전달되는 데이터:
[
    { level: 'ERROR', time: '14:30', message: 'Connection failed' }
]
//    ↑ KEY             ↑ KEY           ↑ KEY
//    ↓ 매칭            ↓ 매칭          ↓ 매칭
// cssSelectors.level  .time           .message
//    ↓                ↓               ↓
// querySelector('.event-log__level').textContent = 'ERROR'
// querySelector('.event-log__time').textContent = '14:30'
// querySelector('.event-log__message').textContent = 'Connection failed'
//
// container, template, item은 데이터에 없으므로 건너뜀
```

```javascript
// datasetAttrs 사용 시 — 등록된 키는 data-* 속성, 나머지는 textContent:

cssSelectors: {
    menuid: '.sidebar__item',      // ← 데이터 KEY "menuid"와 매칭
    active: '.sidebar__item',      // ← 데이터 KEY "active"와 매칭
    icon:   '.sidebar__item-icon', // ← 데이터 KEY "icon"과 매칭
    label:  '.sidebar__item-label' // ← 데이터 KEY "label"과 매칭
}
datasetAttrs: { menuid: 'menuid', active: 'active' }

// 데이터:
[
    { menuid: 'dashboard', active: 'true', icon: '📊', label: 'Dashboard' }
]
// → menuid: datasetAttrs에 있음 → data-menuid="dashboard"
// → active: datasetAttrs에 있음 → data-active="true"
// → icon:   datasetAttrs에 없음 → textContent = '📊'
// → label:  datasetAttrs에 없음 → textContent = 'Dashboard'
```

---

## 사용 예시

### 기본 사용 (단순 목록)

#### HTML

```html
<div class="event-log">
    <div class="event-log__header">
        <span class="event-log__title">Event Log</span>
        <button class="event-log__clear-btn">Clear</button>
    </div>
    <div class="event-log__list"></div>

    <template id="event-log-item-template">
        <div class="event-log__item">
            <span class="event-log__level" data-level=""></span>
            <span class="event-log__time"></span>
            <span class="event-log__message"></span>
        </div>
    </template>
</div>
```

#### register.js

```javascript
applyListRenderMixin(this, {
    cssSelectors: {
        container: '.event-log__list',
        item:      '.event-log__item',
        template:  '#event-log-item-template',
        level:     '.event-log__level',
        time:      '.event-log__time',
        message:   '.event-log__message',
        clearBtn:  '.event-log__clear-btn'
    }
});

this.subscriptions = {
    events: [this.listRender.renderData]
};
```

### 상태 관리 사용 (항목별 상태 변경/조회)

#### register.js

```javascript
applyListRenderMixin(this, {
    cssSelectors: {
        container: '.sidebar__menu',
        template:  '#sidebar-menu-item-template',
        menuid:    '.sidebar__item',
        active:    '.sidebar__item',
        icon:      '.sidebar__item-icon',
        label:     '.sidebar__item-label'
    },
    itemKey: 'menuid',
    datasetAttrs: {
        menuid: 'menuid',
        active: 'active'
    }
});

this.subscriptions = {
    menuItems: [this.listRender.renderData]
};

this.customEvents = {
    click: {
        [this.listRender.cssSelectors.menuid]: '@menuItemClicked'
    }
};
```

#### 페이지에서 상태 변경

```javascript
// 이벤트 핸들러에서
'@menuItemClicked': ({ targetInstance, event }) => {
    const id = event.target.closest('.sidebar__item')?.dataset.menuid;
    targetInstance.listRender.updateItemState(id, { active: 'true' });
}
```

---

## 주입되는 네임스페이스

`this.listRender`

| 속성/메서드 | 역할 | 조건 |
|------------|------|------|
| `cssSelectors` | 주입된 cssSelectors (customEvents에서 computed property로 참조) | 항상 |
| `datasetAttrs` | 주입된 datasetAttrs | 항상 |
| `elementAttrs` | 주입된 elementAttrs | 항상 |
| `styleAttrs` | 주입된 styleAttrs | 항상 |
| `renderData({ response })` | selector KEY에 맞춰진 배열을 받아 항목을 생성하여 렌더링 | 항상 |
| `clear()` | 컨테이너의 모든 항목을 제거 | 항상 |
| `destroy()` | Mixin이 주입한 모든 속성과 메서드를 정리 | 항상 |
| `updateItemState(id, state)` | 개별 항목의 data 속성을 변경 | itemKey 사용 시 |
| `getItemState(id)` | 개별 항목의 data 속성을 조회 (복사본 반환) | itemKey 사용 시 |

---

## template 태그의 약속

template 내부의 HTML 구조는 자유롭지만, **cssSelectors의 VALUE에 해당하는 요소**가 반드시 존재해야 한다.

```
01_list:   수직 리스트 (flex row)
02_table:  테이블 행 (grid columns)
03_bubble: 채팅 버블 (nested divs)

→ template 구조가 완전히 달라도 선택자만 유지하면 같은 Mixin이 동작
```

---

## 디자인 변형

같은 register.js로 HTML/CSS만 교체할 수 있다. 조건:

1. `container` VALUE에 해당하는 요소가 존재
2. `template` VALUE에 해당하는 `<template>` 태그가 존재
3. template 내부에 각 KEY의 VALUE에 해당하는 요소가 존재
4. `item` VALUE가 template 내부의 최상위 요소와 매칭
