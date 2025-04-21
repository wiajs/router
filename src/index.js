/**
 * wia 前端路由
 * First Version Released on: September 13,2016
 * Copyright © 2014-2021 Sibyl Yu
 */

/** {*} */
// @ts-ignore
const $ = window.$
/** {*} */
// @ts-ignore
const __m__ = window.__m__
let location = window.location // eslint-disable-line

const CFG = {
  sectionGroupClass: 'page-group',
  // 用来辅助切换时表示 page 是 visible 的,
  // 之所以不用 curPageClass，是因为 page-current 已被赋予了「当前 page」这一含义而不仅仅是 display: block
  // 并且，别的地方已经使用了，所以不方便做变更，故新增一个
  visiblePageClass: 'page-visible',
}

const DIRECTION = {
  leftToRight: 'from-left-to-right',
  rightToLeft: 'from-right-to-left',
}

const API = {
  getCode: 'auth/getCode', // 获取当前登录用户临时code
  getToken: 'auth/getToken', // 获取指定应用token
  checkToken: 'auth/checkToken', // 指定应用token
}

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
}

const LoginType = {
  site: 0, // 根据siteType
  pwd: 1, // 密码
  sms: 2, // 短信验证
  email: 3, // 邮箱验证
  code: 4, // wia code
  sign: 5, // 密钥签名，后端
  wia: 6, // wia OAuth
  wx: 7, // 微信 OAuth，如：服务号
  wxqy: 8, // 微信企业号
  wxapp: 9, // 微信小程序
  bd: 10, // 百度 OAuth
  ms: 11, // 微软 OAuth
  gg: 12, // 谷歌 OAuth
  ap: 13, // 苹果 OAuth
  fb: 14, // facebook OAuth
  gh: 15, // github OAuth
  fs: 16, // 飞书 OAuth
}

/**
 * @typedef {object} Opts
 * @prop {string} el - 应用容器
 * @prop {string} view - 应用视图
 * @prop {string} cos - 资源网址
 * @prop {string} ver
 * @prop {string} mode - 本地调试时，需设置为 local，生产发布时需设置为 pub
 * @prop {string} [owner] - 自动加载应用作者，可选，自动加载 page/index，需确保存在！！！
 * @prop {string} [name] -  自动加载应用名称，
  // pages: vite ? pages : undefined, // 用于 vite 本地调试
 */

// default option
const def = {
  el: '#wia-app',
  view: 'wia-view',
  style: 'wia-style',
  splashTime: 1000,
  className: 'page', // 创建内容层时需添加的样式
  nextClass: 'page-next', // page 切换新页面
  prevClass: 'page-previous', // page 切换旧页面
  showClass: 'page-current', // 显示内容层时添加的样式
  cos: 'https://cos.wia.pub', //  'http://localhost:3003'
  ver: '1.0.2',
  mode: 'local', // 本地调试时，需设置为 local，生产发布时需设置为 pub
  transition: 'f7-flip',
  api: {
    host: 'https://wia.pub',
    token: 'auth/login',
    login: 'auth/login', // 获取身份token
    logout: 'auth/logout', // 登出
    getCode: 'auth/getCode', // 获取当前登录用户临时code
    getToken: 'auth/getToken', // 获取指定应用token
    checkToken: 'auth/checkToken', // 指定应用token
    userInfo: 'user/info',
  },
}

/**
 * wia router
 * router为wia应用全局应用，存在实例变量
 * 不推荐并发go，如多个页面，请在第一个页面的show或ready中，go另外一个页面！
 */
class Router {
  _index = 1

  // container element
  /** @type {*} */
  view = null

  // 缓存所有app实例
  /** @type {*} */
  apps = {}
  // 缓存所有page实例
  ps = {}
  /** @type {string[]} */
  ids = [] // 页面id
  // 缓存所有Page中的dom视图，不是$dom
  vs = {}
  vps = new Map() // dom page 映射，通过 dom对象查找page实例！

  url = '' // 当前路由所处的网址，实际上是hash部分！

  // start route config
  // splash 开机画面不需要 动画
  splash = true

  /** @type {*} */
  app
  owner = ''
  appName = ''
  path = '' // 当前应用路径，去掉参数部分，不包括页面文件，a/b/c/1.html?x=1 为：c
  lastOwner = '' // 上一个应用所有者
  lastName = '' // 上一个应用名称
  lastPath = '' // 上一个应用路径
  /** @type {*} */
  param = {} // 页面传递参数，按hash存储的kv，避免连续go时param丢失！
  /** @type {*} */
  refresh = {}
  /** @type {*} */
  page = null // 当前 page 实例

  /** @type {string[]} */
  hash = [] // 带参数的完整hash数组，回退pop，前进push 记录应用 导航路径，go 增加、back 减少
  lastHash = '' // 前hash
  nextHash = '' // 需到达的 hash

  backed = false // 是否为返回
  init = true // 第一个应用，需初始化
  vite = false

  /**
   * constructor
   * @param {Opts} opts
   */
  constructor(opts) {
    // if (Router.instance) {
    //   throw new Error('Router is already initialized and can\'t be initialized more than once');
    // }
    // Router.instance = this; // 是否控制为单例？
    const _ = this
    const opt = {...def, ...opts}
    _.opt = opt
    // this.app = this.opt.app;
    // this.app.router = this;
    _.view = $(`#${_.opt.view}`)
    // _.pages = opt.pages // vite 调试需要
    // if (opt.pages) _.vite = true // vite 调试模式
    _.lastPage = null // 上一个 page 实例
    _.lastApp = null // 上一个应用实例

    // 方便全局访问
    $.view = _.view // $化视图
    $.router = _ // 全局路由

    // why not `history.pushState`? see https://github.com/weui/weui/issues/26, Router in wechat webview
    // pushState 不支持 微信侧滑返回
    // 不带 hash 到 hash,返回时, 不能触发该事件,因此一开始就要设置 hash,否则无法回到 首页!

    // 监控浏览器 url hash变化
    window.addEventListener(
      'hashchange',
      event => {
        const newHash = getHash(event.newURL)
        const oldHash = getHash(event.oldURL)
        // ???
        console.log(`router hash:${oldHash} -> ${newHash}`)

        let to = newHash || 'index'
        // 将不合规范url修改为规范url，/owner/name/index -> ''
        to = _.repairUrl(to)

        // 如不一致，重设 hash
        if (newHash !== to) {
          _.setHash(to)
          return
        }

        // 如果不是绝对路径，则跳转到绝对路径
        // if (!newHash.startsWith('/')) {
        //   setHash(this.repairUrl(newHash));
        //   return;
        // }

        // hash无变化，当前页面刷新
        if (newHash === oldHash) {
          _.nextHash = ''
          return
        }

        // 记录当前 hash
        // this.lastHash = oldHash;
        // this.hash = newHash;

        _.backed = false // 是否返回
        _.hash = _.hash || []
        const hs = _.hash
        const hslen = hs.length
        _.lastHash = hslen > 0 ? hs[hslen - 1] : undefined // 不能为空

        // 新的 hash
        if (hslen > 1 && hs[hslen - 2] === newHash) {
          // 回退
          _.backed = true
          console.log(`hash:${newHash} <- ${_.lastHash}`)
          // 删除 最后 hash
          hs.pop()
        } else if (_.lastHash === newHash)
          console.log(`hash: == ${newHash}`) // same
        else if (_.lastHash !== newHash) {
          console.log(`hash:${_.lastHash} -> ${newHash}`)
          hs.push(newHash)
        }
        // const state = history.state || {};
        // this.to(hash, state._index <= this._index);
        ;[to] = hs.slice(-1)
        to = to ?? newHash
        // console.log('hashchange', {to});
        const refresh = _.refresh?.[to] ?? false
        if (_.refresh?.[to]) _.refresh[to] = false

        _.routeTo(to, _.param?.[to], refresh, _.lastHash) //  , oldHash);

        _.nextHash = ''
      },
      false
    )

    // 当前 hash
    let hash = getHash()
    /** @type {*} */
    let param = $.urlParam() // hash 前 或 后的参数，已使用 decodeURIComponent 解码

    // 微信跳转，没有hash、有state和code（微信入口），从state中解析路由
    if (!hash && param?.state) {
      const {state} = param

      // 处理应用路由，包括登录、master-detail、缺省路由等
      /** @type {*} */
      let v = {}
      // 微信网页授权参数在state中传递，应用show可修改state
      const vs = state.split('&')
      vs.forEach(p => {
        const arr = p.split('=')
        v[arr[0]] = arr[1]
      })

      // 从 state 中还原 param
      let para = {}
      if (v.param) {
        try {
          para = JSON.parse(v.param)
          delete v.param
        } catch {}
      }

      // 这些参数可在微信公众号菜单中对应的链接中设置，微信会通过url转发到应用中
      param = {...param, ...v, ...para}

      hash = v.hash
      if (hash) {
        hash = _.repairUrl(hash)
        delete param.hash
      }
      if (state) delete param.state
      // 参数已解析到hash 和 param，清除网址中的 search
      const url = new URL(window.location.href)
      url.search = '' // 清空所有 search 参数
      url.hash = hash
      history.replaceState(null, '', url.toString()) // 更新 URL，不刷新页面
    }

    // 有hash，跳过启动应用（wia store），直接进入hash指定应用（创建）
    if (hash) {
      console.log('router start', {hash, param})
      // 将不合规范url修改为规范url
      const to = _.repairUrl(hash)
      // 由 hash 触发路由，包括 owner/name/index -> ''
      if (hash !== to) _.setHash(to, param, true)
      else {
        _.hash.push(to)

        // const state = history.state || {};
        // this.to(hash, state._index <= this._index);[to] = hs.slice(-1)
        // console.log('hashchange', {to});
        // const param = $.urlParam()
        _.routeTo(to, param, true) // 首次启动，刷新
        _.nextHash = ''
      }
    } else if (opt.owner && opt.name) {
      // 不带hash，启动路由中传入的应用
      ;(async () => {
        console.log('router start', {app: `/${opt.owner}/${opt.name}`, hash: '', param})
        // 启动应用，无hash，如传入 owner、name，则创建指定应用，触发应用生命周期，默认加载 page/index页面
        await _.switchApp(opt.owner, opt.name, '', param)
      })()
    }
  }

