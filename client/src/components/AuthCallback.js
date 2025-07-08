import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaSpinner } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';

const CallbackContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
`;

const LoadingCard = styled.div`
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  text-align: center;
  color: #333;
`;

const LoadingIcon = styled.div`
  font-size: 3rem;
  color: #0078d4;
  margin-bottom: 20px;
`;

const LoadingText = styled.p`
  font-size: 1.1rem;
  margin-bottom: 10px;
`;

const ErrorText = styled.p`
  color: #d32f2f;
  font-size: 1rem;
`;

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { handleCallback } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get('code');
      const errorParam = searchParams.get('error');

      if (errorParam) {
        setError(`Authentication error: ${errorParam}`);
        return;
      }

      if (!code) {
        setError('No authorization code received');
        return;
      }

      try {
        await handleCallback(code);
        navigate('/dashboard');
      } catch (err) {
        console.error('Callback error:', err);
        setError('Authentication failed. Please try again.');
      }
    };

    processCallback();
  }, [searchParams, handleCallback, navigate]);

  return (
    <CallbackContainer>
      <LoadingCard>
        <LoadingIcon>
          <FaSpinner className="spinning" />
        </LoadingIcon>
        <LoadingText>
          {error ? 'Authentication Failed' : 'Signing you in...'}
        </LoadingText>
        {error && <ErrorText>{error}</ErrorText>}
      </LoadingCard>
    </CallbackContainer>
  );
};

export default AuthCallback;