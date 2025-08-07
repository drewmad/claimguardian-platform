import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ClaimPredictor } from "@/components/ai/ClaimPredictor";
import { FraudDetectionDashboard } from "@/components/fraud/FraudDetectionDashboard";
import { ComplianceChecker } from "@/components/compliance/ComplianceChecker";
import { SentimentAnalysisDashboard } from "@/components/sentiment/SentimentAnalysisDashboard";
import { PredictiveMaintenanceAlerts } from "@/components/maintenance/PredictiveMaintenanceAlerts";
import { toast } from "sonner";

// Mock Supabase client
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: {}, error: null }),
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({
          data: { user: { id: "test-user" } },
          error: null,
        }),
    },
    functions: {
      invoke: jest.fn().mockResolvedValue({ data: {}, error: null }),
    },
  }),
}));

// Mock sonner toast
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    warning: jest.fn(),
    info: jest.fn(),
  },
}));

describe("AI Features Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ClaimPredictor Component", () => {
    it("renders claim predictor interface", () => {
      render(<ClaimPredictor />);

      expect(
        screen.getByText("AI-Powered Claim Predictor"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Predict claim approval likelihood"),
      ).toBeInTheDocument();
    });

    it("analyzes claim when form is submitted", async () => {
      const user = userEvent.setup();
      render(<ClaimPredictor />);

      // Fill in claim details
      const claimTypeSelect = screen.getByLabelText(/claim type/i);
      await user.selectOptions(claimTypeSelect, "wind");

      const damageInput = screen.getByLabelText(/damage amount/i);
      await user.clear(damageInput);
      await user.type(damageInput, "25000");

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, "Roof damage from hurricane");

      // Submit analysis
      const analyzeButton = screen.getByRole("button", {
        name: /analyze claim/i,
      });
      await user.click(analyzeButton);

      // Wait for analysis to complete
      await waitFor(
        () => {
          expect(toast.success).toHaveBeenCalledWith(
            expect.stringContaining("Analysis complete"),
          );
        },
        { timeout: 3000 },
      );

      // Check for results
      expect(screen.getByText(/approval likelihood/i)).toBeInTheDocument();
    });

    it("displays risk factors after analysis", async () => {
      const user = userEvent.setup();
      render(<ClaimPredictor />);

      const analyzeButton = screen.getByRole("button", {
        name: /analyze claim/i,
      });
      await user.click(analyzeButton);

      await waitFor(() => {
        expect(screen.getByText(/risk factors/i)).toBeInTheDocument();
      });

      // Check for specific risk factors
      expect(
        screen.getByText(/documentation completeness/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/claim timing/i)).toBeInTheDocument();
    });
  });

  describe("FraudDetectionDashboard Component", () => {
    it("renders fraud detection dashboard", () => {
      render(<FraudDetectionDashboard />);

      expect(screen.getByText("Fraud Detection System")).toBeInTheDocument();
      expect(
        screen.getByText(/multi-layered AI analysis/i),
      ).toBeInTheDocument();
    });

    it("runs fraud scan when triggered", async () => {
      const user = userEvent.setup();
      render(<FraudDetectionDashboard />);

      const scanButton = screen.getByRole("button", {
        name: /run fraud scan/i,
      });
      await user.click(scanButton);

      // Check for loading state
      expect(screen.getByText(/scanning/i)).toBeInTheDocument();

      // Wait for scan to complete
      await waitFor(
        () => {
          expect(toast.success).toHaveBeenCalledWith(
            expect.stringContaining("Fraud scan complete"),
          );
        },
        { timeout: 4000 },
      );
    });

    it("displays fraud alerts after scan", async () => {
      render(<FraudDetectionDashboard />);

      // Check for alerts section
      const alertsTab = screen.getByRole("tab", { name: /active alerts/i });
      fireEvent.click(alertsTab);

      // Verify alert details are shown
      expect(
        screen.getByText(/suspicious patterns detected/i),
      ).toBeInTheDocument();
    });

    it("shows risk indicators properly", () => {
      render(<FraudDetectionDashboard />);

      // Navigate to indicators tab
      const indicatorsTab = screen.getByRole("tab", {
        name: /risk indicators/i,
      });
      fireEvent.click(indicatorsTab);

      // Check for various indicators
      expect(screen.getByText(/behavioral analysis/i)).toBeInTheDocument();
      expect(screen.getByText(/documentary analysis/i)).toBeInTheDocument();
      expect(screen.getByText(/pattern detection/i)).toBeInTheDocument();
    });
  });

  describe("ComplianceChecker Component", () => {
    it("renders compliance checker interface", () => {
      render(<ComplianceChecker />);

      expect(
        screen.getByText(/florida insurance compliance checker/i),
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/select claim to check/i),
      ).toBeInTheDocument();
    });

    it("runs compliance check when claim is selected", async () => {
      const user = userEvent.setup();
      render(<ComplianceChecker />);

      // Select a claim
      const claimSelect = screen.getByLabelText(/select claim to check/i);
      await user.selectOptions(claimSelect, "CLM-2024-0892");

      // Run compliance check
      const checkButton = screen.getByRole("button", {
        name: /run compliance check/i,
      });
      await user.click(checkButton);

      // Wait for check to complete
      await waitFor(
        () => {
          expect(toast.error).toHaveBeenCalledWith(
            expect.stringContaining("critical compliance issues"),
          );
        },
        { timeout: 3000 },
      );

      // Verify report is displayed
      expect(screen.getByText(/compliance score/i)).toBeInTheDocument();
    });

    it("shows Florida statute references", async () => {
      const user = userEvent.setup();
      render(<ComplianceChecker />);

      // Run check first
      const claimSelect = screen.getByLabelText(/select claim to check/i);
      await user.selectOptions(claimSelect, "CLM-2024-0892");

      const checkButton = screen.getByRole("button", {
        name: /run compliance check/i,
      });
      await user.click(checkButton);

      await waitFor(() => {
        expect(
          screen.getByText(/relevant florida statutes/i),
        ).toBeInTheDocument();
      });

      // Check for specific statutes
      expect(screen.getByText(/627.70131/)).toBeInTheDocument();
      expect(screen.getByText(/insurer duties/i)).toBeInTheDocument();
    });

    it("enables auto-fix functionality", async () => {
      const user = userEvent.setup();
      render(<ComplianceChecker />);

      // Enable auto-fix
      const autoFixCheckbox = screen.getByLabelText(/enable auto-fix/i);
      await user.click(autoFixCheckbox);

      // Select claim and run check
      const claimSelect = screen.getByLabelText(/select claim to check/i);
      await user.selectOptions(claimSelect, "CLM-2024-0892");

      const checkButton = screen.getByRole("button", {
        name: /run compliance check/i,
      });
      await user.click(checkButton);

      // Wait for critical issues alert
      await waitFor(() => {
        const applyFixesButton = screen.getByRole("button", {
          name: /apply available auto-fixes/i,
        });
        expect(applyFixesButton).toBeInTheDocument();
      });
    });
  });

  describe("SentimentAnalysisDashboard Component", () => {
    it("renders sentiment analysis dashboard", () => {
      render(<SentimentAnalysisDashboard />);

      expect(
        screen.getByText("Sentiment Analysis Dashboard"),
      ).toBeInTheDocument();
      expect(screen.getByText(/ai-powered analysis/i)).toBeInTheDocument();
    });

    it("analyzes test message sentiment", async () => {
      const user = userEvent.setup();
      render(<SentimentAnalysisDashboard />);

      // Navigate to communications tab
      const communicationsTab = screen.getByRole("tab", {
        name: /communications/i,
      });
      fireEvent.click(communicationsTab);

      // Enter test message
      const messageInput = screen.getByPlaceholderText(
        /enter customer message/i,
      );
      await user.type(
        messageInput,
        "I am very frustrated with the slow response time",
      );

      // Analyze sentiment
      const analyzeButton = screen.getByRole("button", {
        name: /analyze sentiment/i,
      });
      await user.click(analyzeButton);

      // Wait for analysis
      await waitFor(
        () => {
          expect(toast.success).toHaveBeenCalledWith(
            "Sentiment analysis complete",
          );
        },
        { timeout: 2000 },
      );
    });

    it("displays emotion breakdown correctly", () => {
      render(<SentimentAnalysisDashboard />);

      // Navigate to emotions tab
      const emotionsTab = screen.getByRole("tab", { name: /emotions/i });
      fireEvent.click(emotionsTab);

      // Check for emotion categories
      expect(screen.getByText(/satisfaction/i)).toBeInTheDocument();
      expect(screen.getByText(/frustration/i)).toBeInTheDocument();
      expect(screen.getByText(/confusion/i)).toBeInTheDocument();
      expect(screen.getByText(/urgency/i)).toBeInTheDocument();
      expect(screen.getByText(/trust/i)).toBeInTheDocument();
    });

    it("shows channel distribution", () => {
      render(<SentimentAnalysisDashboard />);

      // Check overview tab for channel distribution
      const overviewTab = screen.getByRole("tab", { name: /overview/i });
      fireEvent.click(overviewTab);

      expect(screen.getByText(/channel distribution/i)).toBeInTheDocument();
    });
  });

  describe("PredictiveMaintenanceAlerts Component", () => {
    it("renders predictive maintenance system", () => {
      render(<PredictiveMaintenanceAlerts />);

      expect(
        screen.getByText("Predictive Maintenance System"),
      ).toBeInTheDocument();
      expect(screen.getByText(/ai-powered predictions/i)).toBeInTheDocument();
    });

    it("runs predictive scan", async () => {
      const user = userEvent.setup();
      render(<PredictiveMaintenanceAlerts />);

      const scanButton = screen.getByRole("button", {
        name: /run predictive scan/i,
      });
      await user.click(scanButton);

      // Check for scanning state
      expect(screen.getByText(/scanning systems/i)).toBeInTheDocument();

      // Wait for scan completion
      await waitFor(
        () => {
          expect(toast.success).toHaveBeenCalledWith(
            expect.stringContaining("Predictive scan complete"),
          );
        },
        { timeout: 4000 },
      );
    });

    it("displays maintenance alerts", () => {
      render(<PredictiveMaintenanceAlerts />);

      // Check alerts tab
      const alertsTab = screen.getByRole("tab", { name: /active alerts/i });
      fireEvent.click(alertsTab);

      // Verify alert details
      expect(screen.getByText(/hvac/i)).toBeInTheDocument();
      expect(screen.getByText(/ac compressor/i)).toBeInTheDocument();
      expect(
        screen.getByText(/schedule preventive maintenance/i),
      ).toBeInTheDocument();
    });

    it("shows system health overview", () => {
      render(<PredictiveMaintenanceAlerts />);

      // Navigate to health tab
      const healthTab = screen.getByRole("tab", { name: /system health/i });
      fireEvent.click(healthTab);

      // Check for various systems
      expect(screen.getByText(/roof/i)).toBeInTheDocument();
      expect(screen.getByText(/plumbing/i)).toBeInTheDocument();
      expect(screen.getByText(/electrical/i)).toBeInTheDocument();
      expect(screen.getByText(/foundation/i)).toBeInTheDocument();
    });

    it("calculates cost savings correctly", () => {
      render(<PredictiveMaintenanceAlerts />);

      // Navigate to savings tab
      const savingsTab = screen.getByRole("tab", { name: /cost savings/i });
      fireEvent.click(savingsTab);

      // Verify savings calculations
      expect(
        screen.getByText(/potential savings this month/i),
      ).toBeInTheDocument();
      expect(screen.getByText(/vs emergency repairs/i)).toBeInTheDocument();
    });

    it("schedules maintenance when requested", async () => {
      const user = userEvent.setup();
      render(<PredictiveMaintenanceAlerts />);

      // Find and click schedule button for first alert
      const scheduleButtons = screen.getAllByRole("button", {
        name: /schedule/i,
      });
      await user.click(scheduleButtons[0]);

      // Verify toast notification
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Maintenance scheduled"),
      );
    });
  });

  describe("Component Integration", () => {
    it("all components render without errors", () => {
      const components = [
        <ClaimPredictor key="claim" />,
        <FraudDetectionDashboard key="fraud" />,
        <ComplianceChecker key="compliance" />,
        <SentimentAnalysisDashboard key="sentiment" />,
        <PredictiveMaintenanceAlerts key="maintenance" />,
      ];

      components.forEach((component) => {
        const { container } = render(component);
        expect(container.firstChild).toBeInTheDocument();
      });
    });

    it("components handle loading states properly", async () => {
      const user = userEvent.setup();

      // Test ClaimPredictor loading
      const { rerender } = render(<ClaimPredictor />);
      const analyzeButton = screen.getByRole("button", {
        name: /analyze claim/i,
      });
      await user.click(analyzeButton);
      expect(screen.getByText(/analyzing/i)).toBeInTheDocument();

      // Test FraudDetection loading
      rerender(<FraudDetectionDashboard />);
      const scanButton = screen.getByRole("button", {
        name: /run fraud scan/i,
      });
      await user.click(scanButton);
      expect(screen.getByText(/scanning/i)).toBeInTheDocument();
    });
  });
});
