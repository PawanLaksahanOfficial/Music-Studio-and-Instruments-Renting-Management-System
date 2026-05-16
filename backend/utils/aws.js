const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
});

// const sns = new AWS.SNS();
const ses = new AWS.SES();

// exports.sendSMS = async (phoneNumber, message) => {
//     try {
//         const params = {
//             Message: message,
//             PhoneNumber: phoneNumber,
//         };
//         const result = await sns.publish(params).promise();
//         console.log(`SMS sent to ${phoneNumber}: ${result.MessageId}`);
//         return result;
//     } catch (err) {
//         console.error('AWS SNS Error:', err);
//         throw err;
//     }
// };

exports.sendEmail = async (toEmail, subject, text) => {
    try {
        const params = {
            Destination: { ToAddresses: [toEmail] },
            Message: {
                Body: { Text: { Data: text } },
                Subject: { Data: subject }
            },
            Source: process.env.AWS_SES_FROM_EMAIL || 'no-reply@elvistudio.com'
        };
        const result = await ses.sendEmail(params).promise();
        console.log(`Email sent to ${toEmail}: ${result.MessageId}`);
        return result;
    } catch (err) {
        console.error('AWS SES Error:', err);
        throw err;
    }
};
