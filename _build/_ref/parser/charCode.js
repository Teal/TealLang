"use strict";
/**
 * @fileOverview ASCII 字符码表
 * @state statable
 */
exports.__esModule = true;
/**
 * 表示 Unicode 字符码表。
 */
var CharCode;
(function (CharCode) {
    // #region ASCII 字符
    /**
     * 空字符(NUL)。
     */
    CharCode[CharCode["null"] = 0] = "null";
    /**
     * 标题开始(SOH)。
     */
    CharCode[CharCode["startOfHeadLine"] = 1] = "startOfHeadLine";
    /**
     * 正文开始(STX)。
     */
    CharCode[CharCode["startOfText"] = 2] = "startOfText";
    /**
     * 正文结束(ETX)。
     */
    CharCode[CharCode["endOfText"] = 3] = "endOfText";
    /**
     * 传输结束(EOT)。
     */
    CharCode[CharCode["endOfTransmission"] = 4] = "endOfTransmission";
    /**
     * 请求(ENQ)。
     */
    CharCode[CharCode["enquiry"] = 5] = "enquiry";
    /**
     * 收到通知(ACK)。
     */
    CharCode[CharCode["acknowledge"] = 6] = "acknowledge";
    /**
     * 响铃(BEL)。
     */
    CharCode[CharCode["bell"] = 7] = "bell";
    /**
     * 退格(BS)。
     */
    CharCode[CharCode["backspace"] = 8] = "backspace";
    /**
     * 水平制表符(HT)。
     */
    CharCode[CharCode["horizontalTab"] = 9] = "horizontalTab";
    /**
     * 换行键(LF)。
     */
    CharCode[CharCode["lineFeed"] = 10] = "lineFeed";
    /**
     * 垂直制表符(VT)。
     */
    CharCode[CharCode["verticalTab"] = 11] = "verticalTab";
    /**
     * 换页键(FF)。
     */
    CharCode[CharCode["formFeed"] = 12] = "formFeed";
    /**
     * 回车键(CR)。
     */
    CharCode[CharCode["carriageReturn"] = 13] = "carriageReturn";
    /**
     * 不用切换(SO)。
     */
    CharCode[CharCode["shiftOut"] = 14] = "shiftOut";
    /**
     * 启用切换(SI)。
     */
    CharCode[CharCode["shiftIn"] = 15] = "shiftIn";
    /**
     * 数据链路转义(DLE)。
     */
    CharCode[CharCode["dataLinkEscape"] = 16] = "dataLinkEscape";
    /**
     * 设备控制1(DC1)。
     */
    CharCode[CharCode["deviceControl1"] = 17] = "deviceControl1";
    /**
     * 设备控制2(DC2)。
     */
    CharCode[CharCode["deviceControl2"] = 18] = "deviceControl2";
    /**
     * 设备控制3(DC3)。
     */
    CharCode[CharCode["deviceControl3"] = 19] = "deviceControl3";
    /**
     * 设备控制4(DC4)。
     */
    CharCode[CharCode["deviceControl4"] = 20] = "deviceControl4";
    /**
     * 拒绝接收(NAK)。
     */
    CharCode[CharCode["negativeAcknowledge"] = 21] = "negativeAcknowledge";
    /**
     * 同步空闲(SYN)。
     */
    CharCode[CharCode["synchronousIdle"] = 22] = "synchronousIdle";
    /**
     * 结束传输块(ETB)。
     */
    CharCode[CharCode["endOfTranslateBlock"] = 23] = "endOfTranslateBlock";
    /**
     * 取消(CAN)。
     */
    CharCode[CharCode["cancel"] = 24] = "cancel";
    /**
     * 媒介结束(EM)。
     */
    CharCode[CharCode["endOfMedium"] = 25] = "endOfMedium";
    /**
     * 代替(SUB)。
     */
    CharCode[CharCode["substitute"] = 26] = "substitute";
    /**
     * 换码(溢出)(ESC)。
     */
    CharCode[CharCode["escape"] = 27] = "escape";
    /**
     * 文件分隔符(FS)。
     */
    CharCode[CharCode["fileSeparator"] = 28] = "fileSeparator";
    /**
     * 分组符(GS)。
     */
    CharCode[CharCode["groupSeparator"] = 29] = "groupSeparator";
    /**
     * 记录分隔符(RS)。
     */
    CharCode[CharCode["recordSeparator"] = 30] = "recordSeparator";
    /**
     * 单元分隔符(US)。
     */
    CharCode[CharCode["unitSeparator"] = 31] = "unitSeparator";
    /**
     * 空格(space)。
     */
    CharCode[CharCode["space"] = 32] = "space";
    /**
     * 叹号(!)。
     */
    CharCode[CharCode["exclamation"] = 33] = "exclamation";
    /**
     * 双引号(")。
     */
    CharCode[CharCode["doubleQuote"] = 34] = "doubleQuote";
    /**
     * 井号(#)。
     */
    CharCode[CharCode["hash"] = 35] = "hash";
    /**
     * 美元符($)。
     */
    CharCode[CharCode["dollar"] = 36] = "dollar";
    /**
     * 百分号(%)。
     */
    CharCode[CharCode["percent"] = 37] = "percent";
    /**
     * 和(&)。
     */
    CharCode[CharCode["ampersand"] = 38] = "ampersand";
    /**
     * 闭单引号(')。
     */
    CharCode[CharCode["singleQuote"] = 39] = "singleQuote";
    /**
     * 开括号(()。
     */
    CharCode[CharCode["openParen"] = 40] = "openParen";
    /**
     * 闭括号())。
     */
    CharCode[CharCode["closeParen"] = 41] = "closeParen";
    /**
     * 星号(*)。
     */
    CharCode[CharCode["asterisk"] = 42] = "asterisk";
    /**
     * 加(+)。
     */
    CharCode[CharCode["plus"] = 43] = "plus";
    /**
     * 逗号(,)。
     */
    CharCode[CharCode["comma"] = 44] = "comma";
    /**
     * 减(-)。
     */
    CharCode[CharCode["minus"] = 45] = "minus";
    /**
     * 点(.)。
     */
    CharCode[CharCode["dot"] = 46] = "dot";
    /**
     * 斜杠(/)。
     */
    CharCode[CharCode["slash"] = 47] = "slash";
    /**
     * 数字 0。
     */
    CharCode[CharCode["num0"] = 48] = "num0";
    /**
     * 数字 1。
     */
    CharCode[CharCode["num1"] = 49] = "num1";
    /**
     * 数字 2。
     */
    CharCode[CharCode["num2"] = 50] = "num2";
    /**
     * 数字 3。
     */
    CharCode[CharCode["num3"] = 51] = "num3";
    /**
     * 数字 4。
     */
    CharCode[CharCode["num4"] = 52] = "num4";
    /**
     * 数字 5。
     */
    CharCode[CharCode["num5"] = 53] = "num5";
    /**
     * 数字 6。
     */
    CharCode[CharCode["num6"] = 54] = "num6";
    /**
     * 数字 7。
     */
    CharCode[CharCode["num7"] = 55] = "num7";
    /**
     * 数字 8。
     */
    CharCode[CharCode["num8"] = 56] = "num8";
    /**
     * 数字 9。
     */
    CharCode[CharCode["num9"] = 57] = "num9";
    /**
     * 冒号(:)。
     */
    CharCode[CharCode["colon"] = 58] = "colon";
    /**
     * 分号(;)。
     */
    CharCode[CharCode["semicolon"] = 59] = "semicolon";
    /**
     * 小于(<)。
     */
    CharCode[CharCode["lessThan"] = 60] = "lessThan";
    /**
     * 等号(=)。
     */
    CharCode[CharCode["equals"] = 61] = "equals";
    /**
     * 大于(>)。
     */
    CharCode[CharCode["greaterThan"] = 62] = "greaterThan";
    /**
     * 问号(?)。
     */
    CharCode[CharCode["question"] = 63] = "question";
    /**
     * 电子邮件符号(@)。
     */
    CharCode[CharCode["at"] = 64] = "at";
    /**
     * 大写字母 A。
     */
    CharCode[CharCode["A"] = 65] = "A";
    /**
     * 大写字母 B。
     */
    CharCode[CharCode["B"] = 66] = "B";
    /**
     * 大写字母 C。
     */
    CharCode[CharCode["C"] = 67] = "C";
    /**
     * 大写字母 D。
     */
    CharCode[CharCode["D"] = 68] = "D";
    /**
     * 大写字母 E。
     */
    CharCode[CharCode["E"] = 69] = "E";
    /**
     * 大写字母 F。
     */
    CharCode[CharCode["F"] = 70] = "F";
    /**
     * 大写字母 G。
     */
    CharCode[CharCode["G"] = 71] = "G";
    /**
     * 大写字母 H。
     */
    CharCode[CharCode["H"] = 72] = "H";
    /**
     * 大写字母 I。
     */
    CharCode[CharCode["I"] = 73] = "I";
    /**
     * 大写字母 J。
     */
    CharCode[CharCode["J"] = 74] = "J";
    /**
     * 大写字母 K。
     */
    CharCode[CharCode["K"] = 75] = "K";
    /**
     * 大写字母 L。
     */
    CharCode[CharCode["L"] = 76] = "L";
    /**
     * 大写字母 M。
     */
    CharCode[CharCode["M"] = 77] = "M";
    /**
     * 大写字母 N。
     */
    CharCode[CharCode["N"] = 78] = "N";
    /**
     * 大写字母 O。
     */
    CharCode[CharCode["O"] = 79] = "O";
    /**
     * 大写字母 P。
     */
    CharCode[CharCode["P"] = 80] = "P";
    /**
     * 大写字母 Q。
     */
    CharCode[CharCode["Q"] = 81] = "Q";
    /**
     * 大写字母 R。
     */
    CharCode[CharCode["R"] = 82] = "R";
    /**
     * 大写字母 S。
     */
    CharCode[CharCode["S"] = 83] = "S";
    /**
     * 大写字母 T。
     */
    CharCode[CharCode["T"] = 84] = "T";
    /**
     * 大写字母 U。
     */
    CharCode[CharCode["U"] = 85] = "U";
    /**
     * 大写字母 V。
     */
    CharCode[CharCode["V"] = 86] = "V";
    /**
     * 大写字母 W。
     */
    CharCode[CharCode["W"] = 87] = "W";
    /**
     * 大写字母 X。
     */
    CharCode[CharCode["X"] = 88] = "X";
    /**
     * 大写字母 Y。
     */
    CharCode[CharCode["Y"] = 89] = "Y";
    /**
     * 大写字母 Z。
     */
    CharCode[CharCode["Z"] = 90] = "Z";
    /**
     * 开方括号([)。
     */
    CharCode[CharCode["openBracket"] = 91] = "openBracket";
    /**
     * 反斜杠(\)。
     */
    CharCode[CharCode["backslash"] = 92] = "backslash";
    /**
     * 闭方括号(])。
     */
    CharCode[CharCode["closeBracket"] = 93] = "closeBracket";
    /**
     * 托字符(^)。
     */
    CharCode[CharCode["caret"] = 94] = "caret";
    /**
     * 下划线(_)。
     */
    CharCode[CharCode["underline"] = 95] = "underline";
    /**
     * 开单引号(`)。
     */
    CharCode[CharCode["backtick"] = 96] = "backtick";
    /**
     * 小写字母 a。
     */
    CharCode[CharCode["a"] = 97] = "a";
    /**
     * 小写字母 b。
     */
    CharCode[CharCode["b"] = 98] = "b";
    /**
     * 小写字母 c。
     */
    CharCode[CharCode["c"] = 99] = "c";
    /**
     * 小写字母 d。
     */
    CharCode[CharCode["d"] = 100] = "d";
    /**
     * 小写字母 e。
     */
    CharCode[CharCode["e"] = 101] = "e";
    /**
     * 小写字母 f。
     */
    CharCode[CharCode["f"] = 102] = "f";
    /**
     * 小写字母 g。
     */
    CharCode[CharCode["g"] = 103] = "g";
    /**
     * 小写字母 h。
     */
    CharCode[CharCode["h"] = 104] = "h";
    /**
     * 小写字母 i。
     */
    CharCode[CharCode["i"] = 105] = "i";
    /**
     * 小写字母 j。
     */
    CharCode[CharCode["j"] = 106] = "j";
    /**
     * 小写字母 k。
     */
    CharCode[CharCode["k"] = 107] = "k";
    /**
     * 小写字母 l。
     */
    CharCode[CharCode["l"] = 108] = "l";
    /**
     * 小写字母 m。
     */
    CharCode[CharCode["m"] = 109] = "m";
    /**
     * 小写字母 n。
     */
    CharCode[CharCode["n"] = 110] = "n";
    /**
     * 小写字母 o。
     */
    CharCode[CharCode["o"] = 111] = "o";
    /**
     * 小写字母 p。
     */
    CharCode[CharCode["p"] = 112] = "p";
    /**
     * 小写字母 q。
     */
    CharCode[CharCode["q"] = 113] = "q";
    /**
     * 小写字母 r。
     */
    CharCode[CharCode["r"] = 114] = "r";
    /**
     * 小写字母 s。
     */
    CharCode[CharCode["s"] = 115] = "s";
    /**
     * 小写字母 t。
     */
    CharCode[CharCode["t"] = 116] = "t";
    /**
     * 小写字母 u。
     */
    CharCode[CharCode["u"] = 117] = "u";
    /**
     * 小写字母 v。
     */
    CharCode[CharCode["v"] = 118] = "v";
    /**
     * 小写字母 w。
     */
    CharCode[CharCode["w"] = 119] = "w";
    /**
     * 小写字母 x。
     */
    CharCode[CharCode["x"] = 120] = "x";
    /**
     * 小写字母 y。
     */
    CharCode[CharCode["y"] = 121] = "y";
    /**
     * 小写字母 z。
     */
    CharCode[CharCode["z"] = 122] = "z";
    /**
     * 开花括号({)。
     */
    CharCode[CharCode["openBrace"] = 123] = "openBrace";
    /**
     * 竖线(|)。
     */
    CharCode[CharCode["bar"] = 124] = "bar";
    /**
     * 闭花括号(})。
     */
    CharCode[CharCode["closeBrace"] = 125] = "closeBrace";
    /**
     * 波浪号(~)。
     */
    CharCode[CharCode["tilde"] = 126] = "tilde";
    /**
     * 删除(DEL)。
     */
    CharCode[CharCode["delete"] = 127] = "delete";
    /**
     * 最大的 ASCII 字符。
     */
    CharCode[CharCode["asciiMax"] = 127] = "asciiMax";
    // #endregion 
    // #region Unicode 字符
    CharCode[CharCode["lineSeparator"] = 8232] = "lineSeparator";
    CharCode[CharCode["paragraphSeparator"] = 8233] = "paragraphSeparator";
    CharCode[CharCode["nextLine"] = 133] = "nextLine";
    CharCode[CharCode["nonBreakingSpace"] = 160] = "nonBreakingSpace";
    CharCode[CharCode["enQuad"] = 8192] = "enQuad";
    CharCode[CharCode["emQuad"] = 8193] = "emQuad";
    CharCode[CharCode["enSpace"] = 8194] = "enSpace";
    CharCode[CharCode["emSpace"] = 8195] = "emSpace";
    CharCode[CharCode["threePerEmSpace"] = 8196] = "threePerEmSpace";
    CharCode[CharCode["fourPerEmSpace"] = 8197] = "fourPerEmSpace";
    CharCode[CharCode["sixPerEmSpace"] = 8198] = "sixPerEmSpace";
    CharCode[CharCode["figureSpace"] = 8199] = "figureSpace";
    CharCode[CharCode["punctuationSpace"] = 8200] = "punctuationSpace";
    CharCode[CharCode["thinSpace"] = 8201] = "thinSpace";
    CharCode[CharCode["hairSpace"] = 8202] = "hairSpace";
    CharCode[CharCode["zeroWidthSpace"] = 8203] = "zeroWidthSpace";
    CharCode[CharCode["narrowNoBreakSpace"] = 8239] = "narrowNoBreakSpace";
    CharCode[CharCode["ideographicSpace"] = 12288] = "ideographicSpace";
    CharCode[CharCode["mathematicalSpace"] = 8287] = "mathematicalSpace";
    CharCode[CharCode["ogham"] = 5760] = "ogham";
    /**
     * UTF-8 标记码(BOM)。
     */
    CharCode[CharCode["byteOrderMark"] = 65279] = "byteOrderMark";
    // #endregion 
})(CharCode = exports.CharCode || (exports.CharCode = {}));
