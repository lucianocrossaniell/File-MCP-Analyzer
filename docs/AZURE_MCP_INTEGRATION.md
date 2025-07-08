# Azure MCP Server Integration Guide

This document explains how the file analysis application integrates with the official Azure MCP (Model Context Protocol) server.

## Overview

The application now uses the official Azure MCP server (`@azure/mcp`) which provides:

1. **Standardized Azure Resource Access**: Direct integration with Azure services
2. **Built-in Authentication**: Uses DefaultAzureCredential for seamless Azure authentication
3. **Resource Management Tools**: Access to Azure resources through standardized MCP tools
4. **AI-Powered Analysis**: File analysis using Azure OpenAI with enhanced Azure context

## Architecture

```
Frontend → API Server → Azure MCP Client → Azure MCP Server → Azure Services
                                                              ↓
Frontend ← API Server ← Azure MCP Client ← Azure MCP Server ← Azure OpenAI
```

## Azure MCP Server Setup

### 1. Installation

The Azure MCP server is installed and managed via npm:

```bash
# Install the Azure MCP package
npm install @azure/mcp@latest

# Start the Azure MCP server
npx @azure/mcp@latest server start
```

### 2. Authentication

Azure MCP server uses `DefaultAzureCredential` which automatically handles authentication through:

- **Azure CLI**: `az login`
- **Azure PowerShell**: `Connect-AzAccount`
- **Azure Developer CLI**: `azd auth login`
- **Environment Variables**: Service principal credentials
- **Managed Identity**: When running on Azure

### 3. Required Azure Permissions

Ensure your Azure account has appropriate permissions for:
- Azure OpenAI resource access
- Storage account management (for file storage)
- Resource group read access
- Any other Azure services you plan to integrate

## Integration Components

### 1. Azure MCP Client (`services/azureMcpClient.js`)

The Azure MCP client manages:
- **Process Management**: Spawning and monitoring the Azure MCP server process
- **AI Operations**: File analysis using Azure OpenAI
- **Resource Management**: Azure resource operations through MCP tools
- **Error Handling**: Connection recovery and process monitoring

### 2. File Analysis Service (`services/fileAnalysis.js`)

Updated to use Azure MCP client for:
- **Image Analysis**: Vision-enabled analysis of uploaded images
- **Document Processing**: Text extraction and analysis from various file formats
- **Content Summarization**: AI-powered content summaries
- **Data Extraction**: Structured data extraction from files

### 3. API Endpoints

New endpoints for Azure MCP integration:

- `GET /api/chat/mcp-status`: Check Azure MCP server status
- `POST /api/chat/azure-resources`: Perform Azure resource operations

## Configuration

### Environment Variables

```bash
# Azure AD Authentication (for user authentication)
AZURE_CLIENT_ID=your-azure-client-id
AZURE_CLIENT_SECRET=your-azure-client-secret
AZURE_TENANT_ID=your-azure-tenant-id

# Azure OpenAI (for AI operations)
AZURE_OPENAI_ENDPOINT=your-openai-endpoint
AZURE_OPENAI_API_KEY=your-openai-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# Azure Storage (for file storage)
AZURE_STORAGE_ACCOUNT_NAME=your-storage-account-name
AZURE_STORAGE_ACCOUNT_KEY=your-storage-account-key
```

### Authentication Setup

Before running the application, authenticate with Azure:

```bash
# Option 1: Azure CLI
az login

# Option 2: Azure Developer CLI
azd auth login

# Option 3: Azure PowerShell
Connect-AzAccount
```

## Running the Application

### Development Mode

1. **Authenticate with Azure:**
   ```bash
   az login
   ```

2. **Start the application with Azure MCP:**
   ```bash
   npm run dev-with-azure-mcp
   ```

3. **Start the frontend:**
   ```bash
   npm run client
   ```

### Production Mode

1. **Ensure Azure authentication is configured**
2. **Build and start:**
   ```bash
   npm run build
   npm start
   ```

Note: The Azure MCP server will be automatically started by the application.

## Features Enabled by Azure MCP

### 1. Enhanced File Analysis

