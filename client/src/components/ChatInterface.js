import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import { FaPaperPlane, FaRobot, FaUser, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiService from '../services/api';

const ChatContainer = styled.div`
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
  border: 2px solid #0078d4;
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e0e0e0;
`;

const FileInfo = styled.div`
  flex: 1;
`;

const FileName = styled.div`
  font-weight: 500;
  color: #333;
`;

const FileType = styled.div`
  font-size: 0.8rem;
  color: #666;
`;

const ChatMessages = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const Message = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  ${props => props.$isUser && 'flex-direction: row-reverse;'}
`;

const MessageIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.$isUser ? '#0078d4' : '#f5f5f5'};
  color: ${props => props.$isUser ? 'white' : '#666'};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  flex-shrink: 0;
`;

const MessageContent = styled.div`
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  background: ${props => props.$isUser ? '#0078d4' : '#f5f5f5'};
  color: ${props => props.$isUser ? 'white' : '#333'};
  word-wrap: break-word;
  white-space: pre-wrap;
  line-height: 1.4;
`;

const MessageTime = styled.div`
  font-size: 0.7rem;
  color: #999;
  margin-top: 5px;
  ${props => props.$isUser && 'text-align: right;'}
`;

const ChatInput = styled.div`
  display: flex;
  gap: 10px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
`;

const InputField = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 25px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.3s;

  &:focus {
    border-color: #0078d4;
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  background: #0078d4;
  color: white;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: background 0.3s;

  &:hover:not(:disabled) {
    background: #106ebe;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const QuickActions = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
`;

const QuickButton = styled.button`
  background: #f5f5f5;
  color: #666;
  border: 1px solid #e0e0e0;
  padding: 8px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #e0e0e0;
    border-color: #0078d4;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ChatInterface = ({ selectedFile, onClose }) => {
  const selectedFiles = Array.isArray(selectedFile) ? selectedFile : [selectedFile];
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickQuestions = [
    'Summarize this file',
    'What are the main points?',
    'Extract key information',
    'Analyze the content'
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (message = inputValue) => {
    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: message,
      isUser: true,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      let response;
      if (selectedFiles.length === 1) {
        response = await apiService.analyzeFile(selectedFiles[0].fileName, message);
      } else {
        response = await apiService.analyzeMultipleFiles(selectedFiles.map(f => f.fileName), message);
      }
      
      const botMessage = {
        id: Date.now() + 1,
        text: response.response,
        isUser: false,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to analyze file. Please try again.');
      
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error while analyzing your file. Please try again.',
        isUser: false,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (question) => {
    handleSendMessage(question);
  };

  return (
    <ChatContainer>
      <ChatHeader>
        <FaRobot style={{ color: '#0078d4', fontSize: '1.5rem' }} />
        <FileInfo>
          <FileName>
            {selectedFiles.length === 1 
              ? `Chat about: ${selectedFiles[0].originalName}`
              : `Multi-file analysis: ${selectedFiles.length} files`
            }
          </FileName>
          <FileType>
            {selectedFiles.length === 1 
              ? `File type: ${selectedFiles[0].mimeType}`
              : `Files: ${selectedFiles.map(f => f.originalName).join(', ')}`
            }
          </FileType>
        </FileInfo>
        <button 
          onClick={onClose}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer',
            fontSize: '1.2rem',
            color: '#666'
          }}
        >
          ×
        </button>
      </ChatHeader>

      {messages.length === 0 && (
        <QuickActions>
          {quickQuestions.map((question) => (
            <QuickButton
              key={question}
              onClick={() => handleQuickAction(question)}
              disabled={isLoading}
            >
              {question}
            </QuickButton>
          ))}
        </QuickActions>
      )}

      <ChatMessages>
        {messages.map((message) => (
          <Message key={message.id} $isUser={message.isUser}>
            <MessageIcon $isUser={message.isUser}>
              {message.isUser ? <FaUser /> : <FaRobot />}
            </MessageIcon>
            <div>
              <MessageContent $isUser={message.isUser}>
                {message.text}
              </MessageContent>
              <MessageTime $isUser={message.isUser}>
                {message.timestamp}
              </MessageTime>
            </div>
          </Message>
        ))}
        
        {isLoading && (
          <Message $isUser={false}>
            <MessageIcon $isUser={false}>
              <FaSpinner className="spinning" />
            </MessageIcon>
            <MessageContent $isUser={false}>
              Analyzing your file...
            </MessageContent>
          </Message>
        )}
        
        <div ref={messagesEndRef} />
      </ChatMessages>

      <ChatInput>
        <InputField
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me anything about this file..."
          disabled={isLoading}
        />
        <SendButton
          onClick={() => handleSendMessage()}
          disabled={!inputValue.trim() || isLoading}
        >
          {isLoading ? <FaSpinner className="spinning" /> : <FaPaperPlane />}
        </SendButton>
      </ChatInput>
    </ChatContainer>
  );
};

export default ChatInterface;