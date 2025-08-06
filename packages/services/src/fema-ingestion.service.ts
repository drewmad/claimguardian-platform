import { createClient } from '@supabase/supabase-js';
import axios, { AxiosInstance } from 'axios';
import pLimit from 'p-limit';
import { logger } from '@/lib/logger';

interface FEMADisasterDeclaration {
  disasterNumber: number;
  state: string;
  declarationDate: string;
  fiscalYear: number;
  disasterType: string;
  incidentType: string;
  title: string;
  incidentBeginDate: string;
  incidentEndDate?: string;
  disasterCloseOutDate?: string;
  declaredCountyArea?: string;
  placeCode?: string;
  designatedArea?: string;
  declarationType: string;
  iaProgramDeclared: boolean;
  paProgramDeclared: boolean;
  hmProgramDeclared: boolean;
  ihProgramDeclared: boolean;
  tribalRequest: boolean;
  hash?: string;
  lastRefresh?: string;
}

interface IPAWSAlert {
  identifier: string;
  sender: string;
  sent: string;
  status: string;
  msgType: string;
  source?: string;
  scope: string;
  code?: string[];
  note?: string;
  references?: string;
  incidents?: string;
  info?: any;
  area?: any;
  effective?: string;
  onset?: string;
  expires?: string;
  senderName?: string;
  event?: string;
  urgency?: string;
  severity?: string;
  certainty?: string;
  headline?: string;
  description?: string;
  instruction?: string;
  web?: string;
  contact?: string;
  hash?: string;
  lastRefresh?: string;
}

