---
layout: post
title: "Parse JSON like a boss with jq"
date: 2020-04-07 22:00:00 +0200
categories: json utilities cli jq
sitemap:
  lastmod: 2020-04-07
  priority: 0.7
  changefreq: "weekly"
---

> TLDR; Showcasing cool stuff you can do with jq as a beginner

My love for `jq` is endless! This is the ultimate Swiss army knife for anything that involves `JSON`. Because this is not an opinionated post, let's just get to the point right away.

First, [jq](https://stedolan.github.io/jq/) have terrific documentation. It's fun to read and filled with great examples of the myriads of features this little utility is packed with.

## What is `jq`?

> Skip if you know the tool already

`jq` is a CLI tool to which you can pass a JSON object and then apply filters on it. You can chain filters to more surgical extractions of the content most relevant to you.

I've also learned lately that `jq` can parse the input in a streaming fashion and output an array of path and leaf values 😲

If you deal with a lot of REST APIs, or you're building CI/CD pipelines that require handling a lot of JSON or you do a lot of system integration work, this tool is fundamental for you.

## What is it good for?

### 1. Formatting output

Simple things first. We can start by formatting a correctly structured but non-readable JSON like:

**Input:**

```json
{    "glossary": {        "title": "example glossary",        "GlossDiv": {            "title": "S",            "GlossList": {                "GlossEntry": {                    "ID": "SGML",                    "SortAs": "SGML",                    "GlossTerm": "Standard Generalized Markup Language",                    "Acronym": "SGML",                    "Abbrev": "ISO 8879:1986",                    "GlossDef": {                        "para": "A meta-markup language, used to create markup languages such as DocBook.",                        "GlossSeeAlso": ["GML", "XML"]                    },                    "GlossSee": "markup"                }            }        }    }}
```

**Command:**

We're going to assume that you've stored that JSON (for the sake of example) in an environment variable called `INPUT_JSON`. Usually you don't have to, as you can pipe the output of the API directly.

```sh
# I'm going to do it once here
env INPUT_JSON='{    "glossary": {        "title": "example glossary",        "GlossDiv": {            "title": "S",            "GlossList": {                "GlossEntry": {                    "ID": "SGML",                    "SortAs": "SGML",                    "GlossTerm": "Standard Generalized Markup Language",                    "Acronym": "SGML",                    "Abbrev": "ISO 8879:1986",                    "GlossDef": {                        "para": "A meta-markup language, used to create markup languages such as DocBook.",                        "GlossSeeAlso": ["GML", "XML"]                    },                    "GlossSee": "markup"                }            }        }    }}'


# Beautify the JSON
echo $INPUT_JSON | jq
```

**Output:**

```sh
{
  "glossary": {
    "title": "example glossary",
    "GlossDiv": {
      "title": "S",
      "GlossList": {
        "GlossEntry": {
          "ID": "SGML",
          "SortAs": "SGML",
          "GlossTerm": "Standard Generalized Markup Language",
          "Acronym": "SGML",
          "Abbrev": "ISO 8879:1986",
          "GlossDef": {
            "para": "A meta-markup language, used to create markup languages such as DocBook.",
            "GlossSeeAlso": [
              "GML",
              "XML"
            ]
          },
          "GlossSee": "markup"
        }
      }
    }
  }
}
```

### 2. Fetching elements

Let's call an API endpoint and fetch some elements from the JSON response:

**Input:**

```sh
curl -X GET "https://httpbin.org/json" -H "accept: application/json"

# Returns
{
  "slideshow": {
    "author": "Yours Truly",
    "date": "date of publication",
    "slides": [
      {
        "title": "Wake up to WonderWidgets!",
        "type": "all"
      },
      {
        "items": [
          "Why <em>WonderWidgets</em> are great",
          "Who <em>buys</em> WonderWidgets"
        ],
        "title": "Overview",
        "type": "all"
      }
    ],
    "title": "Sample Slide Show"
  }
}
```

**Commands and Outputs:**

```sh
# Get object member
# =================
curl -X GET "https://httpbin.org/json" -H "accept: application/json" \
  | jq ".slideshow.author"

# Output
# ======

"Yours Truly"

---

# Get multiple object members
# ===========================
curl -X GET "https://httpbin.org/json" -H "accept: application/json" \
  | jq ".slideshow.author|.slideshow.date"

# Output
# ======

"Yours Truly"
"date of publication"

---

# Get multiple object members of different data types
# ===================================================

curl -X GET "https://httpbin.org/json" -H "accept: application/json" \
  | jq ".slideshow.author,.slideshow.date,.slideshow.slides"

# Output
# ======

"Yours Truly"
"date of publication"
[
  {
    "title": "Wake up to WonderWidgets!",
    "type": "all"
  },
  {
    "items": [
      "Why <em>WonderWidgets</em> are great",
      "Who <em>buys</em> WonderWidgets"
    ],
    "title": "Overview",
    "type": "all"
  }
]

---

# Get array element at index N
# ============================
curl -X GET "https://httpbin.org/json" -H "accept: application/json" \
  | jq ".slideshow.slides[1]"

# Output
# ======

{
  "items": [
    "Why <em>WonderWidgets</em> are great",
    "Who <em>buys</em> WonderWidgets"
  ],
  "title": "Overview",
  "type": "all"
}

---

```

### 3. Transformations

**Input:**

```sh
curl -X GET "https://httpbin.org/json" -H "accept: application/json"

# Returns
{
  "slideshow": {
    "author": "Yours Truly",
    "date": "date of publication",
    "slides": [
      {
        "title": "Wake up to WonderWidgets!",
        "type": "all"
      },
      {
        "items": [
          "Why <em>WonderWidgets</em> are great",
          "Who <em>buys</em> WonderWidgets"
        ],
        "title": "Overview",
        "type": "all"
      }
    ],
    "title": "Sample Slide Show"
  }
}
```

**Commands and Outputs:**

```sh
# Construct a new object and count elements of an array
# =====================================================

curl -X GET "https://httpbin.org/json" -H "accept: application/json" \
  | jq "{ \
      writer: .slideshow.author, \
      slides_count: .slideshow.slides | length \
    }"


# Output
# ======

{
  "writer": "Yours Truly",
  "slides_count": 2
}

---

# Concatenate all slide titles into pipe separated values
# =======================================================

curl -X GET "https://httpbin.org/json" -H "accept: application/json" \
    | jq '[.slideshow.slides[].title] | join (" | ")'


# Output
# ======

"Wake up to WonderWidgets!, Overview"

---

# JSON encode and print the input as a string
# ===========================================

curl -X GET "https://httpbin.org/json" -H "accept: application/json" \
    | jq '. | tostring'


# Output
# ======

"{\"slideshow\":{\"author\":\"Yours Truly\",\"date\":\"date of publication\",\"slides\":[{\"title\":\"Wake up to WonderWidgets!\",\"type\":\"all\"},{\"items\":[\"Why <em>WonderWidgets</em> are great\",\"Who <em>buys</em> WonderWidgets\"],\"title\":\"Overview\",\"type\":\"all\"}],\"title\":\"Sample Slide Show\"}}"


```
