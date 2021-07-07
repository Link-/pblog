# pblog

## Setup

```bash

# Install dependencies
npm install
bundle install

# Server
bundle exec jekyll serve --trace --livereload --drafts

# Generate og assets
node generate_og_assets.js
```

### Sitemap settings

```markdown
---
sitemap:
  lastmod: 2018-05-25
  priority: 0.7
  changefreq: 'weekly'
---

<!-- OR -->

---
sitemap:
  exclude: 'yes'
---
```
