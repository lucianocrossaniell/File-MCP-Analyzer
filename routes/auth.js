const express = require('express');
const azureAuth = require('../services/azureAuth');
const router = express.Router();

router.get('/login', async (req, res) => {
  try {
    const authUrl = await azureAuth.getAuthUrl();
    res.json({ authUrl });
  } catch (error) {
    console.error('Error getting auth URL:', error);
    res.status(500).json({ message: 'Failed to get authentication URL' });
  }
});

router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({ message: 'No authorization code provided' });
    }

    const tokenResponse = await azureAuth.getTokenFromCode(code);
    const userInfo = await azureAuth.validateToken(tokenResponse.accessToken);
    
    res.json({
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      user: userInfo
    });
  } catch (error) {
    console.error('Error in auth callback:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: 'No refresh token provided' });
    }

    const tokenResponse = await azureAuth.refreshToken(refreshToken);
    const userInfo = await azureAuth.validateToken(tokenResponse.accessToken);
    
    res.json({
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
      user: userInfo
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ message: 'Failed to refresh token' });
  }
});

router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;