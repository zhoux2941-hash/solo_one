package com.dbtool.ui;

import javax.swing.*;
import javax.swing.text.BadLocationException;
import java.awt.*;

public class LineNumberComponent extends JComponent {
    private final JTextPane textPane;
    private final Font font;
    private final int lineHeight;
    private final int charWidth;

    public LineNumberComponent(JTextPane textPane) {
        this.textPane = textPane;
        this.font = new Font("Consolas", Font.PLAIN, 14);
        this.lineHeight = textPane.getFontMetrics(font).getHeight();
        this.charWidth = textPane.getFontMetrics(font).charWidth('9');
        setBackground(new Color(240, 240, 240));
    }

    @Override
    protected void paintComponent(Graphics g) {
        super.paintComponent(g);

        Graphics2D g2d = (Graphics2D) g;
        g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g2d.setColor(getBackground());
        g2d.fillRect(0, 0, getWidth(), getHeight());

        g2d.setColor(new Color(150, 150, 150));
        g2d.setFont(font);

        Rectangle clip = g2d.getClipBounds();
        int startY = clip.y - (clip.y % lineHeight);
        int endY = clip.y + clip.height + lineHeight;

        int lines = getLineCount();
        int maxDigits = Math.max(3, String.valueOf(lines).length());
        setPreferredSize(new Dimension(maxDigits * charWidth + 10, getHeight()));

        int startLine = yToLine(startY);
        int endLine = yToLine(endY);

        for (int line = startLine; line <= Math.min(endLine, lines); line++) {
            int y = lineToY(line);
            if (y >= 0 && y <= getHeight()) {
                String lineStr = String.valueOf(line);
                int x = (maxDigits - lineStr.length()) * charWidth + 5;
                g2d.drawString(lineStr, x, y + textPane.getFontMetrics(font).getAscent());
            }
        }

        g2d.setColor(new Color(200, 200, 200));
        g2d.drawLine(getWidth() - 1, 0, getWidth() - 1, getHeight());
    }

    private int getLineCount() {
        try {
            int pos = textPane.getDocument().getLength();
            return pos == 0 ? 1 : textPane.getDocument().getDefaultRootElement().getElementIndex(pos) + 1;
        } catch (Exception e) {
            return 1;
        }
    }

    private int yToLine(int y) {
        return y / lineHeight + 1;
    }

    private int lineToY(int line) {
        return (line - 1) * lineHeight;
    }

    public void updateScroll() {
        repaint();
    }
}
