const sharp = require('sharp');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const csv = require('csv-parse');
const azureStorage = require('./azureStorage');
const azureMcpClient = require('./azureMcpClient');

class FileAnalysisService {
  constructor() {
    this.azureMcpClient = azureMcpClient;
    this.initializeClient();
  }

  async initializeClient() {
    try {
      await this.azureMcpClient.initialize();
      console.log('Azure MCP client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Azure MCP client:', error);
    }
  }

  async analyzeFile(fileName, query) {
    try {
      const buffer = await azureStorage.getFileBuffer(fileName);
      const fullMimeType = this.getFullMimeType(fileName);
      const simpleMimeType = this.getMimeType(fileName);
      
      if (simpleMimeType === 'image') {
        const base64Image = buffer.toString('base64');
        return await this.azureMcpClient.analyzeImage(base64Image, query);
      }
      
      let extractedContent = '';
      
      switch (simpleMimeType) {
        case 'pdf':
          extractedContent = await this.extractPdfText(buffer);
          break;
        case 'text':
          extractedContent = buffer.toString('utf-8');
          break;
        case 'csv':
          extractedContent = await this.extractCsvData(buffer);
          break;
        case 'docx':
          extractedContent = await this.extractDocxText(buffer);
          break;
        default:
          throw new Error('Unsupported file type');
      }

      return await this.azureMcpClient.analyzeFile(extractedContent, fileName, fullMimeType, query);
    } catch (error) {
      console.error('Error analyzing file:', error);
      throw new Error('Failed to analyze file');
    }
  }

  async analyzeMultipleFiles(fileNames, query) {
    try {
      const fileContents = [];
      
      for (const fileName of fileNames) {
        try {
          const buffer = await azureStorage.getFileBuffer(fileName);
          const simpleMimeType = this.getMimeType(fileName);
          
          let extractedContent = '';
          
          if (simpleMimeType === 'image') {
            extractedContent = `[Image: ${fileName.split('/').pop()}]`;
          } else {
            switch (simpleMimeType) {
              case 'pdf':
                extractedContent = await this.extractPdfText(buffer);
                break;
              case 'text':
                extractedContent = buffer.toString('utf-8');
                break;
              case 'csv':
                extractedContent = await this.extractCsvData(buffer);
                break;
              case 'docx':
                extractedContent = await this.extractDocxText(buffer);
                break;
              default:
                extractedContent = `[Unsupported file type: ${fileName.split('/').pop()}]`;
            }
          }
          
          fileContents.push({
            fileName: fileName.split('/').pop(),
            fullPath: fileName,
            content: extractedContent,
            type: simpleMimeType
          });
        } catch (fileError) {
          console.error(`Error processing file ${fileName}:`, fileError);
          // Add a placeholder for failed files so analysis can continue
          fileContents.push({
            fileName: fileName.split('/').pop(),
            fullPath: fileName,
            content: `[Error processing file: ${fileError.message}]`,
            type: 'error'
          });
        }
      }

      return await this.azureMcpClient.analyzeMultipleFiles(fileContents, query);
    } catch (error) {
      console.error('Error analyzing multiple files:', error);
      console.error('Error stack:', error.stack);
      throw new Error(`Failed to analyze multiple files: ${error.message}`);
    }
  }

  async analyzeImage(buffer, query) {
    try {
      const base64Image = buffer.toString('base64');
      return await this.azureMcpClient.analyzeImage(base64Image, query);
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error('Failed to analyze image');
    }
  }

  async extractPdfText(buffer) {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      throw new Error('Failed to extract PDF text');
    }
  }

  async extractDocxText(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      console.error('Error extracting DOCX text:', error);
      throw new Error('Failed to extract DOCX text');
    }
  }

  async extractCsvData(buffer) {
    return new Promise((resolve) => {
      const output = [];
      const parser = csv.parse({
        columns: true,
        skip_empty_lines: true,
        relaxColumnCount: true, // Allow records with different column counts
        skipRecordsWithError: true // Skip malformed records instead of failing
      });

      parser.on('readable', function() {
        let record;
        while (record = parser.read()) {
          output.push(record);
        }
      });

      parser.on('error', function(err) {
        console.warn('CSV parsing error (continuing with partial data):', err.message);
        // Don't reject, just resolve with what we have
        resolve(JSON.stringify(output, null, 2));
      });

      parser.on('end', function() {
        resolve(JSON.stringify(output, null, 2));
      });

      parser.write(buffer);
      parser.end();
    });
  }

  async generateResponse(content, query, fileType) {
    try {
      return await this.azureMcpClient.analyzeFile(content, 'file', fileType, query);
    } catch (error) {
      console.error('Error generating response:', error);
      throw new Error('Failed to generate response');
    }
  }

  async summarizeFile(fileName) {
    try {
      const buffer = await azureStorage.getFileBuffer(fileName);
      const simpleMimeType = this.getMimeType(fileName);
      
      if (simpleMimeType === 'image') {
        const base64Image = buffer.toString('base64');
        return await this.azureMcpClient.analyzeImage(base64Image, 'Please provide a comprehensive summary of this image.');
      }
      
      let extractedContent = '';
      
      switch (simpleMimeType) {
        case 'pdf':
          extractedContent = await this.extractPdfText(buffer);
          break;
        case 'text':
          extractedContent = buffer.toString('utf-8');
          break;
        case 'csv':
          extractedContent = await this.extractCsvData(buffer);
          break;
        case 'docx':
          extractedContent = await this.extractDocxText(buffer);
          break;
        default:
          throw new Error('Unsupported file type');
      }

      return await this.azureMcpClient.summarizeContent(extractedContent, simpleMimeType);
    } catch (error) {
      console.error('Error summarizing file:', error);
      throw new Error('Failed to summarize file');
    }
  }

  getSystemPrompt(fileType) {
    const prompts = {
      image: 'You are an AI assistant that analyzes images. Provide detailed, accurate descriptions and answer questions about visual content.',
      pdf: 'You are an AI assistant that analyzes PDF documents. Provide summaries, extract key information, and answer questions about the document content.',
      text: 'You are an AI assistant that analyzes text files. Provide summaries, analyze content, and answer questions about the text.',
      csv: 'You are an AI assistant that analyzes CSV data. Provide data insights, statistics, and answer questions about the dataset.',
      docx: 'You are an AI assistant that analyzes Word documents. Provide summaries, extract key information, and answer questions about the document content.'
    };

    return prompts[fileType] || 'You are an AI assistant that analyzes files. Provide helpful information and answer questions about the file content.';
  }

  getMimeType(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    
    const mimeTypes = {
      'jpg': 'image',
      'jpeg': 'image',
      'png': 'image',
      'gif': 'image',
      'webp': 'image',
      'pdf': 'pdf',
      'txt': 'text',
      'csv': 'csv',
      'docx': 'docx',
      'doc': 'docx',
      'svg': 'image'
    };

    return mimeTypes[extension] || 'unknown';
  }

  getFullMimeType(fileName) {
    const extension = fileName.split('.').pop().toLowerCase();
    
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'pdf': 'application/pdf',
      'txt': 'text/plain',
      'csv': 'text/csv',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'doc': 'application/msword'
    };

    return mimeTypes[extension] || 'application/octet-stream';
  }
}

module.exports = new FileAnalysisService();