#!/usr/bin/env bash
# Create a new post with the current date and title
# Usage: new_post.sh

set -uo nounset # halt script on command fail in pipeline

TITLE="untitled"
WORKDIR="$(pwd)/_posts"
TODAY=$(date +%Y-%m-%d) # 2018-01-01
NOW=$(date -R | cut -d' ' -f5-) # 12:00:00 +0200
YEAR=$(date +%Y) # 2024
MONTH=$(date +%m) # 01
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

# Create the directory to store image assets
IMG_PATH="$(pwd)/assets/img/${YEAR}/${MONTH}"
mkdir -p "${IMG_PATH}" || true
echo "Created: ${IMG_PATH}"