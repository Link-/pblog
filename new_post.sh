#!/usr/bin/env bash
# Create a new post with the current date and title
# Usage: new_post.sh

set -uo nounset # halt script on command fail in pipeline

TITLE="untitled"
WORKDIR="$(pwd)/_posts"
TODAY=$(date +%Y-%m-%d) # 2018-01-01
NOW=$(date -R | cut -d' ' -f5-) # 12:00:00 +0200
FILENAME="${TODAY}-${TITLE}.md"

cat <<EOF > "${WORKDIR}/${FILENAME}"
---
layout: post
title:  "${TITLE}"
tldr: "TBD"
date: ${TODAY} ${NOW}
categories: tbd
image: tbd
sitemap:
    lastmod: ${TODAY}
    priority: 0.7
    changefreq: 'monthly'
---
EOF

echo "Created: ${WORKDIR}/${FILENAME}"