  /**
   * 导航并传递对象参数, 更改当前路由 为 指定 路由
   * 网址 hash 直接导航只能传字符参数,不能传对象参数
   * @param {string} url hash
   * @param {object} [param] 对象参数 {name: val}，不是字符串！
   * @param {boolean} [refresh] 是否强制刷新, 默认跳转时，如果目的页面已经缓存，则直接显示，触发show事件，不会触发load和ready，
   * 如果设置为true，则跳转时，如果有缓存，则删除缓存，重新 触发 load、ready
   */
  go(url, param = null, refresh = false) {
    const _ = this
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
    // 空路由到首页
    url = url || 'index'
    url = _.repairUrl(url)

    // console.log('go ', {url, param, refresh, href: location.href});

    // 刷新当前网页重新加载应用，不会触发 hashchange事件，当前hash作为第一个路由点
    if (getHash(location.href) === url) {
      // `#${url}`;
      _.nextHash = url
      if (!_.hash.length || _.hash[_.hash.length - 1] !== _.nextHash) _.hash.push(_.nextHash)
      _.routeTo(url, param, refresh)
    } else {
      // 切换页面hash，通过 hash变化事件来路由
      _.setHash(url, param, refresh)
    }
  }

  /**
   * 全屏模式不能跨网页，因此不同应用只能用不同hash区分
   * 路由仅接受绝对hash，自动将相对path转换为绝对hash
   * 保留 search
   * http://wia.pub/#codecamp -> http://wia.pub/#/nuoya/camp/  快链
   * http://wia.pub/#/nuoya/camp -> http://wia.pub/#/nuoya/camp/
   * http://wia.pub/#/nuoya/camp/index -> http://wia.pub/#/nuoya/camp/
   * 对于启动router的应用
   * go('index') -> http://wia.pub/#/nuoya/store/index -> http://wia.pub
   * $.go('b') 转换为 $.go('/star/etrip/b')
   * 实际网址 https://wia.pub/#!/ower/name/b
   * $.go('/') 切换到当前路径的根路径：wia.pub/#/ower/name，
   * 在网址上输入 https://wia.pub/#b -> https://wia.pub/#/ower/name/b 当前应用自动补全
   * @param {string} url
   * @returns {string}
   */
  repairUrl(url) {
    let R = ''
    const _ = this
    const {opt} = _

    if (!url) return ''
    try {
      R = url

      // 快链
      if (url === 'codecamp') R = '/nuoya/camp/course/'
      else if (url === '~') {
        // 首页
        if (_.owner && _.appName) {
          // 启动应用
          if (_.owner === opt.owner && _.appName === opt.name) R = ''
          else R = `/${_.owner}/${_.appName}/`
        }
      } else if (url.startsWith('../')) {
        // 上一级路径
        let {path} = this
        let pos = this.path.lastIndexOf('/')
        if (pos > -1) {
          path = path.substring(0, pos)
          pos = this.path.lastIndexOf('/')
          if (pos > -1) path = path.substring(0, pos)
          else path = ''
        } else path = ''

        if (path === '') R = `/${this.owner}/${this.appName}/${url.substr(3)}`
        else R = `/${this.owner}/${this.appName}/${path}/${url.substr(3)}`
      } else if (url.startsWith('./') && _.path) {
        // 当前路径
        let {path} = _
        const pos = _.path.lastIndexOf('/')
        if (pos > -1) {
          path = path.substring(0, pos)
          R = `/${_.owner}/${_.appName}/${path}/${url.slice(2)}`
        } else R = `/${_.owner}/${_.appName}/${url.slice(2)}`
      } else if (!url.startsWith('/')) {
        // xxx -> /owner/name/xxx
        // xxx -> /xxx
        if (_.owner && _.appName) R = `/${_.owner}/${_.appName}/${url}`
        // 应用未创建，按启动应用处理
        else if (_.opt.owner && _.opt.name) R = `/${_.opt.owner}/${_.opt.name}/${url}`
        else R = `/${url}`
      }
      // 绝对路径 /ower/app?a=1 => /ower/app/?a=1
      // /ower/app => /ower/app/
      // 以 / 结尾的路径，自动加载当前路径 index
      else if (url.startsWith('/')) {
        // 自动补充 index
        const ms = url.match(/([^/?]+)\/([^/?]+)\/?([^?]*)([\s\S]*)/)
        // default to index
        if (ms) {
          const owner = ms[1]
          const name = ms[2]
          const page = ms[3]
          if (owner && name && !page) R = `/${owner}/${name}/${ms[4]}`
        }
      }

      if (R.endsWith('/index')) R = R.replace(/\/index$/, '/')

      // 启动应用 /nuoya/store/index => '' /nuoya/store/ => ''
      if (new RegExp(`^/${opt.owner}/${opt.name}/$`).test(R)) R = ''
      // /ower/app/index -> /ower/app/

      // R = url.endsWith('/') ? url.substr(0, url.length - 1) : url;
      // / 结尾，代表目录，自动加载 index，网址后缀不加 index保留网址简洁
      // /ower/app/fea/ => /ower/app/fea/index
      // R = R.endsWith('/') ? `${R}index` : R
      // /ower/app/fea/?a=1 => /ower/app/fea/index?a=1
      // R = R.replace(/\/\?/g, '/index?')

      if (R !== url) console.log(`router repairUrl:${url} -> ${R}`)
    } catch (e) {
      console.error(`router repairUrl exp:${e.message}`)
    }

    return R
  }

  /**
   * 回退
   * @param {*} param 参数
   * @param {*} refresh 刷新
   */
  back(param, refresh = false) {
    if (this.hash?.length > 1) {
      const to = this.hash[this.hash.length - 2]
      this.param[to] = param
      this.refresh[to] = refresh
    }

    // 浏览器回退
    window.history.back()
  }

  /**
   * 判断页面是否已加载过
   */
  loaded(p) {
    return $.id(p.id) || this.vs[p.id]
  }

