/*!
  * wia router v0.1.1
  * (c) 2021 Sibyl Yu
  * @license MIT
  */
function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

/**
 * 开放、互联 前端路由
 * First Version Released on: September 13,2016
 */

/* global
 */
var location = window.location; // eslint-disable-line
var API = {
  getCode: 'auth/getCode',
  // 获取当前登录用户临时code
  getToken: 'auth/getToken',
  // 获取指定应用token
  checkToken: 'auth/checkToken' // 指定应用token

};
/**
 * a very simple router for the **demo** of [weui](https://github.com/weui/weui)
 */

var Router = /*#__PURE__*/function () {
  // default option
  // container element
  // 缓存所有app实例
  // 缓存所有page实例
  // 页面id
  // 缓存所有Page中的dom视图，不是$dom
  // dom page 映射，通过 dom对象查找page实例！
  // 当前路由所处的网址，实际上是hash部分！
  // 带参数的完整hash数组，回退pop，前进push
  // start route config

  /**
   * constructor
   * @param opt
   */
  function Router(opt) {
    var _this = this;

    this.opt = {
      view: 'wia-view',
      style: 'wia-style',
      splashTime: 1000,
      className: 'page',
      // 创建内容层时需添加的样式
      nextClass: 'page-next',
      // page 切换新页面
      prevClass: 'page-previous',
      // page 切换旧页面
      showClass: 'page-current',
      // 显示内容层时添加的样式
      cos: 'https://cos.nuoya.net',
      //  'http://localhost:3003'
      api: 'https://wia.pub',
      ver: '1.0.0',
      mode: 'prod',
      // 打包代码， 是否压缩，生产  prod，调试 dev, 本地调试 local
      transition: 'f7-flip'
    };
    this._index = 1;
    this.view = null;
    this.as = {};
    this.ps = {};
    this.ids = [];
    this.vs = {};
    this.vps = new Map();
    this.url = '';
    this.hash = [];
    this.splash = false;

    this.getCurrentPage = function () {
      return $.qu("." + _this.opt.showClass);
    };

    // if (Router.instance) {
    //   throw new Error('Router is already initialized and can\'t be initialized more than once');
    // }
    // Router.instance = this; // 是否控制为单例？
    this.opt = $.assign({}, this.opt, opt); // this.app = this.opt.app;
    // this.app.router = this;

    this.view = $("#" + this.opt.view);
    this.param = {};
    this.page = null; // 当前 page 实例

    this.lastPage = null; // 上一个 page 实例

    this.lastApp = null; // 上一个应用实例
    // 方便全局访问

    $.view = this.view; // $化视图

    $.router = this; // 全局路由
    // splash 开机画面不需要 动画

    this.splash = true;
    this.lastHash = ''; // 前hash

    this.hash = []; // hash数组

    this.nextHash = ''; // 需到达的 hash

    this.lastOwner = ''; // 上一个应用所有者

    this.lastName = ''; // 上一个应用名称

    this.lastPath = ''; // 上一个应用路径

    this.backed = false; // 是否为返回

    this.owner = this.opt.owner; // 当前应用所有者

    this.appName = this.opt.name; // 当前应用名称

    this.path = ''; // 当前应用路径，去掉参数部分，不包括页面文件，a/b/c/1.html?x=1 为：c
    // 当前应用实例
    // 创建路由时，需创建启动 app，每个应用都可能成为wia store 入口

    var appCls = null;
    if (this.opt.mode === 'local') // eslint-disable-next-line
      appCls = __webpack_require__('./src/index.js'); // eslint-disable-line
    else appCls = __m__("./" + this.owner + "/" + this.name + "/src/index.js"); // eslint-disable-line
    // eslint-disable-next-line

    var app = new appCls.default({
      // App root element
      root: this.opt.root,
      owner: this.opt.owner,
      name: this.opt.name,
      init: true // 启动wia应用时，创建路由，同时创建app

    });
    this.app = app;
    $.app = this.app;
    if (app.ready) // 重新绑定事件
      $.nextTick(function () {
        app.ready();
      });
    if (app.show) // 重新绑定事件
      $.nextTick(function () {
        var hash = window.location.hash;
        if (hash.startsWith('#')) hash = hash.substr(1);
        if (hash.startsWith('!')) hash = hash.substr(1);
        hash = hash.indexOf('?') > -1 ? hash.replace(/\?\S*/, '') : hash; // const param = $.urlParam();

        var param = $.urlParam();
        app.show(hash, param); // 抑制页面空 href 刷新页面行为

        $.view.qus('a[href=""]').attr('href', 'javascript:;');
      }); // why not `history.pushState`? see https://github.com/weui/weui/issues/26, Router in wechat webview
    // pushState 不支持 微信侧滑返回
    // 不带 hash 到 hash,返回时, 不能触发该事件,因此一开始就要设置 hash,否则无法回到 首页!
    // 监控url hash变化

    window.addEventListener('hashchange', function (event) {
      var newHash = getHash(event.newURL);
      var oldHash = getHash(event.oldURL); // ???

      console.log("router hash:" + oldHash + " -> " + newHash); // 将不合规范url修改为规范url

      var to = newHash || 'index'; // debugger;

      to = _this.repairUrl(to);

      if (newHash !== to) {
        setHash(to);
        return;
      } // 如果不是绝对路径，则跳转到绝对路径
      // if (!newHash.startsWith('/')) {
      //   setHash(this.repairUrl(newHash));
      //   return;
      // }
      // 无变化


      if (newHash === oldHash) {
        _this.nextHash = '';
        return;
      } // 记录当前 hash
      // this.lastHash = oldHash;
      // this.hash = newHash;


      _this.backed = false; // 是否返回

      _this.hash = _this.hash || [];
      var hs = _this.hash;

      if (!hs || hs.length === 0 || hs.length > 0 && hs[hs.length - 1] !== newHash) {
        if (hs.length > 0) console.log("hash:" + hs[hs.length - 1] + " -> " + newHash);else console.log("hash:null -> " + newHash);
        hs.push(newHash);
      } else if (hs.length > 1 && hs[hs.length - 2] === newHash) {
        _this.backed = true;
        console.log("back hash:" + hs[hs.length - 2] + " <- " + newHash);
        hs.pop();
      } else if (hs.length > 0 && hs[hs.length - 1] === newHash) console.log("same hash: " + newHash); // const state = history.state || {};
      // this.to(hash, state._index <= this._index);


      _this.routeTo(hs[hs.length - 1], _this.param, _this.refresh); //  , oldHash);


      _this.refresh = false;
      _this.param = null;
      _this.nextHash = '';
    }, false);
  }
  /**
   * 导航并传递对象参数, 更改当前路由 为 指定 路由，hash 直接导航只能传字符参数,不能传对象参数
   * @param url hash
   * @param param 对象参数 {name: val}，不是字符串！
   * @param refresh 是否强制刷新, 默认跳转时，如果目的页面已经缓存，则直接显示，触发show事件，不会触发load和ready，
   * 如果设置为true，则跳转时，如果有缓存，则删除缓存，重新 触发 load、ready
   */


  var _proto = Router.prototype;

  _proto.go = function go(url, param, refresh) {
    if (param === void 0) {
      param = null;
    }

    if (refresh === void 0) {
      refresh = false;
    }

    // this._go = false;

    /*
     const r = this.getRoute(url);
     if (r) {
     r.param = r.param || {};
     $.assign(r.param, param);
     // this._go = true;
     r.refresh = refresh;
     }
     */
    // debugger;
    // 默认跳转到首页
    url = url || 'index';
    url = this.repairUrl(url); // console.log('go ', {url, param, refresh, href: location.href});
    // 当前网页重新加载，不会触发 hash 事件，直接路由

    if (getHash(location.href) === url) {
      // `#${url}`;
      this.nextHash = getHash(url);
      if (this.hash[this.hash.length - 1] !== this.nextHash) this.hash.push(this.nextHash);
      this.routeTo(url, param, refresh);
    } else {
      // 切换页面hash，通过 hash变化事件来路由
      this.param = param;
      this.refresh = refresh;
      this.nextHash = url;
      setHash(url);
    }
  }
  /**
   * 全屏模式不能跨网页，因此不同应用只能用不同hash区分
   * 路由仅接受绝对hash，自动将相对path转换为绝对hash
   * $.go('b') 转换为 $.go('/star/etrip/b')
   * 实际网址 https://wia.pub/#!/ower/name/b
   * $.go('/') 切换到当前路径的根路径：wia.pub/#!/ower/name，
   * 在网址上输入 https://wia.pub/#!b
   * 也会根据当前网址补全路径，自动切换到 https://wia.pub/#!/ower/name/b
   * @param {*} url
   */
  ;

  _proto.repairUrl = function repairUrl(url) {
    var R = '';
    if (!url) return '';

    try {
      R = url;
      if (url === '/') R = '/';else if (url === '~') R = "/" + this.owner + "/" + this.appName + "/index"; // else if (url.startsWith('../'))
      //   R = url.replace(/\.\.\//, `/${this.opt.owner}/`);
      // 当前路径
      else if (url.startsWith('./') && this.path) {
          R = "/" + this.owner + "/" + this.appName + "/" + this.path + "/" + url.substr(2);
        } else if (!url.startsWith('/')) R = "/" + this.owner + "/" + this.appName + "/" + url; // 绝对路径 /ower/app?a=1 => /ower/app/index?a=1
        // /ower/app => /ower/app/index
        // /ower/app/ => /ower/app/index
        else if (url.startsWith('/')) {
            // 自动补充 index
            var ms = url.match(/([^/?]+)\/([^/?]+)\/?([^?]*)([\s\S]*)/); // default to index

            if (ms) {
              var owner = ms[1];
              var name = ms[2];
              var page = ms[3];
              if (owner && name && !page) R = "/" + owner + "/" + name + "/index" + ms[4];
            }
          } // R = url.endsWith('/') ? url.substr(0, url.length - 1) : url;
      // / 结尾，代表目录，自动加载 index
      // /ower/app/fea/ => /ower/app/fea/index

      R = R.endsWith('/') ? R + "index" : R; // /ower/app/fea/?a=1 => /ower/app/fea/index?a=1

      R = R.replace(/\/\?/g, '/index?');
      if (R !== url) console.log("router repairUrl:" + url + " -> " + R);
    } catch (e) {
      console.error("router repairUrl exp:" + e.message);
    }

    return R;
  };

  _proto.back = function back(param, refresh) {
    if (refresh === void 0) {
      refresh = false;
    }

    this.param = param;
    this.refresh = refresh;
    window.history.back();
  }
  /**
   * 判断页面是否已加载过
   */
  ;

  _proto.loaded = function loaded(p) {
    return $.id(p.id) || this.vs[p.id];
  }
  /**
   * 动态下载页面js，里面包括js、html和css
   * 本地调试，则动态从本地下载html、css
   * @param {*} url 加载页面网址，格式：/ower/appname/page
   * 返回 promise
   */
  ;

  _proto.load = function load(url, param) {
    var _this2 = this;

    var R = null;

    try {
      R = new Promise(function (res, rej) {
        // console.log(`router load url:${url}`);
        // const pos = path.lastIndexOf('/');
        // const name = path.substr(pos + 1);
        var ms = url.match(/([^/]+)\/([^/]+)\/?([^?]*)/); // const ms = url.match(/([^/]+)\/([^/]+)\/?([^?]*)([\s\S]*)/);

        var owner = ms === null || ms === void 0 ? void 0 : ms[1];
        var name = ms === null || ms === void 0 ? void 0 : ms[2];
        var page = ms === null || ms === void 0 ? void 0 : ms[3]; // 默认page 为 index

        if (owner && name && !page) page = 'index';
        var path = '';

        if (page && page.includes('/')) {
          var pos = page.lastIndexOf('/');
          path = page.substr(0, pos);
        }

        console.log('load', {
          owner: owner,
          name: name,
          page: page,
          path: path
        }); // 加载页面必须 owner、name 和 page

        if (!owner || !name || !page) res(''); // 本地调试状态，直接获取本地页面
        else if (_this2.opt.mode === 'local') {
            var appCss = null; // 静态资源浏览器有缓存,增加日期时标,强制按日期刷新!

            var pgHtml = new Promise(function (resHtml, rejHtml) {
              var pgurl = _this2.opt.local + "/page/" + page + ".html?v=" + Date.now(); // console.log('router load html:', {url: pgurl});

              $.get(pgurl).then(function (rs) {
                // 页面获取成功
                // debugger;
                // console.log('router load html:', {url: pgurl, rs});
                // 获得页面模块类，并创建页面对象实例
                var Cls = __webpack_require__("./src/page/" + page + ".js"); // eslint-disable-line


                var p = new Cls.default({
                  app: _this2.app
                }); // eslint-disable-line

                p.html = rs;
                p.param = param; // 保存应用所有者和应用名称

                p.owner = owner;
                p.appName = name;
                p.url = "/" + owner + "/" + name + "/" + page;
                p.path = path;

                _this2.cachePage(p); // save page instance


                resHtml(p);
              }, function (err) {
                return rejHtml(err);
              });
            });
            var pgCss = new Promise(function (resCss, rejCss) {
              var pgurl = _this2.opt.local + "/page/" + page + ".css?v=" + Date.now(); // console.log(`router load css:${url}`);

              $.get(pgurl).then(function (rs) {
                // debugger;
                // console.log('router load css:', {url: pgurl, rs});
                resCss(rs);
              }, function (err) {
                return rejCss(err);
              });
            });
            Promise.all([pgHtml, pgCss]).then(function (rs) {
              var p = rs[0];
              p.css = rs[1]; // eslint-disable-line
              // 触发 load 事件

              if (p.load) p.load(param);
              res(p);
            }).catch(function (err) {
              return rej(err);
            });
          } else {
            // debugger;
            if (_this2.opt.cos.includes('localhost:')) url = _this2.opt.cos + "/page/" + page + ".js?v=" + Date.now();else url = _this2.opt.cos + "/" + owner + "/" + name + "/page/" + page + ".js?v=" + Date.now(); // console.log('router load page:', {url});

            $.get(url).then(function (r) {
              // debugger;
              // console.log(r);
              if (r && r.js) {
                var k = Object.keys(r.js)[0];
                var code = r.js[k];
                $.M.add(r.js); // console.log(r.js);

                var P = $.M(k); // 加载该模块

                var p = new P.default(); // eslint-disable-line

                p.html = r.html;
                p.css = r.css;
                p.param = param; // 保存应用所有者和应用名称

                p.owner = owner;
                p.appName = name;
                p.url = "/" + owner + "/" + name + "/" + page;
                p.path = path;

                _this2.cachePage(p); // 触发 load 事件


                if (p.load) p.load(param);
                res(p);
              }
            }, function (err) {
              return rej(err);
            });
          }
      });
    } catch (e) {
      console.error("load exp:" + e.message);
    }

    return R;
  }
  /**
   * 切换应用
   * @param {*} owner 所有者
   * @param {*} name 应用名称
   * @param {*} path 应用路径
   * returns 是否成功
   */
  ;

  _proto.switchApp = function switchApp(owner, name, path) {
    var _this3 = this;

    if (owner === this.owner && name === this.appName) {
      if (path !== this.path) this.path = path;
      return Promise.resolve(true);
    } // 切换需获取新应用token


    this.getToken(owner, name).then(function (tk) {
      if (tk) {
        // 应用切换处理
        if (owner) {
          if (_this3.owner !== _this3.lastOwner) _this3.lastOwner = _this3.owner;
          _this3.owner = owner;
        }

        if (name) {
          if (_this3.appName !== _this3.lastName) _this3.lastName = _this3.appName;
          _this3.appName = name;
        }

        if (path) {
          if (_this3.path !== _this3.lastPath) _this3.lastPath = _this3.path;
          _this3.path = path;
        }

        var app = _this3.findApp(owner, name); // 需创建应用


        if (!app) {
          var appCls = null;
          if (_this3.opt.mode === 'local') // eslint-disable-next-line
            appCls = __webpack_require__('./src/index.js'); // eslint-disable-line
          else appCls = __m__("./" + _this3.owner + "/" + _this3.name + "/src/index.js"); // eslint-disable-line
          // eslint-disable-next-line

          app = new appCls.default({
            // App root element
            root: _this3.opt.root,
            owner: _this3.opt.owner,
            name: _this3.opt.name,
            init: false
          });
          _this3.as[owner + "." + name] = app;
          _this3.lastPage = null; // 切换 app

          _this3.page = null;
          $.lastPage = null;
          $.page = null;
          if (app.ready) // 重新绑定事件
            $.nextTick(function () {
              app.ready();
            });
        }

        _this3.lastApp = _this3.app;
        if (_this3.lastApp.hide) $.nextTick(function () {
          _this3.lastApp.hide();
        });
        _this3.app = app;
        if (app.show) $.nextTick(function () {
          app.show(); // 抑制页面空 href 刷新页面行为

          $.view.qus('a[href=""]').attr('href', 'javascript:;');
        });
        return true;
      }

      return false;
    }).catch(function (err) {
      console.log('switchApp err:', err);
      return false;
    });
  }
  /**
   * 获取指定应用token
   * @param {*} owner 应用所有者
   * @param {*} name 应用名称
   */
  ;

  _proto.getToken = function getToken(owner, name) {
    var _this4 = this;

    var self = this;
    return new Promise(function (res, rej) {
      var R = '';
      var key = owner + "/" + name + "/token";

      try {
        var tk = $.store.get(key);

        _this4.checkToken(owner, name, tk).then(function (rs) {
          if (rs) {
            $.app.token = tk;
            res(tk);
          } else {
            tk = $.app.token;
            $.app.token = ''; // const code = await this.getCode(tk);

            _this4.getCode(tk).then(function (code) {
              if (code) {
                $.get(self.opt.api + "/" + owner + "/" + name + "/" + API.getToken, "code=" + code).then(function (r) {
                  if (r) {
                    // console.log('getToken', {r});
                    if (r.code === 200) {
                      tk = r.data.token;
                      $.app.token = tk;
                      $.store.set(key, tk);
                      R = tk;
                    } else console.error('getToken error', {
                      r: r
                    });
                  }

                  res(R);
                }).catch(res(R));
              } else {
                console.error('getToken fail! no code.');
                res(R);
              }
            });
          }
        });
      } catch (e) {
        console.error('getToken exp:', e.message);
      }

      return R;
    });
  }
  /**
   * 检查当前token是否有效
   * @param {*} owner 应用所有者
   * @param {*} name 应用名称
   * @param {*} token 用户持有的身份令牌
   */
  ;

  _proto.checkToken = function checkToken(owner, name, token) {
    var _this5 = this;

    return new Promise(function (res, rej) {
      var R = false;

      try {
        if (!token) res(R);else {
          $.get(_this5.opt.api + "/" + owner + "/" + name + "/" + API.checkToken, "token=" + token).then(function (rs) {
            // console.log('checkToken', {token, rs});
            // {res: true, expire: 秒数}
            if (rs.code === 200) {
              var exp = rs.data.expire; // 过期时刻，1970-01-01 之后的秒数

              R = rs.data.res;
            }

            res(R);
          }).catch(res(R));
        }
      } catch (e) {
        console.error('checkToken exp:', e.message);
        res(R);
      }
    });
  }
  /**
   * 通过当前登录token获取用户临时code，用于跨应用授权
   * @param {*} token 用户持有的身份令牌
   */
  ;

  _proto.getCode = function getCode(token) {
    var _this6 = this;

    return new Promise(function (res, rej) {
      var R = '';

      try {
        $.get(_this6.opt.api + "/" + API.getCode, "token=" + token).then(function (rs) {
          // console.log('getCode', {token, rs});
          if (rs.code === 200) R = rs.data;else console.error('getCode fail.', {
            token: token,
            rs: rs
          });
          res(R);
        }).catch(res(R));
      } catch (e) {
        console.error('getCode exp:', e.message);
        res(R);
      }
    });
  }
  /**
   * 向页面添加样式
   */
  ;

  _proto.addCss = function addCss(p) {
    var id = "css-" + p.id;
    var d = $.id(id);

    if (!d) {
      d = document.createElement('style');
      d.id = id;
      d.innerHTML = p.css;
      $('head').append(d);
    }
  }
  /**
   * 从页面删除样式
   */
  ;

  _proto.removeCss = function removeCss(p) {
    var id = "css-" + p.id;
    var d = $.id(id);
    if (d) $(d).remove();
  }
  /**
   * route to the specify url, 内部访问
   * @param {String} url
   * @param {Object} 参数对象
   * @returns {Router}
   */
  ;

  _proto.routeTo = function routeTo(url, param, refresh) {
    var _this7 = this;

    console.log('routeTo ', {
      url: url,
      param: param,
      refresh: refresh
    });
    var p = this.findPage(url, param, refresh);
    if (p) this.to(p, refresh);else {
      // 静态资源浏览器有缓存,增加日期时标,强制按日期刷新!
      // 没有缓存，则动态加载
      this.load(url, param).then(function (lr) {
        p = _this7.findPage(url, param, refresh);
        if (p) _this7.to(p, refresh);
      });
    }
  }
  /**
   * 切换到指定页面
   * @param {*} p 当前page实例
   */
  ;

  _proto.to = function to(p, refresh) {
    var _this8 = this;

    if (!p) {
      console.error('route to null page.');
      return;
    } // 切换应用


    this.switchApp(p.owner, p.appName, p.path).then(function (rt) {
      if (rt) {
        var _this8$lastPage$view$, _this8$lastPage$view$2, _this8$lastPage$view$3;

        // 记录当前page实例
        _this8.lastPage = _this8.page; // 记录当前 scrollTop

        if (_this8.lastPage && _this8.lastPage.scrollTop) _this8.lastPage.scrollTop = (_this8$lastPage$view$ = (_this8$lastPage$view$2 = _this8.lastPage.view.clas('page-content')) === null || _this8$lastPage$view$2 === void 0 ? void 0 : (_this8$lastPage$view$3 = _this8$lastPage$view$2.dom) === null || _this8$lastPage$view$3 === void 0 ? void 0 : _this8$lastPage$view$3.scrollTop) !== null && _this8$lastPage$view$ !== void 0 ? _this8$lastPage$view$ : 0; // 切换app

        _this8.page = p;
        $.page = _this8.page;
        $.lastPage = _this8.lastPage; // alert(`routeTo url:${r.url}`);
        // 返回还是前进

        var ids = _this8.ids;
        _this8.backed = false; // 如果切换的是前一个page，则为回退！

        if (ids.length > 1 && ids[ids.length - 2] === p.id) {
          _this8.backed = true;
          console.log("to back id:" + p.id + " <- " + ids[ids.length - 1]);
          ids.pop();
        } else if (ids.length > 0 && ids[ids.length - 1] === p.id) {
          console.log("to same id: " + p.id);
        } else if (ids.length === 0 || ids.length > 0 && ids[ids.length - 1] !== p.id) {
          if (ids.length > 0) console.log("to id:" + ids[ids.length - 1] + " -> " + p.id);else console.log("to id:null -> " + p.id);
          ids.push(p.id);
        } // 进入跳转的页面, d 为 dom 对象


        var enter = function enter(d) {
          p.doReady = false; // 页面上是否存在，已经隐藏

          var v = $.id(p.id); // debugger;
          // 页面上不存在，则从缓存获取，并加载到主页面

          if (!v) {
            // 从缓存加载到页面，触发ready
            v = _this8.vs[p.id]; // dom实例
            // 缓存也不存在，表明是刚Load，第一次加载到页面，触发Ready事件

            if (!v && d) {
              v = d; // 缓存页面dom实例

              _this8.vs[p.id] = v;
              p.doReady = true;
            }

            if (v) {
              // back 插在前面
              // forward添加在后面，并移到左侧
              if (_this8.view) {
                // this.style.href = r.style;
                _this8.addCss(p); // 准备 css


                var $v = $(v);
                var pm = $v.hasClass('page-master');

                if ((_this8.backed || pm) && _this8.view.hasChild()) {
                  if (_this8.opt.className) $v.addClass("" + _this8.opt.className);
                  if (_this8.opt.prevClass && !pm) $v.addClass("" + _this8.opt.prevClass); // master 和 前页面 插到前面

                  _this8.view.dom.insertBefore(v, _this8.view.lastChild().dom);
                } else {
                  if (_this8.opt.className) $v.addClass("" + _this8.opt.className);
                  if (_this8.opt.nextClass && !pm) $v.addClass("" + _this8.opt.nextClass);

                  _this8.view.dom.appendChild(v);
                }
              }

              if (p.doReady) $.fastLink(); // 对所有 link 绑定 ontouch，消除 300ms等待
            }
          } // 记录即将显示视图


          if (p.el !== v) p.el = v; // view 层保存在el中

          if (p.dom !== v) p.dom = v;
          if (p.$el.dom !== v) p.$el = $(v);
          if (p.view.dom !== v) p.view = p.$el; // 动画方式切换页面，如果页面在 ready 中被切换，则不再切换！
          // 应该判断 hash 是否已经改变，如已改变，则不切换
          // alert(`hash:${this.hash} => ${this.nextHash}`);

          if (!_this8.nextHash || _this8.nextHash === _this8.hash[_this8.hash.length - 1]) {
            _this8.switchPage(p, _this8.backed);
          }
        }; // 强制刷新，删除存在页面及缓存


        if (refresh) {
          var v = $.id(p.id);
          if (v) $.remove(v); // 删除缓存

          v = _this8.vs[p.id];
          if (v) delete _this8.vs[p.id];
        } // 加载页面视图回调


        var onload = function onload(err, html) {
          if (html === void 0) {
            html = '';
          }

          if (err) throw err; // console.log('onload html:', html);
          // 创建 页面层

          var $v = $(html);
          $v.dom.id = p.id;
          p.view = $v; // dom 对象保存到页面实体的view中

          p.$el = $v;
          p.el = $v.dom;
          p.dom = $v.dom; // dom 与页面实例映射

          _this8.vps.set(p.dom, p); // 进入页面


          enter(p.dom);
        };

        var nextPage = _this8.loaded(p);

        _this8.getCurrentPage(); // 页面不存在则加载页面


        if (!nextPage) {
          onload(null, p.html); // if (r.load) // 加载视图
          //   r.load.then((html) => {onload(null, html)});
          // else if (r.view) // 兼容
          //   r.view(onload);
          // else
          //   throw new Error(`route ${r.id} hasn't load function!`);
        } else enter(); // 存在则直接进入

      }
    }).catch(function (err) {
      return console.error('to err:', err);
    });
  }
  /**
   * 路由仅接受绝对path，通过url获取绝对path、 search、 param
   * 将相对path 转换为绝对path
   * 将?后面的内容从url剥离，并转换为参数，？需包含在hash中，也就是 # 之后
   * 比如当前hash为 '#!a' 切换到 '#!b'
   * $.go('b')
   * 网址上输入 https://wia.pub/#!/ower/name
   * 默认到首页 https://wia.pub/#!/ower/bame/home
   * @param {*} url
   */
  ;

  _proto.parseUrl = function parseUrl(url) {
    var R = {
      url: url
    };

    try {
      // 把?后面的内容作为 search 参数处理，？需包含在hash中，也就是 # 之后
      var pos = url.indexOf('?');

      if (pos >= 0) {
        R.url = url.substr(0, pos);
        R.search = url.substr(pos + 1);

        if (R.search) {
          R.param = {};
          var ps = R.search.split('&');
          ps.forEach(function (p) {
            pos = p.indexOf('=');
            if (pos > 0) R.param[p.substr(0, pos)] = p.substr(pos + 1);
          });
        }
      }

      R.url = this.repairUrl(R.url);
      var ms = url.match(/([^/]+)\/([^/]+)\/([^?]+)/); // eslint-disable-next-line prefer-destructuring

      if (ms) R.path = ms[3];
      if (url !== R.url) console.log("router parseUrl url:" + url + " -> " + R.url + " path:" + R.path);
    } catch (e) {
      console.error("router parseUrl exp:" + e.message);
    }

    return R;
  }
  /**
   * 从缓存ps中查找页面实例
   * /ower/name/pag，去掉参数，参数放入 r.param
   * @param {String} url /ower/name/page
   * @param {Object} param
   * @returns {Object}
   */
  ;

  _proto.findPage = function findPage(url, param, refresh) {
    var R = null;
    var rs = this.parseUrl(url); // for (let i = 0, len = this.rs.length; i < len; i++) {

    var p = this.ps[rs.url]; // find(rt => rt.url === rs.url);

    if (!p) {
      console.log('findPage not find!', {
        url: url
      });
    } else {
      if (rs.param) p.param = _extends({}, rs.param);else p.param = {};
      if (param) $.assign(p.param, param); // 记录当前 path
      // r.path = rs.path;
      // r.url = url;

      p.lastSearch = p.search;
      p.search = rs.search;
      p.refresh = refresh;
      R = p;
    }

    return R;
  }
  /**
   * 从缓存中查找应用，避免重新加载
   * @param {String} url /ower/name/page
   * @param {Object} param
   * @returns {Object}
   */
  ;

  _proto.findApp = function findApp(owner, name, param, reload) {
    var R = null;
    var app = this.as[owner + "." + name];

    if (!app) {
      console.log('findApp not find!', {
        owner: owner,
        name: name
      });
    } else {
      app.param = {};
      if (param) $.assign(app.param, param);
      app.reload = reload;
      R = app;
    }

    return R;
  }
  /**
   * cache page instance
   * @param {Object} p
   * @returns {Router}
   */
  ;

  _proto.cachePage = function cachePage(p) {
    try {
      if (!p) throw new Error('page is empty!');
      if (!p.url) throw new Error("page's url is empty!"); // 按url自动生成唯一id，该id作为Dom页面的id属性

      p.id = "" + p.url.replace(/\//g, '-');
      if (p.id.startsWith('-')) p.id = p.id.substr(1); // 将 path 转换为绝对路径
      // r.path = `/${this.opt.owner}/${this.opt.name}/${r.path}`;

      p.ready = p.ready || $.noop;
      p.router = this;
      this.ps[p.url] = p; // console.log(`router cache page.url:${p.url} succ.`);

      return this;
    } catch (ex) {
      console.error("router.cachePage exp: " + ex.message);
    }
  }
  /**
   * 以动画方式切换页面
   * 动画有 class 样式来实现的
   * @param from 当前显示的元素
   * @param to 待显示的元素
   * @param dir 切换的方向 forward backward
   * @private
   */
  ;

  _proto.aniPage = function aniPage(from, to, dir, cb) {
    var _this9 = this;

    var aniClass = "router-transition-" + (dir || 'forward') + " router-transition"; // console.log('aniPage ', {aniClass});
    // 动画结束，去掉 animation css 样式

    if ($.device.ios) {
      to.animationEnd(function () {
        // console.log('animation end.');
        _this9.view.removeClass(aniClass); // from.removeClass('page-previous');


        if (cb) cb();
      });
    } else {
      var end = to;
      if (dir === 'backward') end = from; // md to's animation: none, only from's animation

      end.animationEnd(function () {
        // console.log('animation end.');
        _this9.view.removeClass(aniClass); // from.removeClass('page-previous');


        if (cb) cb();
      });
    } // console.log('animation start...');
    // Add class, start animation


    this.view.addClass(aniClass);
  }
  /**
   * 获取当前显示的第一个 section
   *
   * @returns {*}
   * @private
   */
  ;

  /**
   * 显示新页面时，卸载当前页面，避免页面上相同id冲突
   * @param {*} p 卸载页面实例
   * @param {*} v 卸载页面视图 $Dom
   */
  _proto.hidePage = function hidePage(p, v) {
    if (!v || !p) return;

    try {
      v.removeClass(this.opt.showClass);
      v.removeClass(this.opt.prevClass);
      v.removeClass(this.opt.nextClass); // 触发隐藏事件

      if (p.hide) p.hide(v); // 缓存当前 page
      // this.vs[p.id] = v.dom;
      // removeChild

      v.remove();
      this.removeCss(p);
    } catch (ex) {
      console.error('hidePage exp:', ex.message);
    }
  }
  /**
   * 启动动画前调用show/ready事件,在页面显示前,准备好页面
   * 如果在动画后调用,会先看到旧页面残留,体验不好
   * 上个页面和当前页面同时存在,如果存在相同id,可能会有问题.
   * 获取dom 元素时,最好限定在事件参数pg范围获取.
   * @param {*} p 页面实例
   * @param {*} v 页面，$Dom 对象
   */
  ;

  _proto.onShow = function onShow(p, v) {
    var _this10 = this;

    try {
      if (!p) return; // 重新绑定事件

      if (p.doReady) {
        // page 实例就绪时，回调页面组件的pageInit事件，执行组件实例、事件初始化等，实现组件相关功能
        this.pageEvent('init', p, v);

        if (p.ready) {
          // 如果不使用延时，加载无法获取dom节点坐标！
          //  node.getBoundingClientRect().top node.offsetTop 为 0，原因未知！！！
          $.nextTick(function () {
            p.ready(v, p.param, _this10.backed);
          });
        }
      } // 触发


      if (p.back && this.backed) {
        $.nextTick(function () {
          var _v$clas, _v$clas$dom, _p$scrollTop;

          if ((_v$clas = v.clas('page-content')) !== null && _v$clas !== void 0 && (_v$clas$dom = _v$clas.dom) !== null && _v$clas$dom !== void 0 && _v$clas$dom.scrollTop) v.clas('page-content').dom.scrollTop = (_p$scrollTop = p.scrollTop) !== null && _p$scrollTop !== void 0 ? _p$scrollTop : 0;
          p.back(v, p.param);
        });
      }

      if (p.show && !this.backed) {
        $.nextTick(function () {
          p.show(v, p.param);
        });
      }
    } catch (ex) {
      console.error('onShow ', {
        ex: ex.message
      });
    }
  }
  /**
   * 显示新页面
   * @param {*} p 当前页面实例
   * @param {*} v 当前页面Dom
   */
  ;

  _proto.showPage = function showPage(p, v) {
    if (v) {
      v.removeClass(this.opt.nextClass);
      v.removeClass(this.opt.prevClass); // master-detail 主从页面，主页面一直显示

      if (v.hasClass('page-master') || v.hasClass('page-master-detail')) this.view.addClass('view-master-detail');else if (this.view.hasClass('view-master-detail')) this.view.removeClass('view-master-detail'); // master页面一直显示，普通页面切换显示

      if (!v.hasClass('page-master')) v.addClass(this.opt.showClass);
    } // $to.trigger(EVENTS.pageAnimationEnd, [to.id, to]);
    // 外层（init.js）中会绑定 pageInitInternal 事件，然后对页面进行初始化
    // $to.trigger(EVENTS.pageInit, [to.id, to]);

  }
  /**
   * 切换页面
   * 把新页从右边切入展示，同时会把新的块的记录用 history.pushState 来保存起来
   * 如果已经是当前显示的块，那么不做任何处理；
   * 如果没对应的块，忽略。
   * @param {Router} p 待切换的页面实例
   * @param {String} back 是否返回
   * @private
   */
  ;

  _proto.switchPage = function switchPage(p, back) {
    var _this11 = this;

    if (!p) return;
    var fp = null;
    var from = this.getCurrentPage(); // 当前显示页面

    if (from) {
      from = $(from); // $(from); lastp.view;
      // master page not hide!

      if (from.hasClass('page-master')) from = null;else fp = this.vps.get(from.dom);
    }

    var to = $.id(p.id);

    if (to) {
      to = $(to); // p.view; // $(to); ready/show 在实例view上修改
      // master page not hide!

      if (to.hasClass('page-master')) from = null;
    } // 如果已经是当前页，不做任何处理


    if (from && to && from.dom === to.dom) return;
    var dir = back ? 'backward' : 'forward';

    if (from || to) {
      // 页面切换动画
      if (from && to) {
        // 开机splash不需要动画
        if (this.noAni) {
          this.noAni = false;
          this.hidePage(fp, from);
          this.onShow(p, to); // ready

          this.showPage(p, to);
        } else {
          // 需要动画，先触发show事件
          this.onShow(p, to); // ready 提前处理，切换效果好

          this.aniPage(from, to, dir, function () {
            // 动画结束
            _this11.hidePage(fp, from);

            _this11.showPage(p, to);
          });
        }
      } else if (from) {
        this.hidePage(fp, from);
      } else if (to) {
        this.onShow(p, to); // ready

        this.showPage(p, to);
      }
    }

    setTitle(this.page.title); // this.pushNewState('#' + sectionId, sectionId);
  }
  /**
   * 页面Page实例事件触发，f7 UI组件需要
   * @param {Page} p 页面实例
   * @param {Dom} v 视图
   * @private
   */
  ;

  _proto.pageEvent = function pageEvent(ev, p, v) {
    try {
      if (!p || !v) return;
      var r = this; // router

      if (!v.length) return;
      var camelName = "page" + (ev[0].toUpperCase() + ev.slice(1, ev.length));
      var colonName = "page:" + ev.toLowerCase();
      var page = {
        $el: v,
        el: v.dom
      }; // if (callback === 'beforeRemove' && v[0].f7Page) {
      //   page = $.extend(v[0].f7Page, {from, to, position: from});
      // } else {
      //   page = r.getPageData(
      //     $pageEl[0],
      //     $navbarEl[0],
      //     from,
      //     to,
      //     route,
      //     pageFromEl
      //   );
      // }
      // page.swipeBack = !!options.swipeBack;
      // const {on = {}, once = {}} = options.route ? options.route.route : {};
      // if (options.on) {
      //   extend(on, options.on);
      // }
      // if (options.once) {
      //   extend(once, options.once);
      // }
      // pageInit event

      if (ev === 'init') {
        // attachEvents();
        if (v[0].f7PageInitialized) {
          v.trigger('page:reinit', page);
          r.emit('pageReinit', page);
          return;
        }

        v[0].f7PageInitialized = true;
      } // 触发当前页面事件


      v.trigger(colonName, page); // 触发页面模块事件

      r.app.emit(camelName, page);
    } catch (ex) {
      console.error("pageEvent exp:" + ex.message);
    }
  };

  return Router;
}();
/**
 * 获取 url 的 fragment（即 hash 中去掉 # 的剩余部分）
 *
 * 如果没有则返回字符串
 * 如: http://example.com/path/?query=d#123 => 123
 *
 * @param {String} url url
 * @returns {String}
 */


function getHash(url) {
  if (!url) url = location.href;
  var pos = url.indexOf('#!');
  if (pos !== -1) pos++;else pos = url.indexOf('#');
  return pos !== -1 ? url.substring(pos + 1) : ''; // ??? '/'
} // google 支持 #! 格式，百度浏览器修改hash无效


function setHash(url) {
  var hash = url;
  if (url[0] !== '!') hash = "!" + url; // console.log('setHash...', {url, href: location.href, hash: location.hash});

  location.hash = hash; // modify invalid
  // $.nextTick(() => (location.hash = hash));
  // location.href = location.href.replace(/#[\s\S]*/i, hash);
  // console.log('setHash.', {url, href: location.href, hash: location.hash});
}
/**
 * 修改微信 title
 * IOS：微信6.5.3版本 在17年3月，切换了WKWebview， 可以直接document.title修改。
 * Andriod： 一直都可以document.title修改
 */


function setTitle(val) {
  if (document.title === val) return;
  document.title = val;
  /*
  if (/MicroMessenger/i.test(navigator.userAgent)) {
    setTimeout(() => {
      // 利用iframe的onload事件刷新页面
      document.title = val;
       const fr = document.createElement('iframe');
      // fr.style.visibility = 'hidden';
      fr.style.display = 'none';
      // 避免大量服务器无效访问，需提供该文件！
      fr.src = 'favicon.ico';
      fr.onload = () => {
        setTimeout(() => {
          document.body.removeChild(fr);
        }, 0);
      };
      document.body.appendChild(fr);
    }, 0);
  } else document.title = val;
  */
}

$.go = function (url, param, refresh) {
  if (param === void 0) {
    param = null;
  }

  if (refresh === void 0) {
    refresh = false;
  }

  $.router.go(url, param, refresh);
};

$.back = function (param, refresh) {
  if (refresh === void 0) {
    refresh = false;
  }

  $.router.back(param, refresh);
};

export { Router };
