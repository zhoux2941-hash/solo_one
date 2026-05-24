const citeproc = require('citeproc');

class CitationFormatter {
  constructor() {
    this.styles = {};
    this.styleCache = new Map();
    this.engineCache = new Map();
    this.locale = this.getLocale();
    this.isPreloading = false;
    this.preloadPromise = null;
    this.initStylesAsync();
  }

  async initStylesAsync() {
    try {
      this.styles = await this.loadStylesAsync();
      this.preloadPromise = this.preloadStyles();
      await this.preloadPromise;
    } catch (error) {
      console.error('Failed to initialize styles:', error);
      this.styles = this.loadStylesSync();
    }
  }

  loadStylesSync() {
    return {
      'acm': this.getACMStyle(),
      'ieee': this.getIEEEStyle(),
      'nature': this.getNatureStyle(),
      'apa': this.getAPAStyle(),
      'chicago': this.getChicagoStyle()
    };
  }

  async loadStylesAsync() {
    return new Promise((resolve) => {
      setImmediate(() => {
        resolve(this.loadStylesSync());
      });
    });
  }

  async preloadStyles() {
    if (this.isPreloading) return;
    this.isPreloading = true;
    
    const styleKeys = Object.keys(this.styles);
    
    for (const key of styleKeys) {
      try {
        await this.preloadStyle(key);
      } catch (error) {
        console.warn(`Failed to preload style ${key}:`, error);
      }
    }
    
    this.isPreloading = false;
  }

  async preloadStyle(styleName) {
    const styleKey = styleName.toLowerCase();
    
    if (this.styleCache.has(styleKey)) {
      return this.styleCache.get(styleKey);
    }
    
    return new Promise((resolve) => {
      setImmediate(() => {
        const styleXml = this.styles[styleKey];
        if (styleXml) {
          this.styleCache.set(styleKey, styleXml);
          resolve(styleXml);
        } else {
          resolve(null);
        }
      });
    });
  }

  async getStyleAsync(styleName) {
    const styleKey = styleName.toLowerCase();
    
    if (this.styleCache.has(styleKey)) {
      return this.styleCache.get(styleKey);
    }
    
    if (this.preloadPromise) {
      await this.preloadPromise;
      if (this.styleCache.has(styleKey)) {
        return this.styleCache.get(styleKey);
      }
    }
    
    const styleXml = this.styles[styleKey] || this.styles['acm'];
    this.styleCache.set(styleKey, styleXml);
    return styleXml;
  }

  async getEngineAsync(styleName, cslItems) {
    const cacheKey = `${styleName}_${Object.keys(cslItems).length}`;
    
    if (this.engineCache.has(cacheKey)) {
      return this.engineCache.get(cacheKey);
    }
    
    const styleXml = await this.getStyleAsync(styleName);
    
    const sys = {
      retrieveLocale: () => this.locale,
      retrieveItem: (id) => cslItems[id]
    };
    
    return new Promise((resolve) => {
      setImmediate(() => {
        const engine = new citeproc.Engine(sys, styleXml);
        this.engineCache.set(cacheKey, engine);
        resolve(engine);
      });
    });
  }

  clearCache() {
    this.styleCache.clear();
    this.engineCache.clear();
  }

  loadStyles() {
    return {
      'acm': this.getACMStyle(),
      'ieee': this.getIEEEStyle(),
      'nature': this.getNatureStyle(),
      'apa': this.getAPAStyle(),
      'chicago': this.getChicagoStyle()
    };
  }

