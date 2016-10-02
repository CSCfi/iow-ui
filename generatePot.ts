/// <reference types="node" />

import * as fs from 'fs';
const Extractor: any = require('angular-gettext-tools').Extractor;
const file: any = require('file');

const root = 'src/';
const extensions = ['html', 'ts'];
const output = 'po/template.pot';

function isExtractable(f: string) {
  const suffix = f.substr(f.lastIndexOf('.') + 1, f.length);
  return extensions.indexOf(suffix) !== -1;
}

const extractor = new Extractor();

file.walkSync(root, (dirPath: string, _dirs: string[], files: string[]) => {

  for (const f of files) {
    if (isExtractable(f)) {
      const fileName = dirPath + '/' + f;
      extractor.parse(fileName.substr(root.length), fs.readFileSync(fileName, 'utf8'));
    }
  }
});

fs.writeFileSync(output, extractor.toString(), 'utf8');
