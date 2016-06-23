import 'core-js';
import './modelJHS';
import './modelEDU';
import './modelOILI';

import { loader } from './exampleLoader';

loader.result(() => {
  console.log('=========== Result ==========');
  console.log('All OK!');
  console.log('=============================');
}, err => {
  console.log('=========== Result ==========');
  console.log('Failed!');
  console.log(err);
  console.log(err.error.stack);
  console.log('=============================');
});