  /**
   * 动态下载页面js，里面包括js、html和css
   * 本地调试，则动态从本地下载html、css
   * @param {string} url 加载页面网址，格式：/ower/appname/page
   * @param {*} param
   * @returns {Promise<Object>}
   */
  async load(url, param) {
    let R
    const _ = this
    const {opt} = _

    try {
      // console.log(`router load url:${url}`);
      // const pos = path.lastIndexOf('/');
      // const name = path.substr(pos + 1);

      // 空路由作为启动应用index页面，/结尾或/? 加 index
      if (url === '') {
        // if (_.owner && _.appName) url = `/${_.owner}/${_.appName}/index`
        if (opt.owner && opt.name) url = `/${opt.owner}/${opt.name}/index`
      } else if (url.endsWith('/')) url += 'index'
      else if (url.includes('/?')) url = url.replace('/?', '/index?')

      const ms = url.match(/([^/]+)\/([^/]+)\/?([^?]*)/)

      // const ms = url.match(/([^/]+)\/([^/]+)\/?([^?]*)([\s\S]*)/);
      const owner = ms?.[1]
      const name = ms?.[2]
      let path = ms?.[3]
      // 默认page 为 index
      if (owner && name && !path) path = 'index'

      console.log('load', {owner, name, path})

      // 加载页面必须 owner、name 和 page
      if (!owner || !name || !path) throw new Error('need owner|name|path')

      let app = _.findApp(owner, name)
      if (!app) {
        // ! 应用不存在，创建并切换应用
        await _.switchApp(owner, name, path, param)
        // 加载应用时，需在显示事件中完成应用内路由，避免越权
        // _.showApp(app)
        // ! 终止当前路由，由应用show完成后续路由（身份识别与登录等）
        return
      }

      if (opt.mode === 'local') {
        // 本地调试状态，直接获取本地页面
        // 静态资源浏览器有缓存,增加日期时标,强制按日期刷新!
        const pgHtml = new Promise((resHtml, rejHtml) => {
          const pgurl = `${opt.cos}/page/${path}.html?v=${Date.now()}`
          // console.log('router load html:', {url: pgurl})
          $.get(pgurl).then(
            rs => {
              // 页面获取成功，vite 需使用 this.pages才生效
              // debugger;
              console.log('router load html:', {url: pgurl, rs})
              // 获得页面模块类，并创建页面对象实例

              const Cls = this.pages?.[`./page/${path}`] ?? __webpack_require__(`./src/page/${path}.js`).default // eslint-disable-line
              // 创建页面实例
              const p = new Cls({app: _.app}) // eslint-disable-line

              // master login
              if (p.opt) {
              }

              // 去掉 vite 添加的 脚本标签
              p.html = _.vite ? rs.replace('<script type="module" src="/@vite/client"></script>', '') : rs
              p.param = param

              // 保存应用所有者和应用名称
              p.owner = owner
              p.appName = name
              p.url = `/${owner}/${name}/${path}`
              p.path = path

              this.cachePage(p) // save page instance
              resHtml(p)
            },
            err => rejHtml(err)
          )
        })

        const pgCss = new Promise((resCss, rejCss) => {
          const pgurl = `${opt.cos}/page/${path}.css?v=${Date.now()}`
          // console.log(`router load css:${url}`);
          if (_.vite) {
            import(`${opt.cos}/page/${path}.css`).then(m => resCss(m)).catch(err => rejCss(err))
          } else {
            $.get(pgurl).then(
              rs => {
                // debugger;
                // console.log('router load css:', {url: pgurl, rs});
                resCss(rs)
              },
              err => resCss('') // rejCss(err) css 可选
            )
          }
        })

        const rs = await Promise.all([pgHtml, pgCss])
        const p = rs[0]
        p.css = rs[1] // eslint-disable-line
        // 触发 load 事件
        if (p.load) p.load(param || {})

        R = p
      } else {
        // wia pub 模式，gzip压缩包，2020年 chrome，2023年3月 safari
        if (opt.cos.includes('localhost:')) url = `${opt.cos}/page/${path}.zip?v=${Date.now()}`
        else url = `${opt.cos}/${owner}/${name}/page/${path}.zip?v=${Date.now()}`

        console.log('router load page:', {url})

        // let r = await $.get(url)

        const r = await unzip(url)

        // console.log(r);
        if (r?.js) {
          const k = `${owner}/${name}/page/${path}.js`
          const code = r.js[k]
          if (!$.M.m[k]) $.M.add(r.js) // 模块加入到缓存数组
          // console.log(r.js);
          const Cls = $.M(k).default // 加载该模块
          // 创建页面实例
          const p = new Cls({app: _.app}) // eslint-disable-line

          // master login
          if (p.opt) {
          }

          p.html = r.html
          p.css = r.css
          p.param = param

          // 保存应用所有者和应用名称
          p.owner = owner
          p.appName = name
          p.url = `/${owner}/${name}/${path}`
          p.path = path

          _.cachePage(p)

          // 触发 load 事件
          if (p.load) p.load(param || {})

          R = p
        }
      }
    } catch (e) {
      console.error(`load exp:${e.message}`)
    }

    return R
  }

  /**
   * 创建应用
   * @param {string} owner 所有者
   * @param {string} name 应用名称
   * @returns {Promise <*>}
   */
  async createApp(owner, name) {
    let R
    const _ = this
    const {opt} = _

    try {
      let app = _.findApp(owner, name)
      if (app) return app

      let appCls = null
      if (opt.mode === 'local') {
        // 本地调试，owner 必须一致
        if (owner === opt.owner) appCls = _.pages?.['./src/index'] ?? __webpack_require__('./src/index.js').default
        // appCls = _.pages?.['./src/index'] ?? __webpack_require__('./src/index.js')
      } else {
        // wia 模式
        const m = `${owner}/${name}/index.js`
        // 需动态下载
        if (!$.M.m[m]) {
          let url
          if (opt.cos.includes('localhost:')) url = `${opt.cos}/index.zip?v=${Date.now()}`
          else url = `${opt.cos}/${owner}/${name}/index.zip?v=${Date.now()}`

          console.log('router load app:', {url})
          // const r = await $.get(url)
          const r = await unzip(url)
          // debugger;
          // console.log(r);
          if (r?.js) $.M.add(r.js) // 模块加入到缓存数组
        }

        if ($.M.m[m]) appCls = $.M(m).default // 加载应用index模块
      }

      if (appCls) {
        // eslint-disable-next-line
        app = new appCls({
          el: opt.el || opt.root,
          init: _.init, // 启动wia应用时，创建路由，同时创建app
          owner,
          name,
        })

        if (app) {
          _.app = app
          _.init = false // 第一个应用需初始化，后续应用无需初始化
        }

        // 缓存应用
        _.apps[`${owner}.${name}`] = app

        // _.lastPage = null // 切换 app
        // _.page = null
        // $.lastPage = null
        // $.page = null

        if (app.ready)
          // 重新绑定事件
          $.nextTick(() => {
            app.ready()
          })

        R = app
      }
    } catch (e) {
      console.log('createApp exp:', e.message)
    }

    return R
  }

