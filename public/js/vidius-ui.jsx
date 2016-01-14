"use strict";

var AuthenticationState = {
  WAITING: 1,
  AUTHENTICATED: 2,
  UNAUTHENTICATED: 3
};


var ApplicationContainer = React.createClass({
  getInitialState: function() {
    return {
      accessToken: null,
      isAuthenticated: AuthenticationState.WAITING
    };
  },
  componentWillMount: function() {
    Vidius
      .getAccessToken()
      .done(function() {
        this.setState({
          isAuthenticated: AuthenticationState.AUTHENTICATED
        })
      }.bind(this))
      .fail(function() {
        this.setState({
          accessToken: null,
          isAuthenticated: AuthenticationState.UNAUTHENTICATED
        })
      }.bind(this));
  },
  render: function() {
    switch(this.state.isAuthenticated) {
      case AuthenticationState.WAITING: {
        return <div />;
      };
      case AuthenticationState.AUTHENTICATED: {
        return <Application />
      };
      case AuthenticationState.UNAUTHENTICATED: {
        return <LoginScreen />;
      };
    }
  }
});

var LoginScreen = React.createClass({
  render: function() {
    return (
      <div>
        <a href="/login">Login with Github</a>
      </div>
    );
  }
});

var Application = React.createClass({
  getInitialState: function() {
    return {
      files: []
    };
  },
  componentWillMount: function() {
    Vidius.getMarkdownFiles().done(function(files) {
      this.setState({
        files: files
      });
    }.bind(this));
  },
  render: function() {
    return (
      <div>
        <FileList files={this.state.files} />
      </div>
    );
  }
});

var FileList = React.createClass({
  render: function() {
    var files = this.props.files.map(function(file) {
      return <FileSelector key={file.path} file_name={file.path} />;
    });

    return (
      <ul id="file-list">
        {files}
      </ul>
    );
  }
});

var FileSelector = React.createClass({
  render: function() {
    return (
      <li>
        <a href="#">{this.props.file_name}</a>
      </li>
    );
  }
});

var FileEditor = React.createClass({
  render: function() {
    return (
      <div id="file-editor">
        <h2>type-2-diabetes/diet.md</h2>

        <textarea defaultValue={"The quick brown fox\njumps over the lazy\ndog"} />

        <button>Save</button>
      </div>
    );
  }
});

ReactDOM.render(
  <ApplicationContainer />,
  document.getElementById("application-container")
);
