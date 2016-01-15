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

    getTextFileContents: function(file, branch) {
      return github.getFileContents(file.path, branch.commit.sha).then(function(contents) {
        // TODO check type is file and encoding is base64, otherwise fail
        // See http://ecmanaut.blogspot.co.uk/2006/07/encoding-decoding-utf8-in-javascript.html
        return decodeURIComponent(escape(atob(contents.content.replace(/\s/g, ''))));
      });
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
          base64Contents = btoa(unescape(encodeURIComponent(contents)));

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
