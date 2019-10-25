/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { WorkerManager } from './workerManager';
import { LUWorker } from './luWorker';
import { LanguageServiceDefaultsImpl } from './monaco.contribution';

import Uri = monaco.Uri;

let lgWorker: (first: Uri, ...more: Uri[]) => Promise<LUWorker>;

export function setupLG(defaults: LanguageServiceDefaultsImpl): void {
	lgWorker = setupMode(
		defaults,
		'botframeworklu'
	);
}

export function getLGWorker(): Promise<(first: Uri, ...more: Uri[]) => Promise<LUWorker>> {
	return new Promise((resolve, reject) => {
		if (!lgWorker) {
			return reject("LU not registered!");
		}

		resolve(lgWorker);
	});
}

function setupMode(defaults: LanguageServiceDefaultsImpl, modeId: string): (first: Uri, ...more: Uri[]) => Promise<LUWorker> {

	const client = new WorkerManager(modeId, defaults);
	const worker = (first: Uri, ...more: Uri[]): Promise<LUWorker> => {
		return client.getLanguageServiceWorker(...[first].concat(more));
	};

	monaco.languages.setMonarchTokensProvider('botframeworklu', {
		ignoreCase: true,
		brackets: [
			{ open: '{', close: '}', token: 'delimiter.curly' },
			{ open: '[', close: ']', token: 'delimiter.bracket' },
			{ open: '(', close: ')', token: 'delimiter.parenthesis' }
		],
		tokenizer: {
			root:[
            [/^\s*#/, {token: 'intent', next:'@intent'}],
            [/^\s*-/, {token: 'utterance-identifier', next:'@utterance'}],
            ],

            intent: [
                [/^\s*-/, {token: 'utterance-identifier', next:'@utterance'}],
                [/./, 'intent'],
            ],

            utterance : 
            [
                [/^\s*#/, {token: 'intent', next:'@intent'}],
                [/./, 'utterance']
            ]
		}
	});
	return worker;
}
