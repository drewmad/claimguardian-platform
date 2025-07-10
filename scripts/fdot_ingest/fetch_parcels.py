#!/usr/bin/env python3
"""
FDOT Parcel Data Fetcher

High-performance async downloader for Florida Department of Transportation
parcel data. Supports incremental updates and resume capabilities.

Environment Variables:
- FDOT_BASE_URL: Base URL for FDOT parcel data API
- FDOT_API_KEY: API key for authentication (if required)
- FDOT_BATCH_SIZE: Number of parcels to fetch per request (default: 1000)
- FDOT_MAX_WORKERS: Maximum number of concurrent workers (default: 10)
- FDOT_OUTPUT_DIR: Directory to save downloaded data (default: ./data)
- FDOT_RESUME_FILE: File to store resume checkpoint (default: .fdot_resume)
"""

import asyncio
import aiohttp
import aiofiles
import json
import os
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path
import hashlib
import sys
from dataclasses import dataclass, asdict
from urllib.parse import urljoin, urlencode

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('fdot_ingest.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class FetchConfig:
    """Configuration for FDOT parcel fetch operation"""
    base_url: str
    api_key: Optional[str] = None
    batch_size: int = 1000
    max_workers: int = 10
    output_dir: str = "./data"
    resume_file: str = ".fdot_resume"
    timeout: int = 30
    retry_attempts: int = 3
    retry_delay: int = 1

@dataclass
class FetchProgress:
    """Progress tracking for fetch operation"""
    total_parcels: int = 0
    fetched_parcels: int = 0
    failed_parcels: int = 0
    last_parcel_id: Optional[str] = None
    start_time: Optional[datetime] = None
    counties_completed: List[str] = None

    def __post_init__(self):
        if self.counties_completed is None:
            self.counties_completed = []

class FDOTParcelFetcher:
    """High-performance async FDOT parcel data fetcher"""
    
    def __init__(self, config: FetchConfig):
        self.config = config
        self.session: Optional[aiohttp.ClientSession] = None
        self.progress = FetchProgress()
        self.semaphore = asyncio.Semaphore(config.max_workers)
        
        # Create output directory
        Path(config.output_dir).mkdir(parents=True, exist_ok=True)
        
        # Load resume progress if exists
        self._load_progress()
    
    async def __aenter__(self):
        """Async context manager entry"""
        timeout = aiohttp.ClientTimeout(total=self.config.timeout)
        connector = aiohttp.TCPConnector(limit=self.config.max_workers * 2)
        
        headers = {
            'User-Agent': 'ClaimGuardian-FDOT-Fetcher/1.0',
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate'
        }
        
        if self.config.api_key:
            headers['Authorization'] = f'Bearer {self.config.api_key}'
        
        self.session = aiohttp.ClientSession(
            timeout=timeout,
            connector=connector,
            headers=headers
        )
        
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    def _load_progress(self):
        """Load progress from resume file"""
        resume_path = Path(self.config.resume_file)
        if resume_path.exists():
            try:
                with open(resume_path, 'r') as f:
                    data = json.load(f)
                    self.progress = FetchProgress(**data)
                logger.info(f"Resumed from checkpoint: {self.progress.fetched_parcels} parcels fetched")
            except Exception as e:
                logger.warning(f"Failed to load resume file: {e}")
                self.progress = FetchProgress()
    
    async def _save_progress(self):
        """Save progress to resume file"""
        try:
            progress_data = asdict(self.progress)
            # Convert datetime to string for JSON serialization
            if progress_data.get('start_time'):
                progress_data['start_time'] = progress_data['start_time'].isoformat()
            
            async with aiofiles.open(self.config.resume_file, 'w') as f:
                await f.write(json.dumps(progress_data, indent=2))
        except Exception as e:
            logger.error(f"Failed to save progress: {e}")
    
    async def _fetch_with_retry(self, url: str, params: Dict[str, Any]) -> Optional[Dict]:
        """Fetch data with retry logic"""
        for attempt in range(self.config.retry_attempts):
            try:
                async with self.semaphore:
                    async with self.session.get(url, params=params) as response:
                        if response.status == 200:
                            return await response.json()
                        elif response.status == 429:  # Rate limited
                            wait_time = self.config.retry_delay * (2 ** attempt)
                            logger.warning(f"Rate limited, waiting {wait_time}s before retry")
                            await asyncio.sleep(wait_time)
                        else:
                            logger.error(f"HTTP {response.status}: {await response.text()}")
                            
            except asyncio.TimeoutError:
                logger.warning(f"Timeout on attempt {attempt + 1}")
            except Exception as e:
                logger.error(f"Request failed on attempt {attempt + 1}: {e}")
            
            if attempt < self.config.retry_attempts - 1:
                await asyncio.sleep(self.config.retry_delay * (2 ** attempt))
        
        return None
    
    async def _fetch_counties(self) -> List[str]:
        """Fetch list of available counties"""
        url = urljoin(self.config.base_url, "/counties")
        
        data = await self._fetch_with_retry(url, {})
        if data and 'counties' in data:
            return data['counties']
        
        # Fallback to known Florida counties
        return [
            'ALACHUA', 'BAKER', 'BAY', 'BRADFORD', 'BREVARD', 'BROWARD', 'CALHOUN',
            'CHARLOTTE', 'CITRUS', 'CLAY', 'COLLIER', 'COLUMBIA', 'DESOTO', 'DIXIE',
            'DUVAL', 'ESCAMBIA', 'FLAGLER', 'FRANKLIN', 'GADSDEN', 'GILCHRIST',
            'GLADES', 'GULF', 'HAMILTON', 'HARDEE', 'HENDRY', 'HERNANDO', 'HIGHLANDS',
            'HILLSBOROUGH', 'HOLMES', 'INDIAN_RIVER', 'JACKSON', 'JEFFERSON', 'LAFAYETTE',
            'LAKE', 'LEE', 'LEON', 'LEVY', 'LIBERTY', 'MADISON', 'MANATEE', 'MARION',
            'MARTIN', 'MIAMI_DADE', 'MONROE', 'NASSAU', 'OKALOOSA', 'OKEECHOBEE',
            'ORANGE', 'OSCEOLA', 'PALM_BEACH', 'PASCO', 'PINELLAS', 'POLK', 'PUTNAM',
            'SANTA_ROSA', 'SARASOTA', 'SEMINOLE', 'ST_JOHNS', 'ST_LUCIE', 'SUMTER',
            'SUWANNEE', 'TAYLOR', 'UNION', 'VOLUSIA', 'WAKULLA', 'WALTON', 'WASHINGTON'
        ]
    
    async def _fetch_county_parcels(self, county: str) -> List[Dict]:
        """Fetch all parcels for a specific county"""
        parcels = []
        offset = 0
        
        # Skip if county already completed
        if county in self.progress.counties_completed:
            logger.info(f"County {county} already completed, skipping")
            return []
        
        logger.info(f"Fetching parcels for county: {county}")
        
        while True:
            url = urljoin(self.config.base_url, f"/parcels/{county}")
            params = {
                'limit': self.config.batch_size,
                'offset': offset,
                'format': 'json'
            }
            
            data = await self._fetch_with_retry(url, params)
            if not data or 'parcels' not in data:
                break
            
            batch_parcels = data['parcels']
            if not batch_parcels:
                break
            
            parcels.extend(batch_parcels)
            offset += len(batch_parcels)
            
            # Update progress
            self.progress.fetched_parcels += len(batch_parcels)
            
            # Save progress periodically
            if self.progress.fetched_parcels % (self.config.batch_size * 10) == 0:
                await self._save_progress()
            
            logger.info(f"County {county}: {len(parcels)} parcels fetched")
            
            # Check if we got fewer parcels than requested (end of data)
            if len(batch_parcels) < self.config.batch_size:
                break
        
        # Mark county as completed
        self.progress.counties_completed.append(county)
        await self._save_progress()
        
        return parcels
    
    async def _save_county_data(self, county: str, parcels: List[Dict]):
        """Save county parcel data to file"""
        if not parcels:
            return
        
        filename = f"{county.lower()}_parcels_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = Path(self.config.output_dir) / filename
        
        try:
            # Add metadata
            output_data = {
                'metadata': {
                    'county': county,
                    'fetch_date': datetime.now().isoformat(),
                    'parcel_count': len(parcels),
                    'fetcher_version': '1.0'
                },
                'parcels': parcels
            }
            
            async with aiofiles.open(filepath, 'w') as f:
                await f.write(json.dumps(output_data, indent=2))
            
            logger.info(f"Saved {len(parcels)} parcels for {county} to {filepath}")
            
            # Create checksum file
            checksum = hashlib.md5(json.dumps(output_data, sort_keys=True).encode()).hexdigest()
            checksum_file = filepath.with_suffix('.md5')
            async with aiofiles.open(checksum_file, 'w') as f:
                await f.write(f"{checksum}  {filename}\n")
                
        except Exception as e:
            logger.error(f"Failed to save data for {county}: {e}")
            raise
    
    async def fetch_all_parcels(self) -> Dict[str, int]:
        """Fetch all parcel data from FDOT"""
        self.progress.start_time = datetime.now()
        
        logger.info("Starting FDOT parcel data fetch")
        
        # Get list of counties
        counties = await self._fetch_counties()
        logger.info(f"Found {len(counties)} counties to process")
        
        # Filter out already completed counties
        remaining_counties = [c for c in counties if c not in self.progress.counties_completed]
        logger.info(f"Processing {len(remaining_counties)} remaining counties")
        
        results = {}
        
        # Process counties sequentially to avoid overwhelming the API
        for county in remaining_counties:
            try:
                parcels = await self._fetch_county_parcels(county)
                if parcels:
                    await self._save_county_data(county, parcels)
                    results[county] = len(parcels)
                else:
                    logger.warning(f"No parcels found for county: {county}")
                    results[county] = 0
                
            except Exception as e:
                logger.error(f"Failed to process county {county}: {e}")
                self.progress.failed_parcels += 1
                results[county] = -1  # Indicate failure
        
        # Final progress save
        await self._save_progress()
        
        # Log summary
        total_parcels = sum(count for count in results.values() if count > 0)
        failed_counties = sum(1 for count in results.values() if count < 0)
        
        logger.info(f"Fetch completed:")
        logger.info(f"  Total parcels: {total_parcels}")
        logger.info(f"  Counties processed: {len(results)}")
        logger.info(f"  Failed counties: {failed_counties}")
        logger.info(f"  Duration: {datetime.now() - self.progress.start_time}")
        
        return results

async def main():
    """Main entry point"""
    config = FetchConfig(
        base_url=os.getenv('FDOT_BASE_URL', 'https://api.fdot.gov/parcels/v1'),
        api_key=os.getenv('FDOT_API_KEY'),
        batch_size=int(os.getenv('FDOT_BATCH_SIZE', '1000')),
        max_workers=int(os.getenv('FDOT_MAX_WORKERS', '10')),
        output_dir=os.getenv('FDOT_OUTPUT_DIR', './data'),
        resume_file=os.getenv('FDOT_RESUME_FILE', '.fdot_resume')
    )
    
    logger.info("Starting FDOT parcel data fetch with config:")
    logger.info(f"  Base URL: {config.base_url}")
    logger.info(f"  Batch size: {config.batch_size}")
    logger.info(f"  Max workers: {config.max_workers}")
    logger.info(f"  Output dir: {config.output_dir}")
    
    try:
        async with FDOTParcelFetcher(config) as fetcher:
            results = await fetcher.fetch_all_parcels()
            
            # Print results summary
            print("\n" + "="*50)
            print("FDOT PARCEL FETCH SUMMARY")
            print("="*50)
            
            for county, count in sorted(results.items()):
                status = "✓" if count >= 0 else "✗"
                print(f"{status} {county:15} {count:>8} parcels")
            
            print("="*50)
            
    except KeyboardInterrupt:
        logger.info("Fetch interrupted by user")
    except Exception as e:
        logger.error(f"Fetch failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())