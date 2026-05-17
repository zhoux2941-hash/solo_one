package com.dbtool.ui;

import javax.swing.*;
import javax.swing.text.*;
import java.awt.*;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class SQLEditor extends JTextPane {
    private static final Set<String> KEYWORDS = new HashSet<>();
    private static final Set<String> FUNCTIONS = new HashSet<>();
    private static final Set<String> OPERATORS = new HashSet<>();

    private static final Style keywordStyle;
    private static final Style functionStyle;
    private static final Style stringStyle;
    private static final Style numberStyle;
    private static final Style commentStyle;
    private static final Style operatorStyle;
    private static final Style defaultStyle;

    static {
        KEYWORDS.add("SELECT");
        KEYWORDS.add("INSERT");
        KEYWORDS.add("UPDATE");
        KEYWORDS.add("DELETE");
        KEYWORDS.add("CREATE");
        KEYWORDS.add("DROP");
        KEYWORDS.add("ALTER");
        KEYWORDS.add("TABLE");
        KEYWORDS.add("FROM");
        KEYWORDS.add("WHERE");
        KEYWORDS.add("AND");
        KEYWORDS.add("OR");
        KEYWORDS.add("NOT");
        KEYWORDS.add("IN");
        KEYWORDS.add("LIKE");
        KEYWORDS.add("ORDER");
        KEYWORDS.add("BY");
        KEYWORDS.add("GROUP");
        KEYWORDS.add("HAVING");
        KEYWORDS.add("LIMIT");
        KEYWORDS.add("OFFSET");
        KEYWORDS.add("JOIN");
        KEYWORDS.add("LEFT");
        KEYWORDS.add("RIGHT");
        KEYWORDS.add("INNER");
        KEYWORDS.add("OUTER");
        KEYWORDS.add("FULL");
        KEYWORDS.add("ON");
        KEYWORDS.add("AS");
        KEYWORDS.add("DISTINCT");
        KEYWORDS.add("UNION");
        KEYWORDS.add("ALL");
        KEYWORDS.add("VALUES");
        KEYWORDS.add("SET");
        KEYWORDS.add("INTO");
        KEYWORDS.add("PRIMARY");
        KEYWORDS.add("KEY");
        KEYWORDS.add("FOREIGN");
        KEYWORDS.add("REFERENCES");
        KEYWORDS.add("NULL");
        KEYWORDS.add("IS");
        KEYWORDS.add("BETWEEN");
        KEYWORDS.add("CASE");
        KEYWORDS.add("WHEN");
        KEYWORDS.add("THEN");
        KEYWORDS.add("ELSE");
        KEYWORDS.add("END");
        KEYWORDS.add("VARCHAR");
        KEYWORDS.add("INT");
        KEYWORDS.add("INTEGER");
        KEYWORDS.add("TEXT");
        KEYWORDS.add("BOOLEAN");
        KEYWORDS.add("DATE");
        KEYWORDS.add("TIMESTAMP");
        KEYWORDS.add("REAL");
        KEYWORDS.add("BLOB");
        KEYWORDS.add("DEFAULT");
        KEYWORDS.add("AUTO_INCREMENT");
        KEYWORDS.add("UNIQUE");
        KEYWORDS.add("INDEX");
        KEYWORDS.add("VIEW");
        KEYWORDS.add("TRUNCATE");
        KEYWORDS.add("COMMIT");
        KEYWORDS.add("ROLLBACK");

        FUNCTIONS.add("COUNT");
        FUNCTIONS.add("SUM");
        FUNCTIONS.add("AVG");
        FUNCTIONS.add("MIN");
        FUNCTIONS.add("MAX");
        FUNCTIONS.add("UPPER");
        FUNCTIONS.add("LOWER");
        FUNCTIONS.add("SUBSTR");
        FUNCTIONS.add("SUBSTRING");
        FUNCTIONS.add("LENGTH");
        FUNCTIONS.add("CHAR_LENGTH");
        FUNCTIONS.add("TRIM");
        FUNCTIONS.add("LTRIM");
        FUNCTIONS.add("RTRIM");
        FUNCTIONS.add("REPLACE");
        FUNCTIONS.add("CONCAT");
        FUNCTIONS.add("NOW");
        FUNCTIONS.add("CURDATE");
        FUNCTIONS.add("CURTIME");
        FUNCTIONS.add("DATE");
        FUNCTIONS.add("YEAR");
        FUNCTIONS.add("MONTH");
        FUNCTIONS.add("DAY");
        FUNCTIONS.add("HOUR");
        FUNCTIONS.add("MINUTE");
        FUNCTIONS.add("SECOND");
        FUNCTIONS.add("ABS");
        FUNCTIONS.add("ROUND");
        FUNCTIONS.add("FLOOR");
        FUNCTIONS.add("CEIL");
        FUNCTIONS.add("RANDOM");
        FUNCTIONS.add("COALESCE");
        FUNCTIONS.add("IFNULL");
        FUNCTIONS.add("NULLIF");
        FUNCTIONS.add("CAST");

        OPERATORS.add("=");
        OPERATORS.add("!=");
        OPERATORS.add("<>");
        OPERATORS.add("<");
        OPERATORS.add(">");
        OPERATORS.add("<=");
        OPERATORS.add(">=");
        OPERATORS.add("+");
        OPERATORS.add("-");
        OPERATORS.add("*");
        OPERATORS.add("/");
        OPERATORS.add("%");

        StyleContext styleContext = StyleContext.getDefaultStyleContext();
        defaultStyle = styleContext.getStyle(StyleContext.DEFAULT_STYLE);

        keywordStyle = styleContext.addStyle("keyword", defaultStyle);
        StyleConstants.setForeground(keywordStyle, new Color(0, 0, 153));
        StyleConstants.setBold(keywordStyle, true);

        functionStyle = styleContext.addStyle("function", defaultStyle);
        StyleConstants.setForeground(functionStyle, new Color(102, 0, 102));
        StyleConstants.setItalic(functionStyle, true);

        stringStyle = styleContext.addStyle("string", defaultStyle);
        StyleConstants.setForeground(stringStyle, new Color(0, 102, 0));

        numberStyle = styleContext.addStyle("number", defaultStyle);
        StyleConstants.setForeground(numberStyle, new Color(204, 0, 0));

        commentStyle = styleContext.addStyle("comment", defaultStyle);
        StyleConstants.setForeground(commentStyle, new Color(128, 128, 128));
        StyleConstants.setItalic(commentStyle, true);

        operatorStyle = styleContext.addStyle("operator", defaultStyle);
        StyleConstants.setForeground(operatorStyle, new Color(153, 0, 76));
        StyleConstants.setBold(operatorStyle, true);
    }

    private final DocumentFilter filter;
    private boolean isUpdating = false;

    public SQLEditor() {
        setFont(new Font("Consolas", Font.PLAIN, 14));

        filter = new DocumentFilter() {
            @Override
            public void insertString(FilterBypass fb, int offset, String string, AttributeSet attr) throws BadLocationException {
                super.insertString(fb, offset, string, attr);
                if (!isUpdating) {
                    highlight();
                }
            }

            @Override
            public void remove(FilterBypass fb, int offset, int length) throws BadLocationException {
                super.remove(fb, offset, length);
                if (!isUpdating) {
                    highlight();
                }
            }

            @Override
            public void replace(FilterBypass fb, int offset, int length, String text, AttributeSet attrs) throws BadLocationException {
                super.replace(fb, offset, length, text, attrs);
                if (!isUpdating) {
                    highlight();
                }
            }
        };

        ((AbstractDocument) getDocument()).setDocumentFilter(filter);
    }

    private void highlight() {
        isUpdating = true;
        SwingUtilities.invokeLater(() -> {
            try {
                String text = getText();
                StyledDocument doc = getStyledDocument();
                doc.setCharacterAttributes(0, text.length(), defaultStyle, true);

                highlightPattern(doc, text, "--.*$", commentStyle, Pattern.MULTILINE);
                highlightPattern(doc, text, "/\\*[\\s\\S]*?\\*/", commentStyle, 0);

                highlightPattern(doc, text, "'[^']*'", stringStyle, 0);
                highlightPattern(doc, text, "\"[^\"]*\"", stringStyle, 0);

                highlightPattern(doc, text, "\\b\\d+(\\.\\d+)?\\b", numberStyle, 0);

                for (String keyword : KEYWORDS) {
                    highlightPattern(doc, text, "(?i)\\b" + keyword + "\\b", keywordStyle, 0);
                }

                for (String function : FUNCTIONS) {
                    highlightPattern(doc, text, "(?i)\\b" + function + "\\b(?=\\s*\\()", functionStyle, 0);
                }

                for (String operator : OPERATORS) {
                    String escaped = Pattern.quote(operator);
                    highlightPattern(doc, text, escaped, operatorStyle, 0);
                }

            } catch (Exception e) {
                e.printStackTrace();
            } finally {
                isUpdating = false;
            }
        });
    }

    private void highlightPattern(StyledDocument doc, String text, String pattern, Style style, int flags) {
        Pattern p = Pattern.compile(pattern, flags);
        Matcher m = p.matcher(text);
        while (m.find()) {
            int start = m.start();
            int end = m.end();
            doc.setCharacterAttributes(start, end - start, style, true);
        }
    }

    public void setText(String text) {
        super.setText(text);
        highlight();
    }

    public String getText() {
        try {
            return getDocument().getText(0, getDocument().getLength());
        } catch (BadLocationException e) {
            return "";
        }
    }

    public JScrollPane createScrollPaneWithLineNumbers() {
        LineNumberComponent lineNumber = new LineNumberComponent(this);

        JScrollPane scrollPane = new JScrollPane(this);
        scrollPane.setRowHeaderView(lineNumber);

        getCaret().addChangeListener(e -> lineNumber.updateScroll());
        getDocument().addDocumentListener(new javax.swing.event.DocumentListener() {
            public void insertUpdate(javax.swing.event.DocumentEvent e) {
                lineNumber.updateScroll();
            }
            public void removeUpdate(javax.swing.event.DocumentEvent e) {
                lineNumber.updateScroll();
            }
            public void changedUpdate(javax.swing.event.DocumentEvent e) {
                lineNumber.updateScroll();
            }
        });

        return scrollPane;
    }
}
