// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var Sequelize = require('sequelize');
var app = require('../index.js').app;
var Application = require('../models/application');
var includes = require('../models/utils/includes');
var Interview = require('../models/interview');
var InterviewReminder = require('../models/interview-reminder');
var resolveApplicationById = require('./application').resolveApplicationById;
var ensureLoggedIn = require('../middlewares/session').ensureLoggedIn;
var resolveModelsAsLocals = require('../middlewares/models').resolveModelsAsLocals;
var saveModelsViaCandidate = require('../models/utils/save-models').saveModelsViaCandidate;
var interviewMockData = require('../models/interview-mock-data');
var NOTIFICATION_TYPES = require('../utils/notifications').TYPES;

// Define our controllers
function resolveInterviewById(params) {
  return resolveModelsAsLocals(params, function resolveInterviewByIdFn (req) {
    // If we loading mock data, return mock data
    var interviewOptions = {
      where: {
        id: req.params.id,
        candidate_id: req.candidate.get('id')
      },
      include: [
        // DEV: We include nav content so it can be reused
        {model: Application, include: includes.applicationNavContent},
        {model: InterviewReminder, as: 'pre_interview_reminder'},
        {model: InterviewReminder, as: 'post_interview_reminder'}
      ]
    };
    if (this.useMocks) {
      return {
        selectedInterviewOr404: interviewMockData.getById(interviewOptions.where.id, interviewOptions)
      };
    }

    // Return Sequelize queries
    return {
      selectedInterviewOr404: Interview.findOne(interviewOptions)
    };
  });
}
app.get('/application/:id/add-interview', _.flatten([
  ensureLoggedIn,
  resolveApplicationById({nav: true}),
  function interviewAddShow (req, res, next) {
    res.render('interview-add-show.jade');
  }
]));
app.post('/application/:id/add-interview', _.flatten([
  ensureLoggedIn,
  // DEV: We include nav in case of a validation error
  resolveApplicationById({nav: true}),
  function interviewAddSave (req, res, next) {
    // Update our interview and build our interview models
    var application = req.models.selectedApplication;
    var interview = Interview.build({
      candidate_id: req.candidate.get('id'),
      application_id: application.get('id'),
      date_time_moment: req.body.fetchMomentTimezone('date_time'),
      details: req.body.fetch('details')
    });
    var preInterviewReminder = interview.createPreInterviewReminder({
      is_enabled: req.body.fetchBoolean('pre_interview_reminder_enabled'),
      date_time_moment: req.body.fetchMomentTimezone('pre_interview_reminder')
    });
    var postInterviewReminder = interview.createPostInterviewReminder({
      is_enabled: req.body.fetchBoolean('post_interview_reminder_enabled'),
      date_time_moment: req.body.fetchMomentTimezone('post_interview_reminder')
    });
    // DEV: We set up relationships for any validation hooks
    // DEV: We are using `setDataValue` as `set` requires `include` to be passed in options
    // DEV: We use `.application` for `interview.application` as we get recursion otherwise
    application.setDataValue('interviews', [interview]);
    interview.application = application;
    preInterviewReminder.setDataValue('interview', interview);
    postInterviewReminder.setDataValue('interview', interview);
    var modelsToSave = [application, interview, preInterviewReminder, postInterviewReminder];

    // Update application to handle status changes
    modelsToSave = _.union(modelsToSave,
      application.updateToInterviewChanges(req));

    // Save our changes
    saveModelsViaCandidate({
      models: modelsToSave,
      candidate: req.candidate
    }, next);
  },
  function interviewAddSaveError (err, req, res, next) {
    // If we have an error and it's a validation error, re-render with it
    if (err instanceof Sequelize.ValidationError) {
      res.status(400).render('interview-add-show.jade', {
        form_data: req.body,
        validation_errors: err.errors
      });
      return;
    }

    // Otherwise, callback with our error
    return next(err);
  },
  function interviewAddSaveSuccess (req, res, next) {
    var application = req.models.selectedApplication;
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Interview saved');
    res.redirect(application.get('url'));
  }
]));

app.get('/interview/:id', _.flatten([
  ensureLoggedIn,
  resolveInterviewById({nav: true}),
  function interviewEditShow (req, res, next) {
    // Record our application as recently viewed
    var selectedApplication = req.models.selectedInterview.get('application');
    assert(selectedApplication);
    req.addRecentlyViewedApplication(selectedApplication);

    // Render our content
    res.render('interview-edit-show.jade', {
      selectedApplication: selectedApplication
    });
  }
]));
app.post('/interview/:id', _.flatten([
  ensureLoggedIn,
  // DEV: We include nav in case of a validation error
  resolveInterviewById({nav: true}),
  function interviewEditSave (req, res, next) {
    var mockInterview = req.models.selectedInterview;
    // TODO: Update applicaiton status if interview is upcoming
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Changes saved');
    res.redirect(mockInterview.get('url'));
  }
]));

app.post('/interview/:id/delete', _.flatten([
  ensureLoggedIn,
  // DEV: We don't include as a nav as this is an action only
  resolveInterviewById({nav: false}),
  function interviewDeleteSave (req, res, next) {
    var mockInterview = req.models.selectedInterview;
    var mockApplication = mockInterview.get('application');
    assert(mockApplication);
    // TODO: Update applicaiton status if interview was upcoming
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Interview deleted');
    res.redirect(mockApplication.get('url'));
  }
]));
