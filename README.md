# Vidius

Vidius is a markdown editor tailored for editing static Jekyll websites.

It supports generating live site previews.

# Using Vidius to edit alpha.nhs.uk

If you're a content editor and you just want to *use* it:

- Go to [https://vidius.herokuapp.com](https://vidius.herokuapp.com)
- Log in with GitHub. You will need to grant access for "NHS.UK Vidius"
  to access your repositories.

# Tech overview

The application comprises:

  - a lightweight backend written in Sinatra
  - a frontend written in React.js.
  - a worker (background) process for generating previews, using Resque and
    Redis to communicate between them.

An instance of Vidius is configured to point at a single GitHub repository
containing a Jekyll site.

Previews are generated in the background by downloading the repository,
building it, uploading to a new S3 bucket and passing the URL to the app.

# Use Vidius in local development mode

## Set up your environment

We've configured two GitHub applications (production and development) in order
to use GitHub's OAuth login system. The development application redirects
to `http://localhost:9292` rather than `https://vidius.herokuapp.com`

You need to fetch the `client id` and `secret` of the development application
which you can find at
[https://github.com/organizations/nhsalpha/settings/applications/285239](https://github.com/organizations/nhsalpha/settings/applications/285239)

All the environment variables you need are described in [environment.sh.example](https://github.com/nhsalpha/vidius/blob/master/environment.sh.example)
Copy to `example.sh`, edit it and source with `. example.sh`.

## Run the web and worker processes

See [Procfile](https://github.com/nhsalpha/vidius/blob/master/Procfile)
for command lines for running the web and worker processes.