  /**
   * 已创建应用的显示，触发应用show事件
   * 终止原路由，调用show后，重新路由，应用show事件中可修改返回路由策略，包括 master 和 login
   * 应用显示时，根据应用login设置，跳转到login页面，由login跳转到hash
   * login跳转再次执行当前函数，触发应用show函数，应用show函数可控制路由
   * 如缺省路由、master/detail 路由等
   * 应用启动(show)后，通过 hash 直接加载页面，不再通过当前函数
   *  state 微信oAuth通过state传参数
   *  from:从哪里启动 to:去哪里 sid:site id，appid：app id
     应用显示时路由优先级：
     param中的to或应用show中通过param指定to
     > state(微信)中param的to > 用户hash指定 > 应用配置的home > 缺省 page/index
     tate 移到 应用创建前处理，showApp不再处理 state，state中的param作为参数传入
     ash 作为参数传入，showApp不读取当前网址hash
     ash指定是用户要去的路由，应用可在show中通过指定to来修改去向，并将用户hash放入 param中，
     由去向处理用户路由
     如 login，修改路由到login，登录成功在到to，在to中，应用根据 param 处理后续路由
     微信路由有些不同：
     1. 从菜单进入，没有hash，只有url param中的state，需在启动应用中通过state中的hash来创建应用，
       from 指定菜单来源，sid 指定主站来源
       state中的sid 优于app config缺省sid，master则由应用config设置，无需在state中设置
     2. 微信生态链接进入：微信聊天或微信公众号（可选hash与hash后的param），配置了autoAuth的应用，通过微信跳转再次进入
       此时，需将hash 和 param放入 state，from 为 chat 或 param指定，sid 为应用缺省或param指定，
       sid、from 用于识别用户入口，计算收益时用，二级：sid主站（一级），from主播（二级）
       二次进入时，类似菜单进入，通过 state中的hash创建应用，还原state中的param
     3. state中只配置hash、from、sid和param，之前的to由 hash 替代，菜单与跳转保持统一
     4. showApp在第一次进入时，依然可修改 hash 和 param，修改后微信跳转二次进入时，二次触发hash对应应用
     5. 二次进入时，会再次触发 showApp，此时，param 为第一次进入showApp时返回的 param
     3. 进入应用后，带参数跳转其他应用，此时已获得token，不再做跳转授权，此时的param为内部共享对象。
     4. 因此，对state需在路由创建时处理，以创建对应应用，showApp时，直接传入 hash 和 param。
     5. pc模拟调试手机，设置state，在启动应用创建时处理，以创建模拟应用，不在showApp中处理
   * @param {*} app
   * @param {*} [param]
   */
  async showApp(app, param) {
    // biome-ignore lint/complexity/noUselessThisAlias: <explanation>
    const _ = this
    const {cfg} = app
    const {home} = cfg

    try {
      // 微信二维码扫码授权跳转，需另外建一个简单页面，加快跳转速度
      if (param?.loginType === 7 && param?.from === 'qr') {
        const {sid, code: verifier} = param
        const from = 'wx'

        const {appid, url, scope, authSucc: hash} = cfg.wx
        let {redirect} = cfg.wx
        const state = encodeURIComponent(`hash=${hash}&sid=${sid}&from=${from}&loginType=7&verifier=${verifier}`)

        redirect = encodeURIComponent(redirect)
        const href = `${url}?appid=${appid}&redirect_uri=${redirect}&response_type=code&scope=${scope}` + `&state=${state}#wechat_redirect`

        console.log('wxAuth', {href})

        location.href = href
        return
      }

      // 加载应用时，需在显示事件中完成应用内路由，避免越权
      $.nextTick(async () => {
        // 加载应用时，当前网址hash 作为为用户路由去向
        let {hash} = window.location
        if (hash.startsWith('#')) hash = hash.substring(1)
        if (hash.startsWith('!')) hash = hash.substring(1)
        // 没有param，通过网址hash后的?获取参数：from、to、sid
        if (!param && hash) param = $.urlParam(hash)
        // 保留 search
        // hash = hash.indexOf('?') > -1 ? hash.replace(/\?\S*/, '') : hash

        // 微信菜单进入，需在state中配置五个参数：master、from、to、sid、param

        // 应用 show 可修改返回新的 hash、param
        if (app?.show) {
          try {
            const rs = await app.show(hash, param || {})
            if (rs) ({hash, param} = rs)
          } catch {}
        }

        // debugger

        console.log('showApp', {hash, param})

        // code、state 参数，微信挑转，一般来源于微信服务号菜单配置，调试中也可模拟

        // 抑制页面空 href 刷新页面行为
        $.view.qus('a[href=""]').attr('href', 'javascript:;')

        let {from, to, code, verifier, appid, sid, master, login, bindMobile, loginType} = param || {}

        // 微信公众号菜单中对应的链接中设置 hash、from、sid，微信会通过url转发到应用中
        appid = appid ?? cfg.appid
        sid = sid ?? cfg.sid
        master = master ?? cfg.master ?? ''
        login = login ?? cfg.login ?? false
        bindMobile = bindMobile ?? cfg.bindMobile ?? false

        // 原路由终止，重新路由：to 优先，用户show函数可设置to覆盖网址中的hash路由
        to = to || hash || home || 'index'

        if (sid) sid = Number.parseInt(sid)
        if (appid) appid = Number.parseInt(appid)

        // 微信授权打开，通过微信code获取用户信息
        // 优先本地缓存，缓存默认 30天过期
        const token = await _.getToken(app, sid, code, loginType, verifier)

        // 删除 url中的search 参数

        console.log('showApp', {appid, sid, master, from, to, code, token})

        // sid 保存到全局，sid 可能与cfg中的不一样！
        if (sid) $.app.sid = sid
        if (appid) $.app.id = appid

        // 免登录 test
        // if (hash) $.go(hash, param)
        // else $.go('index') // 默认加载首页
        // _.wxAuth(app, hash, param)
        // return

        // 用户身份已确认（微信图像和昵称）
        // 如需手机验证码确认，在需要时调用login登录页面！！！
        if (token) {
          const u = $.app.user
          // 没有手机，则需使用手机短信验证码绑定手机
          // 已经绑定手机无需再次绑定
          if (cfg.bindMobile && !u?.mobile)
            _.go('login', {
              master,
              to,
              param,
            })
          // 已经绑定手机无需再次绑定
          // 指定去向优先，微信菜单、授权页面通过to指定去向
          else {
            // 先加载master页面，由master加载detail页面
            if (master && !_.view.qu('.page-master')?.dom) _.go(master, {to, param})
            else _.go(to, param)
          }
        } else if (!code && $.device.wx && cfg.wx.autoAuth) _.wxAuth(app, hash, param)
        else if (login) {
          // 非微信环境，手机验证登录进入
          _.go('login', {
            master,
            to,
            param,
          })
        }
        // 无需验证登录，不识别用户身份，匿名访问
        else if (master && !_.view.qu('.page-master')?.dom) _.go(master, {to, param})
        else if (to) _.go(to, param) // 重新路由
      })
    } catch (e) {
      console.log('showApp err:', e.message)
    }
  }

  /**
   * 微信授权获取用户头像、昵称，获取后保存到数据库，并产生token保存单客户端本地
   * 如处理不当，微信中会反复跳转页面
   * @param {*} app
   * @param {string} hash
   * @param {*} param
   */
  wxAuth(app, hash, param) {
    const _ = this
    const {cfg} = app
    try {
      const k = 'wxAuthCnt'
      let cnt = $.store.get(k) ?? 0
      if (cnt === '') cnt = 0
      cnt = Number.parseInt(cnt)
      cnt++
      $.store.set(k, cnt, 1) // 1分钟后失效，重新开始计数

      if (cnt <= cfg.wx.autoAuth) {
        console.log({hash, param, cnt, autoAuth: cfg.wx.autoAuth}, 'wxAuth')

        if (typeof param === 'object' && Object.keys(param).length) param = JSON.stringify(param)
        param = param ?? ''

        let state = ''
        if (hash || param) state = encodeURIComponent(`hash=${hash}&auth=wx&param=${param}`)
        const redirect = encodeURIComponent(cfg.wx.redirect)
        const href =
          `${cfg.wx.url}?appid=${cfg.wx.appid}&redirect_uri=${redirect}&response_type=code&scope=${cfg.wx.scope}` + `&state=${state}#wechat_redirect`
        console.log('wxAuth', {state, href})
        window.location.href = href // 微信带code跳转，通过code能获得用户昵称、头像
      }
    } catch (e) {}
  }

  /**
   * 切换应用，触发 showApp
   * @param {string} owner 所有者
   * @param {string} name 应用名称
   * @param {string} [path] 应用路径
   * @param {*} [param] 参数
   * returns 是否成功
   */
  async switchApp(owner, name, path, param) {
    let R = false
    const _ = this
    const {opt} = _

    try {
      // 无需切换
      if (owner === _.owner && name === _.appName) {
        if (path && path !== _.path) _.path = path
        return true
      }

      // ! 切换需获取新应用token，暂时屏蔽
      const tk = true // await this.getToken(owner, name)

      if (tk) {
        // 应用切换处理
        if (owner) {
          if (_.owner !== _.lastOwner) _.lastOwner = _.owner
          _.owner = owner
        }

        if (name) {
          if (_.appName !== _.lastName) _.lastName = _.appName
          _.appName = name
        }

        if (path) {
          if (_.path !== _.lastPath) _.lastPath = _.path
          _.path = path
        }

        let app = _.findApp(owner, name)
        if (!app) app = await _.createApp(owner, name)

        if (app) {
          if (_.lastApp) {
            const lastApp = _.lastApp
            if (lastApp.hide)
              $.nextTick(() => {
                lastApp.hide()
              })
          }

          if (_.app) _.lastApp = _.app

          _.app = app
          $.app = app

          // 切换 app，清理上一个应用的缓存参数，避免数据泄露
          _.lastPage = null
          _.page = null
          $.lastPage = null
          $.page = null

          // 加载应用时，需在显示事件中完成应用内路由，避免越权
          await _.showApp(app, param)

          R = true
        }
      }
    } catch (e) {
      console.log('switchApp exp:', e.message)
    }

    return R
  }

