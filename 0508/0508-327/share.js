class ShareUtils {
    static compressData(data) {
        const jsonStr = JSON.stringify(data);
        let compressed = '';
        for (let i = 0; i < jsonStr.length; i++) {
            const charCode = jsonStr.charCodeAt(i);
            if (charCode < 128) {
                compressed += String.fromCharCode(charCode);
            } else {
                compressed += String.fromCharCode(0xc0 | (charCode >> 6));
                compressed += String.fromCharCode(0x80 | (charCode & 0x3f));
            }
        }
        return compressed;
    }

    static decompressData(compressed) {
        let decompressed = '';
        let i = 0;
        while (i < compressed.length) {
            const b = compressed.charCodeAt(i);
            if (b < 128) {
                decompressed += String.fromCharCode(b);
                i++;
            } else {
                decompressed += String.fromCharCode(((b & 0x1f) << 6) | (compressed.charCodeAt(i + 1) & 0x3f));
                i += 2;
            }
        }
        return JSON.parse(decompressed);
    }

    static encodeBase64(str) {
        const utf8Bytes = [];
        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i);
            if (charCode < 128) {
                utf8Bytes.push(charCode);
            } else if (charCode < 2048) {
                utf8Bytes.push((charCode >> 6) | 192);
                utf8Bytes.push((charCode & 63) | 128);
            } else {
                utf8Bytes.push((charCode >> 12) | 224);
                utf8Bytes.push(((charCode >> 6) & 63) | 128);
                utf8Bytes.push((charCode & 63) | 128);
            }
        }
        return btoa(String.fromCharCode.apply(null, utf8Bytes));
    }

    static decodeBase64(encoded) {
        const decoded = atob(encoded);
        let result = '';
        let i = 0;
        while (i < decoded.length) {
            const c = decoded.charCodeAt(i);
            if (c < 128) {
                result += String.fromCharCode(c);
                i++;
            } else if (c > 191 && c < 224) {
                result += String.fromCharCode(((c & 31) << 6) | (decoded.charCodeAt(i + 1) & 63));
                i += 2;
            } else {
                result += String.fromCharCode(((c & 15) << 12) | ((decoded.charCodeAt(i + 1) & 63) << 6) | (decoded.charCodeAt(i + 2) & 63));
                i += 3;
            }
        }
        return result;
    }

    static generateShareLink(readings, stats, patientName = '') {
        const shareData = {
            v: 1,
            t: Date.now(),
            n: patientName,
            r: readings.map(r => ({
                t: r.timestamp,
                v: r.glucoseValue,
                y: r.type
            })),
            s: {
                a: stats.average,
                d: stats.stdDev,
                h: stats.hba1c,
                c: stats.count,
                m: stats.min,
                x: stats.max
            }
        };

        const compressed = this.compressData(shareData);
        const encoded = this.encodeBase64(compressed);
        const baseUrl = window.location.href.replace('index.html', 'share.html');
        
        return `${baseUrl}?d=${encodeURIComponent(encoded)}`;
    }

    static parseShareLink() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const encodedData = urlParams.get('d');
            
            if (!encodedData) {
                return null;
            }

            const decoded = this.decodeBase64(encodedData);
            const data = this.decompressData(decoded);

            if (data.v !== 1) {
                throw new Error('不支持的数据版本');
            }

            return {
                timestamp: data.t,
                patientName: data.n,
                readings: data.r.map(r => ({
                    timestamp: r.t,
                    glucoseValue: r.v,
                    type: r.y
                })),
                stats: {
                    average: data.s.a,
                    stdDev: data.s.d,
                    hba1c: data.s.h,
                    count: data.s.c,
                    min: data.s.m,
                    max: data.s.x
                }
            };
        } catch (error) {
            console.error('解析分享链接失败:', error);
            return null;
        }
    }

    static formatDate(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    static getShareExpiryDate(timestamp) {
        const expiry = new Date(timestamp + 30 * 24 * 60 * 60 * 1000);
        return this.formatDate(expiry.getTime());
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShareUtils;
}