// @flow
import type { Point } from './svg';
import type { RadiusGenerator } from './radius-generator';

import { vectorBetween } from './svg';
import { increment } from './radius-generator';

const timeDelta = (fn: (delta: number) => void) => {
    let lastTimestamp = 0;
    return (time: number) => {
        const delta = time - lastTimestamp;
        lastTimestamp = time;
        fn(delta);
    };
};

const mousePositionAtEvent = (event: MouseEvent): Point => {
    return {
        x: event.pageX,
        y: event.pageY
    };
};


export default (originProvider: () => Point): RadiusGenerator => {
    const springLocations: Map<number, { position: number, speed: number, velocity: number }> = new Map();
    increment( i => {
        const spring = { position: 0, velocity: 0, speed: 0 };
        springLocations.set(i, spring);
        return spring;
    }, 360, 1);
    const tension = 0.01;
    const dampening = 3;
    const spread = 1;
    const update = timeDelta((duration: number) => {
        const rDeltas: Map<number, number> = new Map();
        const lDeltas: Map<number, number> = new Map();
        springLocations.forEach( (spring, location) => {
            const delta = - spring.position;
            spring.speed += tension * delta - spring.speed * (dampening * duration * 0.001);
            spring.position += spring.speed * (duration * 0.001);
            lDeltas.set(location, 0);
            rDeltas.set(location, 0);
        } );
        for( let i = 0; i<16; i++ ){
        springLocations.forEach( (spring, location) => {
            const left = ((location - 2) + 360) % 360;
            const right = (location + 2) % 360;
            
            const leftSpring = springLocations.get(left) || {};
            const rightSpring = springLocations.get(right) || {};
            
            const leftDelta = spread * spring.position - leftSpring.position;
            const rightDelta = spread * spring.position - rightSpring.position;
            
            leftSpring.speed += leftDelta;
            rightSpring.speed += rightDelta;
            
            lDeltas.set( left, lDeltas.get( left ) + 0 );
            rDeltas.set( right, rDeltas.get( right ) + 0 );
        } );    
        springLocations.forEach( (spring, location) => {
            spring.position += lDeltas.get(location);
            spring.position += rDeltas.get(location);
        } );
        }
        // console.log( 'springs', springLocations.length );
        requestAnimationFrame(update);
    });
    document.addEventListener('click', (event: MouseEvent) => {
        const delta = vectorBetween(
            originProvider(),
            mousePositionAtEvent(event)
        );
        const closest = (Math.round(Math.round(delta.degree) * 0.5) * 2) % 360;
        const location = springLocations.get( closest );
        if (location) {
            location.speed = -250;
        }
    } );
    requestAnimationFrame(update);
    return (degree) => {
        const spring = springLocations.get(degree);
        if ( spring ) {
            return spring.position;
        }
        return 0;
    };
};