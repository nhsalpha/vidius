require 'aws-sdk'
require './lib/github_api'
require './lib/preview_builder'

class Preview
  @queue = :preview

  def self.perform(job_key, access_token, git_ref, file_path, file_contents)
    github_api = GithubApi.new(
      api_url: "https://api.github.com",
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      access_token: access_token,
    )

    s3_api = Aws::S3::Client.new(
      region: 'eu-west-1',
      access_key_id: AWS_ACCESS_KEY_ID,
      secret_access_key: AWS_SECRET_ACCESS_KEY,
    )

    builder = PreviewBuilder.new(
      file_contents: file_contents,
      file_path: file_path,
      git_ref: git_ref,
      github_api: github_api,
      job_key: job_key,
      s3_api: s3_api,
    )

    builder.process
  end
end
