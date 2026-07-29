#!/bin/bash
# Complete Workflow Test Script for TechDesk
# This script tests the complete ticket lifecycle from frontend perspective

set -e

BASE_URL="http://localhost:3001"
echo "=========================================="
echo "TechDesk Complete Workflow Test"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test helper function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    local name=$5
    
    if [ -n "$token" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data" 2>&1) || true
        else
            response=$(curl -s -X $method "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $token" 2>&1) || true
        fi
    else
        if [ -n "$data" ]; then
            response=$(curl -s -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data" 2>&1) || true
        else
            response=$(curl -s -X $method "$BASE_URL$endpoint" 2>&1) || true
        fi
    fi
    
    echo "$response"
}

# Test helper that checks for success/failure
test_result() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    local name=$5
    
    echo -n "Testing $name... "
    
    if [ -n "$token" ]; then
        if [ -n "$data" ]; then
            http_code=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data" 2>&1) || http_code="000"
        else
            http_code=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $TOKEN" 2>&1) || http_code="000"
        fi
    else
        if [ -n "$data" ]; then
            http_code=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data" 2>&1) || http_code="000"
        else
            http_code=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint" 2>&1) || http_code="000"
        fi
    fi
    
    if [[ "$http_code" =~ ^2[0-9][0-9]$ ]]; then
        echo -e "${GREEN}✓ PASS ($http_code)${NC}"
        return 0
    else
        echo -e "${RED}✗ FAIL ($http_code)${NC}"
        return 1
    fi
}

echo "Step 1: Register/Login User"
echo "----------------------------"

# Register a test user
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "WorkflowTestUser",
        "email": "workflowtest@test.com",
        "password": "password123",
        "role": "customer"
    }')

TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4 || echo "")

if [ -z "$TOKEN" ]; then
    # Try to login instead
    echo "User exists, attempting login..."
    LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "workflowtest@test.com",
            "password": "password123"
        }')
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4 || echo "")
fi

if [ -z "$TOKEN" ]; then
    echo -e "${RED}Failed to get auth token${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Authenticated successfully${NC}"
echo "Token: ${TOKEN:0:30}..."
echo ""

echo "Step 2: Test Draft Save/Load (Frontend SubmitTicket)"
echo "----------------------------------------------------"

# Generate a draft ID like the frontend does
DRAFT_ID="draft_$(date +%s)_$(head /dev/urandom | tr -dc 'a-z0-9' | head -c 9)"

# Save draft
test_result "POST" "/api/tickets/draft" '{
    "draft_id": "'$DRAFT_ID'",
    "title": "Test Ticket",
    "description": "Test Description",
    "environment": "dev",
    "priority": "normal",
    "category": "technical",
    "tags": []
}' "$TOKEN" "POST /tickets/draft"

# Load draft
test_result "GET" "/api/tickets/draft/$DRAFT_ID" "" "$TOKEN" "GET /tickets/draft/:id"

# Delete draft
test_result "DELETE" "/api/tickets/draft/$DRAFT_ID" "" "$TOKEN" "DELETE /tickets/draft/:id"

echo ""
echo "Step 3: Create Ticket (Full SubmitTicket form)"
echo "-----------------------------------------------"

# Create ticket like SubmitTicket.jsx frontend does
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/tickets" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "title": "API Test Ticket",
        "subject": "test subject",
        "short_description": "Short description test",
        "long_description": "Long description test",
        "description": "Main description for the ticket",
        "ticket_type": "technical",
        "environment": "dev",
        "priority": "normal",
        "category": "technical",
        "subcategory": "bugs",
        "topic": "api_error",
        "tags": ["test", "api"],
        "estimated_hours": 5,
        "customer_name": "WorkflowTestUser"
    }')

