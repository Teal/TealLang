"use strict";
exports.__esModule = true;
function parseSimplePropertyName() {
    return parsePropertyNameWorker(/*allowComputedPropertyNames*/ false);
}
function isSimplePropertyName() {
    return token === SyntaxKind.StringLiteral || token === SyntaxKind.NumericLiteral || tokenIsIdentifierOrKeyword(token);
}
/* @internal */
function parseIsolatedJSDocComment(content, start, length) {
    var result = Parser.JSDocParser.parseIsolatedJSDocComment(content, start, length);
    if (result && result.jsDocComment) {
        // because the jsDocComment was parsed out of the source file, it might
        // not be covered by the fixupParentReferences.
        Parser.fixupParentReferences(result.jsDocComment);
    }
    return result;
}
exports.parseIsolatedJSDocComment = parseIsolatedJSDocComment;
/* @internal */
// Exposed only for testing.
function parseJSDocTypeExpressionForTests(content, start, length) {
    return Parser.JSDocParser.parseJSDocTypeExpressionForTests(content, start, length);
}
exports.parseJSDocTypeExpressionForTests = parseJSDocTypeExpressionForTests;
var JSDocParser;
(function (JSDocParser) {
    function isJSDocType() {
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
    JSDocParser.isJSDocType = isJSDocType;
    function parseJSDocTypeExpressionForTests(content, start, length) {
        initializeState("file.js", content, ScriptTarget.Latest, /*_syntaxCursor:*/ undefined, ScriptKind.JS);
        scanner.setText(content, start, length);
        token = scanner.scan();
        var jsDocTypeExpression = parseJSDocTypeExpression();
        var diagnostics = parseDiagnostics;
        clearState();
        return jsDocTypeExpression ? { jsDocTypeExpression: jsDocTypeExpression, diagnostics: diagnostics } : undefined;
    }
    JSDocParser.parseJSDocTypeExpressionForTests = parseJSDocTypeExpressionForTests;
    // Parses out a JSDoc type expression.
    /* @internal */
    function parseJSDocTypeExpression() {
        var result = createNode(SyntaxKind.JSDocTypeExpression, scanner.getTokenPos());
        parseExpected(SyntaxKind.OpenBraceToken);
        result.type = parseJSDocTopLevelType();
        parseExpected(SyntaxKind.CloseBraceToken);
        fixupParentReferences(result);
        return finishNode(result);
    }
    JSDocParser.parseJSDocTypeExpression = parseJSDocTypeExpression;
    function parseJSDocTopLevelType() {
        var type = parseJSDocType();
        if (token === SyntaxKind.BarToken) {
            var unionType = createNode(SyntaxKind.JSDocUnionType, type.pos);
            unionType.types = parseJSDocTypeList(type);
            type = finishNode(unionType);
        }
        if (token === SyntaxKind.EqualsToken) {
            var optionalType = createNode(SyntaxKind.JSDocOptionalType, type.pos);
            nextToken();
            optionalType.type = type;
            type = finishNode(optionalType);
        }
        return type;
    }
    function parseJSDocType() {
        var type = parseBasicTypeExpression();
        while (true) {
            if (token === SyntaxKind.OpenBracketToken) {
                var arrayType = createNode(SyntaxKind.JSDocArrayType, type.pos);
                arrayType.elementType = type;
                nextToken();
                parseExpected(SyntaxKind.CloseBracketToken);
                type = finishNode(arrayType);
            }
            else if (token === SyntaxKind.QuestionToken) {
                var nullableType = createNode(SyntaxKind.JSDocNullableType, type.pos);
                nullableType.type = type;
                nextToken();
                type = finishNode(nullableType);
            }
            else if (token === SyntaxKind.ExclamationToken) {
                var nonNullableType = createNode(SyntaxKind.JSDocNonNullableType, type.pos);
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
    function parseBasicTypeExpression() {
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
                return parseTokenNode();
        }
        // TODO (drosen): Parse string literal types in JSDoc as well.
        return parseJSDocTypeReference();
    }
    function parseJSDocThisType() {
        var result = createNode(SyntaxKind.JSDocThisType);
        nextToken();
        parseExpected(SyntaxKind.ColonToken);
        result.type = parseJSDocType();
        return finishNode(result);
    }
    function parseJSDocConstructorType() {
        var result = createNode(SyntaxKind.JSDocConstructorType);
        nextToken();
        parseExpected(SyntaxKind.ColonToken);
        result.type = parseJSDocType();
        return finishNode(result);
    }
    function parseJSDocVariadicType() {
        var result = createNode(SyntaxKind.JSDocVariadicType);
        nextToken();
        result.type = parseJSDocType();
        return finishNode(result);
    }
    function parseJSDocFunctionType() {
        var result = createNode(SyntaxKind.JSDocFunctionType);
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
    function parseJSDocParameter() {
        var parameter = createNode(SyntaxKind.Parameter);
        parameter.type = parseJSDocType();
        if (parseOptional(SyntaxKind.EqualsToken)) {
            parameter.questionToken = createNode(SyntaxKind.EqualsToken);
        }
        return finishNode(parameter);
    }
    function parseJSDocTypeReference() {
        var result = createNode(SyntaxKind.JSDocTypeReference);
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
        var typeArguments = parseDelimitedList(ParsingContext.JSDocTypeArguments, parseJSDocType);
        checkForTrailingComma(typeArguments);
        checkForEmptyTypeArgumentList(typeArguments);
        parseExpected(SyntaxKind.GreaterThanToken);
        return typeArguments;
    }
    function checkForEmptyTypeArgumentList(typeArguments) {
        if (parseDiagnostics.length === 0 && typeArguments && typeArguments.length === 0) {
            var start = typeArguments.pos - "<".length;
            var end = skipTrivia(sourceText, typeArguments.end) + ">".length;
            return parseErrorAtPosition(start, end - start, Diagnostics.Type_argument_list_cannot_be_empty);
        }
    }
    function parseQualifiedName(left) {
        var result = createNode(SyntaxKind.QualifiedName, left.pos);
        result.left = left;
        result.right = parseIdentifierName();
        return finishNode(result);
    }
    function parseJSDocRecordType() {
        var result = createNode(SyntaxKind.JSDocRecordType);
        nextToken();
        result.members = parseDelimitedList(ParsingContext.JSDocRecordMembers, parseJSDocRecordMember);
        checkForTrailingComma(result.members);
        parseExpected(SyntaxKind.CloseBraceToken);
        return finishNode(result);
    }
    function parseJSDocRecordMember() {
        var result = createNode(SyntaxKind.JSDocRecordMember);
        result.name = parseSimplePropertyName();
        if (token === SyntaxKind.ColonToken) {
            nextToken();
            result.type = parseJSDocType();
        }
        return finishNode(result);
    }
    function parseJSDocNonNullableType() {
        var result = createNode(SyntaxKind.JSDocNonNullableType);
        nextToken();
        result.type = parseJSDocType();
        return finishNode(result);
    }
    function parseJSDocTupleType() {
        var result = createNode(SyntaxKind.JSDocTupleType);
        nextToken();
        result.types = parseDelimitedList(ParsingContext.JSDocTupleTypes, parseJSDocType);
        checkForTrailingComma(result.types);
        parseExpected(SyntaxKind.CloseBracketToken);
        return finishNode(result);
    }
    function checkForTrailingComma(list) {
        if (parseDiagnostics.length === 0 && list.hasTrailingComma) {
            var start = list.end - ",".length;
            parseErrorAtPosition(start, ",".length, Diagnostics.Trailing_comma_not_allowed);
        }
    }
    function parseJSDocUnionType() {
        var result = createNode(SyntaxKind.JSDocUnionType);
        nextToken();
        result.types = parseJSDocTypeList(parseJSDocType());
        parseExpected(SyntaxKind.CloseParenToken);
        return finishNode(result);
    }
    function parseJSDocTypeList(firstType) {
        Debug.assert(!!firstType);
        var types = [];
        types.pos = firstType.pos;
        types.push(firstType);
        while (parseOptional(SyntaxKind.BarToken)) {
            types.push(parseJSDocType());
        }
        types.end = scanner.getStartPos();
        return types;
    }
    function parseJSDocAllType() {
        var result = createNode(SyntaxKind.JSDocAllType);
        nextToken();
        return finishNode(result);
    }
    function parseJSDocUnknownOrNullableType() {
        var pos = scanner.getStartPos();
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
            var result = createNode(SyntaxKind.JSDocUnknownType, pos);
            return finishNode(result);
        }
        else {
            var result = createNode(SyntaxKind.JSDocNullableType, pos);
            result.type = parseJSDocType();
            return finishNode(result);
        }
    }
    function parseIsolatedJSDocComment(content, start, length) {
        initializeState("file.js", content, ScriptTarget.Latest, /*_syntaxCursor:*/ undefined, ScriptKind.JS);
        sourceFile = { languageVariant: LanguageVariant.Standard, text: content };
        var jsDocComment = parseJSDocCommentWorker(start, length);
        var diagnostics = parseDiagnostics;
        clearState();
        return jsDocComment ? { jsDocComment: jsDocComment, diagnostics: diagnostics } : undefined;
    }
    JSDocParser.parseIsolatedJSDocComment = parseIsolatedJSDocComment;
    function parseJSDocComment(parent, start, length) {
        var saveToken = token;
        var saveParseDiagnosticsLength = parseDiagnostics.length;
        var saveParseErrorBeforeNextFinishedNode = parseErrorBeforeNextFinishedNode;
        var comment = parseJSDocCommentWorker(start, length);
        if (comment) {
            comment.parent = parent;
        }
        token = saveToken;
        parseDiagnostics.length = saveParseDiagnosticsLength;
        parseErrorBeforeNextFinishedNode = saveParseErrorBeforeNextFinishedNode;
        return comment;
    }
    JSDocParser.parseJSDocComment = parseJSDocComment;
    function parseJSDocCommentWorker(start, length) {
        var content = sourceText;
        start = start || 0;
        var end = length === undefined ? content.length : start + length;
        length = end - start;
        Debug.assert(start >= 0);
        Debug.assert(start <= end);
        Debug.assert(end <= content.length);
        var tags;
        var result;
        // Check for /** (JSDoc opening part)
        if (content.charCodeAt(start) === CharacterCodes.slash &&
            content.charCodeAt(start + 1) === CharacterCodes.asterisk &&
            content.charCodeAt(start + 2) === CharacterCodes.asterisk &&
            content.charCodeAt(start + 3) !== CharacterCodes.asterisk) {
            // + 3 for leading /**, - 5 in total for /** */
            scanner.scanRange(start + 3, length - 5, function () {
                // Initially we can parse out a tag.  We also have seen a starting asterisk.
                // This is so that /** * @type */ doesn't parse.
                var canParseTag = true;
                var seenAsterisk = true;
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
        function createJSDocComment() {
            if (!tags) {
                return undefined;
            }
            var result = createNode(SyntaxKind.JSDocComment, start);
            result.tags = tags;
            return finishNode(result, end);
        }
        function skipWhitespace() {
            while (token === SyntaxKind.WhitespaceTrivia || token === SyntaxKind.NewLineTrivia) {
                nextJSDocToken();
            }
        }
        function parseTag() {
            Debug.assert(token === SyntaxKind.AtToken);
            var atToken = createNode(SyntaxKind.AtToken, scanner.getTokenPos());
            atToken.end = scanner.getTextPos();
            nextJSDocToken();
            var tagName = parseJSDocIdentifierName();
            if (!tagName) {
                return;
            }
            var tag = handleTag(atToken, tagName) || handleUnknownTag(atToken, tagName);
            addTag(tag);
        }
        function handleTag(atToken, tagName) {
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
        function handleUnknownTag(atToken, tagName) {
            var result = createNode(SyntaxKind.JSDocTag, atToken.pos);
            result.atToken = atToken;
            result.tagName = tagName;
            return finishNode(result);
        }
        function addTag(tag) {
            if (tag) {
                if (!tags) {
                    tags = [];
                    tags.pos = tag.pos;
                }
                tags.push(tag);
                tags.end = tag.end;
            }
        }
        function tryParseTypeExpression() {
            if (token !== SyntaxKind.OpenBraceToken) {
                return undefined;
            }
            var typeExpression = parseJSDocTypeExpression();
            return typeExpression;
        }
        function handleParamTag(atToken, tagName) {
            var typeExpression = tryParseTypeExpression();
            skipWhitespace();
            var name;
            var isBracketed;
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
            var preName, postName;
            if (typeExpression) {
                postName = name;
            }
            else {
                preName = name;
            }
            if (!typeExpression) {
                typeExpression = tryParseTypeExpression();
            }
            var result = createNode(SyntaxKind.JSDocParameterTag, atToken.pos);
            result.atToken = atToken;
            result.tagName = tagName;
            result.preParameterName = preName;
            result.typeExpression = typeExpression;
            result.postParameterName = postName;
            result.isBracketed = isBracketed;
            return finishNode(result);
        }
        function handleReturnTag(atToken, tagName) {
            if (forEach(tags, function (t) { return t.kind === SyntaxKind.JSDocReturnTag; })) {
                parseErrorAtPosition(tagName.pos, scanner.getTokenPos() - tagName.pos, Diagnostics._0_tag_already_specified, tagName.text);
            }
            var result = createNode(SyntaxKind.JSDocReturnTag, atToken.pos);
            result.atToken = atToken;
            result.tagName = tagName;
            result.typeExpression = tryParseTypeExpression();
            return finishNode(result);
        }
        function handleTypeTag(atToken, tagName) {
            if (forEach(tags, function (t) { return t.kind === SyntaxKind.JSDocTypeTag; })) {
                parseErrorAtPosition(tagName.pos, scanner.getTokenPos() - tagName.pos, Diagnostics._0_tag_already_specified, tagName.text);
            }
            var result = createNode(SyntaxKind.JSDocTypeTag, atToken.pos);
            result.atToken = atToken;
            result.tagName = tagName;
            result.typeExpression = tryParseTypeExpression();
            return finishNode(result);
        }
        function handlePropertyTag(atToken, tagName) {
            var typeExpression = tryParseTypeExpression();
            skipWhitespace();
            var name = parseJSDocIdentifierName();
            if (!name) {
                parseErrorAtPosition(scanner.getStartPos(), /*length*/ 0, Diagnostics.Identifier_expected);
                return undefined;
            }
            var result = createNode(SyntaxKind.JSDocPropertyTag, atToken.pos);
            result.atToken = atToken;
            result.tagName = tagName;
            result.name = name;
            result.typeExpression = typeExpression;
            return finishNode(result);
        }
        function handleTypedefTag(atToken, tagName) {
            var typeExpression = tryParseTypeExpression();
            skipWhitespace();
            var typedefTag = createNode(SyntaxKind.JSDocTypedefTag, atToken.pos);
            typedefTag.atToken = atToken;
            typedefTag.tagName = tagName;
            typedefTag.name = parseJSDocIdentifierName();
            typedefTag.typeExpression = typeExpression;
            if (typeExpression) {
                if (typeExpression.type.kind === SyntaxKind.JSDocTypeReference) {
                    var jsDocTypeReference = typeExpression.type;
                    if (jsDocTypeReference.name.kind === SyntaxKind.Identifier) {
                        var name_1 = jsDocTypeReference.name;
                        if (name_1.text === "Object") {
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
            function scanChildTags() {
                var jsDocTypeLiteral = createNode(SyntaxKind.JSDocTypeLiteral, scanner.getStartPos());
                var resumePos = scanner.getStartPos();
                var canParseTag = true;
                var seenAsterisk = false;
                var parentTagTerminated = false;
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
        function tryParseChildTag(parentTag) {
            Debug.assert(token === SyntaxKind.AtToken);
            var atToken = createNode(SyntaxKind.AtToken, scanner.getStartPos());
            atToken.end = scanner.getTextPos();
            nextJSDocToken();
            var tagName = parseJSDocIdentifierName();
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
                        parentTag.jsDocPropertyTags = [];
                    }
                    var propertyTag = handlePropertyTag(atToken, tagName);
                    parentTag.jsDocPropertyTags.push(propertyTag);
                    return true;
            }
            return false;
        }
        function handleTemplateTag(atToken, tagName) {
            if (forEach(tags, function (t) { return t.kind === SyntaxKind.JSDocTemplateTag; })) {
                parseErrorAtPosition(tagName.pos, scanner.getTokenPos() - tagName.pos, Diagnostics._0_tag_already_specified, tagName.text);
            }
            // Type parameter list looks like '@template T,U,V'
            var typeParameters = [];
            typeParameters.pos = scanner.getStartPos();
            while (true) {
                var name_2 = parseJSDocIdentifierName();
                if (!name_2) {
                    parseErrorAtPosition(scanner.getStartPos(), 0, Diagnostics.Identifier_expected);
                    return undefined;
                }
                var typeParameter = createNode(SyntaxKind.TypeParameter, name_2.pos);
                typeParameter.name = name_2;
                finishNode(typeParameter);
                typeParameters.push(typeParameter);
                if (token === SyntaxKind.CommaToken) {
                    nextJSDocToken();
                }
                else {
                    break;
                }
            }
            var result = createNode(SyntaxKind.JSDocTemplateTag, atToken.pos);
            result.atToken = atToken;
            result.tagName = tagName;
            result.typeParameters = typeParameters;
            finishNode(result);
            typeParameters.end = result.end;
            return result;
        }
        function nextJSDocToken() {
            return token = scanner.scanJSDocToken();
        }
        function parseJSDocIdentifierName() {
            return createJSDocIdentifier(tokenIsIdentifierOrKeyword(token));
        }
        function createJSDocIdentifier(isIdentifier) {
            if (!isIdentifier) {
                parseErrorAtCurrentToken(Diagnostics.Identifier_expected);
                return undefined;
            }
            var pos = scanner.getTokenPos();
            var end = scanner.getTextPos();
            var result = createNode(SyntaxKind.Identifier, pos);
            result.text = content.substring(pos, end);
            finishNode(result, end);
            nextJSDocToken();
            return result;
        }
    }
    JSDocParser.parseJSDocCommentWorker = parseJSDocCommentWorker;
})(JSDocParser = exports.JSDocParser || (exports.JSDocParser = {}));
