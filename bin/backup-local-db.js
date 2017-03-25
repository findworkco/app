// Based on: https://gist.github.com/twolfson/f5d8adead6def0b55663
// Load in our dependencies
var assert = require('assert');
var fs = require('fs');
var AWS = require('aws-sdk');
var spawn = require('child_process').spawn;
var staticSecrets = require('../config/static-secrets');

// Define our constants upfront
var dbName = 'find_work';
var S3_BUCKET = 'db-backups-findworkco';

// Determine our filename (same as git tags)
// https://gist.github.com/twolfson/de1b004dd22536b8e668
//   20170312.011924.307000000.sql.gz
var timestamp = (new Date()).toISOString()
  .replace(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).(\d{3})Z$/, '$1$2$3.$4$5$6.$7000000');
var filepath = timestamp + '.sql.gz';

// Resolve our configuration info
var s3AccessKeyId = staticSecrets.staticAws.productionS3DbBackupsAccessKeyId;
var s3SecretAccessKey = staticSecrets.staticAws.productionS3DbBackupsSecretAccessKey;
assert(s3AccessKeyId);
assert(s3SecretAccessKey);

// Configure AWS credentials
// http://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-environment.html
// DEV: There's likely a better non-environment way to do this but it's not well documented
process.env.AWS_ACCESS_KEY_ID = s3AccessKeyId;
process.env.AWS_SECRET_ACCESS_KEY = s3SecretAccessKey;

// Define our S3 connection
// https://aws.amazon.com/sdk-for-node-js/
// http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
var s3 = new AWS.S3();

// Dump our database to a file so we can collect its length
// DEV: We output `stderr` to `process.stderr`
// DEV: We write to disk so S3 client can calculate `Content-Length` of final result before uploading
console.log('Dumping `pg_dump` into `gzip`');
var pgDumpChild = spawn('pg_dump', [dbName], {stdio: ['ignore', 'pipe', 'inherit']});
var gzipChild = spawn('gzip', {stdio: ['pipe', 'pipe', 'inherit']});
var writeStream = fs.createWriteStream(filepath);
pgDumpChild.stdout.pipe(gzipChild.stdin);
gzipChild.stdout.pipe(writeStream);

// When our write stream is completed
writeStream.on('finish', function handleFinish () {
  // Upload our gzip stream into S3
  // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
  console.log('Uploading "' + filepath + '" to S3');
  s3.putObject({
    Bucket: S3_BUCKET,
    Key: filepath,
    ACL: 'private',
    ContentType: 'text/plain',
    ContentEncoding: 'gzip',
    Body: fs.createReadStream(filepath)
  }, function handlePutObject (err, data) {
    // If there was an error, throw it
    if (err) {
      throw err;
    // Otherwise, log success
    } else {
      console.log('Successfully uploaded "' + filepath + '"');
    }
  });
});
