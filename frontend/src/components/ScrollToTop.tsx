import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop component that resets scroll position on navigation
 * Excludes hash-based navigation (e.g., #comment-123) to preserve scroll-to-item behavior
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Only scroll to top if there's no hash (hash navigation should scroll to the element)
    if (!hash) {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}
