def get_redis
  unless ENV['REDIS_URL']
    return Redis.new
  end

  uri = URI.parse(ENV['REDIS_URL'])
  return Redis.new(:host => uri.host, :port => uri.port, :password => uri.password)
end
