---
layout: post
title: "Setting up podman and docker-compose on MacOS"
tldr: "Instructions for setting up podman and docker-compose on MacOS"
date: 2021-11-06 20:00:00 +0100
categories: containers oci docker podman docker-compose
image: /assets/img/og_assets/2021-11-07-podman-and-docker-compose-on-macos.png
sitemap:
  lastmod: 2021-11-06
  priority: 0.7
  changefreq: "weekly"
---

> TLDR; Instructions for setting up podman and docker-compose on MacOS

These instructions are designed to be an attachment to my video series on podman and Docker.

## Part 1

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/NqxWiwjYlBs" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

## Part 2

<iframe width="560" height="315" src="https://www.youtube-nocookie.com/embed/5Tv52d4FNtA" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

:warning: Follow these instructions at **your own risk**

```sh
# Start a podman machine with 2 vCPUs and 4GBs of RAM and 15GBs of Disk space
$ podman machine init --cpus 2 -m 4096 --disk-size 15

# Start the machine
$ podman machine start

# SSH into the machine
$ podman machine ssh

#############################
# Inside the CoreOS machine #
#############################
# Edit .bashrc for the user core
$ vi ~/.bashrc

    # Add to the bottom of the file
    docker () {
        if [ "$1" = "system" ] && [ "$2" = "dial-stdio" ]; then
          exec socat - "/run/user/1000/podman/podman.sock"
        fi
        exec /usr/bin/docker $@
    }

$ sudo su -

# vi ~/.bashrc

    # Add to the bottom of the file
    docker () {
        if [ "$1" = "system" ] && [ "$2" = "dial-stdio" ]; then
          exec socat - "/run/podman/podman.sock"
        fi
        exec /usr/bin/docker $@
    }

# Reduce this security feature to be on-par with the experience we're used to with Docker.
$ sudo sed -i 's/short-name-mode="enforcing"/short-name-mode="permissive"/g' /etc/containers/registries.conf

############################
# Host: MacOS              #
############################

# Edit the ~/.ssh/config and add the following to the bottom
Host localhost
      HostName 127.0.0.1
      IdentityFile ~/.ssh/<PODMAN_MACHINE_NAME>
      StrictHostKeyChecking no

# Get the list of connections
$ podman system connection ls

# Set the DOCKER_HOST variable (docker server)
## Fish shell
# $ set -gx DOCKER_HOST ssh://root@localhost:<PORT>
# Bash
$ export DOCKER_HOST="ssh://root@localhost:<PORT>"

# Test
$ docker version

# Disable docker-compose from using the Docker CLI when executing a build
## Fish shell
# $ set -gx COMPOSE_DOCKER_CLI_BUILD 0
# Bash
$ export COMPOSE_DOCKER_CLI_BUILD=0

# Setup a virutalenv
$ virtualenv --python=(which python3) ./venv

# Active virtualenv
## Fish shell
# $ . venv/bin/activate.fish
# Bash
$ . venv/bin/activate

# Install docker-compose v1.x
$ pip3 install docker-compose

# Test by getting the version of docker-compose
$ docker-compose -v
```

{% include disclaimer.html %}
