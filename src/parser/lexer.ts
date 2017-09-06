import { TokenType, stringToToken } from '../ast/tokenType';
import { options, error, ErrorType, LanguageVersion, ParseCommentsOption } from '../compiler/compiler';
import { CharCode } from './charCode';
import * as Unicode from './unicode';

/**
 * 表示一个词法解析器。
 * @description 词法解析器可以将源码解析成多个标记的序列。
 */
export class Lexer {

    // #region 接口

    /**
     * 获取正在解析的源码文本。
     */
    source: string;

    /**
     * 获取正在解析的位置。
     */
    pos: number;

    /**
     * 获取正在解析的源码路径。
     */
    fileName: string;

    /**
     * 设置要解析的源码。
     * @param text 要解析的源码文本。
     * @param start 解析的源码开始位置。
     * @param fileName 解析的源码位置。
     */
    setSource(text: string, start = 0, fileName?: string) {
        this.source = text;
        this.pos = start;
        this.fileName = fileName;
        delete this.comments;

        // 跳过开头的 #! 部分。
        if (options.allowShebang !== false) {
            this.skipShebang();
        }

        // 预读第一个标记。
        const firstToken = this.scan();
        firstToken.onNewLine = true;
        this.current = {
            _next: firstToken,
            type: TokenType.unknown,
            start: start,
            end: start,
            onNewLine: true
        };

    }

    /**
     * 获取已解析的所有注释。如果未启用注释解析则返回 undefined。
     */
    comments: {

        /**
         * 获取当前注释的开始位置。
         */
        start: number,

        /**
         * 获取当前注释的结束位置。
         */
        end: number

    }[];

    /**
     * 获取当前的标记。
     */
    current: Token;

    /**
     * 预览下一个标记。
     * @returns 返回一个标记对象。
     */
    peek() {
        return this.current._next;
    }

    /**
     * 读取下一个标记。
     * @returns 返回一个标记对象。
     */
    read() {
        const next = this.current._next;
        if (next._next == null) {
            next._next = this.scan();
        }
        return this.current = next;
    }

    /**
     * 存储临时缓存的标记。
     */
    private stash: Token;

    /**
     * 保存当前读取的进度。保存之后可以通过 {@link stashRestore} 恢复进度。
     */
    stashSave() {
        this.stash = this.current;
    }

    /**
     * 恢复之前保存的进度。
     */
    stashRestore() {
        this.current = this.stash;
        delete this.stash;
    }

    /**
     * 清除之前保存的进度。
     */
    stashClear() {
        delete this.stash;
    }

    // #endregion

    // #region 解析

    /**
     * 报告一个词法解析错误。
     * @param message 错误的信息。
     * @param args 格式化信息的参数。
     */
    error(message: string, ...args: any[]) {
        error(ErrorType.lexicalError, this.fileName, this.pos, this.pos, message, ...args);
    }

    /**
     * 当解析到一个注释时执行。
     * @param multiLineComment 标记是否是多行注释。
     * @param start 注释的开始位置。
     * @param end 注释的结束位置。
     */
    comment(multiLineComment: boolean, start: number, end: number) {
        if (options.parseComments) {
            this.comments = this.comments || [];
            this.comments.push({ start, end });
        }
    }

    /**
     * 跳过开头的 #! 标记。
     */
    private skipShebang() {
        if (this.source.charCodeAt(this.pos) === CharCode.hash && this.source.charCodeAt(this.pos + 1) === CharCode.exclamation) {
            this.pos += 2;
            this.skipLine();
        }
    }

    /**
     * 跳过当前行剩下的所有字符。
     */
    private skipLine() {
        while (this.pos < this.source.length && !Unicode.isLineTerminator(this.source.charCodeAt(this.pos))) {
            this.pos++;
        }
    }

