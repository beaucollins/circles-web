/**
 * @flow
 */
import { createSVGElement } from './svg';
import { pipe, reduce, defaultTo, head, tail } from 'ramda';
import { increment } from 'radius-generator';
import { polarToCartesian } from './polar';

import type { RadiusGenerator } from 'radius-generator';
import type { Point } from './polar';
import type { ElementGenerator } from './svg';

export type PathDecorator = (Element) => Element;

/**
 * Create a ring
 */
export default ( radius: RadiusGenerator, decorator: PathDecorator = v => v ): ElementGenerator => {
    // generate a list of points around a given center
    const path = decorator( createSVGElement('path') );
    const update = () => {
        let points: Point[] = increment(pipe(
            (degree: number) => ( { degree, radius: radius(degree) } ),
            polarToCartesian
        ), 360, 36);
        let first = defaultTo({ x: 0, y: 0 }, head(points));
        let d = reduce( ( options, point: Point ) => {
            const delta = {
                x: point.x - options.previous.x,
                y: point.y - options.previous.y
            };
            return {
                d: `${options.d} l${delta.x},${delta.y}`,
                previous: point
            };
        }, { d: `M${first.x},${first.y}`, previous: first }, tail(points) );
        path.setAttribute('d', `${d.d} Z`);
    };
    
    return () => {
        update();
        return path;
    };
};