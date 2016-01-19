# For a Github Application: https://github.com/settings/applications/new
GITHUB_CLIENT_ID = ENV.fetch('GH_BASIC_CLIENT_ID')
GITHUB_CLIENT_SECRET = ENV.fetch('GH_BASIC_SECRET_ID')

# Redis connection URL
REDIS_URL = ENV.fetch('REDIS_URL', 'redis://localhost:6379')

# AWS S3 credentials
AWS_ACCESS_KEY_ID = ENV.fetch('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = ENV.fetch('AWS_SECRET_ACCESS_KEY')

# The Github repo being edited
GITHUB_REPO_OWNER = ENV.fetch('GITHUB_REPO_OWNER')
GITHUB_REPO_NAME = ENV.fetch('GITHUB_REPO_NAME')