    /**
     * 从源码扫描下一个标记。
     * @returns 返回解析的标记对象。
     */
    private scan() {

        console.assert(this.source != null, "应先调用“setSource()”设置源码内容。");

        const result = <Token>{};

        while (true) {
            let ch = this.source.charCodeAt(result.start = this.pos++);

            // 标识符、关键字
            if (ch >= CharCode.a && ch <= CharCode.z) {
                result.data = this.scanIdentifier();
                result.type = stringToToken(result.data);
                break;
            }

            switch (ch) {

                // \s、\t
                case CharCode.space:
                case CharCode.horizontalTab:
                    // 加速连续空格解析。
                    while (Unicode.isWhiteSpace(this.pos)) {
                        this.pos++;
                    }
                    continue;

                // \r、\n
                case CharCode.carriageReturn:
                case CharCode.lineFeed:
                    result.onNewLine = true;
                    continue;

                // /、//、/*、/=
                case CharCode.slash:
                    switch (this.source.charCodeAt(this.pos++)) { // /、*、=
                        case CharCode.slash:
                            const singleCommentStart = this.pos;
                            this.skipLine();
                            this.comment(false, singleCommentStart, this.pos);
                            continue;
                        case CharCode.asterisk:
                            const multiCommentStart = this.pos;
                            let multiCommentEnd: number;
                            while (this.pos < this.source.length) {
                                ch = this.source.charCodeAt(this.pos++); // 注释字符。
                                if (Unicode.isLineTerminator(ch)) {
                                    result.onNewLine = true;
                                } else if (ch === CharCode.asterisk && this.source.charCodeAt(this.pos + 1) === CharCode.slash) {
                                    multiCommentEnd = this.pos - 2;
                                    this.pos++;
                                    break;
                                }
                            }
                            if (multiCommentEnd == null && options.languageVersion !== LanguageVersion.tealScript) {
                                this.error("多行注释未关闭；应输入“*/”。");
                            }
                            this.comment(true, multiCommentStart, multiCommentEnd);
                            continue;
                        case CharCode.equals:
                            result.type = TokenType.slashEquals;
                            break;
                        default:
                            this.pos--;
                            result.type = TokenType.slash;
                            break;
                    }
                    break;

                // .1、..、...
                case CharCode.dot:
                    if (Unicode.isDecimalDigit(this.pos)) {
                        this.pos--;
                        result.data = this.scanNumericLiteral(CharCode.num0);
                        result.type = TokenType.numericLiteral;
                        break;
                    }
                    if (this.source.charCodeAt(this.pos) === CharCode.dot) {
                        this.pos++; // .
                        if (this.source.charCodeAt(this.pos) === CharCode.dot) {
                            this.pos++; // .
                            result.type = TokenType.dotDotDot;
                            break;
                        }
                        result.type = TokenType.dotDot;
                        break;
                    }
                    result.type = TokenType.dot;
                    break;

                // (
                case CharCode.openParen:
                    result.type = TokenType.openParen;
                    break;

                // )
                case CharCode.closeParen:
                    result.type = TokenType.closeParen;
                    break;

                // {
                case CharCode.openBrace:
                    result.type = TokenType.openBrace;
                    break;

                // }
                case CharCode.closeBrace:
                    result.type = TokenType.closeBrace;
                    break;

                // ;
                case CharCode.semicolon:
                    result.type = TokenType.semicolon;
                    break;

                // =、==、===、=>
                case CharCode.equals:
                    switch (this.source.charCodeAt(this.pos)) {
                        case CharCode.equals:
                            this.pos++; // =
                            if (this.source.charCodeAt(this.pos) === CharCode.equals) {
                                this.pos++; // =
                                if (options.allowGitConflictMarker !== false && result.onNewLine && this.skipGitConflictMarker(CharCode.equals, 4)) {
                                    // 跳过冲突的第二个版本。
                                    while (this.pos < this.source.length) {
                                        if (this.skipGitConflictMarker(CharCode.greaterThan, 7)) {
                                            break;
                                        }
                                        this.skipLine();
                                    }
                                    continue;
                                }
                                result.type = TokenType.equalsEqualsEquals;
                                break;
                            }
                            result.type = TokenType.equalsEquals;
                        case CharCode.greaterThan:
                            this.pos++; // >
                            result.type = TokenType.equalsGreaterThan;
                            break;
                        default:
                            result.type = TokenType.equals;
                            break;
                    }
                    break;

                // '、"
                case CharCode.singleQuote:
                case CharCode.doubleQuote:
                    result.data = this.scanStringLiteral(ch);
                    result.type = TokenType.stringLiteral;
                    break;

                // `
                case CharCode.backtick:
                    result.data = this.scanStringLiteral(ch);
                    result.type = this.source.charCodeAt(this.pos - 1) === CharCode.openBrace ? TokenType.templateHead : TokenType.noSubstitutionTemplateLiteral;
                    break;

                // +、++、+=
                case CharCode.plus:
                    switch (this.source.charCodeAt(this.pos)) {
                        case CharCode.plus:
                            this.pos++; // +
                            result.type = TokenType.plusPlus;
                            break;
                        case CharCode.equals:
                            this.pos++; // =
                            result.type = TokenType.plusEquals;
                            break;
                        default:
                            result.type = TokenType.plus;
                            break;
                    }
                    break;

                // -、--、-=
                case CharCode.minus:
                    switch (this.source.charCodeAt(this.pos)) {
                        case CharCode.minus:
                            this.pos++; // -
                            result.type = TokenType.minusMinus;
                            break;
                        case CharCode.equals:
                            this.pos++; // =
                            result.type = TokenType.minusEquals;
                            break;
                        default:
                            result.type = TokenType.minus;
                            break;
                    }
                    break;

                // ,
                case CharCode.comma:
                    result.type = TokenType.comma;
                    break;

                // :
                case CharCode.colon:
                    result.type = TokenType.colon;
                    break;

                // ?
                case CharCode.question:
                    result.type = TokenType.question;
                    break;

                // [
                case CharCode.openBracket:
                    result.type = TokenType.openBracket;
                    break;

                // ]
                case CharCode.closeBracket:
                    result.type = TokenType.closeBracket;
                    break;

                // 0x000、0b000、0O000、0
                case CharCode.num0:
                    switch (this.source.charCodeAt(this.pos++)) { // x、b、o
                        case CharCode.x:
                        case CharCode.X:
                            result.data = this.scanDights(16);
                            break;
                        case CharCode.b:
                        case CharCode.B:
                            result.data = this.scanDights(2);
                            break;
                        case CharCode.o:
                        case CharCode.O:
                            result.data = this.scanDights(8);
                            break;
                        default:
                            // EcmaScript 规定 0 后必须跟八进制数字，
                            // 实际上大部分编译器将 08 和 09 解释为十进制数字。
                            // todo: 严格模式需要输出语法错误。
                            result.data = Unicode.isOctalDigit(this.source.charCodeAt(--this.pos)) ?
                                this.scanDights(8) :
                                this.scanNumericLiteral(CharCode.num0);
                            break;
                    }
                    result.type = TokenType.numericLiteral;
                    break;

                // @
                case CharCode.at:
                    result.type = TokenType.at;
                    break;

                // !、!=、!==
                case CharCode.exclamation:
                    if (this.source.charCodeAt(this.pos) === CharCode.equals) {
                        if (this.source.charCodeAt(++this.pos) === CharCode.equals) { // =
                            this.pos++; // =
                            result.type = TokenType.exclamationEqualsEquals;
                            break;
                        }
                        result.type = TokenType.exclamationEquals;
                        break;
                    }
                    result.type = TokenType.exclamation;
                    break;

                // %、%=
                case CharCode.percent:
                    if (this.source.charCodeAt(this.pos) === TokenType.equals) {
                        this.pos++; // =
                        result.type = TokenType.percentEquals;
                        break;
                    }
                    result.type = TokenType.percent;
                    break;

                // &、&&、&=
                case CharCode.ampersand:
                    switch (this.source.charCodeAt(this.pos)) {
                        case CharCode.ampersand:
                            this.pos++; // &
                            result.type = TokenType.ampersandAmpersand;
                            break;
                        case CharCode.equals:
                            this.pos++; // =
                            result.type = TokenType.ampersandEquals;
                            break;
                        default:
                            result.type = TokenType.ampersand;
                            break;
                    }
                    break;

                // *、**、**=、*=
                case CharCode.asterisk:
                    switch (this.source.charCodeAt(this.pos)) {
                        case CharCode.asterisk:
                            if (this.source.charCodeAt(++this.pos) === CharCode.equals) {  // *
                                this.pos++; // =
                                result.type = TokenType.asteriskAsteriskEquals;
                                break;
                            }
                            result.type = TokenType.asteriskAsterisk;
                            break;
                        case CharCode.equals:
                            this.pos++; // =
                            result.type = TokenType.asteriskEquals;
                            break;
                        default:
                            result.type = TokenType.asterisk;
                            break;
                    }
                    break;

                // <、<<、<<=、<=
                case CharCode.lessThan:
                    switch (this.source.charCodeAt(this.pos)) {
                        case CharCode.lessThan:
                            this.pos++; // <
                            if (options.allowGitConflictMarker !== false && result.onNewLine && this.skipGitConflictMarker(CharCode.lessThan, 5)) {
                                continue;
                            }
                            if (this.source.charCodeAt(this.pos) === CharCode.equals) {
                                this.pos++; // =
                                result.type = TokenType.lessThanLessThanEquals;
                                break;
                            }
                            result.type = TokenType.lessThanLessThan;
                            break;
                        case CharCode.equals:
                            this.pos++; // =
                            result.type = TokenType.lessThanEquals;
                            break;
                        default:
                            result.type = TokenType.lessThan;
                            break;
                    }
                    break;

                // >, >=, >>、>>=、>>>、>>>=
                case CharCode.greaterThan:
                    switch (this.source.charCodeAt(this.pos)) {
                        case CharCode.equals:
                            this.pos++; // =
                            result.type = TokenType.greaterThanEquals;
                            break;
                        case CharCode.greaterThan:
                            switch (this.source.charCodeAt(++this.pos)) {
                                case CharCode.equals:
                                    this.pos++;
                                    result.type = TokenType.greaterThanGreaterThanEquals;
                                    break;
                                case CharCode.greaterThan:
                                    if (this.source.charCodeAt(++this.pos) === CharCode.equals) {
                                        this.pos++;
                                        result.type = TokenType.greaterThanGreaterThanGreaterThanEquals;
                                        break;
                                    }
                                    result.type = TokenType.greaterThanGreaterThanGreaterThan;
                                    break;
                                default:
                                    result.type = TokenType.greaterThanGreaterThan;
                                    break;
                            }
                            break;
                        default:
                            result.type = TokenType.greaterThan;
                            break;
                    }
                    break;

                // |、|=、||
                case CharCode.bar:
                    switch (this.source.charCodeAt(this.pos)) {
                        case CharCode.bar:
                            this.pos++; // |
                            result.type = TokenType.barBar;
                            break;
                        case CharCode.equals:
                            this.pos++; // =
                            result.type = TokenType.barEquals;
                            break;
                        default:
                            result.type = TokenType.bar;
                            break;
                    }
                    break;

                // ~
                case CharCode.tilde:
                    result.type = TokenType.tilde;
                    break;

                // ^、^=
                case CharCode.caret:
                    if (this.source.charCodeAt(this.pos) === CharCode.equals) {
                        this.pos++; // =
                        result.type = TokenType.caretEquals;
                        break;
                    }
                    result.type = TokenType.caret;
                    break;

                // \u0000
                case CharCode.backslash:
                    if (this.source.charCodeAt(this.pos) === CharCode.u) {
                        this.pos++;
                        ch = this.scanDights(16, 4);
                        if (Unicode.isIdentifierStart(ch)) {
                            result.data = this.scanIdentifier(ch);
                            if ((options.languageVersion === LanguageVersion.javaScript3 || options.languageVersion === LanguageVersion.javaScript) && stringToToken(result.data) !== TokenType.identifier) {
                                this.error("关键字不能使用 Unicode 编码表示。");
                            }
                            result.type = TokenType.identifier;
                            break;
                        }
                    }
                    this.error("非法字符：“{0}”。", '#');
                    continue;

                case undefined:
                    this.pos = this.source.length;
                    result.type = TokenType.endOfFile;
                    break;

                // #
                case CharCode.hash:
                    if (options.languageVersion === LanguageVersion.tealScript) {
                        this.skipLine();
                        continue;
                    }

                // 继续执行。
                default:

                    // 数字。
                    if (Unicode.isDecimalDigit(ch)) {
                        result.data = this.scanNumericLiteral(ch);
                        result.type = TokenType.numericLiteral;
                        break;
                    }

                    // 标识符。
                    if (Unicode.isIdentifierStart(ch)) {
                        result.data = this.scanIdentifier();
                        result.type = TokenType.identifier;
                        break;
                    }

                    // 空白。
                    if (Unicode.isWhiteSpace(ch)) {
                        continue;
                    }
                    if (Unicode.isLineTerminator(ch)) {
                        result.onNewLine = true;
                        continue;
                    }

                    // 剩下的字符为不支持的字符。
                    this.error("非法字符：“{0}”。", String.fromCharCode(ch));
                    continue;

            }

            break;
        }

        result.end = this.pos;
        return result;

    }

