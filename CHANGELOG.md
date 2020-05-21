# Change Log

## 2020-04-21

不同应用相同域名不同网址，在chrome浏览器上不会弹出新网页，Safari会弹出新的网页，
新网页带地址栏，破坏web app的全屏效果。

这种差异，说明 谷歌鼓励 web app 的发展，因为对谷歌搜索有利。

苹果不鼓励 web app发展，甚至设置一些障碍，因为web app 对 其 app store 有影响。 

wia app 要达到与原生 app 一样的体验和效果，不得不调整应用运行策略。

wia 只能修改路由策略，将不同应用网址完全相同，hash不同，这种模式虽然存在安全隐患，但确保体验与原生app一致。

\* index.js

- \* repairUrl
  $.go('b') 转换为 $.go('/ower/name/b')
  实际网址为 https://app.wia.pub/#!/ower/name/b
- \* load
  根据绝对 hash加载资源
- \* getPath rename as parseUrl
  绝对hash中分离 search 和 param
- \* push
  new page's id:  ower-appname-pagename
- \* aniPage
  ios 与 安卓动画不同，安卓只有一个page有动画，ios 是两个
  修正动画结束事件被调用。