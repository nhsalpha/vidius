require './lib/preview_builder'

class Preview
  @queue = :preview

  def self.perform(job_key, access_token, git_ref, file_path, file_contents)
    # TODO don't hardcode these, get them from ENV
    github_organisation = 'nhsalpha'
    github_repo = 'content-editor-testing'

    github_api = GithubApi.new(
      api_url: "https://api.github.com",
      owner: github_organisation,
      repo: github_repo,
      access_token: access_token,
    )

    builder = PreviewBuilder.new(
      file_contents: file_contents,
      file_path: file_path,
      git_ref: git_ref,
      github_api: github_api,
      job_key: job_key,
    )

    builder.process
  end
end
