require 'rest_client'

class GithubApi
  def initialize(api_url:, owner:, repo:, access_token:)
    @api_url = api_url
    @owner = owner
    @repo = repo
    @access_token = access_token
  end

  def get_archive_link(git_ref)
    endpoint = "/repos/%{owner}/%{repo}/%{archive_format}/%{ref}" % {
      owner: owner,
      repo: repo,
      archive_format: "tarball",
      ref: git_ref,
    }

    response = make_head_request(endpoint)

    # We want the URL of the redirect
    response.args.fetch(:url)
  end

private
  attr_reader :api_url, :owner, :repo, :access_token

  def make_head_request(endpoint)
    # TODO use the access_token
    RestClient.head(api_url + endpoint)
  end
end

