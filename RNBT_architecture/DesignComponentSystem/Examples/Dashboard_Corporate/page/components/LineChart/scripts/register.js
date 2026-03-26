/**
 * LineChart — Dashboard Corporate
 *
 * 팔레트: warm(#c4553a), olive(#7a8b6f)
 * 폰트: DM Sans
 */

const palette = {
    warm: '#c4553a', olive: '#7a8b6f',
    text: '#2c2c2c', muted: '#b0aa9f', line: '#e8e6e1'
};
const chartFont = { fontFamily: 'DM Sans' };

applyEChartsMixin(this, {
    cssSelectors: { container: '.chart__canvas' },
    option: {
        grid: { top: 40, right: 20, bottom: 32, left: 48 },
        xAxis: { type: 'category', axisLine: { lineStyle: { color: palette.line } },
                 axisLabel: { color: palette.muted, fontSize: 11, ...chartFont },
                 axisTick: { show: false } },
        yAxis: { type: 'value', splitLine: { lineStyle: { color: palette.line, type: 'dashed' } },
                 axisLabel: { color: palette.muted, fontSize: 11, ...chartFont },
                 axisLine: { show: false }, axisTick: { show: false } },
        series: [
            { name: 'CPU', type: 'line', smooth: 0.4, symbol: 'none', color: palette.warm, lineStyle: { width: 2.5 } },
            { name: 'Memory', type: 'line', smooth: 0.4, symbol: 'none', color: palette.olive, lineStyle: { width: 2.5 } }
        ],
        tooltip: { trigger: 'axis', backgroundColor: palette.text, borderWidth: 0,
                   textStyle: { color: '#fffffe', fontSize: 12, ...chartFont } },
        legend: { data: ['CPU', 'Memory'], right: 0, top: 0, textStyle: { color: palette.muted, fontSize: 11, ...chartFont },
                  icon: 'roundRect', itemWidth: 12, itemHeight: 3 }
    }
});

this.subscriptions = {
    dashboard_lineChart: [this.echarts.renderData]
};

Object.entries(this.subscriptions).forEach(([topic, handlers]) =>
    handlers.forEach(handler => GlobalDataPublisher.subscribe(topic, this, handler))
);
