"use strict";

var GitHubAPI = function(accessToken, org, repo) {

  var API_URL = 'https://api.github.com/repos/' + org + '/' + repo;

  return {
    getBranch: function(branchName) {
      return $.get(API_URL + '/branches/' + branchName);
    },

    getTree: function(sha) {
      return $.get(API_URL + '/git/trees/' + sha + '?recursive=1');
    },

    getFileContents: function(path, ref) {
      return $.get(API_URL + '/contents/' + path + '?ref=' + ref);
    },

    updateFileContents: function(path, message, content, sha, branch) {
      return $.ajax({
        method: 'PUT',
        url: API_URL + '/contents/' + path,
        headers: {
          'Authorization': 'token ' + accessToken,
          'Content-Type': 'application/json'
        },
        data: JSON.stringify({
          message: message,
          sha: sha,
          content: content,
          branch: branch
        }),
      });
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
