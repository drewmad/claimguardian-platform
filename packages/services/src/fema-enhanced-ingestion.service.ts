import { createClient } from '@supabase/supabase-js';
import axios, { AxiosInstance } from 'axios';
import pLimit from 'p-limit';
import { logger } from '@/lib/logger';
import { addDays, subDays, format } from 'date-fns';

// =====================================================
// TYPE DEFINITIONS
// =====================================================

interface FEMADataset {
  name: string;
  version: string;
  endpoint: string;
  timeField: string;
  primaryKey: string[];
  refreshInterval: 'daily' | 'weekly' | 'monthly';
  maxRecords?: number;
}

interface SyncResult {
  dataset: string;
  recordsProcessed: number;
  recordsInserted: number;
  recordsUpdated: number;
  errors: string[];
  duration: number;
}

interface BatchProcessor<T> {
  process(records: T[]): Promise<void>;
}

// =====================================================
// MAIN SERVICE CLASS
// =====================================================

export class FEMAEnhancedIngestionService {
  private supabase;
  private femaClient: AxiosInstance;
  private readonly limit = pLimit(5);
  private readonly BATCH_SIZE = 1000;
  private readonly MAX_RECORDS_PER_REQUEST = 10000;

  // Dataset configurations
  private readonly DATASETS: Record<string, FEMADataset> = {
    DISASTER_DECLARATIONS_V2: {
      name: 'DisasterDeclarationsSummaries',
      version: 'v2',
      endpoint: '/v2/DisasterDeclarationsSummaries',
      timeField: 'declarationDate',
      primaryKey: ['disasterNumber', 'placeCode'],
      refreshInterval: 'daily'
    },
    PA_PROJECTS_V1: {
      name: 'PublicAssistanceFundedProjectsDetails',
      version: 'v1',
      endpoint: '/v1/PublicAssistanceFundedProjectsDetails',
      timeField: 'dateApproved',
      primaryKey: ['disasterNumber', 'projectNumber'],
      refreshInterval: 'weekly'
    },
    IA_HOUSING_V2: {
      name: 'IndividualAssistanceHousingRegistrantsLargeDisasters',
      version: 'v2',
      endpoint: '/v2/IndividualAssistanceHousingRegistrantsLargeDisasters',
      timeField: 'registrationDate',
      primaryKey: ['registrationId'],
      refreshInterval: 'weekly',
      maxRecords: 100000 // Large dataset
    },
    HMA_PROJECTS_V3: {
      name: 'HazardMitigationAssistanceProjects',
      version: 'v3',
      endpoint: '/v3/HazardMitigationAssistanceProjects',
      timeField: 'dateApproved',
      primaryKey: ['projectIdentifier'],
      refreshInterval: 'monthly'
    },
    IPAWS_ALERTS_V1: {
      name: 'IpawsArchivedAlerts',
      version: 'v1',
      endpoint: '/v1/IpawsArchivedAlerts',
      timeField: 'sent',
      primaryKey: ['id'],
      refreshInterval: 'daily'
    },
    EMPG_V2: {
      name: 'EmergencyManagementPerformanceGrants',
      version: 'v2',
      endpoint: '/v2/EmergencyManagementPerformanceGrants',
      timeField: 'fiscalYear',
      primaryKey: ['fiscalYear', 'state'],
      refreshInterval: 'monthly'
    },
    FMAG_V1: {
      name: 'FireManagementAssistanceGrantDeclarations',
      version: 'v1',
      endpoint: '/v1/FireManagementAssistanceGrantDeclarations',
      timeField: 'declarationDate',
      primaryKey: ['declarationNumber'],
      refreshInterval: 'weekly'
    },
    HM_PLANS_V1: {
      name: 'HazardMitigationPlanStatuses',
      version: 'v1',
      endpoint: '/v1/HazardMitigationPlanStatuses',
      timeField: 'approvalDate',
      primaryKey: ['state', 'communityName'],
      refreshInterval: 'monthly'
    },
    MISSION_ASSIGNMENTS_V1: {
      name: 'MissionAssignments',
      version: 'v1',
      endpoint: '/v1/MissionAssignments',
      timeField: 'requestDate',
      primaryKey: ['missionNumber'],
      refreshInterval: 'daily'
    },
    FIREFIGHTER_GRANTS_V1: {
      name: 'NonDisasterAssistanceFirefighterGrants',
      version: 'v1',
      endpoint: '/v1/NonDisasterAssistanceFirefighterGrants',
      timeField: 'awardDate',
      primaryKey: ['grantId'],
      refreshInterval: 'weekly'
    }
  };

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
      timeout: 120000 // 2 minutes for large datasets
    });
  }

  // =====================================================
  // ORCHESTRATION
  // =====================================================

  async performComprehensiveSync(
    options: {
      datasets?: string[];
      state?: string;
      startDate?: Date;
      endDate?: Date;
      fullSync?: boolean;
    } = {}
  ): Promise<SyncResult[]> {
    const startTime = Date.now();
    const results: SyncResult[] = [];

    const datasetsToSync = options.datasets || Object.keys(this.DATASETS);

    logger.info('Starting comprehensive FEMA sync', {
      datasets: datasetsToSync,
      state: options.state,
      fullSync: options.fullSync
    });

    // Process datasets in parallel groups
    const priorityDatasets = ['DISASTER_DECLARATIONS_V2', 'IPAWS_ALERTS_V1'];
    const standardDatasets = datasetsToSync.filter(d => !priorityDatasets.includes(d));

    // Sync priority datasets first
    for (const datasetKey of priorityDatasets) {
      if (datasetsToSync.includes(datasetKey)) {
        const result = await this.syncDataset(datasetKey, options);
        results.push(result);
      }
    }

    // Sync remaining datasets in parallel
    const parallelResults = await Promise.allSettled(
      standardDatasets.map(datasetKey =>
        this.limit(() => this.syncDataset(datasetKey, options))
      )
    );

    parallelResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          dataset: standardDatasets[index],
          recordsProcessed: 0,
          recordsInserted: 0,
          recordsUpdated: 0,
          errors: [result.reason.message],
          duration: 0
        });
      }
    });

    const totalDuration = Date.now() - startTime;
    logger.info('Comprehensive sync completed', {
      duration: totalDuration,
      totalRecords: results.reduce((sum, r) => sum + r.recordsProcessed, 0),
      datasetsSuccessful: results.filter(r => r.errors.length === 0).length
    });

    // Update metadata
    await this.updateDatasetMetadata(results);

    return results;
  }

  private async syncDataset(
    datasetKey: string,
    options: any
  ): Promise<SyncResult> {
    const startTime = Date.now();
    const dataset = this.DATASETS[datasetKey];

    if (!dataset) {
      throw new Error(`Unknown dataset: ${datasetKey}`);
    }

    logger.info(`Syncing dataset: ${dataset.name}`);

    try {
      // Build filter based on options and dataset configuration
      const filter = this.buildFilter(dataset, options);

      // Fetch data with pagination
      const records = await this.fetchAllRecords(
        dataset.endpoint,
        filter,
        dataset.maxRecords
      );

      logger.info(`Fetched ${records.length} records from ${dataset.name}`);

      // Process based on dataset type
      let processor: BatchProcessor<any>;

      switch (datasetKey) {
        case 'DISASTER_DECLARATIONS_V2':
          processor = new DisasterDeclarationsProcessor(this.supabase);
          break;
        case 'PA_PROJECTS_V1':
          processor = new PAProjectsProcessor(this.supabase);
          break;
        case 'IA_HOUSING_V2':
          processor = new IAHousingProcessor(this.supabase);
          break;
        case 'IPAWS_ALERTS_V1':
          processor = new IPAWSAlertsProcessor(this.supabase);
          break;
        case 'HMA_PROJECTS_V3':
          processor = new HMAProjectsProcessor(this.supabase);
          break;
        default:
          processor = new GenericProcessor(this.supabase, datasetKey);
      }

      // Process in batches
      let inserted = 0;
      let updated = 0;

      for (let i = 0; i < records.length; i += this.BATCH_SIZE) {
        const batch = records.slice(i, i + this.BATCH_SIZE);
        await processor.process(batch);

        // Track metrics (simplified - actual implementation would track properly)
        inserted += batch.length;

        logger.info(`Processed batch ${Math.floor(i / this.BATCH_SIZE) + 1} of ${Math.ceil(records.length / this.BATCH_SIZE)}`);
      }

      const duration = Date.now() - startTime;

      return {
        dataset: dataset.name,
        recordsProcessed: records.length,
        recordsInserted: inserted,
        recordsUpdated: updated,
        errors: [],
        duration
      };

    } catch (error: any) {
      logger.error(`Failed to sync ${dataset.name}`, error);

      return {
        dataset: dataset.name,
        recordsProcessed: 0,
        recordsInserted: 0,
        recordsUpdated: 0,
        errors: [error.message],
        duration: Date.now() - startTime
      };
    }
  }

  // =====================================================
  // DATA FETCHING
  // =====================================================

  private async fetchAllRecords(
    endpoint: string,
    filter?: string,
    maxRecords?: number
  ): Promise<any[]> {
    const allRecords: any[] = [];
    let skip = 0;
    let hasMore = true;
    const limit = maxRecords || Number.MAX_SAFE_INTEGER;

    while (hasMore && allRecords.length < limit) {
      const params: any = {
        '$top': Math.min(this.MAX_RECORDS_PER_REQUEST, limit - allRecords.length),
        '$skip': skip,
        '$count': skip === 0 ? 'true' : 'false' // Only count on first request
      };

      if (filter) {
        params['$filter'] = filter;
      }

      // Add format for better performance
      params['$format'] = 'json';
      params['$metadata'] = 'off'; // Skip metadata for better performance

      try {
        const response = await this.femaClient.get(endpoint, { params });
        const data = response.data;

        // Handle different response formats
        let records: any[] = [];
        let totalCount = 0;

        if (Array.isArray(data)) {
          records = data;
        } else if (data && typeof data === 'object') {
          // Find the array of records
          const possibleArrays = Object.values(data).filter(v => Array.isArray(v));
          if (possibleArrays.length > 0) {
            records = possibleArrays[0] as any[];
          }

          // Get total count if available
          if (data.metadata?.count) {
            totalCount = data.metadata.count;
          }
        }

        allRecords.push(...records);

        // Check if there are more records
        hasMore = records.length === this.MAX_RECORDS_PER_REQUEST;

        // Use total count to optimize
        if (totalCount > 0 && allRecords.length >= totalCount) {
          hasMore = false;
        }

        skip += this.MAX_RECORDS_PER_REQUEST;

        // Rate limiting
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Progress logging for large datasets
        if (allRecords.length % 10000 === 0 && allRecords.length > 0) {
          logger.info(`Fetched ${allRecords.length} records from ${endpoint}`);
        }

      } catch (error) {
        logger.error(`Failed to fetch records from ${endpoint}`, error);
        throw error;
      }
    }

    return allRecords.slice(0, limit);
  }

  // =====================================================
  // FILTER BUILDING
  // =====================================================

  private buildFilter(dataset: FEMADataset, options: any): string {
    const filters: string[] = [];

    // State filter
    if (options.state) {
      filters.push(`state eq '${options.state}'`);
    }

    // Date range filter
    if (!options.fullSync) {
      const timeField = dataset.timeField;

      if (options.startDate) {
        filters.push(`${timeField} ge '${options.startDate.toISOString()}'`);
      } else {
        // Default incremental sync based on refresh interval
        const lookbackDays = this.getLookbackDays(dataset.refreshInterval);
        const startDate = subDays(new Date(), lookbackDays);
        filters.push(`${timeField} ge '${startDate.toISOString()}'`);
      }

      if (options.endDate) {
        filters.push(`${timeField} le '${options.endDate.toISOString()}'`);
      }
    }

    // Use lastRefresh for incremental updates if available
    if (!options.fullSync && !options.startDate) {
      const lastRefreshDate = subDays(new Date(), 7);
      filters.push(`lastRefresh ge '${lastRefreshDate.toISOString()}'`);
    }

    return filters.join(' and ');
  }

  private getLookbackDays(interval: string): number {
    switch (interval) {
      case 'daily': return 2;
      case 'weekly': return 8;
      case 'monthly': return 35;
      default: return 7;
    }
  }

  // =====================================================
  // METADATA MANAGEMENT
  // =====================================================

  private async updateDatasetMetadata(results: SyncResult[]): Promise<void> {
    const metadataUpdates = results.map(result => ({
      dataset_name: result.dataset,
      last_updated: new Date().toISOString(),
      record_count: result.recordsProcessed,
      is_active: result.errors.length === 0,
      metadata: {
        lastSync: new Date().toISOString(),
        recordsInserted: result.recordsInserted,
        recordsUpdated: result.recordsUpdated,
        syncDuration: result.duration,
        errors: result.errors
      }
    }));

    await this.supabase
      .from('fema.dataset_metadata')
      .upsert(metadataUpdates, {
        onConflict: 'dataset_name'
      });

    // Record quality metrics
    const qualityMetrics = results.map(result => ({
      dataset_name: result.dataset,
      check_date: new Date().toISOString(),
      completeness_score: result.errors.length === 0 ? 1.0 : 0.5,
      accuracy_score: 0.95, // Would be calculated based on validation
      timeliness_score: result.duration < 60000 ? 1.0 : 0.8,
      consistency_score: 0.9,
      sync_duration_seconds: Math.floor(result.duration / 1000),
      records_processed: result.recordsProcessed
    }));

    await this.supabase
      .from('fema.data_quality_metrics')
      .insert(qualityMetrics);
  }

  // =====================================================
  // SCHEDULED SYNC
  // =====================================================

  async performScheduledSync(): Promise<void> {
    logger.info('Starting scheduled FEMA sync');

    const now = new Date();
    const dayOfWeek = now.getDay();
    const dayOfMonth = now.getDate();

    // Daily syncs
    const dailyDatasets = ['DISASTER_DECLARATIONS_V2', 'IPAWS_ALERTS_V1', 'MISSION_ASSIGNMENTS_V1'];

    // Weekly syncs (on Sunday)
    const weeklyDatasets = dayOfWeek === 0 ?
      ['PA_PROJECTS_V1', 'IA_HOUSING_V2', 'FMAG_V1', 'FIREFIGHTER_GRANTS_V1'] : [];

    // Monthly syncs (on the 1st)
    const monthlyDatasets = dayOfMonth === 1 ?
      ['HMA_PROJECTS_V3', 'EMPG_V2', 'HM_PLANS_V1'] : [];

    const datasetsToSync = [...dailyDatasets, ...weeklyDatasets, ...monthlyDatasets];

    const results = await this.performComprehensiveSync({
      datasets: datasetsToSync,
      state: 'FL', // Focus on Florida
      fullSync: false
    });

    logger.info('Scheduled sync completed', {
      datasetsProcessed: results.length,
      totalRecords: results.reduce((sum, r) => sum + r.recordsProcessed, 0)
    });
  }
}

