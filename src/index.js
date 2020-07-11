/**
 * 开放、互联 前端路由
 * First Version Released on: September 13,2016
 */

// 动画方式切换
// import $ from '@wiajs/dom';

/* global
 */

let location = window.location; // eslint-disable-line

const CFG = {
  sectionGroupClass: 'page-group',
  // 用来辅助切换时表示 page 是 visible 的,
  // 之所以不用 curPageClass，是因为 page-current 已被赋予了「当前 page」这一含义而不仅仅是 display: block
  // 并且，别的地方已经使用了，所以不方便做变更，故新增一个
  visiblePageClass: 'page-visible',
};

const DIRECTION = {
  leftToRight: 'from-left-to-right',
  rightToLeft: 'from-right-to-left',
};

const EVENTS = {
  pageLoadStart: 'pageLoadStart', // ajax 开始加载新页面前
  pageLoadCancel: 'pageLoadCancel', // 取消前一个 ajax 加载动作后
  pageLoadError: 'pageLoadError', // ajax 加载页面失败后
  pageLoadComplete: 'pageLoadComplete', // ajax 加载页面完成后（不论成功与否）
  pageAnimationStart: 'pageAnimationStart', // 动画切换 page 前
  pageAnimationEnd: 'pageAnimationEnd', // 动画切换 page 结束后
  beforePageRemove: 'beforePageRemove', // 移除旧 document 前（适用于非内联 page 切换）
  pageRemoved: 'pageRemoved', // 移除旧 document 后（适用于非内联 page 切换）
  // page 切换前，pageAnimationStart 前，beforePageSwitch后会做一些额外的处理才触发 pageAnimationStart
  beforePageSwitch: 'beforePageSwitch',
  pageInit: 'pageInitInternal', // 目前是定义为一个 page 加载完毕后（实际和 pageAnimationEnd 等同）
};

/**
 * a very simple router for the **demo** of [weui](https://github.com/weui/weui)
 */
class Router {
  // default option
  opt = {
    view: 'wia-view',
    style: 'wia-style',
    splashTime: 1000,
    className: 'page', // 创建内容层时需添加的样式
    nextClass: 'page-next', // page 切换新页面
    prevClass: 'page-previous', // page 切换旧页面
    showClass: 'page-current', // 显示内容层时添加的样式
    cos: 'https://cos.nuoya.net', //  'http://localhost:3003'
    ver: '1.0.0',
    mode: 'prod', // 打包代码， 是否压缩，生产  prod，调试 dev, 本地调试 local
    transition: 'f7-flip',
    owner: '', // 所有人
    name: '', // app name
  };

  _index = 1;

  // container element
  view = null;

  // 存放所有路由对象
  rs = [];
  // 缓存显示的页面
  ps = {};
  url = ''; // 当前路由所处的网址，实际上是hash部分！
  hash = []; // 带参数的完整hash数组，回退pop，前进push

  // start route config
  splash = false;

