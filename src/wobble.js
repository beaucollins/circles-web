// @flow
import { createSVGElement, polarToCartesian, deg2rad, rad2deg } from './svg';
import { pipe, reduce, head, tail, defaultTo } from 'ramda';
import { debounce } from 'lodash';
import type { Polar, Point } from './svg';
import { addAll, invert, multiply, add, min } from './radius-generator';
import type { RadiusGenerator } from './radius-generator';
import './style';

type PathGenerator = () => Element;
type PathDecorator = (Element) => void;

const increment = ( to: number, magnitude = 1, beginningAt = 0 ) => {
    return fn => {
        const sign = to < beginningAt ? -1 : 1;
        const results = [];
        let current = beginningAt; 
        const complete = ( sign === 1 ? (() => current >= to) : (() => current <= to ));
        do {
            results.push( fn( current ) );
            current += magnitude * sign;
        } while( ! complete() );
        return results;
    };
};

const ring = ( decorator: PathDecorator, radius: RadiusGenerator ): PathGenerator => {
    // generate a list of points around a given center
    const path = createSVGElement('path');
    decorator( path );
    const update = () => {
        let points = increment(360, 1)( pipe(
            degree => ( { degree, radius: radius(degree) } ),
            polarToCartesian
        ) );
        let first = defaultTo({ x: 0, y: 0 }, head(points));
        let d = reduce( ( options, point ) => {
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

const center: Point = {
    x: window.innerWidth * 0.5,
    y: window.innerHeight * 0.5
};

const render = ( ... generators: Array<PathGenerator> ) => {
    
    const svg = createSVGElement( 'svg' );
    const g = createSVGElement('g');
    
    window.addEventListener( 'resize', debounce(() => {
        center.x = window.innerWidth * 0.5;
        center.y = window.innerHeight * 0.5;
        g.setAttribute( 'transform', `translate(${center.x}, ${center.y})`);
    }));
    
    svg.setAttribute( 'width', '100%');
    svg.setAttribute( 'height', '100%');
    svg.appendChild( generators.reduce(
        (parent, generator) => {
            parent.appendChild(generator());
            return parent;
        },
        g
    ) );
    g.setAttribute( 'transform', `translate(${center.x}, ${center.y})`);
    if ( document.body ) document.body.appendChild(svg);

    const update = () => {
        generators.forEach( generator => generator() );
        requestAnimationFrame( update );
    };
    update();
};

const constant = v => () => v;

const now = () => (new Date()).getTime();

const wave = ( size = 0, count = 1, speed = 1 ) => {
    return degree => {
        return Math.sin( deg2rad( degree + now() * speed ) * count ) * size;
    };
};

const vectorBetween = (p1: Point, p2: Point): Polar => {
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

type CursorEvent = { pageX: number, pageY: number };

const distanceFrom = ( anchor: () => number ): RadiusGenerator => {
    return degree => {
        const a = anchor();
        return Math.min(
            Math.abs(a - degree + 360),
            Math.abs(a - degree),
            Math.abs(a - degree - 360 )
        );
    };
};

const dampen = (fn, range = 90) => {
    let v = { radius: 0, degree: 0 };
    let enabled = false;
    const updateVector = (e: CursorEvent) => {
        v = vectorBetween(center, { x: e.pageX, y: e.pageY });
    };
    const enableDampener = () => enabled = true;
    const disableDampener = () => enabled = false;

    document.addEventListener( 'mousemove', updateVector );
    document.addEventListener( 'mousedown', enableDampener);
    document.addEventListener( 'mouseup', disableDampener );
    document.addEventListener( 'touchstart', (e: TouchEvent) => {
        enableDampener();
        e.preventDefault();
        updateVector({
            pageX: e.touches[0].pageX,
            pageY: e.touches[0].pageY
        });
    } );

    document.addEventListener( 'touchmove', (e: TouchEvent) => {
        e.preventDefault();
        updateVector({
            pageX: e.changedTouches[0].pageX,
            pageY: e.changedTouches[0].pageY
        });
    } );
    document.addEventListener( 'touchend', disableDampener );
    const dampener = invert( fn );
    return degree => {
        const delta = min(
            distanceFrom( () => v.degree ),
            () => range
        )( degree );
        const amount = 1 - delta/range;
        return (1-amount) * dampener(degree);
    };
};

const wave1 = addAll(
    wave( 6, 3, -0.01 ),
    wave( 4, 1, 0.08 ),
    wave( 4, 4, -0.001 ),
    wave( 1, 7, 0.01 )
);

const wave2 = addAll(
    wave( 4, 4, 0.02 ),
    wave( 3, 2, 0.04 ),
    wave( 4, 4, -0.04)
);

const wave3 = addAll(
    wave( 4, 2, -0.002 ),
    wave( 2, 4, 0.052 ),
    wave( -3, 5, -0.0071 ),
    wave( 4, 1, -0.05 )
);

const color = (c: string) => path => {
    path.setAttribute('fill', c);
};

const atLeast = ( radius: number, fn: RadiusGenerator ): RadiusGenerator => {
    const c = constant(radius);
    return add( c, fn );
};

const mouseVectorUpdater = (): (() => Polar) => {
    const currentViewer = document.createElement('div');
    const targetViewer = document.createElement('div');
    const body = document.body;
    if ( body != null ) {
        body.appendChild( targetViewer );
        body.appendChild( currentViewer );
    }
    let current: Polar = { degree: 0, radius: 0 };
    let target: Polar = current;
    const updateVector = (e: CursorEvent) => {
        target = vectorBetween(center, { x: e.pageX, y: e.pageY });
    };
    document.addEventListener( 'mousemove', updateVector );
    document.addEventListener( 'touchstart', (e: TouchEvent) => {
        e.preventDefault();
        updateVector({
            pageX: e.touches[0].pageX,
            pageY: e.touches[0].pageY
        });
    } );

    document.addEventListener( 'touchmove', (e: TouchEvent) => {
        e.preventDefault();
        updateVector({
            pageX: e.changedTouches[0].pageX,
            pageY: e.changedTouches[0].pageY
        });
    } );

    const move = () => {
        const factor = 0.02;
        const targetDegrees = [
            target.degree,
            target.degree + 360,
            target.degree - 360
        ];
        const compare = d => Math.abs( d - current.degree );
        const result = reduce( ( { delta, degree }, targetDegree ) => {
            const targetDelta = Math.abs(targetDegree - current.degree);
            return targetDelta < delta ? { delta: targetDelta, degree: targetDegree } : { delta, degree };
        }, { delta: Infinity, degree: 0 }, targetDegrees );
        const next = {
            degree: (((result.degree - current.degree) * factor + current.degree) + 360 ) % 360,
            radius: (target.radius - current.radius) * factor + current.radius
        };
        current = next;
        requestAnimationFrame( move );  
    };

    move();

    return () => current;
};
const mouseVector = mouseVectorUpdater();

const mouseDampened = (fn: RadiusGenerator): RadiusGenerator => {
    const anchor = distanceFrom( () => mouseVector().degree );
    const range = 80;
    const scale = f => {
        return Math.pow(f, 3);
    };
    return addAll(
        multiply( fn, add(degree => {
            const distance = anchor( degree );
            const factor = (Math.min( distance, range ) / range);
            return 1-scale(factor);
        }, () => .2 ) ),
        () => Math.cos( now() * 1 / 1000 ) * 5
    );
};

render(
    ring(
        color('#ffff00'),
        atLeast(90, mouseDampened( wave1 ) )
    ),
    ring(
        color('#00ffff'),
        atLeast(90, mouseDampened( wave2 ) )
    ),
    ring(
        color('#ff00ff'),
        atLeast(90, mouseDampened( wave3 ) )
    )
);
