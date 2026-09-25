import { nextTick } from "vue";
import type { RouteLocationNormalized, Router } from "vue-router";

/**
 * 主页 / 热门 / 创作中心之间切换：同一个标签页里跳转，用 View Transition 淡入淡出。
 * 三个页面的顶栏位置完全一样（顶栏有自己的 view-transition-name），看起来就是顶栏不动、只换颜色，下面内容淡入淡出。
 * 浏览器不支持或用户开了「减少动态效果」时直接跳转。
 */

type Section = "home" | "hot" | "creativeCenter";

function sectionOf(route: RouteLocationNormalized): Section | null {
  if (route.matched.some(record => record.name === "creativeCenter")) {
    return "creativeCenter";
  }
  if (route.name === "index" || route.name === "category") {
    return "home";
  }
  if (route.name === "hot-ranking") {
    return "hot";
  }
  return null;
}

/** 换了板块，或者在创作中心里换了子页面（只改 query、换分类不算） */
function isSectionSwitch(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
): boolean {
  const toSection = sectionOf(to);
  const fromSection = sectionOf(from);
  if (!toSection || !fromSection) {
    return false;
  }
  if (toSection !== fromSection) {
    return true;
  }
  return toSection === "creativeCenter" && to.name !== from.name;
}

function canAnimate(): boolean {
  return (
    typeof document.startViewTransition === "function" &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function installSectionTransition(router: Router) {
  /** 新页面渲染好以后调用，让浏览器截新画面、开始淡入淡出 */
  let finishUpdate: (() => void) | null = null;

  router.beforeResolve((to, from) => {
    // 第一次打开页面（from 还没有匹配的路由）不做过渡
    if (!from.matched.length || !isSectionSwitch(to, from) || !canAnimate()) {
      return;
    }

    return new Promise<void>(proceed => {
      let proceeded = false;
      const proceedOnce = () => {
        if (!proceeded) {
          proceeded = true;
          proceed();
        }
      };

      try {
        const transition = document.startViewTransition(() => {
          // 旧画面已经截好，放行导航去渲染新页面
          proceedOnce();
          return new Promise<void>(resolve => {
            finishUpdate = resolve;
            // 保险：导航被取消或者迟迟没完成，也别让页面一直停在截图上
            window.setTimeout(resolve, 1500);
          });
        });
        // 过渡被跳过（比如页面在后台）时 ready 会 reject，这里吞掉
        transition.ready.catch(() => {});
      } catch {
        proceedOnce();
      }

      // 保险：回调迟迟不来（极少数情况）也照常跳转
      window.setTimeout(proceedOnce, 300);
    });
  });

  router.afterEach(async (to, from, failure) => {
    if (!failure && isSectionSwitch(to, from)) {
      await nextTick();
      // 换板块从顶部开始看；在截新画面之前滚，免得过渡结束时再跳一下
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
    finishUpdate?.();
    finishUpdate = null;
  });
}
