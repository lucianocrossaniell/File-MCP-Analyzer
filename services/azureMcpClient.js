const { spawn } = require('child_process');
const { DefaultAzureCredential } = require('@azure/identity');
const { AzureOpenAI } = require('openai');

class AzureMCPClient {
  constructor() {
    this.mcpProcess = null;
    this.isConnected = false;
    this.credential = new DefaultAzureCredential();
    this.openaiClient = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectDelay = 5000;
    
    // Initialize OpenAI client for direct calls when needed
    if (process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY) {
      this.openaiClient = new AzureOpenAI({
        endpoint: process.env.AZURE_OPENAI_ENDPOINT,
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-01'
      });
    }
  }

  async initialize() {
    try {
      console.log('Starting Azure MCP server...');
      
      // Start the Azure MCP server process
      this.mcpProcess = spawn('npx', [
        '@azure/mcp@latest',
        'server',
        'start'
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          // Ensure Azure credentials are available to the MCP server
          AZURE_CLIENT_ID: process.env.AZURE_CLIENT_ID,
          AZURE_CLIENT_SECRET: process.env.AZURE_CLIENT_SECRET,
          AZURE_TENANT_ID: process.env.AZURE_TENANT_ID
        }
      });

      this.setupProcessHandlers();
      
      // Wait a moment for the server to start
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      console.log('Azure MCP server started successfully');
      return true;
    } catch (error) {
      console.error('Failed to start Azure MCP server:', error);
      await this.handleConnectionError();
      throw error;
    }
  }

  setupProcessHandlers() {
    if (!this.mcpProcess) return;

    this.mcpProcess.stdout.on('data', (data) => {
      console.log(`Azure MCP Server: ${data}`);
    });

    this.mcpProcess.stderr.on('data', (data) => {
      console.error(`Azure MCP Server Error: ${data}`);
    });

    this.mcpProcess.on('error', (error) => {
      console.error('Azure MCP server process error:', error);
      this.isConnected = false;
      this.handleConnectionError();
    });

    this.mcpProcess.on('exit', (code, signal) => {
      console.log(`Azure MCP server process exited with code ${code}, signal ${signal}`);
      this.isConnected = false;
      if (code !== 0) {
        this.handleConnectionError();
      }
    });
  }

  async handleConnectionError() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect to Azure MCP server (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(async () => {
        try {
          await this.initialize();
        } catch (error) {
          console.error('Azure MCP server reconnection failed:', error);
        }
      }, this.reconnectDelay);
    } else {
      console.error('Max reconnection attempts reached. Azure MCP server will remain disconnected.');
    }
  }

  async ensureConnected() {
    if (!this.isConnected) {
      await this.initialize();
    }
    return this.isConnected;
  }

  // For now, we'll use direct Azure OpenAI calls since the Azure MCP server
  // is primarily designed for resource management, not file analysis
  async analyzeFile(fileContent, fileName, mimeType, query) {
    try {
      if (!this.openaiClient) {
        throw new Error('Azure OpenAI client not configured');
      }

      const systemPrompt = this.getSystemPrompt(mimeType);
      
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `File: ${fileName}\nContent: ${fileContent}\n\nQuestion: ${query}`
        }
      ];

      const response = await this.openaiClient.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
        messages: messages,
        max_tokens: 1500,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing file:', error);
      throw new Error('Failed to analyze file');
    }
  }

  async analyzeMultipleFiles(fileContents, query) {
    try {
      if (!this.openaiClient) {
        throw new Error('Azure OpenAI client not configured');
      }

      const systemPrompt = 'You are an AI assistant that analyzes multiple files together. Compare, contrast, and provide insights across all the provided files. When referencing specific files, mention them by name. Focus on actionable insights and key findings.';
      
      // Truncate content if too long to prevent API limits
      const maxContentLength = 8000; // Reasonable limit per file
      let combinedContent = `I have ${fileContents.length} files to analyze:\n\n`;
      
      fileContents.forEach((file, index) => {
        let content = file.content;
        if (content.length > maxContentLength) {
          content = content.substring(0, maxContentLength) + '\n... [Content truncated due to length]';
        }
        
        combinedContent += `File ${index + 1}: ${file.fileName} (${file.type})\n`;
        combinedContent += `Content: ${content}\n\n---\n\n`;
      });
      
      combinedContent += `Question: ${query}`;

      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: combinedContent
        }
      ];

      const response = await this.openaiClient.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
        messages: messages,
        max_tokens: 3000, // Increased for more detailed analysis
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing multiple files:', error);
      console.error('Error details:', error.response?.data || error.message);
      throw new Error(`Failed to analyze multiple files: ${error.message}`);
    }
  }

  async analyzeImage(base64Image, query) {
    try {
      if (!this.openaiClient) {
        throw new Error('Azure OpenAI client not configured');
      }

      const messages = [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: query || 'Please analyze this image and provide a detailed description.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ];

      const response = await this.openaiClient.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error analyzing image:', error);
      throw new Error('Failed to analyze image');
    }
  }

  async summarizeContent(content, fileType) {
    try {
      if (!this.openaiClient) {
        throw new Error('Azure OpenAI client not configured');
      }

      const systemPrompt = `You are an AI assistant that creates concise summaries. Focus on the main points, key information, and important details from ${fileType} content.`;
      
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Please provide a comprehensive summary of the following content:\n\n${content}`
        }
      ];

      const response = await this.openaiClient.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
        messages: messages,
        max_tokens: 1500,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error summarizing content:', error);
      throw new Error('Failed to summarize content');
    }
  }

  async extractData(content, fileType, dataType) {
    try {
      if (!this.openaiClient) {
        throw new Error('Azure OpenAI client not configured');
      }

      const systemPrompt = `You are an AI assistant that extracts specific data from documents. Extract ${dataType} from the ${fileType} content and format it clearly.`;
      
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Extract ${dataType} from the following content and format it in a structured way:\n\n${content}`
        }
      ];

      const response = await this.openaiClient.chat.completions.create({
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
        messages: messages,
        max_tokens: 1500,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Error extracting data:', error);
      throw new Error('Failed to extract data');
    }
  }

  getSystemPrompt(mimeType) {
    const prompts = {
      'image/': 'You are an AI assistant that analyzes images. Provide detailed, accurate descriptions and answer questions about visual content.',
      'application/pdf': 'You are an AI assistant that analyzes PDF documents. Provide summaries, extract key information, and answer questions about the document content.',
      'text/plain': 'You are an AI assistant that analyzes text files. Provide summaries, analyze content, and answer questions about the text.',
      'text/csv': 'You are an AI assistant that analyzes CSV data. Provide data insights, statistics, and answer questions about the dataset.',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'You are an AI assistant that analyzes Word documents. Provide summaries, extract key information, and answer questions about the document content.',
      'application/msword': 'You are an AI assistant that analyzes Word documents. Provide summaries, extract key information, and answer questions about the document content.'
    };

    for (const [type, prompt] of Object.entries(prompts)) {
      if (mimeType.startsWith(type)) {
        return prompt;
      }
    }

    return 'You are an AI assistant that analyzes files. Provide helpful information and answer questions about the file content.';
  }

  // Azure resource management methods (using the Azure MCP server capabilities)
  async listResourceGroups() {
    try {
      await this.ensureConnected();
      // This would integrate with the Azure MCP server for resource management
      // For now, we'll use Azure SDK directly
      console.log('Azure MCP server resource management capabilities available');
      return { message: 'Azure MCP server is running and ready for resource management' };
    } catch (error) {
      console.error('Error listing resource groups:', error);
      throw new Error('Failed to list resource groups');
    }
  }

  async getStorageAccountDetails(resourceGroupName, accountName) {
    try {
      await this.ensureConnected();
      // This would integrate with the Azure MCP server for storage management
      console.log(`Azure MCP server can manage storage account: ${accountName} in ${resourceGroupName}`);
      return { message: 'Azure MCP server storage management capabilities available' };
    } catch (error) {
      console.error('Error getting storage account details:', error);
      throw new Error('Failed to get storage account details');
    }
  }

  async disconnect() {
    if (this.mcpProcess && this.isConnected) {
      try {
        this.mcpProcess.kill('SIGTERM');
        console.log('Azure MCP server process terminated');
      } catch (error) {
        console.error('Error terminating Azure MCP server:', error);
      } finally {
        this.isConnected = false;
        this.mcpProcess = null;
      }
    }
  }

  async getServerStatus() {
    return {
      isConnected: this.isConnected,
      hasOpenAIClient: !!this.openaiClient,
      reconnectAttempts: this.reconnectAttempts,
      processRunning: this.mcpProcess && !this.mcpProcess.killed
    };
  }
}

module.exports = new AzureMCPClient();