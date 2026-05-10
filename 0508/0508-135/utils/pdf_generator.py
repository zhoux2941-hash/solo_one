from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os


class PDFLabelGenerator:
    LABEL_WIDTH = 8 * cm
    LABEL_HEIGHT = 5 * cm
    LABELS_PER_PAGE = 9
    PADDING = 0.5 * cm
    
    CHINESE_FONT_PATHS = [
        'C:/Windows/Fonts/simhei.ttf',
        'C:/Windows/Fonts/msyh.ttf',
        'C:/Windows/Fonts/msyhbd.ttf',
        '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
        '/System/Library/Fonts/PingFang.ttc',
    ]
    
    @staticmethod
    def _register_font():
        font_name = 'ChineseFont'
        registered = False
        
        for font_path in PDFLabelGenerator.CHINESE_FONT_PATHS:
            if os.path.exists(font_path):
                try:
                    pdfmetrics.registerFont(TTFont(font_name, font_path))
                    registered = True
                    break
                except Exception:
                    continue
        
        if not registered:
            font_name = 'Helvetica'
        
        return font_name

    @staticmethod
    def generate_labels(papers, output_path):
        font_name = PDFLabelGenerator._register_font()
        c = canvas.Canvas(output_path, pagesize=A4)
        page_width, page_height = A4
        
        cols = 3
        rows = 3
        
        margin_x = (page_width - cols * PDFLabelGenerator.LABEL_WIDTH) / 2
        margin_y = (page_height - rows * PDFLabelGenerator.LABEL_HEIGHT) / 2
        
        for idx, paper in enumerate(papers):
            page_idx = idx // PDFLabelGenerator.LABELS_PER_PAGE
            label_in_page = idx % PDFLabelGenerator.LABELS_PER_PAGE
            
            if page_idx > 0 and label_in_page == 0:
                c.showPage()
            
            col = label_in_page % cols
            row = label_in_page // cols
            
            x = margin_x + col * PDFLabelGenerator.LABEL_WIDTH
            y = page_height - margin_y - (row + 1) * PDFLabelGenerator.LABEL_HEIGHT
            
            PDFLabelGenerator._draw_label(
                c, paper, x, y, 
                PDFLabelGenerator.LABEL_WIDTH, 
                PDFLabelGenerator.LABEL_HEIGHT,
                font_name
            )
        
        c.save()

    @staticmethod
    def _draw_label(c, paper, x, y, width, height, font_name):
        padding = PDFLabelGenerator.PADDING
        
        c.setStrokeColorRGB(0, 0, 0)
        c.setLineWidth(1)
        c.rect(x, y, width, height)
        
        c.setFillColorRGB(0.2, 0.4, 0.6)
        c.setFont(font_name, 14)
        name = paper.get('name', '未知纸张')
        c.drawString(x + padding, y + height - padding - 18, name)
        
        c.setFillColorRGB(0, 0, 0)
        c.setFont(font_name, 9)
        current_y = y + height - padding - 18 - 25
        
        fibers = paper.get('fiber_compositions', [])
        if fibers:
            fiber_texts = []
            for fc in fibers:
                fiber_texts.append(f"{fc['fiber_type']}: {fc['percentage']}%")
            fiber_str = ', '.join(fiber_texts)
            
            lines = PDFLabelGenerator._wrap_text(fiber_str, width - 2 * padding, c, font_name, 9)
            for line in lines:
                if current_y > y + padding:
                    c.drawString(x + padding, current_y, line)
                    current_y -= 15
        
        current_y -= 10
        thickness = paper.get('thickness', 0)
        thickness_text = f"厚度: {thickness} g/m²"
        
        if current_y > y + padding:
            c.drawString(x + padding, current_y, thickness_text)
            current_y -= 15
        
        ph_value = paper.get('ph_value')
        if ph_value is not None:
            ph_text = f"pH值: {ph_value}"
            if current_y > y + padding:
                c.drawString(x + padding, current_y, ph_text)
                current_y -= 15

    @staticmethod
    def _wrap_text(text, max_width, c, font_name, font_size):
        c.setFont(font_name, font_size)
        words = text
        lines = []
        current_line = ''
        
        for char in words:
            test_line = current_line + char
            if c.stringWidth(test_line, font_name, font_size) <= max_width:
                current_line = test_line
            else:
                if current_line:
                    lines.append(current_line)
                current_line = char
        
        if current_line:
            lines.append(current_line)
        
        return lines
