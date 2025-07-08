import React, { useState } from 'react';
import styled from 'styled-components';
import { 
  FaFile, 
  FaImage, 
  FaFilePdf, 
  FaFileAlt, 
  FaFileCsv, 
  FaFileWord,
  FaDownload,
  FaTrash,
  FaEye,
  FaRobot,
  FaCheck,
  FaPlus
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiService from '../services/api';

const FileListContainer = styled.div`
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const FileListHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Title = styled.h3`
  color: #333;
  margin: 0;
`;

const FileCount = styled.span`
  color: #666;
  font-size: 0.9rem;
`;

const SelectionControls = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const SelectAllButton = styled.button`
  background: #f5f5f5;
  color: #666;
  border: 1px solid #e0e0e0;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: #e0e0e0;
  }
`;

const MultiAnalyzeButton = styled.button`
  background: #0078d4;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #106ebe;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

const SelectionCheckbox = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  width: 20px;
  height: 20px;
  border: 2px solid ${props => props.$isSelected ? '#0078d4' : '#ccc'};
  border-radius: 3px;
  background: ${props => props.$isSelected ? '#0078d4' : 'white'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.3s;
`;

const FileGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
`;

const FileCard = styled.div`
  border: 1px solid ${props => props.$isSelected ? '#0078d4' : '#e0e0e0'};
  border-radius: 8px;
  padding: 15px;
  transition: all 0.3s;
  cursor: pointer;
  background: ${props => props.$isSelected ? '#f0f8ff' : 'white'};
  position: relative;

  &:hover {
    border-color: #0078d4;
    box-shadow: 0 2px 8px rgba(0, 120, 212, 0.1);
  }
`;

const FileHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
`;

const FileIcon = styled.div`
  font-size: 1.5rem;
  margin-right: 10px;
  color: ${props => props.color || '#666'};
`;

const FileInfo = styled.div`
  flex: 1;
`;

const FileName = styled.div`
  font-weight: 500;
  color: #333;
  margin-bottom: 5px;
  word-break: break-all;
`;

const FileDetails = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #666;
`;

const FileActions = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const ActionButton = styled.button`
  background: ${props => props.$primary ? '#0078d4' : '#f5f5f5'};
  color: ${props => props.$primary ? 'white' : '#666'};
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.3s;

  &:hover {
    background: ${props => props.$primary ? '#106ebe' : '#e0e0e0'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
`;

const FileList = ({ files, onFileDelete, onFileAnalyze }) => {
  const [deletingFile, setDeletingFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) {
      return <FileIcon color="#4CAF50"><FaImage /></FileIcon>;
    } else if (mimeType === 'application/pdf') {
      return <FileIcon color="#f44336"><FaFilePdf /></FileIcon>;
    } else if (mimeType === 'text/csv') {
      return <FileIcon color="#4CAF50"><FaFileCsv /></FileIcon>;
    } else if (mimeType.includes('word')) {
      return <FileIcon color="#2196F3"><FaFileWord /></FileIcon>;
    } else if (mimeType === 'text/plain') {
      return <FileIcon color="#666"><FaFileAlt /></FileIcon>;
    } else {
      return <FileIcon color="#666"><FaFile /></FileIcon>;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const handleDownload = async (file) => {
    try {
      const blob = await apiService.downloadFile(file.fileName);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('File downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const handleDelete = async (file) => {
    if (!window.confirm(`Are you sure you want to delete "${file.originalName}"?`)) {
      return;
    }

    setDeletingFile(file.fileName);
    try {
      await apiService.deleteFile(file.fileName);
      onFileDelete(file.fileName);
      setSelectedFiles(prev => prev.filter(f => f.fileName !== file.fileName));
      toast.success('File deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    } finally {
      setDeletingFile(null);
    }
  };

  const handleFileSelection = (file, event) => {
    event.stopPropagation();
    setSelectedFiles(prev => {
      const isSelected = prev.some(f => f.fileName === file.fileName);
      if (isSelected) {
        return prev.filter(f => f.fileName !== file.fileName);
      } else {
        return [...prev, file];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedFiles.length === files.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles([...files]);
    }
  };

  const handleMultiAnalyze = () => {
    if (selectedFiles.length > 0) {
      onFileAnalyze(selectedFiles);
      setSelectedFiles([]);
    }
  };

  const isFileSelected = (file) => {
    return selectedFiles.some(f => f.fileName === file.fileName);
  };

  if (files.length === 0) {
    return (
      <FileListContainer>
        <FileListHeader>
          <Title>Your Files</Title>
          <FileCount>0 files</FileCount>
        </FileListHeader>
        <EmptyState>
          <FaFile style={{ fontSize: '3rem', color: '#ccc', marginBottom: '15px' }} />
          <p>No files uploaded yet. Upload your first file to get started!</p>
        </EmptyState>
      </FileListContainer>
    );
  }

  return (
    <FileListContainer>
      <FileListHeader>
        <Title>Your Files</Title>
        <SelectionControls>
          {selectedFiles.length > 0 && (
            <MultiAnalyzeButton 
              onClick={handleMultiAnalyze}
              title="Analyze selected files together"
            >
              <FaRobot />
              Analyze {selectedFiles.length} files
            </MultiAnalyzeButton>
          )}
          {files.length > 1 && (
            <SelectAllButton onClick={handleSelectAll}>
              {selectedFiles.length === files.length ? 'Deselect All' : 'Select All'}
            </SelectAllButton>
          )}
          <FileCount>{files.length} file{files.length !== 1 ? 's' : ''}</FileCount>
        </SelectionControls>
      </FileListHeader>
      
      <FileGrid>
        {files.map((file) => (
          <FileCard key={file.fileName} $isSelected={isFileSelected(file)}>
            <SelectionCheckbox 
              $isSelected={isFileSelected(file)}
              onClick={(e) => handleFileSelection(file, e)}
              title="Select for multi-file analysis"
            >
              {isFileSelected(file) && <FaCheck />}
            </SelectionCheckbox>
            
            <FileHeader>
              {getFileIcon(file.mimeType)}
              <FileInfo>
                <FileName>{file.originalName}</FileName>
              </FileInfo>
            </FileHeader>
            
            <FileDetails>
              <span>{formatFileSize(file.size)}</span>
              <span>{formatDate(file.uploadDate)}</span>
            </FileDetails>
            
            <FileActions>
              <ActionButton 
                $primary 
                onClick={() => onFileAnalyze([file])}
                title="Analyze with AI"
              >
                <FaRobot />
                Analyze
              </ActionButton>
              
              <ActionButton 
                onClick={() => handleDownload(file)}
                title="Download file"
              >
                <FaDownload />
                Download
              </ActionButton>
              
              <ActionButton 
                onClick={() => handleDelete(file)}
                disabled={deletingFile === file.fileName}
                title="Delete file"
              >
                <FaTrash />
                {deletingFile === file.fileName ? 'Deleting...' : 'Delete'}
              </ActionButton>
            </FileActions>
          </FileCard>
        ))}
      </FileGrid>
    </FileListContainer>
  );
};

export default FileList;