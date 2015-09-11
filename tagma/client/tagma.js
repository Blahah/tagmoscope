var options = {
  keepHistory: 500,
  localSearch: true
};
var fields = ['title', 'project', 'content'];

TaskSearch = new SearchSource('tasks', fields, options);


// setup markdown parser to use syntax highlighting
// and Github-flavour markdown
var mark = marked;
mark.setOptions({
  gfm: true,
  tables: true,
  breaks: true,
  highlight: function (code) {
    return hljs.highlightAuto(code).value;
  }
});
Markdown = mark;

Template.taskList.helpers({
  tasks: function() {
    return TaskSearch.getData({
      transform: function(matchText, regExp) {
        return matchText;
      },
      sort: {isoScore: -1}
    });
  },

  isLoading: function() {
    return TaskSearch.getStatus().loading;
  }
});

Template.search.events({
  "keyup #search": _.throttle(function(event) {
    var text = $(event.target).val().trim();
    TaskSearch.search(text);
  }, 200)
});



Template.taskPopout.events({
  "escaped-click .task-delete": function(event) {
    event.stopPropagation();

    Tasks.remove(this._id);

    TaskSearch.search(TaskSearch.getCurrentQuery());
  },
  "escaped-click .task-guilt": function(event) {
    event.stopPropagation();

    Tasks.update(this._id, { $inc : { "guilt" : 1 } });

    TaskSearch.search(TaskSearch.getCurrentQuery());
  },
  "escaped-click .task-edit": function(event) {
    event.stopPropagation();
    event.preventDefault();

    var containerid = this._id + '_content';

    var container = $('#' + containerid);

    if (container.hasClass('with-editor')) {

      // get contents of editor, then destroy it
      var textarea = container.parent().find('textarea');
      var content = $.trim(textarea.val());
      textarea.remove();
      container.find('iframe').remove();

      // update the task popout contents and resize
      container.html(Markdown(content));
      container.removeClass('with-editor');
      container.css({ height: 'auto' });

      Tasks.update(this._id, { '$set': { 'content': content }});
      this.content = content;

    } else {
      var opts = {
        basePath: '/epic',
        theme: {
          base: '/base.css',
          editor: '/editor.css'
        },
        preloadText: this.content,
        autogrow: true,
        focusOnLoad: true,
        button: false
      }
      Epic.create(containerid, opts);
      container.find('iframe').css({ height: 'auto' });
      $('#epicarea' + containerid).hide();
      container.addClass('with-editor');
    }

    return false;
  }
});

Template.taskPopout.onRendered(function() {
  // initialise collapsible
  $('.collapsible').collapsible()
  // initialise tooltips
  $('.tooltipped').tooltip({
    delay: 0
  });

  // hackety-hack - don't collapse the task if user clicks
  // on the buttons
  var buttons = this.$('.task-btns > a');

  buttons.on('click.collapse', function(e) {
    e.stopPropagation();
    $(e.target).trigger('escaped-click');
  });

  buttons.mouseover(function() {
    $(this).removeClass('text-lighten-3');
  });

  buttons.mouseout(function() {
    $(this).addClass('text-lighten-3');
  });

  this.$('.task-content p').addClass('flow-text');

});

Template.body.events({
  "submit #add-form": function(event) {
    // Prevent default browser form submit
    event.preventDefault();

    console.log(event.type);

    // Get value from form element
    var title = event.target.title.value;
    var project = event.target.project.value;
    var content = event.target.content.value;


    // Insert a task into the collection
    Tasks.insert({
      title: title,
      project: project,
      content: content,
      guilt: 0,
      createdAt: new Date() // current time
    }, {}, function() {
      TaskSearch.search();
    });

    // Clear form
    event.target.reset();
    setTimeout(function() { $('#add-panel').hide(); }, 300);

  }
});

Template.body.rendered = function() {
  // load all tasks by default
  TaskSearch.search();
};
