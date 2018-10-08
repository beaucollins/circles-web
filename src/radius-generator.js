// @flow
import { reduce, map } from 'ramda';

export type RadiusGenerator = (degree: number) => number;

export const constant = (value: number): RadiusGenerator => () => value;

export const addAll = ( ... fns: RadiusGenerator[] ): RadiusGenerator => {
    return degree => {
        return reduce( ( sum, fn ) => {
            return sum + fn( degree );
        }, 0, fns );
    };
};

export const max = (... generators: RadiusGenerator[]): RadiusGenerator => {
    return degree => Math.max( ... map( gen => gen( degree ), generators ) );
};

export const min = (... generators: RadiusGenerator[]): RadiusGenerator => {
    return degree => Math.min( ... map( fn => fn( degree ), generators ) );
};

export const multiply = (fn1: RadiusGenerator, fn2: RadiusGenerator): RadiusGenerator => {
    return degree => fn1( degree ) * fn2( degree );
};

export const add = (fn1: RadiusGenerator, fn2: RadiusGenerator): RadiusGenerator => {
    return degree => fn1(degree) + fn2(degree);
};

export const invert = ( fn: RadiusGenerator ): RadiusGenerator => {
    return degree => -1 * fn( degree );
};

export const increment = <T>(fn: (n: number) => T, to: number, magnitude: number = 1, beginningAt: number = 0 ): T[] => {
    const sign = to < beginningAt ? -1 : 1;
    const results: T[] = [];
    let current = beginningAt;
    const complete = ( sign === 1 ? (() => current >= to) : (() => current <= to ));
    do {
        results.push( fn( current ) );
        current += magnitude * sign;
    } while( ! complete() );
    return results;
};
