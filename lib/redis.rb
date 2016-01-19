def get_redis
  uri = URI.parse(REDIS_URL)
  return Redis.new(:host => uri.host, :port => uri.port, :password => uri.password)
end
