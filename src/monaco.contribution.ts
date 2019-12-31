/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import * as mode from './luMode';
import Emitter = monaco.Emitter;
import IEvent = monaco.IEvent;

// --- TypeScript configuration and defaults ---------

export interface IExtraLib {
	content: string;
	version: number;
}


export class LanguageServiceDefaultsImpl {

	private _onDidChange = new Emitter<void>();

	private _workerMaxIdleTime: number;
	private _eagerModelSync: boolean;

	constructor() {
		this._workerMaxIdleTime = 2 * 60 * 1000;
	}

	get onDidChange(): IEvent<void> {
		return this._onDidChange.event;
	}

	setMaximumWorkerIdleTime(value: number): void {
		// doesn't fire an event since no
		// worker restart is required here
		this._workerMaxIdleTime = value;
	}

	getWorkerMaxIdleTime() {
		return this._workerMaxIdleTime;
	}

	setEagerModelSync(value: boolean) {
		// doesn't fire an event since no
		// worker restart is required here
		this._eagerModelSync = value;
	}

	getEagerModelSync() {
		return this._eagerModelSync;
	}
}

const LUDefaults = new LanguageServiceDefaultsImpl();

// --- Registration to monaco editor ---
function getMode(): Promise<typeof mode> {
	return import('./luMode');
}
monaco.languages.register({ id: 'botframeworklu' });
monaco.editor.defineTheme('lutheme', {
	base: 'vs',
	inherit: false,
	colors:{},
	rules: [
	  { token: 'intent-name', foreground: '0000FF' },
      { token: 'pattern', foreground: '00B7C3' },
      { token: 'entity-name', foreground: '038387' },
      { token: 'comments', foreground: '7A7A7A' },
      { token: 'import-desc', foreground: '00A32B' },
      { token: 'entity-type', foreground: 'DF2C2C' },
      { token: 'keywords', foreground: '0078D7' },
	]
});
monaco.languages.onLanguage('botframeworklu', () => {
	return getMode().then(mode => mode.setupLU(LUDefaults));
});