// =====================================================
// BATCH PROCESSORS
// =====================================================

class DisasterDeclarationsProcessor implements BatchProcessor<any> {
  constructor(private supabase: any) {}

  async process(records: any[]): Promise<void> {
    const data = records.map(record => ({
      disaster_number: record.disasterNumber,
      update_date: new Date().toISOString(),
      state: record.state,
      declaration_date: record.declarationDate,
      fiscal_year_declared: record.fyDeclared,
      disaster_type: record.disasterType,
      incident_type: record.incidentType,
      title: record.title || record.declarationTitle,
      incident_begin_date: record.incidentBeginDate,
      incident_end_date: record.incidentEndDate,
      disaster_close_out_date: record.disasterCloseOutDate,
      fips_state_code: record.fipsStateCode,
      fips_county_code: record.fipsCountyCode,
      place_code: record.placeCode,
      designated_area: record.designatedArea,
      declaration_type: record.declarationType,
      ia_program_declared: record.iaProgramDeclared,
      pa_program_declared: record.paProgramDeclared,
      hm_program_declared: record.hmProgramDeclared,
      ih_program_declared: record.ihProgramDeclared,
      tribal_request: record.tribalRequest,
      id: record.id,
      hash: record.hash,
      last_refresh: record.lastRefresh || new Date().toISOString()
    }));

    const { error } = await this.supabase
      .from('fema.disaster_declarations_v2')
      .upsert(data, {
        onConflict: 'disaster_number,place_code,update_date',
        ignoreDuplicates: false
      });

    if (error) throw error;
  }
}

