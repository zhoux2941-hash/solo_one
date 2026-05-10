-- 酸碱反应特征数据
-- acid_reaction 特征类型
-- 值含义:
-- none - 不反应
-- weak - 微弱反应（轻微起泡）
-- moderate - 中等反应（明显起泡）
-- strong - 剧烈反应（大量气泡）
-- very_strong - 极强反应（粉末状才反应，如白云石）

USE mineral_identification;

-- 先删除已有的酸碱反应特征
DELETE FROM mineral_features WHERE feature_type = 'acid_reaction';

-- 插入酸碱反应特征
-- 强烈反应的矿物（碳酸盐类）
INSERT INTO mineral_features (mineral_id, feature_type, feature_value, weight) VALUES
-- 方解石 - 强烈起泡
(3, 'acid_reaction', 'strong', 1.0),

-- 石膏 - 微弱反应
(2, 'acid_reaction', 'weak', 1.0),

-- 磷灰石 - 中等反应
(5, 'acid_reaction', 'moderate', 1.0),

-- 赤铁矿 - 中等反应（与热盐酸反应）
(11, 'acid_reaction', 'moderate', 1.0),

-- 孔雀石 - 强烈反应（铜碳酸盐）
(17, 'acid_reaction', 'strong', 1.0),

-- 蓝铜矿 - 强烈反应（铜碳酸盐）
(18, 'acid_reaction', 'strong', 1.0),

-- 菱锰矿 - 强烈反应（锰碳酸盐）
(42, 'acid_reaction', 'strong', 1.0),

-- 辰砂 - 不反应
(19, 'acid_reaction', 'none', 1.0),

-- 雄黄 - 不反应
(20, 'acid_reaction', 'none', 1.0),

-- 雌黄 - 不反应
(21, 'acid_reaction', 'none', 1.0),

-- 石墨 - 不反应
(22, 'acid_reaction', 'none', 1.0),

-- 硫磺 - 不反应
(23, 'acid_reaction', 'none', 1.0),

-- 石英 - 不反应
(7, 'acid_reaction', 'none', 1.0),

-- 萤石 - 中等反应
(4, 'acid_reaction', 'moderate', 1.0),

-- 滑石 - 不反应
(1, 'acid_reaction', 'none', 1.0),

-- 正长石 - 不反应
(6, 'acid_reaction', 'none', 1.0),

-- 黄玉 - 不反应
(8, 'acid_reaction', 'none', 1.0),

-- 刚玉 - 不反应
(9, 'acid_reaction', 'none', 1.0),

-- 金刚石 - 不反应
(10, 'acid_reaction', 'none', 1.0),

-- 磁铁矿 - 微弱反应（与热盐酸）
(12, 'acid_reaction', 'weak', 1.0),

-- 黄铁矿 - 不反应
(13, 'acid_reaction', 'none', 1.0),

-- 方铅矿 - 不反应
(14, 'acid_reaction', 'none', 1.0),

-- 闪锌矿 - 中等反应
(15, 'acid_reaction', 'moderate', 1.0),

-- 黄铜矿 - 不反应
(16, 'acid_reaction', 'none', 1.0),

-- 橄榄石 - 微弱反应
(24, 'acid_reaction', 'weak', 1.0),

-- 石榴子石 - 不反应
(25, 'acid_reaction', 'none', 1.0),

-- 蓝晶石 - 不反应
(26, 'acid_reaction', 'none', 1.0),

-- 矽线石 - 不反应
(27, 'acid_reaction', 'none', 1.0),

-- 红柱石 - 不反应
(28, 'acid_reaction', 'none', 1.0),

-- 十字石 - 不反应
(29, 'acid_reaction', 'none', 1.0),

-- 电气石 - 不反应
(30, 'acid_reaction', 'none', 1.0),

-- 绿柱石 - 不反应
(31, 'acid_reaction', 'none', 1.0),

-- 祖母绿 - 不反应
(32, 'acid_reaction', 'none', 1.0),

-- 海蓝宝石 - 不反应
(33, 'acid_reaction', 'none', 1.0),

-- 锆石 - 不反应
(34, 'acid_reaction', 'none', 1.0),

-- 尖晶石 - 不反应
(35, 'acid_reaction', 'none', 1.0),

-- 金绿宝石 - 不反应
(36, 'acid_reaction', 'none', 1.0),

-- 橄榄石宝石 - 微弱反应
(37, 'acid_reaction', 'weak', 1.0),

-- 翡翠 - 不反应
(38, 'acid_reaction', 'none', 1.0),

-- 软玉 - 不反应
(39, 'acid_reaction', 'none', 1.0),

-- 青金石 - 中等反应
(40, 'acid_reaction', 'moderate', 1.0),

-- 绿松石 - 中等反应
(41, 'acid_reaction', 'moderate', 1.0),

-- 蔷薇辉石 - 微弱反应
(43, 'acid_reaction', 'weak', 1.0),

-- 天河石 - 不反应
(44, 'acid_reaction', 'none', 1.0),

-- 拉长石 - 不反应
(45, 'acid_reaction', 'none', 1.0),

-- 月光石 - 不反应
(46, 'acid_reaction', 'none', 1.0),

-- 黑曜石 - 不反应
(47, 'acid_reaction', 'none', 1.0),

-- 蛋白石 - 不反应
(48, 'acid_reaction', 'none', 1.0),

-- 玛瑙 - 不反应
(49, 'acid_reaction', 'none', 1.0),

-- 紫水晶 - 不反应
(50, 'acid_reaction', 'none', 1.0);
