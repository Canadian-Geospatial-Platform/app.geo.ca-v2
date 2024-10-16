export const userTable = new sst.aws.Dynamo("Users", {
  fields: {
    userId: "string",
    noteId: "string"
  },
  primaryIndex: { hashKey: "userId", rangeKey: "noteId" }
});
