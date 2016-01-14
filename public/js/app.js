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
    getFileListing: function() {
      return github.getBranch('master').then(function(data) {
        return github.getTree(data.commit.sha);
      }).then(function(data) {
        return data.tree;
      });
    },

    getMarkdownFiles: function() {
      return this.getFileListing().then(function(files) {
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
      var commitMessage = 'Updated file',
          branchName='master',
          base64Contents = btoa(unescape(encodeURIComponent(contents)));

      return github.updateFileContents(file.path, commitMessage, base64Contents, file.sha, branchName);
    }
  };
};
