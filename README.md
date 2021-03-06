# Teki

<img src="./src/logo.png" width="200px" />

An **incredibly tiny** TypeScript path parser (**1.3kb** gzipped!) with a
surprising amount of features.

* 📔 [API](#api) docs
* 🚀 Try it in a [fiddle](https://jsfiddle.net/y3kv4ejw/)

#### Installation

`npm install --save teki` or `yarn add teki`.

#### Usage

```typescript
import { parse } from 'teki'

const userRoute =
  parse('/user/:id/messages?page=:page')

>> userRoute('http://localhost/user/123/messages?page=3)')
{ id: '123', page: '3' }
```

#### Reverse parsing

`teki` can *reverse parse* parameter dictionaries into URLs

```typescript
import { reverse } from 'teki'

const reverseUserRoute =
  reverse('/user/:id/messages?page=:page')

>> reverseUserRoute({ id: 456, page: 9 })
'/user/456?page=9'
```

#### Query Parameters

`teki` is smart about query parameters, and will parse them
independently of order

```typescript
const queryRoute =
  parse('/myRoute?foo=:foo&bar=:bar')

>> queryRoute('http://localhost/myRoute?bar=hello&foo=world')
{ bar: 'hello', foo: 'world' }
```

#### List query parameters

`teki` supports list query parameters on the form `?id=1&id=2&id=3` by
postfixing the parameter name with `*`

```typescript
const listQuery =
  parse('/myRoute?id*=:ids')

>> listQuery('http://localhost/myRoute')
{}

>> listQuery('http://localhost/myRoute?id=1&id=2&id=3')
{ ids: ['1', '2', '3'] }
```

You can use the "bracket style" notation as well

```typescript
const bracketStyleQuery =
  parse('/myRoute?id[]*=:ids')

>> bracketStyleQuery('http://localhost/myRoute?id[]=1&id[]=2')
{ ids: ['1', '2'] }
```


#### Optional query parameters

Query parameters can be made optional by postfixing its parameter name
with `?`

```typescript
const optionalQuery =
  parse('/myRoute?foo?=:foo&bar?=:bar')

>> optionalQuery('http://localhost/myRoute')
{ foo: null, bar: null }

>> optionalQuery(''http://localhost/myRoute?foo=test')
{ foo: 'test', bar: null }
```

#### Hash parameters

```typescript
const hashParam =
  parse('/myRoute#:section')

>> hashParam('http://localhost/myRoute#test')
{ section: test }
```

#### Refining paths using regular expressions

`teki` even let's you refine named parameters using regular
expressions by writing a regex after the name in angle brackets

```typescript
// Only match routes where id is numeric
const userRoute =
  parse('/user/:id<\\d+>')
  
>> userRoute('http://localhost/user/foo')
null

>> userRoute('http://localhost/user/123')
{ id: '123' }
```

#### How does it work?

`teki` achieves its small size and high performance by using
the native [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL)
API instead of a custom parser.

Keep in mind that this means that it will not work without a polyfill
for `URL` in Internet Explorer.

# API

#### `type RouteParams`

```typescript
type RouteParams = 
  Record<string, string | null | string[]>
```

The structure of the object returned when successfully parsing a pattern.

#### `parse`

```java
parse :: (pattern : string) => (url: string) => null | RouteParams
```

Parse a pattern, then accept a url to match. Returns `null` on a
failed match, or a dictionary with parameters on success.

This function is *curried* so that its faster on repeated usages.

#### `reverse`

```java
reverse :: (pattern : string) => (dict: RouteParams) => string
```

Use a dictionary to reverse-parse it back into a URL using the
specified pattern.

This function will **throw** if the dictionary has missing parameters
that are specified in the pattern.

This function is *curried* so that its faster on repeated usages.

