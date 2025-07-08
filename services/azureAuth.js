const msal = require('@azure/msal-node');

class AzureAuthService {
  constructor() {
    this.clientConfig = {
      auth: {
        clientId: process.env.AZURE_CLIENT_ID,
        clientSecret: process.env.AZURE_CLIENT_SECRET,
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`
      }
    };
    
    this.pca = new msal.ConfidentialClientApplication(this.clientConfig);
    this.redirectUri = process.env.AZURE_REDIRECT_URI;
  }

  getAuthUrl() {
    const authCodeUrlParameters = {
      scopes: ['user.read', 'openid', 'profile', 'email'],
      redirectUri: this.redirectUri,
      responseMode: 'query'
    };

    return this.pca.getAuthCodeUrl(authCodeUrlParameters);
  }

  async getTokenFromCode(code) {
    try {
      const tokenRequest = {
        code: code,
        scopes: ['user.read', 'openid', 'profile', 'email'],
        redirectUri: this.redirectUri,
      };

      const response = await this.pca.acquireTokenByCode(tokenRequest);
      return response;
    } catch (error) {
      console.error('Error acquiring token:', error);
      throw new Error('Failed to acquire token');
    }
  }

  async validateToken(accessToken) {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Token validation failed');
      }

      const userInfo = await response.json();
      return userInfo;
    } catch (error) {
      console.error('Error validating token:', error);
      throw new Error('Token validation failed');
    }
  }

  async refreshToken(refreshToken) {
    try {
      const refreshTokenRequest = {
        refreshToken: refreshToken,
        scopes: ['user.read', 'openid', 'profile', 'email'],
      };

      const response = await this.pca.acquireTokenByRefreshToken(refreshTokenRequest);
      return response;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh token');
    }
  }
}

module.exports = new AzureAuthService();