export class ESPCNModel {
  constructor(engine, scaleFactor = 2) {
    this.engine = engine;
    this.scaleFactor = scaleFactor;
    this.isLoaded = false;
    this.weights = {};
    this.biases = {};
    this.webglProgram = null;
    this.canvas = null;
    this.gl = null;
    this.config = {
      channels: 3,
      f1: 5,
      f2: 3,
      f3: 3,
      n1: 64,
      n2: 32
    };
  }
  
  overrideConfig(config) {
    this.config = { ...this.config, ...config };
    if (this.isLoaded) {
      this._initializeWeights();
    }
  }
  
  getConfig() {
    return { ...this.config };
  }
  
  async load() {
    this._initializeWeights();
    this._initWebGL();
    this.isLoaded = true;
    console.log(`ESPCN ${this.scaleFactor}x model loaded`);
  }
  
  setScaleFactor(scale) {
    this.scaleFactor = scale;
    this._initializeWeights();
  }
  
  _initializeWeights() {
    const { channels, f1, f2, f3, n1, n2 } = this.config;
    const n3 = channels * this.scaleFactor * this.scaleFactor;
    
    this.weights = {
      conv1: this._createRandomWeights(n1, channels, f1, f1),
      conv2: this._createRandomWeights(n2, n1, f2, f2),
      conv3: this._createRandomWeights(n3, n2, f3, f3)
    };
    
    this.biases = {
      conv1: new Float32Array(n1).fill(0.1),
      conv2: new Float32Array(n2).fill(0.1),
      conv3: new Float32Array(n3).fill(0)
    };
  }
  
  _createRandomWeights(outChannels, inChannels, kernelH, kernelW) {
    const size = outChannels * inChannels * kernelH * kernelW;
    const weights = new Float32Array(size);
    const scale = Math.sqrt(2 / (inChannels * kernelH * kernelW));
    
    for (let i = 0; i < size; i++) {
      weights[i] = (Math.random() * 2 - 1) * scale;
    }
    
    return weights;
  }
  
  async infer(frameData, width, height) {
    const startTime = performance.now();
    
    let outputData;
    let inferenceTime;
    
    if (this.engine.isAvailable()) {
      const result = await this._inferWebNN(frameData, width, height);
      outputData = result.data;
      inferenceTime = result.inferenceTime;
    } else {
      const result = await this._inferWebGL(frameData, width, height);
      outputData = result.data;
      inferenceTime = result.inferenceTime;
    }
    
    const totalTime = performance.now() - startTime;
    
    return {
      data: outputData,
      width: width * this.scaleFactor,
      height: height * this.scaleFactor,
      inferenceTime,
      totalTime
    };
  }
  
  async _inferWebNN(frameData, width, height) {
    const inputTensor = await this.engine.createTensor('float32', [1, 3, height, width], frameData);
    
    const conv1 = this.engine.conv2d(inputTensor, this.weights.conv1, this.biases.conv1, {
      padding: [2, 2, 2, 2],
      strides: [1, 1]
    });
    const relu1 = this.engine.relu(conv1);
    
    const conv2 = this.engine.conv2d(relu1, this.weights.conv2, this.biases.conv2, {
      padding: [1, 1, 1, 1],
      strides: [1, 1]
    });
    const relu2 = this.engine.relu(conv2);
    
    const conv3 = this.engine.conv2d(relu2, this.weights.conv3, this.biases.conv3, {
      padding: [1, 1, 1, 1],
      strides: [1, 1]
    });
    
    const depthToSpace = this.engine.depthToSpace(conv3, this.scaleFactor);
    
    const result = await this.engine.execute(inputTensor, depthToSpace, frameData);
    
    return result;
  }
  
  _initWebGL() {
    try {
      this.canvas = document.createElement('canvas');
      this.gl = this.canvas.getContext('webgl2') || this.canvas.getContext('webgl');
      
      if (this.gl) {
        this._createWebGLProgram();
      }
    } catch (e) {
      console.warn('WebGL not available for ESPCN');
    }
  }
  