    /**
     * 扫描紧跟的标识符。
     * @param currentChar 当前已读取的字符。如果不传递则直接从当前位置获取。
     */
    private scanIdentifier(currentChar?: number) {

        console.assert(Unicode.isIdentifierStart(currentChar == undefined ? this.source.charCodeAt(this.pos) : currentChar));

        let result: string;
        let start = this.pos;
        while (true) {
            const ch = this.source.charCodeAt(this.pos);
            if (!Unicode.isIdentifierPart(ch)) {
                if (ch === CharCode.backslash) {

                    // 处理反斜杠之前的标识符部分。
                    if (result == undefined) {
                        if (currentChar == undefined) {
                            start--;
                            result = "";
                        } else {
                            result = String.fromCharCode(currentChar);
                        }
                    }
                    result += this.source.substring(start, this.pos);

                    // 处理转义字符。
                    if (this.source.charCodeAt(++this.pos) === CharCode.u) { // \
                        this.pos++; // u
                        result += String.fromCharCode(this.scanDights(16, 4));
                    } else {
                        this.error("非法字符：“\\”；应输入“u”。");
                    }

                    // 继续处理剩下的识符部分。
                    start = this.pos;
                    continue;
                }
                break;
            }
            this.pos++;
        }

        // 如果 result 为空说明未出现过 \u0000 转义字符。
        return result != undefined ?
            result + this.source.substring(start, this.pos) :
            currentChar == undefined ?
                this.source.substring(start - 1, this.pos) :
                String.fromCharCode(currentChar) + this.source.substring(start, this.pos);
    }

