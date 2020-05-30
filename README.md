# pblog

## Setup

```bash

# Install dependencies
npm install
bundle install --path vendor/bundle

# Build
bundle exec jekyll build

# Serve
bundle exec jekyll serve
```

### Sitemap settings

```
---
sitemap:
  lastmod: 2018-05-25
  priority: 0.7
  changefreq: 'weekly'
---

OR

---
sitemap:
  exclude: 'yes'
---
```