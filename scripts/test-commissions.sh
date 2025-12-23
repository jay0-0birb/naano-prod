#!/bin/bash

# Commission System Test Script
# This script helps you test the commission system step by step

echo "🧪 Commission System Test Script"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}⚠️  Supabase CLI not found. You'll need to run SQL manually in Supabase Dashboard.${NC}"
    echo ""
fi

echo "Step 1: Run the database migration"
echo "-----------------------------------"
echo "1. Open Supabase Dashboard → SQL Editor"
echo "2. Copy contents of: supabase/commissions-system.sql"
echo "3. Paste and run"
echo ""
read -p "Press Enter when migration is complete..."

echo ""
echo "Step 2: Get your collaboration and tracking link IDs"
echo "------------------------------------------------------"
echo "Go to your collaboration page and note:"
echo "- Collaboration ID (from URL: /dashboard/collaborations/[id])"
echo "- Tracking link hash"
echo ""
read -p "Enter Collaboration ID: " COLLAB_ID
read -p "Enter Tracking Link Hash: " TRACKING_HASH

if [ -z "$COLLAB_ID" ] || [ -z "$TRACKING_HASH" ]; then
    echo -e "${RED}❌ Collaboration ID and Tracking Hash are required${NC}"
    exit 1
fi

echo ""
echo "Step 3: Generate test revenue"
echo "-------------------------------"
echo "Choose method:"
echo "1. Via conversion API (recommended)"
echo "2. Direct database insert (quick test)"
read -p "Enter choice (1 or 2): " METHOD

if [ "$METHOD" = "1" ]; then
    echo ""
    echo "First, click your tracking link to set the cookie:"
    echo "http://localhost:3001/c/$TRACKING_HASH"
    echo ""
    read -p "Press Enter after clicking the link..."
    
    echo ""
    echo "Now simulate a conversion:"
    echo ""
    echo "curl -X POST http://localhost:3001/api/track/conversion \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"revenue\": 1000.00}'"
    echo ""
    read -p "Press Enter to run this command..."
    
    curl -X POST http://localhost:3001/api/track/conversion \
      -H "Content-Type: application/json" \
      -d '{"revenue": 1000.00}' \
      -b "naano_attribution=test-session-$(date +%s)"
    
    echo ""
    echo -e "${GREEN}✅ Conversion logged${NC}"
    
elif [ "$METHOD" = "2" ]; then
    echo ""
    echo "Run this SQL in Supabase SQL Editor:"
    echo ""
    echo "INSERT INTO link_events ("
    echo "  tracked_link_id,"
    echo "  event_type,"
    echo "  revenue_amount,"
    echo "  occurred_at,"
    echo "  session_id"
    echo ") VALUES ("
    echo "  (SELECT id FROM tracked_links WHERE hash = '$TRACKING_HASH'),"
    echo "  'conversion',"
    echo "  1000.00,"
    echo "  NOW(),"
    echo "  'test-session-' || gen_random_uuid()::text"
    echo ");"
    echo ""
    read -p "Press Enter after running the SQL..."
fi

echo ""
echo "Step 4: Calculate commission"
echo "-----------------------------"
echo "Run this SQL in Supabase SQL Editor:"
echo ""
echo "SELECT calculate_commission_for_period("
echo "  '$COLLAB_ID',"
echo "  date_trunc('month', NOW()),"
echo "  NOW()"
echo ");"
echo ""
read -p "Press Enter after running the SQL..."

echo ""
echo "Step 5: Verify commission"
echo "-------------------------"
echo "Run this SQL to check:"
echo ""
echo "SELECT"
echo "  total_revenue_generated,"
echo "  creator_net_earnings,"
echo "  status"
echo "FROM commissions"
echo "WHERE collaboration_id = '$COLLAB_ID'"
echo "ORDER BY created_at DESC"
echo "LIMIT 1;"
echo ""
read -p "Press Enter after running the SQL..."

echo ""
echo "Step 6: Check in UI"
echo "--------------------"
echo "1. As Creator: Go to /dashboard/finances"
echo "   - Should see pending earnings: €127.50"
echo ""
echo "2. As SaaS: Go to /dashboard/finances → Commissions tab"
echo "   - Should see total revenue: €1000.00"
echo "   - Should see commissions due: €127.50"
echo ""
read -p "Press Enter when done checking UI..."

echo ""
echo "Step 7: Test payout (optional)"
echo "-------------------------------"
echo "Prerequisites:"
echo "- Creator has Stripe Connect connected"
echo "- Pending earnings ≥ €50"
echo ""
echo "1. Go to Finances page as creator"
echo "2. Click 'Demander un virement'"
echo "3. Check Stripe Dashboard for transfer"
echo ""
read -p "Press Enter when done testing payout..."

echo ""
echo -e "${GREEN}✅ Testing complete!${NC}"
echo ""
echo "Next steps:"
echo "- Add more test conversions"
echo "- Test monthly calculation"
echo "- Set up cron job for monthly automation"