    /**
     * 扫描紧跟的字符串。
     * @param currentChar 当前已读取的字符。只能是 '、" 或 `。
     */
    private scanStringLiteral(currentChar: number) {

        // ''' 多行不转义字符串。
        if (options.languageVersion === LanguageVersion.tealScript &&
            this.source.charCodeAt(this.pos + 1) === currentChar &&
            this.source.charCodeAt(this.pos) === currentChar) {
            let start = this.pos += 2;
            for (; this.pos < this.source.length; this.pos++) {
                if (this.source.charCodeAt(this.pos) === currentChar &&
                    this.source.charCodeAt(this.pos + 1) === currentChar &&
                    this.source.charCodeAt(this.pos + 2) === currentChar) {
                    const end = this.pos;
                    this.pos += 3;
                    return this.source.substring(start, end);
                }
            }
            if (options.allowUnterminatedLiteral === false) {
                this.error("字符串未关闭；应输入“{0}”", String.fromCharCode(currentChar) + String.fromCharCode(currentChar) + String.fromCharCode(currentChar));
            }
            return this.source.substring(start, this.pos);
        }

        // 普通字符串和模板字符串。
        let result = "";
        let start = this.pos;
        while (true) {
            let ch = this.source.charCodeAt(this.pos);
            switch (ch) {
                case currentChar:
                    return result + this.source.substring(start, this.pos++);
                case CharCode.backslash:
                    result += this.source.substring(start, this.pos++); // \
                    ch = this.source.charCodeAt(this.pos++); // 转义字符。
                    switch (ch) {
                        case CharCode.singleQuote:
                            result += '\'';
                            break;
                        case CharCode.doubleQuote:
                            result += '\"';
                            break;
                        case CharCode.backtick:
                            result += '`';
                            break;
                        case CharCode.n:
                            result += '\n';
                            break;
                        case CharCode.r:
                            result += '\r';
                            break;
                        case CharCode.t:
                            result += '\t';
                            break;
                        case CharCode.u:
                            // \u{00000000}
                            if (options.languageVersion !== LanguageVersion.javaScript3 &&
                                this.source.charCodeAt(this.pos) === CharCode.openBrace) {
                                this.pos++; // {
                                ch = this.scanDights(16);
                                if (ch > 0x10FFFF) {
                                    this.error("扩展 Unicode 字符必须在 0x0 到 0x10FFFF 之间");
                                    break;
                                }
                                result += ch <= 65535 ? String.fromCharCode(ch) : String.fromCharCode(Math.floor((ch - 65536) / 1024) + 0xD800, ((ch - 65536) % 1024) + 0xDC00);
                                if (this.source.charCodeAt(this.pos++) !== CharCode.closeBrace) {  // }
                                    this.pos--;
                                    this.error("扩展 Unicode 字符未关闭；应输入“}”");
                                    break;
                                }
                            } else {
                                result += String.fromCharCode(this.scanDights(16, 4));
                            }
                            break;
                        case CharCode.x:
                            result += String.fromCharCode(this.scanDights(16, 2));
                            break;
                        case CharCode.b:
                            result += '\b';
                            break;
                        case CharCode.v:
                            result += '\v';
                            break;
                        case CharCode.f:
                            result += '\f';
                            break;
                        case CharCode.carriageReturn:
                            if (this.source.charCodeAt(this.pos) === CharCode.lineFeed) {
                                this.pos++; // \n
                            }
                        // 继续执行。
                        case CharCode.lineFeed:
                        case CharCode.lineSeparator:
                        case CharCode.paragraphSeparator:
                            break;
                        case undefined:
                            this.pos--;
                            this.error("应输入转义字符。");
                            return result;
                        default:
                            result += String.fromCharCode(Unicode.isOctalDigit(ch) ? this.scanDights(8, undefined, 256) : ch);
                            break;
                    }
                    start = this.pos;
                    continue;
                case CharCode.dollar:
                    this.pos++; // $
                    // 模板字符串中的 ${ 。
                    if (currentChar === CharCode.backtick &&
                        this.source.charCodeAt(this.pos) === CharCode.openBrace) {
                        return result + this.source.substring(start, this.pos++ - 1); // {
                    }
                    continue;
                case CharCode.carriageReturn:
                    // 仅在模板字符串内部可换行。换行符 \r 和 \r\n 转 \n。
                    if (currentChar === CharCode.backtick) {
                        result += this.source.substring(start, this.pos++) + "\n"; // \r
                        if (this.source.charCodeAt(this.pos) === CharCode.lineFeed) {
                            this.pos++; // \n
                        }
                        start = this.pos;
                        continue;
                    }
                    break;
                case CharCode.lineFeed:
                    // 仅在模板字符串内部可换行。
                    if (currentChar === CharCode.backtick) {
                        result += this.source.substring(start, this.pos++) + "\n"; // \n
                        start = this.pos;
                        continue;
                    }
                    break;
            }
            if (ch == undefined || Unicode.isLineTerminator(ch)) {
                break;
            }
            this.pos++; // 字符串的字符。
        }

        this.error("字符串未关闭；应输入“{0}”。", String.fromCharCode(currentChar));
        return result + this.source.substring(start, this.pos);
    }

