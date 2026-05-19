import numpy as np
import os
from src.utils.config_loader import Config

try:
    import tensorrt as trt
    import pycuda.driver as cuda
    import pycuda.autoinit
    TENSORRT_AVAILABLE = True
except ImportError:
    TENSORRT_AVAILABLE = False
    print("[TensorRT] 警告: TensorRT 未安装，将使用 ONNX Runtime 或 PyTorch")

try:
    import onnxruntime as ort
    ONNXRT_AVAILABLE = True
except ImportError:
    ONNXRT_AVAILABLE = False
    print("[TensorRT] 警告: ONNX Runtime 未安装")

try:
    import torch
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False


class TensorRTEngine:
    def __init__(self, engine_path, onnx_path=None):
        self.config = Config()
        self.engine_path = engine_path
        self.onnx_path = onnx_path
        self.precision = self.config.get('model.inference.precision')
        self.max_workspace_size = self.config.get('model.inference.max_workspace_size')
        
        self.engine = None
        self.context = None
        self.inputs = []
        self.outputs = []
        self.bindings = []
        self.stream = None
        
        self.ort_session = None
        self.torch_model = None
        
        self._init_engine()
    
    def _init_engine(self):
        if TENSORRT_AVAILABLE and os.path.exists(self.engine_path):
            self._load_trt_engine()
        elif TENSORRT_AVAILABLE and self.onnx_path and os.path.exists(self.onnx_path):
            self._build_engine_from_onnx()
        elif ONNXRT_AVAILABLE and self.onnx_path and os.path.exists(self.onnx_path):
            self._init_onnx_runtime()
        else:
            print("[TensorRT] 没有可用的推理引擎，将使用PyTorch")
    
    def _load_trt_engine(self):
        try:
            TRT_LOGGER = trt.Logger(trt.Logger.WARNING)
            with open(self.engine_path, 'rb') as f, trt.Runtime(TRT_LOGGER) as runtime:
                self.engine = runtime.deserialize_cuda_engine(f.read())
            
            self._allocate_buffers()
            print(f"[TensorRT] 成功加载引擎: {self.engine_path}")
        except Exception as e:
            print(f"[TensorRT] 加载引擎失败: {e}")
            if ONNXRT_AVAILABLE and self.onnx_path and os.path.exists(self.onnx_path):
                self._init_onnx_runtime()
    
    def _build_engine_from_onnx(self):
        try:
            TRT_LOGGER = trt.Logger(trt.Logger.WARNING)
            builder = trt.Builder(TRT_LOGGER)
            network = builder.create_network(1 << int(trt.NetworkDefinitionCreationFlag.EXPLICIT_BATCH))
            parser = trt.OnnxParser(network, TRT_LOGGER)
            
            with open(self.onnx_path, 'rb') as f:
                if not parser.parse(f.read()):
                    for error in range(parser.num_errors):
                        print(f"[TensorRT] ONNX解析错误: {parser.get_error(error)}")
                    return False
            
            config = builder.create_builder_config()
            config.max_workspace_size = self.max_workspace_size
            
            if self.precision == 'fp16' and builder.platform_has_fast_fp16:
                config.set_flag(trt.BuilderFlag.FP16)
                print("[TensorRT] 启用FP16精度")
            
            engine_bytes = builder.build_serialized_network(network, config)
            if engine_bytes is None:
                print("[TensorRT] 构建引擎失败")
                return False
            
            with open(self.engine_path, 'wb') as f:
                f.write(engine_bytes)
            
            TRT_LOGGER = trt.Logger(trt.Logger.WARNING)
            with trt.Runtime(TRT_LOGGER) as runtime:
                self.engine = runtime.deserialize_cuda_engine(engine_bytes)
            
            self._allocate_buffers()
            print(f"[TensorRT] 成功构建并保存引擎: {self.engine_path}")
            return True
        except Exception as e:
            print(f"[TensorRT] 构建引擎失败: {e}")
            if ONNXRT_AVAILABLE:
                self._init_onnx_runtime()
            return False
    
    def _allocate_buffers(self):
        self.context = self.engine.create_execution_context()
        self.stream = cuda.Stream()
        
        for binding in self.engine:
            size = trt.volume(self.engine.get_binding_shape(binding))
            dtype = trt.nptype(self.engine.get_binding_dtype(binding))
            host_mem = cuda.pagelocked_empty(size, dtype)
            device_mem = cuda.mem_alloc(host_mem.nbytes)
            self.bindings.append(int(device_mem))
            
            if self.engine.binding_is_input(binding):
                self.inputs.append({'host': host_mem, 'device': device_mem})
            else:
                self.outputs.append({'host': host_mem, 'device': device_mem})
    
    def _init_onnx_runtime(self):
        try:
            providers = ['CPUExecutionProvider']
            if 'CUDAExecutionProvider' in ort.get_available_providers():
                providers = ['CUDAExecutionProvider', 'CPUExecutionProvider']
            
            so = ort.SessionOptions()
            so.optimized_model_filepath = self.engine_path.replace('.engine', '_optimized.onnx')
            self.ort_session = ort.InferenceSession(self.onnx_path, sess_options=so, providers=providers)
            print(f"[ONNX Runtime] 使用 providers: {self.ort_session.get_providers()}")
        except Exception as e:
            print(f"[ONNX Runtime] 初始化失败: {e}")
    
    def infer(self, input_data):
        if input_data is None:
            return None
        
        input_data = input_data.astype(np.float32)
        
        if self.engine is not None and self.context is not None:
            return self._infer_trt(input_data)
        elif self.ort_session is not None:
            return self._infer_onnx(input_data)
        elif self.torch_model is not None:
            return self._infer_torch(input_data)
        else:
            print("[TensorRT] 没有可用的推理引擎")
            return None
    
    def _infer_trt(self, input_data):
        try:
            input_batch_size = input_data.shape[0]
            self.context.set_binding_shape(0, input_data.shape)
            
            np.copyto(self.inputs[0]['host'], input_data.ravel())
            cuda.memcpy_htod_async(self.inputs[0]['device'], self.inputs[0]['host'], self.stream)
            
            self.context.execute_async_v2(bindings=self.bindings, stream_handle=self.stream.handle)
            
            for out in self.outputs:
                cuda.memcpy_dtoh_async(out['host'], out['device'], self.stream)
            
            self.stream.synchronize()
            return self.outputs[0]['host'].reshape(input_batch_size, -1)
        except Exception as e:
            print(f"[TensorRT] 推理失败: {e}")
            return None
    
    def _infer_onnx(self, input_data):
        try:
            input_name = self.ort_session.get_inputs()[0].name
            outputs = self.ort_session.run(None, {input_name: input_data})
            return outputs[0]
        except Exception as e:
            print(f"[ONNX Runtime] 推理失败: {e}")
            return None
    
    def _infer_torch(self, input_data):
        try:
            with torch.no_grad():
                input_tensor = torch.from_numpy(input_data)
                output = self.torch_model(input_tensor)
                return output.numpy()
        except Exception as e:
            print(f"[PyTorch] 推理失败: {e}")
            return None
    
    def set_torch_model(self, model):
        self.torch_model = model
        self.torch_model.eval()
    
    def get_inference_time(self, input_data, iterations=100):
        import time
        
        if input_data is None:
            return 0
        
        input_data = input_data.astype(np.float32)
        
        for _ in range(10):
            self.infer(input_data)
        
        start_time = time.time()
        for _ in range(iterations):
            self.infer(input_data)
        end_time = time.time()
        
        avg_time = (end_time - start_time) / iterations * 1000
        print(f"[TensorRT] 平均推理时间: {avg_time:.2f} ms")
        return avg_time
    
    def cleanup(self):
        if self.stream:
            self.stream.synchronize()
        self.inputs = []
        self.outputs = []
        self.bindings = []
        self.context = None
        self.engine = None
        self.ort_session = None
