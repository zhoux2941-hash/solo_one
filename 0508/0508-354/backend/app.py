from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import io
import base64
import time
import os
from PIL import Image
import numpy as np
import cv2

from services.character_generator import CharacterGenerator
from services.skeleton_extractor import SkeletonExtractor
from services.shape_context import ShapeContextMatcher
from services.similarity import SimilarityCalculator
from services.pdf_generator import PDFGenerator
from services.portfolio_manager import PortfolioManager

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FONTS_DIR = os.path.join(BASE_DIR, 'fonts')

character_generator = CharacterGenerator(FONTS_DIR)
skeleton_extractor = SkeletonExtractor()
shape_matcher = ShapeContextMatcher()
similarity_calculator = SimilarityCalculator()
pdf_generator = PDFGenerator(FONTS_DIR)


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': time.time()
    })


@app.route('/api/fonts', methods=['GET'])
def get_available_fonts():
    fonts = [
        {'id': '楷体', 'name': '楷书 (KaiTi)', 'description': '标准楷书字体，端庄秀丽'},
        {'id': '行书', 'name': '行书 (XingShu)', 'description': '流畅自然，书写快捷'},
        {'id': '隶书', 'name': '隶书 (LiShu)', 'description': '古朴典雅，结构规整'}
    ]
    return jsonify(fonts)


