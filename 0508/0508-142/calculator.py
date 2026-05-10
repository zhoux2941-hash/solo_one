import math

def calculate_warp_count(bottom_diameter, strip_width, strip_thickness=None):
    if strip_thickness is None:
        strip_thickness = strip_width * 0.15
    
    R = bottom_diameter / 2
    R_effective = R - strip_thickness / 2
    R_effective = max(R_effective, strip_width / 2)
    
    if strip_width >= 2 * R_effective:
        return 8
    
    theta_strip = 2 * math.asin(strip_width / (2 * R_effective))
    
    theoretical_count = 2 * math.pi / theta_strip
    
    count_ceil = int(math.ceil(theoretical_count))
    count_floor = max(count_ceil - 1, 4)
    
    error_ceil = abs(count_ceil - theoretical_count)
    error_floor = abs(count_floor - theoretical_count)
    
    if error_ceil <= error_floor:
        warp_count = count_ceil
    else:
        warp_count = count_floor
    
    if warp_count % 2 == 1:
        candidate_even_low = warp_count - 1
        candidate_even_high = warp_count + 1
        
        error_low = abs(candidate_even_low - theoretical_count)
        error_high = abs(candidate_even_high - theoretical_count)
        error_current = abs(warp_count - theoretical_count)
        
        if error_low <= error_current * 1.2 and error_low <= error_high:
            warp_count = candidate_even_low
        elif error_high <= error_current * 1.2:
            warp_count = candidate_even_high
    
    return max(warp_count, 8)

def calculate_warp_gap(bottom_diameter, strip_width, warp_count, strip_thickness=None):
    if strip_thickness is None:
        strip_thickness = strip_width * 0.15
    
    R = bottom_diameter / 2
    R_effective = R - strip_thickness / 2
    R_effective = max(R_effective, strip_width / 2)
    
    if strip_width >= 2 * R_effective:
        return 0.0, 0.0
    
    theta_strip = 2 * math.asin(strip_width / (2 * R_effective))
    total_theta = 2 * math.pi
    
    theta_total_strips = warp_count * theta_strip
    theta_total_gaps = total_theta - theta_total_strips
    
    if warp_count > 0:
        theta_gap_per = theta_total_gaps / warp_count
    else:
        theta_gap_per = 0
    
    if theta_gap_per <= 0:
        overlap_arc = -theta_total_gaps * R_effective
        return -overlap_arc / warp_count, 0
    
    gap_arc_length = theta_gap_per * R_effective
    
    R_outer = R_effective + strip_thickness / 2
    gap_outer_arc = theta_gap_per * R_outer
    
    return gap_arc_length, gap_outer_arc

def calculate_weft_per_layer(opening_diameter, strip_width, strip_thickness=None):
    if strip_thickness is None:
        strip_thickness = strip_width * 0.15
    
    R = opening_diameter / 2
    R_effective = R - strip_thickness / 2
    R_effective = max(R_effective, strip_width / 2)
    
    if strip_width >= 2 * R_effective:
        return 8
    
    theta_strip = 2 * math.asin(strip_width / (2 * R_effective))
    theoretical_count = 2 * math.pi / theta_strip
    
    count_ceil = int(math.ceil(theoretical_count))
    count_floor = max(count_ceil - 1, 4)
    
    error_ceil = abs(count_ceil - theoretical_count)
    error_floor = abs(count_floor - theoretical_count)
    
    if error_ceil <= error_floor:
        weft_count = count_ceil
    else:
        weft_count = count_floor
    
    if weft_count % 2 == 1:
        candidate_even_low = weft_count - 1
        candidate_even_high = weft_count + 1
        
        error_low = abs(candidate_even_low - theoretical_count)
        error_high = abs(candidate_even_high - theoretical_count)
        error_current = abs(weft_count - theoretical_count)
        
        if error_low <= error_current * 1.2 and error_low <= error_high:
            weft_count = candidate_even_low
        elif error_high <= error_current * 1.2:
            weft_count = candidate_even_high
    
    return max(weft_count, 8)

def calculate_weft_layers(height, strip_width, pattern_type='herringbone'):
    if pattern_type == 'hexagon':
        effective_width = strip_width * math.sqrt(3) / 2
    else:
        effective_width = strip_width
    layers = int(math.ceil(height / effective_width))
    return max(layers, 2)

def estimate_strip_length(opening_diameter, bottom_diameter, height, 
                          warp_count, weft_per_layer, weft_layers):
    avg_diameter = (opening_diameter + bottom_diameter) / 2
    slant_height = math.sqrt(((opening_diameter - bottom_diameter) / 2) ** 2 + height ** 2)
    
    warp_length = slant_height * 1.15
    total_warp_length = warp_count * warp_length
    
    avg_circumference = math.pi * avg_diameter
    weft_length = avg_circumference * 1.1
    total_weft_length = weft_per_layer * weft_layers * weft_length
    
    total_length_m = (total_warp_length + total_weft_length) / 100
    
    return round(total_length_m, 2)

def calculate_all(opening_diameter, bottom_diameter, height, strip_width, 
                  pattern_type='herringbone', strip_thickness=None):
    if strip_thickness is None:
        strip_thickness = strip_width * 0.15
    
    warp_count = calculate_warp_count(bottom_diameter, strip_width, strip_thickness)
    weft_per_layer = calculate_weft_per_layer(opening_diameter, strip_width, strip_thickness)
    weft_layers = calculate_weft_layers(height, strip_width, pattern_type)
    strip_length_estimate = estimate_strip_length(
        opening_diameter, bottom_diameter, height,
        warp_count, weft_per_layer, weft_layers
    )
    
    warp_gap_inner, warp_gap_outer = calculate_warp_gap(
        bottom_diameter, strip_width, warp_count, strip_thickness
    )
    
    return {
        'warp_count': warp_count,
        'weft_per_layer': weft_per_layer,
        'weft_layers': weft_layers,
        'strip_length_estimate': strip_length_estimate,
        'warp_gap_inner': round(warp_gap_inner, 2),
        'warp_gap_outer': round(warp_gap_outer, 2),
        'strip_thickness': strip_thickness
    }
