export interface ImageConfig {
  id: string;
  title: string;
  imageUrl: string;
  theme: string;
}

export interface LocationImages {
  locationId: string;
  images: ImageConfig[];
}

export const locationImages: Record<string, LocationImages> = {
  yangliuqing: {
    locationId: 'yangliuqing',
    images: [
      {
        id: 'ylq-1',
        title: '门神·秦琼敬德',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Yangliuqing%20Tianjin%20door%20god%20Qin%20Qiong%20Yuchi%20Gong%20imperial%20court%20painting%20exquisite%20fine%20brushwork%20elegant%20soft%20colors%20traditional%20Chinese%20folk%20art&image_size=square_hd',
        theme: '门神'
      },
      {
        id: 'ylq-2',
        title: '连年有余',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Yangliuqing%20lotus%20fish%20abundance%20symbol%20New%20Year%20painting%20elegant%20court%20style%20exquisite%20details%20soft%20pastel%20colors%20traditional%20Chinese&image_size=square_hd',
        theme: '吉祥喜庆'
      },
      {
        id: 'ylq-3',
        title: '白蛇传',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Yangliuqing%20Legend%20of%20White%20Snake%20story%20painting%20fine%20brushwork%20elegant%20refined%20colors%20court%20painting%20style%20traditional%20Chinese%20New%20Year%20art&image_size=square_hd',
        theme: '戏文故事'
      },
      {
        id: 'ylq-4',
        title: '富贵平安',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Yangliuqing%20peonies%20wealth%20peace%20painting%20exquisite%20gorgeous%20imperial%20style%20elegant%20composition%20traditional%20Chinese%20art&image_size=square_hd',
        theme: '吉祥喜庆'
      }
    ]
  },
  taohuawu: {
    locationId: 'taohuawu',
    images: [
      {
        id: 'thw-1',
        title: '门神·神荼郁垒',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Taohuawu%20Suzhou%20Jiangnan%20style%20door%20gods%20Shentu%20Yulei%20bright%20vivid%20colors%20water%20town%20charm%20exaggerated%20shapes%20folk%20art&image_size=square_hd',
        theme: '门神'
      },
      {
        id: 'thw-2',
        title: '姑苏繁华图',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Taohuawu%20bustling%20Suzhou%20market%20scene%20Jiangnan%20water%20town%20rich%20vibrant%20colors%20canal%20bridge%20traditional%20Chinese%20folk%20painting&image_size=square_hd',
        theme: '吉祥喜庆'
      },
      {
        id: 'thw-3',
        title: '西厢记',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Taohuawu%20Romance%20of%20Western%20Chamber%20opera%20story%20Jiangnan%20elegant%20style%20bright%20colors%20Suzhou%20garden%20background%20traditional%20art&image_size=square_hd',
        theme: '戏文故事'
      },
      {
        id: 'thw-4',
        title: '百子图',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Taohuawu%20hundred%20children%20playing%20hundred%20boys%20painting%20Jiangnan%20style%20vibrant%20joyful%20lively%20scene%20traditional%20Chinese%20folk%20art&image_size=square_hd',
        theme: '吉祥喜庆'
      }
    ]
  },
  yangjiabu: {
    locationId: 'yangjiabu',
    images: [
      {
        id: 'yjb-1',
        title: '门神·秦琼',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Yangjiabu%20Shandong%20rural%20door%20god%20Qin%20Qiong%20bold%20unrestrained%20style%20strong%20contrasting%20colors%20northern%20peasant%20village%20flavor%20woodblock%20print&image_size=square_hd',
        theme: '门神'
      },
      {
        id: 'yjb-2',
        title: '年年有余',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Yangjiabu%20fish%20abundance%20carp%20lotus%20bold%20strong%20colors%20Shandong%20rural%20style%20peasant%20painting%20thick%20black%20lines&image_size=square_hd',
        theme: '吉祥喜庆'
      },
      {
        id: 'yjb-3',
        title: '孙悟空大闹天宫',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Yangjiabu%20Monkey%20King%20Sun%20Wukong%20Havoc%20in%20Heaven%20bold%20dynamic%20dramatic%20Shandong%20peasant%20style%20strong%20colors&image_size=square_hd',
        theme: '戏文故事'
      },
      {
        id: 'yjb-4',
        title: '大发财源',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Yangjiabu%20God%20of%20Wealth%20Caishen%20bold%20prosperity%20Shandong%20rural%20style%20strong%20red%20colors%20thick%20lines%20woodblock%20print&image_size=square_hd',
        theme: '吉祥喜庆'
      }
    ]
  },
  zhuxianzhen: {
    locationId: 'zhuxianzhen',
    images: [
      {
        id: 'zxz-1',
        title: '门神·尉迟恭',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Zhuxianzhen%20Henan%20ancient%20door%20god%20Yuchi%20Gong%20primitive%20simple%20style%20bold%20thick%20lines%20strong%20color%20contrast%20Central%20Plains%20culture%20woodblock%20print&image_size=square_hd',
        theme: '门神'
      },
      {
        id: 'zxz-2',
        title: '刘海戏金蟾',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Zhuxianzhen%20Liu%20Hai%20playing%20golden%20toad%20ancient%20primitive%20style%20simple%20bold%20Henan%20folk%20art%20thick%20lines%20strong%20red%20yellow%20black%20colors&image_size=square_hd',
        theme: '吉祥喜庆'
      },
      {
        id: 'zxz-3',
        title: '三国演义',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Zhuxianzhen%20Romance%20of%20Three%20Kingdoms%20warriors%20ancient%20primitive%20bold%20style%20Henan%20Central%20Plains%20thick%20black%20lines%20strong%20colors&image_size=square_hd',
        theme: '戏文故事'
      },
      {
        id: 'zxz-4',
        title: '麒麟送子',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Zhuxianzhen%20qilin%20bringing%20children%20ancient%20primitive%20auspicious%20Henan%20style%20thick%20bold%20lines%20strong%20color%20contrast%20woodblock%20print&image_size=square_hd',
        theme: '吉祥喜庆'
      }
    ]
  },
  wuqiang: {
    locationId: 'wuqiang',
    images: [
      {
        id: 'wq-1',
        title: '门神·鞭锏门神',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Wuqiang%20Hebei%20door%20god%20with%20whips%20mace%20full%20composition%20concise%20thick%20lines%20exaggerated%20shapes%20Hebei%20rural%20folk%20art%20woodblock%20print&image_size=square_hd',
        theme: '门神'
      },
      {
        id: 'wq-2',
        title: '六子争头',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Wuqiang%20six%20children%20optical%20illusion%20six%20boys%20heads%20clever%20composition%20Hebei%20bold%20thick%20lines%20folk%20art%20traditional%20woodblock%20print&image_size=square_hd',
        theme: '吉祥喜庆'
      },
      {
        id: 'wq-3',
        title: '二十四孝',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Wuqiang%20Twenty%20four%20Filial%20Piety%20stories%20full%20composition%20exaggerated%20shapes%20Hebei%20rural%20style%20bold%20lines%20moral%20theme&image_size=square_hd',
        theme: '戏文故事'
      },
      {
        id: 'wq-4',
        title: '招财进宝',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Wuqiang%20God%20of%20Wealth%20Caishen%20attracting%20treasure%20full%20composition%20Hebei%20bold%20style%20strong%20colors%20woodblock%20print&image_size=square_hd',
        theme: '吉祥喜庆'
      }
    ]
  },
  fengxiang: {
    locationId: 'fengxiang',
    images: [
      {
        id: 'fx-1',
        title: '门神·秦琼敬德',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Fengxiang%20Shaanxi%20Northwest%20door%20god%20Qin%20Qiong%20Yuchi%20Gong%20bright%20striking%20colors%20loess%20plateau%20style%20vivid%20exaggerated%20shapes%20Shaanxi%20folk%20art&image_size=square_hd',
        theme: '门神'
      },
      {
        id: 'fx-2',
        title: '吉祥如意图',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Fengxiang%20elephant%20ruyi%20good%20fortune%20bright%20vivid%20colors%20Northwest%20Shaanxi%20loess%20style%20auspicious%20folk%20painting&image_size=square_hd',
        theme: '吉祥喜庆'
      },
      {
        id: 'fx-3',
        title: '西游记',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Fengxiang%20Journey%20to%20the%20West%20Monkey%20King%20Tang%20Monk%20vivid%20bright%20colors%20Shaanxi%20Northwest%20style%20folk%20art&image_size=square_hd',
        theme: '戏文故事'
      },
      {
        id: 'fx-4',
        title: '胖娃娃',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Fengxiang%20chubby%20baby%20holding%20fish%20lotus%20bright%20cute%20vivid%20Shaanxi%20loess%20style%20folk%20painting&image_size=square_hd',
        theme: '吉祥喜庆'
      }
    ]
  },
  mianzhu: {
    locationId: 'mianzhu',
    images: [
      {
        id: 'mz-1',
        title: '门神·武将',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Mianzhu%20Sichuan%20Bashu%20door%20god%20military%20general%20exaggerated%20bold%20unrestrained%20symmetrical%20composition%20bright%20colors%20Sichuan%20folk%20art&image_size=square_hd',
        theme: '门神'
      },
      {
        id: 'mz-2',
        title: '麻姑献寿',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Mianzhu%20Ma%20Gu%20offering%20longevity%20peach%20exaggerated%20bold%20Bashu%20Sichuan%20style%20bright%20vibrant%20colors%20folk%20art&image_size=square_hd',
        theme: '吉祥喜庆'
      },
      {
        id: 'mz-3',
        title: '水浒传',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Mianzhu%20Water%20Margin%20heroes%20outlaws%20of%20the%20marsh%20exaggerated%20bold%20Bashu%20Sichuan%20style%20strong%20colors%20folk%20art&image_size=square_hd',
        theme: '戏文故事'
      },
      {
        id: 'mz-4',
        title: '迎春图',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Mianzhu%20welcoming%20spring%20plum%20blossom%20exaggerated%20bold%20Bashu%20Sichuan%20style%20bright%20festive%20colors%20folk%20art&image_size=square_hd',
        theme: '吉祥喜庆'
      },
      {
        id: 'mz-5',
        title: '双扬鞭',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Mianzhu%20two%20generals%20whips%20symmetrical%20composition%20exaggerated%20bold%20powerful%20Bashu%20Sichuan%20style%20strong%20colors&image_size=square_hd',
        theme: '门神'
      }
    ]
  },
  foshan: {
    locationId: 'foshan',
    images: [
      {
        id: 'fs-1',
        title: '门神·镇宅将军',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Foshan%20Guangdong%20Lingnan%20style%20door%20god%20general%20gold%20foil%20ornate%20gorgeous%20bright%20red%20gold%20colors%20Guangdong%20folk%20art&image_size=square_hd',
        theme: '门神'
      },
      {
        id: 'fs-2',
        title: '金玉满堂',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Foshan%20gold%20jade%20full%20hall%20wealth%20prosperity%20gold%20foil%20ornate%20Lingnan%20Guangdong%20style%20bright%20red%20colors%20folk%20art&image_size=square_hd',
        theme: '吉祥喜庆'
      },
      {
        id: 'fs-3',
        title: '洛神图',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Foshan%20Goddess%20of%20Luo%20River%20elegant%20Lingnan%20Guangdong%20style%20delicate%20gold%20foil%20ornate%20folk%20painting&image_size=square_hd',
        theme: '戏文故事'
      },
      {
        id: 'fs-4',
        title: '花开富贵',
        imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Foshan%20peony%20flowers%20bloom%20wealth%20gold%20foil%20Lingnan%20Guangdong%20style%20bright%20vibrant%20red%20colors%20folk%20art&image_size=square_hd',
        theme: '吉祥喜庆'
      }
    ]
  }
};
