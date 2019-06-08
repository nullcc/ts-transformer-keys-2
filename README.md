# ts-transformer-keys-2

Inspired by [ts-transformer-keys](https://github.com/kimamula/ts-transformer-keys), it can parse 
nested keys of interface and type.

## Usage

Basiclly as same as `ts-transformer-keys`, the only difference is `ts-transformer-keys-2` can parse nested keys
in interface or type:

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