  getLocale() {
    return `
<?xml version="1.0" encoding="utf-8"?>
<locale xmlns="http://purl.org/net/xbiblio/csl" version="1.0" xml:lang="en-US">
  <style-options punctuation-in-quote="false"/>
  <date form="text">
    <date-part name="month" suffix=" "/>
    <date-part name="day" suffix=", "/>
    <date-part name="year"/>
  </date>
  <terms>
    <term name="editor" form="short">ed.</term>
    <term name="editors" form="short">eds.</term>
    <term name="editor" form="verb">edited by</term>
    <term name="translator" form="short">trans.</term>
    <term name="translators" form="short">trans.</term>
    <term name="translator" form="verb">translated by</term>
    <term name="editortranslator" form="short">ed. &amp; trans.</term>
    <term name="editortranslators" form="short">ed. &amp; trans.</term>
    <term name="editortranslator" form="verb">edited and translated by</term>
    <term name="volume" form="short">vol.</term>
    <term name="volumes" form="short">vols.</term>
    <term name="number" form="short">no.</term>
    <term name="numbers" form="short">nos.</term>
    <term name="edition" form="short">ed.</term>
    <term name="edition" form="verb">ed.</term>
    <term name="page" form="short">p.</term>
    <term name="pages" form="short">pp.</term>
    <term name="page-range-delimiter">–</term>
    <term name="chapter" form="short">chap.</term>
    <term name="chapters" form="short">chaps.</term>
    <term name="and">and</term>
  </terms>
</locale>
    `;
  }

  getACMStyle() {
    return `<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" demote-non-dropping-particle="display-and-sort">
  <info>
    <title>ACM Reference Format</title>
  </info>
  <locale xml:lang="en">
    <terms>
      <term name="et-al">et al.</term>
    </terms>
  </locale>
  <macro name="author">
    <names variable="author">
      <name name-as-sort-order="all" sort-separator=", " initialize-with=". " delimiter=", " delimiter-precedes-last="always"/>
      <label form="short" prefix=" (" suffix=")"/>
      <et-al term="et al." font-style="italic"/>
    </names>
  </macro>
  <macro name="title">
    <text variable="title"/>
  </macro>
  <macro name="container-title">
    <text variable="container-title" font-style="italic"/>
  </macro>
  <macro name="date">
    <date variable="issued">
      <date-part name="year"/>
    </date>
  </macro>
  <macro name="volume">
    <text variable="volume"/>
  </macro>
  <macro name="issue">
    <text variable="issue" prefix="(" suffix=")"/>
  </macro>
  <macro name="page">
    <text variable="page" prefix=":"/>
  </macro>
  <macro name="publisher">
    <text variable="publisher"/>
  </macro>
  <citation>
    <layout>
      <group delimiter=", ">
        <text macro="author"/>
        <text macro="date"/>
      </group>
    </layout>
  </citation>
  <bibliography>
    <layout>
      <group delimiter=". ">
        <text macro="author"/>
        <text macro="date" prefix="(" suffix=")"/>
        <text macro="title"/>
        <group delimiter="">
          <text macro="container-title"/>
          <text macro="volume"/>
          <text macro="issue"/>
          <text macro="page"/>
        </group>
        <text macro="publisher"/>
      </group>
    </layout>
  </bibliography>
</style>`;
  }

  getIEEEStyle() {
    return `<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" demote-non-dropping-particle="display-and-sort">
  <info>
    <title>IEEE</title>
  </info>
  <citation>
    <layout>
      <text variable="citation-number" prefix="[" suffix="]"/>
    </layout>
  </citation>
  <bibliography>
    <layout>
      <text variable="citation-number" prefix="[" suffix="] "/>
      <group delimiter=", ">
        <names variable="author">
          <name initialize-with=". " delimiter=", " and="text"/>
        </names>
        <text variable="title" font-style="italic" quotes="true"/>
        <text variable="container-title"/>
        <group>
          <text variable="volume" font-weight="bold"/>
          <text variable="issue" prefix="(" suffix=")"/>
          <text variable="page" prefix=":pp. "/>
        </group>
        <date variable="issued">
          <date-part name="year"/>
        </date>
      </group>
    </layout>
  </bibliography>
</style>`;
  }

