import speakeasy from 'speakeasy';

const secret = speakeasy.generateSecret({
  length: 20,
  name: 'MailShare Admin',
  issuer: 'MailShare'
});

console.log('BASE32 SECRET:', secret.base32);
console.log('OTP AUTH URL:', secret.otpauth_url);
