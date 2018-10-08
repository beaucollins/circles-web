/**
 * @flow
 */
import { map, reduce, always } from 'ramda';
import { deg2rad } from 'polar';
import now from 'now';

export type RadiusGenerator = (degree: number) => number;

/**
 * A generator that always returns the same value
 */
export function constant(value: number): RadiusGenerator {
    return () => value;
} 

/**
 * Given a list of generators picks the largest result
 */
export function max(... generators: RadiusGenerator[]): RadiusGenerator {
    return degree => Math.max( ... map( gen => gen( degree ), generators ) );
}

/**
 * Given a list of generators picks the smallest result
 */
export function min(... generators: RadiusGenerator[]): RadiusGenerator {
    return degree => Math.min( ... map( fn => fn( degree ), generators ) );
}

/**
 * Multiplies the result of two generators
 */
export function multiply(fn1: RadiusGenerator, fn2: RadiusGenerator): RadiusGenerator {
    return degree => fn1( degree ) * fn2( degree );
}

/**
 * A generator that adds the result of two generators
 */
export function add(fn1: RadiusGenerator, fn2: RadiusGenerator): RadiusGenerator {
    return degree => fn1(degree) + fn2(degree);
}

/**
 * A generator that multiplies the result of the given generator by negative one.
 */
export function invert( fn: RadiusGenerator ): RadiusGenerator {
    return degree => -1 * fn( degree );
}

export function increment<T>(fn: (n: number) => T, to: number, magnitude: number = 1, beginningAt: number = 0 ): T[] {
    const sign = to < beginningAt ? -1 : 1;
    const results: T[] = [];
    let current = beginningAt;
    const complete = ( sign === 1 ? (() => current >= to) : (() => current <= to ));
    do {
        results.push( fn( current ) );
        current += magnitude * sign;
    } while( ! complete() );
    return results;
}

export function addAll( ... fns: RadiusGenerator[] ): RadiusGenerator {
    return degree => {
        return reduce( ( sum, fn ) => {
            return sum + fn( degree );
        }, 0, fns );
    };
}

export function atLeast( radius: number, fn: RadiusGenerator ): RadiusGenerator {
    return addAll( always(radius), fn );
}

export function distanceFrom( anchor: () => number ): RadiusGenerator {
    return degree => {
        const a = anchor();
        return Math.min(
            Math.abs(a - degree + 360),
            Math.abs(a - degree),
            Math.abs(a - degree - 360 )
        );
    };
}

export function wave( size: number = 0, count: number = 1, speed: number = 1 ): RadiusGenerator {
    return degree => {
        return Math.sin( deg2rad( degree + now() * speed ) * count ) * size;
    };
}
