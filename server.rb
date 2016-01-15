require 'bundler/setup'
require 'sinatra'
require 'rest_client'
require 'json'
require 'resque'
require 'redis'
require './lib/preview'

CLIENT_ID = ENV['GH_BASIC_CLIENT_ID']
CLIENT_SECRET = ENV['GH_BASIC_SECRET_ID']

use Rack::Session::Pool, :cookie_only => false

get '/' do
  erb :index
end

get '/login' do
  redirect 'https://github.com/login/oauth/authorize?scope=public_repo&client_id=' + CLIENT_ID
end

get '/logout' do
  session.clear

  redirect '/'
end

get '/github-oauth-callback' do
  session_code = request.env['rack.request.query_hash']['code']

  result = RestClient.post('https://github.com/login/oauth/access_token',
                          {:client_id => CLIENT_ID,
                           :client_secret => CLIENT_SECRET,
                           :code => session_code},
                           :accept => :json)

  session[:access_token] = JSON.parse(result)['access_token']

  redirect '/'
end

get '/github-access-token' do
  status 401 unless session[:access_token]

  session[:access_token]
end

post '/preview' do
  unless params['git_ref'] && params['file_path'] && params['file_contents']
    status 400
    # TODO Be more helpful
    return 'Missing parameters'
  end

  job_key = SecureRandom.uuid

  redis = Redis.new
  redis.set(job_key, nil, ex: 300)

  Resque.enqueue(
    Preview,
    job_key,
    # TODO get this from the client instead
    session[:access_token],
    params['git_ref'],
    params['file_path'],
    params['file_contents'],
  )

  # FIXME
  'http://localhost:9292/preview/' + job_key
end

get '/preview/:job_key' do
  redis = Redis.new
  redis.get(params[:job_key])
end
