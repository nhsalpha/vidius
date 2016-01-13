/* Some Javascript */

"use strict";

var GitHubAPI = function(accessToken, org, repo) {

  var API_URL = 'https://api.github.com/repos/' + org + '/' + repo;

  return {
    getBranch: function(branchName) {
      return $.get(API_URL + '/branches/' + branchName);
    },

    getTree: function(sha) {
      return $.get(API_URL + '/git/trees/' + sha);
    },

  };
}

var Vidius = (function() {
  var github = null;


  return {
    isAuthenticated: function() {
      return null !== github;
    },

    getAccessToken: function() {
      return $.get('/github-access-token')
        .then(function(accessToken) {
          github = GitHubAPI(accessToken, 'nhsalpha', 'content-editor-testing');
        });
    },

    getFileListing: function() {

      return github.getBranch('master').then(function(data) {
        return github.getTree(data.commit.sha);
      }).then(function(data) {
        return data.tree;
      });

    }
  };

})();

console.log('Hello!');
