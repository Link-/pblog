---
layout: post
title:  "Rethinking Technical Meetings: Beyond Slide Decks"
tldr: "Technical meetings that are driven by slide decks are bound to be complete disasters, here is a better alternative!"
date: 2024-03-08 11:00:59 +0100
categories: tech meetings productivity software-engineering management system-design 
image: /assets/img/og_assets/2024-03-08-rethinking-technical-meetings-beyond-slide-decks.png
sitemap:
    lastmod: 2024-03-08
    priority: 0.7
    changefreq: 'monthly'
---

Technical meetings that are driven by slide decks are bound to be complete disasters, and the reasons for that are many.

<iframe width="560" height="315" src="https://www.youtube.com/embed/LKoZuIcWdvA?si=JHj8XWR4JLeW3vRp" title="I h@te slide decks ❌" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

> You can also watch this blog post as a video

### Slide decks encourage lazy communication

Many fall into the trap of reading directly from their slides, neglecting to engage with the audience through meaningful dialogue. Effective meetings should foster active discussions rather than passive listening.

### No discussions

The structured nature of slide decks can stifle conversation until the presentation's end. This format can cause attendees to disengage, waiting for the moment they can contribute their thoughts and feedback.

### A better approach

Draft a design document where you put in all your ideas, your thoughts, the nuances, the context, the history, the diagrams, whatever you want to share with your audience and give everyone access to this design document 24 to 48 hours prior to that and ask for comments.

This method ensures that meeting time is dedicated to debating contentious points, addressing disagreements, and forging a path forward.

#### Crafting an effective design document

The effectiveness of a design document lies in its structure and conciseness.

Consider including:

1. **An Executive Summary:** Place a succinct overview or TL;DR at the beginning.
2. **Context and History:** Explain the backstory and rationale for the discussion.
3. **Survey of Existing Solutions:** Present what solutions are currently available before introducing your own.
4. **Your Proposed Design:** Offer a high-level design with diagrams for clarity. Discuss open questions, potential risks, and various considerations.
5. **Implementation Plan:** Outline how to enact the proposed design, highlighting any risks.
6. **Conclusions and Actionable Steps:** Conclude with a summary and clear next steps.
7. **References:** List essential pre-reading or materials for a fuller understanding.

This strategy is not just for problem-solving or design meetings but can adapt to operational, support, or other discussions.

### Cancel unnecessary meetings

Let documentation drive your discussions, and if consensus is reached through the document alone, **cancel the meeting.**

### Here is the design document template in markdown

```markdown
# Title

## TLDR

A few short sentences that summarize the entire document. Use active voice and avoid using too much jargon. Keep it simple and straightforward.

## Definitions and Acronyms

Define all the technical terms you use. This will make sure everyone is speaking the same language. Don't go overboard with the definitions. Be reasonable.

| Item | Definition                        |
| ---- | --------------------------------- |
| API  | Application Programming Interface |
| ...  | ...                               |

## Context and History

### What We Have Today

Describe your current setup. Use visual aids when possible.

### What's Changing

Describe what's changing and why.

## Design

### A Survey of Existing Solutions

Discuss existing solutions. Include references to prior art, internal or external.

### Problem Constraints

Define the boundaries of the problem you're dealing with. What, how, why. I've discussed this at length in my [The Art of System Design video](https://youtu.be/3IWpU72eixw?si=nfVCZ5qAnAkPys8P).

### What We're Introducing

Describe what you're planning to implement. Use visual aids when necessary.

### What We Explored and Dismissed

Discuss what you've explored, trade-offs that were made, and why these candidate solutions were dismissed.

### Risks

- What are the risks associated with this implementation?
- Why are they risks?
- What are you going to do about them?

### Implementation Plan

- How are you going to implement your proposed design?
- How long will it take?
- What are the phases and steps?

## References

Include all the references you used in your document.
```
