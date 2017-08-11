
/**
 * 表示一个语法解析器。
 * @description 语法解析器可以将源码解析一个语法树。
 */
export class Parser {

    // #region 解析工具

    //    /**
    //     * 读取一个标识符。
    //     */
    //    * <returns></returns>
    //    private Identifier expectIdentifier() {
    //    if (this.lexer.peek().type == TokenType.identifier) {
    //        return parseIdentifier();
    //    }

    //    if (this.lexer.peek().type.isKeyword()) {
    //        Compiler.error(ErrorCode.expectedIdentifier, String.Format("语法错误：应输入标识符；“{0}”是关键字，请改为“${0}”", this.lexer.peek().type.getName()), this.lexer.peek());
    //        return parseIdentifier();
    //    }
    //    Compiler.error(ErrorCode.expectedIdentifier, "语法错误：应输入标识符", this.lexer.peek());

    //    return new Identifier() {
    //        value = String.Empty
    //    };
    //}

    //    /**
    //     * 读取一个分号。
    //     */
    //    private void expectSemicolon() {
    //    if (readToken(TokenType.semicolon)) {
    //        return;
    //    }

    //    if (Compiler.options.disallowMissingSemicolons) {
    //        Compiler.error(ErrorCode.strictExpectedSemicolon, "严格模式：应输入“;”", this.lexer.current.endLocation, this.lexer.current.endLocation);
    //        return;
    //    }

    //    if (!this.lexer.peek().hasLineTerminatorBeforeStart && this.lexer.peek().type != TokenType.rBrace && this.lexer.peek().type != TokenType.eof) {
    //        Compiler.error(ErrorCode.expectedSemicolon, "语法错误：应输入“;”或换行", this.lexer.current.endLocation, this.lexer.current.endLocation);
    //    }
    //}

    //    private bool expectLBrace() {
    //    if (this.lexer.peek().type == TokenType.lBrace) {
    //        this.lexer.read();
    //        return true;
    //    }
    //    Compiler.error(ErrorCode.expectedLBrace, "语法错误：应输入“{”", this.lexer.peek());
    //    return false;
    //}

    //        private static bool checkIdentifier(Token token, string value) {
    //    if (token.type != TokenType.identifier || token.buffer.Length != value.Length) {
    //        return false;
    //    }
    //    for (int i = 0; i < value.Length; i++) {
    //        if (token.buffer[i] != value[i]) {
    //            return false;
    //        }
    //    }
    //    return true;
    //}

    //        /**
    //         * 将现有的表达式转为标识符。
    //         */
    //         * <param name="value" > </param>
    //    * <returns></returns>
    //        private static Identifier toIdentifier(Expression value) {
    //    var result = value as Identifier;
    //    if (result != null) {
    //        return result;
    //    }

    //    // expression 为 null， 表示 expression 不是表达式，已经在解析表达式时报告错误了。
    //    if (value != Expression.empty) {
    //        if (value is PredefinedTypeLiteral) {
    //            Compiler.error(ErrorCode.expectedIdentifier, String.Format("语法错误：应输入标识符；“{0}”是关键字，请改用“${0}”", ((PredefinedTypeLiteral)value).type.getName()), value);
    //        } else {
    //            Compiler.error(ErrorCode.expectedIdentifier, "语法错误：应输入标识符", value);
    //        }
    //    }

    //    return new Identifier() {
    //        value = value.ToString()
    //    };
    //}

    //    /**
    //     * 忽略当前成员相关的所有标记。
    //     */
    //    private void skipToMemberDefinition() {
    //    // #todo 改进我
    //    do {
    //        this.lexer.read();

    //        if (this.lexer.peek().type.isUsedInGlobal()) {
    //            if (this.lexer.peek().type.isPredefinedType() && this.lexer.current.type != TokenType.rBrace) {
    //                continue;
    //            }
    //            break;
    //        }

    //    } while (this.lexer.peek().type != TokenType.eof);
    //}

    //        /**
    //         * 忽略当前行的所有标记。
    //         */
    //        private void skipToNextLine() {
    //    do {
    //        this.lexer.read();
    //    } while (this.lexer.peek().type != TokenType.eof && !this.lexer.peek().hasLineTerminatorBeforeStart);
    //}

    /**
     * 解析一个逗号隔开的节点列表(<..., ...>。
     * @param nodes 要解析的节点列表。
     */
    parseNodeList<T extends Node>(start: TokenType, parseElement: () => T, end: TokenType) {
        const result = new nodes.NodeList<T>();

        return result;
    }

    /**
     * 尝试在当前位置自动插入分号。
     * @return 返回插入或补齐分号后的结束位置。
     */
    private autoInsertSemicolon() {
        switch (this.lexer.peek().type) {
            case TokenType.semicolon:
                return this.lexer.read().end;
            case TokenType.closeBrace:
            case TokenType.endOfFile:
                return options.autoInsertSemicolon === false ?
                    this.expectToken(TokenType.semicolon) :
                    this.lexer.current.end;
            default:
                return options.autoInsertSemicolon === false || !this.lexer.peek().onNewLine ?
                    this.expectToken(TokenType.semicolon) :
                    this.lexer.current.end;
        }
    }

    // #endregion

    // #region 表达式

    /**
     * 解析一个表达式。
     * @param minPrecedence 当前解析的最低操作符优先级。
     */
    private parseExpression(minPrecedence?: number) {
        console.assert(isExpressionStart(this.lexer.peek().type));

        let parsed: nodes.Expression;
        const type = this.lexer.peek().type;
        switch (type) {

            // Identifier、Identifier<T>、Identifier[]
            case TokenType.identifier:
                parsed = this.parseRestTypeExprssion(this.parseIdentifier());
                break;

            // (Expr)、(Expr) => {...}
            case TokenType.openParen:
                parsed = this.parseParenthesizedExpressionOrArrowFunction();
                break;

            // new Expr
            case TokenType.new:
                parsed = this.parseNewExpression();
                break;

            // ""、''
            case TokenType.stringLiteral:
                parsed = this.parseStringLiteral();
                break;

            // 0
            case TokenType.numericLiteral:
                parsed = this.parseNumericLiteral();
                break;

            // [Expr, ...]
            case TokenType.openBracket:
                parsed = this.parseArrayLiteral();
                break;

            // {key: Expr, ...}
            case TokenType.openBrace:
                parsed = this.parseObjectLiteral();
                break;

            // => ...
            case TokenType.equalsGreaterThan:
                parsed = this.parseArrowFunction();
                break;

            // await ...
            case TokenType.await:
                parsed = this.parseAwaitExpression();
                break;

            default:

                // true,
                if (isSimpleLiteral(type)) {
                    parsed = this.SimpleLiteral();
                }

                // +Expr
                if (isUnaryOperator(type)) {
                    parsed = this.parseUnaryExpression();
                    break;
                }

                switch (type) {
                    case TokenType.closeParen:
                        this.error(this.lexer.read(), "多余的“)”。");
                        break;
                    case TokenType.closeBracket:
                        this.error(this.lexer.read(), "多余的“]”。");
                        break;
                    case TokenType.closeBrace:
                        this.error(this.lexer.read(), "多余的“}”。");
                        break;
                    default:
                        if (isStatementStart(type)) {
                            this.error(this.lexer.peek(), "“{0}”是语句关键字；改用其它变量名?", tokenToString(type));
                        } else {
                            this.error(this.lexer.peek(), "无效的表达式项“{0}”", tokenToString(type));
                        }
                        do {
                            this.lexer.read();
                        } while (this.lexer.peek().type != TokenType.endOfFile && !this.lexer.peek().onNewLine);
                        break;
                }

                return nodes.Expression.null;
        }
        return this.parseRestExpression(parsed, minPrecedence);
    }

    /**
     * 在解析一个表达式之后，继续解析剩下的后缀表达式。
     * @pram parsed 已解析的表达式。
     * @param minPrecedence 当前解析的最低操作符优先级。
     */
    private parseRestExpression(parsed: nodes.Expression, minPrecedence?: number) {

        TokenType type;
        int precedence;

        while ((precedence = (type = this.lexer.peek().type).getPrecedence()) >= minPrecedence) {

            // Exper = Val
            if (type.isAssignOperator()) {
                this.lexer.read();
                parsed = new BinaryExpression() {
                    leftOperand = parsed,
                        @operator = type,
                        rightOperand = parseExpression(precedence)
                };
                continue;
            }

            switch (type) {

                // Expr.call
                case TokenType.period: {
                    var current = new MemberCallExpression();
                    current.target = parsed;
                    this.lexer.read();
                    current.argument = parseGenericTypeExpression(expectIdentifier(), TypeUsage.expression);
                    parsed = current;
                    continue;
                }

                // Expr()
                case TokenType.lParam: {
                    var current = new FuncCallExpression();
                    current.target = parsed;
                    current.arguments = parseArgumentList(TokenType.rParam, ErrorCode.expectedRParam);
                    current.endLocation = this.lexer.current.endLocation;
                    parsed = current;
                    continue;
                }

                // Expr ->
                case TokenType.lambda:
                    parsed = parseLambdaLiteral(toIdentifier(parsed));
                    continue;

                // Expr[]
                case TokenType.lBrack: {
                    var current = new IndexCallExpression();
                    current.target = parsed;
                    current.arguments = parseArgumentList(TokenType.rBrack, ErrorCode.expectedRBrack);
                    current.endLocation = this.lexer.current.endLocation;
                    parsed = current;
                    continue;
                }

                // Expr ? A : B
                case TokenType.conditional: {
                    var current = new ConditionalExpression();
                    current.condition = parsed;
                    this.lexer.read();
                    current.thenExpression = parseExpression();
                    expectToken(TokenType.colon, ErrorCode.expectedColon);
                    current.elseExpression = parseExpression();
                    parsed = current;
                    continue;
                }

                // Expr++, Exper--
                case TokenType.inc:
                case TokenType.dec:
                    // 如果 ++ 和 -- 在新行出现，则不继续解析。
                    if (this.lexer.peek().hasLineTerminatorBeforeStart) {
                        return parsed;
                    }
                    parsed = new MutatorExpression {
                        operand = parsed,
                            @operator = type,
                            endLocation = this.lexer.read().endLocation
                    };
                    continue;

                // Expr..A
                case TokenType.periodChain: {
                    var current = new ChainCallExpression();
                    current.target = parsed;
                    this.lexer.read(); // ..
                    current.argument = expectIdentifier();
                    parsed = new ChainExpression() {
                        chainCallExpression = current,
                              //  body = parseExpression(current, precedence + 1)
                            };
                    continue;
                }

                case TokenType.is:
                    this.lexer.read();
                    parsed = new IsExpression() {
                        leftOperand = parsed,
                            rightOperand = parseExpression(precedence + 1)
                    };
                    continue;

                case TokenType.as:
                    this.lexer.read();
                    parsed = new AsExpression() {
                        leftOperand = parsed,
                            rightOperand = parseExpression(precedence + 1)
                    };
                    continue;

                case TokenType.rangeTo: {
                    var current = new RangeLiteral();
                    current.start = parsed;
                    this.lexer.read();
                    current.end = parseExpression(precedence + 1);
                    parsed = current;
                    continue;
                }

                default:

                    // Exper + Val
                    if (type.isBinaryOperator()) {
                        this.lexer.read();
                        parsed = new BinaryExpression() {
                            leftOperand = parsed,
                                @operator = type,
                                rightOperand = parseExpression(precedence + 1)
                        };
                        continue;
                    }

                    return parsed;
            }
        }

        return parsed;
    }

    private parseParenthesizedExpressionOrArrowFunction() {

        console.assert(this.lexer.peek().type == TokenType.openParen);

        if (this.isArrowFunction()) { }

        //switch (followsWithLambdaOrTypeConversion()) {

        //    // (Parameters) ->
        //    case State.on:
        //        return parseLambdaLiteral(null);

        //    // (Type) Expression
        //    case State.off: {
        //            var result = new CastExpression();
        //            result.start = this.lexer.read().start; // (
        //            result.targetType = parseType();
        //            expectToken(TokenType.rParam, ErrorCode.expectedRParam);
        //            result.body = parseExpression(TokenType.lParam.getPrecedence());
        //            return result;
        //        }

        //    // (Expression)
        //    default: {
        //            var result = new ParenthesizedExpression();
        //            result.start = this.lexer.read().start; // (
        //            result.body = parseExpression();
        //            expectToken(TokenType.rParam, ErrorCode.expectedRParam);
        //            result.endLocation = this.lexer.current.endLocation;
        //            return result;
        //        }
        //}

    }

    private parseNewExpression() {

        console.assert(this.lexer.peek().type == TokenType.new);

        const result = new nodes.NewExpression();
        result.start = this.lexer.read().start; // new
        result.target = this.parseExpression(0);

        if (this.lexer.peek().type == TokenType.openParen) {
            result.arguments = this.parseArgumentList();
        }

        return result;
    }

    //    private parseExpression() {

    //    let result = this.parseAssignmentExpressionOrHigher();
    //    while (this.readToken(TokenType.comma)) {
    //        result = this.makeBinaryExpression(result, TokenType.comma, this.lexer.tokenStart - 1, this.parseAssignmentExpressionOrHigher());
    //    }

    //    return result;
    //}

    /**
     * 解析一个一元运算表达式(+x)。
     */
    parseUnaryExpression() {

    }

    // #endregion

    // #region 成员

    // #endregion

    //    /**
    //     * 所有解析操作的入口函数。
    //     */
    //    * <param name="target" > </param>
    //    private void parseSourceUnitBody(SourceUnit target) {

    //    // SourceUnit :
    //    //   ImportDirectiveList? MemberDefinitionList?

    //    // ImportDirectiveList :
    //    //   ImportDirective ...

    //    // 解析导入指令。
    //    target.importDirectives = parseImportDirectiveList();

    //    // 解析其它成员。
    //    parseMemberContainerDefinitionBody(target, false);

    //}

    //        private ImportDirective parseImportDirectiveList() {

    //    // ImportDirective :
    //    //   import Type ;
    //    //   import Identifier = Type ;
    //    //   import Type => Identifier ;

    //    ImportDirective first = null, last = null;

    //    while (readToken(TokenType.import)) {

    //        var current = new ImportDirective();

    //        current.value = parseType();
    //        switch (this.lexer.peek().type) {
    //            case TokenType.assign:
    //                this.lexer.read();
    //                current.alias = toIdentifier(current.value);
    //                current.value = parseType();
    //                break;
    //            case TokenType.assignTo:
    //                this.lexer.read();
    //                current.alias = expectIdentifier();
    //                break;
    //        }

    //        expectSemicolon();

    //        if (first == null) {
    //            last = first = current;
    //        } else {
    //            last = last.next = current;
    //        }
    //    }

    //    return first;

    //}

    //        private void parseMemberContainerDefinitionBody(MemberContainerDefinition target, bool expectRBrack) {

    //    // MemberDefinitionList :
    //    //   MemberDefinition ...

    //    // MemberDefinition :
    //    //   FieldDefinition
    //    //   AliasDefinition
    //    //   PropertyDefinition
    //    //   OperatorOverloadDefinition
    //    //   IndexerDefinition
    //    //   MethodDefinition
    //    //   ConstructorDefinition
    //    //   DeconstructorDefinition
    //    //   TypeDefinition 
    //    //   NamespaceDefinition 
    //    //   ExtensionDefinition 

