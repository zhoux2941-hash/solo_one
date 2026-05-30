export interface ErrorSource {
  type: string;
  title: string;
  description: string;
  severity: number;
  icon: string;
}

export interface HeatPoint {
  cx: number;
  cy: number;
  radius: number;
  intensity: number;
}

export interface DynastyData {
  id: string;
  name: string;
  period: string;
  mapName: string;
  cartographer: string;
  mapYear: string;
  territoryPath: string;
  heatPoints: HeatPoint[];
  errorLevel: number;
  errorSources: ErrorSource[];
  color: string;
  colorLight: string;
}

export interface ErrorTrend {
  dynastyId: string;
  dynastyName: string;
  overallError: number;
  scaleError: number;
  directionError: number;
  mythologyError: number;
}

export const MODERN_CHINA_PATH = "M570,26 L555,35 L540,30 L530,40 L510,38 L490,45 L470,55 L455,52 L440,60 L420,58 L405,65 L380,62 L360,70 L340,68 L320,75 L300,72 L280,80 L260,78 L250,85 L235,82 L220,90 L200,88 L185,95 L170,92 L155,100 L140,98 L125,105 L115,102 L105,110 L95,108 L90,115 L85,125 L80,140 L78,155 L82,165 L90,170 L95,180 L88,190 L80,200 L75,210 L72,225 L78,235 L85,240 L95,238 L108,242 L120,248 L130,258 L125,270 L118,280 L112,295 L108,310 L112,320 L120,325 L132,318 L145,310 L158,308 L170,315 L180,325 L188,340 L195,355 L205,365 L218,370 L230,365 L242,358 L255,362 L265,370 L275,378 L285,385 L298,388 L310,385 L322,390 L335,395 L348,392 L358,398 L368,408 L378,418 L388,425 L398,420 L408,412 L418,415 L425,425 L430,438 L425,448 L418,455 L410,460 L402,468 L395,478 L390,488 L395,495 L405,498 L415,492 L425,485 L435,478 L445,480 L455,490 L462,500 L468,510 L475,505 L485,495 L492,488 L500,490 L510,498 L518,505 L525,512 L532,518 L540,510 L545,500 L550,490 L555,480 L560,470 L565,458 L570,448 L578,438 L585,428 L590,418 L595,405 L600,392 L605,378 L610,365 L615,352 L620,340 L625,328 L630,315 L632,302 L630,290 L625,280 L618,272 L612,265 L608,255 L610,245 L615,235 L620,225 L625,215 L630,205 L635,195 L638,185 L635,175 L630,168 L625,160 L628,150 L635,140 L640,130 L645,120 L648,110 L645,100 L640,92 L635,85 L628,78 L620,72 L612,65 L605,58 L598,52 L590,45 L580,38 L570,26 Z";

