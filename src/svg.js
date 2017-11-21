// @flow
import { reduce, forEach } from 'ramda';
const NAMESPACE_SVG = 'http://www.w3.org/2000/svg';

export type Point = { x: number, y: number };
export type Polar = { degree: number, radius: number };

export const vectorBetween = (p1: Point, p2: Point): Polar => {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
    const radians = Math.atan2(dy, dx);
    const degrees = (rad2deg(radians) + 360) % 360;
    return {
        radius: distance,
        degree: degrees
    };
};
export const deg2rad = (degree: number) => degree * (Math.PI/180);
export const rad2deg = (radian: number) => radian * 180/Math.PI;

export const createSVGElement = (name: string) =>
    document.createElementNS(NAMESPACE_SVG, name);

export const polarToCartesian = ( polar: Polar ): Point => ( {
    x: Math.cos( deg2rad(polar.degree) ) * polar.radius,
    y: Math.sin( deg2rad(polar.degree) ) * polar.radius
} );

export type ElementDecorator = (Element) => void;
export type ElementInitializer = { tag: string, decorator?: ElementDecorator };
export type ElementGenerator = () => Element;
export const node = (init: ElementInitializer, children: ElementGenerator[] = []) => {
    const appendChild = (n: Element, child: ElementGenerator): Element => {
        n.appendChild(child());
        return n;
    };
    const decorator = (element) => {
        if (init.decorator) {
            init.decorator(element);
        }
        return element;
    };
    const element = reduce(appendChild, decorator(createSVGElement(init.tag)), children);
    return () => {
        forEach( fn => fn(), children );
        return element;
    };
};