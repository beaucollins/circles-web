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