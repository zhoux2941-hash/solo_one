import { VirtualExhibition } from './VirtualExhibition.js';
import { ModelViewer } from './ModelViewer.js';

class ExhibitionApp {
  constructor() {
    this.container = document.getElementById('canvas-container');
    this.exhibition = null;
    this.config = null;
    this.modelViewer = null;
    
    this.init();
  }

  async init() {
    await this.loadConfig();
    this.createExhibition();
    this.setupUI();
    this.setupNavigationMap();
    this.setupModal();
    
    document.getElementById('loading').classList.add('hidden');
    
    setTimeout(() => {
      this.preloadScenes();
    }, 2000);
  }

  async loadConfig() {
    try {
      const response = await fetch('/api/config');
      this.config = await response.json();
    } catch (e) {
      console.log('Using demo config');
      this.config = this.getDemoConfig();
    }
  }

  getDemoConfig() {
    return {
      scenes: [
        {
          id: 'entrance',
          name: '展厅入口',
          image: 'https://picsum.photos/2048/1024?random=1',
          position: { x: 50, y: 75 }
        },
        {
          id: 'gallery1',
          name: '一号展厅',
          image: 'https://picsum.photos/2048/1024?random=2',
          position: { x: 50, y: 25 }
        },
        {
          id: 'gallery2',
          name: '二号展厅',
          image: 'https://picsum.photos/2048/1024?random=3',
          position: { x: 150, y: 25 }
        }
      ],
      hotspots: [
        {
          sceneId: 'entrance',
          position: { x: 0, y: 0, z: -400 },
          type: 'navigate',
          target: 'gallery1',
          title: '前往一号展厅'
        },
        {
          sceneId: 'entrance',
          position: { x: 300, y: 0, z: 0 },
          type: 'info',
          title: '欢迎来到虚拟展厅',
          description: '本展厅展示了各种珍贵艺术品，请自由探索。使用鼠标拖动可以旋转视角，点击绿色热点可以跳转到其他展厅，点击蓝色热点可以查看展品详情，紫色热点是3D展品可360度旋转查看。',
          image: 'https://picsum.photos/400/300?random=10'
        },
        {
          sceneId: 'entrance',
          position: { x: -300, y: 0, z: 0 },
          type: 'model',
          title: '3D展品展示台',
          description: '点击查看精美的3D展品模型，支持360度旋转、缩放查看。可拖动旋转视角，滚轮调整距离。',
          category: '艺术品',
          modelUrl: ''
        },
        {
          sceneId: 'gallery1',
          position: { x: 0, y: 0, z: 400 },
          type: 'navigate',
          target: 'entrance',
          title: '返回入口'
        },
        {
          sceneId: 'gallery1',
          position: { x: 0, y: 0, z: -400 },
          type: 'navigate',
          target: 'gallery2',
          title: '前往二号展厅'
        },
        {
          sceneId: 'gallery1',
          position: { x: -300, y: 50, z: 0 },
          type: 'info',
          title: '《蒙娜丽莎》复制品',
          description: '这是达芬奇著名画作《蒙娜丽莎》的高精度复制品。原作创作于1503-1519年，现藏于法国卢浮宫。',
          image: 'https://picsum.photos/400/300?random=11'
        },
        {
          sceneId: 'gallery1',
          position: { x: 300, y: -50, z: 0 },
          type: 'model',
          title: '青铜古鼎',
          description: '这是一件精美的商周时期青铜鼎3D模型。鼎是中国古代最重要的礼器之一，象征着权力与地位。',
          category: '青铜器',
          modelUrl: ''
        },
        {
          sceneId: 'gallery2',
          position: { x: 0, y: 0, z: 400 },
          type: 'navigate',
          target: 'gallery1',
          title: '返回一号展厅'
        },
        {
          sceneId: 'gallery2',
          position: { x: 300, y: -50, z: 0 },
          type: 'info',
          title: '古希腊雕塑',
          description: '这是一尊公元前5世纪的古希腊大理石雕塑复制品，展现了古希腊艺术的巅峰成就。',
          image: 'https://picsum.photos/400/300?random=12'
        },
        {
          sceneId: 'gallery2',
          position: { x: -300, y: 50, z: 0 },
          type: 'model',
          title: '翡翠白菜',
          description: '著名的翡翠白菜3D模型，精细雕刻的叶片和昆虫栩栩如生，是清代玉雕艺术的巅峰之作。',
          category: '玉器',
          modelUrl: ''
        }
      ]
    };
  }

