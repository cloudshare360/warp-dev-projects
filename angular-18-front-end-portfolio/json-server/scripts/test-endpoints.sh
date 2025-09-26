#!/bin/bash

# Portfolio JSON Server Endpoint Testing Script
# This script tests all available endpoints with sample data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3001"
TIMEOUT=10

echo -e "${BLUE}🧪 Portfolio JSON Server Endpoint Tests${NC}"
echo "========================================"

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "\n${BLUE}Testing: $description${NC}"
    echo "Method: $method"
    echo "Endpoint: $BASE_URL$endpoint"
    
    if [ "$method" = "GET" ]; then
        if curl -s --max-time $TIMEOUT --fail "$BASE_URL$endpoint" > /dev/null; then
            echo -e "${GREEN}✅ SUCCESS${NC}"
            # Show first few lines of response
            echo "Response preview:"
            curl -s --max-time $TIMEOUT "$BASE_URL$endpoint" | head -n 5
        else
            echo -e "${RED}❌ FAILED${NC}"
            return 1
        fi
    elif [ "$method" = "POST" ] && [ -n "$data" ]; then
        if curl -s --max-time $TIMEOUT --fail -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint" > /dev/null; then
            echo -e "${GREEN}✅ SUCCESS${NC}"
        else
            echo -e "${RED}❌ FAILED${NC}"
            return 1
        fi
    fi
    
    echo "----------------------------------------"
}

# Check if server is running
echo -e "${BLUE}🔍 Checking if JSON Server is running...${NC}"
if ! curl -s --max-time 5 --fail "$BASE_URL" > /dev/null; then
    echo -e "${RED}❌ JSON Server is not running at $BASE_URL${NC}"
    echo "Please start the server using: npm start"
    exit 1
fi

echo -e "${GREEN}✅ JSON Server is running${NC}"

# Test all endpoints
echo -e "\n${BLUE}🚀 Starting endpoint tests...${NC}"

# Profile endpoints
test_endpoint "GET" "/profile" "Get Profile Information"

# Experience endpoints
test_endpoint "GET" "/experience" "Get All Work Experience"
test_endpoint "GET" "/experience/1" "Get Specific Work Experience"

# Skills endpoints
test_endpoint "GET" "/skills" "Get All Skills"
test_endpoint "GET" "/skills/1" "Get Specific Skill Category"

# Projects endpoints
test_endpoint "GET" "/projects" "Get All Projects"
test_endpoint "GET" "/projects/1" "Get Specific Project"

# Education endpoints
test_endpoint "GET" "/education" "Get All Education"
test_endpoint "GET" "/education/1" "Get Specific Education"

# Certifications endpoints
test_endpoint "GET" "/certifications" "Get All Certifications"
test_endpoint "GET" "/certifications/1" "Get Specific Certification"

# Testimonials endpoints
test_endpoint "GET" "/testimonials" "Get All Testimonials"
test_endpoint "GET" "/testimonials/1" "Get Specific Testimonial"

# Contact endpoints
test_endpoint "GET" "/contact" "Get Contact Information"

# Metadata endpoint
test_endpoint "GET" "/metadata" "Get Metadata Information"

# Test query parameters
echo -e "\n${BLUE}🔍 Testing query parameters...${NC}"
test_endpoint "GET" "/experience?_sort=startDate&_order=desc" "Get Experience Sorted by Start Date"
test_endpoint "GET" "/skills?category=Programming%20Languages" "Get Skills by Category"
test_endpoint "GET" "/projects?featured=true" "Get Featured Projects Only"
test_endpoint "GET" "/certifications?active=true" "Get Active Certifications Only"

# Test pagination
echo -e "\n${BLUE}📄 Testing pagination...${NC}"
test_endpoint "GET" "/experience?_page=1&_limit=2" "Get Experience with Pagination"

# Test search functionality
echo -e "\n${BLUE}🔍 Testing search functionality...${NC}"
test_endpoint "GET" "/experience?q=Solution" "Search Experience for 'Solution'"
test_endpoint "GET" "/skills?q=JavaScript" "Search Skills for 'JavaScript'"

# Performance test
echo -e "\n${BLUE}⚡ Performance test...${NC}"
echo "Testing response time for profile endpoint..."
RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' "$BASE_URL/profile")
echo "Response time: ${RESPONSE_TIME}s"

if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
    echo -e "${GREEN}✅ Response time is good (< 1s)${NC}"
else
    echo -e "${YELLOW}⚠️  Response time is slow (> 1s)${NC}"
fi

# Summary
echo -e "\n${BLUE}📊 Test Summary${NC}"
echo "===================="
echo "Base URL: $BASE_URL"
echo "All endpoint tests completed!"
echo -e "${GREEN}✅ JSON Server is working properly${NC}"

# Health check endpoint
echo -e "\n${BLUE}🏥 Health Check${NC}"
echo "Server Status: $(curl -s --max-time 5 "$BASE_URL" > /dev/null && echo "Healthy" || echo "Unhealthy")"
echo "Database Records:"
echo "  - Profile: $(curl -s "$BASE_URL/profile" | jq -r '.name // "N/A"')"
echo "  - Experience: $(curl -s "$BASE_URL/experience" | jq '. | length') records"
echo "  - Skills: $(curl -s "$BASE_URL/skills" | jq '. | length') categories"
echo "  - Projects: $(curl -s "$BASE_URL/projects" | jq '. | length') records"
echo "  - Education: $(curl -s "$BASE_URL/education" | jq '. | length') records"
echo "  - Certifications: $(curl -s "$BASE_URL/certifications" | jq '. | length') records"
echo "  - Testimonials: $(curl -s "$BASE_URL/testimonials" | jq '. | length') records"

echo -e "\n${GREEN}🎉 All tests completed successfully!${NC}"