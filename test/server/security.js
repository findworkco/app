// Load in our dependencies
var expect = require('chai').expect;
var expressRequest = require('express/lib/request');
var httpUtils = require('./utils/http');
var serverUtils = require('./utils/server');
var sinonUtils = require('../utils/sinon');

// Start our tests
scenario('An HTTP request to our server (security)', {
  dbFixtures: null,
  // DEV: We require analytics for inline scripts
  serveAnalytics: true
}, function () {
  // Mock our request as secure and make our request
  sinonUtils.stub(expressRequest, 'secure', {
    get: function () { return true; }
  });
  httpUtils.save({url: serverUtils.getUrl('/'), expectedStatusCode: 200});

  it('receives a Content-Security-Policy aware response', function () {
    // Domain-based CSP
    expect(this.res.headers).to.have.property('content-security-policy');
    expect(this.res.headers).to.have.property('x-content-security-policy');
    expect(this.res.headers).to.have.property('x-webkit-csp');
    var cspHeader = this.res.headers['content-security-policy'];
    expect(cspHeader).to.contain('script-src \'self\' cdn.ravenjs.com www.google-analytics.com \'nonce-');

    // Inline nonce CSP
    var nonceRegexp = /'nonce-([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})'/;
    expect(cspHeader).to.match(nonceRegexp);
    var nonceVal = cspHeader.match(nonceRegexp)[1];
    expect(nonceVal).to.not.equal(undefined);
    expect(this.$('script[nonce]').attr('nonce')).to.equal(nonceVal);
  });

  it('receives a generally security aware response', function () {
    // Frameguard (clickjacking)
    expect(this.res.headers).to.have.property('x-frame-options', 'DENY');

    // HTTP Strict Transport Security (requires HTTPS)
    // DEV: Note that there is no subdomains in there to prevent forcing HTTPS on a blog or similar
    expect(this.res.headers).to.have.property('strict-transport-security', 'max-age=5184000');

    // IE no open (prevent download execution on IE8 and below)
    expect(this.res.headers).to.have.property('x-download-options', 'noopen');

    // No sniff (don't allow browsers to ignore MIME type)
    expect(this.res.headers).to.have.property('x-content-type-options', 'nosniff');

    // Referrer policy (findwork.co only, not even subdomains)
    expect(this.res.headers).to.have.property('referrer-policy', 'same-origin');

    // XSS filter (weak reflective XSS safeguard)
    expect(this.res.headers).to.have.property('x-xss-protection', '1; mode=block');
  });
});
