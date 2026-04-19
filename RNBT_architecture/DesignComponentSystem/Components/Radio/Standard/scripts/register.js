/**
 * Radio — Standard
 *
 * 목적: 옵션 세트에서 단일 선택을 위한 라디오 목록 (bi-state: true / false)
 * 기능: ListRenderMixin으로 라디오 항목 렌더링 + 클릭 이벤트
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
        container: '.radio__list',
        template:  '#radio-item-template',
        radioid:   '.radio__item',
        selected:  '.radio__item',
        disabled:  '.radio__item',
        label:     '.radio__label'
    },
    itemKey: 'radioid',
    datasetAttrs: {
        radioid:  'radioid',
        selected: 'selected',
        disabled: 'disabled'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    radioItems: [this.listRender.renderData]
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
        [this.listRender.cssSelectors.radioid]: '@radioClicked'
    }
};

bindEvents(this, this.customEvents);
