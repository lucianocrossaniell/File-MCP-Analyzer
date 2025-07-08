import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { FaSignOutAlt, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';
import FileUpload from './FileUpload';
import FileList from './FileList';
import ChatInterface from './ChatInterface';
import apiService from '../services/api';

const DashboardContainer = styled.div`
  min-height: 100vh;
  background: #f5f5f5;
`;

const Header = styled.div`
  background: white;
  padding: 15px 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.div`
  font-size: 1.5rem;
  font-weight: bold;
  color: #0078d4;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const UserName = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
`;

const LogoutButton = styled.button`
  background: #f44336;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.3s;

  &:hover {
    background: #d32f2f;
  }
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: ${props => props.$showChat ? '400px 1fr' : '1fr'};
  gap: 20px;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  height: calc(100vh - 80px);
`;

const LeftPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow-y: auto;
`;

const RightPanel = styled.div`
  ${props => !props.$show && 'display: none;'}
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const ChatPrompt = styled.div`
  background: linear-gradient(135deg, #0078d4 0%, #106ebe 100%);
  color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  margin-bottom: 20px;
  box-shadow: 0 4px 12px rgba(0, 120, 212, 0.3);
  
  h3 {
    margin: 0 0 10px 0;
    font-size: 1.2rem;
  }
  
  p {
    margin: 0;
    opacity: 0.9;
    font-size: 0.9rem;
  }
`;

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const userFiles = await apiService.getFiles();
      setFiles(userFiles);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newFile) => {
    setFiles(prev => [newFile, ...prev]);
  };

  const handleFileDelete = (fileName) => {
    setFiles(prev => prev.filter(file => file.fileName !== fileName));
    if (selectedFile?.fileName === fileName) {
      setSelectedFile(null);
    }
  };

  const handleFileAnalyze = (files) => {
    setSelectedFile(Array.isArray(files) ? files : [files]);
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <DashboardContainer>
        <Header>
          <Logo>File Analysis App</Logo>
          <div>Loading...</div>
        </Header>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <Header>
        <Logo>File Analysis App</Logo>
        <UserInfo>
          <UserName>
            <FaUser />
            {user?.displayName || user?.mail || 'User'}
          </UserName>
          <LogoutButton onClick={handleLogout}>
            <FaSignOutAlt />
            Logout
          </LogoutButton>
        </UserInfo>
      </Header>

      <MainContent $showChat={selectedFile !== null}>
        <LeftPanel>
          <FileUpload onUploadSuccess={handleUploadSuccess} />
          <FileList
            files={files}
            onFileDelete={handleFileDelete}
            onFileAnalyze={handleFileAnalyze}
          />
        </LeftPanel>

        <RightPanel $show={selectedFile !== null}>
          {selectedFile && (
            <ChatInterface
              selectedFile={selectedFile}
              onClose={() => setSelectedFile(null)}
            />
          )}
        </RightPanel>
        
        {!selectedFile && files.length > 0 && (
          <RightPanel $show={true}>
            <ChatPrompt>
              <h3>🤖 AI Chat Ready</h3>
              <p>Select one or more files to start analyzing with AI</p>
            </ChatPrompt>
          </RightPanel>
        )}
      </MainContent>
    </DashboardContainer>
  );
};

export default Dashboard;