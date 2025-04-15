import fs from 'node:fs'
import zlib from 'node:zlib'
import path from 'node:path'
import {rollup} from 'rollup'
import {minify} from '@swc/core'

const env = process.env.NODE_ENV || 'development'

const isProd = env === 'production'
const _startTk = Date.now()

if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist')
}

async function build(cfgs, cb) {
  const pms = []
  for (let i = 0, len = cfgs.length; i < len; i++) {
    try {
      const cfg = cfgs[i]
      pms.push(buildEntry(cfg))
    } catch (e) {
      console.error(`build exp:${e.message}`)
    }
  }

  await Promise.all(pms)

  cb && cb()
}

/**
 * rollup warn
 * @param {*} param0
 */
function onwarn({loc, frame, message}) {
  if (loc) {
    console.warn(`${loc.file} (${loc.line}:${loc.column}) ${message}`)
    if (frame) console.warn(frame)
  } else {
    console.warn(message)
  }
}

/**
 * 根据配置输出打包文件
 * @param {*}
 */
async function buildEntry({input, output}) {
  let bundle
  try {
    input.onwarn = onwarn
    bundle = await rollup(input)
    // console.log({output});

    const {file, banner, format} = output
    // bundle.generate(output); // 不写入文件
    const rt = await bundle.write(output) // 写入文件

    const {code} = rt.output[0]
    report(code, file) // 文件尺寸

    // 生产输出 压缩版本
    if (format === 'umd') min(code, banner, file)
  } catch (e) {
    console.error(`buildEntry exp:${e.message}`)
  }

  if (bundle) await bundle.close()
}

/**
 * 压缩输出到文件
 * @param {*} code
 * @param {*} banner
 * @param {*} file
 * @returns
 */
async function min(code, banner, file) {
  let R = null

  try {
    // terser
    const opts2 = {
      sourceMap: false,
      toplevel: true, // 删除顶层作用域中未引用函数和变量，默认false
      output: {
        ascii_only: true, // 非ascii转为 \u字符，默认false
      },
      compress: {
        pure_funcs: null, // ['makeMap', 'console.log'], 无副作用函数，可摇树删除
      },
    }

    // swc
    const opts = {
      compress: {
        drop_console: true, // 删除 `console.log` 等调试信息
        drop_debugger: true, // 删除 debugger
        dead_code: true,
        unused: true, // 删除未使用的变量和函数
      },
      format: {
        comments: false, // 仅保留特定注释，例如 /*! */   false
        asciiOnly: true, // 将非 ASCII 字符转为 Unicode 转义
      },
      ecma: 5, // 5: ES5 6或2015: ES6  specify one of: 5, 2015, 2016, etc.
      mangle: true,
      module: false, // 指定是否将代码视为模块  "unknown"
      safari10: true, // Safari 10 的特定问题，如 for-of 迭代器兼容性
      // toplevel: true, // 缺省 false，优化顶层作用域的变量和函数
      sourceMap: false, // 为压缩后的代码生成 source map 文件，便于调试
      toplevel: true, // 删除顶层作用域中未引用函数和变量，默认false
    }

    let {code: minCode} = await minify(code, opts)

    minCode = (banner ? `${banner}\n` : '') + minCode

    // 异步写出
    const ext = path.extname(file)
    write(file.replace(ext, `.min${ext}`), minCode, true, true)

    R = true
  } catch (e) {
    console.error(` exp:${e.message}`)
      }

  return R
}

function report(code, dest, extra) {
  console.log(`${blue(path.relative(process.cwd(), dest))} ${getSize(code)}${extra || ''}`)
}

/**
 * 写入文件
 * @param {*} dest
 * @param {*} code
 * @param {*} zip
 * @returns
 */
function write(dest, code, rep = true, zip = false) {
  return new Promise((resolve, reject) => {
    fs.writeFile(dest, code, err => {
      if (err) return reject(err)
      if (!rep) resolve()
      else if (zip) {
        zlib.gzip(code, (err2, zipped) => {
          if (err2) return reject(err2)
          report(code, dest, ` (gzipped: ${getSize(zipped)})`)

          const spend = Date.now() - _startTk
          console.log('build', {spend})

          resolve()
        })
      } else {
        report(code, dest)
        resolve()
      }
    })
  })
}

function getSize(code) {
  return `${(code.length / 1024).toFixed(2)}kb`
}

function blue(str) {
  return `\x1b[1m\x1b[34m${str}\x1b[39m\x1b[22m`
}

export {build}
