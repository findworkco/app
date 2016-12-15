// Load in our dependencies
var _ = require('underscore');
var HttpError = require('http-errors');
var app = require('../index.js').app;
var resolveApplicationById = require('./application').resolveApplicationById;
var ensureLoggedIn = require('../middlewares/session').ensureLoggedIn;
var resolveModelsAsLocals = require('../middlewares/models').resolveModelsAsLocals;
var applicationMockData = require('../models/application-mock-data');
var interviewMockData = require('../models/interview-mock-data');
var NOTIFICATION_TYPES = require('../utils/notifications').TYPES;

// Define common applications for redirects
var mockApplicationsByStatus = {
  SAVED_FOR_LATER: applicationMockData.getById('abcdef-intertrode-uuid'),
  WAITING_FOR_RESPONSE: applicationMockData.getById('abcdef-sky-networks-uuid'),
  UPCOMING_INTERVIEW: applicationMockData.getById('abcdef-umbrella-corp-uuid'),
  RECEIVED_OFFER: applicationMockData.getById('abcdef-black-mesa-uuid'),
  ARCHIVED: applicationMockData.getById('abcdef-monstromart-uuid')
};

// Define our controllers
function resolveInterviewById(params) {
  return [
    resolveModelsAsLocals(params, function resolveInterviewByIdFn (req) {
      return {
        selectedInterview: interviewMockData.getById(req.params.id)
      };
    }),
    // TODO: Monkey patch a `findOr404` onto `sequelize?
    function verifyInterviewFound (req, res, next) {
      // If we can't find the model, then 404
      if (req.models.selectedInterview === null) {
        return next(new HttpError.NotFound());
      }

      // Otherwise, continue
      next();
    }
  ];
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
    // var mockApplication = req.models.selectedApplication;
    var mockApplication = mockApplicationsByStatus.UPCOMING_INTERVIEW;
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Interview saved');
    res.redirect(mockApplication.url);
  }
]));

app.get('/interview/:id', _.flatten([
  ensureLoggedIn,
  resolveInterviewById({nav: true}),
  function interviewEditShow (req, res, next) {
    res.render('interview-edit-show.jade', {
      selectedApplication: req.models.selectedInterview.application
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
    res.redirect(mockInterview.url);
  }
]));

app.post('/interview/:id/delete', _.flatten([
  ensureLoggedIn,
  // DEV: We don't include as a nav as this is an action only
  resolveInterviewById({nav: false}),
  function interviewDeleteSave (req, res, next) {
    var mockInterview = req.models.selectedInterview;
    var mockApplication = mockInterview.application;
    // TODO: Update applicaiton status if interview was upcoming
    req.flash(NOTIFICATION_TYPES.SUCCESS, 'Interview deleted');
    res.redirect(mockApplication.url);
  }
]));
