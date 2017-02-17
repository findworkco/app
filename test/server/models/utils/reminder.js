// Load in our dependencies
var expect = require('chai').expect;
var moment = require('moment-timezone');
var dbFixtures = require('../../utils/db-fixtures');
var reminderUtils = require('../../../../server/models/utils/reminder');

// Start our tests
scenario.model('A Reminder model changing to the same attributes', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  it('suggests replacing the reminder', function () {
    // Set up and assert our model's content
    var reminder = this.models[dbFixtures.REMINDER_SAVED_FOR_LATER_KEY];
    reminder.set('sent_at_moment', moment());
    expect(reminder.get('is_enabled')).to.equal(true);
    expect(reminder.get('date_time_moment').toISOString()).equal('2022-06-20T17:00:00.000Z');
    expect(reminder.get('date_time_moment').tz()).equal('US-America/Chicago');

    // Query our utility and assert
    var shouldReplaceReminder = reminderUtils.shouldReplaceReminder(reminder, {
      is_enabled: true,
      date_time_moment: moment.tz('2022-06-20T12:00:00', 'US-America/Chicago')
    });
    expect(shouldReplaceReminder).to.equal(false);
  });
});

scenario.model('A Reminder model changing to a different non-time value', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  it('suggests replacing the reminder', function () {
    // Set up and assert our model's content
    var reminder = this.models[dbFixtures.REMINDER_SAVED_FOR_LATER_KEY];
    reminder.set('sent_at_moment', moment());
    expect(reminder.get('is_enabled')).to.equal(true);

    // Query our utility and assert
    var shouldReplaceReminder = reminderUtils.shouldReplaceReminder(reminder, {
      is_enabled: false
    });
    expect(shouldReplaceReminder).to.equal(true);
  });
});

scenario.model('A Reminder model changing to a different time', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  it('suggests replacing the reminder', function () {
    // Set up and assert our model's content
    var reminder = this.models[dbFixtures.REMINDER_SAVED_FOR_LATER_KEY];
    reminder.set('sent_at_moment', moment());
    expect(reminder.get('date_time_moment').toISOString()).equal('2022-06-20T17:00:00.000Z');
    expect(reminder.get('date_time_moment').tz()).equal('US-America/Chicago');

    // Query our utility and assert
    var shouldReplaceReminder = reminderUtils.shouldReplaceReminder(reminder, {
      date_time_moment: moment.tz('2017-07-27T12:00:00', 'US-America/Chicago')
    });
    expect(shouldReplaceReminder).to.equal(true);
  });
});

scenario.model('A Reminder model changing to a different yet equivalent timezone', {
  dbFixtures: [dbFixtures.APPLICATION_SAVED_FOR_LATER, dbFixtures.DEFAULT_FIXTURES]
}, function () {
  it('suggests replacing the reminder', function () {
    // Set up and assert our model's content
    var reminder = this.models[dbFixtures.REMINDER_SAVED_FOR_LATER_KEY];
    reminder.set('sent_at_moment', moment());
    expect(reminder.get('date_time_moment').toISOString()).equal('2022-06-20T17:00:00.000Z');
    expect(reminder.get('date_time_moment').tz()).equal('US-America/Chicago');

    // Query our utility and assert
    // https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
    var shouldReplaceReminder = reminderUtils.shouldReplaceReminder(reminder, {
      date_time_moment: moment.tz('2022-06-20T12:00:00', 'CA-America/Winnipeg')
    });
    expect(shouldReplaceReminder).to.equal(true);
  });
});
