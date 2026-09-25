import { ElMessageBox } from 'element-plus'

/**
 * 二次确认。外观只作用于带 nilo-confirm 的 MessageBox，其它 el-dialog 保持原样。
 */
interface ConfirmOptions {
    /** 提示内容。未传 title 时，问号前的句子作为标题，后面的说明作为正文 */
    message: string;
    /** 标题。不传则从 message 里拆出问句 */
    title?: string;
    /** 确认按钮回调 */
    confirmFun?: () => void;
    /** 是否显示取消按钮，默认 true */
    showCancelBtn?: boolean;
    /** 取消按钮文本，默认「取消」 */
    cancelText?: string;
    /** 确认按钮文本，默认「确定」 */
    confirmText?: string;
    /** 确认按钮用危险色。不传时，确认文案为「删除」则用危险色 */
    danger?: boolean;
}

/** 问号前是标题，问号后的说明是正文；没有后文时整段作为标题 */
function toConfirmCopy(message: string, title?: string)
{
    const text = message.trim()
    if (title)
    {
        return { title, body: text }
    }
    const mark = text.search(/[？?]/)
    if (mark >= 0 && mark < text.length - 1)
    {
        const heading = text.slice(0, mark + 1).trim()
        const body = text.slice(mark + 1).trim()
        if (heading && body)
        {
            return { title: heading, body }
        }
    }
    return { title: text, body: '' }
}

const confirm = ({
    message,
    title,
    confirmFun,
    showCancelBtn = true,
    cancelText = '取消',
    confirmText = '确定',
    danger,
}: ConfirmOptions) =>
{
    const copy = toConfirmCopy(message, title)
    const isDanger = danger ?? confirmText === '删除'
    const customClass = [
        'nilo-confirm',
        isDanger ? 'nilo-confirm--danger' : '',
        copy.body ? '' : 'nilo-confirm--title-only',
    ].filter(Boolean).join(' ')

    ElMessageBox.confirm(copy.body, copy.title, {
        customClass,
        closeOnClickModal: false,
        showClose: false,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        showCancelButton: showCancelBtn,
    }).then(async () =>
    {
        if (confirmFun)
        {
            confirmFun()
        }
    }).catch(() =>
    {
    })
}

export default confirm
