#!/bin/bash

# Check if Twitter credentials are provided
if [ -z "$TWITTER_APP_KEY" ] || [ -z "$TWITTER_APP_SECRET" ] || [ -z "$TWITTER_ACCESS_TOKEN" ] || [ -z "$TWITTER_ACCESS_SECRET" ]; then
  echo "Error: Twitter credentials are required. Please set these environment variables:"
  echo "  TWITTER_APP_KEY"
  echo "  TWITTER_APP_SECRET"
  echo "  TWITTER_ACCESS_TOKEN"
  echo "  TWITTER_ACCESS_SECRET"
  exit 1
fi

# Create test bot first
echo "Creating test bot..."
curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "{
    \"appKey\": \"$TWITTER_APP_KEY\",
    \"appSecret\": \"$TWITTER_APP_SECRET\",
    \"accessToken\": \"$TWITTER_ACCESS_TOKEN\",
    \"accessSecret\": \"$TWITTER_ACCESS_SECRET\"
  }" \
  http://localhost:3001/api/test-bot | jq '.'

# Run cron job every minute
echo "Starting cron simulation..."
while true; do
  echo -e "\n[$(date)] Triggering cron job..."
  curl -s -X GET \
    -H "Authorization: Bearer ArAnFEFbwsf8h05u2YL7v/PSLKX0zTcre0lLDnjqPJo=" \
    http://localhost:3001/api/cron/tweet | jq '.'
  
  echo "Waiting 60 seconds..."
  sleep 60
done 