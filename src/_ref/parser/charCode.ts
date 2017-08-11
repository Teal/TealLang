/**
 * @fileOverview ASCII 字符码表
 * @state statable
 */

/**
 * 表示 Unicode 字符码表。
 */
export enum CharCode {

    // #region ASCII 字符

    /**
     * 空字符(NUL)。
     */
    null = 0x00,

    /**
     * 标题开始(SOH)。
     */
    startOfHeadLine = 0x01,

    /**
     * 正文开始(STX)。
     */
    startOfText = 0x02,

    /**
     * 正文结束(ETX)。
     */
    endOfText = 0x03,

    /**
     * 传输结束(EOT)。
     */
    endOfTransmission = 0x04,

    /**
     * 请求(ENQ)。
     */
    enquiry = 0x05,

    /**
     * 收到通知(ACK)。
     */
    acknowledge = 0x06,

    /**
     * 响铃(BEL)。
     */
    bell = 0x07,

    /**
     * 退格(BS)。
     */
    backspace = 0x08,

    /**
     * 水平制表符(HT)。
     */
    horizontalTab = 0x09,

    /**
     * 换行键(LF)。
     */
    lineFeed = 0x0A,

    /**
     * 垂直制表符(VT)。
     */
    verticalTab = 0x0B,

    /**
     * 换页键(FF)。
     */
    formFeed = 0x0C,

    /**
     * 回车键(CR)。
     */
    carriageReturn = 0x0D,

    /**
     * 不用切换(SO)。
     */
    shiftOut = 0x0E,

    /**
     * 启用切换(SI)。
     */
    shiftIn = 0x0F,

    /**
     * 数据链路转义(DLE)。
     */
    dataLinkEscape = 0x10,

    /**
     * 设备控制1(DC1)。
     */
    deviceControl1 = 0x11,

    /**
     * 设备控制2(DC2)。
     */
    deviceControl2 = 0x12,

    /**
     * 设备控制3(DC3)。
     */
    deviceControl3 = 0x13,

    /**
     * 设备控制4(DC4)。
     */
    deviceControl4 = 0x14,

    /**
     * 拒绝接收(NAK)。
     */
    negativeAcknowledge = 0x15,

    /**
     * 同步空闲(SYN)。
     */
    synchronousIdle = 0x16,

    /**
     * 结束传输块(ETB)。
     */
    endOfTranslateBlock = 0x17,

    /**
     * 取消(CAN)。
     */
    cancel = 0x18,

    /**
     * 媒介结束(EM)。
     */
    endOfMedium = 0x19,

    /**
     * 代替(SUB)。
     */
    substitute = 0x1A,

    /**
     * 换码(溢出)(ESC)。
     */
    escape = 0x1B,

    /**
     * 文件分隔符(FS)。
     */
    fileSeparator = 0x1C,

    /**
     * 分组符(GS)。
     */
    groupSeparator = 0x1D,

    /**
     * 记录分隔符(RS)。
     */
    recordSeparator = 0x1E,

    /**
     * 单元分隔符(US)。
     */
    unitSeparator = 0x1F,

    /**
     * 空格(space)。
     */
    space = 0x20,

    /**
     * 叹号(!)。
     */
    exclamation = 0x21,

    /**
     * 双引号(")。
     */
    doubleQuote = 0x22,

    /**
     * 井号(#)。
     */
    hash = 0x23,

    /**
     * 美元符($)。
     */
    dollar = 0x24,

    /**
     * 百分号(%)。
     */
    percent = 0x25,

    /**
     * 和(&)。
     */
    ampersand = 0x26,

    /**
     * 闭单引号(')。
     */
    singleQuote = 0x27,

    /**
     * 开括号(()。
     */
    openParen = 0x28,

    /**
     * 闭括号())。
     */
    closeParen = 0x29,

    /**
     * 星号(*)。
     */
    asterisk = 0x2A,

    /**
     * 加(+)。
     */
    plus = 0x2B,

    /**
     * 逗号(,)。
     */
    comma = 0x2C,

    /**
     * 减(-)。
     */
    minus = 0x2D,

    /**
     * 点(.)。
     */
    dot = 0x2E,

    /**
     * 斜杠(/)。
     */
    slash = 0x2F,

    /**
     * 数字 0。
     */
    num0 = 0x30,

    /**
     * 数字 1。
     */
    num1 = 0x31,

    /**
     * 数字 2。
     */
    num2 = 0x32,

    /**
     * 数字 3。
     */
    num3 = 0x33,

    /**
     * 数字 4。
     */
    num4 = 0x34,

    /**
     * 数字 5。
     */
    num5 = 0x35,

    /**
     * 数字 6。
     */
    num6 = 0x36,

    /**
     * 数字 7。
     */
    num7 = 0x37,

    /**
     * 数字 8。
     */
    num8 = 0x38,

    /**
     * 数字 9。
     */
    num9 = 0x39,

    /**
     * 冒号(:)。
     */
    colon = 0x3A,

    /**
     * 分号(;)。
     */
    semicolon = 0x3B,

    /**
     * 小于(<)。
     */
    lessThan = 0x3C,

    /**
     * 等号(=)。
     */
    equals = 0x3D,

    /**
     * 大于(>)。
     */
    greaterThan = 0x3E,

    /**
     * 问号(?)。
     */
    question = 0x3F,

    /**
     * 电子邮件符号(@)。
     */
    at = 0x40,

