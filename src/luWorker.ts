/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import IWorkerContext = monaco.worker.IWorkerContext;

export class LUWorker {

	// --- model sync -----------------------

	private _ctx: IWorkerContext;

	constructor(ctx: IWorkerContext) {
		this._ctx = ctx;
	}

	// --- language service host ---------------
}


export function create(ctx: IWorkerContext): LUWorker {
	return new LUWorker(ctx);
}
