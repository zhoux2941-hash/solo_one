const dynastyNames = {
    sui: '隋朝',
    tang: '唐朝',
    song: '宋朝',
    yuan: '元朝',
    ming: '明朝'
};

const cities = {
    luoyang: { name: '洛阳', x: 380, y: 320 },
    bianliang: { name: '汴梁', x: 440, y: 300 },
    changan: { name: '长安', x: 300, y: 330 },
    hangzhou: { name: '杭州', x: 560, y: 450 },
    zhuojun: { name: '涿郡', x: 520, y: 140 },
    yangzhou: { name: '扬州', x: 520, y: 380 },
    yuhang: { name: '余杭', x: 560, y: 450 },
    guangtong: { name: '广通仓', x: 340, y: 325 },
    linqing: { name: '临清', x: 490, y: 220 },
    dezhou: { name: '德州', x: 500, y: 250 },
    jining: { name: '济宁', x: 490, y: 280 },
    xuzhou: { name: '徐州', x: 500, y: 330 },
    huaian: { name: '淮安', x: 520, y: 360 },
    yangzhou2: { name: '扬州', x: 530, y: 380 },
    suzhou: { name: '苏州', x: 550, y: 420 },
    beijing: { name: '大都', x: 510, y: 150 },
    qingjiang: { name: '清江浦', x: 520, y: 370 },
    tianjin: { name: '直沽', x: 530, y: 180 },
    liujia: { name: '刘家港', x: 580, y: 420 }
};

