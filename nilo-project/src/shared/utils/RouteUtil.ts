import router from "@/app/router";

/**
 * 导航到新页面
 * @param path 资源相对路径
 */
export function routerToNewPage(path: string) {
  const { href } = router.resolve({
    path,
  });

  window.open(href, "_blank", "noopener,noreferrer");
}