export class FEMAIngestionService {
  private supabase;
  private femaClient: AxiosInstance;
  private readonly limit = pLimit(3); // FEMA API rate limiting
  private readonly BATCH_SIZE = 1000;
  private readonly MAX_RECORDS = 10000;

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    this.femaClient = axios.create({
      baseURL: 'https://www.fema.gov/api/open',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ClaimGuardian/1.0 (claimguardianai.com)'
      },
      timeout: 60000
    });
  }

  // =====================================================
  // DISASTER DECLARATIONS
  // =====================================================

  async syncDisasterDeclarations(
    state?: string,
    startDate?: Date,
    fullSync: boolean = false
  ): Promise<void> {
    try {
      logger.info('Starting disaster declarations sync', { state, startDate, fullSync });

      let filter = '';
      const filters: string[] = [];

      if (state) {
        filters.push(`state eq '${state}'`);
      }

      if (!fullSync && startDate) {
        filters.push(`declarationDate ge '${startDate.toISOString()}'`);
      } else if (!fullSync) {
        // Default to last 30 days for incremental sync
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filters.push(`lastRefresh ge '${thirtyDaysAgo.toISOString()}'`);
      }

      if (filters.length > 0) {
        filter = filters.join(' and ');
      }

      const declarations = await this.fetchAllRecords(
        '/v2/DisasterDeclarationsSummaries',
        filter
      );

      logger.info(`Fetched ${declarations.length} disaster declarations`);

      // Process and insert declarations
      const declarationData = declarations.map((dec: any) => ({
        disaster_number: dec.disasterNumber,
        state: dec.state,
        county_fips: this.extractCountyFips(dec.fipsStateCode, dec.fipsCountyCode),
        declaration_date: dec.declarationDate,
        fiscal_year: dec.fyDeclared,
        disaster_type: dec.disasterType,
        incident_type: dec.incidentType,
        title: dec.title || dec.declarationTitle,
        incident_begin_date: dec.incidentBeginDate,
        incident_end_date: dec.incidentEndDate,
        disaster_close_out_date: dec.disasterCloseOutDate,
        declared_county_area: dec.declaredCountyArea,
        place_code: dec.placeCode,
        designated_area: dec.designatedArea,
        declaration_type: dec.declarationType,
        ia_program_declared: dec.iaProgramDeclared,
        pa_program_declared: dec.paProgramDeclared,
        hm_program_declared: dec.hmProgramDeclared,
        ih_program_declared: dec.ihProgramDeclared,
        tribal_request: dec.tribalRequest,
        hash: dec.hash,
        last_refresh: dec.lastRefresh || new Date().toISOString()
      }));

      // Batch insert
      for (let i = 0; i < declarationData.length; i += this.BATCH_SIZE) {
        const batch = declarationData.slice(i, i + this.BATCH_SIZE);
        
        const { error } = await this.supabase
          .from('fema.disaster_declarations')
          .upsert(batch, {
            onConflict: 'disaster_number,place_code,declaration_date',
            ignoreDuplicates: false
          });

        if (error) {
          logger.error(`Failed to insert batch ${i / this.BATCH_SIZE}`, error);
          throw error;
        }

        logger.info(`Inserted batch ${i / this.BATCH_SIZE + 1} of ${Math.ceil(declarationData.length / this.BATCH_SIZE)}`);
      }

      await this.updateSyncStatus('disaster_declarations', 'completed');
      logger.info('Disaster declarations sync completed');
    } catch (error) {
      logger.error('Disaster declarations sync failed', error);
      await this.updateSyncStatus('disaster_declarations', 'error', error);
      throw error;
    }
  }

  // =====================================================
  // IPAWS ALERTS
  // =====================================================

  async syncIPAWSAlerts(
    startDate?: Date,
    endDate?: Date
  ): Promise<void> {
    try {
      logger.info('Starting IPAWS alerts sync', { startDate, endDate });

      let filter = '';
      const filters: string[] = [];

      if (startDate) {
        filters.push(`sent ge '${startDate.toISOString()}'`);
      } else {
        // Default to last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filters.push(`sent ge '${sevenDaysAgo.toISOString()}'`);
      }

      if (endDate) {
        filters.push(`sent le '${endDate.toISOString()}'`);
      }

      if (filters.length > 0) {
        filter = filters.join(' and ');
      }

      const alerts = await this.fetchAllRecords(
        '/v1/IpawsArchivedAlerts',
        filter
      );

      logger.info(`Fetched ${alerts.length} IPAWS alerts`);

      // Process alerts
      const alertData = alerts.map((alert: any) => ({
        alert_id: alert.id,
        identifier: alert.identifier,
        sender: alert.sender,
        sent: alert.sent,
        status: alert.status,
        msg_type: alert.msgType,
        source: alert.source,
        scope: alert.scope,
        restriction: alert.restriction,
        addresses: alert.addresses,
        code: alert.code,
        note: alert.note,
        references: alert.references,
        incidents: alert.incidents,
        info: alert.info,
        area: alert.area,
        geometry: this.processIPAWSGeometry(alert),
        effective: alert.info?.[0]?.effective,
        onset: alert.info?.[0]?.onset,
        expires: alert.info?.[0]?.expires,
        sender_name: alert.info?.[0]?.senderName,
        event: alert.info?.[0]?.event,
        urgency: alert.info?.[0]?.urgency,
        severity: alert.info?.[0]?.severity,
        certainty: alert.info?.[0]?.certainty,
        audience: alert.info?.[0]?.audience,
        event_code: alert.info?.[0]?.eventCode,
        headline: alert.info?.[0]?.headline,
        description: alert.info?.[0]?.description,
        instruction: alert.info?.[0]?.instruction,
        web: alert.info?.[0]?.web,
        contact: alert.info?.[0]?.contact,
        parameter: alert.info?.[0]?.parameter,
        resource: alert.info?.[0]?.resource,
        area_desc: alert.info?.[0]?.area?.[0]?.areaDesc,
        polygon: alert.info?.[0]?.area?.[0]?.polygon,
        circle: alert.info?.[0]?.area?.[0]?.circle,
        geocode: alert.info?.[0]?.area?.[0]?.geocode,
        altitude: alert.info?.[0]?.area?.[0]?.altitude,
        ceiling: alert.info?.[0]?.area?.[0]?.ceiling,
        cap_raw_message: alert.rawMessage,
        hash: alert.hash,
        last_refresh: alert.lastRefresh || new Date().toISOString()
      }));

      // Batch insert
      for (let i = 0; i < alertData.length; i += this.BATCH_SIZE) {
        const batch = alertData.slice(i, i + this.BATCH_SIZE);
        
        const { error } = await this.supabase
          .from('fema.ipaws_alerts')
          .upsert(batch, {
            onConflict: 'alert_id',
            ignoreDuplicates: false
          });

        if (error) {
          logger.error(`Failed to insert alert batch ${i / this.BATCH_SIZE}`, error);
          throw error;
        }
      }

      await this.updateSyncStatus('ipaws_alerts', 'completed');
      logger.info('IPAWS alerts sync completed');
    } catch (error) {
      logger.error('IPAWS alerts sync failed', error);
      await this.updateSyncStatus('ipaws_alerts', 'error', error);
      throw error;
    }
  }

  // =====================================================
  // PUBLIC ASSISTANCE PROJECTS
  // =====================================================

  async syncPublicAssistanceProjects(
    disasterNumber?: number,
    state?: string
  ): Promise<void> {
    try {
      logger.info('Starting public assistance projects sync', { disasterNumber, state });

      const filters: string[] = [];

      if (disasterNumber) {
        filters.push(`disasterNumber eq ${disasterNumber}`);
      }

      if (state) {
        filters.push(`state eq '${state}'`);
      }

      // Default to recent projects if no filters
      if (filters.length === 0) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        filters.push(`lastRefresh ge '${thirtyDaysAgo.toISOString()}'`);
      }

      const filter = filters.join(' and ');
      const projects = await this.fetchAllRecords(
        '/v1/PublicAssistanceFundedProjectsDetails',
        filter
      );

      logger.info(`Fetched ${projects.length} PA projects`);

      // Process projects
      const projectData = projects.map((project: any) => ({
        disaster_number: project.disasterNumber,
        pa_project_number: project.projectNumber,
        damaged_facility: project.damagedFacility,
        damage_category: project.damageCategory,
        damage_category_name: project.damageCategoryName,
        work_category: project.workCategory,
        project_size: project.projectSize,
        state: project.state,
        county: project.county,
        county_fips: this.extractCountyFips(project.stateCode, project.countyCode),
        applicant_name: project.applicantName,
        applicant_type: project.applicantType,
        date_approved: project.dateApproved,
        date_closed: project.dateClosed,
        federal_share_obligated: project.federalShareObligated,
        total_obligated: project.totalObligated,
        total_cost: project.totalProjectCost,
        project_amount: project.projectAmount,
        location: project.latitude && project.longitude ? 
          `POINT(${project.longitude} ${project.latitude})` : null,
        status: project.status,
        completion_percentage: project.completionPercentage,
        hash: project.hash,
        last_refresh: project.lastRefresh || new Date().toISOString()
      }));

      // Batch insert
      for (let i = 0; i < projectData.length; i += this.BATCH_SIZE) {
        const batch = projectData.slice(i, i + this.BATCH_SIZE);
        
        const { error } = await this.supabase
          .from('fema.public_assistance_projects')
          .upsert(batch, {
            onConflict: 'disaster_number,pa_project_number,date_approved',
            ignoreDuplicates: false
          });

        if (error) {
          logger.error(`Failed to insert PA batch ${i / this.BATCH_SIZE}`, error);
          throw error;
        }
      }

      await this.updateSyncStatus('public_assistance', 'completed');
      logger.info('Public assistance projects sync completed');
    } catch (error) {
      logger.error('Public assistance sync failed', error);
      await this.updateSyncStatus('public_assistance', 'error', error);
      throw error;
    }
  }

  // =====================================================
  // HAZARD MITIGATION PROJECTS
  // =====================================================

  async syncHazardMitigationProjects(
    state?: string,
    programArea?: string
  ): Promise<void> {
    try {
      logger.info('Starting hazard mitigation projects sync', { state, programArea });

      const filters: string[] = [];

      if (state) {
        filters.push(`state eq '${state}'`);
      }

      if (programArea) {
        filters.push(`programArea eq '${programArea}'`);
      }

      const filter = filters.join(' and ');
      const projects = await this.fetchAllRecords(
        '/v1/HazardMitigationAssistanceProjects',
        filter
      );

      logger.info(`Fetched ${projects.length} HM projects`);

      // Process projects
      const projectData = projects.map((project: any) => ({
        project_id: project.projectIdentifier,
        disaster_number: project.disasterNumber,
        state: project.state,
        county: project.county,
        county_fips: this.extractCountyFips(project.stateCode, project.countyCode),
        project_title: project.projectTitle,
        project_type: project.projectType,
        project_status: project.status,
        date_approved: project.dateApproved,
        date_closed: project.dateClosed,
        federal_share: project.federalShare,
        local_share: project.localShare,
        total_cost: project.totalCost,
        benefit_cost_ratio: project.benefitCostRatio,
        properties_protected: project.propertiesProtected,
        project_description: project.projectDescription,
        location: project.latitude && project.longitude ? 
          `POINT(${project.longitude} ${project.latitude})` : null,
        hash: project.hash,
        last_refresh: project.lastRefresh || new Date().toISOString()
      }));

      // Batch insert
      for (let i = 0; i < projectData.length; i += this.BATCH_SIZE) {
        const batch = projectData.slice(i, i + this.BATCH_SIZE);
        
        const { error } = await this.supabase
          .from('fema.hazard_mitigation_projects')
          .upsert(batch, {
            onConflict: 'project_id',
            ignoreDuplicates: false
          });

        if (error) {
          logger.error(`Failed to insert HM batch ${i / this.BATCH_SIZE}`, error);
          throw error;
        }
      }

      await this.updateSyncStatus('hazard_mitigation', 'completed');
      logger.info('Hazard mitigation projects sync completed');
    } catch (error) {
      logger.error('Hazard mitigation sync failed', error);
      await this.updateSyncStatus('hazard_mitigation', 'error', error);
      throw error;
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private async fetchAllRecords(
    endpoint: string,
    filter?: string,
    select?: string
  ): Promise<any[]> {
    const allRecords: any[] = [];
    let skip = 0;
    let hasMore = true;

    while (hasMore && allRecords.length < this.MAX_RECORDS * 10) {
      const params: any = {
        '$top': this.MAX_RECORDS,
        '$skip': skip,
        '$count': 'true'
      };

      if (filter) {
        params['$filter'] = filter;
      }

      if (select) {
        params['$select'] = select;
      }

      try {
        const response = await this.femaClient.get(endpoint, { params });
        const data = response.data;

        if (Array.isArray(data)) {
          allRecords.push(...data);
          hasMore = data.length === this.MAX_RECORDS;
        } else if (data && Array.isArray(data.DisasterDeclarationsSummaries)) {
          // Handle wrapped response format
          allRecords.push(...data.DisasterDeclarationsSummaries);
          const totalCount = data.metadata?.count || 0;
          hasMore = allRecords.length < totalCount;
        } else if (data && data.metadata) {
          // Handle other wrapped formats
          const records = Object.values(data).find(v => Array.isArray(v)) as any[];
          if (records) {
            allRecords.push(...records);
            const totalCount = data.metadata.count || 0;
            hasMore = allRecords.length < totalCount;
          } else {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }

        skip += this.MAX_RECORDS;

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        logger.error(`Failed to fetch records from ${endpoint}`, error);
        throw error;
      }
    }

    return allRecords;
  }

  private extractCountyFips(stateCode?: string, countyCode?: string): string | null {
    if (!stateCode || !countyCode) return null;
    
    // Ensure state code is 2 digits and county code is 3 digits
    const state = String(stateCode).padStart(2, '0');
    const county = String(countyCode).padStart(3, '0');
    
    return `${state}${county}`;
  }

  private processIPAWSGeometry(alert: any): string | null {
    try {
      // Check for polygon in area
      if (alert.info?.[0]?.area?.[0]?.polygon) {
        const polygonStr = alert.info[0].area[0].polygon;
        const coords = polygonStr.split(' ').map((pair: string) => {
          const [lat, lon] = pair.split(',');
          return `${lon} ${lat}`;
        }).join(',');
        return `SRID=4326;POLYGON((${coords}))`;
      }

      // Check for circle
      if (alert.info?.[0]?.area?.[0]?.circle) {
        const circleStr = alert.info[0].area[0].circle;
        const [center, radius] = circleStr.split(' ');
        const [lat, lon] = center.split(',');
        // Store as point with radius in metadata
        return `SRID=4326;POINT(${lon} ${lat})`;
      }

      // Check for geocodes (FIPS codes)
      if (alert.info?.[0]?.area?.[0]?.geocode) {
        // Store geocodes in the geocode field instead
        return null;
      }

      return null;
    } catch (error) {
      logger.error('Failed to process IPAWS geometry', error);
      return null;
    }
  }

  private async updateSyncStatus(
    dataType: string,
    status: string,
    error?: any
  ): Promise<void> {
    const record = {
      data_type: dataType,
      last_sync_at: new Date().toISOString(),
      status,
      error_message: error ? error.message : null,
      records_synced: status === 'completed' ? 1 : 0
    };

    await this.supabase
      .from('sync_logs')
      .insert(record);
  }

  // =====================================================
  // SCHEDULED SYNC
  // =====================================================

  async performScheduledSync(): Promise<void> {
    logger.info('Starting scheduled FEMA data sync');

    try {
      // Sync disaster declarations for all states
      await this.syncDisasterDeclarations(undefined, undefined, false);

      // Sync recent IPAWS alerts
      await this.syncIPAWSAlerts();

      // Sync recent PA projects
      await this.syncPublicAssistanceProjects();

      // Sync HM projects for Florida
      await this.syncHazardMitigationProjects('FL');

      logger.info('Scheduled FEMA sync completed successfully');
    } catch (error) {
      logger.error('Scheduled FEMA sync failed', error);
      throw error;
    }
  }
}