const canalData = {
    sui: {
        color: '#e74c3c',
        type: '隋唐大运河',
        segments: [
            {
                id: 'sui_guangtong',
                name: '广通渠',
                route: '长安-洛阳',
                from: 'changan',
                to: 'luoyang',
                path: 'M 300 330 Q 340 325 380 320',
                length: '约300公里',
                volume: '约200万石',
                time: '约15天',
                lossRate: 0.12,
                lossReason: '早期河道疏浚不足，船只易搁浅'
            },
            {
                id: 'sui_tongji',
                name: '通济渠',
                route: '洛阳-汴梁-淮河',
                from: 'luoyang',
                to: 'huaian',
                path: 'M 380 320 Q 440 300 520 360',
                length: '约650公里',
                volume: '约300万石',
                time: '约30天',
                lossRate: 0.15,
                lossReason: '河道初开，泥沙淤积严重'
            },
            {
                id: 'sui_han',
                name: '邗沟',
                route: '山阳-江都',
                from: 'huaian',
                to: 'yangzhou',
                path: 'M 520 360 Q 520 370 520 380',
                length: '约150公里',
                volume: '约250万石',
                time: '约10天',
                lossRate: 0.10,
                lossReason: '利用旧有河道，条件较好'
            },
            {
                id: 'sui_jiangnan',
                name: '江南河',
                route: '京口-余杭',
                from: 'yangzhou',
                to: 'hangzhou',
                path: 'M 520 380 Q 540 410 560 450',
                length: '约400公里',
                volume: '约200万石',
                time: '约20天',
                lossRate: 0.08,
                lossReason: '江南地区水源充足'
            },
            {
                id: 'sui_yongji',
                name: '永济渠',
                route: '洛阳-涿郡',
                from: 'luoyang',
                to: 'zhuojun',
                path: 'M 380 320 Q 450 220 520 140',
                length: '约1000公里',
                volume: '约150万石',
                time: '约45天',
                lossRate: 0.20,
                lossReason: '北方河道，冬季结冰期长'
            }
        ]
    },
    tang: {
        color: '#e67e22',
        type: '隋唐大运河',
        segments: [
            {
                id: 'tang_guangtong',
                name: '广通渠',
                route: '长安-洛阳',
                from: 'changan',
                to: 'luoyang',
                path: 'M 300 330 Q 340 325 380 320',
                length: '约300公里',
                volume: '约250万石',
                time: '约12天',
                lossRate: 0.08,
                lossReason: '河道维护改善，运输效率提高'
            },
            {
                id: 'tang_tongji',
                name: '通济渠',
                route: '洛阳-汴梁-淮河',
                from: 'luoyang',
                to: 'huaian',
                path: 'M 380 320 Q 440 300 520 360',
                length: '约650公里',
                volume: '约400万石',
                time: '约25天',
                lossRate: 0.10,
                lossReason: '定期疏浚，河道状况改善'
            },
            {
                id: 'tang_han',
                name: '邗沟',
                route: '山阳-江都',
                from: 'huaian',
                to: 'yangzhou',
                path: 'M 520 360 Q 520 370 520 380',
                length: '约150公里',
                volume: '约350万石',
                time: '约8天',
                lossRate: 0.06,
                lossReason: '运量大但河道条件好'
            },
            {
                id: 'tang_jiangnan',
                name: '江南河',
                route: '京口-余杭',
                from: 'yangzhou',
                to: 'hangzhou',
                path: 'M 520 380 Q 540 410 560 450',
                length: '约400公里',
                volume: '约300万石',
                time: '约18天',
                lossRate: 0.05,
                lossReason: '江南经济发达，管理完善'
            },
            {
                id: 'tang_yongji',
                name: '永济渠',
                route: '洛阳-涿郡',
                from: 'luoyang',
                to: 'zhuojun',
                path: 'M 380 320 Q 450 220 520 140',
                length: '约1000公里',
                volume: '约100万石',
                time: '约40天',
                lossRate: 0.15,
                lossReason: '北方边防需求，但气候条件限制'
            }
        ]
    },
    song: {
        color: '#9b59b6',
        type: '北宋漕运',
        segments: [
            {
                id: 'song_bianhe',
                name: '汴河',
                route: '汴梁-淮河',
                from: 'bianliang',
                to: 'huaian',
                path: 'M 440 300 Q 480 330 520 360',
                length: '约500公里',
                volume: '约600万石',
                time: '约20天',
                lossRate: 0.08,
                lossReason: '漕运制度完善，损耗控制良好'
            },
            {
                id: 'song_huimin',
                name: '惠民河',
                route: '汴梁-陈州',
                from: 'bianliang',
                to: 'xuzhou',
                path: 'M 440 300 Q 460 315 500 330',
                length: '约200公里',
                volume: '约60万石',
                time: '约10天',
                lossRate: 0.10,
                lossReason: '辅助运河，运量较小'
            },
            {
                id: 'song_guangji',
                name: '广济河',
                route: '汴梁-曹州',
                from: 'bianliang',
                to: 'jining',
                path: 'M 440 300 Q 465 290 490 280',
                length: '约150公里',
                volume: '约40万石',
                time: '约8天',
                lossRate: 0.12,
                lossReason: '河道较浅，大型船只受限'
            },
            {
                id: 'song_jinshui',
                name: '金水河',
                route: '荥阳-汴梁',
                from: 'luoyang',
                to: 'bianliang',
                path: 'M 380 320 Q 410 310 440 300',
                length: '约100公里',
                volume: '约20万石',
                time: '约5天',
                lossRate: 0.05,
                lossReason: '短途运输，损耗极小'
            },
            {
                id: 'song_jiangnan',
                name: '江南运河',
                route: '扬州-杭州',
                from: 'yangzhou',
                to: 'hangzhou',
                path: 'M 520 380 Q 540 410 560 450',
                length: '约400公里',
                volume: '约350万石',
                time: '约15天',
                lossRate: 0.04,
                lossReason: '经济重心南移，江南漕运最发达'
            }
        ]
    },
    yuan: {
        color: '#3498db',
        type: '元代漕运',
        segments: [
            {
                id: 'yuan_huitong',
                name: '会通河',
                route: '济宁-临清',
                from: 'jining',
                to: 'linqing',
                path: 'M 490 280 Q 490 250 490 220',
                length: '约125公里',
                volume: '约100万石',
                time: '约15天',
                lossRate: 0.10,
                lossReason: '新凿河道，工程尚未完善'
            },
            {
                id: 'yuan_tonghui',
                name: '通惠河',
                route: '通州-大都',
                from: 'tianjin',
                to: 'beijing',
                path: 'M 530 180 Q 520 165 510 150',
                length: '约82公里',
                volume: '约80万石',
                time: '约10天',
                lossRate: 0.05,
                lossReason: '郭守敬主持修建，技术先进'
            },
            {
                id: 'yuan_zhou',
                name: '济州河',
                route: '济宁-安山',
                from: 'xuzhou',
                to: 'jining',
                path: 'M 500 330 Q 495 305 490 280',
                length: '约75公里',
                volume: '约90万石',
                time: '约8天',
                lossRate: 0.08,
                lossReason: '河道较浅，水闸调节'
            },
            {
                id: 'yuan_jiangnan',
                name: '江南运河',
                route: '杭州-长江',
                from: 'hangzhou',
                to: 'yangzhou',
                path: 'M 560 450 Q 540 410 520 380',
                length: '约400公里',
                volume: '约200万石',
                time: '约18天',
                lossRate: 0.06,
                lossReason: '江南段保持良好'
            },
            {
                id: 'yuan_sea1',
                name: '海运线',
                route: '刘家港-直沽',
                from: 'liujia',
                to: 'tianjin',
                path: 'M 580 420 Q 650 350 680 250 Q 650 200 530 180',
                length: '约5000里',
                volume: '约300万石',
                time: '约15天',
                lossRate: 0.18,
                lossReason: '海上风涛险恶，沉船风险大'
            }
        ]
    },
    ming: {
        color: '#27ae60',
        type: '京杭大运河',
        segments: [
            {
                id: 'ming_huitong',
                name: '会通河',
                route: '济宁-临清',
                from: 'jining',
                to: 'linqing',
                path: 'M 490 280 Q 490 250 490 220',
                length: '约125公里',
                volume: '约400万石',
                time: '约12天',
                lossRate: 0.06,
                lossReason: '永乐年间大修，河道条件改善'
            },
            {
                id: 'ming_baishui',
                name: '北运河',
                route: '临清-直沽',
                from: 'linqing',
                to: 'tianjin',
                path: 'M 490 220 Q 510 200 530 180',
                length: '约300公里',
                volume: '约450万石',
                time: '约15天',
                lossRate: 0.05,
                lossReason: '利用卫河，水源稳定'
            },
            {
                id: 'ming_nanhe',
                name: '南运河',
                route: '直沽-北京',
                from: 'tianjin',
                to: 'beijing',
                path: 'M 530 180 Q 520 165 510 150',
                length: '约150公里',
                volume: '约450万石',
                time: '约10天',
                lossRate: 0.04,
                lossReason: '通惠河整修后，可直达京城'
            },
            {
                id: 'ming_zhonghe',
                name: '中河',
                route: '淮安-济宁',
                from: 'qingjiang',
                to: 'jining',
                path: 'M 520 370 Q 505 325 490 280',
                length: '约400公里',
                volume: '约400万石',
                time: '约20天',
                lossRate: 0.07,
                lossReason: '黄河泛滥影响，需定期疏浚'
            },
            {
                id: 'ming_nanhe2',
                name: '里运河',
                route: '淮安-扬州',
                from: 'qingjiang',
                to: 'yangzhou2',
                path: 'M 520 370 Q 525 375 530 380',
                length: '约150公里',
                volume: '约450万石',
                time: '约8天',
                lossRate: 0.03,
                lossReason: '明代漕运枢纽，管理最完善'
            },
            {
                id: 'ming_jiangnan',
                name: '江南运河',
                route: '扬州-杭州',
                from: 'yangzhou2',
                to: 'hangzhou',
                path: 'M 530 380 Q 545 415 560 450',
                length: '约400公里',
                volume: '约450万石',
                time: '约15天',
                lossRate: 0.03,
                lossReason: '明代江南经济繁荣，漕运制度最完善'
            }
        ]
    }
};