import numpy as np
import warnings
warnings.filterwarnings('ignore')

ELEMENT_RADII = {
    'H': 0.37, 'C': 0.77, 'N': 0.75, 'O': 0.73,
    'P': 1.10, 'S': 1.04, 'F': 0.71, 'CL': 0.99,
    'BR': 1.14, 'I': 1.33, 'FE': 1.26, 'CA': 1.97,
    'MG': 1.73, 'ZN': 1.31, 'NA': 1.90, 'K': 2.43,
    'MN': 1.39, 'CU': 1.38, 'NI': 1.24, 'CO': 1.26
}

ELEMENT_COLORS = {
    'H': 0xFFFFFF, 'C': 0x333333, 'N': 0x3355FF, 'O': 0xFF3333,
    'P': 0xFF9900, 'S': 0xFFFF33, 'F': 0x00FF00, 'CL': 0x00FF00,
    'BR': 0x8B4513, 'I': 0x940094, 'FE': 0xFF6600, 'CA': 0x808080,
    'MG': 0x808080, 'ZN': 0x808080, 'NA': 0x0000FF, 'K': 0x8B0000,
    'MN': 0x990000, 'CU': 0x008000, 'NI': 0x008080, 'CO': 0x808080,
    'DEFAULT': 0x808080
}

SECONDARY_STRUCTURE_COLORS = {
    'H': 0xFF0000,
    'E': 0x0000FF,
    'T': 0x00FF00,
    'S': 0x00FFFF,
    'G': 0xFF8800,
    'B': 0xFF00FF,
    'I': 0x880088,
    'C': 0x808080,
    'DEFAULT': 0x808080
}

def get_element_color(element):
    element = element.upper().strip()
    return ELEMENT_COLORS.get(element, ELEMENT_COLORS['DEFAULT'])

def get_element_radius(element):
    element = element.upper().strip()
    return ELEMENT_RADII.get(element, 1.0)

def parse_pdb_stream(file_path, max_atoms=200000):
    atoms = []
    residues = []
    current_residue = None
    residue_atoms = {}
    
    ca_coords = []
    ca_res_ids = []
    
    with open(file_path, 'r') as f:
        for line in f:
            if len(atoms) >= max_atoms:
                break
            
            if line.startswith('ATOM') or line.startswith('HETATM'):
                try:
                    serial = int(line[6:11].strip())
                    name = line[12:16].strip()
                    res_name = line[17:20].strip()
                    chain_id = line[21:22].strip()
                    res_seq = int(line[22:26].strip())
                    x = float(line[30:38].strip())
                    y = float(line[38:46].strip())
                    z = float(line[46:54].strip())
                    element = line[76:78].strip() if len(line) > 78 else 'C'
                    
                    atom_info = {
                        'id': serial,
                        'name': name,
                        'element': element,
                        'coord': [x, y, z],
                        'residue_id': res_seq,
                        'chain': chain_id,
                        'color': get_element_color(element),
                        'radius': get_element_radius(element)
                    }
                    atoms.append(atom_info)
                    
                    if current_residue is None or current_residue['id'] != res_seq:
                        if current_residue is not None:
                            current_residue['atoms_count'] = len(residue_atoms)
                            residues.append(current_residue)
                        
                        current_residue = {
                            'id': res_seq,
                            'name': res_name,
                            'chain': chain_id,
                            'atoms': {}
                        }
                        residue_atoms = {}
                    
                    residue_atoms[name] = atom_info
                    current_residue['atoms'][name] = {'coord': [x, y, z]}
                    
                    if name == 'CA':
                        ca_coords.append([x, y, z])
                        ca_res_ids.append(res_seq)
                
                except (ValueError, IndexError):
                    continue
    
    if current_residue is not None:
        current_residue['atoms_count'] = len(residue_atoms)
        residues.append(current_residue)
    
    return atoms, residues, ca_coords, ca_res_ids

