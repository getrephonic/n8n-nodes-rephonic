import type { IExecuteSingleFunctions, INodeExecutionData } from 'n8n-workflow';

const simplifiedFields = [
	'id',
	'name',
	'description',
	'web_url',
	'downloads_per_episode',
	'est_weekly_downloads',
	'language',
	'active',
	'email',
];

export async function formatOutput(
	this: IExecuteSingleFunctions,
	items: INodeExecutionData[],
): Promise<INodeExecutionData[]> {
	const output = this.getNodeParameter('output', 'simplified') as string;
	if (output === 'raw') return items;
	const fields =
		output === 'selected'
			? [...new Set(['id', ...(this.getNodeParameter('fields', []) as string[])])]
			: simplifiedFields;
	return items.map((item) => ({
		...item,
		json: Object.fromEntries(
			fields
				.filter((field) => Object.hasOwn(item.json, field))
				.map((field) => [field, item.json[field]]),
		),
	}));
}
