English | [简体中文](./README.CN.md)

# wia router

## Introduction

`wia router` is the official router for [wia](https://www.wia.pub). It deeply integrates with wia core to make building Multiple Page Applications with wia a breeze. Features include:

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

## hash

## Page Jump

## Life cycle of page

`load -> ready -> show / hide -> unload`

Example of page's code:

```js
import Page from '../../../wiajs/core/page';

/* global btnLogin,  */

let _data = {};
const _list = {
  cache: {},
  data: null,
};

const _name = 'home';
const _title = 'e差旅';

export default class Home extends Page {
  constructor(opt) {
    opt = opt || {};
    super(opt.app || $.app, opt.name || _name, opt.title || _title);
    _data = this.data;
    console.log('home constructor:', {opt, cfg: this.cfg});
  }

  load(param) {
    super.load(param);
    console.log('home load param:', param);
  }

  // Operate on the loaded view
  ready(view, param, back) {
    super.ready(view, param, back);
    console.log('home ready:', {param, back});
    bind();
  }

  show(view, param, back) {
    super.show(view, param, back);
    console.log('home show:', {param, back});
  }
}

function bind() {
  btnLogin.onclick = function() {
    $.page.data = {x: 1, y: 2};
    $.back(true);
    // $.go('login', {user: {name: 'test'}}, false);
  };
}
```

### Parameters

### go accpts three types of router parameters

### css Requirements

### Data Interchange

## use

```js
  import Router from @wiajs/router
```

## Stay In Touch

- For latest releases and announcements, follow on Twitter: [@wiajs](https://twitter.com/wiajs)

## License

[MIT](http://opensource.org/licenses/MIT)

Copyright (c) 2020-present Sibyl Yu

## Special Thanks
