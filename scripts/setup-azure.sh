#!/bin/bash

# Azure Services Setup Script for File Analysis Application
# This script creates all required Azure services

set -e  # Exit on any error

echo "🚀 Setting up Azure services for File Analysis Application..."

# Configuration
LOCATION="eastus"
RESOURCE_GROUP="file-analysis-rg"
STORAGE_ACCOUNT="fileanalysis$(date +%s)"
OPENAI_ACCOUNT="file-analysis-openai"
APP_NAME="file-analysis-app"
REDIRECT_URI="http://localhost:3000/auth/callback"
KEYVAULT_NAME="file-analysis-kv-$(date +%s)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed. Please install it first:"
    echo "https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if user is logged in
if ! az account show &> /dev/null; then
    print_warning "Not logged into Azure. Please login first:"
    az login
fi

print_step "Current Azure subscription:"
az account show --query "{Name:name, ID:id, TenantId:tenantId}" --output table

read -p "Do you want to continue with this subscription? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Please set the correct subscription with: az account set --subscription <subscription-id>"
    exit 1
fi

# Create Resource Group
print_step "Creating resource group: $RESOURCE_GROUP"
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION \
  --output none
print_success "Resource group created"

# Create Storage Account
print_step "Creating storage account: $STORAGE_ACCOUNT"
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2 \
  --output none

# Create storage container
az storage container create \
  --name "file-uploads" \
  --account-name $STORAGE_ACCOUNT \
  --auth-mode login \
  --output none

# Get storage account key
STORAGE_KEY=$(az storage account keys list \
  --resource-group $RESOURCE_GROUP \
  --account-name $STORAGE_ACCOUNT \
  --query '[0].value' \
  --output tsv)

print_success "Storage account created: $STORAGE_ACCOUNT"

# Create Azure OpenAI Service
print_step "Creating Azure OpenAI service: $OPENAI_ACCOUNT"
if az cognitiveservices account create \
  --name $OPENAI_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --kind OpenAI \
  --sku S0 \
  --output none; then
  print_success "Azure OpenAI service created"
else
  print_error "Failed to create Azure OpenAI service. This might be due to:"
  print_error "1. Azure OpenAI not available in your region"
  print_error "2. Insufficient permissions"
  print_error "3. Quota limits"
  print_warning "You may need to:"
  print_warning "- Try a different region (westus2, eastus2, etc.)"
  print_warning "- Request access to Azure OpenAI service"
  print_warning "- Check your subscription limits"
  exit 1
fi

# Get OpenAI endpoint and key
OPENAI_ENDPOINT=$(az cognitiveservices account show \
  --name $OPENAI_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query properties.endpoint \
  --output tsv)

OPENAI_KEY=$(az cognitiveservices account keys list \
  --name $OPENAI_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --query key1 \
  --output tsv)

# Deploy GPT-4 model
print_step "Deploying GPT-4 model..."
if az cognitiveservices account deployment create \
  --resource-group $RESOURCE_GROUP \
  --name $OPENAI_ACCOUNT \
  --deployment-name "gpt-4" \
  --model-name "gpt-4" \
  --model-version "0613" \
  --model-format "OpenAI" \
  --scale-settings-scale-type "Standard" \
  --output none; then
  print_success "GPT-4 model deployed"
else
  print_warning "GPT-4 deployment failed. Trying GPT-3.5-Turbo instead..."
  az cognitiveservices account deployment create \
    --resource-group $RESOURCE_GROUP \
    --name $OPENAI_ACCOUNT \
    --deployment-name "gpt-35-turbo" \
    --model-name "gpt-35-turbo" \
    --model-version "0613" \
    --model-format "OpenAI" \
    --scale-settings-scale-type "Standard" \
    --output none
  print_success "GPT-3.5-Turbo model deployed (use 'gpt-35-turbo' as deployment name)"
fi

# Create Azure AD App Registration
print_step "Creating Azure AD app registration: $APP_NAME"
APP_ID=$(az ad app create \
  --display-name $APP_NAME \
  --web-redirect-uris $REDIRECT_URI \
  --query appId \
  --output tsv)

