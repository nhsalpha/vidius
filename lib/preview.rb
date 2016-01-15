class Preview
  @queue = :preview

  def self.perform(job_key, access_token, git_ref, file_path, file_contents)
    # TODO don't hardcode these, get them from ENV
    github_organisation = 'nhsalpha'
    github_repo = 'content-editor-testing'

    puts job_key,
         access_token,
         github_organisation,
         github_repo,
         git_ref,
         file_path,
         file_contents

    sleep 10
    redis = Redis.new
    redis.set(job_key, 'http://alpha.nhs.uk')
  end
end
