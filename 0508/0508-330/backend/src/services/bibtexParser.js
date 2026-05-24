const bibtexParse = require('bibtex-parse-js');

class BibTeXParser {
  constructor() {
    this.latexAccents = this.initLatexAccents();
    this.namePatterns = this.initNamePatterns();
    this.namePrefixes = this.initNamePrefixes();
    this.nameSuffixes = this.initNameSuffixes();
  }

  initLatexAccents() {
    return {
      '{\\"a}': 'ä', '{\\"A}': 'Ä',
      '{\\"e}': 'ë', '{\\"E}': 'Ë',
      '{\\"i}': 'ï', '{\\"I}': 'Ï',
      '{\\"o}': 'ö', '{\\"O}': 'Ö',
      '{\\"u}': 'ü', '{\\"U}': 'Ü',
      '{\\"y}': 'ÿ', '{\\"Y}': 'Ÿ',
      "{\\'a}": 'á', "{\\'A}": 'Á',
      "{\\'e}": 'é', "{\\'E}": 'É',
      "{\\'i}": 'í', "{\\'I}": 'Í',
      "{\\'o}": 'ó', "{\\'O}": 'Ó',
      "{\\'u}": 'ú', "{\\'U}": 'Ú',
      "{\\'y}": 'ý', "{\\'Y}": 'Ý',
      '{\\`a}': 'à', '{\\`A}': 'À',
      '{\\`e}': 'è', '{\\`E}': 'È',
      '{\\`i}': 'ì', '{\\`I}': 'Ì',
      '{\\`o}': 'ò', '{\\`O}': 'Ò',
      '{\\`u}': 'ù', '{\\`U}': 'Ù',
      '{\\^a}': 'â', '{\\^A}': 'Â',
      '{\\^e}': 'ê', '{\\^E}': 'Ê',
      '{\\^i}': 'î', '{\\^I}': 'Î',
      '{\\^o}': 'ô', '{\\^O}': 'Ô',
      '{\\^u}': 'û', '{\\^U}': 'Û',
      '{\\~a}': 'ã', '{\\~A}': 'Ã',
      '{\\~n}': 'ñ', '{\\~N}': 'Ñ',
      '{\\~o}': 'õ', '{\\~O}': 'Õ',
      '{\\c c}': 'ç', '{\\c C}': 'Ç',
      '{\\cc}': 'ç', '{\\cC}': 'Ç',
      '{\\ae}': 'æ', '{\\AE}': 'Æ',
      '{\\oe}': 'œ', '{\\OE}': 'Œ',
      '{\\aa}': 'å', '{\\AA}': 'Å',
      '{\\o}': 'ø', '{\\O}': 'Ø',
      '{\\l}': 'ł', '{\\L}': 'Ł',
      '{\\ss}': 'ß',
      '\\"a': 'ä', '\\"A': 'Ä',
      '\\"e': 'ë', '\\"E': 'Ë',
      '\\"i': 'ï', '\\"I': 'Ï',
      '\\"o': 'ö', '\\"O': 'Ö',
      '\\"u': 'ü', '\\"U': 'Ü',
      "\\'a": 'á', "\\'A": 'Á',
      "\\'e": 'é', "\\'E": 'É',
      "\\'i": 'í', "\\'I": 'Í',
      "\\'o": 'ó', "\\'O": 'Ó',
      "\\'u": 'ú', "\\'U": 'Ú',
      '\\`a': 'à', '\\`A': 'À',
      '\\`e': 'è', '\\`E': 'È',
      '\\`i': 'ì', '\\`I': 'Ì',
      '\\`o': 'ò', '\\`O': 'Ò',
      '\\`u': 'ù', '\\`U': 'Ù',
      '\\^a': 'â', '\\^A': 'Â',
      '\\^e': 'ê', '\\^E': 'Ê',
      '\\^i': 'î', '\\^I': 'Î',
      '\\^o': 'ô', '\\^O': 'Ô',
      '\\^u': 'û', '\\^U': 'Û',
      '\\~a': 'ã', '\\~A': 'Ã',
      '\\~n': 'ñ', '\\~N': 'Ñ',
      '\\~o': 'õ', '\\~O': 'Õ',
      '\\c c': 'ç', '\\c C': 'Ç',
      '\\cc': 'ç', '\\cC': 'Ç',
      '\\ae': 'æ', '\\AE': 'Æ',
      '\\oe': 'œ', '\\OE': 'Œ',
      '\\aa': 'å', '\\AA': 'Å',
      '\\o': 'ø', '\\O': 'Ø',
      '\\l': 'ł', '\\L': 'Ł',
      '\\ss': 'ß',
    };
  }

