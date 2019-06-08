# ts-transformer-keys-2

`ts-transformer-keys-2` is inspired by [ts-transformer-keys](https://github.com/kimamula/ts-transformer-keys).
It uses custom transformer to parse the keys in 'interface' and 'type' in compile stage in TypeScript 
which support nested keys.


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

console.log(keys<Foo>()); // ['a', 'b', 'c', 'c.a', 'c.b']
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

console.log(keys<Foo>()); // ['a', 'b', 'c', 'c.d', 'c.e', 'c.f']
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

console.log(keys<Foo>()); // ['a', 'b', 'c', 'c.d', 'c.e', 'c.f']
```
