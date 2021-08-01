# Change Log

## 2021-08-01

- app.load 改为 app.ready
- 支持 master-detail
  pg-master page 页面不会隐藏。
  先 go 到 master 页面，再 go 到 master-detail 页面，master 页面一直存在。
  一般用于 pc 的左菜单，点击菜单，右边页面切换，菜单不刷新。

## 2021-07-23

修正 pageEvent bug

## 2021-07-12

build.js

terser 升级版本后，改为异步！

index.js

- 切换 app 时，验证身份
  - auth/getCode
  - auth/getToken
  - auth/checkToken
- 全局 as 缓存所有 app
- 全局 vs 缓存 Page 实例中的 dom 视图
- page、lastPage Page 实例
- owner、appName、path、lastOwner、lastName、lastPaht 当前应用与前应用
- 触发 app 的 load、show、hide、unload 事件
- \+ switchApp
- \+ getCode
- \+ getToken
- \+ checkToken
- \* findRoute 改为 findPage
- \+ findApp
- \+ back 从 show 中独立出来，方便前端处理回退
- \+ pageEvent 页面 Page 实例事件触发，f7 UI 组件需要
- setTitle 修改微信 title

## 2020-09-01

增加切换应用时，自动获取该应用 token 功能，不同应用，token 不同

- switchApp
- getCode
- getToken

## 2020-07-19

- onShow
  back 与 show 分开
  回退时，触发 back
  非回退时，触发 show

index.js

## 2020-07-10

index.js

- constructor
  this.owner = this.opt.owner;
  this.name = this.opt.name;
  this.path = ''; // 页面路径，去掉参数部分

      	this.lastOwner = '';
      	this.lastName = '';
      	this.lastPath = '';

      	记录当前应用，发布应用切换时处理相关安全问题。

- addEventListener
  repairUrl 将不合规范 url 修改为规范 url

      	默认 home页 改为 index 页

- repairUrl
  支持 相对路径
- to
  dom 对象保存到页面实体的 view 中

## 2020-06-03

index.js

- load
  参数赋值给 Page 实例变量：p.param = param;
- to
  记录当前 scrollTop，back 时，可恢复
  当前页面的 Dom 实例保存到 el 属性中
- onShow
  back 显示时，恢复 scrollTop，恢复屏幕滚动位置

## 2020-04-21

不同应用相同域名不同网址，在 chrome 浏览器上不会弹出新网页，Safari 会弹出新的网页，
新网页带地址栏，破坏 web app 的全屏效果。

这种差异，说明 谷歌鼓励 web app 的发展，因为对谷歌搜索有利。

苹果不鼓励 web app 发展，甚至设置一些障碍，因为 web app 对 其 app store 有影响。

wia app 要达到与原生 app 一样的体验和效果，不得不调整应用运行策略。

wia 只能修改路由策略，将不同应用网址完全相同，hash 不同，这种模式虽然存在安全隐患，但确保体验与原生 app 一致。

\* index.js

- \* repairUrl
  $.go('b') 转换为 $.go('/ower/name/b')
  实际网址为 https://app.wia.pub/#!/ower/name/b
- \* load
  根据绝对 hash 加载资源
- \* getPath rename as parseUrl
  绝对 hash 中分离 search 和 param
- \* push
  new page's id: ower-appname-pagename
- \* aniPage
  ios 与 安卓动画不同，安卓只有一个 page 有动画，ios 是两个
  修正动画结束事件被调用。
