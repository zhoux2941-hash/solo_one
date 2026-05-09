<template>
  <div class="params-config">
    <h3>模拟参数配置</h3>
    
    <div class="children-config">
      <h4>孩子信息</h4>
      <div 
        v-for="(child, index) in safeChildren" 
        :key="index" 
        class="child-item"
      >
        <label>
          姓名:
          <input 
            v-model="child.name" 
            type="text" 
            placeholder="输入名字"
          />
        </label>
        <label>
          年龄:
          <input 
            v-model.number="child.age" 
            type="number" 
            min="3" 
            max="15"
          />
        </label>
        <button 
          v-if="safeChildren.length > 1" 
          @click="removeChild(index)"
          class="btn-remove"
        >
          删除
        </button>
      </div>
      <button @click="addChild" class="btn-add">+ 添加孩子</button>
    </div>

    <div class="params-section">
      <h4>游戏参数</h4>
      <label>
        等待耐心系数:
        <input 
          v-model.number="safeParams.patienceCoefficient" 
          type="number" 
          min="5" 
          max="120"
        />
        <span class="hint">秒 (3-5岁低耐心，6-10岁中等，11+岁高耐心)</span>
      </label>
      <label>
        滑梯使用时间:
        <input 
          v-model.number="safeParams.slideUsageTime" 
          type="number" 
          min="1" 
          max="60"
        />
        <span class="hint">秒/次</span>
      </label>
      <label>
        总模拟时间:
        <input 
          v-model.number="safeParams.totalSimulationTime" 
          type="number" 
          min="10" 
          max="600"
        />
        <span class="hint">秒</span>
      </label>
    </div>

    <div class="actions">
      <button @click="saveParams" class="btn-save">保存参数</button>
      <button @click="$emit('run')" class="btn-run">单次模拟</button>
    </div>
    
    <div class="advanced-section">
      <h4>高级分析</h4>
      <div class="advanced-actions">
        <button @click="$emit('montecarlo')" class="btn-montecarlo">
          🎲 蒙特卡洛模拟
          <span class="btn-hint">10次统计</span>
        </button>
        <button @click="$emit('optimize')" class="btn-optimize">
          🎯 参数优化
          <span class="btn-hint">推荐最佳时间</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ParamsConfig',
  props: {
    params: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['save', 'run', 'montecarlo', 'optimize'],
  computed: {
    safeParams() {
      return {
        patienceCoefficient: (this.params && this.params.patienceCoefficient) || 30,
        slideUsageTime: (this.params && this.params.slideUsageTime) || 10,
        totalSimulationTime: (this.params && this.params.totalSimulationTime) || 120,
        children: this.safeChildren
      }
    },
    safeChildren() {
      const children = (this.params && this.params.children) || []
      return children.map(child => ({
        name: child.name || `孩子${children.indexOf(child) + 1}`,
        age: child.age || 6
      }))
    }
  },
  methods: {
    addChild() {
      if (!this.params.children) {
        this.params.children = []
      }
      this.params.children.push({
        name: `孩子${this.params.children.length + 1}`,
        age: 6
      })
    },
    removeChild(index) {
      if (this.params.children && this.params.children.length > 1) {
        this.params.children.splice(index, 1)
      }
    },
    saveParams() {
      this.$emit('save', this.params)
    }
  }
}
</script>

<style scoped>
.params-config {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.params-config h3 {
  margin: 0 0 20px 0;
  color: #333;
}

.params-config h4 {
  margin: 15px 0 10px 0;
  color: #666;
  font-size: 14px;
}

.children-config {
  margin-bottom: 20px;
}

.child-item {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.child-item label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
}

.child-item input {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 100px;
}

.params-section label {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  font-size: 14px;
  flex-wrap: wrap;
}

.params-section input {
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 80px;
}

.hint {
  color: #999;
  font-size: 12px;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

button {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.2s;
}

button:hover {
  opacity: 0.8;
}

.btn-add {
  background: #e8f5e9;
  color: #2e7d32;
}

.btn-remove {
  background: #ffebee;
  color: #c62828;
  padding: 4px 10px;
}

.btn-save {
  background: #2196f3;
  color: white;
}

.btn-run {
  background: #4caf50;
  color: white;
}

.advanced-section {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.advanced-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-montecarlo,
.btn-optimize {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-montecarlo:hover,
.btn-optimize:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-montecarlo {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-optimize {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.btn-hint {
  font-size: 11px;
  opacity: 0.9;
  font-weight: normal;
  margin-top: 2px;
}
</style>
