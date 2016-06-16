import { arraysAreEqual } from './array';

describe('ArrayUtil', () => {
  it('should be equal', () => {
    const a1 = [1, 2, 3, 4, 5];
    const a2 = [1, 2, 3, 4, 5];
    expect(true).toEqual(arraysAreEqual(a1, a2));
  });
});
