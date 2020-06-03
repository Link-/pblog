---
layout: post
title:  "Planning on using AWS Step Functions? Think again"
date:   2020-06-03 18:00:00 +0200
categories: aws architecture microservices patterns
sitemap:
  lastmod: 2020-06-03
  priority: 0.7
  changefreq: 'weekly'
---

You're using [AWS](https://aws.amazon.com/) and your entire or part of your landscape depends on it. You're contemplating [AWS Step Functions](https://aws.amazon.com/step-functions/) for a workflow you need to build or maybe you're just curious and just want to explore this product. Carry on, I have some interesting insights that you will not find in the documentation right away.

> TLDR; Step Functions is a great product for a specific set of use cases.

## Let's break it down a little 🤓

Step Functions are state machines (if you're not familiar with the term, that's ok). With Step Functions you define a **workflow** which is a list of **states**. You **transition** from one state to the other based on some input or condition until you reach the end of the **workflow**.

Here's a simple animated example:

> Placeholder for workflow gif

> Placeholder for flow description

### Types of Workflows

> Discuss the difference between **standard** and **express** and the limitations of each

## Use Cases: (Good | Bad)

In this section I will describe a number of real world problems and tag them with "Good or Bad" based on whether I think step functions is a good tool for the problem at hand.

### 1. Generate A Pdf Invoice Following An Order And Store It In S3 (Good 👍)

> Describe the use case and why it is good

### 2. Transactional Order Across Multiple Back-End Systems (Good 👍)

> Descibe the use case

Reference: https://github.com/aws-samples/aws-step-functions-long-lived-transactions

### 3. Nightly | Weekly | Monthly Etc. Backup Job (Good 👍)

> Describe the use case

### 4. Send An Email To A Customer Following A Manager'S Approval (Good 👍but!)

> Describe the use case

### 5. Orchestrate Mobile User On-Boarding (Bad 👎)

> Describe the use case

## Learn Step Functions

> Talk about the step functions lab and how to use it [stepfunctions_lab](https://github.com/Link-/stepfunctions_lab)

## Final thoughts

> TBD

### References

- [AWS Step functions resources](https://aws.amazon.com/step-functions/resources/?step-functions.sort-by=item.additionalFields.postDateTime&step-functions.sort-order=desc)

{% include disclaimer.html %}
