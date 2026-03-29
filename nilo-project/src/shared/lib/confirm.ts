import { ElMessageBox } from 'element-plus'

/**
 * 弹窗确认方法
 * @param options 配置项
 * @param options.message 提示内容
 * @param options.confirmFun 确认按钮回调
 * @param options.showCancelBtn 是否显示取消按钮，默认true
 * @param options.confirmText 确认按钮文本，默认"确定"
 */
interface ConfirmOptions {
    /** 提示内容 */
    message: string;
    /** 确认按钮回调 */
    confirmFun?: () => void;
    /** 是否显示取消按钮，默认true */
    showCancelBtn?: boolean;
    /** 确认按钮文本，默认"确定" */
    confirmText?: string;
}
/**
 * 弹出确认对话框
 * @param options.message 提示内容
 * @param options.confirmFun 点击确认按钮后的回调函数
 * @param options.showCancelBtn 是否显示取消按钮，默认 true
 * @param options.confirmText 确认按钮文本，默认"确定"
 */
const confirm = ({ message, confirmFun, showCancelBtn = true, confirmText = '确定' }: ConfirmOptions) => {
    ElMessageBox.confirm(message, '提示', {
        closeOnClickModal: false,
        confirmButtonText: confirmText,
        cancelButtonText: '取消',
        showCancelButton: showCancelBtn,
        type: 'info',
    }).then(async () => {
        if (confirmFun) {
            confirmFun();
        }
    }).catch(() => {
    });
};

export default confirm;
