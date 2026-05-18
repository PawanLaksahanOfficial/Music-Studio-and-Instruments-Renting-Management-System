require('dotenv').config();
const { sendEmail } = require('./backend/utils/aws');

async function testEmail() {
    try {
        console.log('AWS Config:', {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID ? 'PRESENT' : 'MISSING',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? 'PRESENT' : 'MISSING',
            region: process.env.AWS_REGION,
            fromEmail: process.env.AWS_SES_FROM_EMAIL
        });
        
        await sendEmail('elvistudio-test@yopmail.com', 'Test Subject', 'Test Body');
        console.log('Email sent successfully');
    } catch (err) {
        console.error('Test failed:', err);
    }
}

testEmail();
