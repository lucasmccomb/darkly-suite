# Domain Proxy Workers

Thin Cloudflare Workers that proxy API requests from old per-product domains
to the unified `darklysuite.com` backend during the migration period.

## How It Works

Each proxy intercepts `/api/*` requests on the old domain, injects a `product`
query parameter, and forwards the request to `darklysuite.com/api/*`.

| Old Domain | Product Param | Target |
|------------|---------------|--------|
| `gmaildarkly.com/api/*` | `product=gmail` | `darklysuite.com/api/*` |
| `sheetsdarkly.com/api/*` | `product=sheets` | `darklysuite.com/api/*` |
| `docsdarkly.com/api/*` | `product=docs` | `darklysuite.com/api/*` |

## Deploy

```bash
# Deploy all three proxies
npx wrangler deploy --config scripts/domain-proxies/wrangler.gmail.toml
npx wrangler deploy --config scripts/domain-proxies/wrangler.sheets.toml
npx wrangler deploy --config scripts/domain-proxies/wrangler.docs.toml
```

## Teardown

Once all extensions have been updated to point directly to `darklysuite.com/api`
and old domains are no longer receiving traffic, delete the workers:

```bash
npx wrangler delete --name proxy-gmaildarkly
npx wrangler delete --name proxy-sheetsdarkly
npx wrangler delete --name proxy-docsdarkly
```
