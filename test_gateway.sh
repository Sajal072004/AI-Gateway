#!/bin/bash

# ============================================
# AI Hybrid Gateway - Comprehensive Test Suite
# ============================================

# Configuration
GATEWAY_URL="https://ai-gateway-zcs0.onrender.com"  # Replace with your Render URL
ADMIN_TOKEN="test_admin_token_123"  # Replace with your admin token

# Demo user tokens
TOKEN_USERA="usr_demo_token_userA_replace_in_production"
TOKEN_USERB="usr_demo_token_userB_replace_in_production"
TOKEN_USERC="usr_demo_token_userC_replace_in_production"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASS=0
FAIL=0

echo "🧪 AI Hybrid Gateway - Test Suite"
echo "=================================="
echo "Gateway URL: $GATEWAY_URL"
echo ""

# Helper function to test endpoint
test_endpoint() {
    local test_name="$1"
    local expected_status="$2"
    shift 2
    local curl_args=("$@")
    
    echo -n "Testing: $test_name... "
    
    response=$(curl -s -w "\n%{http_code}" "${curl_args[@]}")
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" == "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        ((PASS++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $http_code)"
        echo "Response: $body"
        ((FAIL++))
        return 1
    fi
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👤 UserA Tests (Cheap Only)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# UserA - Basic cheap request
test_endpoint "UserA: Basic cheap request" "200" \
    -X POST "$GATEWAY_URL/v1/chat" \
    -H "Authorization: Bearer $TOKEN_USERA" \
    -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"user","content":"Hello!"}]}'

# UserA - Explicit cheap request
test_endpoint "UserA: Explicit cheap tier" "200" \
    -X POST "$GATEWAY_URL/v1/chat" \
    -H "Authorization: Bearer $TOKEN_USERA" \
    -H "Content-Type: application/json" \
    -d '{"tier":"cheap","messages":[{"role":"user","content":"Tell me a joke"}]}'

# UserA - Premium request (should downgrade)
test_endpoint "UserA: Premium request (downgrades to cheap)" "200" \
    -X POST "$GATEWAY_URL/v1/chat" \
    -H "Authorization: Bearer $TOKEN_USERA" \
    -H "Content-Type: application/json" \
    -d '{"tier":"premium","messages":[{"role":"user","content":"Analyze this"}]}'

# UserA - Invalid token
test_endpoint "UserA: Invalid token" "401" \
    -X POST "$GATEWAY_URL/v1/chat" \
    -H "Authorization: Bearer invalid_token_123" \
    -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"user","content":"Test"}]}'

# UserA - Missing authorization
test_endpoint "UserA: Missing authorization" "401" \
    -X POST "$GATEWAY_URL/v1/chat" \
    -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"user","content":"Test"}]}'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👤 UserB Tests (Cheap + Premium, Auto Default)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# UserB - Auto routing (short message → cheap)
test_endpoint "UserB: Auto routing - cheap (short message)" "200" \
    -X POST "$GATEWAY_URL/v1/chat" \
    -H "Authorization: Bearer $TOKEN_USERB" \
    -H "Content-Type: application/json" \
    -d '{"tier":"auto","messages":[{"role":"user","content":"Hello"}]}'

# UserB - Auto routing (keyword → premium)
test_endpoint "UserB: Auto routing - premium (keyword trigger)" "200" \
    -X POST "$GATEWAY_URL/v1/chat" \
    -H "Authorization: Bearer $TOKEN_USERB" \
    -H "Content-Type: application/json" \
    -d '{"tier":"auto","messages":[{"role":"user","content":"Please analyze this complex technical problem"}]}'

# UserB - Explicit premium
test_endpoint "UserB: Explicit premium request" "200" \
    -X POST "$GATEWAY_URL/v1/chat" \
    -H "Authorization: Bearer $TOKEN_USERB" \
    -H "Content-Type: application/json" \
    -d '{"tier":"premium","messages":[{"role":"user","content":"Explain quantum computing"}]}'

# UserB - Explicit cheap
test_endpoint "UserB: Explicit cheap request" "200" \
    -X POST "$GATEWAY_URL/v1/chat" \
    -H "Authorization: Bearer $TOKEN_USERB" \
    -H "Content-Type: application/json" \
    -d '{"tier":"cheap","messages":[{"role":"user","content":"Simple question"}]}'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👤 UserC Tests (Premium Default)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# UserC - Default premium
