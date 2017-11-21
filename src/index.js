// @flow
import { createSVGElement, polarToCartesian, deg2rad, node, vectorBetween } from './svg';
import type { ElementGenerator } from './svg';
import { pipe, reduce, head, tail, defaultTo } from 'ramda';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import type { Polar, Point } from './svg';
import { addAll, increment } from './radius-generator';
import type { RadiusGenerator } from './radius-generator';
import './style';

type PathDecorator = (Element) => Element;

const windowCenter = (): Point => {
    return {
        x: window.innerWidth * 0.5,
        y: window.innerHeight * 0.5
    };
};

const ring = ( radius: RadiusGenerator, decorator: PathDecorator = v => v ): ElementGenerator => {
    // generate a list of points around a given center
    const path = decorator( createSVGElement('path') );
    const update = () => {
        let points = increment(360, 2)( pipe(
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

const render = ( generator: ElementGenerator) => {
    const rootNode = generator();

    if (document.body) {
        document.body.appendChild(rootNode);
    }
    const update = () => {
        generator();
        requestAnimationFrame( update );
    };
    requestAnimationFrame(update);
};

const constant = v => () => v;

const now = () => (new Date()).getTime();

const wave = ( size = 0, count = 1, speed = 1 ) => {
    return degree => {
        return Math.sin( deg2rad( degree + now() * speed ) * count ) * size;
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

const atLeast = ( radius: number, fn: RadiusGenerator ): RadiusGenerator => {
    const c = constant(radius);
    return addAll( c, fn );
};

const mouseVectorUpdater = (): (() => Polar) => {
    const currentViewer = document.createElement('div');
    const targetViewer = document.createElement('div');
    let idle = true;
    let speed = 0;
    const setIdle: () => void = throttle( () => {
        idle = true;
    }, 2000, { leading: false } );
    const body = document.body;
    if ( body != null ) {
        body.appendChild( targetViewer );
        body.appendChild( currentViewer );
    }
    let current: Polar = { degree: 0, radius: 0 };
    let target: Polar = current;
    const updateVector = (e: CursorEvent) => {
        idle = false;
        speed = 0;
        setIdle();
        target = vectorBetween(windowCenter(), { x: e.pageX, y: e.pageY });
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
    let lastEllapsed = 0;
    let idleDirection = 1;
    const move = (ellapsed) => {
        const timeDelta = ellapsed - lastEllapsed;
        lastEllapsed = ellapsed;
        if ( idle ) {
            speed = Math.min( speed + 0.01, 1 );
            current = {
                degree: (current.degree + speed * 0.1 * timeDelta * idleDirection + 360) % 360,
                radius: current.radius
            };
            requestAnimationFrame(move);
            return;
        }
        const factor = 0.05;
        const targetDegrees = [
            target.degree,
            target.degree + 360,
            target.degree - 360
        ];
        const result = reduce( ( { delta, degree }, targetDegree ) => {
            const targetDelta = Math.abs(targetDegree - current.degree);
            return targetDelta < delta ? { delta: targetDelta, degree: targetDegree } : { delta, degree };
        }, { delta: Infinity, degree: 0 }, targetDegrees );
        const next = {
            degree: (((result.degree - current.degree) * factor + current.degree) + 360 ) % 360,
            radius: (target.radius - current.radius) * factor + current.radius
        };
        idleDirection = next.degree < current.degree ? -1 : 1;
        current = next;
        requestAnimationFrame( move );  
    };

    requestAnimationFrame(move);

    return () => current;
};
const mouseVector = mouseVectorUpdater();

const mouseDampened = (fn: RadiusGenerator): RadiusGenerator => {
    const anchor = distanceFrom( () => mouseVector().degree );
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
};

const ring1 = atLeast(90, mouseDampened( wave1 ) );
const ring2 = atLeast(90, mouseDampened( wave2 ) );
const ring3 = atLeast(90, mouseDampened( wave3 ) );

const fullScreenSVG = (... children: PathGenerator[]) => node(
    {
        tag: 'svg',
        decorator: (element) => {
            element.setAttribute('width', '100%');
            element.setAttribute('height', '100%');   
        }
    },
    children
);

const centeredGroup = ( ... children: PathGenerator[] ) => node(
    {
        tag: 'g',
        decorator: (element) => {
            const updateCenter = () => {
                const center = windowCenter();
                element.setAttribute( 'transform', `translate(${center.x}, ${center.y})`);            
            };
            window.addEventListener('resize', debounce(() => {
                updateCenter();
            }, 10 ));
            updateCenter();
        }
    },
    children
);

const image = fullScreenSVG(
    centeredGroup(
        ring( ring1 ),
        ring( ring2 ),
        ring( ring3 ),
    )
);
render( image );
