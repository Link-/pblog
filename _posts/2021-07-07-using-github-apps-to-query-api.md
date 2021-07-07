---
layout: post
title: "Using GitHub Apps to call the APIs"
date: 2021-07-07 20:00:00 +0200
categories: github github-apps api rest graphql jwt
github: https://github.com/Link-/github-app-bash
image: https://opengraph.githubassets.com/8f5cb41df04b18e5a1589c7718505c60bf0a6b97aac785b60fc5fbe56e2d5d60/Link-/github-app-bash
sitemap:
  lastmod: 2021-07-07
  priority: 0.7
  changefreq: "weekly"
---

> TLDR; Using GitHub Apps to call GitHub's REST and GraphQL APIs

If you're a GitHub power user, or an enterprise administrator, or you just had to set up some automation or integration you had to use of the [REST](https://docs.github.com/en/rest) or [GraphQL](https://docs.github.com/en/graphql) APIs in a way or another.

The majority of GitHub's API resources require authentication. There are 2 methods of authentication:

1. Basic authentication
1. Personal Access Token (PAT)
1. OAuth2 tokens:
    1. OAuth App access token
    1. GitHub App installation access token

We're going to ignore basic authentication in this post and will focus on the Personal Access Tokens and OAuth tokens. This table describes the features of each token type:

| Feature                                                        | Personal Access Token (PAT) | OAuth App Access Token | GitHub App Installation Access Token |
|----------------------------------------------------------------|-----------------------------|------------------------|--------------------------------------|
| Granular / customizable access scope and permissions           | yes                         | no                     | yes                                  |
| Access scope is bound by user permissions                      | yes                         | yes                    | no                                   |
| Self expire (after a period of time)                           | no                          | yes                    | yes                                  |
| Configurable expiration duration                               | no                          | no                     | no                                   |
| Generated via APIs                                             | no                          | yes                    | yes                                  |
| Can be revoked on demand                                       | no                          | yes                    | yes                                  |
| Requires installation                                          | no                          | no                     | yes                                  |
| Bound by API rate limits                                       | yes                         | yes                    | yes                                  |
| Impersonate authenticated account                              | yes                         | yes                    | yes                                  |
| Act as the app (do not impersonate an authenticated account) | no                          | no                     | yes                                  |

_Of course there are many more distinctions but for the purposes of this post, I'll be focusing on those only_.

## When to use what?

