#!/bin/bash

# Fix Google Maps API Errors - Comprehensive Solution
# Based on Google Maps API Error Messages Documentation

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🗺️  ClaimGuardian Google Maps Error Fix${NC}"
echo "=========================================="
echo ""

# Function to check if API key is valid format
check_api_key_format() {
    local key="$1"
    if [[ -z "$key" ]]; then
        echo -e "${RED}❌ Error: MissingKeyMapError${NC}"
        echo "The API key is missing entirely."
        return 1
    fi
    
    if [[ ${#key} -lt 30 ]]; then
        echo -e "${RED}❌ Error: InvalidKeyMapError${NC}"
        echo "The API key appears to be too short (less than 30 characters)."
        return 1
    fi
    
    if [[ "$key" =~ ^gme- ]]; then
        echo -e "${YELLOW}⚠️  Warning: KeyLooksLikeClientId${NC}"
        echo "You may have supplied a client ID as a key parameter."
        echo "For Premium Plan customers, use the 'client' parameter instead."
        return 1
    fi
    
    if [[ "$key" =~ ^[0-9]+$ ]]; then
        echo -e "${YELLOW}⚠️  Warning: KeyLooksLikeProjectNumber${NC}"
        echo "You may have supplied a project number as a key parameter."
        return 1
    fi
    
    return 0
}

# Function to check current environment variables
check_env_vars() {
    echo -e "${BLUE}📋 Checking Environment Variables...${NC}"
    echo ""
    
    # Check .env.local
    if [[ -f ".env.local" ]]; then
        echo -e "${GREEN}✅ Found .env.local${NC}"
        
        if grep -q "^NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=" .env.local; then
            local key_line=$(grep "^NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=" .env.local)
            local key_value=$(echo "$key_line" | cut -d'=' -f2-)
            
            if [[ -n "$key_value" && "$key_value" != "" ]]; then
                echo "   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=***HIDDEN***"
                
                if ! check_api_key_format "$key_value"; then
                    echo -e "${RED}   ❌ API key format appears invalid${NC}"
                    return 1
                else
                    echo -e "${GREEN}   ✅ API key format appears valid${NC}"
                fi
            else
                echo -e "${RED}   ❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is empty${NC}"
                return 1
            fi
        else
            echo -e "${RED}   ❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not found${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ No .env.local file found${NC}"
        return 1
    fi
    
    return 0
}

# Function to test API key against Google's servers
test_api_key() {
    local api_key="$1"
    echo -e "${BLUE}🧪 Testing API Key Against Google Servers...${NC}"
    echo ""
    
    # Test Maps JavaScript API
    local test_url="https://maps.googleapis.com/maps/api/js?key=${api_key}&libraries=places"
    echo "Testing: Maps JavaScript API"
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$test_url")
    
    if [[ "$response" == "200" ]]; then
        echo -e "${GREEN}✅ Maps JavaScript API: Working${NC}"
    else
        echo -e "${RED}❌ Maps JavaScript API: Error (HTTP $response)${NC}"
        
        case "$response" in
            "400")
                echo -e "${RED}   → Possible InvalidKeyMapError or MalformedCredentialsMapError${NC}"
                ;;
            "403")
                echo -e "${RED}   → Possible RefererNotAllowedMapError or ApiNotActivatedMapError${NC}"
                echo "   → Check your API key restrictions in Google Cloud Console"
                ;;
            "429")
                echo -e "${RED}   → OverQuotaMapError - Usage limits exceeded${NC}"
                ;;
        esac
        return 1
    fi
    
    # Test Places API
    echo "Testing: Places API"
    local places_url="https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=test&inputtype=textquery&key=${api_key}"
    local places_response=$(curl -s "$places_url")
    
    if echo "$places_response" | grep -q '"status":"OK"\|"status":"ZERO_RESULTS"'; then
        echo -e "${GREEN}✅ Places API: Working${NC}"
    else
        echo -e "${RED}❌ Places API: Error${NC}"
        echo "   Response: $places_response"
        return 1
    fi
    
    return 0
}

# Function to check browser console errors
check_browser_errors() {
    echo -e "${BLUE}🖥️  Browser Console Error Guide${NC}"
    echo "================================="
    echo ""
    echo "To check for Google Maps errors in your browser:"
    echo ""
    echo "1. Open your site in Chrome"
    echo "2. Press F12 to open Developer Tools"
    echo "3. Click the 'Console' tab"
    echo "4. Look for errors starting with 'Google Maps API error:'"
    echo ""
    echo "Common error patterns and solutions:"
    echo ""
    echo -e "${YELLOW}MissingKeyMapError:${NC}"
    echo "   → Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to environment variables"
    echo ""
    echo -e "${YELLOW}RefererNotAllowedMapError:${NC}"
    echo "   → Add your domain to API key restrictions in Google Cloud Console"
    echo "   → Allowed domains: localhost:3000/*, claimguardianai.com/*, *.vercel.app/*"
    echo ""
    echo -e "${YELLOW}ApiNotActivatedMapError:${NC}"
    echo "   → Enable Maps JavaScript API and Places API in Google Cloud Console"
    echo ""
    echo -e "${YELLOW}BillingNotEnabledMapError:${NC}"
    echo "   → Enable billing on your Google Cloud Project"
    echo ""
}

