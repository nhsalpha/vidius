# Running in development

Set the Github OAuth client id/secret for the development application. Get
these from:
[https://github.com/organizations/nhsalpha/settings/applications/285239](https://github.com/organizations/nhsalpha/settings/applications/285239)

```
export GH_BASIC_CLIENT_ID=<client id>
export GH_BASIC_SECRET_ID=<secret>
```

Run using bundle. Make sure it runs on port 9292
```
bundle exec rackup --port 9292
```
