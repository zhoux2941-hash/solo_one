import os
from PIL import Image


IMAGE_EXTENSIONS = {
    '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.tif',
    '.webp', '.ico', '.pcx', '.ppm', '.pgm', '.pbm', '.pnm',
    '.svg', '.jpe', '.jfif', '.jp2', '.j2k', '.jpf', '.jpx',
    '.xpm', '.xbm', '.tga', '.cur', '.ani'
}


def is_image_file(filepath):
    ext = os.path.splitext(filepath)[1].lower()
    return ext in IMAGE_EXTENSIONS


def calculate_dhash(image_path, hash_size=8):
    try:
        with Image.open(image_path) as img:
            new_width = hash_size + 1
            new_height = hash_size

            img = img.convert('L')
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)

            pixels = list(img.getdata())

            difference = []
            for row in range(hash_size):
                for col in range(hash_size):
                    left_pixel = pixels[row * new_width + col]
                    right_pixel = pixels[row * new_width + col + 1]
                    difference.append(left_pixel > right_pixel)

            hash_int = 0
            for idx, bit in enumerate(difference):
                if bit:
                    hash_int |= 1 << idx

            return format(hash_int, '0{}x'.format(hash_size * hash_size // 4))

    except Exception:
        return None


def hamming_distance(hash1, hash2):
    if not hash1 or not hash2:
        return 1000

    try:
        int1 = int(hash1, 16)
        int2 = int(hash2, 16)
        return bin(int1 ^ int2).count('1')
    except Exception:
        return 1000


def calculate_phash(image_path, hash_size=8, highfreq_factor=4):
    try:
        import numpy as np

        with Image.open(image_path) as img:
            img_size = hash_size * highfreq_factor
            img = img.convert('L')
            img = img.resize((img_size, img_size), Image.Resampling.LANCZOS)

            pixels = np.asarray(img, dtype=np.float32)

            from scipy.fftpack import dct
            dct_result = dct(dct(pixels, axis=0), axis=1)

            dct_low = dct_result[:hash_size, :hash_size]

            med = np.median(dct_low)
            diff = dct_low > med

            hash_int = 0
            for idx, bit in enumerate(diff.flatten()):
                if bit:
                    hash_int |= 1 << idx

            return format(hash_int, '0{}x'.format(hash_size * hash_size // 4))

    except Exception:
        return None


def group_similar_images(images, threshold=10):
    groups = []
    used_indices = set()

    for i, (path1, hash1) in enumerate(images):
        if i in used_indices:
            continue

        group = [(path1, hash1)]
        used_indices.add(i)

        for j, (path2, hash2) in enumerate(images):
            if j in used_indices or j == i:
                continue

            distance = hamming_distance(hash1, hash2)
            if distance <= threshold:
                group.append((path2, hash2))
                used_indices.add(j)

        if len(group) > 1:
            groups.append(group)

    return groups
