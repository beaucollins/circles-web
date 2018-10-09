/**
 * @flow
 */
import * as React from 'react';
import { render } from 'react-dom';

import Component from 'component';
import 'style.scss';

const div = document.createElement('div');
div.setAttribute('id', 'app');
const body = document.body;

if (body) {
	body.appendChild(div);
	render(<Component />, div);
}

