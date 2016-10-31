import 'core-js';
import './modelJHS';
import './modelEDU';
import './modelOILI';

import { loader } from './exampleLoader';

loader.result.then(() => {
  console.log('=========== Result ==========');
  console.log('All OK!');
  console.log('=============================');
}, (err: any) => {
  console.log('=========== Result ==========');
  console.log('Failed!');
  console.log(err);
  console.log(err.error.stack);
  console.log('=============================');
});