    //    // TypeDefinition :
    //    //   ClassDefinition
    //    //   StructDefinition
    //    //   EnumDefinition
    //    //   InterfaceDefinition

    //    MemberDefinition last = null;
    //    while (true) {

    //        MemberDefinition current;
    //        Expression returnType;
    //        var docComment = parseDocComment();
    //        var annotations = parseMemberAnnotationList();
    //        var modifiers = parseModifiers();
    //        var type = this.lexer.peek().type;

    //        // int xxx...
    //        if (type.isPredefinedType()) {
    //            returnType = parsePredefinedType();
    //            goto parseTypeMember;
    //        }

    //        switch (type) {

    //            #region 标识符
    //                    case TokenType.identifier:

    //        var currentIdentifier = parseIdentifier();

    //        // A()
    //        if (this.lexer.peek().type == TokenType.lParam) {
    //            current = parseConstructor(docComment, annotations, modifiers, currentIdentifier);
    //            goto parseSuccess;
    //        }

    //        returnType = parseType(currentIdentifier, TypeUsage.type);
    //        goto parseTypeMember;

    //        #endregion

    //        #region 关键字开头的成员定义

    //                    case TokenType.namespace:
    //        current = parseNamespaceDefinition(docComment, annotations, modifiers);
    //        goto parseSuccess;
    //                    case TokenType.class:
    //        current = parseClassDefinition(docComment, annotations, modifiers);
    //        goto parseSuccess;
    //                    case TokenType.struct:
    //        current = parseStructDefinition(docComment, annotations, modifiers);
    //        goto parseSuccess;
    //                    case TokenType.interface:
    //        current = parseInterfaceDefinition(docComment, annotations, modifiers);
    //        goto parseSuccess;
    //                    case TokenType.enum:
    //        current = parseEnumDefinition(docComment, annotations, modifiers);
    //        goto parseSuccess;
    //                    case TokenType.extend:
    //        current = parseExtensionDefinition(docComment, annotations, modifiers);
    //        goto parseSuccess;
    //                    case TokenType.func:
    //        current = parseFuncDefinition(docComment, annotations, modifiers);
    //        goto parseSuccess;

    //        #endregion

    //        #region 结束符

    //                    case TokenType.rBrace:
    //        this.lexer.read();
    //        if (expectRBrack) {
    //            return;
    //        }
    //        Compiler.error(ErrorCode.unexpectedRBrace, "语法错误：多余的“}”", this.lexer.current);
    //        continue;
    //                    case TokenType.eof:
    //        if (expectRBrack) {
    //            expectToken(TokenType.rBrace, ErrorCode.expectedRBrace);
    //        }
    //        return;

    //        #endregion

    //        #region 错误

    //                    case TokenType.import:
    //        Compiler.error(ErrorCode.unexpectedImportDirective, "“import”指令只能在文件顶部使用", this.lexer.peek());
    //        // 忽略之后的所有 import 语句。
    //        skipToMemberDefinition();
    //        continue;
    //                    case TokenType.semicolon:
    //        Compiler.error(ErrorCode.unexpectedSemicolon, "语法错误：多余的“;”", this.lexer.peek());
    //        this.lexer.read();
    //        continue;
    //                    default:
    //        Compiler.error(ErrorCode.unexpectedStatement, "语法错误：应输入函数、类或其它成员定义；所有语句都应放在函数内", this.lexer.peek());
    //        skipToMemberDefinition();
    //        continue;

    //        #endregion

    //    }

    //    parseTypeMember:

    //    // 当前接口的显示声明。
    //    Expression explicitType = null;

    //    parseNextTypeMember:

    //    switch (this.lexer.peek().type) {

    //        #region Type name
    //                    case TokenType.identifier:

    //    Identifier currentIdentifier = parseIdentifier();
    //    switch (this.lexer.peek().type) {

    //        // Type name()
    //        case TokenType.lParam:
    //            current = parseMethodDefinition(docComment, annotations, modifiers, returnType, explicitType, currentIdentifier);
    //            goto parseSuccess;

    //        // Type name {get; set;}
    //        case TokenType.lBrace:
    //            current = parsePropertyDefinition(docComment, annotations, modifiers, returnType, explicitType, currentIdentifier);
    //            goto parseSuccess;

    //        // Type InterfaceType.name()
    //        case TokenType.period:
    //            explicitType = explicitType == null ? (Expression)currentIdentifier : new MemberCallExpression() {
    //                target = explicitType,
    //                    argument = currentIdentifier
    //            };
    //            this.lexer.read();
    //            goto parseNextTypeMember;

    //        // Type name<T>()
    //        case TokenType.lt:
    //            if (followsWithTypeMemberDefinition()) {
    //                var currentType = parseGenericTypeExpression(currentIdentifier, TypeUsage.type);
    //                explicitType = explicitType == null ? (Expression)currentType : new MemberCallExpression() {
    //                    target = explicitType,
    //                        argument = currentType
    //                };
    //                this.lexer.read();
    //                goto parseNextTypeMember;
    //            }
    //            current = parseMethodDefinition(docComment, annotations, modifiers, returnType, explicitType, currentIdentifier);
    //            goto parseSuccess;

    //        // Type name;
    //        // Type name = Value;
    //        // Type name, name2;
    //        default:
    //            current = parseFieldDefinition(docComment, annotations, modifiers, returnType, explicitType, currentIdentifier);
    //            goto parseSuccess;

    //    }

    //    #endregion

    //    #region Type this
    //                    case TokenType.this:
    //    this.lexer.read();

    //    // Type this [params] {}
    //    if (this.lexer.peek().type == TokenType.lBrack) {
    //        current = parseIndexerOperatorDefinition(docComment, annotations, modifiers, returnType, explicitType);
    //        goto parseSuccess;
    //    }

    //    // Type this +(params) {}
    //    if (this.lexer.peek().type.isOverloadableOperator()) {
    //        current = parseOperatorOverloadDefinition(docComment, annotations, modifiers, returnType, explicitType);
    //        goto parseSuccess;
    //    }

    //    Compiler.error(ErrorCode.invalidOperatorOverload, String.Format("“{0}”不是可重载的操作符", this.lexer.peek().type.getName()), this.lexer.peek());
    //    skipToMemberDefinition();
    //    continue;
    //    #endregion

    //                    // 其它情况。
    //                    default:
    //    expectIdentifier();
    //    skipToMemberDefinition();
    //    continue;

    //}

    //parseSuccess:
    //if (target.members == null) {
    //    last = target.members = current;
    //} else if (current != null) {
    //    last = last.next = current;
    //}

    //            }

    //        }

    /**
     * 判断之后是否存在函数名。
     */
    * <returns></returns>
        private bool followsWithTypeMemberDefinition() {
    this.lexer.mark();
    this.lexer.markRead();

    // 忽略之后的泛型参数。
    while (true) {
        switch (this.lexer.markRead().type) {
            case TokenType.gt:

                // 如果紧跟 . 说明这是实体泛型。
                return this.lexer.markRead().type == TokenType.period;
            case TokenType.lt:
                return true;
            case TokenType.colon:
            case TokenType.eof:
                return false;
        }
    }
}

//        private DocComment parseDocComment() {
//    return this.lexer.peek().docComment;
//}

//        private MemberDefinition.MemberAnnotation parseMemberAnnotationList() {

//    // MemberAnnotationList :
//    //   MemberDefinition.MemberAnnotation ...

//    // MemberDefinition.MemberAnnotation :
//    //   @ Type FuncCallArguments?

//    MemberDefinition.MemberAnnotation first = null, last = null;

//    int count = 0;

//    while (readToken(TokenType.at)) {

//        var current = new MemberDefinition.MemberAnnotation();

//        current.target = parseType();
//        if (this.lexer.peek().type == TokenType.lParam) {
//            current.arguments = parseArgumentList(TokenType.rParam, ErrorCode.expectedRParam);
//        }

//        if (first == null) {
//            last = first = current;
//        } else {
//            last = last.next = current;
//        }

//        if (++count > 250) {
//            Compiler.error(ErrorCode.tooManyAnnoatation, "注解太多；一个成员最多只能包含 250 个注解", this.lexer.current);
//        }

//    }

//    return first;

//}

        private Modifiers parseModifiers() {
    Modifiers result = Modifiers.none;

    while (this.lexer.peek().type.isModifier()) {
        Modifiers current;
        switch (this.lexer.read().type) {
            case TokenType.static:
                current = Modifiers.@static;
                break;
            case TokenType.virtual:
                current = Modifiers.@virtual;
                break;
            case TokenType.override:
                current = Modifiers.@override;
                break;
            case TokenType.abstract:
                current = Modifiers.@abstract;
                break;

            case TokenType.private:
                current = Modifiers.@private;
                break;
            case TokenType.public:
                current = Modifiers.@public;
                break;
            case TokenType.protected:
                current = Modifiers.@protected;
                break;

            case TokenType.new:
                current = Modifiers.@new;
                break;
            case TokenType.const:
                current = Modifiers.@const;
                break;
            case TokenType.final:
                current = Modifiers.final;
                break;
            case TokenType.extern:
                current = Modifiers.@extern;
                break;
            case TokenType.volatile:
                current = Modifiers.@volatile;
                break;
            default:
                console.assert(false, "TokenType.isModifier() 返回错误的结果");
                throw new Unreachable();
        }

        if (result.hasFlag(current)) {
            Compiler.error(ErrorCode.dumpModifiers, String.Format("“{0}”修饰符重复；应删除“{0}”", current.getName()), this.lexer.current);
            continue;
        }

        if (result.getAccessibility() != Modifiers.none && current.getAccessibility() != Modifiers.none) {
            Compiler.error(ErrorCode.tooManyAccessibility, String.Format("访问修饰符太多；应删除“{0}”", current.getName()), this.lexer.current);
            continue;
        }

        result |= current;

    }

    return result;
}

        private MethodDefinition parseMethodDefinition(DocComment docComment, MemberDefinition.MemberAnnotation annotations, Modifiers modifiers, Expression returnType, Expression explicitType, Identifier name) {

    // MethodDefinition :
    //   Annotations? Modifiers? Type ExplicitType? Identifier GenericParameterList? ( ParameterList? ) MethodBody

    // MethodBody :
    //   ;
    //   Block

    var result = new MethodDefinition();
    result.docComment = docComment;
    result.annotations = annotations;
    result.modifiers = modifiers;
    result.returnType = returnType;
    result.explicitType = explicitType;
    result.name = name;

    if (readToken(TokenType.lt)) {
        result.genericParameters = parseGenericParameterList();
    }

    result.parameters = parseParameterList(TokenType.lParam, TokenType.rParam, ErrorCode.expectedRParam);
    result.body = parseMethodBody();
    return result;

}

        private Teal.Compiler.MemberDefinition.GenericParameter parseGenericParameterList() {

    // GenericParameterList :
    //   GenericParameter
    //   GenericParameterList , GenericParameter

    // GenericParameter :
    //   Identifier
    //   Identifier : TypeConstract
    //   ...

    // TypeConstract :
    //   Type
    //   ( TypeList? )

    Teal.Compiler.MemberDefinition.GenericParameter first = null, last = null;

    int count = 0;

    do {
        var current = new Teal.Compiler.MemberDefinition.GenericParameter();

        if (!readToken(TokenType.ellipsis)) {
            current.name = expectIdentifier();

            if (readToken(TokenType.colon)) {
                current.constraints = new List<Expression>();
                bool hasParam = readToken(TokenType.lParam);
                int j = 0;
                do {
                    Expression type;

                    switch (this.lexer.peek().type) {
                        case TokenType.class:
                            type = new MemberDefinition.GenericParameter.ClassConstraintExpression() {
                                start = this.lexer.read().start
                            };
                            break;
                        case TokenType.struct:
                            type = new MemberDefinition.GenericParameter.StructConstraintExpression() {
                                start = this.lexer.read().start
                            };
                            break;
                        case TokenType.enum:
                            type = new MemberDefinition.GenericParameter.EnumConstraintExpression() {
                                start = this.lexer.read().start
                            };
                            break;
                        case TokenType.new:
                            type = new MemberDefinition.GenericParameter.NewableConstraintExpression() {
                                start = this.lexer.read().start,
                                    };
                            expectToken(TokenType.lParam, ErrorCode.expectedLParam);
                            expectToken(TokenType.rParam, ErrorCode.expectedRParam);
                            type.endLocation = this.lexer.current.endLocation;
                            break;
                        case TokenType.rParam:
                            goto end;
                        default:
                            type = parseType();
                            break;
                    }

                    current.constraints.Add(type);

                    if (!hasParam) {
                        goto end;
                    }

                    if (++j > 250) {
                        Compiler.error(ErrorCode.tooManyGenericConstraints, "泛型约束太多；一个泛型参数最多只能包含 250 个约束", this.lexer.current);
                    }

                } while (readToken(TokenType.comma));

                expectToken(TokenType.rParam, ErrorCode.expectedRParam);
            }

        }

        end:

        if (last == null) {
            last = first = current;
        } else {
            last = last.next = current;
        }

        if (++count > 250) {
            Compiler.error(ErrorCode.tooManyGenericTypeParameters, "泛型参数太多；一个成员最多只能包含 250 个泛型参数", this.lexer.current);
        }

    } while (readToken(TokenType.comma));

    expectToken(TokenType.gt, ErrorCode.expectedGt);
    return first;

}

        private Teal.Compiler.MemberDefinition.Parameter parseParameterList(TokenType startToken, TokenType stopToken, ErrorCode errorCode) {

    // ParameterList :
    //   Parameter
    //   ParameterList , Parameter

    // Parameter :
    //   ParameterModifers? Type Identifier VariableInitializer?
    //   ...

    // ParameterModifers :
    //   ref
    //   out
    //   params

    if (readToken(startToken)) {
        Teal.Compiler.MemberDefinition.Parameter first = null;
        Variable last = first;
        do {

            if (readToken(stopToken)) {
                return first;
            }

            var current = new Teal.Compiler.MemberDefinition.Parameter();
            current.variableType = VariableType.inParameter;
            switch (this.lexer.peek().type) {
                case TokenType.ref:
                    current.variableType = VariableType.refParameter;
                    this.lexer.read();
                    parseRestParameterModifiers();
                    goto default;
                case TokenType.params:
                    current.variableType = VariableType.paramsParameter;
                    this.lexer.read();
                    parseRestParameterModifiers();
                    goto default;
                case TokenType.out:
                    current.variableType = VariableType.outParameter;
                    this.lexer.read();
                    parseRestParameterModifiers();
                    goto default;
                case TokenType.ellipsis:
                    current.variableType = VariableType.argListParameter;
                    current.name = new Identifier() {
                        start = this.lexer.read().start,
                            value = "...",
                            endLocation = this.lexer.current.endLocation
                    };
                    break;
                default:
                    current.type = parseType();
                    current.name = expectIdentifier();

                    // 读取参数默认值。
                    if (readToken(TokenType.assign)) {
                        current.initialiser = parseExpression();
                        if (current.variableType != VariableType.inParameter) {
                            Compiler.error(ErrorCode.invalidDefaultParameter, String.Format("含有其它修饰符的参数不允许有默认值"), current.initialiser);
                        }
                    }

                    break;
            }

            if (last == null) {
                last = first = current;
            } else {
                last = last.next = current;
            }

        } while (readToken(TokenType.comma));

        expectToken(stopToken, errorCode);
        return first;
    }

    expectToken(startToken, errorCode);
    return null;

}