- **Context-Aware AI**: Azure MCP provides additional Azure context to AI operations
- **Improved Performance**: Direct integration with Azure services reduces latency
- **Better Error Handling**: Standardized error handling through MCP protocol

### 2. Azure Resource Integration

- **Resource Discovery**: List and explore Azure resources
- **Storage Management**: Enhanced integration with Azure Storage accounts
- **Monitoring**: Resource usage and health monitoring through Azure APIs

### 3. Scalability Benefits

- **Auto-scaling**: Azure MCP server can scale with Azure infrastructure
- **Load Distribution**: Multiple server instances for high availability
- **Caching**: Built-in caching for improved performance

## API Examples

### Check MCP Server Status

```javascript
// GET /api/chat/mcp-status
{
  "azureMcpServer": {
    "isConnected": true,
    "hasOpenAIClient": true,
    "reconnectAttempts": 0,
    "processRunning": true
  },
  "timestamp": "2025-01-07T10:30:00.000Z"
}
```

### Azure Resource Operations

```javascript
// POST /api/chat/azure-resources
{
  "action": "listResourceGroups"
}

// Response
{
  "action": "listResourceGroups",
  "result": {
    "message": "Azure MCP server is running and ready for resource management"
  },
  "timestamp": "2025-01-07T10:30:00.000Z"
}
```

### File Analysis with Azure Context

```javascript
// POST /api/chat/analyze
{
  "fileName": "user123/document.pdf",
  "query": "What are the key findings in this document?"
}

// Response includes Azure-enhanced analysis
{
  "fileName": "user123/document.pdf",
  "query": "What are the key findings in this document?",
  "response": "Based on the document analysis using Azure AI...",
  "timestamp": "2025-01-07T10:30:00.000Z"
}
```

## Monitoring and Troubleshooting

### Health Checks

The application provides several health check endpoints:

1. **MCP Server Status**: `/api/chat/mcp-status`
2. **Azure Connectivity**: Monitor Azure authentication status
3. **Process Health**: Check if Azure MCP server process is running

### Common Issues

1. **Authentication Failures**
   - Ensure you're logged in: `az login`
   - Check Azure permissions
   - Verify environment variables

2. **MCP Server Not Starting**
   - Check Azure MCP package installation
   - Verify Node.js version compatibility
   - Monitor server logs for detailed errors

3. **AI Operations Failing**
   - Verify Azure OpenAI credentials
   - Check Azure OpenAI deployment status
   - Monitor API rate limits

### Debug Commands

```bash
# Test Azure authentication
az account show

# Start Azure MCP server manually
npx @azure/mcp@latest server start

# Check Azure OpenAI connectivity
az cognitiveservices account list --resource-group your-rg
```

## Benefits of Azure MCP Integration

### 1. **Native Azure Integration**
- Built specifically for Azure services
- Optimized for Azure authentication patterns
- Enhanced security through Azure identity management

### 2. **Standardized Protocol**
- Consistent interface across Azure services
- Future-proof with ongoing Azure MCP development
- Easy integration with other Azure MCP-enabled tools

### 3. **Enterprise Ready**
- Built-in support for Azure enterprise features
- Compliance with Azure security standards
- Integration with Azure monitoring and logging

### 4. **Developer Experience**
- Simplified Azure service integration
- Reduced boilerplate code for Azure operations
- Consistent error handling and retry logic

## Future Enhancements

The Azure MCP integration enables future capabilities:

1. **Advanced Azure AI Services**: Integration with Azure Cognitive Services
2. **Multi-Resource Operations**: Complex operations across multiple Azure resources
3. **Enhanced Security**: Advanced authentication and authorization patterns
4. **Monitoring Integration**: Deep integration with Azure Monitor and Application Insights
5. **Cost Management**: Integration with Azure Cost Management APIs

## Migration Notes

This implementation replaces the previous generic MCP integration with:

- **Official Azure Support**: Using Microsoft's official MCP server
- **Better Authentication**: DefaultAzureCredential instead of manual token management
- **Enhanced Capabilities**: Access to Azure-specific tools and resources
- **Improved Reliability**: Enterprise-grade process management and error handling

The API remains backward compatible, ensuring existing frontend integration continues to work seamlessly.