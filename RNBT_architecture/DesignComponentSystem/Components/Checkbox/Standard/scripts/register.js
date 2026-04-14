/**
 * Checkbox — Standard
 *
 * 목적: 복수 선택을 위한 체크박스 목록 (tri-state: true / false / indeterminate)
 * 기능: ListRenderMixin으로 체크박스 항목 렌더링 + 클릭 이벤트
 *
 * Mixin: ListRenderMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyListRenderMixin(this, {
    cssSelectors: {
        container: '.checkbox__list',
        template:  '#checkbox-item-template',
        checkid:   '.checkbox__item',
        checked:   '.checkbox__item',
        disabled:  '.checkbox__item',
        label:     '.checkbox__label'
    },
    itemKey: 'checkid',
    datasetAttrs: {
        checkid:  'checkid',
        checked:  'checked',
        disabled: 'disabled'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    checkboxItems: [this.listRender.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

// ======================
// 3. 이벤트 매핑
// ======================

this.customEvents = {
    click: {
        [this.listRender.cssSelectors.checkid]: '@checkboxClicked'
    }
};

bindEvents(this, this.customEvents);
