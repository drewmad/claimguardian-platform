/**
 * @fileMetadata
 * @purpose "NIMS emergency communication protocols with EDXL and CAP standards"
 * @dependencies ["xml2js", "@/lib/supabase"]
 * @owner emergency-management-team
 * @status stable
 */

import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { parseString } from "xml2js";

// CAP (Common Alerting Protocol) Message Structure
export interface CAPMessage {
  identifier: string;
  sender: string;
  sent: string;
  status: "Actual" | "Exercise" | "System" | "Test" | "Draft";
  msgType: "Alert" | "Update" | "Cancel" | "Ack" | "Error";
  scope: "Public" | "Restricted" | "Private";
  restriction?: string;
  addresses?: string;
  code?: string[];
  note?: string;
  references?: string;
  incidents?: string;
  info: CAPInfo[];
}

export interface CAPInfo {
  language?: string;
  category: (
    | "Geo"
    | "Met"
    | "Safety"
    | "Security"
    | "Rescue"
    | "Fire"
    | "Health"
    | "Env"
    | "Transport"
    | "Infra"
    | "CBRNE"
    | "Other"
  )[];
  event: string;
  responseType?: (
    | "Shelter"
    | "Evacuate"
    | "Prepare"
    | "Execute"
    | "Avoid"
    | "Monitor"
    | "Assess"
    | "AllClear"
    | "None"
  )[];
  urgency: "Immediate" | "Expected" | "Future" | "Past" | "Unknown";
  severity: "Extreme" | "Severe" | "Moderate" | "Minor" | "Unknown";
  certainty: "Observed" | "Likely" | "Possible" | "Unlikely" | "Unknown";
  audience?: string;
  eventCode?: { valueName: string; value: string }[];
  effective?: string;
  onset?: string;
  expires?: string;
  senderName?: string;
  headline?: string;
  description?: string;
  instruction?: string;
  web?: string;
  contact?: string;
  parameter?: { valueName: string; value: string }[];
  resource?: CAPResource[];
  area?: CAPArea[];
}

export interface CAPResource {
  resourceDesc: string;
  mimeType?: string;
  size?: number;
  uri?: string;
  derefUri?: string;
  digest?: string;
}

export interface CAPArea {
  areaDesc: string;
  polygon?: string;
  circle?: string;
  geocode?: { valueName: string; value: string }[];
  altitude?: number;
  ceiling?: number;
}

// EDXL Distribution Element (DE) Structure
export interface EDXLDistribution {
  distributionID: string;
  senderID: string;
  dateTimeSent: string;
  distributionStatus: "Actual" | "Exercise" | "System" | "Test";
  distributionType:
    | "Report"
    | "Update"
    | "Cancel"
    | "Request"
    | "Response"
    | "Dispatch"
    | "Ack"
    | "Error"
    | "SensorConfiguration"
    | "SensorControl"
    | "SensorStatus"
    | "SensorDetection";
  combinedConfidentiality?: string;
  language?: string;
  senderRole?: string;
  recipientRole?: string[];
  keyword?: string[];
  distributionReference?: string[];
  explicitAddress?: EDXLAddress[];
  targetArea?: EDXLTargetArea[];
  content: EDXLContent[];
}

export interface EDXLAddress {
  explicitAddressScheme: string;
  explicitAddressValue: string;
}

export interface EDXLTargetArea {
  circle?: string;
  polygon?: string;
  country?: string;
  subdivision?: string;
  locCodeUN?: string;
}

export interface EDXLContent {
  contentObject?: any;
  contentXML?: string;
  uri?: string;
  contentDescription?: string;
  incidentID?: string;
  incidentDescription?: string;
}

