// @flow
import { forEachObjIndexed, map } from 'ramda';
import { node } from './svg';

import type { ElementGenerator } from './svg';

export const defs = ( ... children: ElementGenerator[] ) => node( { tag: 'defs' }, children );

/**
 * Given a dictionary of attributes to set applies those attributes to the provided
 * DOM Element
 */
export const attributes = ( atts: {[string]: string} = {} ) => ( element: Element ) => {
    forEachObjIndexed( (value: string, key: string) => {
        element.setAttribute( key, value );
    } , atts );
};

export const radialGradient = ( id: string, stops: Array<{}> ) => node( { tag: 'radialGradient',
    decorator: attributes( { id } ) },
    map( ( stop ) => {
        return node( { tag: 'stop', decorator: attributes( stop ) } );
    } , stops )
);

export const ringGradient = ( id: string, color: string ) => radialGradient( id, [
    { offset: '90%', 'stop-color': color, 'stop-opacity': '1' },
    { offset: '100%', 'stop-color': 'black', 'stop-opacity': '0.1' },
] );
