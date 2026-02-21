import { useSearchParams } from 'react-router-dom'
import { Nav, Footer, SubscribeContent } from '@darkly/landing-shared'
import { NAV_LINKS, NAV_CTA, FOOTER_LINKS, SITE_NAME, CHECKOUT_API_URL, individualTiers, bundleTiers, DEFAULT_FEATURES } from '../config.ts'

const PRODUCT_NAMES: Record<string, string> = {
  gmail: 'Darkly for Gmail',
  sheets: 'Darkly for Sheets',
  docs: 'Darkly for Docs',
  suite: 'Darkly Suite',
}

export function SubscribePage() {
  const [searchParams] = useSearchParams()
  const product = searchParams.get('product') ?? 'suite'
  const tiers = product === 'suite' ? bundleTiers : individualTiers(product)
  const productName = PRODUCT_NAMES[product] ?? 'Darkly Suite'

  return (
    <>
      <Nav brandLabel="Suite" links={NAV_LINKS} cta={NAV_CTA} />
      <SubscribeContent
        product={product}
        productName={productName}
        tiers={tiers}
        features={DEFAULT_FEATURES}
        checkoutBaseUrl={CHECKOUT_API_URL}
      />
      <Footer brandLabel="Suite" links={FOOTER_LINKS} copyrightName={SITE_NAME} />
    </>
  )
}