  /**
   * 获取登录token，对于需login的应用，需token调用后台接口
   * 获取有效用户身份令牌和用户信息（头像、昵称、手机号码等）
   * 用户信息保存在 $.app.user 备用！
   * 优先本地获取，本地过期，或服务器user无法获取，重新获取token
   * 服务器返回token无法获取用户信息，作为无效token删除，返回空。
   * 微信进入，有sid和code，可获取用户头像和昵称
   * 如本地有缓存token，用户无头像、昵称，则重新通过微信code、sid获取
   * 微信后台通过code获取openid，获取微信用户信息，保存到数据库
   * 微信获取图像、昵称，目前只有通过userinfo授权，否则仅获取openid
   * @param {*} app - 应用
   * @param {number} sid -  siteid
   * @param {string} code - 微信等返回的 code
   * @param {LoginType} loginType - loginType
   * @param {string} verifier - 微信扫码登录
   */
  async getToken(app, sid, code, loginType, verifier) {
    let R = ''
    const _ = this
    const {opt} = _
    const {cfg} = app

    try {
      let token = $.store.get(cfg.token)

      if (!token) {
        // 已通过camp登录的，保持登录
        token = $.store.get(`nuoya/camp/${cfg.token}`)
        if (token) $.store.set(cfg.token, token)
      }

      console.log('getToken', {key: cfg.token, token})

      // 存在登录令牌，获取用户信息
      if (token) {
        const u = $._user ? $._user : await _.getUser(app, token)
        console.log({u}, 'getToken')

        if (u) {
          if (!$._user) $._user = u // 全局保存
          app.user = u
          R = token
        } else if (u === 0) {
          R = token
          console.error('offline!')
        } else {
          $.store.remove(cfg.token)
          console.error('token invalid, remove and getToken again!')
        }
      }

      // 通过code，重新获取 token，如微信、飞书
      if (!R && sid && code) {
        let type = loginType ?? LoginType.wx
        // @ts-ignore
        type = Number.parseInt(loginType)

        const url = `${cfg[cfg.mode].api}/${opt.api.token}`
        let from
        if (type === LoginType.wx && verifier) from = 'qr'
        if ([LoginType.ms, LoginType.fs].includes(type)) verifier = $.store.get('codeVerifier') // ms/fs PKCE 需要

        // 通过code login 获取 token
        console.log({url, sid, code, verifier}, 'getToken')

        // login 获取token
        const rs = await $.post(url, {sid, code, verifier, from, type}) // wxfw 微信服务号
        if (rs) {
          console.log('getToken', {rs})

          if (rs.code === 200 && rs.data?.token) {
            token = rs.data.token
            $.store.set(cfg.token, token)
            const u = await _.getUser(app, token)
            if (u) {
              $._user = u // 全局保存
              $.app.user = u
              R = token
            } else {
              $.store.remove(cfg.token)
              console.error({rs}, 'getUser fail, remove token!')
            }
          } else console.error({rs}, 'getToken fail!')
        }
        // new Error('获取身份失败,请退出重新进入或联系客服!'), '');
      }

      // this.checkToken(owner, name, tk).then(rs => {
      //   if (rs) {
      //     $.app.token = tk
      //     res(tk)
      //   } else {
      //     tk = $.app.token
      //     $.app.token = ''
      //     // const code = await this.getCode(tk);
      //     this.getCode(tk).then(code => {
      //       if (code) {
      //         $.get(`${_.opt.api}/${owner}/${name}/${API.getToken}`, `code=${code}`)
      //           .then(r => {
      //             if (r) {
      //               // console.log('getToken', {r});
      //               if (r.code === 200) {
      //                 tk = r.data.token
      //                 $.app.token = tk
      //                 $.store.set(key, tk)
      //                 R = tk
      //               } else console.error('getToken error', {r})
      //             }

      //             res(R)
      //           })
      //           .catch(res(R))
      //       } else {
      //         console.error('getToken fail! no code.')
      //         res(R)
      //       }
      //     })
      //   }
      // })
    } catch (e) {
      console.error('getToken exp:', e.message)
    }
    return R
  }

  /**
   * 获取用户信息，后端api需实现 user/info 接口
   * @param {*} app - 应用
   * @param {string} token - 登录令牌
   * @returns {Promise<*>} 0 - 没网
   */
  async getUser(app, token) {
    let R = null
    const _ = this
    const {cfg} = app

    try {
      const url = `${cfg[cfg.mode].api}/${_.opt.api.userInfo}`
      const rs = await $.post(url, null, {
        'x-wia-token': token,
      })
      console.log('getUser', {url, rs})
      if (rs && rs.code === 200) R = rs.data
    } catch (e) {
      if (e.status === 0) R = 0
      console.error(e, 'getUser')
    }
    return R
  }

  /**
   * 检查当前token是否有效
   * @param {*} app 应用
   * @param {*} token 用户持有的身份令牌
   */
  async checkToken(app, token) {
    let R = false
    const _ = this
    const {cfg} = app

    try {
      if (!token) return false

      const rs = await $.get(`${cfg[cfg.mode].api}/${_.opt.api.checkToken}`, `token=${token}`)
      // console.log('checkToken', {token, rs});
      // {res: true, expire: 秒数}
      if (rs.code === 200) {
        const exp = rs.data.expire // 过期时刻，1970-01-01 之后的秒数
        R = rs.data.res
      }
    } catch (e) {
      console.error('checkToken exp:', e.message)
    }

    return R
  }

  /**
   * 通过当前登录token获取用户临时code，用于跨应用授权
   * @param {*} app 应用
   * @param {string} token 用户持有的身份令牌
   */
  async getCode(app, token) {
    let R = ''
    const _ = this
    const {cfg} = app

    try {
      const rs = $.get(`${cfg[cfg.mode].api}/${_.opt.api.getCode}`, `token=${token}`)
      // console.log('getCode', {token, rs});
      if (rs.code === 200) R = rs.data
      else console.error('getCode fail.', {token, rs})
    } catch (e) {
      console.error('getCode exp:', e.message)
    }

    return R
  }

  /**
   * 页面插入dom， 没有调用页面中的脚本
   * 实现 按次序加载 script
   * @param {*} v - 页面视图
   * @param {*} [last] - v 插入位置
   */
  addHtml(v, last = true) {
    let R
    const _ = this
    try {
      R = new Promise((res, rej) => {
        if (!v) return rej()

        // 提取所有 script 标签
        const scripts = v.getElementsByTagName('script')
        let srcs = []
        if (scripts.length) {
          for (const sc of Array.from(scripts)) {
            if (sc.src) {
              srcs.push(sc.src)
              sc.remove()
            }
          }
        }

        if (last) _.view.dom.appendChild(v)
        else _.view.dom.insertBefore(v, _.view.lastChild().dom)

        // 加载脚本
        if (srcs.length) loadScripts(0, v, srcs, res)
        else res()
      })
    } catch (e) {
      console.error(`addHtml exp:${e.message}`)
    }
    return R
  }

  /**
   * 向页面添加样式
   */
  addCss(p) {
    if (p.css) {
      const id = `css-${p.id}`
      let d = $.id(id)
      if (!d) {
        d = document.createElement('style')
        d.id = id
        d.innerHTML = p.css
        $('head').append(d)
      }
    }
  }

  /**
   * 从页面删除样式
   */
  removeCss(p) {
    const id = `css-${p.id}`
    const d = $.id(id)
    if (d) $(d).remove()
  }

