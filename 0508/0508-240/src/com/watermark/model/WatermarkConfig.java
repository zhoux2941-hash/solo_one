package com.watermark.model;

import java.awt.*;
import java.io.Serializable;

public class WatermarkConfig implements Serializable {
    private String watermarkText;
    private int fontSize;
    private String fontName;
    private Color color;
    private float opacity;
    private String position;
    private boolean tile;

    public WatermarkConfig() {
        this.watermarkText = "水印文字";
        this.fontSize = 30;
        this.fontName = "微软雅黑";
        this.color = Color.BLACK;
        this.opacity = 0.5f;
        this.position = "CENTER";
        this.tile = false;
    }

    public String getWatermarkText() {
        return watermarkText;
    }

    public void setWatermarkText(String watermarkText) {
        this.watermarkText = watermarkText;
    }

    public int getFontSize() {
        return fontSize;
    }

    public void setFontSize(int fontSize) {
        this.fontSize = fontSize;
    }

    public String getFontName() {
        return fontName;
    }

    public void setFontName(String fontName) {
        this.fontName = fontName;
    }

    public Color getColor() {
        return color;
    }

    public void setColor(Color color) {
        this.color = color;
    }

    public float getOpacity() {
        return opacity;
    }

    public void setOpacity(float opacity) {
        this.opacity = opacity;
    }

    public String getPosition() {
        return position;
    }

    public void setPosition(String position) {
        this.position = position;
    }

    public boolean isTile() {
        return tile;
    }

    public void setTile(boolean tile) {
        this.tile = tile;
    }

    public Font getFont() {
        return new Font(fontName, Font.PLAIN, fontSize);
    }
}