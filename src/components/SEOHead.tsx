import React from 'react';
import { Helmet } from 'react-helmet';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  schemaMarkup?: object;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'PlanMyEscape - Effortless Camping & Cottage Trip Planning',
  description = 'Effortless planning for cottaging, car camping, canoe camping, and hike camping. Plan meals and shopping in minutes; never forget essentials again.',
  keywords = 'camping, trip planning, meal planning, packing list, cottage planning, outdoor adventure, group camping',
  image = 'https://planmyescape.ca/icon-512.png',
  url = 'https://planmyescape.ca',
  type = 'website',
  schemaMarkup
}) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="PlanMyEscape" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={url} />
      
      {/* Schema Markup for specific pages */}
      {schemaMarkup && (
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;