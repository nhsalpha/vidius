"use strict";

var GitHubAPI = function(accessToken, org, repo) {

  var API_URL = 'https://api.github.com/repos/' + org + '/' + repo;

  return {
    callApi: function(method, endpoint, data) {
      return $.ajax({
        method: method,
        url: API_URL + endpoint,
        headers: {
          'Authorization': 'token ' + accessToken,
          'Content-Type': 'application/json'
        },
        data: JSON.stringify(data)
      });

    },

    get: function(endpoint) {
      return this.callApi('GET', endpoint);
    },

    put: function(endpoint, data) {
      return this.callApi('PUT', endpoint, data);
    },

    post: function(endpoint, data) {
      return this.callApi('POST', endpoint, data);
    },

    getBranch: function(branchName) {
      return this.get('/branches/' + branchName);
    },

    getTree: function(sha) {
      return this.get('/git/trees/' + sha + '?recursive=1');
    },

    getFileContents: function(path, ref) {
      return this.get('/contents/' + path + '?ref=' + ref);
    },

    updateFileContents: function(path, message, content, sha, branch) {
      return this.put(
        '/contents/' + path,
        {
          message: message,
          sha: sha,
          content: content,
          branch: branch
        }
      );
    },

    createBranch: function(branchName, sha) {
      return this.post(
        '/git/refs',
        {
          ref: 'refs/heads/' + branchName,
          sha: sha
        }
      );
    },

    createPullRequest: function(head, base, title, body) {
      return this.post(
        '/pulls',
        {
          head: head,
          base: base,
          title: title,
          body: body
        }
      );
    }
  };
}

// http://ecmanaut.blogspot.co.uk/2006/07/encoding-decoding-utf8-in-javascript.html
var decodeBase64ToText = function(base64) {
  return decodeURIComponent(escape(atob(base64.replace(/\s/g, ''))));
}

var encodeTextToBase64 = function(text) {
  return btoa(unescape(encodeURIComponent(text)));
}

var Vidius = function(github) {
  return {
    getBranch: function(name) {
      return github.getBranch(name);
    },

    getFileListing: function(branch) {
      return github.getTree(branch.commit.sha).then(function(data) {
        return data.tree;
      });
    },

    getMarkdownFiles: function(branch) {
      return this.getFileListing(branch).then(function(files) {
        return files.filter(function(file) {
          return file.path.endsWith('.md');
        });
      });
    },

    generatePreview: function(file, contents, branch) {
      return $.post(
        '/preview',
        {
          git_ref: branch.commit.sha,
          file_path: file.path,
          file_contents: contents
        }
      ).then(function(status_url) {
        var deferred = $.Deferred(),
            checkStatus = function() {
              $.get(status_url).then(
                function(preview_url) {
                  if (preview_url) {
                    deferred.resolve(preview_url);
                  }
                  else {
                    window.setTimeout(checkStatus, 1000);
                  }
                },
                function() {
                  deferred.reject();
                }
              );
            };

        checkStatus();

        return deferred.promise();
      });
    },

    getTextFileContents: function(file, branch) {
      var deferred = $.Deferred();

      github.getFileContents(file.path, branch.commit.sha).then(
        function(contents) {
          if (contents.type === "file" && contents.encoding === "base64") {
            deferred.resolve(decodeBase64ToText(contents.content));
          }
          else {
            deferred.reject();
          }
        },
        function() {
          deferred.reject();
        }
      );

      return deferred.promise();
    },

    saveTextFileContents: function(file, contents, branch) {
      // TODO implement branch handling
      if (branch.name !== 'master') {
        throw 'editing branches not implemented';
      }

      var now = new Date(),
          timestamp = now.toISOString().replace(/:/g, '-').replace(/\..*$/, ''),
          // TODO: include user like `content/paulfurley/2016-01-28T18-34-56`
          branchName = 'content/' + timestamp,
          // TODO make a better commit message
          commitMessage = 'Updated file',
          base64Contents = encodeTextToBase64(contents);

      return github.createBranch(branchName, branch.commit.sha).then(function() {
        return github.updateFileContents(
          file.path,
          commitMessage,
          base64Contents,
          file.sha,
          branchName
        );
      }).then(function() {
        return github.createPullRequest(
          branchName,
          'master',
          commitMessage
        );
      }).then(function(pullRequestData) {
        return {
          link: pullRequestData.html_url,
          message: pullRequestData.html_url.replace(/https?:\/\//, '')
        };
      });
    }
  };
};
