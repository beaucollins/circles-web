// @flow

const NAMESPACE_SVG = 'http://www.w3.org/2000/svg';

export type Point = { x: number, y: number };
export type Polar = { degree: number, radius: number };

export const deg2rad = (degree: number) => degree * (Math.PI/180);
export const rad2deg = (radian: number) => radian * 180/Math.PI;

export const createSVGElement = (name: string) =>
    document.createElementNS(NAMESPACE_SVG, name);

export const polarToCartesian = ( polar: Polar ): Point => ( {
    x: Math.cos( deg2rad(polar.degree) ) * polar.radius,
    y: Math.sin( deg2rad(polar.degree) ) * polar.radius
} );
