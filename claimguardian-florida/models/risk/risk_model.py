"""
Hurricane risk scoring model for Florida parcels
Combines historical hurricane data, property characteristics, and geographic factors
"""

import pandas as pd
import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os

@dataclass
class RiskComponents:
    """Individual risk component scores"""
    hurricane_historical: float  # 0-1, based on historical impacts
    wind_vulnerability: float    # 0-1, based on building characteristics
    surge_exposure: float        # 0-1, based on elevation and distance to water
    economic_factor: float       # 0-1, based on property value and replacement cost
    geographic_factor: float     # 0-1, based on location and microclimate
    
@dataclass
class RiskScore:
    """Complete risk assessment for a parcel"""
    parcel_id: str
    overall_score: float
    confidence: float
    components: RiskComponents
    risk_category: str  # MINIMAL, LOW, MODERATE, HIGH, EXTREME
    
class FloridaHurricaneRiskModel:
    """ML model for predicting hurricane risk scores"""
    
    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.scaler = StandardScaler()
        self.feature_columns = []
        self.model_path = model_path
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
    
    def prepare_features(self, parcel_data: Dict) -> np.ndarray:
        """Extract and engineer features for ML model"""
        features = {
            # Geographic features
            'latitude': parcel_data.get('centroid_lat', 0),
            'longitude': parcel_data.get('centroid_lon', 0),
            'distance_to_coast': parcel_data.get('distance_to_coast_km', 50),
            'elevation_ft': parcel_data.get('elevation_ft', 10),
            
            # Property characteristics
            'property_value': parcel_data.get('just_value', 100000),
            'building_age': parcel_data.get('building_age_years', 30),
            'lot_size_sqft': parcel_data.get('lot_size_sqft', 8000),
            'building_sqft': parcel_data.get('building_sqft', 1500),
            
            # Historical hurricane exposure
            'hurricanes_10yr': parcel_data.get('hurricane_count_10yr', 0),
            'max_wind_exposure': parcel_data.get('max_wind_kts', 0),
            'avg_wind_exposure': parcel_data.get('avg_wind_kts', 0),
            'storm_surge_history': parcel_data.get('max_surge_ft', 0),
            
            # Derived features
            'value_per_sqft': parcel_data.get('just_value', 100000) / max(parcel_data.get('building_sqft', 1500), 1),
            'coastal_proximity': min(parcel_data.get('distance_to_coast_km', 50) / 50.0, 1.0),
            'elevation_normalized': min(parcel_data.get('elevation_ft', 10) / 50.0, 1.0),
        }
        
        # Handle county-specific factors
        county_fips = parcel_data.get('county_fips', '12000')
        high_risk_counties = ['12086', '12087', '12099', '12111']  # Miami-Dade, Monroe, Palm Beach, Martin
        features['high_risk_county'] = 1.0 if county_fips in high_risk_counties else 0.0
        
        return np.array(list(features.values())).reshape(1, -1)
    
    def calculate_risk_components(self, parcel_data: Dict) -> RiskComponents:
        """Calculate individual risk components"""
        
        # Hurricane historical risk (based on past 20 years)
        hurricane_count = parcel_data.get('hurricane_count_20yr', 0)
        hurricane_historical = min(hurricane_count / 8.0, 1.0)  # 8+ hurricanes = max risk
        
        # Wind vulnerability (based on building characteristics and exposure)
        max_wind = parcel_data.get('max_wind_kts', 0)
        building_age = parcel_data.get('building_age_years', 30)
        wind_vulnerability = min((max_wind / 150.0) * (building_age / 50.0), 1.0)
        
        # Surge exposure (based on elevation and coastal distance)
        elevation = parcel_data.get('elevation_ft', 10)
        distance_coast = parcel_data.get('distance_to_coast_km', 50)
        surge_exposure = max(0, 1.0 - (elevation / 20.0) - (distance_coast / 10.0))
        
        # Economic factor (higher value = higher economic risk)
        property_value = parcel_data.get('just_value', 100000)
        economic_factor = min(property_value / 2000000.0, 1.0)  # $2M+ = max economic risk
        
        # Geographic factor (combination of location-specific risks)
        lat = parcel_data.get('centroid_lat', 27.0)
        county_fips = parcel_data.get('county_fips', '12000')
        
        # South Florida has higher base risk
        south_florida_factor = 1.0 if lat < 26.5 else 0.7 if lat < 27.5 else 0.5
        # Keys have extreme risk
        keys_factor = 1.0 if county_fips == '12087' else 0.0
        geographic_factor = min(south_florida_factor + keys_factor, 1.0)
        
        return RiskComponents(
            hurricane_historical=hurricane_historical,
            wind_vulnerability=wind_vulnerability,
            surge_exposure=surge_exposure,
            economic_factor=economic_factor,
            geographic_factor=geographic_factor
        )
    
    def predict_risk(self, parcel_data: Dict) -> RiskScore:
        """Generate complete risk assessment for a parcel"""
        
        # Calculate component scores
        components = self.calculate_risk_components(parcel_data)
        
        # If we have a trained ML model, use it
        if self.model is not None:
            features = self.prepare_features(parcel_data)
            ml_score = self.model.predict(features)[0]
            confidence = 0.85  # High confidence with ML model
        else:
            # Fallback to weighted component average
            ml_score = (
                components.hurricane_historical * 0.25 +
                components.wind_vulnerability * 0.25 +
                components.surge_exposure * 0.20 +
                components.economic_factor * 0.15 +
                components.geographic_factor * 0.15
            )
            confidence = 0.60  # Lower confidence without ML
        
        # Ensure score is in valid range
        overall_score = max(0.0, min(1.0, ml_score))
        
        # Determine risk category
        if overall_score >= 0.8:
            risk_category = "EXTREME"
        elif overall_score >= 0.6:
            risk_category = "HIGH"
        elif overall_score >= 0.4:
            risk_category = "MODERATE" 
        elif overall_score >= 0.2:
            risk_category = "LOW"
        else:
            risk_category = "MINIMAL"
        
        return RiskScore(
            parcel_id=parcel_data.get('parcel_id', 'unknown'),
            overall_score=overall_score,
            confidence=confidence,
            components=components,
            risk_category=risk_category
        )
    
    def train_model(self, training_data: pd.DataFrame, target_column: str = 'risk_score'):
        """Train the ML model on historical data"""
        
        # Prepare features
        X = training_data.drop(columns=[target_column])
        y = training_data[target_column]
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train ensemble model
        gb_model = GradientBoostingRegressor(n_estimators=200, learning_rate=0.1, random_state=42)
        rf_model = RandomForestRegressor(n_estimators=200, random_state=42)
        
        gb_model.fit(X_train_scaled, y_train)
        rf_model.fit(X_train_scaled, y_train)
        
        # Ensemble predictions
        gb_pred = gb_model.predict(X_test_scaled)
        rf_pred = rf_model.predict(X_test_scaled)
        ensemble_pred = (gb_pred + rf_pred) / 2
        
        # Evaluate
        mse = mean_squared_error(y_test, ensemble_pred)
        r2 = r2_score(y_test, ensemble_pred)
        
        print(f"Model performance - MSE: {mse:.4f}, R²: {r2:.4f}")
        
        # Create simple ensemble model (in production would use more sophisticated stacking)
        self.model = gb_model  # Use gradient boosting as primary
        self.feature_columns = X.columns.tolist()
        
        return {'mse': mse, 'r2': r2}
    
    def save_model(self, path: str):
        """Save trained model and scaler"""
        if self.model is not None:
            model_data = {
                'model': self.model,
                'scaler': self.scaler,
                'features': self.feature_columns
            }
            joblib.dump(model_data, path)
            print(f"Model saved to {path}")
    
    def load_model(self, path: str):
        """Load pre-trained model"""
        if os.path.exists(path):
            model_data = joblib.load(path)
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.feature_columns = model_data['features']
            print(f"Model loaded from {path}")
        else:
            print(f"Model file not found: {path}")