  async preloadScenes() {
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
      loadingText.textContent = '正在预加载场景...';
    }
    
    this.exhibition.onLoadProgress = (progress) => {
      if (loadingText) {
        loadingText.textContent = `预加载中... ${Math.round(progress * 100)}%`;
      }
    };
    
    await this.exhibition.preloadAllScenes();
  }

  createExhibition() {
    this.exhibition = new VirtualExhibition(this.container);
    
    Promise.all(
      this.config.scenes.map(scene => 
        this.exhibition.addPanoramaScene(scene.id, scene.image, scene)
      )
    ).then(() => {
      this.config.hotspots.forEach(hotspot => {
        this.exhibition.addHotspot(hotspot.sceneId, hotspot);
      });
    });
    
    this.exhibition.onSceneChange = (sceneId) => {
      this.updateNavigationMap(sceneId);
      document.querySelector('.title').textContent = 
        this.config.scenes.find(s => s.id === sceneId)?.name || '虚拟展厅导览';
    };
    
    this.exhibition.onHotspotInfo = (config) => {
      if (config.type === 'model') {
        this.showModelModal(config);
      } else {
        this.showModal(config);
      }
    };

    this.exhibition.onMagicModeEnabled = () => {
      this.showCalibrationButton();
    };
  }

  setupUI() {
    document.getElementById('vr-btn').addEventListener('click', () => {
      this.toggleVR();
    });
    
    document.getElementById('magic-btn').addEventListener('click', () => {
      this.toggleMagicMode();
    });
    
    document.getElementById('admin-btn').addEventListener('click', () => {
      window.open('/admin', '_blank');
    });
  }

  showCalibrationButton() {
    const hint = document.querySelector('.hint');
    if (!hint) return;
    
    const calibHint = document.createElement('div');
    calibHint.style.cssText = `
      margin-top: 10px;
      padding: 8px 12px;
      background: rgba(76, 175, 80, 0.8);
      border-radius: 6px;
      cursor: pointer;
      text-align: center;
      transition: all 0.3s;
    `;
    calibHint.innerHTML = '🎯 点击校准陀螺仪';
    calibHint.id = 'calibrate-btn';
    
    calibHint.addEventListener('click', () => {
      this.exhibition.calibrateGyroscope();
      calibHint.innerHTML = '✅ 已校准！';
      calibHint.style.background = 'rgba(76, 175, 80, 1)';
      setTimeout(() => {
        calibHint.innerHTML = '🎯 点击校准陀螺仪';
        calibHint.style.background = 'rgba(76, 175, 80, 0.8)';
      }, 2000);
    });
    
    hint.appendChild(calibHint);
  }

  toggleVR() {
    const btn = document.getElementById('vr-btn');
    if (this.exhibition.isVRMode) {
      this.exhibition.disableVR();
      btn.classList.remove('active');
      btn.textContent = 'VR模式';
    } else {
      if (navigator.xr) {
        navigator.xr.requestSession('immersive-vr', {
          requiredFeatures: ['local-floor']
        }).then((session) => {
          this.exhibition.xrSession = session;
          this.exhibition.enableVR();
          btn.classList.add('active');
          btn.textContent = '退出VR';
          
          session.addEventListener('end', () => {
            this.exhibition.disableVR();
            btn.classList.remove('active');
            btn.textContent = 'VR模式';
          });
        }).catch((e) => {
          alert('无法启动VR模式，请确保已连接VR设备');
          console.error(e);
        });
      } else {
        alert('您的浏览器不支持WebXR，请使用Chrome或Edge浏览器');
      }
    }
  }

  toggleMagicMode() {
    const btn = document.getElementById('magic-btn');
    const calibBtn = document.getElementById('calibrate-btn');
    
    if (this.exhibition.isMagicMode) {
      this.exhibition.disableMagicMode();
      btn.classList.remove('active');
      btn.textContent = '魔镜模式';
      if (calibBtn) calibBtn.remove();
    } else {
      this.exhibition.enableMagicMode();
      btn.classList.add('active');
      btn.textContent = '退出魔镜';
    }
  }

  setupNavigationMap() {
    const mapContainer = document.getElementById('map-container');
    
    this.config.scenes.forEach(scene => {
      const point = document.createElement('div');
      point.className = 'map-point';
      point.style.left = `${scene.position.x}px`;
      point.style.top = `${scene.position.y}px`;
      point.dataset.sceneId = scene.id;
      
      const label = document.createElement('div');
      label.className = 'map-point-label';
      label.textContent = scene.name;
      point.appendChild(label);
      
      point.addEventListener('click', () => {
        this.exhibition.setCurrentScene(scene.id);
      });
      
      mapContainer.appendChild(point);
    });
    
    this.updateNavigationMap(this.exhibition.getCurrentSceneId());
  }

  updateNavigationMap(currentSceneId) {
    const points = document.querySelectorAll('.map-point');
    points.forEach(point => {
      if (point.dataset.sceneId === currentSceneId) {
        point.classList.add('current');
      } else {
        point.classList.remove('current');
      }
    });
  }

  setupModal() {
    document.getElementById('modal-close').addEventListener('click', () => {
      this.hideModal();
    });
    
    document.getElementById('modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') {
        this.hideModal();
      }
    });

    document.getElementById('model-modal-close').addEventListener('click', () => {
      this.hideModelModal();
    });
    
    document.getElementById('model-modal-overlay').addEventListener('click', (e) => {
      if (e.target.id === 'model-modal-overlay') {
        this.hideModelModal();
      }
    });

    document.getElementById('btn-rotate').addEventListener('click', (e) => {
      if (this.modelViewer) {
        const btn = e.currentTarget;
        const newState = !this.modelViewer.controls.autoRotate;
        this.modelViewer.setAutoRotate(!newState);
        btn.classList.toggle('active', !newState);
      }
    });

    document.getElementById('btn-reset').addEventListener('click', () => {
      if (this.modelViewer) {
        this.modelViewer.resetView();
      }
    });
  }

  showModal(config) {
    document.getElementById('modal-title').textContent = config.title;
    
    let content = '';
    if (config.image) {
      content += `<img src="${config.image}" class="exhibit-image" alt="${config.title}" loading="lazy">`;
    }
    content += '<div class="exhibit-info">';
    content += `<div class="info-row"><span class="info-label">名称：</span><span>${config.title}</span></div>`;
    content += `<div class="info-row"><span class="info-label">描述：</span><span>${config.description || '暂无描述'}</span></div>`;
    content += '</div>';
    
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('modal-overlay').classList.add('active');
  }

  hideModal() {
    document.getElementById('modal-overlay').classList.remove('active');
  }

  async showModelModal(config) {
    document.getElementById('model-modal-title').textContent = '3D展品展示';
    document.getElementById('model-name').textContent = config.title;
    document.getElementById('model-description').textContent = config.description || '精美3D展品，可360度旋转查看';
    document.getElementById('model-category').textContent = config.category || '3D展品';
    
    document.getElementById('model-modal-overlay').classList.add('active');
    document.getElementById('model-loading').classList.remove('hidden');
    document.getElementById('model-progress').style.width = '0%';
    
    setTimeout(() => {
      if (!this.modelViewer) {
        const container = document.getElementById('model-viewer-container');
        this.modelViewer = new ModelViewer(container);
      }
      
      this.loadModel(config);
    }, 100);
  }

  async loadModel(config) {
    const progressBar = document.getElementById('model-progress');
    const loadingOverlay = document.getElementById('model-loading');
    
    try {
      if (config.modelUrl) {
        await this.modelViewer.loadModel(config.modelUrl, (progress) => {
          progressBar.style.width = `${progress * 100}%`;
        });
      } else {
        this.modelViewer.createDemoModel();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setTimeout(() => {
        loadingOverlay.classList.add('hidden');
      }, 300);
    } catch (error) {
      console.error('Failed to load model:', error);
      loadingOverlay.classList.add('hidden');
    }
  }

  hideModelModal() {
    document.getElementById('model-modal-overlay').classList.remove('active');
    if (this.modelViewer) {
      this.modelViewer.destroy();
      this.modelViewer = null;
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new ExhibitionApp();
});