  initNamePatterns() {
    return {
      cjk: /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\uFF00-\uFFEF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]/,
      korean: /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/,
      japanese: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/,
      chinese: /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF]/,
      commaSeparated: /^([^,]+),\s*(.+)$/,
      initials: /^([A-Z]\.)\s+(.+)$/,
      hyphenated: /-/,
    };
  }

  initNamePrefixes() {
    return new Set([
      'van', 'von', 'der', 'den', 'van der', 'van den',
      'de', 'la', 'del', 'de la', 'de los', 'de las',
      'di', 'da', 'dal', 'della', 'dello',
      'du', 'des', 'le', 'la',
      'al', 'el', 'ibn', 'bin', 'bint',
      'ter', 'ten', 'te', 'thor', 'thoe',
      'vander', 'vonden', 'vanden',
    ]);
  }

  initNameSuffixes() {
    return new Set([
      'Jr', 'Jr.', 'Junior',
      'Sr', 'Sr.', 'Senior',
      'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
      'PhD', 'Ph.D.', 'MD', 'M.D.', 'DDS', 'D.D.S.',
      'Esq', 'Esq.', 'Esquire',
    ]);
  }

  detectNameType(name) {
    const cleaned = name.replace(/[{}]/g, '').trim();
    
    if (this.namePatterns.cjk.test(cleaned)) {
      if (this.namePatterns.korean.test(cleaned)) return 'korean';
      if (this.namePatterns.japanese.test(cleaned)) return 'japanese';
      if (this.namePatterns.chinese.test(cleaned)) return 'chinese';
      return 'cjk';
    }
    
    if (this.namePatterns.commaSeparated.test(cleaned)) return 'comma-separated';
    return 'western';
  }

  parseCJKName(name) {
    const cleaned = name.replace(/[{}]/g, '').trim();
    const normalized = cleaned.normalize('NFC');
    
    if (normalized.length >= 2) {
      return {
        family: normalized.charAt(0),
        given: normalized.slice(1)
      };
    }
    
    return { family: normalized, given: '' };
  }

  parseWesternName(name) {
    let cleaned = name.replace(/[{}]/g, '').trim();
    let suffix = '';
    let prefix = '';
    
    const suffixMatch = cleaned.match(/,\s*((?:Jr|Sr|I{1,3}|IV|V|VI|VII|VIII|IX|X|Ph\.?D|M\.?D)\.?)$/i);
    if (suffixMatch) {
      suffix = suffixMatch[1];
      cleaned = cleaned.slice(0, -suffixMatch[0].length).trim();
    }
    
    const commaMatch = cleaned.match(this.namePatterns.commaSeparated);
    if (commaMatch) {
      let [, family, given] = commaMatch;
      family = this.cleanValue(family);
      given = this.cleanValue(given);
      
      return {
        family: family + (suffix ? ` ${suffix}` : ''),
        given: given
      };
    }
    
    const parts = cleaned.split(/\s+/);
    let familyParts = [];
    let givenParts = [];
    let foundFamilyStart = false;
    
    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      const lowerPart = part.toLowerCase();
      
      if (!foundFamilyStart) {
        if (this.nameSuffixes.has(part)) {
          suffix = part;
          continue;
        }
        familyParts.unshift(part);
        foundFamilyStart = true;
      } else {
        const testPrefix = [...givenParts, part].reverse().join(' ').toLowerCase();
        if (this.namePrefixes.has(lowerPart) || this.namePrefixes.has(testPrefix)) {
          familyParts.unshift(part);
        } else {
          givenParts.unshift(part);
        }
      }
    }
    
    if (familyParts.length === 0 && givenParts.length > 0) {
      familyParts.push(givenParts.pop());
    }
    
    if (familyParts.length > 0 && givenParts.length === 0) {
      givenParts.push(familyParts.shift());
    }
    
    return {
      family: familyParts.join(' ') + (suffix ? ` ${suffix}` : ''),
      given: givenParts.join(' ')
    };
  }

  parse(content) {
    try {
      const entries = bibtexParse.toJSON(content);
      return entries.map(entry => this.convertEntry(entry));
    } catch (error) {
      throw new Error(`Failed to parse BibTeX: ${error.message}`);
    }
  }

  convertEntry(entry) {
    const entryType = entry.entryType?.toLowerCase() || 'misc';
    const citationKey = entry.citationKey || this.generateCitationKey(entry);
    
    const reference = {
      type: this.normalizeType(entryType),
      citationKey: citationKey,
      title: this.cleanValue(entry.entryTags?.title),
      author: this.parseNames(entry.entryTags?.author),
      editor: this.parseNames(entry.entryTags?.editor),
      journal: this.cleanValue(entry.entryTags?.journal),
      booktitle: this.cleanValue(entry.entryTags?.booktitle),
      publisher: this.cleanValue(entry.entryTags?.publisher),
      year: parseInt(entry.entryTags?.year) || null,
      volume: this.cleanValue(entry.entryTags?.volume),
      number: this.cleanValue(entry.entryTags?.number),
      pages: this.cleanValue(entry.entryTags?.pages),
      doi: this.cleanValue(entry.entryTags?.doi),
      issn: this.cleanValue(entry.entryTags?.issn),
      isbn: this.cleanValue(entry.entryTags?.isbn),
      url: this.cleanValue(entry.entryTags?.url),
      abstract: this.cleanValue(entry.entryTags?.abstract),
      keywords: this.parseKeywords(entry.entryTags?.keywords),
      note: this.cleanValue(entry.entryTags?.note),
      address: this.cleanValue(entry.entryTags?.address),
      edition: this.cleanValue(entry.entryTags?.edition),
      series: this.cleanValue(entry.entryTags?.series),
      chapter: this.cleanValue(entry.entryTags?.chapter),
      school: this.cleanValue(entry.entryTags?.school),
      institution: this.cleanValue(entry.entryTags?.institution),
      month: this.cleanValue(entry.entryTags?.month),
      language: this.cleanValue(entry.entryTags?.language)
    };

    return reference;
  }

  parseSingleName(nameStr) {
    if (!nameStr || !nameStr.trim()) return null;
    
    const trimmed = nameStr.trim();
    const decoded = this.decodeLaTeXAccents(trimmed);
    const nameType = this.detectNameType(decoded);
    
    let parsed;
    switch (nameType) {
      case 'chinese':
      case 'japanese':
      case 'korean':
      case 'cjk':
        parsed = this.parseCJKName(decoded);
        break;
      case 'comma-separated':
      case 'western':
      default:
        parsed = this.parseWesternName(decoded);
    }
    
    return {
      ...parsed,
      type: nameType,
      original: trimmed
    };
  }

  parseNames(namesStr) {
    if (!namesStr) return [];
    
    const names = namesStr.split(/\s+(?:and|&)\s+/i);
    const parsedNames = [];
    
    for (const name of names) {
      const parsed = this.parseSingleName(name);
      if (parsed && parsed.family) {
        parsedNames.push(parsed);
      }
    }
    
    return parsedNames;
  }

  formatNameForDisplay(name, style = 'western') {
    if (!name || !name.family) return '';
    
    const { family, given, type } = name;
    
    if (type === 'chinese' || type === 'japanese' || type === 'korean' || type === 'cjk') {
      return family + (given || '');
    }
    
    if (!given) return family;
    
    const initials = given.split(/\s+/).map(g => g.charAt(0) + '.').join(' ');
    
    switch (style.toLowerCase()) {
      case 'apa':
      case 'acm':
      case 'chicago':
        return `${family}, ${initials}`;
      case 'ieee':
      case 'nature':
        return `${initials} ${family}`;
      default:
        return `${family}, ${initials}`;
    }
  }

  parseKeywords(keywordsStr) {
    if (!keywordsStr) return [];
    return keywordsStr.split(/[,;]/).map(k => k.trim()).filter(k => k);
  }

  decodeLaTeXAccents(value) {
    if (!value) return '';
    
    let result = value;
    
    const accentPatterns = [
      /\{[\"\'\`\^\~\=]\\?\s*([a-zA-Z])\}/g,
      /\{\\[c](?:\s+)?([a-zA-Z])\}/g,
      /[\"\'\`\^\~\=]([a-zA-Z])/g,
      /\\([a-zA-Z]{2})/g,
    ];
    
    for (const [latex, unicode] of Object.entries(this.latexAccents)) {
      result = result.split(latex).join(unicode);
    }
    
    result = result.replace(/\{\\\"([a-zA-Z])\}/g, (match, char) => {
      const map = {a:'ä', A:'Ä', e:'ë', E:'Ë', i:'ï', I:'Ï', o:'ö', O:'Ö', u:'ü', U:'Ü', y:'ÿ', Y:'Ÿ'};
      return map[char] || match;
    });
    
    result = result.replace(/\{\\\'([a-zA-Z])\}/g, (match, char) => {
      const map = {a:'á', A:'Á', e:'é', E:'É', i:'í', I:'Í', o:'ó', O:'Ó', u:'ú', U:'Ú', y:'ý', Y:'Ý'};
      return map[char] || match;
    });
    
    result = result.replace(/\{\\\`([a-zA-Z])\}/g, (match, char) => {
      const map = {a:'à', A:'À', e:'è', E:'È', i:'ì', I:'Ì', o:'ò', O:'Ò', u:'ù', U:'Ù'};
      return map[char] || match;
    });
    
    result = result.replace(/\{\\\^([a-zA-Z])\}/g, (match, char) => {
      const map = {a:'â', A:'Â', e:'ê', E:'Ê', i:'î', I:'Î', o:'ô', O:'Ô', u:'û', U:'Û'};
      return map[char] || match;
    });
    
    result = result.replace(/\{\\\~([a-zA-Z])\}/g, (match, char) => {
      const map = {a:'ã', A:'Ã', n:'ñ', N:'Ñ', o:'õ', O:'Õ'};
      return map[char] || match;
    });
    
    result = result.replace(/\{\\c(?:\s+)?([cC])\}/g, (match, char) => {
      return char === 'c' ? 'ç' : 'Ç';
    });
    
    result = result.replace(/\\\"([a-zA-Z])/g, (match, char) => {
      const map = {a:'ä', A:'Ä', e:'ë', E:'Ë', i:'ï', I:'Ï', o:'ö', O:'Ö', u:'ü', U:'Ü'};
      return map[char] || match;
    });
    
    result = result.replace(/\\\'([a-zA-Z])/g, (match, char) => {
      const map = {a:'á', A:'Á', e:'é', E:'É', i:'í', I:'Í', o:'ó', O:'Ó', u:'ú', U:'Ú'};
      return map[char] || match;
    });
    
    result = result.replace(/\\\`([a-zA-Z])/g, (match, char) => {
      const map = {a:'à', A:'À', e:'è', E:'È', i:'ì', I:'Ì', o:'ò', O:'Ò', u:'ù', U:'Ù'};
      return map[char] || match;
    });
    
    result = result.replace(/\\\^([a-zA-Z])/g, (match, char) => {
      const map = {a:'â', A:'Â', e:'ê', E:'Ê', i:'î', I:'Î', o:'ô', O:'Ô', u:'û', U:'Û'};
      return map[char] || match;
    });
    
    result = result.replace(/\\\~([a-zA-Z])/g, (match, char) => {
      const map = {a:'ã', A:'Ã', n:'ñ', N:'Ñ', o:'õ', O:'Õ'};
      return map[char] || match;
    });
    
    return result;
  }

  cleanValue(value) {
    if (!value) return '';
    let result = this.decodeLaTeXAccents(value);
    result = result.replace(/[{}]/g, '');
    return result.trim();
  }

  normalizeType(type) {
    const typeMap = {
      'article': 'article',
      'book': 'book',
      'booklet': 'misc',
      'conference': 'inproceedings',
      'inbook': 'incollection',
      'incollection': 'incollection',
      'inproceedings': 'inproceedings',
      'manual': 'misc',
      'mastersthesis': 'mastersthesis',
      'misc': 'misc',
      'phdthesis': 'phdthesis',
      'proceedings': 'inproceedings',
      'techreport': 'techreport',
      'unpublished': 'unpublished'
    };
    return typeMap[type] || 'misc';
  }

  generateCitationKey(entry) {
    const author = entry.entryTags?.author || '';
    const year = entry.entryTags?.year || '';
    const title = entry.entryTags?.title || '';
    
    const firstAuthor = author.split(/\s+and\s+/i)[0]?.split(',')[0]?.trim() || 'unknown';
    const firstWord = title.split(/\s+/)[0]?.toLowerCase() || '';
    
    return `${firstAuthor.toLowerCase()}${year}${firstWord}`.replace(/[^a-z0-9]/g, '');
  }

  toBibTeX(reference) {
    let bibtex = `@${reference.type}{${reference.citationKey},\n`;
    
    const fields = [];
    
    if (reference.title) fields.push(`  title = {${reference.title}}`);
    if (reference.author && reference.author.length > 0) {
      const authorStr = reference.author.map(a => `${a.family}, ${a.given}`).join(' and ');
      fields.push(`  author = {${authorStr}}`);
    }
    if (reference.journal) fields.push(`  journal = {${reference.journal}}`);
    if (reference.booktitle) fields.push(`  booktitle = {${reference.booktitle}}`);
    if (reference.publisher) fields.push(`  publisher = {${reference.publisher}}`);
    if (reference.year) fields.push(`  year = {${reference.year}}`);
    if (reference.volume) fields.push(`  volume = {${reference.volume}}`);
    if (reference.number) fields.push(`  number = {${reference.number}}`);
    if (reference.pages) fields.push(`  pages = {${reference.pages}}`);
    if (reference.doi) fields.push(`  doi = {${reference.doi}}`);
    if (reference.url) fields.push(`  url = {${reference.url}}`);
    if (reference.abstract) fields.push(`  abstract = {${reference.abstract}}`);
    
    bibtex += fields.join(',\n');
    bibtex += '\n}';
    
    return bibtex;
  }
}

module.exports = new BibTeXParser();