# Example usage and testing
def demo_risk_scoring():
    """Demonstrate risk scoring with sample data"""
    
    model = FloridaHurricaneRiskModel()
    
    # Sample parcel data
    sample_parcels = [
        {
            'parcel_id': '12087-001234',  # Monroe County (Keys)
            'centroid_lat': 24.7,
            'centroid_lon': -81.2,
            'just_value': 800000,
            'distance_to_coast_km': 0.5,
            'elevation_ft': 8,
            'hurricane_count_20yr': 6,
            'max_wind_kts': 140,
            'building_age_years': 25,
            'county_fips': '12087'
        },
        {
            'parcel_id': '12015-005678',  # Charlotte County
            'centroid_lat': 26.9,
            'centroid_lon': -82.1,
            'just_value': 300000,
            'distance_to_coast_km': 15,
            'elevation_ft': 25,
            'hurricane_count_20yr': 2,
            'max_wind_kts': 95,
            'building_age_years': 15,
            'county_fips': '12015'
        }
    ]
    
    for parcel_data in sample_parcels:
        risk_score = model.predict_risk(parcel_data)
        print(f"\n🏠 Parcel: {risk_score.parcel_id}")
        print(f"   Overall Risk: {risk_score.overall_score:.3f} ({risk_score.risk_category})")
        print(f"   Confidence: {risk_score.confidence:.1%}")
        print(f"   Components:")
        print(f"     Hurricane Historical: {risk_score.components.hurricane_historical:.3f}")
        print(f"     Wind Vulnerability: {risk_score.components.wind_vulnerability:.3f}")
        print(f"     Surge Exposure: {risk_score.components.surge_exposure:.3f}")
        print(f"     Economic Factor: {risk_score.components.economic_factor:.3f}")
        print(f"     Geographic Factor: {risk_score.components.geographic_factor:.3f}")

if __name__ == "__main__":
    demo_risk_scoring()