/**
 * TextFields — Standard
 *
 * 목적: 사용자가 단일 라인 텍스트를 UI에 입력할 수 있게 한다
 * 기능: FieldRenderMixin으로 라벨 / 입력값 / placeholder / leading&trailing icon /
 *      supporting / errorText / state(data-*) / required(data-*) 를 단일 객체로 반영
 *      + input / change / trailing 클릭 이벤트
 *
 * Mixin: FieldRenderMixin (단일)
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 — 반드시 먼저
// ======================

applyFieldRenderMixin(this, {
    cssSelectors: {
        root:         '.text-field',
        label:        '.text-field__label',
        leadingIcon:  '.text-field__leading',
        value:        '.text-field__input',
        placeholder:  '.text-field__input',
        trailingIcon: '.text-field__trailing',
        supporting:   '.text-field__supporting',
        errorText:    '.text-field__error',
        // dataset 반영 대상도 cssSelectors에 등록되어야 한다 (FieldRenderMixin이 querySelector로 요소를 찾기 때문)
        state:        '.text-field',
        required:     '.text-field'
    },
    elementAttrs: {
        value:       'value',
        placeholder: 'placeholder'
    },
    datasetAttrs: {
        state:    'state',
        required: 'required'
    }
});

// ======================
// 2. 구독 연결 — Mixin 메서드 참조 (함수 참조)
// ======================

this.subscriptions = {
    textField: [this.fieldRender.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑 — Mixin 선택자 computed property 참조
// ======================

this.customEvents = {
    input: {
        [this.fieldRender.cssSelectors.value]:        '@textFieldInput'
    },
    change: {
        [this.fieldRender.cssSelectors.value]:        '@textFieldChanged'
    },
    click: {
        [this.fieldRender.cssSelectors.trailingIcon]: '@textFieldTrailingClicked'
    }
};

bindEvents(this, this.customEvents);