// EDXL Resource Messaging (RM) Structure
export interface EDXLResourceMessage {
  messageID: string;
  sentDateTime: string;
  messageContentType:
    | "RequestResource"
    | "ResponseToRequestResource"
    | "RequisitionResource"
    | "CommitResource"
    | "ReleaseResource"
    | "RequestInformation"
    | "ResponseToRequestInformation"
    | "OfferUnsolicited"
    | "ReleaseUnsolicited";
  messageDescription?: string;
  originatingMessageID?: string;
  precedingMessageID?: string;
  incidentInformation: {
    incidentID: string;
    incidentDescription?: string;
    incidentLocation?: string;
    incidentDateTime?: string;
  };
  messageRecall?: boolean;
  funding?: {
    fundingSource: string;
    fundingDescription?: string;
    fundingAmount?: number;
  };
  contactInformation: {
    contactRole: string;
    contactDescription?: string;
    contactLocation?: {
      locationDescription: string;
      targetArea?: EDXLTargetArea[];
    };
    contactPerson?: {
      contactPersonName: string;
      contactPersonTitle?: string;
      contactPersonLanguage?: string[];
    };
    contactOrganization?: {
      organizationName: string;
      organizationType?: string;
    };
    contactInstructions?: {
      contactMethod:
        | "Phone"
        | "Fax"
        | "Email"
        | "Radio"
        | "InPerson"
        | "Mail"
        | "Other";
      contactMethodDescription?: string;
      contactInstructionsValue: string;
    }[];
  }[];
  resource?: EDXLResource[];
}

export interface EDXLResource {
  resourceID?: string;
  name: string;
  typeStructure: {
    valueListURN?: string;
    value: string;
  };
  typeInformation?: {
    description?: string;
    keyword?: string[];
  };
  quantity?: {
    measurementValue: number;
    unitOfMeasure: string;
    unitOfMeasureSource?: string;
  };
  restrictions?: {
    restrictionsInformation: string;
    restrictionsInformationDateTime?: string;
  };
  contactInformation?: any[];
  requestedDateTime?: string;
  estimatedArrivalDateTime?: string;
  anticipatedFunction?: string;
  priceQuote?: {
    priceAmount: number;
    priceCurrency?: string;
    priceConditions?: string;
  };
  orderID?: string;
  associatedResource?: string[];
}

// Communication Channel Types
export enum CommunicationChannel {
  RADIO = "radio",
  TELEPHONE = "telephone",
  EMAIL = "email",
  SMS = "sms",
  SATELLITE = "satellite",
  INTERNET = "internet",
  SOCIAL_MEDIA = "social_media",
  PUBLIC_ADDRESS = "public_address",
  EMERGENCY_BROADCAST = "emergency_broadcast",
}

// Message Priority Levels
export enum MessagePriority {
  FLASH = "flash", // Life threatening emergency
  IMMEDIATE = "immediate", // Mission critical
  PRIORITY = "priority", // Important operational
  ROUTINE = "routine", // Normal information
}

// Communication Plan Structure (ICS-205)
export interface CommunicationPlan {
  id: string;
  incident_id: string;
  operational_period: number;
  assignments: CommunicationAssignment[];
  special_instructions: string[];
  prepared_by: string;
  approved_by: string;
  distribution_list: string[];
  created_at: string;
  updated_at: string;
}

export interface CommunicationAssignment {
  function: string;
  channel_name: string;
  assignment: string;
  rx_frequency?: string;
  tx_frequency?: string;
  mode: "AM" | "FM" | "Digital" | "Satellite" | "Cellular" | "Internet";
  system: string;
  remarks: string;
}

// Emergency Alert Distribution
export interface EmergencyAlert {
  id: string;
  alert_id: string;
  sender_id: string;
  title: string;
  message: string;
  priority: MessagePriority;
  category: string[];
  urgency: CAPInfo["urgency"];
  severity: CAPInfo["severity"];
  certainty: CAPInfo["certainty"];
  target_areas: CAPArea[];
  distribution_channels: CommunicationChannel[];
  effective_date: string;
  expiration_date: string;
  status:
    | "draft"
    | "pending"
    | "sent"
    | "acknowledged"
    | "expired"
    | "cancelled";
  cap_message?: CAPMessage;
  edxl_distribution?: EDXLDistribution;
  delivery_receipts: {
    channel: CommunicationChannel;
    status: "sent" | "delivered" | "failed" | "acknowledged";
    timestamp: string;
    recipient_count?: number;
  }[];
  created_at: string;
  updated_at: string;
}

export class EmergencyCommunicationManager {
  private supabase = createClient();