# Function to provide solution steps
provide_solutions() {
    echo -e "${BLUE}🔧 Solution Steps${NC}"
    echo "=================="
    echo ""
    
    echo -e "${GREEN}Step 1: Get/Verify Your Google Maps API Key${NC}"
    echo "1. Go to https://console.cloud.google.com/"
    echo "2. Select your project or create a new one"
    echo "3. Go to APIs & Services → Enabled APIs & services"
    echo "4. Enable these APIs if not already enabled:"
    echo "   - Maps JavaScript API"
    echo "   - Places API" 
    echo "   - Geocoding API"
    echo "5. Go to APIs & Services → Credentials"
    echo "6. Create an API key if you don't have one"
    echo ""
    
    echo -e "${GREEN}Step 2: Configure API Key Restrictions${NC}"
    echo "1. Click on your API key in the Credentials page"
    echo "2. Under 'Application restrictions', select 'HTTP referrers'"
    echo "3. Add these referrers:"
    echo "   http://localhost:3000/*"
    echo "   https://claimguardianai.com/*"
    echo "   https://*.vercel.app/*"
    echo "4. Under 'API restrictions', select 'Restrict key'"
    echo "5. Select these APIs:"
    echo "   - Maps JavaScript API"
    echo "   - Places API"
    echo "   - Geocoding API"
    echo "6. Save"
    echo ""
    
    echo -e "${GREEN}Step 3: Update Environment Variables${NC}"
    echo "Local Development (.env.local):"
    echo "   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-api-key-here"
    echo ""
    echo "Production (Vercel):"
    echo "1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables"
    echo "2. Add: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = your-api-key-here"
    echo "3. Set for both Production and Preview environments"
    echo "4. Redeploy your application"
    echo ""
    
    echo -e "${GREEN}Step 4: Enable Billing (If Required)${NC}"
    echo "1. Go to Google Cloud Console → Billing"
    echo "2. Link a billing account to your project"
    echo "3. Google provides $200/month free credit for Maps API"
    echo ""
}

# Function to update environment variables
update_env_vars() {
    echo -e "${BLUE}📝 Updating Environment Variables${NC}"
    echo ""
    
    echo "Enter your Google Maps API key (or press Enter to skip):"
    read -s api_key
    
    if [[ -n "$api_key" ]]; then
        if check_api_key_format "$api_key"; then
            # Update .env.local
            if [[ -f ".env.local" ]]; then
                if grep -q "^NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=" .env.local; then
                    sed -i.bak "s/^NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=.*/NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$api_key/" .env.local
                    echo -e "${GREEN}✅ Updated NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local${NC}"
                else
                    echo "" >> .env.local
                    echo "# Google Maps API" >> .env.local
                    echo "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$api_key" >> .env.local
                    echo -e "${GREEN}✅ Added NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local${NC}"
                fi
            else
                cat > .env.local << EOF
# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=$api_key
EOF
                echo -e "${GREEN}✅ Created .env.local with Google Maps API key${NC}"
            fi
            
            # Test the API key
            if test_api_key "$api_key"; then
                echo -e "${GREEN}✅ API key test successful!${NC}"
            else
                echo -e "${RED}❌ API key test failed. Check the error messages above.${NC}"
                echo -e "${YELLOW}Common issues:${NC}"
                echo "- API key restrictions don't include your domain"
                echo "- Required APIs not enabled in Google Cloud Console"
                echo "- Billing not enabled on your Google Cloud Project"
            fi
        else
            echo -e "${RED}❌ Invalid API key format. Please check your key.${NC}"
        fi
    else
        echo "Skipping API key update."
    fi
}

# Function to check Vercel environment variables
check_vercel_env() {
    echo -e "${BLUE}☁️  Checking Vercel Environment Variables${NC}"
    echo ""
    
    if command -v vercel &> /dev/null; then
        echo "Checking Vercel environment variables..."
        if vercel env ls 2>/dev/null | grep -q "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"; then
            echo -e "${GREEN}✅ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY found in Vercel${NC}"
        else
            echo -e "${RED}❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not found in Vercel${NC}"
            echo ""
            echo "To add it manually:"
            echo "1. Go to https://vercel.com/dashboard"
            echo "2. Select your project"
            echo "3. Go to Settings → Environment Variables"
            echo "4. Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY with your API key"
            echo "5. Set for both Production and Preview environments"
        fi
    else
        echo -e "${YELLOW}⚠️  Vercel CLI not installed. Install with: npm i -g vercel${NC}"
    fi
}

# Main execution
main() {
    echo "Starting Google Maps API error diagnosis and fix..."
    echo ""
    
    # Check current configuration
    if check_env_vars; then
        echo -e "${GREEN}✅ Environment variables are properly configured${NC}"
        
        # Extract API key for testing
        local api_key=$(grep "^NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=" .env.local | cut -d'=' -f2-)
        if [[ -n "$api_key" ]]; then
            test_api_key "$api_key"
        fi
    else
        echo -e "${RED}❌ Environment variables need attention${NC}"
        echo ""
        update_env_vars
    fi
    
    echo ""
    check_vercel_env
    echo ""
    check_browser_errors
    echo ""
    provide_solutions
    
    echo ""
    echo -e "${BLUE}📚 Additional Resources${NC}"
    echo "======================="
    echo "• Google Maps API Error Reference: https://developers.google.com/maps/documentation/javascript/error-messages"
    echo "• Google Cloud Console: https://console.cloud.google.com/"
    echo "• Vercel Dashboard: https://vercel.com/dashboard"
    echo "• ClaimGuardian Docs: docs/GOOGLE_MAPS_SETUP.md"
    echo ""
    echo -e "${GREEN}🎯 Summary${NC}"
    echo "========="
    echo "After making changes:"
    echo "1. Restart your local development server (pnpm dev)"
    echo "2. Redeploy to Vercel if you updated production environment variables"
    echo "3. Test address autocomplete functionality"
    echo "4. Check browser console for any remaining errors"
    echo ""
}

# Run if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi