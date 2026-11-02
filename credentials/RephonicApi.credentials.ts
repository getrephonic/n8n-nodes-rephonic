import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	Icon,
	INodeProperties,
} from 'n8n-workflow';

export class RephonicApi implements ICredentialType {
	name = 'rephonicApi';
	displayName = 'Rephonic API';
	icon: Icon = { light: 'file:../icons/rephonic.svg', dark: 'file:../icons/rephonic.dark.svg' };
	documentationUrl = 'https://rephonic.com/developers';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'The API key from your Rephonic account with API access enabled',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'x-rephonic-api-key': '={{$credentials.apiKey}}',
			},
		},
	};
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.rephonic.com',
			url: '/api/accounts/quota/',
			method: 'GET',
		},
	};
}
