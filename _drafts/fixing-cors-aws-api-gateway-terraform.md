---
layout: post
title:  "Fixing AWS API Gateway CORS problems with Terraform"
date:   2020-06-10 18:00:00 +0200
categories: aws architecture microservices api terraform
sitemap:
  lastmod: 2020-06-10
  priority: 0.7
  changefreq: 'weekly'
---
While working on my [AWS Step Functions post](https://blog.bassemdy.com/2020/06/08/aws/architecture/microservices/patterns/aws-step-functions-think-again.html) post I had to setup a REST endpoint to trigger an state machine execution. I was using [Terraform](https://www.terraform.io/) to automate the stack build and maintenance.

Even though it comes with a relatively steep learning curve, depending on your background of course, I really like Terraform. It makes managing the infrastructure changes much more simple after you invest the time in building the templates initially.

## CORS... 
> The Security Feature That Everyone Overrides but Few Understand

I'm really not gonna do a better job explaining CORS better than Mozilla's MDN docs, so why don't you head over there and read a bit about the topic. I'll wait...

[Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

Great, so what's the issue?

Well, if you have a web application that's supposed to consume an API exposed through AWS API Gateway, you're bound at some point to call those APIs from your local development environment. CORS is a security feature implemented in browsers (desktop or mobile) to prevent malicious javascript code from passing your private data to a 3rd party (the first 2 being you and the browser).

For "non simple" requests as [defined here](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#Examples_of_access_control_scenarios) you will get the following error if you hit an endpoint that does respond with the appropriate headers (more on that later).

<img src="{{ "/assets/img/2020/06/10/cors-error2.png" | relative_url }}" alt="{{ site.plainwhite.name }}">

> Cross-Origin Request Blocked: The Same Origin Policy disallows reading the remote resource at https:/some-url-here. (Reason: additional information here).

To go around this error you will want:

1 . Your endpoints respond with the following headers:

```html
Access-Control-Allow-Origin: http://<example_url.com>
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: X-PINGOTHER, Content-Type
Access-Control-Max-Age: 86400
```

2 . To expose a endpoint that responds to "OPTIONS" http(s) requests. "preflighted requests" first send an HTTP request by the OPTIONS method to the resource on the other domain, to determine if the actual request is safe to send (more on that in the MDN documentation linked above).

## Terraform

> Add terraform template to build a simple API gateway

> Describe the template resource by resource


{% include disclaimer.html %}
