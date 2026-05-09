import { useLoginStateStore } from "@/shared/store/LoginStateStore";
import { useRouter } from "vue-router";

export function useCreativeCenter() {
  const router = useRouter();
  const loginStateStore = useLoginStateStore();

  function cancelActive() {
    const el = document.querySelector<HTMLElement>("#hidden-element");
    if (el) {
      el.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    }
  }

  return {
    router,
    loginStateStore,
    cancelActive,
  };
}
