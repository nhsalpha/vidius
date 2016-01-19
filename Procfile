web: bundle exec rackup config.ru -p $PORT
resque: env QUEUE=* TERM_CHILD=1 RESQUE_TERM_TIMEOUT=7 bundle exec rake resque:work
