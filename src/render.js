/**
 * @flow
 */
import type { ElementGenerator } from './svg';

export default (generator: ElementGenerator) => {
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
