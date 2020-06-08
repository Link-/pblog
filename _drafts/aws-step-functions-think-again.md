---
layout: post
title:  "Planning on using AWS Step Functions? Think again"
date:   2020-06-03 18:00:00 +0200
categories: aws architecture microservices patterns
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

This is a demo of the approval workflow (discussed below). As you can see the state machine starts with the Lambda: Process Order then transitions to the Task: Request Approval. Following that, the Task: Request Approval transitions to either the Success or Failure tasks.

To make the example more concrete, let's think of this from a systems scenario. Process Order will receive an input, this will invoke a Lambda function which represents the integration with a back-end system, for an example, think of an invoicing service you are running. When the response from the invoicing system comes (success or failure) the lambda will end its execution and the state machine will receive the output of that lambda. 

The state machine will then automatically transition to Request Approval. This step will, for example, push a message to a queue (SQS) and sleep. The sleep is by design, as the state machine cannot move forward until that message in the queue is processed. This time, it's not a Lambda that will provide the bridge with your back-end systems, it's [SQS](https://aws.amazon.com/sqs/). Let's imagine you have an order processing portal which is connected to the same queue the state machine is. This system will continously pull messages from the queue and present them in a UI for a human to process. 

Once that order is confirmed in the order processing portal a signal will be sent directly to the state machine with the result of the decision. Step Functions will then, based on the signal received, transition to either a Success or a Failure state. These could be other AWS services, like SNS which can send a pre-formatted email to some users, or a lambda which will call a REST API to your data persistence service to store order meta-data in your data store. The possibilities are endless.

### Types of Workflows

There are 2 types of workflows supported: **Standard Workflows** and **Express Workflows**. The latter is designed for high-volume event processing workflows. With this service you pay by transition so it's important to also have workflows that are cost effective when dealing with high-event-rate workloads.

I really like many of AWSs' documentation, so read more about the types of workflows and more here: [https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html](https://docs.aws.amazon.com/step-functions/latest/dg/welcome.html)

## Use Cases: (Good | Bad)

By now, I'm sure you're impressed by the possibilities of this service and you're not wrong. I was too. However, it always felt like this service is still not mature enough even though it's a few years old. I've spent the last year and a half designing a high workload orchestration layer as the backend for a mobile application using Step Functions. During this period I have accumulated a lot of insights into what works well and what doesn't. 

I believe the best way to communicate the subtleties of the good and the bad with this service is through use cases. So below, I describe 5 generic uses cases that cover a broad range of Step Functions' features and I label them as Good 👍or Bad 👎 based on whether I believe Step Functions is the appropriate tool for the job.

### 1. Nightly | Weekly | Monthly Etc. Backup Job (Good 👍)

This is the simplest of the uses cases. Let's assume you have a system running maybe on [EC2](https://aws.amazon.com/ec2/) and you'd like to take backups every 12 hours. You don't have a backup management system and you'd like some way to orchestrate the steps needed to generate a backup and store it in a low cost storage system or service.

You look at AWS Step Functions and think that, awesome, this service can help you achieve that. You can have a state machine created with a Lambda calling an API of your system to generate a backup. Then you'd like your workflow to check if the backup was successfull or not and wait a certain amount of time before you, for example, send an email to a group notifiying them of the backup's outcome. Using [CloudWatch](https://aws.amazon.com/cloudwatch/) events you can schedule that state machine to run every 12 hours.

The workflow will look something like this:

<img src="{{ "/assets/img/2020/06/08/FB8FAAE9-EA32-413B-B191-5381SSS1D38B8.png" | relative_url }}" alt="{{ site.plainwhite.name }}">

I built a simulation of this workflow for you with [Terraform](https://www.terraform.io/). You can build it in your AWS account yourself by following my guide here: [Backup Workflow Setup Guide](https://github.com/Link-/stepfunctions_lab/tree/master/src/workflows/backup_workflow). I highly recommend that you build this stack and explore all its different components (Step Functions, Lambda, IAM and CloudWatch).

To make it short, this is a good use case for Step Functions:
1. Your input is limited to information about the backup process
2. Everything the Lambda needs can be passed with environment variables and it has the capacity to call external systems in many different ways
3. CloudWatch will guarantee that your workflow runs on schedule
4. The number of transitions is small so you don't have to worry about costs
5. The visual aspect of Step Functions makes it appealing as a starting point to troubleshooting failed workflows
6. The solution is relatively easy to build and doesn't require maintenance

There is are a couple of caveats for you to take into consideration:
1. Lambdas can run for a maximum of 15 minutes. I'm pretty sure few bakcup jobs take less than 15 minutes and either way this doesn't really scale well and could be a potential problem down the line.
2. You pay for the execution time of your Lambda functions. Meaning, if your backup job takes a long time you will have to think better about your costs.

Let's move on to more complex scenarios.

### 2. Generate A Pdf Invoice Following An Order And Store It In S3 (Good 👍)

> Describe the use case and why it is good

### 3. Transactional Order Across Multiple Back-End Systems (Good 👍)

> Descibe the use case

Reference: https://github.com/aws-samples/aws-step-functions-long-lived-transactions

### 4. Process An Order Following A Manager'S Approval (Good 👍but!)

This is where things become more complex, but not necessarily the bad type. 

### 5. Orchestrate Mobile User On-Boarding (Bad 👎)

> Describe the use case

## Learn Step Functions

> Talk about the step functions lab and how to use it [stepfunctions_lab](https://github.com/Link-/stepfunctions_lab)

## Final thoughts

> TBD

### References

- [AWS Step functions resources](https://aws.amazon.com/step-functions/resources/?step-functions.sort-by=item.additionalFields.postDateTime&step-functions.sort-order=desc)

{% include disclaimer.html %}
