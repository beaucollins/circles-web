/**
 * @flow
 */
import { createSVGElement } from './svg';
import { pipe, reduce, defaultTo, head, tail, identity } from 'ramda';
import { increment } from 'radius-generator';
import { polarToCartesian } from './polar';

import type { RadiusGenerator } from 'radius-generator';
import type { Point } from './polar';
import type { ElementGenerator } from './svg';

export type PathDecorator = (Element) => Element;

/**
 * Create a ring
 */
export default ( radius: RadiusGenerator, vertices: () => number = () => 90, decorator: PathDecorator = identity ): ElementGenerator => {
	// generate a list of points around a given center
	const path = createSVGElement('path');
	const update = () => {
		decorator(path);
		const count = vertices();
		const points: Point[] = increment(pipe(
			degree => (90 + degree) % 360,
			(degree: number) => ( { degree, radius: radius(degree) } ),
			polarToCartesian
		), 360, 360 / (count <= 0 ? 90 : count));
		const [head, ...rest] = points;

		const first: Point = head != null ? head : { x: 0, y: 0 };
		const d = reduce<{d: string, previous: Point}, Point>( ( options, point: Point ) => {
			const delta = {
				x: point.x - options.previous.x,
				y: point.y - options.previous.y
			};
			return {
				d: `${options.d} l${delta.x},${delta.y}`,
				previous: point
			};
		}, { d: `M${first.x},${first.y}`, previous: first }, rest );
		path.setAttribute('d', `${d.d} Z`);
	};

	return () => {
		update();
		return path;
	};
};