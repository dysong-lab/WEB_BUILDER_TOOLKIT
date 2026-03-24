# Mixin 명세서: [MixinName]

---

## 1. 기능 정의

| 항목 | 내용 |
|------|------|
| **목적** | (보편화된 행위. "어떻게?"에 대한 답이 복수이면 아직 목적이다) |
| **기능** | (목적 + 수단의 결합. 한 문장으로 기술) |

> 참고: 기능의 정의는 [COMPONENT_SYSTEM_DESIGN.md — 기능의 정의](COMPONENT_SYSTEM_DESIGN.md#기능의-정의) 참조

### 기존 Mixin과의 관계

| 항목 | 내용 |
|------|------|
| **목적이 같은 기존 Mixin** | (있으면 기재. 없으면 "없음") |
| **기능의 차이** | (기존 Mixin과 기능이 어떻게 다른지. 같으면 별도 Mixin이 불필요) |

---

## 2. 인터페이스

### cssSelectors

| KEY | 종류 | 의미 |
|-----|------|------|
| | 규약 | |
| | 규약 | |
| | 사용자 정의 | |

> **규약 KEY**: Mixin 내부에서 직접 참조하는 KEY. 반드시 정의해야 한다.
> **사용자 정의 KEY**: Mixin이 개별적으로 알지 못하고 일괄 순회하여 소비하는 KEY.

### datasetAttrs

| KEY | 종류 | 의미 |
|-----|------|------|
| | 규약 | |
| | 사용자 정의 | |

### 기타 옵션

| 옵션 | 필수 | 의미 |
|------|------|------|
| | | |

> cssSelectors/datasetAttrs 외에 Mixin이 받는 옵션이 있으면 기재. 없으면 이 섹션 삭제.

---

## 3. renderData 기대 데이터

### 데이터 형태

```
(플랫 객체 / 배열 / 라이브러리 옵션 객체 등)
```

### 예시

```javascript
// renderData({ response: { data: ??? } })에 전달되는 data의 형태:

```

### KEY 매칭 규칙

```
(data의 KEY가 cssSelectors/datasetAttrs의 KEY와 어떻게 매칭되는지 기술.
 직접 매칭인지, 라이브러리에 위임하는지 등)
```

---

## 4. 주입 네임스페이스

### 네임스페이스 이름

`this.___`

### 메서드/속성

| 속성/메서드 | 역할 |
|------------|------|
| `cssSelectors` | |
| `datasetAttrs` | |
| `renderData({ response })` | |
| `destroy()` | |

---

## 5. destroy 범위

```
(Mixin이 생성한 것 중 destroy에서 정리하는 것을 나열)

-
-
-
```

---

## 6. 사용 예시 (선택)

### HTML

```html

```

### register.js

```javascript

```

---