        private void parseRestParameterModifiers() {
    switch (this.lexer.peek().type) {
        case TokenType.ref:
        case TokenType.params:
        case TokenType.out:
            this.lexer.read();
            Compiler.error(ErrorCode.tooManyParameterModifiers, String.Format("参数修饰符太多；应删除“{0}”", this.lexer.peek().type.getName()), this.lexer.current);
            parseRestParameterModifiers();
            break;
    }
}

        private ToplevelBlock parseMethodBody() {

    // MethodBody :
    //   Block
    //   ;

    if (readToken(TokenType.lBrace)) {
        var result = new ToplevelBlock();
        result.start = this.lexer.current.start;
        parseBlockBody(result);
        return result;
    }

    expectSemicolon();
    return null;
}

        private ConstructorDefinition parseConstructor(DocComment docComment, MemberDefinition.MemberAnnotation annotations, Modifiers modifiers, Identifier name) {

    // ConstructorDefinition :
    //   Annotations? Modifiers? Identifier ( ParameterList? ) ConstructorInitializer? Block

    // ConstructorInitializer :
    //   : this ArgumentList
    //   : base ArgumentList

    var result = new ConstructorDefinition();
    result.docComment = docComment;
    result.annotations = annotations;
    result.modifiers = modifiers;
    result.name = name;
    result.parameters = parseParameterList(TokenType.lParam, TokenType.rParam, ErrorCode.expectedRParam);

    //if (readToken(TokenType.colon)) {
    //    if (this.lexer.peek().type != TokenType.this && this.lexer.peek().type != TokenType.base) {
    //        Compiler.error(ErrorCode.expectedThisOrBase, "语法错误：应输入“this”或“base”", this.lexer.peek());
    //    } else {
    //        result.initializerType = this.lexer.read().type;
    //        if (this.lexer.peek().type == TokenType.lParam) {
    //            result.initializerArguments = parseArgumentList(TokenType.rParam, ErrorCode.expectedRParam);
    //        } else {
    //            expectToken(TokenType.lParam, ErrorCode.expectedLParam);
    //        }
    //    }
    //}

    result.body = parseMethodBody();

    return result;
}

        private PropertyDefinition parsePropertyDefinition(DocComment docComment, MemberDefinition.MemberAnnotation annotations, Modifiers modifiers, Expression returnType, Expression explicitType, Identifier name) {

    // PropertyDefinition :
    //   Annotations? Modifiers? Type ExplicitType? Identifier { PropertyAccessorList }

    var result = new PropertyDefinition();
    result.docComment = docComment;
    result.annotations = annotations;
    result.modifiers = modifiers;
    result.returnType = returnType;
    result.explicitType = explicitType;
    result.name = name;
    parsePropertyBody(result);
    return result;
}

        private IndexerDefinition parseIndexerOperatorDefinition(DocComment docComment, MemberDefinition.MemberAnnotation annotations, Modifiers modifiers, Expression returnType, Expression explicitType) {

    // IndexerOperatorDefinition :
    //   Annotations? Modifiers? Type this [ ParameterList ] { PropertyAccessorList }

    var result = new IndexerDefinition();
    result.docComment = docComment;
    result.annotations = annotations;
    result.modifiers = modifiers;
    result.returnType = returnType;
    result.explicitType = explicitType;
    result.parameters = parseParameterList(TokenType.lBrack, TokenType.rBrack, ErrorCode.expectedRBrack);
    parsePropertyBody(result);
    return result;

    throw new Unreachable();

}

        private void parsePropertyBody(PropertyOrIndexerDefinition target) {

    // PropertyAccessorList :
    //   get MethodBody
    //   set MethodBody
    //   get MethodBody set MethodBody
    //   set MethodBody get MethodBody

    if (expectLBrace()) {

        do {

            var current = new PropertyDefinition.PropertyAccessor();
            current.annotations = parseMemberAnnotationList();
            current.modifiers = parseAccesibilityModifiers();

            if (!readToken(TokenType.identifier)) {
                Compiler.error(ErrorCode.expectedGetOrSet, "语法错误：应输入“get”或“set”", this.lexer.peek());
                skipToMemberDefinition();
                return;
            }


            current.name = parseIdentifier();
            if (current.name.value == "get") {
                if (target.getAccessor != null) {
                    Compiler.error(ErrorCode.dumpGetOrSet, "get 访问器重复", this.lexer.current);
                }
                target.getAccessor = current;
            } else if (current.name.value == "set") {
                if (target.setAccessor != null) {
                    Compiler.error(ErrorCode.dumpGetOrSet, "set 访问器重复", this.lexer.current);
                }
                target.setAccessor = current;
            } else {
                Compiler.error(ErrorCode.expectedGetOrSet, "语法错误：应输入“get”或“set”", this.lexer.current);
            }

            current.body = parseMethodBody();

        } while (!readToken(TokenType.rBrace));

    }

}

        private Modifiers parseAccesibilityModifiers() {
    Modifiers result = Modifiers.none;
    while (this.lexer.peek().type.isModifier()) {
        Modifiers current;
        switch (this.lexer.read().type) {
            case TokenType.private:
                current = Modifiers.@private;
                break;
            case TokenType.public:
                current = Modifiers.@public;
                break;
            case TokenType.protected:
                current = Modifiers.@protected;
                break;
            default:
                Compiler.error(ErrorCode.invalidModifiers, String.Format("修饰符“{0}”对该项无效", this.lexer.current.type.getName()), this.lexer.current);
                continue;
        }

        // 只能设置成一个值。
        if (result != Modifiers.none) {
            Compiler.error(ErrorCode.tooManyAccessibility, String.Format("访问修饰符太多；应删除“{0}”", this.lexer.current.type.getName()), this.lexer.current);
            continue;
        }

        result = current;
    }

    return result;
}

        private OperatorDefinition parseOperatorOverloadDefinition(DocComment docComment, MemberDefinition.MemberAnnotation annotations, Modifiers modifiers, Expression returnType, Expression explicitType) {

    // OperatorOverloadDefinition :
    //   Annotations? Modifiers? Type ExplicitType? OverloadableOperator ( ParameterList ) MethodBody

    var result = new OperatorDefinition();
    result.docComment = docComment;
    result.annotations = annotations;
    result.modifiers = modifiers;
    result.returnType = returnType;
    result.explicitType = explicitType;
    result.name = parseIdentifier(); // this
    result.@operator = this.lexer.current.type;
    result.parameters = parseParameterList(TokenType.lParam, TokenType.rParam, ErrorCode.expectedRParam);
    result.body = parseMethodBody();
    return result;

}

        private FieldDefinition parseFieldDefinition(DocComment docComment, MemberDefinition.MemberAnnotation annotations, Modifiers modifiers, Expression type, Expression explicitType, Identifier currentIdentifier) {

    // FieldDefinition :
    //   Annotations? Modifiers? Type VariableDefinitionList ;

    var result = new FieldDefinition();
    result.docComment = docComment;
    result.annotations = annotations;
    result.modifiers = modifiers;
    if (explicitType != null) {
        Compiler.error(ErrorCode.invalidExplicitType, "字段不允许显示声明接口", explicitType);
    }
    result.variables = parseVariableList(type, currentIdentifier);
    expectSemicolon();
    return result;

}

        private MemberDefinition parseFuncDefinition(DocComment docComment, MemberDefinition.MemberAnnotation annotations, Modifiers modifiers) {

    // FuncDefinition :
    //    Annotations? Modifiers? func Identifier ( ParameterList? ) MethodBody

    var result = new MethodDefinition();
    this.lexer.read(); // func
    result.name = expectIdentifier();
    expectToken(TokenType.lParam, ErrorCode.expectedLParam);

    Variable last = null;
    do {
        if (this.lexer.peek().type == TokenType.rParam) {
            break;
        }

        var current = new MethodDefinition.Parameter();
        current.name = expectIdentifier();

        if (readToken(TokenType.assign)) {
            current.initialiser = parseExpression();
        }

        if (last == null) {
            last = result.parameters = current;
        } else {
            last = last.next = current;
        }
    } while (readToken(TokenType.comma));

    expectToken(TokenType.rParam, ErrorCode.expectedRParam);
    result.body = parseMethodBody();
    return result;
}

        private NamespaceDefinition parseNamespaceDefinition(DocComment docComment, MemberDefinition.MemberAnnotation annotations, Modifiers modifiers) {

    // NamespaceDefinition :
    //   Annotations? Modifiers? namespace IdentifierList  { MemberDefinitionList? }

    if (annotations != null) {
        //Compiler.error(ErrorCode.unexpectedAnnotation, "命名空间不允许有注解", annotations);
    }

    if (modifiers != Modifiers.none) {
        Compiler.error(ErrorCode.unexpectedModifiers, "命名空间不允许有修饰符", this.lexer.current);
    }

    var result = new NamespaceDefinition();
    result.docComment = docComment;
    this.lexer.read(); // namespace

    result.name = expectIdentifier();
    if (readToken(TokenType.period)) {
        result.names = new List<Identifier>() { result.name };
        do {
            result.names.Add(expectIdentifier());
        } while (readToken(TokenType.period));
    }

    if (expectLBrace()) {
        parseMemberContainerDefinitionBody(result, true);
    }

    return result;

}

        private ClassDefinition parseClassDefinition(DocComment docComment, MemberDefinition.MemberAnnotation annotations, Modifiers modifiers) {

    // ClassDefinition :
    //   Annotations? Modifiers? class Identifier GenericParameterList? BaseTypeList? { MemberDefinitionList? }

    // BaseTypeList :
    //   : TypeList

    var result = new ClassDefinition();
    parseTypeDefinitionBody(result, docComment, annotations, modifiers);
    return result;

}

        private StructDefinition parseStructDefinition(DocComment docComment, MemberDefinition.MemberAnnotation annotations, Modifiers modifiers) {

    // StructDefinition :
    //   Annotations? Modifiers? struct Identifier GenericParameterList? BaseTypeList? { MemberDefinitionList? }

    var result = new StructDefinition();
    parseTypeDefinitionBody(result, docComment, annotations, modifiers);
    return result;

}

        private InterfaceDefinition parseInterfaceDefinition(DocComment docComment, MemberDefinition.MemberAnnotation annotations, Modifiers modifiers) {

    // InterfaceDefinition :
    //  Annotations? Modifiers? interface Identifier GenericParameterList? BaseTypeList? { MemberDefinitionList? }

    var result = new InterfaceDefinition();
    parseTypeDefinitionBody(result, docComment, annotations, modifiers);
    return result;

}

        private void parseTypeDefinitionBody(TypeDefinition target, DocComment docComment, MemberDefinition.MemberAnnotation annotations, Modifiers modifiers) {

    target.docComment = docComment;
    target.annotations = annotations;
    target.modifiers = modifiers;
    this.lexer.read(); // class | struct | interface
    target.name = expectIdentifier();

    if (readToken(TokenType.lt)) {
        target.genericParameters = parseGenericParameterList();
    }

    if (readToken(TokenType.colon)) {
        target.baseTypes = parseBaseTypeList();
    }

    if (expectLBrace()) {
        parseMemberContainerDefinitionBody(target, true);
    }

}

        private ExtensionDefinition parseExtensionDefinition(DocComment docComment, MemberDefinition.MemberAnnotation annotations, Modifiers modifiers) {

    // ExtensionDefinition :
    //   Annotations? Modifiers? extend Type BaseTypeList? { MemberDefinitionList? }

    var result = new ExtensionDefinition();
    result.docComment = docComment;
    result.annotations = annotations;
    result.modifiers = modifiers;
    result.name = parseIdentifier(); // extend
    result.targetType = parseType();

    if (readToken(TokenType.colon)) {
        result.baseTypes = parseBaseTypeList();
    }

    if (expectLBrace()) {
        parseMemberContainerDefinitionBody(result, true);
    }

    return result;
}

        private EnumDefinition parseEnumDefinition(DocComment docComment, MemberDefinition.MemberAnnotation annotations, Modifiers modifiers) {

    // EnumDefinition :
    //   Annotations? Modifiers? enum Identifier EnumBaseType? { EnumFieldDefinitionList? }

    // EnumBaseType :
    //   : Type

    // EnumFieldDefinitionList :
    //   EnumFieldDefinition 
    //   EnumFieldDefinitionList , EnumFieldDefinition

    // EnumFieldDefinition :
    //   Identifier
    //   Identifier = Expression

    var result = new EnumDefinition();
    result.docComment = docComment;
    result.annotations = annotations;
    result.modifiers = modifiers;
    this.lexer.read(); // enum
    result.name = expectIdentifier();

    if (readToken(TokenType.colon)) {
        result.baseTypes = parseBaseTypeList();
    }

    if (expectLBrace()) {

        MemberDefinition last = null;

        do {

            if (readToken(TokenType.rBrace)) {
                return result;
            }

            var current = new EnumMemberDefinition();
            current.docComment = parseDocComment();
            current.annotations = parseMemberAnnotationList();
            current.name = expectIdentifier();

            if (readToken(TokenType.assign)) {
                current.initializer = parseExpression();
            }

            if (result.members == null) {
                last = result.members = current;
            } else {
                last = last.next = current;
            }

        } while (readToken(TokenType.comma));

        expectToken(TokenType.rBrace, ErrorCode.expectedRBrace);

    }
    return result;
}

        private List < Expression > parseBaseTypeList() {

    // TypeList :
    //   Type
    //   TypeList , Type

    List < Expression > result = new List<Expression>();
    do {
        result.Add(parseType());
        if (result.Count > 250) {
            Compiler.error(ErrorCode.tooManyBaseTypes, "基类型太多；类类型不得超过 250 个", this.lexer.current);
        }
    } while (readToken(TokenType.comma));
    return result;
}

#endregion

#region 解析表达式

        /**
         * 解析一个魔法变量。
         */
         * <returns></returns>
        private MagicVariable parseMagicVariable() {

    // MagicVariable :
    //   @ Identifier

    console.assert(this.lexer.peek().type == TokenType.at);

    var result = new MagicVariable();
    result.start = this.lexer.read().start; // @
    result.value = expectIdentifier().value;
    result.endLocation = this.lexer.current.endLocation;
    return result;
}

        


