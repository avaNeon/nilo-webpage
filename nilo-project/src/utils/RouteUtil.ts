import { useRouter } from "vue-router"

const router = useRouter()
/**
 * 导航到新页面
 * @param path 资源相对路径
 */
export function routerToNewPage(path: string) {
    const href = router.resolve({
        path: path,
    }).href
    const url = location.origin + href
    open(url, '_blank')
}