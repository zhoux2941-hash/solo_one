import os
import gc
import gzip
import io
import tempfile
import json
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from pdb_parser import parse_pdb_file
from docking import fft_docking, generate_docking_trajectory
import traceback

app = Flask(__name__)
CORS(app, max_age=86400)

UPLOAD_FOLDER = tempfile.mkdtemp()
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024

def gzip_response(data):
    gzip_buffer = io.BytesIO()
    gzip_file = gzip.GzipFile(mode='wb', fileobj=gzip_buffer)
    gzip_file.write(data.encode('utf-8'))
    gzip_file.close()
    
    response = make_response(gzip_buffer.getvalue())
    response.headers['Content-Encoding'] = 'gzip'
    response.headers['Content-Type'] = 'application/json'
    response.headers['Vary'] = 'Accept-Encoding'
    return response

@app.route('/api/parse-pdb', methods=['POST'])
def parse_pdb():
    file_path = None
    try:
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file part'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'success': False, 'error': 'No selected file'}), 400
        
        if not file.filename.endswith('.pdb'):
            return jsonify({'success': False, 'error': 'File must be a PDB file'}), 400
        
        max_atoms = int(request.form.get('max_atoms', 200000))
        
        file_path = os.path.join(tempfile.mkdtemp(), file.filename)
        file.save(file_path)
        
        result = parse_pdb_file(file_path, max_atoms=max_atoms)
        
        response_data = jsonify({
            'success': True,
            'data': result
        }).get_data(as_text=True)
        
        del result
        gc.collect()
        
        accept_encoding = request.headers.get('Accept-Encoding', '')
        if 'gzip' in accept_encoding.lower():
            return gzip_response(response_data)
        else:
            response = make_response(response_data)
            response.headers['Content-Type'] = 'application/json'
            return response
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500
    finally:
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                os.rmdir(os.path.dirname(file_path))
            except:
                pass
        gc.collect()

@app.route('/api/docking', methods=['POST'])
def perform_docking():
    try:
        data = request.get_json()
        
        if 'receptor' not in data or 'ligand' not in data:
            return jsonify({'success': False, 'error': 'Missing receptor or ligand data'}), 400
        
        receptor_atoms = data['receptor']
        ligand_atoms = data['ligand']
        
        max_atoms = 1000
        if len(receptor_atoms) > max_atoms:
            receptor_atoms = receptor_atoms[::len(receptor_atoms) // max_atoms + 1]
        if len(ligand_atoms) > max_atoms:
            ligand_atoms = ligand_atoms[::len(ligand_atoms) // max_atoms + 1]
        
        print(f"Starting docking: {len(receptor_atoms)} receptor atoms, {len(ligand_atoms)} ligand atoms")
        
        best_poses = fft_docking(
            receptor_atoms, 
            ligand_atoms,
            grid_size=32,
            angle_step=45,
            num_best_poses=3
        )
        
        trajectory = generate_docking_trajectory(ligand_atoms, best_poses[0], num_frames=60)
        
        response_data = json.dumps({
            'success': True,
            'data': {
                'best_poses': best_poses,
                'trajectory': trajectory
            }
        })
        
        del best_poses, trajectory
        gc.collect()
        
        accept_encoding = request.headers.get('Accept-Encoding', '')
        if 'gzip' in accept_encoding.lower():
            return gzip_response(response_data)
        else:
            response = make_response(response_data)
            response.headers['Content-Type'] = 'application/json'
            return response
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'PDB parser server is running'})

if __name__ == '__main__':
    print('Starting PDB Parser Server...')
    print(f'Upload folder: {UPLOAD_FOLDER}')
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
