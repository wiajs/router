/*!
  * wia router v0.1.1
  * (c) 2020 Sibyl Yu
  * @license MIT
  */
/**
 * 开放、互联 前端路由
 * Released on: September 13
 */
// 动画方式切换
// import $ from '@wiajs/dom';

/* global

*/
// const $ = window.$;
let location = window.location; // eslint-disable-line
/**
 * a very simple router for the **demo** of [weui](https://github.com/weui/weui)
 */

class Router {
  constructor() {
    this._index = 1;
  }

}

$.go = (url, param = null, refresh = false) => {
  $.router.go(url, param, refresh);
};

$.back = (refresh = false) => {
  $.router.refresh = refresh;
  $.router.back();
};

export default Router;
