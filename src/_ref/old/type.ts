
/**
 * 表示一个类型。
 */
export class Type {

    /**
     * 当前类型的基础类型。
     */
    base: Type;

    /**
     * 当前类型是否是常量。
     */
    const: boolean;

    /**
     * 当前类型为常量时的值。
     */
    value: string | number | boolean | null;

    /**
     * 当前类型的属性。
     */
    properties: { [key: string]: any } = {};

    /**
     * 对当前类型各属性执行正操作。
     */
    positive() {
        return this;
    }

    /**
     * 对当前类型各属性执行负操作。
     */
    negative() {

    }

}

/**
 * 表示一个联合类型。
 */
export class UnionType extends Type {

}

/**
 * 表示一个数字类型。
 */
export class NumberType extends Type {

    /**
     * 对当前类型各属性执行负操作。
     */
    negative() {
        if (this.const) {
            return createTypeFromConstant(-this.value);
        }
        const result = new NumberType();
        result.base = this.base;
        result.properties.precision = this.properties.precision;
        if (this.properties.min != null) {
            result.properties.max = -this.properties.min;
        }
        if (this.properties.max != null) {
            result.properties.min = -this.properties.max;
        }
        return result;
    }

}

export function createTypeFromConstant(value: number | string | boolean | null) {
    if (typeof value === "number") {
        const result = new NumberType();
        result.const = true;
        result.value = value;
        return result;
    }
}