        private Expression parseListOrDictLiteral(TokenType stopBrack, ErrorCode errorCode) {

    // ListLiteral :
    //   [ ElementList? ]
    //   [ ElementList? , ]

    // ElementList :
    //   Expression
    //   ElementList , Expression

    // DictLiteral :
    //   { PropertyList? }

    // PropertyList :
    //   Property
    //   PropertyNameAndValueList , Property

    // Property :
    //   PropertyName : Expression

    console.assert(this.lexer.peek().type == (stopBrack == TokenType.rBrace ? TokenType.lBrace : TokenType.lBrack));

    var start = this.lexer.read().start; // [
    var type = this.lexer.current.type;

    // [:], {:}
    if (readToken(TokenType.colon)) {
        expectToken(stopBrack, errorCode);
        return new DictLiteral() {
            start = start,
                type = type,
                endLocation = this.lexer.current.endLocation
        };
    }

    // [], {}
    if (readToken(stopBrack)) {
        return new ListLiteral() {
            start = start,
                type = type,
                endLocation = this.lexer.current.endLocation
        };
    }

    var firstKey = parseExpression();

    // [key: value], {key: value}
    if (readToken(TokenType.colon)) {
        var result = new DictLiteral();
        result.start = start;
        result.type = type;

        var last = result.properties = new DictLiteral.Property() {
            key = type == TokenType.lBrace ? toIdentifier(firstKey) : firstKey,
            value = parseExpression()
        };

        while (readToken(TokenType.comma)) {

            // ], }
            if (readToken(stopBrack)) {
                goto end;
            }

            var current = new DictLiteral.Property();

            if (type == TokenType.lBrace) {
                current.key = expectIdentifier();
            } else {
                current.key = parseExpression();
            }

            expectToken(TokenType.colon, ErrorCode.expectedColon);
            current.value = parseExpression();

            last = last.next = current;

        }

        expectToken(stopBrack, errorCode);
        end:
        result.endLocation = this.lexer.current.endLocation;
        return result;

    } else {

        var result = new ListLiteral();
        result.start = start;
        result.type = type;
        result.values = new List<Expression>() { firstKey };

        while (readToken(TokenType.comma)) {

            // ], }
            if (readToken(stopBrack)) {
                goto end;
            }

            result.values.Add(parseExpression());

        }

        expectToken(stopBrack, errorCode);
        end:
        result.endLocation = this.lexer.current.endLocation;
        return result;

    }

}

        private FuncCallExpression.Argument parseArgumentList(TokenType stopBrack, ErrorCode errorCode) {

    // CallExpression :
    //   MemberExpression ( ArgumentList? )

    // ArgumentList :
    //   Argument
    //   ArgumentList , Argument

    // ArgumentValue :
    //   ArgumentValue
    //   Identifier : ArgumentValue

    // ArgumentValue :
    //   ToExpression
    //   ref ToExpression
    //   out ToExpression

    console.assert(this.lexer.peek().type == (stopBrack == TokenType.rParam ? TokenType.lParam : TokenType.lBrack));

    this.lexer.read(); // [, (

    FuncCallExpression.Argument first = null, last = null;

    do {

        if (readToken(stopBrack)) {
            goto end;
        }

        var current = new FuncCallExpression.Argument();

        // 读取命名参数名。
        if (this.lexer.peek().type == TokenType.identifier) {
            var currentIdentifier = parseIdentifier();

            if (readToken(TokenType.colon)) {
                current.name = currentIdentifier;
                parseArgumentBody(current);
            } else {
                current.value = parseExpression(parseTypeExpression(currentIdentifier, TypeUsage.expression));
            }

        } else {
            parseArgumentBody(current);
        }

        if (last == null) {
            last = first = current;
        } else {
            last = last.next = current;
        }

    } while (readToken(TokenType.comma));

    expectToken(stopBrack, errorCode);

    end:
    return first;

}

        private void parseArgumentBody(FuncCallExpression.Argument target) {

    if (readToken(TokenType.out)) {
        target.type = readToken(TokenType.assignTo) ? FuncCallExpression.ArgumentType.outAssignTo : FuncCallExpression.ArgumentType.@out;
    } else if (readToken(TokenType.ref)) {
        target.type = FuncCallExpression.ArgumentType.@ref;
    }

    target.value = parseExpression();

}

        private LambdaLiteral parseLambdaLiteral(Identifier parsedParameter) {

    // LambdaLiteral :
    //    ( LambdaParameterList ) -> LambdaBody
    //    Identifier -> LambdaBody

    // LambdaParameterList :
    //    LambdaParameter ...

    // LambdaParameter :
    //    ref? Type Identifier
    //    out? Type Identifier
    //    Identifier

    // LambdaBody :
    //    MethodBody
    //    Expression

    console.assert(this.lexer.peek().type == TokenType.lParam || this.lexer.peek().type == TokenType.lambda);

    var result = new LambdaLiteral();

    //if (parsedParameter != null) {
    //    result.start = parsedParameter.start;
    //    result.parameters = new Parameter();
    //    result.parameters.name = parsedParameter;
    //} else if (this.lexer.peek().type == TokenType.lambda) {
    //    result.start = this.lexer.peek().start; // ->
    //} else {
    //    result.start = this.lexer.read().start; // (

    //    if (!readToken(TokenType.rParam)) {
    //        Parameter current = result.parameters = new Parameter();
    //        if (readToken(TokenType.ref)) {
    //            current.variableType = VariableType.refParameter;
    //            current.type = parseType();
    //            current.name = expectIdentifier();
    //        } else if (readToken(TokenType.out)) {
    //            current.variableType = VariableType.outParameter;
    //            current.type = parseType();
    //            current.name = expectIdentifier();
    //        } else {
    //            current.type = parseType();
    //            if (this.lexer.peek().type == TokenType.identifier) {
    //                current.name = parseIdentifier();
    //            } else {
    //                current.name = toIdentifier(current.type);
    //                current.type = null;
    //            }
    //        }

    //        bool hasType = current.type != null;
    //        Variable last = result.parameters;
    //        while (readToken(TokenType.comma)) {
    //            current = new Parameter();
    //            if (hasType) {
    //                if (readToken(TokenType.ref)) {
    //                    current.variableType = VariableType.refParameter;
    //                } else if (readToken(TokenType.out)) {
    //                    current.variableType = VariableType.outParameter;
    //                }
    //                current.type = parseType();
    //            }
    //            current.name = expectIdentifier();
    //            last = last.next = current;
    //        }

    //        if (!readToken(TokenType.rParam)) {
    //            expectToken(TokenType.rParam, ErrorCode.expectedRParam);

    //            // 跳过参数部分。
    //            do {
    //                this.lexer.read();
    //            } while (this.lexer.peek().type != TokenType.eof && this.lexer.peek().type != TokenType.rParam && this.lexer.peek().type != TokenType.lambda && this.lexer.peek().type != TokenType.lBrace && this.lexer.peek().type != TokenType.rBrace);
    //        }
    //    }

    //}

    //console.assert(this.lexer.peek().type == TokenType.lambda);
    //this.lexer.read(); //->
    //if (readToken(TokenType.lBrace)) {
    //    result.body = new ToplevelBlock();
    //    parseBlockBody(result.body);
    //} else {
    //    result.returnBody = parseExpression();
    //}

    return result;

}

/**
 * 用于指示类型的使用场景。
 */
private enum TypeUsage {
    type,
    expression,
    declartion,
            @new
        }

        private Expression parseType(TypeUsage typeUsage = TypeUsage.type) {

    // Type :
    //   PredefineType
    //   Identifier
    //   Type GenericArgumentList
    //   Type . Identifier GenericArgumentList?
    //   Type *
    //   Type [ ]

    // GenericArgumentList :
    //   < TypeList >

    var type = this.lexer.peek().type;

    if (type == TokenType.identifier) {
        return parseType(parseIdentifier(), typeUsage);
    }

    if (type.isPredefinedType()) {
        return parsePredefinedType(typeUsage);
    }

    Compiler.error(ErrorCode.expectedType, String.Format("语法错误：应输入类型；“{0}”不是类型", type.getName()), this.lexer.peek());
    return Expression.empty;

}

        /**
         * 当前是内置类型，继续解析其它类型。
         */
         * <returns></returns>
        private Expression parsePredefinedType(TypeUsage typeUsage = TypeUsage.type) {

    // PredefinedType :
    //   int
    //   float
    //   var
    //   dynamic
    //   ...
    //   PredefinedType []
    //   PredefinedType *

    console.assert(this.lexer.peek().type.isPredefinedType());

    Expression parsed = new PredefinedTypeLiteral() {
        start = this.lexer.read().start,
            type = this.lexer.current.type,
            };

    while (true) {
        switch (this.lexer.peek().type) {
            case TokenType.lBrack:

                // new 表达式中不解析数组类型。
                if (typeUsage == TypeUsage.@new) {
                    goto default;
        }
        this.lexer.read(); // [

        //// 读取数组维数。
        //int rank = 1;
        //while (readToken(TokenType.comma))
        //    rank++;

        expectToken(TokenType.rBrack, ErrorCode.expectedRBrack);
        parsed = new ArrayTypeExpression() {
            elementType = parsed,
                //rank = rank,
                endLocation = this.lexer.current.endLocation
        };
        continue;
                    case TokenType.mul:
        this.lexer.read();
        parsed = new PtrTypeExpression() {
            elementType = parsed,
                endLocation = this.lexer.current.endLocation
        };
        continue;
                    default:
        return parsed;
    }
}

        }

        /**
         * 解析以标识符开头的类型。
         */
         * <param name="parsedIdentifier" > </param>
    * <returns></returns>
        private Expression parseType(Identifier parsedIdentifier, TypeUsage typeUsage) {
    var parsed = parseTypeExpression(parsedIdentifier, typeUsage);

    while (readToken(TokenType.period)) {
        parsed = parseArrayTypeExpression(new MemberCallExpression() {
            target = parsed,
            argument = parseGenericTypeExpression(expectIdentifier(), typeUsage)
        }, typeUsage);
    }

    return parsed;
}

        /**
         * 尝试组合当前类型为复合类型表达式。
         */
         * <param name="parsedIdentifier" > </param>
    * <param name="typeUsage" > </param>
        * <returns></returns>
        private Expression parseTypeExpression(Identifier parsedIdentifier, TypeUsage typeUsage) {
    return parseArrayTypeExpression(parseGenericTypeExpression(parsedIdentifier, typeUsage), typeUsage);
}

        /**
         * 尝试组合当前类型为数组类型。
         */
         * <param name="parsed" > </param>
    * <param name="typeUsage" > </param>
        * <returns></returns>
        private Expression parseArrayTypeExpression(Expression parsed, TypeUsage typeUsage) {

    while (true) {
        switch (this.lexer.peek().type) {
            case TokenType.lBrack:

                // new 表达式中不解析数组类型。
                if (typeUsage == TypeUsage.@new) {
                    return parsed;
                }
                if (typeUsage != TypeUsage.type) {

                    // 判断 [ 是索引还是数组类型。
                    this.lexer.mark();
                    do {
                        this.lexer.markRead();
                    } while (this.lexer.markPeek().type == TokenType.comma);
                    if (this.lexer.markPeek().type != TokenType.rBrack) {
                        goto default;
        }
    }

    this.lexer.read(); // [

    int rank = 1;
    while (readToken(TokenType.comma))
        rank++;

    expectToken(TokenType.rBrack, ErrorCode.expectedRBrack);
    parsed = new ArrayTypeExpression() {
        elementType = parsed,
            //rank = rank,
            endLocation = this.lexer.current.endLocation
    };
    continue;
                    case TokenType.mul:
    if (typeUsage == TypeUsage.expression) {
        this.lexer.mark();
        this.lexer.markRead();

        // 如果紧跟表达式，则 * 解析为乘号。
        if (this.lexer.markRead().type.isExpressionStart()) {
            goto default;
        }
    }
    parsed = new PtrTypeExpression() {
        elementType = parsed,
            endLocation = this.lexer.read().endLocation
    };
    continue;
                    default:
    return parsed;
}
            }

        }

        /**
         * 尝试组合当前类型为泛型。
         */
         * <param name="parsed" > </param>
    * <param name="typeUsage" > </param>
        * <returns></returns>
        private Expression parseGenericTypeExpression(Identifier parsedIdentifier, TypeUsage typeUsage) {

    if (this.lexer.peek().type == TokenType.lt) {

        // 判断 < 是小于号还是泛型参数。
        if (typeUsage != TypeUsage.type) {
            this.lexer.mark();
            if (!markReadGenericTypeExpression()) {
                return parsedIdentifier;
            }
        }

        this.lexer.read(); // <

        var result = new GenericTypeExpression();
        result.elementType = parsedIdentifier;
        result.genericArguments = new List<Expression>();
        do {
            if (this.lexer.peek().type == TokenType.comma || this.lexer.peek().type == TokenType.gt) {
                result.genericArguments.Add(null);
                continue;
            }
            result.genericArguments.Add(parseType());
        } while (readToken(TokenType.comma));

        expectToken(TokenType.gt, ErrorCode.expectedGt);
        result.endLocation = this.lexer.current.endLocation;
        return result;
    }

    return parsedIdentifier;
}

        /**
         * 判断一个类型之后是否存在泛型参数。
         */
         * <returns></returns>
        private bool markReadGenericTypeExpression() {

    console.assert(this.lexer.markPeek().type == TokenType.lt);

    do {

        this.lexer.markRead(); // <, ,

        // 允许直接结束。
        if (this.lexer.markPeek().type == TokenType.gt) {
            break;
        }

        // 如果紧跟的不是类型，则不是类型。
        if (!markReadType()) {
            return false;
        }

    } while (this.lexer.markPeek().type == TokenType.comma);

    // 如果是 > 说明一切顺利。
    return this.lexer.markRead().type == TokenType.gt;
}

        /**
         * 判断一个类型之后是否是数组类型。
         */
         * <returns></returns>
        private bool markReadArrayTypeExpression() {

    console.assert(this.lexer.markPeek().type == TokenType.lBrack);

    this.lexer.markRead(); // [

    // 跳过逗号。
    while (this.lexer.markPeek().type == TokenType.comma) {
        this.lexer.markRead();
    }

    return this.lexer.markRead().type == TokenType.rBrack;

}

        private bool markReadType() {
    var type = this.lexer.markRead().type;

    if (type == TokenType.identifier) {
        if (this.lexer.markPeek().type == TokenType.lt && !markReadGenericTypeExpression()) {
            return false;
        }
    } else if (!type.isPredefinedType()) {
        return false;
    }

    // 读取类型数组和指针组合。
    while (true) {
        switch (this.lexer.markPeek().type) {
            case TokenType.lBrack:
                if (!markReadArrayTypeExpression()) {
                    return false;
                }
                continue;
            case TokenType.mul:
                this.lexer.markRead();
                continue;
            case TokenType.period:
                this.lexer.markRead();
                if (this.lexer.markRead().type != TokenType.identifier) {
                    return false;
                }
                continue;
            default:
                return true;
        }
    }

}