export const DYNASTIES: DynastyData[] = [
  {
    id: "tang",
    name: "唐",
    period: "618–907年",
    mapName: "海内华夷图",
    cartographer: "贾耽",
    mapYear: "801年",
    territoryPath: "M570,26 L555,35 L540,30 L530,40 L510,38 L490,45 L470,55 L455,52 L440,60 L420,58 L405,65 L380,62 L360,70 L340,68 L320,75 L300,72 L280,80 L260,78 L250,85 L235,82 L220,90 L200,88 L185,95 L170,92 L155,100 L140,98 L125,105 L115,102 L105,110 L95,108 L90,115 L85,125 L80,140 L78,155 L82,165 L55,155 L35,168 L20,185 L15,210 L25,230 L45,245 L65,250 L80,240 L95,238 L108,242 L120,248 L130,258 L125,270 L118,280 L112,295 L108,310 L112,320 L120,325 L132,318 L145,310 L158,308 L170,315 L180,325 L188,340 L195,355 L205,365 L218,370 L230,365 L242,358 L255,362 L265,370 L275,378 L285,385 L298,388 L310,385 L322,390 L335,395 L348,392 L358,398 L368,408 L378,418 L388,425 L398,420 L408,412 L418,415 L425,425 L430,438 L425,448 L418,455 L410,460 L402,468 L395,478 L390,488 L395,495 L405,498 L415,492 L425,485 L435,478 L445,480 L455,490 L462,500 L468,510 L475,505 L485,495 L492,488 L500,490 L510,498 L518,505 L525,512 L532,518 L540,510 L545,500 L550,490 L555,480 L560,470 L565,458 L570,448 L578,438 L585,428 L590,418 L595,405 L600,392 L605,378 L610,365 L615,352 L620,340 L625,328 L630,315 L632,302 L630,290 L625,280 L618,272 L612,265 L608,255 L610,245 L615,235 L620,225 L625,215 L630,205 L635,195 L638,185 L635,175 L630,168 L625,160 L628,150 L635,140 L640,130 L645,120 L648,110 L645,100 L640,92 L635,85 L628,78 L620,72 L612,65 L605,58 L598,52 L590,45 L580,38 L570,26 Z",
    heatPoints: [
      { cx: 90, cy: 185, radius: 75, intensity: 0.95 },
      { cx: 55, cy: 210, radius: 55, intensity: 0.85 },
      { cx: 120, cy: 160, radius: 45, intensity: 0.75 },
      { cx: 45, cy: 175, radius: 40, intensity: 0.7 },
      { cx: 75, cy: 140, radius: 35, intensity: 0.6 },
      { cx: 110, cy: 220, radius: 40, intensity: 0.55 },
      { cx: 320, cy: 95, radius: 60, intensity: 0.65 },
      { cx: 260, cy: 108, radius: 50, intensity: 0.55 },
      { cx: 200, cy: 120, radius: 45, intensity: 0.5 },
      { cx: 170, cy: 130, radius: 38, intensity: 0.45 },
      { cx: 230, cy: 98, radius: 40, intensity: 0.4 },
      { cx: 355, cy: 85, radius: 40, intensity: 0.35 },
      { cx: 335, cy: 395, radius: 45, intensity: 0.4 },
      { cx: 310, cy: 405, radius: 35, intensity: 0.35 },
      { cx: 350, cy: 415, radius: 30, intensity: 0.3 }
    ],
    errorLevel: 3,
    errorSources: [
      {
        type: "scale",
        title: "比例尺失调",
        description: "西北地区疆域过度夸张，西域面积在图中远大于实际，安西都护府以西的区域被严重放大。唐代对西域的认知多来自使节商旅口述，缺乏实地测量，导致距离与面积严重失真。",
        severity: 0.8,
        icon: "Maximize2"
      },
      {
        type: "direction",
        title: "方向偏差",
        description: "东西方向基本准确，但南北方向有明显压缩。黄河中下游走向偏差较大，长江下游入海口位置偏北。总体而言，唐代地图对南北方向的把握弱于东西方向。",
        severity: 0.6,
        icon: "Compass"
      },
      {
        type: "mythology",
        title: "山海经传统影响",
        description: "保留大量传说地理内容，昆仑山西侧标注虚构区域，南海诸岛以神话传说方式记录。部分山川方位受《山海经》影响，将真实地理与想象混杂在一起。",
        severity: 0.7,
        icon: "BookOpen"
      }
    ],
    color: "#1d3557",
    colorLight: "#2d6a9f"
  },
  {
    id: "song",
    name: "宋",
    period: "960–1279年",
    mapName: "禹迹图",
    cartographer: "佚名（阜昌刻石）",
    mapYear: "1136年刻石",
    territoryPath: "M555,52 L540,48 L525,55 L510,50 L490,58 L470,65 L455,62 L440,70 L420,68 L405,75 L380,72 L360,80 L340,78 L320,85 L300,82 L280,90 L260,88 L250,95 L235,92 L220,100 L200,98 L185,105 L170,102 L155,110 L140,108 L125,115 L115,112 L105,120 L95,118 L90,125 L85,135 L80,150 L82,165 L90,170 L95,180 L88,190 L80,200 L75,210 L78,225 L85,235 L95,238 L108,242 L120,248 L130,258 L125,270 L118,280 L112,295 L108,310 L112,320 L120,325 L132,318 L145,310 L158,308 L170,315 L180,325 L188,340 L195,355 L205,365 L218,370 L230,365 L242,358 L255,362 L265,370 L275,378 L285,385 L298,388 L310,385 L322,390 L335,395 L348,392 L358,398 L368,408 L378,418 L388,425 L398,420 L408,412 L418,415 L425,425 L430,438 L425,448 L418,455 L410,460 L402,468 L395,478 L390,488 L395,495 L405,498 L415,492 L425,485 L435,478 L445,480 L455,490 L462,500 L468,510 L475,505 L485,495 L492,488 L500,490 L510,498 L518,505 L525,500 L530,490 L535,478 L538,465 L542,452 L545,440 L548,428 L550,415 L548,402 L542,390 L538,378 L535,365 L530,352 L528,340 L530,328 L535,315 L540,302 L545,290 L550,278 L555,265 L558,252 L560,240 L562,228 L565,215 L568,202 L570,190 L572,178 L570,168 L565,160 L560,152 L555,145 L558,135 L562,125 L565,115 L562,105 L558,98 L555,90 L552,82 L550,72 L548,62 L555,52 Z",
    heatPoints: [
      { cx: 575, cy: 115, radius: 65, intensity: 0.85 },
      { cx: 555, cy: 130, radius: 55, intensity: 0.75 },
      { cx: 590, cy: 100, radius: 45, intensity: 0.7 },
      { cx: 540, cy: 105, radius: 40, intensity: 0.6 },
      { cx: 600, cy: 140, radius: 38, intensity: 0.55 },
      { cx: 560, cy: 155, radius: 35, intensity: 0.45 },
      { cx: 450, cy: 225, radius: 55, intensity: 0.7 },
      { cx: 430, cy: 240, radius: 45, intensity: 0.6 },
      { cx: 465, cy: 210, radius: 40, intensity: 0.55 },
      { cx: 415, cy: 225, radius: 35, intensity: 0.5 },
      { cx: 475, cy: 250, radius: 32, intensity: 0.4 },
      { cx: 440, cy: 200, radius: 30, intensity: 0.35 },
      { cx: 230, cy: 420, radius: 50, intensity: 0.45 },
      { cx: 200, cy: 440, radius: 40, intensity: 0.4 },
      { cx: 255, cy: 405, radius: 38, intensity: 0.35 },
      { cx: 215, cy: 415, radius: 32, intensity: 0.3 }
    ],
    errorLevel: 2.5,
    errorSources: [
      {
        type: "scale",
        title: "比例尺失调",
        description: "已有网格方格（计里画方法），但边远地区比例仍严重失调。《禹迹图》采用方格网法，内地较为准确，但岭南、西南等边远地区面积偏小。",
        severity: 0.6,
        icon: "Maximize2"
      },
      {
        type: "direction",
        title: "方向偏差",
        description: "海岸线形状有明显偏差，山东半岛过于方正，辽东半岛与朝鲜半岛区分不清。长江口以南海岸线整体偏直，缺乏港湾细节。",
        severity: 0.65,
        icon: "Compass"
      },
      {
        type: "mythology",
        title: "山海经传统影响",
        description: "大幅减少但仍保留部分河流源头传说，黄河源头仍标注为昆仑山。部分南方水系走向受传统文献影响而非实测。",
        severity: 0.45,
        icon: "BookOpen"
      }
    ],
    color: "#2d6a4f",
    colorLight: "#40916c"
  },
  {
    id: "yuan",
    name: "元",
    period: "1271–1368年",
    mapName: "大元一统志附图",
    cartographer: "扎马鲁丁等",
    mapYear: "1286年后",
    territoryPath: "M570,26 L555,35 L540,30 L530,40 L510,38 L490,45 L470,55 L455,52 L440,60 L420,58 L405,65 L380,62 L360,70 L340,68 L320,75 L300,72 L280,80 L260,78 L250,85 L235,82 L220,90 L200,88 L185,95 L170,92 L155,100 L140,98 L125,105 L115,102 L105,110 L95,108 L90,115 L85,125 L80,140 L78,155 L60,148 L40,155 L25,170 L20,195 L30,220 L50,235 L70,240 L82,230 L95,238 L108,242 L120,248 L130,258 L125,270 L118,280 L112,295 L108,310 L112,320 L120,325 L132,318 L145,310 L158,308 L170,315 L180,325 L188,340 L195,355 L205,365 L218,370 L230,365 L242,358 L255,362 L265,370 L275,378 L285,385 L298,388 L310,385 L322,390 L335,395 L348,392 L358,398 L368,408 L378,418 L388,425 L398,420 L408,412 L418,415 L425,425 L430,438 L425,448 L418,455 L410,460 L402,468 L395,478 L390,488 L395,495 L405,498 L415,492 L425,485 L435,478 L445,480 L455,490 L462,500 L468,510 L475,505 L485,495 L492,488 L500,490 L510,498 L518,505 L525,512 L532,518 L540,510 L545,500 L550,490 L555,480 L560,470 L565,458 L570,448 L578,438 L585,428 L590,418 L595,405 L600,392 L605,378 L610,365 L615,352 L620,340 L625,328 L630,315 L632,302 L630,290 L625,280 L618,272 L612,265 L608,255 L610,245 L615,235 L620,225 L625,215 L630,205 L635,195 L638,185 L635,175 L630,168 L625,160 L628,150 L635,140 L640,130 L645,120 L648,110 L645,100 L640,92 L635,85 L628,78 L620,72 L612,65 L605,58 L598,52 L590,45 L580,38 L570,26 Z",
    heatPoints: [
      { cx: 85, cy: 185, radius: 55, intensity: 0.65 },
      { cx: 60, cy: 200, radius: 45, intensity: 0.55 },
      { cx: 105, cy: 170, radius: 40, intensity: 0.5 },
      { cx: 55, cy: 170, radius: 35, intensity: 0.45 },
      { cx: 95, cy: 210, radius: 32, intensity: 0.4 },
      { cx: 75, cy: 155, radius: 28, intensity: 0.35 },
      { cx: 335, cy: 395, radius: 45, intensity: 0.4 },
      { cx: 315, cy: 405, radius: 35, intensity: 0.35 },
      { cx: 350, cy: 410, radius: 30, intensity: 0.3 }
    ],
    errorLevel: 2,
    errorSources: [
      {
        type: "scale",
        title: "比例尺失调",
        description: "因蒙古帝国大规模实测（\u201c测影所\u201d制度），内地比例大幅改善。但西北远疆仍存在比例偏差，草原地带面积估算偏大。",
        severity: 0.45,
        icon: "Maximize2"
      },
      {
        type: "direction",
        title: "方向偏差",
        description: "西北方向准确性显著提升，得益于蒙古帝国的驿站通信系统。但南方丘陵地带方向仍有偏移，岭南区域海岸线不够精确。",
        severity: 0.5,
        icon: "Compass"
      },
      {
        type: "mythology",
        title: "山海经传统影响",
        description: "大幅消退，元代以实地测量替代传说。但部分边远区域仍沿袭旧说，尤其是吐蕃地区地理描述仍包含传说成分。",
        severity: 0.3,
        icon: "BookOpen"
      }
    ],
    color: "#6a4c93",
    colorLight: "#8e6cbf"
  },
  {
    id: "ming",
    name: "明",
    period: "1368–1644年",
    mapName: "广舆图",
    cartographer: "罗洪先",
    mapYear: "1555年",
    territoryPath: "M570,26 L555,35 L540,30 L530,40 L510,38 L490,45 L470,55 L455,52 L440,60 L420,58 L405,65 L380,62 L360,70 L340,68 L320,75 L300,72 L280,80 L260,78 L250,85 L235,82 L220,90 L200,88 L185,95 L170,92 L155,100 L140,98 L125,105 L115,102 L105,110 L95,108 L90,115 L85,125 L80,140 L78,155 L82,165 L90,170 L95,180 L88,190 L80,200 L75,210 L72,225 L78,235 L85,240 L95,238 L108,242 L120,248 L130,258 L125,270 L118,280 L112,295 L108,310 L112,320 L120,325 L132,318 L145,310 L158,308 L170,315 L180,325 L188,340 L195,355 L205,365 L218,370 L230,365 L242,358 L255,362 L265,370 L275,378 L285,385 L298,388 L310,385 L322,390 L335,395 L348,392 L358,398 L368,408 L378,418 L388,425 L398,420 L408,412 L418,415 L425,425 L430,438 L425,448 L418,455 L410,460 L402,468 L395,478 L390,488 L395,495 L405,498 L415,492 L425,485 L435,478 L445,480 L455,490 L462,500 L468,510 L475,505 L485,495 L492,488 L500,490 L510,498 L518,505 L525,512 L532,518 L540,510 L545,500 L550,490 L555,480 L560,470 L565,458 L570,448 L578,438 L585,428 L590,418 L595,405 L600,392 L605,378 L610,365 L615,352 L620,340 L625,328 L630,315 L632,302 L630,290 L625,280 L618,272 L612,265 L608,255 L610,245 L615,235 L620,225 L625,215 L630,205 L635,195 L638,185 L635,175 L630,168 L625,160 L628,150 L635,140 L640,130 L645,120 L648,110 L645,100 L640,92 L635,85 L628,78 L620,72 L612,65 L605,58 L598,52 L590,45 L580,38 L570,26 Z",
    heatPoints: [
      { cx: 575, cy: 135, radius: 55, intensity: 0.65 },
      { cx: 555, cy: 150, radius: 45, intensity: 0.55 },
      { cx: 595, cy: 125, radius: 40, intensity: 0.5 },
      { cx: 545, cy: 125, radius: 38, intensity: 0.45 },
      { cx: 600, cy: 155, radius: 32, intensity: 0.4 },
      { cx: 565, cy: 168, radius: 28, intensity: 0.35 },
      { cx: 450, cy: 235, radius: 45, intensity: 0.45 },
      { cx: 435, cy: 245, radius: 35, intensity: 0.4 },
      { cx: 465, cy: 220, radius: 32, intensity: 0.35 },
      { cx: 425, cy: 230, radius: 28, intensity: 0.3 },
      { cx: 300, cy: 440, radius: 45, intensity: 0.4 },
      { cx: 275, cy: 455, radius: 35, intensity: 0.35 },
      { cx: 325, cy: 425, radius: 32, intensity: 0.3 },
      { cx: 285, cy: 425, radius: 28, intensity: 0.25 }
    ],
    errorLevel: 1.5,
    errorSources: [
      {
        type: "scale",
        title: "比例尺失调",
        description: "采用计里画方法，全国比例较为统一。《广舆图》以方格网为基准，省区比例基本协调，但边远省份与内地比例仍有差异。",
        severity: 0.35,
        icon: "Maximize2"
      },
      {
        type: "direction",
        title: "方向偏差",
        description: "海岸线仍有偏差，但整体方向大幅改善。东部海岸线较前朝更为准确，仅山东半岛和辽东半岛形状仍不够精确。",
        severity: 0.4,
        icon: "Compass"
      },
      {
        type: "mythology",
        title: "山海经传统影响",
        description: "基本消除，明代制图已完全转为实测为主。罗洪先明确以实测数据为依据，仅在极少数边远标注中残留旧说。",
        severity: 0.15,
        icon: "BookOpen"
      }
    ],
    color: "#1d3557",
    colorLight: "#457b9d"
  }
];

export const ERROR_TRENDS: ErrorTrend[] = [
  {
    dynastyId: "tang",
    dynastyName: "唐",
    overallError: 3,
    scaleError: 0.8,
    directionError: 0.6,
    mythologyError: 0.7
  },
  {
    dynastyId: "song",
    dynastyName: "宋",
    overallError: 2.5,
    scaleError: 0.6,
    directionError: 0.65,
    mythologyError: 0.45
  },
  {
    dynastyId: "yuan",
    dynastyName: "元",
    overallError: 2,
    scaleError: 0.45,
    directionError: 0.5,
    mythologyError: 0.3
  },
  {
    dynastyId: "ming",
    dynastyName: "明",
    overallError: 1.5,
    scaleError: 0.35,
    directionError: 0.4,
    mythologyError: 0.15
  }
];
