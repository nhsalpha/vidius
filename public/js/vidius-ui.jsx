"use strict";

var Application = React.createClass({
  getInitialState: function() {
    return {
      files: []
    };
  },
  componentWillMount: function() {
    Vidius.getAccessToken().done(function() {
      Vidius.getMarkdownFiles().done(function(files) {
        this.setState({
          files: files
        });
      }.bind(this));
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
  <Application />,
  document.getElementById("application-container")
);
