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
			[/^\s*(-|\*|\+)/, {token: 'utterance-identifier', next:'@utterance'}],
			[/^\s*\$/, {token: 'entity-identifier', goBack: 1, next:'@entity_mode'}],
			[/^\s*@/, {token: 'new-entity-identifier', goBack: 1, next:'@new_entity_mode'}],
			[/^\s*>\s*[\s\S]*$/, {token: 'comments'}],
			[/(^\s*\[)([a-zA-Z0-9._ ]+)(\]\(.{1,2}\/)([a-zA-Z0-9_.*]+)((?:#[a-zA-Z0-9._?]+)?)(\))/,['left_bracket','import-desc','delimeter','file-name','ref-intent','right-parent']],
			],
			
			QnA :[
				[/.$/,'QnA', '@pop'],
				[/./,'QnA']
			],

            intent: [
				[/.$/,'intent', '@pop'],
				[/^\s*(-|\*|\+)/, {token: 'utterance-identifier', next:'@utterance'}],
				[/^\s*#/, {token: 'intent', next:'@intent'}],
                [/./, 'intent'],
            ],

            utterance : 
            [
				[/.$/,'utterance', '@pop'],
                [/^\s*#/, {token: 'intent', next:'@intent'}],
                [/./, 'utterance'],
			],
			
			entity_mode : [
				[/.$/,'entity', '@pop'],
				[/./,'entity'],
			],

			new_entity_mode :
			[
				[/.$/,'new-entity', '@pop'],
			// [/@\s*ml\s+/, {token :'ml-entity-identifier', next: '@ml_entity'}],
			// [/@\s*prebuilt\s+/, {token :'prebuilt-entity-identifier', next: '@prebuilt_entity'}],
			// [/@\s*simple\s+/, {token :'simple-entity-identifier', next: '@simple_entity'}],
			// [/@\s*patternany\s+/, {token :'patternany-entity-identifier', next: '@patternany_entity'}],
			// [/@\s*phraselist\s+/, {token :'phraselist-entity-identifier', next: '@phraselist_entity'}],
			// [/@\s*intent\s+/, {token :'intent-entity-identifier', next: '@intent_entity'}],
			// [/@\s*composite \s*[a-zA-Z][a-zA-Z0-9_.]*\s*([a-zA-Z][a-zA-Z0-9_.]*\s*)(,\s*[a-zA-Z][a-zA-Z0-9_.]*\s*)*=/, {token :'composite-entity-identifier', next: '@composite_entity'}],
			// [/@\s*regex\s+/, {token :'regex-entity-identifier', next: '@regex-entity'}],
			// [/@\s*list\s+[a-zA-Z][a-zA-Z0-9_.]*\s+([a-zA-Z][a-zA-Z0-9_.]*\s*)(,\s*[a-zA-Z][a-zA-Z0-9_.]*\s*)*=/, {token :'list-entity-identifier', next: '@list_entity'}],
			// [/@\s*list\s*/, {token :'list-entity-identifier', next: '@list_entity'}],
			// [/@\s*[a-zA-Z][a-zA-Z0-9_.]*\s+=/, {token :'list-entity-identifier', next: '@list_entity'}],
			[/./, 'new-entity']
			],

			// ml_entity : [
			// 	[/([a-zA-Z][a-zA-Z0-9_.]*\s+)(=)()/, '']
			// ],
		}
	});
	return worker;
}
