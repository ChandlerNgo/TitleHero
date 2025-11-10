const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getS3BucketName } = require('../config');
const s3 = new S3Client({ region: 'us-east-2' });

async function listFilesByPrefix(prefix) {
    const BUCKET = await getS3BucketName();
    let continuationToken;
    const allKeys = [];

    do {
        const command = new ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        });

        const response = await s3.send(command);
        const contents = response.Contents || [];
        contents.forEach(item => allKeys.push(item.Key));

        continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
    } while (continuationToken);

    return allKeys;
}

async function getObjectBuffer(key) {
    const BUCKET = await getS3BucketName();
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    const response = await s3.send(command);
    const chunks = [];
    for await (const chunk of response.Body) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

module.exports = {
    listFilesByPrefix,
    getObjectBuffer
};
