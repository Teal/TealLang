"use strict";
/**
 * @fileOverview 语法解析器
 */
exports.__esModule = true;
var tokenType_1 = require("../ast/tokenType");
var nodes = require("../ast/nodes");
var charCode_1 = require("./charCode");
var lexer_1 = require("./lexer");
var compiler_1 = require("../compiler/compiler");
/**
 * 表示一个语法解析器。
 * @description 语法解析器可以将源码解析一个语法树。
 */
var Parser = (function () {
    function Parser() {
        // #region 接口
        /**
         * 获取或设置当前语法解析器使用的词法解析器。
         */
        this.lexer = new lexer_1.Lexer();
        // #endregion
        ///**
        // * 解析一个逗号隔开的节点列表(<..., ...>。
        // */
        //parseNodeList<T extends nodes.Node>(nodes: nodes.NodeList<T>) {
        //    for (const node of nodes) {
        //    }
        //}
    }
    /**
     * 解析指定的源文件。
     * @param text 要解析的源码。
     * @param start 解析的源码开始位置。
     * @param fileName 解析的源码位置。
     */
    Parser.prototype.parse = function (text, start, fileName) {
        return this.parseSourceFile(text || "", start || 0, fileName || "");
    };
    /**
     * 从指定的输入解析一个语句。
     * @param text 要解析的源码。
     * @param start 解析的源码开始位置。
     * @param fileName 解析的源码位置。
     */
    Parser.prototype.parseAsStatement = function (text, start, fileName) {
        this.lexer.setSource(text, start, fileName);
        return this.parseStatement();
    };
    /**
     * 从指定的输入解析一个表达式。
     * @param text 要解析的源码。
     * @param start 解析的源码开始位置。
     * @param fileName 解析的源码位置。
     */
    Parser.prototype.parseAsExpression = function (text, start, fileName) {
        this.lexer.setSource(text, start, fileName);
        return this.parseExpression();
    };
    /**
     * 从指定的输入解析一个类型表达式。
     * @param text 要解析的源码。
     * @param start 解析的源码开始位置。
     * @param fileName 解析的源码位置。
     */
    Parser.prototype.parseAsTypeExpression = function (text, start, fileName) {
        delete this.lexer.comment;
        this.lexer.setSource(text, start, fileName);
        return this.parseTypeExpression();
    };
    // #endregion
    // #region 解析工具
    /**
     * 报告一个语法错误。
     * @param token 发生错误的标记。
     * @param message 错误的信息。
     * @param args 格式化错误的参数。
     */
    Parser.prototype.error = function (token, message) {
        var args = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args[_i - 2] = arguments[_i];
        }
        compiler_1.error.apply(void 0, [compiler_1.ErrorType.syntaxError, this.lexer.fileName, token.start, token.end, message].concat(args));
    };
    ///**
    // * 存储解析的内部标记。
    // */
    //private flags: ParseFlags = 0;
    /**
     * 读取下一个标记。如果下一个标记不是指定的类型则输出一条错误。
     * @param token 期待的标记。
     * @returns 返回读取的标记。
     */
    Parser.prototype.expectToken = function (token) {
        if (this.lexer.peek().type === token) {
            return this.lexer.read();
        }
        this.error(this.lexer.peek(), token === tokenType_1.TokenType.identifier ? isKeyword(this.lexer.peek().type) ? "应输入标识符；“{0}”是关键字。" : "应输入标识符。" : "应输入“{0}”。", tokenType_1.tokenToString(token));
        return this.lexer.current;
    };
    ///**
    // * 解析一个逗号隔开的节点列表(<..., ...>。
    // * @param nodes 要解析的节点列表。
    // */
    //private parseNodeList<T extends Node>(start: TokenType, parseElement: () => T, end: TokenType) {
    //    const result = new nodes.NodeList<T>();
    //    return result;
    //}
    /**
     * 读取一个分号，如果不存在则自动插入。
     * @return 返回分号或自动插入点的结束位置。
     */
    Parser.prototype.expectSemicolon = function () {
        switch (this.lexer.peek().type) {
            case tokenType_1.TokenType.semicolon:
                return this.lexer.read().end;
            case tokenType_1.TokenType.closeBrace:
            case tokenType_1.TokenType.endOfFile:
                return compiler_1.options.allowMissingSemicolon === false ?
                    this.expectToken(tokenType_1.TokenType.semicolon).end :
                    this.lexer.current.end;
            default:
                // 根据标准：只有出现换行时才允许自动插入分号。
                // 当启用 smartSemicolonInsertion 时，将允许在未换行时自动插入分号。
                return compiler_1.options.allowMissingSemicolon === false || (compiler_1.options.smartSemicolonInsertion === false && !this.lexer.peek().onNewLine) ?
                    this.expectToken(tokenType_1.TokenType.semicolon).end :
                    this.lexer.current.end;
        }
    };
    /**
     * 读取一个标识符，如果是关键字则自动转换。
     * @return 返回标识符节点。
     */
    Parser.prototype.expectIdentifier = function () {
    };
    // #endregion
    // #region 节点
    /**
     * 解析一个源文件。
     */
    Parser.prototype.parseSourceFile = function (text, start, fileName) {
        var result = new nodes.SourceFile();
        result.path = fileName;
        result.content = text;
        result.start = start;
        this.lexer.setSource(text, start, fileName);
        if (this.lexer.comments) {
            for (var _i = 0, _a = this.lexer.comments; _i < _a.length; _i++) {
                var comment = _a[_i];
                // 只处理 /// 开头的注释。
                if (this.lexer.source.charCodeAt(comment.start) !== charCode_1.CharCode.slash ||
                    this.lexer.source.charCodeAt(comment.start - 1) !== charCode_1.CharCode.slash) {
                    continue;
                }
            }
        }
        //// 解析文件主文档注释。
        //if (options.parseJsDoc !== false) {
        //}
        //// 解析 <reference /> 注释。
        //if (options.parseReferenceComments !== false) {
        //    this.parseReferenceComments();
        //}
        result.statements = new nodes.NodeList();
        while (this.lexer.peek().type !== tokenType_1.TokenType.endOfFile) {
            result.statements.push(this.parseStatement());
        }
        result.comments = this.lexer.comments;
        result.end = this.lexer.peek().start;
        return result;
    };
    ///**
    // * 当解析到一个全局注释时执行。
    // * @param multiLineComment 标记是否是多行注释。
    // * @param start 注释的开始位置。
    // * @param end 注释的结束位置。
    // */
    //private parseGlobalComment(multiLineComment: boolean, start: number, end: number) {
    //}
    ///**
    // * 当解析到一个注释时执行。
    // * @param multiLineComment 标记是否是多行注释。
    // * @param start 注释的开始位置。
    // * @param end 注释的结束位置。
    // */
    //private parseComment(multiLineComment: boolean, start: number, end: number) {
    //}
    /**
     * 解析 \<reference /> 注释。
     */
    Parser.prototype.parseReferenceComment = function () {
        //const referencedFiles: FileReference[] = [];
        //const typeReferenceDirectives: FileReference[] = [];
        //const amdDependencies: { path: string; name: string }[] = [];
        //let amdModuleName: string;
        //// Keep scanning all the leading trivia in the file until we get to something that
        //// isn't trivia.  Any single line comment will be analyzed to see if it is a
        //// reference comment.
        //while (true) {
        //    const range = { pos: triviaScanner.getTokenPos(), end: triviaScanner.getTextPos(), kind: triviaScanner.getToken() };
        //    const comment = sourceText.substring(range.pos, range.end);
        //    const referencePathMatchResult = getFileReferenceFromReferencePath(comment, range);
        //    if (referencePathMatchResult) {
        //        const fileReference = referencePathMatchResult.fileReference;
        //        sourceFile.hasNoDefaultLib = referencePathMatchResult.isNoDefaultLib;
        //        const diagnosticMessage = referencePathMatchResult.diagnosticMessage;
        //        if (fileReference) {
        //            if (referencePathMatchResult.isTypeReferenceDirective) {
        //                typeReferenceDirectives.push(fileReference);
        //            }
        //            else {
        //                referencedFiles.push(fileReference);
        //            }
        //        }
        //        if (diagnosticMessage) {
        //            parseDiagnostics.push(createFileDiagnostic(sourceFile, range.pos, range.end - range.pos, diagnosticMessage));
        //        }
        //    }
        //    else {
        //        const amdModuleNameRegEx = /^\/\/\/\s*<amd-module\s+name\s*=\s*('|")(.+?)\1/gim;
        //        const amdModuleNameMatchResult = amdModuleNameRegEx.exec(comment);
        //        if (amdModuleNameMatchResult) {
        //            if (amdModuleName) {
        //                parseDiagnostics.push(createFileDiagnostic(sourceFile, range.pos, range.end - range.pos, Diagnostics.An_AMD_module_cannot_have_multiple_name_assignments));
        //            }
        //            amdModuleName = amdModuleNameMatchResult[2];
        //        }
        //        const amdDependencyRegEx = /^\/\/\/\s*<amd-dependency\s/gim;
        //        const pathRegex = /\spath\s*=\s*('|")(.+?)\1/gim;
        //        const nameRegex = /\sname\s*=\s*('|")(.+?)\1/gim;
        //        const amdDependencyMatchResult = amdDependencyRegEx.exec(comment);
        //        if (amdDependencyMatchResult) {
        //            const pathMatchResult = pathRegex.exec(comment);
        //            const nameMatchResult = nameRegex.exec(comment);
        //            if (pathMatchResult) {
        //                const amdDependency = { path: pathMatchResult[2], name: nameMatchResult ? nameMatchResult[2] : undefined };
        //                amdDependencies.push(amdDependency);
        //            }
        //        }
        //    }
        //}
        //sourceFile.referencedFiles = referencedFiles;
        //sourceFile.typeReferenceDirectives = typeReferenceDirectives;
        //sourceFile.amdDependencies = amdDependencies;
        //sourceFile.moduleName = amdModuleName;
    };
    // #endregion
    // #region 语句
    /**
     * 解析一个语句。
     */
    Parser.prototype.parseStatement = function () {
        switch (this.lexer.peek().type) {
            case tokenType_1.TokenType.identifier:
                var identifier = this.parseIdentifier();
                return this.lexer.peek().type === tokenType_1.TokenType.colon ?
                    this.parseLabeledStatement(identifier) :
                    this.parseRestExpressionStatement(identifier);
            case tokenType_1.TokenType.openBrace:
                return this.parseBlockStatement();
            case tokenType_1.TokenType["var"]:
                return this.parseVariableStatement();
            case tokenType_1.TokenType.let:
            case tokenType_1.TokenType["const"]:
                if (this.isVariableStatement()) {
                    return this.parseVariableStatement();
                }
                break;
            case tokenType_1.TokenType["function"]:
                return this.parseFunctionDeclaration();
            case tokenType_1.TokenType["class"]:
                return this.parseClassDeclaration();
            case tokenType_1.TokenType["if"]:
                return this.parseIfStatement();
            case tokenType_1.TokenType["switch"]:
                return this.parseSwitchStatement();
            case tokenType_1.TokenType["for"]:
                return this.parseForStatement();
            case tokenType_1.TokenType["while"]:
                return this.parseWhileStatement();
            case tokenType_1.TokenType["do"]:
                return this.parseDoWhileStatement();
            case tokenType_1.TokenType["break"]:
                return this.parseBreakStatement();
            case tokenType_1.TokenType["continue"]:
                return this.parseContinueStatement();
            case tokenType_1.TokenType["return"]:
                return this.parseReturnStatement();
            case tokenType_1.TokenType["throw"]:
                return this.parseThrowStatement();
            case tokenType_1.TokenType["try"]:
                return this.parseTryStatement();
            case tokenType_1.TokenType["debugger"]:
                return this.parseDebuggerStatement();
            case tokenType_1.TokenType.semicolon:
                return this.parseEmptyStatement();
            case tokenType_1.TokenType.endOfFile:
                return null;
            case tokenType_1.TokenType["with"]:
                return this.parseWithStatement();
            case tokenType_1.TokenType.at:
            case tokenType_1.TokenType.async:
            case tokenType_1.TokenType.interface:
            case tokenType_1.TokenType.type:
            case tokenType_1.TokenType.module:
            case tokenType_1.TokenType.namespace:
            case tokenType_1.TokenType.declare:
            case tokenType_1.TokenType["const"]:
            case tokenType_1.TokenType["enum"]:
            case tokenType_1.TokenType["export"]:
            case tokenType_1.TokenType["import"]:
            case tokenType_1.TokenType.private:
            case tokenType_1.TokenType.protected:
            case tokenType_1.TokenType.public:
            case tokenType_1.TokenType.abstract:
            case tokenType_1.TokenType.static:
            case tokenType_1.TokenType.readonly:
            case tokenType_1.TokenType.global:
                if (this.isDeclaration()) {
                    return this.parseDeclaration();
                }
                break;
        }
        return this.parseExpressionStatement();
    };
    /**
     * 解析一个语句块(`{...}`)。
     */
    Parser.prototype.parseBlockStatement = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.openBrace);
        var result = new nodes.BlockStatement();
        result.start = this.lexer.read().start;
        result.statements = new nodes.NodeList();
        while (true) {
            switch (this.lexer.peek().type) {
                case tokenType_1.TokenType.closeBrace:
                    result.end = this.lexer.read().end;
                    return result;
                case tokenType_1.TokenType.endOfFile:
                    result.end = this.expectToken(tokenType_1.TokenType.closeBrace).end;
                    return result;
            }
            result.statements.push(this.parseStatement());
        }
    };
    /**
     * 解析一个变量声明语句(`var xx、let xx、const xx`)。
     */
    Parser.prototype.parseVariableStatement = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType["var"] || this.lexer.peek().type === tokenType_1.TokenType.let || this.lexer.peek().type === tokenType_1.TokenType["const"]);
        var result = new nodes.VariableStatement();
        result.start = this.lexer.read().start; // var、let、const
        result.type = this.lexer.current.type;
        result.variables = this.parseVariableDeclarationList();
        result.end = this.expectSemicolon();
        // todo: JsDoc
        return result;
    };
    /**
     * 解析一个变量声明列表(`xx = 1, ...`)。
     */
    Parser.prototype.parseVariableDeclarationList = function () {
        var result = new nodes.NodeList();
        result.seperators = [];
        while (true) {
            result.push(this.parseVariableDeclaration());
            if (this.lexer.peek().type === tokenType_1.TokenType.comma) {
                result.seperators.push(this.lexer.read().start);
                continue;
            }
            break;
        }
        ;
        return result;
    };
    /**
     * 解析一个变量声明(`x = 1、[x] = [1]、{a: x} = {a: 1}`)。
     */
    Parser.prototype.parseVariableDeclaration = function () {
        var result = new nodes.VariableDeclaration();
        result.name = this.parseBindingName();
        if (this.lexer.peek().type === tokenType_1.TokenType.colon) {
            result.colonToken = this.lexer.read().start;
            result.type = this.parseTypeExpression();
        }
        if (this.lexer.peek().type === tokenType_1.TokenType.equals) {
            result.equalToken = this.lexer.read().start;
            result.initializer = this.parseExpression(ParseFlags.disallowComma);
        }
        return result;
    };
    /**
     * 解析一个绑定名称(`xx, [xx], {x:x}`)。
     */
    Parser.prototype.parseBindingName = function () {
        switch (this.lexer.peek().type) {
            case tokenType_1.TokenType.identifier:
                return this.parseIdentifier();
            case tokenType_1.TokenType.openBracket:
                return this.parseArrayBindingPattern();
            case tokenType_1.TokenType.openBrace:
                return this.parseObjectBindingPattern();
            default:
                return this.expectIdentifier();
        }
    };
    /**
     * 解析一个数组绑定模式项(`[xx]`)。
     */
    Parser.prototype.parseArrayBindingPattern = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.openBracket);
        var result = new nodes.ArrayBindingPattern();
        result.start = this.lexer.read().start;
        result.elements = new nodes.NodeList();
        result.elements.commaTokens = [];
        while (true) {
            switch (this.lexer.peek().type) {
                case tokenType_1.TokenType.comma:
                    result.elements.push(nodes.ArrayBindingElement.empty);
                    result.elements.commaTokens.push(this.lexer.read().start);
                    continue;
                case tokenType_1.TokenType.closeBracket:
                    result.end = this.lexer.read().end;
                    return result;
                case tokenType_1.TokenType.endOfFile:
                    result.end = this.expectToken(tokenType_1.TokenType.closeBracket).end;
                    return result;
            }
            var element = new nodes.ArrayBindingElement();
            element.start = this.lexer.current.start;
            if (this.lexer.peek().type === tokenType_1.TokenType.dotDotDot) {
                this.lexer.read();
            }
            element.name = this.parseBindingName();
            if (this.lexer.peek().type === tokenType_1.TokenType.equals) {
                element.equal = this.lexer.read().start;
                element.initializer = this.parseExpression(ParseFlags.disallowComma);
            }
            result.elements.push(element);
        }
    };
    /**
     * 解析一个对象绑定模式项(`{xx: xx}`)。
     */
    Parser.prototype.parseObjectBindingPattern = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.openBrace);
        var result = new nodes.ObjectBindingPattern();
        result.start = this.lexer.read().start;
        result.elements = new nodes.NodeList();
        result.elements.commaTokens = [];
        while (true) {
            switch (this.lexer.peek().type) {
                case tokenType_1.TokenType.closeBrace:
                    result.end = this.lexer.read().end;
                    return result;
                case tokenType_1.TokenType.endOfFile:
                    result.end = this.expectToken(tokenType_1.TokenType.closeBrace).end;
                    return result;
            }
            var element = new nodes.ObjectBindingElement();
            element.property = this.parsePropertyName();
            if (this.lexer.peek().type === tokenType_1.TokenType.colon) {
                element.colonToken = this.lexer.read().start;
                element.name = this.parseBindingName();
            }
            if (this.lexer.peek().type === tokenType_1.TokenType.equals) {
                element.equalToken = this.lexer.read().start;
                element.initializer = this.parseExpression(ParseFlags.disallowComma);
            }
            if (this.lexer.peek().type === tokenType_1.TokenType.comma) {
                result.elements.commaTokens.push(this.lexer.read().start);
            }
            result.elements.push(element);
        }
    };
    /**
     * 解析一个属性名称(`xx、"xx"、[xx]`)。
     */
    Parser.prototype.parsePropertyName = function () {
        switch (this.lexer.peek().type) {
            case tokenType_1.TokenType.identifier:
                return this.parseIdentifier();
            case tokenType_1.TokenType.stringLiteral:
                return this.parseStringLiteral();
            case tokenType_1.TokenType.numericLiteral:
                return this.parseNumericLiteral();
            case tokenType_1.TokenType.openBracket:
                return this.parseComputedPropertyName();
            default:
                return this.expectIdentifier();
        }
    };
    /**
     * 解析一个已计算的属性名。
     */
    Parser.prototype.parseComputedPropertyName = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.openBracket);
        var result = new nodes.ComputedPropertyName();
        result.start = this.lexer.read().start;
        result.body = this.parseExpression(ParseFlags.disallowIn);
        result.end = this.expectToken(tokenType_1.TokenType.closeBracket).end;
        return result;
    };
    /**
     * 解析一个空语句(`;`)。
     */
    Parser.prototype.parseEmptyStatement = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.semicolon);
        var result = new nodes.EmptyStatement();
        result.start = this.lexer.read().start;
        return result;
    };
    /**
     * 解析一个标签语句(`xx: ...`)。
     * @param label 已解析的标签部分。
     */
    Parser.prototype.parseLabeledStatement = function (label) {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.colon);
        var result = new nodes.LabeledStatement();
        result.label = label;
        result.colonToken = this.lexer.read().type;
        result.body = this.parseStatement();
        return result;
    };
    /**
     * 解析一个表达式语句(x(`);`)。
     */
    Parser.prototype.parseExpressionStatement = function () {
        console.assert(tokenType_1.isExpressionStart(this.lexer.peek().type));
        var result = new nodes.ExpressionStatement();
        result.body = this.parseExpression();
        result.end = this.expectSemicolon();
        return result;
    };
    /**
     * 解析一个表达式语句(x(`);`)。
     * @param parsed 已解析的表达式。
     */
    Parser.prototype.parseRestExpressionStatement = function (parsed) {
        console.assert(tokenType_1.isExpressionStart(this.lexer.peek().type));
        var result = new nodes.ExpressionStatement();
        result.body = this.parseRestExpression(parsed);
        result.end = this.expectSemicolon();
        return result;
    };
    /**
     * 解析一个 if 语句(if(`xx) ...`)。
     */
    Parser.prototype.parseIfStatement = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType["if"]);
        var result = new nodes.IfStatement();
        result.start = this.lexer.read().start;
        this.parseCondition(result);
        result.then = this.parseEmbeddedStatement();
        if (this.lexer.peek().type === tokenType_1.TokenType["else"]) {
            result.elseToken = this.lexer.read().start;
            result["else"] = this.parseEmbeddedStatement();
        }
        return result;
    };
    /**
     * 解析条件表达式。
     * @param result 存放结果的语句。
     */
    Parser.prototype.parseCondition = function (result) {
        if (this.lexer.peek().type === tokenType_1.TokenType.openParen) {
            result.openParanToken = this.lexer.read().type;
            result.condition = this.parseExpression(ParseFlags.disallowIn);
            result.closeParanToken = this.expectToken(tokenType_1.TokenType.closeParen).start;
        }
        else {
            if (compiler_1.options.allowMissingParenthese === false) {
                this.expectToken(tokenType_1.TokenType.openParen);
            }
            result.condition = this.parseExpression(ParseFlags.disallowIn);
        }
    };
    /**
     * 解析内嵌语句。
     */
    Parser.prototype.parseEmbeddedStatement = function () {
        var result = this.parseStatement();
        // todo
        //if (result == null) {
        //    Compiler.error(ErrorCode.expectedStatement, "语法错误：应输入语句", this.lexer.peek());
        //} else if (result is VariableStatement) {
        //    Compiler.error(ErrorCode.invalidVariableStatement, "嵌套语句不能是变量声明语句；应使用“{}”包围", ((VariableStatement)result).type);
        //} else if (result is LabeledStatement) {
        //    Compiler.error(ErrorCode.invalidLabeledStatement, "嵌套语句不能是标签语句；应使用“{}”包围", ((LabeledStatement)result).label);
        //}
        //if (result is Semicolon && this.lexer.peek().type == TokenType.lBrace) {
        //    Compiler.warning(ErrorCode.confusedSemicolon, "此分号可能是多余的", this.lexer.current.start, this.lexer.current.endLocation);
        //}
        return result;
    };
    /**
     * 解析一个 switch 语句(switch(`xx){...}`)。
     */
    Parser.prototype.parseSwitchStatement = function () {
        console.assert(this.lexer.peek().type == tokenType_1.TokenType["switch"]);
        var result = new nodes.SwitchStatement();
        result.start = this.lexer.read().start;
        if (compiler_1.options.allowMissingSwitchCondition === false || this.lexer.peek().type !== tokenType_1.TokenType.openBrace) {
            this.parseCondition(result);
        }
        result.cases = new nodes.NodeList();
        result.cases.start = this.expectToken(tokenType_1.TokenType.openBrace).start;
        while (true) {
            switch (this.lexer.peek().type) {
                case tokenType_1.TokenType["case"]:
                case tokenType_1.TokenType["default"]:
                    break;
                case tokenType_1.TokenType.closeBrace:
                    result.cases.end = this.lexer.read().start;
                    return result;
                default:
                    this.error(this.lexer.peek(), "应输入“case”或“default”。");
                    result.cases.end = this.lexer.current.end;
                    return result;
            }
            var caseCaluse = new nodes.CaseClause();
            caseCaluse.start = this.lexer.read().start;
            if (this.lexer.current.type === tokenType_1.TokenType["case"]) {
                if (compiler_1.options.allowCaseElse !== false && this.lexer.peek().type === tokenType_1.TokenType["else"]) {
                    caseCaluse.elseToken = this.lexer.read().start;
                }
                else {
                    caseCaluse.label = this.parseExpression(ParseFlags.disallowIn);
                }
            }
            caseCaluse.colonToken = this.expectToken(tokenType_1.TokenType.colon).start;
            caseCaluse.statements = new nodes.NodeList();
            while (this.lexer.peek().type !== tokenType_1.TokenType.closeBrace &&
                this.lexer.peek().type !== tokenType_1.TokenType["case"] &&
                this.lexer.peek().type !== tokenType_1.TokenType["default"]) {
                caseCaluse.statements.push(this.parseStatement());
            }
            result.cases.push(caseCaluse);
        }
    };
    /**
     * 解析一个 for 语句(for(`var i = 0; i < 9; i++) ...`)。
     */
    Parser.prototype.parseForStatement = function () {
        console.assert(this.lexer.peek().type == tokenType_1.TokenType["for"]);
        var start = this.lexer.read().start;
        var openParan = this.lexer.peek().type === tokenType_1.TokenType.openParen ?
            this.lexer.read().start :
            undefined;
        if (openParan == undefined && compiler_1.options.allowMissingParenthese === false) {
            this.expectToken(tokenType_1.TokenType.openParen);
        }
        var initializer = this.lexer.peek().type === tokenType_1.TokenType.semicolon ? undefined : this.isVariableStatement() ? this.parseVariableStatement() : this.parseExpression(ParseFlags.disdisallowIn);
        var result;
        // FIXME: 特殊处理：for (let of X) 的场景。
        var type = this.lexer.peek().type;
        switch (type) {
            case tokenType_1.TokenType.semicolon:
            case tokenType_1.TokenType["in"]:
                break;
            case tokenType_1.TokenType.of:
                if (compiler_1.options.allowForOf === false) {
                    type = tokenType_1.TokenType.semicolon;
                }
                break;
            case tokenType_1.TokenType.to:
                if (compiler_1.options.allowForTo === false) {
                    type = tokenType_1.TokenType.semicolon;
                }
                break;
            default:
                type = tokenType_1.TokenType.semicolon;
                break;
        }
        switch (type) {
            case tokenType_1.TokenType.semicolon:
                result = new nodes.ForStatement();
                result.firstSemicolonToken = this.expectToken(tokenType_1.TokenType.semicolon).start;
                if (this.lexer.peek().type !== tokenType_1.TokenType.semicolon) {
                    result.condition = this.parseExpression(ParseFlags.disallowIn);
                }
                result.secondSemicolonToken = this.expectToken(tokenType_1.TokenType.semicolon).start;
                if (openParan != undefined ? this.lexer.peek().type !== tokenType_1.TokenType.closeParen : tokenType_1.isExpressionStart(this.lexer.peek().type)) {
                    result.iterator = this.parseExpression(ParseFlags.disallowIn);
                }
                break;
            case tokenType_1.TokenType["in"]:
                result = new nodes.ForInStatement();
                result.inToken = this.lexer.read().start;
                result.condition = this.parseExpression(ParseFlags.disallowIn);
                break;
            case tokenType_1.TokenType.of:
                result = new nodes.ForOfStatement();
                result.ofToken = this.lexer.read().start;
                result.condition = this.parseExpression(ParseFlags.disallowIn | ParseFlags.disallowComma);
                break;
            case tokenType_1.TokenType.to:
                result = new nodes.ForToStatement();
                result.toToken = this.lexer.read().start;
                result.condition = this.parseExpression(ParseFlags.disallowIn);
                break;
        }
        result.start = start;
        if (initializer) {
            result.initializer = initializer;
            // "“for in/of/to”语句中最多只能有一个变量"
            // todo
        }
        if (openParan != undefined) {
            result.openParanToken = openParan;
            result.closeParanToken = this.expectToken(tokenType_1.TokenType.closeParen).start;
        }
        result.body = this.parseEmbeddedStatement();
        return result;
    };
    /**
     * 判断是否紧跟一个变量定义语句。
     */
    Parser.prototype.isVariableStatement = function () {
        switch (this.lexer.peek().type) {
            case tokenType_1.TokenType["var"]:
                return true;
            case tokenType_1.TokenType.let:
            case tokenType_1.TokenType["const"]:
                this.lexer.stashSave();
                this.lexer.read();
                var result = this.isBindingName();
                this.lexer.stashRestore();
                return result;
            default:
                return false;
        }
    };
    /**
     * 判断下一个字符是否可作为变量名。
     */
    Parser.prototype.isBindingName = function () {
        switch (this.lexer.peek().type) {
            case tokenType_1.TokenType.identifier:
            case tokenType_1.TokenType.openBracket:
            case tokenType_1.TokenType.openBrace:
                return true;
            default:
                return false;
        }
    };
    /**
     * 解析一个 while 语句(while(`...) ...`)。
     */
    Parser.prototype.parseWhileStatement = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType["while"]);
        var result = new nodes.WhileStatement();
        result.start = this.lexer.read().start;
        this.parseCondition(result);
        result.body = this.parseEmbeddedStatement();
        return result;
    };
    /**
     * 解析一个 do..while 语句(do ... while(`xx);`)。
     */
    Parser.prototype.parseDoWhileStatement = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType["do"]);
        var result = new nodes.DoWhileStatement();
        result.start = this.lexer.read().type;
        result.body = this.parseEmbeddedStatement();
        result.whileToken = this.expectToken(tokenType_1.TokenType["while"]).start;
        this.parseCondition(result);
        result.end = this.expectSemicolon();
        return result;
    };
    /**
     * 解析一个 continue 语句(`continue xx;`)。
     */
    Parser.prototype.parseContinueStatement = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType["continue"]);
        var result = new nodes.ContinueStatement();
        result.start = this.lexer.read().start;
        if (this.lexer.peek().type === tokenType_1.TokenType.identifier) {
            result.label = this.parseIdentifier();
        }
        result.end = this.expectSemicolon();
        return result;
    };
    /**
     * 解析一个 break 语句(`break xx;`)。
     */
    Parser.prototype.parseBreakStatement = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType["break"]);
        var result = new nodes.BreakStatement();
        result.start = this.lexer.read().start;
        if (this.lexer.peek().type === tokenType_1.TokenType.identifier) {
            result.label = this.parseIdentifier();
        }
        result.end = this.expectSemicolon();
        return result;
    };
    /**
     * 解析一个 return 语句(`return xx;`)。
     */
    Parser.prototype.parseReturnStatement = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType["return"]);
        var result = new nodes.ReturnStatement();
        result.start = this.lexer.read().start;
        if (compiler_1.options.smartSemicolonInsertion === false ?
            !this.lexer.peek().onNewLine :
            tokenType_1.isExpressionStart(this.lexer.peek().type)) {
            result.value = this.parseExpression(ParseFlags.disallowIn);
        }
        result.end = this.expectSemicolon();
        return result;
    };
    /**
     * 解析一个 throw 语句(`throw xx;`)。
     */
    Parser.prototype.parseThrowStatement = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType["throw"]);
        var result = new nodes.ThrowStatement();
        result.start = this.lexer.read().start;
        if (compiler_1.options.smartSemicolonInsertion === false ?
            !this.lexer.peek().onNewLine :
            tokenType_1.isExpressionStart(this.lexer.peek().type)) {
            result.value = this.parseExpression(ParseFlags.disallowIn);
        }
        else if (compiler_1.options.allowRethrow === false) {
            this.error(this.lexer.current, "应输入表达式。");
        }
        result.end = this.expectSemicolon();
        return result;
    };
    /**
     * 解析一个 try 语句(try {...} catch(`e) {...}`)。
     */
    Parser.prototype.parseTryStatement = function () {
        console.assert(this.lexer.peek().type == tokenType_1.TokenType["try"]);
        var result = new nodes.TryStatement();
        result.start = this.lexer.read().start;
        result["try"] = this.parseTryClauseBody();
        if (this.lexer.peek().type === tokenType_1.TokenType["catch"]) {
            result["catch"] = new nodes.CatchClause();
            result["catch"].start = this.lexer.read().start;
            if (this.lexer.peek().type === tokenType_1.TokenType.openParen) {
                result["catch"].openParanToken = this.lexer.read().start;
                result["catch"].variable = this.parseBindingName();
                result["catch"].openParanToken = this.expectToken(tokenType_1.TokenType.closeParen).start;
            }
            else if (compiler_1.options.allowMissingParenthese !== false && this.isBindingName()) {
                result["catch"].variable = this.parseBindingName();
            }
            else if (compiler_1.options.allowMissingCatchVaribale !== false) {
                this.expectToken(tokenType_1.TokenType.openParen);
            }
            result["catch"].body = this.parseTryClauseBody();
        }
        if (this.lexer.peek().type === tokenType_1.TokenType["finally"]) {
            result["finally"] = new nodes.FinallyClause();
            result["finally"].start = this.lexer.read().start;
            result["finally"].body = this.parseTryClauseBody();
        }
        return result;
    };
    /**
     * 解析一个 try 语句的语句块。
     */
    Parser.prototype.parseTryClauseBody = function () {
        if (compiler_1.options.allowMissingTryBlock !== false) {
            return this.parseEmbeddedStatement();
        }
        if (this.lexer.peek().type === tokenType_1.TokenType.openBrace) {
            return this.parseBlockStatement();
        }
        this.expectToken(tokenType_1.TokenType.openBrace);
        var result = new nodes.ExpressionStatement();
        result.body = nodes.Expression.error;
        return result;
    };
    /**
     * 解析一个 debugger 语句(`debugger;`)。
     */
    Parser.prototype.parseDebuggerStatement = function () {
        console.assert(this.lexer.peek().type == tokenType_1.TokenType["debugger"]);
        var result = new nodes.DebuggerStatement();
        result.start = this.lexer.read().start;
        result.end = this.expectSemicolon();
        return result;
    };
    /**
     * 解析一个 with 语句(with(`...) ...`)。
     */
    Parser.prototype.parseWithStatement = function () {
        console.assert(this.lexer.peek().type == tokenType_1.TokenType["with"]);
        var result = new nodes.WithStatement();
        result.start = this.lexer.read().start;
        if (this.lexer.peek().type === tokenType_1.TokenType.openParen) {
            result.openParanToken = this.lexer.read().start;
            result.value = compiler_1.options.allowWithVaribale !== false && this.isVariableStatement() ?
                this.parseVariableStatement() :
                this.parseExpression(ParseFlags.disallowIn);
            result.closeParanToken = this.expectToken(tokenType_1.TokenType.closeParen).start;
        }
        else {
            if (compiler_1.options.allowMissingParenthese === false) {
                this.expectToken(tokenType_1.TokenType.openParen);
            }
            result.value = compiler_1.options.allowWithVaribale !== false && this.isVariableStatement() ?
                this.parseVariableStatement() :
                this.parseExpression(ParseFlags.disallowIn);
        }
        result.body = this.parseEmbeddedStatement();
        return result;
    };
    // #endregion
    // #region 声明
    /**
     * 解析修饰器列表(`@xx`)。
     * @param result 存放结果的对象。
     */
    Parser.prototype.parseDecoratorList = function (result) {
        // 无修饰器。
        if (this.lexer.peek().type !== tokenType_1.TokenType.at) {
            return;
        }
        result.decorators = new nodes.NodeList();
        do {
            var decorator = new nodes.Decorator();
            decorator.start = this.lexer.read().start;
            decorator.body = this.parseExpression();
            // 检查修饰器是否是合法的表达式。
            result.decorators.push(decorator);
        } while (this.lexer.peek().type === tokenType_1.TokenType.at);
    };
    /**
     * 解析所有修饰符(`static`、`private`、...)。
     */
    Parser.prototype.parseModifiers = function () {
    };
    /**
     * 解析一个函数声明(`function fn() {...}`、`function * fn(){...}`)。
     */
    Parser.prototype.parseFunctionDeclaration = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType["function"]);
        var result = new nodes.FunctionDeclaration();
        this.parseJSDocComment(result);
        result.start = this.lexer.read().start;
        if (this.lexer.peek().type === tokenType_1.TokenType.asterisk) {
            result.asteriskToken = this.lexer.read().type;
        }
        result.name = this.expectIdentifier();
        result.typeParameters = this.parseTypeParameters();
        switch (this.lexer.peek().type) {
            case tokenType_1.TokenType.openBrace:
                result.body = this.parseBlockStatement();
                break;
            case tokenType_1.TokenType.equalsGreaterThan:
                result.body = this.parseArrowFunctionExpression();
                break;
            case tokenType_1.TokenType.semicolon:
                this.lexer.read();
                break;
            default:
                this.expectToken(tokenType_1.TokenType.openBrace);
                break;
        }
        result.end = this.lexer.current.end;
        return result;
    };
    /**
     * 解析函数参数声明列表。
     * @param ignoreError 如果解析出现错误则返回空。
     */
    Parser.prototype.parseParameterList = function (ignoreError) {
    };
    Parser.prototype.parseFunctionBody = function (result) {
    };
    /**
     * 解析一个泛型参数声明。
     */
    Parser.prototype.parseTypeParametersDeclaration = function () {
    };
    /**
     * 解析一个函数表达式(function (`) {}`)。
     */
    Parser.prototype.parseFunctionExpression = function (a) {
    };
    /**
     * 解析一个参数声明(`x、x = 1、...x`)。
     */
    Parser.prototype.parseParameterDeclaration = function () {
    };
    /**
     * 解析一个类声明(`class T {...}`)。
     */
    Parser.prototype.parseClassDeclaration = function () {
    };
    /**
     * 解析一个属性声明(`x: 1`)。
     */
    Parser.prototype.parsePropertyDeclaration = function () {
    };
    /**
     * 解析一个方法声明(fn(`) {...}`)。
     */
    Parser.prototype.parseMethodDeclaration = function () {
    };
    /**
     * 解析一个解析器声明(get fn() {...}、set fn(`) {...}`)。
     */
    Parser.prototype.parseAccessorDeclaration = function () {
    };
    /**
     * 解析一个接口声明(`interface T {...}`)。
     */
    Parser.prototype.parseInterfaceDeclaration = function () {
    };
    /**
     * 解析一个枚举声明(`enum T {}`)。
     */
    Parser.prototype.parseEnumDeclaration = function () {
    };
    /**
     * 解析一个类表达式(`class xx {}`)。
     */
    Parser.prototype.parseClassExpression = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType["class"]);
        var result = new nodes.ClassExpression();
        result.start = this.lexer.read().start;
        switch (this.lexer.peek().type) {
            case tokenType_1.TokenType.identifier:
                result.name = this.parseIdentifier();
                break;
            case tokenType_1.TokenType.implements:
                // implements 可能是关键字或类名。
                if (!this.isImplements()) {
                    result.name = this.parseIdentifier();
                }
                break;
        }
        result.typeParameters = this.parseTypeParameters();
        if (this.lexer.peek().type === tokenType_1.TokenType["extends"]) {
            result.extendsToken = this.lexer.read().type;
            result["extends"] = this.parseHeritageClause();
        }
        if (this.lexer.peek().type === tokenType_1.TokenType.implements) {
            result.implementsToken = this.lexer.read().type;
            result.implements = this.parseHeritageClause();
        }
    };
    Parser.prototype.parseHeritageClause = function () {
        var result = new nodes.NodeList();
        result.seperators = [];
        while (true) {
            result.push(this.parseTypeExpression());
            if (this.lexer.peek().type === tokenType_1.TokenType.comma) {
                result.seperators.push(this.lexer.read().start);
                continue;
            }
            return result;
        }
    };
    Parser.prototype.isImplements = function () {
        this.lexer.stashSave();
        this.lexer.read();
        var result = isIdentifierOrKeyword(this.lexer.peek().type);
        this.lexer.stashRestore();
        return result;
    };
    /**
     * 解析一个接口表达式(`interface xx {}`)。
     */
    Parser.prototype.parseInterfaceExpression = function () {
    };
    /**
     * 解析一个枚举表达式(`enum xx {}`)。
     */
    Parser.prototype.parseEnumExpression = function () {
        return this.parseEnumDeclarationOrExpression(true);
    };
    /**
     * 解析一个枚举声明或表达式(`enum xx {}`)。
     */
    Parser.prototype.parseEnumDeclarationOrExpression = function (expression) {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType["enum"]);
        var result = expression ? new nodes.EnumExpression() : new nodes.EnumDeclaration();
        result.start = this.lexer.read().start;
        if (expression || this.lexer.peek().type === tokenType_1.TokenType.identifier) {
            result.name = this.parseIdentifier();
        }
        else {
            result.name = this.expectIdentifier();
        }
        if (this.lexer.peek().type === tokenType_1.TokenType.openBrace) {
            result.members = new nodes.NodeList();
            result.members.start = this.lexer.read().start;
            while (true) {
                switch (this.lexer.peek().type) {
                    case tokenType_1.TokenType.closeBrace:
                        result.end = this.lexer.read().end;
                        return result;
                    case tokenType_1.TokenType.endOfFile:
                        result.end = this.expectToken(tokenType_1.TokenType.closeBrace).end;
                        return result;
                }
                var member = new nodes.EnumMemberDeclaration();
                member.name = this.expectIdentifier();
                if (this.lexer.peek().type === tokenType_1.TokenType.equals) {
                    member.equalToken = this.lexer.read().start;
                    member.initializer = this.parseExpression(ParseFlags.disallowIn);
                }
                result.members.push(member);
            }
        }
    };
    /**
     * 解析一个枚举成员声明(`xx = 1`)。
     */
    Parser.prototype.parseEnumMemberDeclaration = function () {
    };
    /**
     * 解析一个命名空间声明(`namespace abc {...}、module abc {...}`)。
     */
    Parser.prototype.parseNamespaceDeclaration = function () {
    };
    /**
     * 解析一个 import 指令(`import xx from '...';`)。
     */
    Parser.prototype.parseImportDirective = function () {
        console.assert(this.lexer.peek().type == tokenType_1.TokenType["import"]);
        var start = this.lexer.read().type;
        var identifier;
        switch (this.lexer.peek().type) {
            case tokenType_1.TokenType.identifier:
                identifier = this.parseIdentifier();
                break;
            case tokenType_1.TokenType.stringLiteral:
                break;
            case tokenType_1.TokenType.openBrace:
                break;
            case tokenType_1.TokenType.asterisk:
                break;
            default:
                identifier = this.expectIdentifier();
                break;
        }
        var result = new nodes.ImportDeclaration();
    };
    /**
     * 解析一个 import = 指令(import xx = require(`"");`)。
     */
    Parser.prototype.parseImportEqualsDirective = function () {
    };
    /**
     * 解析一个名字导入声明项(`a as b`)。
     */
    Parser.prototype.parseNameImportClause = function () {
    };
    /**
     * 解析一个命名空间导入声明项(`{a as b}`)。
     */
    Parser.prototype.parseNamespaceImportClause = function () {
    };
    /**
     * 解析一个 export 指令(`export xx from '...';`)。
     */
    Parser.prototype.parseExportDirective = function () {
    };
    /**
     * 解析一个 export = 指令(`export = 1;`)。
     */
    Parser.prototype.parseExportEqualsDirective = function () {
    };
    /**
     * 解析一个表达式。
     */
    Parser.prototype.parseExpression = function () {
        var parsed;
        var type = this.lexer.peek().type;
        return this.parseExpressionRest(parsed, precedence, disallowIn);
    };
    /**
     * 在允许解析 in 和逗号表达式的上下文中解析一个表达式。
     */
    Parser.prototype.parseExpressionWithInAndComma = function () {
        if (this.disallowIn || this.disallowComma) {
            var disallowIn = this.disallowIn;
            var disallowComma = this.disallowComma;
            this.disallowIn = this.disallowComma = false;
            var result = this.parseExpression();
            this.disallowIn = disallowIn;
            this.disallowComma = disallowComma;
            return result;
        }
        return this.parseExpression();
    };
    /**
     * 在禁止解析逗号表达式的上下文中解析一个表达式。
     */
    Parser.prototype.parseExpressionWithoutComma = function () {
        if (this.disallowComma) {
            return this.parseExpression();
        }
        this.disallowComma = true;
        var result = this.parseExpression();
        this.disallowComma = false;
        return result;
    };
    /**
     * 解析一个单目或主表达式。
     */
    Parser.prototype.parseUnaryOrPrimaryExpression = function () {
        var type = this.lexer.peek().type;
        switch (type) {
            // Identifier、Identifier<T>
            case tokenType_1.TokenType.identifier:
                return this.parseIdentifierOrGenericExpression();
            // (Expr)、(Expr) => {...}
            case tokenType_1.TokenType.openParen:
                return this.parseParenthesizedExpressionOrArrowFunction();
            // ""、''
            case tokenType_1.TokenType.stringLiteral:
            case tokenType_1.TokenType.noSubstitutionTemplateLiteral:
                return this.parseStringLiteral();
            // 0
            case tokenType_1.TokenType.numericLiteral:
                return this.parseNumericLiteral();
            // [Expr, ...]
            case tokenType_1.TokenType.openBracket:
                return this.parseArrayLiteral();
            // {key: Expr, ...}
            case tokenType_1.TokenType.openBrace:
                return this.parseObjectLiteral();
            // new Expr
            case tokenType_1.TokenType["new"]:
                return this.parseNewExpression();
            // `abc${
            case tokenType_1.TokenType.templateHead:
                return this.parseTemplateLiteral();
            // yield ...
            case tokenType_1.TokenType.yield:
                return this.parseYieldExpression();
            // await ...
            case tokenType_1.TokenType.await:
                return this.parseAwaitExpression();
            // => ...
            case tokenType_1.TokenType.equalsGreaterThan:
                return this.parseArrowFunctionExpression(undefined, undefined, undefined);
            case tokenType_1.TokenType.slash:
            case tokenType_1.TokenType.slashEquals:
                return this.parseRegularExpressionLiteral();
        }
        // this、super、null、true、false
        if (tokenType_1.isSimpleLiteral(type)) {
            return this.parseSimpleLiteral();
        }
        // void、delete、typeof、+、-、~、!、++、--。
        if (tokenType_1.isUnaryOperator(type)) {
            return this.parseUnaryExpression();
        }
        // 非法标记。
        return this.parseErrorExpression();
    };
    // #region 独立表达式
    /**
     * 解析一个独立表达式。
     */
    Parser.prototype.parsePrimaryExpression = function () {
        switch (this.lexer.peek().type) {
            // Identifier、Identifier<T>
            case tokenType_1.TokenType.identifier:
                return this.parseIdentifierOrGenericExpression();
            // this、super、null、true、false
            case tokenType_1.TokenType["this"]:
            case tokenType_1.TokenType["null"]:
            case tokenType_1.TokenType["true"]:
            case tokenType_1.TokenType["false"]:
            case tokenType_1.TokenType["super"]:
                return this.parseSimpleLiteral();
            // ""、''
            case tokenType_1.TokenType.stringLiteral:
            case tokenType_1.TokenType.noSubstitutionTemplateLiteral:
                return this.parseStringLiteral();
            // 0
            case tokenType_1.TokenType.numericLiteral:
                return this.parseNumericLiteral();
            // (Expr)、(Expr) => {...}
            case tokenType_1.TokenType.openParen:
                return this.parseParenthesizedExpressionOrArrowFunction();
            // [Expr, ...]
            case tokenType_1.TokenType.openBracket:
                return this.parseArrayLiteral();
            // {key: Expr, ...}
            case tokenType_1.TokenType.openBrace:
                return this.parseObjectLiteral();
            // new Expr
            case tokenType_1.TokenType["new"]:
                return this.parseNewExpression();
            // `abc${
            case tokenType_1.TokenType.templateHead:
                return this.parseTemplateLiteral();
            // => ...
            case tokenType_1.TokenType.equalsGreaterThan:
                return this.parseArrowFunctionExpression(undefined, undefined, undefined);
            // /、/=
            case tokenType_1.TokenType.slash:
            case tokenType_1.TokenType.slashEquals:
                return this.parseRegularExpressionLiteral();
            // function () {}
            case tokenType_1.TokenType["function"]:
                return this.parseFunctionExpression();
            // async () => ...、async function () {}、async
            case tokenType_1.TokenType.async:
                return this.parseAsyncFunctionExpressionOrIdentifier();
            // class {}
            case tokenType_1.TokenType["class"]:
                return this.parseClassExpression();
            // interface {}
            case tokenType_1.TokenType.interface:
                return this.parseInterfaceExpression();
            // enum {}
            case tokenType_1.TokenType["enum"]:
                return this.parseEnumExpression();
        }
        // 其它关键字作为标识符处理。
        if (isKeyword(this.lexer.peek().type)) {
            return this.parseIdentifier();
        }
        // 非法标记。
        return this.parseErrorExpression();
    };
    /**
     * 解析一个标识符或泛型表达式(`foo`、`foo<number>`)。
     */
    Parser.prototype.parseIdentifierOrGenericExpression = function () {
        var identifier = this.parseIdentifier();
        if (this.lexer.peek().type !== tokenType_1.TokenType.lessThan) {
            return identifier;
        }
        this.lexer.stashSave();
        var typeArguments = this.parseTypeArguments(true);
        if (!typeArguments) {
            this.lexer.stashRestore();
            return identifier;
        }
        this.lexer.stashClear();
        return this.parseGenericExpression(identifier, typeArguments);
    };
    /**
     * 解析一个标识符(`x`)。
     */
    Parser.prototype.parseIdentifier = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.identifier || isKeyword(this.lexer.peek().type));
        var result = new nodes.Identifier();
        result.start = this.lexer.read().start;
        result.value = this.lexer.current.data;
        result.end = this.lexer.current.end;
        return result;
    };
    /**
     * 解析一个泛型表达式(`foo<number>`)。
     */
    Parser.prototype.parseGenericExpression = function (element, typeArguments) {
        var result = new nodes.GenericExpression();
        result.element = element;
        result.typeArguments = typeArguments;
        return result;
    };
    /**
     * 解析一个简单字面量(`this`、`super`、`null`、`true`、`false`)。
     */
    Parser.prototype.parseSimpleLiteral = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType["this"] ||
            this.lexer.peek().type === tokenType_1.TokenType["super"] ||
            this.lexer.peek().type === tokenType_1.TokenType["null"] ||
            this.lexer.peek().type === tokenType_1.TokenType["true"] ||
            this.lexer.peek().type === tokenType_1.TokenType["false"]);
        var result = new nodes.SimpleLiteral();
        result.start = this.lexer.read().start;
        result.type = this.lexer.current.type;
        return result;
    };
    /**
     * 解析一个字符串字面量(`'abc'`、`"abc"`、`\`abc\``)。
     */
    Parser.prototype.parseStringLiteral = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.stringLiteral || this.lexer.peek().type === tokenType_1.TokenType.noSubstitutionTemplateLiteral);
        var result = new nodes.StringLiteral();
        result.start = this.lexer.read().start;
        result.value = this.lexer.current.data;
        result.end = this.lexer.current.end;
        return result;
    };
    /**
     * 解析一个数字字面量(`1`)。
     */
    Parser.prototype.parseNumericLiteral = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.numericLiteral);
        var result = new nodes.NumericLiteral();
        result.start = this.lexer.read().start;
        result.value = this.lexer.current.data;
        result.end = this.lexer.current.end;
        return result;
    };
    /**
     * 解析一个括号或箭头函数表达式(`(x)`、`(x) => {...}`)。
     */
    Parser.prototype.parseParenthesizedExpressionOrArrowFunction = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.openParen);
        this.lexer.stashSave();
        var parameters = this.parseParameterList(true);
        if (!parameters || (this.lexer.peek().type !== tokenType_1.TokenType.equalsGreaterThan && this.lexer.peek().type !== tokenType_1.TokenType.colon)) {
            this.lexer.stashRestore();
            return this.parseParenthesizedExpression();
        }
        this.lexer.stashClear();
        return this.parseArrowFunctionExpression(undefined, undefined, parameters);
    };
    /**
     * 解析一个括号表达式((`x)`)。
     */
    Parser.prototype.parseParenthesizedExpression = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.openParen);
        var result = new nodes.ParenthesizedExpression();
        result.start = this.lexer.read().start;
        result.body = this.parseExpressionWithInAndComma();
        result.end = this.expectToken(tokenType_1.TokenType.closeParen).end;
        return result;
    };
    /**
     * 解析一个箭头函数表达式(`x => y`)。
     * @param modifiers 已解析的所有修饰器。
     * @param typeParameters 已解析的所有类型参数。
     * @param parameters 已解析的所有参数。
     * @param disallowIn 是否禁止解析 in 表达式。
     * @param precedence 允许解析的最低操作符优先级。
     */
    Parser.prototype.parseArrowFunctionExpression = function (modifiers, typeParameters, parameters) {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.equalsGreaterThan || this.lexer.peek().type === tokenType_1.TokenType.colon);
        var result = new nodes.ArrowFunctionExpression();
        if (modifiers)
            result.modifiers = modifiers;
        if (typeParameters)
            result.typeParameters = typeParameters;
        if (parameters)
            result.parameters = parameters;
        if (this.lexer.peek().type === tokenType_1.TokenType.colon) {
            result.colonToken = this.lexer.read().start;
            result.returnType = this.parseTypeNode();
            result.arrowToken = this.expectToken(tokenType_1.TokenType.equalsGreaterThan).start;
        }
        else {
            result.arrowToken = this.lexer.read().start;
        }
        result.body = this.lexer.peek().type === tokenType_1.TokenType.openBrace ? this.parseBlockStatement() : this.parseExpression();
        return result;
    };
    /**
     * 解析一个数组字面量(`[x, y]`)。
     */
    Parser.prototype.parseArrayLiteral = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.openBracket);
        var result = new nodes.ArrayLiteral();
        result.elements = new nodes.NodeList();
        result.elements.start = this.lexer.read().start;
        result.elements.commaTokens = [];
        while (true) {
            switch (this.lexer.peek().type) {
                case tokenType_1.TokenType.comma:
                    result.elements.push(nodes.Expression.empty);
                    result.elements.commaTokens.push(this.lexer.read().start);
                    continue;
                case tokenType_1.TokenType.closeBracket:
                    result.elements.end = this.lexer.read().start;
                    return result;
                case tokenType_1.TokenType.endOfFile:
                    result.elements.end = this.expectToken(tokenType_1.TokenType.closeBracket).end;
                    return result;
            }
            result.elements.push(this.parseExpressionWithoutComma());
        }
    };
    /**
     * 解析一个对象字面量(`{x: y}`)。
     */
    Parser.prototype.parseObjectLiteral = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.openBrace);
        var result = new nodes.ObjectLiteral();
        result.elements = new nodes.NodeList();
        result.elements.start = this.lexer.read().start;
        result.elements.commaTokens = [];
        while (true) {
            switch (this.lexer.peek().type) {
                case tokenType_1.TokenType.closeBrace:
                    result.elements.end = this.lexer.read().end;
                    return result;
                case tokenType_1.TokenType.endOfFile:
                    result.elements.end = this.expectToken(tokenType_1.TokenType.closeBrace).end;
                    return result;
            }
            result.elements.push(this.parseTypeMemberDeclaration());
            if (this.lexer.peek().type === tokenType_1.TokenType.comma) {
                result.elements.commaTokens.push(this.lexer.read().start);
                continue;
            }
            result.elements.end = this.expectToken(tokenType_1.TokenType.closeBrace).end;
            return result;
        }
    };
    /**
     * 解析一个 new 表达式(new x(`)`)。
     */
    Parser.prototype.parseNewExpression = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType["new"]);
        var result = new nodes.NewExpression();
        result.start = this.lexer.read().start;
        result.target = this.parseMemberExpression();
        if (this.lexer.peek().type === tokenType_1.TokenType.openParen) {
            result.arguments = this.parseArguments();
        }
        return result;
    };
    /**
     * 解析一个模板字面量(``abc${x + y}def``)。
     */
    Parser.prototype.parseTemplateLiteral = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.templateHead);
        var result = new nodes.TemplateLiteral();
        result.spans = new nodes.NodeList();
        while (true) {
            console.assert(this.lexer.peek().type === tokenType_1.TokenType.templateHead || this.lexer.peek().type === tokenType_1.TokenType.templateMiddle);
            var span = new nodes.TemplateSpan();
            span.start = this.lexer.read().start;
            span.value = this.lexer.current.data;
            span.end = this.lexer.current.end;
            result.spans.push(span);
            var expressions = this.parseExpression();
            result.spans.push(expressions);
            if (this.lexer.peek().type !== tokenType_1.TokenType.closeBrace) {
                this.expectToken(tokenType_1.TokenType.closeBrace);
                break;
            }
            if (this.lexer.readAsTemplateMiddleOrTail().type === tokenType_1.TokenType.templateTail) {
                var span_1 = new nodes.TemplateSpan();
                span_1.start = this.lexer.read().start;
                span_1.value = this.lexer.current.data;
                span_1.end = this.lexer.current.end;
                result.spans.push(span_1);
                break;
            }
        }
        return result;
    };
    /**
     * 解析一个正则表达式字面量(`/abc/`)。
     */
    Parser.prototype.parseRegularExpressionLiteral = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.slash || this.lexer.peek().type === tokenType_1.TokenType.slashEquals);
        var result = new nodes.RegularExpressionLiteral();
        result.start = this.lexer.readAsRegularExpressionLiteral().start;
        result.value = this.lexer.current.data.pattern;
        result.flags = this.lexer.current.data.flags;
        result.end = this.lexer.current.end;
        return result;
    };
    /**
     * 解析一个 async 异步函数或标识符。
     */
    Parser.prototype.parseAsyncFunctionExpressionOrIdentifier = function () {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.async);
        this.lexer.stashSave();
        this.lexer.read();
        // 如果已换行，则认为不是 async 关键字。
        if (compiler_1.options.smartSemicolonInsertion === false && this.lexer.peek().onNewLine) {
            this.lexer.stashRestore();
            return this.parseIdentifier();
        }
        switch (this.lexer.peek().type) {
            // async function
            case tokenType_1.TokenType["function"]:
                this.lexer.stashRestore();
                return this.parseFunctionExpression(this.parseModifiers());
            // async x
            case tokenType_1.TokenType.identifier:
                this.lexer.stashRestore();
                return this.parseArrowFunctionExpression(this.parseModifiers(), undefined, this.parseIdentifier());
            // async <
            case tokenType_1.TokenType.lessThan:
                return this.parseArrowFunctionExpression(this.parseModifiers());
            // async (
            case tokenType_1.TokenType.openParen:
                var parameters = this.parseParameterList(true);
                if (!parameters || (this.lexer.peek().type !== tokenType_1.TokenType.equalsGreaterThan && this.lexer.peek().type !== tokenType_1.TokenType.colon)) {
                    this.lexer.stashRestore();
                    return this.parseIdentifier();
                }
                this.lexer.stashClear();
                return this.parseArrowFunctionExpression(undefined, undefined, parameters);
            default:
                this.lexer.stashRestore();
                return this.parseIdentifier();
        }
    };
    // #endregion
    Parser.prototype.parseMemberExpression = function () {
        var parsed;
        //const type = this.lexer.peek().type;
        //switch (type) {
        //    // Identifier、Identifier<T>
        //    case TokenType.identifier:
        //        return this.parseIdentifierOrGenericExpression();
        //    // (Expr)、(Expr) => {...}
        //    case TokenType.openParen:
        //        return this.parseParenthesizedExpressionOrArrowFunction();
        //    // new Expr
        //    case TokenType.new:
        //        return this.parseNewExpression();
        //    // yield ...
        //    case TokenType.yield:
        //        return this.parseYieldExpression();
        //    // await ...
        //    case TokenType.await:
        //        return this.parseAwaitExpression();
        //}
        //// this、super、null、true、false
        //if (isSimpleLiteral(type)) {
        //    return this.parseSimpleLiteral();
        //}
        //// 非法标记。
        //return this.parseErrorExpression();
    };
    /**
     * 解析一个错误表达式。
     */
    Parser.prototype.parseErrorExpression = function () {
        var token = this.lexer.peek();
        switch (token.type) {
            case tokenType_1.TokenType.closeParen:
            case tokenType_1.TokenType.closeBracket:
            case tokenType_1.TokenType.closeBrace:
                this.error(token, "多余的“{0}”。", tokenType_1.tokenToString(token.type));
                break;
            case tokenType_1.TokenType.endOfFile:
                this.error(token, "应输入表达式；文件意外结束。");
                break;
            default:
                this.error(token, tokenType_1.isStatementStart(token.type) ? "无效的表达式项“{0}”；“{0}”是语句关键字。" : "无效的表达式项“{0}”。", tokenType_1.tokenToString(token.type));
                break;
        }
        var result = new nodes.ErrorExpression();
        result.start = this.lexer.read().start;
        result.end = this.lexer.current.end;
        return result;
    };
    Parser.prototype.parseExpressionWith = function (flags) {
        var savedFlags = this.flags;
        this.flags |= flags;
        var result = this.parseExpression();
        this.flags = savedFlags;
        return result;
    };
    Parser.prototype.parseTypeMemberDeclaration = function () {
        //const start = this.lexer.peek().start;
        //const decorators = this.parseDecorators();
        //const modifiers = this.parseModifiers();
        // todo
        //const element = new nodes.ObjectBindingElement();
        //element.property = this.parsePropertyName();
        //if (this.lexer.peek().type === TokenType.colon) {
        //    element.colon = this.lexer.read().start;
        //    element.name = this.parseBindingName();
        //}
        //if (this.lexer.peek().type === TokenType.equals) {
        //    element.equal = this.lexer.read().start;
        //    element.initializer = this.parseExpression(ParseFlags.disallowComma);
        //}
    };
    /**
     * 解析一个成员调用表达式(`x.y`)。
     * @param parsed 已解析的表达式部分。
     */
    Parser.prototype.parseMemberCallExpression = function (parsed) {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.dot);
        var result = new nodes.MemberCallExpression();
        result.target = parsed;
        result.dotToken = this.expectToken(tokenType_1.TokenType.dot).start;
        result.argument = this.expectIdentifier();
        return result;
    };
    /**
     * 解析一个函数调用表达式(x(`)`)。
     * @param parsed 已解析的表达式部分。
     */
    Parser.prototype.parseFunctionCallExpression = function (parsed) {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.openParen);
        var result = new nodes.FunctionCallExpression();
        result.target = parsed;
        //return result;
    };
    /**
     * 解析一个索引调用表达式(`x[y]`)。
     * @param parsed 已解析的表达式部分。
     */
    Parser.prototype.parseIndexCallExpression = function (parsed) {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.openBracket);
        var result = new nodes.IndexCallExpression();
        result.target = parsed;
        //result.argument = this.parseTemplateLiteral();
        //return result;
    };
    /**
     * 解析一个模板调用表达式(`x`abc``)。
     * @param parsed 已解析的表达式部分。
     */
    Parser.prototype.parseTemplateCallExpression = function (parsed) {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.noSubstitutionTemplateLiteral || this.lexer.peek().type === tokenType_1.TokenType.templateHead);
        var result = new nodes.TemplateCallExpression();
        result.target = parsed;
        result.argument = this.parseTemplateLiteral();
        return result;
    };
    /**
     * 解析一个 new.target 表达式(`new.target`)。
     */
    Parser.prototype.parseNewTargetExpression = function () {
    };
    /**
     * 解析一个一元运算表达式(`+x、typeof x、...`)。
     */
    Parser.prototype.parseUnaryExpression = function () {
        console.assert(tokenType_1.isUnaryOperator(this.lexer.peek().type));
        var result = new nodes.UnaryExpression();
        result.start = this.lexer.read().start;
        // todo: ++ -- 的操作数只能是 parseLeftHandSideExpressionOrHigher
        result.operand = this.parseUnaryOrPrimaryExpression();
        return result;
    };
    /**
     * 解析一个后缀增量运算表达式(`x++`、`x--`)。
     * @param parsed 已解析的表达式部分。
     */
    Parser.prototype.parsePostfixIncrementExpression = function (operand) {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.plusPlus || this.lexer.peek().type === tokenType_1.TokenType.minusMinus);
        // todo: ++ -- 需要处理自动换行
        var result = new nodes.PostfixIncrementExpression();
        result.operand = operand;
        result.type = this.lexer.read().type;
        result.end = this.lexer.current.end;
        return result;
    };
    /**
     * 解析一个二元运算表达式(`x + y、x = y、...`)。
     * @param parsed 已解析的表达式部分。
     */
    Parser.prototype.parseBinaryExpression = function (parsed) {
        console.assert(isBinaryOperator(this.lexer.peek().type));
        var result = new nodes.BinaryExpression();
        result.leftOperand = parsed;
        result.operatorToken = this.lexer.read().start;
        result.type = this.lexer.current.type;
        result.rightOperand = this.parseExpression();
        return result;
    };
    /**
     * 解析一个 yield 表达式(`yield x、yield * x`)。
     */
    Parser.prototype.parseYieldExpression = function () {
    };
    /**
     * 解析一个条件表达式(`x ? y : z`)。
     * @param parsed 已解析的表达式部分。
     */
    Parser.prototype.parseConditionalExpression = function (parsed) {
        console.assert(this.lexer.peek().type === tokenType_1.TokenType.question);
        var result = new nodes.ConditionalExpression();
        result.condition = parsed;
        result.questionToken = this.lexer.read().start;
        result.thenExpression = this.parseExpression();
        result.colonToken = this.expectToken(tokenType_1.TokenType.colon).start;
        result.elseExpression = this.parseExpression();
        return result;
    };
    /**
     * 解析一个类型转换表达式(`<T>xx`)。
     */
    Parser.prototype.parseTypeCastExpression = function () {
    };
    /**
     * 解析一个泛型表达式(`Array<T>`)。
     * @param parsed 已解析的表达式部分。
     */
    Parser.prototype.parseGenericTypeExpression = function (parsed) {
    };
    /**
     * 解析一个数组类型表达式(`T[]`)。
     * @param parsed 已解析的表达式部分。
     */
    Parser.prototype.parseArrayTypeExpression = function (parsed) {
    };
    // #endregion
    // #region Jsx 节点
    /**
     * 解析一个 JSX 标签(`<div>...</div>`)。
     */
    Parser.prototype.parseJsxElement = function () {
    };
    /**
     * 解析一个 JSX 标签属性(`id="a"`)。
     */
    Parser.prototype.parseJsxAttribute = function () {
    };
    /**
     * 解析一个 JSX 文本(`{...}`)。
     */
    Parser.prototype.parseJsxText = function () {
    };
    /**
     * 解析一个 JSX 表达式(`{...}`)。
     */
    Parser.prototype.parseJsxExpression = function () {
    };
    /**
     * 解析一个 JSX 关闭元素(`{...}`)。
     */
    Parser.prototype.parseJsxClosingElement = function () {
    };
    // #endregion
    // #region 类型
    /**
     * 解析一个类型表达式。
     */
    Parser.prototype.parseTypeNode = function () {
        switch (this.lexer.peek()) {
        }
    };
    /**
     * 解析一个泛型参数列表。
     * @param ignoreError 如果解析出现错误则返回空。
     */
    Parser.prototype.parseTypeArguments = function (ignoreError) {
    };
    /**
     * 解析一个类型表达式的剩余部分。
     */
    Parser.prototype.parseTypeExprssionRest = function (parsedIdentifier) {
    };
    //    /// <summary>
    //    /// 解析以标识符开头的类型。
    //    /// </summary>
    //    /// <param name="parsedIdentifier"></param>
    //    /// <returns></returns>
    //    private Expression parseType(Identifier parsedIdentifier, TypeUsage typeUsage) {
    //    var parsed = parseTypeExpression(parsedIdentifier, typeUsage);
    //    while (readToken(TokenType.period)) {
    //        parsed = parseArrayTypeExpression(new MemberCallExpression() {
    //            target = parsed,
    //            argument = parseGenericTypeExpression(expectIdentifier(), typeUsage)
    //        }, typeUsage);
    //    }
    //    return parsed;
    //}
    //        /// <summary>
    //        /// 尝试组合当前类型为复合类型表达式。
    //        /// </summary>
    //        /// <param name="parsedIdentifier"></param>
    //        /// <param name="typeUsage"></param>
    //        /// <returns></returns>
    //        private Expression parseTypeExpression(Identifier parsedIdentifier, TypeUsage typeUsage) {
    //    return parseArrayTypeExpression(parseGenericTypeExpression(parsedIdentifier, typeUsage), typeUsage);
    //}
    //        /// <summary>
    //        /// 尝试组合当前类型为数组类型。
    //        /// </summary>
    //        /// <param name="parsed"></param>
    //        /// <param name="typeUsage"></param>
    //        /// <returns></returns>
    //        private Expression parseArrayTypeExpression(Expression parsed, TypeUsage typeUsage) {
    //    while (true) {
    //        switch (lexer.peek().type) {
    //            case TokenType.lBrack:
    //                // new 表达式中不解析数组类型。
    //                if (typeUsage == TypeUsage.@new) {
    //                    return parsed;
    //                }
    //                if (typeUsage != TypeUsage.type) {
    //                    // 判断 [ 是索引还是数组类型。
    //                    lexer.mark();
    //                    do {
    //                        lexer.markRead();
    //                    } while (lexer.markPeek().type == TokenType.comma);
    //                    if (lexer.markPeek().type != TokenType.rBrack) {
    //                        goto default;
    //        }
    //    }
    //    lexer.read(); // [
    //    int rank = 1;
    //    while (readToken(TokenType.comma))
    //        rank++;
    //    expectToken(TokenType.rBrack, ErrorCode.expectedRBrack);
    //    parsed = new ArrayTypeExpression() {
    //        elementType = parsed,
    //            //rank = rank,
    //            endLocation = lexer.current.endLocation
    //    };
    //    continue;
    //                    case TokenType.mul:
    //    if (typeUsage == TypeUsage.expression) {
    //        lexer.mark();
    //        lexer.markRead();
    //        // 如果紧跟表达式，则 * 解析为乘号。
    //        if (lexer.markRead().type.isExpressionStart()) {
    //            goto default;
    //        }
    //    }
    //    parsed = new PtrTypeExpression() {
    //        elementType = parsed,
    //            endLocation = lexer.read().endLocation
    //    };
    //    continue;
    //                    default:
    //    return parsed;
    //}
    //            }
    //        }
    //        /// <summary>
    //        /// 尝试组合当前类型为泛型。
    //        /// </summary>
    //        /// <param name="parsed"></param>
    //        /// <param name="typeUsage"></param>
    //        /// <returns></returns>
    //        private Expression parseGenericTypeExpression(Identifier parsedIdentifier, TypeUsage typeUsage) {
    //    if (lexer.peek().type == TokenType.lt) {
    //        // 判断 < 是小于号还是泛型参数。
    //        if (typeUsage != TypeUsage.type) {
    //            lexer.mark();
    //            if (!markReadGenericTypeExpression()) {
    //                return parsedIdentifier;
    //            }
    //        }
    //        lexer.read(); // <
    //        var result = new GenericTypeExpression();
    //        result.elementType = parsedIdentifier;
    //        result.genericArguments = new List<Expression>();
    //        do {
    //            if (lexer.peek().type == TokenType.comma || lexer.peek().type == TokenType.gt) {
    //                result.genericArguments.Add(null);
    //                continue;
    //            }
    //            result.genericArguments.Add(parseType());
    //        } while (readToken(TokenType.comma));
    //        expectToken(TokenType.gt, ErrorCode.expectedGt);
    //        result.endLocation = lexer.current.endLocation;
    //        return result;
    //    }
    //    return parsedIdentifier;
    //}
    //        /// <summary>
    //        /// 判断一个类型之后是否存在泛型参数。
    //        /// </summary>
    //        /// <returns></returns>
    //        private bool markReadGenericTypeExpression() {
    //    Debug.Assert(lexer.markPeek().type == TokenType.@lt);
    //    do {
    //        lexer.markRead(); // <, ,
    //        // 允许直接结束。
    //        if (lexer.markPeek().type == TokenType.gt) {
    //            break;
    //        }
    //        // 如果紧跟的不是类型，则不是类型。
    //        if (!markReadType()) {
    //            return false;
    //        }
    //    } while (lexer.markPeek().type == TokenType.comma);
    //    // 如果是 > 说明一切顺利。
    //    return lexer.markRead().type == TokenType.gt;
    //}
    //        /// <summary>
    //        /// 判断一个类型之后是否是数组类型。
    //        /// </summary>
    //        /// <returns></returns>
    //        private bool markReadArrayTypeExpression() {
    //    Debug.Assert(lexer.markPeek().type == TokenType.lBrack);
    //    lexer.markRead(); // [
    //    // 跳过逗号。
    //    while (lexer.markPeek().type == TokenType.comma) {
    //        lexer.markRead();
    //    }
    //    return lexer.markRead().type == TokenType.rBrack;
    //}
    //        private bool markReadType() {
    //    var type = lexer.markRead().type;
    //    if (type == TokenType.identifier) {
    //        if (lexer.markPeek().type == TokenType.lt && !markReadGenericTypeExpression()) {
    //            return false;
    //        }
    //    } else if (!type.isPredefinedType()) {
    //        return false;
    //    }
    //    // 读取类型数组和指针组合。
    //    while (true) {
    //        switch (lexer.markPeek().type) {
    //            case TokenType.lBrack:
    //                if (!markReadArrayTypeExpression()) {
    //                    return false;
    //                }
    //                continue;
    //            case TokenType.mul:
    //                lexer.markRead();
    //                continue;
    //            case TokenType.period:
    //                lexer.markRead();
    //                if (lexer.markRead().type != TokenType.identifier) {
    //                    return false;
    //                }
    //                continue;
    //            default:
    //                return true;
    //        }
    //    }
    //}
    /**
     * 解析一个简单类型节点(`number`、`string`、...)。
     * @param node 要解析的节点。
     */
    Parser.prototype.parseSimpleTypeNode = function (node) {
    };
    /**
     * 解析一个泛型节点(`Array<T>`)。
     * @param node 要解析的节点。
     */
    Parser.prototype.parseGenericTypeNode = function (node) {
        node.element.accept(this);
        node.typeArguments.accept(this);
    };
    /**
     * 解析一个数组类型节点(`T[]`)。
     * @param node 要解析的节点。
     */
    Parser.prototype.parseArrayTypeNode = function (node) {
        node.element.accept(this);
    };
    /**
     * 解析一个函数类型节点(`()=>void`)。
     * @param node 要解析的节点。
     */
    Parser.prototype.parseFunctionTypeNode = function (node) {
        node.typeParameters && node.typeParameters.accept(this);
    };
    /**
     * 解析一个构造函数类型节点(`new ()=>void`)。
     * @param node 要解析的节点。
     */
    Parser.prototype.parseConstructorTypeNode = function (node) {
    };
    /**
     * 解析一个元祖类型节点(`[string, number]`)。
     * @param node 要解析的节点。
     */
    Parser.prototype.parseTupleTypeNode = function (node) {
    };
    /**
     * 解析一个联合类型节点(`number | string`)。
     * @param node 要解析的节点。
     */
    Parser.prototype.parseUnionTypeNode = function (node) {
    };
    /**
     * 解析一个交错类型节点(`number & string`)。
     * @param node 要解析的节点。
     */
    Parser.prototype.parseIntersectionTypeNode = function (node) {
    };
    /**
     * 解析一个对象类型节点(`{x: string}`)。
     * @param node 要解析的节点。
     */
    Parser.prototype.parseObjectTypeNode = function (node) {
    };
    /**
     * 解析一个类型查询节点(`typeof x`)。
     * @param node 要解析的节点。
     */
    Parser.prototype.parseTypeQueryNode = function (node) {
    };
    /**
     * 解析一个括号类型节点(`(number)`)。
     * @param node 要解析的节点。
     */
    Parser.prototype.parseParenthesizedTypeNode = function (node) {
        node.body.accept(this);
    };
    /**
     * 解析一个表达式类型节点(`"abc"`、`true`)。
     * @param node 要解析的节点。
     */
    Parser.prototype.parseExpressionTypeNode = function (node) {
    };
    /**
     * 解析一个限定名称类型节点(`"abc"`、`true`)。
     * @param node 要解析的节点。
     */
    Parser.prototype.parseQualifiedNameTypeNode = function (node) {
    };
    /**
     * 解析一个类型别名声明(`type A = number`)。
     * @param node 要解析的节点。
     */
    Parser.prototype.parseTypeAliasDeclaration = function (node) {
    };
    // #endregion
    // #region 注释
    /**
     * 解析一个 JS 注释。
     */
    Parser.prototype.parseComment = function () {
    };
    /**
     * 解析一个 JS 文档注释。
     * @param node 所属的节点。
     */
    Parser.prototype.parseJsDocComment = function (node) {
    };
    return Parser;
}());
exports.Parser = Parser;
var ParseFlags;
(function (ParseFlags) {
    ParseFlags[ParseFlags["disallowIn"] = 0] = "disallowIn";
    ParseFlags[ParseFlags["disallowComma"] = 1] = "disallowComma";
    ParseFlags[ParseFlags["disdisallowIn"] = 2] = "disdisallowIn";
})(ParseFlags || (ParseFlags = {}));
