// @flow
import { range, pipe } from 'ramda';
import './style';
import { createSVGElement } from './svg';

type Point = { x: number, y: number };
type Polar = { radius: number, degree: number };
type Plotter = (input: number) => Point;
type PathGrapher = (inputs: Array<number>) => Element;
type GraphGenerator = (Plotter) => Element;

const path = (plotter: Plotter): PathGrapher => {
    const path = createSVGElement( 'path' );
    return ( inputs ) => {
        const [ head, ... rest ] = inputs;
        const start = plotter(head);
        const d = rest.reduce( ( _d, input ) => {
            const point = plotter( input );
            return `${ _d } L${ point.x },${ point.y }`;
        }, `M${ start.x },${ start.y }` );
        path.setAttribute( 'd', d );
        return path;
    };
};

const render = ( ... plotters: Array<Plotter>) => {
    const paths = plotters.map( path );
    const svg = createSVGElement( 'svg' );
    svg.setAttribute( 'width', '100%' );
    svg.setAttribute( 'height', '480px' );
    const inputs = range( 0, 361 );
    if( document.body ) document.body.appendChild(svg);

    const group = paths.reduce( ( g, path ) => {
        g.appendChild(path(inputs));
        g.setAttribute("transform", "translate(200, 200)");
        return g;
    }, createSVGElement( 'g' ) );
    
    svg.appendChild(group);
    const update = () => {
        paths.forEach( path => {
            path(inputs);
        } );
        requestAnimationFrame( update );
    };
    update();
};

const linear = ( slope = 0, constant = 0 ): Plotter => {
    return x => {
        return { x, y: x * slope + constant };
    };
};

const deg2rad = degree => degree * ( Math.PI/180 );
const polarToCartesian = ( polar: Polar ): Point => ( {
    x: Math.cos( deg2rad(polar.degree) ) * polar.radius,
    y: Math.sin( deg2rad(polar.degree) ) * polar.radius
  } );
  
const radial = ( radius: (input: number) => number ): Plotter => {
    return pipe(
        (degree: number) => ({ radius: radius( degree ), degree }),
        polarToCartesian
    );
};

render( linear(), radial( ( degree ) => Math.cos( deg2rad( degree * 10 ) ) * 10 + 150 ) );