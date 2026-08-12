// vue-cropper 包的 "main" 直接指向未编译的 lib/index.ts，且该文件 import 了一个没有配套 .d.ts 的
// lib/vue-cropper.vue，导致 vue-tsc 严格模式下报 TS7016。tsconfig 里把 'vue-cropper' 这个 specifier
// 的类型解析重定向到这个文件，绕开包本身那份有问题的类型声明（不影响 Vite 的实际运行时解析）。
declare module "vue-cropper" {
  import type { DefineComponent } from "vue";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export const VueCropper: DefineComponent<any, any, any>;
  export default VueCropper;
}
