const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const azureStorage = require('../services/azureStorage');
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, text files, CSV, and Word documents are allowed.'));
    }
  }
});

router.post('/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    const fileInfo = await azureStorage.uploadFile(req.file, req.user.id);
    res.json({
      message: 'File uploaded successfully',
      file: fileInfo
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const files = await azureStorage.getUserFiles(req.user.id);
    res.json(files);
  } catch (error) {
    console.error('Error retrieving files:', error);
    res.status(500).json({ message: 'Failed to retrieve files' });
  }
});

router.delete('/:userId/:fileName', authMiddleware, async (req, res) => {
  try {
    const { userId, fileName } = req.params;
    const fullFileName = `${userId}/${fileName}`;
    
    if (!fullFileName.startsWith(req.user.id + '/')) {
      return res.status(403).json({ message: 'Unauthorized to delete this file' });
    }

    await azureStorage.deleteFile(fullFileName);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Failed to delete file' });
  }
});

router.get('/download/:userId/:fileName', authMiddleware, async (req, res) => {
  try {
    const { userId, fileName } = req.params;
    const fullFileName = `${userId}/${fileName}`;
    
    if (!fullFileName.startsWith(req.user.id + '/')) {
      return res.status(403).json({ message: 'Unauthorized to access this file' });
    }

    const buffer = await azureStorage.getFileBuffer(fullFileName);
    const originalName = fileName;
    
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${originalName}"`
    });
    
    res.send(buffer);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Failed to download file' });
  }
});

module.exports = router;