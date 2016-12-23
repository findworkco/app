// Export company mock data resolver
exports.getByName = function (companyName, extendedResults) {
  // Create container for company info
  var retVal = {};

  // If there is no company name, return early
  if (!companyName) {
    return {};
  }

  // Save Glassdoor info
  retVal.glassdoorResult = {
    _serializeExempt: true,

    id: 12345,
    name: 'IBM',
    website: 'www.ibm.com',
    industry: null,
    overall_rating: '0.0/5.0 (20 ratings)',
    ceo_review: '0% approve, 0% disapprove (0 ratings)',
    glassdoor_url: 'http://glassdoor.com/ibm',

    // Used on standalone page
    culture_and_values_rating: '0.0/5.0',
    senior_leadership_rating: '0.0/5.0',
    compensation_and_benefits_rating: '0.0/5.0',
    career_opportunities_rating: '0.0/5.0',
    work_life_balance_rating: '0.0/5.0'
  };
  // Form: https://docs.google.com/a/findwork.co/forms/d/1b_pmseT_J0bG_9vK-CA7XGJTy-IOMDq0MvrXGREN4k8/edit
  // DEV: URL resolved by taking form from email and verifying that GET works as well as POST
  retVal.glassdoorResult.badMatchUrl = 'https://docs.google.com/' +
    'a/findwork.co/forms/d/1b_pmseT_J0bG_9vK-CA7XGJTy-IOMDq0MvrXGREN4k8/formResponse' +
    '?entry.1562009024=' + encodeURIComponent(companyName) +
    '&entry.978071742=' + encodeURIComponent(retVal.glassdoorResult.id);

  // Save AngelList info
  retVal.angelListResult = {
    _serializeExempt: true,

    id: 67890,
    name: 'AngelList',
    website: 'http://angel.co',
    followers: 2849,
    locations: 'San Francisco',
    markets: 'Startups, Venture Capital',
    angellist_url: 'http://angel.co/angellist',

    // Used on standalone page
    blog_url: 'http://blog.angel.co',
    twitter_url: 'http://twitter.com/angellist',
    video_url: null // N/A
  };
  // Form: https://docs.google.com/a/findwork.co/forms/d/1wDWEkLwGXmWOU5GMz4wMz-sKONrVNyrFLKZVnpfMrfk/edit
  retVal.angelListResult.badMatchUrl = 'https://docs.google.com/' +
    'a/findwork.co/forms/d/1wDWEkLwGXmWOU5GMz4wMz-sKONrVNyrFLKZVnpfMrfk/formResponse' +
    '?entry.1562009024=' + encodeURIComponent(companyName) +
    '&entry.978071742=' + encodeURIComponent(retVal.angelListResult.id);
  if (extendedResults === true) {
    // DEV: Pulled fundraising via GET /startups?filter=raising
    retVal.angelListResult.public_fundraising = [
      {name: 'Series B', content: '$24M ($150M valuation) on Sep 22, 2013'},
      {name: 'Series A', content: null} // Details unknown
    ];
  }

  // Return our data
  return retVal;
};

