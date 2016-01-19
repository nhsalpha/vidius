# For a Github Application: https://github.com/settings/applications/new
GITHUB_CLIENT_ID = ENV.fetch('GH_BASIC_CLIENT_ID')
GITHUB_CLIENT_SECRET = ENV.fetch('GH_BASIC_SECRET_ID')

# Redis connection URL
REDIS_URL = ENV.fetch('REDIS_URL', 'redis://localhost:6379')