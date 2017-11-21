// @flow
import { forEachObjIndexed } from 'ramda';
import type { ElementGenerator } from './svg';
import { node } from './svg';

export const defs = ( ... children: ElementGenerator[] ) => node( { tag: 'defs' }, children );

export const attributes = ( atts = {} ) => ( element ) => {
    forEachObjIndexed( (value, key) => {
        element.setAttribute( key, value );
    } , atts );
};

export const radialGradient = ( id: string, stops: Array<{}> ) => node( { tag: 'radialGradient',
    decorator: attributes( { id } ) },
    map( ( stop ) => {
        return node( { tag: 'stop', decorator: attributes( stop ) } )
    } , stops )
);

export const ringGradient = ( id: string, color: string ) => radialGradient( id, [
    { offset: '90%', 'stop-color': color, 'stop-opacity': '1' },
    { offset: '100%', 'stop-color': 'black', 'stop-opacity': '0.1' },
] );

// defs(
//     ringGradient( 'red', 'red' ),
//     ringGradient( 'green', 'green' ),
//     ringGradient( 'blue', 'blue' ),
//     ringGradient( 'cyan', 'cyan' ),
//     ringGradient( 'magenta', 'magenta' ),
//     ringGradient( 'yellow', 'yellow' )
// );