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
    var panels = [
      <FileList key="fileList"
        files={this.state.files}
        selectFile={this.selectFile}
        selectedFile={this.state.selectedFile} />
    ];

    if (this.state.selectedFile !== null) {
      panels.push(
        <FileEditor key="fileEditor"
          vidius={this.props.vidius}
          file={this.state.selectedFile} />
      );
    }

    return (
      <div>
        {panels}
      </div>
    );
  },
  selectFile: function(file) {
    this.setState({
      selectedFile: file
    });
  }
});

var FileList = React.createClass({
  render: function() {
    var files = this.props.files.map(function(file) {
      return (
        <FileSelector
          key={file.path}
          file={file}
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
    var className = this.isSelected() ? "selected" : "";

    return (
      <li onClick={this.handleOnClick} className={className}>
        {this.props.file.path}
      </li>
    );
  },
  handleOnClick: function() {
    this.props.selectFile(this.props.file);
  },
  isSelected: function() {
    return this.props.selectedFile !== null &&
           this.props.selectedFile.path === this.props.file.path;
  }
});

var FileEditor = React.createClass({
  getInitialState: function() {
    return {
      fileContents: null
    };
  },
  componentWillMount: function() {
    this.getFileContents(this.props.file);
  },
  componentWillReceiveProps: function(nextProps) {
    if (nextProps.file.path !== this.props.file.path) {
      this.getFileContents(nextProps.file);
    }
  },
  render: function() {
    return (
      <div id="file-editor">
        <h2>{this.props.file.path}</h2>
        <FileContents text={this.state.fileContents} />
        <button>Save</button>
      </div>
    );
  },
  getFileContents: function(file) {
    this.setState({fileContents: null});

    this.props.vidius.getTextFileContents(file).done(function(text) {
      this.setState({fileContents: text});
    }.bind(this));
  },
});

var FileContents = React.createClass({
  render: function() {
    var disabled = this.isContentLoaded() ? "" : "disabled";

    return (
      <textarea value={this.props.text} disabled={disabled} />
    );
  },
  isContentLoaded: function() {
    return this.props.text !== null;
  }
});

ReactDOM.render(
  <ApplicationContainer />,
  document.getElementById("application-container")
);
