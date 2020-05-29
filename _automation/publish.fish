#!/usr/local/bin/fish

#################################
# Describe what this is #########
#################################

# Define the directory from which this script should be 
# executed
set HOST_NAME "sysadmin@bassemdy.com"
set PRIVATE_KEY "~/.ssh/id_bassemdy_digitalocean_rsa"
set WORK_DIR "/Users/bdghaidi/Projects/pblog"
set SOURCE_LOCATION "/_site/"
set REMOTE_LOCATION "/var/www/html/blog.bassemdy.com/"

# Check if we're executing in the proper directory
if test ! $WORK_DIR = (pwd)
  echo "WARNING:: Executing in the wrong directory"
  echo "Expecting: $WORK_DIR"
  echo "Exiting ..."
  exit 0
end

# Sync
echo "INFO:: Building..."
bundle exec jekyll build
echo "INFO:: Synching with remote $HOST_NAME"
echo "INFO:: Syncing $WORK_DIR$SOURCE_LOCATION with $REMOTE_LOCATION"
rsync -rauL -P -e "ssh -i $PRIVATE_KEY" $WORK_DIR$SOURCE_LOCATION $HOST_NAME:$REMOTE_LOCATION
echo "INFO:: Done!"