    /**
     * 大写字母 A。
     */
    A = 0x41,

    /**
     * 大写字母 B。
     */
    B = 0x42,

    /**
     * 大写字母 C。
     */
    C = 0x43,

    /**
     * 大写字母 D。
     */
    D = 0x44,

    /**
     * 大写字母 E。
     */
    E = 0x45,

    /**
     * 大写字母 F。
     */
    F = 0x46,

    /**
     * 大写字母 G。
     */
    G = 0x47,

    /**
     * 大写字母 H。
     */
    H = 0x48,

    /**
     * 大写字母 I。
     */
    I = 0x49,

    /**
     * 大写字母 J。
     */
    J = 0x4A,

    /**
     * 大写字母 K。
     */
    K = 0x4B,

    /**
     * 大写字母 L。
     */
    L = 0x4C,

    /**
     * 大写字母 M。
     */
    M = 0x4D,

    /**
     * 大写字母 N。
     */
    N = 0x4E,

    /**
     * 大写字母 O。
     */
    O = 0x4F,

    /**
     * 大写字母 P。
     */
    P = 0x50,

    /**
     * 大写字母 Q。
     */
    Q = 0x51,

    /**
     * 大写字母 R。
     */
    R = 0x52,

    /**
     * 大写字母 S。
     */
    S = 0x53,

    /**
     * 大写字母 T。
     */
    T = 0x54,

    /**
     * 大写字母 U。
     */
    U = 0x55,

    /**
     * 大写字母 V。
     */
    V = 0x56,

    /**
     * 大写字母 W。
     */
    W = 0x57,

    /**
     * 大写字母 X。
     */
    X = 0x58,

    /**
     * 大写字母 Y。
     */
    Y = 0x59,

    /**
     * 大写字母 Z。
     */
    Z = 0x5A,

    /**
     * 开方括号([)。
     */
    openBracket = 0x5B,

    /**
     * 反斜杠(\)。
     */
    backslash = 0x5C,

    /**
     * 闭方括号(])。
     */
    closeBracket = 0x5D,

    /**
     * 托字符(^)。
     */
    caret = 0x5E,

    /**
     * 下划线(_)。
     */
    underline = 0x5F,

    /**
     * 开单引号(`)。
     */
    backtick = 0x60,

    /**
     * 小写字母 a。
     */
    a = 0x61,

    /**
     * 小写字母 b。
     */
    b = 0x62,

    /**
     * 小写字母 c。
     */
    c = 0x63,

    /**
     * 小写字母 d。
     */
    d = 0x64,

    /**
     * 小写字母 e。
     */
    e = 0x65,

    /**
     * 小写字母 f。
     */
    f = 0x66,

    /**
     * 小写字母 g。
     */
    g = 0x67,

    /**
     * 小写字母 h。
     */
    h = 0x68,

    /**
     * 小写字母 i。
     */
    i = 0x69,

    /**
     * 小写字母 j。
     */
    j = 0x6A,

    /**
     * 小写字母 k。
     */
    k = 0x6B,

    /**
     * 小写字母 l。
     */
    l = 0x6C,

    /**
     * 小写字母 m。
     */
    m = 0x6D,

    /**
     * 小写字母 n。
     */
    n = 0x6E,

    /**
     * 小写字母 o。
     */
    o = 0x6F,

    /**
     * 小写字母 p。
     */
    p = 0x70,

    /**
     * 小写字母 q。
     */
    q = 0x71,

    /**
     * 小写字母 r。
     */
    r = 0x72,

    /**
     * 小写字母 s。
     */
    s = 0x73,

    /**
     * 小写字母 t。
     */
    t = 0x74,

    /**
     * 小写字母 u。
     */
    u = 0x75,

    /**
     * 小写字母 v。
     */
    v = 0x76,

    /**
     * 小写字母 w。
     */
    w = 0x77,

    /**
     * 小写字母 x。
     */
    x = 0x78,

    /**
     * 小写字母 y。
     */
    y = 0x79,

    /**
     * 小写字母 z。
     */
    z = 0x7A,

    /**
     * 开花括号({)。
     */
    openBrace = 0x7B,

    /**
     * 竖线(|)。
     */
    bar = 0x7C,

    /**
     * 闭花括号(})。
     */
    closeBrace = 0x7D,

    /**
     * 波浪号(~)。
     */
    tilde = 0x7E,

    /**
     * 删除(DEL)。
     */
    delete = 0x7F,

    /**
     * 最大的 ASCII 字符。
     */
    asciiMax = 0x7F,

    // #endregion 

    // #region Unicode 字符

    lineSeparator = 0x2028,
    paragraphSeparator = 0x2029,
    nextLine = 0x0085,

    nonBreakingSpace = 0x00A0,
    enQuad = 0x2000,
    emQuad = 0x2001,
    enSpace = 0x2002,
    emSpace = 0x2003,
    threePerEmSpace = 0x2004,
    fourPerEmSpace = 0x2005,
    sixPerEmSpace = 0x2006,
    figureSpace = 0x2007,
    punctuationSpace = 0x2008,
    thinSpace = 0x2009,
    hairSpace = 0x200A,
    zeroWidthSpace = 0x200B,
    narrowNoBreakSpace = 0x202F,
    ideographicSpace = 0x3000,
    mathematicalSpace = 0x205F,
    ogham = 0x1680,

    /**
     * UTF-8 标记码(BOM)。
     */
    byteOrderMark = 0xFEFF,

    // #endregion 

}
