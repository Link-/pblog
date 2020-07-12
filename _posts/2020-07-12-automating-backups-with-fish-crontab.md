---
layout: post
title:  "Automating Backups on macOS with Dropbox fish and crontab"
date:   2020-07-12 22:20:00 +0200
categories: macos utilities backup fish crontab dropbox
image: /assets/img/2020/07/12/Automating_backups_header_1280x.png
sitemap:
  lastmod: 2020-07-12
  priority: 0.7
  changefreq: 'weekly'
---
Let's be honest I'm not a [Time Machine](https://en.wikipedia.org/wiki/Time_Machine_(macOS)) type of person. Don't get me wrong, Time Machine is unparalleled in what it provides but it comes at the cost of having to maintain numerous physical hard drives (or NAS drives or whatever you use for external storage).

Having been burnt a lot in the past with disks getting irreprebaly damaged and losing data, I made 2 changes to how I use my devices:

1. I only store emphemeral data on my machine. Data that I can risk losing.
2. Everything else goes into the cloud. This includes work related data.

However, there are a number of things like my dotfiles, automation scripts, and workflow configurations that is still manage locally. There are definitely some neat solution for managing those but I never invested the time in setting them up. Solutions like: [chezmoi](https://github.com/twpayne/chezmoi)

Long story short, let's discuss what I have built for backing up these files.

### Fish

I use [fish shell](https://fishshell.com/). Judge me all you want, don't care. I like it. This is the first piece of the puzzle. The following fish function will copy a directory and all its content into a folder contained Dropbox.

```
# Navigate to the functions folder
~/.config/fish/functions

# Create a new function
touch <name-of-the-function>.fish

# Create a new function for executing the copy
function <name-of-the-function>
	cp -R <ORIGINAL_FOLDER> <FOLDER_ON_DROPBOX>-(date +%F)
end
```

What this function will do is:
1. Copy the directory and its entire subtree to the location specified on Dropbox
2. Append to the new folder on dropbox a timestamp of the form: YYYY-MM-DD

Let's take an example:

```
# Original folder: ~/Desktop/folder-to-backup
# Folder on Dropbox: ~/Dropbox/Backups/folder-to-backup-2020-07-10
```

### crontab

Now we want to run this function on a schedule. Say, once every night, at 12:05AM. The obvious choice for scheduling the job is to use `crontab`.

I know a lot of engineers who would cringe 😖 at the mention of `crontab` just because we've all been too lazy to learn how to create a schedule expression.

Let's make your life easier: [https://crontab.guru/](https://crontab.guru/) is the perfect solution for that.

<a href="https://crontab.guru/" target="_blank"><img alt="Schedule expression builder with crontab.guru" src="{{ "/assets/img/2020/07/12/crontab-guru-example.jpg" | relative_url }}"></a>

It's pretty self explanatory. If you're still facing problems understanding the expression, I would take it easy on the 420 a bit 😉

```
# Add your job to crontab
crontab -e

# Paste the following
5 0 * * * <name-of-the-function>

# Save the file
# If your default editor is vim or vi type: ESC :wq! RETURN

# Check if the job is registered
crontab -l
```

### MacOS Catalina Full Disk Access

If you expect that we're done, you'd be wrong. After noticing that my script is **NOT** being called on schedule as it should be. I discovered that `crontab` requires **Full Disk Access** rights for it to be able to call your fish function.

Crazy right?! Follow the screenshots below to grant `crontab` the required permissions.

1. Launch Security & Privacy

<img alt="Schedule expression builder with crontab.guru" src="{{ "/assets/img/2020/07/12/security-and-privacy.jpg" | relative_url }}">

2. Add `crontab` to the grant list. Press `⌘ + ⇧ + g` to access the navigator and type: `/usr/sbin/cron`

<img alt="Schedule expression builder with crontab.guru" src="{{ "/assets/img/2020/07/12/add-new-application.jpg" | relative_url }}">

Now we're done! Enjoy your backups.

{% include disclaimer.html %}