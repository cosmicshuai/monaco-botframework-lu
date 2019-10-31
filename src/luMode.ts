/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { WorkerManager } from './workerManager';
import { LUWorker } from './luWorker';
import { LanguageServiceDefaultsImpl } from './monaco.contribution';

import Uri = monaco.Uri;

let luWorker: (first: Uri, ...more: Uri[]) => Promise<LUWorker>;

export function setupLU(defaults: LanguageServiceDefaultsImpl): void {
	luWorker = setupMode(
		defaults,
		'botframeworklu'
	);
}

export function getLUWorker(): Promise<(first: Uri, ...more: Uri[]) => Promise<LUWorker>> {
	return new Promise((resolve, reject) => {
		if (!luWorker) {
			return reject("LU not registered!");
		}

		resolve(luWorker);
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
			[/^\s*#\s*\?/, {token: 'QnA', next:'@QnA'}],
            [/^\s*#/, {token: 'intent', next:'@intent'}],
			[/^\s*\$/, {token: 'entity-identifier', goBack: 1, next:'@entity_mode'}],
			[/^\s*@/, {token: 'new-entity-identifier', goBack: 1, next:'@new_entity_mode'}],
			[/^\s*>\s*[\s\S]*$/, {token: 'comments'}],
			[/(^\s*\[)1([a-zA-Z0-9._ ]+)(\]\(.{1,2}\/)([a-zA-Z0-9_.*]+)((?:#[a-zA-Z0-9._?]+)?)(\))/,['left_bracket','import-desc','delimeter','file-name','ref-intent','right-parent']],
			],
			QnA :[
				[/.$/,'QnA', '@pop'],
				[/./,'QnA']
			],

            intent: [
				[/^\s*-/, {token: 'intent-body-identifier', next:'@intent_body'}],
				[/([a-zA-Z0-9_][a-zA-Z0-9_-]*)(\.[a-zA-Z0-9_][a-zA-Z0-9_-]*)*/,'intent-name']
			],
			
			intent_body : [
				[/^\s*(-|\+|\*)/, {token: 'intent-body-identifier', next:'@intent_body'}],
				[/^\s*#\s*\?/, {token: 'QnA', next:'@QnA'}],
				[/^\s*#/, {token: 'intent', next:'@intent'}],
				[/^\s*\$/, {token: 'entity-identifier', goBack: 1, next:'@entity_mode'}],
				[/^\s*@/, {token: 'new-entity-identifier', goBack: 1, next:'@new_entity_mode'}],
				[/\{ (~[\r\n{}] | ('{' ~[\r\n]* }))* \}/,'expression'],
				[/./, 'normail-intent-string'],
			],

			new_entity_mode :
			[
				[/@\s*(simple|list|regex|prebuilt|composite|ml|patternany|phraselist|intent)/,]
			],

			// ml_entity : [
			// 	[/([a-zA-Z][a-zA-Z0-9_.]*\s+)(=)()/, '']
			// ],
		}
	});
	return worker;
}
