# Chrome Web Store Submission Process

Step-by-step process for submitting a Darkly extension to the Chrome Web Store.
Derived from the Gmail Darkly submission (2026-02-19).

---

## Prerequisites

Before starting, verify:

- [ ] **Landing page deployed** — product-specific site live with `/privacy` page
- [ ] **Payment API live** — `darklysuite.com/api/status/{token}?product={product}` returns `{"paid":false}`
- [ ] **Stripe configured** — products and prices set up for this product (monthly/yearly/lifetime)
- [ ] **E2E testing complete** — run the test plan in `packages/{extension}/store-assets/e2e-test-plan.md`
- [ ] **Store assets ready** — screenshots (1280x800), store icon (128x128), optional promo tile (440x280)

---

## Step 1: Prepare Store Assets

Create `packages/{extension}/store-assets/` with these files:

| File | Purpose |
|------|---------|
| `listing.md` | Extension name, short description, detailed description, category |
| `permission-justifications.md` | Justification for each manifest permission |
| `privacy-declarations.md` | Data usage, single purpose, remote code declarations |
| `distribution.md` | Visibility, regions, pricing model |
| `description.txt` | Plain text description for copy-pasting (no markdown formatting) |
| `privacy-form.txt` | All privacy tab fields in plain text for copy-pasting |
| `test-instructions.txt` | Reviewer test instructions (max 500 characters) |

### Description guidelines
- Focus on what the extension does and why users should install it
- Include sections: features list, how it works, privacy note, support contact
- Max 16,000 characters

### Permission justifications
Write a justification for each permission in `manifest.json`. Be specific about why each permission is needed for the extension's single purpose. Vague justifications will be rejected.

### Test instructions
- Max 500 characters
- Include a promo code for free access (see Step 2)
- Describe the actual UI flow accurately

---

## Step 2: Create Reviewer Promo Code

Create a Stripe coupon and promo code so the reviewer can test paid features:

```bash
# Create 100% off coupon (single use)
stripe coupons create \
  --percent-off=100 \
  --duration=once \
  --name="CWS Reviewer - {Product} Free" \
  --max-redemptions=1

# Create promo code from the coupon
stripe post /v1/promotion_codes \
  -d "promotion[type]=coupon" \
  -d "promotion[coupon]={COUPON_ID}" \
  -d code=CWSREVIEW{PRODUCT}2026 \
  -d max_redemptions=1
```

**Important:** If Stripe is in test mode during submission, recreate the promo code in live mode before publishing.

---

## Step 3: Build Production Zip

```bash
pnpm --filter {extension} build
cd packages/{extension}/dist && zip -r ../gmail-darkly.zip .
```

Verify the zip contains: `manifest.json`, JS bundles, CSS, icons.

---

## Step 4: Upload to Chrome Web Store

1. Go to https://chrome.google.com/webstore/devconsole
2. Click **New Item**
3. Upload the zip file

---

## Step 5: Store Listing Tab

| Field | Value |
|-------|-------|
| Title | *(auto-populated from manifest)* |
| Summary | *(auto-populated from manifest)* |
| Description | Paste from `description.txt` |
| Category | **Functionality & UI** |
| Language | **English** |
| Homepage URL | Product landing page URL |
| Support URL | Product landing page URL |
| Mature content | Off |
| Store icon | 128x128 PNG |
| Screenshots | Up to 5, 1280x800 or 640x400 |
| Small promo tile | 440x280 (optional but recommended) |

---

## Step 6: Privacy Tab

| Field | Source |
|-------|--------|
| Single purpose description | From `privacy-form.txt` |
| Permission justifications | From `privacy-form.txt` (one per permission) |
| Remote code | **No** |
| Data usage | Check only **Location** (for sunrise/sunset). All others unchecked. |
| Certifications | Check all three boxes |
| Privacy policy URL | `https://{product-site}/privacy` |

**Note:** Host permissions trigger an in-depth review which may delay publishing.

---

## Step 7: Distribution Tab

| Field | Value |
|-------|-------|
| Payments | **Contains in-app purchases** |
| Visibility | **Public** |
| Regions | **All regions** |

---

## Step 8: Test Instructions

Paste content from `test-instructions.txt` into the **Test instructions** page under Access.

---

## Step 9: Submit

1. Click **Save draft**
2. Click **Submit for review**
3. **Uncheck** auto-publish — stage for manual publish so you can switch to live Stripe first
4. Click **Submit For Review**

---

## Post-Approval

Once approved (check developer dashboard for status):

1. Switch Stripe to live mode (if not already)
2. Recreate promo code in live mode
3. Verify `darklysuite.com/api/status` works with live keys
4. Click **Publish** in the developer dashboard
5. Staged versions expire after 30 days if not published

---

## Product-Specific Notes

| Product | Extension Package | Landing Site | siteBase |
|---------|------------------|--------------|----------|
| Gmail | `gmail-darkly` | gmaildarkly.com | `https://gmaildarkly.com` |
| Sheets | `sheets-darkly` | darklysuite.com | `https://darklysuite.com` |
| Docs | `docs-darkly` | darklysuite.com | `https://darklysuite.com` |
| Suite | `darkly-suite` | darklysuite.com | `https://darklysuite.com` |

---

## Submissions Log

| Product | Submitted | Extension ID | Status |
|---------|-----------|-------------|--------|
| Gmail | 2026-02-19 | kfgkinaheobhehhcaobkehpgghipeife | In review |
