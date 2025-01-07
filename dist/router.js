/*!
  * wia dom v1.0.15
  * (c) 2015-2023 Sibyl Yu and contributors
  * Released under the MIT License.
  */
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global["@wiajs/router"] = factory());
})(this, (function () { 'use strict';

  function _extends() {
    _extends = Object.assign ? Object.assign.bind() : function (target) {
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

  var location = window.location;
  var API = {
    getCode: 'auth/getCode',
    getToken: 'auth/getToken',
    checkToken: 'auth/checkToken'
  };
  var def = {
    view: 'wia-view',
    style: 'wia-style',
    splashTime: 1000,
    className: 'page',
    nextClass: 'page-next',
    prevClass: 'page-previous',
    showClass: 'page-current',
    cos: 'https://cos.wia.pub',
    api: 'https://wia.pub',
    ver: '1.0.2',
    mode: 'prod',
    transition: 'f7-flip'
  };
  var Router = function () {
    function Router(opts) {
      var _this = this,
        _this$pages$SrcInd,
        _this$pages,
        _opt$theme;
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
      this.opt = _extends({}, def, opts);
      var opt = this.opt;
      this.view = $("#" + this.opt.view);
      this.param = {};
      this.refresh = {};
      this.page = null;
      this.pages = opt.pages;
      if (opt.pages) this.vite = true;
      this.lastPage = null;
      this.lastApp = null;
      $.view = this.view;
      $.router = this;
      this.splash = true;
      this.lastHash = '';
      this.hash = [];
      this.nextHash = '';
      this.lastOwner = '';
      this.lastName = '';
      this.lastPath = '';
      this.backed = false;
      this.owner = opt.owner;
      this.appName = opt.name;
      this.path = '';
      var appCls = null;
      if (this.opt.mode === 'local') appCls = (_this$pages$SrcInd = (_this$pages = this.pages) == null ? void 0 : _this$pages['./src/index']) != null ? _this$pages$SrcInd : __webpack_require__('./src/index.js')["default"];else appCls = __m__("./" + this.owner + "/" + this.name + "/src/index.js");
      var app = new appCls({
        el: opt.el || opt.root,
        theme: (_opt$theme = opt.theme) != null ? _opt$theme : 'auto',
        owner: opt.owner,
        name: opt.name,
        init: true
      });
      this.app = app;
      $.app = this.app;
      if (app.ready) $.nextTick(function () {
          app.ready();
        });
      if (app.show) $.nextTick(function () {
          var hash = window.location.hash;
          if (hash.startsWith('#')) hash = hash.substr(1);
          if (hash.startsWith('!')) hash = hash.substr(1);
          hash = hash.indexOf('?') > -1 ? hash.replace(/\?\S*/, '') : hash;
          var param = $.urlParam();
          app.show(hash, param);
          $.view.qus('a[href=""]').attr('href', 'javascript:;');
        });
      window.addEventListener('hashchange', function (event) {
        var newHash = getHash(event.newURL);
        var oldHash = getHash(event.oldURL);
        console.log("router hash:" + oldHash + " -> " + newHash);
        var to = newHash || 'index';
        to = _this.repairUrl(to);
        if (newHash !== to) {
          setHash(to);
          return;
        }
        if (newHash === oldHash) {
          _this.nextHash = '';
          return;
        }
        _this.backed = false;
        _this.hash = _this.hash || [];
        var hs = _this.hash;
        var hslen = hs.length;
        _this.lastHash = hslen > 0 ? hs[hslen - 1] : '';
        if (hslen > 1 && hs[hslen - 2] === newHash) {
          _this.backed = true;
          console.log("hash:" + newHash + " <- " + _this.lastHash);
          hs.pop();
        } else if (_this.lastHash === newHash) console.log("hash: -- " + newHash);else if (_this.lastHash !== newHash) {
          console.log("hash:" + _this.lastHash + " -> " + newHash);
          hs.push(newHash);
        }
        var _hs$slice = hs.slice(-1);
        to = _hs$slice[0];
        _this.routeTo(to, _this.param[to], _this.refresh[to], _this.lastHash);
        _this.nextHash = '';
      }, false);
    }
    var _proto = Router.prototype;
    _proto.go = function go(url, param, refresh) {
      if (param === void 0) {
        param = null;
      }
      if (refresh === void 0) {
        refresh = false;
      }
      url = url || 'index';
      url = this.repairUrl(url);
      if (getHash(location.href) === url) {
        this.nextHash = url;
        if (!this.hash.length || this.hash[this.hash.length - 1] !== this.nextHash) this.hash.push(this.nextHash);
        this.routeTo(url, param, refresh);
      } else {
        this.param[url] = param;
        this.refresh[url] = refresh;
        this.nextHash = url;
        setHash(url);
      }
    };
    _proto.repairUrl = function repairUrl(url) {
      var R = '';
      if (!url) return '';
      try {
        R = url;
        if (url === '/') R = '/';else if (url === '~') R = "/" + this.owner + "/" + this.appName + "/index";else if (url.startsWith('../')) {
          var path = this.path;
          var pos = this.path.lastIndexOf('/');
          if (pos > -1) {
            path = path.substring(0, pos);
            pos = this.path.lastIndexOf('/');
            if (pos > -1) path = path.substring(0, pos);else path = '';
          } else path = '';
          if (path === '') R = "/" + this.owner + "/" + this.appName + "/" + url.substr(3);else R = "/" + this.owner + "/" + this.appName + "/" + path + "/" + url.substr(3);
        } else if (url.startsWith('./') && this.path) {
          var _path = this.path;
          var _pos = this.path.lastIndexOf('/');
          if (_pos > -1) {
            _path = _path.substring(0, _pos);
            R = "/" + this.owner + "/" + this.appName + "/" + _path + "/" + url.substr(2);
          } else R = "/" + this.owner + "/" + this.appName + "/" + url.substr(2);
        } else if (!url.startsWith('/')) R = "/" + this.owner + "/" + this.appName + "/" + url;else if (url.startsWith('/')) {
          var ms = url.match(/([^/?]+)\/([^/?]+)\/?([^?]*)([\s\S]*)/);
          if (ms) {
            var owner = ms[1];
            var name = ms[2];
            var page = ms[3];
            if (owner && name && !page) R = "/" + owner + "/" + name + "/index" + ms[4];
          }
        }
        R = R.endsWith('/') ? R + "index" : R;
        R = R.replace(/\/\?/g, '/index?');
        if (R !== url) console.log("router repairUrl:" + url + " -> " + R);
      } catch (e) {
        console.error("router repairUrl exp:" + e.message);
      }
      return R;
    };
    _proto.back = function back(param, refresh) {
      var _this$hash;
      if (refresh === void 0) {
        refresh = false;
      }
      if (((_this$hash = this.hash) == null ? void 0 : _this$hash.length) > 1) {
        var to = this.hash[this.hash.length - 2];
        this.param[to] = param;
        this.refresh[to] = refresh;
      }
      window.history.back();
    };
    _proto.loaded = function loaded(p) {
      return $.id(p.id) || this.vs[p.id];
    };
    _proto.load = function load(url, param) {
      var _this2 = this;
      var R = null;
      try {
        R = new Promise(function (res, rej) {
          var ms = url.match(/([^/]+)\/([^/]+)\/?([^?]*)/);
          var owner = ms == null ? void 0 : ms[1];
          var name = ms == null ? void 0 : ms[2];
          var path = ms == null ? void 0 : ms[3];
          if (owner && name && !path) path = 'index';
          console.log('load', {
            owner: owner,
            name: name,
            path: path
          });
          if (!owner || !name || !path) res('');else if (_this2.opt.mode === 'local') {
            var appCss = null;
            var pgHtml = new Promise(function (resHtml, rejHtml) {
              var pgurl = _this2.opt.local + "/page/" + path + ".html?v=" + Date.now();
              $.get(pgurl).then(function (rs) {
                var _this2$pages, _this2$pages2;
                var Cls = (_this2$pages = (_this2$pages2 = _this2.pages) == null ? void 0 : _this2$pages2["./page/" + path]) != null ? _this2$pages : __webpack_require__("./src/page/" + path + ".js")["default"];
                var p = new Cls({
                  app: _this2.app
                });
                p.html = _this2.vite ? rs.replace('<script type="module" src="/@vite/client"></script>', '') : rs;
                p.param = param;
                p.owner = owner;
                p.appName = name;
                p.url = "/" + owner + "/" + name + "/" + path;
                p.path = path;
                _this2.cachePage(p);
                resHtml(p);
              }, function (err) {
                return rejHtml(err);
              });
            });
            var pgCss = new Promise(function (resCss, rejCss) {
              var pgurl = _this2.opt.local + "/page/" + path + ".css?v=" + Date.now();
              if (_this2.vite) {
                import(_this2.opt.local + "/page/" + path + ".css").then(function (m) {
                  return resCss(m);
                })["catch"](function (err) {
                  return rejCss(err);
                });
              } else {
                $.get(pgurl).then(function (rs) {
                  resCss(rs);
                }, function (err) {
                  return resCss('');
                });
              }
            });
            Promise.all([pgHtml, pgCss]).then(function (rs) {
              var p = rs[0];
              p.css = rs[1];
              if (p.load) p.load(param);
              res(p);
            })["catch"](function (err) {
              return rej(err);
            });
          } else {
            if (_this2.opt.cos.includes('localhost:')) url = _this2.opt.cos + "/page/" + path + ".js?v=" + Date.now();else url = _this2.opt.cos + "/" + owner + "/" + name + "/page/" + path + ".js?v=" + Date.now();
            $.get(url).then(function (r) {
              if (r && r.js) {
                var k = Object.keys(r.js)[0];
                var code = r.js[k];
                $.M.add(r.js);
                var P = $.M(k);
                var p = new P["default"]();
                p.html = r.html;
                p.css = r.css;
                p.param = param;
                p.owner = owner;
                p.appName = name;
                p.url = "/" + owner + "/" + name + "/" + path;
                p.path = path;
                _this2.cachePage(p);
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
    };
    _proto.switchApp = function switchApp(owner, name, path) {
      var _this3 = this;
      if (owner === this.owner && name === this.appName) {
        if (path !== this.path) this.path = path;
        return Promise.resolve(true);
      }
      this.getToken(owner, name).then(function (tk) {
        if (tk) {
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
          var app = _this3.findApp(owner, name);
          if (!app) {
            var _this3$pages$SrcIn, _this3$pages;
            var appCls = null;
            if (_this3.opt.mode === 'local') appCls = (_this3$pages$SrcIn = (_this3$pages = _this3.pages) == null ? void 0 : _this3$pages['./src/index']) != null ? _this3$pages$SrcIn : __webpack_require__('./src/index.js')["default"];else appCls = __m__("./" + _this3.owner + "/" + _this3.name + "/src/index.js");
            app = new appCls({
              root: _this3.opt.root,
              owner: _this3.opt.owner,
              name: _this3.opt.name,
              init: false
            });
            _this3.as[owner + "." + name] = app;
            _this3.lastPage = null;
            _this3.page = null;
            $.lastPage = null;
            $.page = null;
            if (app.ready) $.nextTick(function () {
                app.ready();
              });
          }
          _this3.lastApp = _this3.app;
          if (_this3.lastApp.hide) $.nextTick(function () {
            _this3.lastApp.hide();
          });
          _this3.app = app;
          if (app.show) $.nextTick(function () {
            app.show();
            $.view.qus('a[href=""]').attr('href', 'javascript:;');
          });
          return true;
        }
        return false;
      })["catch"](function (err) {
        console.log('switchApp err:', err);
        return false;
      });
    };
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
              $.app.token = '';
              _this4.getCode(tk).then(function (code) {
                if (code) {
                  $.get(self.opt.api + "/" + owner + "/" + name + "/" + API.getToken, "code=" + code).then(function (r) {
                    if (r) {
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
                  })["catch"](res(R));
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
    };
    _proto.checkToken = function checkToken(owner, name, token) {
      var _this5 = this;
      return new Promise(function (res, rej) {
        var R = false;
        try {
          if (!token) res(R);else {
            $.get(_this5.opt.api + "/" + owner + "/" + name + "/" + API.checkToken, "token=" + token).then(function (rs) {
              if (rs.code === 200) {
                var exp = rs.data.expire;
                R = rs.data.res;
              }
              res(R);
            })["catch"](res(R));
          }
        } catch (e) {
          console.error('checkToken exp:', e.message);
          res(R);
        }
      });
    };
    _proto.getCode = function getCode(token) {
      var _this6 = this;
      return new Promise(function (res, rej) {
        var R = '';
        try {
          $.get(_this6.opt.api + "/" + API.getCode, "token=" + token).then(function (rs) {
            if (rs.code === 200) R = rs.data;else console.error('getCode fail.', {
              token: token,
              rs: rs
            });
            res(R);
          })["catch"](res(R));
        } catch (e) {
          console.error('getCode exp:', e.message);
          res(R);
        }
      });
    };
    _proto.addCss = function addCss(p) {
      if (p.css) {
        var id = "css-" + p.id;
        var d = $.id(id);
        if (!d) {
          d = document.createElement('style');
          d.id = id;
          d.innerHTML = p.css;
          $('head').append(d);
        }
      }
    };
    _proto.removeCss = function removeCss(p) {
      var id = "css-" + p.id;
      var d = $.id(id);
      if (d) $(d).remove();
    };
    _proto.routeTo = function routeTo(url, param, refresh, lastHash) {
      var _refresh,
        _this7 = this;
      if (refresh === void 0) {
        refresh = false;
      }
      if (lastHash === void 0) {
        lastHash = '';
      }
      refresh = (_refresh = refresh) != null ? _refresh : false;
      console.log('routeTo ', {
        url: url,
        param: param,
        refresh: refresh
      });
      var p = this.findPage(url, param, refresh);
      if (p) this.to(p, refresh, lastHash);else {
        this.load(url, param).then(function (lr) {
          p = _this7.findPage(url, param, refresh);
          if (p) _this7.to(p, refresh, lastHash);
        });
      }
    };
    _proto.to = function to(p, refresh, lastHash) {
      var _this8 = this;
      if (refresh === void 0) {
        refresh = false;
      }
      if (lastHash === void 0) {
        lastHash = '';
      }
      if (!p) {
        console.error('route to null page.');
        return;
      }
      this.switchApp(p.owner, p.appName, p.path).then(function (rt) {
        if (rt) {
          var _this8$lastPage$view$, _this8$lastPage$view$2, _this8$lastPage$view$3;
          _this8.lastPage = _this8.page;
          if (_this8.lastPage && _this8.lastPage.scrollTop) _this8.lastPage.scrollTop = (_this8$lastPage$view$ = (_this8$lastPage$view$2 = _this8.lastPage.view["class"]('page-content')) == null ? void 0 : (_this8$lastPage$view$3 = _this8$lastPage$view$2.dom) == null ? void 0 : _this8$lastPage$view$3.scrollTop) != null ? _this8$lastPage$view$ : 0;
          _this8.page = p;
          $.page = _this8.page;
          $.lastPage = _this8.lastPage;
          var ids = _this8.ids;
          _this8.backed = false;
          if (ids.length > 1 && ids[ids.length - 2] === p.id) {
            _this8.backed = true;
            console.log("to back id:" + p.id + " <- " + ids[ids.length - 1]);
            ids.pop();
          } else if (ids.length > 0 && ids[ids.length - 1] === p.id) {
            if (p.change && p.search !== p.lastSearch) {
              console.log("search " + p.lastSearch + " -> " + p.search);
              $.nextTick(function () {
                try {
                  p.change(p.view, p.search, p.lastSearch);
                } catch (exp) {
                  console.log('page change exp!', {
                    exp: exp
                  });
                }
              });
            } else console.log("to same id: " + p.id);
          } else if (ids.length === 0 || ids.length > 0 && ids[ids.length - 1] !== p.id) {
            if (ids.length > 0) console.log("to id:" + ids[ids.length - 1] + " -> " + p.id);else console.log("to id:null -> " + p.id);
            ids.push(p.id);
          }
          var enter = function enter(d) {
            var _p$$el, _p$view;
            p.doReady = false;
            var v = $.id(p.id);
            if (!v) {
              v = _this8.vs[p.id];
              if (!v && d) {
                v = d;
                _this8.vs[p.id] = v;
                p.doReady = true;
              }
              if (v && _this8.view) {
                if (!_this8.vite) _this8.addCss(p);
                var $v = $(v);
                var pm = $v.hasClass('page-master');
                if ((_this8.backed || pm) && _this8.view.hasChild()) {
                  if (_this8.opt.className) $v.addClass("" + _this8.opt.className);
                  if (_this8.opt.prevClass && !pm) $v.addClass("" + _this8.opt.prevClass);
                  _this8.view.dom.insertBefore(v, _this8.view.lastChild().dom);
                } else {
                  if (_this8.opt.className) $v.addClass("" + _this8.opt.className);
                  if (_this8.opt.nextClass && !pm) $v.addClass("" + _this8.opt.nextClass);
                  _this8.view.dom.appendChild(v);
                }
              }
            }
            if (p.el !== v) p.el = v;
            if (p.dom !== v) p.dom = v;
            if (((_p$$el = p.$el) == null ? void 0 : _p$$el.dom) !== v) p.$el = $(v, true);
            if (((_p$view = p.view) == null ? void 0 : _p$view.dom) !== v) p.view = p.$el;
            if (!_this8.nextHash || _this8.nextHash === _this8.hash[_this8.hash.length - 1]) {
              _this8.switchPage(p, _this8.backed, lastHash);
            }
          };
          if (refresh) {
            var v = $.id(p.id);
            if (v) $.remove(v);
            v = _this8.vs[p.id];
            if (v) delete _this8.vs[p.id];
          }
          var onload = function onload(err, html) {
            if (html === void 0) {
              html = '';
            }
            if (err) throw err;
            var $v = $(html, true);
            $v.dom.id = p.id;
            p.view = $v;
            p.$el = $v;
            p.el = $v.dom;
            p.dom = $v.dom;
            _this8.vps.set(p.dom, p);
            enter(p.dom);
          };
          var nextPage = _this8.loaded(p);
          if (!nextPage) {
            onload(null, p.html);
          } else enter();
        }
      })["catch"](function (err) {
        return console.error('to err:', err);
      });
    };
    _proto.parseUrl = function parseUrl(url) {
      var R = {
        url: url
      };
      try {
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
        var ms = url.match(/([^/]+)\/([^/]+)\/([^?]+)/);
        if (ms) R.path = ms[3];
        if (url !== R.url) console.log("router parseUrl url:" + url + " -> " + R.url + " path:" + R.path);
      } catch (e) {
        console.error("router parseUrl exp:" + e.message);
      }
      return R;
    };
    _proto.findPage = function findPage(url, param, refresh) {
      if (refresh === void 0) {
        refresh = false;
      }
      var R = null;
      var rs = this.parseUrl(url);
      var p = this.ps[rs.url];
      if (!p) {
        console.log('findPage not find!', {
          url: url
        });
      } else {
        if (rs.param) p.param = _extends({}, rs.param);else p.param = {};
        if (param) $.assign(p.param, param);
        p.lastSearch = p.search;
        p.search = rs.search;
        p.refresh = refresh;
        R = p;
      }
      return R;
    };
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
    };
    _proto.cachePage = function cachePage(p) {
      try {
        if (!p) throw new Error('page is empty!');
        if (!p.url) throw new Error("page's url is empty!");
        p.id = "" + p.url.replace(/\//g, '-');
        if (p.id.startsWith('-')) p.id = p.id.substr(1);
        p.ready = p.ready || $.noop;
        p.router = this;
        this.ps[p.url] = p;
        return this;
      } catch (ex) {
        console.error("router.cachePage exp: " + ex.message);
      }
    };
    _proto.aniPage = function aniPage(from, to, dir, cb) {
      var _this9 = this;
      var aniClass = "router-transition-" + (dir || 'forward') + " router-transition";
      if ($.device.ios) {
        to.animationEnd(function () {
          _this9.view.removeClass(aniClass);
          if (cb) cb();
        });
      } else {
        var end = to;
        if (dir === 'backward') end = from;
        end.animationEnd(function () {
          _this9.view.removeClass(aniClass);
          if (cb) cb();
        });
      }
      this.view.addClass(aniClass);
    };
    _proto.hidePage = function hidePage(p, v) {
      if (!v || !p) return;
      try {
        v.removeClass(this.opt.showClass);
        v.removeClass(this.opt.prevClass);
        v.removeClass(this.opt.nextClass);
        try {
          if (p.hide) p.hide(v);
        } catch (exp) {
          console.log('page hide exp!', {
            exp: exp
          });
        }
        v.remove();
        this.removeCss(p);
      } catch (ex) {
        console.error('hidePage exp:', ex.message);
      }
    };
    _proto.onShow = function onShow(p, lastHash) {
      var _this10 = this;
      try {
        if (!p) return;
        var v = p.view;
        if (p.doReady) {
          if (p.ready) {
            $.nextTick(function () {
              try {
                p.ready(v, p.param, _this10.backed, lastHash);
              } catch (exp) {
                console.log('page ready exp!', {
                  exp: exp
                });
              }
              _this10.pageEvent('init', p, v);
              $.fastLink();
            });
          }
        }
        if (p.back && this.backed) {
          $.nextTick(function () {
            try {
              var _v$class, _v$class$dom, _p$scrollTop;
              if ((_v$class = v["class"]('page-content')) != null && (_v$class$dom = _v$class.dom) != null && _v$class$dom.scrollTop) v["class"]('page-content').dom.scrollTop = (_p$scrollTop = p.scrollTop) != null ? _p$scrollTop : 0;
              p.back(v, p.param, lastHash);
            } catch (exp) {
              console.log('page back exp!', {
                exp: exp
              });
            }
          });
        }
        if (p.show && !this.backed) {
          $.nextTick(function () {
            try {
              p.show(v, p.param, lastHash);
            } catch (exp) {
              console.log('page show exp!', {
                exp: exp
              });
            }
          });
        }
      } catch (ex) {
        console.error('onShow ', {
          ex: ex.message
        });
      }
    };
    _proto.showPage = function showPage(p) {
      if (p) {
        var v = p.view;
        v.removeClass(this.opt.nextClass);
        v.removeClass(this.opt.prevClass);
        if (v.hasClass('page-master') || v.hasClass('page-master-detail')) this.view.addClass('view-master-detail');else if (this.view.hasClass('view-master-detail')) this.view.removeClass('view-master-detail');
        if (!v.hasClass('page-master')) v.addClass(this.opt.showClass);
      }
    };
    _proto.switchPage = function switchPage(p, back, lastHash) {
      var _this11 = this;
      if (!p) return;
      try {
        var fp = null;
        var from = this.getCurrentPage();
        if (from) {
          from = $(from);
          if (from.hasClass('page-master')) from = null;else fp = this.vps.get(from.dom);
        }
        var to = $.id(p.id);
        if (to) {
          to = p.view;
          if (to.hasClass('page-master')) from = null;
        }
        if (from && to && from.dom === to.dom) return;
        var dir = back ? 'backward' : 'forward';
        if (from || to) {
          if (from && to) {
            if (this.noAni) {
              this.noAni = false;
              this.hidePage(fp, from);
              this.onShow(p, lastHash);
              this.showPage(p);
            } else {
              this.onShow(p, lastHash);
              this.aniPage(from, to, dir, function () {
                _this11.hidePage(fp, from);
                _this11.showPage(p);
              });
            }
          } else if (from) {
            this.hidePage(fp, from);
          } else if (to) {
            this.onShow(p, lastHash);
            this.showPage(p);
          }
        }
        setTitle(this.page.title);
        if (this.hash.length > 0) {
          var _this$param, _this$refresh;
          var _this$hash$slice = this.hash.slice(-1),
            hash = _this$hash$slice[0];
          if ((_this$param = this.param) != null && _this$param[hash]) delete this.param[hash];
          if ((_this$refresh = this.refresh) != null && _this$refresh[hash]) delete this.param[hash];
        }
      } catch (e) {
        console.error("switchPage exp:" + e.message);
      }
    };
    _proto.pageEvent = function pageEvent(ev, p, v) {
      try {
        if (!p || !v) return;
        var r = this;
        if (!v.length) return;
        var camelName = "page" + (ev[0].toUpperCase() + ev.slice(1, ev.length));
        var colonName = "page:" + ev.toLowerCase();
        var page = {
          $el: v,
          el: v.dom
        };
        if (ev === 'init') {
          if (v[0].f7PageInitialized) {
            v.trigger('page:reinit', page);
            r.emit('pageReinit', page);
            return;
          }
          v[0].f7PageInitialized = true;
        }
        v.trigger(colonName, page);
        r.app.emit("local::" + camelName, page);
      } catch (ex) {
        console.error("pageEvent exp:" + ex.message);
      }
    };
    return Router;
  }();
  function getHash(url) {
    if (!url) url = location.href;
    var pos = url.indexOf('#!');
    if (pos !== -1) pos++;else pos = url.indexOf('#');
    return pos !== -1 ? url.substring(pos + 1) : '';
  }
  function setHash(url) {
    var hash = url;
    if (url[0] !== '!') hash = "!" + url;
    location.hash = hash;
  }
  function setTitle(val) {
    if (document.title === val) return;
    document.title = val;
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
  Router["default"] = Router;

  return Router;

}));
