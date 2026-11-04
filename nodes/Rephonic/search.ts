import type { IExecuteSingleFunctions, IHttpRequestOptions } from 'n8n-workflow';

export async function applySearchFilters(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const parameter = this.getNode().typeVersion === 1 ? 'filters' : 'options.filters';
	const filters = this.getNodeParameter(parameter, '') as string;
	requestOptions.qs = { ...requestOptions.qs, filters: filters || undefined };
	return requestOptions;
}
