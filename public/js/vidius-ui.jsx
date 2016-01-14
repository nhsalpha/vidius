"use strict";

var AuthenticationState = {
  WAITING: 1,
  AUTHENTICATED: 2,
  UNAUTHENTICATED: 3
};

var ApplicationContainer = React.createClass({
  getInitialState: function() {
    return {
      vidius: null,
      isAuthenticated: AuthenticationState.WAITING
    };
  },
  componentWillMount: function() {
    $.get('/github-access-token')
      .done(function(accessToken) {
        // TODO get these from environment variables
        var github = GitHubAPI(accessToken, 'nhsalpha', 'content-editor-testing'),
            vidius = Vidius(github);

        this.setState({
          vidius: vidius,
          isAuthenticated: AuthenticationState.AUTHENTICATED
        });
      }.bind(this))
      .fail(function() {
        this.setState({
          vidius: null,
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
        return <Application vidius={this.state.vidius} />
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
      files: [],
      selectedFile: null
    };
  },
  componentWillMount: function() {
    this.props.vidius.getMarkdownFiles().done(function(files) {
      this.setState({
        files: files
      });
    }.bind(this));
  },
  render: function() {
    return (
      <div>
        <FileList
          files={this.state.files}
          selectFile={this.selectFile}
          selectedFile={this.state.selectedFile} />
      </div>
    );
  },
  selectFile: function(file_key) {
    this.setState({
      selectedFile: file_key
    });
  }
});

var FileList = React.createClass({
  render: function() {
    var files = this.props.files.map(function(file) {
      return (
        <FileSelector
          key={file.path}
          file_name={file.path}
          selectFile={this.props.selectFile}
          selectedFile={this.props.selectedFile} />
      );
    }.bind(this));

    return (
      <ul id="file-list">
        {files}
      </ul>
    );
  }
});

var FileSelector = React.createClass({
  render: function() {
    var className = (this.props.file_name === this.props.selectedFile) ? "selected" : "";

    return (
      <li onClick={this.handleOnClick} className={className}>
        {this.props.file_name}
      </li>
    );
  },
  handleOnClick: function() {
    this.props.selectFile(this.props.file_name);
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
