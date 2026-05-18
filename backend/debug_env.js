require('dotenv').config();
console.log({
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'PRESENT' : 'EMPTY',
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'PRESENT' : 'EMPTY',
    AWS_REGION: process.env.AWS_REGION || 'NOT SET'
});
