/**
 * @flow
 */
import type { ElementGenerator } from './svg';

export default (generator: ElementGenerator) => {
	const rootNode = generator();
	const update = () => {
		generator();
		requestAnimationFrame( update );
	};
	requestAnimationFrame(update);
	return rootNode;
};
