---
layout: post
title: "Adopting the command design pattern for GitHub Actions"
date: 2021-03-30 20:00:00 +0200
categories: github actions design-patterns command best-practices
sitemap:
  lastmod: 2021-03-30
  priority: 0.7
  changefreq: "weekly"
---

You've explored [GitHub Actions](https://docs.github.com/en/actions) for a while, and you're now ready to create your own action and publish it to the marketplace. That's brilliant, before you do that, let's discuss adopting a simple design pattern that will make your creative journey much easier!

## Folder structure of an action

A simple Node.js action would look like this:

```sh
  ./simple-action/
  ├── LICENSE
  ├── README.md
  ├── action.yml
  ├── dist
  │   └── index.js
  ├── index.js
  ├── package-lock.json
  └── package.json
```

`index.js` is where all the logic is encapsulated and [`action.yml`](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action#creating-an-action-metadata-file) is used to contain the action's metadata as well defining its interface (inputs and outputs).

A lot of actions on the marketplace adopt this very simple structure, and it's great! However, not all actions are this simple.

With actions doing more complex things testability and maintainability become really difficult with this approach. Why?

1. Testing a change requires that you commit and push your changes upstream, then trigger a workflow run under the conditions your action is expecting. This is very time-consuming.

1. Updating the interface can become a challenge especially when you want to maintain backward compatibility.

You might say: hey! [act](https://github.com/nektos/act) is a wonderful project that allows you to run and test actions on your machine. Yes, but its only problem is that during the initial iterations you want to test fast and fail quickly. You might also want to write some unit (integration?) tests.

## The command pattern

Command pattern to the rescue. In short, this is a behavioral design pattern that allows you to encapsulate all the information about the task in a single object which can then be invoked by certain triggers.

I'm definitely not going to do a better job at explaining this concept more than: <https://refactoring.guru/design-patterns/command>

### Unified command interface

<img alt="command pattern class diagram" src="{{ "/assets/img/2021/03/30/command-pattern.png" | relative_url }}">
> There's a better looking class diagram here: <https://refactoring.guru/design-patterns/command#pseudocode>

What the class diagram above is trying to explain is:

1. `cli` will create an instance of `Invoker`
1. `Invoker` will load all the classes that implement the `Command` interface
1. `Invoker` will create instances of `GetComments` and `GetIssueDetails` classes
1. `Invoker` will store the instances in `commandsList`
1. `cli` will then call `executeCommand()` and pass the arguments (inputs) it received
1. `Invoker` will call `execute()` on the command matching the passed arguments from `cli` and return the result from the `Command` implementation invoked

`cli` is never aware which commands are called. It doesn't even need to be aware of inner workings of any command. `cli` will always have a single interface that it needs to be aware of.

The logic of instantiating and invoking commands is all encapsulated in 1 place, the `Invoker` object.

You can add an unlimited number of commands. As long as they implement the `Command` interface the `Invoker` will make sure they are loaded and instantiated to be used by any client.

### Let's implement this

```sh
simple-action/
├── LICENSE
├── README.md
├── action.yml
├── dist
│   └── cli.js
├── package-lock.json
├── package.json
└── src
    ├── cli.js
    ├── commands
    │   ├── getComments.js
    │   ├── getIssueDetails.js
    │   └── index.js
    ├── interfaces
    │   └── command.js
    └── invoker.js
```

Our folder structure should now look like 👆. Let's look at the source code:

#### command.js

```javascript
// TBD
```

#### cli.js

```javascript
// TBD
```

#### invoker.js

```javascript
// TBD
```

#### getComments.js

```javascript
// TBD
```

#### getIssueDetails.js

```javascript
// TBD
```
