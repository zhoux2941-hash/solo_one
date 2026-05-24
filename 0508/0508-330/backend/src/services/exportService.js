const { create } = require('xmlbuilder2');

class ExportService {
  toRIS(references) {
    const refsArray = Array.isArray(references) ? references : [references];
    let risContent = '';

    refsArray.forEach(ref => {
      risContent += this.referenceToRIS(ref) + '\n';
    });

    return risContent;
  }

  referenceToRIS(ref) {
    const lines = [];
    const typeMap = {
      'article': 'JOUR',
      'book': 'BOOK',
      'incollection': 'CHAP',
      'inproceedings': 'CONF',
      'phdthesis': 'THES',
      'mastersthesis': 'THES',
      'techreport': 'RPRT',
      'misc': 'GEN',
      'unpublished': 'UNPB'
    };

    lines.push(`TY  - ${typeMap[ref.type] || 'GEN'}`);

    if (ref.author) {
      ref.author.forEach(a => {
        lines.push(`AU  - ${a.family}, ${a.given}`);
      });
    }

    if (ref.title) {
      lines.push(`TI  - ${ref.title}`);
    }

    if (ref.journal) {
      lines.push(`JO  - ${ref.journal}`);
    }

    if (ref.booktitle) {
      lines.push(`BT  - ${ref.booktitle}`);
    }

    if (ref.publisher) {
      lines.push(`PB  - ${ref.publisher}`);
    }

    if (ref.year) {
      lines.push(`PY  - ${ref.year}`);
    }

    if (ref.volume) {
      lines.push(`VL  - ${ref.volume}`);
    }

    if (ref.number) {
      lines.push(`IS  - ${ref.number}`);
    }

    if (ref.pages) {
      lines.push(`SP  - ${ref.pages.split(/[-–]/)[0]}`);
      const endPage = ref.pages.split(/[-–]/)[1];
      if (endPage) {
        lines.push(`EP  - ${endPage}`);
      }
    }

    if (ref.doi) {
      lines.push(`DO  - ${ref.doi}`);
    }

    if (ref.issn) {
      lines.push(`SN  - ${ref.issn}`);
    }

    if (ref.isbn) {
      lines.push(`SN  - ${ref.isbn}`);
    }

    if (ref.url) {
      lines.push(`UR  - ${ref.url}`);
    }

    if (ref.abstract) {
      lines.push(`AB  - ${ref.abstract}`);
    }

    if (ref.keywords && ref.keywords.length > 0) {
      lines.push(`KW  - ${ref.keywords.join('; ')}`);
    }

    if (ref.note) {
      lines.push(`N1  - ${ref.note}`);
    }

    if (ref.address) {
      lines.push(`CY  - ${ref.address}`);
    }

    if (ref.edition) {
      lines.push(`ET  - ${ref.edition}`);
    }

    if (ref.series) {
      lines.push(`T3  - ${ref.series}`);
    }

    if (ref.chapter) {
      lines.push(`CP  - ${ref.chapter}`);
    }

    if (ref.school) {
      lines.push(`PB  - ${ref.school}`);
    }

    if (ref.institution) {
      lines.push(`PB  - ${ref.institution}`);
    }

    if (ref.language) {
      lines.push(`LA  - ${ref.language}`);
    }

    lines.push('ER  - ');

    return lines.join('\n');
  }

  toEndNoteXML(references) {
    const refsArray = Array.isArray(references) ? references : [references];

    const xml = create({ version: '1.0', encoding: 'UTF-8' })
      .ele('xml')
        .ele('records');

    refsArray.forEach(ref => {
      const record = xml.ele('record');
      
      const refType = this.getEndNoteRefType(ref.type);
      record.ele('ref-type', { name: refType.name }).txt(refType.code);

      if (ref.citationKey) {
        record.ele('label').txt(ref.citationKey);
      }

      const contributors = record.ele('contributors');
      const authors = contributors.ele('authors');
      if (ref.author) {
        ref.author.forEach(a => {
          authors.ele('author').ele('style').txt(`${a.family}, ${a.given}`);
        });
      }

      if (ref.editor && ref.editor.length > 0) {
        const editors = contributors.ele('secondary-authors');
        ref.editor.forEach(e => {
          editors.ele('author').ele('style').txt(`${e.family}, ${e.given}`);
        });
      }

      if (ref.title) {
        record.ele('titles').ele('title').ele('style').txt(ref.title);
      }

      if (ref.journal) {
        record.ele('periodical').ele('full-title').ele('style').txt(ref.journal);
      }

      if (ref.booktitle) {
        record.ele('titles').ele('secondary-title').ele('style').txt(ref.booktitle);
      }

      if (ref.publisher) {
        record.ele('publisher').ele('style').txt(ref.publisher);
      }

      if (ref.year) {
        const dates = record.ele('dates');
        dates.ele('year').ele('style').txt(ref.year.toString());
      }

      if (ref.volume) {
        record.ele('volume').ele('style').txt(ref.volume);
      }

      if (ref.number) {
        record.ele('number').ele('style').txt(ref.number);
      }

      if (ref.pages) {
        record.ele('pages').ele('style').txt(ref.pages);
      }

      if (ref.doi) {
        const electronicData = record.ele('electronic-resource-num');
        electronicData.ele('style').txt(ref.doi);
      }

      if (ref.issn) {
        record.ele('issn').ele('style').txt(ref.issn);
      }

      if (ref.isbn) {
        record.ele('isbn').ele('style').txt(ref.isbn);
      }

      if (ref.url) {
        record.ele('urls').ele('related-urls').ele('url').ele('style').txt(ref.url);
      }

      if (ref.abstract) {
        record.ele('abstract').ele('style').txt(ref.abstract);
      }

      if (ref.keywords && ref.keywords.length > 0) {
        const keywords = record.ele('keywords');
        ref.keywords.forEach(kw => {
          keywords.ele('keyword').ele('style').txt(kw);
        });
      }

      if (ref.notes) {
        record.ele('notes').ele('style').txt(ref.notes);
      }

      if (ref.address) {
        record.ele('pub-location').ele('style').txt(ref.address);
      }

      if (ref.edition) {
        record.ele('edition').ele('style').txt(ref.edition);
      }

      if (ref.language) {
        record.ele('language').ele('style').txt(ref.language);
      }
    });

    return xml.end({ prettyPrint: true });
  }

  getEndNoteRefType(type) {
    const typeMap = {
      'article': { code: '17', name: 'Journal Article' },
      'book': { code: '6', name: 'Book' },
      'incollection': { code: '7', name: 'Book Section' },
      'inproceedings': { code: '10', name: 'Conference Proceedings' },
      'phdthesis': { code: '35', name: 'Thesis' },
      'mastersthesis': { code: '35', name: 'Thesis' },
      'techreport': { code: '13', name: 'Report' },
      'misc': { code: '12', name: 'Generic' },
      'unpublished': { code: '18', name: 'Unpublished Work' }
    };
    return typeMap[type] || { code: '12', name: 'Generic' };
  }

  toBibTeX(references) {
    const bibtexParser = require('./bibtexParser');
    const refsArray = Array.isArray(references) ? references : [references];
    return refsArray.map(ref => bibtexParser.toBibTeX(ref)).join('\n\n');
  }
}

module.exports = new ExportService();