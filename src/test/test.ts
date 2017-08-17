import { resolve, Branch } from "../resolver/resolver";
import * as operation from "../resolver/operation";

const operations = [
    Object.assign(new operation.ConstantOperation(), { result: "%1", value: 1 }),
    Object.assign(new operation.UnaryOperation(), { result: "%2", operator: "-", operand: "%1" }),
];

const branch = new Branch();

const result = resolve(operations, branch);

console.log(result);