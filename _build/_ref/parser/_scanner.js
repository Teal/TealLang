/// <reference path="core.ts"/>
/// <reference path="diagnosticInformationMap.generated.ts"/>
var ts;
(function (ts) {
    /**
     * Extract comments from text prefixing the token closest following `pos`.
     * The return value is an array containing a TextRange for each comment.
     * Single-line comment ranges include the beginning '//' characters but not the ending line break.
     * Multi - line comment ranges include the beginning '/* and ending '<asterisk>/' characters.
     * The return value is undefined if no comments were found.
     * @param trailing
     * If false, whitespace is skipped until the first line break and comments between that location
     * and the next token are returned.
     * If true, comments occurring between the given position and the next line break are returned.
     */
    function getCommentRanges(text, pos, trailing) {
        var result;
        var collecting = trailing || pos === 0;
        while (pos < text.length) {
            var ch = text.charCodeAt(pos);
            switch (ch) {
                case CharacterCodes.carriageReturn:
                    if (text.charCodeAt(pos + 1) === CharacterCodes.lineFeed) {
                        pos++;
                    }
                case CharacterCodes.lineFeed:
                    pos++;
                    if (trailing) {
                        return result;
                    }
                    collecting = true;
                    if (result && result.length) {
                        lastOrUndefined(result).hasTrailingNewLine = true;
                    }
                    continue;
                case CharacterCodes.tab:
                case CharacterCodes.verticalTab:
                case CharacterCodes.formFeed:
                case CharacterCodes.space:
                    pos++;
                    continue;
                case CharacterCodes.slash:
                    var nextChar = text.charCodeAt(pos + 1);
                    var hasTrailingNewLine = false;
                    if (nextChar === CharacterCodes.slash || nextChar === CharacterCodes.asterisk) {
                        var kind = nextChar === CharacterCodes.slash ? SyntaxKind.SingleLineCommentTrivia : SyntaxKind.MultiLineCommentTrivia;
                        var startPos = pos;
                        pos += 2;
                        if (nextChar === CharacterCodes.slash) {
                            while (pos < text.length) {
                                if (isLineBreak(text.charCodeAt(pos))) {
                                    hasTrailingNewLine = true;
                                    break;
                                }
                                pos++;
                            }
                        }
                        else {
                            while (pos < text.length) {
                                if (text.charCodeAt(pos) === CharacterCodes.asterisk && text.charCodeAt(pos + 1) === CharacterCodes.slash) {
                                    pos += 2;
                                    break;
                                }
                                pos++;
                            }
                        }
                        if (collecting) {
                            if (!result) {
                                result = [];
                            }
                            result.push({ pos: startPos, end: pos, hasTrailingNewLine: hasTrailingNewLine, kind: kind });
                        }
                        continue;
                    }
                    break;
                default:
                    if (ch > CharacterCodes.maxAsciiCharacter && (isWhiteSpace(ch) || isLineBreak(ch))) {
                        if (result && result.length && isLineBreak(ch)) {
                            lastOrUndefined(result).hasTrailingNewLine = true;
                        }
                        pos++;
                        continue;
                    }
                    break;
            }
            return result;
        }
        return result;
    }
    function getLeadingCommentRanges(text, pos) {
        return getCommentRanges(text, pos, /*trailing*/ false);
    }
    ts.getLeadingCommentRanges = getLeadingCommentRanges;
    function getTrailingCommentRanges(text, pos) {
        return getCommentRanges(text, pos, /*trailing*/ true);
    }
    ts.getTrailingCommentRanges = getTrailingCommentRanges;
    // Creates a scanner over a (possibly unspecified) range of a piece of text.
    function createScanner(languageVersion, skipTrivia, languageVariant, text, onError, start, length) {
        if (languageVariant === void 0) { languageVariant = LanguageVariant.Standard; }
        // Current position (end position of text of current token)
        var pos;
        // end of text
        var end;
        // Start position of whitespace before current token
        var startPos;
        // Start position of text of current token
        var tokenPos;
        var token;
        var tokenValue;
        var precedingLineBreak;
        var hasExtendedUnicodeEscape;
        var tokenIsUnterminated;
        function reScanGreaterToken() {
            if (token === SyntaxKind.GreaterThanToken) {
                if (text.charCodeAt(pos) === CharacterCodes.greaterThan) {
                    if (text.charCodeAt(pos + 1) === CharacterCodes.greaterThan) {
                        if (text.charCodeAt(pos + 2) === CharacterCodes.equals) {
                            return pos += 3, token = SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken;
                        }
                        return pos += 2, token = SyntaxKind.GreaterThanGreaterThanGreaterThanToken;
                    }
                    if (text.charCodeAt(pos + 1) === CharacterCodes.equals) {
                        return pos += 2, token = SyntaxKind.GreaterThanGreaterThanEqualsToken;
                    }
                    pos++;
                    return token = SyntaxKind.GreaterThanGreaterThanToken;
                }
                if (text.charCodeAt(pos) === CharacterCodes.equals) {
                    pos++;
                    return token = SyntaxKind.GreaterThanEqualsToken;
                }
            }
            return token;
        }
        function reScanJsxToken() {
            pos = tokenPos = startPos;
            return token = scanJsxToken();
        }
        function scanJsxToken() {
            startPos = tokenPos = pos;
            if (pos >= end) {
                return token = SyntaxKind.EndOfFileToken;
            }
            var char = text.charCodeAt(pos);
            if (char === CharacterCodes.lessThan) {
                if (text.charCodeAt(pos + 1) === CharacterCodes.slash) {
                    pos += 2;
                    return token = SyntaxKind.LessThanSlashToken;
                }
                pos++;
                return token = SyntaxKind.LessThanToken;
            }
            if (char === CharacterCodes.openBrace) {
                pos++;
                return token = SyntaxKind.OpenBraceToken;
            }
            while (pos < end) {
                pos++;
                char = text.charCodeAt(pos);
                if ((char === CharacterCodes.openBrace) || (char === CharacterCodes.lessThan)) {
                    break;
                }
            }
            return token = SyntaxKind.JsxText;
        }
        // Scans a JSX identifier; these differ from normal identifiers in that
        // they allow dashes
        function scanJsxIdentifier() {
            if (tokenIsIdentifierOrKeyword(token)) {
                var firstCharPosition = pos;
                while (pos < end) {
                    var ch = text.charCodeAt(pos);
                    if (ch === CharacterCodes.minus || ((firstCharPosition === pos) ? isIdentifierStart(ch, languageVersion) : isIdentifierPart(ch, languageVersion))) {
                        pos++;
                    }
                    else {
                        break;
                    }
                }
                tokenValue += text.substr(firstCharPosition, pos - firstCharPosition);
            }
            return token;
        }
        function scanJSDocToken() {
            if (pos >= end) {
                return token = SyntaxKind.EndOfFileToken;
            }
            startPos = pos;
            // Eat leading whitespace
            var ch = text.charCodeAt(pos);
            while (pos < end) {
                ch = text.charCodeAt(pos);
                if (isWhiteSpace(ch)) {
                    pos++;
                }
                else {
                    break;
                }
            }
            tokenPos = pos;
            switch (ch) {
                case CharacterCodes.at:
                    return pos += 1, token = SyntaxKind.AtToken;
                case CharacterCodes.lineFeed:
                case CharacterCodes.carriageReturn:
                    return pos += 1, token = SyntaxKind.NewLineTrivia;
                case CharacterCodes.asterisk:
                    return pos += 1, token = SyntaxKind.AsteriskToken;
                case CharacterCodes.openBrace:
                    return pos += 1, token = SyntaxKind.OpenBraceToken;
                case CharacterCodes.closeBrace:
                    return pos += 1, token = SyntaxKind.CloseBraceToken;
                case CharacterCodes.openBracket:
                    return pos += 1, token = SyntaxKind.OpenBracketToken;
                case CharacterCodes.closeBracket:
                    return pos += 1, token = SyntaxKind.CloseBracketToken;
                case CharacterCodes.equals:
                    return pos += 1, token = SyntaxKind.EqualsToken;
                case CharacterCodes.comma:
                    return pos += 1, token = SyntaxKind.CommaToken;
            }
            if (isIdentifierStart(ch, ScriptTarget.Latest)) {
                pos++;
                while (isIdentifierPart(text.charCodeAt(pos), ScriptTarget.Latest) && pos < end) {
                    pos++;
                }
                return token = SyntaxKind.Identifier;
            }
            else {
                return pos += 1, token = SyntaxKind.Unknown;
            }
        }
    }
    ts.createScanner = createScanner;
})(ts || (ts = {}));
