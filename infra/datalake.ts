let bucket = new sst.aws.Bucket("DataLake");
bucket.subscribe({
  handler: "packages/hnap-bridge/index.handler",
  timeout: "30 seconds",
  link: [bucket]
}, {
  filterPrefix: "hnap/",
  events: ["s3:ObjectCreated:*"]
});
export const dataLake = bucket 
