// @flow
import { range, reduce, pipe, add, multiply, map } from 'ramda';
import './style';

const NAMESPACE_SVG = 'http://www.w3.org/2000/svg';

const createSVGElement = (name: string) =>
  document.createElementNS(NAMESPACE_SVG, name);

const createSVG = () => createSVGElement('svg');
const createPath = () => createSVGElement('path');

// Main node for appending canvas
const div = document.createElement( 'div' );
// reference to document body
const body = document.body;

if( body ) body.appendChild( div );

const graph = createSVG();
const group = createSVGElement( 'g' );
const path = createPath();
const path2 = createPath();
const path3 = createPath();

group.appendChild(path);
group.appendChild(path2);
group.appendChild(path3);
graph.appendChild( group );
div.appendChild(graph);

graph.setAttribute( 'width', '100%');
graph.setAttribute( 'height', '480px');

path.setAttribute('style', 'fill: none; stroke: blue; stroke-width: 1.5');
path2.setAttribute('style', 'fill: red; stroke: none; stroke-width: 0');
path3.setAttribute('style', 'fill: green; stroke: none; stroke-width: 0');

type Cartesian = { x: number, y: number };
type Polar = { r: number, d: number };
type Inputs = Array<number>
type Plotter = (value: number) => number;
type Grapher = (inputs: Inputs) => [Cartesian]
type PathGenerator = (grapher: Grapher ) => Element;

const power = ( raisedTo = 1 ) => x => Math.pow( x, raisedTo );

const parabolic:Plotter = power( 2 );
const wobble = ( base, delta, freq = 1 ) => d => base + Math.sin( deg2rad( d * freq ) ) * delta;
const translate = ( delta: Cartesian ): ( Cartesian => Cartesian ) => ( coordinate ) => ( {
  x: add( delta.x, coordinate.x ),
  y: add( delta.y, coordinate.y )
} );

const scale = ( factor: Cartesian ): ( Cartesian => Cartesian ) => ( coordinate ) => ( {
  x: multiply( factor.x, coordinate.x ),
  y: multiply( factor.y, coordinate.y )
} );

const toCartesian = ( transform: Plotter ): (number => Cartesian) => (x: number) => ( {
  x, y: transform( x )
} );

const toPolar = ( transform: Plotter ): (number => Polar) => (d: number) => ({
  d, r: transform( d )
} );

const buildPath = (transform: (number => Cartesian), inputs: Inputs) => {
  const [ head, ... rest ] = inputs;
  return reduce(
    (pathVal, x) => pipe(
      transform,
      point => `${ pathVal } L${ point.x },${ point.y }`
    )( x ),
    pipe(
      transform,
      point => `M ${ point.x},${ point.y }`
    )( head ),
    rest
  );
};

const plot = ( path, inputs, transform: (number => Cartesian) ): void => {
  path.setAttribute('d', buildPath( transform, inputs ) );
};

const deg2rad = degree => degree * ( Math.PI/180 );
const polarToCartesian = ( polar: Polar ) => ( {
  x: Math.cos( deg2rad(polar.d) ) * polar.r,
  y: Math.sin( deg2rad(polar.d) ) * polar.r
} );

plot( path, range( -10, 11 ), pipe(
  toCartesian( parabolic ),
  scale( { x: 30, y: 1 } ),
  translate( { x: 200, y: 100 } )
) );

plot( path2, map( multiply( 1 ), range( 0, 361 ) ), pipe(
    // toPolar( wobble(40, 5, 10) ),
    toPolar( wobble( 40, 10, 5 ) ),
    polar => ( { r: polar.r, d: polar.d } ),
    polarToCartesian,
    scale( { x: 2, y: 2 } ),
    translate( { x: 200, y: 100 } )
) );

plot( path3, map( multiply( 1 ), range( 0, 361 ) ), pipe(
  // toPolar( wobble(40, 5, 10) ),
  toPolar( wobble( 40, 10, 5 ) ),
  polar => ( { r: polar.r, d: polar.d } ),
  polarToCartesian,
  scale( { x: 2, y: 2 } ),
  translate( { x: 300, y: 100 } )
) );
