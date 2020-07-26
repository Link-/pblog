---
layout: post
title:  "Automating Backups on macOS with Dropbox fish and launchd"
date:   2020-07-25 22:20:00 +0200
categories: macos utilities backup fish launchd dropbox
image: /assets/img/2020/07/25/Automating_backups_header_1280x.jpg
sitemap:
  lastmod: 2020-07-25
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

I use [fish shell](https://fishshell.com/). Judge me all you want, don't care. I like it. This is the first piece of the puzzle. The following fish function will sync a directory and all its content into a folder in Dropbox.

```
# Create the folder that will contain our backup scripts
mkdir -p ~/.backup/bin

cd ~/.backup/bin

# Create a new function
touch <name-of-the-function>.fish
```

This will be the content of your script. Do not forget to replace the placeholders!
```
#!/usr/local/bin/fish

# Replace <ORIGINAL_FOLDER> and <FOLDER_ON_DROPBOX> with the correct values
if test "$argv[1]" = 'dry-run'
  echo 'DRY-RUN'
  rsync -anzP <ORIGINAL_FOLDER> <FOLDER_ON_DROPBOX>
else
  rsync -azP <ORIGINAL_FOLDER> <FOLDER_ON_DROPBOX>
end
```

Don't forget to make the script executable with:
```
# This wil change the file permission of your script to be: 0755
chmod a+x ~/.backup/bin/<name-of-the-function>.fish
```

The function above will sync the directory and its entire subtree to the location you specified on Dropbox. It also provides a `dry-run` paramter to test it before running the real thing, give it a spin before you move forward.

```
# Just pass dry-run after the function name in your terminal
<name-of-the-function>.fish dry-run
```

### launchd

This article ["how to use launchd to run services in macos"](https://medium.com/swlh/how-to-use-launchd-to-run-services-in-macos-b972ed1e352) does a great job in giving you a primer on `launchd`. Check it out before we start creating our agent.

The agent below will run your `<name-of-the-function>.fish` exactly every night at 5 minutes past midnight. It will create output and error logs in `/tmp` and will run for the first time as soon you load the agent.

1. Navigate to `~/Library/LaunchAgents`

```
cd ~/Library/LaunchAgents
```

2. Create a new property list (.plist) file and name it something relevant

```
# Replace <data identifier> with anything more suitable
touch com.<data identifier>.backup.plist
```

3. Paste this into your file and don't forget to replace the placeholders!

```
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN"
    "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.<data identifier>.backup</string>

    <key>ProgramArguments</key>
    <array>
      <string>/usr/local/bin/fish</string>
      <string>/Users/<your-username>/.backup/bin/<name-of-the-function>.fish</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>StandardErrorPath</key>
    <string>/tmp/com.<data identifier>.backup.error</string>

    <key>StandardOutPath</key>
    <string>/tmp/com.<data identifier>.backup.stdout</string>

    <key>StartCalendarInterval</key>
    <dict>
      <key>Minute</key>
      <integer>5</integer>
      <key>Hour</key>
      <integer>0</integer>
    </dict>
</dict>
</plist>
```

4. Load the property list file

```
launchctl load ~/Library/LaunchAgents/com.<data identifier>.backup.plist

# You can also unload it with - but don't run this now!
# launchctl unload ~/Library/LaunchAgents/com.<data identifier>.backup.plist
```

5. Start the job

```
launchctl start ~/Library/LaunchAgents/com.<data identifier>.backup.plist
```

6. Verify that the job's been added

```
launchctl list | grep com.<data identifier>.backup
```

#### StartCalendarInterval

```
    <key>StartCalendarInterval</key>
    <dict>
      <key>Minute</key>
      <integer>5</integer>
      <key>Hour</key>
      <integer>0</integer>
    </dict>
```

Out of the entire definition, I think this is the most interesting part of the file. With `StartCalendarInterval` you can schedule a job to run at a specific date/time. The available keys are:

| Month   | Integer | Month of year (1..12, 1 being January)   |
|---------|---------|------------------------------------------|
| Day     | Integer | Day of month (1..31)                     |
| Weekday | Integer | Day of week (0..7, 0 and 7 being Sunday) |
| Hour    | Integer | Hour of day (0..23)                      |
| Minute  | Integer | Minute of hour (0..59)                   |

If you want a job to run everyday at a designated time, just specify the `Hour` and `Minute` values and you're good to go! Make sure to go through this fantastic reference to spare yourself a lot of agony: [https://www.launchd.info/](https://www.launchd.info/)


### Troubleshooting

- The first way to debug what's happening with your launchd agent is using MacOS's `Console.app`. Just run it, navigate to `system.log` and query the name of your plist file. Here's an example below:

<img alt="MacOS Console.app screenshot demonstrating the debugging capabilities" src="{{ "/assets/img/2020/07/25/console.app.png" | relative_url }}">

- The second method is to check your `stdout` and `stderr` files. We've specified those files to be written in `/tmp`. The reason for that is we don't really care about maintaining these logs for a long time. As soon as you reboot your system these files are gone. If the files have been created successfully and contain data, then you've setup your agent successfully!

### Service exited with abnormal code: 78

This is the most annoying error you might face. It's very cryptic and doesn't indicate at all what's wrong with your property list file. Unfortunately, if you receive this error code you will have to revisit every item in your property list file and make sure it's correct.

### References

- [https://www.launchd.info/](https://www.launchd.info/)
- [how to use launchd to run services in macos](https://medium.com/swlh/how-to-use-launchd-to-run-services-in-macos-b972ed1e352)
- [About Daemons and Services](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/Introduction.html#//apple_ref/doc/uid/10000172i-SW1-SW1)

{% include disclaimer.html %}