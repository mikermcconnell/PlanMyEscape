import React from 'react';
import { Helmet } from 'react-helmet-async';

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
  // Temporarily disabled to fix Helmet error
  return null;
};

export default SEOHead;