    /**
     * 扫描紧跟的数字部分。
     * @param currentChar 当前已读取的数字字符。
     */
    private scanNumericLiteral(currentChar: number) {

        // 读取整数部分。
        let result = currentChar - CharCode.num0;
        while (true) {
            const num = this.source.charCodeAt(this.pos) - CharCode.num0;
            if (num >= 0 && num <= 9) {
                this.pos++; // 整数部分。
                result = result * 10 + num;
            } else {
                break;
            }
        }

        // 读取小数部分。
        if (this.source.charCodeAt(this.pos) === CharCode.dot) {
            this.pos++; // .
            let p = 1;
            while (true) {
                const num = this.source.charCodeAt(this.pos) - CharCode.num0;
                if (num >= 0 && num <= 9) {
                    this.pos++; // 小数部分。
                    result += num / p;
                    p *= 10;
                } else {
                    break;
                }
            }
        }

        // 读取科学计数法部分。
        switch (this.source.charCodeAt(this.pos)) {
            case CharCode.e:
            case CharCode.E:
                let base: number;
                switch (this.source.charCodeAt(this.pos)) {
                    case CharCode.minus:
                        this.pos++; // -
                        base = -this.scanDights(10);
                        break;
                    case CharCode.plus:
                        this.pos++; // +
                    // 继续执行
                    default:
                        base = this.scanDights(10);
                        break;
                }
                result *= 10 ** base;
                break;
        }

        return result;
    }