        private bool followsWithExpression() {
    return this.lexer.peek().type.isExpressionStart();
}

#endregion

/**
 * 解析一个源文件。
 */
parseSourceFile(node: nodes.SourceFile) {
    node.comments && node.comments.accept(this);
    node.jsDoc && node.jsDoc.accept(this);
    node.statements.accept(this);
}

/**
 * 解析一个 continue 语句(continue;)。
 */
parseContinueStatement(node: nodes.ContinueStatement) {
    node.label && node.label.accept(this);
}

/**
 * 解析一个 break 语句(break;)。
 */
parseBreakStatement(node: nodes.BreakStatement) {
    node.label && node.label.accept(this);
}

/**
 * 解析一个 return 语句(return ...;)。
 */
parseReturnStatement(node: nodes.ReturnStatement) {
    node.value && node.value.accept(this);
}

/**
 * 解析一个 throw 语句(throw ...;)。
 */
parseThrowStatement(node: nodes.ThrowStatement) {
    node.value.accept(this);
}

/**
 * 解析一个 try 语句(try {...} catch(e) {...})。
 */
parseTryStatement(node: nodes.TryStatement) {
    node.try.accept(this);
    node.catch.accept(this);
    node.finally.accept(this);
}

/**
 * 解析一个 try 语句的 catch 分句(catch(e) {...})。
 */
parseCatchClause(node: nodes.CatchClause) {
    node.variable.accept(this);
    node.body.accept(this);
}

/**
 * 解析一个 try 语句的 finally 分句(finally {...})。
 */
parseFinallyClause(node: nodes.FinallyClause) {
    node.body.accept(this);
}

/**
 * 解析一个 with 语句(with(...) {...})。
 */
parseWithStatement(node: nodes.WithStatement) {
    node.value.accept(this);
    node.body.accept(this);
}

/**
 * 解析一个标识符(xx)。
 */
parseIdentifier(node: nodes.Identifier) {

}

/**
 * 解析 null 字面量(null)。
 */
parseNullLiteral(node: nodes.NullLiteral) {

}

/**
 * 解析 true 字面量(true)。
 */
parseTrueLiteral(node: nodes.TrueLiteral) {

}

/**
 * 解析 false 字面量(false)。
 */
parseFalseLiteral(node: nodes.FalseLiteral) {

}

/**
 * 解析一个浮点数字面量(1)。
 */
parseNumericLiteral(node: nodes.NumericLiteral) {

}

/**
 * 解析一个字符串字面量('...')。
 */
parseStringLiteral(node: nodes.StringLiteral) {

}

/**
 * 解析一个数组字面量([...])。
 */
parseArrayLiteral(node: nodes.ArrayLiteral) {
    node.elements.accept(this);
}

/**
 * 解析一个对象字面量({x: ...})。
 */
parseObjectLiteral(node: nodes.ObjectLiteral) {
    node.elements.accept(this);
}

/**
 * 解析一个对象字面量项。
 */
parseObjectLiteralElement(node: nodes.ObjectLiteralElement) {
    node.name.accept(this);
    node.value.accept(this);
}

/**
 * 解析 this 字面量(this)。
 */
parseThisLiteral(node: nodes.ThisLiteral) {

}

/**
 * 解析 super 字面量(super)。
 */
parseSuperLiteral(node: nodes.SuperLiteral) {

}

/**
 * 解析一个条件表达式(... ? ... : ...)。
 */
parseConditionalExpression(node: nodes.ConditionalExpression) {
    node.condition.accept(this);
    node.then.accept(this);
    node.else.accept(this);
}

/**
 * 解析一个成员调用表达式(x.y)。
 */
parseMemberCallExpression(node: nodes.MemberCallExpression) {
    node.target.accept(this);
    node.argument.accept(this);
}

/**
 * 解析一个函数调用表达式(x(...))。
 */
parseCallExpression(node: nodes.CallExpression) {
    node.target.accept(this);
    node.arguments.accept(this);
}

/**
 * 解析一个 new 表达式(new x(...))。
 */
parseNewExpression(node: nodes.NewExpression) {
    node.target.accept(this);
    node.arguments.accept(this);
}

/**
 * 解析一个索引调用表达式(x[...])。
 */
parseIndexCallExpression(node: nodes.IndexCallExpression) {
    node.target.accept(this);
    node.arguments.accept(this);
}

/**
 * 解析一个二元运算表达式(x + y)。
 */
parseBinaryExpression(node: nodes.BinaryExpression) {
    node.leftOperand.accept(this);
    node.rightOperand.accept(this);
}

/**
 * 解析一个箭头函数(x => ...)。
 */
parseLambdaLiteral(node: nodes.LambdaLiteral) {
    node.typeParameters.accept(this);
    node.parameters.accept(this);
    node.body.accept(this);
}

/**
 * 解析一个 yield 表达式(yield xx)。
 */
parseYieldExpression(node: nodes.YieldExpression) {
    node.body.accept(this);
}

/**
 * 解析一个类型转换表达式(<T>xx)。
 */
parseCnodesExpression(node: nodes.CnodesExpression) {
    node.type.accept(this);
    node.body.accept(this);
}

/**
 * 解析内置类型字面量(number)。
 */
parsePredefinedTypeLiteral(node: nodes.PredefinedTypeLiteral) {

}

/**
 * 解析一个泛型表达式(Array<T>)。
 */
parseGenericTypeExpression(node: nodes.GenericTypeExpression) {
    node.element.accept(this);
    node.genericArguments.accept(this);
}

/**
 * 解析一个数组类型表达式(T[])。
 */
parseArrayTypeExpression(node: nodes.ArrayTypeExpression) {
    node.element.accept(this);
}

/**
 * 解析一个描述器(@xx(...))。
 */
parseDecorator(node: nodes.Decorator) {
    node.body.accept(this);
}

/**
 * 解析一个修饰符(public)。
 */
parseModifier(node: nodes.Modifier) {

}

/**
 * 解析一个类定义(@class ...)。
 */
parseClassDefinition(node: nodes.ClassDefinition) {
    node.extends.accept(this);
    node.implements.accept(this);
    node.genericParameters && node.genericParameters.accept(this);
    node.members.accept(this);
    node.decorators.accept(this);
    node.modifiers.accept(this);
    node.name && node.name.accept(this);
}

/**
 * 解析一个接口定义。
 */
parseInterfaceDefinition(node: nodes.InterfaceDefinition) {
    node.extends.accept(this);
    node.implements.accept(this);
    node.genericParameters && node.genericParameters.accept(this);
    node.members.accept(this);
    node.decorators.accept(this);
    node.modifiers.accept(this);
    node.name && node.name.accept(this);
}

/**
 * 解析一个枚举定义。
 */
parseEnumDefinition(node: nodes.EnumDefinition) {
    node.members.accept(this);
    node.extends.accept(this);
    node.implements.accept(this);
    node.genericParameters && node.genericParameters.accept(this);
    node.decorators.accept(this);
    node.modifiers.accept(this);
    node.name && node.name.accept(this);
}

/**
 * 解析一个扩展定义。
 */
parseExtensionDefinition(node: nodes.ExtensionDefinition) {
    node.targetType.accept(this);
    node.implements.accept(this);
    node.members.accept(this);
    node.decorators.accept(this);
    node.modifiers.accept(this);
    node.name && node.name.accept(this);
}

/**
 * 解析一个命名空间定义。
 */
parseNamespaceDefinition(node: nodes.NamespaceDefinition) {
    node.names.accept(this);
    node.members.accept(this);
    node.decorators.accept(this);
    node.modifiers.accept(this);
    node.name && node.name.accept(this);
}

/**
 * 解析一个模块。
 */
parseModuleDefinition(node: nodes.ModuleDefinition) {
    node.members.accept(this);
    node.decorators.accept(this);
    node.modifiers.accept(this);
    node.name && node.name.accept(this);
}

/**
 * 解析一个类型子成员定义。
 */
parseTypeMemberDefinition(node: nodes.TypeMemberDefinition) {
    node.decorators.accept(this);
    node.modifiers.accept(this);
    node.name && node.name.accept(this);
}

/**
 * 解析一个字段定义。
 */
parseFieldDefinition(node: nodes.FieldDefinition) {
    node.variables.accept(this);
    node.decorators.accept(this);
    node.modifiers.accept(this);
    node.name && node.name.accept(this);
}

/**
 * 解析一个方法或属性定义。
 */
parseMethodOrPropertyDefinition(node: nodes.MethodOrPropertyDefinition) {
    node.returnType.accept(this);
    node.explicitType.accept(this);
    node.decorators.accept(this);
    node.modifiers.accept(this);
    node.name && node.name.accept(this);
}

/**
 * 解析一个属性或索引器定义。
 */
parsePropertyOrIndexerDefinition(node: nodes.PropertyOrIndexerDefinition) {
    node.body.accept(this);
    node.returnType.accept(this);
    node.explicitType.accept(this);
    node.decorators.accept(this);
    node.modifiers.accept(this);
    node.name && node.name.accept(this);
}

/**
 * 解析一个属性定义。
 */
parsePropertyDefinition(node: nodes.PropertyDefinition) {
    node.decorators.accept(this);
    node.modifiers.accept(this);
    node.name && node.name.accept(this);
}

/**
 * 解析一个索引器定义。
 */
parseIndexerDefinition(node: nodes.IndexerDefinition) {
    node.parameters.accept(this);
    node.body.accept(this);
    node.returnType.accept(this);
    node.explicitType.accept(this);
    node.decorators.accept(this);
    node.modifiers.accept(this);
    node.name && node.name.accept(this);
}

/**
 * 解析一个方法或构造函数定义。
 */
parseMethodOrConstructorDefinition(node: nodes.MethodOrConstructorDefinition) {
    node.parameters.accept(this);
    node.body.accept(this);
    node.returnType.accept(this);
    node.explicitType.accept(this);
    node.decorators.accept(this);
    node.modifiers.accept(this);
    node.name && node.name.accept(this);
}

/**
 * 解析一个方法定义。
 */
parseMethodDefinition(node: nodes.MethodDefinition) {
    node.genericParameters.accept(this);
    node.parameters.accept(this);
    node.body.accept(this);
    node.returnType.accept(this);
    node.explicitType.accept(this);
    node.decorators.accept(this);
    node.modifiers.accept(this);
    node.name && node.name.accept(this);
}

/**
 * 解析一个构造函数定义。
 */
parseConstructorDefinition(node: nodes.ConstructorDefinition) {
    node.parameters.accept(this);
    node.body.accept(this);
    node.returnType.accept(this);
    node.explicitType.accept(this);
    node.decorators.accept(this);
    node.modifiers.accept(this);
    node.name && node.name.accept(this);
}

/**
 * 解析一个枚举的成员定义。
 */
parseEnumMemberDefinition(node: nodes.EnumMemberDefinition) {
    node.initializer.accept(this);
    node.decorators.accept(this);
    node.modifiers.accept(this);
    node.name && node.name.accept(this);
}

/**
 * 解析一个 import 指令(import xx from '...';)。
 */
parseImportDirective(node: nodes.ImportDirective) {
    node.from.accept(this);
    node.alias.accept(this);
    node.value.accept(this);
}

/**
 * 解析一个数组绑定模式([xx, ...])
 */
parseArrayBindingPattern(node: nodes.ArrayBindingPattern) {
    node.elements.accept(this);
}

/**
 * 解析一个数组绑定模式项(xx, ..)
 */
parseArrayBindingElement(node: nodes.ArrayBindingElement) {
    node.initializer.accept(this);
    node.name.accept(this);
}

/**
 * 解析一个对象绑定模式({xx, ...})
 */
parseObjectBindingPattern(node: nodes.ObjectBindingPattern) {
    node.elements.accept(this);
}

/**
 * 解析一个对象绑定模式项(xx: y)
 */
parseObjectBindingElement(node: nodes.ObjectBindingElement) {
    node.propertyName.accept(this);
    node.name.accept(this);
}

/**
 * 解析一个参数声明。
 */
parseParameterDeclaration(node: nodes.ParameterDeclaration) {
    node.decorators.accept(this);
    node.modifiers.accept(this);
    node.name.accept(this);
}

/**
 * 解析一个泛型参数。
 */
parseGenericParameterDeclaration(node: nodes.GenericParameterDeclaration) {
    node.name.accept(this);
    node.constraint && node.constraint.accept(this);
}

/**
 * 解析一个 JS 注释。
 */
parseComment(node: nodes.Comment) {

}

/**
 * 解析一个 JS 文档注释。
 */
parseJsDocComment(node: nodes.JsDocComment) {

}


}

    //const enum ParsingContext {
    //    SourceElements,            // Elements in source file
    //    BlockStatements,           // Statements in block
    //    SwitchClauses,             // Clauses in switch statement
    //    SwitchClauseStatements,    // Statements in switch clause
    //    TypeMembers,               // Members in interface or type literal
    //    ClassMembers,              // Members in class declaration
    //    EnumMembers,               // Members in enum declaration
    //    HeritageClauseElement,     // Elements in a heritage clause
    //    VariableDeclarations,      // Variable declarations in variable statement
    //    ObjectBindingElements,     // Binding elements in object binding list
    //    ArrayBindingElements,      // Binding elements in array binding list
    //    ArgumentExpressions,       // Expressions in argument list
    //    ObjectLiteralMembers,      // Members in object literal
    //    JsxAttributes,             // Attributes in jsx element
    //    JsxChildren,               // Things between opening and closing JSX tags
    //    ArrayLiteralMembers,       // Members in array literal
    //    Parameters,                // Parameters in parameter list
    //    TypeParameters,            // Type parameters in type parameter list
    //    TypeArguments,             // Type arguments in type argument list
    //    TupleElementTypes,         // Element types in tuple element type list
    //    HeritageClauses,           // Heritage clauses for a class or interface declaration.
    //    ImportOrExportSpecifiers,  // Named import clause's import specifier list
    //    JSDocFunctionParameters,
    //    JSDocTypeArguments,
    //    JSDocRecordMembers,
    //    JSDocTupleTypes,
    //    Count                      // Number of parsing contexts
    //}

    //const enum Tristate {
    //    False,
    //    True,
    //    Unknown
    //}

    //export namespace JSDocParser {
    //    export private isJSDocType() {
    //        switch (token) {
    //            case TokenType.AsteriskToken:
    //            case TokenType.QuestionToken:
    //            case TokenType.OpenParenToken:
    //            case TokenType.OpenBracketToken:
    //            case TokenType.ExclamationToken:
    //            case TokenType.OpenBraceToken:
    //            case TokenType.Function:
    //            case TokenType.DotDotDotToken:
    //            case TokenType.New:
    //            case TokenType.This:
    //                return true;
    //        }

    //        return tokenIsIdentifierOrKeyword(token);
    //    }

    //    export private parseJSDocTypeExpressionForTests(content: string, start: number, length: number) {
    //        initializeState("file.js", content, ScriptTarget.Latest, /*_syntaxCursor:*/ undefined, ScriptKind.JS);
    //        scanner.setText(content, start, length);
    //        token = scanner.scan();
    //        const jsDocTypeExpression = parseJSDocTypeExpression();
    //        const diagnostics = parseDiagnostics;
    //        clearState();

    //        return jsDocTypeExpression ? { jsDocTypeExpression, diagnostics } : undefined;
    //    }

    //    // Parses out a JSDoc type expression.
    //    /* @internal */
    //    export private parseJSDocTypeExpression(): JSDocTypeExpression {
    //        const result = <JSDocTypeExpression>createNode(TokenType.JSDocTypeExpression, scanner.getTokenPos());

    //        this.expectToken(TokenType.OpenBraceToken);
    //        result.type = parseJSDocTopLevelType();
    //        this.expectToken(TokenType.CloseBraceToken);

    //        fixupParentReferences(result);
    //        return finishNode(result);
    //    }

    //    private parseJSDocTopLevelType(): JSDocType {
    //        let type = parseJSDocType();
    //        if (token === TokenType.BarToken) {
    //            const unionType = <JSDocUnionType>createNode(TokenType.JSDocUnionType, type.pos);
    //            unionType.types = parseJSDocTypeList(type);
    //            type = finishNode(unionType);
    //        }

    //        if (token === TokenType.EqualsToken) {
    //            const optionalType = <JSDocOptionalType>createNode(TokenType.JSDocOptionalType, type.pos);
    //            nextToken();
    //            optionalType.type = type;
    //            type = finishNode(optionalType);
    //        }

    //        return type;
    //    }

    //    private parseJSDocType(): JSDocType {
    //        let type = parseBasicTypeExpression();

    //        while (true) {
    //            if (token === TokenType.OpenBracketToken) {
    //                const arrayType = <JSDocArrayType>createNode(TokenType.JSDocArrayType, type.pos);
    //                arrayType.elementType = type;

    //                nextToken();
    //                this.expectToken(TokenType.CloseBracketToken);

    //                type = finishNode(arrayType);
    //            }
    //            else if (token === TokenType.QuestionToken) {
    //                const nullableType = <JSDocNullableType>createNode(TokenType.JSDocNullableType, type.pos);
    //                nullableType.type = type;

    //                nextToken();
    //                type = finishNode(nullableType);
    //            }
    //            else if (token === TokenType.ExclamationToken) {
    //                const nonNullableType = <JSDocNonNullableType>createNode(TokenType.JSDocNonNullableType, type.pos);
    //                nonNullableType.type = type;

    //                nextToken();
    //                type = finishNode(nonNullableType);
    //            }
    //            else {
    //                break;
    //            }
    //        }

    //        return type;
    //    }

    //    private parseBasicTypeExpression(): JSDocType {
    //        switch (token) {
    //            case TokenType.AsteriskToken:
    //                return parseJSDocAllType();
    //            case TokenType.QuestionToken:
    //                return parseJSDocUnknownOrNullableType();
    //            case TokenType.OpenParenToken:
    //                return parseJSDocUnionType();
    //            case TokenType.OpenBracketToken:
    //                return parseJSDocTupleType();
    //            case TokenType.ExclamationToken:
    //                return parseJSDocNonNullableType();
    //            case TokenType.OpenBraceToken:
    //                return parseJSDocRecordType();
    //            case TokenType.Function:
    //                return parseJSDocFunctionType();
    //            case TokenType.DotDotDotToken:
    //                return parseJSDocVariadicType();
    //            case TokenType.New:
    //                return parseJSDocConstructorType();
    //            case TokenType.This:
    //                return parseJSDocThisType();
    //            case TokenType.Any:
    //            case TokenType.String:
    //            case TokenType.Number:
    //            case TokenType.Boolean:
    //            case TokenType.Symbol:
    //            case TokenType.Void:
    //                return parseTokenNode<JSDocType>();
    //        }

    //        // TODO (drosen): Parse string literal types in JSDoc as well.
    //        return parseJSDocTypeReference();
    //    }

    //    private parseJSDocThisType(): JSDocThisType {
    //        const result = <JSDocThisType>createNode(TokenType.JSDocThisType);
    //        nextToken();
    //        this.expectToken(TokenType.ColonToken);
    //        result.type = parseJSDocType();
    //        return finishNode(result);
    //    }

    //    private parseJSDocConstructorType(): JSDocConstructorType {
    //        const result = <JSDocConstructorType>createNode(TokenType.JSDocConstructorType);
    //        nextToken();
    //        this.expectToken(TokenType.ColonToken);
    //        result.type = parseJSDocType();
    //        return finishNode(result);
    //    }

    //    private parseJSDocVariadicType(): JSDocVariadicType {
    //        const result = <JSDocVariadicType>createNode(TokenType.JSDocVariadicType);
    //        nextToken();
    //        result.type = parseJSDocType();
    //        return finishNode(result);
    //    }

    //    private parseJSDocFunctionType(): JSDocFunctionType {
    //        const result = <JSDocFunctionType>createNode(TokenType.JSDocFunctionType);
    //        nextToken();

    //        this.expectToken(TokenType.OpenParenToken);
    //        result.parameters = parseDelimitedList(ParsingContext.JSDocFunctionParameters, parseJSDocParameter);
    //        checkForTrailingComma(result.parameters);
    //        this.expectToken(TokenType.CloseParenToken);

    //        if (token === TokenType.ColonToken) {
    //            nextToken();
    //            result.type = parseJSDocType();
    //        }

    //        return finishNode(result);
    //    }

    //    private parseJSDocParameter(): ParameterDeclaration {
    //        const parameter = <ParameterDeclaration>createNode(TokenType.Parameter);
    //        parameter.type = parseJSDocType();
    //        if (readToken(TokenType.EqualsToken)) {
    //            parameter.questionToken = createNode(TokenType.EqualsToken);
    //        }
    //        return finishNode(parameter);
    //    }

    //    private parseJSDocTypeReference(): JSDocTypeReference {
    //        const result = <JSDocTypeReference>createNode(TokenType.JSDocTypeReference);
    //        result.name = parseSimplePropertyName();

    //        if (token === TokenType.LessThanToken) {
    //            result.typeArguments = parseTypeArguments();
    //        }
    //        else {
    //            while (readToken(TokenType.DotToken)) {
    //                if (token === TokenType.LessThanToken) {
    //                    result.typeArguments = parseTypeArguments();
    //                    break;
    //                }
    //                else {
    //                    result.name = parseQualifiedName(result.name);
    //                }
    //            }
    //        }


    //        return finishNode(result);
    //    }

    //    private parseTypeArguments() {
    //        // Move pnodes the <
    //        nextToken();
    //        const typeArguments = parseDelimitedList(ParsingContext.JSDocTypeArguments, parseJSDocType);
    //        checkForTrailingComma(typeArguments);
    //        checkForEmptyTypeArgumentList(typeArguments);
    //        this.expectToken(TokenType.GreaterThanToken);

    //        return typeArguments;
    //    }

    //    private checkForEmptyTypeArgumentList(typeArguments: NodeArray<Node>) {
    //        if(parseDiagnostics.length === 0 && typeArguments && typeArguments.length === 0) {
    //            const start = typeArguments.pos - "<".length;
    //            const end = skipTrivia(sourceText, typeArguments.end) + ">".length;
    //            return parseErrorAtPosition(start, end - start, Diagnostics.Type_argument_list_cannot_be_empty);
    //        }
    //    }

    //    private parseQualifiedName(left: EntityName): QualifiedName {
    //            const result = <QualifiedName>createNode(TokenType.QualifiedName, left.pos);
    //            result.left = left;
    //            result.right = parseIdentifierName();

    //            return finishNode(result);
    //        }

    //    private parseJSDocRecordType(): JSDocRecordType {
    //            const result = <JSDocRecordType>createNode(TokenType.JSDocRecordType);
    //            nextToken();
    //        result.members = parseDelimitedList(ParsingContext.JSDocRecordMembers, parseJSDocRecordMember);
    //            checkForTrailingComma(result.members);
    //        this.expectToken(TokenType.CloseBraceToken);
    //        return finishNode(result);
    //        }

    //    private parseJSDocRecordMember(): JSDocRecordMember {
    //            const result = <JSDocRecordMember>createNode(TokenType.JSDocRecordMember);
    //            result.name = parseSimplePropertyName();

    //            if(token === TokenType.ColonToken) {
    //                nextToken();
    //                result.type = parseJSDocType();
    //            }

    //        return finishNode(result);
    //        }

    //    private parseJSDocNonNullableType(): JSDocNonNullableType {
    //            const result = <JSDocNonNullableType>createNode(TokenType.JSDocNonNullableType);
    //            nextToken();
    //        result.type = parseJSDocType();
    //            return finishNode(result);
    //        }

    //    private parseJSDocTupleType(): JSDocTupleType {
    //            const result = <JSDocTupleType>createNode(TokenType.JSDocTupleType);
    //            nextToken();
    //        result.types = parseDelimitedList(ParsingContext.JSDocTupleTypes, parseJSDocType);
    //            checkForTrailingComma(result.types);
    //        this.expectToken(TokenType.CloseBracketToken);

    //        return finishNode(result);
    //        }

    //    private checkForTrailingComma(list: NodeArray<Node>) {
    //            if(parseDiagnostics.length === 0 && list.hasTrailingComma) {
    //                const start = list.end - ",".length;
    //                parseErrorAtPosition(start, ",".length, Diagnostics.Trailing_comma_not_allowed);
    //            }
    //        }

    //    private parseJSDocUnionType(): JSDocUnionType {
    //                const result = <JSDocUnionType>createNode(TokenType.JSDocUnionType);
    //                nextToken();
    //        result.types = parseJSDocTypeList(parseJSDocType());

    //                this.expectToken(TokenType.CloseParenToken);

    //        return finishNode(result);
    //            }

    //    private parseJSDocTypeList(firstType: JSDocType) {
    //                Debug.assert(!!firstType);

    //                const types = <NodeArray<JSDocType>>[];
    //                types.pos = firstType.pos;

    //                types.push(firstType);
    //                while(readToken(TokenType.BarToken)) {
    //                    types.push(parseJSDocType());
    //                }

    //        types.end = scanner.getStartPos();
    //                return types;
    //            }

    //    private parseJSDocAllType(): JSDocAllType {
    //                const result = <JSDocAllType>createNode(TokenType.JSDocAllType);
    //                nextToken();
    //        return finishNode(result);
    //            }

    //    private parseJSDocUnknownOrNullableType(): JSDocUnknownType | JSDocNullableType {
    //                const pos = scanner.getStartPos();
    //                // skip the ?
    //                nextToken();

    //        // Need to lookahead to decide if this is a nullable or unknown type.

    //        // Here are cases where we'll pick the unknown type:
    //        //
    //        //      Foo(?,
    //        //      { a: ? }
    //        //      Foo(?)
    //        //      Foo<?>
    //        //      Foo(?=
    //        //      (?|
    //        if (token === TokenType.CommaToken ||
    //                    token === TokenType.CloseBraceToken ||
    //                    token === TokenType.CloseParenToken ||
    //                    token === TokenType.GreaterThanToken ||
    //                    token === TokenType.EqualsToken ||
    //                    token === TokenType.BarToken) {

    //                    const result = <JSDocUnknownType>createNode(TokenType.JSDocUnknownType, pos);
    //                    return finishNode(result);
    //                }
    //        else {
    //                    const result = <JSDocNullableType>createNode(TokenType.JSDocNullableType, pos);
    //                    result.type = parseJSDocType();
    //                    return finishNode(result);
    //                }
    //            }

    //    export private parseIsolatedJSDocComment(content: string, start: number, length: number) {
    //                initializeState("file.js", content, ScriptTarget.Latest, /*_syntaxCursor:*/ undefined, ScriptKind.JS);
    //    sourceFile = <SourceFile>{ languageVariant: LanguageVariant.Standard, text: content };
    //    const jsDocComment = parseJSDocCommentWorker(start, length);
    //    const diagnostics = parseDiagnostics;
    //    clearState();

    //    return jsDocComment ? { jsDocComment, diagnostics } : undefined;
    //}

    private parseJSDocComment(parent: Node, start: number, length: number): JSDocComment {
    const saveToken = token;
    const saveParseDiagnosticsLength = parseDiagnostics.length;
    const saveParseErrorBeforeNextFinishedNode = parseErrorBeforeNextFinishedNode;

    const comment = parseJSDocCommentWorker(start, length);
    if (comment) {
        comment.parent = parent;
    }

    token = saveToken;
    parseDiagnostics.length = saveParseDiagnosticsLength;
    parseErrorBeforeNextFinishedNode = saveParseErrorBeforeNextFinishedNode;

    return comment;
}

    private parseJSDocCommentWorker(start: number, length: number): JSDocComment {
    const content = sourceText;
    start = start || 0;
    const end = length === undefined ? content.length : start + length;
    length = end - start;

    Debug.assert(start >= 0);
    Debug.assert(start <= end);
    Debug.assert(end <= content.length);

    let tags: NodeArray<JSDocTag>;
    let result: JSDocComment;

    // Check for /** (JSDoc opening part)
    if (content.charCodeAt(start) === CharacterCodes.slash &&
        content.charCodeAt(start + 1) === CharacterCodes.nodeserisk &&
        content.charCodeAt(start + 2) === CharacterCodes.nodeserisk &&
        content.charCodeAt(start + 3) !== CharacterCodes.nodeserisk) {


        // + 3 for leading /**, - 5 in total for /** */
        scanner.scanRange(start + 3, length - 5, () => {
            // Initially we can parse out a tag.  We also have seen a starting nodeserisk.
            // This is so that /** * @type */ doesn't parse.
            let canParseTag = true;
            let seenAsterisk = true;

            nextJSDocToken();
            while (token !== TokenType.EndOfFileToken) {
                switch (token) {
                    case TokenType.AtToken:
                        if (canParseTag) {
                            parseTag();
                        }
                        // This will take us to the end of the line, so it's OK to parse a tag on the next pass through the loop
                        seenAsterisk = false;
                        break;

                    case TokenType.NewLineTrivia:
                        // After a line break, we can parse a tag, and we haven't seen an nodeserisk on the next line yet
                        canParseTag = true;
                        seenAsterisk = false;
                        break;

                    case TokenType.AsteriskToken:
                        if (seenAsterisk) {
                            // If we've already seen an nodeserisk, then we can no longer parse a tag on this line
                            canParseTag = false;
                        }
                        // Ignore the first nodeserisk on a line
                        seenAsterisk = true;
                        break;

                    case TokenType.Identifier:
                        // Anything else is doc comment text.  We can't do anything with it.  Because it
                        // wasn't a tag, we can no longer parse a tag on this line until we hit the next
                        // line break.
                        canParseTag = false;
                        break;

                    case TokenType.EndOfFileToken:
                        break;
                }

                nextJSDocToken();
            }

            result = createJSDocComment();

        });
    }

    return result;

    function createJSDocComment(): JSDocComment {
        if (!tags) {
            return undefined;
        }

        const result = <JSDocComment>createNode(TokenType.JSDocComment, start);
        result.tags = tags;
        return finishNode(result, end);
    }

    function skipWhitespace(): void {
        while (token === TokenType.WhitespaceTrivia || token === TokenType.NewLineTrivia) {
            nextJSDocToken();
        }
    }

    function parseTag(): void {
        Debug.assert(token === TokenType.AtToken);
        const atToken = createNode(TokenType.AtToken, scanner.getTokenPos());
        atToken.end = scanner.getTextPos();
        nextJSDocToken();

        const tagName = parseJSDocIdentifierName();
        if (!tagName) {
            return;
        }

        const tag = handleTag(atToken, tagName) || handleUnknownTag(atToken, tagName);
        addTag(tag);
    }

    function handleTag(atToken: Node, tagName: Identifier): JSDocTag {
        if (tagName) {
            switch (tagName.text) {
                case "param":
                    return handleParamTag(atToken, tagName);
                case "return":
                case "returns":
                    return handleReturnTag(atToken, tagName);
                case "template":
                    return handleTemplateTag(atToken, tagName);
                case "type":
                    return handleTypeTag(atToken, tagName);
                case "typedef":
                    return handleTypedefTag(atToken, tagName);
            }
        }

        return undefined;
    }

    function handleUnknownTag(atToken: Node, tagName: Identifier) {
        const result = <JSDocTag>createNode(TokenType.JSDocTag, atToken.pos);
        result.atToken = atToken;
        result.tagName = tagName;
        return finishNode(result);
    }

    function addTag(tag: JSDocTag): void {
        if (tag) {
            if (!tags) {
                tags = <NodeArray<JSDocTag>>[];
                tags.pos = tag.pos;
            }

            tags.push(tag);
            tags.end = tag.end;
        }
    }

    function tryParseTypeExpression(): JSDocTypeExpression {
        if (token !== TokenType.OpenBraceToken) {
            return undefined;
        }

        const typeExpression = parseJSDocTypeExpression();
        return typeExpression;
    }

    function handleParamTag(atToken: Node, tagName: Identifier) {
        let typeExpression = tryParseTypeExpression();

        skipWhitespace();
        let name: Identifier;
        let isBracketed: boolean;
        // Looking for something like '[foo]' or 'foo'
        if (readTokenToken(TokenType.OpenBracketToken)) {
            name = parseJSDocIdentifierName();
            isBracketed = true;

            // May have an optional default, e.g. '[foo = 42]'
            if (readTokenToken(TokenType.EqualsToken)) {
                parseExpression();
            }

            this.expectToken(TokenType.CloseBracketToken);
        }
        else if (tokenIsIdentifierOrKeyword(token)) {
            name = parseJSDocIdentifierName();
        }

        if (!name) {
            parseErrorAtPosition(scanner.getStartPos(), 0, Diagnostics.Identifier_expected);
            return undefined;
        }

        let preName: Identifier, postName: Identifier;
        if (typeExpression) {
            postName = name;
        }
        else {
            preName = name;
        }

        if (!typeExpression) {
            typeExpression = tryParseTypeExpression();
        }

        const result = <JSDocParameterTag>createNode(TokenType.JSDocParameterTag, atToken.pos);
        result.atToken = atToken;
        result.tagName = tagName;
        result.preParameterName = preName;
        result.typeExpression = typeExpression;
        result.postParameterName = postName;
        result.isBracketed = isBracketed;
        return finishNode(result);
    }

    function handleReturnTag(atToken: Node, tagName: Identifier): JSDocReturnTag {
        if (forEach(tags, t => t.kind === TokenType.JSDocReturnTag)) {
            parseErrorAtPosition(tagName.pos, scanner.getTokenPos() - tagName.pos, Diagnostics._0_tag_already_specified, tagName.text);
        }

        const result = <JSDocReturnTag>createNode(TokenType.JSDocReturnTag, atToken.pos);
        result.atToken = atToken;
        result.tagName = tagName;
        result.typeExpression = tryParseTypeExpression();
        return finishNode(result);
    }

    function handleTypeTag(atToken: Node, tagName: Identifier): JSDocTypeTag {
        if (forEach(tags, t => t.kind === TokenType.JSDocTypeTag)) {
            parseErrorAtPosition(tagName.pos, scanner.getTokenPos() - tagName.pos, Diagnostics._0_tag_already_specified, tagName.text);
        }

        const result = <JSDocTypeTag>createNode(TokenType.JSDocTypeTag, atToken.pos);
        result.atToken = atToken;
        result.tagName = tagName;
        result.typeExpression = tryParseTypeExpression();
        return finishNode(result);
    }

    function handlePropertyTag(atToken: Node, tagName: Identifier): JSDocPropertyTag {
        const typeExpression = tryParseTypeExpression();
        skipWhitespace();
        const name = parseJSDocIdentifierName();
        if (!name) {
            parseErrorAtPosition(scanner.getStartPos(), /*length*/ 0, Diagnostics.Identifier_expected);
            return undefined;
        }

        const result = <JSDocPropertyTag>createNode(TokenType.JSDocPropertyTag, atToken.pos);
        result.atToken = atToken;
        result.tagName = tagName;
        result.name = name;
        result.typeExpression = typeExpression;
        return finishNode(result);
    }

    function handleTypedefTag(atToken: Node, tagName: Identifier): JSDocTypedefTag {
        const typeExpression = tryParseTypeExpression();
        skipWhitespace();

        const typedefTag = <JSDocTypedefTag>createNode(TokenType.JSDocTypedefTag, atToken.pos);
        typedefTag.atToken = atToken;
        typedefTag.tagName = tagName;
        typedefTag.name = parseJSDocIdentifierName();
        typedefTag.typeExpression = typeExpression;

        if (typeExpression) {
            if (typeExpression.type.kind === TokenType.JSDocTypeReference) {
                const jsDocTypeReference = <JSDocTypeReference>typeExpression.type;
                if (jsDocTypeReference.name.kind === TokenType.Identifier) {
                    const name = <Identifier>jsDocTypeReference.name;
                    if (name.text === "Object") {
                        typedefTag.jsDocTypeLiteral = scanChildTags();
                    }
                }
            }
            if (!typedefTag.jsDocTypeLiteral) {
                typedefTag.jsDocTypeLiteral = typeExpression.type;
            }
        }
        else {
            typedefTag.jsDocTypeLiteral = scanChildTags();
        }

        return finishNode(typedefTag);

        function scanChildTags(): JSDocTypeLiteral {
            const jsDocTypeLiteral = <JSDocTypeLiteral>createNode(TokenType.JSDocTypeLiteral, scanner.getStartPos());
            let resumePos = scanner.getStartPos();
            let canParseTag = true;
            let seenAsterisk = false;
            let parentTagTerminated = false;

            while (token !== TokenType.EndOfFileToken && !parentTagTerminated) {
                nextJSDocToken();
                switch (token) {
                    case TokenType.AtToken:
                        if (canParseTag) {
                            parentTagTerminated = !tryParseChildTag(jsDocTypeLiteral);
                        }
                        seenAsterisk = false;
                        break;
                    case TokenType.NewLineTrivia:
                        resumePos = scanner.getStartPos() - 1;
                        canParseTag = true;
                        seenAsterisk = false;
                        break;
                    case TokenType.AsteriskToken:
                        if (seenAsterisk) {
                            canParseTag = false;
                        }
                        seenAsterisk = true;
                        break;
                    case TokenType.Identifier:
                        canParseTag = false;
                    case TokenType.EndOfFileToken:
                        break;
                }
            }
            scanner.setTextPos(resumePos);
            return finishNode(jsDocTypeLiteral);
        }
    }

    function tryParseChildTag(parentTag: JSDocTypeLiteral): boolean {
        Debug.assert(token === TokenType.AtToken);
        const atToken = createNode(TokenType.AtToken, scanner.getStartPos());
        atToken.end = scanner.getTextPos();
        nextJSDocToken();

        const tagName = parseJSDocIdentifierName();
        if (!tagName) {
            return false;
        }

        switch (tagName.text) {
            case "type":
                if (parentTag.jsDocTypeTag) {
                    // already has a @type tag, terminate the parent tag now.
                    return false;
                }
                parentTag.jsDocTypeTag = handleTypeTag(atToken, tagName);
                return true;
            case "prop":
            case "property":
                if (!parentTag.jsDocPropertyTags) {
                    parentTag.jsDocPropertyTags = <NodeArray<JSDocPropertyTag>>[];
                }
                const propertyTag = handlePropertyTag(atToken, tagName);
                parentTag.jsDocPropertyTags.push(propertyTag);
                return true;
        }
        return false;
    }

    function handleTemplateTag(atToken: Node, tagName: Identifier): JSDocTemplateTag {
        if (forEach(tags, t => t.kind === TokenType.JSDocTemplateTag)) {
            parseErrorAtPosition(tagName.pos, scanner.getTokenPos() - tagName.pos, Diagnostics._0_tag_already_specified, tagName.text);
        }

        // Type parameter list looks like '@template T,U,V'
        const typeParameters = <NodeArray<TypeParameterDeclaration>>[];
        typeParameters.pos = scanner.getStartPos();

        while (true) {
            const name = parseJSDocIdentifierName();
            if (!name) {
                parseErrorAtPosition(scanner.getStartPos(), 0, Diagnostics.Identifier_expected);
                return undefined;
            }

            const typeParameter = <TypeParameterDeclaration>createNode(TokenType.TypeParameter, name.pos);
            typeParameter.name = name;
            finishNode(typeParameter);

            typeParameters.push(typeParameter);

            if (token === TokenType.CommaToken) {
                nextJSDocToken();
            }
            else {
                break;
            }
        }

        const result = <JSDocTemplateTag>createNode(TokenType.JSDocTemplateTag, atToken.pos);
        result.atToken = atToken;
        result.tagName = tagName;
        result.typeParameters = typeParameters;
        finishNode(result);
        typeParameters.end = result.end;
        return result;
    }

    function nextJSDocToken(): TokenType {
        return token = scanner.scanJSDocToken();
    }

    function parseJSDocIdentifierName(): Identifier {
        return createJSDocIdentifier(tokenIsIdentifierOrKeyword(token));
    }

    function createJSDocIdentifier(isIdentifier: boolean): Identifier {
        if (!isIdentifier) {
            parseErrorAtCurrentToken(Diagnostics.Identifier_expected);
            return undefined;
        }

        const pos = scanner.getTokenPos();
        const end = scanner.getTextPos();
        const result = <Identifier>createNode(TokenType.Identifier, pos);
        result.text = content.substring(pos, end);
        finishNode(result, end);

        nextJSDocToken();
        return result;
    }
}

    // #endregion

}

