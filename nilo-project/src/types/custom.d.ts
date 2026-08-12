// 让这个文件被当成一个模块（而不是全局脚本），下面对 vue-router 的 declare module 才会被
// TypeScript 正确识别为「模块扩充」，去合并 RouteMeta；否则在纯全局脚本里写 declare module 'vue-router'
// 会被当成一个全新的同名 ambient module，把 node_modules 里真实的 vue-router 类型声明整个遮盖掉，
// 导致所有页面 import { useRoute, useRouter, createRouter... } from 'vue-router' 全部报 "has no exported member"
export {}

// 声明静态资源模块为字符串路径，解决 TypeScript 找不到模块的报错
declare module '*.m3u8' {
  const src: string
  export default src
}

declare module '*.mp4' {
  const src: string
  export default src
}

declare module '*.jpg' {
  const src: string
  export default src
}

declare module '*.png' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, any>
  export default component
}

// Vite query imports: ?url returns an URL string, ?raw returns file content
declare module '*?url' {
  const src: string
  export default src
}

declare module '*?raw' {
  const src: string
  export default src
}

declare module 'vue-router' {
  interface RouteMeta {
    /** 静态页面标题（不含站点名）；动态页可先作占位，再由页面覆盖 */
    title?: string
  }
}
