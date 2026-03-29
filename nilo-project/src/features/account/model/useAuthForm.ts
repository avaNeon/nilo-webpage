import { reactive, ref, nextTick, watch } from 'vue'
import { useCaptcha } from './useCaptcha'
import { useLoginStateStore } from '@/shared/store/LoginStateStore'
import { login, register } from '../api/accountApi'
import { regs } from '@/shared/utils/VerifyUtil'
import message from '@/shared/lib/message'

export function useAuthForm() {
    // --- 外部 Store ---
    const loginStateStore = useLoginStateStore()

    // --- 表单状态 ---
    // 表单绑定对象
    const formData = reactive({
        email: '',
        password: '',
        captcha: '',
        captchaKey: '',
        nickName: '',
        registerPassword: '',
        reRegisterPassword: ''
    })
    // el-form 的 ref，供 validate / resetFields 调用
    const formDataRef = ref()
    // 当前是登录模式还是注册模式
    const inLogin = ref(true)

    // --- 表单辅助操作 ---
    // 清空所有字段值（不触发校验）
    function clearFields() {
        Object.assign(formData, {
            email: '',
            password: '',
            captcha: '',
            nickName: '',
            registerPassword: '',
            reRegisterPassword: ''
        })
    }
    // 重置表单：刷新验证码 + 清空字段 + 清除校验状态
    async function resetForm() {
        await getCaptcha()
        nextTick(() => {
            formDataRef.value?.resetFields()
            clearFields()
        })
    }
    // 切换登录/注册模式，并重置表单
    function changeLogin(change: boolean) {
        inLogin.value = change
        resetForm()
    }

    // --- 验证码管理 ---
    const { captchaInfo, getCaptcha } = useCaptcha()
    // 面板打开时自动刷新验证码
    watch(() => loginStateStore.showPanel, (val) => {
        if (val) getCaptcha()
    })
    // 每次验证码刷新后，同步 captchaKey 到表单
    watch(captchaInfo, (val) => {
        formData.captchaKey = val?.captchaKey || ''
    })

    // --- 表单校验规则 ---
    // 确认密码自定义校验
    function validateConfirm(_rule: any, value: any, callback: any) {
        if (value === '') {
            callback(new Error('请再次输入密码'))
        } else if (value !== formData.registerPassword) {
            callback(new Error('两次输入的密码不一致！'))
        } else {
            callback()
        }
    }
    const rules = {
        email: [
            { required: true, message: '请输入邮箱', trigger: 'blur' },
            { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
        ],
        password: [
            { required: true, message: '请输入密码', trigger: 'blur' },
            { pattern: regs.password, message: '密码必须在8-20个字符之间，且包含字母和数字，可以使用这些特殊符号：!@#$%^&*()_+-=', trigger: 'blur' }
        ],
        captcha: [
            { required: true, message: '请输入验证码', trigger: 'blur' }
        ],
        nickName: [
            { required: true, message: '请输入昵称', trigger: 'blur' },
            { max: 20, message: '昵称不能超过20个字符', trigger: 'blur' }
        ],
        registerPassword: [
            { required: true, message: '请输入密码', trigger: 'blur' },
            { pattern: regs.password, message: '密码必须在8-20个字符之间，且包含字母和数字，可以使用这些特殊符号：!@#$%^&*()_+-=', trigger: 'blur' }
        ],
        reRegisterPassword: [
            { required: true, message: '请再次输入密码', trigger: 'blur' },
            { validator: validateConfirm, trigger: 'blur' }
        ]
    }

    // --- 业务操作 ---
    // 提交表单（登录或注册）
    function submit() {
        formDataRef.value.validate(async (valid: boolean) => {
            if (!valid) {
                message.error('请检查输入是否正确')
                return
            }

            const params = {
                email: formData.email,
                nickName: formData.nickName,
                password: inLogin.value ? formData.password : formData.registerPassword,
                code: formData.captcha,
                captchaKey: formData.captchaKey,
            }

            // 统一错误处理：刷新验证码
            const errorCallback = () => getCaptcha()

            // 调用 API
            const result = inLogin.value
                ? await login(params, errorCallback)
                : await register(params, errorCallback)

            if (!result) return

            if (!inLogin.value) {
                message.success('注册成功，请登录！')
                changeLogin(true)
            } else {
                message.success('登录成功！')
                loginStateStore.setLoginState(true)
                loginStateStore.setUserInfo(result.data)
                loginStateStore.showPanel = false
                nextTick(() => {
                    formDataRef.value?.resetFields()
                    clearFields()
                })
            }
        })
    }

    // 关闭登录/注册面板
    function closePanel() {
        loginStateStore.showPanel = false
    }

    return {
        captchaInfo,
        getCaptcha,
        inLogin,
        formData,
        formDataRef,
        rules,
        changeLogin,
        submit,
        closePanel,
        loginStateStore,
    }
}