  /**
   * route to the specify url, 内部访问
   * @param {string} url 新hash，需 repair 后的hash，空表示启动应用index
   * @param {*} param 参数
   * @param {boolean} [refresh] 强制刷新，重新加载
   * @param {string} [lastHash] 前hash
   */
  routeTo(url, param, refresh = false, lastHash = '') {
    const _ = this
    refresh = refresh ?? false

    // 还原通过master、login路由的 refresh、lastHash
    if (!refresh && param?.refresh) {
      refresh = true
      delete param.refresh
    }

    if (!lastHash && param?.lastHash) {
      lastHash = param.lastHash
      delete param.lastHash
    }

    console.log('routeTo ', {url, param, refresh})

    // 已缓存页面，直接跳转
    let p = _.findPage(url, param, refresh)
    if (p) {
      // _.to(p, refresh, lastHash)
      // @ts-ignore
      const {master, login} = p.opt || {} // 页面实例传入路由参数
      if (login) {
        if (!param) param = {}
        if (refresh) param.refresh = true
        if (lastHash) param.lastHash = lastHash

        if (!$.app.user)
          _.go('login', {
            master,
            to: url,
            param,
          })
        else if (master && !_.view.qu('.page-master')?.dom) _.go(master, {to: url, param})
        else _.to(p, refresh, lastHash)
      } else {
        if (master && !_.view.qu('.page-master')?.dom) _.go(master, {to: url, param})
        else _.to(p, refresh, lastHash)
      }
    } else {
      // 静态资源浏览器有缓存,增加日期时标,强制按日期刷新!
      // 没有缓存，则动态加载
      this.load(url, param).then(r => {
        p = _.findPage(url, param, refresh)
        if (p) {
          // if (p) _.to(p, refresh, lastHash)
          // @ts-ignore
          const {master, login} = p.opt || {} // 页面实例传入路由参数
          if (login) {
            if (!param) param = {}
            if (refresh) param.refresh = true
            if (lastHash) param.lastHash = lastHash

            if (!$.app.user)
              _.go('login', {
                master,
                to: url,
                param,
              })
            else if (master && !_.view.qu('.page-master')?.dom) _.go(master, {to: url, param})
            else _.to(p, refresh, lastHash)
          } else {
            if (master && !_.view.qu('.page-master')?.dom) _.go(master, {to: url, param})
            else _.to(p, refresh, lastHash)
          }
        }
      })
    }
  }

  /**
   * 切换到指定页面
   * @param {*} p 当前page类实例，已创建
   * @param {boolean=} refresh 刷新
   * @param {string} lastHash 前hash
   */
  to(p, refresh = false, lastHash = '') {
    const _ = this

    if (!p) {
      console.error('route to null page.')
      return
    }

    // 切换应用
    _.switchApp(p.owner, p.appName, p.path)
      .then(rt => {
        if (rt) {
          // 记录当前page实例
          this.lastPage = this.page
          // 记录当前 scrollTop
          if (this.lastPage && this.lastPage.scrollTop) this.lastPage.scrollTop = this.lastPage.view.class('page-content')?.dom?.scrollTop ?? 0

          // 切换app
          this.page = p
          $.page = this.page
          $.lastPage = this.lastPage

          // alert(`routeTo url:${r.url}`);

          // 返回还是前进
          const {ids} = this
          this.backed = false
          // 如果切换的是前一个page，则为回退！
          if (ids.length > 1 && ids[ids.length - 2] === p.id) {
            this.backed = true
            console.log(`to back id:${p.id} <- ${ids[ids.length - 1]}`)
            ids.pop()
          } else if (ids.length > 0 && ids[ids.length - 1] === p.id) {
            // pageid 相同，仅search 变化
            if (p.change && p.search !== p.lastSearch) {
              console.log(`search ${p.lastSearch} -> ${p.search}`)
              $.nextTick(() => {
                try {
                  p.change(p.view, p.search, p.lastSearch)
                } catch (exp) {
                  console.log('page change exp!', {exp})
                }
              })
            } else console.log(`to same page id: ${p.id}`)
          } else if (ids.length === 0 || (ids.length > 0 && ids[ids.length - 1] !== p.id)) {
            if (ids.length > 0) console.log(`to id:${ids[ids.length - 1]} -> ${p.id}`)
            else console.log(`to id:null -> ${p.id}`)

            ids.push(p.id)
          }

          // 进入跳转的页面, p为页面类实例，d为页面dom对象
          const enter = d => {
            p.doReady = false

            // 页面上是否存在，已经隐藏
            let v = $.id(p.id)
            // debugger;
            // 页面上不存在，则从缓存获取，并加载到主页面
            if (!v) {
              // 从缓存加载到页面，触发ready
              v = this.vs[p.id] // dom实例
              // 缓存也不存在，表明是刚Load，第一次加载到页面，触发Ready事件
              if (!v && d) {
                v = d
                // 缓存页面dom实例
                this.vs[p.id] = v
                p.doReady = true
              }

              // back 插在前面
              // forward添加在后面，并移到左侧
              if (v && this.view) {
                // this.style.href = r.style;
                if (!this.vite)
                  // vite 已加载 css
                  this.addCss(p) // 准备 css
                const $v = $(v)
                const pm = $v.hasClass('page-master') // master 页面一直显示
                if ((this.backed || pm) && this.view.hasChild()) {
                  if (this.opt.className) $v.addClass(`${this.opt.className}`)
                  if (this.opt.prevClass && !pm) $v.addClass(`${this.opt.prevClass}`)
                  // master 和 前页面 插到前面，master 之后
                  // this.view.dom.insertBefore(v, this.view.lastChild().dom) // 没有调用页面中的脚本
                  // this.view.children().last().before(v) // 调用页面中的脚本
                  this.addHtml(v, false).then(() => _.showHtml(p, v, lastHash))
                } else {
                  if (this.opt.className) $v.addClass(`${this.opt.className}`)
                  if (this.opt.nextClass && !pm) $v.addClass(`${this.opt.nextClass}`)
                  // this.view.dom.appendChild(v) // 没有调用页面中的脚本
                  // this.view.append(v) // 调用页面中的脚本
                  this.addHtml(v).then(() => _.showHtml(p, v, lastHash))
                }
              }
            } else this.showHtml(p, v, lastHash)
          }

          // 强制刷新，删除存在页面及缓存
          if (refresh) {
            let v = $.id(p.id)
            if (v) $.remove(v)

            // 删除缓存
            v = this.vs[p.id]
            if (v) delete this.vs[p.id]
          }

          // 加载页面视图回调
          const onload = (err, html = '') => {
            if (err) throw err
            // console.log('onload html:', html);

            // 创建 页面层
            const $v = $(html, true)
            $v.dom.id = p.id
            p.view = $v // $dom 保存到页面实体的view中
            p.$el = $v
            p.el = $v.dom
            p.dom = $v.dom
            // dom 与页面实例映射
            this.vps.set(p.dom, p)

            // 进入页面
            enter(p.dom)
          }

          const nextPage = this.loaded(p)

          // 页面不存在则加载页面
          if (!nextPage) {
            onload(null, p.html)
            // if (r.load) // 加载视图
            //   r.load.then((html) => {onload(null, html)});
            // else if (r.view) // 兼容
            //   r.view(onload);
            // else
            //   throw new Error(`route ${r.id} hasn't load function!`);
          } else enter() // 存在则直接进入
        }
      })
      .catch(err => console.error('to err:', err))
  }

  /**
   *
   * @param {*} p
   * @param {*} v
   * @param {*} lastHash
   */
  showHtml(p, v, lastHash) {
    // 记录即将显示视图
    if (p.el !== v) p.el = v // view 层保存在el中
    if (p.dom !== v) p.dom = v
    if (p.$el?.dom !== v) p.$el = $(v, true) // 加载name
    if (p.view?.dom !== v) p.view = p.$el

    // 动画方式切换页面，如果页面在 ready 中被切换，则不再切换！
    // 应该判断 hash 是否已经改变，如已改变，则不切换
    // alert(`hash:${this.hash} => ${this.nextHash}`);
    if (!this.nextHash || this.nextHash === this.hash[this.hash.length - 1]) {
      this.switchPage(p, this.backed, lastHash)
    }
  }

