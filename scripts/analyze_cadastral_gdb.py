#!/usr/bin/env python3
"""
Analyze Cadastral Geodatabase Structure
Uses fiona/geopandas to read ESRI File Geodatabase
"""

import os
import sys
from pathlib import Path

def analyze_gdb():
    gdb_path = Path("/Users/madengineering/ClaimGuardian/Cadastral_Statewide.gdb 2")
    
    if not gdb_path.exists():
        print(f"❌ Geodatabase not found at: {gdb_path}")
        return
    
    print(f"🔍 Analyzing geodatabase: {gdb_path}")
    print(f"📁 Directory size: {sum(f.stat().st_size for f in gdb_path.rglob('*') if f.is_file()) / 1024 / 1024 / 1024:.2f} GB")
    
    try:
        import fiona
        
        # List all layers in the geodatabase
        with fiona.open(str(gdb_path)) as src:
            print(f"🗂️  Default layer: {src.schema}")
            print(f"📊 Record count: {len(src)}")
            
        # Try to list all layers
        layers = fiona.listlayers(str(gdb_path))
        print(f"\n📋 Available layers ({len(layers)}):")
        for i, layer in enumerate(layers):
            print(f"   {i+1}. {layer}")
            
        # Analyze main layer (usually the first one)
        if layers:
            main_layer = layers[0]
            print(f"\n🔬 Analyzing main layer: {main_layer}")
            
            with fiona.open(str(gdb_path), layer=main_layer) as src:
                schema = src.schema
                print(f"   📐 Geometry type: {schema.get('geometry', 'Unknown')}")
                print(f"   📊 Total records: {len(src)}")
                print(f"   🏷️  Properties ({len(schema['properties'])}):")
                
                for prop, dtype in schema['properties'].items():
                    print(f"      {prop}: {dtype}")
                
                # Sample first few records
                print(f"\n📝 Sample records:")
                for i, record in enumerate(src):
                    if i >= 3:  # Just first 3 records
                        break
                    properties = {k: v for k, v in record['properties'].items() if v is not None}
                    print(f"   Record {i+1}: {len(properties)} properties")
                    # Show a few key properties
                    key_props = ['PARCEL_ID', 'OBJECTID', 'CO_NO', 'OWN_NAME']
                    for key in key_props:
                        if key in properties:
                            print(f"      {key}: {properties[key]}")
    
    except ImportError:
        print("❌ fiona not available, trying alternative approach...")
        
        # Fallback: analyze file sizes to identify main data files
        print("\n📁 File analysis:")
        files = list(gdb_path.glob("*.gdbtable"))
        files.sort(key=lambda x: x.stat().st_size, reverse=True)
        
        for i, file in enumerate(files[:5]):  # Top 5 largest files
            size_mb = file.stat().st_size / 1024 / 1024
            print(f"   {i+1}. {file.name}: {size_mb:.1f} MB")
    
    except Exception as e:
        print(f"❌ Error analyzing geodatabase: {e}")

if __name__ == "__main__":
    analyze_gdb()