namespace IncrementalParser {
    export private updateSourceFile(sourceFile: SourceFile, newText: string, textChangeRange: TextChangeRange, aggressiveChecks: boolean): SourceFile {
        aggressiveChecks = aggressiveChecks || Debug.shouldAssert(AssertionLevel.Aggressive);

        checkChangeRange(sourceFile, newText, textChangeRange, aggressiveChecks);
        if (textChangeRangeIsUnchanged(textChangeRange)) {
            // if the text didn't change, then we can just return our current source file as-is.
            return sourceFile;
        }

        if (sourceFile.statements.length === 0) {
            // If we don't have any statements in the current source file, then there's no real
            // way to incrementally parse.  So just do a full parse instead.
            return Parser.parseSourceFile(sourceFile.fileName, newText, sourceFile.languageVersion, /*syntaxCursor*/ undefined, /*setParentNodes*/ true, sourceFile.scriptKind);
        }

        // Make sure we're not trying to incrementally update a source file more than once.  Once
        // we do an update the original source file is considered unusable from that point onwards.
        //
        // This is because we do incremental parsing in-place.  i.e. we take nodes from the old
        // tree and give them new positions and parents.  From that point on, trusting the old
        // tree at all is not possible as far too much of it may violate invariants.
        const incrementalSourceFile = <IncrementalNode><Node>sourceFile;
        Debug.assert(!incrementalSourceFile.hasBeenIncrementallyParsed);
        incrementalSourceFile.hasBeenIncrementallyParsed = true;

        const oldText = sourceFile.text;
        const syntaxCursor = createSyntaxCursor(sourceFile);

        // Make the actual change larger so that we know to reparse anything whose lookahead
        // might have intersected the change.
        const changeRange = extendToAffectedRange(sourceFile, textChangeRange);
        checkChangeRange(sourceFile, newText, changeRange, aggressiveChecks);

        // Ensure that extending the affected range only moved the start of the change range
        // earlier in the file.
        Debug.assert(changeRange.span.start <= textChangeRange.span.start);
        Debug.assert(textSpanEnd(changeRange.span) === textSpanEnd(textChangeRange.span));
        Debug.assert(textSpanEnd(textChangeRangeNewSpan(changeRange)) === textSpanEnd(textChangeRangeNewSpan(textChangeRange)));

        // The is the amount the nodes after the edit range need to be adjusted.  It can be
        // positive (if the edit added characters), negative (if the edit deleted characters)
        // or zero (if this was a pure overwrite with nothing added/removed).
        const delta = textChangeRangeNewSpan(changeRange).length - changeRange.span.length;

        // If we added or removed characters during the edit, then we need to go and adjust all
        // the nodes after the edit.  Those nodes may move forward (if we inserted chars) or they
        // may move backward (if we deleted chars).
        //
        // Doing this helps us out in two ways.  First, it means that any nodes/tokens we want
        // to reuse are already at the appropriate position in the new text.  That way when we
        // reuse them, we don't have to figure out if they need to be adjusted.  Second, it makes
        // it very easy to determine if we can reuse a node.  If the node's position is at where
        // we are in the text, then we can reuse it.  Otherwise we can't.  If the node's position
        // is ahead of us, then we'll need to rescan tokens.  If the node's position is behind
        // us, then we'll need to skip it or crumble it as appropriate
        //
        // We will also adjust the positions of nodes that intersect the change range as well.
        // By doing this, we ensure that all the positions in the old tree are consistent, not
        // just the positions of nodes entirely before/after the change range.  By being
        // consistent, we can then easily map from positions to nodes in the old tree easily.
        //
        // Also, mark any syntax elements that intersect the changed span.  We know, up front,
        // that we cannot reuse these elements.
        updateTokenPositionsAndMarkElements(incrementalSourceFile,
            changeRange.span.start, textSpanEnd(changeRange.span), textSpanEnd(textChangeRangeNewSpan(changeRange)), delta, oldText, newText, aggressiveChecks);

        // Now that we've set up our internal incremental state just proceed and parse the
        // source file in the normal fashion.  When possible the parser will retrieve and
        // reuse nodes from the old tree.
        //
        // Note: passing in 'true' for setNodeParents is very important.  When incrementally
        // parsing, we will be reusing nodes from the old tree, and placing it into new
        // parents.  If we don't set the parents now, we'll end up with an observably
        // inconsistent tree.  Setting the parents on the new tree should be very fnodes.  We
        // will immediately bail out of walking any subtrees when we can see that their parents
        // are already correct.
        const result = Parser.parseSourceFile(sourceFile.fileName, newText, sourceFile.languageVersion, syntaxCursor, /*setParentNodes*/ true, sourceFile.scriptKind);

        return result;
    }

