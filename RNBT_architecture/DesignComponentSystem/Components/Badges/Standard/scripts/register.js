/**
 * Badges — Standard
 *
 * 목적: 알림 수/카운트/상태 정보를 배지로 표시한다
 * 기능: FieldRenderMixin으로 배지 값 렌더링 + Small/Large 모드 전환
 *
 * Mixin: FieldRenderMixin
 */
const { subscribe } = GlobalDataPublisher;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용 + 자체 메서드 정의
// ======================

applyFieldRenderMixin(this, {
    cssSelectors: {
        badge: '.badge',
        label: '.badge__label'
    }
});

this.updateBadge = function({ response: data }) {
    if (!data) return;

    const badgeEl = this.appendElement.querySelector(this.fieldRender.cssSelectors.badge);
    if (!badgeEl) return;

    const count = data.count;
    const hasCount = count !== undefined && count !== null && count > 0;

    if (hasCount) {
        badgeEl.classList.remove('badge--small');
        badgeEl.classList.add('badge--large');
        const displayValue = count > 99 ? '99+' : String(count);
        this.fieldRender.renderData({ response: { label: displayValue } });
    } else {
        badgeEl.classList.remove('badge--large');
        badgeEl.classList.add('badge--small');
        this.fieldRender.renderData({ response: { label: '' } });
    }
};

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    badgeInfo: [this.updateBadge]
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

// 없음 (정보 표시 전용)
