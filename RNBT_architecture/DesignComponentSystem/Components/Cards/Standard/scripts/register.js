/**
 * Cards — Standard
 *
 * 목적: 하나의 주제에 대한 콘텐츠와 액션을 하나의 컨테이너에 담아 표시한다
 * 기능: FieldRenderMixin으로 카드 본문 렌더링 + ListRenderMixin으로 액션 버튼 렌더링 + 클릭 이벤트
 *
 * Mixin: FieldRenderMixin + ListRenderMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 — 반드시 먼저
// ======================

applyFieldRenderMixin(this, {
    cssSelectors: {
        card:       '.card',
        icon:       '.card__icon',
        headline:   '.card__headline',
        subhead:    '.card__subhead',
        supporting: '.card__supporting'
    }
});

applyListRenderMixin(this, {
    cssSelectors: {
        container:   '.card__actions',
        template:    '#card-action-template',
        actionid:    '.card__action',
        actionLabel: '.card__action-label',
        actionIcon:  '.card__action-icon'
    },
    itemKey: 'actionid',
    datasetAttrs: {
        actionid: 'actionid'
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    cardInfo:    [this.fieldRender.renderData],
    cardActions: [this.listRender.renderData]
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
        [this.fieldRender.cssSelectors.card]:     '@cardClicked',
        [this.listRender.cssSelectors.actionid]:  '@cardActionClicked'
    }
};

bindEvents(this, this.customEvents);
