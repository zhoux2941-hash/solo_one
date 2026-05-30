from flask import Flask, request, jsonify, send_file, render_template
import numpy as np
import os

app = Flask(__name__, static_folder='static', template_folder='templates')

from eeg_simulator import EEGSimulator
from eeg_analysis import EEGAnalyzer
from database import (
    init_db, get_templates, add_template,
    add_user_feedback, get_user_feedback,
    get_optimal_thresholds, get_optimal_threshold,
    update_optimal_threshold, add_detection_stats,
    get_feedback_statistics
)
from edf_exporter import export_edf

simulator = EEGSimulator()
analyzer = EEGAnalyzer(use_dynamic_threshold=True)

init_db()

def load_dynamic_thresholds():
    thresholds = get_optimal_thresholds()
    type_thresholds = {}
    for template_type, info in thresholds.items():
        type_thresholds[template_type] = info['optimal_threshold']
    analyzer.set_type_thresholds(type_thresholds)

load_dynamic_thresholds()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/generate', methods=['POST'])
def generate_eeg():
    data = request.json
    mode = data.get('mode', 'normal')
    eeg_data = simulator.generate_eeg(mode)
    return jsonify({
        'success': True,
        'data': eeg_data.tolist(),
        'sampling_rate': 256,
        'duration': 10,
        'channels': 8,
        'channel_names': ['Fp1', 'Fp2', 'C3', 'C4', 'P3', 'P4', 'O1', 'O2']
    })

@app.route('/api/templates', methods=['GET'])
def get_spike_templates():
    templates = get_templates()
    return jsonify({'success': True, 'templates': templates})

@app.route('/api/templates', methods=['POST'])
def add_spike_template():
    data = request.json
    name = data.get('name')
    template_data = data.get('template')
    template_type = data.get('type', 'spike')
    add_template(name, template_type, template_data)
    return jsonify({'success': True})

@app.route('/api/detect_spikes', methods=['POST'])
def detect_spikes():
    data = request.json
    eeg_data = np.array(data.get('data'))
    channel_idx = data.get('channel', 0)
    threshold = data.get('threshold')
    use_dynamic = data.get('use_dynamic', True)
    eeg_mode = data.get('eeg_mode', 'unknown')
    load_dynamic_thresholds()
    detections = analyzer.detect_spikes(eeg_data, channel_idx, threshold, use_dynamic)
    add_detection_stats(eeg_mode, channel_idx, threshold or analyzer.get_threshold_for_type('spike'), len(detections))
    return jsonify({
        'success': True,
        'detections': detections,
        'current_thresholds': analyzer.type_thresholds
    })

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    data = request.json
    detection_data = data.get('detection', {})
    user_label = data.get('user_label')
    eeg_mode = data.get('eeg_mode', 'unknown')
    threshold_used = data.get('threshold_used', 0.85)
    waveform_snippet = data.get('waveform_snippet')
    if user_label is None:
        return jsonify({'success': False, 'error': 'user_label is required'})
    detection_id = add_user_feedback(detection_data, user_label, eeg_mode, threshold_used, waveform_snippet)
    return jsonify({
        'success': True,
        'detection_id': detection_id,
        'message': 'Feedback saved successfully'
    })

@app.route('/api/feedback', methods=['GET'])
def list_feedback():
    limit = request.args.get('limit', 100, type=int)
    template_type = request.args.get('type')
    feedback = get_user_feedback(limit, template_type)
    return jsonify({'success': True, 'feedback': feedback})

@app.route('/api/feedback/stats', methods=['GET'])
def get_feedback_stats():
    stats = get_feedback_statistics()
    thresholds = get_optimal_thresholds()
    return jsonify({
        'success': True,
        'feedback_stats': stats,
        'current_thresholds': thresholds
    })

@app.route('/api/thresholds', methods=['GET'])
def get_thresholds():
    thresholds = get_optimal_thresholds()
    return jsonify({'success': True, 'thresholds': thresholds})

@app.route('/api/optimize_threshold', methods=['POST'])
def run_threshold_optimization():
    data = request.json
    template_type = data.get('template_type', 'spike')
    min_feedback = data.get('min_feedback', 20)
    feedback = get_user_feedback(limit=5000, template_type=template_type)
    if len(feedback) < min_feedback:
        return jsonify({
            'success': False,
            'error': f'Insufficient feedback. Need at least {min_feedback}, got {len(feedback)}',
            'current_feedback_count': len(feedback)
        })
    optimal_threshold, metrics = analyzer.optimize_threshold(feedback, template_type)
    if metrics:
        update_optimal_threshold(template_type, optimal_threshold, metrics)
        load_dynamic_thresholds()
        return jsonify({
            'success': True,
            'template_type': template_type,
            'optimal_threshold': optimal_threshold,
            'metrics': metrics,
            'message': f'Threshold optimized: {optimal_threshold:.3f}'
        })
    else:
        return jsonify({
            'success': False,
            'error': 'Could not compute optimal threshold',
            'current_feedback_count': len(feedback)
        })

@app.route('/api/fft', methods=['POST'])
def compute_fft():
    data = request.json
    eeg_data = np.array(data.get('data'))
    channel_idx = data.get('channel', 0)
    fft_result = analyzer.compute_fft(eeg_data, channel_idx)
    return jsonify({'success': True, **fft_result})

@app.route('/api/export_edf', methods=['POST'])
def export_eeg_edf():
    data = request.json
    eeg_data = np.array(data.get('data'))
    mode = data.get('mode', 'normal')
    filepath = export_edf(eeg_data, mode)
    return send_file(filepath, as_attachment=True, download_name=f'eeg_{mode}.edf')

if __name__ == '__main__':
    app.run(debug=True, port=5000)
