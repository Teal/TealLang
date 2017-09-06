"use strict";
exports.__esModule = true;
var resolver_1 = require("../resolver/resolver");
var operation = require("../resolver/operation");
var operations = [
    Object.assign(new operation.ConstantOperation(), { result: "%1", value: 1 }),
    Object.assign(new operation.UnaryOperation(), { result: "%2", operator: "-", operand: "%1" }),
];
var branch = new resolver_1.Branch();
var result = resolver_1.resolve(operations, branch);
console.log(result);