def calculate_bonds_simple(atoms, max_bonds=150000):
    bonds = []
    
    if len(atoms) > 50000:
        bond_step = max(1, len(atoms) // 20000)
        sampled_atoms = atoms[::bond_step]
    else:
        sampled_atoms = atoms
    
    coords = np.array([a['coord'] for a in sampled_atoms], dtype=np.float32)
    
    for i in range(len(sampled_atoms)):
        if len(bonds) >= max_bonds:
            break
        
        dists = np.linalg.norm(coords - coords[i], axis=1)
        radius_i = sampled_atoms[i]['radius']
        
        for j in range(i + 1, len(sampled_atoms)):
            if len(bonds) >= max_bonds:
                break
            
            threshold = radius_i + sampled_atoms[j]['radius'] + 0.4
            if dists[j] < threshold and dists[j] > 0.5:
                bonds.append({
                    'from': i,
                    'to': j,
                    'distance': float(dists[j])
                })
    
    return bonds

def assign_secondary_structure_simple(residues, ca_coords):
    n = len(ca_coords)
    ss = ['C'] * n
    
    if n < 4:
        return ss
    
    ca_array = np.array(ca_coords, dtype=np.float32)
    
    i = 0
    while i < n - 3:
        helix_score = 0
        for j in range(3):
            if i + j + 1 >= n:
                break
            dist = np.linalg.norm(ca_array[i + j] - ca_array[i + j + 1])
            if 3.5 < dist < 4.0:
                helix_score += 1
        
        if helix_score >= 2:
            for j in range(4):
                if i + j < n:
                    ss[i + j] = 'H'
            i += 4
        else:
            i += 1
    
    for i in range(n - 2):
        for j in range(i + 3, min(i + 10, n)):
            sheet_score = 0
            for k in range(min(3, n - j)):
                dist = np.linalg.norm(ca_array[i + k] - ca_array[j + k])
                if 4.0 < dist < 5.5:
                    sheet_score += 1
            
            if sheet_score >= 2:
                for k in range(3):
                    if i + k < n:
                        ss[i + k] = 'E'
                    if j + k < n:
                        ss[j + k] = 'E'
    
    return ss

def parse_pdb_file(file_path, max_atoms=200000):
    atoms, residues, ca_coords, ca_res_ids = parse_pdb_stream(file_path, max_atoms)
    
    bonds = calculate_bonds_simple(atoms)
    
    ss = assign_secondary_structure_simple(residues, ca_coords)
    
    for i, res in enumerate(residues):
        if i < len(ss):
            res['secondary_structure'] = ss[i]
        else:
            res['secondary_structure'] = 'C'
    
    backbone = []
    for i, coord in enumerate(ca_coords):
        res_id = ca_res_ids[i] if i < len(ca_res_ids) else 0
        ss_type = ss[i] if i < len(ss) else 'C'
        backbone.append({
            'coord': coord,
            'residue_id': res_id,
            'secondary_structure': ss_type,
            'color': SECONDARY_STRUCTURE_COLORS.get(ss_type, SECONDARY_STRUCTURE_COLORS['DEFAULT'])
        })
    
    lod_levels = generate_lod_levels(len(atoms), len(bonds), len(backbone))
    
    return {
        'name': 'Molecule',
        'num_atoms': len(atoms),
        'num_residues': len(residues),
        'atoms': atoms,
        'bonds': bonds,
        'residues': [{
            'id': r['id'],
            'name': r['name'],
            'chain': r['chain'],
            'secondary_structure': r.get('secondary_structure', 'C')
        } for r in residues],
        'backbone': backbone,
        'hydrogen_bonds': [],
        'lod_levels': lod_levels
    }

def generate_lod_levels(num_atoms, num_bonds, num_backbone):
    lods = []
    
    lods.append({
        'level': 0,
        'atom_count': num_atoms,
        'bond_count': num_bonds,
        'backbone_count': num_backbone,
        'atom_step': 1,
        'bond_step': 1
    })
    
    steps = [2, 4, 8, 16, 32, 64]
    for level, step in enumerate(steps, 1):
        if num_atoms // step < 1000:
            break
            
        lods.append({
            'level': level,
            'atom_count': num_atoms // step,
            'bond_count': num_bonds // step,
            'backbone_count': num_backbone,
            'atom_step': step,
            'bond_step': step * 2
        })
    
    return lods
