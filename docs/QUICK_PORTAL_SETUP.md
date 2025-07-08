# Quick Azure Portal Setup

Streamlined guide for setting up Azure services via Azure Portal web interface.

## 🌐 Access Azure Portal

Go to **[portal.azure.com](https://portal.azure.com)** and sign in.

## 📋 Step-by-Step Setup

### 1. Create Resource Group
1. Search "Resource groups" → "+ Create"
2. Name: `file-analysis-rg`, Region: `East US`
3. Create

### 2. Create Storage Account  
1. Search "Storage accounts" → "+ Create"
2. Resource group: `file-analysis-rg`
3. Name: `fileanalysis[random]` (globally unique)
4. Create → Go to resource
5. **Containers** → "+ Container" → Name: `file-uploads`
6. **Access keys** → Copy storage name and key1

### 3. Create Azure OpenAI
1. Search "Azure OpenAI" → "+ Create"  
2. Resource group: `file-analysis-rg`
3. Name: `file-analysis-openai`
4. Create → **Go to Azure OpenAI Studio**
5. **Deployments** → "+ Create" → Model: `gpt-4`
6. **Keys and Endpoint** → Copy endpoint and key

### 4. Create App Registration (Auth)
1. Search "Azure Active Directory" → **App registrations**
2. "+ New registration"
3. Name: `file-analysis-app`
4. Account types: "Any organizational directory and personal Microsoft accounts"
5. Redirect URI: `Web` → `http://localhost:3000/auth/callback`
6. Register

**Configure:**
- **Certificates & secrets** → "+ New client secret" → Copy value
- **API permissions** → Add: User.Read, openid, profile, email
- **Overview** → Copy Application ID and Directory ID

## ⚙️ Configure Application

Create `.env` file:

```bash
# From Storage Account
AZURE_STORAGE_ACCOUNT_NAME=fileanalysis[your-numbers]
AZURE_STORAGE_ACCOUNT_KEY=your-storage-key
AZURE_STORAGE_CONTAINER_NAME=file-uploads

# From App Registration  
AZURE_CLIENT_ID=your-application-id
AZURE_CLIENT_SECRET=your-client-secret-value
AZURE_TENANT_ID=your-directory-id
AZURE_REDIRECT_URI=http://localhost:3000/auth/callback

# From OpenAI Service
AZURE_OPENAI_ENDPOINT=https://your-openai-name.openai.azure.com/
AZURE_OPENAI_API_KEY=your-openai-key
AZURE_OPENAI_API_VERSION=2024-02-01
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# Application Settings
PORT=5000
NODE_ENV=development
SESSION_SECRET=random-secret-string
FRONTEND_URL=http://localhost:3000
```

## ✅ Test & Run

```bash
npm run install-all
az login  # For Azure MCP authentication
npm run dev-with-azure-mcp
npm run client  # In another terminal
```

Visit `http://localhost:3000` → Sign in with Microsoft account!

## 🧹 Cleanup

When done testing:
1. **Resource groups** → `file-analysis-rg` → **Delete resource group**
2. **Azure AD** → **App registrations** → Delete your app

For detailed instructions, see [Complete Portal Setup Guide](AZURE_SETUP_PORTAL.md).