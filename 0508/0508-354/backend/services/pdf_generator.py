from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.lib.colors import (
    HexColor, white, black, Color
)
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import ImageReader
import os
import io
from PIL import Image


class PDFGenerator:
    def __init__(self, fonts_dir="fonts"):
        self.fonts_dir = fonts_dir
        self._register_fonts()

    def _register_fonts(self):
        font_configs = {
            'KaiTi': ['KaiTi.ttf', 'simkai.ttf', 'STKAITI.TTF'],
            'SimSun': ['SimSun.ttf', 'simsun.ttc'],
            'LiShu': ['LiShu.ttf', 'STLITI.TTF'],
            'XingShu': ['XingShu.ttf']
        }

        system_fonts_dir = 'C:/Windows/Fonts/'

        for font_name, font_files in font_configs.items():
            registered = False
            for font_file in font_files:
                font_path = os.path.join(self.fonts_dir, font_file)
                if os.path.exists(font_path):
                    try:
                        pdfmetrics.registerFont(TTFont(font_name, font_path))
                        registered = True
                        break
                    except:
                        continue

                system_path = os.path.join(system_fonts_dir, font_file)
                if os.path.exists(system_path):
                    try:
                        pdfmetrics.registerFont(TTFont(font_name, system_path))
                        registered = True
                        break
                    except:
                        continue

            if not registered:
                try:
                    pdfmetrics.registerFont(TTFont(font_name, 'Helvetica'))
                except:
                    pass

    def generate_copybook_pdf(self, characters, font_name='KaiTi', 
                               cols=8, rows=11, cell_size=18*mm,
                               output_path=None, show_grid=True,
                               first_row_black=True):
        if output_path is None:
            output_path = io.BytesIO()

        c = canvas.Canvas(output_path, pagesize=A4)
        page_width, page_height = A4

        margin_x = 2 * cm
        margin_y = 2 * cm
        spacing = 2 * mm

        usable_width = page_width - 2 * margin_x
        usable_height = page_height - 2 * margin_y

        total_chars_per_page = cols * rows
        num_pages = (len(characters) + total_chars_per_page - 1) // total_chars_per_page

        for page in range(num_pages):
            self._draw_page_header(c, page_width, page_height, font_name)

            start_idx = page * total_chars_per_page
            end_idx = min(start_idx + total_chars_per_page, len(characters))
            page_chars = characters[start_idx:end_idx]

            for idx, char in enumerate(page_chars):
                row = idx // cols
                col = idx % cols

                x = margin_x + col * (cell_size + spacing)
                y = page_height - margin_y - (row + 1) * (cell_size + spacing) + spacing

                if show_grid:
                    self._draw_mizi_grid(c, x, y, cell_size)

                is_black = first_row_black and (row == 0 or page == 0 and row == 0)
                self._draw_character(c, char, x, y, cell_size, font_name, is_black)

            c.showPage()

        c.save()

        if isinstance(output_path, io.BytesIO):
            output_path.seek(0)
            return output_path

        return output_path

    def _draw_page_header(self, c, page_width, page_height, font_name):
        c.setFont('Helvetica', 10)
        c.setFillColor(HexColor('#666666'))
        c.drawString(2 * cm, page_height - 1.5 * cm, 
                    f"Chinese Calligraphy Practice - {font_name}")

        c.line(2 * cm, page_height - 1.8 * cm, 
              page_width - 2 * cm, page_height - 1.8 * cm)

    def _draw_mizi_grid(self, c, x, y, size):
        c.setStrokeColor(HexColor('#CCCCCC'))
        c.setLineWidth(0.5)
        c.rect(x, y, size, size)

        c.setStrokeColor(HexColor('#FF9999'))
        c.setLineWidth(0.3)

        c.line(x + size / 2, y, x + size / 2, y + size)
        c.line(x, y + size / 2, x + size, y + size / 2)

        c.line(x, y, x + size, y + size)
        c.line(x + size, y, x, y + size)

    def _draw_character(self, c, char, x, y, size, font_name, is_black):
        font_size = size * 0.85

        try:
            c.setFont(font_name, font_size)
        except:
            c.setFont('Helvetica', font_size)

        if is_black:
            c.setFillColor(black)
        else:
            c.setFillColor(HexColor('#CCCCCC'))

        char_width = c.stringWidth(char, font_name, font_size)

        text_x = x + (size - char_width) / 2
        text_y = y + (size - font_size) / 2 + font_size * 0.2

        c.drawString(text_x, text_y, char)

    def generate_comparison_pdf(self, reference_images, user_images, scores, 
                                 output_path=None):
        if output_path is None:
            output_path = io.BytesIO()

        c = canvas.Canvas(output_path, pagesize=A4)
        page_width, page_height = A4

        margin = 2 * cm
        img_size = 6 * cm
        spacing = 1 * cm

        items_per_page = 3
        num_pages = (len(reference_images) + items_per_page - 1) // items_per_page

        for page in range(num_pages):
            start_idx = page * items_per_page
            end_idx = min(start_idx + items_per_page, len(reference_images))

            for i in range(start_idx, end_idx):
                item_y = page_height - margin - img_size - (i - start_idx) * (img_size + spacing + 2 * cm)

                if i < len(reference_images):
                    ref_img = self._pil_to_reportlab(reference_images[i])
                    c.drawImage(ref_img, margin, item_y, width=img_size, height=img_size)

                if i < len(user_images):
                    user_img = self._pil_to_reportlab(user_images[i])
                    c.drawImage(user_img, margin + img_size + spacing, item_y, 
                               width=img_size, height=img_size)

                if i < len(scores):
                    c.setFont('Helvetica', 12)
                    score = scores[i]
                    if score >= 80:
                        c.setFillColor(HexColor('#00AA00'))
                    elif score >= 60:
                        c.setFillColor(HexColor('#FFAA00'))
                    else:
                        c.setFillColor(HexColor('#FF0000'))

                    c.drawString(margin + 2 * (img_size + spacing), 
                                item_y + img_size / 2, 
                                f"Score: {score}")

            c.showPage()

        c.save()

        if isinstance(output_path, io.BytesIO):
            output_path.seek(0)
            return output_path

        return output_path

    def _pil_to_reportlab(self, img):
        if isinstance(img, Image.Image):
            img_rgba = img.convert('RGBA') if img.mode != 'RGBA' else img
            return ImageReader(img_rgba)
        elif isinstance(img, bytes):
            img_pil = Image.open(io.BytesIO(img))
            return ImageReader(img_pil)
        return img

    def generate_combined_pdf(self, characters, user_data, font_name='KaiTi',
                               output_path=None):
        if output_path is None:
            output_path = io.BytesIO()

        copybook_buffer = io.BytesIO()
        self.generate_copybook_pdf(characters, font_name, output_path=copybook_buffer)

        c = canvas.Canvas(output_path, pagesize=A4)
        page_width, page_height = A4

        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas as pdf_canvas

        import tempfile

        c.showPage()
        c.save()

        return output_path

    def pdf_to_bytes(self, pdf_path):
        if isinstance(pdf_path, io.BytesIO):
            return pdf_path.getvalue()

        with open(pdf_path, 'rb') as f:
            return f.read()
