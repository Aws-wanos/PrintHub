import React from "react";
import { Helmet } from "react-helmet";

function SEO({
  title = "PrintHub - Качественная печать на одежде и аксессуарах",
  description = "Качественная печать на футболках, кружках, шоперах и подушках в Москве. Индивидуальный дизайн. Быстрая доставка по России. Закажите сейчас!",
  keywords = "печать на футболках, печать на кружках, печать на шоперах, печать на подушках, сувенирная продукция, подарки на заказ, москва, россия, printhub",
  ogImage = "/logo192.png",
  ogUrl = "https://aws-wanos-printhub-d2ce.twc1.net",
  author = "PrintHub",
}) {
  return (
    <Helmet>
      <html lang="ru" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content="index, follow" />

      <meta itemProp="name" content={title} />
      <meta itemProp="description" content={description} />
      <meta itemProp="image" content={ogImage} />

      <meta property="og:type" content="website" />
      <meta property="og:url" content={ogUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:site_name" content="PrintHub" />
      <meta property="og:locale" content="ru_RU" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      <link rel="canonical" href={ogUrl} />
      <link rel="alternate" href={ogUrl} hrefLang="ru" />

      <meta name="format-detection" content="telephone=no" />
      <meta name="HandheldFriendly" content="true" />
      <meta name="theme-color" content="#4CAF50" />
    </Helmet>
  );
}

export default SEO;
