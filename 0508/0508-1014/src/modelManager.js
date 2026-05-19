import { ESPCNModel } from './espcnModel.js';

export class ModelManager {
  constructor(webnnEngine) {
    this.webnnEngine = webnnEngine;
    this.models = new Map();
    this.activeModel = null;
    this.loadingPromises = new Map();
    this.modelCache = new Map();
    this.onModelLoaded = null;
    this.onModelActivated = null;
    this.onError = null;
    this.maxCacheSize = 3;
  }
  
  async initialize() {
    await this._loadBuiltinModels();
    console.log('ModelManager initialized with', this.models.size, 'models');
  }
  
  async _loadBuiltinModels() {
    const builtinModels = [
      {
        id: 'espcn-2x',
        name: 'ESPCN 2x',
        type: 'espcn',
        scaleFactor: 2,
        description: '轻量级2倍超分，速度快',
        config: { channels: 3, f1: 5, f2: 3, f3: 3, n1: 64, n2: 32 }
      },
      {
        id: 'espcn-3x',
        name: 'ESPCN 3x',
        type: 'espcn',
        scaleFactor: 3,
        description: '3倍超分，平衡速度质量',
        config: { channels: 3, f1: 5, f2: 3, f3: 3, n1: 64, n2: 32 }
      },
      {
        id: 'espcn-2x-lite',
        name: 'ESPCN 2x Lite',
        type: 'espcn',
        scaleFactor: 2,
        description: '轻量化2倍超分，最快速度',
        config: { channels: 3, f1: 3, f2: 3, f3: 3, n1: 32, n2: 16 }
      },
      {
        id: 'espcn-2x-pro',
        name: 'ESPCN 2x Pro',
        type: 'espcn',
        scaleFactor: 2,
        description: '高质量2倍超分，更好细节',
        config: { channels: 3, f1: 5, f2: 5, f3: 3, n1: 128, n2: 64 }
      }
    ];
    
    for (const modelInfo of builtinModels) {
      this.models.set(modelInfo.id, {
        ...modelInfo,
        loaded: false,
        instance: null,
        loadTime: null
      });
    }
  }
  
  async loadModel(modelId, options = {}) {
    if (this.loadingPromises.has(modelId)) {
      return this.loadingPromises.get(modelId);
    }
    
    const modelInfo = this.models.get(modelId);
    if (!modelInfo) {
      throw new Error(`Model not found: ${modelId}`);
    }
    
    if (modelInfo.loaded && modelInfo.instance) {
      return modelInfo.instance;
    }
    
    const loadPromise = this._loadModelInternal(modelInfo, options);
    this.loadingPromises.set(modelId, loadPromise);
    
    try {
      const instance = await loadPromise;
      modelInfo.loaded = true;
      modelInfo.instance = instance;
      modelInfo.loadTime = Date.now();
      
      this._addToCache(modelId, instance);
      
      if (this.onModelLoaded) {
        this.onModelLoaded(modelId, modelInfo);
      }
      
      return instance;
    } catch (error) {
      if (this.onError) {
        this.onError(modelId, error);
      }
      throw error;
    } finally {
      this.loadingPromises.delete(modelId);
    }
  }
  
  async _loadModelInternal(modelInfo, options) {
    console.log(`Loading model: ${modelInfo.name} (${modelInfo.id})`);
    
    if (modelInfo.type === 'espcn') {
      const model = new ESPCNModel(
        this.webnnEngine,
        modelInfo.scaleFactor
      );
      
      if (modelInfo.config) {
        model.overrideConfig(modelInfo.config);
      }
      
      await model.load();
      return model;
    }
    
    throw new Error(`Unsupported model type: ${modelInfo.type}`);
  }
  
  async activateModel(modelId, options = {}) {
    const modelInfo = this.models.get(modelId);
    if (!modelInfo) {
      throw new Error(`Model not found: ${modelId}`);
    }
    
    let instance = modelInfo.instance;
    
    if (!instance) {
      instance = await this.loadModel(modelId, options);
    }
    
    this.activeModel = {
      id: modelId,
      instance,
      info: modelInfo,
      activatedAt: Date.now()
    };
    
    if (this.onModelActivated) {
      this.onModelActivated(modelId, modelInfo);
    }
    
    console.log(`Model activated: ${modelInfo.name}`);
    return instance;
  }
  
