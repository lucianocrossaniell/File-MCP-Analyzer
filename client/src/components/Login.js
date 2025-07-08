import React, { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { FaSignInAlt, FaFileAlt, FaRobot } from 'react-icons/fa';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`;

const LoginCard = styled.div`
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 400px;
  width: 100%;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 10px;
  font-size: 2.5rem;
`;

const Subtitle = styled.p`
  color: #666;
  margin-bottom: 30px;
  font-size: 1.1rem;
`;

const FeatureList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 30px;
  text-align: left;
`;

const Feature = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  color: #555;
`;

const LoginButton = styled.button`
  background: #0078d4;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  justify-content: center;
  transition: background 0.3s;

  &:hover {
    background: #106ebe;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #d32f2f;
  margin-top: 15px;
  padding: 10px;
  background: #ffebee;
  border-radius: 4px;
`;

const Login = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      await login();
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard>
        <Title>File Analysis App</Title>
        <Subtitle>Upload files and chat with AI about them</Subtitle>
        
        <FeatureList>
          <Feature>
            <FaFileAlt />
            <span>Upload images, PDFs, text files, and more</span>
          </Feature>
          <Feature>
            <FaRobot />
            <span>AI-powered file analysis and summaries</span>
          </Feature>
          <Feature>
            <FaSignInAlt />
            <span>Secure Azure Active Directory authentication</span>
          </Feature>
        </FeatureList>

        <LoginButton onClick={handleLogin} disabled={loading}>
          <FaSignInAlt />
          {loading ? 'Signing in...' : 'Sign in with Microsoft'}
        </LoginButton>

        {error && <ErrorMessage>{error}</ErrorMessage>}
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;