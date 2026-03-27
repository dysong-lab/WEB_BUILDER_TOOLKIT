/**
 * BarChart 컴포넌트
 *
 * 목적: 데이터를 보여준다
 * 기능: EChartsMixin으로 카테고리별 데이터를 막대 차트로 시각화한다
 *
 * Mixin: EChartsMixin
 * 데이터 규약: { categories: [...], values: [[...], [...]] }
 */


// ── 1. Mixin 적용 ──
applyEChartsMixin(this, {
    cssSelectors: {
        container: '.chart__canvas'
    },
    option: {
        xAxis: { type: 'category' },
        yAxis: { type: 'value' },
        series: [
            { name: 'Input', type: 'bar' },
            { name: 'Output', type: 'bar' }
        ],
        tooltip: { trigger: 'axis' },
        legend: { data: ['Input', 'Output'] }
    }
});

// ── 2. 구독 ──
this.subscriptions = {
    barChartData: [this.echarts.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => GlobalDataPublisher.subscribe(topic, this, handler), handlers)
    )
);
