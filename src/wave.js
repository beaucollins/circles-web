/**
 * @flow
 */
import type { RadiusGenerator } from 'radius-generator';

import { deg2rad } from './polar';
import now from './now';

export default ( size: number = 0, count: number = 1, speed: number = 1 ): RadiusGenerator => {
	return degree => {
		return Math.sin( deg2rad( degree + now() * speed ) * count ) * size;
	};
};
