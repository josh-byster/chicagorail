/**
 * SEO hook for dynamic document title and meta tag updates
 */

import { useEffect } from 'react';

interface SEOOptions {
  title?: string;
  description?: string;
}

const BASE_TITLE = 'Chicago Rail';
const DEFAULT_DESCRIPTION =
  'Track Metra train departures and arrivals in real-time. View schedules, plan trips, and never miss your Chicago commuter train.';

export function useSEO({ title, description }: SEOOptions = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${BASE_TITLE}` : `${BASE_TITLE} - Metra Train Tracker & Schedule`;
    document.title = fullTitle;

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description || DEFAULT_DESCRIPTION);
    }

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', fullTitle);
    }

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', description || DEFAULT_DESCRIPTION);
    }

    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) {
      twitterTitle.setAttribute('content', fullTitle);
    }

    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription) {
      twitterDescription.setAttribute('content', description || DEFAULT_DESCRIPTION);
    }
  }, [title, description]);
}
