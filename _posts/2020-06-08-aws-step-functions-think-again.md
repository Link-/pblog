---
layout: post
title:  "Planning on using AWS Step Functions? Think again"
date:   2020-06-08 18:00:00 +0200
categories: aws architecture microservices patterns
image: /assets/img/2020/06/08/header_image_1280.png
sitemap:
  lastmod: 2020-06-08
  priority: 0.7
  changefreq: 'weekly'
---

You're using [AWS](https://aws.amazon.com/) and your entire or part of your landscape depends on it. You're contemplating [AWS Step Functions](https://aws.amazon.com/step-functions/) for a workflow you need to build or maybe you're just curious and just want to explore this product. Carry on, I have some interesting insights that you will not find in the documentation right away.

> TLDR; Step Functions is a great product for a specific set of use cases.

## Let's break it down a little 🤓

Step Functions are state machines (if you're not familiar with the term, that's ok). With Step Functions you define a **workflow** which is a list of **states**. You **transition** from one state to the other based on some input or condition until you reach the end of the **workflow**.

Here's a simple animated example:

<img src="{{ "/assets/img/2020/06/08/step_functions_demo.gif" | relative_url }}" alt="{{ site.plainwhite.name }}">

This is a demo of the approval workflow (discussed below). As you can see, the state machine starts with the Lambda: "Process Order" then transitions to the Task "Request Approval". Following that, the Task "Request Approval" transitions to either the "Success" or "Failure" tasks.

To make the example more concrete, let's think of this from a systems scenario. "Process Order" will receive an input, this will invoke a Lambda function which represents the integration with a back-end system, for example, think of an invoicing service you are running. When the response from the invoicing system comes (success or failure) the lambda will end its execution and the state machine will receive the output of that lambda. 

The state machine will then automatically transition to "Request Approval". This step will, for example, push a message to a queue (SQS) and sleep. The sleep is by design, as the state machine cannot move forward until that message in the queue is processed. This time, it's not a Lambda that will provide the bridge with your back-end systems, it's [SQS](https://aws.amazon.com/sqs/). Let's imagine you have an order processing portal which is connected to the same queue the state machine is. This system will continously pull messages from the queue and present them in a UI for a human to process.

Once that order is confirmed in the order processing portal a signal will be sent directly to the state machine with the result of the decision. Step Functions will then, based on the signal received, transition to either a "Success" or a "Failure" state. These could be other AWS services, like SNS which can send a pre-formatted email to some users, or a lambda which will call a REST API to your data persistence service to store order meta-data in your data store. The possibilities are endless.

### Types of Workflows

There are 2 types of workflows supported: **Standard Workflows** and **Express Workflows**. The latter is designed for high-volume event processing workflows. With this service you pay by transition so it's important to also have workflows that are cost effective when dealing with high-event-rate workloads.

I really like many of AWSs' documentation, so read more about the types of workflows, and more, here: [https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html](https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html)

## Use Cases: (Good | Bad)

By now, I'm sure you're impressed by the possibilities of this service and you're not wrong. I was too. However, it always felt like this service is still not mature enough even though it's a few years old. I've spent the last year and a half designing a high workload orchestration layer as the back-end for a mobile application using Step Functions. During this period I have accumulated a lot of insights into what works well and what doesn't. 

I believe the best way to communicate the subtleties of the good and the bad with this service is through use cases. So below, I describe 5 generic uses cases that cover a broad range of Step Functions' features and I label them as Good ☀️or Bad 🌧or Good but ⛅️ based on whether I believe Step Functions is the appropriate tool for the job.

### 1. Scheduled Job (Good ☀️)

This is the simplest of the uses cases. Let's assume you have a system running maybe on [EC2](https://aws.amazon.com/ec2/) and you'd like to take backups every 12 hours. You don't have a backup management system and you'd like some way to orchestrate the steps needed to generate a backup and store it in a low cost storage system or service.

You look at AWS Step Functions and think: "Awesome, this service can help you achieve that". You can have a state machine, created with a Lambda, calling an API of your system to generate a backup. Then you'd like your workflow to check if the backup was successfull or not and wait a certain amount of time before you, for example, send an email to a group notifiying them of the backup's outcome. Using [CloudWatch](https://aws.amazon.com/cloudwatch/) events you can schedule that state machine to run every 12 hours.

The workflow will look something like this:

> <img src="{{ "/assets/img/2020/06/08/FB8FAAE9-EA32-413B-B191-5381SSS1D38B8.png" | relative_url }}" alt="{{ site.plainwhite.name }}">

> I built a simulation of this workflow for you with [Terraform](https://www.terraform.io/). You can build it in your AWS account yourself by following my guide here: [Backup Workflow Setup Guide](https://github.com/Link-/stepfunctions_lab/tree/master/src/workflows/backup_workflow). I highly recommend that you build this stack and explore all its different components (Step Functions, Lambda, IAM and CloudWatch).

**Pros:** ☀️
1. Your input is limited to information about the backup process
2. Everything the Lambda needs can be passed with environment variables and it has the capacity to call external systems in many different ways
3. CloudWatch will guarantee that your workflow runs on schedule
4. The number of transitions is small so you don't have to worry about costs
5. The visual aspect of Step Functions makes it appealing as a starting point to troubleshooting failed workflows
6. The solution is relatively easy to build and doesn't require maintenance

**Cons:** 🌑
1. Lambdas can run for a maximum of 15 minutes. I'm pretty sure few bakcup jobs take less than 15 minutes and either way this doesn't really scale well and could be a potential problem down the line.
2. You pay for the execution time of your Lambda functions. Meaning, if your backup job takes a long time you will have to think better about your costs.

Consider not using Step Functions for backup jobs specifically in a synchronous scenario because of the Lambda timeout restrictions. In general, Step Functions are good for scheduled jobs but not necessarily backups.

Let's move on to more complex scenarios.

### 2. Generate A Pdf Invoice Following An Order And Store It In S3 (Good ☀️)

This is a cool use case. I like the scenarios where you can fire a workflow and forget about it with little consequences. This is definitely one of them. This workflow is very similar to the scheduled job and will most likely adopt a similar setup with the exception that the trigger (start execution) of this workflow will come from another event.

There are many ways to setup the triggering event and here I name a few:
1. Use [AWS API Gateway](https://aws.amazon.com/api-gateway/) to expose an endpoint that will create a new state machine execution
2. Use [AWS EventBridge](https://aws.amazon.com/eventbridge/) a new service launched in 2019 with the sole purpose of managing events and integrations between systems.
3. Of course CloudWatch remains a viable option for this use case as well.

**Pros:** ☀️
1. This is not a business critial use case so the consequences of a failed workflow execution are not catastrophic.
2. If the invoice requires input from multiple systems and if the output of one system is the input for another, this is an examplary scenario for Step Functions!
    - You will have one Lambda extract information from system A and push the output to another Lambda which will in turn pass it on to system B.
3. Integration with other AWS services is simple and more so if you want to use S3 buckets.
4. You can design your workflow to gracefully recover from failure with conditions and exception handling.
5. The whole setup is cheap and very cost effective.
6. Changes to the workflow are not a concern, so versioning is not a problem here, because you have no direct interaction with end users. You can treat this as a complete black box.

**Cons:** 🌑
1. You still have to put effort in setting up a monitoring solution for your workflows (if you don't have anything in place already).
2. (This is a point that will repeat across use-cases) You need to make sure your back-end systems are integration friendly. And what I mean by that is they have robust APIs you can rely on for the integration with Lambdas.

### 3. Process An Order Following A Manager'S Approval (Good but ⛅️)

Now comes the most complex part of this post. Building an event driven workflow and implementing signaling or as AWS refers to them as [callbacks](https://aws.amazon.com/about-aws/whats-new/2019/05/aws-step-functions-support-callback-patterns/). I have had the unfortunate (depends on how you look at it) reponsibility to design a mobile on-boarding orchestration layer using Step Functions before callbacks were released sometime mid-2019.

That was a complete nightmare. I cannot go into the details of that implementation for confidentiality reasons but what I can do is show you how to implement an approval workflow with Step Functions and discuss the solution in enough detail for you to judge.

Let's dig in.

<a href="https://github.com/Link-/stepfunctions_lab/tree/master/src/workflows/approval_workflow" target="_blank"><img src="{{ "/assets/img/2020/06/08/sfn_approval_workflow_architecture.png" | relative_url }}" alt="{{ site.plainwhite.name }}"></a>

The scenario is as follows: you receive an purchasing order from your front-end (website, mobile app, etc.) and before you push that order to your back-end system for delivery (or invoicing, notifications etc.) you want to receive the approval from a human. Again, this is merely a simulation to demonstrate the features of Step Functions.

This workflow is made of 5 main components:

1. [AWS API Gateway](https://aws.amazon.com/api-gateway/)
2. [AWS Step Functions](https://aws.amazon.com/step-functions/) state machine
3. [AWS Lambda Function](https://aws.amazon.com/lambda/)
4. [AWS SQS](https://aws.amazon.com/sqs/)
5. An order processing web app (running locally on your machine)

The data flows like this:

1. Using the [AWS API Gateway](https://aws.amazon.com/api-gateway/) we create an endpoint that will receive an HTTP POST request on the endpoint `https://<whatever_url_we_configure>/test/order`
2. The API endpoint will start the step functions workflow execution simulating a new order in the system
3. The starting point of the workflow / state machine is a Lambda Function that will simulate an order being processed by some back-end system
4. The state machine then transitions to a task that will push a message to SQS with a `TaskToken` and will **pause while it waits to receive a success or fail callback**
5. SQS will receive the message and push it to a queue of our choice
6. Our local Express controller app will expose a few endpoints and when it receives an HTTP GET request to `http://localhost:<port>/pending` it will pull a message from SQS for processing
7. Upon calling the locally exposed endpoint `http://localhost:<port>/approval` our app, using the AWS SDK will call the `SendTaskSuccess` ordering our state machine to successfully transition to the next step
8. Finally we will delete that message from the queue and based on the callback received by the state machine will move to Success (we are not handling a failure scenario)

<a href="https://github.com/Link-/stepfunctions_lab/tree/master/src/workflows/approval_workflow" target="_blank"><img src="{{ "/assets/img/2020/06/08/approval_workflow_controller_app_screenshot.png" | relative_url }}" alt="{{ site.plainwhite.name }}"></a>

> I built this workflow for you with [Terraform](https://www.terraform.io/). You can build it in your AWS account yourself by following my guide here: [Approval Workflow Setup Guide](https://github.com/Link-/stepfunctions_lab/tree/master/src/workflows/approval_workflow). I highly recommend that you build this stack and explore all its different components (Step Functions, Lambda, IAM and CloudWatch).

Simple, eh?

**Pros:** ☀️
1. Cost of this whole setup is miniscule. Why?
    - You will be charged $0.40 per 1 million requests to the queue (SQS): [Reference](https://aws.amazon.com/sqs/pricing/)
    - You will be charged $0.025 per 1,000 state transitions for Step Functions: [Reference](https://aws.amazon.com/step-functions/pricing/)
    - You will be charged $1.11 for the first 300 million API calls for the API Gateway and $1.00 for 300+ million per month: [Reference](https://aws.amazon.com/api-gateway/pricing/)
    - Costing for Lambdas is a big more complex but in short, $0.20 for 1 million requests and $0.0000166667 for every GB-second: [Reference](https://aws.amazon.com/lambda/pricing/)
2. You don't have to worry about scaling up, that's the big promise of serverless architectures.
3. Step Functinons can integrate with a large number of AWS Services including but not limited to: Lambda, AWS Batch, Dynamo DB, ECS, Fargate, SNS, SQS, Glue, SageMaker, EMR, CodeBuild: [Reference](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-service-integrations.html)
4. Infrastructure is relatively easy to setup and deploy especially with tools like [CloudFormation](https://aws.amazon.com/cloudformation/) or [Terraform](https://www.terraform.io/).

**Cons:** 🌑
1. This setup is very difficult to maintain! Think of your CI/CD pipelines for this, how will they take form?
2. Versioning is extremely complex! What happens when you want to introduce a change but also be backward compatible? Imagine having to maintain multiple workflow versions, handle routing, logging.
3. With async workflows, managing state is expensive. You really have to think of your negative flows and what happens when your queue goes down. In short, your workflow will go stale. You need to identify and build measures to cleanup failed workflows.
4. Forget transactionality unless you're willing to invest a substantial effort in guaranteeing rollbacks on failure.
5. Does your team have the skills to build and maintain the setup?
6. How do you make the setup redundant? How would you handle high availability? The issue with serverless is that you're only relying on AWS' promise to maintain a high uptime but in the case of critical / high-volume workflows will that be sufficient for you?
7. Vendor lock-in. You're stuck with AWS now. This is generally a weak point simply because any substantially complex / large system or setup puts you in the same position no matter the vendor. Still, it's important to keep this in mind.

If you've already made the decision and investment to go serverless and if the above cons are not a concern for you, then by all means, Step Functions is a powerful service to add to your infrastructure. The possibilities are endless. However, in my opinion and experience, Step Functions is still a **maturing** product. I wouldn't say it is a 100% replacement of existing [BPM](https://en.wikipedia.org/wiki/Business_process_management) solutions and far from being a headache-less solution.

### 4. Mobile back-end (Bad 🌧)

Have you digested the complexity associated with use case #3? Now imagine that complexity **multiplied by an order of magnitude (at least)** when we start talking about building mobile back-ends using step functions.

Building mobile application back-ends is difficult enough as it is, with step functions you want to consider the following:

1. Does your team have adequate knowledge and skills to take on the challenge?
2. How will you manage API versioning? What happens when you decide to add a step in your workflow but don't want to force your existing users to update their mobile app?
3. Do your back-end systems have robust APIs you can easily integrate with? The core components of your workflows will be Lambdas or Activity workers (in a mobile back-end context). For these to do their job they will need to integrate with domain specific systems (invoicing system, customer relation management system, core banking system, etc...).
4. Do your back-end systems support rollbacks in case of failure? Remember the point about transactionality. This type of (generally async) workflows cannot support transactions, so you need to design a cleanup process that allows you to recover from failure. You don't want your end-users to be stuck in a non-recoverable state. Because then you'll have to scramble to manually adjust the situation.
5. You cannot "pause" a workflow and then resume it later. Well, you can with some workarounds but it's not a feature that comes off-the-shelf with Step Functions.
6. You cannot start a workflow from the middle. Meaning, you cannot "skip" tasks unless you write your lambdas and activity workers to handle a skip trigger.

There are many more things to consider when deciding to go for Step Functions, many of those things are dependent on your specific use case, your landscape, your budget and many more variables. However, I hope the above gave you some pointers or ideas of questions to answer before you take the leap of faith and rush into embracing the serverless trend.

## Learn Step Functions

Whether you're going to adopt this service or not, it's still worth learning about and building a few workflows. Nothing beats a good-old hands-on hacking. 

Here are some resources I recommend you take a look at:

1. [AWS Developer Guide](https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html): This is really a fantastic resource, as usual AWS have solid documentation. I learned everything about step functions from this guide.
2. [Reference Architectures](https://aws.amazon.com/step-functions/resources/?step-functions.sort-by=item.additionalFields.postDateTime&step-functions.sort-order=desc): Same URL as above but jump to the relevant section. AWS have a few solid implementations you can learn and draw inspiration from, namely:
    - [https://github.com/aws-samples/lambda-refarch-imagerecognition](https://github.com/aws-samples/lambda-refarch-imagerecognition)
    - [https://github.com/aws-samples/aws-step-functions-long-lived-transactions](https://github.com/aws-samples/aws-step-functions-long-lived-transactions)
    - [https://github.com/aws-samples/sync-buckets-state-machine](https://github.com/aws-samples/sync-buckets-state-machine)
3. [ReInvent Videos](https://awsstash.com/?search=%22step+functions%22&level=%5B%22300%22%5D&year=%5B%222019%22%5D): No resource list will be complete without some ReInvent videos. These are usually my go-to references to learn anything AWS but unfortunately in this case there aren't that many (recent) videos that discuss step functions in a deep dive format. Still, feel free to look around for something that suits you.
4. [Step Functions Lab](https://github.com/Link-/stepfunctions_lab): Lastly, of course, my lab on step functions. I built it with detailed instructions so that you can start right away. You don't need to learn Terraform or Node.js (if you do, that's a big +) to get going, you just need to have the pre-requisites installed and you'll be good to go!

## Final thoughts

I personally hate technical fanaticism, we all know that there isn't a single product / tool / service in the market that answers all your needs or is a silver bullet to any problem. Keep an open mind and I hope this guide helps you get some clarity on this service and what it is **currently** best suited for. I hope down the road AWS keep upgrading this service because it is useful for many use cases and a joy to work with. Sometimes.

> ❤️to [Ali Haydar](https://twitter.com/Alee_Haydar), [Jessica Ajami](https://twitter.com/JessieAjami) and [Abed Al Rahman El Ghali](https://www.linkedin.com/in/abed-al-rahman-el-ghali-86883520/) for reading drafts of this post


{% include disclaimer.html %}
