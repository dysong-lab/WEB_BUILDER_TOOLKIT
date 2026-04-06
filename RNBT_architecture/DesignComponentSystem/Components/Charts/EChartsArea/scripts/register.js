/**
 * AreaChart 컴포넌트
 *
 * 목적: 데이터를 영역 차트로 시각화한다
 * 기능: EChartsMixin으로 차트를 렌더링한다 (line + areaStyle)
 *
 * Mixin: EChartsMixin
 * 데이터 규약: { categories: [...], values: [[...], [...]] }
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

// ======================
// 1. MIXIN 적용
// ======================

applyEChartsMixin(this, {
    cssSelectors: {
        container: '.chart__canvas'
    },
    option: {
        xAxis: { type: 'category' },
        yAxis: { type: 'value' },
        series: [
            { name: 'Series A', type: 'line', areaStyle: {}, smooth: true },
            { name: 'Series B', type: 'line', areaStyle: {}, smooth: true }
        ],
        tooltip: { trigger: 'axis' },
        legend: { data: ['Series A', 'Series B'] }
    }
});

// ======================
// 2. 구독 연결
// ======================

this.subscriptions = {
    areaChartData: [this.echarts.renderData]
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

this.customEvents = {};
bindEvents(this, this.customEvents);
