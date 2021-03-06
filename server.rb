require 'bundler/setup'
require 'sinatra'
require 'rest_client'
require 'json'
require 'resque'
require 'redis'
require './lib/preview'
require './lib/redis'
require './lib/config'

use Rack::Session::Pool, :cookie_only => false

get '/' do
  erb :index
end

get '/login' do
  redirect 'https://github.com/login/oauth/authorize?scope=public_repo&client_id=' + GITHUB_CLIENT_ID
end

get '/logout' do
  session.clear

  redirect '/'
end

get '/github-oauth-callback' do
  session_code = request.env['rack.request.query_hash']['code']

  result = RestClient.post(
    'https://github.com/login/oauth/access_token',
    {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code: session_code,
    },
    accept: :json,
  )

  session[:access_token] = JSON.parse(result)['access_token']

  redirect '/'
end

get '/github-access-token' do
  status 401 unless session[:access_token]

  session[:access_token]
end

post '/preview' do
  expected_params = %w(git_ref file_path file_contents)
  missing_params = expected_params.reject { |p| params[p] }

  if missing_params.any?
    status 400
    return "Missing parameters: #{missing_params.join(", ")}."
  end

  job_key = SecureRandom.uuid

  redis = get_redis()
  redis.set(job_key, nil, ex: 300)

  Resque.redis = redis
  Resque.enqueue(
    Preview,
    job_key,
    # TODO get this from the client instead
    session[:access_token],
    params['git_ref'],
    params['file_path'],
    params['file_contents'],
  )

  request.base_url + '/preview/' + job_key
end

get '/preview/:job_key' do
  redis = Redis.new
  redis.get(params[:job_key])
end

get '/config.js' do
  content_type "application/javascript"
  erb :"config.js"
end
