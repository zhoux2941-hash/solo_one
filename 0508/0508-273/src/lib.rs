use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use rayon::prelude::*;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct BoundingBox {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

#[wasm_bindgen]
#[derive(Clone, Copy, Debug, Serialize, Deserialize)]
pub struct BackgroundConfig {
    pub r: u8,
    pub g: u8,
    pub b: u8,
    pub a: u8,
}

#[wasm_bindgen]
pub struct VideoProcessor {
    width: u32,
    height: u32,
    background_image: Option<Vec<u8>>,
    background_config: BackgroundConfig,
}

#[wasm_bindgen]
impl VideoProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new(width: u32, height: u32) -> Self {
        console_error_panic_hook::set_once();
        
        VideoProcessor {
            width,
            height,
            background_image: None,
            background_config: BackgroundConfig {
                r: 0,
                g: 0,
                b: 0,
                a: 255,
            },
        }
    }

    #[wasm_bindgen]
    pub fn set_background_color(&mut self, r: u8, g: u8, b: u8) {
        self.background_config = BackgroundConfig { r, g, b, a: 255 };
        self.background_image = None;
    }

    #[wasm_bindgen]
    pub fn set_background_image(&mut self, data: Vec<u8>) {
        if data.len() == (self.width * self.height * 4) as usize {
            self.background_image = Some(data);
        }
    }

    #[wasm_bindgen]
    pub fn blur_region(&self, data: &mut [u8], bbox: BoundingBox, radius: u32) {
        let x1 = bbox.x.max(0.0) as u32;
        let y1 = bbox.y.max(0.0) as u32;
        let x2 = (bbox.x + bbox.width).min(self.width as f32) as u32;
        let y2 = (bbox.y + bbox.height).min(self.height as f32) as u32;

        if x1 >= x2 || y1 >= y2 {
            return;
        }

        self.gaussian_blur_region(data, x1, y1, x2, y2, radius);
    }

    fn gaussian_blur_region(&self, data: &mut [u8], x1: u32, y1: u32, x2: u32, y2: u32, radius: u32) {
        let width = self.width as usize;
        let region_w = (x2 - x1) as usize;
        let region_h = (y2 - y1) as usize;

        if region_w == 0 || region_h == 0 {
            return;
        }

        let radius = radius.min(10);
        let sigma = radius.max(1) as f32 / 2.0;
        let kernel_size = (radius * 2 + 1) as usize;
        let mut kernel = vec![0.0; kernel_size];
        let mut sum = 0.0;

        for k in 0..kernel_size {
            let d = (k as i32 - radius as i32) as f32;
            let value = (- (d * d) / (2.0 * sigma * sigma)).exp();
            kernel[k] = value;
            sum += value;
        }

        for k in kernel.iter_mut() {
            *k /= sum;
        }

        let mut temp = vec![0u8; region_w * region_h * 4];

        for y in 0..region_h {
            for x in 0..region_w {
                let mut r = 0.0;
                let mut g = 0.0;
                let mut b = 0.0;

                for k in 0..kernel_size {
                    let sample_x = (x as i32 + k as i32 - radius as i32).max(0).min(region_w as i32 - 1) as usize;
                    let src_idx = ((y1 as usize + y) * width + (x1 as usize + sample_x)) * 4;
                    let weight = kernel[k];
                    
                    r += data[src_idx] as f32 * weight;
                    g += data[src_idx + 1] as f32 * weight;
                    b += data[src_idx + 2] as f32 * weight;
                }

                let dst_idx = (y * region_w + x) * 4;
                temp[dst_idx] = r as u8;
                temp[dst_idx + 1] = g as u8;
                temp[dst_idx + 2] = b as u8;
                temp[dst_idx + 3] = 255;
            }
        }

        for y in 0..region_h {
            for x in 0..region_w {
                let mut r = 0.0;
                let mut g = 0.0;
                let mut b = 0.0;

                for k in 0..kernel_size {
                    let sample_y = (y as i32 + k as i32 - radius as i32).max(0).min(region_h as i32 - 1) as usize;
                    let src_idx = (sample_y * region_w + x) * 4;
                    let weight = kernel[k];
                    
                    r += temp[src_idx] as f32 * weight;
                    g += temp[src_idx + 1] as f32 * weight;
                    b += temp[src_idx + 2] as f32 * weight;
                }

                let dst_idx = ((y1 as usize + y) * width + (x1 as usize + x)) * 4;
                data[dst_idx] = r as u8;
                data[dst_idx + 1] = g as u8;
                data[dst_idx + 2] = b as u8;
            }
        }
    }

    #[wasm_bindgen]
    pub fn replace_background(&self, data: &mut [u8], mask: &[u8]) {
        let config = self.background_config;
        let pixels = self.width * self.height;

        if let Some(bg_image) = &self.background_image {
            data.par_chunks_mut(4).enumerate().for_each(|(i, pixel)| {
                if i < pixels as usize {
                    let mask_val = mask[i * 4];
                    if mask_val < 128 {
                        let bg_idx = i * 4;
                        pixel[0] = bg_image[bg_idx];
                        pixel[1] = bg_image[bg_idx + 1];
                        pixel[2] = bg_image[bg_idx + 2];
                    }
                }
            });
        } else {
            data.par_chunks_mut(4).enumerate().for_each(|(i, pixel)| {
                if i < pixels as usize {
                    let mask_val = mask[i * 4];
                    if mask_val < 128 {
                        pixel[0] = config.r;
                        pixel[1] = config.g;
                        pixel[2] = config.b;
                    }
                }
            });
        }
    }

    #[wasm_bindgen]
    pub fn replace_background_simple(&self, data: &mut [u8]) {
        let config = self.background_config;

        if let Some(bg_image) = &self.background_image {
            data.par_chunks_mut(4).enumerate().for_each(|(i, pixel)| {
                if i * 4 < bg_image.len() {
                    let bg_idx = i * 4;
                    pixel[0] = bg_image[bg_idx];
                    pixel[1] = bg_image[bg_idx + 1];
                    pixel[2] = bg_image[bg_idx + 2];
                }
            });
        } else {
            data.par_chunks_mut(4).for_each(|pixel| {
                pixel[0] = config.r;
                pixel[1] = config.g;
                pixel[2] = config.b;
            });
        }
    }

    #[wasm_bindgen]
    pub fn grayscale(&self, data: &mut [u8]) {
        data.par_chunks_mut(4).for_each(|pixel| {
            let gray = (0.299 * pixel[0] as f32 + 0.587 * pixel[1] as f32 + 0.114 * pixel[2] as f32) as u8;
            pixel[0] = gray;
            pixel[1] = gray;
            pixel[2] = gray;
        });
    }

    #[wasm_bindgen]
    pub fn adjust_brightness(&self, data: &mut [u8], factor: f32) {
        data.par_chunks_mut(4).for_each(|pixel| {
            pixel[0] = ((pixel[0] as f32) * factor).min(255.0) as u8;
            pixel[1] = ((pixel[1] as f32) * factor).min(255.0) as u8;
            pixel[2] = ((pixel[2] as f32) * factor).min(255.0) as u8;
        });
    }
}

#[wasm_bindgen]
pub fn init_thread_pool(num_threads: usize) -> Result<(), JsValue> {
    wasm_bindgen_rayon::init_thread_pool(num_threads);
    Ok(())
}

#[wasm_bindgen]
pub fn get_memory_usage() -> usize {
    wasm_bindgen::memory().unchecked_into::<js_sys::WebAssembly::Memory>().buffer().byte_length()
}
