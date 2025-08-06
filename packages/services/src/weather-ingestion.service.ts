import { createClient } from '@supabase/supabase-js';
import axios, { AxiosInstance } from 'axios';
import pLimit from 'p-limit';
import { logger } from '@/lib/logger';

interface WeatherStation {
  stationIdentifier: string;
  name: string;
  state?: string;
  county?: string;
  timeZone?: string;
  coordinates: [number, number];
  elevation?: number;
  gridId?: string;
  gridX?: number;
  gridY?: number;
}

interface WeatherObservation {
  timestamp: string;
  temperature?: { value: number; unitCode: string };
  dewpoint?: { value: number; unitCode: string };
  humidity?: { value: number; unitCode: string };
  barometricPressure?: { value: number; unitCode: string };
  seaLevelPressure?: { value: number; unitCode: string };
  visibility?: { value: number; unitCode: string };
  windSpeed?: { value: number; unitCode: string };
  windDirection?: { value: number; unitCode: string };
  windGust?: { value: number; unitCode: string };
  precipitationLastHour?: { value: number; unitCode: string };
  precipitationLast3Hours?: { value: number; unitCode: string };
  precipitationLast6Hours?: { value: number; unitCode: string };
  relativeHumidity?: { value: number; unitCode: string };
  windChill?: { value: number; unitCode: string };
  heatIndex?: { value: number; unitCode: string };
  cloudLayers?: any[];
  presentWeather?: any[];
  rawMessage?: string;
}

interface WeatherAlert {
  id: string;
  areaDesc: string;
  geocode?: any;
  affectedZones?: string[];
  references?: string[];
  sent: string;
  effective?: string;
  onset?: string;
  expires?: string;
  ends?: string;
  status: string;
  messageType: string;
  category?: string;
  severity?: string;
  certainty?: string;
  urgency?: string;
  event: string;
  sender?: string;
  senderName?: string;
  headline?: string;
  description?: string;
  instruction?: string;
  response?: string;
  parameters?: any;
}

