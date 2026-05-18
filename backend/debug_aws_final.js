require('dotenv').config();
const { sendEmail } = require('./utils/aws');

async function testEmail() {
    try {
        console.log('AWS Config:', {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID ? 'PRESENT' : 'MISSING',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ? 'PRESENT' : 'MISSING',
            region: process.env.AWS_REGION,
            fromEmail: process.env.AWS_SES_FROM_EMAIL
        });
        
        const targetEmail = process.env.AWS_SES_FROM_EMAIL || 'test@example.com';
        console.log(`Sending test email to: ${targetEmail}`);
        
        const res = await sendEmail(targetEmail, 'Test Subject from Studio Management', 'This is a test email to verify AWS SES configuration.');
        console.log('Email sent successfully:', res.MessageId);
    } catch (err) {
        console.error('Test failed:', err.message);
    }
}

testEmail();
