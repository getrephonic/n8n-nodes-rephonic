# Rephonic n8n submission

## Listing metadata

- Integration name: Rephonic
- npm package: n8n-nodes-rephonic
- Version: 0.1.0
- Website: https://rephonic.com
- Source repository: https://github.com/getrephonic/n8n-nodes-rephonic
- Documentation: https://github.com/getrephonic/n8n-nodes-rephonic#readme
- Support: support@rephonic.com
- Category: Marketing & Content
- Short description: Search podcasts and retrieve podcast data for research and outreach workflows.

## Description

Rephonic helps teams discover and research millions of podcasts. Use this integration to search by topic, title or publisher, filter results, retrieve individual podcast details and check API usage. The node works in ordinary workflows and as an AI Agent tool, with simplified, raw or selected output fields. Each customer connects their own API key from an account with API access.

## Review evidence

- [ ] Public repository with the reviewed MIT-licensed source and lockfile.
- [x] Official n8n lint, type checking/build and contract tests pass.
- [x] All operations run successfully in a real n8n workflow.
- [x] Multi-page, empty-result and error cases checked in n8n.
- [x] AI Agent tool use verified in n8n.
- [ ] Package published from GitHub Actions with valid npm provenance.
- [ ] Community package scanner passes on the published version.
- [ ] Current Creator Portal demo requirements confirmed and evidence recorded.
- [ ] Creator Portal submission sent and confirmation saved.

Runtime checks used n8n 2.45.7 with the live public API. AI Agent tool checks used a local deterministic model fixture and the live API tool, without paid model credentials. This is test evidence, not a recorded submission demo.

## Recording outline

1. Show the package name/version and install that release in self-hosted n8n.
2. Add a Rephonic credential without displaying the API key.
3. Run a small search and show individual result items.
4. Get one result's details and show the output controls.
5. Check account quota.
6. Demonstrate the node as an AI Agent tool.

Keep the recording continuous if the portal requires an uncut demo. Use only the customer's own key in credentials. Do not expose unrelated workflow data or account details.
