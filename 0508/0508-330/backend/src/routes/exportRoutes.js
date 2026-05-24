const express = require('express');
const router = express.Router();
const Reference = require('../models/Reference');
const exportService = require('../services/exportService');

router.post('/ris', async (req, res) => {
  try {
    const { referenceIds } = req.body;
    
    if (!referenceIds || referenceIds.length === 0) {
      return res.status(400).json({ error: 'No reference IDs provided' });
    }

    const references = await Reference.find({ _id: { $in: referenceIds } });
    
    if (references.length === 0) {
      return res.status(404).json({ error: 'No references found' });
    }

    const risContent = exportService.toRIS(references);
    
    res.setHeader('Content-Type', 'application/x-research-info-systems');
    res.setHeader('Content-Disposition', 'attachment; filename=references.ris');
    res.send(risContent);
  } catch (error) {
    console.error('RIS export error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/endnote', async (req, res) => {
  try {
    const { referenceIds } = req.body;
    
    if (!referenceIds || referenceIds.length === 0) {
      return res.status(400).json({ error: 'No reference IDs provided' });
    }

    const references = await Reference.find({ _id: { $in: referenceIds } });
    
    if (references.length === 0) {
      return res.status(404).json({ error: 'No references found' });
    }

    const xmlContent = exportService.toEndNoteXML(references);
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', 'attachment; filename=references.xml');
    res.send(xmlContent);
  } catch (error) {
    console.error('EndNote export error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/bibtex', async (req, res) => {
  try {
    const { referenceIds } = req.body;
    
    if (!referenceIds || referenceIds.length === 0) {
      return res.status(400).json({ error: 'No reference IDs provided' });
    }

    const references = await Reference.find({ _id: { $in: referenceIds } });
    
    if (references.length === 0) {
      return res.status(404).json({ error: 'No references found' });
    }

    const bibtexContent = exportService.toBibTeX(references);
    
    res.setHeader('Content-Type', 'application/x-bibtex');
    res.setHeader('Content-Disposition', 'attachment; filename=references.bib');
    res.send(bibtexContent);
  } catch (error) {
    console.error('BibTeX export error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;