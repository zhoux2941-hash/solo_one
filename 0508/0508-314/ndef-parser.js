class NDEFParser {
    static TNF_TYPES = {
        0x00: 'Empty',
        0x01: 'Well-Known',
        0x02: 'MIME',
        0x03: 'Absolute URI',
        0x04: 'External',
        0x05: 'Unknown',
        0x06: 'Unchanged',
        0x07: 'Reserved'
    };

    static RTD_TYPES = {
        'T': 'Text',
        'U': 'URI',
        'Sp': 'Smart Poster',
        'act': 'Action',
        's': 'Size',
        't': 'Type'
    };

    static URI_PREFIXES = [
        '',
        'http://www.',
        'https://www.',
        'http://',
        'https://',
        'tel:',
        'mailto:',
        'ftp://anonymous:anonymous@',
        'ftp://ftp.',
        'ftps://',
        'sftp://',
        'smb://',
        'nfs://',
        'ftp://',
        'dav://',
        'news:',
        'telnet://',
        'imap:',
        'rtsp://',
        'urn:',
        'pop:',
        'sip:',
        'sips:',
        'tftp:',
        'btspp://',
        'btl2cap://',
        'btgoep://',
        'tcpobex://',
        'irdaobex://',
        'file://',
        'urn:epc:id:',
        'urn:epc:tag:',
        'urn:epc:pat:',
        'urn:epc:raw:',
        'urn:epc:',
        'urn:nfc:'
    ];

    static parseRecords(records) {
        return records.map((record, index) => this.parseRecord(record, index));
    }

    static normalizeBytes(data) {
        if (data instanceof Uint8Array) {
            return data;
        }
        if (data instanceof ArrayBuffer) {
            return new Uint8Array(data);
        }
        if (Array.isArray(data)) {
            return new Uint8Array(data);
        }
        return new Uint8Array();
    }

    static parseRecord(record, index = 0) {
        const typeBytes = this.normalizeBytes(record.type);
        const dataBytes = this.normalizeBytes(record.data);

        const result = {
            index: index,
            tnf: record.tnf,
            tnfName: this.TNF_TYPES[record.tnf] || 'Unknown',
            type: this.bytesToHex(typeBytes),
            recordType: this.getRecordTypeName({ ...record, type: typeBytes }),
            payload: this.bytesToHex(dataBytes),
            rawPayload: dataBytes,
            isEncrypted: false
        };

        try {
            if (this.isEncryptedRecord(record)) {
                Object.assign(result, this.parseEncryptedRecord(record));
                result.isEncrypted = true;
            } else if (record.tnf === 0x01) {
                const typeStr = new TextDecoder('utf-8').decode(typeBytes);
                
                if (typeStr === 'T') {
                    Object.assign(result, this.parseTextRecord(dataBytes));
                } else if (typeStr === 'U') {
                    Object.assign(result, this.parseURIRecord(dataBytes));
                } else if (typeStr === 'Sp') {
                    Object.assign(result, this.parseSmartPoster(dataBytes));
                }
            } else if (record.tnf === 0x02) {
                Object.assign(result, this.parseMIMERecord({ ...record, type: typeBytes, data: dataBytes }));
            }
        } catch (e) {
            result.parseError = e.message;
        }

        return result;
    }

    static getRecordTypeName(record) {
        if (record.tnf === 0x01) {
            const typeStr = new TextDecoder('utf-8').decode(record.type);
            return this.RTD_TYPES[typeStr] || `RTD: ${typeStr}`;
        }
        return this.TNF_TYPES[record.tnf] || 'Unknown';
    }

    static parseTextRecord(data) {
        const view = new Uint8Array(data);
        const status = view[0];
        const isUTF16 = (status & 0x80) !== 0;
        const langLength = status & 0x3F;
        
        const language = new TextDecoder('utf-8').decode(view.subarray(1, 1 + langLength));
        const textData = view.subarray(1 + langLength);
        const encoding = isUTF16 ? 'utf-16' : 'utf-8';
        const text = new TextDecoder(encoding).decode(textData);

        return {
            recordType: 'Text',
            text: text,
            language: language,
            encoding: encoding,
            content: text
        };
    }

    static parseURIRecord(data) {
        const view = new Uint8Array(data);
        const prefixCode = view[0];
        const prefix = this.URI_PREFIXES[prefixCode] || '';
        const uriData = view.subarray(1);
        const uriSuffix = new TextDecoder('utf-8').decode(uriData);
        const fullUri = prefix + uriSuffix;

        return {
            recordType: 'URI',
            uri: fullUri,
            prefixCode: prefixCode,
            prefix: prefix,
            content: fullUri
        };
    }

    static parseSmartPoster(data) {
        try {
            const records = this.parseNDEFMessage(data);
            const parsedRecords = this.parseRecords(records);
            
            const result = {
                recordType: 'Smart Poster',
                title: '',
                uri: '',
                action: null,
                size: null,
                contentType: null,
                records: parsedRecords,
                content: ''
            };

            for (const rec of parsedRecords) {
                if (rec.recordType === 'Text') {
                    result.title = rec.text;
                } else if (rec.recordType === 'URI') {
                    result.uri = rec.uri;
                } else if (rec.type === 'act') {
                    result.action = this.parseAction(rec.rawPayload);
                } else if (rec.type === 's') {
                    result.size = this.parseSize(rec.rawPayload);
                } else if (rec.type === 't') {
                    result.contentType = new TextDecoder('utf-8').decode(rec.rawPayload);
                }
            }

            result.content = result.uri || result.title || 'Smart Poster';

            return result;
        } catch (e) {
            return {
                recordType: 'Smart Poster',
                content: 'Unable to parse Smart Poster',
                parseError: e.message
            };
        }
    }

    static parseAction(data) {
        const view = new Uint8Array(data);
        const actionCode = view[0];
        const actions = ['Do the action', 'Save for later', 'Open for editing'];
        return {
            code: actionCode,
            name: actions[actionCode] || 'Unknown Action'
        };
    }

    static parseSize(data) {
        const view = new Uint8Array(data);
        let size = 0;
        for (let i = 0; i < view.length; i++) {
            size = (size << 8) | view[i];
        }
        return size;
    }

    static parseMIMERecord(record) {
        const mimeType = new TextDecoder('utf-8').decode(record.type);
        const content = this.bytesToHex(record.data);
        
        return {
            recordType: 'MIME',
            mimeType: mimeType,
            content: content,
            dataLength: record.data.byteLength
        };
    }

    static parseNDEFMessage(data) {
        const records = [];
        let offset = 0;
        const view = new Uint8Array(data);

        while (offset < view.length) {
            const header = view[offset];
            const mb = (header & 0x80) !== 0;
            const me = (header & 0x40) !== 0;
            const ch = (header & 0x20) !== 0;
            const sr = (header & 0x10) !== 0;
            const il = (header & 0x08) !== 0;
            const tnf = header & 0x07;

            offset++;

            const typeLength = view[offset];
            offset++;

            let payloadLength;
            if (sr) {
                payloadLength = view[offset];
                offset++;
            } else {
                payloadLength = (view[offset] << 24) | (view[offset + 1] << 16) | 
                              (view[offset + 2] << 8) | view[offset + 3];
                offset += 4;
            }

            let idLength = 0;
            if (il) {
                idLength = view[offset];
                offset++;
            }

            const type = view.subarray(offset, offset + typeLength);
            offset += typeLength;

            let id = new Uint8Array(0);
            if (il) {
                id = view.subarray(offset, offset + idLength);
                offset += idLength;
            }

            const payload = view.subarray(offset, offset + payloadLength);
            offset += payloadLength;

            records.push({
                tnf: tnf,
                type: type,
                id: id,
                data: payload
            });

            if (me) break;
        }

        return records;
    }

    static createTextRecord(text, language = 'en') {
        const langBytes = new TextEncoder().encode(language.toLowerCase());
        const textBytes = new TextEncoder().encode(text);
        
        if (langBytes.length > 63) {
            throw new Error('Language code too long (max 63 bytes)');
        }

        const payload = new Uint8Array(1 + langBytes.length + textBytes.length);
        payload[0] = langBytes.length & 0x3F;
        payload.set(langBytes, 1);
        payload.set(textBytes, 1 + langBytes.length);

        return {
            tnf: 0x01,
            type: new TextEncoder().encode('T'),
            data: payload
        };
    }

    static createURIRecord(uri) {
        let prefixCode = 0;
        let bestMatchLength = 0;

        for (let i = 1; i < this.URI_PREFIXES.length; i++) {
            const prefix = this.URI_PREFIXES[i];
            if (uri.startsWith(prefix) && prefix.length > bestMatchLength) {
                prefixCode = i;
                bestMatchLength = prefix.length;
            }
        }

        const uriSuffix = uri.substring(bestMatchLength);
        const suffixBytes = new TextEncoder().encode(uriSuffix);
        
        const payload = new Uint8Array(1 + suffixBytes.length);
        payload[0] = prefixCode;
        payload.set(suffixBytes, 1);

        return {
            tnf: 0x01,
            type: new TextEncoder().encode('U'),
            data: payload
        };
    }

    static createEmptyRecord() {
        return {
            tnf: 0x00,
            type: new Uint8Array(0),
            data: new Uint8Array(0)
        };
    }

    static bytesToHex(bytes) {
        return Array.from(new Uint8Array(bytes))
            .map(b => b.toString(16).padStart(2, '0'))
            .join(' ');
    }

    static hexToBytes(hex) {
        const cleanHex = hex.replace(/\s/g, '');
        const bytes = [];
        for (let i = 0; i < cleanHex.length; i += 2) {
            bytes.push(parseInt(cleanHex.substr(i, 2), 16));
        }
        return new Uint8Array(bytes);
    }

    static ENCRYPTED_TYPE = 'enc';
    static ENCRYPTION_VERSION = 0x01;

    static async deriveKey(password, salt) {
        const encoder = new TextEncoder();
        const passwordKey = await crypto.subtle.importKey(
            'raw',
            encoder.encode(password),
            'PBKDF2',
            false,
            ['deriveKey']
        );

        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: 100000,
                hash: 'SHA-256'
            },
            passwordKey,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
        );
    }

    static async encryptData(plaintext, password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(plaintext);

        const salt = crypto.getRandomValues(new Uint8Array(16));
        const iv = crypto.getRandomValues(new Uint8Array(12));

        const key = await this.deriveKey(password, salt);
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: iv },
            key,
            data
        );

        const encryptedBytes = new Uint8Array(encrypted);
        const payload = new Uint8Array(1 + 16 + 12 + encryptedBytes.length);
        
        payload[0] = this.ENCRYPTION_VERSION;
        payload.set(salt, 1);
        payload.set(iv, 17);
        payload.set(encryptedBytes, 29);

        return payload;
    }

    static async decryptData(encryptedData, password) {
        const view = new Uint8Array(encryptedData);
        
        if (view[0] !== this.ENCRYPTION_VERSION) {
            throw new Error('不支持的加密版本');
        }

        const salt = view.subarray(1, 17);
        const iv = view.subarray(17, 29);
        const ciphertext = view.subarray(29);

        const key = await this.deriveKey(password, salt);

        try {
            const decrypted = await crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: iv },
                key,
                ciphertext
            );

            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (e) {
            throw new Error('解密失败，请检查密钥是否正确');
        }
    }

    static createEncryptedRecord(encryptedData) {
        return {
            tnf: 0x04,
            type: new TextEncoder().encode(this.ENCRYPTED_TYPE),
            data: encryptedData
        };
    }

    static isEncryptedRecord(record) {
        if (record.tnf !== 0x04) return false;
        
        const typeBytes = this.normalizeBytes(record.type);
        const typeStr = new TextDecoder('utf-8').decode(typeBytes);
        return typeStr === this.ENCRYPTED_TYPE;
    }

    static parseEncryptedRecord(record) {
        const dataBytes = this.normalizeBytes(record.data);
        return {
            recordType: 'Encrypted',
            encryptedData: dataBytes,
            version: dataBytes[0],
            content: '[已加密 - 需要密钥解密]'
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NDEFParser;
}