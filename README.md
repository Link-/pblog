# pblog

[![Deploy](https://github.com/Link-/pblog/actions/workflows/deploy.yml/badge.svg)](https://github.com/Link-/pblog/actions/workflows/deploy.yml)

> TLDR; Personal blog

## Local development

```bash
bundle install
npm ci --prefix script
bundle exec jekyll serve --trace --livereload --drafts
```

The production build remains a static Jekyll site in `_site/`. GitHub Actions deploys that directory to the existing server over SSH.

### Front-end features

- Responsive, accessible editorial layouts
- Persistent light and dark themes with system preference support
- Automatic Mermaid rendering for `mermaid` fenced code blocks
- Copy controls for fenced code blocks
- Filterable and searchable public speaking archive

### Social thumbnails

Generate thumbnails that do not exist yet:

```bash
npm run generate --prefix script
```

Refresh every thumbnail after changing `og_templates/template.html`:

```bash
npm run generate:all --prefix script
```

The deployment workflow generates missing thumbnails before building `_site`.