    private moveElementEntirelyPnodesChangeRange(element: IncrementalElement, isArray: boolean, delta: number, oldText: string, newText: string, aggressiveChecks: boolean) {
        if (isArray) {
            visitArray(<IncrementalNodeArray>element);
        }
        else {
            visitNode(<IncrementalNode>element);
        }
        return;

        private visitNode(node: IncrementalNode) {
            let text = "";
            if (aggressiveChecks && shouldCheckNode(node)) {
                text = oldText.substring(node.pos, node.end);
            }

            // Ditch any existing LS children we may have created.  This way we can avoid
            // moving them forward.
            if (node._children) {
                node._children = undefined;
            }

            node.pos += delta;
            node.end += delta;

            if (aggressiveChecks && shouldCheckNode(node)) {
                Debug.assert(text === newText.substring(node.pos, node.end));
            }

            forEachChild(node, visitNode, visitArray);
            if (node.jsDocComments) {
                for (const jsDocComment of node.jsDocComments) {
                    forEachChild(jsDocComment, visitNode, visitArray);
                }
            }
            checkNodePositions(node, aggressiveChecks);
        }

        private visitArray(array: IncrementalNodeArray) {
            array._children = undefined;
            array.pos += delta;
            array.end += delta;

            for (const node of array) {
                visitNode(node);
            }
        }
    }

    private shouldCheckNode(node: Node) {
        switch (node.kind) {
            case TokenType.StringLiteral:
            case TokenType.NumericLiteral:
            case TokenType.Identifier:
                return true;
        }

        return false;
    }