    /**
     * 扫描紧跟的数字字符。
     * @param base 进制基数。可以是 2、8、10 或 16。
     * @param count 要求的解析字数。如果未传递则不限制。
     * @param max 允许解析的最大值。如果未传递则不限制。
     * @return 返回解析的数值。
     */
    private scanDights(base: number, count?: number, max?: number) {
        let result = 0;
        const start = this.pos;
        while (true) {
            let num = this.source.charCodeAt(this.pos);
            num = base <= 9 || num >= CharCode.num0 && num <= CharCode.num9 ? num - CharCode.num0 :
                num >= CharCode.A && num <= CharCode.Z ? 10 + num - CharCode.A :
                    num >= CharCode.a && num <= CharCode.z ? 10 + num - CharCode.a : -1;

            // 解析到不合法的数字或超过范围则停止解析。
            if (num < 0 || num >= base ||
                count != undefined && count-- === 0 ||
                max != undefined && result * base + num >= max) {
                break;
            }

            result = result * base + num;
            this.pos++;
        }
        if (start === this.pos || count > 0) {
            this.error(base === 2 ? "应输入二进制数字。" : base === 8 ? "应输入八进制数字。" : base === 16 ? "应输入十六进制数字。" : "应输入数字。");
        }
        return result;
    }

    /**
     * 跳过当前紧跟 Git 的冲突标记。
     * @param currentChar 当前已读取的字符。只能是 <、= 或 >。
     * @param repeatCount 要求的重复个数。
     * @returns 如果跳过成功则返回 true，否则返回 false。
     */
    private skipGitConflictMarker(currentChar: number, repeatCount: number) {
        for (let i = 0; i < repeatCount; i++) {
            if (this.source.charCodeAt(this.pos + i) !== currentChar) {
                return false;
            }
        }
        if (this.source.charCodeAt(this.pos + repeatCount) !== CharCode.space) {
            return false;
        }
        this.pos += repeatCount;
        this.skipLine();
        return true;
    }