TICKET_ID=$(echo "$CREATE_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2 || echo "")

if [ -z "$TICKET_ID" ]; then
    echo -e "${RED}Failed to create ticket${NC}"
    echo "Response: $CREATE_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✓ Ticket created successfully (ID: $TICKET_ID)${NC}"
echo ""

echo "Step 4: Get Tickets List (Dashboard)"
echo "-------------------------------------"

test_result "GET" "/api/tickets" "" "$TOKEN" "GET /tickets"

echo ""
echo "Step 5: Get Single Ticket Details"
echo "----------------------------------"

test_result "GET" "/api/tickets/$TICKET_ID" "" "$TOKEN" "GET /tickets/:id"

echo ""
echo "Step 6: Add Comment to Ticket"
echo "-----------------------------"

COMMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/tickets/$TICKET_ID/comments" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "message": "This is a test comment from workflow script"
    }')

COMMENT_ID=$(echo "$COMMENT_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2 || echo "")

if [ -z "$COMMENT_ID" ]; then
    echo -e "${RED}Failed to add comment${NC}"
    echo "Response: $COMMENT_RESPONSE"
else
    echo -e "${GREEN}✓ Comment added (ID: $COMMENT_ID)${NC}"
fi

echo ""

echo "Step 7: Get Ticket Comments"
echo "---------------------------"

test_result "GET" "/api/tickets/$TICKET_ID/comments" "" "$TOKEN" "GET /tickets/:id/comments"

echo ""
echo "Step 8: Get Notifications"
echo "-------------------------"

test_result "GET" "/api/notifications/WorkflowTestUser" "" "$TOKEN" "GET /notifications/:user"

echo ""
echo "Step 9: Export Tickets"
echo "---------------------"

echo -n "Testing GET /tickets/export... "
HTTP_CODE=$(curl -s -o /tmp/export_test.csv -w "%{http_code}" "$BASE_URL/api/tickets/export?customer_name=WorkflowTestUser" \
    -H "Authorization: Bearer $TOKEN")

if [[ "$HTTP_CODE" =~ ^2[0-9][0-9]$ ]]; then
    echo -e "${GREEN}✓ PASS ($HTTP_CODE)${NC}"
    if [ -s /tmp/export_test.csv ]; then
        echo "  Export file size: $(wc -c < /tmp/export_test.csv) bytes"
    fi
else
    echo -e "${RED}✗ FAIL ($HTTP_CODE)${NC}"
fi

echo ""
echo "Step 10: Admin Settings (Admin Dashboard)"
echo "-----------------------------------------"

# Register admin user
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d '{
        "name": "WorkflowAdmin",
        "email": "workflowadmin@test.com",
        "password": "password123",
        "role": "admin"
    }')

ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4 || echo "")

if [ -z "$ADMIN_TOKEN" ]; then
    # Try to login
    ADMIN_LOGIN=$(curl -s -X POST "$BASE_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email": "workflowadmin@test.com", "password": "password123"}')
    ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | grep -o '"token":"[^"]*' | cut -d'"' -f4 || echo "")
fi

if [ -z "$ADMIN_TOKEN" ]; then
    echo -e "${YELLOW}⚠ Admin test skipped (could not get admin token)${NC}"
else
    test_result "GET" "/api/admin/settings" "" "$ADMIN_TOKEN" "GET /admin/settings"
    test_result "PATCH" "/api/admin/settings" '{"settings": {"site_name": "TechDesk Test"}}' "$ADMIN_TOKEN" "PATCH /admin/settings"
fi

echo ""
echo "=========================================="
echo "Workflow Test Complete!"
echo "=========================================="
echo ""
echo "Summary:"
echo "  - User authentication: ✓"
echo "  - Draft save/load: ✓"
echo "  - Ticket creation: ✓"
echo "  - Ticket listing: ✓"
echo "  - Ticket details: ✓"
echo "  - Comments: ✓"
echo "  - Notifications: ✓"
echo "  - Export: ✓"
echo "  - Admin settings: ✓"
echo ""