    private adjustIntersectingElement(element: IncrementalElement, changeStart: number, changeRangeOldEnd: number, changeRangeNewEnd: number, delta: number) {
        Debug.assert(element.end >= changeStart, "Adjusting an element that was entirely before the change range");
        Debug.assert(element.pos <= changeRangeOldEnd, "Adjusting an element that was entirely after the change range");
        Debug.assert(element.pos <= element.end);

        // We have an element that intersects the change range in some way.  It may have its
        // start, or its end (or both) in the changed range.  We want to adjust any part
        // that intersects such that the final tree is in a consistent state.  i.e. all
        // children have spans within the span of their parent, and all siblings are ordered
        // properly.

        // We may need to update both the 'pos' and the 'end' of the element.

        // If the 'pos' is before the start of the change, then we don't need to touch it.
        // If it isn't, then the 'pos' must be inside the change.  How we update it will
        // depend if delta is  positive or negative.  If delta is positive then we have
        // something like:
        //
        //  -------------------AAA-----------------
        //  -------------------BBBCCCCCCC-----------------
        //
        // In this case, we consider any node that started in the change range to still be
        // starting at the same position.
        //
        // however, if the delta is negative, then we instead have something like this:
        //
        //  -------------------XXXYYYYYYY-----------------
        //  -------------------ZZZ-----------------
        //
        // In this case, any element that started in the 'X' range will keep its position.
        // However any element that started after that will have their pos adjusted to be
        // at the end of the new range.  i.e. any node that started in the 'Y' range will
        // be adjusted to have their start at the end of the 'Z' range.
        //
        // The element will keep its position if possible.  Or Move backward to the new-end
        // if it's in the 'Y' range.
        element.pos = Math.min(element.pos, changeRangeNewEnd);

        // If the 'end' is after the change range, then we always adjust it by the delta
        // amount.  However, if the end is in the change range, then how we adjust it
        // will depend on if delta is  positive or negative.  If delta is positive then we
        // have something like:
        //
        //  -------------------AAA-----------------
        //  -------------------BBBCCCCCCC-----------------
        //
        // In this case, we consider any node that ended inside the change range to keep its
        // end position.
        //
        // however, if the delta is negative, then we instead have something like this:
        //
        //  -------------------XXXYYYYYYY-----------------
        //  -------------------ZZZ-----------------
        //
        // In this case, any element that ended in the 'X' range will keep its position.
        // However any element that ended after that will have their pos adjusted to be
        // at the end of the new range.  i.e. any node that ended in the 'Y' range will
        // be adjusted to have their end at the end of the 'Z' range.
        if (element.end >= changeRangeOldEnd) {
            // Element ends after the change range.  Always adjust the end pos.
            element.end += delta;
        }
        else {
            // Element ends in the change range.  The element will keep its position if
            // possible. Or Move backward to the new-end if it's in the 'Y' range.
            element.end = Math.min(element.end, changeRangeNewEnd);
        }

        Debug.assert(element.pos <= element.end);
        if (element.parent) {
            Debug.assert(element.pos >= element.parent.pos);
            Debug.assert(element.end <= element.parent.end);
        }
    }

    private checkNodePositions(node: Node, aggressiveChecks: boolean) {
        if (aggressiveChecks) {
            let pos = node.pos;
            forEachChild(node, child => {
                Debug.assert(child.pos >= pos);
                pos = child.end;
            });
            Debug.assert(pos <= node.end);
        }
    }

    private updateTokenPositionsAndMarkElements(
        sourceFile: IncrementalNode,
        changeStart: number,
        changeRangeOldEnd: number,
        changeRangeNewEnd: number,
        delta: number,
        oldText: string,
        newText: string,
        aggressiveChecks: boolean): void {

            visitNode(sourceFile);
        return;

            private visitNode(child: IncrementalNode) {
                Debug.assert(child.pos <= child.end);
                if (child.pos > changeRangeOldEnd) {
                    // Node is entirely pnodes the change range.  We need to move both its pos and
                    // end, forward or backward appropriately.
                    moveElementEntirelyPnodesChangeRange(child, /*isArray*/ false, delta, oldText, newText, aggressiveChecks);
                    return;
                }

                // Check if the element intersects the change range.  If it does, then it is not
                // reusable.  Also, we'll need to recurse to see what constituent portions we may
                // be able to use.
                const fullEnd = child.end;
                if (fullEnd >= changeStart) {
                    child.intersectsChange = true;
                    child._children = undefined;

                    // Adjust the pos or end (or both) of the intersecting element accordingly.
                    adjustIntersectingElement(child, changeStart, changeRangeOldEnd, changeRangeNewEnd, delta);
                    forEachChild(child, visitNode, visitArray);

                    checkNodePositions(child, aggressiveChecks);
                    return;
                }

                // Otherwise, the node is entirely before the change range.  No need to do anything with it.
                Debug.assert(fullEnd < changeStart);
            }

        private visitArray(array: IncrementalNodeArray) {
                Debug.assert(array.pos <= array.end);
                if (array.pos > changeRangeOldEnd) {
                    // Array is entirely after the change range.  We need to move it, and move any of
                    // its children.
                    moveElementEntirelyPnodesChangeRange(array, /*isArray*/ true, delta, oldText, newText, aggressiveChecks);
                    return;
                }

                // Check if the element intersects the change range.  If it does, then it is not
                // reusable.  Also, we'll need to recurse to see what constituent portions we may
                // be able to use.
                const fullEnd = array.end;
                if (fullEnd >= changeStart) {
                    array.intersectsChange = true;
                    array._children = undefined;

                    // Adjust the pos or end (or both) of the intersecting array accordingly.
                    adjustIntersectingElement(array, changeStart, changeRangeOldEnd, changeRangeNewEnd, delta);
                    for (const node of array) {
                        visitNode(node);
                    }
                    return;
                }

                // Otherwise, the array is entirely before the change range.  No need to do anything with it.
                Debug.assert(fullEnd < changeStart);
            }
        }

    private extendToAffectedRange(sourceFile: SourceFile, changeRange: TextChangeRange): TextChangeRange {
        // Consider the following code:
        //      void foo() { /; }
        //
        // If the text changes with an insertion of / just before the semicolon then we end up with:
        //      void foo() { //; }
        //
        // If we were to just use the changeRange a is, then we would not rescan the { token
        // (as it does not intersect the actual original change range).  Because an edit may
        // change the token touching it, we actually need to look back *at lenodes* one token so
        // that the prior token sees that change.
        const maxLookahead = 1;

        let start = changeRange.span.start;

        // the first iteration aligns us with the change start. subsequent iteration move us to
        // the left by maxLookahead tokens.  We only need to do this as long as we're not at the
        // start of the tree.
        for (let i = 0; start > 0 && i <= maxLookahead; i++) {
            const nearestNode = findNearestNodeStartingBeforeOrAtPosition(sourceFile, start);
            Debug.assert(nearestNode.pos <= start);
            const position = nearestNode.pos;

            start = Math.max(0, position - 1);
        }

        const finalSpan = createTextSpanFromBounds(start, textSpanEnd(changeRange.span));
        const finalLength = changeRange.newLength + (changeRange.span.start - start);

        return createTextChangeRange(finalSpan, finalLength);
    }

    private findNearestNodeStartingBeforeOrAtPosition(sourceFile: SourceFile, position: number): Node {
        let bestResult: Node = sourceFile;
        let lnodesNodeEntirelyBeforePosition: Node;

        forEachChild(sourceFile, visit);

        if (lnodesNodeEntirelyBeforePosition) {
            const lnodesChildOfLnodesEntireNodeBeforePosition = getLnodesChild(lnodesNodeEntirelyBeforePosition);
            if (lnodesChildOfLnodesEntireNodeBeforePosition.pos > bestResult.pos) {
                bestResult = lnodesChildOfLnodesEntireNodeBeforePosition;
            }
        }

        return bestResult;

        private getLnodesChild(node: Node): Node {
            while (true) {
                const lnodesChild = getLnodesChildWorker(node);
                if (lnodesChild) {
                    node = lnodesChild;
                }
                else {
                    return node;
                }
            }
        }

        private getLnodesChildWorker(node: Node): Node {
            let lnodes: Node = undefined;
            forEachChild(node, child => {
                if (nodeIsPresent(child)) {
                    lnodes = child;
                }
            });
            return lnodes;
        }

        private visit(child: Node) {
            if (nodeIsMissing(child)) {
                // Missing nodes are effectively invisible to us.  We never even consider them
                // When trying to find the nearest node before us.
                return;
            }

            // If the child intersects this position, then this node is currently the nearest
            // node that starts before the position.
            if (child.pos <= position) {
                if (child.pos >= bestResult.pos) {
                    // This node starts before the position, and is closer to the position than
                    // the previous best node we found.  It is now the new best node.
                    bestResult = child;
                }

                // Now, the node may overlap the position, or it may end entirely before the
                // position.  If it overlaps with the position, then either it, or one of its
                // children must be the nearest node before the position.  So we can just
                // recurse into this child to see if we can find something better.
                if (position < child.end) {
                    // The nearest node is either this child, or one of the children inside
                    // of it.  We've already marked this child as the best so far.  Recurse
                    // in case one of the children is better.
                    forEachChild(child, visit);

                    // Once we look at the children of this node, then there's no need to
                    // continue any further.
                    return true;
                }
                else {
                    Debug.assert(child.end <= position);
                    // The child ends entirely before this position.  Say you have the following
                    // (where $ is the position)
                    //
                    //      <complex expr 1> ? <complex expr 2> $ : <...> <...>
                    //
                    // We would want to find the nearest preceding node in "complex expr 2".
                    // To support that, we keep track of this node, and once we're done searching
                    // for a best node, we recurse down this node to see if we can find a good
                    // result in it.
                    //
                    // This approach allows us to quickly skip over nodes that are entirely
                    // before the position, while still allowing us to find any nodes in the
                    // lnodes one that might be what we want.
                    lnodesNodeEntirelyBeforePosition = child;
                }
            }
            else {
                Debug.assert(child.pos > position);
                // We're now at a node that is entirely pnodes the position we're searching for.
                // This node (and all following nodes) could never contribute to the result,
                // so just skip them by returning 'true' here.
                return true;
            }
        }
    }

    private checkChangeRange(sourceFile: SourceFile, newText: string, textChangeRange: TextChangeRange, aggressiveChecks: boolean) {
        const oldText = sourceFile.text;
        if (textChangeRange) {
            Debug.assert((oldText.length - textChangeRange.span.length + textChangeRange.newLength) === newText.length);

            if (aggressiveChecks || Debug.shouldAssert(AssertionLevel.VeryAggressive)) {
                const oldTextPrefix = oldText.substr(0, textChangeRange.span.start);
                const newTextPrefix = newText.substr(0, textChangeRange.span.start);
                Debug.assert(oldTextPrefix === newTextPrefix);

                const oldTextSuffix = oldText.substring(textSpanEnd(textChangeRange.span), oldText.length);
                const newTextSuffix = newText.substring(textSpanEnd(textChangeRangeNewSpan(textChangeRange)), newText.length);
                Debug.assert(oldTextSuffix === newTextSuffix);
            }
        }
    }

    interface IncrementalElement extends TextRange {
        parent?: Node;
        intersectsChange: boolean;
        length?: number;
        _children: Node[];
    }

    export interface IncrementalNode extends Node, IncrementalElement {
        hasBeenIncrementallyParsed: boolean;
    }

    interface IncrementalNodeArray extends NodeArray<IncrementalNode>, IncrementalElement {
        length: number;
    }

    // Allows finding nodes in the source file at a certain position in an efficient manner.
    // The implementation takes advantage of the calling pattern it knows the parser will
    // make in order to optimize finding nodes as quickly as possible.
    export interface SyntaxCursor {
        currentNode(position: number): IncrementalNode;
    }

    private createSyntaxCursor(sourceFile: SourceFile): SyntaxCursor {
        let currentArray: NodeArray<Node> = sourceFile.statements;
        let currentArrayIndex = 0;

        Debug.assert(currentArrayIndex < currentArray.length);
        let current = currentArray[currentArrayIndex];
        let lnodesQueriedPosition = InvalidPosition.Value;

        return {
            currentNode(position: number) {
                // Only compute the current node if the position is different than the lnodes time
                // we were asked.  The parser commonly asks for the node at the same position
                // twice.  Once to know if can read an appropriate list element at a certain point,
                // and then to actually read and consume the node.
                if (position !== lnodesQueriedPosition) {
                    // Much of the time the parser will need the very next node in the array that
                    // we just returned a node from.So just simply check for that case and move
                    // forward in the array instead of searching for the node again.
                    if (current && current.end === position && currentArrayIndex < (currentArray.length - 1)) {
                        currentArrayIndex++;
                        current = currentArray[currentArrayIndex];
                    }

                    // If we don't have a node, or the node we have isn't in the right position,
                    // then try to find a viable node at the position requested.
                    if (!current || current.pos !== position) {
                        findHighestListElementThatStartsAtPosition(position);
                    }
                }

                // Cache this query so that we don't do any extra work if the parser calls back
                // into us.  Note: this is very common as the parser will make pairs of calls like
                // 'isListElement -> parseListElement'.  If we were unable to find a node when
                // called with 'isListElement', we don't want to redo the work when parseListElement
                // is called immediately after.
                lnodesQueriedPosition = position;

                // Either we don'd have a node, or we have a node at the position being asked for.
                Debug.assert(!current || current.pos === position);
                return <IncrementalNode>current;
            }
        };

        // Finds the highest element in the tree we can find that starts at the provided position.
        // The element must be a direct child of some node list in the tree.  This way after we
        // return it, we can easily return its next sibling in the list.
        private findHighestListElementThatStartsAtPosition(position: number) {
            // Clear out any cached state about the lnodes node we found.
            currentArray = undefined;
            currentArrayIndex = InvalidPosition.Value;
            current = undefined;

            // Recurse into the source file to find the highest node at this position.
            forEachChild(sourceFile, visitNode, visitArray);
            return;

            private visitNode(node: Node) {
                if (position >= node.pos && position < node.end) {
                    // Position was within this node.  Keep searching deeper to find the node.
                    forEachChild(node, visitNode, visitArray);

                    // don't proceed any further in the search.
                    return true;
                }

                // position wasn't in this node, have to keep searching.
                return false;
            }

            private visitArray(array: NodeArray<Node>) {
                if(position >= array.pos && position < array.end) {
                    // position was in this array.  Search through this array to see if we find a
                    // viable element.
                    for (let i = 0, n = array.length; i < n; i++) {
                        const child = array[i];
                        if (child) {
                            if (child.pos === position) {
                                // Found the right node.  We're done.
                                currentArray = array;
                                currentArrayIndex = i;
                                current = child;
                                return true;
                            }
                            else {
                                if (child.pos < position && position < child.end) {
                                    // Position in somewhere within this child.  Search in it and
                                    // stop searching in this array.
                                    forEachChild(child, visitNode, visitArray);
                                    return true;
                                }
                            }
                        }
                    }
                }

                // position wasn't in this array, have to keep searching.
                return false;
            }
        }
    }

    const enum InvalidPosition {
        Value = -1
    }

}