    // #endregion

    // #region 重新读取

    /**
     * 以正则表达式重新读取下一个标记。
     */
    readAsRegularExpressionLiteral() {
        console.assert(this.source.charCodeAt(this.current.start) === CharCode.slash);

        // FIXME: 需要测试正则表达式语法?

        let pattern: string;
        let flags: string;
        let data: RegExp;

        let start = this.current.start + 1;
        this.pos = start;

        let tokenIsUnterminated = false;
        let inCharacterClass = false;

        while (true) {
            let ch = this.source.charCodeAt(this.pos++);
            switch (ch) {
                case CharCode.slash:
                    if (inCharacterClass) {
                        continue;
                    }
                    break;
                case CharCode.openBracket:
                    inCharacterClass = true;
                    break;
                case CharCode.closeBracket:
                    inCharacterClass = false;
                    break;
                case CharCode.backslash:
                    ch = this.source.charCodeAt(++this.pos);  // 转义字符
                    if (ch == undefined || Unicode.isLineTerminator(ch)) {
                        tokenIsUnterminated = true;
                    }
                    continue;
                default:
                    if (ch == undefined || Unicode.isLineTerminator(ch)) {
                        this.pos--;
                        tokenIsUnterminated = true;
                        break;
                    }
                    continue;
            }

            break;
        }

        if (tokenIsUnterminated) {
            this.error("正则表达式未关闭；应输入“/”");
            pattern = this.source.substring(start, this.pos);
        } else {
            pattern = this.source.substring(start, this.pos - 1);
            start = this.pos;
            while (Unicode.isIdentifierPart(this.source.charCodeAt(this.pos))) {
                this.pos++;
            }
            flags = this.source.substring(start, this.pos);
        }

        return this.current = this.current._next = <Token>{
            start: this.current.start,
            type: TokenType.regularExpressionLiteral,
            data: { pattern, flags },
            end: this.pos
        };
    }

