import {
  arraysAreEqual, findFirstMatching, contains, containsAny, containsAll, any, all, resetWith,
  swapElements, moveElement, remove, flatten, removeMatching
} from './array';

describe('First matching', () => {
  it('first of both matching elements', () => {
    expect(findFirstMatching(['a', 'b', 'c', 'd', 'e', 'f'], ['c', 'f'])).toBe('c');
  });

  it('non matching does not match', () => {
    expect(findFirstMatching(['a', 'b', 'c', 'd', 'e', 'f'], ['x', 'f'])).toBe('f');
  });
});

describe('Arrays are equal', () => {
  it('with same elements should be equal', () => {
    const a1 = [1, 2, 3, 4, 5];
    const a2 = [1, 2, 3, 4, 5];
    expect(arraysAreEqual(a1, a2)).toBe(true);
  });

  it('with some same elements should not be equal', () => {
    const a1 = [1, 2, 3, 4, 5];
    const a2 = [1, 2, 3, 4];
    expect(arraysAreEqual(a1, a2)).toBe(false);
  });
});

describe('Array contains', () => {
  it('when match is found', () => {
    expect(contains(['a', 'b', 'c', 'd', 'e', 'f'], 'c')).toBe(true);
  });

  it('when match is not found', () => {
    expect(contains(['a', 'b', 'c', 'd', 'e', 'f'], 'x')).toBe(false);
  });
});

describe('Array contains any', () => {
  it('when match is found', () => {
    expect(containsAny(['a', 'b', 'c', 'd', 'e', 'f'], ['x', 'y', 'd', 'z'])).toBe(true);
  });

  it('when match is not found', () => {
    expect(containsAny(['a', 'b', 'c', 'd', 'e', 'f'], ['x', 'y', 'z'])).toBe(false);
  });
});

describe('Array contains all', () => {
  it('when all are found', () => {
    expect(containsAll(['a', 'b', 'c', 'd', 'e', 'f'], ['b', 'c', 'd', 'e'])).toBe(true);
  });

  it('when some are not found', () => {
    expect(containsAll(['a', 'b', 'c', 'd', 'e', 'f'], ['b', 'c', 'z'])).toBe(false);
  });
});

describe('Any array item matches predicate', () => {
  it('when match is found', () => {
    expect(any([1, 2, 3, 4, 5, 6], item => item % 2 === 0)).toBe(true);
  });

  it('when match is not found', () => {
    expect(any([1, 3, 5, 7, 9, 11], item => item % 2 === 0)).toBe(false);
  });
});

describe('All array item matches predicate', () => {
  it('when all match', () => {
    expect(all([2, 4, 6, 8, 10, 12], item => item % 2 === 0)).toBe(true);
  });

  it('when one item does not match', () => {
    expect(all([2, 4, 6, 7, 10, 12], item => item % 2 === 0)).toBe(false);
  });
});

describe('Resetting array', () => {
  it('should contain only elements of reset with', () => {
    const a1 = [1, 2, 3, 4, 5];
    const a2 = [5, 6, 7, 8, 9, 10];

    resetWith(a1, a2);
    expect(arraysAreEqual(a1, a2)).toBe(true);
    expect(arraysAreEqual(a1, [5, 6, 7, 8, 9, 10])).toBe(true);
  });
});

describe('Swapping elements in array', () => {
  it('should succeed', () => {
    const a = [1, 2, 3, 4, 5];
    swapElements(a, 0, 4);
    expect([5, 2, 3, 4, 1]).toEqual(a);
  });

  it('out of bounds should throw', () => {
    expect(() => swapElements([1, 2, 3, 4, 5], 0, 5)).toThrowError();
  });
});

describe('Moving element in array', () => {
  it('should succeed', () => {
    const a = [1, 2, 3, 4, 5];
    moveElement(a, 0, 4);
    expect([2, 3, 4, 5, 1]).toEqual(a);
  });

  it('out of bounds should throw', () => {
    expect(() => moveElement([1, 2, 3, 4, 5], 0, 5)).toThrowError();
  });
});

describe('Removing element from array', () => {
  it('should remove only matching item', () => {
    const a = [1, 2, 3, 4, 5];
    remove(a, 3);
    expect([1, 2, 4, 5]).toEqual(a);
  });

  it('should remove all matching items', () => {
    const a = [1, 2, 3, 3, 5, 3];
    remove(a, 3);
    expect([1, 2, 5]).toEqual(a);
  });
});

describe('Removing matching element from array', () => {
  it('should remove only matching item', () => {
    const a = [1, 2, 3, 4, 5];
    removeMatching(a, item => item === 3);
    expect([1, 2, 4, 5]).toEqual(a);
  });

  it('should remove all matching items', () => {
    const a = [1, 2, 3, 3, 5, 3];
    removeMatching(a, item => item === 3);
    expect([1, 2, 5]).toEqual(a);
  });
});

describe('Flattening arrays', () => {
  it('should work', () => {
    const a = [
      [1, 3, 5, 7],
      [2, 4, 6, 8, 10]
    ];
    expect([1, 3, 5, 7, 2, 4, 6, 8, 10]).toEqual(flatten(a));
  });
});
