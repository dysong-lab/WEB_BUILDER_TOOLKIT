/**
 * GaugeChart — Dashboard Corporate
 */

const palette = {
    warm: '#c4553a', neutral: '#d4d0c8',
    text: '#2c2c2c', muted: '#b0aa9f', line: '#e8e6e1'
};

applyEChartsMixin(this, {
    cssSelectors: { container: '.chart__canvas' },
    option: {
        series: [{
            type: 'gauge', min: 0, max: 100, startAngle: 200, endAngle: -20,
            progress: { show: true, width: 14, itemStyle: { color: palette.warm } },
            axisLine: { lineStyle: { width: 14, color: [[1, palette.line]] } },
            axisTick: { show: false },
            splitLine: { length: 8, lineStyle: { color: palette.neutral, width: 1 } },
            axisLabel: { distance: 20, color: palette.muted, fontSize: 10, fontFamily: 'DM Sans' },
            pointer: { show: false },
            title: { offsetCenter: [0, '30%'], color: palette.muted, fontSize: 12, fontFamily: 'DM Sans' },
            detail: { valueAnimation: true, offsetCenter: [0, '0%'], formatter: '{value}%',
                      fontSize: 28, fontWeight: 600, fontFamily: 'DM Sans', color: palette.text }
        }]
    },
    mapData: function(data, option) { option.series[0].data = [{ value: data.value, name: data.name }]; return option; }
});

this.subscriptions = {
    dashboard_gauge: [this.echarts.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => GlobalDataPublisher.subscribe(topic, this, handler), handlers)
    )
);