export class WeatherIngestionService {
  private supabase;
  private nwsClient: AxiosInstance;
  private readonly limit = pLimit(5); // Concurrent request limit
  private readonly USER_AGENT = 'ClaimGuardian/1.0 (claimguardianai.com, support@claimguardianai.com)';

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.nwsClient = axios.create({
      baseURL: 'https://api.weather.gov',
      headers: {
        'User-Agent': this.USER_AGENT,
        'Accept': 'application/geo+json'
      },
      timeout: 30000
    });
  }

  // =====================================================
  // STATION MANAGEMENT
  // =====================================================

  async syncStations(state?: string): Promise<void> {
    try {
      logger.info('Starting station sync', { state });

      const params = state ? { state } : {};
      const response = await this.nwsClient.get('/stations', { params });
      const stations = response.data.features;

      const stationData = stations.map((feature: any) => ({
        station_id: feature.properties.stationIdentifier,
        name: feature.properties.name,
        state: feature.properties.state,
        county: feature.properties.county,
        timezone: feature.properties.timeZone,
        location: `POINT(${feature.geometry.coordinates[0]} ${feature.geometry.coordinates[1]})`,
        elevation_meters: feature.properties.elevation?.value,
        grid_id: feature.properties.gridId,
        grid_x: feature.properties.gridX,
        grid_y: feature.properties.gridY,
        forecast_zone: feature.properties.forecast,
        county_zone: feature.properties.county,
        fire_zone: feature.properties.fireWeatherZone,
        metadata: feature.properties
      }));

      // Upsert stations
      const { error } = await this.supabase
        .from('weather.stations')
        .upsert(stationData, {
          onConflict: 'station_id',
          ignoreDuplicates: false
        });

      if (error) throw error;

      logger.info(`Synced ${stationData.length} stations`);

      // Update sync status
      await this.updateSyncStatus('stations', null, 'completed');
    } catch (error) {
      logger.error('Station sync failed', error);
      await this.updateSyncStatus('stations', null, 'error', error);
      throw error;
    }
  }

  // =====================================================
  // OBSERVATIONS INGESTION
  // =====================================================

  async syncObservations(stationIds?: string[]): Promise<void> {
    try {
      // Get stations to sync
      const stations = await this.getStationsToSync(stationIds);
      logger.info(`Syncing observations for ${stations.length} stations`);

      // Process stations in parallel with rate limiting
      const results = await Promise.allSettled(
        stations.map(station => 
          this.limit(() => this.syncStationObservations(station))
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.info(`Observation sync completed: ${successful} successful, ${failed} failed`);
    } catch (error) {
      logger.error('Observation sync failed', error);
      throw error;
    }
  }

  private async syncStationObservations(station: any): Promise<void> {
    try {
      const response = await this.nwsClient.get(
        `/stations/${station.station_id}/observations/latest`
      );

      const obs = response.data.properties;
      
      const observation = {
        station_id: station.station_id,
        observed_at: obs.timestamp,
        temperature_c: this.extractValue(obs.temperature, 'degC'),
        temperature_f: this.extractValue(obs.temperature, 'degF'),
        dewpoint_c: this.extractValue(obs.dewpoint, 'degC'),
        dewpoint_f: this.extractValue(obs.dewpoint, 'degF'),
        humidity_percent: this.extractValue(obs.relativeHumidity, 'percent'),
        barometric_pressure_pa: this.extractValue(obs.barometricPressure, 'Pa'),
        sea_level_pressure_pa: this.extractValue(obs.seaLevelPressure, 'Pa'),
        visibility_meters: this.extractValue(obs.visibility, 'm'),
        wind_speed_kmh: this.extractValue(obs.windSpeed, 'km_h-1'),
        wind_speed_mph: this.extractValue(obs.windSpeed, 'mph'),
        wind_direction_degrees: this.extractValue(obs.windDirection, 'degree_(angle)'),
        wind_gust_kmh: this.extractValue(obs.windGust, 'km_h-1'),
        wind_gust_mph: this.extractValue(obs.windGust, 'mph'),
        precipitation_last_hour_mm: this.extractValue(obs.precipitationLastHour, 'mm'),
        precipitation_last_hour_in: this.extractValue(obs.precipitationLastHour, 'inch'),
        precipitation_last_3hours_mm: this.extractValue(obs.precipitationLast3Hours, 'mm'),
        precipitation_last_6hours_mm: this.extractValue(obs.precipitationLast6Hours, 'mm'),
        wind_chill_c: this.extractValue(obs.windChill, 'degC'),
        wind_chill_f: this.extractValue(obs.windChill, 'degF'),
        heat_index_c: this.extractValue(obs.heatIndex, 'degC'),
        heat_index_f: this.extractValue(obs.heatIndex, 'degF'),
        cloud_layers: obs.cloudLayers || null,
        present_weather: obs.presentWeather?.map((w: any) => w.rawString) || null,
        raw_message: obs.rawMessage,
        quality_control: obs.qualityControl || null
      };

      const { error } = await this.supabase
        .from('weather.observations')
        .upsert(observation, {
          onConflict: 'station_id,observed_at'
        });

      if (error) throw error;

      await this.updateSyncStatus('observations', station.station_id, 'completed');
    } catch (error) {
      logger.error(`Failed to sync observations for ${station.station_id}`, error);
      await this.updateSyncStatus('observations', station.station_id, 'error', error);
    }
  }

  // =====================================================
  // FORECAST INGESTION
  // =====================================================

  async syncForecasts(gridPoints?: Array<{gridId: string, x: number, y: number}>): Promise<void> {
    try {
      const points = gridPoints || await this.getActiveGridPoints();
      logger.info(`Syncing forecasts for ${points.length} grid points`);

      const results = await Promise.allSettled(
        points.map(point => 
          this.limit(() => this.syncGridForecast(point))
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      logger.info(`Forecast sync completed: ${successful}/${points.length} successful`);
    } catch (error) {
      logger.error('Forecast sync failed', error);
      throw error;
    }
  }

  private async syncGridForecast(point: any): Promise<void> {
    try {
      // Get standard forecast
      const standardResponse = await this.nwsClient.get(
        `/gridpoints/${point.gridId}/${point.x},${point.y}/forecast`
      );

      // Get hourly forecast
      const hourlyResponse = await this.nwsClient.get(
        `/gridpoints/${point.gridId}/${point.x},${point.y}/forecast/hourly`
      );

      const forecasts = [
        ...this.processForecast(standardResponse.data, 'standard', point),
        ...this.processForecast(hourlyResponse.data, 'hourly', point)
      ];

      if (forecasts.length > 0) {
        const { error } = await this.supabase
          .from('weather.forecasts')
          .upsert(forecasts, {
            onConflict: 'grid_id,grid_x,grid_y,valid_time_start,forecast_type'
          });

        if (error) throw error;
      }

      await this.updateSyncStatus('forecasts', `${point.gridId}/${point.x},${point.y}`, 'completed');
    } catch (error) {
      logger.error(`Failed to sync forecast for grid ${point.gridId}/${point.x},${point.y}`, error);
      await this.updateSyncStatus('forecasts', `${point.gridId}/${point.x},${point.y}`, 'error', error);
    }
  }

  private processForecast(data: any, type: string, point: any): any[] {
    const geometry = data.geometry;
    const location = geometry ? `POINT(${geometry.coordinates[0][0][0]} ${geometry.coordinates[0][0][1]})` : null;

    return data.properties.periods.map((period: any) => {
      const [startTime, endTime] = this.parseISOInterval(period.validTime);
      
      return {
        grid_id: point.gridId,
        grid_x: point.x,
        grid_y: point.y,
        location,
        generated_at: data.properties.generatedAt || new Date().toISOString(),
        valid_time_start: startTime,
        valid_time_end: endTime,
        forecast_type: type,
        temperature_value: period.temperature,
        temperature_unit: period.temperatureUnit,
        temperature_trend: period.temperatureTrend,
        dewpoint_value: this.extractValue(period.dewpoint, period.temperatureUnit),
        relative_humidity: this.extractValue(period.relativeHumidity, 'percent'),
        wind_direction: period.windDirection,
        wind_speed: period.windSpeed,
        precipitation_probability: period.probabilityOfPrecipitation?.value,
        weather_condition: period.shortForecast,
        detailed_forecast: period.detailedForecast,
        short_forecast: period.shortForecast,
        raw_data: period
      };
    });
  }

  // =====================================================
  // ALERT INGESTION
  // =====================================================

  async syncAlerts(state?: string): Promise<void> {
    try {
      const params: any = { active: true };
      if (state) params.area = state;

      const response = await this.nwsClient.get('/alerts/active', { params });
      const alerts = response.data.features;

      logger.info(`Processing ${alerts.length} active alerts`);

      const alertData = alerts.map((feature: any) => {
        const props = feature.properties;
        
        return {
          alert_id: props.id,
          alert_identifier: props.identifier,
          sender: props.sender,
          sent_time: props.sent,
          status: props.status,
          message_type: props.messageType,
          scope: props.scope,
          category: props.category,
          event: props.event,
          response_type: props.response,
          urgency: props.urgency,
          severity: props.severity,
          certainty: props.certainty,
          effective_time: props.effective,
          onset_time: props.onset,
          expires_time: props.expires,
          ends_time: props.ends,
          headline: props.headline,
          description: props.description,
          instruction: props.instruction,
          area_desc: props.areaDesc,
          affected_zones: props.affectedZones,
          geocodes: props.geocode,
          same_codes: props.parameters?.SAME,
          ugc_codes: props.parameters?.UGC,
          geometry: feature.geometry ? 
            `SRID=4326;${this.geometryToWKT(feature.geometry)}` : null,
          parameters: props.parameters,
          raw_cap_xml: props.rawMessage
        };
      });

      if (alertData.length > 0) {
        const { error } = await this.supabase
          .from('weather.alerts')
          .upsert(alertData, {
            onConflict: 'alert_id',
            ignoreDuplicates: false
          });

        if (error) throw error;
      }

      logger.info(`Synced ${alertData.length} alerts`);
      await this.updateSyncStatus('alerts', state || 'all', 'completed');
    } catch (error) {
      logger.error('Alert sync failed', error);
      await this.updateSyncStatus('alerts', state || 'all', 'error', error);
      throw error;
    }
  }

  // =====================================================
  // PROPERTY WEATHER LINKING
  // =====================================================

  async linkPropertyToWeather(propertyId: string, lat: number, lon: number): Promise<void> {
    try {
      // Find nearest station
      const { data: stations } = await this.supabase
        .rpc('find_nearest_station', { lat, lon, max_distance_miles: 50 });

      if (!stations || stations.length === 0) {
        throw new Error('No weather stations found nearby');
      }

      const nearestStation = stations[0];

      // Get grid point for location
      const gridResponse = await this.nwsClient.get(`/points/${lat},${lon}`);
      const gridData = gridResponse.data.properties;

      // Link property to weather monitoring
      const { error } = await this.supabase
        .from('weather.property_monitoring')
        .upsert({
          property_id: propertyId,
          station_id: nearestStation.station_id,
          grid_id: gridData.gridId,
          grid_x: gridData.gridX,
          grid_y: gridData.gridY,
          county_fips: gridData.county?.split('/').pop(),
          distance_miles: nearestStation.distance_miles,
          monitoring_active: true,
          is_primary: true
        }, {
          onConflict: 'property_id'
        });

      if (error) throw error;

      logger.info(`Linked property ${propertyId} to weather station ${nearestStation.station_id}`);
    } catch (error) {
      logger.error(`Failed to link property ${propertyId} to weather`, error);
      throw error;
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private extractValue(data: any, targetUnit: string): number | null {
    if (!data || !data.value) return null;
    
    if (data.unitCode?.includes(targetUnit)) {
      return data.value;
    }
    
    // Add unit conversion logic here if needed
    return data.value;
  }

  private parseISOInterval(interval: string): [string, string] {
    const parts = interval.split('/');
    return [parts[0], parts[1]];
  }

  private geometryToWKT(geometry: any): string {
    switch (geometry.type) {
      case 'Point':
        return `POINT(${geometry.coordinates[0]} ${geometry.coordinates[1]})`;
      case 'Polygon':
        const rings = geometry.coordinates
          .map((ring: any) => 
            '(' + ring.map((coord: any) => `${coord[0]} ${coord[1]}`).join(',') + ')'
          )
          .join(',');
        return `POLYGON(${rings})`;
      case 'MultiPolygon':
        const polygons = geometry.coordinates
          .map((polygon: any) => {
            const rings = polygon
              .map((ring: any) => 
                '(' + ring.map((coord: any) => `${coord[0]} ${coord[1]}`).join(',') + ')'
              )
              .join(',');
            return `(${rings})`;
          })
          .join(',');
        return `MULTIPOLYGON(${polygons})`;
      default:
        return '';
    }
  }

  private async getStationsToSync(stationIds?: string[]): Promise<any[]> {
    const query = this.supabase
      .from('weather.stations')
      .select('station_id, name, location')
      .eq('is_active', true);

    if (stationIds && stationIds.length > 0) {
      query.in('station_id', stationIds);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    return data || [];
  }

  private async getActiveGridPoints(): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('weather.property_monitoring')
      .select('grid_id, grid_x, grid_y')
      .eq('monitoring_active', true)
      .not('grid_id', 'is', null);

    if (error) throw error;

    // Deduplicate grid points
    const uniquePoints = new Map();
    (data || []).forEach(point => {
      const key = `${point.grid_id}/${point.grid_x},${point.grid_y}`;
      uniquePoints.set(key, point);
    });

    return Array.from(uniquePoints.values());
  }

  private async updateSyncStatus(
    syncType: string, 
    reference: string | null, 
    status: string, 
    error?: any
  ): Promise<void> {
    const record: any = {
      sync_type: syncType,
      station_id: syncType === 'observations' ? reference : null,
      grid_reference: syncType === 'forecasts' ? reference : null,
      last_sync_at: new Date().toISOString(),
      next_sync_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      status: status === 'completed' ? 'active' : status,
      error_count: status === 'error' ? 1 : 0,
      last_error: error ? error.message : null,
      last_error_at: error ? new Date().toISOString() : null
    };

    await this.supabase
      .from('weather.sync_status')
      .upsert(record, {
        onConflict: 'sync_type,station_id,grid_reference'
      });
  }
}