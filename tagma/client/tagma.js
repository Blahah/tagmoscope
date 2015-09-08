var options = {
  keepHistory: 500,
  localSearch: true
};
var fields = ['title', 'project', 'content'];

TaskSearch = new SearchSource('tasks', fields, options);

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
  "escaped-click .delete": function(event) {
    event.stopPropagation();

    Tasks.remove(this._id);

    TaskSearch.search(TaskSearch.getCurrentQuery());
  },
  "escaped-click .guilt": function(event) {
    event.stopPropagation();

    Tasks.update(this._id, { $inc : { "guilt" : 1 } });

    TaskSearch.search(TaskSearch.getCurrentQuery());
  },
  "escaped-click .edit": function(event) {
    event.stopPropagation();
    event.preventDefault();

    var containerid = this._id + '_content';

    var container = $('#' + containerid);

    if (container.hasClass('with-editor')) {
      container.removeClass('with-editor');
      container.find('[id^=epiceditor-wrapper]').remove();
      $('#epicarea' + containerid).remove();
    } else {
      Epic.create(containerid, {
        textarea: containerid + '_ta',
        preloadText: this.content
      });
      $('#epicarea' + containerid).hide();
      container.addClass('with-editor');
    }

    return false;
  }
});

Template.taskPopout.onRendered(function() {
  $('.collapsible').collapsible()

  // hackety-hack - don't collapse the task if user clicks
  // on the buttons
  var buttons = $(this.firstNode).find('.task-btns > a');

  buttons.on('click.collapse', function(e) {
    e.stopPropagation();
    $(e.target).trigger('escaped-click');
  });

  buttons.mouseover(function() {
    $(this).addClass('text-lighten-3');
  });

  buttons.mouseout(function() {
    $(this).removeClass('text-lighten-3');
  });
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
