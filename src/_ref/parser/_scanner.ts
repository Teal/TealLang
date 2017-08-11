/// <reference path="core.ts"/>
/// <reference path="diagnosticInformationMap.generated.ts"/>

namespace ts {

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
    function getCommentRanges(text: string, pos: number, trailing: boolean): CommentRange[] {
        let result: CommentRange[];
        let collecting = trailing || pos === 0;
        while (pos < text.length) {
            const ch = text.charCodeAt(pos);
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
                    let nextChar = text.charCodeAt(pos + 1);
                    let hasTrailingNewLine = false;
                    if (nextChar === CharacterCodes.slash || nextChar === CharacterCodes.asterisk) {
                        const kind = nextChar === CharacterCodes.slash ? SyntaxKind.SingleLineCommentTrivia : SyntaxKind.MultiLineCommentTrivia;
                        const startPos = pos;
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

                            result.push({ pos: startPos, end: pos, hasTrailingNewLine, kind });
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

    export function getLeadingCommentRanges(text: string, pos: number): CommentRange[] {
        return getCommentRanges(text, pos, /*trailing*/ false);
    }

    export function getTrailingCommentRanges(text: string, pos: number): CommentRange[] {
        return getCommentRanges(text, pos, /*trailing*/ true);
    }
    
    // Creates a scanner over a (possibly unspecified) range of a piece of text.
    export function createScanner(languageVersion: ScriptTarget,
        skipTrivia: boolean,
        languageVariant = LanguageVariant.Standard,
        text?: string,
        onError?: ErrorCallback,
        start?: number,
        length?: number): Scanner {
        // Current position (end position of text of current token)
        let pos: number;

        // end of text
        let end: number;

        // Start position of whitespace before current token
        let startPos: number;

        // Start position of text of current token
        let tokenPos: number;

        let token: SyntaxKind;
        let tokenValue: string;
        let precedingLineBreak: boolean;
        let hasExtendedUnicodeEscape: boolean;
        let tokenIsUnterminated: boolean;

        function reScanGreaterToken(): SyntaxKind {
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

        function reScanJsxToken(): SyntaxKind {
            pos = tokenPos = startPos;
            return token = scanJsxToken();
        }

        function scanJsxToken(): SyntaxKind {
            startPos = tokenPos = pos;

            if (pos >= end) {
                return token = SyntaxKind.EndOfFileToken;
            }

            let char = text.charCodeAt(pos);
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
        function scanJsxIdentifier(): SyntaxKind {
            if (tokenIsIdentifierOrKeyword(token)) {
                const firstCharPosition = pos;
                while (pos < end) {
                    const ch = text.charCodeAt(pos);
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

        function scanJSDocToken(): SyntaxKind {
            if (pos >= end) {
                return token = SyntaxKind.EndOfFileToken;
            }

            startPos = pos;

            // Eat leading whitespace
            let ch = text.charCodeAt(pos);
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
}
