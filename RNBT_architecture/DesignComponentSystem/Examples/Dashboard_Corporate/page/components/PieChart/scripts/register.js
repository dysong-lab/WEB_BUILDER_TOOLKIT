/**
 * PieChart — Dashboard Corporate
 */

const palette = {
    warm: '#c4553a', sand: '#b0926a', olive: '#7a8b6f', slate: '#6b7a8d', neutral: '#d4d0c8',
    text: '#2c2c2c', muted: '#b0aa9f', bg: '#f8f7f4'
};

applyEChartsMixin(this, {
    cssSelectors: { container: '.chart__canvas' },
    option: {
        series: [{
            type: 'pie', radius: ['44%', '68%'], center: ['40%', '52%'],
            label: { show: true, formatter: '{b}', color: palette.muted, fontSize: 11, fontFamily: 'DM Sans' },
            labelLine: { lineStyle: { color: palette.neutral } },
            itemStyle: { borderColor: palette.bg, borderWidth: 3 }
        }],
        tooltip: { trigger: 'item', backgroundColor: palette.text, borderWidth: 0,
                   textStyle: { color: '#fffffe', fontSize: 12, fontFamily: 'DM Sans' } },
        color: [palette.warm, palette.sand, palette.olive, palette.slate, palette.neutral]
    },
    mapData: function(data, option) { option.series[0].data = data.items; return option; }
});

this.subscriptions = {
    dashboard_pieChart: [this.echarts.renderData]
};

go(
    Object.entries(this.subscriptions),
    each(([topic, handlers]) =>
        each(handler => GlobalDataPublisher.subscribe(topic, this, handler), handlers)
    )
);