test_endpoint "UserC: Default premium request" "200" \
    -X POST "$GATEWAY_URL/v1/chat" \
    -H "Authorization: Bearer $TOKEN_USERC" \
    -H "Content-Type: application/json" \
    -d '{"messages":[{"role":"user","content":"Explain machine learning"}]}'

# UserC - Explicit cheap
test_endpoint "UserC: Explicit cheap request" "200" \
    -X POST "$GATEWAY_URL/v1/chat" \
    -H "Authorization: Bearer $TOKEN_USERC" \
    -H "Content-Type: application/json" \
    -d '{"tier":"cheap","messages":[{"role":"user","content":"Quick question"}]}'

# UserC - Auto routing
test_endpoint "UserC: Auto routing (keyword → premium)" "200" \
    -X POST "$GATEWAY_URL/v1/chat" \
    -H "Authorization: Bearer $TOKEN_USERC" \
    -H "Content-Type: application/json" \
    -d '{"tier":"auto","messages":[{"role":"user","content":"Analyze this comprehensive research"}]}'

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 Admin API Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Admin - List users
test_endpoint "Admin: List all users" "200" \
    "$GATEWAY_URL/admin/api/users" \
    -H "Authorization: Bearer $ADMIN_TOKEN"

# Admin - Get system policy
test_endpoint "Admin: Get system policy" "200" \
    "$GATEWAY_URL/admin/api/system" \
    -H "Authorization: Bearer $ADMIN_TOKEN"

# Admin - Get usage stats
test_endpoint "Admin: Get usage stats" "200" \
    "$GATEWAY_URL/admin/api/usage" \
    -H "Authorization: Bearer $ADMIN_TOKEN"

# Admin - Get logs
test_endpoint "Admin: Get request logs" "200" \
    "$GATEWAY_URL/admin/api/logs?limit=10" \
    -H "Authorization: Bearer $ADMIN_TOKEN"

# Admin - Create new user
echo -n "Testing: Admin: Create new user... "
response=$(curl -s -w "\n%{http_code}" \
    -X POST "$GATEWAY_URL/admin/api/users" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
        "userId":"testUser",
        "allowedTiers":["cheap","premium"],
        "defaultTier":"auto",
        "dailyTokenLimit":{"cheap":100000,"premium":50000},
        "monthlyTokenLimit":{"cheap":3000000,"premium":1500000}
    }')
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
    NEW_USER_TOKEN=$(echo "$body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "  Generated token: $NEW_USER_TOKEN"
    ((PASS++))
    
    # Test new user
    if [ -n "$NEW_USER_TOKEN" ]; then
        test_endpoint "Admin: Test newly created user" "200" \
            -X POST "$GATEWAY_URL/v1/chat" \
            -H "Authorization: Bearer $NEW_USER_TOKEN" \
            -H "Content-Type: application/json" \
            -d '{"messages":[{"role":"user","content":"Test new user"}]}'
        
        # Delete test user
        test_endpoint "Admin: Delete test user" "200" \
            -X DELETE "$GATEWAY_URL/admin/api/users/testUser?deleteUsageData=true" \
            -H "Authorization: Bearer $ADMIN_TOKEN"
        
        # Verify deletion
        test_endpoint "Admin: Verify user deleted (should fail)" "401" \
            -X POST "$GATEWAY_URL/v1/chat" \
            -H "Authorization: Bearer $NEW_USER_TOKEN" \
            -H "Content-Type: application/json" \
            -d '{"messages":[{"role":"user","content":"Test"}]}'
    fi
else
    echo -e "${RED}✗ FAIL${NC} (Expected 200, got $http_code)"
    echo "Response: $body"
    ((FAIL++))
fi

# Admin - Unauthorized access
echo -n "Testing: Admin: Unauthorized access (no token)... "
response=$(curl -s -w "\n%{http_code}" "$GATEWAY_URL/admin/api/users")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" == "401" ] || [ "$http_code" == "403" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 401 or 403, got $http_code)"
    echo "Response: $body"
    ((FAIL++))
fi

# Admin - Invalid token
echo -n "Testing: Admin: Invalid admin token... "
response=$(curl -s -w "\n%{http_code}" \
    "$GATEWAY_URL/admin/api/users" \
    -H "Authorization: Bearer invalid_admin_token")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" == "401" ] || [ "$http_code" == "403" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $http_code)"
    ((PASS++))
else
    echo -e "${RED}✗ FAIL${NC} (Expected 401 or 403, got $http_code)"
    echo "Response: $body"
    ((FAIL++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Results"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo "Total: $((PASS + FAIL))"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
