const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');
const pkg = require('../package.json');
const fixture = require('./fixture.json');
const root = path.resolve(__dirname, '..');
const brand = fixture.brand;
const slug = fixture.slug;
const entity = fixture.entity;

const load = Module._load;
Module._load = function (request, parent, isMain) {
	if (request === 'n8n-workflow') return { NodeConnectionTypes: { Main: 'main' } };
	return load.call(this, request, parent, isMain);
};
Module._extensions['.ts'] = function (module, filename) {
	const result = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
		fileName: filename,
		compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
		reportDiagnostics: true,
	});
	const errors = result.diagnostics.filter((d) => d.category === ts.DiagnosticCategory.Error);
	assert.equal(
		errors.length,
		0,
		ts.formatDiagnosticsWithColorAndContext(errors, {
			getCanonicalFileName: (f) => f,
			getCurrentDirectory: () => root,
			getNewLine: () => '\n',
		}),
	);
	module._compile(result.outputText, filename);
};

const { [brand]: Node } = require(`../nodes/${brand}/${brand}.node.ts`);
const { [`${brand}Api`]: Credential } = require(`../credentials/${brand}Api.credentials.ts`);
const { formatOutput } = require(`../nodes/${brand}/output.ts`);
const { applySearchFilters } = require(`../nodes/${brand}/search.ts`);
const node = new Node().description;
const credential = new Credential();
const properties = node.properties;
const search = properties
	.find((p) => p.name === 'operation' && p.displayOptions.show.resource[0] === entity)
	.options.find((o) => o.value === 'getMany');
const get = properties
	.find((p) => p.name === 'operation' && p.displayOptions.show.resource[0] === entity)
	.options.find((o) => o.value === 'get');
const paging = properties.find((p) => p.name === 'returnAll').routing.operations.pagination
	.properties;

function evaluate(value, context) {
	if (typeof value !== 'string' || !value.startsWith('=')) return value;
	const text = value.slice(1);
	if (text.startsWith('{{') && text.endsWith('}}'))
		return vm.runInNewContext(text.slice(2, -2), context);
	return text.replace(/\{\{(.*?)\}\}/g, (_, expression) => vm.runInNewContext(expression, context));
}
function context(parameter = {}, body = {}) {
	return {
		$parameter: {
			query: 'climate',
			options: {},
			mode: 'topics',
			limit: 10,
			returnAll: false,
			...parameter,
		},
		$response: { body },
	};
}
function outputContext(output, fields = []) {
	return { getNodeParameter: (name, fallback) => ({ output, fields })[name] ?? fallback };
}

test('credential is a password field and tests against the correct API origin', () => {
	const key = credential.properties.find((p) => p.name === 'apiKey');
	assert.equal(key.typeOptions.password, true);
	assert.equal(key.required, true);
	assert.equal(key.default, '');
	assert.equal(credential.test.request.baseURL, `https://api.${slug}.com`);
	assert.equal(credential.test.request.url, '/api/accounts/quota/');
	assert.equal(
		evaluate(credential.authenticate.properties.headers[`x-${slug}-api-key`], {
			$credentials: { apiKey: 'fixture-key' },
		}),
		'fixture-key',
	);
});

test('operations are read-only, use the service API, and can be attached as an AI tool', () => {
	assert.equal(node.requestDefaults.baseURL, `https://api.${slug}.com`);
	assert.equal(node.usableAsTool, true);
	for (const property of properties.filter((p) => p.name === 'operation')) {
		for (const operation of property.options) assert.equal(operation.routing.request.method, 'GET');
	}
	assert.equal(search.routing.request.url, `/api/search/${fixture.plural}/`);
	assert.equal(get.routing.output.postReceive[0].properties.property, fixture.apiEntity);
});

test('initial pagination starts at page one and never exceeds the API page size', () => {
	assert.equal(evaluate(paging.request.qs.page, { $parameter: {}, $response: {} }), 1);
	assert.equal(evaluate(paging.request.qs.page, context()), 1);
	assert.equal(evaluate(paging.request.qs.per_page, context({ limit: 101 })), 100);
	assert.equal(evaluate(paging.request.qs.per_page, context({ limit: 7 })), 7);
	assert.equal(evaluate(paging.request.qs.per_page, context({ returnAll: true })), 100);
});

test('101 requested results spans two pages and stops without an unnecessary third request', () => {
	const page = (number) => ({
		page: number,
		more: true,
		[fixture.plural]: Array.from({ length: 100 }, (_, n) => ({ id: `${number}-${n}` })),
	});
	assert.equal(evaluate(paging.continue, context({ limit: 101 }, page(1))), true);
	assert.equal(evaluate(paging.request.qs.page, context({ limit: 101 }, page(1))), 2);
	assert.equal(evaluate(paging.continue, context({ limit: 101 }, page(2))), false);
	const limit = properties.find((p) => p.name === 'limit');
	assert.equal(evaluate(limit.routing.output.maxResults, { $value: 101 }), 101);
});

test('an exact page boundary does not cause an extra request', () => {
	assert.equal(
		evaluate(
			paging.continue,
			context({ limit: 100 }, { page: 1, more: true, [fixture.plural]: [{ id: 'last' }] }),
		),
		false,
	);
});

test('return all follows more but stops on either a final or empty page', () => {
	assert.equal(
		evaluate(
			paging.continue,
			context({ returnAll: true }, { page: 1, more: true, [fixture.plural]: [{ id: 'one' }] }),
		),
		true,
	);
	assert.equal(
		evaluate(
			paging.continue,
			context({ returnAll: true }, { page: 2, more: false, [fixture.plural]: [{ id: 'last' }] }),
		),
		false,
	);
	assert.equal(
		evaluate(
			paging.continue,
			context({ returnAll: true }, { page: 2, more: true, [fixture.plural]: [] }),
		),
		false,
	);
});

