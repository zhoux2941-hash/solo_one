import { useState } from 'react';
import { HelpCircle, Zap, Layers, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { getLevel1Shortcuts, getLevel1Characters, getLevel2Characters } from '@/data/wubiData';

const identificationTypes = [
  { type: '左右型', code: '1', keys: 'G、F、D', example: '汉 → ICY（最后一笔丶，左右型）' },
  { type: '上下型', code: '2', keys: 'H、J、K', example: '字 → PBF（最后一笔一，上下型）' },
  { type: '杂合型', code: '3', keys: 'T、R、E', example: '国 → LGYI（最后一笔丶，杂合型）' },
];

const strokeTypes = [
  { name: '横', code: '1', key: 'G', example: '一、二、三' },
  { name: '竖', code: '2', key: 'H', example: '丨、卜、刂' },
  { name: '撇', code: '3', key: 'T', example: '丿、彳、彡' },
  { name: '捺', code: '4', key: 'Y', example: '丶、讠、冫' },
  { name: '折', code: '5', key: 'N', example: '乙、ㄋ、巛' },
];

const keyZones = [
  { zone: '横区（1区）', keys: ['G', 'F', 'D', 'S', 'A'], color: 'from-yellow-500 to-orange-500' },
  { zone: '竖区（2区）', keys: ['H', 'J', 'K', 'L', 'M'], color: 'from-green-500 to-emerald-500' },
  { zone: '撇区（3区）', keys: ['T', 'R', 'E', 'W', 'Q'], color: 'from-blue-500 to-cyan-500' },
  { zone: '捺区（4区）', keys: ['Y', 'U', 'I', 'O', 'P'], color: 'from-purple-500 to-pink-500' },
  { zone: '折区（5区）', keys: ['N', 'B', 'V', 'C', 'X'], color: 'from-red-500 to-rose-500' },
];

export default function Rules() {
  const [expandedSection, setExpandedSection] = useState<string | null>('level1');

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const level1Shortcuts = getLevel1Shortcuts();
  const level1Chars = getLevel1Characters();
  const level2Chars = getLevel2Characters();

  const Section = ({ 
    id, 
    title, 
    icon: Icon, 
    children 
  }: { 
    id: string; 
    title: string; 
    icon: React.ElementType; 
    children: React.ReactNode 
  }) => {
    const isExpanded = expandedSection === id;
    return (
      <div className="card mb-6 overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-6 text-left hover:bg-dark-700/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-medium text-white">{title}</h3>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-dark-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-dark-400" />
          )}
        </button>
        {isExpanded && (
          <div className="px-6 pb-6 animate-fade-in">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-10">
        <h2 className="font-serif text-4xl font-bold text-white mb-3">
          <span className="text-gradient">五笔编码规则</span>
        </h2>
        <p className="text-dark-300 max-w-2xl mx-auto">
          详细介绍86版五笔输入法的编码规则，帮助您系统学习五笔打字
        </p>
      </div>

      <Section id="intro" title="五笔输入法简介" icon={HelpCircle}>
        <div className="space-y-4 text-dark-200">
          <p>
            五笔字型输入法（简称五笔）是王永民在1983年8月发明的一种汉字输入法。
            它依据汉字的笔画和字形特征进行编码，是典型的形码输入法。
          </p>
          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
              <h4 className="text-accent-400 font-medium mb-2">基本原理</h4>
              <p className="text-sm text-dark-300">
                将汉字拆分为若干个字根，根据字根的顺序和识别码组合成编码。
                五种基本笔画：横、竖、撇、捺、折。
              </p>
            </div>
            <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
              <h4 className="text-accent-400 font-medium mb-2">86版特点</h4>
              <p className="text-sm text-dark-300">
                最经典、使用最广泛的版本。25个一级简码，约600个二级简码，
                编码简单，重码率低。
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section id="zones" title="键盘分区与字根" icon={Layers}>
        <div className="space-y-6">
          <p className="text-dark-300">
            五笔键盘分为5个区，每区5个键，共25个键（Z键为学习键）。
            每个区对应一种基本笔画，每个键位上有若干字根。
          </p>
          
          <div className="grid md:grid-cols-5 gap-3">
            {keyZones.map((zone) => (
              <div key={zone.zone} className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
                <div className={`text-transparent bg-clip-text bg-gradient-to-r ${zone.color} font-medium mb-2`}>
                  {zone.zone}
                </div>
                <div className="flex gap-1">
                  {zone.keys.map((key) => (
                    <div
                      key={key}
                      className={`
                        w-8 h-8 rounded-lg bg-gradient-to-br ${zone.color}
                        flex items-center justify-center
                        text-white font-mono font-bold text-sm
                        shadow-lg
                      `}
                    >
                      {key}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="py-3 px-4 text-left text-dark-400 font-medium">笔画类型</th>
                  <th className="py-3 px-4 text-left text-dark-400 font-medium">代码</th>
                  <th className="py-3 px-4 text-left text-dark-400 font-medium">代表键</th>
                  <th className="py-3 px-4 text-left text-dark-400 font-medium">示例</th>
                </tr>
              </thead>
              <tbody>
                {strokeTypes.map((stroke) => (
                  <tr key={stroke.code} className="border-b border-dark-700/50">
                    <td className="py-3 px-4 text-white">{stroke.name}</td>
                    <td className="py-3 px-4 font-mono text-accent-400">{stroke.code}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-dark-700 rounded font-mono text-white">
                        {stroke.key}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-dark-300">{stroke.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      <Section id="level1" title="一级简码" icon={Zap}>
        <div className="space-y-4">
          <p className="text-dark-300">
            一级简码是使用频率最高的25个汉字，每个键对应一个汉字，只需打一个键加空格即可输入。
          </p>
          
          <div className="grid grid-cols-5 gap-3">
            {Object.entries(level1Shortcuts).map(([char, code]) => (
              <div
                key={code}
                className="
                  bg-dark-900/50 rounded-xl p-4 border border-dark-700
                  text-center hover:border-green-500/50 transition-colors
                "
              >
                <div className="text-4xl font-serif text-white mb-2">{char}</div>
                <div className="flex items-center justify-center gap-2">
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-medium">
                    一级简码
                  </span>
                  <span className="font-mono text-accent-400">{code}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 mt-4">
            <p className="text-green-300 text-sm">
              <strong>记忆口诀：</strong>
              一地在要工，上是中国同，和的有人我，主产不为这，民了发以经。
            </p>
          </div>
        </div>
      </Section>

      <Section id="level2" title="二级简码" icon={Zap}>
        <div className="space-y-4">
          <p className="text-dark-300">
            二级简码由汉字的前两个字根编码组成，共约600个常用汉字，打两个键加空格即可输入。
          </p>

          <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
            <h4 className="text-accent-400 font-medium mb-3">二级简码示例（共 {level2Chars.length} 个）</h4>
            <div className="flex flex-wrap gap-2">
              {level2Chars.slice(0, 50).map((item) => (
                <div
                  key={item.char}
                  className="
                    px-3 py-2 rounded-lg bg-dark-800 border border-dark-700
                    flex items-center gap-2 hover:border-blue-500/50 transition-colors
                  "
                >
                  <span className="font-serif text-lg text-white">{item.char}</span>
                  <span className="font-mono text-xs text-blue-400">{item.code}</span>
                </div>
              ))}
              {level2Chars.length > 50 && (
                <div className="px-3 py-2 text-dark-500 text-sm">
                  ...还有 {level2Chars.length - 50} 个
                </div>
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
              <h4 className="text-accent-400 font-medium mb-2">编码规则</h4>
              <p className="text-sm text-dark-300">
                取汉字的第一个和第二个字根的编码，然后加空格。
                例："好" = 女(V) + 子(B) = VB
              </p>
            </div>
            <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
              <h4 className="text-accent-400 font-medium mb-2">使用技巧</h4>
              <p className="text-sm text-dark-300">
                熟练掌握二级简码可以大幅提高打字速度，
                约60%的常用汉字可以用二级简码输入。
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section id="level3" title="三级简码与全码" icon={Zap}>
        <div className="space-y-4">
          <p className="text-dark-300">
            三级简码由前三个字根组成，全码由四个字根（或字根+识别码）组成。
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
              <h4 className="text-yellow-400 font-medium mb-3">三级简码</h4>
              <p className="text-dark-300 text-sm mb-3">
                取前三个字根编码，加空格。无需打识别码，提高输入速度。
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-dark-800 rounded-lg">
                  <span className="font-serif text-xl text-white">想</span>
                  <span className="text-dark-400">→</span>
                  <span className="font-mono text-yellow-400">木(S) + 目(H) + 心(N) = SHN</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-dark-800 rounded-lg">
                  <span className="font-serif text-xl text-white">情</span>
                  <span className="text-dark-400">→</span>
                  <span className="font-mono text-yellow-400">忄(N) + 青(G) + ？ = NGE</span>
                </div>
              </div>
            </div>
            <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
              <h4 className="text-purple-400 font-medium mb-3">全码（四级编码）</h4>
              <p className="text-dark-300 text-sm mb-3">
                四个字根的汉字：依次取四个字根编码。
                超过四个字根：取一、二、三、末字根。
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-dark-800 rounded-lg">
                  <span className="font-serif text-xl text-white">照</span>
                  <span className="text-dark-400">→</span>
                  <span className="font-mono text-purple-400">日(J) + 刀(V) + 口(K) + 灬(O) = JVKO</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-dark-800 rounded-lg">
                  <span className="font-serif text-xl text-white">输</span>
                  <span className="text-dark-400">→</span>
                  <span className="font-mono text-purple-400">车(L) + 人(W) + 一(G) + 刂(J) = LWGJ</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section id="identification" title="识别码规则" icon={Target}>
        <div className="space-y-4">
          <p className="text-dark-300">
            当汉字的字根不足4个时，需要添加识别码来减少重码。
            识别码由最后一笔的笔画类型和字型结构共同决定。
          </p>

          <div className="bg-accent-500/10 border border-accent-500/30 rounded-xl p-4 mb-4">
            <h4 className="text-accent-400 font-medium mb-2">识别码 = 末笔代码 + 字型代码</h4>
            <p className="text-dark-300 text-sm">
              例如："好"的末笔是"一"（横，代码1），字型是左右型（代码1），
              所以识别码是11，即G键。但"好"是二级简码，实际只打VB。
            </p>
          </div>

          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700">
                  <th className="py-3 px-4 text-left text-dark-400 font-medium">字型</th>
                  <th className="py-3 px-4 text-left text-dark-400 font-medium">代码</th>
                  <th className="py-3 px-4 text-left text-dark-400 font-medium">识别键</th>
                  <th className="py-3 px-4 text-left text-dark-400 font-medium">示例</th>
                </tr>
              </thead>
              <tbody>
                {identificationTypes.map((item, index) => (
                  <tr key={item.type} className="border-b border-dark-700/50">
                    <td className="py-3 px-4 text-white">{item.type}</td>
                    <td className="py-3 px-4 font-mono text-accent-400">{item.code}</td>
                    <td className="py-3 px-4">
                      <span className="text-accent-400 font-mono">{item.keys}</span>
                    </td>
                    <td className="py-3 px-4 text-dark-300">{item.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
              <h5 className="text-accent-400 font-medium mb-2">左右型 (1)</h5>
              <p className="text-dark-300 text-sm mb-2">
                汉字分为左右两部分或左中右三部分。
              </p>
              <div className="flex gap-2">
                {['汉', '他', '们', '你'].map((char) => (
                  <span key={char} className="font-serif text-2xl text-white">{char}</span>
                ))}
              </div>
            </div>
            <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
              <h5 className="text-accent-400 font-medium mb-2">上下型 (2)</h5>
              <p className="text-dark-300 text-sm mb-2">
                汉字分为上下两部分或上中下三部分。
              </p>
              <div className="flex gap-2">
                {['字', '想', '思', '李'].map((char) => (
                  <span key={char} className="font-serif text-2xl text-white">{char}</span>
                ))}
              </div>
            </div>
            <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
              <h5 className="text-accent-400 font-medium mb-2">杂合型 (3)</h5>
              <p className="text-dark-300 text-sm mb-2">
                汉字没有明显的左右或上下结构区分。
              </p>
              <div className="flex gap-2">
                {['国', '这', '因', '凶'].map((char) => (
                  <span key={char} className="font-serif text-2xl text-white">{char}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      <Section id="tips" title="拆分原则与技巧" icon={HelpCircle}>
        <div className="space-y-4 text-dark-200">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
              <h4 className="text-accent-400 font-medium mb-2">取大优先</h4>
              <p className="text-sm text-dark-300">
                拆分字根时，尽可能取笔画多的字根。
                例："活" → 氵 + 丿 + 十 + 一（正确），而非其他组合。
              </p>
            </div>
            <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
              <h4 className="text-accent-400 font-medium mb-2">兼顾直观</h4>
              <p className="text-sm text-dark-300">
                拆分结果要符合汉字的书写习惯，便于记忆。
                例："国" → 囗 + 玉（直观）。
              </p>
            </div>
            <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
              <h4 className="text-accent-400 font-medium mb-2">能散不连</h4>
              <p className="text-sm text-dark-300">
                能拆分成散的关系就不要拆成连的关系。
                散：字根间有距离；连：单笔与字根相连。
              </p>
            </div>
            <div className="bg-dark-900/50 rounded-xl p-4 border border-dark-700">
              <h4 className="text-accent-400 font-medium mb-2">能连不交</h4>
              <p className="text-sm text-dark-300">
                能拆分成连的关系就不要拆成交的关系。
                例："天" → 一 + 大（连），而非二 + 人（交）。
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-r from-primary-500/10 to-accent-500/10 border border-primary-500/30 rounded-xl p-6">
            <h4 className="text-white font-medium mb-3">学习建议</h4>
            <ol className="space-y-2 text-dark-300 text-sm">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                <span>先记住5个区的笔画分布和25个一级简码，建立整体概念。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                <span>学习键名字和成字字根，了解每个键位上的主要字根。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                <span>掌握二级简码，这是提高速度的关键。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">4</span>
                <span>理解识别码规则，解决重码问题。</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs flex-shrink-0 mt-0.5">5</span>
                <span>多练习，通过使用本系统的查询功能加深记忆。</span>
              </li>
            </ol>
          </div>
        </div>
      </Section>

      <div className="card p-6 text-center">
        <p className="text-dark-300 mb-4">
          准备好开始练习了吗？
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => window.location.href = '/'}
            className="btn-primary"
          >
            开始查询
          </button>
          <button
            onClick={() => window.location.href = '/common'}
            className="btn-secondary"
          >
            浏览常用字
          </button>
        </div>
      </div>
    </div>
  );
}
