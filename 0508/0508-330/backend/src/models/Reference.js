const mongoose = require('mongoose');

const referenceSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['article', 'book', 'incollection', 'inproceedings', 'phdthesis', 'mastersthesis', 'techreport', 'misc', 'unpublished']
  },
  citationKey: { type: String, required: true, index: true },
  title: { type: String, required: true, index: true },
  author: [{
    family: String,
    given: String
  }],
  editor: [{
    family: String,
    given: String
  }],
  journal: String,
  booktitle: String,
  publisher: String,
  year: Number,
  volume: String,
  number: String,
  pages: String,
  doi: String,
  issn: String,
  isbn: String,
  url: String,
  abstract: String,
  keywords: [String],
  tags: [{ type: String, index: true }],
  groups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group', index: true }],
  note: String,
  address: String,
  edition: String,
  series: String,
  chapter: String,
  school: String,
  institution: String,
  month: String,
  language: String,
  createdAt: { type: Date, default: Date.now, index: true },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

referenceSchema.index({ title: 'text', 'author.family': 'text', abstract: 'text', journal: 'text', keywords: 'text' });

module.exports = mongoose.model('Reference', referenceSchema);