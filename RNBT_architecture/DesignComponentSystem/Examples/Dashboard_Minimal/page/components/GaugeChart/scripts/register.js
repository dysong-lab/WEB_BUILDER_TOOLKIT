/**
 * GaugeChart — Dashboard Minimal
 */

const c = { dark: '#1d1d1f', light: '#d2d2d7', faint: '#f5f5f7' };

applyEChartsMixin(this, {
    cssSelectors: { container: '.chart__canvas' },
    option: {
        series: [{
            type: 'gauge', min: 0, max: 100, startAngle: 200, endAngle: -20,
            progress: { show: true, width: 8, itemStyle: { color: c.dark } },
            axisLine: { lineStyle: { width: 8, color: [[1, c.faint]] } },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { distance: 16, color: c.light, fontSize: 10, fontFamily: 'Instrument Sans' },
            pointer: { show: false },
            title: { show: false },
            detail: { valueAnimation: true, offsetCenter: [0, '0%'], formatter: '{value}%',
                      fontSize: 32, fontWeight: 600, fontFamily: 'Instrument Sans', color: c.dark }
        }]
    },
    mapData: function(data, option) { option.series[0].data = [{ value: data.value, name: data.name }]; return option; }
});

this.subscriptions = { dashboard_gauge: [this.echarts.renderData] };
go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => GlobalDataPublisher.subscribe(topic, this, handler), handlers)
    )
);
