// Load in our dependencies
var emailClient = require('../index').app.emailClient;
var nodemailerHtmlToText = require('nodemailer-html-to-text').htmlToText;
var multiline = require('multiline');

// Define email constants
var DEFAULT_FROM_EMAIL = {
  name: 'Todd Wolfson',
  address: 'todd@findwork.co'
};

// Configure Nodemailer to use `html-to-text` plugin
// https://github.com/andris9/nodemailer-html-to-text
emailClient.use('compile', nodemailerHtmlToText());

// Define our email templates
// https://github.com/nodemailer/nodemailer/tree/v2.6.4#using-templates
exports.test = emailClient.templateSender({
  subject: 'Test email',
  text: multiline.stripIndent(function () {/*
    This is a test text email. Here is a link below:

    http://google.com/

    Test data: {{url}}
  */}),
  html: multiline.stripIndent(function () {/*
    This is a test HTML email
    <br/>
    <a href="http://google.com/">This is a test link</a>
    <br/>
    Test data: {{url}}
  */})
}, {
  from: DEFAULT_FROM_EMAIL
});

// DESIGN: We initially said to not include "If you haven't" line if candidate has no application
//   but I think redundancy is fine
exports.welcome = emailClient.templateSender({
  subject: 'Welcome to Find Work!',
  // text: Set up via `nodemailer-html-to-text`,
  html: multiline.stripIndent(function () {/*
    Hi {{email}},
    <br/>
    Thanks for signing up for Find Work!
    <br/>
    <br/>
    If you haven't began tracking your job applications, then you can get started at <a href="{{add_application_url}}">{{add_application_url}}</a>
    <br/>
    <br/>
    Have questions or ideas? Email me any time at <a href="mailto:todd@findwork.co">todd@findwork.co</a>. I will personally reply to every email.
    <br/>
    <br/>
    Best of luck on your job search!
    <br/>
    <br/>
    Sincerely,
    <br/>
    Todd Wolfson, Founder
    <br/>
    <a href="mailto:todd@findwork.co">todd@findwork.co</a>
  */})
}, {
  from: DEFAULT_FROM_EMAIL
});
