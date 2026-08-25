import Script from "next/script";

/** Google Analytics 4 measurement ID. */
const GA_MEASUREMENT_ID = "G-F831ZPZTVG";

/**
 * GA4 gtag snippet. Mounted per route group — deliberately not in the root
 * layout, so the Sanity Studio under /(studio) stays untracked.
 */
export default function GoogleAnalytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
      </Script>
    </>
  );
}
