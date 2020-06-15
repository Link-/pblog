---
layout: post
title:  "Fixing AWS API Gateway CORS problems with Terraform"
date:   2020-06-10 18:00:00 +0200
categories: aws architecture microservices api terraform
image: /assets/img/2020/06/10/CORS_principle_header_1280x.png
sitemap:
  lastmod: 2020-06-10
  priority: 0.7
  changefreq: 'weekly'
---
While working on my [AWS Step Functions post](https://blog.bassemdy.com/2020/06/08/aws/architecture/microservices/patterns/aws-step-functions-think-again.html) post I had to setup a REST endpoint to trigger an state machine execution. I was using [Terraform](https://www.terraform.io/) to automate the stack build and maintenance.

Even though it comes with a relatively steep learning curve, depending on your background of course, I really like [Terraform](https://www.terraform.io/). It makes managing the infrastructure changes much more simple after you invest the time in building the templates initially.

## CORS... 
> The Security Feature That Everyone Overrides but Few Understand

I'm really not gonna do a better job explaining CORS than Mozilla's MDN docs. Why don't you head over there and read a bit about the topic. I'll wait...

[Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

Great, so what's the issue?

Well, if you have a web application that's supposed to consume an API exposed through AWS API Gateway, you're bound at some point to want to call those APIs from your local development environment.

By default, your local setup is running on `http://localhost` or `http://127.0.0.1` and your code is making a request to a URI like: `https://ry714zb1j4.execute-api.eu-west-1.amazonaws.com/<resource>`. These are obviously different domains and by default browsers, for security reasons, will restrict these "cross-origin requests".

For "non simple" requests as [defined here](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS#Examples_of_access_control_scenarios) you will get the following error (in Chrome, slightly different in other browsers).

<img alt="Access to blocked resource error in Chrome" src="{{ "/assets/img/2020/06/10/cors_error_chrome.png" | relative_url }}" alt="{{ site.plainwhite.name }}">

To go around this error you will want:

1 . Your endpoints to respond with the following headers:

```html
Access-Control-Allow-Origin: http://<example_url.com>
Access-Control-Allow-Methods: POST, GET, OPTIONS
Access-Control-Allow-Headers: X-PINGOTHER, Content-Type
Access-Control-Max-Age: 86400
```

2 . To expose an endpoint that responds to "OPTIONS" http(s) requests. "Preflighted requests" first send an HTTP request by the OPTIONS method to the resource on the other domain, to determine if the actual request is safe to send. [More on those here](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request).

## Terraform

The URI structure for our endpoint will look as follows:

> https://\<api_identifier\>.execute-api.\<region\>.amazonaws.com/\<stage\>/\<resource\>

A request to this endpoint using [JQuery](https://jquery.com/) will look like:

```javascript
$.ajax({
  type: "GET",
  url: "https://<api_identifier>.execute-api.<region>.amazonaws.com/<stage>/<resource>",
  dataType: 'json',
  // It's always good practice to define a timeout for our calls
  timeout: 5000,
  success: function(data) {
    // Generate a timestamp
    var timestamp = Date.now()
    // Display the response of the HTTP request
    responseContainer.html(`<pre>${timestamp}: ${JSON.stringify(data)}</pre>`);
  },
  error: function(error) {
    responseContainer.html(error);
  }
});
```

In [Terraform](https://www.terraform.io/) we will need to create the following resources:

- `"aws_api_gateway_rest_api" "mockapi"`
- `"aws_api_gateway_resource" "mockapi_resource"`
- `"aws_api_gateway_method" "mockapi_method"`
- `"aws_api_gateway_method_response" "mockapi_response_200"`
- `"aws_api_gateway_integration" "mockapi_integration"`
- `"aws_api_gateway_integration_response" "mockapi_integration_response"`
- `"aws_api_gateway_deployment" "mock_api"`
- `"random_pet" "suffix"`
- <i>These are resources to expose the OPTIONS endpoint</i>
- `"aws_api_gateway_integration" "_"`
- `"aws_api_gateway_integration_response" "_"`
- `"aws_api_gateway_method" "_"`
- `"aws_api_gateway_method_response" "_"`

I've commented the code so that you can get as much information as possible.

**Our `main.tf` will look as follows:**
```
provider "aws" {
  profile                 = var.aws_profile
  region                  = var.aws_region
  shared_credentials_file = var.credentials_path
}

/**
 * Suffix used to be appended to all resources names to make the setup unique
 */
resource "random_pet" "suffix" {
  length    = 2
  separator = "-"
}

/**
 * API: https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-api-endpoint-types.html
 */
resource "aws_api_gateway_rest_api" "mockapi" {
  name        = "${var.api_gateway_api_name}-${random_pet.suffix.id}"
  description = "Mock API"
}

/**
 * Resource we want to use. For this example it's the last part of the API 
 * endpoint structure we discussed above
 */
resource "aws_api_gateway_resource" "mockapi_resource" {
  rest_api_id = aws_api_gateway_rest_api.mockapi.id
  parent_id   = aws_api_gateway_rest_api.mockapi.root_resource_id
  path_part   = "mockapi"
}

/**
 * Request Method: https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-method-settings-method-request.html
 */
resource "aws_api_gateway_method" "mockapi_method" {
  rest_api_id   = aws_api_gateway_rest_api.mockapi.id
  resource_id   = aws_api_gateway_resource.mockapi_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

/**
 * Method Response: https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-set-up-method-using-console.html
 * The response to the method we defined above
 */
resource "aws_api_gateway_method_response" "mockapi_response_200" {
  rest_api_id = aws_api_gateway_rest_api.mockapi.id
  resource_id = aws_api_gateway_resource.mockapi_resource.id
  http_method = aws_api_gateway_method.mockapi_method.http_method
  status_code = 200

  /**
   * This is where the configuration for CORS enabling starts.
   * We need to enable those response parameters and in the 
   * integration response we will map those to actual values
   */
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers"     = true,
    "method.response.header.Access-Control-Allow-Methods"     = true,
    "method.response.header.Access-Control-Allow-Origin"      = true,
    "method.response.header.Access-Control-Allow-Credentials" = true
  }
}

/**
 * Integration: https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-integration-settings.html
 */
resource "aws_api_gateway_integration" "mockapi_integration" {
  rest_api_id = aws_api_gateway_rest_api.mockapi.id
  resource_id = aws_api_gateway_resource.mockapi_resource.id
  http_method = aws_api_gateway_method.mockapi_method.http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = jsonencode(
      {
        statusCode = 200
      }
    )
  }
}

/**
 * Integration Response: https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-integration-settings-integration-response.html
 */
resource "aws_api_gateway_integration_response" "mockapi_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.mockapi.id
  resource_id = aws_api_gateway_resource.mockapi_resource.id
  http_method = aws_api_gateway_method.mockapi_method.http_method
  status_code = aws_api_gateway_method_response.mockapi_response_200.status_code

  /**
   * This is second half of the CORS configuration.
   * Here we give values to each of the header parameters to ALLOW 
   * Cross-Origin requests from ALL hosts.
   **/
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers"     = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods"     = "'GET,OPTIONS,POST,PUT'",
    "method.response.header.Access-Control-Allow-Origin"      = "'*'",
    "method.response.header.Access-Control-Allow-Credentials" = "'true'"
  }

  response_templates = {
    "application/json" = <<EOF
{
  "statusCode": 200,
  "message": "OK! Everything in order"
}
EOF
  }
}

/**
 * Stage: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-stages.html
 */
resource "aws_api_gateway_deployment" "mock_api" {
  rest_api_id = aws_api_gateway_rest_api.mockapi.id
  stage_name  = "test"

  depends_on = [
    aws_api_gateway_method_response.mockapi_response_200,
    aws_api_gateway_integration_response.mockapi_integration_response
  ]
}

/**
 * This is an essential part of the fix. We need this module to create
 * the OPTION method on the same resource defined above. This is needed
 * for the preflighted requests.
 * 
 * We don't have to setup the headers on the OPTIONS response here because
 * the module will take care of it.
 * 
 * Source: https://github.com/squidfunk/terraform-aws-api-gateway-enable-cors
 */
module "cors" {
  source  = "squidfunk/api-gateway-enable-cors/aws"
  version = "0.3.1"

  api_id            = aws_api_gateway_rest_api.mockapi.id
  api_resource_id   = aws_api_gateway_resource.mockapi_resource.id
  allow_credentials = true
}
```

**Our `variables.tf`:**
```
variable "aws_profile" {
  default     = "default"
  description = "AWS profile you'd like to use. Default = default"
}

variable "aws_region" {
  default     = "eu-west-1"
  description = "AWS region you'd like to create resources in. Default = eu-west-1"
}

variable "credentials_path" {
  default     = "~/.aws/credentials"
  description = "AWS credentials path. Default = ~/.aws/credentials"
}

variable "api_gateway_api_name" {
  default     = "APIGatewayLab"
  description = "Name of the API"
}
```

**And finally our `output.tf` file:**
```
/**
 * We would want terraform to fetch our API's deployment URI
 * we will need it for our request!
 */
output "api_url" {
  value = aws_api_gateway_deployment.mock_api.invoke_url
}
```

Now you can go ahead and `apply` the stack above so that it can be created in AWS.

```
$: terraform apply
```

# Example

We've done all this work so that we can actually start calling our API successfully. I created a small JSFiddle for you so that you can play around with the concept if you need to: [https://jsfiddle.net/w17cy4kg/12/](https://jsfiddle.net/w17cy4kg/13/).

If you've implemented the stack successfully you should be able to replace the `apiUri` variable in the javascript code and get an output similar to this:

<img alt="Image showing a successful response from our API" src="{{ "/assets/img/2020/06/10/successfull_response.png" | relative_url }}" alt="{{ site.plainwhite.name }}">

That's it!

{% include disclaimer.html %}
