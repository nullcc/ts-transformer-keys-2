import { keys } from '../index';
import { X } from './interface';

describe('Test transformer.', () => {
  test('Should get keys of interface 1.', () => {
    interface Foo {
      a: string;
      b: number;
      c: boolean;
    }
    expect(keys<Foo>()).toMatchObject(['a', 'b', 'c']);
  });

  test('Should get keys of interface 2.', () => {
    interface Foo {
      a: string;
      b: number;
      c: Bar;
    }
    interface Bar {
      a: string;
      b: number;
    }
    expect(keys<Foo>()).toMatchObject(['a', 'b', 'c', 'c.a', 'c.b']);
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
    }
    expect(keys<Foo & Bar>()).toMatchObject(['a', 'b', 'c']);
  });

  test('Should get keys of interface 4.', () => {
    interface Foo {
      a: string;
      b: number;
      c: boolean;
    }
    interface Bar {
      a: string;
      b: number;
    }
    expect(keys<Foo | Bar>()).toMatchObject(['a', 'b']);
  });

  test('Should get keys of interface 5.', () => {
    interface Foo {
      a: string;
      b: number;
      c: boolean;
      d: any;
      e: Bar;
    }
    interface Bar {
      a: string;
      b: number;
      c: Baz;
    }
    interface Baz {
      a: string;
      b: number;
    }
    expect(keys<Foo>()).toMatchObject(['a', 'b', 'c', 'd', 'e', 'e.a', 'e.b', 'e.c', 'e.c.a', 'e.c.b']);
  });

  test('Should get keys of interface 6.', () => {
    expect(keys<X>()).toMatchObject(['a', 'b', 'c', 'c.a', 'c.b', 'c.c', 'c.c.a', 'c.c.b', 'c.c.c']);
  });

  test('Should get keys of interface 7.', () => {
    type Foo = {
      a: string;
      b: number;
      c: boolean;
    }
    expect(keys<Foo>()).toMatchObject(['a', 'b', 'c']);
  });

  test('Should get keys of interface 8.', () => {
    type Foo = {
      a: string;
      b: number;
      c: Bar;
    }
    type Bar = {
      d: string;
      e: number;
      f: boolean;
    }
    expect(keys<Foo>()).toMatchObject(['a', 'b', 'c', 'c.d', 'c.e', 'c.f']);
  });

  test('Should get keys of interface 9.', () => {
    interface Foo {
      a: string;
      b: number;
      c: Bar;
    }
    type Bar = {
      d: string;
      e: number;
      f: boolean;
    }
    expect(keys<Foo>()).toMatchObject(['a', 'b', 'c', 'c.d', 'c.e', 'c.f']);
  });

  test('Should get keys of interface 10.', () => {
    type Foo = {
      a: string;
      b: number;
      c: Bar;
    }
    interface Bar {
      d: string;
      e: number;
      f: boolean;
    }
    expect(keys<Foo>()).toMatchObject(['a', 'b', 'c', 'c.d', 'c.e', 'c.f']);
  });
});