# backend/app/ingestion/social_media.py
# This module contains the core logic for X/Twitter stream processing, NLP analysis, and filtering.
# It is intended to be run as a long-running process (e.g., managed by a Celery task or a dedicated service).

import tweepy
import logging
import re
import json
from datetime import datetime
from nltk.sentiment.vader import SentimentIntensityAnalyzer
from app.core.config import settings
from app.models.social_media import XPost
from app.db.session import SessionLocalSync
from sqlalchemy.exc import IntegrityError

logger = logging.getLogger(__name__)

# Initialize NLTK VADER sentiment analyzer
try:
    sia = SentimentIntensityAnalyzer()
except LookupError:
    import nltk
    nltk.download('vader_lexicon')
    sia = SentimentIntensityAnalyzer()

# --- Filtering Strategy Configuration ---

# 1. Keyword/Hashtag Tracking
KEYWORDS = [
    "#FloridaStorm", "#FLwx", "power outage", "road flooded", "help needed",
    "hurricane", "storm surge", "damage report", "evacuation", "rescue me", "SOS"
]

# 2. Geographic Filtering (Florida bounding box for stream rules)
# Format: [west_long, south_lat, east_long, north_lat]
FLORIDA_BBOX = [-87.6349, 24.3963, -80.0311, 31.0010]

# 3. Geographic Filtering (Contextual location mentions for relevancy)
FLORIDA_LOCATIONS = [
    "Miami", "Orlando", "Tampa", "Jacksonville", "Tallahassee",
    "Key West", "Panhandle", "Broward", "Miami-Dade", "Palm Beach"
]

# --- Stream Listener Implementation ---

class EOCStreamListener(tweepy.StreamingClient):
    def on_data(self, raw_data):
        # Use on_data to access the full JSON payload including expansions
        try:
            data = json.loads(raw_data)
            process_tweet_data(data)
        except Exception as e:
            logger.error(f"Error processing tweet data: {e}", exc_info=True)

    def on_error(self, status_code):
        logger.error(f"Error in X stream: {status_code}")
        if status_code == 420:
            # Rate limited
            return False # Disconnects the stream
        return True # Continue streaming on other errors

def start_x_stream():
    """
    Initialize and start the X/Twitter stream.
    """
    if not settings.X_BEARER_TOKEN:
        logger.warning("X Bearer Token not configured. Cannot start X stream.")
        return

    logger.info("Initializing X post stream...")

    try:
        stream = EOCStreamListener(settings.X_BEARER_TOKEN)

        # Define and set up streaming rules
        rules = construct_stream_rules()
        # In a production environment, manage existing rules (add/delete) carefully.
        # setup_stream_rules(stream, rules)

        # Start streaming with necessary expansions and fields
        logger.info("Connecting to X filtered stream...")
        # stream.filter(
        #     expansions=["author_id", "geo.place_id"],
        #     tweet_fields=["created_at", "text", "entities", "geo"],
        #     user_fields=["username"],
        #     place_fields=["full_name", "geo"]
        # )

        # Simulation message as we cannot run the actual stream here.
        logger.info("X stream connection established (simulation). Awaiting data...")

    except Exception as e:
        logger.error(f"Failed to start X stream: {e}", exc_info=True)

def construct_stream_rules():
    """Construct X API v2 stream rules for multi-layered filtering."""
    rules = []

    # Combine Keyword/Hashtag tracking
    keyword_rule = " OR ".join(KEYWORDS)
    
    # Geographic Filtering (Geotagged posts within bounding box)
    bbox_str = f"bounding_box:[{FLORIDA_BBOX[0]} {FLORIDA_BBOX[1]} {FLORIDA_BBOX[2]} {FLORIDA_BBOX[3]}]"
    
    # Combined rule: (Keywords OR Geotagged in Florida) AND (English language) AND (Not a retweet)
    combined_rule = f"(({keyword_rule}) OR ({bbox_str})) lang:en -is:retweet"
    
    rules.append(tweepy.StreamRule(value=combined_rule))
    return rules

# --- Data Processing and Analysis ---

