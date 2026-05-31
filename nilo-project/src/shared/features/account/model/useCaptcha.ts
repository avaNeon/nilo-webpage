import type { CaptchaInfo } from "@/shared/model/CaptchaInfo"
import { Api } from "@/shared/config/Api"
import request from "@/shared/lib/request"
import { ref } from "vue"

// 验证码请求的最小间隔时间，单位为毫秒
const miliDelay: number = 500

export function useCaptcha() {
    // 设置一个验证码请求状态变量，防止短时间内重复请求验证码
    const isRequesting = ref(false)
    /**
     * 验证码信息对象
     */
    const captchaInfo = ref<CaptchaInfo>()

    /**
     * 请求验证码
     * @returns 验证码key
     */
    const getCaptcha = async (): Promise<string | undefined> => {
        if (isRequesting.value) { return }
        isRequesting.value = true
        try {
            const response = await request({
                method: "get",
                url: Api.captcha
            })
            if (response) {
                captchaInfo.value = response.data
            }
        }
        catch (error) {
            console.error("获取验证码失败：", error)
        }
        finally {
            // 设置定时器，每隔miliDelay毫秒才能请求下一次
            setTimeout(() => {
                isRequesting.value = false
            }, miliDelay)
        }

    }

    return { captchaInfo, getCaptcha }
}