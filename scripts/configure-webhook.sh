#!/bin/bash

# ATF Sentinel - GitHub Webhook Configuration Script
# This script helps configure or reconfigure the GitHub webhook

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}GitHub Webhook Configuration Tool${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${YELLOW}⚠️  gcloud CLI not found. Using local configuration...${NC}\n"
    USE_GCP=false
else
    USE_GCP=true
    # Get GCP project ID
    GCP_PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
    GCP_REGION=$(gcloud config get-value compute/region 2>/dev/null || echo "us-central1")
    
    if [ -z "$GCP_PROJECT_ID" ]; then
        echo -e "${YELLOW}⚠️  GCP project not set. Using local configuration...${NC}\n"
        USE_GCP=false
    else
        echo -e "${GREEN}✅ Using GCP Project: ${GCP_PROJECT_ID}${NC}"
        echo -e "${GREEN}✅ Using Region: ${GCP_REGION}${NC}\n"
    fi
fi

# Function to get backend URL
get_backend_url() {
    if [ "$USE_GCP" = true ]; then
        BACKEND_URL=$(gcloud run services describe atf-sentinel-backend \
            --region "$GCP_REGION" \
            --format 'value(status.url)' \
            --project "$GCP_PROJECT_ID" 2>/dev/null || echo "")
        
        if [ -z "$BACKEND_URL" ]; then
            echo -e "${YELLOW}⚠️  Could not get backend URL from Cloud Run${NC}"
            echo -e "${YELLOW}   Is the service deployed?${NC}\n"
            return 1
        fi
    else
        # Local development
        BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
        echo -e "${YELLOW}⚠️  Using local backend URL: ${BACKEND_URL}${NC}"
        echo -e "${YELLOW}   Make sure your backend is running!${NC}\n"
    fi
    return 0
}

# Function to get webhook secret
get_webhook_secret() {
    if [ "$USE_GCP" = true ]; then
        WEBHOOK_SECRET=$(gcloud secrets versions access latest \
            --secret="webhook-secret" \
            --project="$GCP_PROJECT_ID" 2>/dev/null || echo "")
        
        if [ -z "$WEBHOOK_SECRET" ]; then
            echo -e "${RED}❌ Could not get webhook secret from Secret Manager${NC}"
            echo -e "${YELLOW}   Creating a new webhook secret...${NC}\n"
            
            # Generate new secret
            WEBHOOK_SECRET=$(openssl rand -hex 32)
            echo -n "$WEBHOOK_SECRET" | gcloud secrets create webhook-secret \
                --data-file=- \
                --project="$GCP_PROJECT_ID" 2>/dev/null || \
            echo -n "$WEBHOOK_SECRET" | gcloud secrets versions add webhook-secret \
                --data-file=- \
                --project="$GCP_PROJECT_ID"
            
            echo -e "${GREEN}✅ Created new webhook secret${NC}\n"
        fi
    else
        # Local development - check env var or use default
        WEBHOOK_SECRET="${WEBHOOK_SECRET:-dev-secret-change-me}"
        if [ "$WEBHOOK_SECRET" = "dev-secret-change-me" ]; then
            echo -e "${YELLOW}⚠️  Using default webhook secret for local dev${NC}"
            echo -e "${YELLOW}   Set WEBHOOK_SECRET env var for production use${NC}\n"
        fi
    fi
}

# Get backend URL
echo -e "${BLUE}Step 1: Getting Backend URL...${NC}"
if ! get_backend_url; then
    echo -e "${YELLOW}Enter your backend URL manually:${NC}"
    read -p "Backend URL: " BACKEND_URL
fi

WEBHOOK_URL="${BACKEND_URL}/webhook/github"
echo -e "${GREEN}✅ Backend URL: ${BACKEND_URL}${NC}"
echo -e "${GREEN}✅ Webhook URL: ${WEBHOOK_URL}${NC}\n"

# Get webhook secret
echo -e "${BLUE}Step 2: Getting Webhook Secret...${NC}"
get_webhook_secret
echo -e "${GREEN}✅ Webhook Secret: ${WEBHOOK_SECRET}${NC}\n"

# Test webhook endpoint
echo -e "${BLUE}Step 3: Testing Webhook Endpoint...${NC}"
if curl -s -f "${BACKEND_URL}/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend is reachable${NC}\n"
else
    echo -e "${RED}❌ Backend is not reachable at ${BACKEND_URL}${NC}"
    echo -e "${YELLOW}   Please ensure your backend is running and accessible${NC}\n"
fi

# Display configuration
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Webhook Configuration${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${GREEN}Payload URL:${NC} ${WEBHOOK_URL}"
echo -e "${GREEN}Content type:${NC} application/json"
echo -e "${GREEN}Secret:${NC} ${WEBHOOK_SECRET}"
echo -e "${GREEN}Events:${NC} Pull requests"
echo -e "${GREEN}Active:${NC} ✓\n"

# Instructions
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}GitHub Webhook Setup Instructions${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "1. Go to your GitHub repository"
echo -e "2. Navigate to: ${YELLOW}Settings → Webhooks → Add webhook${NC}"
echo -e "3. Configure the webhook with the following:"
echo -e ""
echo -e "   ${GREEN}Payload URL:${NC}"
echo -e "   ${WEBHOOK_URL}"
echo -e ""
echo -e "   ${GREEN}Content type:${NC}"
echo -e "   application/json"
echo -e ""
echo -e "   ${GREEN}Secret:${NC}"
echo -e "   ${WEBHOOK_SECRET}"
echo -e ""
echo -e "   ${GREEN}Which events would you like to trigger this webhook?${NC}"
echo -e "   Select: ${YELLOW}Let me select individual events${NC}"
echo -e "   Then check: ${YELLOW}✓ Pull requests${NC}"
echo -e ""
echo -e "   ${GREEN}Active:${NC} ✓ (checked)"
echo -e ""
echo -e "4. Click ${GREEN}Add webhook${NC}\n"

# Test webhook (optional)
echo -e "${BLUE}Step 4: Test Webhook (Optional)${NC}"
read -p "Do you want to test the webhook endpoint now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "\n${BLUE}Testing webhook endpoint...${NC}"
    
    # Create a test payload
    TEST_PAYLOAD='{"action":"opened","number":1,"repository":{"full_name":"test/repo"},"pull_request":{"user":{"login":"testuser"},"title":"Test PR","head":{"sha":"abc123","ref":"main"},"html_url":"https://github.com/test/repo/pull/1"}}'
    
    # Generate signature
    SIGNATURE=$(echo -n "$TEST_PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/^.* //')
    SIGNATURE_HEADER="sha256=${SIGNATURE}"
    
    echo -e "${YELLOW}Sending test request...${NC}"
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${WEBHOOK_URL}" \
        -H "Content-Type: application/json" \
        -H "X-Hub-Signature-256: ${SIGNATURE_HEADER}" \
        -H "X-GitHub-Event: pull_request" \
        -H "X-GitHub-Delivery: test-delivery-id" \
        -d "$TEST_PAYLOAD" 2>&1)
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        echo -e "${GREEN}✅ Webhook endpoint responded successfully (HTTP ${HTTP_CODE})${NC}"
        echo -e "${BLUE}Response:${NC}"
        echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
    else
        echo -e "${RED}❌ Webhook endpoint returned HTTP ${HTTP_CODE}${NC}"
        echo -e "${BLUE}Response:${NC}"
        echo "$BODY"
        echo -e "\n${YELLOW}Note: This might be expected if the repository is not in ALLOWED_REPOS${NC}"
    fi
fi

# Save configuration to file
CONFIG_FILE=".webhook-config"
cat > "$CONFIG_FILE" <<EOF
# GitHub Webhook Configuration
# Generated on $(date)

BACKEND_URL=${BACKEND_URL}
WEBHOOK_URL=${WEBHOOK_URL}
WEBHOOK_SECRET=${WEBHOOK_SECRET}
GCP_PROJECT_ID=${GCP_PROJECT_ID:-local}
GCP_REGION=${GCP_REGION:-local}
EOF

echo -e "\n${GREEN}✅ Configuration saved to ${CONFIG_FILE}${NC}"
echo -e "${YELLOW}⚠️  Keep this file secure - it contains your webhook secret!${NC}\n"

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ Webhook configuration complete!${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Configure the webhook in GitHub using the instructions above"
echo -e "2. Test by creating a pull request"
echo -e "3. Check webhook deliveries in GitHub: ${YELLOW}Settings → Webhooks → [Your webhook] → Recent Deliveries${NC}"
echo -e "4. View backend logs to verify webhook is being received\n"