  /**
   * constructor
   * @param opt
   */
  constructor(opt) {
    // if (Router.instance) {
    //   throw new Error('Router is already initialized and can\'t be initialized more than once');
    // }
    // Router.instance = this; // 是否控制为单例？

    this.opt = $.assign({}, this.opt, opt);
    this.app = this.opt.app;
    this.app.router = this;
    this.view = $(`#${this.opt.view}`);
    this.style = null; // 新增样式 $.id(this.opt.style);
    this.lastStyle = null; // 即将清除的上一个样式
    this.param = {};
    this.page = null; // 当前 page 实例
    this.lastPage = null;
    // 方便全局访问
    $.view = this.view;
    $.router = this;

    // splash 开机画面不需要 动画
    this.splash = true;

    this.lastHash = ''; // 前hash
    this.hash = []; // hash数组
    this.nextHash = ''; // 需到达的 hash

    this.owner = this.opt.owner;
    this.name = this.opt.name;
    this.path = ''; // 页面路径，去掉参数部分

    this.lastOwner = '';
    this.lastName = '';
    this.lastPath = '';

    this.backed = false; // 是否为返回

    // why not `history.pushState`? see https://github.com/weui/weui/issues/26, Router in wechat webview
    // pushState 不支持 微信侧滑返回
    // 不带 hash 到 hash,返回时, 不能触发该事件,因此一开始就要设置 hash,否则无法回到 首页!
    // 监控url hash变化
    window.addEventListener(
      'hashchange',
      event => {
        const newHash = getHash(event.newURL);
        const oldHash = getHash(event.oldURL);
        // ???
        console.log(`router hash:${oldHash} -> ${newHash}`);

        // 将不合规范url修改为规范url
        let to = newHash || 'index';
        to = this.repairUrl(to);

        if (newHash !== to) {
          setHash(to);
          return;
        }

        // 如果不是绝对路径，则跳转到绝对路径
        // if (!newHash.startsWith('/')) {
        //   setHash(this.repairUrl(newHash));
        //   return;
        // }

        // 无变化
        if (newHash === oldHash) {
          this.nextHash = '';
          return;
        }

        // 记录当前 hash
        // this.lastHash = oldHash;
        // this.hash = newHash;

        this.backed = false; // 是否返回
        this.hash = this.hash || [];
        const hs = this.hash;
        if (
          !hs ||
          hs.length === 0 ||
          (hs.length > 0 && hs[hs.length - 1] !== newHash)
        ) {
          if (hs.length > 0)
            console.log(`hash:${hs[hs.length - 1]} -> ${newHash}`);
          else console.log(`hash:null -> ${newHash}`);

          hs.push(newHash);
        } else if (hs.length > 1 && hs[hs.length - 2] === newHash) {
          this.backed = true;
          console.log(`back hash:${hs[hs.length - 2]} <- ${newHash}`);
          hs.pop();
        } else if (hs.length > 0 && hs[hs.length - 1] === newHash)
          console.log(`same hash: ${newHash}`);

        // const state = history.state || {};
        // this.to(hash, state._index <= this._index);
        this.routeTo(hs[hs.length - 1], this.param, this.refresh); //  , oldHash);
        this.refresh = false;
        this.param = null;
        this.nextHash = '';
      },
      false
    );
  }

