import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import styled from 'styled-components';
import { FaCloudUploadAlt, FaSpinner } from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiService from '../services/api';

const UploadContainer = styled.div`
  background: white;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const DropzoneArea = styled.div`
  border: 2px dashed ${props => props.$isDragActive ? '#0078d4' : '#ccc'};
  border-radius: 10px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: ${props => props.$isDragActive ? '#f0f8ff' : '#fafafa'};

  &:hover {
    border-color: #0078d4;
    background: #f0f8ff;
  }
`;

const UploadIcon = styled.div`
  font-size: 3rem;
  color: #0078d4;
  margin-bottom: 15px;
`;

const UploadText = styled.p`
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 10px;
`;

const FileTypes = styled.p`
  font-size: 0.9rem;
  color: #999;
`;

const ProgressContainer = styled.div`
  margin-top: 20px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: #0078d4;
  width: ${props => props.progress}%;
  transition: width 0.3s;
`;

const ProgressText = styled.p`
  margin-top: 10px;
  color: #666;
  font-size: 0.9rem;
`;

const FileUpload = ({ onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc']
    },
    maxSize: 50 * 1024 * 1024,
    onDrop: handleFileDrop,
    disabled: uploading
  });

  async function handleFileDrop(acceptedFiles, rejectedFiles) {
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(file => 
        file.errors.map(error => error.message).join(', ')
      );
      toast.error(`File rejected: ${errors.join(', ')}`);
      return;
    }

    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploading(true);
    setProgress(0);

    try {
      const result = await apiService.uploadFile(file, (progress) => {
        setProgress(progress);
      });

      toast.success('File uploaded successfully!');
      onUploadSuccess(result.file);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }

  return (
    <UploadContainer>
      <DropzoneArea {...getRootProps()} $isDragActive={isDragActive}>
        <input {...getInputProps()} />
        <UploadIcon>
          {uploading ? <FaSpinner className="spinning" /> : <FaCloudUploadAlt />}
        </UploadIcon>
        <UploadText>
          {uploading 
            ? 'Uploading...' 
            : isDragActive 
              ? 'Drop the file here' 
              : 'Drop a file here or click to browse'
          }
        </UploadText>
        <FileTypes>
          Supported: Images, PDFs, Text files, CSV, Word documents (Max 50MB)
        </FileTypes>
      </DropzoneArea>

      {uploading && (
        <ProgressContainer>
          <ProgressBar>
            <ProgressFill progress={progress} />
          </ProgressBar>
          <ProgressText>Uploading... {progress}%</ProgressText>
        </ProgressContainer>
      )}
    </UploadContainer>
  );
};

export default FileUpload;