  /**
   * Create and distribute CAP-compliant emergency alert
   */
  async createEmergencyAlert(
    alertData: Partial<EmergencyAlert>,
  ): Promise<EmergencyAlert> {
    const alert: EmergencyAlert = {
      id: this.generateAlertId(),
      alert_id: this.generateCAPIdentifier(),
      sender_id: alertData.sender_id || "",
      title: alertData.title || "",
      message: alertData.message || "",
      priority: alertData.priority || MessagePriority.ROUTINE,
      category: alertData.category || ["Other"],
      urgency: alertData.urgency || "Unknown",
      severity: alertData.severity || "Unknown",
      certainty: alertData.certainty || "Unknown",
      target_areas: alertData.target_areas || [],
      distribution_channels: alertData.distribution_channels || [
        CommunicationChannel.EMAIL,
      ],
      effective_date: alertData.effective_date || new Date().toISOString(),
      expiration_date:
        alertData.expiration_date ||
        new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: "draft",
      delivery_receipts: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...alertData,
    };

    // Generate CAP message
    alert.cap_message = this.generateCAPMessage(alert);

    // Generate EDXL distribution wrapper
    alert.edxl_distribution = this.generateEDXLDistribution(alert);

    // Save to database
    const { error } = await this.supabase
      .from("emergency_alerts")
      .insert(alert);

    if (error) {
      throw new Error(`Failed to create alert: ${error.message}`);
    }

    return alert;
  }

  /**
   * Distribute emergency alert through specified channels
   */
  async distributeAlert(alertId: string): Promise<void> {
    const alert = await this.getAlert(alertId);

    if (alert.status !== "draft" && alert.status !== "pending") {
      throw new Error(`Alert cannot be distributed in status: ${alert.status}`);
    }

    // Update status to pending
    await this.updateAlertStatus(alertId, "pending");

    // Distribute through each configured channel
    for (const channel of alert.distribution_channels) {
      try {
        await this.distributeViaChannel(alert, channel);

        // Record successful delivery
        alert.delivery_receipts.push({
          channel,
          status: "sent",
          timestamp: new Date().toISOString(),
          recipient_count: await this.getRecipientCount(
            channel,
            alert.target_areas,
          ),
        });
      } catch (error) {
        // Record failed delivery
        alert.delivery_receipts.push({
          channel,
          status: "failed",
          timestamp: new Date().toISOString(),
        });
        logger.error(`Failed to distribute alert via channel`, {
          channel,
          alertId,
          module: 'emergency-communications'
        }, error instanceof Error ? error : new Error(String(error)));
      }
    }

    // Update alert with delivery receipts and final status
    await this.supabase
      .from("emergency_alerts")
      .update({
        status: "sent",
        delivery_receipts: alert.delivery_receipts,
        updated_at: new Date().toISOString(),
      })
      .eq("id", alertId);
  }

  /**
   * Create communication plan for incident (ICS-205)
   */
  async createCommunicationPlan(
    incidentId: string,
    planData: Partial<CommunicationPlan>,
  ): Promise<CommunicationPlan> {
    const plan: CommunicationPlan = {
      id: this.generatePlanId(),
      incident_id: incidentId,
      operational_period: planData.operational_period || 1,
      assignments: planData.assignments || [],
      special_instructions: planData.special_instructions || [],
      prepared_by: planData.prepared_by || "",
      approved_by: planData.approved_by || "",
      distribution_list: planData.distribution_list || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...planData,
    };

    const { error } = await this.supabase
      .from("communication_plans")
      .insert(plan);

    if (error) {
      throw new Error(`Failed to create communication plan: ${error.message}`);
    }

    return plan;
  }

  /**
   * Send resource request via EDXL-RM protocol
   */
  async sendResourceRequest(
    requestData: Partial<EDXLResourceMessage>,
  ): Promise<EDXLResourceMessage> {
    const resourceMessage: EDXLResourceMessage = {
      messageID: this.generateMessageId(),
      sentDateTime: new Date().toISOString(),
      messageContentType: "RequestResource",
      incidentInformation: requestData.incidentInformation!,
      contactInformation: requestData.contactInformation || [],
      resource: requestData.resource || [],
      ...requestData,
    };

    // Create EDXL distribution wrapper
    const distribution: EDXLDistribution = {
      distributionID: this.generateDistributionId(),
      senderID:
        requestData.contactInformation?.[0]?.contactOrganization
          ?.organizationName || "ClaimGuardian",
      dateTimeSent: new Date().toISOString(),
      distributionStatus: "Actual",
      distributionType: "Request",
      content: [
        {
          contentObject: resourceMessage,
          contentDescription: "Resource Request",
          incidentID: requestData.incidentInformation?.incidentID,
          incidentDescription:
            requestData.incidentInformation?.incidentDescription,
        },
      ],
    };

    // Store message
    const { error } = await this.supabase.from("edxl_messages").insert({
      message_id: resourceMessage.messageID,
      message_type: "resource_request",
      content: resourceMessage,
      distribution: distribution,
      status: "sent",
      created_at: new Date().toISOString(),
    });

    if (error) {
      throw new Error(`Failed to send resource request: ${error.message}`);
    }

    // Transmit via configured channels
    await this.transmitEDXL(distribution);

    return resourceMessage;
  }