  /**
   * 导航并传递对象参数, 更改当前路由 为 指定 路由，hash 直接导航只能传字符参数,不能传对象参数
   * @param url hash
   * @param param 对象参数 {name: val}，不是字符串！
   * @param refresh 是否强制刷新, 默认跳转时，如果目的页面已经缓存，则直接显示，触发show事件，不会触发load和ready，
   * 如果设置为true，则跳转时，如果有缓存，则删除缓存，重新 触发 load、ready
   */
  go(url, param = null, refresh = false) {
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
    // debugger
    // 默认跳转到首页
    url = url || 'index';
    url = this.repairUrl(url);

    // console.log('go ', {url, param, refresh, href: location.href});

    // 当前网页重新加载，不会触发 hash 事件，直接路由
    if (getHash(location.href) === url) {
      // `#${url}`;
      this.nextHash = getHash(url);
      if (this.hash[this.hash.length - 1] !== this.nextHash)
        this.hash.push(this.nextHash);
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
  repairUrl(url) {
    let R = '';

    if (!url) return '';

    try {
      R = url;

      if (url === '/') R = '/';
      else if (url === '~') R = `/${this.owner}/${this.name}/index`;
      else if (url.startsWith('./'))
        R = `/${this.owner}/${this.name}/${this.path}/${url.substr(2)}`;
      // else if (url.startsWith('../'))
      //   R = url.replace(/\.\.\//, `/${this.opt.owner}/`);
      else if (!url.startsWith('/')) R = `/${this.owner}/${this.name}/${url}`;
      // 绝对路径 /ower/app?a=1 => /ower/app/index?a=1
      // /ower/app => /ower/app/index
      // /ower/app/ => /ower/app/index
      else if (url.startsWith('/')) {
        // 自动补充 index
        const ps = url.match(/([^/]+)\/([^/]+)\/?([^?]*)([\s\S]*)/);
        // default to index
        if (ps) {
          const owner = ps[1];
          const name = ps[2];
          const page = ps[3];
          if (owner && name && !page) R = `/${owner}/${name}/index${ps[4]}`;
        }
      }

      // R = url.endsWith('/') ? url.substr(0, url.length - 1) : url;
      // / 结尾，代表目录，自动加载 index
      // /ower/app/fea/ => /ower/app/fea/index
      R = R.endsWith('/') ? `${R}index` : R;
      // /ower/app/fea/?a=1 => /ower/app/fea/index?a=1
      R = R.replace(/\/\?/g, 'index?');

      if (R !== url) console.log(`router repairUrl:${url} -> ${R}`);
    } catch (e) {
      console.error(`router repairUrl exp:${e.message}`);
    }

    return R;
  }

  back(param, refresh = false) {
    this.param = param;
    this.refresh = refresh;

    window.history.back();
  }

  /**
   * 判断页面是否已加载过
   */
  loaded(r) {
    return $.id(r.id) || this.ps[r.id];
  }

  /**
   * 动态下载页面js，里面包括js、html和css
   * 本地调试，则动态从本地下载html、css
   * @param {*} url 加载页面网址，格式：/ower/appname/page
   * 返回 promise
   */
  load(url, param) {
    let R = null;

    try {
      R = new Promise((res, rej) => {
        // console.log(`router load url:${url}`);
        // const pos = path.lastIndexOf('/');
        // const name = path.substr(pos + 1);

        const ps = url.match(/([^/]+)\/([^/]+)\/?([^?]*)/);

        // const ps = url.match(/([^/]+)\/([^/]+)\/?([^?]*)([\s\S]*)/);
        const owner = ps?.[1];
        const name = ps?.[2];
        let page = ps?.[3];
        if (owner && name && !page) page = 'index';
        let path = '';
        if (page && page.includes('/')) {
          const pos = page.lastIndexOf('/');
          path = page.substr(0, pos);
        }

        console.log('load', {owner, name, page, path});

        // 本地调试状态，直接获取本地页面
        if (this.opt.mode === 'local') {
          // debugger;
          // 加载 app
          let appJs = null;
          let appCss = null;
          // 切换应用
          /*
          if (ower !== this.opt.owner || name !== this.opt.name) {
            appJs = new Promise((resJs, rejJs) => {
              const url = `${this.opt.local}/index2.js?v=${Date.now()}`;
              $.get(url).then(
                rs => {
                  // debugger;
                  console.log('router load index2.js', {url, rs});
                  resJs(rs); // eslint-disable-line
                },
                err => rejJs(err)
              );
            });

            appCss = new Promise((resCss, rejCss) => {
              const url = `${this.opt.local}/index.css?v=${Date.now()}`;
              $.get(url).then(
                rs => {
                  // debugger;
                  console.log('router load index.css', {url, rs});
                  resCss(rs); // eslint-disable-line
                },
                err => rejCss(err)
              );
            });
          }
          */
          // 静态资源浏览器有缓存,增加日期时标,强制按日期刷新!
          const pgHtml = new Promise((resHtml, rejHtml) => {
            const pgurl = `${this.opt.local}/page/${page}.html?v=${Date.now()}`;
            // console.log('router load html:', {url: pgurl});
            $.get(pgurl).then(
              rs => {
                // debugger;
                // console.log('router load html:', {url: pgurl, rs});
                // 获得模块对象
                const Cls = __webpack_require__(`./src/page/${page}.js`); // eslint-disable-line
                const p = new Cls.default({app: this.app}); // eslint-disable-line

                // 未考虑切换应用和owner，保存
                if (owner) {
                  if (this.owner !== this.lastOwner)
                    this.lastOwner = this.owner;
                  this.owner = owner;
                }
                if (name) {
                  if (this.name !== this.lastName) this.lastName = this.name;
                  this.name = name;
                }
                if (path) {
                  if (this.path !== this.lastPath) this.lastPath = this.path;
                  this.path = path;
                }

                p.html = rs;
                p.url = `/${owner}/${name}/${page}`;
                p.param = param;
                this.push(p); // save page instance
                resHtml(p);
              },
              err => rejHtml(err)
            );
          });

          const pgCss = new Promise((resCss, rejCss) => {
            const pgurl = `${this.opt.local}/page/${page}.css?v=${Date.now()}`;
            // console.log(`router load css:${url}`);
            $.get(pgurl).then(
              rs => {
                // debugger;
                // console.log('router load css:', {url: pgurl, rs});
                resCss(rs);
              },
              err => rejCss(err)
            );
          });

          if (appJs) {
            Promise.all([appJs, appCss])
              .then(rs => {
                // 切换 app
                if (owner) {
                  if (this.owner !== this.lastOwner)
                    this.lastOwner = this.owner;
                  this.owner = owner;
                }
                if (name) {
                  if (this.name !== this.lastName) this.lastName = this.name;
                  this.name = name;
                }
                this.rs = [];

                eval(rs[0]); // eslint-disable-line
                const appcss = rs[1];

                Promise.all([pgHtml, pgCss])
                  .then(rs2 => {
                    const p = rs2[0];
                    p.css = rs2[1];
                    // 触发 load 事件
                    if (p.load) p.load(param);

                    res(p);
                  })
                  .catch(err => rej(err));
              })
              .catch(err => rej(err));
          } else {
            Promise.all([pgHtml, pgCss])
              .then(rs => {
                const p = rs[0];
                p.css = rs[1];
                // 触发 load 事件
                if (p.load) p.load(param);

                res(p);
              })
              .catch(err => rej(err));
          }
        } else {
          url = `${url.substring(1, pos)}/page/${page}`;
          // 静态资源浏览器有缓存,增加日期时标,强制按日期刷新!
          const pgurl = `${this.opt.cos}/${url}.js?v=${this.opt.ver}`;
          $.get(pgurl).then(
            rs => {
              // debugger;
              // console.log(rs);
              const r = JSON.parse(rs);
              if (r && r.js) {
                const k = Object.keys(r.js)[0];
                const code = r.js[k];
                $._m.add(r.js);
                // console.log(r.js);
                const P = $._m(k); // 加载该模块
                const p = new P.default(); // eslint-disable-line
                p.html = r.html;
                p.css = r.css;
                p.param = param;
                $.router.push(p);

                // 触发 load 事件
                if (p.load) p.load(param);

                res(p);
              }
            },
            err => rej(err)
          );
        }
      });
    } catch (e) {
      console.error(`load exp:${e.message}`);
    }

    return R;
  }

  addCss(css) {
    const el = document.createElement('style');
    // el.id = 'wia-style-next';
    if (this.style) this.lastStyle = this.style;
    this.style = el;
    $('head').append(el);
    this.style.innerHTML = css;
  }

  removeCss() {
    if (this.lastStyle && this.lastStyle.parentNode)
      this.lastStyle.parentNode.removeChild(this.lastStyle);
  }

  /**
   * route to the specify url, 内部访问
   * @param {String} url
   * @param {Object} 参数对象
   * @returns {Router}
   */
  routeTo(url, param, refresh) {
    console.log('routeTo ', {url, param, refresh});

    let r = this.findRoute(url, param, refresh);
    if (r) this.to(r, refresh);
    else {
      // 静态资源浏览器有缓存,增加日期时标,强制按日期刷新!
      // 没有缓存，则动态加载
      this.load(url, param).then(lr => {
        r = this.findRoute(url, param, refresh);
        if (r) this.to(r, refresh);
      });
    }
  }

  /**
   * 切换到指定页面
   * @param {*} r
   */
  to(r, refresh) {
    if (!r) {
      console.error('route to null page.');
      return this;
    }

    // 记录当前 route
    this.lastPage = this.page;
    // 记录当前 scrollTop
    if (this.lastPage)
      this.lastPage.scrollTop = this.lastPage.el.clas(
        'page-content'
      ).dom.scrollTop;
    this.page = r;
    $.page = this.page;
    $.lastPage = this.lastPage;

    // alert(`routeTo url:${r.url}`);

    // 返回还是前进
    this.lasts = this.lasts || [];
    const rs = this.lasts;
    this.backed = false;
    // 如果切换的是前一个page，则为回退！
    if (rs.length > 1 && rs[rs.length - 2].id === r.id) {
      this.backed = true;
      console.log(`to back id:${rs[rs.length - 2].id} <- ${this.lastPage.id}`);
      rs.pop();
    } else if (rs.length > 0 && rs[rs.length - 1].id === r.id) {
      console.log(`to same id: ${r.id}`);
    } else if (
      rs.length === 0 ||
      (rs.length > 0 && rs[rs.length - 1].id !== r.id)
    ) {
      if (rs.length > 0)
        console.log(`to id:${rs[rs.length - 1].id} -> ${r.id}`);
      else console.log(`to id:null -> ${r.id}`);

      rs.push(this.page);
    }

    // 进入跳转的页面
    const enter = pg => {
      r.doReady = false;

      // 页面上是否存在，已经隐藏
      let p = $.id(r.id);
      // debugger;
      // 页面上不存在，则从缓存获取，并加载到主页面
      if (!p) {
        // 从缓存加载
        p = this.ps[r.id];
        if (!p && pg) {
          p = pg;
          // 缓存页面
          this.ps[r.id] = p;
          r.doReady = true;
        }

        if (p) {
          // back 插在前面
          // forward添加在后面，并移到左侧
          if (this.view) {
            // this.style.href = r.style;
            this.addCss(r.css); // 准备 css
            const $p = $(p);
            if (this.backed && this.view.hasChild()) {
              if (this.opt.className) $p.addClass(`${this.opt.className}`);
              if (this.opt.prevClass) $p.addClass(`${this.opt.prevClass}`);
              this.view.dom.insertBefore(p, this.view.dom.children[0]);
            } else {
              if (this.opt.className) $p.addClass(`${this.opt.className}`);
              if (this.opt.nextClass) $p.addClass(`${this.opt.nextClass}`);
              this.view.dom.appendChild(p);
            }
          }

          if (r.doReady) $.fastLink(); // 对所有 link 绑定 ontouch，消除 300ms等待
        }
      }

      // 记录当前层
      r.page = p;
      r.el = $(p);

      // 动画方式切换页面，如果页面在 ready 中被切换，则不再切换！
      // 应该判断 hash 是否已经改变，如已改变，则不切换
      // alert(`hash:${this.hash} => ${this.nextHash}`);
      if (!this.nextHash || this.nextHash === this.hash[this.hash.length - 1]) {
        this.switchPage(this.lastPage, r, this.backed);
      }
    };

    // 强制刷新，删除存在页面及缓存
    if (refresh) {
      let p = $.id(r.id);
      if (p) $.remove(p);

      // 删除缓存
      p = this.ps[r.id];
      if (p) delete this.ps[r.id];
    }

    // 加载页面视图回调
    const onload = (err, html = '') => {
      if (err) throw err;
      // console.log('onload html:', html);

      // 创建 页面层
      const p = $(html);
      r.view = p; // dom 对象保存到页面实体的view中
      p.dom.id = r.id;

      // 缓存页面
      // this._pages[r.id] = p;
      enter(p.dom);
    };

    const nextPage = this.loaded(r);
    const curPage = this.getCurrentPage();

    // 页面不存在则加载页面
    if (!nextPage) {
      onload(null, r.html);
      // if (r.load) // 加载视图
      //   r.load.then((html) => {onload(null, html)});
      // else if (r.view) // 兼容
      //   r.view(onload);
      // else
      //   throw new Error(`route ${r.id} hasn't load function!`);
    } else enter(); // 存在则直接进入

    return this;
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
  parseUrl(url) {
    const R = {url};

    try {
      // 把?后面的内容作为 search 参数处理，？需包含在hash中，也就是 # 之后
      let pos = url.indexOf('?');
      if (pos >= 0) {
        R.url = url.substr(0, pos);
        R.search = url.substr(pos + 1);
        if (R.search) {
          R.param = {};
          const ps = R.search.split('&');
          ps.forEach(p => {
            pos = p.indexOf('=');
            if (pos > 0) R.param[p.substr(0, pos)] = p.substr(pos + 1);
          });
        }
      }
      R.url = this.repairUrl(R.url);

      // if (R.path.startsWith('../')) {
      //   R.path = R.path.replace('../', `/${this.opt.owner}/`);
      // }
      // else if (!R.path.startsWith('/'))
      //   R.path = `/${this.opt.owner}/${this.opt.name}/${R.path}`;
      if (url !== R.url) console.log(`router parseUrl url:${url} -> ${R.url}`);
    } catch (e) {
      console.error(`router parseUrl exp:${e.message}`);
    }

    return R;
  }

  /**
   * get route from routes filter by url
   * @param {String} url /ower/name/page
   * @param {Object} param
   * @returns {Object}
   */
  findRoute(url, param, refresh) {
    let R = null;

    const rs = this.parseUrl(url);

    // for (let i = 0, len = this.rs.length; i < len; i++) {
    const r = this.rs.find(rt => rt.url === rs.url);
    if (!r) {
      console.log('findRoute not find!', {url});
    } else {
      if (rs.param) r.param = {...rs.param};
      else r.param = {};

      if (param) $.assign(r.param, param);

      // 记录当前 path
      r.path = rs.path;
      r.url = url;
      r.lastSearch = r.search;
      r.search = rs.search;
      r.refresh = refresh;

      R = r;
    }

    return R;
  }

  /**
   * push page into router's array
   * @param {Object} r
   * @returns {Router}
   */
  push(r) {
    try {
      if (!r) throw new Error('page is empty!');

      if (!r.url) throw new Error("page's url is empty!");

      const exist = this.rs.find(rt => rt.url === r.url);
      if (exist) {
        console.info(`push r.url:${r.url} exist.`);
        return;
      }

      // 按url自动生成唯一id，该id作为Dom页面的id属性
      r.id = `${r.url.replace(/\//g, '-')}`;
      if (r.id.startsWith('-')) r.id = r.id.substr(1);
      // 将 path 转换为绝对路径
      // r.path = `/${this.opt.owner}/${this.opt.name}/${r.path}`;
      r.ready = r.ready || $.noop;
      r.router = this;
      /*
       const r = Object.assign({}, {
       path: '*',
       // view: $.noop,
       ready: $.noop
       }, route);
       */
      this.rs.push(r);

      console.debug(`router push r.url:${r.url} succ.`);

      return this;
    } catch (ex) {
      alert(`router.push exp: ${ex.message}`);
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
  aniPage(from, to, dir, cb) {
    const aniClass = `router-transition-${dir || 'forward'} router-transition`;

    // console.log('aniPage ', {aniClass});

    // 动画结束，去掉 animation css 样式
    if ($.device.ios) {
      to.animationEnd(() => {
        // console.log('animation end.');
        this.view.removeClass(aniClass);
        // from.removeClass('page-previous');
        if (cb) cb();
      });
    } else {
      let end = to;
      if (dir === 'backward') end = from;

      // md to's animation: none, only from's animation
      end.animationEnd(() => {
        // console.log('animation end.');
        this.view.removeClass(aniClass);
        // from.removeClass('page-previous');
        if (cb) cb();
      });
    }

    // console.log('animation start...');
    // Add class, start animation
    this.view.addClass(aniClass);
  }

  /**
   * 获取当前显示的第一个 section
   *
   * @returns {*}
   * @private
   */
  getCurrentPage = () => $.qu(`.${this.opt.showClass}`);

  /**
   * 显示新页面时，卸载当前页面，避免页面上相同id冲突
   * @param {*} r 卸载路由
   * @param {*} p 卸载页面
   */
  hidePage(r, p) {
    if (!p || !r) return;

    p.removeClass(this.opt.showClass);
    p.removeClass(this.opt.prevClass);
    p.removeClass(this.opt.nextClass);

    // 触发隐藏事件
    if (r.hide) r.hide(p);

    // 缓存当前 page
    if (r.lastPage) this.ps[r.lastPage.id] = p;

    p.remove();
    this.removeCss();
  }

  /**
   * 启动动画前调用show/ready事件,在页面显示前,准备好页面
   * 如果在动画后调用,会先看到旧页面残留,体验不好
   * 上个页面和当前页面同时存在,如果存在相同id,可能会有问题.
   * 获取dom 元素时,最好限定在事件参数pg范围获取.
   * @param {*} r 路由
   * @param {*} p 页面，Dom 对象
   */
  onShow(r, p) {
    try {
      if (!r) return;

      // 重新绑定事件
      if (r.doReady && r.ready) {
        // 如果不使用延时，加载无法获取dom节点坐标！
        //  node.getBoundingClientRect().top node.offsetTop 为 0，原因未知！！！
        $.nextTick(() => {
          r.ready(p, r.param, this.backed);
        });
        // r.ready(p, r.param);
      }

      // 触发
      if (r.show) {
        $.nextTick(() => {
          if (this.backed && r.scrollTop)
            p.clas('page-content').dom.scrollTop = r.scrollTop;
          r.show(p, r.param, this.backed);
        });
      }
      // r.show(p, r.param);
    } catch (ex) {
      console.error('onShow ', {ex: ex.message});
    }
  }

  /**
   * 显示新页面
   * @param {*} lastr 上一个路由
   * @param {*} r 当前路由
   * @param {*} p 当前页面
   */
  showPage(r, p) {
    if (p) {
      p.removeClass(this.opt.nextClass);
      p.removeClass(this.opt.prevClass);
      p.addClass(this.opt.showClass);
    }

    //$to.trigger(EVENTS.pageAnimationEnd, [to.id, to]);
    // 外层（init.js）中会绑定 pageInitInternal 事件，然后对页面进行初始化
    //$to.trigger(EVENTS.pageInit, [to.id, to]);
  }

  /**
   * 切换页面
   * 把新页从右边切入展示，同时会把新的块的记录用 history.pushState 来保存起来
   * 如果已经是当前显示的块，那么不做任何处理；
   * 如果没对应的块，忽略。
   * @param {Router} r 待切换的路由
   * @param {String} back 是否返回
   * @private
   */
  switchPage(lastr, r, back) {
    if (!r) return;

    let from = this.getCurrentPage();
    if (from) from = $(from);

    let to = $.id(r.id);
    if (to) to = $(to);

    // 如果已经是当前页，不做任何处理
    if (from && to && from.dom === to.dom) return;

    const dir = back ? 'backward' : 'forward';
    if (from || to) {
      // 页面切换动画
      if (from && to) {
        // 开机splash不需要动画
        if (this.noAni) {
          this.noAni = false;
          this.hidePage(lastr, from);
          this.onShow(r, to);
          this.showPage(r, to);
        } else {
          // 需要动画，先触发show事件
          this.onShow(r, to); // 提前处理，切换效果好
          this.aniPage(from, to, dir, () => {
            // 动画结束
            this.hidePage(lastr, from);
            this.showPage(r, to);
          });
        }
      } else if (from) {
        this.hidePage(lastr, from);
      } else if (to) {
        this.onShow(r, to);
        this.showPage(r, to);
      }
    }
    setTitle(this.page.title);
    // this.pushNewState('#' + sectionId, sectionId);
  }
}

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

  let pos = url.indexOf('#!');
  if (pos !== -1) pos++;
  else pos = url.indexOf('#');

  return pos !== -1 ? url.substring(pos + 1) : ''; // ??? '/'
}

// google 支持 #! 格式，百度浏览器修改hash无效
function setHash(url) {
  let hash = url;
  if (url[0] !== '!') hash = `!${url}`;
  // console.log('setHash...', {url, href: location.href, hash: location.hash});
  location.hash = hash; // modify invalid
  // $.nextTick(() => (location.hash = hash));
  // location.href = location.href.replace(/#[\s\S]*/i, hash);
  // console.log('setHash.', {url, href: location.href, hash: location.hash});
}

/**
 * 修改微信 title
 */
function setTitle(val) {
  if (document.title === val) return;

  if (/MicroMessenger/i.test(navigator.userAgent)) {
    setTimeout(() => {
      // 利用iframe的onload事件刷新页面
      document.title = val;

      const fr = document.createElement('iframe');
      // fr.style.visibility = 'hidden';
      fr.style.display = 'none';
      fr.src = 'img/favicon.ico';
      fr.onload = () => {
        setTimeout(() => {
          document.body.removeChild(fr);
        }, 0);
      };
      document.body.appendChild(fr);
    }, 0);
  } else document.title = val;
}

/**
 * 获取一个 url 的基本部分，即不包括 hash
 *
 * @param {String} url url
 * @returns {String}
 */
function getBaseUrl(url) {
  const pos = url.indexOf('#');
  return pos === -1 ? url.slice(0) : url.slice(0, pos);
}

$.go = (url, param = null, refresh = false) => {
  $.router.go(url, param, refresh);
};

$.back = (param, refresh = false) => {
  $.router.back(param, refresh);
};

export {Router};
