# Makefile for Jekyll blog

.PHONY: all upgrade test build serve new clean og_assets rename_posts help

# Default target
all: build rename_posts generate_og_assets
	@echo "All tasks completed successfully."

# Upgrade dependencies
upgrade:
	@echo "Upgrading Ruby dependencies..."
	bundle update
	@echo "Upgrading Node dependencies..."
	npm update

# Run tests
test:
	@echo "Running tests..."
	bundle exec jekyll doctor
	@echo "Checking links in the site..."
	bundle exec jekyll build
	@echo "Tests completed successfully."

# Build the site
build:
	@echo "Building the site..."
	JEKYLL_ENV=production bundle exec jekyll build

# Serve the site locally
serve:
	@echo "Starting local server..."
	bundle exec jekyll serve --trace --livereload --drafts

# Create a new post
new_post:
	@echo "Creating new post..."
	./script/new_post.sh
	@echo "Don't forget to edit the title and other frontmatter in the new post."

# Rename untitled posts based on their title
rename_posts:
	@echo "Renaming untitled posts based on their titles..."
	./script/rename_untitled_posts.sh
	@echo "Posts renamed successfully."

# Generate OG assets for all posts
generate_og_assets:
	@echo "Generating OG assets for posts..."
	node ./script/generate_og_asset.js
	@echo "OG assets generated successfully."

# Clean up generated files
clean:
	@echo "Cleaning up..."
	bundle exec jekyll clean
	rm -rf _site .jekyll-cache .sass-cache

# Help information
help:
	@echo "Jekyll blog Makefile"
	@echo "-------------------"
	@echo "Available targets:"
	@echo "  upgrade              - Update all Ruby and Node.js dependencies"
	@echo "  test                 - Run tests to check site health"
	@echo "  build                - Build the site for production"
	@echo "  serve                - Start local server with live reload"
	@echo "  new_post             - Create a new blog post template"
	@echo "  rename_posts         - Rename untitled posts based on their titles"
	@echo "  generate_og_assets   - Generate Open Graph assets for all posts"
	@echo "  clean                - Remove generated files and caches"
	@echo "  help                 - Show this help message"