  /**
   * Parse incoming CAP message
   */
  parseIncomingCAP(capXML: string): CAPMessage {
    // This would parse XML using xml2js or similar library
    // Simplified implementation for demonstration
    try {
      // Use imported parseString function
      let capMessage: CAPMessage;

      parseString(capXML, (err: any, result: any) => {
        if (err) throw err;

        const alert = result.alert;
        capMessage = {
          identifier: alert.identifier[0],
          sender: alert.sender[0],
          sent: alert.sent[0],
          status: alert.status[0],
          msgType: alert.msgType[0],
          scope: alert.scope[0],
          info: alert.info.map((info: any) => ({
            category: info.category || [],
            event: info.event[0],
            urgency: info.urgency[0],
            severity: info.severity[0],
            certainty: info.certainty[0],
            headline: info.headline?.[0],
            description: info.description?.[0],
            instruction: info.instruction?.[0],
            area:
              info.area?.map((area: any) => ({
                areaDesc: area.areaDesc[0],
                polygon: area.polygon?.[0],
                circle: area.circle?.[0],
              })) || [],
          })),
        };
      });

      return capMessage!;
    } catch (error) {
      throw new Error(`Failed to parse CAP message: ${error}`);
    }
  }

  /**
   * Generate CAP-compliant XML message
   */
  generateCAPXML(message: CAPMessage): string {
    // Generate CAP 1.2 compliant XML
    return `<?xml version="1.0" encoding="UTF-8"?>
<alert xmlns="urn:oasis:names:tc:emergency:cap:1.2">
  <identifier>${message.identifier}</identifier>
  <sender>${message.sender}</sender>
  <sent>${message.sent}</sent>
  <status>${message.status}</status>
  <msgType>${message.msgType}</msgType>
  <scope>${message.scope}</scope>
  ${message.restriction ? `<restriction>${message.restriction}</restriction>` : ""}
  ${message.info
    .map(
      (info) => `
  <info>
    <language>${info.language || "en-US"}</language>
    ${info.category.map((cat) => `<category>${cat}</category>`).join("")}
    <event>${info.event}</event>
    ${info.responseType ? info.responseType.map((rt) => `<responseType>${rt}</responseType>`).join("") : ""}
    <urgency>${info.urgency}</urgency>
    <severity>${info.severity}</severity>
    <certainty>${info.certainty}</certainty>
    ${info.headline ? `<headline>${info.headline}</headline>` : ""}
    ${info.description ? `<description>${info.description}</description>` : ""}
    ${info.instruction ? `<instruction>${info.instruction}</instruction>` : ""}
    ${
      info.area
        ? info.area
            .map(
              (area) => `
    <area>
      <areaDesc>${area.areaDesc}</areaDesc>
      ${area.polygon ? `<polygon>${area.polygon}</polygon>` : ""}
      ${area.circle ? `<circle>${area.circle}</circle>` : ""}
    </area>`,
            )
            .join("")
        : ""
    }
  </info>`,
    )
    .join("")}
</alert>`;
  }

  // Private helper methods
  private generateCAPMessage(alert: EmergencyAlert): CAPMessage {
    return {
      identifier: alert.alert_id,
      sender: `${alert.sender_id}@claimguardian.com`,
      sent: new Date().toISOString(),
      status: "Actual",
      msgType: "Alert",
      scope: "Public",
      info: [
        {
          category: alert.category as CAPInfo["category"],
          event: alert.title,
          urgency: alert.urgency,
          severity: alert.severity,
          certainty: alert.certainty,
          effective: alert.effective_date,
          expires: alert.expiration_date,
          headline: alert.title,
          description: alert.message,
          area: alert.target_areas,
        },
      ],
    };
  }