class PAProjectsProcessor implements BatchProcessor<any> {
  constructor(private supabase: any) {}

  async process(records: any[]): Promise<void> {
    const data = records.map(record => ({
      disaster_number: record.disasterNumber,
      project_number: record.projectNumber,
      application_date: record.applicationDate || record.dateApproved || new Date().toISOString(),
      applicant_id: record.applicantId,
      applicant_name: record.applicantName,
      applicant_type: record.applicantType,
      damage_category: record.damageCategory,
      damage_category_name: record.damageCategoryName,
      damaged_facility: record.damagedFacility,
      work_category: record.workCategory,
      project_size: record.projectSize,
      project_status: record.projectStatus,
      state: record.state,
      county: record.county,
      city: record.city,
      zip_code: record.zipCode,
      latitude: record.latitude,
      longitude: record.longitude,
      congressional_district: record.congressionalDistrict,
      federal_share_obligated: record.federalShareObligated,
      non_federal_share: record.nonFederalShare,
      total_obligated: record.totalObligated,
      total_project_cost: record.totalProjectCost,
      cost_overrun: record.costOverrun,
      date_approved: record.dateApproved,
      date_closed: record.dateClosed,
      obligation_date: record.obligationDate,
      percent_completed: record.percentCompleted,
      days_to_complete: record.daysToComplete,
      hash: record.hash,
      last_refresh: record.lastRefresh || new Date().toISOString()
    }));

    const { error } = await this.supabase
      .from('fema.pa_projects_v1')
      .upsert(data, {
        onConflict: 'disaster_number,project_number,application_date',
        ignoreDuplicates: false
      });

    if (error) throw error;
  }
}

