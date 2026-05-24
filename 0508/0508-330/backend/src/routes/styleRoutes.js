const express = require('express');
const router = express.Router();
const Reference = require('../models/Reference');
const citationFormatter = require('../services/citationFormatter');

router.get('/', (req, res) => {
  try {
    const styles = citationFormatter.getAvailableStyles();
    res.json({
      styles,
      loadedStyles: citationFormatter.getLoadedStyles(),
      isPreloadComplete: !citationFormatter.isPreloading
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/status', (req, res) => {
  try {
    res.json({
      loadedStyles: citationFormatter.getLoadedStyles(),
      isPreloading: citationFormatter.isPreloading,
      allStyles: citationFormatter.getAvailableStyles()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/preload', async (req, res) => {
  try {
    const { styles } = req.body;
    const styleList = styles || Object.keys(citationFormatter.styles);
    
    const preloadPromises = styleList.map(style => 
      citationFormatter.preloadStyle(style)
    );
    
    await Promise.all(preloadPromises);
    
    res.json({
      success: true,
      loadedStyles: citationFormatter.getLoadedStyles(),
      preloaded: styleList
    });
  } catch (error) {
    console.error('Preload error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/switch', async (req, res) => {
  try {
    const { style } = req.body;
    
    if (!style) {
      return res.status(400).json({ error: 'Style name is required' });
    }

    const wasLoaded = citationFormatter.isStyleLoaded(style);
    await citationFormatter.switchStyle(style);
    
    res.json({
      success: true,
      style,
      wasPreloaded: wasLoaded,
      isNowLoaded: citationFormatter.isStyleLoaded(style)
    });
  } catch (error) {
    console.error('Style switch error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/format', async (req, res) => {
  try {
    const { referenceIds, style } = req.body;
    
    if (!referenceIds || referenceIds.length === 0) {
      return res.status(400).json({ error: 'No reference IDs provided' });
    }

    const references = await Reference.find({ _id: { $in: referenceIds } });
    
    if (references.length === 0) {
      return res.status(404).json({ error: 'No references found' });
    }

    const formattedCitations = await citationFormatter.formatAsync(references, style || 'acm');
    
    res.json({
      style: style || 'acm',
      citations: formattedCitations,
      wasStylePreloaded: citationFormatter.isStyleLoaded(style)
    });
  } catch (error) {
    console.error('Format error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/preview', async (req, res) => {
  try {
    const { reference, style } = req.body;
    
    if (!reference) {
      return res.status(400).json({ error: 'No reference data provided' });
    }

    const formattedCitations = await citationFormatter.previewAsync(reference, style || 'acm');
    
    res.json({
      style: style || 'acm',
      citation: formattedCitations[0],
      wasStylePreloaded: citationFormatter.isStyleLoaded(style)
    });
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/cache/clear', (req, res) => {
  try {
    citationFormatter.clearCache();
    res.json({ success: true, message: 'Style cache cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;