import numpy as np
import cv2
from PIL import Image


class SkeletonExtractor:
    def __init__(self):
        pass

    def extract_skeleton(self, image):
        if isinstance(image, Image.Image):
            image = np.array(image)
            if len(image.shape) == 3:
                image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

        if len(image.shape) == 3:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        _, binary = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        binary = binary // 255

        skeleton = self._zhang_suen_thinning(binary)

        skeleton = skeleton * 255

        return skeleton.astype(np.uint8)

    def _zhang_suen_thinning(self, image):
        image = image.astype(np.uint8)
        skeleton = np.zeros(image.shape, np.uint8)

        changing = True
        while changing:
            changing = False

            marker = np.zeros(image.shape, np.uint8)
            rows, cols = image.shape

            for i in range(1, rows - 1):
                for j in range(1, cols - 1):
                    if image[i, j] == 0:
                        continue

                    p2, p3, p4 = image[i - 1, j], image[i - 1, j + 1], image[i, j + 1]
                    p5, p6, p7 = image[i + 1, j + 1], image[i + 1, j], image[i + 1, j - 1]
                    p8, p9 = image[i, j - 1], image[i - 1, j - 1]

                    neighbors = [p2, p3, p4, p5, p6, p7, p8, p9]
                    non_zero_count = sum(neighbors)

                    if non_zero_count < 2 or non_zero_count > 6:
                        continue

                    transitions = 0
                    for k in range(len(neighbors)):
                        if neighbors[k] == 0 and neighbors[(k + 1) % 8] == 1:
                            transitions += 1

                    if transitions != 1:
                        continue

                    if p2 * p4 * p6 != 0:
                        continue
                    if p4 * p6 * p8 != 0:
                        continue

                    marker[i, j] = 1
                    changing = True

            image = image - marker
            skeleton = skeleton | marker

            marker = np.zeros(image.shape, np.uint8)

            for i in range(1, rows - 1):
                for j in range(1, cols - 1):
                    if image[i, j] == 0:
                        continue

                    p2, p3, p4 = image[i - 1, j], image[i - 1, j + 1], image[i, j + 1]
                    p5, p6, p7 = image[i + 1, j + 1], image[i + 1, j], image[i + 1, j - 1]
                    p8, p9 = image[i, j - 1], image[i - 1, j - 1]

                    neighbors = [p2, p3, p4, p5, p6, p7, p8, p9]
                    non_zero_count = sum(neighbors)

                    if non_zero_count < 2 or non_zero_count > 6:
                        continue

                    transitions = 0
                    for k in range(len(neighbors)):
                        if neighbors[k] == 0 and neighbors[(k + 1) % 8] == 1:
                            transitions += 1

                    if transitions != 1:
                        continue

                    if p2 * p4 * p8 != 0:
                        continue
                    if p2 * p6 * p8 != 0:
                        continue

                    marker[i, j] = 1
                    changing = True

            image = image - marker
            skeleton = skeleton | marker

        return skeleton

    def extract_skeleton_fast(self, image):
        if isinstance(image, Image.Image):
            image = np.array(image)
            if len(image.shape) == 3:
                image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

        if len(image.shape) == 3:
            image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        _, binary = cv2.threshold(image, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        skeleton = self._fast_thinning(binary)

        return skeleton

    def _fast_thinning(self, img):
        img = img // 255
        img = img.astype(np.uint8)

        size = np.size(img)
        skel = np.zeros(img.shape, np.uint8)

        element = cv2.getStructuringElement(cv2.MORPH_CROSS, (3, 3))

        while True:
            open_img = cv2.morphologyEx(img, cv2.MORPH_OPEN, element)
            temp = img - open_img
            eroded = cv2.erode(img, element)
            skel = skel | temp
            img = eroded

            zeros = size - cv2.countNonZero(img)
            if zeros == size:
                break

        return skel * 255

    def get_skeleton_points(self, skeleton):
        points = []
        rows, cols = skeleton.shape
        for i in range(rows):
            for j in range(cols):
                if skeleton[i, j] > 0:
                    points.append((j, i))
        return points

    def preprocess_image(self, image, target_size=200):
        if isinstance(image, Image.Image):
            image = np.array(image)

        if len(image.shape) == 3:
            if image.shape[2] == 4:
                image = cv2.cvtColor(image, cv2.COLOR_RGBA2GRAY)
            else:
                image = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)

        _, binary = cv2.threshold(image, 128, 255, cv2.THRESH_BINARY_INV)

        coords = cv2.findNonZero(binary)
        if coords is not None:
            x, y, w, h = cv2.boundingRect(coords)
            padding = 10
            x = max(0, x - padding)
            y = max(0, y - padding)
            w = min(image.shape[1] - x, w + 2 * padding)
            h = min(image.shape[0] - y, h + 2 * padding)
            binary = binary[y:y + h, x:x + w]

        scale = min(target_size / binary.shape[0], target_size / binary.shape[1])
        new_size = (int(binary.shape[1] * scale), int(binary.shape[0] * scale))
        binary = cv2.resize(binary, new_size, interpolation=cv2.INTER_AREA)

        canvas = np.ones((target_size, target_size), dtype=np.uint8) * 255
        y_offset = (target_size - new_size[1]) // 2
        x_offset = (target_size - new_size[0]) // 2
        canvas[y_offset:y_offset + new_size[1], x_offset:x_offset + new_size[0]] = binary

        return canvas

    def visualize_skeleton(self, skeleton, original=None):
        skeleton_color = cv2.cvtColor(skeleton, cv2.COLOR_GRAY2BGR)

        if original is not None:
            if isinstance(original, Image.Image):
                original = np.array(original)
            if len(original.shape) == 2:
                original = cv2.cvtColor(original, cv2.COLOR_GRAY2BGR)

            if original.shape[:2] != skeleton.shape:
                original = cv2.resize(original, (skeleton.shape[1], skeleton.shape[0]))

            overlay = cv2.addWeighted(original, 0.5, skeleton_color, 0.5, 0)
            return overlay

        return skeleton_color