test('new nodes group optional filters while preserving the old node layout', () => {
	assert.deepEqual(node.version, [1, 1.1]);
	const options = properties.find((p) => p.name === 'options');
	assert.equal(options.type, 'collection');
	assert.deepEqual(options.default, {});
	assert.deepEqual(options.displayOptions.show['@version'], [1.1]);
	assert.equal(options.options.find((p) => p.name === 'filters').type, 'string');
	assert.deepEqual(
		properties.find((p) => p.name === 'filters').displayOptions.show['@version'],
		[1],
	);
	assert.equal(properties.find((p) => p.name === 'query').type, 'string');
});

test('search resolves the correct filter parameter for new and saved legacy nodes', async () => {
	assert.ok(
		properties
			.find((p) => p.name === 'returnAll')
			.routing.send.preSend.includes(applySearchFilters),
	);
	for (const version of [1, 1.1]) {
		const expected = version === 1 ? 'filters' : 'options.filters';
		for (const filters of ['', 'active:is:true,languages:any:en']) {
			const result = await applySearchFilters.call(
				{
					getNode: () => ({ typeVersion: version }),
					getNodeParameter: (name) => {
						assert.equal(name, expected);
						return filters;
					},
				},
				{ method: 'GET', url: '/search', qs: { page: 2, query: 'climate' } },
			);
			assert.equal(result.qs.filters, filters || undefined);
			assert.equal(
				evaluate(paging.request.qs.filters, { $request: { qs: result.qs } }),
				filters || undefined,
			);
			assert.equal(result.qs.page, 2);
			assert.equal(result.qs.query, 'climate');
		}
	}
});

test('query and search-mode values reach the first and subsequent pages', () => {
	for (const request of [search.routing.request, paging.request]) {
		assert.equal(evaluate(request.qs.query, context({ query: '' })), undefined);
		for (const mode of properties.find((p) => p.name === 'mode').options) {
			assert.equal(evaluate(request.qs.mode, context({ mode: mode.value })), mode.value);
		}
	}
});

test('record IDs are encoded as a single path segment', () => {
	const id = 'show/name?secret=not-a-real-key';
	const result = evaluate(get.routing.request.url, {
		$parameter: { [`${fixture.apiEntity}Id`]: id },
	});
	assert.equal(result, `/api/${fixture.plural}/${encodeURIComponent(id)}/`);
});

test('simplified output preserves false, zero and null while removing bulky fields', async () => {
	const items = [{ json: fixture.record, pairedItem: { item: 2 } }];
	const result = await formatOutput.call(outputContext('simplified'), items);
	assert.ok(Object.keys(result[0].json).length <= 10);
	assert.equal(result[0].json.id, fixture.record.id);
	assert.equal(result[0].json.engagement ?? result[0].json.downloads_per_episode, 0);
	assert.equal(result[0].json.description, null);
	assert.equal('largeFixtureField' in result[0].json, false);
	assert.deepEqual(result[0].pairedItem, { item: 2 });
});

test('raw output preserves the complete object and item metadata', async () => {
	const items = [{ json: fixture.record, pairedItem: { item: 0 } }];
	assert.equal(await formatOutput.call(outputContext('raw'), items), items);
});

test('selected fields retain ID automatically and omit missing fields', async () => {
	const result = await formatOutput.call(outputContext('selected', ['name', 'name', 'missing']), [
		{ json: fixture.record },
	]);
	assert.deepEqual(result[0].json, { id: fixture.record.id, name: fixture.record.name });
});

test('output formatting handles no results and separate input-item associations', async () => {
	assert.deepEqual(await formatOutput.call(outputContext('selected'), []), []);
	const items = [0, 1].map((n) => ({
		json: { ...fixture.record, id: `record-${n}` },
		pairedItem: { item: n },
	}));
	const result = await formatOutput.call(outputContext('selected'), items);
	assert.deepEqual(
		result.map((i) => i.pairedItem.item),
		[0, 1],
	);
	assert.deepEqual(
		result.map((i) => i.json.id),
		['record-0', 'record-1'],
	);
});

test('package has no runtime dependencies and public contacts use the support address', () => {
	assert.deepEqual(pkg.dependencies ?? {}, {});
	assert.equal(pkg.author.email, `support@${slug}.com`);
	assert.equal(pkg.homepage, `https://${slug}.com`);
	assert.ok(pkg.keywords.includes('n8n-community-node-package'));
	assert.equal(pkg.license, 'MIT');
	for (const directory of ['credentials', `nodes/${brand}`]) {
		for (const file of fs
			.readdirSync(path.join(root, directory))
			.filter((f) => f.endsWith('.ts'))) {
			const source = fs.readFileSync(path.join(root, directory, file), 'utf8');
			assert.doesNotMatch(source, /process\.env|node:fs|require\(['"]fs['"]\)|from ['"]fs['"]/);
			assert.doesNotMatch(source, /[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}/i);
		}
	}
});

test('light and dark icons are local square SVG assets without external references', () => {
	for (const icon of Object.values(node.icon)) {
		const svg = fs.readFileSync(path.resolve(root, `nodes/${brand}`, icon.slice(5)), 'utf8');
		const [, width, height] = svg.match(/<svg[^>]*width="(\d+)(?:px)?"[^>]*height="(\d+)(?:px)?"/);
		assert.equal(width, height);
		assert.doesNotMatch(svg, /<(?:script|foreignObject)|(?:href|xlink:href)="https?:/i);
	}
});
