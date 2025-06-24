import Head from "next/head"

export default function SEO({
  title = "InviteU.Digital - Invitaciones Digitales Personalizadas",
  description = "Crea invitaciones digitales únicas para tus eventos especiales. Diseños personalizables, RSVP integrado y entrega instantánea.",
  image = "/og-image.png",
  url = "https://inviteu.digital",
  type = "website",
}) {
  const fullTitle = title.includes("InviteU.Digital") ? title : `${title} | InviteU.Digital`

  return (
    <Head>
      {/* Meta básicos */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="InviteU.Digital" />
      <meta property="og:locale" content="es_ES" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* PWA */}
      <meta name="theme-color" content="#667eea" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="InviteU" />

      {/* Icons */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      <link rel="manifest" href="/manifest.json" />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "InviteU.Digital",
            description: description,
            url: url,
            applicationCategory: "LifestyleApplication",
            operatingSystem: "Any",
            offers: {
              "@type": "Offer",
              price: "9.99",
              priceCurrency: "EUR",
            },
          }),
        }}
      />
    </Head>
  )
}