  /**
   * 路由仅接受绝对path，通过url获取绝对path、 search、 param
   * 将相对path 转换为绝对path
   * 将?后面的内容从url剥离，并转换为参数，？需包含在hash中，也就是 # 之后
   * 比如当前hash为 '#a' 切换到 '#b'
   * $.go('b')
   * 网址上输入 https://wia.pub/#/ower/name
   * 默认到首页 https://wia.pub/#/ower/bame/home
   * @param {string} url
   */
  parseUrl(url = '') {
    const R = {url}
    const _ = this

    try {
      // 把?后面的内容作为 search 参数处理，？需包含在hash中，也就是 # 之后
      let pos = url.indexOf('?')
      if (pos >= 0) {
        R.url = url.slice(0, pos)
        R.search = url.slice(pos + 1)
        if (R.search) {
          R.param = {}
          const ps = R.search.split('&')
          ps.forEach(p => {
            pos = p.indexOf('=')
            if (pos > 0) R.param[p.substr(0, pos)] = p.substr(pos + 1)
          })
        }
      }

      // 启动应用index路由修补后为空，因此不修补
      if (!new RegExp(`/${_.opt.owner}/${_.opt.name}/\\S*index$`).test(R.url)) R.url = _.repairUrl(R.url)
      const ms = url.match(/([^/]+)\/([^/]+)\/([^?]+)/)
      // eslint-disable-next-line prefer-destructuring
      if (ms) R.path = ms[3]

      if (url !== R.url) console.log(`router parseUrl url:${url} -> ${R.url} path:${R.path}`)
    } catch (e) {
      console.error(`router parseUrl exp:${e.message}`)
    }

    return R
  }

  /**
   * 从缓存ps中查找页面实例，去掉 ? 号后的 search，search 放入 param
   * /ower/name/path，去掉参数，参数放入 r.param
   * @param {string} url /ower/name/page
   * @param {*} param
   * @returns {Object}
   */
  findPage(url, param, refresh = false) {
    let R = null
    const _ = this

    const rs = _.parseUrl(url)

    // 空路由特殊处理
    if (_.opt.owner && _.opt.name && rs.url === '') rs.url = `/${_.opt.owner}/${_.opt.name}/index`
    else if (rs.url.endsWith('/')) rs.url += 'index'
    else if (rs.url.includes('/?')) rs.url = url.replace('/?', '/index?')

    // for (let i = 0, len = this.rs.length; i < len; i++) {
    const p = _.ps[rs.url] // find(rt => rt.url === rs.url);
    if (!p) {
      console.log('findPage not find!', {url, url2: rs.url})
    } else {
      if (rs.param) p.param = {...rs.param}
      else p.param = {}

      if (param) $.assign(p.param, param)

      // 记录当前 path
      // r.path = rs.path;
      // r.url = url;
      p.lastSearch = p.search
      p.search = rs.search
      p.refresh = refresh

      R = p
    }

    return R
  }

  /**
   * 从缓存中查找应用，避免重新加载
   * @param {string} owner /ower/name/page
   * @param {string} name
   * @param {*} [param]
   * @param {boolean} [reload]
   * @returns {Object}
   */
  findApp(owner, name, param, reload = false) {
    let R = null

    const app = this.apps[`${owner}.${name}`]
    if (!app) {
      console.log('findApp not find!', {owner, name})
    } else {
      app.param = {}
      if (param) $.assign(app.param, param)
      app.reload = reload
      R = app
    }

    return R
  }

  /**
   * cache page instance
   * @param {Object} p
   * @returns {Router}
   */
  cachePage(p) {
    try {
      if (!p) throw new Error('page is empty!')

      if (!p.url) throw new Error("page's url is empty!")

      // 按url自动生成唯一id，该id作为Dom页面的id属性
      p.id = `${p.url.replace(/\//g, '-')}`
      if (p.id.startsWith('-')) p.id = p.id.substr(1)
      // 将 path 转换为绝对路径
      // r.path = `/${this.opt.owner}/${this.opt.name}/${r.path}`;
      p.ready = p.ready || $.noop
      p.router = this

      this.ps[p.url] = p
      // console.log(`router cache page.url:${p.url} succ.`);

      return this
    } catch (ex) {
      console.error(`router.cachePage exp: ${ex.message}`)
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
    const aniClass = `router-transition-${dir || 'forward'} router-transition`

    // console.log('aniPage ', {aniClass});
    // 动画结束，去掉 animation css 样式
    if ($.device.ios) {
      to.animationEnd(() => {
        // console.log('animation end.');
        this.view.removeClass(aniClass)
        // from.removeClass('page-previous');
        if (cb) cb()
      })
    } else {
      let end = to
      if (dir === 'backward') end = from

      // md to's animation: none, only from's animation
      end.animationEnd(() => {
        // console.log('animation end.');
        this.view.removeClass(aniClass)
        // from.removeClass('page-previous');
        if (cb) cb()
      })
    }

    // console.log('animation start...');
    // Add class, start animation
    this.view.addClass(aniClass)
  }

  /**
   * 获取当前显示的第一个 section
   *
   * @returns {*}
   * @private
   */
  getCurrentPage = () => $.qu(`.${this.opt.showClass}`)

  /**
   * 显示新页面时，卸载当前页面，避免页面上相同id冲突
   * @param {*} p 卸载页面实例
   * @param {*} v 卸载页面视图 $Dom
   */
  hidePage(p, v) {
    if (!v || !p) return
    try {
      v.removeClass(this.opt.showClass)
      v.removeClass(this.opt.prevClass)
      v.removeClass(this.opt.nextClass)

      // 触发隐藏事件
      try {
        if (p.hide) p.hide(v)
      } catch (exp) {
        console.log('page hide exp!', {exp})
      }
      // this.pageEvent('hide', p, v);

      // 缓存当前 page
      // this.vs[p.id] = v.dom;

      // removeChild
      v.remove()
      this.removeCss(p)
    } catch (ex) {
      console.error('hidePage exp:', ex.message)
    }
  }

  /**
   * 启动动画前调用show/ready事件,在页面显示前,准备好页面
   * 如果在动画后调用,会先看到旧页面残留,体验不好
   * 上个页面和当前页面同时存在,如果存在相同id,可能会有问题.
   * 获取dom 元素时,最好限定在事件参数view范围获取.
   * @param {*} p 页面实例
   * @param {string} lastHash 前hash
   */
  onShow(p, lastHash) {
    try {
      if (!p) return

      const v = p.view

      // 重新绑定事件
      if (p.doReady) {
        if (p.ready) {
          // 如果不使用延时，加载无法获取dom节点坐标！
          //  node.getBoundingClientRect().top node.offsetTop 为 0，原因未知！！！
          $.nextTick(() => {
            try {
              p.ready(v, p.param || {}, this.backed, lastHash)
            } catch (exp) {
              console.log('page ready exp!', {exp})
            }

            // ready 回调函数可能会创建 page 节点，pageInit事件在ready后触发！
            // page 实例就绪时，回调页面组件的pageInit事件，执行组件实例、事件初始化等，实现组件相关功能
            // 跨页面事件，存在安全问题，所有f7组件需修脱离app，仅作为Page组件！！！
            this.pageEvent('init', p, v)
            $.fastLink() // 对所有 link 绑定 ontouch，消除 300ms等待
          })
        }
      }

      // 触发
      if (p.back && this.backed) {
        $.nextTick(() => {
          try {
            if (v.class('page-content')?.dom?.scrollTop) v.class('page-content').dom.scrollTop = p.scrollTop ?? 0
            p.back(v, p.param || {}, lastHash)
          } catch (exp) {
            console.log('page back exp!', {exp})
          }
          // this.pageEvent('back', p, v);
        })
      }

      if (p.show && !this.backed) {
        $.nextTick(() => {
          try {
            p.show(v, p.param || {}, lastHash)
          } catch (exp) {
            console.log('page show exp!', {exp})
          }
          // this.pageEvent('show', p, v);
        })
      }
    } catch (ex) {
      console.error('onShow ', {ex: ex.message})
    }
  }

  /**
   * 通过css设置，显示新页面
   * @param {*} p 当前页面实例
   */
  showPage(p) {
    if (p) {
      const v = p.view
      v.removeClass(this.opt.nextClass)
      v.removeClass(this.opt.prevClass)

      // master-detail 主从页面，主页面一直显示
      // 页面包含主从样式，应用view添加主从样式，否则，删除主从样式
      if (v.hasClass('page-master') || v.hasClass('page-master-detail')) this.view.addClass('view-master-detail')
      else if (this.view.hasClass('view-master-detail')) this.view.removeClass('view-master-detail')

      // master页面一直显示，普通页面切换显示
      if (!v.hasClass('page-master')) v.addClass(this.opt.showClass)
    }

    // $to.trigger(EVENTS.pageAnimationEnd, [to.id, to]);
    // 外层（init.js）中会绑定 pageInitInternal 事件，然后对页面进行初始化
    // $to.trigger(EVENTS.pageInit, [to.id, to]);
  }

  /**
   * 切换页面
   * 把新页从右边切入展示，同时会把新的块的记录用 history.pushState 来保存起来
   * 如果已经是当前显示的块，那么不做任何处理；
   * 如果没对应的块，忽略。
   * @param {Router} p 待切换的页面实例
   * @param {boolean} back 是否返回
   * @param {string} lastHash 前hash
   * @private
   */
  switchPage(p, back, lastHash) {
    if (!p) return
    try {
      let fp = null
      let from = this.getCurrentPage() // 当前显示页面
      if (from) {
        from = $(from) // $(from); lastp.view;
        // master page not hide!
        if (from.hasClass('page-master')) from = null
        else fp = this.vps.get(from.dom)
      }

      let to = $.id(p.id)
      if (to) {
        to = p.view // $(to); ready/show 在页面实例view上修改
        // master page not hide!
        if (to.hasClass('page-master')) from = null
      }

      // 如果已经是当前页，不做任何处理
      if (from && to && from.dom === to.dom) return

      const dir = back ? 'backward' : 'forward'
      if (from || to) {
        // 页面切换动画
        if (from && to) {
          // 开机splash不需要动画
          if (this.noAni) {
            this.noAni = false
            this.hidePage(fp, from)
            this.onShow(p, lastHash) // ready
            this.showPage(p)
          } else {
            // 需要动画，先触发show事件
            this.onShow(p, lastHash) // ready 提前处理，切换效果好
            this.aniPage(from, to, dir, () => {
              // 动画结束
              this.hidePage(fp, from)
              this.showPage(p)
            })
          }
        } else if (from) {
          this.hidePage(fp, from)
        } else if (to) {
          this.onShow(p, lastHash) // ready
          this.showPage(p)
        }
      }
      setTitle(this.page.title)
      // this.pushNewState('#' + sectionId, sectionId);

      // 安全原因，删除页面传递参数
      if (this.hash.length > 0) {
        const [hash] = this.hash.slice(-1)
        if (this.param?.[hash]) delete this.param[hash]
        if (this.refresh?.[hash]) delete this.param[hash]
      }
    } catch (e) {
      console.error(`switchPage exp:${e.message}`)
    }
  }

  /**
   * 页面Page实例事件触发，f7 UI组件需要
   * @param {string} ev 事件：init show back hide
   * @param {Page} p 页面实例
   * @param {Dom} v 视图
   * @private
   */
  pageEvent(ev, p, v) {
    try {
      if (!p || !v) return

      const r = this // router
      if (!v.length) return

      const camelName = `page${ev[0].toUpperCase() + ev.slice(1, ev.length)}`
      const colonName = `page:${ev.toLowerCase()}`

      // 满足 f7 组件参数要求
      const data = {$el: v, el: v.dom}
      // if (callback === 'beforeRemove' && v[0].f7Page) {
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
          v.trigger('page:reinit', data)
          r.app.emit('pageReinit', data)
          return
        }
        v[0].f7PageInitialized = true

        // 触发当前页面Dom事件，不存在安全问题，$el.on(ev, et=> {})
        v.trigger(colonName, data)
        // 触发全局应用页面事件，通过 app.on 侦听
        r.app.emit(`local::${camelName}`, data)
      }

      // page 中已触发
      // Page 实例向上传递事件到App实例，
      // if (['hide', 'show', 'back'].includes(ev)) p.emit(camelName, p.path);
      // 触发页面事件，通过 page.on 侦听
      // p.emit(`local::${ev}`, data);
    } catch (ex) {
      console.error(`pageEvent exp:${ex.message}`)
    }
  }

  /**
   * 设置浏览器 hash，触发 hash change 事件
   * google 支持 #! 格式，百度浏览器修改hash无效
   * @param {string} url
   * @param {*} param
   * @param {boolean} refresh
   */
  setHash(url, param = null, refresh = false) {
    const _ = this
    let hash = url
    // if (url[0] !== '!') hash = `!${url}` // 不加 !

    // console.log('setHash...', {url, href: location.href, hash: location.hash});
    location.hash = hash // modify invalid
    // 删除网址最后的 #
    if (hash === '') history.replaceState(null, '', location.pathname + location.search)

    // 传递参数
    if (param) {
      if (!_.param) _.param = {}
      _.param[url] = param
    }

    if (refresh) {
      if (!_.refresh) _.refresh = {}
      _.refresh[url] = refresh
    }
    _.nextHash = url

    // $.nextTick(() => (location.hash = hash));
    // location.href = location.href.replace(/#[\s\S]*/i, hash);
    // console.log('setHash.', {url, href: location.href, hash: location.hash});
  }
}

