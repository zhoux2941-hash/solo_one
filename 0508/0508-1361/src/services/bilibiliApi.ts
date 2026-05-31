import { XMLParser } from 'fast-xml-parser';
import type { Danmaku } from '../types';

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

export async function getCidByBv(bv: string): Promise<{ cid: number; title: string; owner: string } | null> {
  try {
    const url = `${CORS_PROXY}${encodeURIComponent(`https://api.bilibili.com/x/web-interface/view?bvid=${bv}`)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.code === 0 && data.data) {
      return {
        cid: data.data.cid,
        title: data.data.title,
        owner: data.data.owner.name,
      };
    }
    return null;
  } catch (error) {
    console.error('获取CID失败:', error);
    return null;
  }
}

export async function getDanmakuByCid(cid: number): Promise<Danmaku[]> {
  try {
    const url = `${CORS_PROXY}${encodeURIComponent(`https://comment.bilibili.com/${cid}.xml`)}`;
    const response = await fetch(url);
    const xmlText = await response.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });

    const result = parser.parse(xmlText);
    const danmakuList: Danmaku[] = [];

    if (result.i && result.i.d) {
      const items = Array.isArray(result.i.d) ? result.i.d : [result.i.d];
      items.forEach((item: any) => {
        if (item['@_p'] && item['#text']) {
          const params = item['@_p'].split(',');
          danmakuList.push({
            time: parseFloat(params[0]),
            sendTime: parseInt(params[4]),
            pool: parseInt(params[5]),
            userId: params[6],
            rowId: params[7],
            text: item['#text'].trim(),
          });
        }
      });
    }

    return danmakuList;
  } catch (error) {
    console.error('获取弹幕失败:', error);
    return [];
  }
}

export async function fetchDanmakuByBv(bv: string): Promise<{
  danmakuList: Danmaku[];
  videoInfo: { title: string; owner: string };
} | null> {
  const videoData = await getCidByBv(bv);
  if (!videoData) return null;

  const danmakuList = await getDanmakuByCid(videoData.cid);
  return {
    danmakuList,
    videoInfo: {
      title: videoData.title,
      owner: videoData.owner,
    },
  };
}
