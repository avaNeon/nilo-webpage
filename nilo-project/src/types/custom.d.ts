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
