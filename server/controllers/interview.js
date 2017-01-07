// Load in our dependencies
var assert = require('assert');
var _ = require('underscore');
var app = require('../index.js').app;
var Application = require('../models/application');
var includes = require('../models/utils/includes');
var Interview = require('../models/interview');
var InterviewReminder = require('../models/interview-reminder');
var resolveApplicationById = require('./application').resolveApplicationById;
var ensureLoggedIn = require('../middlewares/session').ensureLoggedIn;
var resolveModelsAsLocals = require('../middlewares/models').resolveModelsAsLocals;
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
    // TODO: Update status if interview is upcoming
    var mockApplication = req.models.selectedApplication;
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Interview saved');
    res.redirect(mockApplication.get('url'));
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