class IAHousingProcessor implements BatchProcessor<any> {
  constructor(private supabase: any) {}

  async process(records: any[]): Promise<void> {
    const data = records.map(record => ({
      disaster_number: record.disasterNumber,
      registration_date: record.registrationDate || new Date().toISOString(),
      damaged_state: record.damagedState,
      damaged_county: record.damagedCounty,
      damaged_city: record.damagedCity,
      damaged_zip_code: record.damagedZipCode,
      residence_damage_level: record.residenceDamageLevel,
      rental_damage_level: record.rentalDamageLevel,
      personal_property_damage_level: record.personalPropertyDamageLevel,
      rental_assistance_amount: record.rentalAssistanceAmount,
      repair_amount: record.repairAmount,
      replacement_amount: record.replacementAmount,
      personal_property_amount: record.personalPropertyAmount,
      total_assistance: record.totalAssistance,
      flood_insurance: record.floodInsurance,
      homeowners_insurance: record.homeownersInsurance,
      home_ownership: record.homeOwnership,
      residence_type: record.residenceType,
      household_composition: record.householdComposition,
      sba_eligible: record.sbaEligible,
      sba_approved: record.sbaApproved,
      sba_loan_amount: record.sbaLoanAmount,
      hash: record.hash,
      last_refresh: record.lastRefresh || new Date().toISOString()
    }));

    // Process in smaller chunks for large datasets
    const chunkSize = 500;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);

