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

    getTextFileContents: function(file) {
      // TODO don't hardcode the ref
      return github.getFileContents(file.path, 'master').then(function(contents) {
        // TODO check type is file and encoding is base64, otherwise fail
        // See http://ecmanaut.blogspot.co.uk/2006/07/encoding-decoding-utf8-in-javascript.html
        return decodeURIComponent(escape(atob(contents.content.replace(/\s/g, ''))));
      });
    },

    saveTextFileContents: function(file, contents) {
      // TODO: branch name like `vidius/paulfurley/2016-01-28T18-34-56`
      // 1. get sha of master
      // 2. create a branch pointing to the sha of master
      // 3. push the file to the new branch
      // 4. make a pull request
      //
      var commitMessage = 'Updated file',
          branchName='vidius/tmp',
          base64Contents = btoa(unescape(encodeURIComponent(contents)));

      return github.updateFileContents(file.path, commitMessage, base64Contents, file.sha, branchName);
    }
  };
};
