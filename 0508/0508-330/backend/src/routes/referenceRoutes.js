const express = require('express');
const router = express.Router();
const Reference = require('../models/Reference');
const Group = require('../models/Group');
const bibtexParser = require('../services/bibtexParser');
const citationFormatter = require('../services/citationFormatter');
const { upload } = require('../server');

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    let bibtexContent;
    
    if (req.file) {
      bibtexContent = req.file.buffer.toString('utf8');
    } else if (req.body.content) {
      bibtexContent = req.body.content;
    } else {
      return res.status(400).json({ error: 'No file or content provided' });
    }

    const references = bibtexParser.parse(bibtexContent);
    const savedReferences = await Reference.insertMany(references);
    
    res.json({
      success: true,
      count: savedReferences.length,
      references: savedReferences
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const reference = new Reference(req.body);
    await reference.save();
    res.status(201).json(reference);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const { search, tags, groups, page = 1, limit = 50, sort = '-createdAt' } = req.query;
    
    const query = {};
    
    if (search) {
      query.$text = { $search: search };
    }
    
    if (tags) {
      query.tags = { $in: tags.split(',') };
    }
    
    if (groups) {
      query.groups = { $in: groups.split(',') };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const references = await Reference.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('groups');
    
    const total = await Reference.countDocuments(query);
    
    res.json({
      references,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get references error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const reference = await Reference.findById(req.params.id).populate('groups');
    if (!reference) {
      return res.status(404).json({ error: 'Reference not found' });
    }
    res.json(reference);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const reference = await Reference.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    if (!reference) {
      return res.status(404).json({ error: 'Reference not found' });
    }
    res.json(reference);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const reference = await Reference.findByIdAndDelete(req.params.id);
    if (!reference) {
      return res.status(404).json({ error: 'Reference not found' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/batch-delete', async (req, res) => {
  try {
    const { ids } = req.body;
    await Reference.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, count: ids.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/tags', async (req, res) => {
  try {
    const { tags } = req.body;
    const reference = await Reference.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { tags: { $each: tags } }, updatedAt: new Date() },
      { new: true }
    );
    if (!reference) {
      return res.status(404).json({ error: 'Reference not found' });
    }
    res.json(reference);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id/tags/:tag', async (req, res) => {
  try {
    const reference = await Reference.findByIdAndUpdate(
      req.params.id,
      { $pull: { tags: req.params.tag }, updatedAt: new Date() },
      { new: true }
    );
    if (!reference) {
      return res.status(404).json({ error: 'Reference not found' });
    }
    res.json(reference);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/groups', async (req, res) => {
  try {
    const { groupIds } = req.body;
    const reference = await Reference.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { groups: { $each: groupIds } }, updatedAt: new Date() },
      { new: true }
    ).populate('groups');
    if (!reference) {
      return res.status(404).json({ error: 'Reference not found' });
    }
    res.json(reference);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id/groups/:groupId', async (req, res) => {
  try {
    const reference = await Reference.findByIdAndUpdate(
      req.params.id,
      { $pull: { groups: req.params.groupId }, updatedAt: new Date() },
      { new: true }
    ).populate('groups');
    if (!reference) {
      return res.status(404).json({ error: 'Reference not found' });
    }
    res.json(reference);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/stats/summary', async (req, res) => {
  try {
    const total = await Reference.countDocuments();
    const types = await Reference.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    const tags = await Reference.distinct('tags');
    
    res.json({
      total,
      types,
      tagCount: tags.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/tags/all', async (req, res) => {
  try {
    const tags = await Reference.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.json(tags.map(t => ({ name: t._id, count: t.count })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;