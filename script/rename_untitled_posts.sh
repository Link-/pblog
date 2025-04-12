#!/bin/bash

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Calculate the posts directory path (one level up from script dir, then into _posts)
POSTS_DIR="$(dirname "$SCRIPT_DIR")/_posts"

# Find all Markdown files matching the pattern date-untitled.md
find "$POSTS_DIR" -name "*-untitled.md" | while read -r file; do
    echo "Processing file: $file"
    
    # Extract the title from the YAML front matter
    title=$(grep -m 1 'title:' "$file" | sed -E 's/title:\s*"?([^"]*)"?/\1/' | sed -E "s/title:\s*'?([^']*)'?/\1/" | sed 's/^ *//;s/ *$//')
    
    # Skip if title is empty or still "untitled"
    if [[ -z "$title" || "$title" == "untitled" ]]; then
        echo "Title is missing, empty, or still 'untitled': $(basename "$file")"
        continue
    fi
    
    # Extract the date from the original filename
    filename=$(basename "$file")
    if [[ "$filename" =~ ^([0-9]{4}-[0-9]{2}-[0-9]{2})-untitled\.md$ ]]; then
        date="${BASH_REMATCH[1]}"
        
        # Create new filename: replace spaces and special characters with dashes
        clean_title=$(echo "$title" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g' | sed -E 's/^-+|-+$//g')
        
        # Construct the new file path
        new_filename="${date}-${clean_title}.md"
        new_filepath="$POSTS_DIR/$(basename "$new_filename")"
        
        # Rename the file
        if [ "$file" != "$new_filepath" ]; then
            mv "$file" "$new_filepath"
            echo "Renamed: $filename → $(basename "$new_filepath")"
        else
            echo "No need to rename: $filename"
        fi
    else
        echo "File doesn't match expected naming pattern: $filename"
    fi
done

echo "Finished processing all untitled posts."