const digo = require("digo");
const ts = require("typescript");

exports.build = () => {

};

exports.ast = () => {

    // nodes.ts => nodes.ts & nodeVisitor.ts
    digo.src("src/ast/nodes.ts").pipe((file, options) => {

        // 第一步：语法解析。
        const program = ts.createProgram([file.path], options);
        const sourceFile = program.getSourceFiles()[program.getSourceFiles().length - 1];

        // 第二步：提取类型信息。
        const nodes = {};
        for (const statement of sourceFile.statements) {
            if (statement.kind !== ts.SyntaxKind.ClassDeclaration || !(statement.flags & ts.NodeFlags.Export)) {
                continue;
            }
            const clazz = statement;
            const baseClazzType = clazz.heritageClauses && clazz.heritageClauses.length && clazz.heritageClauses[0].types[0];
            let members = {};
            let optional = {};
            for (const member of clazz.members) {
                if (member.kind !== ts.SyntaxKind.PropertyDeclaration) {
                    continue;
                }
                const prop = member;
                if (!prop.type) {
                    continue;
                }
                members = members || {};
                const type = sourceFile.text.substring(prop.type.pos, prop.type.end).trim();
                members[(prop.name).text] = type;
                if (getDocComment(prop, false).indexOf("undefined") >= 0 || getDocComment(prop, false).indexOf("可能不存在") >= 0/* || isArrayType(type)*/) {
                    optional[(prop.name).text] = true;
                }
            }

            nodes[clazz.name.text] = {
                summary: getDocComment(clazz),
                isAbstract: clazz.modifiers && clazz.modifiers.some(t => t.kind === ts.SyntaxKind.AbstractKeyword),
                name: clazz.name.text,
                extends: baseClazzType && sourceFile.text.substring(baseClazzType.pos, baseClazzType.end).trim() || null,
                members,
                optional,
                node: clazz,
            };
        }

        // 第三步：删除非节点类。
        for (const name in nodes) {
            const type = nodes[name];
            if (!isNodeType(name)) {
                delete nodes[name];
                continue;
            }
            for (const member in type.members) {
                if (!isNodeType(type.members[member])) {
                    delete type.members[member];
                }
            }
        }

        // 第四步：继承父节点信息。
        for (const name in nodes) {
            const type = nodes[name];
            if (type.isAbstract) continue;
            let p = type;
            while (p = nodes[p.extends]) {
                var r = {};
                for (const m in p.members) {
                    r[m] = p.members[m];
                }
                for (const m in type.members) {
                    r[m] = type.members[m];
                }
                type.members = r;
                for (const m in p.optional) {
                    if (!type.optional[m]) {
                        type.optional[m] = p.optional[m];
                    }
                }
            }
        }

        // 第五步：修复类型信息。

        let acceptSummary = getDocComment(getMember(nodes["Node"].node, "accept"), false);
        let eachSummary = getDocComment(getMember(nodes["Node"].node, "each"), false);

        let changes = [];
        for (const name in nodes) {
            const type = nodes[name];
            if (type.isAbstract) {
                continue;
            }

            const each = getMember(type.node, "each");
            if (each) {
                changes.push({
                    remove: true,
                    pos: each.pos,
                    end: each.end,
                });
            }

            const eachContentItems = [];
            for (const member in type.members) {
                const memberType = type.members[member];
                let tpl = isArrayType(memberType) ? `this.${member}.each(callback, scope)` : `callback.call(scope, this.${member}, "${member}", this) !== false`;
                if (type.optional[member]) {
                    tpl = `(!this.${member} || ${tpl})`;
                }
                eachContentItems.push(tpl);
            }

            if (eachContentItems.length) {

                const eachContent = `

    ${eachSummary}
                                each(callback: EachCallback, scope?: any) {
        return ${eachContentItems.join(" &&\n            ")};
    }`;

                changes.push({
                    insert: true,
                    pos: each ? each.pos : (type.node).members.end,
                    content: eachContent
                });
            }

            const accept = getMember(type.node, "accept");
            if (accept) {
                changes.push({
                    remove: true,
                    pos: accept.pos,
                    end: accept.end,
                });
            }

            const content = `

    ${acceptSummary}
                        accept(vistior: NodeVisitor) {
        return vistior.visit${type.name}(this);
    }`;

            changes.push({
                insert: true,
                pos: accept ? accept.pos : (type.node).members.end,
                content: content
            });

        }

        // 第六步：应用修复。
        let source = sourceFile.text;
        changes.sort((x, y) => y.pos > x.pos ? 1 : y.pos < x.pos ? -1 : y.remove ? 1 : -1);
        for (const change of changes) {
            if (change.remove) {
                source = source.substr(0, change.pos) + source.substr(change.end);
            } else {
                source = source.substr(0, change.pos) + change.content + source.substr(change.pos);
            }
        }
        file.content = source;

        // 第七步：生成 NodeVistior。

        var result = `/**
 * @fileOverview 节点访问器
 * @generated 此文件可使用 \`$ tpack gen-nodes\` 命令生成。
 */

import * as nodes from './nodes';

/**
 * 表示一个节点访问器。
 */
export abstract class NodeVisitor {

                                /**
                                 * 访问一个逗号隔开的节点列表(<..., ...>。
                                 * @param nodes 要访问的节点列表。
                                 */
                                visitNodeList < T extends nodes.Node>(nodes: nodes.NodeList<T>) {
        for(const node of nodes) {
                                    node.accept(this);
                                }
    }
`;

        for (const name in nodes) {
            const type = nodes[name];
            if (type.isAbstract) {
                continue;
            }

            let memberList = [];
            for (const member in type.members) {
                memberList.push(`        ${type.optional[member] ? "node." + member + " && " : ""}node.${member}.accept(this);`);
            }

            result += `
    /**
     * ${type.summary.replace("表示", "访问")}
                                * @param node 要访问的节点。
     */
    visit${type.name}(node: nodes.${type.name}) {
                                    ${memberList.join("\n")}
    }
`

            function getNodeMembers(type) {
                let r = [];

                return r;
            }

        }

        result += `
}`;

        require("fs").writeFileSync("src/ast/nodeVisitor.ts", result);

        function getDocComment(node, removeSpace = true) {
            const comments = (ts as any).getJsDocComments(node, sourceFile);
            if (!comments || !comments.length) return;
            const comment = comments[comments.length - 1];

            const commentText = sourceFile.text.substring(comment.pos, comment.end);
            return removeSpace ? commentText.substring(3, commentText.length - 2).replace(/^\s*\*\s*/gm, "").trim() : commentText;
        }

        function getMember(node, name) {
            return (node).members.filter(x => (x.name).text == name)[0];
        }

        function isNodeType(type) {
            if (/^NodeList</.test(type)) return true;
            let p = nodes[type.replace(/\s*\|.*$/, "")];
            while (p) {
                if (p.name === "Node") return true;
                p = nodes[p.extends];
            }
            return false;
        }

        function isArrayType(type) {
            return /<.*>|\[\]/.test(type);
        }

    });

    tpack.src("src/ast/tokenType.ts").pipe((file, options) => {

        // 第一步：语法解析。
        const program = ts.createProgram([file.path], options);
        const sourceFile = program.getSourceFiles()[program.getSourceFiles().length - 1];

        // 第二步：提取类型信息。
        const data = {};
        const tokenType = sourceFile.statements.filter(t => t.kind === ts.SyntaxKind.EnumDeclaration && (t).name.text === "TokenType")[0];
        const val = 0;
        for (const member of tokenType.members) {
            const summary = getDocComment(member);
            const string = (/关键字\s*(\w+)|\((.+?)\)/.exec(summary) || []).slice(1).join("")
            const info = {
                summary,
                string,
                keyword: /关键字/.test(summary) || /0x0|EOF|\}\.|xx|.\.\.\./.test(string) || !string,
                value: val++
            };
            data[(member.name).text] = info;
        }

        // generateKeywordLexer(data, 0);

        // 第三步：生成优先级数组。

        // 第四步：生成优先级数组。

        function getDocComment(node, removeSpace = true) {
            const comments = (ts).getJsDocComments(node, sourceFile);
            if (!comments || !comments.length) return;
            const comment = comments[comments.length - 1];

            const commentText = sourceFile.text.substring(comment.pos, comment.end);
            return removeSpace ? commentText.substring(3, commentText.length - 2).replace(/^\s*\*\s*/gm, "").trim() : commentText;
        }


        function generateKeywordLexer(data, indent) {

            const names = {};
            const items = [];
            for (const name in data) {
                const info = data[name];
                if (info.keyword) {
                    continue;
                }
                names[info.string] = name;
                items.push(info.string);
            }
            items.sort();

            let result = '';

            for (let i = 0; i < items.length;) {
                const c = items[i];

                let hasSameCount = 0;
                for (let j = i + 1; j < items.length; j++) {
                    if (items[j].charAt(0) === c.charAt(0)) {
                        hasSameCount++;
                    }
                }

                result += genIndents(indent) + "// " + c;
                for (var j = 0; j < hasSameCount; j++) {
                    result += ", " + items[i + j + 1];
                }
                result += "\n";

                result += genIndents(indent) + 'case CharCode.' + names[c] + ':\n';

                if (hasSameCount === 0) {
                    result += 'result.type = TokenType.' + names[c] + ';\n';
                    result += 'break;\n';
                    i++;
                }

                if (hasSameCount === 1) {
                    result += genIndents(indent) + 'if(this.sourceText.charCodeAt(this.sourceStart) === TokenType.' + names[items[i + 1]] + ') {';
                    result += genIndents(indent + 1) + 'this.sourceStart++;';
                    result += genIndents(indent + 1) + 'result.type = TokenType.' + names[items[i + 1]] + ';\n';
                    result += genIndents(indent + 1) + 'break;\n';
                    result += genIndents(indent) + '}';
                    result += genIndents(indent) + 'result.type = TokenType.' + names[c] + ';\n';
                    result += genIndents(indent) + 'break;\n';
                    i += 2;
                }

                if (hasSameCount >= 2) {
                    result += genIndents(indent) + ' switch (this.sourceText.charCodeAt(this.sourceStart)) {\n';
                    for (let j = 0; j < hasSameCount; j++) {
                        result += genIndents(indent + 1) + 'case CharCode.' + names[items[i + j + 1]] + ':\n';
                        result += genIndents(indent + 2) + 'this.sourceStart++;\n';
                        result += genIndents(indent + 2) + 'result.type = TokenType.' + names[items[i + j + 1]] + ';\n';
                        result += genIndents(indent + 2) + 'break;\n';
                    }
                    result += genIndents(indent + 1) + 'default:\n';
                    result += genIndents(indent + 2) + 'result.type = TokenType.' + names[c] + ';\n';
                    result += genIndents(indent + 2) + 'break;\n';
                    result += genIndents(indent) + '}\n';
                    i += hasSameCount + 1;

                    result += genIndents(indent) + 'break;\n';
                }

                result += genIndents(indent) + '\n';
            }

            console.log(result)

            function genIndents(indent) {
                var result = '';
                while (indent-- > 0)
                    result += '\t';
                return result;
            }

            return result;
        }


    });


};
