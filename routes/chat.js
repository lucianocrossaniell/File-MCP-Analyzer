const express = require('express');
const authMiddleware = require('../middleware/auth');
const fileAnalysis = require('../services/fileAnalysis');
const azureMcpClient = require('../services/azureMcpClient');
const router = express.Router();

router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { fileName, query } = req.body;
    
    if (!fileName || !query) {
      return res.status(400).json({ message: 'File name and query are required' });
    }

    if (!fileName.startsWith(req.user.id + '/')) {
      return res.status(403).json({ message: 'Unauthorized to analyze this file' });
    }

    const response = await fileAnalysis.analyzeFile(fileName, query);
    
    res.json({
      fileName,
      query,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing file:', error);
    res.status(500).json({ message: 'Failed to analyze file' });
  }
});

router.post('/analyze-multiple', authMiddleware, async (req, res) => {
  try {
    const { fileNames, query } = req.body;
    
    if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0 || !query) {
      return res.status(400).json({ message: 'File names array and query are required' });
    }

    // Verify all files belong to the user
    for (const fileName of fileNames) {
      if (!fileName.startsWith(req.user.id + '/')) {
        return res.status(403).json({ message: 'Unauthorized to analyze one or more files' });
      }
    }

    const response = await fileAnalysis.analyzeMultipleFiles(fileNames, query);
    
    res.json({
      fileNames,
      query,
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing multiple files:', error);
    res.status(500).json({ message: 'Failed to analyze multiple files' });
  }
});

router.post('/summarize', authMiddleware, async (req, res) => {
  try {
    const { fileName } = req.body;
    
    if (!fileName) {
      return res.status(400).json({ message: 'File name is required' });
    }

    if (!fileName.startsWith(req.user.id + '/')) {
      return res.status(403).json({ message: 'Unauthorized to summarize this file' });
    }

    const response = await fileAnalysis.summarizeFile(fileName);
    
    res.json({
      fileName,
      summary: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error summarizing file:', error);
    res.status(500).json({ message: 'Failed to summarize file' });
  }
});

router.get('/mcp-status', authMiddleware, async (req, res) => {
  try {
    const status = await azureMcpClient.getServerStatus();
    res.json({
      azureMcpServer: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting MCP status:', error);
    res.status(500).json({ message: 'Failed to get MCP server status' });
  }
});

router.post('/azure-resources', authMiddleware, async (req, res) => {
  try {
    const { action, resourceGroup, accountName } = req.body;
    
    let result;
    switch (action) {
      case 'listResourceGroups':
        result = await azureMcpClient.listResourceGroups();
        break;
      case 'getStorageAccount':
        if (!resourceGroup || !accountName) {
          return res.status(400).json({ message: 'Resource group and account name are required' });
        }
        result = await azureMcpClient.getStorageAccountDetails(resourceGroup, accountName);
        break;
      default:
        return res.status(400).json({ message: 'Invalid action' });
    }
    
    res.json({
      action,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error with Azure resource operation:', error);
    res.status(500).json({ message: 'Failed to perform Azure resource operation' });
  }
});

module.exports = router;