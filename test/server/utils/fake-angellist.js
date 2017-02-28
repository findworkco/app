// Load in our dependencies
var SpyServerFactory = require('spy-server');

// Generate our server and set up fixtures
// DEV: We never set up a `config` for this so no port
var fakeAngelListFactory = new SpyServerFactory({port: null});

// DEV: Requests used so far:
// Search which supports no pagination so no `per_page`
//   https://angel.co/api
//   https://angel.co/api/spec/search
// curl 'https://api.angel.co/1/search?query=ibm&type=Startup'  -H 'Authorization: Bearer ****'
//   [{id: 33218, pic: cloudfront.net..., url: 'https://angel.co/ibm', name: 'IBM', type: 'Startup}, ...]

// https://angel.co/api/spec/startups#GET_startups_%3Aid
// curl 'https://api.angel.co/1/startups/33218'  -H 'Authorization: Bearer ****'
// {id: 33218, hidden: false, community_profile: true,
//  name: 'IBM', angellist_url: 'https://angel.co/ibm',
//  logo_url: cloudfront.net, thumb_url: cloudfront.net,
//  quality: 10, product_desc: null, high_concept: null,
//  follower_count: 20449, company_url: 'http://www.ibm.com',
//  created_at: '2012-01-17T23:37:51Z', updated_at: '2012-01-17T23:37:52Z',
//  crunchbase_url, twitter_url, blog_url: null,
//  facebook_url, linkedin_url, video_url: null,
//  markets: [{
//    id: 841,
//    tag_type: 'MarketTag',
//    name: 'software',
//    display_name: 'Software',
//    angellist_url: 'https://angel.co/software'
//  }],
//  locations: [],
//  company_size: null,
//  company_type: [{
//    id: 92334,
//    tag_type: 'CompanyTypeTag',
//    name: 'incubator',
//    display_name: 'Incubator',
//    angellist_url: 'https://angel.co/incubators'
//  }],
//  status: null,
//  screenshots: [{
//    thumb: cloudfront.net,
//    original: cloudfront.net
//  }]}

// Export our factory
module.exports = fakeAngelListFactory;
