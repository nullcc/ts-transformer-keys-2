import { keys } from '../index';
import { X } from './interface';

describe('Test transformer.', () => {
  test('Should get keys of interface 1.', () => {
    interface Foo {
      a: string;
      b?: number;
      c: boolean;
      d: Function;
      e: object;
      f: any;
      g: null;
      h: keyof {};
      i?: number | null;
      j: number[];
      k: string[] | null;
      l: {
        a: string;
        b: number;
      };
      m: Bar;
      n: X;
      o: T;
      p: Bar | Baz;
      q: Bar & Baz;
    }
    interface Bar {
      a: number;
      b: boolean;
      c: Baz;
    }
    interface Baz {
      a: Function;
      b: number;
    }
    type T = {
      a: number[];
      b: string;
    }
    expect(keys<Foo>()).toMatchObject([
      { name: 'a', optional: false, type: 'string' },
      { name: 'b', optional: true, type: 'number' },
      { name: 'c', optional: false, type: 'boolean' },
      { name: 'd', optional: false, type: 'any' },
      { name: 'e', optional: false, type: 'object' },
      { name: 'f', optional: false, type: 'any' },
      { name: 'g', optional: false, type: 'null' },
      { name: 'h', optional: false, type: 'any' },
      { name: 'i', optional: true, type: 'number | null' },
      { name: 'j', optional: false, type: 'number[]' },
      { name: 'k', optional: false, type: 'string[] | null' },
      { name: 'l', optional: false, type: 'any' },
      { name: 'l.a', optional: false, type: 'string' },
      { name: 'l.b', optional: false, type: 'number' },
      { name: 'm', optional: false, type: 'any' },
      { name: 'm.a', optional: false, type: 'number' },
      { name: 'm.b', optional: false, type: 'boolean' },
      { name: 'm.c', optional: false, type: 'any' },
      { name: 'm.c.a', optional: false, type: 'any' },
      { name: 'm.c.b', optional: false, type: 'number' },
      { name: 'n', optional: false, type: 'any' },
      { name: 'o', optional: false, type: 'any' },
      { name: 'o.a', optional: false, type: 'number[]' },
      { name: 'o.b', optional: false, type: 'string' },
      { name: 'p', optional: false, type: 'any' },
      { name: 'q', optional: false, type: 'any' } ]);
  });

  test('Should get keys of interface 2.', () => {
    interface Foo {
      a: string;
      b: number;
      c: boolean;
    }
    interface Bar {
      a: string;
      b: number;
    }
    expect(keys<Foo | Bar>()).toMatchObject([
      { name: 'a', optional: false, type: 'string' },
      { name: 'b', optional: false, type: 'number' }
    ]);
  });

  test('Should get keys of interface 3.', () => {
    interface Foo {
      a: string;
      b: number;
      c: boolean;
    }
    interface Bar {
      a: string;
      b: number;
      d: {
        a: number;
        b?: string;
      }
    }
    expect(keys<Foo & Bar>()).toMatchObject([
      { name: 'a', optional: false, type: 'string' },
      { name: 'b', optional: false, type: 'number' },
      { name: 'c', optional: false, type: 'boolean' },
      { name: 'd', optional: false, type: 'any' },
      { name: 'd.a', optional: false, type: 'number' },
      { name: 'd.b', optional: true, type: 'string' }
    ]);
  });
});
