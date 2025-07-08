# Quick VS Code Azure Setup

This is a streamlined guide for setting up Azure services using VS Code extensions.

## 🚀 Quick Start

### 1. Install VS Code Azure Extensions

```bash
# Install Azure Tools extension pack
code --install-extension ms-vscode.vscode-node-azure-pack
```

Or manually in VS Code:
- Extensions (Ctrl+Shift+X) → Search "Azure Tools" → Install

### 2. Sign in to Azure

1. `Ctrl+Shift+P` → `Azure: Sign In`
2. Complete browser authentication
3. Verify Azure panel shows your subscription

### 3. Create Resources Visually

#### Resource Group:
1. Azure Panel → Right-click subscription → `Create Resource Group`
2. Name: `file-analysis-rg`, Location: `East US`

#### Storage Account:
1. Azure Panel → Storage Accounts → `+` 
2. Resource Group: `file-analysis-rg`
3. Name: `fileanalysis[random]` (globally unique)
4. Create blob container: `file-uploads`

#### Azure OpenAI:
1. Azure Portal → Create OpenAI resource
2. Deploy GPT-4 model in Azure OpenAI Studio
3. Copy endpoint and API key

#### Azure AD App:
1. Azure Portal → Azure AD → App registrations
2. New registration: `file-analysis-app`
3. Redirect URI: `http://localhost:3000/auth/callback`
4. Create client secret
5. Add Microsoft Graph permissions

### 4. Configure Application

Create `.env` file with your Azure credentials:

```bash
# Get these from Azure Portal/VS Code
AZURE_STORAGE_ACCOUNT_NAME=your-storage-name
AZURE_STORAGE_ACCOUNT_KEY=your-storage-key
AZURE_STORAGE_CONTAINER_NAME=file-uploads

AZURE_CLIENT_ID=your-app-id
AZURE_CLIENT_SECRET=your-client-secret  
AZURE_TENANT_ID=your-tenant-id
AZURE_REDIRECT_URI=http://localhost:3000/auth/callback

AZURE_OPENAI_ENDPOINT=your-openai-endpoint
AZURE_OPENAI_API_KEY=your-openai-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

PORT=5000
NODE_ENV=development
SESSION_SECRET=random-secret-key
FRONTEND_URL=http://localhost:3000
```

### 5. Run Application

```bash
az login  # Authenticate for Azure MCP
npm run install-all
npm run dev-with-azure-mcp
npm run client  # In another terminal
```

## 🎯 Benefits of VS Code Method

- **Visual interface** - See all resources in sidebar
- **Right-click actions** - Easy resource management  
- **IntelliSense** - Azure SDK autocomplete
- **Integrated deployment** - Deploy directly from VS Code
- **Real-time monitoring** - View logs and metrics

For detailed instructions, see [Complete VS Code Setup Guide](AZURE_SETUP_VSCODE.md).