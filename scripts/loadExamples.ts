import 'core-js';
import '../examples/modelJHS';
import '../examples/modelEDU';
import '../examples/modelOILI';

import { loader } from '../examples/exampleLoader';

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
