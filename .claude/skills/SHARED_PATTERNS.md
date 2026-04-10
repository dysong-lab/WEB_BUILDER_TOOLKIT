# 스킬 공통 코드 패턴

실제 코드 작성 시 필요한 공통 패턴 모음이다.

## JS 공통 규칙

### 구조분해 응답

datasetName 기반 응답은 `{ response: data }` 형태로 받는다.

```javascript
ns.renderData = function({ response: data }) {
    // data 사용
};
```

### fx.go 파이프라인

```javascript
go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);
```

## register.js 구조

```text
1. Mixin 적용 / 자체 메서드 정의
2. 구독 연결
3. 이벤트 매핑
```

공통 규칙:

- DOM 접근은 cssSelectors 계약을 따른다.
- subscriptions는 함수 참조 배열을 사용한다.
- customEvents는 가능하면 Mixin selector를 computed property로 참조한다.

### subscriptions 패턴

```javascript
this.subscriptions = {
    systemInfo: [this.fieldRender.renderData]
};
```

### customEvents 패턴

```javascript
this.customEvents = {
    click: {
        [this.listRender.cssSelectors.item]: '@eventClicked'
    }
};
```

### Shadow DOM 내부 이벤트

ShadowPopupMixin을 쓰는 경우 `bindPopupEvents`를 사용한다.

## beforeDestroy 정리 순서

생성의 역순으로 정리한다.

```javascript
removeCustomEvents(this, this.customEvents);
this.customEvents = null;

go(
    Object.entries(this.subscriptions),
    each(([topic, _]) => unsubscribe(topic, this))
);
this.subscriptions = null;

this.fieldRender.destroy();
```

## 데이터 변환 원칙

- Mixin은 selector KEY에 맞춰진 데이터만 받는다.
- API 응답 키와 selector KEY가 다르면 Mixin 바깥에서 변환한다.
- 변환 메서드는 인스턴스 메서드로 정의하고 내부에서 Mixin 메서드를 호출한다.

```javascript
this.updateSystemInfo = function({ response: data }) {
    this.fieldRender.renderData({
        response: {
            name: data.hostname,
            status: data.status
        }
    });
};
```
