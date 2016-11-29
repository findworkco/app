// Load in our dependencies
var emailClient = require('../index').app.emailClient;
var multiline = require('multiline');

// Define email constants
var DEFAULT_FROM_EMAIL = {
  name: 'Todd Wolfson',
  address: 'todd@findwork.co'
};

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