# Create service principal
az ad sp create --id $APP_ID --output none

# Create client secret
CLIENT_SECRET=$(az ad app credential reset \
  --id $APP_ID \
  --years 2 \
  --query password \
  --output tsv)

# Get tenant ID
TENANT_ID=$(az account show --query tenantId --output tsv)

print_success "Azure AD app registration created"

# Add Microsoft Graph permissions
print_step "Configuring app permissions..."
az ad app permission add \
  --id $APP_ID \
  --api 00000003-0000-0000-c000-000000000000 \
  --api-permissions e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope \
  --output none

print_warning "Admin consent required for app permissions. Run this command with Global Admin privileges:"
echo "az ad app permission admin-consent --id $APP_ID"

# Create Key Vault (optional)
read -p "Do you want to create a Key Vault for secure secret storage? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_step "Creating Key Vault: $KEYVAULT_NAME"
    az keyvault create \
      --name $KEYVAULT_NAME \
      --resource-group $RESOURCE_GROUP \
      --location $LOCATION \
      --output none

    # Store secrets in Key Vault
    az keyvault secret set --vault-name $KEYVAULT_NAME --name "StorageAccountKey" --value "$STORAGE_KEY" --output none
    az keyvault secret set --vault-name $KEYVAULT_NAME --name "OpenAIKey" --value "$OPENAI_KEY" --output none
    az keyvault secret set --vault-name $KEYVAULT_NAME --name "ClientSecret" --value "$CLIENT_SECRET" --output none
    
    print_success "Key Vault created and secrets stored"
fi

# Generate .env file
ENV_FILE=".env"
print_step "Generating $ENV_FILE file..."

cat > $ENV_FILE << EOF
# Azure Configuration - Generated by setup script
# Generated on: $(date)

# Azure Storage
AZURE_STORAGE_ACCOUNT_NAME=$STORAGE_ACCOUNT
AZURE_STORAGE_ACCOUNT_KEY=$STORAGE_KEY
AZURE_STORAGE_CONTAINER_NAME=file-uploads

# Azure AD Authentication
AZURE_CLIENT_ID=$APP_ID
AZURE_CLIENT_SECRET=$CLIENT_SECRET
AZURE_TENANT_ID=$TENANT_ID
AZURE_REDIRECT_URI=http://localhost:3000/auth/callback

# Azure OpenAI
AZURE_OPENAI_ENDPOINT=$OPENAI_ENDPOINT
AZURE_OPENAI_API_KEY=$OPENAI_KEY
AZURE_OPENAI_API_VERSION=2024-02-01
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4

# Application Configuration
PORT=5000
NODE_ENV=development
SESSION_SECRET=$(openssl rand -base64 32)
FRONTEND_URL=http://localhost:3000
EOF

print_success ".env file created with your Azure configuration"

# Display summary
echo
echo "🎉 Azure setup completed successfully!"
echo
echo "📋 Resources created:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Storage Account: $STORAGE_ACCOUNT"
echo "  OpenAI Service: $OPENAI_ACCOUNT"
echo "  App Registration: $APP_NAME"
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "  Key Vault: $KEYVAULT_NAME"
fi
echo
echo "📁 Configuration saved to: $ENV_FILE"
echo
echo "🔑 Next steps:"
echo "1. Review the generated .env file"
echo "2. Grant admin consent for app permissions (if you have Global Admin role):"
echo "   az ad app permission admin-consent --id $APP_ID"
echo "3. Install dependencies: npm run install-all"
echo "4. Authenticate with Azure: az login"
echo "5. Start the application: npm run dev-with-azure-mcp"
echo
echo "💰 Estimated monthly cost: $15-75 USD (depending on usage)"
echo
echo "🗑️  To clean up resources later:"
echo "   az group delete --name $RESOURCE_GROUP --yes --no-wait"
echo
print_success "Setup complete! 🚀"