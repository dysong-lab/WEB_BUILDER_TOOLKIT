# Mixin 명세서: [MixinName]

---

## 1. 기능 정의

| 항목 | 내용 |
|------|------|
| **목적** | (보편화된 행위. "어떻게?"에 대한 답이 복수이면 아직 목적이다) |
| **기능** | (목적 + 수단의 결합. 한 문장으로 기술) |

> 참고: 기능의 정의는 [COMPONENT_SYSTEM_DESIGN.md — 기능의 정의](../architecture/COMPONENT_SYSTEM_DESIGN.md#기능의-정의) 참조

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

| 옵션 | 타입 | 필수 | 기본값 | 의미 |
|------|------|------|--------|------|
| | | | | |

> cssSelectors/datasetAttrs 외에 Mixin이 받는 옵션이 있으면 기재. 없으면 이 섹션 삭제.
> **타입** 컬럼에는 `string`, `number`, `boolean`, `hex`, `THREE.Vector3`, `(shadowRoot) => void` 같은 구체 타입을 기재. 함수/콜백이면 시그니처 전체.

---

## 3. renderData 기대 데이터

### 데이터 형태

```
(플랫 객체 / 배열 / 라이브러리 옵션 객체 등)
```

### 예시

```javascript
// renderData({ response: ??? })에 전달되는 response의 형태:

```

### KEY 매칭 규칙

```
(data의 KEY가 cssSelectors/datasetAttrs의 KEY와 어떻게 매칭되는지 기술.
 직접 매칭인지, 라이브러리에 위임하는지 등)
```

> Mixin이 `renderData`를 주입하지 않으면(명령형 Mixin) 이 섹션은 "해당 없음"으로 기재하거나 섹션 전체를 삭제.

---

## 4. 주입 네임스페이스

### 네임스페이스 이름

`this.___`

### 메서드/속성 (요약)

한 줄 역할 요약용 스캔 테이블. 상세 파라미터/반환은 섹션 5에서 기술.

| 속성/메서드 | 역할 |
|------------|------|
| `cssSelectors` | |
| `datasetAttrs` | |
| `renderData({ response })` | |
| `destroy()` | |

---

## 5. 메서드 입력 포맷

> 섹션 4의 각 메서드가 받는 파라미터와 반환값을 상세 기술.
> 단순 파라미터(원시 타입·boolean·수치 등)는 **시그니처 표**로, 중첩 객체·콜백·라이브러리 옵션은 **서브섹션**으로.

### 5.1 단순 시그니처

| 메서드 | 파라미터 | 타입 | 필수 | 기본값 | 의미 | 반환 |
|--------|----------|------|------|--------|------|------|
| `highlight` | meshName | string | ✓ | — | `instance.appendElement.getObjectByName`으로 조회되는 메시 이름 | `void` |
| `isHighlighted` | meshName | string | ✓ | — | — | `boolean` |
| `clearAll` | — | — | — | — | 모든 강조 해제 | `void` |

> 표의 `반환` 컬럼은 `void`, `boolean`, `Promise<void>`, `{ x, y, z }` 등 구체 타입으로 기재.
> 파라미터가 없으면 나머지 컬럼은 `—`.

### 5.2 복합 객체 파라미터

중첩 객체·콜백·라이브러리 옵션은 각 메서드별 서브섹션으로 기술.

#### `bindPopupEvents(events)`

**파라미터**

- `events` (object, 필수) — 이벤트 맵.

**`events` 형태**

```javascript
{
    [eventType]: {      // 'click' | 'mouseover' | 'input' | ...
        [selector]: handler | '@eventBusTopic'
    }
}
```

- `handler` (function): `(event) => void` — 실제 Mixin 구현의 시그니처를 **반드시 `.js` 소스에서 확인 후 기재** (인자 개수/순서 추측 금지)
- `'@...'` 문자열: Weventbus 토픽으로 전파. `customEvents`와 동일한 규약.

**반환**: `void`

**비고**: `show()` 전에 호출해도 된다. Shadow DOM 생성 전엔 내부에 보관했다가 최초 `show()` 시 자동 바인딩 (lazy).

---

## 6. destroy 범위

```
(Mixin이 생성한 것 중 destroy에서 정리하는 것을 나열)

-
-
-
```

---

## 7. 사용 예시 (선택)

### HTML

```html

```

### register.js

```javascript

```

---