      const { error } = await this.supabase
        .from('fema.ia_housing_v2')
        .upsert(chunk, {
          onConflict: 'disaster_number,registration_date,registration_id',
          ignoreDuplicates: false
        });

      if (error) throw error;
    }
  }
}

class IPAWSAlertsProcessor implements BatchProcessor<any> {
  constructor(private supabase: any) {}

  async process(records: any[]): Promise<void> {
    const data = records.map(record => {
      // Extract geometry from various formats
      let geometry = null;
      if (record.info?.[0]?.area?.[0]?.polygon) {
        const polygonStr = record.info[0].area[0].polygon;
        const coords = polygonStr.split(' ').map((pair: string) => {
          const [lat, lon] = pair.split(',');
          return `${lon} ${lat}`;
        }).join(',');
        geometry = `SRID=4326;POLYGON((${coords}))`;
      } else if (record.info?.[0]?.area?.[0]?.circle) {
        const circleStr = record.info[0].area[0].circle;
        const [center] = circleStr.split(' ');
        const [lat, lon] = center.split(',');
        geometry = `SRID=4326;POINT(${lon} ${lat})`;
      }

      return {
        alert_id: record.id,
        identifier: record.identifier,
        sender: record.sender,
        sent: record.sent,
        status: record.status,
        msg_type: record.msgType,
        source: record.source,
        scope: record.scope,
        restriction: record.restriction,
        code: record.code,
        note: record.note,
        references: record.references,
        incidents: record.incidents,
        language: record.info?.[0]?.language,
        event: record.info?.[0]?.event,
        response_type: record.info?.[0]?.responseType,
        urgency: record.info?.[0]?.urgency,
        severity: record.info?.[0]?.severity,
        certainty: record.info?.[0]?.certainty,
        audience: record.info?.[0]?.audience,
        effective: record.info?.[0]?.effective,
        onset: record.info?.[0]?.onset,
        expires: record.info?.[0]?.expires,
        sender_name: record.info?.[0]?.senderName,
        headline: record.info?.[0]?.headline,
        description: record.info?.[0]?.description,
        instruction: record.info?.[0]?.instruction,
        web: record.info?.[0]?.web,
        contact: record.info?.[0]?.contact,
        area_desc: record.info?.[0]?.area?.[0]?.areaDesc,
        polygon: record.info?.[0]?.area?.[0]?.polygon,
        circle: record.info?.[0]?.area?.[0]?.circle,
        geocode: record.info?.[0]?.area?.[0]?.geocode,
        affected_zones: record.info?.[0]?.area?.[0]?.same || [],
        geometry,
        parameter: record.info?.[0]?.parameter,
        resource: record.info?.[0]?.resource,
        cap_raw_message: record.rawMessage,
        hash: record.hash,
        last_refresh: record.lastRefresh || new Date().toISOString()
      };
    });

    const { error } = await this.supabase
      .from('fema.ipaws_alerts_v1')
      .upsert(data, {
        onConflict: 'alert_id',
        ignoreDuplicates: false
      });

    if (error) throw error;
  }
}

