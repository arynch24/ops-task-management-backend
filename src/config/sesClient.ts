import AWS from "aws-sdk";
import dotenv from "dotenv";

dotenv.config();

const ses = new AWS.SES({
    region: process.env.AWS_REGION!,             // e.g. "us-east-1"
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!, // from IAM user
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
});

export default ses;
