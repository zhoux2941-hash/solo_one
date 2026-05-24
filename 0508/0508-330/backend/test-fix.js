const bibtexParser = require('./src/services/bibtexParser');
const citationFormatter = require('./src/services/citationFormatter');

console.log('=== Testing BibTeX Special Characters ===\n');

const testBibTeX = `@article{test2024,
  title = {A Study on {\\\"a}ccents and {\\c c}haracters},
  author = {M{\\"u}ller, John and {\c C}elik, Ahmet and {\\'E}loi, Marie},
  journal = {Journal of {\\\"U}nicode Studies},
  year = {2024},
  volume = {10},
  pages = {100-120}
}`;

console.log('Input BibTeX:');
console.log(testBibTeX);
console.log('\nParsed result:');

const parsed = bibtexParser.parse(testBibTeX);
console.log(JSON.stringify(parsed, null, 2));

console.log('\n\n=== Testing APA Author Formatting ===\n');

const testReference = {
  _id: 'test123',
  type: 'article',
  citationKey: 'doe2024',
  title: 'Test Article',
  author: [
    { family: 'Doe', given: 'John' },
    { family: 'Smith', given: 'Jane Alice' },
    { family: 'Brown', given: 'Robert' }
  ],
  journal: 'Test Journal',
  year: 2024,
  volume: '5',
  pages: '1-10'
};

console.log('Reference:');
console.log('Author:', JSON.stringify(testReference.author, null, 2));

console.log('\nAPA Format:');
const apaResult = citationFormatter.format([testReference], 'apa');
console.log(apaResult);

console.log('\nACM Format:');
const acmResult = citationFormatter.format([testReference], 'acm');
console.log(acmResult);

console.log('\nIEEE Format:');
const ieeeResult = citationFormatter.format([testReference], 'ieee');
console.log(ieeeResult);

console.log('\nNature Format:');
const natureResult = citationFormatter.format([testReference], 'nature');
console.log(natureResult);

console.log('\nChicago Format:');
const chicagoResult = citationFormatter.format([testReference], 'chicago');
console.log(chicagoResult);