  getNatureStyle() {
    return `<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" demote-non-dropping-particle="display-and-sort">
  <info>
    <title>Nature</title>
  </info>
  <citation>
    <layout>
      <text variable="citation-number" prefix="[" suffix="]"/>
    </layout>
  </citation>
  <bibliography>
    <layout>
      <text variable="citation-number" suffix=". "/>
      <group delimiter=" ">
        <names variable="author">
          <name initialize-with=". " delimiter=", " and="text"/>
          <et-al term="et al."/>
        </names>
        <text variable="title"/>
        <text variable="container-title" font-style="italic"/>
        <group delimiter=", ">
          <text variable="volume" font-weight="bold"/>
          <text variable="page"/>
        </group>
        <date variable="issued" prefix="(" suffix=")">
          <date-part name="year"/>
        </date>
      </group>
    </layout>
  </bibliography>
</style>`;
  }

  getAPAStyle() {
    return `<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" demote-non-dropping-particle="display-and-sort">
  <info>
    <title>APA 7th Edition</title>
  </info>
  <macro name="author">
    <names variable="author">
      <name name-as-sort-order="all" sort-separator=", " initialize-with=". " delimiter=", " delimiter-precedes-last="always" and="symbol"/>
      <et-al term="et al."/>
    </names>
  </macro>
  <macro name="editor">
    <names variable="editor">
      <name name-as-sort-order="all" sort-separator=", " initialize-with=". " delimiter=", " delimiter-precedes-last="always"/>
      <label form="short" prefix=" (" suffix=")"/>
    </names>
  </macro>
  <citation>
    <layout>
      <group delimiter=", ">
        <text macro="author"/>
        <date variable="issued">
          <date-part name="year"/>
        </date>
      </group>
    </layout>
  </citation>
  <bibliography>
    <layout second-field-align="flush">
      <group delimiter=". ">
        <text macro="author"/>
        <date variable="issued" prefix="(" suffix=")">
          <date-part name="year"/>
        </date>
        <text variable="title"/>
        <group delimiter=", ">
          <text variable="container-title" font-style="italic"/>
          <text variable="volume" font-style="italic"/>
          <text variable="page"/>
        </group>
        <text variable="DOI" prefix="https://doi.org/"/>
      </group>
    </layout>
  </bibliography>
</style>`;
  }

  getChicagoStyle() {
    return `<?xml version="1.0" encoding="utf-8"?>
<style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" demote-non-dropping-particle="display-and-sort">
  <info>
    <title>Chicago Notes and Bibliography</title>
  </info>
  <citation>
    <layout>
      <text variable="citation-number"/>
    </layout>
  </citation>
  <bibliography>
    <layout>
      <group delimiter=". ">
        <names variable="author">
          <name name-as-sort-order="first" sort-separator=", " initialize-with=". " delimiter=", " delimiter-precedes-last="always"/>
        </names>
        <text variable="title" font-style="italic"/>
        <text variable="container-title"/>
        <group delimiter=", ">
          <text variable="volume"/>
          <text variable="issue" prefix="no. "/>
          <text variable="page" prefix=": "/>
        </group>
        <date variable="issued">
          <date-part name="year"/>
        </date>
      </group>
    </layout>
  </bibliography>
</style>`;
  }

  convertToCSLJSON(reference) {
    const cslItem = {
      id: reference._id?.toString() || reference.citationKey,
      type: this.mapType(reference.type),
      title: reference.title,
      issued: reference.year ? { 'date-parts': [[reference.year]] } : undefined,
      DOI: reference.doi,
      ISSN: reference.issn,
      ISBN: reference.isbn,
      URL: reference.url,
      abstract: reference.abstract,
      language: reference.language,
      note: reference.note,
      number: reference.number,
      volume: reference.volume,
      page: reference.pages,
      edition: reference.edition,
      publisher: reference.publisher,
      publisher_place: reference.address,
      'container-title': reference.journal || reference.booktitle,
      'collection-title': reference.series,
      chapter_number: reference.chapter
    };

    if (reference.author && reference.author.length > 0) {
      cslItem.author = reference.author.map(a => {
        const author = { family: a.family || '' };
        if (a.given && a.given.trim()) {
          author.given = a.given;
        }
        return author;
      }).filter(a => a.family);
    }

    if (reference.editor && reference.editor.length > 0) {
      cslItem.editor = reference.editor.map(e => {
        const editor = { family: e.family || '' };
        if (e.given && e.given.trim()) {
          editor.given = e.given;
        }
        return editor;
      }).filter(e => e.family);
    }

    return cslItem;
  }

