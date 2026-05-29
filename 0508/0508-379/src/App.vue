<template>
  <div class="app-container">
    <header class="header">
      <h1><i class="fas fa-scroll"></i> 甲骨文字形库</h1>
      <p>探索三千年前的文字奥秘</p>
    </header>

    <section class="search-section">
      <div class="search-box">
        <div class="search-input-group">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="输入汉字搜索甲骨文（如：日、月、人）"
            @keyup.enter="handleSearch"
          />
        </div>
        <button class="search-btn" @click="handleSearch">
          <i class="fas fa-search"></i> 搜索
        </button>
      </div>

      <div class="radical-filter">
        <span class="filter-label">部首筛选：</span>
        <button
          v-for="radical in radicals"
          :key="radical.id"
          :class="['radical-tag', { active: selectedRadical === radical.id }]"
          @click="selectRadical(radical.id)"
        >
          {{ radical.name }}
        </button>
      </div>
    </section>

    <div v-if="isCombinedSearch" class="combined-hint">
      <i class="fas fa-lightbulb"></i>
      <span>"{{ combinedOriginalChar }}"未找到直接字形，{{ compoundMappings[combinedOriginalChar]?.meaning || '已拆分为' }}：{{ compoundMappings[combinedOriginalChar]?.chars?.join(' + ') }}</span>
    </div>

    <div v-if="showRelatedHint" class="related-hint">
      <i class="fas fa-link"></i>
      <span>以下为与"{{ searchQuery }}"词义相关的甲骨文字形</span>
    </div>

    <section class="results-section" v-if="filteredData.length > 0">
      <div
        v-for="item in filteredData"
        :key="item.id"
        class="card"
        @click="showDetail(item)"
      >
        <div class="card-image">
          <svg viewBox="0 0 100 100">
            <component :is="getJiaguwenSVG(item.char)" />
          </svg>
        </div>
        <div class="card-title">{{ item.char }}</div>
        <div class="card-meta">
          <div class="card-meta-item">
            <span>出处：</span>{{ item.source }}
          </div>
          <div class="card-meta-item">
            <span>分期：</span>{{ getPeriodName(item.period) }}
          </div>
        </div>
        <button class="compare-btn" @click.stop="addToCompare(item)">
          <i class="fas fa-balance-scale"></i> 添加对比
        </button>
      </div>
    </section>

    <div class="empty-state" v-else>
      <i class="fas fa-search"></i>
      <p>{{ searchQuery ? '未找到相关甲骨文字形' : '请输入汉字进行搜索' }}</p>
    </div>

    <section class="compare-section" v-if="compareList.length > 0">
      <h3><i class="fas fa-balance-scale"></i> 字形对比 ({{ compareList.length }}/2)</h3>
      <div class="compare-grid">
        <div
          v-for="(item, index) in compareList"
          :key="item.id"
          class="compare-item"
        >
          <div class="card-image">
            <svg viewBox="0 0 100 100">
              <component :is="getJiaguwenSVG(item.char)" />
            </svg>
          </div>
          <div class="card-title">{{ item.char }}</div>
          <div class="card-meta">
            <div class="card-meta-item">{{ item.source }}</div>
            <div class="card-meta-item">{{ getPeriodName(item.period) }}</div>
          </div>
        </div>
        <div v-for="n in (2 - compareList.length)" :key="'empty-' + n" class="compare-item empty">
          <div class="card-image empty">
            <i class="fas fa-plus"></i>
          </div>
          <div class="card-title">添加字形</div>
        </div>
      </div>
      <button class="clear-compare-btn" @click="clearCompare">
        <i class="fas fa-trash"></i> 清空对比
      </button>
    </section>

    <div class="modal-overlay" v-if="selectedItem" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2>{{ selectedItem.char }} - 详细信息</h2>
          <span class="modal-close" @click="closeModal">&times;</span>
        </div>
        <div class="modal-image">
          <svg viewBox="0 0 100 100">
            <component :is="getJiaguwenSVG(selectedItem.char)" />
          </svg>
        </div>
        <div class="modal-details">
          <div class="modal-detail-item">
            <strong>汉字：</strong>{{ selectedItem.char }}
          </div>
          <div class="modal-detail-item">
            <strong>出处：</strong>{{ selectedItem.source }}
          </div>
          <div class="modal-detail-item">
            <strong>分期：</strong>{{ getPeriodName(selectedItem.period) }}
          </div>
          <div class="modal-detail-item">
            <strong>部首：</strong>{{ getRadicalName(selectedItem.radical) }}
          </div>
          <div class="modal-detail-item">
            <strong>释读：</strong>{{ selectedItem.description }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>import { ref, computed, markRaw } from 'vue';
import { jiaguwenData, radicals, periods } from './data/jiaguwen.js';
import { generateJiaguwenSVG } from './utils/svgGenerator.js';

const searchQuery = ref('');
const selectedRadical = ref('all');
const compareList = ref([]);
const selectedItem = ref(null);
const isCombinedSearch = ref(false);
const combinedOriginalChar = ref('');
const showRelatedHint = ref(false);

const semanticRelations = {
  '日': { related: ['阳', '明', '旦', '春', '昏', '暮', '晨', '旭', '早', '晚'], compounds: ['明', '昌', '晶', '春', '香', '晴'] },
  '月': { related: ['明', '朔', '望', '昏', '朝', '夕', '夜'], compounds: ['明'] },
  '人': { related: ['大', '天', '立', '生', '老', '死', '子', '女', '父', '母'], compounds: ['从', '众', '休', '好', '男'] },
  '水': { related: ['河', '江', '海', '泉', '井', '池', '沟', '雨', '雪', '冰'], compounds: ['河', '江', '海', '泉', '池', '沟'] },
  '火': { related: ['炎', '热', '秋', '灯', '光', '明', '照'], compounds: ['炎', '秋'] },
  '木': { related: ['林', '森', '树', '禾', '春', '秋', '香'], compounds: ['林', '森', '相', '休'] },
  '土': { related: ['地', '城', '场', '基', '坚', '均'], compounds: ['地', '城', '场'] },
  '金': { related: ['铜', '铁', '银', '钟', '镜', '钱'], compounds: ['鑫'] },
  '山': { related: ['出', '岳', '峰', '岭', '岁', '岩'], compounds: ['出', '岁'] },
  '石': { related: ['岩', '矿', '硬', '碎', '磨'], compounds: ['磊'] },
  '口': { related: ['吕', '品', '吞', '吐', '吃', '喝', '唱'], compounds: ['吕', '品'] },
  '目': { related: ['眼', '看', '相', '睡', '望', '视', '眉'], compounds: ['看', '相', '睡'] },
  '手': { related: ['掌', '握', '拿', '打', '拍', '指'], compounds: ['看'] },
  '足': { related: ['跑', '跳', '走', '行', '路', '跟'], compounds: ['跑', '跳'] },
  '马': { related: ['骑', '驰', '骏', '骄'], compounds: ['骉'] },
  '牛': { related: ['牧', '牵', '牢', '物'], compounds: ['犇'] },
  '羊': { related: ['美', '善', '祥', '群'], compounds: ['羴', '鲜'] },
  '田': { related: ['男', '亩', '野', '界', '畔'], compounds: ['男'] },
  '禾': { related: ['秋', '香', '季', '种', '稻'], compounds: ['秋', '香'] },
  '心': { related: ['想', '思', '念', '情', '意', '爱', '恨', '志', '忘'], compounds: ['想', '思', '念', '情', '爱', '恨'] },
  '言': { related: ['语', '说', '话', '记', '计', '认', '识'], compounds: ['语', '记', '计', '认', '识'] },
  '耳': { related: ['听', '闻', '声'], compounds: ['闻'] },
  '身': { related: ['体', '位', '射', '谢'], compounds: [] },
  '首': { related: ['头', '领', '道'], compounds: [] },
  '面': { related: ['脸', '颜', '相', '见'], compounds: [] },
  '眉': { related: ['眼', '目', '看'], compounds: [] },
  '骨': { related: ['体', '骼', '骸'], compounds: [] },
  '肉': { related: ['体', '肥', '胖', '肌'], compounds: [] },
  '血': { related: ['液', '脉', '流'], compounds: [] },
  '气': { related: ['风', '云', '雾', '露'], compounds: [] },
  '风': { related: ['气', '云', '雨', '雷'], compounds: [] },
  '雨': { related: ['水', '雪', '雷', '电', '云'], compounds: [] },
  '雷': { related: ['电', '雨', '声'], compounds: [] },
  '电': { related: ['闪', '雷', '光'], compounds: [] },
  '云': { related: ['雨', '雪', '风', '雾'], compounds: [] },
  '雪': { related: ['雨', '霜', '冰'], compounds: [] },
  '霜': { related: ['雪', '冰', '露'], compounds: [] },
  '露': { related: ['雨', '水', '霜'], compounds: [] },
  '冰': { related: ['水', '雪', '霜'], compounds: [] },
  '河': { related: ['水', '江', '海', '流'], compounds: [] },
  '江': { related: ['水', '河', '海', '流'], compounds: [] },
  '海': { related: ['水', '河', '江', '洋'], compounds: [] },
  '泉': { related: ['水', '井', '流'], compounds: [] },
  '井': { related: ['水', '泉'], compounds: [] },
  '池': { related: ['水', '湖', '塘'], compounds: [] },
  '沟': { related: ['水', '渠', '流'], compounds: [] },
  '桥': { related: ['路', '河', '木'], compounds: [] },
  '舟': { related: ['船', '航', '行'], compounds: [] },
  '车': { related: ['轮', '行', '驾'], compounds: [] },
  '豕': { related: ['猪', '家'], compounds: ['家'] },
  '犬': { related: ['狗', '猎', '狂'], compounds: [] },
  '鸡': { related: ['鸟', '鸣', '飞'], compounds: [] },
  '鸟': { related: ['鸡', '飞', '鸣', '羽'], compounds: [] },
  '龙': { related: ['凤', '虎', '云'], compounds: [] },
  '虎': { related: ['龙', '豹', '猛'], compounds: [] },
  '鹿': { related: ['麋', '麝', '林'], compounds: [] },
  '兔': { related: ['狐', '狸', '月'], compounds: [] },
  '鼠': { related: ['穴', '偷', '仓'], compounds: [] },
  '鱼': { related: ['水', '鲜', '鳞'], compounds: ['鲜'] },
  '贝': { related: ['财', '货', '贵'], compounds: [] },
  '龟': { related: ['鳖', '甲', '寿'], compounds: [] },
  '虫': { related: ['蛇', '蛙', '蚊'], compounds: [] },
  '蛇': { related: ['虫', '龙', '爬'], compounds: [] },
  '玉': { related: ['宝', '珍', '珠'], compounds: ['宝'] },
  '刀': { related: ['剑', '刃', '割'], compounds: [] },
  '剑': { related: ['刀', '刃', '锋'], compounds: [] },
  '戈': { related: ['矛', '战', '伐'], compounds: ['战', '伐'] },
  '矛': { related: ['戈', '战', '兵'], compounds: [] },
  '弓': { related: ['箭', '射', '弩'], compounds: [] },
  '矢': { related: ['箭', '弓', '射'], compounds: [] },
  '盾': { related: ['矛', '战', '防'], compounds: [] },
  '鼓': { related: ['乐', '声', '舞'], compounds: [] },
  '乐': { related: ['舞', '声', '音'], compounds: [] },
  '舞': { related: ['乐', '歌', '蹈'], compounds: [] },
  '酒': { related: ['食', '饮', '醉'], compounds: [] },
  '食': { related: ['饭', '饮', '饱'], compounds: ['饭'] },
  '饭': { related: ['食', '餐', '饱'], compounds: [] },
  '衣': { related: ['裳', '裤', '袜'], compounds: [] },
  '裳': { related: ['衣', '裙', '服'], compounds: [] },
  '冠': { related: ['帽', '衣', '戴'], compounds: [] },
  '履': { related: ['鞋', '足', '行'], compounds: [] },
  '宫': { related: ['室', '房', '殿'], compounds: [] },
  '室': { related: ['房', '屋', '家'], compounds: [] },
  '房': { related: ['屋', '室', '家'], compounds: [] },
  '门': { related: ['户', '关', '开'], compounds: [] },
  '窗': { related: ['户', '门', '开'], compounds: [] },
  '户': { related: ['门', '窗', '家'], compounds: [] },
  '灶': { related: ['火', '炊', '饭'], compounds: [] },
  '床': { related: ['卧', '睡', '房'], compounds: [] },
  '席': { related: ['坐', '卧', '草'], compounds: [] },
  '书': { related: ['写', '画', '文'], compounds: [] },
  '画': { related: ['书', '绘', '图'], compounds: [] },
  '文': { related: ['字', '书', '章'], compounds: [] },
  '字': { related: ['文', '书', '学'], compounds: [] },
  '学': { related: ['教', '习', '字'], compounds: [] },
  '教': { related: ['学', '师', '授'], compounds: [] },
  '师': { related: ['教', '学', '傅'], compounds: [] },
  '军': { related: ['兵', '战', '营'], compounds: [] },
  '战': { related: ['争', '斗', '伐'], compounds: [] },
  '伐': { related: ['战', '攻', '征'], compounds: [] },
  '杀': { related: ['死', '战', '伐'], compounds: [] },
  '死': { related: ['生', '亡', '杀'], compounds: [] },
  '生': { related: ['死', '活', '长'], compounds: [] },
  '老': { related: ['少', '生', '死'], compounds: [] },
  '病': { related: ['医', '药', '痛'], compounds: [] },
  '医': { related: ['药', '病', '治'], compounds: [] },
  '药': { related: ['医', '病', '草'], compounds: [] },
  '梦': { related: ['睡', '觉', '想'], compounds: [] },
  '喜': { related: ['乐', '笑', '欢'], compounds: [] },
  '笑': { related: ['喜', '乐', '欢'], compounds: [] },
  '哭': { related: ['悲', '哀', '泣'], compounds: [] },
  '怒': { related: ['气', '愤', '恨'], compounds: [] },
  '哀': { related: ['悲', '伤', '痛'], compounds: [] },
  '爱': { related: ['情', '恋', '惜'], compounds: [] },
  '恨': { related: ['怒', '怨', '仇'], compounds: [] },
  '思': { related: ['想', '念', '忆'], compounds: [] },
  '念': { related: ['思', '想', '记'], compounds: [] },
  '想': { related: ['思', '念', '望'], compounds: [] },
  '信': { related: ['言', '诚', '任'], compounds: [] },
  '语': { related: ['言', '说', '话'], compounds: [] },
  '听': { related: ['闻', '声', '耳'], compounds: [] },
  '视': { related: ['看', '望', '见'], compounds: [] },
  '看': { related: ['视', '望', '见'], compounds: [] },
  '走': { related: ['行', '跑', '步'], compounds: ['跑', '跳', '起'] },
  '行': { related: ['走', '跑', '路'], compounds: [] },
  '跑': { related: ['走', '跳', '奔'], compounds: [] },
  '跳': { related: ['跑', '跃', '蹦'], compounds: [] },
  '立': { related: ['站', '坐', '卧'], compounds: [] },
  '坐': { related: ['立', '卧', '跪'], compounds: [] },
  '卧': { related: ['坐', '躺', '睡'], compounds: [] },
  '起': { related: ['立', '坐', '睡'], compounds: [] },
  '睡': { related: ['卧', '起', '眠'], compounds: [] },
  '觉': { related: ['睡', '醒', '悟'], compounds: [] }
};

const compoundMappings = {
  '明': { chars: ['日', '月'], meaning: '日月光辉' },
  '昌': { chars: ['日', '日'], meaning: '日日光明' },
  '炎': { chars: ['火', '火'], meaning: '火势旺盛' },
  '林': { chars: ['木', '木'], meaning: '树木成林' },
  '森': { chars: ['木', '木', '木'], meaning: '林木茂密' },
  '从': { chars: ['人', '人'], meaning: '两人相随' },
  '众': { chars: ['人', '人', '人'], meaning: '众人聚集' },
  '吕': { chars: ['口', '口'], meaning: '双口相对' },
  '品': { chars: ['口', '口', '口'], meaning: '众口品评' },
  '晶': { chars: ['日', '日', '日'], meaning: '三日同辉' },
  '磊': { chars: ['石', '石', '石'], meaning: '山石累积' },
  '鑫': { chars: ['金', '金', '金'], meaning: '金多兴盛' },
  '淼': { chars: ['水', '水', '水'], meaning: '水势浩大' },
  '垚': { chars: ['土', '土', '土'], meaning: '山高土厚' },
  '犇': { chars: ['牛', '牛', '牛'], meaning: '牛群奔跑' },
  '骉': { chars: ['马', '马', '马'], meaning: '马群奔腾' },
  '羴': { chars: ['羊', '羊', '羊'], meaning: '羊群聚集' },
  '鲜': { chars: ['鱼', '羊'], meaning: '鱼羊鲜美' },
  '好': { chars: ['女', '子'], meaning: '女子美好' },
  '男': { chars: ['田', '力'], meaning: '力耕于田' },
  '休': { chars: ['人', '木'], meaning: '人倚木息' },
  '安': { chars: ['宀', '女'], meaning: '女居室内' },
  '宝': { chars: ['宀', '玉'], meaning: '室中有玉' },
  '家': { chars: ['宀', '豕'], meaning: '屋内养猪' },
  '看': { chars: ['手', '目'], meaning: '手遮目望' },
  '相': { chars: ['木', '目'], meaning: '以目观木' },
  '泪': { chars: ['氵', '目'], meaning: '目流出水' },
  '河': { chars: ['氵', '可'], meaning: '可流之水' },
  '江': { chars: ['氵', '工'], meaning: '人工水道' },
  '海': { chars: ['氵', '每'], meaning: '众水汇聚' },
  '清': { chars: ['氵', '青'], meaning: '水色清澈' },
  '情': { chars: ['忄', '青'], meaning: '心中情感' },
  '请': { chars: ['讠', '青'], meaning: '言语请求' },
  '晴': { chars: ['日', '青'], meaning: '日色清明' },
  '妈': { chars: ['女', '马'], meaning: '母亲称呼' },
  '奶': { chars: ['女', '乃'], meaning: '乳母称呼' },
  '妹': { chars: ['女', '未'], meaning: '年少女子' },
  '姐': { chars: ['女', '且'], meaning: '年长女子' },
  '哥': { chars: ['可', '可'], meaning: '兄长称呼' },
  '爸': { chars: ['父', '巴'], meaning: '父亲称呼' },
  '爹': { chars: ['父', '多'], meaning: '父亲称呼' },
  '岁': { chars: ['山', '夕'], meaning: '岁月流逝' },
  '出': { chars: ['山', '山'], meaning: '出山远行' },
  '多': { chars: ['夕', '夕'], meaning: '数量众多' },
  '秋': { chars: ['禾', '火'], meaning: '禾谷成熟' },
  '香': { chars: ['禾', '日'], meaning: '日暖禾香' },
  '国': { chars: ['囗', '玉'], meaning: '国中藏玉' },
  '城': { chars: ['土', '成'], meaning: '土筑之城' },
  '地': { chars: ['土', '也'], meaning: '大地之上' },
  '红': { chars: ['纟', '工'], meaning: '丝线染色' },
  '绿': { chars: ['纟', '录'], meaning: '丝线翠绿' },
  '纸': { chars: ['纟', '氏'], meaning: '丝制纸张' },
  '饭': { chars: ['饣', '反'], meaning: '熟食反覆' },
  '饮': { chars: ['饣', '欠'], meaning: '饮食欠缺' },
  '饿': { chars: ['饣', '我'], meaning: '我腹饥饿' },
  '裤': { chars: ['衤', '库'], meaning: '裤装仓库' },
  '袜': { chars: ['衤', '末'], meaning: '袜在脚末' },
  '街': { chars: ['行', '圭'], meaning: '街道规矩' },
  '得': { chars: ['彳', '忄', '寸'], meaning: '行有所得' },
  '很': { chars: ['彳', '艮'], meaning: '行止艰难' },
  '往': { chars: ['彳', '主'], meaning: '前往某处' },
  '待': { chars: ['彳', '寺'], meaning: '行止等待' },
  '志': { chars: ['士', '心'], meaning: '士有志向' },
  '忘': { chars: ['亡', '心'], meaning: '心有所亡' },
  '怕': { chars: ['忄', '白'], meaning: '心中恐惧' },
  '忙': { chars: ['忄', '亡'], meaning: '心有所亡' },
  '快': { chars: ['忄', '夬'], meaning: '心情畅快' },
  '慢': { chars: ['忄', '曼'], meaning: '心情舒缓' },
  '感': { chars: ['咸', '心'], meaning: '心中感触' },
  '意': { chars: ['音', '心'], meaning: '心音会意' },
  '总': { chars: ['丷', '口', '心'], meaning: '总合心意' },
  '受': { chars: ['爫', '冖', '又'], meaning: '接受所得' },
  '闻': { chars: ['门', '耳'], meaning: '门内听闻' },
  '声': { chars: ['士', '口'], meaning: '士口发声' },
  '音': { chars: ['立', '日'], meaning: '日出立音' },
  '说': { chars: ['言', '兑'], meaning: '言语兑现' },
  '话': { chars: ['言', '舌'], meaning: '言语口舌' },
  '读': { chars: ['言', '卖'], meaning: '言读买卖' },
  '写': { chars: ['冖', '与'], meaning: '书写给予' },
  '教': { chars: ['孝', '攵'], meaning: '教导孝道' },
  '战': { chars: ['占', '戈'], meaning: '占卜征战' },
  '争': { chars: ['⺈', '彐'], meaning: '争斗获取' },
  '杀': { chars: ['殳', '杀'], meaning: '杀戮征伐' },
  '死': { chars: ['歹', '匕'], meaning: '死亡凶险' },
  '病': { chars: ['疒', '丙'], meaning: '丙日患病' },
  '医': { chars: ['匚', '矢', '殳'], meaning: '医治箭矢' },
  '药': { chars: ['艹', '约'], meaning: '草药约定' },
  '喜': { chars: ['士', '口', '口'], meaning: '士众喜庆' },
  '笑': { chars: ['⺮', '夭'], meaning: '竹下欢笑' },
  '哭': { chars: ['吅', '犬'], meaning: '犬吠哭声' },
  '哀': { chars: ['亠', '口', '衣'], meaning: '衣覆哀伤' },
  '乐': { chars: ['丿', '幺', '幺'], meaning: '乐舞丝弦' },
  '跑': { chars: ['足', '包'], meaning: '足步包抄' },
  '跳': { chars: ['足', '兆'], meaning: '足兆跳跃' },
  '起': { chars: ['走', '己'], meaning: '走而兴起' }
};

const filteredData = computed(() => {
  let result = [...jiaguwenData];
  const query = searchQuery.value.trim();
  
  if (selectedRadical.value !== 'all') {
    result = result.filter(item => item.radical === selectedRadical.value);
  }
  
  if (query) {
    const directMatches = result.filter(item => item.char.includes(query));
    
    if (directMatches.length > 0) {
      isCombinedSearch.value = false;
      combinedOriginalChar.value = '';
      
      if (query.length === 1) {
        const relations = semanticRelations[query];
        if (relations && relations.related && relations.related.length > 0) {
          const relatedMatches = [];
          const existingChars = new Set(directMatches.map(item => item.char));
          
          relations.related.forEach(relChar => {
            const matches = result.filter(item => item.char === relChar && !existingChars.has(item.char));
            if (matches.length > 0) {
              relatedMatches.push(...matches);
            }
          });
          
          if (relatedMatches.length > 0) {
            showRelatedHint.value = true;
            return [...directMatches, ...relatedMatches];
          } else {
            showRelatedHint.value = false;
          }
        }
      }
      
      return directMatches;
    } else {
      const compoundInfo = compoundMappings[query];
      if (compoundInfo && compoundInfo.chars && compoundInfo.chars.length > 0) {
        const componentResults = [];
        compoundInfo.chars.forEach(comp => {
          const matches = result.filter(item => item.char === comp);
          if (matches.length > 0) {
            componentResults.push(...matches);
          }
        });
        
        if (componentResults.length > 0) {
          isCombinedSearch.value = true;
          combinedOriginalChar.value = query;
          return componentResults;
        }
      }
      
      isCombinedSearch.value = false;
      combinedOriginalChar.value = '';
      showRelatedHint.value = false;
      return [];
    }
  } else {
    isCombinedSearch.value = false;
    combinedOriginalChar.value = '';
    showRelatedHint.value = false;
  }
  
  return result;
});
const handleSearch = () => {
};
const selectRadical = (radicalId) => {
 selectedRadical.value = radicalId;
};
const getPeriodName = (periodId) => {
 const period = periods.find(p => p.id === periodId);
 return period ? period.name : '';
};
const getRadicalName = (radicalId) => {
 const radical = radicals.find(r => r.id === radicalId);
 return radical ? radical.name : '';
};
const getJiaguwenSVG = (char) => {
 return markRaw(generateJiaguwenSVG(char));
};
const showDetail = (item) => {
 selectedItem.value = item;
};
const closeModal = () => {
 selectedItem.value = null;
};
const addToCompare = (item) => {
 if (compareList.value.length >= 2) {
 alert('最多只能对比两个字形');
 return;
 }
 if (compareList.value.find(i => i.id === item.id)) {
 alert('该字形已在对比列表中');
 return;
 }
 compareList.value.push(item);
};
const clearCompare = () => {
 compareList.value = [];
};
</script>

<style scoped>
.app-container {
  min-height: 100vh;
}

.filter-label {
  font-weight: bold;
  color: #666;
}

.compare-item.empty .card-image {
  color: #ccc;
  font-size: 3rem;
}

.compare-item.empty .card-title {
  color: #999;
}
</style>
