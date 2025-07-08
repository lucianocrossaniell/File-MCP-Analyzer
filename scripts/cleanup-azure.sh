#!/bin/bash

# Azure Resources Cleanup Script
# This script deletes all Azure resources created for the File Analysis Application

set -e

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

echo "🗑️  Azure Resources Cleanup Script"
echo

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    print_error "Azure CLI is not installed."
    exit 1
fi

# Check if user is logged in
if ! az account show &> /dev/null; then
    print_error "Not logged into Azure. Please run 'az login' first."
    exit 1
fi

print_step "Current Azure subscription:"
az account show --query "{Name:name, ID:id}" --output table

# Get resource groups that might contain file analysis resources
print_step "Looking for file analysis related resource groups..."
RESOURCE_GROUPS=$(az group list --query "[?starts_with(name, 'file-analysis')].name" --output tsv)

if [ -z "$RESOURCE_GROUPS" ]; then
    print_warning "No file-analysis resource groups found."
    echo "If you used a different resource group name, you can delete it manually:"
    echo "az group delete --name <your-resource-group-name> --yes --no-wait"
    exit 0
fi

echo "Found resource groups:"
for rg in $RESOURCE_GROUPS; do
    echo "  - $rg"
done
echo

# List resources in each group
for RESOURCE_GROUP in $RESOURCE_GROUPS; do
    print_step "Resources in $RESOURCE_GROUP:"
    az resource list --resource-group $RESOURCE_GROUP --query "[].{Name:name, Type:type, Location:location}" --output table
    echo
done

# Confirm deletion
print_warning "This will permanently delete ALL resources in the above resource groups!"
print_warning "This action cannot be undone."
echo
read -p "Are you sure you want to delete these resource groups and all their resources? (yes/no): " -r
echo

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

# Final confirmation
read -p "Type 'DELETE' to confirm: " -r
echo

if [[ $REPLY != "DELETE" ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

# Delete resource groups
for RESOURCE_GROUP in $RESOURCE_GROUPS; do
    print_step "Deleting resource group: $RESOURCE_GROUP"
    
    if az group delete --name $RESOURCE_GROUP --yes --no-wait; then
        print_success "Deletion initiated for: $RESOURCE_GROUP"
    else
        print_error "Failed to delete: $RESOURCE_GROUP"
    fi
done

print_step "Checking for Azure AD app registrations..."

# Look for file analysis app registrations
APP_IDS=$(az ad app list --query "[?starts_with(displayName, 'file-analysis')].appId" --output tsv)

if [ ! -z "$APP_IDS" ]; then
    echo "Found Azure AD app registrations:"
    az ad app list --query "[?starts_with(displayName, 'file-analysis')].{Name:displayName, AppId:appId}" --output table
    echo
    
    read -p "Do you want to delete these app registrations? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        for APP_ID in $APP_IDS; do
            print_step "Deleting app registration: $APP_ID"
            if az ad app delete --id $APP_ID; then
                print_success "App registration deleted: $APP_ID"
            else
                print_error "Failed to delete app registration: $APP_ID"
            fi
        done
    fi
fi

echo
print_success "Cleanup process completed!"
echo
print_warning "Note: Resource group deletions are running in the background."
print_warning "It may take several minutes for all resources to be fully deleted."
echo
echo "You can check the status with:"
echo "az group list --query \"[?starts_with(name, 'file-analysis')].{Name:name, State:properties.provisioningState}\" --output table"
echo
print_success "All cleanup tasks initiated! 🗑️"