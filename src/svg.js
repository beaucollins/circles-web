// @flow
import { reduce, forEach } from 'ramda';

export type ElementDecorator = (Element) => void;
export type ElementInitializer = { tag: string, decorator?: ElementDecorator };
export type ElementGenerator = () => Element;

const NAMESPACE_SVG = 'http://www.w3.org/2000/svg';

export const createSVGElement = (name: string) =>
    document.createElementNS(NAMESPACE_SVG, name);

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