/**
 * 获取 url 的 fragment（即 hash 中去掉 # 的剩余部分）
 *
 * 如果没有则返回字符串
 * 如: http://example.com/path/?query=d#123 => 123
 *
 * @param {String} [url] - url
 * @returns {string}
 */
function getHash(url) {
  // let {hash} = window.location
  //     if (hash.startsWith('#')) hash = hash.substr(1)
  //     if (hash.startsWith('!')) hash = hash.substr(1)
  //     hash = hash.indexOf('?') > -1 ? hash.replace(/\?\S*/, '') : hash

  if (!url) url = location.href

  let pos = url.indexOf('#!')
  if (pos !== -1) pos++
  else pos = url.indexOf('#')

  return pos !== -1 ? url.substring(pos + 1) : '' // ??? '/'
}

/**
 * 修改微信 title
 * IOS：微信6.5.3版本 在17年3月，切换了WKWebview， 可以直接document.title修改。
 * Andriod： 一直都可以document.title修改
 */
function setTitle(val) {
  if (document.title === val) return
  document.title = val
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

/**
 * 按顺序加载 script 标签
 * @param {number} idx
 * @param {*} v - page dom
 * @param {*[]} srcs - 脚本引用
 * @param {*} res
 * @returns
 */
function loadScripts(idx, v, srcs, res) {
  if (idx >= srcs.length) {
    // 所有脚本加载完成后退出
    return res()
  }

  const script = document.createElement('script')
  script.src = srcs[idx]
  // 当前脚本加载完成后，加载下一个脚本
  script.onload = () => {
    console.log(`Succed to load script: ${srcs[idx]}`)
    loadScripts(idx + 1, v, srcs, res)
  }
  script.onerror = () => {
    console.error(`Failed to load script: ${srcs[idx]}`)
    // 即使某个脚本加载失败，也继续加载下一个脚本
    loadScripts(idx + 1, v, srcs, res)
  }
  v.appendChild(script)
}

/**
 * 获取一个 url 的基本部分，即不包括 hash
 *
 * @param {String} url url
 * @returns {String}
 */
function getBaseUrl(url) {
  const pos = url.indexOf('#')
  return pos === -1 ? url.slice(0) : url.slice(0, pos)
}

$.go = (url, param = null, refresh = false) => {
  $.router.go(url, param, refresh)
}

$.back = (param, refresh = false) => {
  $.router.back(param, refresh)
}

$.repairUrl = url => $.router.repairUrl(url)

/**
 * Decompress a GZIP file using DecompressionStream
 * @param {string} url - The GZIP file to decompress
 * @returns {Promise<*>} - The decompressed content as a string
 */
async function unzip(url) {
  let R
  if (!('DecompressionStream' in window)) {
    throw new Error('DecompressionStream is not supported in this browser.')
  }

  try {
    // Fetch the GZIP data from the server
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }

    // Get the response body as a stream
    const compressedStream = response.body

    // Decompress the GZIP stream
    const decompressedStream = compressedStream.pipeThrough(new DecompressionStream('gzip'))

    // Convert the decompressed stream to a string
    const tx = await streamToString(decompressedStream)
    if (tx && /^\s*[{[]/.test(tx)) {
      try {
        R = JSON.parse(tx)
      } catch (ex) {
        console.log('parseSuccess', {exp: ex.message})
      }
    }
  } catch (e) {
    console.error(e.message)
  }

  return R
}

/**
 * Convert a ReadableStream to a string
 * @param {ReadableStream} stream - The decompressed stream
 * @returns {Promise<string>} - The resulting string
 */
async function streamToString(stream) {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let result = ''
  let done = false

  while (!done) {
    const {value, done: isDone} = await reader.read()
    done = isDone
    if (value) {
      result += decoder.decode(value, {stream: true})
    }
  }

  return result
}

Router.default = Router

export default Router
