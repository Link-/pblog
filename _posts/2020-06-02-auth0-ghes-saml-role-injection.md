---
layout: post
title: "Auth0 Roles Management for GitHub Enterprise Server"
tldr: "Use Auth0 rules to manage SAML assertion mapping"
date: 2020-06-02 10:00:00 +0200
categories: ghes saml enterprise auth0
image: /assets/img/og_assets/2020-06-02-auth0-ghes-saml-role-injection.png
sitemap:
  lastmod: 2020-06-02
  priority: 0.7
  changefreq: "weekly"
---

The other day, I was working on enabling SAML on my test [GitHub Enterprise Server](https://github.com/enterprise) (GHES) instance using [Auth0](https://auth0.com/) (one of many identity platforms out there). I wanted to create an administrators group so its members are automatically escalated to **site administrators** as soon as they authenticate with the SSO url.

This wasn't straight forward, so here's the outline of the steps you need to take in order to achieve that.

### What is SAML?

SAML is quite popular in the enterprise world. It's basically an open standard for exchanging encrypted authentication and authorization data between an identity provider (IdP) and a service provider (Sp). The most important feature is the fact that it addresses web-browser single sign-on (SSO). I'm not going to go deeper into discussing the details, here are some references to learn more about it:

- [Wikipedia](https://en.wikipedia.org/wiki/Security_Assertion_Markup_Language)
- <i class="icon-youtube"></i>[SAML Overview by F5 DevCenter](https://www.youtube.com/watch?v=i8wFExDSZv0)

### Setup

This guide assumes that you've already created an Auth0 account and you have an instance ready to go. The region of the instance does not matter much. You can [sign-up here](https://auth0.com/signup?&signUpData=%7B%22category%22%3A%22button%22%7D&email=undefined).

1. Create a new `Application` and enable `SAML 2.0` addon in the `Addons` section by following [this guide](https://auth0.com/docs/protocols/saml/saml-apps/github-server)

    ```json
    # Same configuration as provided in the reference in step #1
    {
      "audience": "https://<GITHUB_ENTERPRISE_SERVER_HOSTNAME_OR_IP>",
      "mappings": {
        "user_id": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
        "email": "emails",
        "name": "full_name"
      },
      "passthroughClaimsWithNoMapping": false,
      "mapIdentities": false,
      "signatureAlgorithm": "rsa-sha256",
      "digestAlgorithm": "sha256",
      "nameIdentifierProbes": [
        "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
      ]
    }
    ```

    <img src="{{ "/assets/img/2020/06/02/ghes_local_auth0_app.jpg" | relative_url }}">

1. Create a new test user in `User Management > Users` with the following attributes (you can change those to whatever you'd like):

    ```text
    Username: Thanos
    Password: strong-secure-password
    Email: thanos@github.local
    ```

1. Create new roles (or just one) and make sure that one of those roles is: `Administrators`

1. Assign the `Administrators` role to the user we just created in step #2

    <img src="{{ "/assets/img/2020/06/02/ghes_auth0_admin_role.jpg" | relative_url }}">

Now, by default Auth0 does not map all the user attributes to the SAML assertions. In order to solve this problem and provide the `administrator` flag required by GHES ([read more about it here](https://help.github.com/en/enterprise/2.16/admin/user-management/using-saml#saml-attributes)) we need to intercept the authorization response before it goes back to GHES and inject that attribute.

For this, we use [Auth0 Rules](https://auth0.com/docs/rules).

1. Create a new rule to check if the role `Administrators` is included in the `roles` array and add that to the SAML mappings
   - Create a new rule in `Auth Pipeline > Rules` with the following code (use [this guide](https://auth0.com/docs/protocols/saml/saml-configuration/saml-assertions) for further information):

    ```js
    function (user, context, callback) {
      user.user_metadata = user.user_metadata || {};
      // Default the administrator flag to false we will use this flag
      // as the input to our SAML assertion attribute
      user.user_metadata.administrator = "false";
      // We need to make sure that the roles property is passed and that it is
      // an array
      if (Array.isArray(context.authorization.roles)) {
        // If the string 'Administrators' which is the name of the role
        // is included in the array then this user has the Administrator role assigned
        // to her
        if (context.authorization.roles.includes('Administrators')) {
          // Flip the flag to true. This will add the administrator
          // attribute to the SAML response
          user.user_metadata.administrator = "true";
          context.samlConfiguration.mappings = {
            "administrator": "user_metadata.administrator"
          };
        }
      }
      callback(null, user, context);
    }
    ```

    <img src="{{ "/assets/img/2020/06/02/ghes_auth0_rule.jpg" | relative_url }}">

1. Log in with that account in GHES and that particular user should be promoted to administrator post-login.

That's it! Of course, this might not work the first time, so you will need to troubleshoot the requests/responses here are some tools that I found helpful:

1. [SAML Chrome Panel - Chrome Extension](https://chrome.google.com/webstore/detail/saml-chrome-panel/paijfdbeoenhembfhkhllainmocckace?hl=en)
1. [Auth0 Rules Debugging Guide](https://auth0.com/docs/rules/guides/debug)

{% include disclaimer.html %}
