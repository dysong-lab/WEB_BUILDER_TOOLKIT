/**
 * Charts — AreaChart
 *
 * 목적: 운영량 변화와 용량 추세를 면적 그래프로 시각화한다
 * 기능: EChartsMixin으로 카테고리 기반 2개 시리즈 area chart를 렌더링한다
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
    secondary: '#53d2a2',
    tooltip: '#08111d'
};

applyEChartsMixin(this, {
    cssSelectors: {
        container: '.area-chart__canvas'
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
                name: 'Capacity',
                type: 'line',
                smooth: 0.4,
                symbol: 'none',
                lineStyle: { width: 2.5, color: color.primary },
                areaStyle: { color: 'rgba(120, 183, 255, 0.22)' }
            },
            {
                name: 'Usage',
                type: 'line',
                smooth: 0.4,
                symbol: 'none',
                lineStyle: { width: 2.5, color: color.secondary },
                areaStyle: { color: 'rgba(83, 210, 162, 0.18)' }
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