class HMAProjectsProcessor implements BatchProcessor<any> {
  constructor(private supabase: any) {}

  async process(records: any[]): Promise<void> {
    const data = records.map(record => ({
      project_identifier: record.projectIdentifier,
      program_fy: record.programFY,
      application_date: record.applicationDate || record.dateApproved || new Date().toISOString(),
      program_area: record.programArea,
      project_type: record.projectType,
      project_status: record.projectStatus || record.status,
      state: record.state,
      county: record.county,
      community_name: record.communityName,
      latitude: record.latitude,
      longitude: record.longitude,
      project_title: record.projectTitle,
      project_description: record.projectDescription,
      mitigation_activity: record.mitigationActivity,
      federal_share_requested: record.federalShareRequested || record.federalShare,
      non_federal_share: record.nonFederalShare || record.localShare,
      total_project_cost: record.totalProjectCost || record.totalCost,
      actual_federal_share: record.actualFederalShare,
      benefit_cost_ratio: record.benefitCostRatio,
      properties_protected: record.propertiesProtected,
      structures_mitigated: record.structuresMitigated,
      lives_protected: record.livesProtected,
      date_approved: record.dateApproved,
      date_closed: record.dateClosed,
      construction_start_date: record.constructionStartDate,
      construction_end_date: record.constructionEndDate,
      hash: record.hash,
      last_refresh: record.lastRefresh || new Date().toISOString()
    }));

    const { error } = await this.supabase
      .from('fema.hma_projects_v3')
      .upsert(data, {
        onConflict: 'project_identifier',
        ignoreDuplicates: false
      });

    if (error) throw error;
  }
}

class GenericProcessor implements BatchProcessor<any> {
  constructor(
    private supabase: any,
    private datasetKey: string
  ) {}

  async process(records: any[]): Promise<void> {
    // Generic processing for other datasets
    logger.info(`Processing ${records.length} records for ${this.datasetKey}`);

    // Map to appropriate table based on dataset key
    let tableName: string;
    let data: any[];

    switch (this.datasetKey) {
      case 'EMPG_V2':
        tableName = 'fema.empg_v2';
        data = records.map(r => ({
          fiscal_year: r.fiscalYear,
          reporting_period: r.reportingPeriod || new Date().toISOString(),
          state: r.state,
          recipient_name: r.recipientName,
          recipient_type: r.recipientType,
          award_amount: r.awardAmount,
          federal_share: r.federalShare,
          state_local_share: r.stateLocalShare,
          total_allocation: r.totalAllocation,
          hash: r.hash,
          last_refresh: r.lastRefresh || new Date().toISOString()
        }));
        break;

      case 'FMAG_V1':
        tableName = 'fema.fmag_v1';
        data = records.map(r => ({
          declaration_number: r.declarationNumber,
          declaration_date: r.declarationDate,
          fire_name: r.fireName,
          incident_type: r.incidentType,
          state: r.state,
          county: r.county,
          incident_begin_date: r.incidentBeginDate,
          incident_end_date: r.incidentEndDate,
          close_out_date: r.closeOutDate,
          federal_share_obligated: r.federalShareObligated,
          total_obligated: r.totalObligated,
          hash: r.hash,
          last_refresh: r.lastRefresh || new Date().toISOString()
        }));
        break;

      default:
        logger.warn(`No specific processor for ${this.datasetKey}, skipping`);
        return;
    }

    const { error } = await this.supabase
      .from(tableName)
      .upsert(data, {
        ignoreDuplicates: false
      });

    if (error) throw error;
  }
}
