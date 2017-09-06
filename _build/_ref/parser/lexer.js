"use strict";
/**
 * @fileOverview 词法解析器
 * @author xuld@vip.qq.com
 */
exports.__esModule = true;
var tokenType_1 = require("../ast/tokenType");
var compiler_1 = require("../compiler/compiler");
var charCode_1 = require("./charCode");
var Unicode = require("./unicode");
/**
 * 表示一个词法解析器。
 * @description 词法解析器可以将源码解析成多个标记的序列。
 */
var Lexer = (function () {
    function Lexer() {
    }
    /**
     * 设置要解析的源码。
     * @param text 要解析的源码文本。
     * @param start 解析的源码开始位置。
     * @param fileName 解析的源码位置。
     */
    Lexer.prototype.setSource = function (text, start, fileName) {
        if (start === void 0) { start = 0; }
        this.source = text;
        this.pos = start;
        this.fileName = fileName;
        delete this.comments;
        // 跳过开头的 #! 部分。
        if (compiler_1.options.allowShebang !== false) {
            this.skipShebang();
        }
        // 预读第一个标记。
        var firstToken = this.scan();
        firstToken.onNewLine = true;
        this.current = {
            _next: firstToken,
            type: tokenType_1.TokenType.unknown,
            start: start,
            end: start,
            onNewLine: true
        };
    };
    /**
     * 预览下一个标记。
     * @returns 返回一个标记对象。
     */
    Lexer.prototype.peek = function () {
        return this.current._next;
    };
    /**
     * 读取下一个标记。
     * @returns 返回一个标记对象。
     */
    Lexer.prototype.read = function () {
        var next = this.current._next;
        if (next._next == null) {
            next._next = this.scan();
        }
        return this.current = next;
    };
    /**
     * 保存当前读取的进度。保存之后可以通过 {@link stashRestore} 恢复进度。
     */
    Lexer.prototype.stashSave = function () {
        this.stash = this.current;
    };
    /**
     * 恢复之前保存的进度。
     */
    Lexer.prototype.stashRestore = function () {
        this.current = this.stash;
        delete this.stash;
    };
    /**
     * 清除之前保存的进度。
     */
    Lexer.prototype.stashClear = function () {
        delete this.stash;
    };
    // #endregion
    // #region 解析
    /**
     * 报告一个词法解析错误。
     * @param message 错误的信息。
     * @param args 格式化信息的参数。
     */
    Lexer.prototype.error = function (message) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        compiler_1.error.apply(void 0, [compiler_1.ErrorType.lexicalError, this.fileName, this.pos, this.pos, message].concat(args));
    };
    /**
     * 当解析到一个注释时执行。
     * @param multiLineComment 标记是否是多行注释。
     * @param start 注释的开始位置。
     * @param end 注释的结束位置。
     */
    Lexer.prototype.comment = function (multiLineComment, start, end) {
        if (compiler_1.options.parseComments) {
            this.comments = this.comments || [];
            this.comments.push({ start: start, end: end });
        }
    };
    /**
     * 跳过开头的 #! 标记。
     */
    Lexer.prototype.skipShebang = function () {
        if (this.source.charCodeAt(this.pos) === charCode_1.CharCode.hash && this.source.charCodeAt(this.pos + 1) === charCode_1.CharCode.exclamation) {
            this.pos += 2;
            this.skipLine();
        }
    };
    /**
     * 跳过当前行剩下的所有字符。
     */
    Lexer.prototype.skipLine = function () {
        while (this.pos < this.source.length && !Unicode.isLineTerminator(this.source.charCodeAt(this.pos))) {
            this.pos++;
        }
    };
    /**
     * 从源码扫描下一个标记。
     * @returns 返回解析的标记对象。
     */
    Lexer.prototype.scan = function () {
        console.assert(this.source != null, "应先调用“setSource()”设置源码内容。");
        var result = {};
        while (true) {
            var ch = this.source.charCodeAt(result.start = this.pos++);
            // 标识符、关键字
            if (ch >= charCode_1.CharCode.a && ch <= charCode_1.CharCode.z) {
                result.data = this.scanIdentifier();
                result.type = tokenType_1.stringToToken(result.data);
                break;
            }
            switch (ch) {
                // \s、\t
                case charCode_1.CharCode.space:
                case charCode_1.CharCode.horizontalTab:
                    // 加速连续空格解析。
                    while (Unicode.isWhiteSpace(this.pos)) {
                        this.pos++;
                    }
                    continue;
                // \r、\n
                case charCode_1.CharCode.carriageReturn:
                case charCode_1.CharCode.lineFeed:
                    result.onNewLine = true;
                    continue;
                // /、//、/*、/=
                case charCode_1.CharCode.slash:
                    switch (this.source.charCodeAt(this.pos++)) {
                        case charCode_1.CharCode.slash:
                            var singleCommentStart = this.pos;
                            this.skipLine();
                            this.comment(false, singleCommentStart, this.pos);
                            continue;
                        case charCode_1.CharCode.asterisk:
                            var multiCommentStart = this.pos;
                            var multiCommentEnd = void 0;
                            while (this.pos < this.source.length) {
                                ch = this.source.charCodeAt(this.pos++); // 注释字符。
                                if (Unicode.isLineTerminator(ch)) {
                                    result.onNewLine = true;
                                }
                                else if (ch === charCode_1.CharCode.asterisk && this.source.charCodeAt(this.pos + 1) === charCode_1.CharCode.slash) {
                                    multiCommentEnd = this.pos - 2;
                                    this.pos++;
                                    break;
                                }
                            }
                            if (multiCommentEnd == null && compiler_1.options.languageVersion !== compiler_1.LanguageVersion.tealScript) {
                                this.error("多行注释未关闭；应输入“*/”。");
                            }
                            this.comment(true, multiCommentStart, multiCommentEnd);
                            continue;
                        case charCode_1.CharCode.equals:
                            result.type = tokenType_1.TokenType.slashEquals;
                            break;
                        default:
                            this.pos--;
                            result.type = tokenType_1.TokenType.slash;
                            break;
                    }
                    break;
                // .1、..、...
                case charCode_1.CharCode.dot:
                    if (Unicode.isDecimalDigit(this.pos)) {
                        this.pos--;
                        result.data = this.scanNumericLiteral(charCode_1.CharCode.num0);
                        result.type = tokenType_1.TokenType.numericLiteral;
                        break;
                    }
                    if (this.source.charCodeAt(this.pos) === charCode_1.CharCode.dot) {
                        this.pos++; // .
                        if (this.source.charCodeAt(this.pos) === charCode_1.CharCode.dot) {
                            this.pos++; // .
                            result.type = tokenType_1.TokenType.dotDotDot;
                            break;
                        }
                        result.type = tokenType_1.TokenType.dotDot;
                        break;
                    }
                    result.type = tokenType_1.TokenType.dot;
                    break;
                // (
                case charCode_1.CharCode.openParen:
                    result.type = tokenType_1.TokenType.openParen;
                    break;
                // )
                case charCode_1.CharCode.closeParen:
                    result.type = tokenType_1.TokenType.closeParen;
                    break;
                // {
                case charCode_1.CharCode.openBrace:
                    result.type = tokenType_1.TokenType.openBrace;
                    break;
                // }
                case charCode_1.CharCode.closeBrace:
                    result.type = tokenType_1.TokenType.closeBrace;
                    break;
                // ;
                case charCode_1.CharCode.semicolon:
                    result.type = tokenType_1.TokenType.semicolon;
                    break;
                // =、==、===、=>
                case charCode_1.CharCode.equals:
                    switch (this.source.charCodeAt(this.pos)) {
                        case charCode_1.CharCode.equals:
                            this.pos++; // =
                            if (this.source.charCodeAt(this.pos) === charCode_1.CharCode.equals) {
                                this.pos++; // =
                                if (compiler_1.options.allowGitConflictMarker !== false && result.onNewLine && this.skipGitConflictMarker(charCode_1.CharCode.equals, 4)) {
                                    // 跳过冲突的第二个版本。
                                    while (this.pos < this.source.length) {
                                        if (this.skipGitConflictMarker(charCode_1.CharCode.greaterThan, 7)) {
                                            break;
                                        }
                                        this.skipLine();
                                    }
                                    continue;
                                }
                                result.type = tokenType_1.TokenType.equalsEqualsEquals;
                                break;
                            }
                            result.type = tokenType_1.TokenType.equalsEquals;
                        case charCode_1.CharCode.greaterThan:
                            this.pos++; // >
                            result.type = tokenType_1.TokenType.equalsGreaterThan;
                            break;
                        default:
                            result.type = tokenType_1.TokenType.equals;
                            break;
                    }
                    break;
                // '、"
                case charCode_1.CharCode.singleQuote:
                case charCode_1.CharCode.doubleQuote:
                    result.data = this.scanStringLiteral(ch);
                    result.type = tokenType_1.TokenType.stringLiteral;
                    break;
                // `
                case charCode_1.CharCode.backtick:
                    result.data = this.scanStringLiteral(ch);
                    result.type = this.source.charCodeAt(this.pos - 1) === charCode_1.CharCode.openBrace ? tokenType_1.TokenType.templateHead : tokenType_1.TokenType.noSubstitutionTemplateLiteral;
                    break;
                // +、++、+=
                case charCode_1.CharCode.plus:
                    switch (this.source.charCodeAt(this.pos)) {
                        case charCode_1.CharCode.plus:
                            this.pos++; // +
                            result.type = tokenType_1.TokenType.plusPlus;
                            break;
                        case charCode_1.CharCode.equals:
                            this.pos++; // =
                            result.type = tokenType_1.TokenType.plusEquals;
                            break;
                        default:
                            result.type = tokenType_1.TokenType.plus;
                            break;
                    }
                    break;
                // -、--、-=
                case charCode_1.CharCode.minus:
                    switch (this.source.charCodeAt(this.pos)) {
                        case charCode_1.CharCode.minus:
                            this.pos++; // -
                            result.type = tokenType_1.TokenType.minusMinus;
                            break;
                        case charCode_1.CharCode.equals:
                            this.pos++; // =
                            result.type = tokenType_1.TokenType.minusEquals;
                            break;
                        default:
                            result.type = tokenType_1.TokenType.minus;
                            break;
                    }
                    break;
                // ,
                case charCode_1.CharCode.comma:
                    result.type = tokenType_1.TokenType.comma;
                    break;
                // :
                case charCode_1.CharCode.colon:
                    result.type = tokenType_1.TokenType.colon;
                    break;
                // ?
                case charCode_1.CharCode.question:
                    result.type = tokenType_1.TokenType.question;
                    break;
                // [
                case charCode_1.CharCode.openBracket:
                    result.type = tokenType_1.TokenType.openBracket;
                    break;
                // ]
                case charCode_1.CharCode.closeBracket:
                    result.type = tokenType_1.TokenType.closeBracket;
                    break;
                // 0x000、0b000、0O000、0
                case charCode_1.CharCode.num0:
                    switch (this.source.charCodeAt(this.pos++)) {
                        case charCode_1.CharCode.x:
                        case charCode_1.CharCode.X:
                            result.data = this.scanDights(16);
                            break;
                        case charCode_1.CharCode.b:
                        case charCode_1.CharCode.B:
                            result.data = this.scanDights(2);
                            break;
                        case charCode_1.CharCode.o:
                        case charCode_1.CharCode.O:
                            result.data = this.scanDights(8);
                            break;
                        default:
                            // EcmaScript 规定 0 后必须跟八进制数字，
                            // 实际上大部分编译器将 08 和 09 解释为十进制数字。
                            // todo: 严格模式需要输出语法错误。
                            result.data = Unicode.isOctalDigit(this.source.charCodeAt(--this.pos)) ?
                                this.scanDights(8) :
                                this.scanNumericLiteral(charCode_1.CharCode.num0);
                            break;
                    }
                    result.type = tokenType_1.TokenType.numericLiteral;
                    break;
                // @
                case charCode_1.CharCode.at:
                    result.type = tokenType_1.TokenType.at;
                    break;
                // !、!=、!==
                case charCode_1.CharCode.exclamation:
                    if (this.source.charCodeAt(this.pos) === charCode_1.CharCode.equals) {
                        if (this.source.charCodeAt(++this.pos) === charCode_1.CharCode.equals) {
                            this.pos++; // =
                            result.type = tokenType_1.TokenType.exclamationEqualsEquals;
                            break;
                        }
                        result.type = tokenType_1.TokenType.exclamationEquals;
                        break;
                    }
                    result.type = tokenType_1.TokenType.exclamation;
                    break;
                // %、%=
                case charCode_1.CharCode.percent:
                    if (this.source.charCodeAt(this.pos) === tokenType_1.TokenType.equals) {
                        this.pos++; // =
                        result.type = tokenType_1.TokenType.percentEquals;
                        break;
                    }
                    result.type = tokenType_1.TokenType.percent;
                    break;
                // &、&&、&=
                case charCode_1.CharCode.ampersand:
                    switch (this.source.charCodeAt(this.pos)) {
                        case charCode_1.CharCode.ampersand:
                            this.pos++; // &
                            result.type = tokenType_1.TokenType.ampersandAmpersand;
                            break;
                        case charCode_1.CharCode.equals:
                            this.pos++; // =
                            result.type = tokenType_1.TokenType.ampersandEquals;
                            break;
                        default:
                            result.type = tokenType_1.TokenType.ampersand;
                            break;
                    }
                    break;
                // *、**、**=、*=
                case charCode_1.CharCode.asterisk:
                    switch (this.source.charCodeAt(this.pos)) {
                        case charCode_1.CharCode.asterisk:
                            if (this.source.charCodeAt(++this.pos) === charCode_1.CharCode.equals) {
                                this.pos++; // =
                                result.type = tokenType_1.TokenType.asteriskAsteriskEquals;
                                break;
                            }
                            result.type = tokenType_1.TokenType.asteriskAsterisk;
                            break;
                        case charCode_1.CharCode.equals:
                            this.pos++; // =
                            result.type = tokenType_1.TokenType.asteriskEquals;
                            break;
                        default:
                            result.type = tokenType_1.TokenType.asterisk;
                            break;
                    }
                    break;
                // <、<<、<<=、<=
                case charCode_1.CharCode.lessThan:
                    switch (this.source.charCodeAt(this.pos)) {
                        case charCode_1.CharCode.lessThan:
                            this.pos++; // <
                            if (compiler_1.options.allowGitConflictMarker !== false && result.onNewLine && this.skipGitConflictMarker(charCode_1.CharCode.lessThan, 5)) {
                                continue;
                            }
                            if (this.source.charCodeAt(this.pos) === charCode_1.CharCode.equals) {
                                this.pos++; // =
                                result.type = tokenType_1.TokenType.lessThanLessThanEquals;
                                break;
                            }
                            result.type = tokenType_1.TokenType.lessThanLessThan;
                            break;
                        case charCode_1.CharCode.equals:
                            this.pos++; // =
                            result.type = tokenType_1.TokenType.lessThanEquals;
                            break;
                        default:
                            result.type = tokenType_1.TokenType.lessThan;
                            break;
                    }
                    break;
                // >, >=, >>、>>=、>>>、>>>=
                case charCode_1.CharCode.greaterThan:
                    switch (this.source.charCodeAt(this.pos)) {
                        case charCode_1.CharCode.equals:
                            this.pos++; // =
                            result.type = tokenType_1.TokenType.greaterThanEquals;
                            break;
                        case charCode_1.CharCode.greaterThan:
                            switch (this.source.charCodeAt(++this.pos)) {
                                case charCode_1.CharCode.equals:
                                    this.pos++;
                                    result.type = tokenType_1.TokenType.greaterThanGreaterThanEquals;
                                    break;
                                case charCode_1.CharCode.greaterThan:
                                    if (this.source.charCodeAt(++this.pos) === charCode_1.CharCode.equals) {
                                        this.pos++;
                                        result.type = tokenType_1.TokenType.greaterThanGreaterThanGreaterThanEquals;
                                        break;
                                    }
                                    result.type = tokenType_1.TokenType.greaterThanGreaterThanGreaterThan;
                                    break;
                                default:
                                    result.type = tokenType_1.TokenType.greaterThanGreaterThan;
                                    break;
                            }
                            break;
                        default:
                            result.type = tokenType_1.TokenType.greaterThan;
                            break;
                    }
                    break;
                // |、|=、||
                case charCode_1.CharCode.bar:
                    switch (this.source.charCodeAt(this.pos)) {
                        case charCode_1.CharCode.bar:
                            this.pos++; // |
                            result.type = tokenType_1.TokenType.barBar;
                            break;
                        case charCode_1.CharCode.equals:
                            this.pos++; // =
                            result.type = tokenType_1.TokenType.barEquals;
                            break;
                        default:
                            result.type = tokenType_1.TokenType.bar;
                            break;
                    }
                    break;
                // ~
                case charCode_1.CharCode.tilde:
                    result.type = tokenType_1.TokenType.tilde;
                    break;
                // ^、^=
                case charCode_1.CharCode.caret:
                    if (this.source.charCodeAt(this.pos) === charCode_1.CharCode.equals) {
                        this.pos++; // =
                        result.type = tokenType_1.TokenType.caretEquals;
                        break;
                    }
                    result.type = tokenType_1.TokenType.caret;
                    break;
                // \u0000
                case charCode_1.CharCode.backslash:
                    if (this.source.charCodeAt(this.pos) === charCode_1.CharCode.u) {
                        this.pos++;
                        ch = this.scanDights(16, 4);
                        if (Unicode.isIdentifierStart(ch)) {
                            result.data = this.scanIdentifier(ch);
                            if ((compiler_1.options.languageVersion === compiler_1.LanguageVersion.javaScript3 || compiler_1.options.languageVersion === compiler_1.LanguageVersion.javaScript) && tokenType_1.stringToToken(result.data) !== tokenType_1.TokenType.identifier) {
                                this.error("关键字不能使用 Unicode 编码表示。");
                            }
                            result.type = tokenType_1.TokenType.identifier;
                            break;
                        }
                    }
                    this.error("非法字符：“{0}”。", '#');
                    continue;
                case undefined:
                    this.pos = this.source.length;
                    result.type = tokenType_1.TokenType.endOfFile;
                    break;
                // #
                case charCode_1.CharCode.hash:
                    if (compiler_1.options.languageVersion === compiler_1.LanguageVersion.tealScript) {
                        this.skipLine();
                        continue;
                    }
                // 继续执行。
                default:
                    // 数字。
                    if (Unicode.isDecimalDigit(ch)) {
                        result.data = this.scanNumericLiteral(ch);
                        result.type = tokenType_1.TokenType.numericLiteral;
                        break;
                    }
                    // 标识符。
                    if (Unicode.isIdentifierStart(ch)) {
                        result.data = this.scanIdentifier();
                        result.type = tokenType_1.TokenType.identifier;
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
    };
    /**
     * 扫描紧跟的标识符。
     * @param currentChar 当前已读取的字符。如果不传递则直接从当前位置获取。
     */
    Lexer.prototype.scanIdentifier = function (currentChar) {
        console.assert(Unicode.isIdentifierStart(currentChar == undefined ? this.source.charCodeAt(this.pos) : currentChar));
        var result;
        var start = this.pos;
        while (true) {
            var ch = this.source.charCodeAt(this.pos);
            if (!Unicode.isIdentifierPart(ch)) {
                if (ch === charCode_1.CharCode.backslash) {
                    // 处理反斜杠之前的标识符部分。
                    if (result == undefined) {
                        if (currentChar == undefined) {
                            start--;
                            result = "";
                        }
                        else {
                            result = String.fromCharCode(currentChar);
                        }
                    }
                    result += this.source.substring(start, this.pos);
                    // 处理转义字符。
                    if (this.source.charCodeAt(++this.pos) === charCode_1.CharCode.u) {
                        this.pos++; // u
                        result += String.fromCharCode(this.scanDights(16, 4));
                    }
                    else {
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
    };
    /**
     * 扫描紧跟的字符串。
     * @param currentChar 当前已读取的字符。只能是 '、" 或 `。
     */
    Lexer.prototype.scanStringLiteral = function (currentChar) {
        // ''' 多行不转义字符串。
        if (compiler_1.options.languageVersion === compiler_1.LanguageVersion.tealScript &&
            this.source.charCodeAt(this.pos + 1) === currentChar &&
            this.source.charCodeAt(this.pos) === currentChar) {
            var start_1 = this.pos += 2;
            for (; this.pos < this.source.length; this.pos++) {
                if (this.source.charCodeAt(this.pos) === currentChar &&
                    this.source.charCodeAt(this.pos + 1) === currentChar &&
                    this.source.charCodeAt(this.pos + 2) === currentChar) {
                    var end = this.pos;
                    this.pos += 3;
                    return this.source.substring(start_1, end);
                }
            }
            if (compiler_1.options.allowUnterminatedLiteral === false) {
                this.error("字符串未关闭；应输入“{0}”", String.fromCharCode(currentChar) + String.fromCharCode(currentChar) + String.fromCharCode(currentChar));
            }
            return this.source.substring(start_1, this.pos);
        }
        // 普通字符串和模板字符串。
        var result = "";
        var start = this.pos;
        while (true) {
            var ch = this.source.charCodeAt(this.pos);
            switch (ch) {
                case currentChar:
                    return result + this.source.substring(start, this.pos++);
                case charCode_1.CharCode.backslash:
                    result += this.source.substring(start, this.pos++); // \
                    ch = this.source.charCodeAt(this.pos++); // 转义字符。
                    switch (ch) {
                        case charCode_1.CharCode.singleQuote:
                            result += '\'';
                            break;
                        case charCode_1.CharCode.doubleQuote:
                            result += '\"';
                            break;
                        case charCode_1.CharCode.backtick:
                            result += '`';
                            break;
                        case charCode_1.CharCode.n:
                            result += '\n';
                            break;
                        case charCode_1.CharCode.r:
                            result += '\r';
                            break;
                        case charCode_1.CharCode.t:
                            result += '\t';
                            break;
                        case charCode_1.CharCode.u:
                            // \u{00000000}
                            if (compiler_1.options.languageVersion !== compiler_1.LanguageVersion.javaScript3 &&
                                this.source.charCodeAt(this.pos) === charCode_1.CharCode.openBrace) {
                                this.pos++; // {
                                ch = this.scanDights(16);
                                if (ch > 0x10FFFF) {
                                    this.error("扩展 Unicode 字符必须在 0x0 到 0x10FFFF 之间");
                                    break;
                                }
                                result += ch <= 65535 ? String.fromCharCode(ch) : String.fromCharCode(Math.floor((ch - 65536) / 1024) + 0xD800, ((ch - 65536) % 1024) + 0xDC00);
                                if (this.source.charCodeAt(this.pos++) !== charCode_1.CharCode.closeBrace) {
                                    this.pos--;
                                    this.error("扩展 Unicode 字符未关闭；应输入“}”");
                                    break;
                                }
                            }
                            else {
                                result += String.fromCharCode(this.scanDights(16, 4));
                            }
                            break;
                        case charCode_1.CharCode.x:
                            result += String.fromCharCode(this.scanDights(16, 2));
                            break;
                        case charCode_1.CharCode.b:
                            result += '\b';
                            break;
                        case charCode_1.CharCode.v:
                            result += '\v';
                            break;
                        case charCode_1.CharCode.f:
                            result += '\f';
                            break;
                        case charCode_1.CharCode.carriageReturn:
                            if (this.source.charCodeAt(this.pos) === charCode_1.CharCode.lineFeed) {
                                this.pos++; // \n
                            }
                        // 继续执行。
                        case charCode_1.CharCode.lineFeed:
                        case charCode_1.CharCode.lineSeparator:
                        case charCode_1.CharCode.paragraphSeparator:
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
                case charCode_1.CharCode.dollar:
                    this.pos++; // $
                    // 模板字符串中的 ${ 。
                    if (currentChar === charCode_1.CharCode.backtick &&
                        this.source.charCodeAt(this.pos) === charCode_1.CharCode.openBrace) {
                        return result + this.source.substring(start, this.pos++ - 1); // {
                    }
                    continue;
                case charCode_1.CharCode.carriageReturn:
                    // 仅在模板字符串内部可换行。换行符 \r 和 \r\n 转 \n。
                    if (currentChar === charCode_1.CharCode.backtick) {
                        result += this.source.substring(start, this.pos++) + "\n"; // \r
                        if (this.source.charCodeAt(this.pos) === charCode_1.CharCode.lineFeed) {
                            this.pos++; // \n
                        }
                        start = this.pos;
                        continue;
                    }
                    break;
                case charCode_1.CharCode.lineFeed:
                    // 仅在模板字符串内部可换行。
                    if (currentChar === charCode_1.CharCode.backtick) {
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
    };
    /**
     * 扫描紧跟的数字部分。
     * @param currentChar 当前已读取的数字字符。
     */
    Lexer.prototype.scanNumericLiteral = function (currentChar) {
        // 读取整数部分。
        var result = currentChar - charCode_1.CharCode.num0;
        while (true) {
            var num = this.source.charCodeAt(this.pos) - charCode_1.CharCode.num0;
            if (num >= 0 && num <= 9) {
                this.pos++; // 整数部分。
                result = result * 10 + num;
            }
            else {
                break;
            }
        }
        // 读取小数部分。
        if (this.source.charCodeAt(this.pos) === charCode_1.CharCode.dot) {
            this.pos++; // .
            var p = 1;
            while (true) {
                var num = this.source.charCodeAt(this.pos) - charCode_1.CharCode.num0;
                if (num >= 0 && num <= 9) {
                    this.pos++; // 小数部分。
                    result += num / p;
                    p *= 10;
                }
                else {
                    break;
                }
            }
        }
        // 读取科学计数法部分。
        switch (this.source.charCodeAt(this.pos)) {
            case charCode_1.CharCode.e:
            case charCode_1.CharCode.E:
                var base = void 0;
                switch (this.source.charCodeAt(this.pos)) {
                    case charCode_1.CharCode.minus:
                        this.pos++; // -
                        base = -this.scanDights(10);
                        break;
                    case charCode_1.CharCode.plus:
                        this.pos++; // +
                    // 继续执行
                    default:
                        base = this.scanDights(10);
                        break;
                }
                result *= Math.pow(10, base);
                break;
        }
        return result;
    };
    /**
     * 扫描紧跟的数字字符。
     * @param base 进制基数。可以是 2、8、10 或 16。
     * @param count 要求的解析字数。如果未传递则不限制。
     * @param max 允许解析的最大值。如果未传递则不限制。
     * @return 返回解析的数值。
     */
    Lexer.prototype.scanDights = function (base, count, max) {
        var result = 0;
        var start = this.pos;
        while (true) {
            var num = this.source.charCodeAt(this.pos);
            num = base <= 9 || num >= charCode_1.CharCode.num0 && num <= charCode_1.CharCode.num9 ? num - charCode_1.CharCode.num0 :
                num >= charCode_1.CharCode.A && num <= charCode_1.CharCode.Z ? 10 + num - charCode_1.CharCode.A :
                    num >= charCode_1.CharCode.a && num <= charCode_1.CharCode.z ? 10 + num - charCode_1.CharCode.a : -1;
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
    };
    /**
     * 跳过当前紧跟 Git 的冲突标记。
     * @param currentChar 当前已读取的字符。只能是 <、= 或 >。
     * @param repeatCount 要求的重复个数。
     * @returns 如果跳过成功则返回 true，否则返回 false。
     */
    Lexer.prototype.skipGitConflictMarker = function (currentChar, repeatCount) {
        for (var i = 0; i < repeatCount; i++) {
            if (this.source.charCodeAt(this.pos + i) !== currentChar) {
                return false;
            }
        }
        if (this.source.charCodeAt(this.pos + repeatCount) !== charCode_1.CharCode.space) {
            return false;
        }
        this.pos += repeatCount;
        this.skipLine();
        return true;
    };
    // #endregion
    // #region 重新读取
    /**
     * 以正则表达式重新读取下一个标记。
     */
    Lexer.prototype.readAsRegularExpressionLiteral = function () {
        console.assert(this.source.charCodeAt(this.current.start) === charCode_1.CharCode.slash);
        // FIXME: 需要测试正则表达式语法?
        var pattern;
        var flags;
        var data;
        var start = this.current.start + 1;
        this.pos = start;
        var tokenIsUnterminated = false;
        var inCharacterClass = false;
        while (true) {
            var ch = this.source.charCodeAt(this.pos++);
            switch (ch) {
                case charCode_1.CharCode.slash:
                    if (inCharacterClass) {
                        continue;
                    }
                    break;
                case charCode_1.CharCode.openBracket:
                    inCharacterClass = true;
                    break;
                case charCode_1.CharCode.closeBracket:
                    inCharacterClass = false;
                    break;
                case charCode_1.CharCode.backslash:
                    ch = this.source.charCodeAt(++this.pos); // 转义字符
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
        }
        else {
            pattern = this.source.substring(start, this.pos - 1);
            start = this.pos;
            while (Unicode.isIdentifierPart(this.source.charCodeAt(this.pos))) {
                this.pos++;
            }
            flags = this.source.substring(start, this.pos);
        }
        return this.current = this.current._next = {
            start: this.current.start,
            type: tokenType_1.TokenType.regularExpressionLiteral,
            data: { pattern: pattern, flags: flags },
            end: this.pos
        };
    };
    /**
     * 以模板中间或尾部重新读取下一个标记。
     */
    Lexer.prototype.readAsTemplateMiddleOrTail = function () {
        console.assert(this.source.charCodeAt(this.current.start) === charCode_1.CharCode.closeBrace);
        var start = this.current.start + 1;
        this.pos = start;
        var data = this.scanStringLiteral(charCode_1.CharCode.backtick);
        return this.current = this.current._next = {
            start: this.current.start,
            type: this.source.charCodeAt(this.pos - 1) === charCode_1.CharCode.openBrace ? tokenType_1.TokenType.templateMiddle : tokenType_1.TokenType.templateTail,
            data: data,
            end: this.pos
        };
    };
    /**
     * 以 JSX 标签名重新读取下一个标记。
     */
    Lexer.prototype.readAsJsxTagName = function () {
    };
    return Lexer;
}());
exports.Lexer = Lexer;