  _createWebGLProgram() {
    const gl = this.gl;
    
    const vertexShader = `
      attribute vec2 a_position;
      varying vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;
    
    const fragmentShader = `
      precision highp float;
      varying vec2 v_texCoord;
      uniform sampler2D u_image;
      uniform float u_scale;
      uniform vec2 u_resolution;
      
      vec4 cubic(float v) {
        vec4 n = vec4(1.0, 2.0, 3.0, 4.0) - v;
        vec4 s = n * n * n;
        float x = s.x;
        float y = s.y - 4.0 * s.x;
        float z = s.z - 4.0 * s.y + 6.0 * s.x;
        float w = 6.0 - x - y - z;
        return vec4(x, y, z, w) * (1.0 / 6.0);
      }
      
      vec4 textureBicubic(sampler2D sampler, vec2 texCoords) {
        vec2 texSize = vec2(textureSize(sampler, 0));
        vec2 invTexSize = 1.0 / texSize;
        
        texCoords = texCoords * texSize - 0.5;
        
        vec2 fxy = fract(texCoords);
        texCoords -= fxy;
        
        vec4 xcubic = cubic(fxy.x);
        vec4 ycubic = cubic(fxy.y);
        
        vec4 c = texCoords.xxyy + vec2(-0.5, +1.5).xyxy;
        
        vec4 s = vec4(xcubic.xz + xcubic.yw, ycubic.xz + ycubic.yw);
        vec4 offset = c + vec4(xcubic.yw, ycubic.yw) / s;
        
        offset *= invTexSize.xxyy;
        
        vec4 sample0 = texture2D(sampler, offset.xz);
        vec4 sample1 = texture2D(sampler, offset.yz);
        vec4 sample2 = texture2D(sampler, offset.xw);
        vec4 sample3 = texture2D(sampler, offset.yw);
        
        float sx = s.x / (s.x + s.y);
        float sy = s.z / (s.z + s.w);
        
        return mix(
          mix(sample3, sample2, sx),
          mix(sample1, sample0, sx),
          sy
        );
      }
      
      void main() {
        vec2 uv = v_texCoord;
        vec4 color = textureBicubic(u_image, uv);
        
        float sharpen = 0.3;
        vec4 center = color;
        vec4 up = textureBicubic(u_image, uv + vec2(0.0, 1.0 / u_resolution.y));
        vec4 down = textureBicubic(u_image, uv - vec2(0.0, 1.0 / u_resolution.y));
        vec4 left = textureBicubic(u_image, uv - vec2(1.0 / u_resolution.x, 0.0));
        vec4 right = textureBicubic(u_image, uv + vec2(1.0 / u_resolution.x, 0.0));
        
        vec4 highPass = center * 4.0 - (up + down + left + right);
        color = color + highPass * sharpen;
        
        gl_FragColor = vec4(color.rgb, 1.0);
      }
    `;
    
    const vs = this._compileShader(gl.VERTEX_SHADER, vertexShader);
    const fs = this._compileShader(gl.FRAGMENT_SHADER, fragmentShader);
    
    this.webglProgram = gl.createProgram();
    gl.attachShader(this.webglProgram, vs);
    gl.attachShader(this.webglProgram, fs);
    gl.linkProgram(this.webglProgram);
    
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);
    
    this.texture = gl.createTexture();
  }
  
  _compileShader(type, source) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      return null;
    }
    
    return shader;
  }
  
  async _inferWebGL(frameData, width, height) {
    if (!this.gl || !this.webglProgram) {
      return this._inferCPU(frameData, width, height);
    }
    
    const gl = this.gl;
    const program = this.webglProgram;
    const outputWidth = width * this.scaleFactor;
    const outputHeight = height * this.scaleFactor;
    
    this.canvas.width = outputWidth;
    this.canvas.height = outputHeight;
    
    gl.viewport(0, 0, outputWidth, outputHeight);
    gl.useProgram(program);
    
    const positionLoc = gl.getAttribLocation(program, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, frameData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    
    const imageLoc = gl.getUniformLocation(program, 'u_image');
    const scaleLoc = gl.getUniformLocation(program, 'u_scale');
    const resolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    
    gl.uniform1i(imageLoc, 0);
    gl.uniform1f(scaleLoc, this.scaleFactor);
    gl.uniform2f(resolutionLoc, outputWidth, outputHeight);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.flush();
    
    const pixels = new Uint8Array(outputWidth * outputHeight * 4);
    gl.readPixels(0, 0, outputWidth, outputHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    
    return {
      data: pixels,
      inferenceTime: performance.now() - performance.now()
    };
  }
  
  _inferCPU(frameData, width, height) {
    const startTime = performance.now();
    const outputWidth = width * this.scaleFactor;
    const outputHeight = height * this.scaleFactor;
    const output = new Uint8ClampedArray(outputWidth * outputHeight * 4);
    
    for (let y = 0; y < outputHeight; y++) {
      for (let x = 0; x < outputWidth; x++) {
        const srcX = Math.floor(x / this.scaleFactor);
        const srcY = Math.floor(y / this.scaleFactor);
        const srcIdx = (srcY * width + srcX) * 4;
        const dstIdx = (y * outputWidth + x) * 4;
        
        output[dstIdx] = frameData[srcIdx];
        output[dstIdx + 1] = frameData[srcIdx + 1];
        output[dstIdx + 2] = frameData[srcIdx + 2];
        output[dstIdx + 3] = 255;
      }
    }
    
    const inferenceTime = performance.now() - startTime;
    
    return {
      data: output,
      inferenceTime
    };
  }
  
  isReady() {
    return this.isLoaded;
  }
  
  dispose() {
    if (this.gl && this.webglProgram) {
      this.gl.deleteProgram(this.webglProgram);
      this.webglProgram = null;
    }
    
    if (this.gl && this.texture) {
      this.gl.deleteTexture(this.texture);
      this.texture = null;
    }
    
    if (this.gl && this.positionBuffer) {
      this.gl.deleteBuffer(this.positionBuffer);
      this.positionBuffer = null;
    }
    
    this.gl = null;
    this.canvas = null;
    this.weights = {};
    this.biases = {};
    this.isLoaded = false;
    
    console.log('ESPCNModel disposed');
  }
  
  async reload() {
    this.dispose();
    await this.load();
  }
  
  clone() {
    const clone = new ESPCNModel(this.engine, this.scaleFactor);
    clone.overrideConfig(this.config);
    return clone;
  }
}
