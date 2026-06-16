import React from "react";
import { Helmet } from "react-helmet";

function SEO({
  title = "PrintHub Moscow - Печать на футболках, кружках, шоперах и подушках в Москве",
  description = "Качественная печать на футболках, кружках, шоперах и подушках в Москве. Индивидуальный дизайн. Быстрая доставка.",
  keywords = "печать на футболках Москва, печать на кружках Москва, печать на шоперах Москва, печать на подушках Москва, PrintHub Moscow",
  ogUrl = "https://printhubmoscow.ru",
  author = "PrintHub Moscow",
}) {
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang="ru" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="Russian" />

      {/* Google / Search Engine Tags */}
      <meta itemProp="name" content={title} />
      <meta itemProp="description" content={description} />
      <meta itemProp="image" content={ogImage} />

      {/* Facebook / Open Graph Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="Мой Магазин" />
      <meta property="og:locale" content="ru_RU" />

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Canonical URL */}
      <link rel="canonical" href={ogUrl} />

      {/* Alternate language versions */}
      <link rel="alternate" href={ogUrl} hrefLang="ru" />

      {/* Mobile optimization */}
      <meta name="format-detection" content="telephone=no" />
      <meta name="HandheldFriendly" content="true" />

      {/* Theme color for browsers */}
      <meta name="theme-color" content="#4CAF50" />
    </Helmet>
  );
}

export default SEO;
