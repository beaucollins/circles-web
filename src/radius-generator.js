/**
 * @flow
 */
import { map, reduce, always } from 'ramda';
import { deg2rad } from 'polar';
import now from 'now';

export type RadiusGenerator = (degree: number) => number;
import type { Polar } from 'polar';

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

export function mouseDampened(fn: RadiusGenerator, mouseVectorProvider: () => Polar): RadiusGenerator {
	const anchor = distanceFrom( () => mouseVectorProvider().degree );
	const range = 90;
	const scaleFn = f => {
		const scaled = f * 2;
		if ( scaled < 1 ) return 0.5 * Math.pow(scaled, 3);
		return 0.5 * ( Math.pow(scaled-2, 3) + 2 );
	};
	return addAll(
		degree => {
			const distance = anchor( degree );
			const factor = (Math.min( distance, range ) / range);
			const scale = (1-scaleFn(factor));
			const output = fn( degree );
			return output * ( scale * 1.5 + 0.2 );
		},
		() => Math.cos( now() * 1 / 1000 ) * 5
	);
}
