/// <reference path="utilities.ts"/>
/// <reference path="scanner.ts"/>
var ts;
(function (ts) {
    /* @internal */ ts.parseTime = 0;
    var Parser;
    (function (Parser) {
        // Share a single scanner across all calls to parse a source file.  This helps speed things
        // up by avoiding the cost of creating/compiling scanners over and over again.
        var scanner = ts.createScanner(ScriptTarget.Latest, /*skipTrivia*/ true);
        var disallowInAndDecoratorContext = NodeFlags.DisallowInContext | NodeFlags.DecoratorContext;
        // capture constructors in 'initializeState' to avoid null checks
        var NodeConstructor;
        var SourceFileConstructor;
        var sourceFile;
        var parseDiagnostics;
        var syntaxCursor;
        var token;
        var sourceText;
        var nodeCount;
        var identifiers;
        var identifierCount;
        var parsingContext;
        // Flags that dictate what parsing context we're in.  For example:
        // Whether or not we are in strict parsing mode.  All that changes in strict parsing mode is
        // that some tokens that would be considered identifiers may be considered keywords.
        //
        // When adding more parser context flags, consider which is the more common case that the
        // flag will be in.  This should be the 'false' state for that flag.  The reason for this is
        // that we don't store data in our nodes unless the value is in the *non-default* state.  So,
        // for example, more often than code 'allows-in' (or doesn't 'disallow-in').  We opt for
        // 'disallow-in' set to 'false'.  Otherwise, if we had 'allowsIn' set to 'true', then almost
        // all nodes would need extra state on them to store this info.
        //
        // Note:  'allowIn' and 'allowYield' track 1:1 with the [in] and [yield] concepts in the ES6
        // grammar specification.
        //
        // An important thing about these context concepts.  By default they are effectively inherited
        // while parsing through every grammar production.  i.e. if you don't change them, then when
        // you parse a sub-production, it will have the same context values as the parent production.
        // This is great most of the time.  After all, consider all the 'expression' grammar productions
        // and how nearly all of them pass along the 'in' and 'yield' context values:
        //
        // EqualityExpression[In, Yield] :
        //      RelationalExpression[?In, ?Yield]
        //      EqualityExpression[?In, ?Yield] == RelationalExpression[?In, ?Yield]
        //      EqualityExpression[?In, ?Yield] != RelationalExpression[?In, ?Yield]
        //      EqualityExpression[?In, ?Yield] === RelationalExpression[?In, ?Yield]
        //      EqualityExpression[?In, ?Yield] !== RelationalExpression[?In, ?Yield]
        //
        // Where you have to be careful is then understanding what the points are in the grammar
        // where the values are *not* passed along.  For example:
        //
        // SingleNameBinding[Yield,GeneratorParameter]
        //      [+GeneratorParameter]BindingIdentifier[Yield] Initializer[In]opt
        //      [~GeneratorParameter]BindingIdentifier[?Yield]Initializer[In, ?Yield]opt
        //
        // Here this is saying that if the GeneratorParameter context flag is set, that we should
        // explicitly set the 'yield' context flag to false before calling into the BindingIdentifier
        // and we should explicitly unset the 'yield' context flag before calling into the Initializer.
        // production.  Conversely, if the GeneratorParameter context flag is not set, then we
        // should leave the 'yield' context flag alone.
        //
        // Getting this all correct is tricky and requires careful reading of the grammar to
        // understand when these values should be changed versus when they should be inherited.
        //
        // Note: it should not be necessary to save/restore these flags during speculative/lookahead
        // parsing.  These context flags are naturally stored and restored through normal recursive
        // descent parsing and unwinding.
        var contextFlags;
        // Whether or not we've had a parse error since creating the last AST node.  If we have
        // encountered an error, it will be stored on the next AST node we create.  Parse errors
        // can be broken down into three categories:
        //
        // 1) An error that occurred during scanning.  For example, an unterminated literal, or a
        //    character that was completely not understood.
        //
        // 2) A token was expected, but was not present.  This type of error is commonly produced
        //    by the 'parseExpected' function.
        //
        // 3) A token was present that no parsing function was able to consume.  This type of error
        //    only occurs in the 'abortParsingListOrMoveToNextToken' function when the parser
        //    decides to skip the token.
        //
        // In all of these cases, we want to mark the next node as having had an error before it.
        // With this mark, we can know in incremental settings if this node can be reused, or if
        // we have to reparse it.  If we don't keep this information around, we may just reuse the
        // node.  in that event we would then not produce the same errors as we did before, causing
        // significant confusion problems.
        //
        // Note: it is necessary that this value be saved/restored during speculative/lookahead
        // parsing.  During lookahead parsing, we will often create a node.  That node will have
        // this value attached, and then this value will be set back to 'false'.  If we decide to
        // rewind, we must get back to the same value we had prior to the lookahead.
        //
        // Note: any errors at the end of the file that do not precede a regular node, should get
        // attached to the EOF token.
        var parseErrorBeforeNextFinishedNode = false;
        function parseSourceFile(fileName, _sourceText, languageVersion, _syntaxCursor, setParentNodes, scriptKind) {
            scriptKind = ensureScriptKind(fileName, scriptKind);
            initializeState(fileName, _sourceText, languageVersion, _syntaxCursor, scriptKind);
            var result = parseSourceFileWorker(fileName, languageVersion, setParentNodes, scriptKind);
            clearState();
            return result;
        }
        Parser.parseSourceFile = parseSourceFile;
        function getLanguageVariant(scriptKind) {
            // .tsx and .jsx files are treated as jsx language variant.
            return scriptKind === ScriptKind.TSX || scriptKind === ScriptKind.JSX || scriptKind === ScriptKind.JS ? LanguageVariant.JSX : LanguageVariant.Standard;
        }
        function initializeState(fileName, _sourceText, languageVersion, _syntaxCursor, scriptKind) {
            NodeConstructor = objectAllocator.getNodeConstructor();
            SourceFileConstructor = objectAllocator.getSourceFileConstructor();
            sourceText = _sourceText;
            syntaxCursor = _syntaxCursor;
            parseDiagnostics = [];
            parsingContext = 0;
            identifiers = {};
            identifierCount = 0;
            nodeCount = 0;
            contextFlags = scriptKind === ScriptKind.JS || scriptKind === ScriptKind.JSX ? NodeFlags.JavaScriptFile : NodeFlags.None;
            parseErrorBeforeNextFinishedNode = false;
            // Initialize and prime the scanner before parsing the source elements.
            scanner.setText(sourceText);
            scanner.setOnError(scanError);
            scanner.setScriptTarget(languageVersion);
            scanner.setLanguageVariant(getLanguageVariant(scriptKind));
        }
        function clearState() {
            // Clear out the text the scanner is pointing at, so it doesn't keep anything alive unnecessarily.
            scanner.setText("");
            scanner.setOnError(undefined);
            // Clear any data.  We don't want to accidentally hold onto it for too long.
            parseDiagnostics = undefined;
            sourceFile = undefined;
            identifiers = undefined;
            syntaxCursor = undefined;
            sourceText = undefined;
        }
        function parseSourceFileWorker(fileName, languageVersion, setParentNodes, scriptKind) {
            sourceFile = createSourceFile(fileName, languageVersion, scriptKind);
            sourceFile.flags = contextFlags;
            // Prime the scanner.
            token = nextToken();
            processReferenceComments(sourceFile);
            sourceFile.statements = parseList(0 /* SourceElements */, parseStatement);
            Debug.assert(token === SyntaxKind.EndOfFileToken);
            sourceFile.endOfFileToken = parseTokenNode();
            setExternalModuleIndicator(sourceFile);
            sourceFile.nodeCount = nodeCount;
            sourceFile.identifierCount = identifierCount;
            sourceFile.identifiers = identifiers;
            sourceFile.parseDiagnostics = parseDiagnostics;
            if (setParentNodes) {
                fixupParentReferences(sourceFile);
            }
            return sourceFile;
        }
        function addJSDocComment(node) {
            if (contextFlags & NodeFlags.JavaScriptFile) {
                var comments = getLeadingCommentRangesOfNode(node, sourceFile);
                if (comments) {
                    for (var _i = 0, comments_1 = comments; _i < comments_1.length; _i++) {
                        var comment = comments_1[_i];
                        var jsDocComment = JSDocParser.parseJSDocComment(node, comment.pos, comment.end - comment.pos);
                        if (!jsDocComment) {
                            continue;
                        }
                        if (!node.jsDocComments) {
                            node.jsDocComments = [];
                        }
                        node.jsDocComments.push(jsDocComment);
                    }
                }
            }
            return node;
        }
        function fixupParentReferences(rootNode) {
            // normally parent references are set during binding. However, for clients that only need
            // a syntax tree, and no semantic features, then the binding process is an unnecessary
            // overhead.  This functions allows us to set all the parents, without all the expense of
            // binding.
            var parent = rootNode;
            forEachChild(rootNode, visitNode);
            return;
            function visitNode(n) {
                // walk down setting parents that differ from the parent we think it should be.  This
                // allows us to quickly bail out of setting parents for subtrees during incremental
                // parsing
                if (n.parent !== parent) {
                    n.parent = parent;
                    var saveParent = parent;
                    parent = n;
                    forEachChild(n, visitNode);
                    if (n.jsDocComments) {
                        for (var _i = 0, _a = n.jsDocComments; _i < _a.length; _i++) {
                            var jsDocComment = _a[_i];
                            jsDocComment.parent = n;
                            parent = jsDocComment;
                            forEachChild(jsDocComment, visitNode);
                        }
                    }
                    parent = saveParent;
                }
            }
        }
        Parser.fixupParentReferences = fixupParentReferences;
        function createSourceFile(fileName, languageVersion, scriptKind) {
            // code from createNode is inlined here so createNode won't have to deal with special case of creating source files
            // this is quite rare comparing to other nodes and createNode should be as fast as possible
            var sourceFile = new SourceFileConstructor(SyntaxKind.SourceFile, /*pos*/ 0, /* end */ sourceText.length);
            nodeCount++;
            sourceFile.text = sourceText;
            sourceFile.bindDiagnostics = [];
            sourceFile.languageVersion = languageVersion;
            sourceFile.fileName = normalizePath(fileName);
            sourceFile.languageVariant = getLanguageVariant(scriptKind);
            sourceFile.isDeclarationFile = fileExtensionIs(sourceFile.fileName, ".d.ts");
            sourceFile.scriptKind = scriptKind;
            return sourceFile;
        }
        function setContextFlag(val, flag) {
            if (val) {
                contextFlags |= flag;
            }
            else {
                contextFlags &= ~flag;
            }
        }
        function setDisallowInContext(val) {
            setContextFlag(val, NodeFlags.DisallowInContext);
        }
        function setYieldContext(val) {
            setContextFlag(val, NodeFlags.YieldContext);
        }
        function setDecoratorContext(val) {
            setContextFlag(val, NodeFlags.DecoratorContext);
        }
        function setAwaitContext(val) {
            setContextFlag(val, NodeFlags.AwaitContext);
        }
        function doOutsideOfContext(context, func) {
            // contextFlagsToClear will contain only the context flags that are
            // currently set that we need to temporarily clear
            // We don't just blindly reset to the previous flags to ensure
            // that we do not mutate cached flags for the incremental
            // parser (ThisNodeHasError, ThisNodeOrAnySubNodesHasError, and
            // HasAggregatedChildData).
            var contextFlagsToClear = context & contextFlags;
            if (contextFlagsToClear) {
                // clear the requested context flags
                setContextFlag(/*val*/ false, contextFlagsToClear);
                var result = func();
                // restore the context flags we just cleared
                setContextFlag(/*val*/ true, contextFlagsToClear);
                return result;
            }
            // no need to do anything special as we are not in any of the requested contexts
            return func();
        }
        function doInsideOfContext(context, func) {
            // contextFlagsToSet will contain only the context flags that
            // are not currently set that we need to temporarily enable.
            // We don't just blindly reset to the previous flags to ensure
            // that we do not mutate cached flags for the incremental
            // parser (ThisNodeHasError, ThisNodeOrAnySubNodesHasError, and
            // HasAggregatedChildData).
            var contextFlagsToSet = context & ~contextFlags;
            if (contextFlagsToSet) {
                // set the requested context flags
                setContextFlag(/*val*/ true, contextFlagsToSet);
                var result = func();
                // reset the context flags we just set
                setContextFlag(/*val*/ false, contextFlagsToSet);
                return result;
            }
            // no need to do anything special as we are already in all of the requested contexts
            return func();
        }
        function allowInAnd(func) {
            return doOutsideOfContext(NodeFlags.DisallowInContext, func);
        }
        function disallowInAnd(func) {
            return doInsideOfContext(NodeFlags.DisallowInContext, func);
        }
        function doInYieldContext(func) {
            return doInsideOfContext(NodeFlags.YieldContext, func);
        }
        function doInDecoratorContext(func) {
            return doInsideOfContext(NodeFlags.DecoratorContext, func);
        }
        function doInAwaitContext(func) {
            return doInsideOfContext(NodeFlags.AwaitContext, func);
        }
        function doOutsideOfAwaitContext(func) {
            return doOutsideOfContext(NodeFlags.AwaitContext, func);
        }
        function doInYieldAndAwaitContext(func) {
            return doInsideOfContext(NodeFlags.YieldContext | NodeFlags.AwaitContext, func);
        }
        function inContext(flags) {
            return (contextFlags & flags) !== 0;
        }
        function inYieldContext() {
            return inContext(NodeFlags.YieldContext);
        }
        function inDisallowInContext() {
            return inContext(NodeFlags.DisallowInContext);
        }
        function inDecoratorContext() {
            return inContext(NodeFlags.DecoratorContext);
        }
        function inAwaitContext() {
            return inContext(NodeFlags.AwaitContext);
        }
        function parseErrorAtCurrentToken(message, arg0) {
            var start = scanner.getTokenPos();
            var length = scanner.getTextPos() - start;
            parseErrorAtPosition(start, length, message, arg0);
        }
        function parseErrorAtPosition(start, length, message, arg0) {
            // Don't report another error if it would just be at the same position as the last error.
            var lastError = lastOrUndefined(parseDiagnostics);
            if (!lastError || start !== lastError.start) {
                parseDiagnostics.push(createFileDiagnostic(sourceFile, start, length, message, arg0));
            }
            // Mark that we've encountered an error.  We'll set an appropriate bit on the next
            // node we finish so that it can't be reused incrementally.
            parseErrorBeforeNextFinishedNode = true;
        }
        function scanError(message, length) {
            var pos = scanner.getTextPos();
            parseErrorAtPosition(pos, length || 0, message);
        }
        function getNodePos() {
            return scanner.getStartPos();
        }
        function getNodeEnd() {
            return scanner.getStartPos();
        }
        function nextToken() {
            return token = scanner.scan();
        }
        function reScanGreaterToken() {
            return token = scanner.reScanGreaterToken();
        }
        function reScanSlashToken() {
            return token = scanner.reScanSlashToken();
        }
        function reScanTemplateToken() {
            return token = scanner.reScanTemplateToken();
        }
        function scanJsxIdentifier() {
            return token = scanner.scanJsxIdentifier();
        }
        function scanJsxText() {
            return token = scanner.scanJsxToken();
        }
        function speculationHelper(callback, isLookAhead) {
            // Keep track of the state we'll need to rollback to if lookahead fails (or if the
            // caller asked us to always reset our state).
            var saveToken = token;
            var saveParseDiagnosticsLength = parseDiagnostics.length;
            var saveParseErrorBeforeNextFinishedNode = parseErrorBeforeNextFinishedNode;
            // Note: it is not actually necessary to save/restore the context flags here.  That's
            // because the saving/restoring of these flags happens naturally through the recursive
            // descent nature of our parser.  However, we still store this here just so we can
            // assert that that invariant holds.
            var saveContextFlags = contextFlags;
            // If we're only looking ahead, then tell the scanner to only lookahead as well.
            // Otherwise, if we're actually speculatively parsing, then tell the scanner to do the
            // same.
            var result = isLookAhead
                ? scanner.lookAhead(callback)
                : scanner.tryScan(callback);
            Debug.assert(saveContextFlags === contextFlags);
            // If our callback returned something 'falsy' or we're just looking ahead,
            // then unconditionally restore us to where we were.
            if (!result || isLookAhead) {
                token = saveToken;
                parseDiagnostics.length = saveParseDiagnosticsLength;
                parseErrorBeforeNextFinishedNode = saveParseErrorBeforeNextFinishedNode;
            }
            return result;
        }
        /** Invokes the provided callback then unconditionally restores the parser to the state it
         * was in immediately prior to invoking the callback.  The result of invoking the callback
         * is returned from this function.
         */
        function lookAhead(callback) {
            return speculationHelper(callback, /*isLookAhead*/ true);
        }
        /** Invokes the provided callback.  If the callback returns something falsy, then it restores
         * the parser to the state it was in immediately prior to invoking the callback.  If the
         * callback returns something truthy, then the parser state is not rolled back.  The result
         * of invoking the callback is returned from this function.
         */
        function tryParse(callback) {
            return speculationHelper(callback, /*isLookAhead*/ false);
        }
        // Ignore strict mode flag because we will report an error in type checker instead.
        function isIdentifier() {
            if (token === SyntaxKind.Identifier) {
                return true;
            }
            // If we have a 'yield' keyword, and we're in the [yield] context, then 'yield' is
            // considered a keyword and is not an identifier.
            if (token === SyntaxKind.YieldKeyword && inYieldContext()) {
                return false;
            }
            // If we have a 'await' keyword, and we're in the [Await] context, then 'await' is
            // considered a keyword and is not an identifier.
            if (token === SyntaxKind.AwaitKeyword && inAwaitContext()) {
                return false;
            }
            return token > SyntaxKind.LastReservedWord;
        }
        function parseOptional(t) {
            if (token === t) {
                nextToken();
                return true;
            }
            return false;
        }
        function parseOptionalToken(t) {
            if (token === t) {
                return parseTokenNode();
            }
            return undefined;
        }
        function parseExpectedToken(t, reportAtCurrentPosition, diagnosticMessage, arg0) {
            return parseOptionalToken(t) ||
                createMissingNode(t, reportAtCurrentPosition, diagnosticMessage, arg0);
        }
        function parseTokenNode() {
            var node = createNode(token);
            nextToken();
            return finishNode(node);
        }
        function createMissingNode(kind, reportAtCurrentPosition, diagnosticMessage, arg0) {
            if (reportAtCurrentPosition) {
                parseErrorAtPosition(scanner.getStartPos(), 0, diagnosticMessage, arg0);
            }
            else {
                parseErrorAtCurrentToken(diagnosticMessage, arg0);
            }
            var result = createNode(kind, scanner.getStartPos());
            result.text = "";
            return finishNode(result);
        }
        function parseIdentifierName() {
            return createIdentifier(tokenIsIdentifierOrKeyword(token));
        }
        function isLiteralPropertyName() {
            return tokenIsIdentifierOrKeyword(token) ||
                token === SyntaxKind.StringLiteral ||
                token === SyntaxKind.NumericLiteral;
        }
        function parseContextualModifier(t) {
            return token === t && tryParse(nextTokenCanFollowModifier);
        }
        function nextTokenIsOnSameLineAndCanFollowModifier() {
            nextToken();
            if (scanner.hasPrecedingLineBreak()) {
                return false;
            }
            return canFollowModifier();
        }
        function nextTokenCanFollowModifier() {
            if (token === SyntaxKind.ConstKeyword) {
                // 'const' is only a modifier if followed by 'enum'.
                return nextToken() === SyntaxKind.EnumKeyword;
            }
            if (token === SyntaxKind.ExportKeyword) {
                nextToken();
                if (token === SyntaxKind.DefaultKeyword) {
                    return lookAhead(nextTokenIsClassOrFunctionOrAsync);
                }
                return token !== SyntaxKind.AsteriskToken && token !== SyntaxKind.AsKeyword && token !== SyntaxKind.OpenBraceToken && canFollowModifier();
            }
            if (token === SyntaxKind.DefaultKeyword) {
                return nextTokenIsClassOrFunctionOrAsync();
            }
            if (token === SyntaxKind.StaticKeyword) {
                nextToken();
                return canFollowModifier();
            }
            return nextTokenIsOnSameLineAndCanFollowModifier();
        }
        function parseAnyContextualModifier() {
            return isModifierKind(token) && tryParse(nextTokenCanFollowModifier);
        }
        function canFollowModifier() {
            return token === SyntaxKind.OpenBracketToken
                || token === SyntaxKind.OpenBraceToken
                || token === SyntaxKind.AsteriskToken
                || token === SyntaxKind.DotDotDotToken
                || isLiteralPropertyName();
        }
        function nextTokenIsClassOrFunctionOrAsync() {
            nextToken();
            return token === SyntaxKind.ClassKeyword || token === SyntaxKind.FunctionKeyword || token === SyntaxKind.AsyncKeyword;
        }
        // True if positioned at the start of a list element
        function isListElement(parsingContext, inErrorRecovery) {
            var node = currentNode(parsingContext);
            if (node) {
                return true;
            }
            switch (parsingContext) {
                case 0 /* SourceElements */:
                case 1 /* BlockStatements */:
                case 3 /* SwitchClauseStatements */:
                    // If we're in error recovery, then we don't want to treat ';' as an empty statement.
                    // The problem is that ';' can show up in far too many contexts, and if we see one
                    // and assume it's a statement, then we may bail out inappropriately from whatever
                    // we're parsing.  For example, if we have a semicolon in the middle of a class, then
                    // we really don't want to assume the class is over and we're on a statement in the
                    // outer module.  We just want to consume and move on.
                    return !(token === SyntaxKind.SemicolonToken && inErrorRecovery) && isStartOfStatement();
                case 2 /* SwitchClauses */:
                    return token === SyntaxKind.CaseKeyword || token === SyntaxKind.DefaultKeyword;
                case 4 /* TypeMembers */:
                    return lookAhead(isTypeMemberStart);
                case 5 /* ClassMembers */:
                    // We allow semicolons as class elements (as specified by ES6) as long as we're
                    // not in error recovery.  If we're in error recovery, we don't want an errant
                    // semicolon to be treated as a class member (since they're almost always used
                    // for statements.
                    return lookAhead(isClassMemberStart) || (token === SyntaxKind.SemicolonToken && !inErrorRecovery);
                case 6 /* EnumMembers */:
                    // Include open bracket computed properties. This technically also lets in indexers,
                    // which would be a candidate for improved error reporting.
                    return token === SyntaxKind.OpenBracketToken || isLiteralPropertyName();
                case 12 /* ObjectLiteralMembers */:
                    return token === SyntaxKind.OpenBracketToken || token === SyntaxKind.AsteriskToken || isLiteralPropertyName();
                case 9 /* ObjectBindingElements */:
                    return token === SyntaxKind.OpenBracketToken || isLiteralPropertyName();
                case 7 /* HeritageClauseElement */:
                    // If we see { } then only consume it as an expression if it is followed by , or {
                    // That way we won't consume the body of a class in its heritage clause.
                    if (token === SyntaxKind.OpenBraceToken) {
                        return lookAhead(isValidHeritageClauseObjectLiteral);
                    }
                    if (!inErrorRecovery) {
                        return isStartOfLeftHandSideExpression() && !isHeritageClauseExtendsOrImplementsKeyword();
                    }
                    else {
                        // If we're in error recovery we tighten up what we're willing to match.
                        // That way we don't treat something like "this" as a valid heritage clause
                        // element during recovery.
                        return isIdentifier() && !isHeritageClauseExtendsOrImplementsKeyword();
                    }
                case 8 /* VariableDeclarations */:
                    return isIdentifierOrPattern();
                case 10 /* ArrayBindingElements */:
                    return token === SyntaxKind.CommaToken || token === SyntaxKind.DotDotDotToken || isIdentifierOrPattern();
                case 17 /* TypeParameters */:
                    return isIdentifier();
                case 11 /* ArgumentExpressions */:
                case 15 /* ArrayLiteralMembers */:
                    return token === SyntaxKind.CommaToken || token === SyntaxKind.DotDotDotToken || isStartOfExpression();
                case 16 /* Parameters */:
                    return isStartOfParameter();
                case 18 /* TypeArguments */:
                case 19 /* TupleElementTypes */:
                    return token === SyntaxKind.CommaToken || isStartOfType();
                case 20 /* HeritageClauses */:
                    return isHeritageClause();
                case 21 /* ImportOrExportSpecifiers */:
                    return tokenIsIdentifierOrKeyword(token);
                case 13 /* JsxAttributes */:
                    return tokenIsIdentifierOrKeyword(token) || token === SyntaxKind.OpenBraceToken;
                case 14 /* JsxChildren */:
                    return true;
                case 22 /* JSDocFunctionParameters */:
                case 23 /* JSDocTypeArguments */:
                case 25 /* JSDocTupleTypes */:
                    return JSDocParser.isJSDocType();
                case 24 /* JSDocRecordMembers */:
                    return isSimplePropertyName();
            }
            Debug.fail("Non-exhaustive case in 'isListElement'.");
        }
        function isValidHeritageClauseObjectLiteral() {
            Debug.assert(token === SyntaxKind.OpenBraceToken);
            if (nextToken() === SyntaxKind.CloseBraceToken) {
                // if we see  "extends {}" then only treat the {} as what we're extending (and not
                // the class body) if we have:
                //
                //      extends {} {
                //      extends {},
                //      extends {} extends
                //      extends {} implements
                var next = nextToken();
                return next === SyntaxKind.CommaToken || next === SyntaxKind.OpenBraceToken || next === SyntaxKind.ExtendsKeyword || next === SyntaxKind.ImplementsKeyword;
            }
            return true;
        }
        function nextTokenIsIdentifier() {
            nextToken();
            return isIdentifier();
        }
        function nextTokenIsIdentifierOrKeyword() {
            nextToken();
            return tokenIsIdentifierOrKeyword(token);
        }
        function isHeritageClauseExtendsOrImplementsKeyword() {
            if (token === SyntaxKind.ImplementsKeyword ||
                token === SyntaxKind.ExtendsKeyword) {
                return lookAhead(nextTokenIsStartOfExpression);
            }
            return false;
        }
        function nextTokenIsStartOfExpression() {
            nextToken();
            return isStartOfExpression();
        }
        // True if positioned at a list terminator
        function isListTerminator(kind) {
            if (token === SyntaxKind.EndOfFileToken) {
                // Being at the end of the file ends all lists.
                return true;
            }
            switch (kind) {
                case 1 /* BlockStatements */:
                case 2 /* SwitchClauses */:
                case 4 /* TypeMembers */:
                case 5 /* ClassMembers */:
                case 6 /* EnumMembers */:
                case 12 /* ObjectLiteralMembers */:
                case 9 /* ObjectBindingElements */:
                case 21 /* ImportOrExportSpecifiers */:
                    return token === SyntaxKind.CloseBraceToken;
                case 7 /* HeritageClauseElement */:
                    return token === SyntaxKind.OpenBraceToken || token === SyntaxKind.ExtendsKeyword || token === SyntaxKind.ImplementsKeyword;
                case 8 /* VariableDeclarations */:
                    return isVariableDeclaratorListTerminator();
                case 17 /* TypeParameters */:
                    // Tokens other than '>' are here for better error recovery
                    return token === SyntaxKind.GreaterThanToken || token === SyntaxKind.OpenParenToken || token === SyntaxKind.OpenBraceToken || token === SyntaxKind.ExtendsKeyword || token === SyntaxKind.ImplementsKeyword;
                case 11 /* ArgumentExpressions */:
                    // Tokens other than ')' are here for better error recovery
                    return token === SyntaxKind.CloseParenToken || token === SyntaxKind.SemicolonToken;
                case 15 /* ArrayLiteralMembers */:
                case 19 /* TupleElementTypes */:
                case 10 /* ArrayBindingElements */:
                    return token === SyntaxKind.CloseBracketToken;
                case 16 /* Parameters */:
                    // Tokens other than ')' and ']' (the latter for index signatures) are here for better error recovery
                    return token === SyntaxKind.CloseParenToken || token === SyntaxKind.CloseBracketToken /*|| token === SyntaxKind.OpenBraceToken*/;
                case 18 /* TypeArguments */:
                    // Tokens other than '>' are here for better error recovery
                    return token === SyntaxKind.GreaterThanToken || token === SyntaxKind.OpenParenToken;
                case 20 /* HeritageClauses */:
                    return token === SyntaxKind.OpenBraceToken || token === SyntaxKind.CloseBraceToken;
                case 13 /* JsxAttributes */:
                    return token === SyntaxKind.GreaterThanToken || token === SyntaxKind.SlashToken;
                case 14 /* JsxChildren */:
                    return token === SyntaxKind.LessThanToken && lookAhead(nextTokenIsSlash);
                case 22 /* JSDocFunctionParameters */:
                    return token === SyntaxKind.CloseParenToken || token === SyntaxKind.ColonToken || token === SyntaxKind.CloseBraceToken;
                case 23 /* JSDocTypeArguments */:
                    return token === SyntaxKind.GreaterThanToken || token === SyntaxKind.CloseBraceToken;
                case 25 /* JSDocTupleTypes */:
                    return token === SyntaxKind.CloseBracketToken || token === SyntaxKind.CloseBraceToken;
                case 24 /* JSDocRecordMembers */:
                    return token === SyntaxKind.CloseBraceToken;
            }
        }
        function isVariableDeclaratorListTerminator() {
            // If we can consume a semicolon (either explicitly, or with ASI), then consider us done
            // with parsing the list of  variable declarators.
            if (canParseSemicolon()) {
                return true;
            }
            // in the case where we're parsing the variable declarator of a 'for-in' statement, we
            // are done if we see an 'in' keyword in front of us. Same with for-of
            if (isInOrOfKeyword(token)) {
                return true;
            }
            // ERROR RECOVERY TWEAK:
            // For better error recovery, if we see an '=>' then we just stop immediately.  We've got an
            // arrow function here and it's going to be very unlikely that we'll resynchronize and get
            // another variable declaration.
            if (token === SyntaxKind.EqualsGreaterThanToken) {
                return true;
            }
            // Keep trying to parse out variable declarators.
            return false;
        }
        // True if positioned at element or terminator of the current list or any enclosing list
        function isInSomeParsingContext() {
            for (var kind = 0; kind < 26 /* Count */; kind++) {
                if (parsingContext & (1 << kind)) {
                    if (isListElement(kind, /*inErrorRecovery*/ true) || isListTerminator(kind)) {
                        return true;
                    }
                }
            }
            return false;
        }
        // Parses a list of elements
        function parseList(kind, parseElement) {
            var saveParsingContext = parsingContext;
            parsingContext |= 1 << kind;
            var result = [];
            result.pos = getNodePos();
            while (!isListTerminator(kind)) {
                if (isListElement(kind, /*inErrorRecovery*/ false)) {
                    var element = parseListElement(kind, parseElement);
                    result.push(element);
                    continue;
                }
                if (abortParsingListOrMoveToNextToken(kind)) {
                    break;
                }
            }
            result.end = getNodeEnd();
            parsingContext = saveParsingContext;
            return result;
        }
        function parseListElement(parsingContext, parseElement) {
            var node = currentNode(parsingContext);
            if (node) {
                return consumeNode(node);
            }
            return parseElement();
        }
        function currentNode(parsingContext) {
            // If there is an outstanding parse error that we've encountered, but not attached to
            // some node, then we cannot get a node from the old source tree.  This is because we
            // want to mark the next node we encounter as being unusable.
            //
            // Note: This may be too conservative.  Perhaps we could reuse the node and set the bit
            // on it (or its leftmost child) as having the error.  For now though, being conservative
            // is nice and likely won't ever affect perf.
            if (parseErrorBeforeNextFinishedNode) {
                return undefined;
            }
            if (!syntaxCursor) {
                // if we don't have a cursor, we could never return a node from the old tree.
                return undefined;
            }
            var node = syntaxCursor.currentNode(scanner.getStartPos());
            // Can't reuse a missing node.
            if (nodeIsMissing(node)) {
                return undefined;
            }
            // Can't reuse a node that intersected the change range.
            if (node.intersectsChange) {
                return undefined;
            }
            // Can't reuse a node that contains a parse error.  This is necessary so that we
            // produce the same set of errors again.
            if (containsParseError(node)) {
                return undefined;
            }
            // We can only reuse a node if it was parsed under the same strict mode that we're
            // currently in.  i.e. if we originally parsed a node in non-strict mode, but then
            // the user added 'using strict' at the top of the file, then we can't use that node
            // again as the presence of strict mode may cause us to parse the tokens in the file
            // differently.
            //
            // Note: we *can* reuse tokens when the strict mode changes.  That's because tokens
            // are unaffected by strict mode.  It's just the parser will decide what to do with it
            // differently depending on what mode it is in.
            //
            // This also applies to all our other context flags as well.
            var nodeContextFlags = node.flags & NodeFlags.ContextFlags;
            if (nodeContextFlags !== contextFlags) {
                return undefined;
            }
            // Ok, we have a node that looks like it could be reused.  Now verify that it is valid
            // in the current list parsing context that we're currently at.
            if (!canReuseNode(node, parsingContext)) {
                return undefined;
            }
            return node;
        }
        function consumeNode(node) {
            // Move the scanner so it is after the node we just consumed.
            scanner.setTextPos(node.end);
            nextToken();
            return node;
        }
        function canReuseNode(node, parsingContext) {
            switch (parsingContext) {
                case 5 /* ClassMembers */:
                    return isReusableClassMember(node);
                case 2 /* SwitchClauses */:
                    return isReusableSwitchClause(node);
                case 0 /* SourceElements */:
                case 1 /* BlockStatements */:
                case 3 /* SwitchClauseStatements */:
                    return isReusableStatement(node);
                case 6 /* EnumMembers */:
                    return isReusableEnumMember(node);
                case 4 /* TypeMembers */:
                    return isReusableTypeMember(node);
                case 8 /* VariableDeclarations */:
                    return isReusableVariableDeclaration(node);
                case 16 /* Parameters */:
                    return isReusableParameter(node);
                // Any other lists we do not care about reusing nodes in.  But feel free to add if
                // you can do so safely.  Danger areas involve nodes that may involve speculative
                // parsing.  If speculative parsing is involved with the node, then the range the
                // parser reached while looking ahead might be in the edited range (see the example
                // in canReuseVariableDeclaratorNode for a good case of this).
                case 20 /* HeritageClauses */:
                // This would probably be safe to reuse.  There is no speculative parsing with
                // heritage clauses.
                case 17 /* TypeParameters */:
                // This would probably be safe to reuse.  There is no speculative parsing with
                // type parameters.  Note that that's because type *parameters* only occur in
                // unambiguous *type* contexts.  While type *arguments* occur in very ambiguous
                // *expression* contexts.
                case 19 /* TupleElementTypes */:
                // This would probably be safe to reuse.  There is no speculative parsing with
                // tuple types.
                // Technically, type argument list types are probably safe to reuse.  While
                // speculative parsing is involved with them (since type argument lists are only
                // produced from speculative parsing a < as a type argument list), we only have
                // the types because speculative parsing succeeded.  Thus, the lookahead never
                // went past the end of the list and rewound.
                case 18 /* TypeArguments */:
                // Note: these are almost certainly not safe to ever reuse.  Expressions commonly
                // need a large amount of lookahead, and we should not reuse them as they may
                // have actually intersected the edit.
                case 11 /* ArgumentExpressions */:
                // This is not safe to reuse for the same reason as the 'AssignmentExpression'
                // cases.  i.e. a property assignment may end with an expression, and thus might
                // have lookahead far beyond it's old node.
                case 12 /* ObjectLiteralMembers */:
                // This is probably not safe to reuse.  There can be speculative parsing with
                // type names in a heritage clause.  There can be generic names in the type
                // name list, and there can be left hand side expressions (which can have type
                // arguments.)
                case 7 /* HeritageClauseElement */:
                // Perhaps safe to reuse, but it's unlikely we'd see more than a dozen attributes
                // on any given element. Same for children.
                case 13 /* JsxAttributes */:
                case 14 /* JsxChildren */:
            }
            return false;
        }
        function isReusableClassMember(node) {
            if (node) {
                switch (node.kind) {
                    case SyntaxKind.Constructor:
                    case SyntaxKind.IndexSignature:
                    case SyntaxKind.GetAccessor:
                    case SyntaxKind.SetAccessor:
                    case SyntaxKind.PropertyDeclaration:
                    case SyntaxKind.SemicolonClassElement:
                        return true;
                    case SyntaxKind.MethodDeclaration:
                        // Method declarations are not necessarily reusable.  An object-literal
                        // may have a method calls "constructor(...)" and we must reparse that
                        // into an actual .ConstructorDeclaration.
                        var methodDeclaration = node;
                        var nameIsConstructor = methodDeclaration.name.kind === SyntaxKind.Identifier &&
                            methodDeclaration.name.originalKeywordKind === SyntaxKind.ConstructorKeyword;
                        return !nameIsConstructor;
                }
            }
            return false;
        }
        function isReusableSwitchClause(node) {
            if (node) {
                switch (node.kind) {
                    case SyntaxKind.CaseClause:
                    case SyntaxKind.DefaultClause:
                        return true;
                }
            }
            return false;
        }
        function isReusableStatement(node) {
            if (node) {
                switch (node.kind) {
                    case SyntaxKind.FunctionDeclaration:
                    case SyntaxKind.VariableStatement:
                    case SyntaxKind.Block:
                    case SyntaxKind.IfStatement:
                    case SyntaxKind.ExpressionStatement:
                    case SyntaxKind.ThrowStatement:
                    case SyntaxKind.ReturnStatement:
                    case SyntaxKind.SwitchStatement:
                    case SyntaxKind.BreakStatement:
                    case SyntaxKind.ContinueStatement:
                    case SyntaxKind.ForInStatement:
                    case SyntaxKind.ForOfStatement:
                    case SyntaxKind.ForStatement:
                    case SyntaxKind.WhileStatement:
                    case SyntaxKind.WithStatement:
                    case SyntaxKind.EmptyStatement:
                    case SyntaxKind.TryStatement:
                    case SyntaxKind.LabeledStatement:
                    case SyntaxKind.DoStatement:
                    case SyntaxKind.DebuggerStatement:
                    case SyntaxKind.ImportDeclaration:
                    case SyntaxKind.ImportEqualsDeclaration:
                    case SyntaxKind.ExportDeclaration:
                    case SyntaxKind.ExportAssignment:
                    case SyntaxKind.ModuleDeclaration:
                    case SyntaxKind.ClassDeclaration:
                    case SyntaxKind.InterfaceDeclaration:
                    case SyntaxKind.EnumDeclaration:
                    case SyntaxKind.TypeAliasDeclaration:
                        return true;
                }
            }
            return false;
        }
        function isReusableEnumMember(node) {
            return node.kind === SyntaxKind.EnumMember;
        }
        function isReusableTypeMember(node) {
            if (node) {
                switch (node.kind) {
                    case SyntaxKind.ConstructSignature:
                    case SyntaxKind.MethodSignature:
                    case SyntaxKind.IndexSignature:
                    case SyntaxKind.PropertySignature:
                    case SyntaxKind.CallSignature:
                        return true;
                }
            }
            return false;
        }
        function isReusableVariableDeclaration(node) {
            if (node.kind !== SyntaxKind.VariableDeclaration) {
                return false;
            }
            // Very subtle incremental parsing bug.  Consider the following code:
            //
            //      let v = new List < A, B
            //
            // This is actually legal code.  It's a list of variable declarators "v = new List<A"
            // on one side and "B" on the other. If you then change that to:
            //
            //      let v = new List < A, B >()
            //
            // then we have a problem.  "v = new List<A" doesn't intersect the change range, so we
            // start reparsing at "B" and we completely fail to handle this properly.
            //
            // In order to prevent this, we do not allow a variable declarator to be reused if it
            // has an initializer.
            var variableDeclarator = node;
            return variableDeclarator.initializer === undefined;
        }
        function isReusableParameter(node) {
            if (node.kind !== SyntaxKind.Parameter) {
                return false;
            }
            // See the comment in isReusableVariableDeclaration for why we do this.
            var parameter = node;
            return parameter.initializer === undefined;
        }
        // Returns true if we should abort parsing.
        function abortParsingListOrMoveToNextToken(kind) {
            parseErrorAtCurrentToken(parsingContextErrors(kind));
            if (isInSomeParsingContext()) {
                return true;
            }
            nextToken();
            return false;
        }
        function parsingContextErrors(context) {
            switch (context) {
                case 0 /* SourceElements */: return Diagnostics.Declaration_or_statement_expected;
                case 1 /* BlockStatements */: return Diagnostics.Declaration_or_statement_expected;
                case 4 /* TypeMembers */: return Diagnostics.Property_or_signature_expected;
                case 5 /* ClassMembers */: return Diagnostics.Unexpected_token_A_constructor_method_accessor_or_property_was_expected;
                case 6 /* EnumMembers */: return Diagnostics.Enum_member_expected;
                case 7 /* HeritageClauseElement */: return Diagnostics.Expression_expected;
                case 8 /* VariableDeclarations */: return Diagnostics.Variable_declaration_expected;
                case 9 /* ObjectBindingElements */: return Diagnostics.Property_destructuring_pattern_expected;
                case 10 /* ArrayBindingElements */: return Diagnostics.Array_element_destructuring_pattern_expected;
                case 11 /* ArgumentExpressions */: return Diagnostics.Argument_expression_expected;
                case 12 /* ObjectLiteralMembers */: return Diagnostics.Property_assignment_expected;
                case 15 /* ArrayLiteralMembers */: return Diagnostics.Expression_or_comma_expected;
                case 16 /* Parameters */: return Diagnostics.Parameter_declaration_expected;
                case 17 /* TypeParameters */: return Diagnostics.Type_parameter_declaration_expected;
                case 18 /* TypeArguments */: return Diagnostics.Type_argument_expected;
                case 19 /* TupleElementTypes */: return Diagnostics.Type_expected;
                case 20 /* HeritageClauses */: return Diagnostics.Unexpected_token_expected;
                case 21 /* ImportOrExportSpecifiers */: return Diagnostics.Identifier_expected;
                case 13 /* JsxAttributes */: return Diagnostics.Identifier_expected;
                case 14 /* JsxChildren */: return Diagnostics.Identifier_expected;
                case 22 /* JSDocFunctionParameters */: return Diagnostics.Parameter_declaration_expected;
                case 23 /* JSDocTypeArguments */: return Diagnostics.Type_argument_expected;
                case 25 /* JSDocTupleTypes */: return Diagnostics.Type_expected;
                case 24 /* JSDocRecordMembers */: return Diagnostics.Property_assignment_expected;
            }
        }
        ;
        // Parses a comma-delimited list of elements
        function parseDelimitedList(kind, parseElement, considerSemicolonAsDelimiter) {
            var saveParsingContext = parsingContext;
            parsingContext |= 1 << kind;
            var result = [];
            result.pos = getNodePos();
            var commaStart = -1; // Meaning the previous token was not a comma
            while (true) {
                if (isListElement(kind, /*inErrorRecovery*/ false)) {
                    result.push(parseListElement(kind, parseElement));
                    commaStart = scanner.getTokenPos();
                    if (parseOptional(SyntaxKind.CommaToken)) {
                        continue;
                    }
                    commaStart = -1; // Back to the state where the last token was not a comma
                    if (isListTerminator(kind)) {
                        break;
                    }
                    // We didn't get a comma, and the list wasn't terminated, explicitly parse
                    // out a comma so we give a good error message.
                    parseExpected(SyntaxKind.CommaToken);
                    // If the token was a semicolon, and the caller allows that, then skip it and
                    // continue.  This ensures we get back on track and don't result in tons of
                    // parse errors.  For example, this can happen when people do things like use
                    // a semicolon to delimit object literal members.   Note: we'll have already
                    // reported an error when we called parseExpected above.
                    if (considerSemicolonAsDelimiter && token === SyntaxKind.SemicolonToken && !scanner.hasPrecedingLineBreak()) {
                        nextToken();
                    }
                    continue;
                }
                if (isListTerminator(kind)) {
                    break;
                }
                if (abortParsingListOrMoveToNextToken(kind)) {
                    break;
                }
            }
            // Recording the trailing comma is deliberately done after the previous
            // loop, and not just if we see a list terminator. This is because the list
            // may have ended incorrectly, but it is still important to know if there
            // was a trailing comma.
            // Check if the last token was a comma.
            if (commaStart >= 0) {
                // Always preserve a trailing comma by marking it on the NodeArray
                result.hasTrailingComma = true;
            }
            result.end = getNodeEnd();
            parsingContext = saveParsingContext;
            return result;
        }
        function createMissingList() {
            var pos = getNodePos();
            var result = [];
            result.pos = pos;
            result.end = pos;
            return result;
        }
        function parseBracketedList(kind, parseElement, open, close) {
            if (parseExpected(open)) {
                var result = parseDelimitedList(kind, parseElement);
                parseExpected(close);
                return result;
            }
            return createMissingList();
        }
        // The allowReservedWords parameter controls whether reserved words are permitted after the first dot
        function parseEntityName(allowReservedWords, diagnosticMessage) {
            var entity = parseIdentifier(diagnosticMessage);
            while (parseOptional(SyntaxKind.DotToken)) {
                var node = createNode(SyntaxKind.QualifiedName, entity.pos); // !!!
                node.left = entity;
                node.right = parseRightSideOfDot(allowReservedWords);
                entity = finishNode(node);
            }
            return entity;
        }
        function parseRightSideOfDot(allowIdentifierNames) {
            // Technically a keyword is valid here as all identifiers and keywords are identifier names.
            // However, often we'll encounter this in error situations when the identifier or keyword
            // is actually starting another valid construct.
            //
            // So, we check for the following specific case:
            //
            //      name.
            //      identifierOrKeyword identifierNameOrKeyword
            //
            // Note: the newlines are important here.  For example, if that above code
            // were rewritten into:
            //
            //      name.identifierOrKeyword
            //      identifierNameOrKeyword
            //
            // Then we would consider it valid.  That's because ASI would take effect and
            // the code would be implicitly: "name.identifierOrKeyword; identifierNameOrKeyword".
            // In the first case though, ASI will not take effect because there is not a
            // line terminator after the identifier or keyword.
            if (scanner.hasPrecedingLineBreak() && tokenIsIdentifierOrKeyword(token)) {
                var matchesPattern = lookAhead(nextTokenIsIdentifierOrKeywordOnSameLine);
                if (matchesPattern) {
                    // Report that we need an identifier.  However, report it right after the dot,
                    // and not on the next token.  This is because the next token might actually
                    // be an identifier and the error would be quite confusing.
                    return createMissingNode(SyntaxKind.Identifier, /*reportAtCurrentPosition*/ true, Diagnostics.Identifier_expected);
                }
            }
            return allowIdentifierNames ? parseIdentifierName() : parseIdentifier();
        }
        function parseTemplateExpression() {
            var template = createNode(SyntaxKind.TemplateExpression);
            template.head = parseTemplateLiteralFragment();
            Debug.assert(template.head.kind === SyntaxKind.TemplateHead, "Template head has wrong token kind");
            var templateSpans = [];
            templateSpans.pos = getNodePos();
            do {
                templateSpans.push(parseTemplateSpan());
            } while (lastOrUndefined(templateSpans).literal.kind === SyntaxKind.TemplateMiddle);
            templateSpans.end = getNodeEnd();
            template.templateSpans = templateSpans;
            return finishNode(template);
        }
        function parseTemplateSpan() {
            var span = createNode(SyntaxKind.TemplateSpan);
            span.expression = allowInAnd(parseExpression);
            var literal;
            if (token === SyntaxKind.CloseBraceToken) {
                reScanTemplateToken();
                literal = parseTemplateLiteralFragment();
            }
            else {
                literal = parseExpectedToken(SyntaxKind.TemplateTail, /*reportAtCurrentPosition*/ false, Diagnostics._0_expected, tokenToString(SyntaxKind.CloseBraceToken));
            }
            span.literal = literal;
            return finishNode(span);
        }
        function parseStringLiteralTypeNode() {
            return parseLiteralLikeNode(SyntaxKind.StringLiteralType, /*internName*/ true);
        }
        function parseTemplateLiteralFragment() {
            return parseLiteralLikeNode(token, /*internName*/ false);
        }
        // TYPES
        function parseTypeReference() {
            var typeName = parseEntityName(/*allowReservedWords*/ false, Diagnostics.Type_expected);
            var node = createNode(SyntaxKind.TypeReference, typeName.pos);
            node.typeName = typeName;
            if (!scanner.hasPrecedingLineBreak() && token === SyntaxKind.LessThanToken) {
                node.typeArguments = parseBracketedList(18 /* TypeArguments */, parseType, SyntaxKind.LessThanToken, SyntaxKind.GreaterThanToken);
            }
            return finishNode(node);
        }
        function parseThisTypePredicate(lhs) {
            nextToken();
            var node = createNode(SyntaxKind.TypePredicate, lhs.pos);
            node.parameterName = lhs;
            node.type = parseType();
            return finishNode(node);
        }
        function parseThisTypeNode() {
            var node = createNode(SyntaxKind.ThisType);
            nextToken();
            return finishNode(node);
        }
        function parseTypeQuery() {
            var node = createNode(SyntaxKind.TypeQuery);
            parseExpected(SyntaxKind.TypeOfKeyword);
            node.exprName = parseEntityName(/*allowReservedWords*/ true);
            return finishNode(node);
        }
        function parseTypeParameter() {
            var node = createNode(SyntaxKind.TypeParameter);
            node.name = parseIdentifier();
            if (parseOptional(SyntaxKind.ExtendsKeyword)) {
                // It's not uncommon for people to write improper constraints to a generic.  If the
                // user writes a constraint that is an expression and not an actual type, then parse
                // it out as an expression (so we can recover well), but report that a type is needed
                // instead.
                if (isStartOfType() || !isStartOfExpression()) {
                    node.constraint = parseType();
                }
                else {
                    // It was not a type, and it looked like an expression.  Parse out an expression
                    // here so we recover well.  Note: it is important that we call parseUnaryExpression
                    // and not parseExpression here.  If the user has:
                    //
                    //      <T extends "">
                    //
                    // We do *not* want to consume the  >  as we're consuming the expression for "".
                    node.expression = parseUnaryExpressionOrHigher();
                }
            }
            return finishNode(node);
        }
        function parseTypeParameters() {
            if (token === SyntaxKind.LessThanToken) {
                return parseBracketedList(17 /* TypeParameters */, parseTypeParameter, SyntaxKind.LessThanToken, SyntaxKind.GreaterThanToken);
            }
        }
        function parseParameterType() {
            if (parseOptional(SyntaxKind.ColonToken)) {
                return parseType();
            }
            return undefined;
        }
        function isStartOfParameter() {
            return token === SyntaxKind.DotDotDotToken || isIdentifierOrPattern() || isModifierKind(token) || token === SyntaxKind.AtToken || token === SyntaxKind.ThisKeyword;
        }
        function setModifiers(node, modifiers) {
            if (modifiers) {
                node.flags |= modifiers.flags;
                node.modifiers = modifiers;
            }
        }
        function parseParameter() {
            var node = createNode(SyntaxKind.Parameter);
            if (token === SyntaxKind.ThisKeyword) {
                node.name = createIdentifier(/*isIdentifier*/ true, undefined);
                node.type = parseParameterType();
                return finishNode(node);
            }
            node.decorators = parseDecorators();
            setModifiers(node, parseModifiers());
            node.dotDotDotToken = parseOptionalToken(SyntaxKind.DotDotDotToken);
            // FormalParameter [Yield,Await]:
            //      BindingElement[?Yield,?Await]
            node.name = parseIdentifierOrPattern();
            if (getFullWidth(node.name) === 0 && node.flags === 0 && isModifierKind(token)) {
                // in cases like
                // 'use strict'
                // function foo(static)
                // isParameter('static') === true, because of isModifier('static')
                // however 'static' is not a legal identifier in a strict mode.
                // so result of this function will be ParameterDeclaration (flags = 0, name = missing, type = undefined, initializer = undefined)
                // and current token will not change => parsing of the enclosing parameter list will last till the end of time (or OOM)
                // to avoid this we'll advance cursor to the next token.
                nextToken();
            }
            node.questionToken = parseOptionalToken(SyntaxKind.QuestionToken);
            node.type = parseParameterType();
            node.initializer = parseBindingElementInitializer(/*inParameter*/ true);
            // Do not check for initializers in an ambient context for parameters. This is not
            // a grammar error because the grammar allows arbitrary call signatures in
            // an ambient context.
            // It is actually not necessary for this to be an error at all. The reason is that
            // function/constructor implementations are syntactically disallowed in ambient
            // contexts. In addition, parameter initializers are semantically disallowed in
            // overload signatures. So parameter initializers are transitively disallowed in
            // ambient contexts.
            return addJSDocComment(finishNode(node));
        }
        function parseBindingElementInitializer(inParameter) {
            return inParameter ? parseParameterInitializer() : parseNonParameterInitializer();
        }
        function parseParameterInitializer() {
            return parseInitializer(/*inParameter*/ true);
        }
        function fillSignature(returnToken, yieldContext, awaitContext, requireCompleteParameterList, signature) {
            var returnTokenRequired = returnToken === SyntaxKind.EqualsGreaterThanToken;
            signature.typeParameters = parseTypeParameters();
            signature.parameters = parseParameterList(yieldContext, awaitContext, requireCompleteParameterList);
            if (returnTokenRequired) {
                parseExpected(returnToken);
                signature.type = parseTypeOrTypePredicate();
            }
            else if (parseOptional(returnToken)) {
                signature.type = parseTypeOrTypePredicate();
            }
        }
        function parseParameterList(yieldContext, awaitContext, requireCompleteParameterList) {
            // FormalParameters [Yield,Await]: (modified)
            //      [empty]
            //      FormalParameterList[?Yield,Await]
            //
            // FormalParameter[Yield,Await]: (modified)
            //      BindingElement[?Yield,Await]
            //
            // BindingElement [Yield,Await]: (modified)
            //      SingleNameBinding[?Yield,?Await]
            //      BindingPattern[?Yield,?Await]Initializer [In, ?Yield,?Await] opt
            //
            // SingleNameBinding [Yield,Await]:
            //      BindingIdentifier[?Yield,?Await]Initializer [In, ?Yield,?Await] opt
            if (parseExpected(SyntaxKind.OpenParenToken)) {
                var savedYieldContext = inYieldContext();
                var savedAwaitContext = inAwaitContext();
                setYieldContext(yieldContext);
                setAwaitContext(awaitContext);
                var result = parseDelimitedList(16 /* Parameters */, parseParameter);
                setYieldContext(savedYieldContext);
                setAwaitContext(savedAwaitContext);
                if (!parseExpected(SyntaxKind.CloseParenToken) && requireCompleteParameterList) {
                    // Caller insisted that we had to end with a )   We didn't.  So just return
                    // undefined here.
                    return undefined;
                }
                return result;
            }
            // We didn't even have an open paren.  If the caller requires a complete parameter list,
            // we definitely can't provide that.  However, if they're ok with an incomplete one,
            // then just return an empty set of parameters.
            return requireCompleteParameterList ? undefined : createMissingList();
        }
        function parseTypeMemberSemicolon() {
            // We allow type members to be separated by commas or (possibly ASI) semicolons.
            // First check if it was a comma.  If so, we're done with the member.
            if (parseOptional(SyntaxKind.CommaToken)) {
                return;
            }
            // Didn't have a comma.  We must have a (possible ASI) semicolon.
            parseSemicolon();
        }
        function parseSignatureMember(kind) {
            var node = createNode(kind);
            if (kind === SyntaxKind.ConstructSignature) {
                parseExpected(SyntaxKind.NewKeyword);
            }
            fillSignature(SyntaxKind.ColonToken, /*yieldContext*/ false, /*awaitContext*/ false, /*requireCompleteParameterList*/ false, node);
            parseTypeMemberSemicolon();
            return finishNode(node);
        }
        function isIndexSignature() {
            if (token !== SyntaxKind.OpenBracketToken) {
                return false;
            }
            return lookAhead(isUnambiguouslyIndexSignature);
        }
        function isUnambiguouslyIndexSignature() {
            // The only allowed sequence is:
            //
            //   [id:
            //
            // However, for error recovery, we also check the following cases:
            //
            //   [...
            //   [id,
            //   [id?,
            //   [id?:
            //   [id?]
            //   [public id
            //   [private id
            //   [protected id
            //   []
            //
            nextToken();
            if (token === SyntaxKind.DotDotDotToken || token === SyntaxKind.CloseBracketToken) {
                return true;
            }
            if (isModifierKind(token)) {
                nextToken();
                if (isIdentifier()) {
                    return true;
                }
            }
            else if (!isIdentifier()) {
                return false;
            }
            else {
                // Skip the identifier
                nextToken();
            }
            // A colon signifies a well formed indexer
            // A comma should be a badly formed indexer because comma expressions are not allowed
            // in computed properties.
            if (token === SyntaxKind.ColonToken || token === SyntaxKind.CommaToken) {
                return true;
            }
            // Question mark could be an indexer with an optional property,
            // or it could be a conditional expression in a computed property.
            if (token !== SyntaxKind.QuestionToken) {
                return false;
            }
            // If any of the following tokens are after the question mark, it cannot
            // be a conditional expression, so treat it as an indexer.
            nextToken();
            return token === SyntaxKind.ColonToken || token === SyntaxKind.CommaToken || token === SyntaxKind.CloseBracketToken;
        }
        function parseIndexSignatureDeclaration(fullStart, decorators, modifiers) {
            var node = createNode(SyntaxKind.IndexSignature, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            node.parameters = parseBracketedList(16 /* Parameters */, parseParameter, SyntaxKind.OpenBracketToken, SyntaxKind.CloseBracketToken);
            node.type = parseTypeAnnotation();
            parseTypeMemberSemicolon();
            return finishNode(node);
        }
        function parsePropertyOrMethodSignature(fullStart, modifiers) {
            var name = parsePropertyName();
            var questionToken = parseOptionalToken(SyntaxKind.QuestionToken);
            if (token === SyntaxKind.OpenParenToken || token === SyntaxKind.LessThanToken) {
                var method = createNode(SyntaxKind.MethodSignature, fullStart);
                setModifiers(method, modifiers);
                method.name = name;
                method.questionToken = questionToken;
                // Method signatures don't exist in expression contexts.  So they have neither
                // [Yield] nor [Await]
                fillSignature(SyntaxKind.ColonToken, /*yieldContext*/ false, /*awaitContext*/ false, /*requireCompleteParameterList*/ false, method);
                parseTypeMemberSemicolon();
                return finishNode(method);
            }
            else {
                var property = createNode(SyntaxKind.PropertySignature, fullStart);
                setModifiers(property, modifiers);
                property.name = name;
                property.questionToken = questionToken;
                property.type = parseTypeAnnotation();
                if (token === SyntaxKind.EqualsToken) {
                    // Although type literal properties cannot not have initializers, we attempt
                    // to parse an initializer so we can report in the checker that an interface
                    // property or type literal property cannot have an initializer.
                    property.initializer = parseNonParameterInitializer();
                }
                parseTypeMemberSemicolon();
                return finishNode(property);
            }
        }
        function isTypeMemberStart() {
            var idToken;
            // Return true if we have the start of a signature member
            if (token === SyntaxKind.OpenParenToken || token === SyntaxKind.LessThanToken) {
                return true;
            }
            // Eat up all modifiers, but hold on to the last one in case it is actually an identifier
            while (isModifierKind(token)) {
                idToken = token;
                nextToken();
            }
            // Index signatures and computed property names are type members
            if (token === SyntaxKind.OpenBracketToken) {
                return true;
            }
            // Try to get the first property-like token following all modifiers
            if (isLiteralPropertyName()) {
                idToken = token;
                nextToken();
            }
            // If we were able to get any potential identifier, check that it is
            // the start of a member declaration
            if (idToken) {
                return token === SyntaxKind.OpenParenToken ||
                    token === SyntaxKind.LessThanToken ||
                    token === SyntaxKind.QuestionToken ||
                    token === SyntaxKind.ColonToken ||
                    canParseSemicolon();
            }
            return false;
        }
        function parseTypeMember() {
            if (token === SyntaxKind.OpenParenToken || token === SyntaxKind.LessThanToken) {
                return parseSignatureMember(SyntaxKind.CallSignature);
            }
            if (token === SyntaxKind.NewKeyword && lookAhead(isStartOfConstructSignature)) {
                return parseSignatureMember(SyntaxKind.ConstructSignature);
            }
            var fullStart = getNodePos();
            var modifiers = parseModifiers();
            if (isIndexSignature()) {
                return parseIndexSignatureDeclaration(fullStart, /*decorators*/ undefined, modifiers);
            }
            return parsePropertyOrMethodSignature(fullStart, modifiers);
        }
        function isStartOfConstructSignature() {
            nextToken();
            return token === SyntaxKind.OpenParenToken || token === SyntaxKind.LessThanToken;
        }
        function parseTypeLiteral() {
            var node = createNode(SyntaxKind.TypeLiteral);
            node.members = parseObjectTypeMembers();
            return finishNode(node);
        }
        function parseObjectTypeMembers() {
            var members;
            if (parseExpected(SyntaxKind.OpenBraceToken)) {
                members = parseList(4 /* TypeMembers */, parseTypeMember);
                parseExpected(SyntaxKind.CloseBraceToken);
            }
            else {
                members = createMissingList();
            }
            return members;
        }
        function parseTupleType() {
            var node = createNode(SyntaxKind.TupleType);
            node.elementTypes = parseBracketedList(19 /* TupleElementTypes */, parseType, SyntaxKind.OpenBracketToken, SyntaxKind.CloseBracketToken);
            return finishNode(node);
        }
        function parseParenthesizedType() {
            var node = createNode(SyntaxKind.ParenthesizedType);
            parseExpected(SyntaxKind.OpenParenToken);
            node.type = parseType();
            parseExpected(SyntaxKind.CloseParenToken);
            return finishNode(node);
        }
        function parseFunctionOrConstructorType(kind) {
            var node = createNode(kind);
            if (kind === SyntaxKind.ConstructorType) {
                parseExpected(SyntaxKind.NewKeyword);
            }
            fillSignature(SyntaxKind.EqualsGreaterThanToken, /*yieldContext*/ false, /*awaitContext*/ false, /*requireCompleteParameterList*/ false, node);
            return finishNode(node);
        }
        function parseKeywordAndNoDot() {
            var node = parseTokenNode();
            return token === SyntaxKind.DotToken ? undefined : node;
        }
        function parseNonArrayType() {
            switch (token) {
                case SyntaxKind.AnyKeyword:
                case SyntaxKind.StringKeyword:
                case SyntaxKind.NumberKeyword:
                case SyntaxKind.BooleanKeyword:
                case SyntaxKind.SymbolKeyword:
                case SyntaxKind.UndefinedKeyword:
                case SyntaxKind.NeverKeyword:
                    // If these are followed by a dot, then parse these out as a dotted type reference instead.
                    var node = tryParse(parseKeywordAndNoDot);
                    return node || parseTypeReference();
                case SyntaxKind.StringLiteral:
                    return parseStringLiteralTypeNode();
                case SyntaxKind.VoidKeyword:
                case SyntaxKind.NullKeyword:
                    return parseTokenNode();
                case SyntaxKind.ThisKeyword: {
                    var thisKeyword = parseThisTypeNode();
                    if (token === SyntaxKind.IsKeyword && !scanner.hasPrecedingLineBreak()) {
                        return parseThisTypePredicate(thisKeyword);
                    }
                    else {
                        return thisKeyword;
                    }
                }
                case SyntaxKind.TypeOfKeyword:
                    return parseTypeQuery();
                case SyntaxKind.OpenBraceToken:
                    return parseTypeLiteral();
                case SyntaxKind.OpenBracketToken:
                    return parseTupleType();
                case SyntaxKind.OpenParenToken:
                    return parseParenthesizedType();
                default:
                    return parseTypeReference();
            }
        }
        function isStartOfType() {
            switch (token) {
                case SyntaxKind.AnyKeyword:
                case SyntaxKind.StringKeyword:
                case SyntaxKind.NumberKeyword:
                case SyntaxKind.BooleanKeyword:
                case SyntaxKind.SymbolKeyword:
                case SyntaxKind.VoidKeyword:
                case SyntaxKind.UndefinedKeyword:
                case SyntaxKind.NullKeyword:
                case SyntaxKind.ThisKeyword:
                case SyntaxKind.TypeOfKeyword:
                case SyntaxKind.NeverKeyword:
                case SyntaxKind.OpenBraceToken:
                case SyntaxKind.OpenBracketToken:
                case SyntaxKind.LessThanToken:
                case SyntaxKind.NewKeyword:
                case SyntaxKind.StringLiteral:
                    return true;
                case SyntaxKind.OpenParenToken:
                    // Only consider '(' the start of a type if followed by ')', '...', an identifier, a modifier,
                    // or something that starts a type. We don't want to consider things like '(1)' a type.
                    return lookAhead(isStartOfParenthesizedOrFunctionType);
                default:
                    return isIdentifier();
            }
        }
        function isStartOfParenthesizedOrFunctionType() {
            nextToken();
            return token === SyntaxKind.CloseParenToken || isStartOfParameter() || isStartOfType();
        }
        function parseArrayTypeOrHigher() {
            var type = parseNonArrayType();
            while (!scanner.hasPrecedingLineBreak() && parseOptional(SyntaxKind.OpenBracketToken)) {
                parseExpected(SyntaxKind.CloseBracketToken);
                var node = createNode(SyntaxKind.ArrayType, type.pos);
                node.elementType = type;
                type = finishNode(node);
            }
            return type;
        }
        function parseUnionOrIntersectionType(kind, parseConstituentType, operator) {
            var type = parseConstituentType();
            if (token === operator) {
                var types = [type];
                types.pos = type.pos;
                while (parseOptional(operator)) {
                    types.push(parseConstituentType());
                }
                types.end = getNodeEnd();
                var node = createNode(kind, type.pos);
                node.types = types;
                type = finishNode(node);
            }
            return type;
        }
        function parseIntersectionTypeOrHigher() {
            return parseUnionOrIntersectionType(SyntaxKind.IntersectionType, parseArrayTypeOrHigher, SyntaxKind.AmpersandToken);
        }
        function parseUnionTypeOrHigher() {
            return parseUnionOrIntersectionType(SyntaxKind.UnionType, parseIntersectionTypeOrHigher, SyntaxKind.BarToken);
        }
        function isStartOfFunctionType() {
            if (token === SyntaxKind.LessThanToken) {
                return true;
            }
            return token === SyntaxKind.OpenParenToken && lookAhead(isUnambiguouslyStartOfFunctionType);
        }
        function skipParameterStart() {
            if (isModifierKind(token)) {
                // Skip modifiers
                parseModifiers();
            }
            if (isIdentifier() || token === SyntaxKind.ThisKeyword) {
                nextToken();
                return true;
            }
            if (token === SyntaxKind.OpenBracketToken || token === SyntaxKind.OpenBraceToken) {
                // Return true if we can parse an array or object binding pattern with no errors
                var previousErrorCount = parseDiagnostics.length;
                parseIdentifierOrPattern();
                return previousErrorCount === parseDiagnostics.length;
            }
            return false;
        }
        function isUnambiguouslyStartOfFunctionType() {
            nextToken();
            if (token === SyntaxKind.CloseParenToken || token === SyntaxKind.DotDotDotToken) {
                // ( )
                // ( ...
                return true;
            }
            if (skipParameterStart()) {
                // We successfully skipped modifiers (if any) and an identifier or binding pattern,
                // now see if we have something that indicates a parameter declaration
                if (token === SyntaxKind.ColonToken || token === SyntaxKind.CommaToken ||
                    token === SyntaxKind.QuestionToken || token === SyntaxKind.EqualsToken) {
                    // ( xxx :
                    // ( xxx ,
                    // ( xxx ?
                    // ( xxx =
                    return true;
                }
                if (token === SyntaxKind.CloseParenToken) {
                    nextToken();
                    if (token === SyntaxKind.EqualsGreaterThanToken) {
                        // ( xxx ) =>
                        return true;
                    }
                }
            }
            return false;
        }
        function parseTypeOrTypePredicate() {
            var typePredicateVariable = isIdentifier() && tryParse(parseTypePredicatePrefix);
            var type = parseType();
            if (typePredicateVariable) {
                var node = createNode(SyntaxKind.TypePredicate, typePredicateVariable.pos);
                node.parameterName = typePredicateVariable;
                node.type = type;
                return finishNode(node);
            }
            else {
                return type;
            }
        }
        function parseTypePredicatePrefix() {
            var id = parseIdentifier();
            if (token === SyntaxKind.IsKeyword && !scanner.hasPrecedingLineBreak()) {
                nextToken();
                return id;
            }
        }
        function parseType() {
            // The rules about 'yield' only apply to actual code/expression contexts.  They don't
            // apply to 'type' contexts.  So we disable these parameters here before moving on.
            return doOutsideOfContext(NodeFlags.TypeExcludesFlags, parseTypeWorker);
        }
        function parseTypeWorker() {
            if (isStartOfFunctionType()) {
                return parseFunctionOrConstructorType(SyntaxKind.FunctionType);
            }
            if (token === SyntaxKind.NewKeyword) {
                return parseFunctionOrConstructorType(SyntaxKind.ConstructorType);
            }
            return parseUnionTypeOrHigher();
        }
        function parseTypeAnnotation() {
            return parseOptional(SyntaxKind.ColonToken) ? parseType() : undefined;
        }
        // EXPRESSIONS
        function isStartOfLeftHandSideExpression() {
            switch (token) {
                case SyntaxKind.ThisKeyword:
                case SyntaxKind.SuperKeyword:
                case SyntaxKind.NullKeyword:
                case SyntaxKind.TrueKeyword:
                case SyntaxKind.FalseKeyword:
                case SyntaxKind.NumericLiteral:
                case SyntaxKind.StringLiteral:
                case SyntaxKind.NoSubstitutionTemplateLiteral:
                case SyntaxKind.TemplateHead:
                case SyntaxKind.OpenParenToken:
                case SyntaxKind.OpenBracketToken:
                case SyntaxKind.OpenBraceToken:
                case SyntaxKind.FunctionKeyword:
                case SyntaxKind.ClassKeyword:
                case SyntaxKind.NewKeyword:
                case SyntaxKind.SlashToken:
                case SyntaxKind.SlashEqualsToken:
                case SyntaxKind.Identifier:
                    return true;
                default:
                    return isIdentifier();
            }
        }
        function isStartOfExpression() {
            if (isStartOfLeftHandSideExpression()) {
                return true;
            }
            switch (token) {
                case SyntaxKind.PlusToken:
                case SyntaxKind.MinusToken:
                case SyntaxKind.TildeToken:
                case SyntaxKind.ExclamationToken:
                case SyntaxKind.DeleteKeyword:
                case SyntaxKind.TypeOfKeyword:
                case SyntaxKind.VoidKeyword:
                case SyntaxKind.PlusPlusToken:
                case SyntaxKind.MinusMinusToken:
                case SyntaxKind.LessThanToken:
                case SyntaxKind.AwaitKeyword:
                case SyntaxKind.YieldKeyword:
                    // Yield/await always starts an expression.  Either it is an identifier (in which case
                    // it is definitely an expression).  Or it's a keyword (either because we're in
                    // a generator or async function, or in strict mode (or both)) and it started a yield or await expression.
                    return true;
                default:
                    // Error tolerance.  If we see the start of some binary operator, we consider
                    // that the start of an expression.  That way we'll parse out a missing identifier,
                    // give a good message about an identifier being missing, and then consume the
                    // rest of the binary expression.
                    if (isBinaryOperator()) {
                        return true;
                    }
                    return isIdentifier();
            }
        }
        function isStartOfExpressionStatement() {
            // As per the grammar, none of '{' or 'function' or 'class' can start an expression statement.
            return token !== SyntaxKind.OpenBraceToken &&
                token !== SyntaxKind.FunctionKeyword &&
                token !== SyntaxKind.ClassKeyword &&
                token !== SyntaxKind.AtToken &&
                isStartOfExpression();
        }
        function parseExpression() {
            // Expression[in]:
            //      AssignmentExpression[in]
            //      Expression[in] , AssignmentExpression[in]
            // clear the decorator context when parsing Expression, as it should be unambiguous when parsing a decorator
            var saveDecoratorContext = inDecoratorContext();
            if (saveDecoratorContext) {
                setDecoratorContext(/*val*/ false);
            }
            var expr = parseAssignmentExpressionOrHigher();
            var operatorToken;
            while ((operatorToken = parseOptionalToken(SyntaxKind.CommaToken))) {
                expr = makeBinaryExpression(expr, operatorToken, parseAssignmentExpressionOrHigher());
            }
            if (saveDecoratorContext) {
                setDecoratorContext(/*val*/ true);
            }
            return expr;
        }
        function parseInitializer(inParameter) {
            if (token !== SyntaxKind.EqualsToken) {
                // It's not uncommon during typing for the user to miss writing the '=' token.  Check if
                // there is no newline after the last token and if we're on an expression.  If so, parse
                // this as an equals-value clause with a missing equals.
                // NOTE: There are two places where we allow equals-value clauses.  The first is in a
                // variable declarator.  The second is with a parameter.  For variable declarators
                // it's more likely that a { would be a allowed (as an object literal).  While this
                // is also allowed for parameters, the risk is that we consume the { as an object
                // literal when it really will be for the block following the parameter.
                if (scanner.hasPrecedingLineBreak() || (inParameter && token === SyntaxKind.OpenBraceToken) || !isStartOfExpression()) {
                    // preceding line break, open brace in a parameter (likely a function body) or current token is not an expression -
                    // do not try to parse initializer
                    return undefined;
                }
            }
            // Initializer[In, Yield] :
            //     = AssignmentExpression[?In, ?Yield]
            parseExpected(SyntaxKind.EqualsToken);
            return parseAssignmentExpressionOrHigher();
        }
        function parseAssignmentExpressionOrHigher() {
            //  AssignmentExpression[in,yield]:
            //      1) ConditionalExpression[?in,?yield]
            //      2) LeftHandSideExpression = AssignmentExpression[?in,?yield]
            //      3) LeftHandSideExpression AssignmentOperator AssignmentExpression[?in,?yield]
            //      4) ArrowFunctionExpression[?in,?yield]
            //      5) AsyncArrowFunctionExpression[in,yield,await]
            //      6) [+Yield] YieldExpression[?In]
            //
            // Note: for ease of implementation we treat productions '2' and '3' as the same thing.
            // (i.e. they're both BinaryExpressions with an assignment operator in it).
            // First, do the simple check if we have a YieldExpression (production '5').
            if (isYieldExpression()) {
                return parseYieldExpression();
            }
            // Then, check if we have an arrow function (production '4' and '5') that starts with a parenthesized
            // parameter list or is an async arrow function.
            // AsyncArrowFunctionExpression:
            //      1) async[no LineTerminator here]AsyncArrowBindingIdentifier[?Yield][no LineTerminator here]=>AsyncConciseBody[?In]
            //      2) CoverCallExpressionAndAsyncArrowHead[?Yield, ?Await][no LineTerminator here]=>AsyncConciseBody[?In]
            // Production (1) of AsyncArrowFunctionExpression is parsed in "tryParseAsyncSimpleArrowFunctionExpression".
            // And production (2) is parsed in "tryParseParenthesizedArrowFunctionExpression".
            //
            // If we do successfully parse arrow-function, we must *not* recurse for productions 1, 2 or 3. An ArrowFunction is
            // not a  LeftHandSideExpression, nor does it start a ConditionalExpression.  So we are done
            // with AssignmentExpression if we see one.
            var arrowExpression = tryParseParenthesizedArrowFunctionExpression() || tryParseAsyncSimpleArrowFunctionExpression();
            if (arrowExpression) {
                return arrowExpression;
            }
            // Now try to see if we're in production '1', '2' or '3'.  A conditional expression can
            // start with a LogicalOrExpression, while the assignment productions can only start with
            // LeftHandSideExpressions.
            //
            // So, first, we try to just parse out a BinaryExpression.  If we get something that is a
            // LeftHandSide or higher, then we can try to parse out the assignment expression part.
            // Otherwise, we try to parse out the conditional expression bit.  We want to allow any
            // binary expression here, so we pass in the 'lowest' precedence here so that it matches
            // and consumes anything.
            var expr = parseBinaryExpressionOrHigher(/*precedence*/ 0);
            // To avoid a look-ahead, we did not handle the case of an arrow function with a single un-parenthesized
            // parameter ('x => ...') above. We handle it here by checking if the parsed expression was a single
            // identifier and the current token is an arrow.
            if (expr.kind === SyntaxKind.Identifier && token === SyntaxKind.EqualsGreaterThanToken) {
                return parseSimpleArrowFunctionExpression(expr);
            }
            // Now see if we might be in cases '2' or '3'.
            // If the expression was a LHS expression, and we have an assignment operator, then
            // we're in '2' or '3'. Consume the assignment and return.
            //
            // Note: we call reScanGreaterToken so that we get an appropriately merged token
            // for cases like > > =  becoming >>=
            if (isLeftHandSideExpression(expr) && isAssignmentOperator(reScanGreaterToken())) {
                return makeBinaryExpression(expr, parseTokenNode(), parseAssignmentExpressionOrHigher());
            }
            // It wasn't an assignment or a lambda.  This is a conditional expression:
            return parseConditionalExpressionRest(expr);
        }
        function isYieldExpression() {
            if (token === SyntaxKind.YieldKeyword) {
                // If we have a 'yield' keyword, and this is a context where yield expressions are
                // allowed, then definitely parse out a yield expression.
                if (inYieldContext()) {
                    return true;
                }
                // We're in a context where 'yield expr' is not allowed.  However, if we can
                // definitely tell that the user was trying to parse a 'yield expr' and not
                // just a normal expr that start with a 'yield' identifier, then parse out
                // a 'yield expr'.  We can then report an error later that they are only
                // allowed in generator expressions.
                //
                // for example, if we see 'yield(foo)', then we'll have to treat that as an
                // invocation expression of something called 'yield'.  However, if we have
                // 'yield foo' then that is not legal as a normal expression, so we can
                // definitely recognize this as a yield expression.
                //
                // for now we just check if the next token is an identifier.  More heuristics
                // can be added here later as necessary.  We just need to make sure that we
                // don't accidentally consume something legal.
                return lookAhead(nextTokenIsIdentifierOrKeywordOrNumberOnSameLine);
            }
            return false;
        }
        function nextTokenIsIdentifierOnSameLine() {
            nextToken();
            return !scanner.hasPrecedingLineBreak() && isIdentifier();
        }
        function parseYieldExpression() {
            var node = createNode(SyntaxKind.YieldExpression);
            // YieldExpression[In] :
            //      yield
            //      yield [no LineTerminator here] [Lexical goal InputElementRegExp]AssignmentExpression[?In, Yield]
            //      yield [no LineTerminator here] * [Lexical goal InputElementRegExp]AssignmentExpression[?In, Yield]
            nextToken();
            if (!scanner.hasPrecedingLineBreak() &&
                (token === SyntaxKind.AsteriskToken || isStartOfExpression())) {
                node.asteriskToken = parseOptionalToken(SyntaxKind.AsteriskToken);
                node.expression = parseAssignmentExpressionOrHigher();
                return finishNode(node);
            }
            else {
                // if the next token is not on the same line as yield.  or we don't have an '*' or
                // the start of an expression, then this is just a simple "yield" expression.
                return finishNode(node);
            }
        }
        function parseSimpleArrowFunctionExpression(identifier, asyncModifier) {
            Debug.assert(token === SyntaxKind.EqualsGreaterThanToken, "parseSimpleArrowFunctionExpression should only have been called if we had a =>");
            var node;
            if (asyncModifier) {
                node = createNode(SyntaxKind.ArrowFunction, asyncModifier.pos);
                setModifiers(node, asyncModifier);
            }
            else {
                node = createNode(SyntaxKind.ArrowFunction, identifier.pos);
            }
            var parameter = createNode(SyntaxKind.Parameter, identifier.pos);
            parameter.name = identifier;
            finishNode(parameter);
            node.parameters = [parameter];
            node.parameters.pos = parameter.pos;
            node.parameters.end = parameter.end;
            node.equalsGreaterThanToken = parseExpectedToken(SyntaxKind.EqualsGreaterThanToken, /*reportAtCurrentPosition*/ false, Diagnostics._0_expected, "=>");
            node.body = parseArrowFunctionExpressionBody(/*isAsync*/ !!asyncModifier);
            return finishNode(node);
        }
        function tryParseParenthesizedArrowFunctionExpression() {
            var triState = isParenthesizedArrowFunctionExpression();
            if (triState === 0 /* False */) {
                // It's definitely not a parenthesized arrow function expression.
                return undefined;
            }
            // If we definitely have an arrow function, then we can just parse one, not requiring a
            // following => or { token. Otherwise, we *might* have an arrow function.  Try to parse
            // it out, but don't allow any ambiguity, and return 'undefined' if this could be an
            // expression instead.
            var arrowFunction = triState === 1 /* True */
                ? parseParenthesizedArrowFunctionExpressionHead(/*allowAmbiguity*/ true)
                : tryParse(parsePossibleParenthesizedArrowFunctionExpressionHead);
            if (!arrowFunction) {
                // Didn't appear to actually be a parenthesized arrow function.  Just bail out.
                return undefined;
            }
            var isAsync = !!(arrowFunction.flags & NodeFlags.Async);
            // If we have an arrow, then try to parse the body. Even if not, try to parse if we
            // have an opening brace, just in case we're in an error state.
            var lastToken = token;
            arrowFunction.equalsGreaterThanToken = parseExpectedToken(SyntaxKind.EqualsGreaterThanToken, /*reportAtCurrentPosition*/ false, Diagnostics._0_expected, "=>");
            arrowFunction.body = (lastToken === SyntaxKind.EqualsGreaterThanToken || lastToken === SyntaxKind.OpenBraceToken)
                ? parseArrowFunctionExpressionBody(isAsync)
                : parseIdentifier();
            return finishNode(arrowFunction);
        }
        //  True        -> We definitely expect a parenthesized arrow function here.
        //  False       -> There *cannot* be a parenthesized arrow function here.
        //  Unknown     -> There *might* be a parenthesized arrow function here.
        //                 Speculatively look ahead to be sure, and rollback if not.
        function isParenthesizedArrowFunctionExpression() {
            if (token === SyntaxKind.OpenParenToken || token === SyntaxKind.LessThanToken || token === SyntaxKind.AsyncKeyword) {
                return lookAhead(isParenthesizedArrowFunctionExpressionWorker);
            }
            if (token === SyntaxKind.EqualsGreaterThanToken) {
                // ERROR RECOVERY TWEAK:
                // If we see a standalone => try to parse it as an arrow function expression as that's
                // likely what the user intended to write.
                return 1 /* True */;
            }
            // Definitely not a parenthesized arrow function.
            return 0 /* False */;
        }
        function isParenthesizedArrowFunctionExpressionWorker() {
            if (token === SyntaxKind.AsyncKeyword) {
                nextToken();
                if (scanner.hasPrecedingLineBreak()) {
                    return 0 /* False */;
                }
                if (token !== SyntaxKind.OpenParenToken && token !== SyntaxKind.LessThanToken) {
                    return 0 /* False */;
                }
            }
            var first = token;
            var second = nextToken();
            if (first === SyntaxKind.OpenParenToken) {
                if (second === SyntaxKind.CloseParenToken) {
                    // Simple cases: "() =>", "(): ", and  "() {".
                    // This is an arrow function with no parameters.
                    // The last one is not actually an arrow function,
                    // but this is probably what the user intended.
                    var third = nextToken();
                    switch (third) {
                        case SyntaxKind.EqualsGreaterThanToken:
                        case SyntaxKind.ColonToken:
                        case SyntaxKind.OpenBraceToken:
                            return 1 /* True */;
                        default:
                            return 0 /* False */;
                    }
                }
                // If encounter "([" or "({", this could be the start of a binding pattern.
                // Examples:
                //      ([ x ]) => { }
                //      ({ x }) => { }
                //      ([ x ])
                //      ({ x })
                if (second === SyntaxKind.OpenBracketToken || second === SyntaxKind.OpenBraceToken) {
                    return 2 /* Unknown */;
                }
                // Simple case: "(..."
                // This is an arrow function with a rest parameter.
                if (second === SyntaxKind.DotDotDotToken) {
                    return 1 /* True */;
                }
                // If we had "(" followed by something that's not an identifier,
                // then this definitely doesn't look like a lambda.
                // Note: we could be a little more lenient and allow
                // "(public" or "(private". These would not ever actually be allowed,
                // but we could provide a good error message instead of bailing out.
                if (!isIdentifier()) {
                    return 0 /* False */;
                }
                // If we have something like "(a:", then we must have a
                // type-annotated parameter in an arrow function expression.
                if (nextToken() === SyntaxKind.ColonToken) {
                    return 1 /* True */;
                }
                // This *could* be a parenthesized arrow function.
                // Return Unknown to let the caller know.
                return 2 /* Unknown */;
            }
            else {
                Debug.assert(first === SyntaxKind.LessThanToken);
                // If we have "<" not followed by an identifier,
                // then this definitely is not an arrow function.
                if (!isIdentifier()) {
                    return 0 /* False */;
                }
                // JSX overrides
                if (sourceFile.languageVariant === LanguageVariant.JSX) {
                    var isArrowFunctionInJsx = lookAhead(function () {
                        var third = nextToken();
                        if (third === SyntaxKind.ExtendsKeyword) {
                            var fourth = nextToken();
                            switch (fourth) {
                                case SyntaxKind.EqualsToken:
                                case SyntaxKind.GreaterThanToken:
                                    return false;
                                default:
                                    return true;
                            }
                        }
                        else if (third === SyntaxKind.CommaToken) {
                            return true;
                        }
                        return false;
                    });
                    if (isArrowFunctionInJsx) {
                        return 1 /* True */;
                    }
                    return 0 /* False */;
                }
                // This *could* be a parenthesized arrow function.
                return 2 /* Unknown */;
            }
        }
        function parsePossibleParenthesizedArrowFunctionExpressionHead() {
            return parseParenthesizedArrowFunctionExpressionHead(/*allowAmbiguity*/ false);
        }
        function tryParseAsyncSimpleArrowFunctionExpression() {
            // We do a check here so that we won't be doing unnecessarily call to "lookAhead"
            if (token === SyntaxKind.AsyncKeyword) {
                var isUnParenthesizedAsyncArrowFunction = lookAhead(isUnParenthesizedAsyncArrowFunctionWorker);
                if (isUnParenthesizedAsyncArrowFunction === 1 /* True */) {
                    var asyncModifier = parseModifiersForArrowFunction();
                    var expr = parseBinaryExpressionOrHigher(/*precedence*/ 0);
                    return parseSimpleArrowFunctionExpression(expr, asyncModifier);
                }
            }
            return undefined;
        }
        function isUnParenthesizedAsyncArrowFunctionWorker() {
            // AsyncArrowFunctionExpression:
            //      1) async[no LineTerminator here]AsyncArrowBindingIdentifier[?Yield][no LineTerminator here]=>AsyncConciseBody[?In]
            //      2) CoverCallExpressionAndAsyncArrowHead[?Yield, ?Await][no LineTerminator here]=>AsyncConciseBody[?In]
            if (token === SyntaxKind.AsyncKeyword) {
                nextToken();
                // If the "async" is followed by "=>" token then it is not a begining of an async arrow-function
                // but instead a simple arrow-function which will be parsed inside "parseAssignmentExpressionOrHigher"
                if (scanner.hasPrecedingLineBreak() || token === SyntaxKind.EqualsGreaterThanToken) {
                    return 0 /* False */;
                }
                // Check for un-parenthesized AsyncArrowFunction
                var expr = parseBinaryExpressionOrHigher(/*precedence*/ 0);
                if (!scanner.hasPrecedingLineBreak() && expr.kind === SyntaxKind.Identifier && token === SyntaxKind.EqualsGreaterThanToken) {
                    return 1 /* True */;
                }
            }
            return 0 /* False */;
        }
        function parseParenthesizedArrowFunctionExpressionHead(allowAmbiguity) {
            var node = createNode(SyntaxKind.ArrowFunction);
            setModifiers(node, parseModifiersForArrowFunction());
            var isAsync = !!(node.flags & NodeFlags.Async);
            // Arrow functions are never generators.
            //
            // If we're speculatively parsing a signature for a parenthesized arrow function, then
            // we have to have a complete parameter list.  Otherwise we might see something like
            // a => (b => c)
            // And think that "(b =>" was actually a parenthesized arrow function with a missing
            // close paren.
            fillSignature(SyntaxKind.ColonToken, /*yieldContext*/ false, /*awaitContext*/ isAsync, /*requireCompleteParameterList*/ !allowAmbiguity, node);
            // If we couldn't get parameters, we definitely could not parse out an arrow function.
            if (!node.parameters) {
                return undefined;
            }
            // Parsing a signature isn't enough.
            // Parenthesized arrow signatures often look like other valid expressions.
            // For instance:
            //  - "(x = 10)" is an assignment expression parsed as a signature with a default parameter value.
            //  - "(x,y)" is a comma expression parsed as a signature with two parameters.
            //  - "a ? (b): c" will have "(b):" parsed as a signature with a return type annotation.
            //
            // So we need just a bit of lookahead to ensure that it can only be a signature.
            if (!allowAmbiguity && token !== SyntaxKind.EqualsGreaterThanToken && token !== SyntaxKind.OpenBraceToken) {
                // Returning undefined here will cause our caller to rewind to where we started from.
                return undefined;
            }
            return node;
        }
        function parseArrowFunctionExpressionBody(isAsync) {
            if (token === SyntaxKind.OpenBraceToken) {
                return parseFunctionBlock(/*allowYield*/ false, /*allowAwait*/ isAsync, /*ignoreMissingOpenBrace*/ false);
            }
            if (token !== SyntaxKind.SemicolonToken &&
                token !== SyntaxKind.FunctionKeyword &&
                token !== SyntaxKind.ClassKeyword &&
                isStartOfStatement() &&
                !isStartOfExpressionStatement()) {
                // Check if we got a plain statement (i.e. no expression-statements, no function/class expressions/declarations)
                //
                // Here we try to recover from a potential error situation in the case where the
                // user meant to supply a block. For example, if the user wrote:
                //
                //  a =>
                //      let v = 0;
                //  }
                //
                // they may be missing an open brace.  Check to see if that's the case so we can
                // try to recover better.  If we don't do this, then the next close curly we see may end
                // up preemptively closing the containing construct.
                //
                // Note: even when 'ignoreMissingOpenBrace' is passed as true, parseBody will still error.
                return parseFunctionBlock(/*allowYield*/ false, /*allowAwait*/ isAsync, /*ignoreMissingOpenBrace*/ true);
            }
            return isAsync
                ? doInAwaitContext(parseAssignmentExpressionOrHigher)
                : doOutsideOfAwaitContext(parseAssignmentExpressionOrHigher);
        }
        function parseConditionalExpressionRest(leftOperand) {
            // Note: we are passed in an expression which was produced from parseBinaryExpressionOrHigher.
            var questionToken = parseOptionalToken(SyntaxKind.QuestionToken);
            if (!questionToken) {
                return leftOperand;
            }
            // Note: we explicitly 'allowIn' in the whenTrue part of the condition expression, and
            // we do not that for the 'whenFalse' part.
            var node = createNode(SyntaxKind.ConditionalExpression, leftOperand.pos);
            node.condition = leftOperand;
            node.questionToken = questionToken;
            node.whenTrue = doOutsideOfContext(disallowInAndDecoratorContext, parseAssignmentExpressionOrHigher);
            node.colonToken = parseExpectedToken(SyntaxKind.ColonToken, /*reportAtCurrentPosition*/ false, Diagnostics._0_expected, tokenToString(SyntaxKind.ColonToken));
            node.whenFalse = parseAssignmentExpressionOrHigher();
            return finishNode(node);
        }
        function parseBinaryExpressionOrHigher(precedence) {
            var leftOperand = parseUnaryExpressionOrHigher();
            return parseBinaryExpressionRest(precedence, leftOperand);
        }
        function isInOrOfKeyword(t) {
            return t === SyntaxKind.InKeyword || t === SyntaxKind.OfKeyword;
        }
        function parseBinaryExpressionRest(precedence, leftOperand) {
            while (true) {
                // We either have a binary operator here, or we're finished.  We call
                // reScanGreaterToken so that we merge token sequences like > and = into >=
                reScanGreaterToken();
                var newPrecedence = getBinaryOperatorPrecedence();
                // Check the precedence to see if we should "take" this operator
                // - For left associative operator (all operator but **), consume the operator,
                //   recursively call the function below, and parse binaryExpression as a rightOperand
                //   of the caller if the new precedence of the operator is greater then or equal to the current precedence.
                //   For example:
                //      a - b - c;
                //            ^token; leftOperand = b. Return b to the caller as a rightOperand
                //      a * b - c
                //            ^token; leftOperand = b. Return b to the caller as a rightOperand
                //      a - b * c;
                //            ^token; leftOperand = b. Return b * c to the caller as a rightOperand
                // - For right associative operator (**), consume the operator, recursively call the function
                //   and parse binaryExpression as a rightOperand of the caller if the new precedence of
                //   the operator is strictly grater than the current precedence
                //   For example:
                //      a ** b ** c;
                //             ^^token; leftOperand = b. Return b ** c to the caller as a rightOperand
                //      a - b ** c;
                //            ^^token; leftOperand = b. Return b ** c to the caller as a rightOperand
                //      a ** b - c
                //             ^token; leftOperand = b. Return b to the caller as a rightOperand
                var consumeCurrentOperator = token === SyntaxKind.AsteriskAsteriskToken ?
                    newPrecedence >= precedence :
                    newPrecedence > precedence;
                if (!consumeCurrentOperator) {
                    break;
                }
                if (token === SyntaxKind.InKeyword && inDisallowInContext()) {
                    break;
                }
                if (token === SyntaxKind.AsKeyword) {
                    // Make sure we *do* perform ASI for constructs like this:
                    //    var x = foo
                    //    as (Bar)
                    // This should be parsed as an initialized variable, followed
                    // by a function call to 'as' with the argument 'Bar'
                    if (scanner.hasPrecedingLineBreak()) {
                        break;
                    }
                    else {
                        nextToken();
                        leftOperand = makeAsExpression(leftOperand, parseType());
                    }
                }
                else {
                    leftOperand = makeBinaryExpression(leftOperand, parseTokenNode(), parseBinaryExpressionOrHigher(newPrecedence));
                }
            }
            return leftOperand;
        }
        function isBinaryOperator() {
            if (inDisallowInContext() && token === SyntaxKind.InKeyword) {
                return false;
            }
            return getBinaryOperatorPrecedence() > 0;
        }
        function getBinaryOperatorPrecedence() {
            switch (token) {
                case SyntaxKind.BarBarToken:
                    return 1;
                case SyntaxKind.AmpersandAmpersandToken:
                    return 2;
                case SyntaxKind.BarToken:
                    return 3;
                case SyntaxKind.CaretToken:
                    return 4;
                case SyntaxKind.AmpersandToken:
                    return 5;
                case SyntaxKind.EqualsEqualsToken:
                case SyntaxKind.ExclamationEqualsToken:
                case SyntaxKind.EqualsEqualsEqualsToken:
                case SyntaxKind.ExclamationEqualsEqualsToken:
                    return 6;
                case SyntaxKind.LessThanToken:
                case SyntaxKind.GreaterThanToken:
                case SyntaxKind.LessThanEqualsToken:
                case SyntaxKind.GreaterThanEqualsToken:
                case SyntaxKind.InstanceOfKeyword:
                case SyntaxKind.InKeyword:
                case SyntaxKind.AsKeyword:
                    return 7;
                case SyntaxKind.LessThanLessThanToken:
                case SyntaxKind.GreaterThanGreaterThanToken:
                case SyntaxKind.GreaterThanGreaterThanGreaterThanToken:
                    return 8;
                case SyntaxKind.PlusToken:
                case SyntaxKind.MinusToken:
                    return 9;
                case SyntaxKind.AsteriskToken:
                case SyntaxKind.SlashToken:
                case SyntaxKind.PercentToken:
                    return 10;
                case SyntaxKind.AsteriskAsteriskToken:
                    return 11;
            }
            // -1 is lower than all other precedences.  Returning it will cause binary expression
            // parsing to stop.
            return -1;
        }
        function makeBinaryExpression(left, operatorToken, right) {
            var node = createNode(SyntaxKind.BinaryExpression, left.pos);
            node.left = left;
            node.operatorToken = operatorToken;
            node.right = right;
            return finishNode(node);
        }
        function makeAsExpression(left, right) {
            var node = createNode(SyntaxKind.AsExpression, left.pos);
            node.expression = left;
            node.type = right;
            return finishNode(node);
        }
        function parsePrefixUnaryExpression() {
            var node = createNode(SyntaxKind.PrefixUnaryExpression);
            node.operator = token;
            nextToken();
            node.operand = parseSimpleUnaryExpression();
            return finishNode(node);
        }
        function isAwaitExpression() {
            if (token === SyntaxKind.AwaitKeyword) {
                if (inAwaitContext()) {
                    return true;
                }
                // here we are using similar heuristics as 'isYieldExpression'
                return lookAhead(nextTokenIsIdentifierOnSameLine);
            }
            return false;
        }
        function parseAwaitExpression() {
            var node = createNode(SyntaxKind.AwaitExpression);
            nextToken();
            node.expression = parseSimpleUnaryExpression();
            return finishNode(node);
        }
        /**
         * Parse ES7 unary expression and await expression
         *
         * ES7 UnaryExpression:
         *      1) SimpleUnaryExpression[?yield]
         *      2) IncrementExpression[?yield] ** UnaryExpression[?yield]
         */
        function parseUnaryExpressionOrHigher() {
            if (isAwaitExpression()) {
                return parseAwaitExpression();
            }
            if (isIncrementExpression()) {
                var incrementExpression = parseIncrementExpression();
                return token === SyntaxKind.AsteriskAsteriskToken ?
                    parseBinaryExpressionRest(getBinaryOperatorPrecedence(), incrementExpression) :
                    incrementExpression;
            }
            var unaryOperator = token;
            var simpleUnaryExpression = parseSimpleUnaryExpression();
            if (token === SyntaxKind.AsteriskAsteriskToken) {
                var start = skipTrivia(sourceText, simpleUnaryExpression.pos);
                if (simpleUnaryExpression.kind === SyntaxKind.TypeAssertionExpression) {
                    parseErrorAtPosition(start, simpleUnaryExpression.end - start, Diagnostics.A_type_assertion_expression_is_not_allowed_in_the_left_hand_side_of_an_exponentiation_expression_Consider_enclosing_the_expression_in_parentheses);
                }
                else {
                    parseErrorAtPosition(start, simpleUnaryExpression.end - start, Diagnostics.An_unary_expression_with_the_0_operator_is_not_allowed_in_the_left_hand_side_of_an_exponentiation_expression_Consider_enclosing_the_expression_in_parentheses, tokenToString(unaryOperator));
                }
            }
            return simpleUnaryExpression;
        }
        /**
         * Parse ES7 simple-unary expression or higher:
         *
         * ES7 SimpleUnaryExpression:
         *      1) IncrementExpression[?yield]
         *      2) delete UnaryExpression[?yield]
         *      3) void UnaryExpression[?yield]
         *      4) typeof UnaryExpression[?yield]
         *      5) + UnaryExpression[?yield]
         *      6) - UnaryExpression[?yield]
         *      7) ~ UnaryExpression[?yield]
         *      8) ! UnaryExpression[?yield]
         */
        function parseSimpleUnaryExpression() {
            switch (token) {
                case SyntaxKind.LessThanToken:
                    // This is modified UnaryExpression grammar in TypeScript
                    //  UnaryExpression (modified):
                    //      < type > UnaryExpression
                    return parseTypeAssertion();
                default:
                    return parseIncrementExpression();
            }
        }
        /**
         * Check if the current token can possibly be an ES7 increment expression.
         *
         * ES7 IncrementExpression:
         *      LeftHandSideExpression[?Yield]
         *      LeftHandSideExpression[?Yield][no LineTerminator here]++
         *      LeftHandSideExpression[?Yield][no LineTerminator here]--
         *      ++LeftHandSideExpression[?Yield]
         *      --LeftHandSideExpression[?Yield]
         */
        function isIncrementExpression() {
            // This function is called inside parseUnaryExpression to decide
            // whether to call parseSimpleUnaryExpression or call parseIncrementExpression directly
            switch (token) {
                case SyntaxKind.PlusToken:
                case SyntaxKind.MinusToken:
                case SyntaxKind.TildeToken:
                case SyntaxKind.ExclamationToken:
                case SyntaxKind.DeleteKeyword:
                case SyntaxKind.TypeOfKeyword:
                case SyntaxKind.VoidKeyword:
                    return false;
                case SyntaxKind.LessThanToken:
                    // If we are not in JSX context, we are parsing TypeAssertion which is an UnaryExpression
                    if (sourceFile.languageVariant !== LanguageVariant.JSX) {
                        return false;
                    }
                // We are in JSX context and the token is part of JSXElement.
                // Fall through
                default:
                    return true;
            }
        }
        /**
         * Parse ES7 IncrementExpression. IncrementExpression is used instead of ES6's PostFixExpression.
         *
         * ES7 IncrementExpression[yield]:
         *      1) LeftHandSideExpression[?yield]
         *      2) LeftHandSideExpression[?yield] [[no LineTerminator here]]++
         *      3) LeftHandSideExpression[?yield] [[no LineTerminator here]]--
         *      4) ++LeftHandSideExpression[?yield]
         *      5) --LeftHandSideExpression[?yield]
         * In TypeScript (2), (3) are parsed as PostfixUnaryExpression. (4), (5) are parsed as PrefixUnaryExpression
         */
        function parseIncrementExpression() {
            if (token === SyntaxKind.PlusPlusToken || token === SyntaxKind.MinusMinusToken) {
                var node = createNode(SyntaxKind.PrefixUnaryExpression);
                node.operator = token;
                nextToken();
                node.operand = parseLeftHandSideExpressionOrHigher();
                return finishNode(node);
            }
            else if (sourceFile.languageVariant === LanguageVariant.JSX && token === SyntaxKind.LessThanToken && lookAhead(nextTokenIsIdentifierOrKeyword)) {
                // JSXElement is part of primaryExpression
                return parseJsxElementOrSelfClosingElement(/*inExpressionContext*/ true);
            }
            var expression = parseLeftHandSideExpressionOrHigher();
            Debug.assert(isLeftHandSideExpression(expression));
            if ((token === SyntaxKind.PlusPlusToken || token === SyntaxKind.MinusMinusToken) && !scanner.hasPrecedingLineBreak()) {
                var node = createNode(SyntaxKind.PostfixUnaryExpression, expression.pos);
                node.operand = expression;
                node.operator = token;
                nextToken();
                return finishNode(node);
            }
            return expression;
        }
        function parseLeftHandSideExpressionOrHigher() {
            // Original Ecma:
            // LeftHandSideExpression: See 11.2
            //      NewExpression
            //      CallExpression
            //
            // Our simplification:
            //
            // LeftHandSideExpression: See 11.2
            //      MemberExpression
            //      CallExpression
            //
            // See comment in parseMemberExpressionOrHigher on how we replaced NewExpression with
            // MemberExpression to make our lives easier.
            //
            // to best understand the below code, it's important to see how CallExpression expands
            // out into its own productions:
            //
            // CallExpression:
            //      MemberExpression Arguments
            //      CallExpression Arguments
            //      CallExpression[Expression]
            //      CallExpression.IdentifierName
            //      super   (   ArgumentListopt   )
            //      super.IdentifierName
            //
            // Because of the recursion in these calls, we need to bottom out first.  There are two
            // bottom out states we can run into.  Either we see 'super' which must start either of
            // the last two CallExpression productions.  Or we have a MemberExpression which either
            // completes the LeftHandSideExpression, or starts the beginning of the first four
            // CallExpression productions.
            var expression = token === SyntaxKind.SuperKeyword
                ? parseSuperExpression()
                : parseMemberExpressionOrHigher();
            // Now, we *may* be complete.  However, we might have consumed the start of a
            // CallExpression.  As such, we need to consume the rest of it here to be complete.
            return parseCallExpressionRest(expression);
        }
        function parseMemberExpressionOrHigher() {
            // Note: to make our lives simpler, we decompose the the NewExpression productions and
            // place ObjectCreationExpression and FunctionExpression into PrimaryExpression.
            // like so:
            //
            //   PrimaryExpression : See 11.1
            //      this
            //      Identifier
            //      Literal
            //      ArrayLiteral
            //      ObjectLiteral
            //      (Expression)
            //      FunctionExpression
            //      new MemberExpression Arguments?
            //
            //   MemberExpression : See 11.2
            //      PrimaryExpression
            //      MemberExpression[Expression]
            //      MemberExpression.IdentifierName
            //
            //   CallExpression : See 11.2
            //      MemberExpression
            //      CallExpression Arguments
            //      CallExpression[Expression]
            //      CallExpression.IdentifierName
            //
            // Technically this is ambiguous.  i.e. CallExpression defines:
            //
            //   CallExpression:
            //      CallExpression Arguments
            //
            // If you see: "new Foo()"
            //
            // Then that could be treated as a single ObjectCreationExpression, or it could be
            // treated as the invocation of "new Foo".  We disambiguate that in code (to match
            // the original grammar) by making sure that if we see an ObjectCreationExpression
            // we always consume arguments if they are there. So we treat "new Foo()" as an
            // object creation only, and not at all as an invocation)  Another way to think
            // about this is that for every "new" that we see, we will consume an argument list if
            // it is there as part of the *associated* object creation node.  Any additional
            // argument lists we see, will become invocation expressions.
            //
            // Because there are no other places in the grammar now that refer to FunctionExpression
            // or ObjectCreationExpression, it is safe to push down into the PrimaryExpression
            // production.
            //
            // Because CallExpression and MemberExpression are left recursive, we need to bottom out
            // of the recursion immediately.  So we parse out a primary expression to start with.
            var expression = parsePrimaryExpression();
            return parseMemberExpressionRest(expression);
        }
        function parseSuperExpression() {
            var expression = parseTokenNode();
            if (token === SyntaxKind.OpenParenToken || token === SyntaxKind.DotToken || token === SyntaxKind.OpenBracketToken) {
                return expression;
            }
            // If we have seen "super" it must be followed by '(' or '.'.
            // If it wasn't then just try to parse out a '.' and report an error.
            var node = createNode(SyntaxKind.PropertyAccessExpression, expression.pos);
            node.expression = expression;
            parseExpectedToken(SyntaxKind.DotToken, /*reportAtCurrentPosition*/ false, Diagnostics.super_must_be_followed_by_an_argument_list_or_member_access);
            node.name = parseRightSideOfDot(/*allowIdentifierNames*/ true);
            return finishNode(node);
        }
        function tagNamesAreEquivalent(lhs, rhs) {
            if (lhs.kind !== rhs.kind) {
                return false;
            }
            if (lhs.kind === SyntaxKind.Identifier) {
                return lhs.text === rhs.text;
            }
            if (lhs.kind === SyntaxKind.ThisKeyword) {
                return true;
            }
            // If we are at this statement then we must have PropertyAccessExpression and because tag name in Jsx element can only
            // take forms of JsxTagNameExpression which includes an identifier, "this" expression, or another propertyAccessExpression
            // it is safe to case the expression property as such. See parseJsxElementName for how we parse tag name in Jsx element
            return lhs.name.text === rhs.name.text &&
                tagNamesAreEquivalent(lhs.expression, rhs.expression);
        }
        function parseJsxElementOrSelfClosingElement(inExpressionContext) {
            var opening = parseJsxOpeningOrSelfClosingElement(inExpressionContext);
            var result;
            if (opening.kind === SyntaxKind.JsxOpeningElement) {
                var node = createNode(SyntaxKind.JsxElement, opening.pos);
                node.openingElement = opening;
                node.children = parseJsxChildren(node.openingElement.tagName);
                node.closingElement = parseJsxClosingElement(inExpressionContext);
                if (!tagNamesAreEquivalent(node.openingElement.tagName, node.closingElement.tagName)) {
                    parseErrorAtPosition(node.closingElement.pos, node.closingElement.end - node.closingElement.pos, Diagnostics.Expected_corresponding_JSX_closing_tag_for_0, getTextOfNodeFromSourceText(sourceText, node.openingElement.tagName));
                }
                result = finishNode(node);
            }
            else {
                Debug.assert(opening.kind === SyntaxKind.JsxSelfClosingElement);
                // Nothing else to do for self-closing elements
                result = opening;
            }
            // If the user writes the invalid code '<div></div><div></div>' in an expression context (i.e. not wrapped in
            // an enclosing tag), we'll naively try to parse   ^ this as a 'less than' operator and the remainder of the tag
            // as garbage, which will cause the formatter to badly mangle the JSX. Perform a speculative parse of a JSX
            // element if we see a < token so that we can wrap it in a synthetic binary expression so the formatter
            // does less damage and we can report a better error.
            // Since JSX elements are invalid < operands anyway, this lookahead parse will only occur in error scenarios
            // of one sort or another.
            if (inExpressionContext && token === SyntaxKind.LessThanToken) {
                var invalidElement = tryParse(function () { return parseJsxElementOrSelfClosingElement(/*inExpressionContext*/ true); });
                if (invalidElement) {
                    parseErrorAtCurrentToken(Diagnostics.JSX_expressions_must_have_one_parent_element);
                    var badNode = createNode(SyntaxKind.BinaryExpression, result.pos);
                    badNode.end = invalidElement.end;
                    badNode.left = result;
                    badNode.right = invalidElement;
                    badNode.operatorToken = createMissingNode(SyntaxKind.CommaToken, /*reportAtCurrentPosition*/ false, /*diagnosticMessage*/ undefined);
                    badNode.operatorToken.pos = badNode.operatorToken.end = badNode.right.pos;
                    return badNode;
                }
            }
            return result;
        }
        function parseJsxText() {
            var node = createNode(SyntaxKind.JsxText, scanner.getStartPos());
            token = scanner.scanJsxToken();
            return finishNode(node);
        }
        function parseJsxChild() {
            switch (token) {
                case SyntaxKind.JsxText:
                    return parseJsxText();
                case SyntaxKind.OpenBraceToken:
                    return parseJsxExpression(/*inExpressionContext*/ false);
                case SyntaxKind.LessThanToken:
                    return parseJsxElementOrSelfClosingElement(/*inExpressionContext*/ false);
            }
            Debug.fail("Unknown JSX child kind " + token);
        }
        function parseJsxChildren(openingTagName) {
            var result = [];
            result.pos = scanner.getStartPos();
            var saveParsingContext = parsingContext;
            parsingContext |= 1 << 14 /* JsxChildren */;
            while (true) {
                token = scanner.reScanJsxToken();
                if (token === SyntaxKind.LessThanSlashToken) {
                    // Closing tag
                    break;
                }
                else if (token === SyntaxKind.EndOfFileToken) {
                    // If we hit EOF, issue the error at the tag that lacks the closing element
                    // rather than at the end of the file (which is useless)
                    parseErrorAtPosition(openingTagName.pos, openingTagName.end - openingTagName.pos, Diagnostics.JSX_element_0_has_no_corresponding_closing_tag, getTextOfNodeFromSourceText(sourceText, openingTagName));
                    break;
                }
                result.push(parseJsxChild());
            }
            result.end = scanner.getTokenPos();
            parsingContext = saveParsingContext;
            return result;
        }
        function parseJsxOpeningOrSelfClosingElement(inExpressionContext) {
            var fullStart = scanner.getStartPos();
            parseExpected(SyntaxKind.LessThanToken);
            var tagName = parseJsxElementName();
            var attributes = parseList(13 /* JsxAttributes */, parseJsxAttribute);
            var node;
            if (token === SyntaxKind.GreaterThanToken) {
                // Closing tag, so scan the immediately-following text with the JSX scanning instead
                // of regular scanning to avoid treating illegal characters (e.g. '#') as immediate
                // scanning errors
                node = createNode(SyntaxKind.JsxOpeningElement, fullStart);
                scanJsxText();
            }
            else {
                parseExpected(SyntaxKind.SlashToken);
                if (inExpressionContext) {
                    parseExpected(SyntaxKind.GreaterThanToken);
                }
                else {
                    parseExpected(SyntaxKind.GreaterThanToken, /*diagnostic*/ undefined, /*shouldAdvance*/ false);
                    scanJsxText();
                }
                node = createNode(SyntaxKind.JsxSelfClosingElement, fullStart);
            }
            node.tagName = tagName;
            node.attributes = attributes;
            return finishNode(node);
        }
        function parseJsxElementName() {
            scanJsxIdentifier();
            // JsxElement can have name in the form of
            //      propertyAccessExpression
            //      primaryExpression in the form of an identifier and "this" keyword
            // We can't just simply use parseLeftHandSideExpressionOrHigher because then we will start consider class,function etc as a keyword
            // We only want to consider "this" as a primaryExpression
            var expression = token === SyntaxKind.ThisKeyword ?
                parseTokenNode() : parseIdentifierName();
            while (parseOptional(SyntaxKind.DotToken)) {
                var propertyAccess = createNode(SyntaxKind.PropertyAccessExpression, expression.pos);
                propertyAccess.expression = expression;
                propertyAccess.name = parseRightSideOfDot(/*allowIdentifierNames*/ true);
                expression = finishNode(propertyAccess);
            }
            return expression;
        }
        function parseJsxExpression(inExpressionContext) {
            var node = createNode(SyntaxKind.JsxExpression);
            parseExpected(SyntaxKind.OpenBraceToken);
            if (token !== SyntaxKind.CloseBraceToken) {
                node.expression = parseAssignmentExpressionOrHigher();
            }
            if (inExpressionContext) {
                parseExpected(SyntaxKind.CloseBraceToken);
            }
            else {
                parseExpected(SyntaxKind.CloseBraceToken, /*message*/ undefined, /*shouldAdvance*/ false);
                scanJsxText();
            }
            return finishNode(node);
        }
        function parseJsxAttribute() {
            if (token === SyntaxKind.OpenBraceToken) {
                return parseJsxSpreadAttribute();
            }
            scanJsxIdentifier();
            var node = createNode(SyntaxKind.JsxAttribute);
            node.name = parseIdentifierName();
            if (parseOptional(SyntaxKind.EqualsToken)) {
                switch (token) {
                    case SyntaxKind.StringLiteral:
                        node.initializer = parseLiteralNode();
                        break;
                    default:
                        node.initializer = parseJsxExpression(/*inExpressionContext*/ true);
                        break;
                }
            }
            return finishNode(node);
        }
        function parseJsxSpreadAttribute() {
            var node = createNode(SyntaxKind.JsxSpreadAttribute);
            parseExpected(SyntaxKind.OpenBraceToken);
            parseExpected(SyntaxKind.DotDotDotToken);
            node.expression = parseExpression();
            parseExpected(SyntaxKind.CloseBraceToken);
            return finishNode(node);
        }
        function parseJsxClosingElement(inExpressionContext) {
            var node = createNode(SyntaxKind.JsxClosingElement);
            parseExpected(SyntaxKind.LessThanSlashToken);
            node.tagName = parseJsxElementName();
            if (inExpressionContext) {
                parseExpected(SyntaxKind.GreaterThanToken);
            }
            else {
                parseExpected(SyntaxKind.GreaterThanToken, /*diagnostic*/ undefined, /*shouldAdvance*/ false);
                scanJsxText();
            }
            return finishNode(node);
        }
        function parseTypeAssertion() {
            var node = createNode(SyntaxKind.TypeAssertionExpression);
            parseExpected(SyntaxKind.LessThanToken);
            node.type = parseType();
            parseExpected(SyntaxKind.GreaterThanToken);
            node.expression = parseSimpleUnaryExpression();
            return finishNode(node);
        }
        function parseMemberExpressionRest(expression) {
            while (true) {
                var dotToken = parseOptionalToken(SyntaxKind.DotToken);
                if (dotToken) {
                    var propertyAccess = createNode(SyntaxKind.PropertyAccessExpression, expression.pos);
                    propertyAccess.expression = expression;
                    propertyAccess.name = parseRightSideOfDot(/*allowIdentifierNames*/ true);
                    expression = finishNode(propertyAccess);
                    continue;
                }
                if (token === SyntaxKind.ExclamationToken && !scanner.hasPrecedingLineBreak()) {
                    nextToken();
                    var nonNullExpression = createNode(SyntaxKind.NonNullExpression, expression.pos);
                    nonNullExpression.expression = expression;
                    expression = finishNode(nonNullExpression);
                    continue;
                }
                // when in the [Decorator] context, we do not parse ElementAccess as it could be part of a ComputedPropertyName
                if (!inDecoratorContext() && parseOptional(SyntaxKind.OpenBracketToken)) {
                    var indexedAccess = createNode(SyntaxKind.ElementAccessExpression, expression.pos);
                    indexedAccess.expression = expression;
                    // It's not uncommon for a user to write: "new Type[]".
                    // Check for that common pattern and report a better error message.
                    if (token !== SyntaxKind.CloseBracketToken) {
                        indexedAccess.argumentExpression = allowInAnd(parseExpression);
                        if (indexedAccess.argumentExpression.kind === SyntaxKind.StringLiteral || indexedAccess.argumentExpression.kind === SyntaxKind.NumericLiteral) {
                            var literal = indexedAccess.argumentExpression;
                            literal.text = internIdentifier(literal.text);
                        }
                    }
                    parseExpected(SyntaxKind.CloseBracketToken);
                    expression = finishNode(indexedAccess);
                    continue;
                }
                if (token === SyntaxKind.NoSubstitutionTemplateLiteral || token === SyntaxKind.TemplateHead) {
                    var tagExpression = createNode(SyntaxKind.TaggedTemplateExpression, expression.pos);
                    tagExpression.tag = expression;
                    tagExpression.template = token === SyntaxKind.NoSubstitutionTemplateLiteral
                        ? parseLiteralNode()
                        : parseTemplateExpression();
                    expression = finishNode(tagExpression);
                    continue;
                }
                return expression;
            }
        }
        function parseCallExpressionRest(expression) {
            while (true) {
                expression = parseMemberExpressionRest(expression);
                if (token === SyntaxKind.LessThanToken) {
                    var callExpr = createNode(SyntaxKind.CallExpression, expression.pos);
                    callExpr.expression = expression;
                    callExpr.arguments = parseArgumentList();
                    expression = finishNode(callExpr);
                    continue;
                }
                else if (token === SyntaxKind.OpenParenToken) {
                    var callExpr = createNode(SyntaxKind.CallExpression, expression.pos);
                    callExpr.expression = expression;
                    callExpr.arguments = parseArgumentList();
                    expression = finishNode(callExpr);
                    continue;
                }
                return expression;
            }
        }
        function parseArgumentList() {
            parseExpected(SyntaxKind.OpenParenToken);
            var result = parseDelimitedList(11 /* ArgumentExpressions */, parseArgumentExpression);
            parseExpected(SyntaxKind.CloseParenToken);
            return result;
        }
        function parseSpreadElement() {
            var node = createNode(SyntaxKind.SpreadElementExpression);
            parseExpected(SyntaxKind.DotDotDotToken);
            node.expression = parseAssignmentExpressionOrHigher();
            return finishNode(node);
        }
        function parseArgumentExpression() {
            return doOutsideOfContext(disallowInAndDecoratorContext, parseArgumentOrArrayLiteralElement);
        }
        function tryParseAccessorDeclaration(fullStart, decorators, modifiers) {
            if (parseContextualModifier(SyntaxKind.GetKeyword)) {
                return addJSDocComment(parseAccessorDeclaration(SyntaxKind.GetAccessor, fullStart, decorators, modifiers));
            }
            else if (parseContextualModifier(SyntaxKind.SetKeyword)) {
                return parseAccessorDeclaration(SyntaxKind.SetAccessor, fullStart, decorators, modifiers);
            }
            return undefined;
        }
        function parseObjectLiteralElement() {
            var fullStart = scanner.getStartPos();
            var decorators = parseDecorators();
            var modifiers = parseModifiers();
            var accessor = tryParseAccessorDeclaration(fullStart, decorators, modifiers);
            if (accessor) {
                return accessor;
            }
            var asteriskToken = parseOptionalToken(SyntaxKind.AsteriskToken);
            var tokenIsIdentifier = isIdentifier();
            var propertyName = parsePropertyName();
            // Disallowing of optional property assignments happens in the grammar checker.
            var questionToken = parseOptionalToken(SyntaxKind.QuestionToken);
            if (asteriskToken || token === SyntaxKind.OpenParenToken || token === SyntaxKind.LessThanToken) {
                return parseMethodDeclaration(fullStart, decorators, modifiers, asteriskToken, propertyName, questionToken);
            }
            // check if it is short-hand property assignment or normal property assignment
            // NOTE: if token is EqualsToken it is interpreted as CoverInitializedName production
            // CoverInitializedName[Yield] :
            //     IdentifierReference[?Yield] Initializer[In, ?Yield]
            // this is necessary because ObjectLiteral productions are also used to cover grammar for ObjectAssignmentPattern
            var isShorthandPropertyAssignment = tokenIsIdentifier && (token === SyntaxKind.CommaToken || token === SyntaxKind.CloseBraceToken || token === SyntaxKind.EqualsToken);
            if (isShorthandPropertyAssignment) {
                var shorthandDeclaration = createNode(SyntaxKind.ShorthandPropertyAssignment, fullStart);
                shorthandDeclaration.name = propertyName;
                shorthandDeclaration.questionToken = questionToken;
                var equalsToken = parseOptionalToken(SyntaxKind.EqualsToken);
                if (equalsToken) {
                    shorthandDeclaration.equalsToken = equalsToken;
                    shorthandDeclaration.objectAssignmentInitializer = allowInAnd(parseAssignmentExpressionOrHigher);
                }
                return addJSDocComment(finishNode(shorthandDeclaration));
            }
            else {
                var propertyAssignment = createNode(SyntaxKind.PropertyAssignment, fullStart);
                propertyAssignment.modifiers = modifiers;
                propertyAssignment.name = propertyName;
                propertyAssignment.questionToken = questionToken;
                parseExpected(SyntaxKind.ColonToken);
                propertyAssignment.initializer = allowInAnd(parseAssignmentExpressionOrHigher);
                return addJSDocComment(finishNode(propertyAssignment));
            }
        }
        function parseFunctionExpression() {
            // GeneratorExpression:
            //      function* BindingIdentifier [Yield][opt](FormalParameters[Yield]){ GeneratorBody }
            //
            // FunctionExpression:
            //      function BindingIdentifier[opt](FormalParameters){ FunctionBody }
            var saveDecoratorContext = inDecoratorContext();
            if (saveDecoratorContext) {
                setDecoratorContext(/*val*/ false);
            }
            var node = createNode(SyntaxKind.FunctionExpression);
            setModifiers(node, parseModifiers());
            parseExpected(SyntaxKind.FunctionKeyword);
            node.asteriskToken = parseOptionalToken(SyntaxKind.AsteriskToken);
            var isGenerator = !!node.asteriskToken;
            var isAsync = !!(node.flags & NodeFlags.Async);
            node.name =
                isGenerator && isAsync ? doInYieldAndAwaitContext(parseOptionalIdentifier) :
                    isGenerator ? doInYieldContext(parseOptionalIdentifier) :
                        isAsync ? doInAwaitContext(parseOptionalIdentifier) :
                            parseOptionalIdentifier();
            fillSignature(SyntaxKind.ColonToken, /*yieldContext*/ isGenerator, /*awaitContext*/ isAsync, /*requireCompleteParameterList*/ false, node);
            node.body = parseFunctionBlock(/*allowYield*/ isGenerator, /*allowAwait*/ isAsync, /*ignoreMissingOpenBrace*/ false);
            if (saveDecoratorContext) {
                setDecoratorContext(/*val*/ true);
            }
            return addJSDocComment(finishNode(node));
        }
        function parseOptionalIdentifier() {
            return isIdentifier() ? parseIdentifier() : undefined;
        }
        // STATEMENTS
        function parseFunctionBlock(allowYield, allowAwait, ignoreMissingOpenBrace, diagnosticMessage) {
            var savedYieldContext = inYieldContext();
            setYieldContext(allowYield);
            var savedAwaitContext = inAwaitContext();
            setAwaitContext(allowAwait);
            // We may be in a [Decorator] context when parsing a function expression or
            // arrow function. The body of the function is not in [Decorator] context.
            var saveDecoratorContext = inDecoratorContext();
            if (saveDecoratorContext) {
                setDecoratorContext(/*val*/ false);
            }
            var block = parseBlock(ignoreMissingOpenBrace, diagnosticMessage);
            if (saveDecoratorContext) {
                setDecoratorContext(/*val*/ true);
            }
            setYieldContext(savedYieldContext);
            setAwaitContext(savedAwaitContext);
            return block;
        }
        function parseExpressionOrLabeledStatement() {
            // Avoiding having to do the lookahead for a labeled statement by just trying to parse
            // out an expression, seeing if it is identifier and then seeing if it is followed by
            // a colon.
            var fullStart = scanner.getStartPos();
            var expression = allowInAnd(parseExpression);
            if (expression.kind === SyntaxKind.Identifier && parseOptional(SyntaxKind.ColonToken)) {
                var labeledStatement = createNode(SyntaxKind.LabeledStatement, fullStart);
                labeledStatement.label = expression;
                labeledStatement.statement = parseStatement();
                return addJSDocComment(finishNode(labeledStatement));
            }
            else {
                var expressionStatement = createNode(SyntaxKind.ExpressionStatement, fullStart);
                expressionStatement.expression = expression;
                parseSemicolon();
                return addJSDocComment(finishNode(expressionStatement));
            }
        }
        function nextTokenIsIdentifierOrKeywordOnSameLine() {
            nextToken();
            return tokenIsIdentifierOrKeyword(token) && !scanner.hasPrecedingLineBreak();
        }
        function nextTokenIsFunctionKeywordOnSameLine() {
            nextToken();
            return token === SyntaxKind.FunctionKeyword && !scanner.hasPrecedingLineBreak();
        }
        function nextTokenIsIdentifierOrKeywordOrNumberOnSameLine() {
            nextToken();
            return (tokenIsIdentifierOrKeyword(token) || token === SyntaxKind.NumericLiteral) && !scanner.hasPrecedingLineBreak();
        }
        function isDeclaration() {
            while (true) {
                switch (token) {
                    case SyntaxKind.VarKeyword:
                    case SyntaxKind.LetKeyword:
                    case SyntaxKind.ConstKeyword:
                    case SyntaxKind.FunctionKeyword:
                    case SyntaxKind.ClassKeyword:
                    case SyntaxKind.EnumKeyword:
                        return true;
                    // 'declare', 'module', 'namespace', 'interface'* and 'type' are all legal JavaScript identifiers;
                    // however, an identifier cannot be followed by another identifier on the same line. This is what we
                    // count on to parse out the respective declarations. For instance, we exploit this to say that
                    //
                    //    namespace n
                    //
                    // can be none other than the beginning of a namespace declaration, but need to respect that JavaScript sees
                    //
                    //    namespace
                    //    n
                    //
                    // as the identifier 'namespace' on one line followed by the identifier 'n' on another.
                    // We need to look one token ahead to see if it permissible to try parsing a declaration.
                    //
                    // *Note*: 'interface' is actually a strict mode reserved word. So while
                    //
                    //   "use strict"
                    //   interface
                    //   I {}
                    //
                    // could be legal, it would add complexity for very little gain.
                    case SyntaxKind.InterfaceKeyword:
                    case SyntaxKind.TypeKeyword:
                        return nextTokenIsIdentifierOnSameLine();
                    case SyntaxKind.ModuleKeyword:
                    case SyntaxKind.NamespaceKeyword:
                        return nextTokenIsIdentifierOrStringLiteralOnSameLine();
                    case SyntaxKind.AbstractKeyword:
                    case SyntaxKind.AsyncKeyword:
                    case SyntaxKind.DeclareKeyword:
                    case SyntaxKind.PrivateKeyword:
                    case SyntaxKind.ProtectedKeyword:
                    case SyntaxKind.PublicKeyword:
                    case SyntaxKind.ReadonlyKeyword:
                        nextToken();
                        // ASI takes effect for this modifier.
                        if (scanner.hasPrecedingLineBreak()) {
                            return false;
                        }
                        continue;
                    case SyntaxKind.GlobalKeyword:
                        nextToken();
                        return token === SyntaxKind.OpenBraceToken || token === SyntaxKind.Identifier || token === SyntaxKind.ExportKeyword;
                    case SyntaxKind.ImportKeyword:
                        nextToken();
                        return token === SyntaxKind.StringLiteral || token === SyntaxKind.AsteriskToken ||
                            token === SyntaxKind.OpenBraceToken || tokenIsIdentifierOrKeyword(token);
                    case SyntaxKind.ExportKeyword:
                        nextToken();
                        if (token === SyntaxKind.EqualsToken || token === SyntaxKind.AsteriskToken ||
                            token === SyntaxKind.OpenBraceToken || token === SyntaxKind.DefaultKeyword ||
                            token === SyntaxKind.AsKeyword) {
                            return true;
                        }
                        continue;
                    case SyntaxKind.StaticKeyword:
                        nextToken();
                        continue;
                    default:
                        return false;
                }
            }
        }
        function isStartOfDeclaration() {
            return lookAhead(isDeclaration);
        }
        function isStartOfStatement() {
            switch (token) {
                case SyntaxKind.AtToken:
                case SyntaxKind.SemicolonToken:
                case SyntaxKind.OpenBraceToken:
                case SyntaxKind.VarKeyword:
                case SyntaxKind.LetKeyword:
                case SyntaxKind.FunctionKeyword:
                case SyntaxKind.ClassKeyword:
                case SyntaxKind.EnumKeyword:
                case SyntaxKind.IfKeyword:
                case SyntaxKind.DoKeyword:
                case SyntaxKind.WhileKeyword:
                case SyntaxKind.ForKeyword:
                case SyntaxKind.ContinueKeyword:
                case SyntaxKind.BreakKeyword:
                case SyntaxKind.ReturnKeyword:
                case SyntaxKind.WithKeyword:
                case SyntaxKind.SwitchKeyword:
                case SyntaxKind.ThrowKeyword:
                case SyntaxKind.TryKeyword:
                case SyntaxKind.DebuggerKeyword:
                // 'catch' and 'finally' do not actually indicate that the code is part of a statement,
                // however, we say they are here so that we may gracefully parse them and error later.
                case SyntaxKind.CatchKeyword:
                case SyntaxKind.FinallyKeyword:
                    return true;
                case SyntaxKind.ConstKeyword:
                case SyntaxKind.ExportKeyword:
                case SyntaxKind.ImportKeyword:
                    return isStartOfDeclaration();
                case SyntaxKind.AsyncKeyword:
                case SyntaxKind.DeclareKeyword:
                case SyntaxKind.InterfaceKeyword:
                case SyntaxKind.ModuleKeyword:
                case SyntaxKind.NamespaceKeyword:
                case SyntaxKind.TypeKeyword:
                case SyntaxKind.GlobalKeyword:
                    // When these don't start a declaration, they're an identifier in an expression statement
                    return true;
                case SyntaxKind.PublicKeyword:
                case SyntaxKind.PrivateKeyword:
                case SyntaxKind.ProtectedKeyword:
                case SyntaxKind.StaticKeyword:
                case SyntaxKind.ReadonlyKeyword:
                    // When these don't start a declaration, they may be the start of a class member if an identifier
                    // immediately follows. Otherwise they're an identifier in an expression statement.
                    return isStartOfDeclaration() || !lookAhead(nextTokenIsIdentifierOrKeywordOnSameLine);
                default:
                    return isStartOfExpression();
            }
        }
        function parseStatement() {
            switch (token) {
                case SyntaxKind.FunctionKeyword:
                    return parseFunctionDeclaration(scanner.getStartPos(), /*decorators*/ undefined, /*modifiers*/ undefined);
                case SyntaxKind.ClassKeyword:
                    return parseClassDeclaration(scanner.getStartPos(), /*decorators*/ undefined, /*modifiers*/ undefined);
                case SyntaxKind.AtToken:
                    return parseDeclaration();
                case SyntaxKind.AsyncKeyword:
                case SyntaxKind.InterfaceKeyword:
                case SyntaxKind.TypeKeyword:
                case SyntaxKind.ModuleKeyword:
                case SyntaxKind.NamespaceKeyword:
                case SyntaxKind.DeclareKeyword:
                case SyntaxKind.ConstKeyword:
                case SyntaxKind.EnumKeyword:
                case SyntaxKind.ExportKeyword:
                case SyntaxKind.ImportKeyword:
                case SyntaxKind.PrivateKeyword:
                case SyntaxKind.ProtectedKeyword:
                case SyntaxKind.PublicKeyword:
                case SyntaxKind.AbstractKeyword:
                case SyntaxKind.StaticKeyword:
                case SyntaxKind.ReadonlyKeyword:
                case SyntaxKind.GlobalKeyword:
                    if (isStartOfDeclaration()) {
                        return parseDeclaration();
                    }
                    break;
            }
            return parseExpressionOrLabeledStatement();
        }
        function parseDeclaration() {
            var fullStart = getNodePos();
            var decorators = parseDecorators();
            var modifiers = parseModifiers();
            switch (token) {
                case SyntaxKind.VarKeyword:
                case SyntaxKind.LetKeyword:
                case SyntaxKind.ConstKeyword:
                    return parseVariableStatement(fullStart, decorators, modifiers);
                case SyntaxKind.FunctionKeyword:
                    return parseFunctionDeclaration(fullStart, decorators, modifiers);
                case SyntaxKind.ClassKeyword:
                    return parseClassDeclaration(fullStart, decorators, modifiers);
                case SyntaxKind.InterfaceKeyword:
                    return parseInterfaceDeclaration(fullStart, decorators, modifiers);
                case SyntaxKind.TypeKeyword:
                    return parseTypeAliasDeclaration(fullStart, decorators, modifiers);
                case SyntaxKind.EnumKeyword:
                    return parseEnumDeclaration(fullStart, decorators, modifiers);
                case SyntaxKind.GlobalKeyword:
                case SyntaxKind.ModuleKeyword:
                case SyntaxKind.NamespaceKeyword:
                    return parseModuleDeclaration(fullStart, decorators, modifiers);
                case SyntaxKind.ImportKeyword:
                    return parseImportDeclarationOrImportEqualsDeclaration(fullStart, decorators, modifiers);
                case SyntaxKind.ExportKeyword:
                    nextToken();
                    switch (token) {
                        case SyntaxKind.DefaultKeyword:
                        case SyntaxKind.EqualsToken:
                            return parseExportAssignment(fullStart, decorators, modifiers);
                        case SyntaxKind.AsKeyword:
                            return parseNamespaceExportDeclaration(fullStart, decorators, modifiers);
                        default:
                            return parseExportDeclaration(fullStart, decorators, modifiers);
                    }
                default:
                    if (decorators || modifiers) {
                        // We reached this point because we encountered decorators and/or modifiers and assumed a declaration
                        // would follow. For recovery and error reporting purposes, return an incomplete declaration.
                        var node = createMissingNode(SyntaxKind.MissingDeclaration, /*reportAtCurrentPosition*/ true, Diagnostics.Declaration_expected);
                        node.pos = fullStart;
                        node.decorators = decorators;
                        setModifiers(node, modifiers);
                        return finishNode(node);
                    }
            }
        }
        function nextTokenIsIdentifierOrStringLiteralOnSameLine() {
            nextToken();
            return !scanner.hasPrecedingLineBreak() && (isIdentifier() || token === SyntaxKind.StringLiteral);
        }
        function parseFunctionBlockOrSemicolon(isGenerator, isAsync, diagnosticMessage) {
            if (token !== SyntaxKind.OpenBraceToken && canParseSemicolon()) {
                parseSemicolon();
                return;
            }
            return parseFunctionBlock(isGenerator, isAsync, /*ignoreMissingOpenBrace*/ false, diagnosticMessage);
        }
        // DECLARATIONS
        function parseObjectBindingElement() {
            var node = createNode(SyntaxKind.BindingElement);
            var tokenIsIdentifier = isIdentifier();
            var propertyName = parsePropertyName();
            if (tokenIsIdentifier && token !== SyntaxKind.ColonToken) {
                node.name = propertyName;
            }
            else {
                parseExpected(SyntaxKind.ColonToken);
                node.propertyName = propertyName;
                node.name = parseIdentifierOrPattern();
            }
            node.initializer = parseBindingElementInitializer(/*inParameter*/ false);
            return finishNode(node);
        }
        function isIdentifierOrPattern() {
            return token === SyntaxKind.OpenBraceToken || token === SyntaxKind.OpenBracketToken || isIdentifier();
        }
        function canFollowContextualOfKeyword() {
            return nextTokenIsIdentifier() && nextToken() === SyntaxKind.CloseParenToken;
        }
        function parseFunctionDeclaration(fullStart, decorators, modifiers) {
            var node = createNode(SyntaxKind.FunctionDeclaration, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            parseExpected(SyntaxKind.FunctionKeyword);
            node.asteriskToken = parseOptionalToken(SyntaxKind.AsteriskToken);
            node.name = node.flags & NodeFlags.Default ? parseOptionalIdentifier() : parseIdentifier();
            var isGenerator = !!node.asteriskToken;
            var isAsync = !!(node.flags & NodeFlags.Async);
            fillSignature(SyntaxKind.ColonToken, /*yieldContext*/ isGenerator, /*awaitContext*/ isAsync, /*requireCompleteParameterList*/ false, node);
            node.body = parseFunctionBlockOrSemicolon(isGenerator, isAsync, Diagnostics.or_expected);
            return addJSDocComment(finishNode(node));
        }
        function parseConstructorDeclaration(pos, decorators, modifiers) {
            var node = createNode(SyntaxKind.Constructor, pos);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            parseExpected(SyntaxKind.ConstructorKeyword);
            fillSignature(SyntaxKind.ColonToken, /*yieldContext*/ false, /*awaitContext*/ false, /*requireCompleteParameterList*/ false, node);
            node.body = parseFunctionBlockOrSemicolon(/*isGenerator*/ false, /*isAsync*/ false, Diagnostics.or_expected);
            return addJSDocComment(finishNode(node));
        }
        function parseMethodDeclaration(fullStart, decorators, modifiers, asteriskToken, name, questionToken, diagnosticMessage) {
            var method = createNode(SyntaxKind.MethodDeclaration, fullStart);
            method.decorators = decorators;
            setModifiers(method, modifiers);
            method.asteriskToken = asteriskToken;
            method.name = name;
            method.questionToken = questionToken;
            var isGenerator = !!asteriskToken;
            var isAsync = !!(method.flags & NodeFlags.Async);
            fillSignature(SyntaxKind.ColonToken, /*yieldContext*/ isGenerator, /*awaitContext*/ isAsync, /*requireCompleteParameterList*/ false, method);
            method.body = parseFunctionBlockOrSemicolon(isGenerator, isAsync, diagnosticMessage);
            return addJSDocComment(finishNode(method));
        }
        function parsePropertyDeclaration(fullStart, decorators, modifiers, name, questionToken) {
            var property = createNode(SyntaxKind.PropertyDeclaration, fullStart);
            property.decorators = decorators;
            setModifiers(property, modifiers);
            property.name = name;
            property.questionToken = questionToken;
            property.type = parseTypeAnnotation();
            // For instance properties specifically, since they are evaluated inside the constructor,
            // we do *not * want to parse yield expressions, so we specifically turn the yield context
            // off. The grammar would look something like this:
            //
            //    MemberVariableDeclaration[Yield]:
            //        AccessibilityModifier_opt   PropertyName   TypeAnnotation_opt   Initializer_opt[In];
            //        AccessibilityModifier_opt  static_opt  PropertyName   TypeAnnotation_opt   Initializer_opt[In, ?Yield];
            //
            // The checker may still error in the static case to explicitly disallow the yield expression.
            property.initializer = modifiers && modifiers.flags & NodeFlags.Static
                ? allowInAnd(parseNonParameterInitializer)
                : doOutsideOfContext(NodeFlags.YieldContext | NodeFlags.DisallowInContext, parseNonParameterInitializer);
            parseSemicolon();
            return finishNode(property);
        }
        function parsePropertyOrMethodDeclaration(fullStart, decorators, modifiers) {
            var asteriskToken = parseOptionalToken(SyntaxKind.AsteriskToken);
            var name = parsePropertyName();
            // Note: this is not legal as per the grammar.  But we allow it in the parser and
            // report an error in the grammar checker.
            var questionToken = parseOptionalToken(SyntaxKind.QuestionToken);
            if (asteriskToken || token === SyntaxKind.OpenParenToken || token === SyntaxKind.LessThanToken) {
                return parseMethodDeclaration(fullStart, decorators, modifiers, asteriskToken, name, questionToken, Diagnostics.or_expected);
            }
            else {
                return parsePropertyDeclaration(fullStart, decorators, modifiers, name, questionToken);
            }
        }
        function parseNonParameterInitializer() {
            return parseInitializer(/*inParameter*/ false);
        }
        function parseAccessorDeclaration(kind, fullStart, decorators, modifiers) {
            var node = createNode(kind, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            node.name = parsePropertyName();
            fillSignature(SyntaxKind.ColonToken, /*yieldContext*/ false, /*awaitContext*/ false, /*requireCompleteParameterList*/ false, node);
            node.body = parseFunctionBlockOrSemicolon(/*isGenerator*/ false, /*isAsync*/ false);
            return finishNode(node);
        }
        function isClassMemberModifier(idToken) {
            switch (idToken) {
                case SyntaxKind.PublicKeyword:
                case SyntaxKind.PrivateKeyword:
                case SyntaxKind.ProtectedKeyword:
                case SyntaxKind.StaticKeyword:
                case SyntaxKind.ReadonlyKeyword:
                    return true;
                default:
                    return false;
            }
        }
        function isClassMemberStart() {
            var idToken;
            if (token === SyntaxKind.AtToken) {
                return true;
            }
            // Eat up all modifiers, but hold on to the last one in case it is actually an identifier.
            while (isModifierKind(token)) {
                idToken = token;
                // If the idToken is a class modifier (protected, private, public, and static), it is
                // certain that we are starting to parse class member. This allows better error recovery
                // Example:
                //      public foo() ...     // true
                //      public @dec blah ... // true; we will then report an error later
                //      export public ...    // true; we will then report an error later
                if (isClassMemberModifier(idToken)) {
                    return true;
                }
                nextToken();
            }
            if (token === SyntaxKind.AsteriskToken) {
                return true;
            }
            // Try to get the first property-like token following all modifiers.
            // This can either be an identifier or the 'get' or 'set' keywords.
            if (isLiteralPropertyName()) {
                idToken = token;
                nextToken();
            }
            // Index signatures and computed properties are class members; we can parse.
            if (token === SyntaxKind.OpenBracketToken) {
                return true;
            }
            // If we were able to get any potential identifier...
            if (idToken !== undefined) {
                // If we have a non-keyword identifier, or if we have an accessor, then it's safe to parse.
                if (!isKeyword(idToken) || idToken === SyntaxKind.SetKeyword || idToken === SyntaxKind.GetKeyword) {
                    return true;
                }
                // If it *is* a keyword, but not an accessor, check a little farther along
                // to see if it should actually be parsed as a class member.
                switch (token) {
                    case SyntaxKind.OpenParenToken: // Method declaration
                    case SyntaxKind.LessThanToken: // Generic Method declaration
                    case SyntaxKind.ColonToken: // Type Annotation for declaration
                    case SyntaxKind.EqualsToken: // Initializer for declaration
                    case SyntaxKind.QuestionToken:// Not valid, but permitted so that it gets caught later on.
                        return true;
                    default:
                        // Covers
                        //  - Semicolons     (declaration termination)
                        //  - Closing braces (end-of-class, must be declaration)
                        //  - End-of-files   (not valid, but permitted so that it gets caught later on)
                        //  - Line-breaks    (enabling *automatic semicolon insertion*)
                        return canParseSemicolon();
                }
            }
            return false;
        }
        function parseDecorators() {
            var decorators;
            while (true) {
                var decoratorStart = getNodePos();
                if (!parseOptional(SyntaxKind.AtToken)) {
                    break;
                }
                if (!decorators) {
                    decorators = [];
                    decorators.pos = decoratorStart;
                }
                var decorator = createNode(SyntaxKind.Decorator, decoratorStart);
                decorator.expression = doInDecoratorContext(parseLeftHandSideExpressionOrHigher);
                decorators.push(finishNode(decorator));
            }
            if (decorators) {
                decorators.end = getNodeEnd();
            }
            return decorators;
        }
        /*
         * There are situations in which a modifier like 'const' will appear unexpectedly, such as on a class member.
         * In those situations, if we are entirely sure that 'const' is not valid on its own (such as when ASI takes effect
         * and turns it into a standalone declaration), then it is better to parse it and report an error later.
         *
         * In such situations, 'permitInvalidConstAsModifier' should be set to true.
         */
        function parseModifiers(permitInvalidConstAsModifier) {
            var flags = 0;
            var modifiers;
            while (true) {
                var modifierStart = scanner.getStartPos();
                var modifierKind = token;
                if (token === SyntaxKind.ConstKeyword && permitInvalidConstAsModifier) {
                    // We need to ensure that any subsequent modifiers appear on the same line
                    // so that when 'const' is a standalone declaration, we don't issue an error.
                    if (!tryParse(nextTokenIsOnSameLineAndCanFollowModifier)) {
                        break;
                    }
                }
                else {
                    if (!parseAnyContextualModifier()) {
                        break;
                    }
                }
                if (!modifiers) {
                    modifiers = [];
                    modifiers.pos = modifierStart;
                }
                flags |= modifierToFlag(modifierKind);
                modifiers.push(finishNode(createNode(modifierKind, modifierStart)));
            }
            if (modifiers) {
                modifiers.flags = flags;
                modifiers.end = scanner.getStartPos();
            }
            return modifiers;
        }
        function parseModifiersForArrowFunction() {
            var flags = 0;
            var modifiers;
            if (token === SyntaxKind.AsyncKeyword) {
                var modifierStart = scanner.getStartPos();
                var modifierKind = token;
                nextToken();
                modifiers = [];
                modifiers.pos = modifierStart;
                flags |= modifierToFlag(modifierKind);
                modifiers.push(finishNode(createNode(modifierKind, modifierStart)));
                modifiers.flags = flags;
                modifiers.end = scanner.getStartPos();
            }
            return modifiers;
        }
        function parseClassElement() {
            if (token === SyntaxKind.SemicolonToken) {
                var result = createNode(SyntaxKind.SemicolonClassElement);
                nextToken();
                return finishNode(result);
            }
            var fullStart = getNodePos();
            var decorators = parseDecorators();
            var modifiers = parseModifiers(/*permitInvalidConstAsModifier*/ true);
            var accessor = tryParseAccessorDeclaration(fullStart, decorators, modifiers);
            if (accessor) {
                return accessor;
            }
            if (token === SyntaxKind.ConstructorKeyword) {
                return parseConstructorDeclaration(fullStart, decorators, modifiers);
            }
            if (isIndexSignature()) {
                return parseIndexSignatureDeclaration(fullStart, decorators, modifiers);
            }
            // It is very important that we check this *after* checking indexers because
            // the [ token can start an index signature or a computed property name
            if (tokenIsIdentifierOrKeyword(token) ||
                token === SyntaxKind.StringLiteral ||
                token === SyntaxKind.NumericLiteral ||
                token === SyntaxKind.AsteriskToken ||
                token === SyntaxKind.OpenBracketToken) {
                return parsePropertyOrMethodDeclaration(fullStart, decorators, modifiers);
            }
            if (decorators || modifiers) {
                // treat this as a property declaration with a missing name.
                var name_1 = createMissingNode(SyntaxKind.Identifier, /*reportAtCurrentPosition*/ true, Diagnostics.Declaration_expected);
                return parsePropertyDeclaration(fullStart, decorators, modifiers, name_1, /*questionToken*/ undefined);
            }
            // 'isClassMemberStart' should have hinted not to attempt parsing.
            Debug.fail("Should not have attempted to parse class member declaration.");
        }
        function parseClassExpression() {
            return parseClassDeclarationOrExpression(
            /*fullStart*/ scanner.getStartPos(), 
            /*decorators*/ undefined, 
            /*modifiers*/ undefined, SyntaxKind.ClassExpression);
        }
        function parseClassDeclaration(fullStart, decorators, modifiers) {
            return parseClassDeclarationOrExpression(fullStart, decorators, modifiers, SyntaxKind.ClassDeclaration);
        }
        function parseClassDeclarationOrExpression(fullStart, decorators, modifiers, kind) {
            var node = createNode(kind, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            parseExpected(SyntaxKind.ClassKeyword);
            node.name = parseNameOfClassDeclarationOrExpression();
            node.typeParameters = parseTypeParameters();
            node.heritageClauses = parseHeritageClauses(/*isClassHeritageClause*/ true);
            if (parseExpected(SyntaxKind.OpenBraceToken)) {
                // ClassTail[Yield,Await] : (Modified) See 14.5
                //      ClassHeritage[?Yield,?Await]opt { ClassBody[?Yield,?Await]opt }
                node.members = parseClassMembers();
                parseExpected(SyntaxKind.CloseBraceToken);
            }
            else {
                node.members = createMissingList();
            }
            return finishNode(node);
        }
        function parseExpressionWithTypeArguments() {
            var node = createNode(SyntaxKind.ExpressionWithTypeArguments);
            node.expression = parseLeftHandSideExpressionOrHigher();
            if (token === SyntaxKind.LessThanToken) {
                node.typeArguments = parseBracketedList(18 /* TypeArguments */, parseType, SyntaxKind.LessThanToken, SyntaxKind.GreaterThanToken);
            }
            return finishNode(node);
        }
        function isHeritageClause() {
            return token === SyntaxKind.ExtendsKeyword || token === SyntaxKind.ImplementsKeyword;
        }
        function parseClassMembers() {
            return parseList(5 /* ClassMembers */, parseClassElement);
        }
        function parseInterfaceDeclaration(fullStart, decorators, modifiers) {
            var node = createNode(SyntaxKind.InterfaceDeclaration, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            parseExpected(SyntaxKind.InterfaceKeyword);
            node.name = parseIdentifier();
            node.typeParameters = parseTypeParameters();
            node.heritageClauses = parseHeritageClauses(/*isClassHeritageClause*/ false);
            node.members = parseObjectTypeMembers();
            return finishNode(node);
        }
        function parseTypeAliasDeclaration(fullStart, decorators, modifiers) {
            var node = createNode(SyntaxKind.TypeAliasDeclaration, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            parseExpected(SyntaxKind.TypeKeyword);
            node.name = parseIdentifier();
            node.typeParameters = parseTypeParameters();
            parseExpected(SyntaxKind.EqualsToken);
            node.type = parseType();
            parseSemicolon();
            return finishNode(node);
        }
        function parseEnumDeclaration(fullStart, decorators, modifiers) {
            var node = createNode(SyntaxKind.EnumDeclaration, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            parseExpected(SyntaxKind.EnumKeyword);
            node.name = parseIdentifier();
            if (parseExpected(SyntaxKind.OpenBraceToken)) {
                node.members = parseDelimitedList(6 /* EnumMembers */, parseEnumMember);
                parseExpected(SyntaxKind.CloseBraceToken);
            }
            else {
                node.members = createMissingList();
            }
            return finishNode(node);
        }
        function parseModuleBlock() {
            var node = createNode(SyntaxKind.ModuleBlock, scanner.getStartPos());
            if (parseExpected(SyntaxKind.OpenBraceToken)) {
                node.statements = parseList(1 /* BlockStatements */, parseStatement);
                parseExpected(SyntaxKind.CloseBraceToken);
            }
            else {
                node.statements = createMissingList();
            }
            return finishNode(node);
        }
        function parseModuleOrNamespaceDeclaration(fullStart, decorators, modifiers, flags) {
            var node = createNode(SyntaxKind.ModuleDeclaration, fullStart);
            // If we are parsing a dotted namespace name, we want to
            // propagate the 'Namespace' flag across the names if set.
            var namespaceFlag = flags & NodeFlags.Namespace;
            node.decorators = decorators;
            setModifiers(node, modifiers);
            node.flags |= flags;
            node.name = parseIdentifier();
            node.body = parseOptional(SyntaxKind.DotToken)
                ? parseModuleOrNamespaceDeclaration(getNodePos(), /*decorators*/ undefined, /*modifiers*/ undefined, NodeFlags.Export | namespaceFlag)
                : parseModuleBlock();
            return finishNode(node);
        }
        function parseAmbientExternalModuleDeclaration(fullStart, decorators, modifiers) {
            var node = createNode(SyntaxKind.ModuleDeclaration, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            if (token === SyntaxKind.GlobalKeyword) {
                // parse 'global' as name of global scope augmentation
                node.name = parseIdentifier();
                node.flags |= NodeFlags.GlobalAugmentation;
            }
            else {
                node.name = parseLiteralNode(/*internName*/ true);
            }
            if (token === SyntaxKind.OpenBraceToken) {
                node.body = parseModuleBlock();
            }
            else {
                parseSemicolon();
            }
            return finishNode(node);
        }
        function parseModuleDeclaration(fullStart, decorators, modifiers) {
            var flags = modifiers ? modifiers.flags : 0;
            if (token === SyntaxKind.GlobalKeyword) {
                // global augmentation
                return parseAmbientExternalModuleDeclaration(fullStart, decorators, modifiers);
            }
            else if (parseOptional(SyntaxKind.NamespaceKeyword)) {
                flags |= NodeFlags.Namespace;
            }
            else {
                parseExpected(SyntaxKind.ModuleKeyword);
                if (token === SyntaxKind.StringLiteral) {
                    return parseAmbientExternalModuleDeclaration(fullStart, decorators, modifiers);
                }
            }
            return parseModuleOrNamespaceDeclaration(fullStart, decorators, modifiers, flags);
        }
        function isExternalModuleReference() {
            return token === SyntaxKind.RequireKeyword &&
                lookAhead(nextTokenIsOpenParen);
        }
        function nextTokenIsOpenParen() {
            return nextToken() === SyntaxKind.OpenParenToken;
        }
        function nextTokenIsSlash() {
            return nextToken() === SyntaxKind.SlashToken;
        }
        function parseNamespaceExportDeclaration(fullStart, decorators, modifiers) {
            var exportDeclaration = createNode(SyntaxKind.NamespaceExportDeclaration, fullStart);
            exportDeclaration.decorators = decorators;
            exportDeclaration.modifiers = modifiers;
            parseExpected(SyntaxKind.AsKeyword);
            parseExpected(SyntaxKind.NamespaceKeyword);
            exportDeclaration.name = parseIdentifier();
            parseExpected(SyntaxKind.SemicolonToken);
            return finishNode(exportDeclaration);
        }
        function parseImportDeclarationOrImportEqualsDeclaration(fullStart, decorators, modifiers) {
            parseExpected(SyntaxKind.ImportKeyword);
            var afterImportPos = scanner.getStartPos();
            var identifier;
            if (isIdentifier()) {
                identifier = parseIdentifier();
                if (token !== SyntaxKind.CommaToken && token !== SyntaxKind.FromKeyword) {
                    // ImportEquals declaration of type:
                    // import x = require("mod"); or
                    // import x = M.x;
                    var importEqualsDeclaration = createNode(SyntaxKind.ImportEqualsDeclaration, fullStart);
                    importEqualsDeclaration.decorators = decorators;
                    setModifiers(importEqualsDeclaration, modifiers);
                    importEqualsDeclaration.name = identifier;
                    parseExpected(SyntaxKind.EqualsToken);
                    importEqualsDeclaration.moduleReference = parseModuleReference();
                    parseSemicolon();
                    return finishNode(importEqualsDeclaration);
                }
            }
            // Import statement
            var importDeclaration = createNode(SyntaxKind.ImportDeclaration, fullStart);
            importDeclaration.decorators = decorators;
            setModifiers(importDeclaration, modifiers);
            // ImportDeclaration:
            //  import ImportClause from ModuleSpecifier ;
            //  import ModuleSpecifier;
            if (identifier ||
                token === SyntaxKind.AsteriskToken ||
                token === SyntaxKind.OpenBraceToken) {
                importDeclaration.importClause = parseImportClause(identifier, afterImportPos);
                parseExpected(SyntaxKind.FromKeyword);
            }
            importDeclaration.moduleSpecifier = parseModuleSpecifier();
            parseSemicolon();
            return finishNode(importDeclaration);
        }
        function parseImportClause(identifier, fullStart) {
            // ImportClause:
            //  ImportedDefaultBinding
            //  NameSpaceImport
            //  NamedImports
            //  ImportedDefaultBinding, NameSpaceImport
            //  ImportedDefaultBinding, NamedImports
            var importClause = createNode(SyntaxKind.ImportClause, fullStart);
            if (identifier) {
                // ImportedDefaultBinding:
                //  ImportedBinding
                importClause.name = identifier;
            }
            // If there was no default import or if there is comma token after default import
            // parse namespace or named imports
            if (!importClause.name ||
                parseOptional(SyntaxKind.CommaToken)) {
                importClause.namedBindings = token === SyntaxKind.AsteriskToken ? parseNamespaceImport() : parseNamedImportsOrExports(SyntaxKind.NamedImports);
            }
            return finishNode(importClause);
        }
        function parseModuleReference() {
            return isExternalModuleReference()
                ? parseExternalModuleReference()
                : parseEntityName(/*allowReservedWords*/ false);
        }
        function parseExternalModuleReference() {
            var node = createNode(SyntaxKind.ExternalModuleReference);
            parseExpected(SyntaxKind.RequireKeyword);
            parseExpected(SyntaxKind.OpenParenToken);
            node.expression = parseModuleSpecifier();
            parseExpected(SyntaxKind.CloseParenToken);
            return finishNode(node);
        }
        function parseModuleSpecifier() {
            if (token === SyntaxKind.StringLiteral) {
                var result = parseLiteralNode();
                internIdentifier(result.text);
                return result;
            }
            else {
                // We allow arbitrary expressions here, even though the grammar only allows string
                // literals.  We check to ensure that it is only a string literal later in the grammar
                // check pass.
                return parseExpression();
            }
        }
        function parseNamespaceImport() {
            // NameSpaceImport:
            //  * as ImportedBinding
            var namespaceImport = createNode(SyntaxKind.NamespaceImport);
            parseExpected(SyntaxKind.AsteriskToken);
            parseExpected(SyntaxKind.AsKeyword);
            namespaceImport.name = parseIdentifier();
            return finishNode(namespaceImport);
        }
        function parseNamedImportsOrExports(kind) {
            var node = createNode(kind);
            // NamedImports:
            //  { }
            //  { ImportsList }
            //  { ImportsList, }
            // ImportsList:
            //  ImportSpecifier
            //  ImportsList, ImportSpecifier
            node.elements = parseBracketedList(21 /* ImportOrExportSpecifiers */, kind === SyntaxKind.NamedImports ? parseImportSpecifier : parseExportSpecifier, SyntaxKind.OpenBraceToken, SyntaxKind.CloseBraceToken);
            return finishNode(node);
        }
        function parseExportSpecifier() {
            return parseImportOrExportSpecifier(SyntaxKind.ExportSpecifier);
        }
        function parseImportSpecifier() {
            return parseImportOrExportSpecifier(SyntaxKind.ImportSpecifier);
        }
        function parseImportOrExportSpecifier(kind) {
            var node = createNode(kind);
            // ImportSpecifier:
            //   BindingIdentifier
            //   IdentifierName as BindingIdentifier
            // ExportSpecifier:
            //   IdentifierName
            //   IdentifierName as IdentifierName
            var checkIdentifierIsKeyword = isKeyword(token) && !isIdentifier();
            var checkIdentifierStart = scanner.getTokenPos();
            var checkIdentifierEnd = scanner.getTextPos();
            var identifierName = parseIdentifierName();
            if (token === SyntaxKind.AsKeyword) {
                node.propertyName = identifierName;
                parseExpected(SyntaxKind.AsKeyword);
                checkIdentifierIsKeyword = isKeyword(token) && !isIdentifier();
                checkIdentifierStart = scanner.getTokenPos();
                checkIdentifierEnd = scanner.getTextPos();
                node.name = parseIdentifierName();
            }
            else {
                node.name = identifierName;
            }
            if (kind === SyntaxKind.ImportSpecifier && checkIdentifierIsKeyword) {
                // Report error identifier expected
                parseErrorAtPosition(checkIdentifierStart, checkIdentifierEnd - checkIdentifierStart, Diagnostics.Identifier_expected);
            }
            return finishNode(node);
        }
        function parseExportDeclaration(fullStart, decorators, modifiers) {
            var node = createNode(SyntaxKind.ExportDeclaration, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            if (parseOptional(SyntaxKind.AsteriskToken)) {
                parseExpected(SyntaxKind.FromKeyword);
                node.moduleSpecifier = parseModuleSpecifier();
            }
            else {
                node.exportClause = parseNamedImportsOrExports(SyntaxKind.NamedExports);
                // It is not uncommon to accidentally omit the 'from' keyword. Additionally, in editing scenarios,
                // the 'from' keyword can be parsed as a named export when the export clause is unterminated (i.e. `export { from "moduleName";`)
                // If we don't have a 'from' keyword, see if we have a string literal such that ASI won't take effect.
                if (token === SyntaxKind.FromKeyword || (token === SyntaxKind.StringLiteral && !scanner.hasPrecedingLineBreak())) {
                    parseExpected(SyntaxKind.FromKeyword);
                    node.moduleSpecifier = parseModuleSpecifier();
                }
            }
            parseSemicolon();
            return finishNode(node);
        }
        function parseExportAssignment(fullStart, decorators, modifiers) {
            var node = createNode(SyntaxKind.ExportAssignment, fullStart);
            node.decorators = decorators;
            setModifiers(node, modifiers);
            if (parseOptional(SyntaxKind.EqualsToken)) {
                node.isExportEquals = true;
            }
            else {
                parseExpected(SyntaxKind.DefaultKeyword);
            }
            node.expression = parseAssignmentExpressionOrHigher();
            parseSemicolon();
            return finishNode(node);
        }
        function setExternalModuleIndicator(sourceFile) {
            sourceFile.externalModuleIndicator = forEach(sourceFile.statements, function (node) {
                return node.flags & NodeFlags.Export
                    || node.kind === SyntaxKind.ImportEqualsDeclaration && node.moduleReference.kind === SyntaxKind.ExternalModuleReference
                    || node.kind === SyntaxKind.ImportDeclaration
                    || node.kind === SyntaxKind.ExportAssignment
                    || node.kind === SyntaxKind.ExportDeclaration
                    ? node
                    : undefined;
            });
        }
    })(Parser || (Parser = {}));
})(ts || (ts = {}));
