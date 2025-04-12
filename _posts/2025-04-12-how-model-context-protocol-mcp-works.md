---
layout: post
title:  "How Model Context Protocol (MCP) Works"
tldr: "Breakdown of the Model Context Protocol (MCP) that enables AI applications to communicate with external data sources and tools through a client-server architecture."
date: 2025-04-12 21:49:57 +0200
categories: mcp model-context-protocol programming llm ai
image: tbd
render_mermaid: true
sitemap:
    lastmod: 2025-04-12
    priority: 0.7
    changefreq: 'monthly'
---

The Model Context Protocol (MCP) enables seamless communication between AI applications (clients) and external data sources or tools (servers). Here's a simple sequence diagram showing how MCP servers work:

## MCP Client - Server Interactions

```mermaid
sequenceDiagram
  participant User as User
  participant Host as VScode / Claude / ChatGPT Desktop
  participant Client as MCP Client
  participant Server as MCP Server
  participant Resource as External Service
  User ->> Host: Open application
  Host ->> Client: Initialize client
  Client ->> Server: initialize request with capabilities
  Server ->> Client: initialize response with capabilities
  Client ->> Server: initialized notification
  User ->> Host: Make a request
  Host ->> Client: Forward request
  alt Resource Request (Application-controlled)
    Note right of Client: A Resource is context data from the server<br/>Examples: file contents, code history, database schemas<br/>Resources help LLMs understand context
    Client ->> Server: resources/list or resources/read
    Server ->> Resource: Fetch data (e.g., read files, query DB)
    Resource ->> Server: Return data
    Server ->> Client: Resource content
    Client ->> Host: Add context to LLM prompt
  else Tool Execution (Model-controlled)
    Note right of Client: A Tool is a function the LLM can call<br/>Examples: web search, file writing, API calls<br/>Tools let LLMs take actions
    Client ->> Server: tools/call
    Server ->> Resource: Execute operation
    Resource ->> Server: Return result
    Server ->> Client: Tool result
    Client ->> Host: Show result to LLM
  else Sampling Request (Server-initiated)
    Note right of Server: Sampling lets servers request LLM generations<br/>Examples: analyzing data, making decisions<br/>Enables agentic/recursive workflows
    Server ->> Client: sampling/createMessage
    Client ->> Host: Request LLM generation
    Host ->> User: Request approval (optional)
    User ->> Host: Approve request
    Host ->> Client: Return generation
    Client ->> Server: Generation result
  end
  Client ->> Host: Return response
  Host ->> User: Display result
  User ->> Host: Close application
  Host ->> Client: Terminate
  Client ->> Server: Disconnect

```

## Why MCP Servers Are Needed

MCP servers are essential components in the Model Context Protocol architecture for several important reasons:

## Separation of Concerns

The client-server architecture in MCP follows a key design principle: separation of concerns.

```mermaid
graph TD
    subgraph "Host Application"
        Host[Host Process]
        Client1[MCP Client 1]
        Client2[MCP Client 2]
        Client3[MCP Client 3]
        Host --> Client1
        Host --> Client2
        Host --> Client3
    end

    subgraph "External Processes"
        Server1[MCP Server 1<br>Files & Git]
        Server2[MCP Server 2<br>Database]
        Server3[MCP Server 3<br>External APIs]
    end

    Client1 <--> Server1
    Client2 <--> Server2
    Client3 <--> Server3
```

Why Not Have the Client Do Everything?

1. **Security Boundaries**:
   - Servers maintain security isolation between different systems
   - Each server has limited access to only what it needs
   - The client doesn't need credentials for every possible system

2. **Simplicity and Maintainability**:
   - Each server can focus on one specific domain (files, databases, etc.)
   - Easier to build, test, and maintain focused servers
   - Modular approach allows servers to be developed independently

3. **Domain Specialization**:
   - Servers can be built by domain experts (database specialists, etc.)
   - Each server can implement specialized functionality for its domain
   - Optimized implementations for different use cases

4. **Distribution and Scaling**:
   - Servers can run locally or remotely, wherever makes most sense
   - Some servers might run close to data sources for performance
   - Allows scaling different components independently

5. **Adaptability**:
   - New servers can be added without changing client implementation
   - Existing servers can be improved independently
   - Encourages ecosystem growth and specialization

6. **User Control**:
   - Users can choose which servers to connect to
   - Different security policies can be applied to different servers
   - Enables granular permission management

## My short explanation of the sequence diagram

<blockquote class="tiktok-embed" cite="https://www.tiktok.com/@glich.stream/video/7492477119877041430" data-video-id="7492477119877041430" style="max-width: 605px;min-width: 325px;" > <section> <a target="_blank" title="@glich.stream" href="https://www.tiktok.com/@glich.stream?refer=embed">@glich.stream</a> How MCP clients&#47;servers work. This is a sequence diagram breaking down the types of exchanges that occur between an mcp client, server and external service allowing the large language models to control the behaviour of that service or fetch &#47; store information from it</section> </blockquote> <script async src="https://www.tiktok.com/embed.js"></script>
