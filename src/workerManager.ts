/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import { LanguageServiceDefaultsImpl } from './monaco.contribution';
import { LUWorker } from './luWorker';

import IDisposable = monaco.IDisposable;
import Uri = monaco.Uri;

export class WorkerManager {

	private _modeId: string;
	private _defaults: LanguageServiceDefaultsImpl;
	private _idleCheckInterval: number;
	private _lastUsedTime: number;
	private _configChangeListener: IDisposable;

	private _worker: monaco.editor.MonacoWebWorker<LUWorker>;
	private _client: Promise<LUWorker>;

	constructor(modeId: string, defaults: LanguageServiceDefaultsImpl) {
		this._modeId = modeId;
		this._defaults = defaults;
		this._worker = null;
		this._idleCheckInterval = setInterval(() => this._checkIfIdle(), 30 * 1000);
		this._lastUsedTime = 0;
		this._configChangeListener = this._defaults.onDidChange(() => this._stopWorker());
	}

	private _stopWorker(): void {
		if (this._worker) {
			this._worker.dispose();
			this._worker = null;
		}
		this._client = null;
	}

	dispose(): void {
		clearInterval(this._idleCheckInterval);
		this._configChangeListener.dispose();
		this._stopWorker();
	}


	private _checkIfIdle(): void {
		if (!this._worker) {
			return;
		}
		const maxIdleTime = this._defaults.getWorkerMaxIdleTime();
		const timePassedSinceLastUsed = Date.now() - this._lastUsedTime;
		if (maxIdleTime > 0 && timePassedSinceLastUsed > maxIdleTime) {
			this._stopWorker();
		}
	}

	private _getClient(): Promise<LUWorker> {
		this._lastUsedTime = Date.now();

		if (!this._client) {
			this._worker = monaco.editor.createWebWorker<LUWorker>({
				// module that exports the create() method and returns a `LGWorker` instance
				moduleId: 'vs/language/botframework-lu/luWorker',
				label: this._modeId,
			});

			let p = <Promise<LUWorker>>this._worker.getProxy();

			if (this._defaults.getEagerModelSync()) {
				p = p.then(worker => {
					return this._worker.withSyncedResources(monaco.editor.getModels()
						.filter(model => model.getModeId() === this._modeId)
						.map(model => model.uri)
					);
				})
			}

			this._client = p;
		}

		return this._client;
	}

	getLanguageServiceWorker(...resources: Uri[]): Promise<LUWorker> {
		let _client: LUWorker;
		return this._getClient().then((client) => {
			_client = client
		}).then(_ => {
			return this._worker.withSyncedResources(resources)
		}).then(_ => _client);
	}
}
