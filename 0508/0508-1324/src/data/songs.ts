import type { Song } from '@/types';

export const songs: Song[] = [
  {
    id: 'song-1',
    title: '蝉之歌',
    dialect: 'sanjiang',
    duration: 20,
    lyrics: {
      dong: 'Jangl weex jangl weex, jeml yaoc jeml yaoc',
      chinese: '蝉儿声声叫，蝉儿声声叫，唱支蝉歌给妹听',
    },
    audioConfig: {
      highVoice: {
        baseFrequency: 880,
        entryTime: 2,
        pattern: [0, 2, 4, 5, 7, 9, 11, 12],
      },
      lowVoice: {
        baseFrequency: 220,
        entryTime: 0,
        pattern: [0, 0, 0, 0, 2, 2, 2, 2],
      },
    },
    questions: {
      entry: {
        correctAnswer: 'low',
        highEntryTime: 2,
        lowEntryTime: 0,
      },
      melody: {
        correctAnswer: 'high',
        description: '高音部演唱主旋律，低音部伴唱',
      },
    },
  },
  {
    id: 'song-2',
    title: '大山真美好',
    dialect: 'congjiang',
    duration: 18,
    lyrics: {
      dong: 'Dax sanh dal naih nyil',
      chinese: '大山真美好，风景如画，青山绿水好风光',
    },
    audioConfig: {
      highVoice: {
        baseFrequency: 784,
        entryTime: 0,
        pattern: [0, 3, 5, 7, 8, 7, 5, 3],
      },
      lowVoice: {
        baseFrequency: 196,
        entryTime: 3,
        pattern: [0, 0, 2, 2, 4, 4, 2, 2],
      },
    },
    questions: {
      entry: {
        correctAnswer: 'high',
        highEntryTime: 0,
        lowEntryTime: 3,
      },
      melody: {
        correctAnswer: 'high',
        description: '高音部主导旋律明亮突出，低音部作为和声基础',
      },
    },
  },
  {
    id: 'song-3',
    title: '布谷催春',
    dialect: 'liping',
    duration: 22,
    lyrics: {
      dong: 'Bux gux bux gux, xeep nganh xeep nganh',
      chinese: '布谷鸟叫了，春天来了，布谷布谷催春耕',
    },
    audioConfig: {
      highVoice: {
        baseFrequency: 988,
        entryTime: 1,
        pattern: [0, 4, 7, 9, 11, 9, 7, 4],
      },
      lowVoice: {
        baseFrequency: 247,
        entryTime: 4,
        pattern: [0, 0, 0, 3, 3, 3, 5, 5],
      },
    },
    questions: {
      entry: {
        correctAnswer: 'high',
        highEntryTime: 1,
        lowEntryTime: 4,
      },
      melody: {
        correctAnswer: 'low',
        description: '低音部承载主要旋律线条，高音部装饰性华彩',
      },
    },
  },
  {
    id: 'song-4',
    title: '思念歌',
    dialect: 'sanjiang',
    duration: 25,
    lyrics: {
      dong: 'Nuv nyaenc nyaoh saeml saeml',
      chinese: '思念啊思念，远在他乡的亲人啊',
    },
    audioConfig: {
      highVoice: {
        baseFrequency: 880,
        entryTime: 3,
        pattern: [0, 2, 3, 5, 7, 8, 10, 12],
      },
      lowVoice: {
        baseFrequency: 220,
        entryTime: 0,
        pattern: [0, 0, 0, 0, 0, 0, 2, 2],
      },
    },
    questions: {
      entry: {
        correctAnswer: 'low',
        highEntryTime: 3,
        lowEntryTime: 0,
      },
      melody: {
        correctAnswer: 'low',
        description: '低音部深情演绎主旋律，高音部漂浮其上',
      },
    },
  },
  {
    id: 'song-5',
    title: '敬酒歌',
    dialect: 'congjiang',
    duration: 16,
    lyrics: {
      dong: 'Kuanh jiuv kuanh jiuv, yanc gaos yanc gaos',
      chinese: '举起酒杯啊，美酒敬亲人',
    },
    audioConfig: {
      highVoice: {
        baseFrequency: 659,
        entryTime: 0,
        pattern: [0, 5, 7, 9, 10, 9, 7, 5],
      },
      lowVoice: {
        baseFrequency: 165,
        entryTime: 2,
        pattern: [0, 0, 0, 4, 4, 4, 2, 2],
      },
    },
    questions: {
      entry: {
        correctAnswer: 'high',
        highEntryTime: 0,
        lowEntryTime: 2,
      },
      melody: {
        correctAnswer: 'high',
        description: '高音部明亮高亢，是歌曲的核心旋律',
      },
    },
  },
];

export const getSongsByDialect = (dialect: string) => {
  return songs.filter(song => song.dialect === dialect);
};

export const getSongById = (id: string) => {
  return songs.find(song => song.id === id);
};
