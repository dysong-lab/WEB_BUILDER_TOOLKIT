/**
 * Charts — LineChart
 *
 * 목적: 운영 지표 추세를 선 그래프로 시각화한다
 * 기능: EChartsMixin으로 카테고리 기반 2개 시리즈 line chart를 렌더링한다
 *
 * Mixin: EChartsMixin
 */
const { subscribe } = GlobalDataPublisher;
const { bindEvents } = Wkit;
const { each, go } = fx;

const color = {
    sub: 'rgba(205, 225, 255, 0.62)',
    line: 'rgba(205, 225, 255, 0.12)',
    primary: '#78b7ff',
    secondary: '#a6ffd5',
    tooltip: '#08111d'
};

applyEChartsMixin(this, {
    cssSelectors: {
        container: '.line-chart__canvas'
    },
    option: {
        animationDuration: 500,
        grid: { top: 16, right: 8, bottom: 12, left: 8, containLabel: true },
        tooltip: {
            trigger: 'axis',
            backgroundColor: color.tooltip,
            borderWidth: 0,
            textStyle: { color: '#ffffff', fontFamily: 'SUIT' }
        },
        legend: { show: false },
        xAxis: {
            type: 'category',
            axisLine: { lineStyle: { color: color.line } },
            axisTick: { show: false },
            axisLabel: { color: color.sub, fontSize: 12, fontFamily: 'SUIT' }
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { color: color.line } },
            axisLabel: { color: color.sub, fontSize: 11, fontFamily: 'SUIT' }
        },
        series: [
            {
                name: 'Inbound',
                type: 'line',
                smooth: 0.45,
                symbol: 'none',
                lineStyle: { width: 3, color: color.primary }
            },
            {
                name: 'Outbound',
                type: 'line',
                smooth: 0.45,
                symbol: 'none',
                lineStyle: { width: 3, color: color.secondary }
            }
        ]
    }
});

this.subscriptions = {
    chartData: [this.echarts.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => subscribe(topic, this, handler), handlers)
    )
);

this.customEvents = {};
bindEvents(this, this.customEvents);
