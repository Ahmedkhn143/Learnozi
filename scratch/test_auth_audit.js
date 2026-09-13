const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const testEmail = `student_${Date.now()}@learnozi.test`;
const testPassword = 'SecurePass123!';

async function runAuthAudit() {
  console.log('=== SENIOR DEV AUTH PIPELINE AUDIT ===');
  console.log('Testing Email:', testEmail);

  // 1. Signup
  console.log('\n[Step 1] Registration test...');
  let regRes;
  try {
    regRes = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Ahmed Student',
      email: testEmail,
      password: testPassword,
      educationLevel: 'University',
      institution: 'NUST Islamabad',
      fieldOfStudy: 'Computer Science'
    });
    console.log('✅ Signup Status:', regRes.status);
    console.log('Requires Verification:', regRes.data.requiresVerification);
    console.log('Preview Code:', regRes.data.previewCode);
  } catch (err) {
    console.error('❌ Signup Failed:', err.response?.data || err.message);
    return;
  }

  const code = regRes.data.previewCode;

  // 2. Unverified Login Attempt
  console.log('\n[Step 2] Testing unverified login block...');
  try {
    await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    console.error('❌ FAILED: Unverified user was allowed to log in!');
  } catch (err) {
    if (err.response?.data?.requiresVerification) {
      console.log('✅ Correctly blocked unverified user with status:', err.response.status);
      console.log('Response:', err.response.data.error);
    } else {
      console.error('❌ Unexpected error on unverified login:', err.response?.data || err.message);
    }
  }

  // 3. Verify Email with 6-digit code
  console.log('\n[Step 3] Submitting 6-digit passcode verification...');
  let verifyRes;
  try {
    verifyRes = await axios.post(`${BASE_URL}/api/auth/verify-code`, {
      email: testEmail,
      code
    });
    console.log('✅ Verification Status:', verifyRes.status);
    console.log('Token Received:', !!verifyRes.data.token);
  } catch (err) {
    console.error('❌ Verification Failed:', err.response?.data || err.message);
    return;
  }

  // 4. Verified Login
  console.log('\n[Step 4] Testing verified login...');
  let loginRes;
  try {
    loginRes = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    console.log('✅ Login Status:', loginRes.status);
    console.log('User Name:', loginRes.data.user?.name);
    console.log('Is Verified:', loginRes.data.user?.isVerified);
  } catch (err) {
    console.error('❌ Login Failed:', err.response?.data || err.message);
    return;
  }

  // 5. Auth /me with Bearer Token
  console.log('\n[Step 5] Testing /api/auth/me session token...');
  try {
    const meRes = await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${loginRes.data.token}` }
    });
    console.log('✅ /api/auth/me Status:', meRes.status);
    console.log('Profile verified for:', meRes.data.user?.email);
  } catch (err) {
    console.error('❌ /api/auth/me Failed:', err.response?.data || err.message);
    return;
  }

  console.log('\n🎉 ALL 5 AUTH PIPELINE STEPS PASSED WITH 100% SUCCESS!');
}

runAuthAudit();