I really like this visual from the [official docs](https://docs.github.com/en/developers/apps/getting-started-with-apps/about-apps#determining-which-integration-to-build) for determining which method is the best:

![when to use each authentication method](https://docs.github.com/assets/images/intro-to-apps-flow.png)

## Authenticating with GitHub Apps

I personally really like GitHub Apps as they can be used for both `user to server` and `server to server` integrations. I believe they are the future of integrations with GitHub, their main problem is that they're not very easy to set up and play with.

However, once you have a good understand of the basic concepts, you'll also start liking them as I do.

To work with GitHub Apps there are 3 things to do:

1. [Create a GitHub App](https://docs.github.com/en/developers/apps/building-github-apps/creating-a-github-app)
1. [Install the GitHub App](https://docs.github.com/en/developers/apps/managing-github-apps/installing-github-apps) on a repository, an organization or user account
1. Generate an installation access token

I did not link the 3rd step to the docs because I'll be describing the process of generating an installation access token here.

### 1. Create JWT

1. This step requires [jwt-cli](https://github.com/mike-engel/jwt-cli#installation) or anything else that provides similar functionality.

2. Once you have `jwt-cli` setup and ready, let's do a quick sanity check:

    ```sh
    # Check jwt-cli version
    jwt --version
    ```

3. Next, we need to create a private key for the [GitHub App we created](https://docs.github.com/en/developers/apps/building-github-apps/creating-a-github-app) by following [this guide](https://docs.github.com/en/developers/apps/building-github-apps/authenticating-with-github-apps#generating-a-private-key).

4. Do you have the `PEM` file downloaded? Let's do another quick sanity check. We print out the first 1 to 10 characters of each line of the PEM file to check its content while avoiding exposing it.

    ```sh
    # Print the first 1 to 10 characters of each line of the PEM file
    cat ~/Downloads/our-github-app-private-key.pem | cut -c 1-10

    -----BEGIN
    MIIEowIBAA
    EWvM/c5vO3
    buxJtiE4lQ
    MBOY8KgDdX
    ZNMczYnLs/
    McDFdqSyC/
    IoSt9tfj0A
    5f6WTf9zeO
    NErdZLLaub
    SQMznabRo8
    owAApBGu+M
    G1fsHQECgY
    OXWnyxqKUN
    aT3g4jEG68
    BL+5WP/SKx
    0aSKYMaic3
    m+MOxumCD7
    YtwOhGHjO9
    GV7iByqFOn
    5V2jMNlC/x
    8v6Z1u/bHr
    egKQtvdDX7
    YcuZVQKBgE
    J6N6fn+4fa
    +N7HgFtEKA
    -----END R
    ```

5. Now we need to convert the `PEM` file to `DER` (just the binary form of the PEM file) format:

    ```sh
    # Convert PEM to DER encoded key
    openssl rsa -outform der -in our-github-app-private-key.pem -out our-github-app-key-DER.key

    # You should have a new file in your directory called our-github-app-key-DER.key
    ```

6. Let's generate a JWT (JSON web token) which we will use to authenticate the subsequent API requests:

    ```sh
    # Will generate a JWT with the following properties:
    # -A | algorithm: RS256
    # -e | expiry time: 10 minutes
    # -i | issuer: GitHub App ID (you can get it from the settings page of the app)
    # -P | payload: JWT payload: https://jwt.io/introduction
    # -S | secret / key: The DER key for our GitHub App

    # This assumes you're using bash as a shell, if you're using something else you need to adapt the command to your shell

    APP_JWT=$(jwt encode \
                  -A RS256 \
                  -e $(( $(date +%s) + $(( 10 * 60 )) )) \
                  -i <APP_ID> \
                  -P iat=$(( $(date +%s) - 60 )) \
                  -S @our-github-app-key-DER.key)

    mbiCIce4NjZxIYe6hKqFxeO_myB0X-cSCVrtd6KXLPXRp94rvj-hhu4iCRLcfX-jel76_-TJErVCGxCyUhElAE6gPG85MyqN97U7C2EFN8dIbU47zqj9wXX3917NYfiGET99LYR_r7_yJ6oQadJVy7Szggj.Dt0g6T6VASyv_feNBYidlfN2ZsSlQt1niPn5Zbi8ab14Jpw9zc6XLWJ6BI-85rzfhoDpaCwnsMNebnUNQodGq0aQuOI2pHzrhTJyShqsehcCPl1PZZHSFixxNGmG4afIxxXigWNf2NIJF-D_z3iKObW_UUYeDiFDVmcDXaJW80UZfZlvz3DjfKxBiGJeiynOz2yMnX3uz99rLUg-nh6Z6I9LeuKMkqjpB3L2dTS1MbrHWvnx64OCKdJ-TlBoYYJR5K5IO.YBiH4fg2t7z-jGOhZ66M
    ```

### 2. Get list of installations

1. We will now use the JWT we generated in the previous step to fetch the list of installations of our app. Remember, a GitHub app can be installed for many repositories, organizations or users.

    ```sh
    curl \
      -H "Authorization: Bearer ""${APP_JWT}" \
      -H "Accept: application/vnd.github.v3+json" \
      https://api.github.com/app/installations

    [
      {
        "id": 16999999,
        "account": {
          "login": "RANDOM_ORG_NAME 1",
          "id": 80999999,
          ...
        },
        "repository_selection": "all",
        ...
        "permissions": {
          ...
        },
        "events": [
          ...
        ],
        "created_at": "2021-05-17T09:33:39.000Z",
        "updated_at": "2021-05-20T17:58:35.000Z",
        "single_file_name": null,
        "has_multiple_single_files": false,
        "single_file_paths": [
          ...
        ],
        "suspended_by": null,
        "suspended_at": null
      },
      {
        "id": 17999999,
        "account": {
          "login": "RANDOM_ORG_NAME 2",
          "id": 81999999,
          ...
        },
        "repository_selection": "all",
        ...
        "permissions": {
          ...
        },
        "events": [
          ...
        ],
        "created_at": "2021-05-17T09:33:39.000Z",
        "updated_at": "2021-05-20T17:58:35.000Z",
        "single_file_name": null,
        "has_multiple_single_files": false,
        "single_file_paths": [
          ...
        ],
        "suspended_by": null,
        "suspended_at": null
      }
    ]
    ```

1. Copy the installation id for the repository, organization or user you want to use:

    ```json
    // First installation
    {
      "id": 16999999,   // <- This is the installation id
      "account": {
        "login": "RANDOM_ORG_NAME 1",
        ...

    // Second installation
    {
      "id": 17999999,   // <- This is the installation id
      "account": {
        "login": "RANDOM_ORG_NAME 2",
        ...
    ```

### 3. Create an installation access token

Generate the installation access token

```sh
# Put the installation id in a variable
APP_INSTALLATION_ID=16985135

# Generate an access token
curl -s \
    -X POST \
    -H "Authorization: Bearer ""${APP_JWT}" \
    -H "Accept: application/vnd.github.v3+json" \
    https://api.github.com/app/installations/"${APP_INSTALLATION_ID}"/access_tokens

{
  "token": "ghs_akiE7tSItG8SeH5M8gGn05JhAsbcL4uh2vWB0",
  "expires_at": "2021-07-07T19:19:36Z",
  "permissions": {
    ...
  },
  "repository_selection": "all"
}
```

### 4. Call REST / GraphQL APIs with installation access token

With the token generated in the previous step, call the resources within your permissions scope as such:

```sh
APP_TOKEN="ghs_akiE7tSItG8SeH5M8gGn05JhAsbcL4uh2vWB0"

curl -s \
      -H "Authorization: token ""${APP_TOKEN}" \
      -H "Accept: application/vnd.github.v3+json" \
      https://api.github.com/orgs/<ORG_NAME>/repos

[
  {
    "id": 432071637,
    "node_id": "jGDnD=zOa9Y3lMQNExRMlcXkzMzJwMvc",
    "name": "random-repo-name",
    "full_name": "ORGNAME/random-repo-name",
    "private": true,
    "owner": {
      ...
    },
    "html_url": "...",
    "description": "...",
    "fork": false,
    ...
  }
]
```

### ghtoken to the rescue

That's quite a lengthy process, right? Yeah, I thought so. It is also slightly intimidating. That's why I create `ghtoken`. A simple bash utility that encapsulates all the above and allows you to generate / revoke installation access tokens very quickly.

#### How it works?

This gif illustrates how `ghtoken` works, it's the steps as described before with a bunch of boilerplate code to handle different scenarios:

<img src="{{ "/assets/img/2021/07/07/ghtoken_process_animation.gif" | relative_url }}">

#### Basic flows

**1. Run `ghtoken` assuming `jwt-cli` is already installed**

```sh
$ ghtoken generate \
    --key ./.keys/private-key.pem \
    --app_id 1122334 \
    | jq

{
  "token": "ghs_g7___MlQiHCYI__________7j1IY2thKXF",
  "expires_at": "2021-04-28T15:53:44Z"
}
```

**2. Run `ghtoken` and install `jwt-cli`**

```sh
# Assumed starting point
.
├── .keys
│   └── private-key.pem
├── README.md
└── ghtoken

1 directory, 3 files

# Run ghtoken and add --install_jwt_cli
$ ghtoken generate \
    --key ./.keys/private-key.pem \
    --app_id 1122334 \
    --install_jwt_cli \
    | jq

{
  "token": "ghs_8Joht_______________bLCMS___M0EPOhJ",
  "expires_at": "2021-04-28T15:55:32Z"
}

# jwt-cli will be downloaded in the same directory
.
├── .keys
│   └── private-repo-checkout.2021-04-22.private-key.pem
├── README.md
├── ghtoken
└── jwt
```

**3. Revoke an installation access token**

```sh
# Run ghtoken with the revoke command
$ ghtoken revoke \
    --token "v1.bb1___168d_____________1202bb8753b133919"
    --hostname "github.example.com"

204: Token revoked successfully
```

## Where can I find `ghtoken`?

`ghtoken` is hosted and maintained in this repository: <https://github.com/Link-/github-app-bash>
