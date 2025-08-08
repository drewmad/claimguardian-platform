#!/usr/bin/env python3

"""
Cache warming utility for ClaimGuardian Florida Data Platform
Preloads critical data and tiles into Redis cache
"""

import os
import asyncio
import aiohttp
import redis.asyncio as redis
from dataclasses import dataclass
from typing import List, Tuple
import json
import time

@dataclass
class WarmingTarget:
    name: str
    url: str
    cache_key: str
    ttl: int
    priority: int = 1

class CacheWarmer:
    def __init__(self, redis_url: str, api_base_url: str):
        self.redis_url = redis_url
        self.api_base_url = api_base_url
        self.redis_client = None
        
    async def connect(self):
        """Initialize Redis connection"""
        self.redis_client = redis.from_url(
            self.redis_url,
            encoding="utf-8",
            decode_responses=True
        )
        
    async def disconnect(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()
    
    async def warm_tiles(self, counties: List[str], zoom_levels: List[int]) -> int:
        """Warm parcel tiles for specified counties"""
        warmed_count = 0
        
        # Get county bounding boxes (simplified for demo)
        county_bounds = {
            '12015': [(26.8, -82.5), (27.2, -81.8)],  # Charlotte
            '12115': [(27.0, -82.8), (27.4, -82.3)],  # Sarasota  
            '12086': [(25.1, -80.9), (25.9, -80.1)]   # Miami-Dade
        }
        
        tasks = []
        for county_fips in counties:
            if county_fips not in county_bounds:
                continue
                
            bounds = county_bounds[county_fips]
            for zoom in zoom_levels:
                # Calculate tile ranges for county bounds
                tile_coords = self._get_tile_coords(bounds, zoom)
                
                for x, y in tile_coords:
                    target = WarmingTarget(
                        name=f"tile_{county_fips}_{zoom}_{x}_{y}",
                        url=f"{self.api_base_url}/api/tiles/parcels/{zoom}/{x}/{y}.mvt",
                        cache_key=f"tile:parcels:{zoom}:{x}:{y}",
                        ttl=3600,
                        priority=1
                    )
                    tasks.append(self._warm_single_target(target))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        warmed_count = sum(1 for r in results if r is True)
        
        print(f"✅ Warmed {warmed_count} parcel tiles")
        return warmed_count
    
    async def warm_high_value_parcels(self, limit: int = 1000) -> int:
        """Warm cache for highest value parcels"""
        # This would query the database for high-value parcels
        # For demo, using placeholder parcel IDs
        high_value_parcels = [
            f"12015-{i:06d}" for i in range(1, limit + 1)
        ]
        
        tasks = []
        for parcel_id in high_value_parcels:
            target = WarmingTarget(
                name=f"parcel_{parcel_id}",
                url=f"{self.api_base_url}/api/parcels/{parcel_id}",
                cache_key=f"parcel:{parcel_id}",
                ttl=900,  # 15 minutes
                priority=2
            )
            tasks.append(self._warm_single_target(target))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        warmed_count = sum(1 for r in results if r is True)
        
        print(f"✅ Warmed {warmed_count} high-value parcels")
        return warmed_count
    
    async def warm_risk_scores(self, parcel_ids: List[str]) -> int:
        """Warm risk score cache via Edge Function"""
        tasks = []
        edge_function_url = os.getenv('SUPABASE_URL', '').replace('/rest/v1', '/functions/v1')
        
        for parcel_id in parcel_ids:
            target = WarmingTarget(
                name=f"risk_{parcel_id}",
                url=f"{edge_function_url}/parcel-risk?parcel_id={parcel_id}",
                cache_key=f"risk:{parcel_id}",
                ttl=300,  # 5 minutes
                priority=3
            )
            tasks.append(self._warm_single_target(target))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        warmed_count = sum(1 for r in results if r is True)
        
        print(f"✅ Warmed {warmed_count} risk scores")
        return warmed_count
    
    async def _warm_single_target(self, target: WarmingTarget) -> bool:
        """Warm a single cache target"""
        try:
            async with aiohttp.ClientSession() as session:
                # Check if already cached
                if await self.redis_client.exists(target.cache_key):
                    return True
                    
                # Fetch from API
                async with session.get(target.url, timeout=30) as response:
                    if response.status == 200:
                        if 'application/json' in response.headers.get('content-type', ''):
                            data = await response.json()
                            await self.redis_client.setex(
                                target.cache_key,
                                target.ttl,
                                json.dumps(data)
                            )
                        else:
                            # Binary data (like MVT tiles)
                            data = await response.read()
                            await self.redis_client.setex(
                                target.cache_key,
                                target.ttl,
                                data
                            )
                        return True
                    else:
                        print(f"❌ Failed to warm {target.name}: HTTP {response.status}")
                        return False
                        
        except Exception as e:
            print(f"❌ Error warming {target.name}: {e}")
            return False
    
    def _get_tile_coords(self, bounds: List[Tuple[float, float]], zoom: int) -> List[Tuple[int, int]]:
        """Calculate tile coordinates for bounding box at zoom level"""
        # Simplified tile calculation - in production use proper tile math
        coords = []
        lat_min, lon_min = bounds[0]
        lat_max, lon_max = bounds[1]
        
        # Very simplified - just generate a few sample coordinates
        base_x = int((lon_min + 180) / 360 * (2 ** zoom))
        base_y = int((1 - (lat_max + 90) / 180) * (2 ** zoom))
        
        # Generate small grid around the area
        for dx in range(3):
            for dy in range(3):
                coords.append((base_x + dx, base_y + dy))
        
        return coords

async def main():
    """Main cache warming routine"""
    redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379')
    api_base_url = os.getenv('API_BASE_URL', 'http://localhost:3000')
    
    warmer = CacheWarmer(redis_url, api_base_url)
    
    try:
        print("🔥 Starting cache warming...")
        start_time = time.time()
        
        await warmer.connect()
        
        # Warm critical counties and zoom levels
        pilot_counties = ['12015', '12115', '12086']  # Charlotte, Sarasota, Miami-Dade
        critical_zooms = [10, 11, 12, 13]
        
        tiles_warmed = await warmer.warm_tiles(pilot_counties, critical_zooms)
        parcels_warmed = await warmer.warm_high_value_parcels(500)
        
        # Sample parcel IDs for risk warming
        sample_parcels = [f"12015-{i:06d}" for i in range(1, 101)]
        risk_warmed = await warmer.warm_risk_scores(sample_parcels)
        
        elapsed = time.time() - start_time
        total_warmed = tiles_warmed + parcels_warmed + risk_warmed
        
        print(f"\n🎉 Cache warming complete!")
        print(f"📊 Total items warmed: {total_warmed}")
        print(f"⏱️  Time elapsed: {elapsed:.2f}s")
        print(f"🚀 Rate: {total_warmed/elapsed:.1f} items/second")
        
    except Exception as e:
        print(f"💥 Cache warming failed: {e}")
        return 1
    finally:
        await warmer.disconnect()
    
    return 0

if __name__ == "__main__":
    exit(asyncio.run(main()))