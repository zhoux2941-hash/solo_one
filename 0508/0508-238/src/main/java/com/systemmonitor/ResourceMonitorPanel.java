package com.systemmonitor;

import org.jfree.chart.ChartFactory;
import org.jfree.chart.ChartPanel;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.axis.NumberAxis;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.chart.plot.XYPlot;
import org.jfree.chart.renderer.xy.XYLineAndShapeRenderer;
import org.jfree.data.xy.XYSeries;
import org.jfree.data.xy.XYSeriesCollection;

import javax.swing.*;
import java.awt.*;
import java.awt.Color;

public class ResourceMonitorPanel extends JPanel {
    private static final int MAX_DATA_POINTS = 60;
    private final SystemInfoCollector collector;
    private final XYSeries cpuSeries;
    private final XYSeries memorySeries;
    private final XYSeries diskSeries;
    private int timeCounter = 0;
    private JLabel cpuLabel;
    private JLabel memoryLabel;
    private JLabel diskLabel;

    public ResourceMonitorPanel(SystemInfoCollector collector) {
        this.collector = collector;
        this.cpuSeries = new XYSeries("CPU使用率");
        this.memorySeries = new XYSeries("内存使用率");
        this.diskSeries = new XYSeries("磁盘使用率");

        initUI();
        startMonitoring();
    }

    private void initUI() {
        setLayout(new BorderLayout(10, 10));
        setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));

        JPanel statusPanel = createStatusPanel();
        add(statusPanel, BorderLayout.NORTH);

        JFreeChart cpuChart = createChart(cpuSeries, "CPU使用率趋势", new Color(66, 139, 202));
        JFreeChart memoryChart = createChart(memorySeries, "内存使用率趋势", new Color(92, 184, 92));
        JFreeChart diskChart = createChart(diskSeries, "磁盘使用率趋势", new Color(240, 173, 78));

        JPanel chartsPanel = new JPanel(new GridLayout(3, 1, 5, 5));
        chartsPanel.add(new ChartPanel(cpuChart));
        chartsPanel.add(new ChartPanel(memoryChart));
        chartsPanel.add(new ChartPanel(diskChart));

        add(chartsPanel, BorderLayout.CENTER);
    }

    private JPanel createStatusPanel() {
        JPanel panel = new JPanel(new GridLayout(1, 3, 10, 0));
        panel.setBorder(BorderFactory.createTitledBorder("实时状态"));

        cpuLabel = createStatusLabel("CPU: 0.0%", new Color(66, 139, 202));
        memoryLabel = createStatusLabel("内存: 0.0%", new Color(92, 184, 92));
        diskLabel = createStatusLabel("磁盘: 0.0%", new Color(240, 173, 78));

        panel.add(cpuLabel);
        panel.add(memoryLabel);
        panel.add(diskLabel);

        return panel;
    }

    private JLabel createStatusLabel(String text, Color color) {
        JLabel label = new JLabel(text);
        label.setFont(new Font("微软雅黑", Font.BOLD, 16));
        label.setHorizontalAlignment(SwingConstants.CENTER);
        label.setForeground(color);
        label.setOpaque(true);
        label.setBackground(new Color(245, 245, 245));
        label.setBorder(BorderFactory.createLineBorder(color, 2));
        return label;
    }

    private JFreeChart createChart(XYSeries series, String title, Color color) {
        XYSeriesCollection dataset = new XYSeriesCollection(series);
        JFreeChart chart = ChartFactory.createXYLineChart(
                title,
                "时间 (秒)",
                "使用率 (%)",
                dataset,
                PlotOrientation.VERTICAL,
                false,
                true,
                false
        );

        chart.setBackgroundPaint(Color.WHITE);
        XYPlot plot = chart.getXYPlot();
        plot.setBackgroundPaint(new Color(248, 248, 248));
        plot.setRangeGridlinePaint(Color.LIGHT_GRAY);
        plot.setDomainGridlinePaint(Color.LIGHT_GRAY);

        NumberAxis rangeAxis = (NumberAxis) plot.getRangeAxis();
        rangeAxis.setRange(0, 100);

        XYLineAndShapeRenderer renderer = new XYLineAndShapeRenderer(true, false);
        renderer.setSeriesPaint(0, color);
        renderer.setSeriesStroke(0, new BasicStroke(2.0f));
        plot.setRenderer(renderer);

        return chart;
    }

    private void startMonitoring() {
        Timer timer = new Timer(1000, e -> updateData());
        timer.start();
    }

    private void updateData() {
        double cpu = collector.getCpuUsage();
        double memory = collector.getMemoryUsage();
        double disk = collector.getDiskUsage();

        if (cpuSeries.getItemCount() >= MAX_DATA_POINTS) {
            cpuSeries.remove(0);
            memorySeries.remove(0);
            diskSeries.remove(0);
        }

        timeCounter++;
        cpuSeries.add(timeCounter, cpu);
        memorySeries.add(timeCounter, memory);
        diskSeries.add(timeCounter, disk);

        cpuLabel.setText(String.format("CPU: %.1f%%", cpu));
        memoryLabel.setText(String.format("内存: %.1f%%", memory));
        diskLabel.setText(String.format("磁盘: %.1f%%", disk));
    }
}