def process_tweet_data(data):
    """
    Process the raw tweet data, apply NLP analysis, and save if relevant.
    """
    tweet = data.get("data")
    includes = data.get("includes", {})

    if not tweet:
        return

    # 1. Extract Core Information
    content = tweet["text"]
    
    # 2. Relevancy Scoring
    relevancy_score = calculate_relevancy(content)

    # Apply threshold filtering
    if relevancy_score < 0.2:
        return

    # 3. Sentiment Analysis
    sentiment, sentiment_score = analyze_sentiment(content)

    # 4. Extract Author Information
    author_id = tweet.get("author_id")
    author_username = "unknown"
    if includes.get("users"):
        users = {user["id"]: user for user in includes["users"]}
        if author_id in users:
            author_username = users[author_id]["username"]

    # 5. Extract Geolocation
    geo_location, geo_source = extract_geolocation(tweet, includes)

    # 6. Extract Metadata (Keywords and Hashtags)
    entities = tweet.get("entities", {})
    hashtags = [tag['tag'] for tag in entities.get('hashtags', [])]
    keywords_matched = [kw for kw in KEYWORDS if re.search(r'\b' + re.escape(kw) + r'\b', content, re.IGNORECASE)]

    # 7. Save to database
    save_x_post(tweet, author_username, geo_location, geo_source, relevancy_score, sentiment, sentiment_score, keywords_matched, hashtags)

def calculate_relevancy(text):
    """
    Multi-layered relevancy scoring. Prioritizes direct observations, requests for help, and critical infrastructure damage.
    """
    score = 0.0
    text_lower = text.lower()

    # Layer 1: High-relevancy indicators (actionable intelligence)
    high_relevancy_indicators = [
        "help needed", "requesting rescue", "trapped", "emergency", "urgent",
        "severe flooding", "major damage", "building collapsed", "power line down", "tree blocking road"
    ]
    for indicator in high_relevancy_indicators:
        if indicator in text_lower:
            score += 0.6

    # Layer 2: Direct observation patterns
    if re.search(r'\b(I am seeing|Happening now|Live update|Just witnessed)\b', text, re.IGNORECASE):
        score += 0.3

    # Layer 3: Simple keyword match bonus
    for keyword in KEYWORDS:
        if keyword.lower() in text_lower:
            score += 0.1
            
    # Layer 4: Contextual geographic relevance (if not explicitly geolocated)
    for location in FLORIDA_LOCATIONS:
        if location.lower() in text_lower:
            score += 0.1
            break

    # Normalize score
    return max(0.0, min(1.0, score))

def analyze_sentiment(text):
    """Perform sentiment analysis using NLTK VADER."""
    scores = sia.polarity_scores(text)
    compound_score = scores['compound']
    if compound_score >= 0.05:
        sentiment = "positive"
    elif compound_score <= -0.05:
        sentiment = "negative"
    else:
        sentiment = "neutral"
    return sentiment, compound_score

def extract_geolocation(tweet, includes):
    """Extract precise geolocation from tweet data."""
    geo_location = None
    geo_source = None

    # Check for precise coordinates
    if tweet.get("geo") and tweet["geo"].get("coordinates"):
        coords = tweet["geo"]["coordinates"]["coordinates"]
        # Format for PostGIS POINT (Lon, Lat)
        geo_location = f"POINT({coords[0]} {coords[1]})"
        geo_source = "API_COORDS"
    # Check for place information (less precise, requires centroid calculation)
    elif tweet.get("geo") and tweet["geo"].get("place_id"):
        # Implementation for getting centroid from place bounding box omitted for brevity
        geo_source = "API_PLACE"

    return geo_location, geo_source

def save_x_post(tweet, author_username, geo_location, geo_source, relevancy_score, sentiment, sentiment_score, keywords, hashtags):
    """Save the processed X post to the database using synchronous session."""
    
    logger.info(f"Saving tweet {tweet['id']}: Relevancy={relevancy_score:.2f}, Sentiment={sentiment}")

    db = SessionLocalSync()
    try:
        db_post = XPost(
            post_id=str(tweet["id"]),
            author_id=str(tweet["author_id"]),
            author_username=author_username,
            content=tweet["text"],
            post_timestamp=datetime.fromisoformat(tweet["created_at"].replace("Z", "+00:00")),
            geo_location=geo_location, # GeoAlchemy2 handles WKT format
            geo_source=geo_source,
            relevancy_score=relevancy_score,
            sentiment=sentiment,
            sentiment_score=sentiment_score,
            keywords=keywords,
            hashtags=hashtags,
        )
        db.add(db_post)
        db.commit()
    except IntegrityError:
        # Handle duplicate post_id (if stream reconnects and sends duplicate data)
        db.rollback()
        logger.warning(f"Duplicate tweet ID {tweet['id']}. Skipping.")
    except Exception as e:
        db.rollback()
        logger.error(f"Error saving tweet to database: {e}", exc_info=True)
    finally:
        db.close()

if __name__ == "__main__":
    # Allow running the streamer directly (e.g., for dedicated service deployment)
    start_x_stream()
