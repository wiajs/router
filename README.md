English | [简体中文](./README.CN.md)

# wia router

## Introduction

`wia router` is the official router for [wia.js](https://www.wia.pub). It deeply integrates with wia.js core to make building Multiple Page Applications with wia.js a breeze. Features include:

- Nested route/view mapping
- Page-based router No configuration
- Dynamic loading of html, css, js
- Route params, query, wildcards
- Links with automatic active CSS classes
- Hash mode

## Build

You will need Node.js installed on your system.

First, install all required dependencies

```bash
$ npm install
```

To build development version:

```bash
$ npm run build-dev
```

The resulting files are:

1. dist/router.common.js
2. dist/router.common.map
3. dist/router.esm.js
4. dist/router.esm.map
5. dist/router.umd.js
6. dist/router.umd.map

To build production (minified) version:

```bash
$ npm run build
```

The resulting files are:

1. dist/router.common.js
2. dist/router.common.min.js
3. dist/router.esm.js
4. dist/router.esm.min.js
5. dist/router.umd.js
6. dist/router.min.js

## use

```js
  import Router from @wiajs/router
```

## Stay In Touch

- For latest releases and announcements, follow on Twitter: [@wiajs](https://twitter.com/wiajs)

## License

[ELv2](https://www.elastic.co/cn/licensing/elastic-license)

Copyright (c) 2020-present Sibyl Yu
