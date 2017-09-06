
        function parseSimplePropertyName(): Identifier | LiteralExpression {
            return <Identifier | LiteralExpression>parsePropertyNameWorker(/*allowComputedPropertyNames*/ false);
        }

        function isSimplePropertyName() {
            return token === SyntaxKind.StringLiteral || token === SyntaxKind.NumericLiteral || tokenIsIdentifierOrKeyword(token);
        }

    /* @internal */
    export function parseIsolatedJSDocComment(content: string, start?: number, length?: number) {
        const result = Parser.JSDocParser.parseIsolatedJSDocComment(content, start, length);
        if (result && result.jsDocComment) {
            // because the jsDocComment was parsed out of the source file, it might
            // not be covered by the fixupParentReferences.
            Parser.fixupParentReferences(result.jsDocComment);
        }

        return result;
    }

    /* @internal */
    // Exposed only for testing.
    export function parseJSDocTypeExpressionForTests(content: string, start?: number, length?: number) {
        return Parser.JSDocParser.parseJSDocTypeExpressionForTests(content, start, length);
    }

        export namespace JSDocParser {
            export function isJSDocType() {
                switch (token) {
                    case SyntaxKind.AsteriskToken:
                    case SyntaxKind.QuestionToken:
                    case SyntaxKind.OpenParenToken:
                    case SyntaxKind.OpenBracketToken:
                    case SyntaxKind.ExclamationToken:
                    case SyntaxKind.OpenBraceToken:
                    case SyntaxKind.FunctionKeyword:
                    case SyntaxKind.DotDotDotToken:
                    case SyntaxKind.NewKeyword:
                    case SyntaxKind.ThisKeyword:
                        return true;
                }

                return tokenIsIdentifierOrKeyword(token);
            }

            export function parseJSDocTypeExpressionForTests(content: string, start: number, length: number) {
                initializeState("file.js", content, ScriptTarget.Latest, /*_syntaxCursor:*/ undefined, ScriptKind.JS);
                scanner.setText(content, start, length);
                token = scanner.scan();
                const jsDocTypeExpression = parseJSDocTypeExpression();
                const diagnostics = parseDiagnostics;
                clearState();

                return jsDocTypeExpression ? { jsDocTypeExpression, diagnostics } : undefined;
            }

            // Parses out a JSDoc type expression.
            /* @internal */
            export function parseJSDocTypeExpression(): JSDocTypeExpression {
                const result = <JSDocTypeExpression>createNode(SyntaxKind.JSDocTypeExpression, scanner.getTokenPos());

                parseExpected(SyntaxKind.OpenBraceToken);
                result.type = parseJSDocTopLevelType();
                parseExpected(SyntaxKind.CloseBraceToken);

                fixupParentReferences(result);
                return finishNode(result);
            }

            function parseJSDocTopLevelType(): JSDocType {
                let type = parseJSDocType();
                if (token === SyntaxKind.BarToken) {
                    const unionType = <JSDocUnionType>createNode(SyntaxKind.JSDocUnionType, type.pos);
                    unionType.types = parseJSDocTypeList(type);
                    type = finishNode(unionType);
                }

                if (token === SyntaxKind.EqualsToken) {
                    const optionalType = <JSDocOptionalType>createNode(SyntaxKind.JSDocOptionalType, type.pos);
                    nextToken();
                    optionalType.type = type;
                    type = finishNode(optionalType);
                }

                return type;
            }

            function parseJSDocType(): JSDocType {
                let type = parseBasicTypeExpression();

                while (true) {
                    if (token === SyntaxKind.OpenBracketToken) {
                        const arrayType = <JSDocArrayType>createNode(SyntaxKind.JSDocArrayType, type.pos);
                        arrayType.elementType = type;

                        nextToken();
                        parseExpected(SyntaxKind.CloseBracketToken);

                        type = finishNode(arrayType);
                    }
                    else if (token === SyntaxKind.QuestionToken) {
                        const nullableType = <JSDocNullableType>createNode(SyntaxKind.JSDocNullableType, type.pos);
                        nullableType.type = type;

                        nextToken();
                        type = finishNode(nullableType);
                    }
                    else if (token === SyntaxKind.ExclamationToken) {
                        const nonNullableType = <JSDocNonNullableType>createNode(SyntaxKind.JSDocNonNullableType, type.pos);
                        nonNullableType.type = type;

                        nextToken();
                        type = finishNode(nonNullableType);
                    }
                    else {
                        break;
                    }
                }

                return type;
            }

            function parseBasicTypeExpression(): JSDocType {
                switch (token) {
                    case SyntaxKind.AsteriskToken:
                        return parseJSDocAllType();
                    case SyntaxKind.QuestionToken:
                        return parseJSDocUnknownOrNullableType();
                    case SyntaxKind.OpenParenToken:
                        return parseJSDocUnionType();
                    case SyntaxKind.OpenBracketToken:
                        return parseJSDocTupleType();
                    case SyntaxKind.ExclamationToken:
                        return parseJSDocNonNullableType();
                    case SyntaxKind.OpenBraceToken:
                        return parseJSDocRecordType();
                    case SyntaxKind.FunctionKeyword:
                        return parseJSDocFunctionType();
                    case SyntaxKind.DotDotDotToken:
                        return parseJSDocVariadicType();
                    case SyntaxKind.NewKeyword:
                        return parseJSDocConstructorType();
                    case SyntaxKind.ThisKeyword:
                        return parseJSDocThisType();
                    case SyntaxKind.AnyKeyword:
                    case SyntaxKind.StringKeyword:
                    case SyntaxKind.NumberKeyword:
                    case SyntaxKind.BooleanKeyword:
                    case SyntaxKind.SymbolKeyword:
                    case SyntaxKind.VoidKeyword:
                        return parseTokenNode<JSDocType>();
                }

                // TODO (drosen): Parse string literal types in JSDoc as well.
                return parseJSDocTypeReference();
            }

            function parseJSDocThisType(): JSDocThisType {
                const result = <JSDocThisType>createNode(SyntaxKind.JSDocThisType);
                nextToken();
                parseExpected(SyntaxKind.ColonToken);
                result.type = parseJSDocType();
                return finishNode(result);
            }

            function parseJSDocConstructorType(): JSDocConstructorType {
                const result = <JSDocConstructorType>createNode(SyntaxKind.JSDocConstructorType);
                nextToken();
                parseExpected(SyntaxKind.ColonToken);
                result.type = parseJSDocType();
                return finishNode(result);
            }

            function parseJSDocVariadicType(): JSDocVariadicType {
                const result = <JSDocVariadicType>createNode(SyntaxKind.JSDocVariadicType);
                nextToken();
                result.type = parseJSDocType();
                return finishNode(result);
            }

            function parseJSDocFunctionType(): JSDocFunctionType {
                const result = <JSDocFunctionType>createNode(SyntaxKind.JSDocFunctionType);
                nextToken();

                parseExpected(SyntaxKind.OpenParenToken);
                result.parameters = parseDelimitedList(ParsingContext.JSDocFunctionParameters, parseJSDocParameter);
                checkForTrailingComma(result.parameters);
                parseExpected(SyntaxKind.CloseParenToken);

                if (token === SyntaxKind.ColonToken) {
                    nextToken();
                    result.type = parseJSDocType();
                }

                return finishNode(result);
            }

            function parseJSDocParameter(): ParameterDeclaration {
                const parameter = <ParameterDeclaration>createNode(SyntaxKind.Parameter);
                parameter.type = parseJSDocType();
                if (parseOptional(SyntaxKind.EqualsToken)) {
                    parameter.questionToken = createNode(SyntaxKind.EqualsToken);
                }
                return finishNode(parameter);
            }

            function parseJSDocTypeReference(): JSDocTypeReference {
                const result = <JSDocTypeReference>createNode(SyntaxKind.JSDocTypeReference);
                result.name = parseSimplePropertyName();

                if (token === SyntaxKind.LessThanToken) {
                    result.typeArguments = parseTypeArguments();
                }
                else {
                    while (parseOptional(SyntaxKind.DotToken)) {
                        if (token === SyntaxKind.LessThanToken) {
                            result.typeArguments = parseTypeArguments();
                            break;
                        }
                        else {
                            result.name = parseQualifiedName(result.name);
                        }
                    }
                }


                return finishNode(result);
            }

            function parseTypeArguments() {
                // Move past the <
                nextToken();
                const typeArguments = parseDelimitedList(ParsingContext.JSDocTypeArguments, parseJSDocType);
                checkForTrailingComma(typeArguments);
                checkForEmptyTypeArgumentList(typeArguments);
                parseExpected(SyntaxKind.GreaterThanToken);

                return typeArguments;
            }

            function checkForEmptyTypeArgumentList(typeArguments: NodeArray<Node>) {
                if (parseDiagnostics.length === 0 && typeArguments && typeArguments.length === 0) {
                    const start = typeArguments.pos - "<".length;
                    const end = skipTrivia(sourceText, typeArguments.end) + ">".length;
                    return parseErrorAtPosition(start, end - start, Diagnostics.Type_argument_list_cannot_be_empty);
                }
            }

            function parseQualifiedName(left: EntityName): QualifiedName {
                const result = <QualifiedName>createNode(SyntaxKind.QualifiedName, left.pos);
                result.left = left;
                result.right = parseIdentifierName();

                return finishNode(result);
            }

            function parseJSDocRecordType(): JSDocRecordType {
                const result = <JSDocRecordType>createNode(SyntaxKind.JSDocRecordType);
                nextToken();
                result.members = parseDelimitedList(ParsingContext.JSDocRecordMembers, parseJSDocRecordMember);
                checkForTrailingComma(result.members);
                parseExpected(SyntaxKind.CloseBraceToken);
                return finishNode(result);
            }

            function parseJSDocRecordMember(): JSDocRecordMember {
                const result = <JSDocRecordMember>createNode(SyntaxKind.JSDocRecordMember);
                result.name = parseSimplePropertyName();

                if (token === SyntaxKind.ColonToken) {
                    nextToken();
                    result.type = parseJSDocType();
                }

                return finishNode(result);
            }

            function parseJSDocNonNullableType(): JSDocNonNullableType {
                const result = <JSDocNonNullableType>createNode(SyntaxKind.JSDocNonNullableType);
                nextToken();
                result.type = parseJSDocType();
                return finishNode(result);
            }

            function parseJSDocTupleType(): JSDocTupleType {
                const result = <JSDocTupleType>createNode(SyntaxKind.JSDocTupleType);
                nextToken();
                result.types = parseDelimitedList(ParsingContext.JSDocTupleTypes, parseJSDocType);
                checkForTrailingComma(result.types);
                parseExpected(SyntaxKind.CloseBracketToken);

                return finishNode(result);
            }

            function checkForTrailingComma(list: NodeArray<Node>) {
                if (parseDiagnostics.length === 0 && list.hasTrailingComma) {
                    const start = list.end - ",".length;
                    parseErrorAtPosition(start, ",".length, Diagnostics.Trailing_comma_not_allowed);
                }
            }

            function parseJSDocUnionType(): JSDocUnionType {
                const result = <JSDocUnionType>createNode(SyntaxKind.JSDocUnionType);
                nextToken();
                result.types = parseJSDocTypeList(parseJSDocType());

                parseExpected(SyntaxKind.CloseParenToken);

                return finishNode(result);
            }

            function parseJSDocTypeList(firstType: JSDocType) {
                Debug.assert(!!firstType);

                const types = <NodeArray<JSDocType>>[];
                types.pos = firstType.pos;

                types.push(firstType);
                while (parseOptional(SyntaxKind.BarToken)) {
                    types.push(parseJSDocType());
                }

                types.end = scanner.getStartPos();
                return types;
            }

            function parseJSDocAllType(): JSDocAllType {
                const result = <JSDocAllType>createNode(SyntaxKind.JSDocAllType);
                nextToken();
                return finishNode(result);
            }

            function parseJSDocUnknownOrNullableType(): JSDocUnknownType | JSDocNullableType {
                const pos = scanner.getStartPos();
                // skip the ?
                nextToken();

                // Need to lookahead to decide if this is a nullable or unknown type.

                // Here are cases where we'll pick the unknown type:
                //
                //      Foo(?,
                //      { a: ? }
                //      Foo(?)
                //      Foo<?>
                //      Foo(?=
                //      (?|
                if (token === SyntaxKind.CommaToken ||
                    token === SyntaxKind.CloseBraceToken ||
                    token === SyntaxKind.CloseParenToken ||
                    token === SyntaxKind.GreaterThanToken ||
                    token === SyntaxKind.EqualsToken ||
                    token === SyntaxKind.BarToken) {

                    const result = <JSDocUnknownType>createNode(SyntaxKind.JSDocUnknownType, pos);
                    return finishNode(result);
                }
                else {
                    const result = <JSDocNullableType>createNode(SyntaxKind.JSDocNullableType, pos);
                    result.type = parseJSDocType();
                    return finishNode(result);
                }
            }

            export function parseIsolatedJSDocComment(content: string, start: number, length: number) {
                initializeState("file.js", content, ScriptTarget.Latest, /*_syntaxCursor:*/ undefined, ScriptKind.JS);
                sourceFile = <SourceFile>{ languageVariant: LanguageVariant.Standard, text: content };
                const jsDocComment = parseJSDocCommentWorker(start, length);
                const diagnostics = parseDiagnostics;
                clearState();

                return jsDocComment ? { jsDocComment, diagnostics } : undefined;
            }

            export function parseJSDocComment(parent: Node, start: number, length: number): JSDocComment {
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

            export function parseJSDocCommentWorker(start: number, length: number): JSDocComment {
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
                    content.charCodeAt(start + 1) === CharacterCodes.asterisk &&
                    content.charCodeAt(start + 2) === CharacterCodes.asterisk &&
                    content.charCodeAt(start + 3) !== CharacterCodes.asterisk) {


                    // + 3 for leading /**, - 5 in total for /** */
                    scanner.scanRange(start + 3, length - 5, () => {
                        // Initially we can parse out a tag.  We also have seen a starting asterisk.
                        // This is so that /** * @type */ doesn't parse.
                        let canParseTag = true;
                        let seenAsterisk = true;

                        nextJSDocToken();
                        while (token !== SyntaxKind.EndOfFileToken) {
                            switch (token) {
                                case SyntaxKind.AtToken:
                                    if (canParseTag) {
                                        parseTag();
                                    }
                                    // This will take us to the end of the line, so it's OK to parse a tag on the next pass through the loop
                                    seenAsterisk = false;
                                    break;

                                case SyntaxKind.NewLineTrivia:
                                    // After a line break, we can parse a tag, and we haven't seen an asterisk on the next line yet
                                    canParseTag = true;
                                    seenAsterisk = false;
                                    break;

                                case SyntaxKind.AsteriskToken:
                                    if (seenAsterisk) {
                                        // If we've already seen an asterisk, then we can no longer parse a tag on this line
                                        canParseTag = false;
                                    }
                                    // Ignore the first asterisk on a line
                                    seenAsterisk = true;
                                    break;

                                case SyntaxKind.Identifier:
                                    // Anything else is doc comment text.  We can't do anything with it.  Because it
                                    // wasn't a tag, we can no longer parse a tag on this line until we hit the next
                                    // line break.
                                    canParseTag = false;
                                    break;

                                case SyntaxKind.EndOfFileToken:
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

                    const result = <JSDocComment>createNode(SyntaxKind.JSDocComment, start);
                    result.tags = tags;
                    return finishNode(result, end);
                }

                function skipWhitespace(): void {
                    while (token === SyntaxKind.WhitespaceTrivia || token === SyntaxKind.NewLineTrivia) {
                        nextJSDocToken();
                    }
                }

                function parseTag(): void {
                    Debug.assert(token === SyntaxKind.AtToken);
                    const atToken = createNode(SyntaxKind.AtToken, scanner.getTokenPos());
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
                    const result = <JSDocTag>createNode(SyntaxKind.JSDocTag, atToken.pos);
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
                    if (token !== SyntaxKind.OpenBraceToken) {
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
                    if (parseOptionalToken(SyntaxKind.OpenBracketToken)) {
                        name = parseJSDocIdentifierName();
                        isBracketed = true;

                        // May have an optional default, e.g. '[foo = 42]'
                        if (parseOptionalToken(SyntaxKind.EqualsToken)) {
                            parseExpression();
                        }

                        parseExpected(SyntaxKind.CloseBracketToken);
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

                    const result = <JSDocParameterTag>createNode(SyntaxKind.JSDocParameterTag, atToken.pos);
                    result.atToken = atToken;
                    result.tagName = tagName;
                    result.preParameterName = preName;
                    result.typeExpression = typeExpression;
                    result.postParameterName = postName;
                    result.isBracketed = isBracketed;
                    return finishNode(result);
                }

                function handleReturnTag(atToken: Node, tagName: Identifier): JSDocReturnTag {
                    if (forEach(tags, t => t.kind === SyntaxKind.JSDocReturnTag)) {
                        parseErrorAtPosition(tagName.pos, scanner.getTokenPos() - tagName.pos, Diagnostics._0_tag_already_specified, tagName.text);
                    }

                    const result = <JSDocReturnTag>createNode(SyntaxKind.JSDocReturnTag, atToken.pos);
                    result.atToken = atToken;
                    result.tagName = tagName;
                    result.typeExpression = tryParseTypeExpression();
                    return finishNode(result);
                }

                function handleTypeTag(atToken: Node, tagName: Identifier): JSDocTypeTag {
                    if (forEach(tags, t => t.kind === SyntaxKind.JSDocTypeTag)) {
                        parseErrorAtPosition(tagName.pos, scanner.getTokenPos() - tagName.pos, Diagnostics._0_tag_already_specified, tagName.text);
                    }

                    const result = <JSDocTypeTag>createNode(SyntaxKind.JSDocTypeTag, atToken.pos);
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

                    const result = <JSDocPropertyTag>createNode(SyntaxKind.JSDocPropertyTag, atToken.pos);
                    result.atToken = atToken;
                    result.tagName = tagName;
                    result.name = name;
                    result.typeExpression = typeExpression;
                    return finishNode(result);
                }

                function handleTypedefTag(atToken: Node, tagName: Identifier): JSDocTypedefTag {
                    const typeExpression = tryParseTypeExpression();
                    skipWhitespace();

                    const typedefTag = <JSDocTypedefTag>createNode(SyntaxKind.JSDocTypedefTag, atToken.pos);
                    typedefTag.atToken = atToken;
                    typedefTag.tagName = tagName;
                    typedefTag.name = parseJSDocIdentifierName();
                    typedefTag.typeExpression = typeExpression;

                    if (typeExpression) {
                        if (typeExpression.type.kind === SyntaxKind.JSDocTypeReference) {
                            const jsDocTypeReference = <JSDocTypeReference>typeExpression.type;
                            if (jsDocTypeReference.name.kind === SyntaxKind.Identifier) {
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
                        const jsDocTypeLiteral = <JSDocTypeLiteral>createNode(SyntaxKind.JSDocTypeLiteral, scanner.getStartPos());
                        let resumePos = scanner.getStartPos();
                        let canParseTag = true;
                        let seenAsterisk = false;
                        let parentTagTerminated = false;

                        while (token !== SyntaxKind.EndOfFileToken && !parentTagTerminated) {
                            nextJSDocToken();
                            switch (token) {
                                case SyntaxKind.AtToken:
                                    if (canParseTag) {
                                        parentTagTerminated = !tryParseChildTag(jsDocTypeLiteral);
                                    }
                                    seenAsterisk = false;
                                    break;
                                case SyntaxKind.NewLineTrivia:
                                    resumePos = scanner.getStartPos() - 1;
                                    canParseTag = true;
                                    seenAsterisk = false;
                                    break;
                                case SyntaxKind.AsteriskToken:
                                    if (seenAsterisk) {
                                        canParseTag = false;
                                    }
                                    seenAsterisk = true;
                                    break;
                                case SyntaxKind.Identifier:
                                    canParseTag = false;
                                case SyntaxKind.EndOfFileToken:
                                    break;
                            }
                        }
                        scanner.setTextPos(resumePos);
                        return finishNode(jsDocTypeLiteral);
                    }
                }

                function tryParseChildTag(parentTag: JSDocTypeLiteral): boolean {
                    Debug.assert(token === SyntaxKind.AtToken);
                    const atToken = createNode(SyntaxKind.AtToken, scanner.getStartPos());
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
                    if (forEach(tags, t => t.kind === SyntaxKind.JSDocTemplateTag)) {
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

                        const typeParameter = <TypeParameterDeclaration>createNode(SyntaxKind.TypeParameter, name.pos);
                        typeParameter.name = name;
                        finishNode(typeParameter);

                        typeParameters.push(typeParameter);

                        if (token === SyntaxKind.CommaToken) {
                            nextJSDocToken();
                        }
                        else {
                            break;
                        }
                    }

                    const result = <JSDocTemplateTag>createNode(SyntaxKind.JSDocTemplateTag, atToken.pos);
                    result.atToken = atToken;
                    result.tagName = tagName;
                    result.typeParameters = typeParameters;
                    finishNode(result);
                    typeParameters.end = result.end;
                    return result;
                }

                function nextJSDocToken(): SyntaxKind {
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
                    const result = <Identifier>createNode(SyntaxKind.Identifier, pos);
                    result.text = content.substring(pos, end);
                    finishNode(result, end);

                    nextJSDocToken();
                    return result;
                }
            }
        }