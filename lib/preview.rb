class Preview
  @queue = :preview

  def self.perform(access_token, git_ref, file_path, file_contents)
    # TODO don't hardcode these, get them from ENV
    github_organisation = 'nhsalpha'
    github_repo = 'content-editor-testing'

    puts access_token, github_organisation, github_repo, git_ref, file_path, file_contents
  end
end