@app.route('/api/generate-character', methods=['POST'])
def generate_character():
    try:
        data = request.get_json()

        character = data.get('character', '')
        font_name = data.get('font', '楷体')
        grid_size = data.get('grid_size', 200)
        show_grid = data.get('show_grid', True)
        show_stroke = data.get('show_stroke', True)

        if not character:
            return jsonify({'error': 'Character is required'}), 400

        img = character_generator.generate_character_image(
            character=character,
            font_name=font_name,
            grid_size=grid_size,
            show_grid=show_grid,
            show_stroke_guide=show_stroke
        )

        img_base64 = character_generator.image_to_base64(img)

        return jsonify({
            'success': True,
            'character': character,
            'font': font_name,
            'image': img_base64
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/generate-copybook', methods=['POST'])
def generate_copybook():
    try:
        data = request.get_json()

        characters = data.get('characters', [])
        font_name = data.get('font', '楷体')
        cols = data.get('cols', 8)
        rows = data.get('rows', 11)
        cell_size = data.get('cell_size', 80)

        if not characters:
            return jsonify({'error': 'Characters list is required'}), 400

        img = character_generator.generate_traceable_copybook(
            characters=characters,
            font_name=font_name,
            cols=cols,
            rows=rows,
            cell_size=cell_size
        )

        img_base64 = character_generator.image_to_base64(img)

        return jsonify({
            'success': True,
            'character_count': len(characters),
            'image': img_base64
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/extract-skeleton', methods=['POST'])
def extract_skeleton():
    try:
        data = request.get_json()

        image_data = data.get('image', '')
        if not image_data:
            return jsonify({'error': 'Image data is required'}), 400

        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))

        processed = skeleton_extractor.preprocess_image(image, target_size=200)
        skeleton = skeleton_extractor.extract_skeleton(processed)

        skeleton_pil = Image.fromarray(skeleton)
        buffer = io.BytesIO()
        skeleton_pil.save(buffer, format='PNG')
        skeleton_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

        return jsonify({
            'success': True,
            'skeleton_image': skeleton_base64
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/calculate-similarity', methods=['POST'])
def calculate_similarity():
    try:
        start_time = time.time()

        data = request.get_json()

        ref_image_data = data.get('reference_image', '')
        user_image_data = data.get('user_image', '')

        if not ref_image_data or not user_image_data:
            return jsonify({'error': 'Both reference and user images are required'}), 400

        ref_bytes = base64.b64decode(ref_image_data)
        ref_image = Image.open(io.BytesIO(ref_bytes))

        user_bytes = base64.b64decode(user_image_data)
        user_image = Image.open(io.BytesIO(user_bytes))

        result = similarity_calculator.calculate_similarity(ref_image, user_image)

        elapsed_time = time.time() - start_time

        if result.get('overlay_image') is not None:
            overlay_pil = Image.fromarray(result['overlay_image'])
            buffer = io.BytesIO()
            overlay_pil.save(buffer, format='PNG')
            result['overlay_image'] = base64.b64encode(buffer.getvalue()).decode('utf-8')

        result['processing_time'] = round(elapsed_time, 2)
        result['success'] = True

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


@app.route('/api/detailed-analysis', methods=['POST'])
def detailed_analysis():
    try:
        start_time = time.time()

        data = request.get_json()

        ref_image_data = data.get('reference_image', '')
        user_image_data = data.get('user_image', '')

        if not ref_image_data or not user_image_data:
            return jsonify({'error': 'Both reference and user images are required'}), 400

        ref_bytes = base64.b64decode(ref_image_data)
        ref_image = Image.open(io.BytesIO(ref_bytes))

        user_bytes = base64.b64decode(user_image_data)
        user_image = Image.open(io.BytesIO(user_bytes))

        result = similarity_calculator.detailed_analysis(ref_image, user_image)

        elapsed_time = time.time() - start_time

        if result.get('overlay_image') is not None:
            overlay_pil = Image.fromarray(result['overlay_image'])
            buffer = io.BytesIO()
            overlay_pil.save(buffer, format='PNG')
            result['overlay_image'] = base64.b64encode(buffer.getvalue()).decode('utf-8')

        result['processing_time'] = round(elapsed_time, 2)
        result['success'] = True

        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


@app.route('/api/generate-pdf', methods=['POST'])
def generate_pdf():
    try:
        data = request.get_json()

        characters = data.get('characters', [])
        font_name = data.get('font', '楷体')
        cols = data.get('cols', 8)
        rows = data.get('rows', 11)

        if not characters:
            return jsonify({'error': 'Characters list is required'}), 400

        font_map = {
            '楷体': 'KaiTi',
            '楷书': 'KaiTi',
            '行书': 'XingShu',
            '隶书': 'LiShu',
            '宋体': 'SimSun'
        }

        pdf_font = font_map.get(font_name, 'KaiTi')

        pdf_buffer = pdf_generator.generate_copybook_pdf(
            characters=characters,
            font_name=pdf_font,
            cols=cols,
            rows=rows
        )

        pdf_base64 = base64.b64encode(pdf_buffer.getvalue()).decode('utf-8')

        return jsonify({
            'success': True,
            'pdf': pdf_base64,
            'character_count': len(characters)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/download-pdf', methods=['POST'])
def download_pdf():
    try:
        data = request.get_json()

        characters = data.get('characters', [])
        font_name = data.get('font', '楷体')

        if not characters:
            return jsonify({'error': 'Characters list is required'}), 400

        font_map = {
            '楷体': 'KaiTi',
            '楷书': 'KaiTi',
            '行书': 'XingShu',
            '隶书': 'LiShu',
            '宋体': 'SimSun'
        }

        pdf_font = font_map.get(font_name, 'KaiTi')

        pdf_buffer = pdf_generator.generate_copybook_pdf(
            characters=characters,
            font_name=pdf_font
        )

        return send_file(
            io.BytesIO(pdf_buffer.getvalue()),
            mimetype='application/pdf',
            as_attachment=True,
            download_name='copybook.pdf'
        )

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/batch-evaluate', methods=['POST'])
def batch_evaluate():
    try:
        start_time = time.time()

        data = request.get_json()

        references = data.get('references', [])
        submissions = data.get('submissions', [])

        if len(references) != len(submissions):
            return jsonify({'error': 'References and submissions count must match'}), 400

        results = []
        for i, (ref_data, sub_data) in enumerate(zip(references, submissions)):
            try:
                ref_bytes = base64.b64decode(ref_data)
                ref_image = Image.open(io.BytesIO(ref_bytes))

                sub_bytes = base64.b64decode(sub_data)
                sub_image = Image.open(io.BytesIO(sub_bytes))

                result = similarity_calculator.calculate_similarity(ref_image, sub_image)
                result['index'] = i
                results.append(result)
            except Exception as e:
                results.append({
                    'index': i,
                    'score': 0,
                    'error': str(e)
                })

        elapsed_time = time.time() - start_time

        return jsonify({
            'success': True,
            'results': results,
            'total_time': round(elapsed_time, 2),
            'avg_time': round(elapsed_time / max(len(results), 1), 2)
        })

    except Exception as e:
        return jsonify({'error': str(e), 'success': False}), 500


if __name__ == '__main__':
    print("Starting Chinese Calligraphy Practice Server...")
    print(f"Fonts directory: {FONTS_DIR}")
    app.run(host='0.0.0.0', port=5000, debug=True)
