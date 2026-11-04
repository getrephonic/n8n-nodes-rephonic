# Rephonic community node for n8n

Search podcasts and retrieve Rephonic data in your n8n workflows or AI agents.

[Rephonic](https://rephonic.com) helps teams research podcasts and find outreach opportunities. This package uses the public Rephonic API.

## Requirements

- An n8n installation that supports community nodes.
- Your own Rephonic API key and an account with API access.
- For n8n Cloud, this package must first be verified by n8n. Publishing to npm alone does not enable Cloud installation.

## Installation

In a self-hosted n8n instance, open **Settings > Community nodes**, choose **Install**, and enter `n8n-nodes-rephonic`. Follow n8n's community-node installation instructions.

## Credentials

1. Open your [Rephonic account](https://rephonic.com) and copy your API key. See the [developer guide](https://rephonic.com/developers) for API access requirements.
2. Create a **Rephonic API** credential in n8n.
3. Paste your key into **API Key** and save. The credential test checks the API quota endpoint.

The package contains no embedded keys. Keys belong in n8n credentials, rather than node parameters, workflow JSON, source code or screenshots. The node sends requests to `https://api.rephonic.com`.

## Operations

| Resource | Operation | Result                                                     |
| -------- | --------- | ---------------------------------------------------------- |
| Podcast  | Get Many  | Search by topic, title or publisher, with optional filters |
| Podcast  | Get       | Retrieve one podcast by its Rephonic ID                    |
| Account  | Get Quota | Check API request usage and allowance                      |

### Search and pagination

Supply a **Query**, choose **Options → Add Option → Filters**, or use both. Filters use the [service's documented syntax](https://rephonic.com/developers/search-filters), for example `active:is:true,languages:any:en`.

Existing workflows keep node version 1 and their saved filters. New nodes use version 1.1 with **Options → Filters**. If you upgrade an existing node to version 1.1, copy its Filters value into **Options → Filters**.

By default, **Get Many** returns up to 50 results. Increase **Limit** or enable **Return All**. The node follows pages while the API reports more results and caps each page at 100. Returning all matches can use many API requests and is still subject to the service's search and account limits.

Each matching podcast becomes a separate n8n item. Downstream nodes can use `{{$json.id}}` to fetch details for each result.

### Output

- **Simplified** returns the most useful fields, with no more than ten fields per item.
- **Raw** preserves all fields on each podcast object, including nested data.
- **Selected Fields** returns the fields you choose and always includes the ID when available.

Missing fields are omitted. Zero, false and null values are preserved.

## Example workflow

Import [examples/research-workflow.json](https://github.com/getrephonic/n8n-nodes-rephonic/blob/main/examples/research-workflow.json), select your Rephonic credential on each Rephonic node, and run it manually. It searches for a small set of active English-language podcasts, gets their details, and checks API quota on a separate branch. No credentials are included and the workflow is inactive by default.

You can also attach the Rephonic node as a tool to an n8n AI Agent. Start with a small limit and simplified or selected output. This package does not include a language-model provider or model credentials.

## Troubleshooting

- **Unauthorized:** check the API key and API access on your Rephonic account.
- **Invalid request:** check the query, filter syntax and podcast ID. An ID is the Rephonic identifier, rather than an arbitrary website URL.
- **Quota or rate limit:** check your API allowance and reduce the result limit or workflow frequency.
- **No results:** try a broader query or fewer filters.

The node is read-only. It does not send outreach, purchase API credits or change your Rephonic account.

## Development and release

See [DEVELOPMENT.md](https://github.com/getrephonic/n8n-nodes-rephonic/blob/main/DEVELOPMENT.md) for checks and the GitHub Actions publishing setup. See [submission.md](https://github.com/getrephonic/n8n-nodes-rephonic/blob/main/submission.md) for the review description and demo checklist.

## Support and license

Contact [support@rephonic.com](mailto:support@rephonic.com). Licensed under the [MIT License](https://github.com/getrephonic/n8n-nodes-rephonic/blob/main/LICENSE.md).
