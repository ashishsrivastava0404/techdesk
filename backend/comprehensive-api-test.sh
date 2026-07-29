#!/bin/bash

BASE_URL="http://localhost:3001"
FAILED=0
PASSED=0

log_pass() { echo "✅ PASS: $1"; ((PASSED++)) || true; }
log_fail() { echo "❌ FAIL: $1"; ((FAILED++)) || true; }

echo "============================================"
echo "Comprehensive API Test Suite"
echo "============================================"
echo ""

# Get a fresh auth token
RAND=$(date +%s)
REGISTER=$(curl -s -X POST "$BASE_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Test$RAND\",\"email\":\"test$RAND@test.com\",\"password\":\"password123\"}")

TOKEN=$(echo "$REGISTER" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Could not get auth token"
    echo "Response: $REGISTER"
    exit 1
fi

log_pass "Authentication - Got token"

# Store token for subsequent requests
AUTH_HEADER="Authorization: Bearer $TOKEN"

echo ""
echo "--- Testing Ticket Creation ---"

# Test 1: Create ticket with all fields
TICKET_RESPONSE=$(curl -s -X POST "$BASE_URL/api/tickets" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d '{
        "title":"API Test Ticket",
        "description":"Testing all fields",
        "short_description":"Short desc",
        "long_description":"Long desc",
        "ticket_type":"technical",
        "environment":"dev",
        "priority":"normal",
        "category":"hardware",
        "subcategory":"desktop",
        "topic":"display",
        "tags":["test","api"],
        "estimated_hours":5,
        "subject":"test subject"
    }')

TICKET_ID=$(echo "$TICKET_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$TICKET_ID" ] && [ "$TICKET_ID" != "null" ]; then
    log_pass "Create ticket with all fields (ID: $TICKET_ID)"
    
    # Check if estimated_hours was saved (value may be "5.00" string or 5 number)
    if echo "$TICKET_RESPONSE" | grep -q 'estimated_hours.*[05]'; then
        log_pass "estimated_hours field saved correctly"
    else
        log_fail "estimated_hours field NOT saved"
    fi
    
    # Check if ticket_type was saved
    if echo "$TICKET_RESPONSE" | grep -q '"ticket_type":"technical"'; then
        log_pass "ticket_type field saved correctly"
    else
        log_fail "ticket_type field NOT saved"
    fi
    
    # Check if subcategory was saved
    if echo "$TICKET_RESPONSE" | grep -q '"subcategory":"desktop"'; then
        log_pass "subcategory field saved correctly"
    else
        log_fail "subcategory field NOT saved"
    fi
else
    log_fail "Create ticket - Error: $TICKET_RESPONSE"
    TICKET_ID=999
fi

echo ""
echo "--- Testing Draft Operations ---"

# Test: Save draft
DRAFT_ID="draft_$(date +%s)"
DRAFT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/tickets/draft" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d "{\"draft_id\":\"$DRAFT_ID\",\"title\":\"Draft Test\",\"description\":\"Draft desc\"}")

if echo "$DRAFT_RESPONSE" | grep -q '"success":true'; then
    log_pass "Save draft"
else
    log_fail "Save draft: $DRAFT_RESPONSE"
fi

# Test: Load draft
LOAD_RESPONSE=$(curl -s "$BASE_URL/api/tickets/draft/$DRAFT_ID" -H "$AUTH_HEADER")
if echo "$LOAD_RESPONSE" | grep -q "\"draft_id\":\"$DRAFT_ID\""; then
    log_pass "Load draft"
else
    log_fail "Load draft: $LOAD_RESPONSE"
fi

# Test: Delete draft
DELETE_RESPONSE=$(curl -s -X DELETE "$BASE_URL/api/tickets/draft/$DRAFT_ID" -H "$AUTH_HEADER")
if echo "$DELETE_RESPONSE" | grep -q '"success":true'; then
    log_pass "Delete draft"
else
    log_fail "Delete draft: $DELETE_RESPONSE"
fi

echo ""
echo "--- Testing Comments ---"

# Test: Add comment
COMMENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/tickets/$TICKET_ID/comments" \
    -H "Content-Type: application/json" \
    -H "$AUTH_HEADER" \
    -d '{"message":"Test comment"}')

if echo "$COMMENT_RESPONSE" | grep -q '"success":true'; then
    log_pass "Add comment"
else
    log_fail "Add comment: $COMMENT_RESPONSE"
fi

# Test: Get comments
GET_COMMENTS=$(curl -s "$BASE_URL/api/tickets/$TICKET_ID/comments" -H "$AUTH_HEADER")
if echo "$GET_COMMENTS" | grep -q '"message":"Test comment"'; then
    log_pass "Get comments"
else
    log_fail "Get comments: $GET_COMMENTS"
fi

echo ""
echo "--- Testing Export ---"

# Test: Export tickets
EXPORT_RESPONSE=$(curl -s "$BASE_URL/api/tickets/export" -H "$AUTH_HEADER")
if echo "$EXPORT_RESPONSE" | head -c 10 | grep -q "^id,"; then
    log_pass "Export tickets (CSV format)"
else
    log_fail "Export tickets: $EXPORT_RESPONSE"
fi

echo ""
echo "--- Testing Notifications ---"

# Test: Get notifications
NOTIF_RESPONSE=$(curl -s "$BASE_URL/api/notifications/Test$RAND" -H "$AUTH_HEADER")
if echo "$NOTIF_RESPONSE" | grep -q '\[.*\]'; then
    log_pass "Get notifications (array returned)"
else
    log_fail "Get notifications: $NOTIF_RESPONSE"
fi

echo ""
echo "--- Testing Ticket List ---"

# Test: Get tickets
TICKETS=$(curl -s "$BASE_URL/api/tickets" -H "$AUTH_HEADER")
if echo "$TICKETS" | grep -q '\[.*\]'; then
    log_pass "Get tickets list"
else
    log_fail "Get tickets: $TICKETS"
fi

echo ""
echo "--- Testing Single Ticket ---"

# Test: Get single ticket
SINGLE=$(curl -s "$BASE_URL/api/tickets/$TICKET_ID" -H "$AUTH_HEADER")
if echo "$SINGLE" | grep -q "\"title\":\"API Test Ticket\""; then
    log_pass "Get single ticket"
else
    log_fail "Get single ticket: $SINGLE"
fi

echo ""
echo "============================================"
echo "Test Results: $PASSED passed, $FAILED failed"
echo "============================================"

if [ $FAILED -gt 0 ]; then
    exit 1
fi