  mapType(type) {
    const typeMap = {
      'article': 'article-journal',
      'book': 'book',
      'incollection': 'chapter',
      'inproceedings': 'paper-conference',
      'phdthesis': 'thesis',
      'mastersthesis': 'thesis',
      'techreport': 'report',
      'misc': 'document',
      'unpublished': 'manuscript'
    };
    return typeMap[type] || 'document';
  }

  format(references, styleName = 'acm') {
    const referencesArray = Array.isArray(references) ? references : [references];
    const styleXml = this.styles[styleName.toLowerCase()] || this.styles['acm'];
    
    if (!styleXml) {
      return this.fallbackFormat(referencesArray, styleName);
    }
    
    const cslItems = {};
    referencesArray.forEach((ref, index) => {
      const cslItem = this.convertToCSLJSON(ref);
      cslItem.id = index + 1;
      cslItems[index + 1] = cslItem;
    });

    const sys = {
      retrieveLocale: () => this.locale,
      retrieveItem: (id) => cslItems[id]
    };

    try {
      const citeprocEngine = new citeproc.Engine(sys, styleXml);
      citeprocEngine.updateItems(Object.keys(cslItems).map(Number));
      
      const bib = citeprocEngine.makeBibliography();
      return bib[1].map(entry => entry.replace(/<div[^>]*>|<\/div>/g, '').trim());
    } catch (error) {
      console.error('CSL formatting error:', error);
      return this.fallbackFormat(referencesArray, styleName);
    }
  }

  async formatAsync(references, styleName = 'acm') {
    const referencesArray = Array.isArray(references) ? references : [references];
    
    const cslItems = {};
    referencesArray.forEach((ref, index) => {
      const cslItem = this.convertToCSLJSON(ref);
      cslItem.id = index + 1;
      cslItems[index + 1] = cslItem;
    });

    try {
      const citeprocEngine = await this.getEngineAsync(styleName, cslItems);
      citeprocEngine.updateItems(Object.keys(cslItems).map(Number));
      
      const bib = citeprocEngine.makeBibliography();
      return bib[1].map(entry => entry.replace(/<div[^>]*>|<\/div>/g, '').trim());
    } catch (error) {
      console.error('CSL async formatting error:', error);
      return this.fallbackFormat(referencesArray, styleName);
    }
  }

  async previewAsync(reference, styleName = 'acm') {
    return this.formatAsync([reference], styleName);
  }

  isStyleLoaded(styleName) {
    return this.styleCache.has(styleName.toLowerCase());
  }

  getLoadedStyles() {
    return Array.from(this.styleCache.keys());
  }

  async switchStyle(newStyleName) {
    if (!this.isStyleLoaded(newStyleName)) {
      await this.preloadStyle(newStyleName);
    }
    return true;
  }

  fallbackFormat(references, styleName = 'acm') {
    return references.map(ref => {
      const authors = ref.author?.map(a => {
        const initials = a.given?.split(/\s+/).map(g => g.charAt(0) + '.').join(' ') || '';
        return `${a.family}, ${initials}`.trim().replace(/,\s*$/, '');
      }).join(', ') || 'Unknown';
      
      const year = ref.year || 'n.d.';
      const title = ref.title || 'Untitled';
      const container = ref.journal || ref.booktitle || '';
      
      switch(styleName.toLowerCase()) {
        case 'apa':
          return `${authors} (${year}). ${title}. ${container ? `${container}, ` : ''}${ref.volume || ''}${ref.pages ? `, ${ref.pages}` : ''}`;
        case 'ieee':
          return `${authors}, "${title}", ${container}, vol. ${ref.volume || ''}, pp. ${ref.pages || ''}, ${year}.`;
        default:
          return `${authors} (${year}). ${title}. ${container}`;
      }
    });
  }

  getAvailableStyles() {
    return Object.keys(this.styles).map(key => ({
      id: key,
      name: key.charAt(0).toUpperCase() + key.slice(1)
    }));
  }
}

module.exports = new CitationFormatter();