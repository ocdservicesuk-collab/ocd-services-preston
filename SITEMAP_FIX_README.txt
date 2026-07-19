OCD Services v20 — Sitemap Fix

Fixes:
- Rebuilt sitemap.xml as minimal valid XML.
- Explicit application/xml Content-Type for sitemap.xml.
- Added sitemap.txt as a Google-supported fallback.
- Rebuilt robots.txt with sitemap reference.
- Disabled caching on sitemap and robots files.

After deployment test these URLs in a browser:
https://ocd-services-preston.ocd-services-uk.workers.dev/sitemap.xml
https://ocd-services-preston.ocd-services-uk.workers.dev/sitemap.txt
https://ocd-services-preston.ocd-services-uk.workers.dev/robots.txt
