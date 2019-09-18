/**
 * @flow
 */
/**
 * External deps
 */
import * as React from 'react';
import { render } from 'react-dom';
import ColorPicker from 'rc-color-picker';
import 'rc-color-picker/assets/index.css';

/**
 * Internal Deps
 */
import { node } from 'svg';
import { vectorBetween } from 'polar';
import { defs } from 'svg-defs';
import { reduce } from 'ramda';
import { debounce, throttle } from 'lodash';
import { addAll, atLeast, mouseDampened } from 'radius-generator';

import ring from 'ring';
import ringRender from 'render';
import wave from 'wave';

/**
 * @flow types
 */
import type { ElementGenerator } from 'svg';
import type { Polar, Point } from 'polar';

type CursorEvent = { pageX: number, pageY: number };

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

const mouseVectorUpdater: (() => Point) => () => Polar = (getCenter) => {
	let idle = true;
	let speed = 0;
	const setIdle = throttle( () => {
		idle = true;
	}, 2000, { leading: false } );

	let current: Polar = { degree: 0, radius: 0 };
	let target: Polar = current;
	const updateVector = (e: CursorEvent) => {
		idle = false;
		speed = 0;
		setIdle();
		target = vectorBetween(getCenter(), { x: e.pageX, y: e.pageY });
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

type VectorProvider = () => Polar;
const ring1 = (mouseVector: VectorProvider) => atLeast(90, mouseDampened( wave1, mouseVector ) );
const ring2 = (mouseVector: VectorProvider) => atLeast(90, mouseDampened( wave2, mouseVector ) );
const ring3 = (mouseVector: VectorProvider) => atLeast(90, mouseDampened( wave3, mouseVector ) );

const fullScreenSVG = (... children: ElementGenerator[]) => node(
    
	{
		tag: 'svg',
		decorator: attributes( {
			width: '100%',
			height: '100%'
		} )
	},
	children
);

const centeredGroup = (centerProvider: () => Point) => ( ... children: ElementGenerator[] ) => node(
	{
		tag: 'g',
		decorator: (element) => {
			const updateCenter = () => {
				const center = centerProvider();
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

const attributes = ( atts: { [string]: string } ) => ( element: Element) => {
	for( const key in atts ) {
		element.setAttribute(key, atts[key]);
	}
}; 

type Color = string;
type ColorSet = [Color, Color, Color];

type Configuration = {
	getCenter: () => Point,
	getVector: () => Polar,
	getColors: () => ColorSet,
	getPoints: () => number,
	getMode: () => string,
}

function ringAtts(atts: {[string]: string }) {
	return (element: Element) => {
		attributes(atts)(element);
		return element;
	};
}

function fillFromSet(config: Configuration, index: number) {
	return (element: Element) => ringAtts({
		fill: config.getColors()[index],
		style: 'mix-blend-mode: ' + config.getMode(),
		'mix-blend-mode': 'darken',
	})(element);
}

const image = (configuration: Configuration) => fullScreenSVG(
	defs(
		node( { tag: 'pattern', decorator: attributes( {
			id: 'dots',
			width: '50',
			height: '50',
			patternUnits: 'userSpaceOnUse'
		} ) }, [
			node( { tag: 'circle', decorator: attributes( {
				cx: '5',
				cy: '5',
				r: '2',
				fill: 'white'
			} )  })
		] )
	),
	centeredGroup(configuration.getCenter)(
		ring( ring1(configuration.getVector), configuration.getPoints, fillFromSet(configuration, 0)),
		ring( ring2(configuration.getVector), configuration.getPoints, fillFromSet(configuration, 1)),
		ring( ring3(configuration.getVector), configuration.getPoints, fillFromSet(configuration, 2)),
	)
);

type Ref<T> = { current: null | T };

type State = {
	points: number,
	colors: ColorSet,
	blendMode: string,
	backgroundColor: string,
}

type ColorChangeEvent = {
	color: Color,
	alpha: number,
	open: boolean,
}

const BlendModeOptions = [
	'normal',
	'multiply',
	'screen',
	'overlay',
	'darken',
	'lighten',
	'color-dodge',
	'color-burn',
	'hard-light',
	'soft-light',
	'difference',
	'exclusion',
	'hue',
	'saturation',
	'color',
	'luminosity',
];

type RingProps = {
	colors: ColorSet,
	blendMode: string,
	points: number,
};

class Ring extends React.Component<RingProps> {

	static defaultProps = {
		magnitude: 1,
	};

	container: Ref<HTMLDivElement> = React.createRef();

	componentDidMount() {
		const container = this.container.current;
		if (container) {
			const getCenter = () => ({
				x: container.offsetWidth * 0.5,
				y: container.offsetTop + container.offsetHeight * 0.5,
			});
			const graph = ringRender(image({
				getCenter,
				getVector: mouseVectorUpdater(getCenter),
				getPoints: () => this.props.points,
				getColors: () => this.props.colors,
				getMode: () => this.props.blendMode,
			}));
			container.appendChild(graph);
		};
	}

	render() {
		return (
			<div ref={this.container}></div>
		);
	}

}
export default class Component extends React.Component<{}, State> {

	state = {
		points: 90,
		colors: ['#F00', '#0F0', '#00F'],
		blendMode: 'screen',
		backgroundColor: '#000',
	}

	handlePointsChange = (event: SyntheticInputEvent<HTMLInputElement>) => {
		const points = parseInt(event.target.value);
		if (points > 0) {
			this.setState({ points });
		}
	}

	handleColorChange = (index: number) => (event: ColorChangeEvent) => {
		const colors = [... this.state.colors];
		colors[index] = event.color;
		this.setState({ colors });
	}

	handleModeChange = (event: SyntheticInputEvent<HTMLSelectElement>) => {
		this.setState({ blendMode: event.currentTarget.value });
	}

	handleBackgroundColorChange = (event: ColorChangeEvent) => {
		this.setState({ backgroundColor: event.color });
	}

	render() {
		return (
			<React.Fragment>
				<div className="container" style={{ backgroundColor: this.state.backgroundColor }}>
					<Ring points={this.state.points} colors={this.state.colors} blendMode={this.state.blendMode} />
				</div>
				<div className="controls">
					<label>
						Points
						<input
							type="number"
							value={this.state.points}
							min={3}
							max={180}
							onChange={this.handlePointsChange}
						/>
					</label>
					<label>
						Colors
						<div className="picker-holder">
							{this.state.colors.map((color, index) =>
								<ColorPicker key={index}
									color={color}
									enableAlpha={false}
									onChange={this.handleColorChange(index)}
								/>
							)}
						</div>
					</label>
					<label>
						Background
						<div className="picker-holder">
							<ColorPicker
								color={this.state.backgroundColor}
								enableAlpha={false}
								onChange={this.handleBackgroundColorChange}
							/>
						</div>
					</label>
					<label>
						Blend Mode
						<select
							value={this.state.blendMode}
							onChange={this.handleModeChange}
						>
							{BlendModeOptions.map((mode, key) =>
								<option key={key}>{mode}</option>
							)}
						</select>
					</label>
				</div>
			</React.Fragment>
		);
	}
}