  async switchModel(modelId, options = {}) {
    const previousModel = this.activeModel;
    
    try {
      const newModel = await this.activateModel(modelId, options);
      
      if (previousModel && previousModel.id !== modelId) {
        this._unloadModelIfNeeded(previousModel.id);
      }
      
      return newModel;
    } catch (error) {
      if (previousModel) {
        this.activeModel = previousModel;
      }
      throw error;
    }
  }
  
  _unloadModelIfNeeded(modelId) {
    const modelInfo = this.models.get(modelId);
    if (!modelInfo) return;
    
    if (this.modelCache.has(modelId)) {
      return;
    }
    
    this._unloadModel(modelId);
  }
  
  _unloadModel(modelId) {
    const modelInfo = this.models.get(modelId);
    if (!modelInfo) return;
    
    if (modelInfo.instance && modelInfo.instance.dispose) {
      modelInfo.instance.dispose();
    }
    
    modelInfo.instance = null;
    modelInfo.loaded = false;
    
    this.modelCache.delete(modelId);
    
    console.log(`Model unloaded: ${modelId}`);
  }
  
  _addToCache(modelId, instance) {
    if (this.modelCache.has(modelId)) {
      return;
    }
    
    this.modelCache.set(modelId, {
      instance,
      lastUsed: Date.now()
    });
    
    if (this.modelCache.size > this.maxCacheSize) {
      const entries = Array.from(this.modelCache.entries());
      entries.sort((a, b) => a[1].lastUsed - b[1].lastUsed);
      
      const [oldestId] = entries[0];
      if (oldestId !== this.activeModel?.id) {
        this._unloadModel(oldestId);
      }
    }
  }
  
  async loadCustomModel(modelConfig) {
    const modelId = modelConfig.id || `custom-${Date.now()}`;
    
    const modelInfo = {
      id: modelId,
      name: modelConfig.name || 'Custom Model',
      type: modelConfig.type || 'espcn',
      scaleFactor: modelConfig.scaleFactor || 2,
      description: modelConfig.description || '自定义模型',
      config: modelConfig.config,
      weightsUrl: modelConfig.weightsUrl,
      custom: true,
      loaded: false,
      instance: null
    };
    
    this.models.set(modelId, modelInfo);
    
    try {
      const instance = await this.loadModel(modelId);
      return { modelId, instance, modelInfo };
    } catch (error) {
      this.models.delete(modelId);
      throw error;
    }
  }
  
  async unloadModel(modelId) {
    if (this.activeModel?.id === modelId) {
      throw new Error('Cannot unload active model');
    }
    
    this._unloadModel(modelId);
  }
  
  getActiveModel() {
    return this.activeModel;
  }
  
  getModelInfo(modelId) {
    return this.models.get(modelId);
  }
  
  getAllModels() {
    return Array.from(this.models.values()).map(model => ({
      id: model.id,
      name: model.name,
      type: model.type,
      scaleFactor: model.scaleFactor,
      description: model.description,
      loaded: model.loaded,
      active: this.activeModel?.id === model.id,
      custom: model.custom || false
    }));
  }
  
  getLoadedModels() {
    return Array.from(this.models.values())
      .filter(m => m.loaded)
      .map(m => m.id);
  }
  
  isModelLoaded(modelId) {
    return this.models.get(modelId)?.loaded || false;
  }
  
  isModelLoading(modelId) {
    return this.loadingPromises.has(modelId);
  }
  
  dispose() {
    for (const [modelId] of this.models) {
      this._unloadModel(modelId);
    }
    this.models.clear();
    this.modelCache.clear();
    this.loadingPromises.clear();
    this.activeModel = null;
  }
  
  setMaxCacheSize(size) {
    this.maxCacheSize = Math.max(1, size);
  }
}
