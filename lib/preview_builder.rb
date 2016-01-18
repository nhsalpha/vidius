require 'jekyll'
require 'rest_client'
require 'tempfile'

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

class PreviewBuilder
  def initialize(file_contents:, file_path:, git_ref:, github_api:, job_key:)
    @file_contents = file_contents
    @file_path = file_path
    @git_ref = git_ref
    @github_api = github_api
    @job_key = job_key
  end

  def process
    fetch_archive
    unpack_archive
    replace_file_for_preview
    build_jekyll
    upload_to_s3
    update_job
    clean_up
  end

private
  attr_reader(
    :file_contents,
    :file_path,
    :git_ref,
    :github_api,
    :job_key,
  )

  def log(message)
    puts message
  end

  def fetch_archive
    log("Getting archive link for #{git_ref} …")
    archive_link = github_api.get_archive_link(git_ref)
    log("… #{archive_link}")

    # TODO raise a more useful error
    raise "nope" unless archive_link =~ %r{\Ahttps://codeload.github.com/}

    @temp_file = Tempfile.new(job_key + ".tar.gz")
    @temp_file.close

    log("Fetching archive and saving it to #{@temp_file.path}")
    system("curl", "--output", @temp_file.path, archive_link)

    # TODO check `curl` returned successfully
  end

  def unpack_archive
    @temp_dir = Dir.mktmpdir("repo")

    log("Unpacking archive to #{@temp_dir}")
    system(
      "tar", 
      "-C", 
      @temp_dir, 
      "--strip-components", 
      "1", 
      "-xzf", 
      @temp_file.path,
    )

    # TODO check `tar` returned successfully
  end

  def replace_file_for_preview
    # TODO implement
  end

  def build_jekyll
    @build_dir = File.join(@temp_dir, "_site")

    jekyll_config = Jekyll.configuration(
      source: @temp_dir,
      destination: @build_dir,
    )

    log("Building jekyll site in #{@build_dir}")
    Jekyll::Site.new(jekyll_config).process

    # TODO check site built successfully
  end

  def upload_to_s3
    # TODO implement
    @s3_bucket_url = "http://alpha.nhs.uk"
  end

  def update_job
    redis = Redis.new

    log("Updating job with preview URL")
    redis.set(job_key, @s3_bucket_url)
  end

  def clean_up
    log("Cleaning up temporary files and directories")

    # This is a bit belt-and-braces since it's inside @temp_dir, but it could
    # be changed to be outside and then wouldn't be removed
    FileUtils.remove_entry_secure(@build_dir)

    FileUtils.remove_entry_secure(@temp_dir)
    @temp_file.unlink
  end
end
