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
    }
  };
};
