# ts-transformer-keys-2

`ts-transformer-keys-2` is inspired by [ts-transformer-keys](https://github.com/kimamula/ts-transformer-keys).
It uses custom transformer to parse the keys in 'interface' and 'type' in compile stage in TypeScript 
which support nested keys, optionality and type.


## Usage

Basically as same as `ts-transformer-keys`, the only difference is `ts-transformer-keys-2` can parse nested keys
in 'interface' and 'type':

### Nested interface
```typescript
import { keys } from 'ts-transformer-keys-2';

interface Foo {
  a: string;
  b: number;
  c: Bar;
}

interface Bar {
  a: string;
  b: number;
}

// [
//   { name: 'a', optional: false, type: 'string' },
//   { name: 'b', optional: false, type: 'number' },
//   { name: 'c', optional: false, type: 'any' },
//   { name: 'c.a', optional: false, type: 'string' },
//   { name: 'c.b', optional: false, type: 'number' },
//]
console.log(keys<Foo>());
```

### Nested type
```typescript
import { keys } from 'ts-transformer-keys-2';

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

// [
//   { name: 'a', optional: false, type: 'string' },
//   { name: 'b', optional: false, type: 'number' },
//   { name: 'c', optional: false, type: 'any' },
//   { name: 'c.d', optional: false, type: 'string' },
//   { name: 'c.e', optional: false, type: 'number' },
//   { name: 'c.f', optional: false, type: 'boolean' },
//]
console.log(keys<Foo>());
```

### Mix interface and type
```typescript
import { keys } from 'ts-transformer-keys-2';

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

// [
//   { name: 'a', optional: false, type: 'string' },
//   { name: 'b', optional: false, type: 'number' },
//   { name: 'c', optional: false, type: 'any' },
//   { name: 'c.d', optional: false, type: 'string' },
//   { name: 'c.e', optional: false, type: 'number' },
//   { name: 'c.f', optional: false, type: 'boolean' },
//]
console.log(keys<Foo>());
```

### Interface properties has question mark
```typescript
import { keys } from 'ts-transformer-keys-2';

type Foo = {
  a?: string;
  b: number;
  c: Bar; 
}

interface Bar {
  d?: string;
  e?: number;
  f: boolean;
}

// [
//   { name: 'a', optional: true, type: 'string'},
//   { name: 'b', optional: false, type: 'number' },
//   { name: 'c', optional: false, type: 'any' },
//   { name: 'c.d', optional: true, type: 'string' },
//   { name: 'c.e', optional: true, type: 'number' },
//   { name: 'c.f', optional: false, type: 'boolean' },
//]
console.log(keys<Foo>());
```

## Run tests

```bash
npm test
```
