import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { formatOutput } from './output';
import { applySearchFilters } from './search';

export class Rephonic implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Rephonic',
		name: 'rephonic',
		icon: { light: 'file:../../icons/rephonic.svg', dark: 'file:../../icons/rephonic.dark.svg' },
		group: ['input'],
		version: [1, 1.1],
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Search podcasts and retrieve Rephonic data',
		defaults: { name: 'Rephonic' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'rephonicApi', required: true }],
		requestDefaults: {
			baseURL: 'https://api.rephonic.com',
			headers: { Accept: 'application/json' },
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Account',
						value: 'account',
					},
					{
						name: 'Podcast',
						value: 'podcast',
					},
				],
				default: 'podcast',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['podcast'],
					},
				},
				options: [
					{
						name: 'Get',
						value: 'get',
						action: 'Get podcast',
						description: 'Get details for one podcast',
						routing: {
							request: {
								method: 'GET',
								url: '=/api/podcasts/{{encodeURIComponent($parameter.podcastId)}}/',
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'podcast',
										},
									},
									formatOutput,
								],
							},
						},
					},
					{
						name: 'Get Many',
						value: 'getMany',
						action: 'Get many podcasts',
						description: 'Search podcasts by topic, title, or publisher',
						routing: {
							request: {
								method: 'GET',
								url: '/api/search/podcasts/',
								qs: {
									query: '={{$parameter.query || undefined}}',
									mode: '={{$parameter.mode}}',
									page: 1,
									per_page: '={{$parameter.returnAll ? 100 : Math.min(100, $parameter.limit)}}',
								},
							},
							output: {
								postReceive: [
									{
										type: 'rootProperty',
										properties: {
											property: 'podcasts',
										},
									},
									formatOutput,
								],
							},
						},
					},
				],
				default: 'getMany',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['account'],
					},
				},
				options: [
					{
						name: 'Get Quota',
						value: 'getQuota',
						action: 'Get API quota',
						description: 'Get API request usage and allowance',
						routing: {
							request: {
								method: 'GET',
								url: '/api/accounts/quota/',
							},
						},
					},
				],
				default: 'getQuota',
			},
			{
				displayName: 'Podcast ID',
				name: 'podcastId',
				type: 'string',
				required: true,
				default: '',
				placeholder: 'e.g. huberman-lab',
				description: 'The Rephonic ID returned by a search or shown in the podcast page URL',
				displayOptions: {
					show: {
						resource: ['podcast'],
						operation: ['get'],
					},
				},
			},
			{
				displayName: 'Query',
				name: 'query',
				type: 'string',
				default: '',
				placeholder: 'e.g. artificial intelligence',
				description: 'Supply a query, filters, or both',
				displayOptions: {
					show: {
						resource: ['podcast'],
						operation: ['getMany'],
					},
				},
			},
			{
				displayName: 'Search By',
				name: 'mode',
				type: 'options',
				options: [
					{
						name: 'Topic',
						value: 'topics',
					},
					{
						name: 'Podcast Title',
						value: 'titles',
					},
					{
						name: 'Publisher',
						value: 'publishers',
					},
				],
				default: 'topics',
				displayOptions: {
					show: {
						resource: ['podcast'],
						operation: ['getMany'],
					},
				},
			},
			{
				displayName: 'Filters',
				name: 'filters',
				type: 'string',
				default: '',
				placeholder: 'e.g. active:is:true,languages:any:en',
				description:
					'Comma-separated Rephonic search filters. See https://rephonic.com/developers/search-filters.',
				displayOptions: {
					show: {
						'@version': [1],
						resource: ['podcast'],
						operation: ['getMany'],
					},
				},
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						'@version': [1.1],
						resource: ['podcast'],
						operation: ['getMany'],
					},
				},
				options: [
					{
						displayName: 'Filters',
						name: 'filters',
						type: 'string',
						default: '',
						placeholder: 'e.g. active:is:true,languages:any:en',
						description:
							'Comma-separated Rephonic search filters. See https://rephonic.com/developers/search-filters.',
					},
				],
			},
			{
				displayName: 'Return All',
				name: 'returnAll',
				type: 'boolean',
				default: false,
				description: 'Whether to return all results or only up to a given limit',
				displayOptions: {
					show: {
						resource: ['podcast'],
						operation: ['getMany'],
					},
				},
				routing: {
					send: {
						paginate: true,
						preSend: [applySearchFilters],
					},
					operations: {
						pagination: {
							type: 'generic',
							properties: {
								request: {
									qs: {
										query: '={{$parameter.query || undefined}}',
										filters: '={{$request.qs.filters}}',
										mode: '={{$parameter.mode}}',
										page: '={{$response.body?.page ? $response.body.page + 1 : 1}}',
										per_page: '={{$parameter.returnAll ? 100 : Math.min(100, $parameter.limit)}}',
									},
								},
								continue:
									'={{$response.body.more === true && Array.isArray($response.body.podcasts) && $response.body.podcasts.length > 0 && ($parameter.returnAll || $response.body.page * Math.min(100, $parameter.limit) < $parameter.limit)}}',
							},
						},
					},
				},
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				typeOptions: {
					minValue: 1,
				},
				description: 'Max number of results to return',
				displayOptions: {
					show: {
						resource: ['podcast'],
						operation: ['getMany'],
						returnAll: [false],
					},
				},
				routing: {
					output: {
						maxResults: '={{$value}}',
					},
				},
			},
			{
				displayName: 'Output',
				name: 'output',
				type: 'options',
				options: [
					{
						name: 'Simplified',
						value: 'simplified',
						description: 'Return the most useful fields',
					},
					{
						name: 'Raw',
						value: 'raw',
						description: 'Return all available fields',
					},
					{
						name: 'Selected Fields',
						value: 'selected',
						description: 'Return chosen fields and the ID',
					},
				],
				default: 'simplified',
				displayOptions: {
					show: {
						resource: ['podcast'],
					},
				},
			},
			{
				displayName: 'Fields',
				name: 'fields',
				type: 'multiOptions',
				options: [
					{
						name: 'Active',
						value: 'active',
					},
					{
						name: 'Artwork URL',
						value: 'artwork_url',
					},
					{
						name: 'Description',
						value: 'description',
					},
					{
						name: 'Downloads Per Episode',
						value: 'downloads_per_episode',
					},
					{
						name: 'Email',
						value: 'email',
					},
					{
						name: 'Est Weekly Downloads',
						value: 'est_weekly_downloads',
					},
					{
						name: 'Feed URL',
						value: 'feed_url',
					},
					{
						name: 'Genres',
						value: 'genres',
					},
					{
						name: 'Guests',
						value: 'guests',
					},
					{
						name: 'ID',
						value: 'id',
					},
					{
						name: 'Language',
						value: 'language',
					},
					{
						name: 'Name',
						value: 'name',
					},
					{
						name: 'Publisher',
						value: 'publisher',
					},
					{
						name: 'Rankings',
						value: 'rankings',
					},
					{
						name: 'Similar',
						value: 'similar',
					},
					{
						name: 'Social Reach',
						value: 'social_reach',
					},
					{
						name: 'Sponsored',
						value: 'sponsored',
					},
					{
						name: 'Topics',
						value: 'topics',
					},
					{
						name: 'Web URL',
						value: 'web_url',
					},
				],
				default: ['name'],
				description: 'Fields to include in each result. The ID is always included when available.',
				displayOptions: {
					show: {
						resource: ['podcast'],
						output: ['selected'],
					},
				},
			},
		],
	};
}
