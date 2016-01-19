require 'jekyll'
require 'tempfile'

class PreviewBuilder
  def initialize(file_contents:, file_path:, git_ref:, github_api:, job_key:, s3_api:)
    @file_contents = file_contents
    @file_path = file_path
    @git_ref = git_ref
    @github_api = github_api
    @job_key = job_key
    @s3_api = s3_api
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
    :s3_api
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
    log("Replacing the contents of #{file_path}")
    File.write(
      File.join(@temp_dir, file_path),
      file_contents,
    )
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
    s3_bucket_name = "vidius-preview-#{job_key}"

    # Make a bucket
    log("Creating S3 bucket #{s3_bucket_name}")
    bucket = s3_api.create_bucket(
      acl: "public-read",
      bucket: s3_bucket_name,
      create_bucket_configuration: {
        location_constraint: "eu-west-1"
      },
    )

    # Enable static website hosting
    log("… enabling static website hosting")
    s3_api.put_bucket_website(
      bucket: s3_bucket_name,
      website_configuration: {
        index_document: {
          suffix: "index",
        },
      },
    )

    # Grab all the files from the build directory
    files = Dir.glob(File.join(@build_dir, "**/*")).reject { |path|
      File.directory?(path)
    }
    
    # Work out a key and content-type for each file
    files = files.map { |path|
      # TODO raise a more helpful error
      raise "nope" unless path.start_with?(@build_dir)

      content_type = case File.extname(path)
                     when ".html"
                       "text/html"
                     when ".css"
                       "text/css"
                     when ".js"
                       "application/javascript"
                     when ".svg"
                       "image/svg+xml"
                     when ".png"
                       "image/png"
                     when ".jpg"
                       "image/jpeg"
                     end

      s3_key = path.sub(@build_dir, "").sub(/^\//, "")

      if File.extname(path) == ".html"
        s3_key = s3_key.sub(/.html$/, "")
      end

      OpenStruct.new(
        path: path,
        s3_key: s3_key,
        content_type: content_type,
      )
    }

    # Loop through files and upload them
    log("… uploading files to S3 bucket")
    files.each do |file|
      s3_api.put_object(
        bucket: s3_bucket_name,
        key: file.s3_key,
        body: File.read(file.path),
        content_type: file.content_type,
        acl: "public-read",
      )
    end

    @s3_bucket_url = "http://#{s3_bucket_name}.s3-website-eu-west-1.amazonaws.com"
  end

  def update_job
    redis = get_redis()

    log("Updating job with preview URL: #{@s3_bucket_url}")
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
