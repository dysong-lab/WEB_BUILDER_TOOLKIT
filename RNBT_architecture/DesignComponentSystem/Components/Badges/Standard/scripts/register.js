/**
 * Badges — Standard
 *
 * 목적: 카운트와 상태를 배지 형태로 표시한다
 * 기능: FieldRenderMixin으로 count를 렌더링하고 size/visible 상태를 동기화한다
 *
 * Mixin: FieldRenderMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

applyFieldRenderMixin(this, {
    cssSelectors: {
        anchor: '.badge-anchor',
        badge: '.badge',
        count: '.badge__count'
    }
});

this.normalizeBadgeCount = function(count) {
    if (count === null || count === undefined || count === '' || count === 0 || count === '0') {
        return { visible: false, text: '' };
    }

    const numericCount = Number(count);
    if (!Number.isNaN(numericCount)) {
        return {
            visible: true,
            text: numericCount > 99 ? '99+' : String(numericCount)
        };
    }

    const textCount = String(count).trim();
    if (!textCount) return { visible: false, text: '' };

    return {
        visible: true,
        text: textCount.length > 4 ? textCount.slice(0, 4) : textCount
    };
};

this.renderBadgeInfo = function({ response: data }) {
    const badge = this.appendElement.querySelector(this.fieldRender.cssSelectors.badge);
    if (!badge) return;

    const normalized = this.normalizeBadgeCount(data?.count);
    const size = data?.size === 'small' ? 'small' : 'large';

    this.fieldRender.renderData({
        response: {
            count: size === 'small' ? '' : normalized.text
        }
    });

    badge.dataset.size = size;
    badge.dataset.visible = normalized.visible ? 'true' : 'false';
    badge.setAttribute('aria-hidden', normalized.visible ? 'false' : 'true');

    if (normalized.visible) {
        badge.setAttribute('aria-label', `Badge ${normalized.text}`);
    } else {
        badge.removeAttribute('aria-label');
    }
};

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    badgeInfo: [this.renderBadgeInfo]
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
        [this.fieldRender.cssSelectors.anchor]: '@badgeClicked'
    }
};
bindEvents(this, this.customEvents);