    /**
     * 以模板中间或尾部重新读取下一个标记。
     */
    readAsTemplateMiddleOrTail() {
        console.assert(this.source.charCodeAt(this.current.start) === CharCode.closeBrace);

        let start = this.current.start + 1;
        this.pos = start;

        const data = this.scanStringLiteral(CharCode.backtick);
        return this.current = this.current._next = <Token>{
            start: this.current.start,
            type: this.source.charCodeAt(this.pos - 1) === CharCode.openBrace ? TokenType.templateMiddle : TokenType.templateTail,
            data: data,
            end: this.pos
        };
    }

    /**
     * 以 JSX 标签名重新读取下一个标记。
     */
    readAsJsxTagName() {

    }

    // #endregion

}

/**
 * 表示一个标记。
 */
export interface Token {

    /**
     * 获取下一个标记。如果下一个标记未解析则返回 undefined。
     */
    _next?: Token;

    /**
     * 获取当前标记的类型。
     */
    type: TokenType;

    /**
     * 获取当前标记的开始位置。
     */
    start: number;

    /**
     * 获取当前标记的结束位置。
     */
    end: number;

    /**
     * 判断当前标记之前是否存在换行符。如果不存在换行符则返回 undefined。
     */
    onNewLine?: boolean;

    /**
     * 获取当前标记相关的数据。如果当前标记不存在数据则返回 undefined。
     */
    data?: any;

}
