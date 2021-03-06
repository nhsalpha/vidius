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
        var github = GitHubAPI(
              accessToken,
              config.githubRepoOwner,
              config.githubRepoName
            ),
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
      selectedFile: null,
      branch: null
    };
  },
  componentWillMount: function() {
    this.props.vidius.getBranch('master').then(function(branch) {
      this.setState({
        branch: branch
      });

      this.props.vidius.getMarkdownFiles(branch).done(function(files) {
        this.setState({
          files: files,
        });
      }.bind(this));
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
          file={this.state.selectedFile}
          loadTextFileContents={this.loadTextFileContents}
          saveTextFileContents={this.saveTextFileContents}
          generatePreview={this.generatePreview} />
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
  },
  generatePreview: function(file, contents) {
    return this.props.vidius.generatePreview(
      file,
      contents,
      this.state.branch
    );
  },

  loadTextFileContents: function(file) {
    return this.props.vidius.getTextFileContents(
      file,
      this.state.branch
    );
  },
  saveTextFileContents: function(file, contents) {
    return this.props.vidius.saveTextFileContents(
      file,
      contents,
      this.state.branch
    );
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
      fileContents: null,
      savedMessage: null,
      generatingPreview: false
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
    var statusMessage = null,
        previewButton = null;

    if (this.state.savedMessage !== null) {
      statusMessage = (
        <span className="saved">
          <a href={this.state.savedMessage.link}>
            {this.state.savedMessage.message}
          </a>
        </span>
      );
    }

    if (this.state.generatingPreview) {
      previewButton = (
        <button disabled={true}>Generating preview…</button>
      );
    } else {
      previewButton = (
        <button onClick={this.handlePreview}>Preview</button>
      );
    }

    return (
      <div id="file-editor">
        <h2>{this.props.file.path}</h2>
        <FileContents text={this.state.fileContents} setContents={this.setFileContents} />
        <p>
          <button onClick={this.handleSave}>Save</button>
          {previewButton}
          {statusMessage}
        </p>
      </div>
    );
  },
  getFileContents: function(file) {
    this.setState({fileContents: null});

    this.props.loadTextFileContents(file).done(function(text) {
      var strippedText = text.replace(/\r?\n?$/, '');
      this.setState({fileContents: strippedText});
    }.bind(this));
  },
  setFileContents: function(contents) {
    this.setState({fileContents: contents});
  },
  handleSave: function() {
    this.props.saveTextFileContents(this.props.file, this.state.fileContents + '\n')
      .done(function(data) {
        this.setState({
          savedMessage: {
            link: data.link,
            message: data.message
          }
        });
      }.bind(this));
  },

  handlePreview: function() {
    this.setState({generatingPreview: true});
    this.props.generatePreview(this.props.file, this.state.fileContents + '\n')
      .done(function(preview_url) {
        console.log('Opening preview ' + preview_url);
        window.open(preview_url);
        this.setState({generatingPreview: false});
      }.bind(this));
  }
});

var FileContents = React.createClass({
  render: function() {
    var disabled = this.isContentLoaded() ? "" : "disabled";

    return (
      <textarea value={this.props.text} disabled={disabled} onChange={this.handleChange} />
    );
  },
  isContentLoaded: function() {
    return this.props.text !== null;
  },

  handleChange: function(event) {
    this.props.setContents(event.target.value);
  }
});

ReactDOM.render(
  <ApplicationContainer />,
  document.getElementById("application-container")
);