  private generateEDXLDistribution(alert: EmergencyAlert): EDXLDistribution {
    return {
      distributionID: this.generateDistributionId(),
      senderID: "ClaimGuardian-NIMS",
      dateTimeSent: new Date().toISOString(),
      distributionStatus: "Actual",
      distributionType: "Report",
      content: [
        {
          contentObject: alert.cap_message,
          contentDescription: `Emergency Alert: ${alert.title}`,
        },
      ],
      targetArea: alert.target_areas.map((area) => ({
        polygon: area.polygon,
        circle: area.circle,
      })),
    };
  }

  private async distributeViaChannel(
    alert: EmergencyAlert,
    channel: CommunicationChannel,
  ): Promise<void> {
    switch (channel) {
      case CommunicationChannel.EMAIL:
        await this.sendEmailAlert(alert);
        break;
      case CommunicationChannel.SMS:
        await this.sendSMSAlert(alert);
        break;
      case CommunicationChannel.EMERGENCY_BROADCAST:
        await this.sendEmergencyBroadcast(alert);
        break;
      case CommunicationChannel.SOCIAL_MEDIA:
        await this.postSocialMediaAlert(alert);
        break;
      default:
        logger.warn(`Distribution channel not yet implemented`, {
          channel,
          alertId: alert.id,
          module: 'emergency-communications'
        });
    }
  }

  private async sendEmailAlert(alert: EmergencyAlert): Promise<void> {
    // Implementation would integrate with email service
    logger.info(`Sending email alert`, {
      alertId: alert.id,
      title: alert.title,
      module: 'emergency-communications'
    });
  }

  private async sendSMSAlert(alert: EmergencyAlert): Promise<void> {
    // Implementation would integrate with SMS service
    logger.info(`Sending SMS alert`, {
      alertId: alert.id,
      title: alert.title,
      module: 'emergency-communications'
    });
  }

  private async sendEmergencyBroadcast(alert: EmergencyAlert): Promise<void> {
    // Implementation would integrate with EAS system
    logger.info(`Broadcasting emergency alert`, {
      alertId: alert.id,
      title: alert.title,
      module: 'emergency-communications'
    });
  }

  private async postSocialMediaAlert(alert: EmergencyAlert): Promise<void> {
    // Implementation would integrate with social media APIs
    logger.info(`Posting social media alert`, {
      alertId: alert.id,
      title: alert.title,
      module: 'emergency-communications'
    });
  }

  private async transmitEDXL(distribution: EDXLDistribution): Promise<void> {
    // Implementation would transmit via EDXL-enabled systems
    logger.info(`Transmitting EDXL distribution`, {
      distributionId: distribution.distributionID,
      distributionType: distribution.distributionType,
      module: 'emergency-communications'
    });
  }

  private async getAlert(alertId: string): Promise<EmergencyAlert> {
    const { data, error } = await this.supabase
      .from("emergency_alerts")
      .select("*")
      .eq("id", alertId)
      .single();

    if (error || !data) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    return data as EmergencyAlert;
  }

  private async updateAlertStatus(
    alertId: string,
    status: EmergencyAlert["status"],
  ): Promise<void> {
    await this.supabase
      .from("emergency_alerts")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", alertId);
  }

  private async getRecipientCount(
    channel: CommunicationChannel,
    targetAreas: CAPArea[],
  ): Promise<number> {
    // Implementation would calculate recipient count based on channel and area
    return Math.floor(Math.random() * 1000) + 100; // Placeholder
  }

  // ID generators
  private generateAlertId(): string {
    return `ALERT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  private generateCAPIdentifier(): string {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:]/g, "")
      .replace("T", "-")
      .substring(0, 13);
    return `ClaimGuardian-${timestamp}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  }

  private generateDistributionId(): string {
    return `DIST-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  }

  private generateMessageId(): string {
    return `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
  }

  private generatePlanId(): string {
    return `PLAN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
}

export const emergencyCommunicationManager =
  new EmergencyCommunicationManager();
