import numpy as np
from scipy.fft import fftn, ifftn, fftshift
from scipy.spatial.distance import cdist
import warnings
warnings.filterwarnings('ignore')

def center_molecule(atoms):
    coords = np.array([a['coord'] for a in atoms], dtype=np.float32)
    center = np.mean(coords, axis=0)
    centered_coords = coords - center
    
    centered_atoms = []
    for i, atom in enumerate(atoms):
        centered_atoms.append({
            **atom,
            'coord': centered_coords[i].tolist()
        })
    
    return centered_atoms, center

def molecule_to_grid(atoms, grid_size=32, spacing=1.5):
    coords = np.array([a['coord'] for a in atoms], dtype=np.float32)
    radii = np.array([a.get('radius', 1.5) for a in atoms], dtype=np.float32)
    
    half_size = grid_size * spacing / 2
    grid = np.zeros((grid_size, grid_size, grid_size), dtype=np.float32)
    
    for i, coord in enumerate(coords):
        r = radii[i]
        x_idx = int(np.clip((coord[0] + half_size) / spacing, 0, grid_size - 1))
        y_idx = int(np.clip((coord[1] + half_size) / spacing, 0, grid_size - 1))
        z_idx = int(np.clip((coord[2] + half_size) / spacing, 0, grid_size - 1))
        
        kernel_radius = int(np.ceil(r / spacing)) + 1
        for dx in range(-kernel_radius, kernel_radius + 1):
            for dy in range(-kernel_radius, kernel_radius + 1):
                for dz in range(-kernel_radius, kernel_radius + 1):
                    nx, ny, nz = x_idx + dx, y_idx + dy, z_idx + dz
                    if 0 <= nx < grid_size and 0 <= ny < grid_size and 0 <= nz < grid_size:
                        dist = np.sqrt(dx**2 + dy**2 + dz**2) * spacing
                        if dist <= r:
                            weight = 1.0 - (dist / r) * 0.5
                            grid[nx, ny, nz] = max(grid[nx, ny, nz], weight)
    
    return grid

def rotate_coords(coords, angles):
    rx, ry, rz = angles
    
    Rx = np.array([
        [1, 0, 0],
        [0, np.cos(rx), -np.sin(rx)],
        [0, np.sin(rx), np.cos(rx)]
    ], dtype=np.float32)
    
    Ry = np.array([
        [np.cos(ry), 0, np.sin(ry)],
        [0, 1, 0],
        [-np.sin(ry), 0, np.cos(ry)]
    ], dtype=np.float32)
    
    Rz = np.array([
        [np.cos(rz), -np.sin(rz), 0],
        [np.sin(rz), np.cos(rz), 0],
        [0, 0, 1]
    ], dtype=np.float32)
    
    R = Rz @ Ry @ Rx
    return coords @ R.T

def fft_correlation(grid1, grid2):
    f1 = fftn(grid1)
    f2 = fftn(grid2)
    
    correlation = ifftn(f1 * np.conj(f2))
    correlation = np.real(fftshift(correlation))
    
    return correlation

def find_best_translation(correlation, spacing):
    max_idx = np.unravel_index(np.argmax(correlation), correlation.shape)
    grid_size = correlation.shape[0]
    half_size = grid_size // 2
    
    translation = (np.array(max_idx) - half_size) * spacing
    score = correlation[max_idx] / (grid_size ** 3)
    
    return translation, score

def compute_shape_complementarity(atoms1, atoms2, translation, min_dist=1.0):
    coords1 = np.array([a['coord'] for a in atoms1], dtype=np.float32)
    coords2 = np.array([a['coord'] for a in atoms2], dtype=np.float32) + translation
    
    dists = cdist(coords1, coords2)
    min_dists = np.min(dists, axis=1)
    
    clashes = np.sum(min_dists < min_dist)
    contacts = np.sum((min_dists >= min_dist) & (min_dists < min_dist + 1.5))
    
    complementarity = contacts / (clashes + 1)
    
    return complementarity, contacts, clashes

def fft_docking(receptor_atoms, ligand_atoms, 
                grid_size=32, spacing=2.0,
                angle_step=30, num_best_poses=5):
    
    receptor_atoms_centered, receptor_center = center_molecule(receptor_atoms)
    ligand_atoms_centered, ligand_center = center_molecule(ligand_atoms)
    
    ligand_coords = np.array([a['coord'] for a in ligand_atoms_centered], dtype=np.float32)
    receptor_grid = molecule_to_grid(receptor_atoms_centered, grid_size, spacing)
    
    angles_deg = np.arange(0, 360, angle_step)
    angles_rad = np.deg2rad(angles_deg)
    
    results = []
    total_rotations = len(angles_rad) ** 3
    
    print(f"Starting FFT docking with {total_rotations} rotations...")
    
    count = 0
    for rx in angles_rad:
        for ry in angles_rad:
            for rz in angles_rad:
                rotated_coords = rotate_coords(ligand_coords, (rx, ry, rz))
                
                rotated_ligand = []
                for i, atom in enumerate(ligand_atoms_centered):
                    rotated_ligand.append({
                        **atom,
                        'coord': rotated_coords[i].tolist()
                    })
                
                ligand_grid = molecule_to_grid(rotated_ligand, grid_size, spacing)
                
                correlation = fft_correlation(receptor_grid, ligand_grid)
                translation, corr_score = find_best_translation(correlation, spacing)
                
                complementarity, contacts, clashes = compute_shape_complementarity(
                    receptor_atoms_centered, rotated_ligand, translation
                )
                
                total_score = corr_score * 100 + complementarity * 50 - clashes * 10
                
                results.append({
                    'rotation': [float(rx), float(ry), float(rz)],
                    'translation': translation.tolist(),
                    'correlation_score': float(corr_score),
                    'complementarity': float(complementarity),
                    'contacts': int(contacts),
                    'clashes': int(clashes),
                    'total_score': float(total_score)
                })
                
                count += 1
                if count % 100 == 0:
                    print(f"Processed {count}/{total_rotations} rotations")
    
    results.sort(key=lambda x: -x['total_score'])
    best_results = results[:num_best_poses]
    
    for result in best_results:
        result['final_translation'] = (
            np.array(result['translation']) + receptor_center - ligand_center
        ).tolist()
    
    return best_results

def generate_docking_trajectory(ligand_atoms, best_pose, num_frames=60):
    ligand_atoms_centered, ligand_center = center_molecule(ligand_atoms)
    ligand_coords = np.array([a['coord'] for a in ligand_atoms_centered], dtype=np.float32)
    
    rotation = np.array(best_pose['rotation'])
    translation = np.array(best_pose['final_translation'])
    
    start_translation = translation * 3
    
    trajectory = []
    
    for frame in range(num_frames):
        t = frame / (num_frames - 1)
        eased_t = t * t * (3 - 2 * t)
        
        current_rotation = rotation * eased_t
        rotated_coords = rotate_coords(ligand_coords, current_rotation)
        
        current_translation = start_translation * (1 - eased_t) + translation * eased_t
        final_coords = rotated_coords + current_translation + ligand_center
        
        frame_atoms = []
        for i, atom in enumerate(ligand_atoms):
            frame_atoms.append({
                **atom,
                'coord': final_coords[i].tolist()
            })
        
        trajectory.append(frame_atoms)
    
    return trajectory
