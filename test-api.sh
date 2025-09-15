#!/bin/bash

# Test script for CloudEvents and Issues API

BASE_URL="http://localhost:3000"

echo "🚀 Testing CloudEvents and Issues API"
echo "====================================="

# Test 1: Create a new issue (send com.example.issue.create CloudEvent)
echo ""
echo "📝 Test 1: Creating a new issue via CloudEvent..."
ISSUE_ID=$(uuidgen 2>/dev/null || echo "test-$(date +%s)")
curl -X POST "$BASE_URL/events" \
  -H "Content-Type: application/json" \
  -d "{
    \"specversion\": \"1.0\",
    \"id\": \"$(uuidgen 2>/dev/null || echo "event-$(date +%s)")\",
    \"source\": \"/issues/$ISSUE_ID\",
    \"type\": \"com.example.issue.create\",
    \"time\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"datacontenttype\": \"application/json\",
    \"data\": {
      \"id\": \"$ISSUE_ID\",
      \"title\": \"API test issue from curl\",
      \"description\": \"This issue was created via CloudEvent API test\",
      \"status\": \"open\",
      \"priority\": \"medium\",
      \"assignee\": \"test@example.com\"
    }
  }" \
  -w "\nStatus: %{http_code}\n"

# Test 2: Get current issues (before patch)
echo ""
echo "🐛 Test 2: Getting current issues..."
curl -X GET "$BASE_URL/issues" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n"

# Test 3: Patch an issue (send com.example.issue.patch CloudEvent)
echo ""
echo "🔧 Test 3: Patching issue 123 with merge patch CloudEvent..."
curl -X POST "$BASE_URL/events" \
  -H "Content-Type: application/json" \
  -d "{
    \"specversion\": \"1.0\",
    \"id\": \"$(uuidgen 2>/dev/null || echo "patch-$(date +%s)")\",
    \"source\": \"/issues/123\",
    \"type\": \"com.example.issue.patch\",
    \"time\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"datacontenttype\": \"application/merge-patch+json\",
    \"data\": {
      \"title\": \"Updated: Login not working - URGENT\",
      \"status\": \"in_progress\",
      \"assignee\": \"alice@example.com\",
      \"priority\": \"high\"
    }
  }" \
  -w "\nStatus: %{http_code}\n"

# Test 4: Patch another issue (remove assignee via CloudEvent)
echo ""
echo "🔧 Test 4: Removing assignee from issue 456 via CloudEvent..."
curl -X POST "$BASE_URL/events" \
  -H "Content-Type: application/json" \
  -d "{
    \"specversion\": \"1.0\",
    \"id\": \"$(uuidgen 2>/dev/null || echo "patch2-$(date +%s)")\",
    \"source\": \"/issues/456\",
    \"type\": \"com.example.issue.patch\",
    \"time\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"datacontenttype\": \"application/merge-patch+json\",
    \"data\": {
      \"assignee\": null,
      \"status\": \"open\"
    }
  }" \
  -w "\nStatus: %{http_code}\n"

# Test 5: Get issues after patches
echo ""
echo "🐛 Test 5: Getting issues after patches..."
curl -X GET "$BASE_URL/issues" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n"

# Test 6: Get current CloudEvents snapshot
echo ""
echo "☁️  Test 6: Getting current CloudEvents snapshot..."
curl -X GET "$BASE_URL/cloudevents" \
  -H "Accept: application/json" \
  -w "\nStatus: %{http_code}\n"

# Test 7: Delete an issue (send com.example.issue.delete CloudEvent)
echo ""
echo "🗑️  Test 7: Deleting issue 456 via CloudEvent..."
curl -X POST "$BASE_URL/events" \
  -H "Content-Type: application/json" \
  -d "{
    \"specversion\": \"1.0\",
    \"id\": \"$(uuidgen 2>/dev/null || echo "delete-$(date +%s)")\",
    \"source\": \"/issues/456\",
    \"type\": \"com.example.issue.delete\",
    \"time\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"datacontenttype\": \"application/json\",
    \"data\": {
      \"id\": \"456\",
      \"reason\": \"test deletion\"
    }
  }" \
  -w "\nStatus: %{http_code}\n"

echo ""
echo "✅ API tests completed!"
echo ""
echo "📊 Real-time CloudEvents monitoring:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Watch the events stream at http://localhost:3000/events"
echo "3. Run this script to generate events and see them appear in real-time"
echo ""
echo "💡 Available endpoints:"
echo "   GET  /                - Web interface"
echo "   GET  /events          - SSE CloudEvents stream"
echo "   POST /events          - Send CloudEvent (create/patch/delete issues)"
echo "   GET  /cloudevents     - CloudEvents snapshot (JSON)"
echo "   GET  /issues          - Issues snapshot (JSON)"
