"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
} from "react";

type Message = {
  id: string;
  direction: string;
  body: string;
  aiGenerated: boolean;
  approved: boolean;
  createdAt: string;
};

type Lead = {
  id: string;
  name?: string | null;
  email: string;
  website?: string | null;
  niche?: string | null;
  status: string;
  mode: string;
  deletedAt?: string | null;
  messages?: Message[];
};

type Campaign = {
  id: string;
  name: string;
  subject?: string | null;
  template: string;
  dailyLimit: number;
  status: string;
  sentCount?: number;
  skippedCount?: number;
  lastRunAt?: string | null;
  createdAt: string;
  gmailAccount?: {
    id: string;
    email: string;
  } | null;
  // 🔥 Follow-up fields
  followupSubject1?: string | null;
  followupTemplate1?: string | null;
  followupSubject2?: string | null;
  followupTemplate2?: string | null;
};

type GmailAccount = {
  id: string;
  email: string;
  signature: string;
  createdAt?: string;
  updatedAt?: string;
};

const menuItems = [
  "Dashboard",
  "Contacts",
  "AI Conversations",
  "Campaigns",
  "Templates",
  "Reports",
  "Settings",
];

const DEFAULT_SIGNATURE =
  "\n\nTayyab Niaz\nFreelance Blogger Expert";

export default function Home() {
  const [activePage, setActivePage] =
    useState("Dashboard");

  // =========================
  // Leads
  // =========================

  const [leads, setLeads] =
    useState<Lead[]>([]);

  const [loadingLeads, setLoadingLeads] =
    useState(false);

  const [leadError, setLeadError] =
    useState("");

  const [deletingLeadId, setDeletingLeadId] =
    useState("");

  const [selectedLeadId, setSelectedLeadId] =
    useState("");

  const [nicheFilter, setNicheFilter] =
    useState("ALL");

  const [archivedLeads, setArchivedLeads] =
    useState<Lead[]>([]);

  const [loadingArchivedLeads, setLoadingArchivedLeads] =
    useState(false);

  const [archivedError, setArchivedError] =
    useState("");

  const [historyLead, setHistoryLead] =
    useState<Lead | null>(null);

  const [loadingHistory, setLoadingHistory] =
    useState(false);

  const [conversationMessages, setConversationMessages] =
    useState<Message[]>([]);

  const [loadingConversation, setLoadingConversation] =
    useState(false);

  const [syncingGmail, setSyncingGmail] =
    useState(false);

  const [syncMessage, setSyncMessage] =
    useState("");

  // =========================
  // AI
  // =========================

  const [aiReply, setAiReply] =
    useState("");

  const [aiError, setAiError] =
    useState("");

  const [generatingReply, setGeneratingReply] =
    useState(false);

  const [auto, setAuto] =
    useState(true);

  const [aiConversationFilter, setAiConversationFilter] =
    useState<"ALL" | "REPLIED">("ALL");

  // =========================
  // Gmail Settings
  // =========================

  const [gmailAccounts, setGmailAccounts] =
    useState<GmailAccount[]>([]);

  const [loadingGmailAccounts, setLoadingGmailAccounts] =
    useState(false);

  const [selectedGmailAccountId, setSelectedGmailAccountId] =
    useState("");

  const [savingGmailAccountId, setSavingGmailAccountId] =
    useState("");

  const [gmailAccountMessage, setGmailAccountMessage] =
    useState("");

  // =========================
  // Campaigns
  // =========================
const [reportStats, setReportStats] = useState({
  totalContacts: 0,
  emailsSent: 0,
  totalReplies: 0,
  replyRate: "0",
  interestedCount: 0,
  totalCampaigns: 0,
  activeCampaigns: 0,
  recentSent: 0,
  recentReplies: 0,
});

const [loadingReports, setLoadingReports] = useState(false);
  const [campaigns, setCampaigns] =
    useState<Campaign[]>([]);

  const [loadingCampaigns, setLoadingCampaigns] =
    useState(false);

  const [campaignError, setCampaignError] =
    useState("");

  const [showCampaign, setShowCampaign] =
    useState(false);

  const [campaignName, setCampaignName] =
  useState("");

const [campaignSubject, setCampaignSubject] =
  useState("");

const [campaignTemplate, setCampaignTemplate] =
  useState("");

  const [campaignDailyLimit, setCampaignDailyLimit] =
    useState(30);

  const [campaignGmailAccountId, setCampaignGmailAccountId] =
    useState("");

  // 🔥 Follow-up state variables
  const [campaignFollowupSubject1, setCampaignFollowupSubject1] = useState("");
  const [campaignFollowupTemplate1, setCampaignFollowupTemplate1] = useState("");
  const [campaignFollowupSubject2, setCampaignFollowupSubject2] = useState("");
  const [campaignFollowupTemplate2, setCampaignFollowupTemplate2] = useState("");

  const [creatingCampaign, setCreatingCampaign] =
    useState(false);

  const [campaignMessage, setCampaignMessage] =
    useState("");

  const [sendingCampaignId, setSendingCampaignId] =
    useState("");

  // =========================
  // Campaign contacts
  // =========================

  const [manageCampaign, setManageCampaign] =
    useState<Campaign | null>(null);

  const [campaignLeads, setCampaignLeads] =
    useState<Lead[]>([]);

  const [
    selectedCampaignLeadIds,
    setSelectedCampaignLeadIds,
  ] = useState<string[]>([]);

  const [campaignNicheFilter, setCampaignNicheFilter] =
    useState("ALL");

  const [
    loadingCampaignLeads,
    setLoadingCampaignLeads,
  ] = useState(false);

  const [
    savingCampaignLeads,
    setSavingCampaignLeads,
  ] = useState(false);

  const [
    campaignLeadsError,
    setCampaignLeadsError,
  ] = useState("");

  // =========================
  // Load leads
  // =========================

  async function loadLeads() {
    try {
      setLoadingLeads(true);
      setLeadError("");

      const response = await fetch(
        "/api/leads",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to load leads"
        );
      }

      const leadList: Lead[] =
        Array.isArray(data?.leads)
          ? data.leads
          : [];

      setLeads(leadList);

      if (leadList.length > 0) {
        setSelectedLeadId((current) => {
          if (
            current &&
            leadList.some(
              (lead) =>
                lead.id === current
            )
          ) {
            return current;
          }

          return leadList[0].id;
        });
      } else {
        setSelectedLeadId("");
      }
    } catch (error) {
      console.error(
        "Lead loading error:",
        error
      );

      setLeadError(
        error instanceof Error
          ? error.message
          : "Failed to load leads"
      );
    } finally {
      setLoadingLeads(false);
    }
  }

  // =========================
  // Load archived contacts
  // =========================

  async function loadArchivedLeads() {
    try {
      setLoadingArchivedLeads(true);
      setArchivedError("");

      const response = await fetch(
        "/api/leads/archived",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to load archived contacts"
        );
      }

      setArchivedLeads(
        Array.isArray(data?.leads)
          ? data.leads
          : []
      );
    } catch (error) {
      console.error(
        "Archived leads loading error:",
        error
      );

      setArchivedError(
        error instanceof Error
          ? error.message
          : "Failed to load archived contacts"
      );
    } finally {
      setLoadingArchivedLeads(false);
    }
  }

  // =========================
  // View message history
  // =========================

  async function viewHistory(lead: Lead) {
    setHistoryLead(lead);
    setLoadingHistory(true);

    try {
      const response = await fetch(
        `/api/leads/${lead.id}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to load message history"
        );
      }

      setHistoryLead(data.lead);
    } catch (error) {
      console.error(
        "Message history loading error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to load message history"
      );
    } finally {
      setLoadingHistory(false);
    }
  }

  // =========================
  // Restore contact
  // =========================

  async function restoreLead(lead: Lead) {
    try {
      const response = await fetch(
        `/api/leads/${lead.id}`,
        {
          method: "PATCH",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to restore contact"
        );
      }

      setArchivedLeads((current) =>
        current.filter(
          (item) => item.id !== lead.id
        )
      );

      await loadLeads();

      alert(
        "Contact restored successfully."
      );
    } catch (error) {
      console.error(
        "Contact restore error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Failed to restore contact"
      );
    }
  }

  // =========================
  // Delete contact
  // =========================

  async function deleteLead(lead: Lead) {
    const confirmed = window.confirm(
      `Archive "${lead.name || lead.email}"? The contact will leave Active Contacts, but its message history will be preserved.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingLeadId(lead.id);
      setLeadError("");

      const response = await fetch(
        `/api/leads/${lead.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to delete contact"
        );
      }

      setLeads((current) =>
        current.filter(
          (item) => item.id !== lead.id
        )
      );

      if (selectedLeadId === lead.id) {
        setSelectedLeadId("");
        setAiReply("");
        setAiError("");
      }

      await loadCampaigns();
      await loadArchivedLeads();

      alert(
        "Contact archived successfully."
      );
    } catch (error) {
      console.error(
        "Contact delete error:",
        error
      );

      setLeadError(
        error instanceof Error
          ? error.message
          : "Failed to delete contact"
      );
    } finally {
      setDeletingLeadId("");
    }
  }

  // =========================
  // Load campaigns
  // =========================

  async function loadCampaigns() {
    try {
      setLoadingCampaigns(true);
      setCampaignError("");

      const response = await fetch(
        "/api/campaigns",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to load campaigns"
        );
      }

      const campaignList: Campaign[] =
        Array.isArray(data?.campaigns)
          ? data.campaigns
          : [];

      setCampaigns(campaignList);
    } catch (error) {
      console.error(
        "Campaign loading error:",
        error
      );

      setCampaignError(
        error instanceof Error
          ? error.message
          : "Failed to load campaigns"
      );
    } finally {
      setLoadingCampaigns(false);
    }
  }
// =========================
// Load Reports
// =========================

async function loadReports() {
  try {
    setLoadingReports(true);

    const response = await fetch("/api/reports", {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Failed to load reports");
    }

    setReportStats(data.stats);
  } catch (error) {
    console.error("Reports loading error:", error);
  } finally {
    setLoadingReports(false);
  }
}
  // =========================
  // Load Gmail Accounts
  // =========================

  async function loadGmailAccounts() {
    try {
      setLoadingGmailAccounts(true);
      setGmailAccountMessage("");

      const response = await fetch(
        "/api/gmail/account",
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to load Gmail accounts"
        );
      }

      const accounts: GmailAccount[] =
        Array.isArray(data?.accounts)
          ? data.accounts
          : [];

      setGmailAccounts(accounts);

      setSelectedGmailAccountId((current) => {
        if (
          current &&
          accounts.some(
            (account) =>
              account.id === current
          )
        ) {
          return current;
        }

        return accounts[0]?.id || "";
      });
    } catch (error) {
      console.error(
        "Gmail accounts loading error:",
        error
      );

      setGmailAccountMessage(
        error instanceof Error
          ? error.message
          : "Failed to load Gmail accounts"
      );
    } finally {
      setLoadingGmailAccounts(false);
    }
  }

  // =========================
  // Save Gmail Signature
  // =========================

  async function saveGmailSignature(
    account: GmailAccount
  ) {
    try {
      setSavingGmailAccountId(account.id);
      setGmailAccountMessage("");

      const response = await fetch(
        "/api/gmail/account",
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            accountId: account.id,
            signature:
              account.signature,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to save Gmail signature"
        );
      }

      setGmailAccounts((current) =>
        current.map((item) =>
          item.id === account.id
            ? {
                ...item,
                signature:
                  data?.account
                    ?.signature ??
                  item.signature,
              }
            : item
        )
      );

      setGmailAccountMessage(
        `${account.email} signature saved successfully.`
      );
    } catch (error) {
      console.error(
        "Gmail signature save error:",
        error
      );

      setGmailAccountMessage(
        error instanceof Error
          ? error.message
          : "Failed to save Gmail signature"
      );
    } finally {
      setSavingGmailAccountId("");
    }
  }

  // =========================
  // Initial loading
  // =========================

  useEffect(() => {
    loadLeads();
    loadCampaigns();
    loadArchivedLeads();
    loadGmailAccounts();
  }, []);

  // =========================
  // Load Gmail when Settings opens
  // =========================

  useEffect(() => {
    if (activePage === "Settings") {
      loadGmailAccounts();
    }
  }, [activePage]);
useEffect(() => {
  if (activePage === "Reports") {
    loadReports();
  }
}, [activePage]);
  // =========================
  // Load conversation history
  // =========================

  async function loadConversation(
    leadId: string
  ) {
    if (!leadId) {
      setConversationMessages([]);
      return;
    }

    try {
      setLoadingConversation(true);

      const response = await fetch(
        `/api/leads/${leadId}`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to load conversation history"
        );
      }

      const messages: Message[] =
        Array.isArray(
          data?.lead?.messages
        )
          ? data.lead.messages
          : [];

      setConversationMessages(messages);

      setLeads((current) =>
        current.map((lead) =>
          lead.id === leadId
            ? {
                ...lead,
                messages,
              }
            : lead
        )
      );
    } catch (error) {
      console.error(
        "Conversation loading error:",
        error
      );

      setAiError(
        error instanceof Error
          ? error.message
          : "Failed to load conversation history"
      );

      setConversationMessages([]);
    } finally {
      setLoadingConversation(false);
    }
  }

  useEffect(() => {
    loadConversation(selectedLeadId);
  }, [selectedLeadId]);

  // =========================
  // Sync Gmail Replies
  // =========================

  async function syncGmailReplies() {
    setSyncMessage("");

    try {
      setSyncingGmail(true);

      const response = await fetch(
        "/api/gmail/sync-replies",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to sync Gmail replies"
        );
      }

      const imported =
        Number(data?.imported || 0);

      const skipped =
        Number(data?.skipped || 0);

      const checked =
        Number(data?.checked || 0);

      setSyncMessage(
        `Gmail sync complete: ${imported} new repl${
          imported === 1 ? "y" : "ies"
        } imported, ${skipped} skipped, ${checked} checked.`
      );

      await loadLeads();

      if (selectedLeadId) {
        await loadConversation(
          selectedLeadId
        );
      }
    } catch (error) {
      console.error(
        "Gmail reply sync error:",
        error
      );

      setAiError(
        error instanceof Error
          ? error.message
          : "Failed to sync Gmail replies"
      );
    } finally {
      setSyncingGmail(false);
    }
  }

  // =========================
  // Generate AI Reply
  // =========================

  async function generateAIReply() {
    setAiError("");
    setAiReply("");

    if (!selectedLeadId) {
      setAiError(
        "Please select a contact first."
      );
      return;
    }

    try {
      setGeneratingReply(true);

      const response = await fetch(
        "/api/ai/reply",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            leadId: selectedLeadId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to generate AI reply"
        );
      }

      setAiReply(
        data?.reply || ""
      );
    } catch (error) {
      console.error(
        "AI reply error:",
        error
      );

      setAiError(
        error instanceof Error
          ? error.message
          : "Failed to generate AI reply"
      );
    } finally {
      setGeneratingReply(false);
    }
  }

  // =========================
  // Approve & Send
  // =========================

  async function approveAndSend() {
    setAiError("");

    if (!selectedLeadId) {
      setAiError(
        "Please select a contact first."
      );
      return;
    }

    if (!aiReply.trim()) {
      setAiError(
        "Generate an AI reply first."
      );
      return;
    }

    try {
      const response = await fetch(
        "/api/email/send",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            leadId: selectedLeadId,
            reply: aiReply.trim(),
            gmailAccountId:
              selectedGmailAccountId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to send email"
        );
      }

      setAiReply("");

      await loadLeads();
      await loadConversation(
        selectedLeadId
      );

      alert(
        `Email sent successfully${
          data?.messageId
            ? ` (ID: ${data.messageId})`
            : ""
        }.`
      );
    } catch (error) {
      console.error(
        "Approve & Send error:",
        error
      );

      setAiError(
        error instanceof Error
          ? error.message
          : "Failed to send email"
      );
    }
  }

  // =========================
  // CSV Import
  // =========================

  async function importCSV(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const text =
        await file.text();

      const lines = text
        .trim()
        .split(/\r?\n/);

      if (lines.length < 2) {
        alert(
          "CSV file is empty."
        );
        return;
      }

      const headers =
        lines[0]
          .split(",")
          .map((header) =>
            header
              .trim()
              .toLowerCase()
          );

      const rows = lines
        .slice(1)
        .map((line) => {
          const values =
            line.split(",");

          const row: Record<
            string,
            string
          > = {};

          headers.forEach(
            (
              header,
              index
            ) => {
              row[header] =
                values[index]
                  ?.trim() || "";
            }
          );

          return row;
        });

      const response =
        await fetch(
          "/api/leads/import",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify(
              rows
            ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "CSV import failed"
        );
      }

      alert(
        `${
          data.imported ??
          rows.length
        } contacts imported successfully.`
      );

      await loadLeads();
    } catch (error) {
      console.error(
        "CSV import error:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "CSV import failed"
      );
    }

    event.target.value = "";
  }

  // =========================
  // Campaign form
  // =========================

   function openCampaignForm() {
  setCampaignError("");
  setCampaignMessage("");
  setCampaignName("");
  setCampaignSubject("");
  setCampaignTemplate("");
    setCampaignDailyLimit(30);

    // 🔥 Reset follow-up fields
    setCampaignFollowupSubject1("");
    setCampaignFollowupTemplate1("");
    setCampaignFollowupSubject2("");
    setCampaignFollowupTemplate2("");

    setCampaignGmailAccountId(
      selectedGmailAccountId ||
        gmailAccounts[0]?.id ||
        ""
    );

    setShowCampaign(true);
  }

  function closeCampaignForm() {
    if (creatingCampaign) {
      return;
    }

    setShowCampaign(false);
    setCampaignError("");
    setCampaignMessage("");
  }

  // =========================
  // Create campaign
  // =========================

  async function createCampaign() {
    setCampaignError("");
    setCampaignMessage("");

    if (!campaignName.trim()) {
      setCampaignError(
        "Please enter a campaign name."
      );
      return;
    }

    if (!campaignTemplate.trim()) {
      setCampaignError(
        "Please enter an email template."
      );
      return;
    }

    if (
      !Number.isInteger(
        campaignDailyLimit
      ) ||
      campaignDailyLimit < 1
    ) {
      setCampaignError(
        "Daily limit must be at least 1."
      );
      return;
    }

    if (!campaignGmailAccountId) {
      setCampaignError(
        "Please connect and select a Gmail account first."
      );
      return;
    }

    try {
      setCreatingCampaign(true);

      const response =
        await fetch(
          "/api/campaigns",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
  name:
    campaignName.trim(),
  subject:
    campaignSubject.trim(),
  template:
    campaignTemplate.trim(),
                campaignDailyLimit,
              gmailAccountId:
                campaignGmailAccountId,
              // 🔥 Follow-up fields
              followupSubject1: campaignFollowupSubject1.trim(),
              followupTemplate1: campaignFollowupTemplate1.trim(),
              followupSubject2: campaignFollowupSubject2.trim(),
              followupTemplate2: campaignFollowupTemplate2.trim(),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to create campaign"
        );
      }

      setCampaignMessage(
        "Campaign created successfully!"
      );

      setCampaignName("");
      setCampaignTemplate("");
      setCampaignDailyLimit(30);

      // 🔥 Reset follow-up fields
      setCampaignFollowupSubject1("");
      setCampaignFollowupTemplate1("");
      setCampaignFollowupSubject2("");
      setCampaignFollowupTemplate2("");

      setCampaignGmailAccountId(
        selectedGmailAccountId ||
          gmailAccounts[0]?.id ||
          ""
      );

      await loadCampaigns();

      setTimeout(() => {
        setShowCampaign(false);
        setCampaignMessage("");
      }, 1000);
    } catch (error) {
      console.error(
        "Campaign creation error:",
        error
      );

      setCampaignError(
        error instanceof Error
          ? error.message
          : "Failed to create campaign"
      );
    } finally {
      setCreatingCampaign(false);
    }
  }


  // =========================
  // Delete campaign
  // =========================

  async function deleteCampaign(
    campaign: Campaign
  ) {
    const confirmed = window.confirm(
      `Delete campaign "${campaign.name}"? This will remove the campaign and its assigned contacts, but it will not delete your contacts, Gmail accounts, or message history.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setCampaignError("");
      setCampaignMessage("");
      setSendingCampaignId(campaign.id);

      const response = await fetch(
        `/api/campaigns/${campaign.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to delete campaign"
        );
      }

      setCampaigns((current) =>
        current.filter(
          (item) => item.id !== campaign.id
        )
      );

      setCampaignMessage(
        data?.message ||
          `Campaign "${campaign.name}" deleted successfully.`
      );
    } catch (error) {
      console.error(
        "Campaign delete error:",
        error
      );

      setCampaignError(
        error instanceof Error
          ? error.message
          : "Failed to delete campaign"
      );
    } finally {
      setSendingCampaignId("");
    }
  }

  // =========================
  // Send campaign
  // =========================

  async function sendCampaign(
    campaign: Campaign
  ) {
    const confirmed =
      window.confirm(
        `Send this campaign to eligible contacts now? Daily limit: ${campaign.dailyLimit}.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setSendingCampaignId(
        campaign.id
      );

      setCampaignError("");
      setCampaignMessage("");

      const response = await fetch(
        `/api/campaigns/${campaign.id}/send`,
        {
          method: "POST",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to send campaign"
        );
      }

      const errors =
        Array.isArray(
          data?.errors
        )
          ? data.errors
          : [];

      const errorText =
        errors.length > 0
          ? ` ${errors.length} email(s) failed.`
          : "";

      setCampaignMessage(
        `Campaign complete: ${Number(
          data?.sent || 0
        )} sent, ${Number(
          data?.skipped || 0
        )} skipped. ${Number(
          data?.remaining || 0
        )} daily sends remaining.${errorText}`
      );

      await loadCampaigns();
      await loadLeads();

      if (selectedLeadId) {
        await loadConversation(
          selectedLeadId
        );
      }
    } catch (error) {
      console.error(
        "Campaign send error:",
        error
      );

      setCampaignError(
        error instanceof Error
          ? error.message
          : "Failed to send campaign"
      );
    } finally {
      setSendingCampaignId("");
    }
  }

  // =========================
  // Activate / Pause campaign
  // =========================

  async function updateCampaignStatus(
    campaign: Campaign
  ) {
    const nextStatus =
      campaign.status === "ACTIVE"
        ? "PAUSED"
        : "ACTIVE";

    const action =
      nextStatus === "ACTIVE"
        ? "activate"
        : "pause";

    const confirmed =
      window.confirm(
        `${
          action === "activate"
            ? "Activate"
            : "Pause"
        } campaign "${campaign.name}"?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setCampaignError("");
      setCampaignMessage("");

      const response = await fetch(
        `/api/campaigns/${campaign.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to update campaign status"
        );
      }

      setCampaignMessage(
        `Campaign ${
          action === "activate"
            ? "activated"
            : "paused"
        } successfully.`
      );

      await loadCampaigns();
    } catch (error) {
      console.error(
        "Campaign status update error:",
        error
      );

      setCampaignError(
        error instanceof Error
          ? error.message
          : "Failed to update campaign status"
      );
    }
  }

  // =========================
  // Open campaign contacts
  // =========================

  async function openCampaignContacts(
    campaign: Campaign
  ) {
    setManageCampaign(campaign);
    setCampaignLeads([]);
    setSelectedCampaignLeadIds([]);
    setCampaignNicheFilter("ALL");
    setCampaignLeadsError("");
    setLoadingCampaignLeads(true);

    try {
      const response =
        await fetch(
          `/api/campaigns/${campaign.id}/leads`,
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to load campaign contacts"
        );
      }

      const assignedLeads: Lead[] =
        Array.isArray(
          data?.leads
        )
          ? data.leads
          : [];

      setCampaignLeads(
        assignedLeads
      );

      setSelectedCampaignLeadIds(
        assignedLeads.map(
          (lead) => lead.id
        )
      );
    } catch (error) {
      console.error(
        "Campaign contacts error:",
        error
      );

      setCampaignLeadsError(
        error instanceof Error
          ? error.message
          : "Failed to load campaign contacts"
      );
    } finally {
      setLoadingCampaignLeads(false);
    }
  }

  const campaignNicheOptions = Array.from(
    new Set(
      leads
        .map((lead) => lead.niche?.trim())
        .filter(
          (niche): niche is string =>
            Boolean(niche)
        )
    )
  ).sort((a, b) => a.localeCompare(b));

  const filteredCampaignContacts =
    campaignNicheFilter === "ALL"
      ? leads
      : leads.filter(
          (lead) =>
            (lead.niche?.trim() || "") ===
            campaignNicheFilter
        );

  const filteredCampaignSelectedCount =
    filteredCampaignContacts.filter((lead) =>
      selectedCampaignLeadIds.includes(lead.id)
    ).length;

  // =========================
  // Select/unselect campaign leads
  // =========================

  function toggleCampaignLead(
    leadId: string
  ) {
    setSelectedCampaignLeadIds(
      (current) =>
        current.includes(leadId)
          ? current.filter(
              (id) =>
                id !== leadId
            )
          : [
              ...current,
              leadId,
            ]
    );
  }

  // =========================
  // Save campaign contacts
  // =========================

  async function saveCampaignContacts() {
    if (!manageCampaign) {
      return;
    }

    if (
      selectedCampaignLeadIds.length ===
      0
    ) {
      setCampaignLeadsError(
        "Please select at least one contact."
      );
      return;
    }

    try {
      setSavingCampaignLeads(true);
      setCampaignLeadsError("");

      const response =
        await fetch(
          `/api/campaigns/${manageCampaign.id}/leads`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              leadIds:
                selectedCampaignLeadIds,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Failed to assign campaign contacts"
        );
      }

      const assignedLeads: Lead[] =
        Array.isArray(
          data?.leads
        )
          ? data.leads
          : [];

      setCampaignLeads(
        assignedLeads
      );

      setSelectedCampaignLeadIds(
        assignedLeads.map(
          (lead) => lead.id
        )
      );

      alert(
        "Contacts added to campaign successfully."
      );
    } catch (error) {
      console.error(
        "Campaign contacts save error:",
        error
      );

      setCampaignLeadsError(
        error instanceof Error
          ? error.message
          : "Failed to assign campaign contacts"
      );
    } finally {
      setSavingCampaignLeads(false);
    }
  }

  const repliedLeads =
    leads.filter(
      (lead) =>
        lead.status.toUpperCase() ===
        "REPLIED"
    );

  const aiConversationLeads =
    aiConversationFilter === "REPLIED"
      ? repliedLeads
      : leads;

  const nicheOptions = Array.from(
    new Set(
      leads
        .map((lead) => lead.niche?.trim())
        .filter((niche): niche is string => Boolean(niche))
    )
  ).sort((a, b) => a.localeCompare(b));

  const filteredContacts =
    nicheFilter === "ALL"
      ? leads
      : leads.filter(
          (lead) =>
            (lead.niche?.trim() || "") === nicheFilter
        );

  const selectedLead =
    leads.find(
      (lead) =>
        lead.id ===
        selectedLeadId
    );

  useEffect(() => {
    if (aiConversationFilter !== "REPLIED") {
      return;
    }

    if (repliedLeads.length === 0) {
      return;
    }

    const selectedIsReplied = repliedLeads.some(
      (lead) => lead.id === selectedLeadId
    );

    if (!selectedIsReplied) {
      setSelectedLeadId(repliedLeads[0].id);
      setAiReply("");
      setAiError("");
    }
  }, [
    aiConversationFilter,
    selectedLeadId,
    repliedLeads.length,
  ]);

  // =========================
  // Dashboard
  // =========================

  function renderDashboard() {
    return (
      <>
        <section className="grid stats">
          <div className="card">
            <div className="muted">
              Contacts
            </div>

            <div className="stat">
              {leads.length}
            </div>
          </div>

          <div className="card">
            <div className="muted">
              Emails Sent
            </div>

            <div className="stat">
              0
            </div>
          </div>

          <div className="card">
            <div className="muted">
              Replies
            </div>

            <div className="stat">
              0
            </div>
          </div>

          <div className="card">
            <div className="muted">
              Interested
            </div>

            <div className="stat">
              0
            </div>
          </div>
        </section>

        <section className="grid two">
          <div className="card">
            <div className="top">
              <h2>
                Contacts
              </h2>

              <span className="pill">
                {leads.length} total
              </span>
            </div>

            {loadingLeads ? (
              <p className="muted">
                Loading contacts...
              </p>
            ) : leadError ? (
              <p className="muted">
                {leadError}
              </p>
            ) : leads.length ===
              0 ? (
              <p className="muted">
                No contacts yet.
                Import a CSV from                Contacts.
              </p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>
                      Contact
                    </th>

                    <th>
                      Website
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Mode
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {leads
                    .slice(0, 10)
                    .map(
                      (lead) => (
                        <tr
                          key={
                            lead.id
                          }
                          onClick={() => {
                            setSelectedLeadId(
                              lead.id
                            );

                            setActivePage(
                              "AI Conversations"
                            );

                            setAiReply(
                              ""
                            );

                            setAiError(
                              ""
                            );
                          }}
                          style={{
                            cursor:
                              "pointer",
                          }}
                        >
                          <td>
                            {lead.name ||
                              "-"}

                            <div className="muted small">
                              {
                                lead.email
                              }
                            </div>
                          </td>

                          <td>
                            {
                              lead.website ||
                              "-"
                            }
                          </td>

                          <td>
                            <span className="pill">
                              {
                                lead.status
                              }
                            </span>
                          </td>

                          <td>
                            <span className="pill">
                              {
                                lead.mode
                              }
                            </span>
                          </td>
                        </tr>
                      )
                    )}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <div className="top">
              <div>
                <h2>
                  {selectedLead?.name ||
                    "AI Conversation"}
                </h2>

                <div className="muted">
                  {selectedLead?.website ||
                    selectedLead?.email ||
                    "Select a contact"}
                </div>
              </div>

              <span className="pill">
                {auto
                  ? "AI Auto"
                  : "Approval Required"}
              </span>
            </div>

            <div className="chat">
              {loadingConversation ? (
                <div className="msg in">
                  Loading conversation history...
                </div>
              ) : conversationMessages.length === 0 ? (
                <div className="msg in">
                  No saved messages for this contact yet.
                </div>
              ) : (
                conversationMessages.map(
                  (message) => (
                    <div
                      key={
                        message.id
                      }
                      className={
                        message.direction
                          .toUpperCase()
                          .includes("OUT")
                          ? "msg out"
                          : "msg in"
                      }
                    >
                      <div
                        className="small"
                        style={{
                          marginBottom: 4,
                        }}
                      >
                        {message.direction.toUpperCase()}{" "}
                        ·{" "}
                        {new Date(
                          message.createdAt
                        ).toLocaleString()}
                      </div>

                      <div
                        style={{
                          whiteSpace:
                            "pre-wrap",
                        }}
                      >
                        {
                          message.body
                        }
                      </div>
                    </div>
                  )
                )
              )}

              {aiReply && (
                <div className="msg out">
                  {aiReply}
                </div>
              )}
            </div>

            {aiError && (
              <div
                style={{
                  background:
                    "#fbe9e9",
                  color:
                    "#a52a2a",
                  padding: 10,
                  borderRadius: 8,
                  marginTop: 12,
                }}
              >
                {aiError}
              </div>
            )}

            <div
              style={{
                display:
                  "flex",
                gap: 8,
                marginTop:
                  14,
                flexWrap:
                  "wrap",
              }}
            >
              <button
                onClick={
                  generateAIReply
                }
                disabled={
                  generatingReply
                }
              >
                {generatingReply
                  ? "Generating..."
                  : "Generate AI Reply"}
              </button>

              {aiReply && (
                <button
                  onClick={
                    approveAndSend
                  }
                >
                  Approve & Send
                </button>
              )}
            </div>

            <label
              style={{
                display:
                  "block",
                marginTop:
                  14,
              }}
            >
              <input
                type="checkbox"
                checked={auto}
                onChange={(e) =>
                  setAuto(
                    e.target.checked
                  )
                }
              />{" "}
              Enable AI
              auto-replies
            </label>
          </div>
        </section>

        <section
          className="card"
          style={{
            marginTop: 16,
          }}
        >
          <h2>
            Campaign Safety
          </h2>

          <p className="muted">
            Use provider-approved
            accounts, respect daily
            limits, honor opt-outs, and
            keep human approval available
            for negotiations or unusual
            requests.
          </p>

          <span className="pill">
            Daily limit: 30
          </span>

          <span
            className="pill"
            style={{
              marginLeft: 8,
            }}
          >
            Opt-out protection: ON
          </span>

          <span
            className="pill"
            style={{
              marginLeft: 8,
            }}
          >
            Bounce protection: ON
          </span>
        </section>
      </>
    );
  }

  // =========================
  // Contacts
  // =========================

  function renderContacts() {
    return (
      <>
        <div className="card">
          <div className="top">
            <div>
              <h2>
                Contacts
              </h2>

              <p className="muted">
                Manage your outreach
                leads and website
                contacts.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <select
                value={nicheFilter}
                onChange={(e) =>
                  setNicheFilter(e.target.value)
                }
                style={{
                  padding: 10,
                  border: "1px solid #dbe8f0",
                  borderRadius: 8,
                  background: "#fff",
                }}
              >
                <option value="ALL">All Niches ({leads.length})</option>
                {nicheOptions.map((niche) => (
                  <option key={niche} value={niche}>
                    {niche} ({leads.filter((lead) => (lead.niche?.trim() || "") === niche).length})
                  </option>
                ))}
              </select>

              <input
                id="csvFile"
                type="file"
                accept=".csv"
                style={{
                  display:
                    "none",
                }}
                onChange={
                  importCSV
                }
              />

              <button
                onClick={() =>
                  document
                    .getElementById(
                      "csvFile"
                    )
                    ?.click()
                }
              >
                Import CSV
              </button>
            </div>
          </div>

          <div
            className="muted small"
            style={{ marginTop: 10, marginBottom: 10 }}
          >
            Showing {filteredContacts.length} of {leads.length} contacts
          </div>

          {loadingLeads ? (
            <p className="muted">
              Loading contacts...
            </p>
          ) : leadError ? (
            <p className="muted">
              {leadError}
            </p>
          ) : leads.length ===
            0 ? (
            <p className="muted">
              No contacts found.
            </p>
          ) : filteredContacts.length === 0 ? (
            <p className="muted">
              No contacts found for the selected niche.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Website</th>
                  <th>Niche</th>
                  <th>Status</th>
                  <th>Mode</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredContacts.map(
                  (lead) => (
                    <tr
                      key={
                        lead.id
                      }
                      onClick={() => {
                        setSelectedLeadId(
                          lead.id
                        );

                        setAiReply(
                          ""
                        );

                        setAiError(
                          ""
                        );
                      }}
                      style={{
                        cursor:
                          "pointer",
                      }}
                    >
                      <td>
                        {lead.name ||
                          "-"}
                      </td>

                      <td>
                        {lead.email}
                      </td>

                      <td>
                        {lead.website ||
                          "-"}
                      </td>

                      <td>
                        {lead.niche ||
                          "-"}
                      </td>

                      <td>
                        <span className="pill">
                          {
                            lead.status
                          }
                        </span>
                      </td>

                      <td>
                        <span className="pill">
                          {
                            lead.mode
                          }
                        </span>
                      </td>

                      <td>
                        <button
                          onClick={(
                            event
                          ) => {
                            event.stopPropagation();

                            deleteLead(
                              lead
                            );
                          }}
                          disabled={
                            deletingLeadId ===
                            lead.id
                          }
                          style={{
                            opacity:
                              deletingLeadId ===
                              lead.id
                                ? 0.6
                                : 1,
                          }}
                        >
                          {deletingLeadId ===
                          lead.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>

        <div
          className="card"
          style={{
            marginTop: 16,
          }}
        >
          <div className="top">
            <div>
              <h2>
                Archived Contacts
              </h2>

              <p className="muted">
                Archived contacts remain in the database so their message history is preserved.
              </p>
            </div>

            <span className="pill">
              {
                archivedLeads.length
              }{" "}
              archived
            </span>
          </div>

          {loadingArchivedLeads ? (
            <p className="muted">
              Loading archived contacts...
            </p>
          ) : archivedError ? (
            <p className="muted">
              {archivedError}
            </p>
          ) : archivedLeads.length ===
            0 ? (
            <p className="muted">
              No archived contacts.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Archived</th>
                  <th>History</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {archivedLeads.map(
                  (lead) => (
                    <tr
                      key={
                        lead.id
                      }
                    >
                      <td>
                        {
                          lead.name ||
                          "-"
                        }
                      </td>

                      <td>
                        {lead.email}
                      </td>

                      <td>
                        {lead.deletedAt
                          ? new Date(
                              lead.deletedAt
                            ).toLocaleDateString()
                          : "-"}
                      </td>

                      <td>
                        <button
                          onClick={() =>
                            viewHistory(
                              lead
                            )
                          }
                        >
                          View History
                        </button>
                      </td>

                      <td>
                        <button
                          onClick={() =>
                            restoreLead(
                              lead
                            )
                          }
                        >
                          Restore
                        </button>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          )}
        </div>
      </>
    );
  }

  // =========================
  // AI Conversations
  // =========================

  function renderAIConversations() {
    return (
      <div className="card">
        <div className="top">
          <div>
            <h2>
              AI Conversations
            </h2>

            <p className="muted">
              Generate AI-assisted
              replies for contacts.
            </p>
          </div>

          <button
            onClick={
              syncGmailReplies
            }
            disabled={
              syncingGmail
            }
          >
            {syncingGmail
              ? "Syncing Gmail..."
              : "Sync Gmail Replies"}
          </button>
        </div>

        {syncMessage && (
          <div
            style={{
              background:
                "#e8f7fb",
              color:
                "#087ea4",
              padding: 10,
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            {syncMessage}
          </div>
        )}

        {loadingLeads ? (
          <p className="muted">
            Loading contacts...
          </p>
        ) : leads.length ===
          0 ? (
          <div className="card">
            <h3>
              No contacts available
            </h3>

            <p className="muted">
              Import contacts first
              from the Contacts
              section.
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              <button
                type="button"
                onClick={() =>
                  setAiConversationFilter("ALL")
                }
                style={{
                  fontWeight:
                    aiConversationFilter === "ALL"
                      ? 700
                      : 400,
                }}
              >
                All Contacts ({leads.length})
              </button>

              <button
                type="button"
                onClick={() =>
                  setAiConversationFilter("REPLIED")
                }
                style={{
                  fontWeight:
                    aiConversationFilter === "REPLIED"
                      ? 700
                      : 400,
                }}
              >
                Replied ({repliedLeads.length})
              </button>
            </div>

            {aiConversationFilter === "REPLIED" &&
              repliedLeads.length === 0 && (
                <div
                  className="muted"
                  style={{
                    marginBottom: 16,
                  }}
                >
                  No contacts with REPLIED status found.
                  Sync Gmail Replies first.
                </div>
              )}

            <label>
              <strong>
                Select Contact
              </strong>

              <select
                value={
                  selectedLeadId
                }
                onChange={(e) => {
                  setSelectedLeadId(
                    e.target.value
                  );

                  setSyncMessage(
                    ""
                  );

                  setAiReply(
                    ""
                  );

                  setAiError(
                    ""
                  );
                }}
                style={{
                  display:
                    "block",
                  width:
                    "100%",
                  padding: 12,
                  marginTop: 8,
                  border:
                    "1px solid #dbe8f0",
                  borderRadius:
                    8,
                  background:
                    "#fff",
                }}
              >
                {aiConversationLeads.map(
                  (lead) => (
                    <option
                      key={
                        lead.id
                      }
                      value={
                        lead.id
                      }
                    >
                      {lead.name ||
                        "Unnamed"}{" "}
                      —{" "}
                      {
                        lead.email
                      }
                    </option>
                  )
                )}
              </select>
            </label>

            {selectedLead && (
              <div
                style={{
                  marginTop:
                    16,
                  padding:
                    14,
                  background:
                    "#f7fbfd",
                  borderRadius:
                    10,
                }}
              >
                <strong>
                  {selectedLead.name ||
                    "Unnamed Contact"}
                </strong>

                <div className="muted">
                  {
                    selectedLead.email
                  }
                </div>

                <div className="muted">
                  {selectedLead.website ||
                    "No website"}
                </div>

                <div
                  style={{
                    marginTop:
                      8,
                  }}
                >
                  <span className="pill">
                    {
                      selectedLead.status
                    }
                  </span>

                  <span
                    className="pill"
                    style={{
                      marginLeft:
                        8,
                    }}
                  >
                    {
                      selectedLead.mode
                    }
                  </span>
                </div>
              </div>
            )}

            <div
              className="chat"
              style={{
                marginTop:
                  16,
              }}
            >
              {loadingConversation ? (
                <div className="msg in">
                  Loading conversation history...
                </div>
              ) : conversationMessages.length === 0 ? (
                <div className="msg in">
                  No saved messages for this contact yet.
                </div>
              ) : (
                conversationMessages.map(
                  (message) => (
                    <div
                      key={
                        message.id
                      }
                      className={
                        message.direction
                          .toUpperCase()
                          .includes("OUT")
                          ? "msg out"
                          : "msg in"
                      }
                    >
                      <div
                        className="small"
                        style={{
                          marginBottom: 4,
                        }}
                      >
                        {message.direction.toUpperCase()}{" "}
                        ·{" "}
                        {new Date(
                          message.createdAt
                        ).toLocaleString()}
                        {message.aiGenerated
                          ? " · AI"
                          : ""}
                      </div>

                      <div
                        style={{
                          whiteSpace:
                            "pre-wrap",
                        }}
                      >
                        {
                          message.body
                        }
                      </div>
                    </div>
                  )
                )
              )}

              {aiReply && (
                <div className="msg out">
                  <div
                    className="small"
                    style={{
                      marginBottom: 4,
                    }}
                  >
                    AI DRAFT
                  </div>

                  <div
                    style={{
                      whiteSpace:
                        "pre-wrap",
                    }}
                  >
                    {aiReply}
                  </div>
                </div>
              )}
            </div>

            {aiError && (
              <div
                style={{
                  background:
                    "#fbe9e9",
                  color:
                    "#a52a2a",
                  padding: 10,
                  borderRadius: 8,
                  marginTop: 12,
                }}
              >
                {aiError}
              </div>
            )}

            <div
              style={{
                display:
                  "flex",
                gap: 8,
                marginTop:
                  16,
                flexWrap:
                  "wrap",
              }}
            >
              <button
                onClick={
                  generateAIReply
                }
                disabled={
                  generatingReply
                }
              >
                {generatingReply
                  ? "Generating..."
                  : "Generate AI Reply"}
              </button>

              {aiReply && (
                <button
                  onClick={
                    approveAndSend
                  }
                >
                  Approve & Send
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // =========================
  // Campaigns
  // =========================

  function renderCampaigns() {
    return (
      <div className="card">
        <div className="top">
          <div>
            <h2>
              Campaigns
            </h2>

            <p className="muted">
              Manage your guest post
              outreach campaigns.
            </p>
          </div>

          <button
            onClick={
              openCampaignForm
            }
          >
            + New Campaign
          </button>
        </div>

        {campaignError && (
          <div
            style={{
              background:
                "#fbe9e9",
              color:
                "#a52a2a",
              padding: 10,
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            {
              campaignError
            }
          </div>
        )}

        {campaignMessage && (
          <div
            style={{
              background:
                "#e8f7fb",
              color:
                "#087ea4",
              padding: 10,
              borderRadius: 8,
              marginBottom: 12,
            }}
          >
            {
              campaignMessage
            }
          </div>
        )}

        {loadingCampaigns ? (
          <p className="muted">
            Loading campaigns...
          </p>
        ) : campaigns.length ===
          0 ? (
          <div
            className="card"
            style={{
              marginTop:
                16,
            }}
          >
            <h3>
              No campaigns yet
            </h3>

            <p className="muted">
              Create your first
              campaign using the
              button above.
            </p>

            <button
              onClick={
                openCampaignForm
              }
            >
              + Create Campaign
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>
                  Campaign
                </th>

                <th>
                  Gmail Account
                </th>

                <th>
                  Status
                </th>

                <th>
                  Daily Limit
                </th>

                <th>
                  Created
                </th>

                <th>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {campaigns.map(
                (campaign) => (
                  <tr
                    key={
                      campaign.id
                    }
                  >
                    <td>
                      <strong>
                        {
                          campaign.name
                        }
                      </strong>

                      <div className="muted small">
                        {campaign
                          .template
                          .length >
                        80
                          ? `${campaign.template.substring(
                              0,
                              80
                            )}...`
                          : campaign.template}
                      </div>
                    </td>

                    <td>
                      {campaign
                        .gmailAccount
                        ?.email ||
                        "-"}
                    </td>

                    <td>
                      <span className="pill">
                        {campaign.status}
                      </span>
                    </td>

                    <td>
                      {
                        campaign.dailyLimit
                      }
                    </td>

                    <td>
                      {new Date(
                        campaign.createdAt
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      <div
                        style={{
                          display:
                            "flex",
                          gap: 8,
                          flexWrap:
                            "wrap",
                        }}
                      >
                        <button
                          onClick={() =>
                            openCampaignContacts(
                              campaign
                            )
                          }
                        >
                          Manage Contacts
                        </button>

                        {campaign.status !==
                          "COMPLETED" && (
                          <button
                            onClick={() =>
                              updateCampaignStatus(
                                campaign
                              )
                            }
                            style={{
                              background:
                                campaign.status ===
                                "ACTIVE"
                                  ? "#a52a2a"
                                  : "#168aad",
                            }}
                          >
                            {campaign.status ===
                            "ACTIVE"
                              ? "Pause"
                              : "Activate"}
                          </button>
                        )}

                        <button
                          onClick={() =>
                            sendCampaign(
                              campaign
                            )
                          }
                          disabled={
                            sendingCampaignId ===
                            campaign.id
                          }
                          style={{
                            opacity:
                              sendingCampaignId ===
                              campaign.id
                                ? 0.6
                                : 1,
                          }}
                        >
                          {sendingCampaignId ===
                          campaign.id
                            ? "Sending..."
                            : "Send Campaign"}
                        </button>

                        <button
                          onClick={() =>
                            deleteCampaign(
                              campaign
                            )
                          }
                          disabled={
                            sendingCampaignId ===
                            campaign.id
                          }
                          style={{
                            background: "#a52a2a",
                            opacity:
                              sendingCampaignId ===
                              campaign.id
                                ? 0.6
                                : 1,
                          }}
                        >
                          {sendingCampaignId ===
                          campaign.id
                            ? "Working..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  // =========================
  // Templates
  // =========================

  function renderTemplates() {
    return (
      <div className="card">
        <div className="top">
          <div>
            <h2>
              Email Templates
            </h2>

            <p className="muted">
              Create and manage outreach
              email templates.
            </p>
          </div>

          <button
            onClick={
              openCampaignForm
            }
          >
            + New Template
          </button>
        </div>

        <div className="card">
          <h3>
            Guest Post Outreach
          </h3>

          <p className="muted">
            Professional guest post
            collaboration email template.
          </p>
        </div>

        <br />

        <div className="card">
          <h3>
            Link Insertion Outreach
          </h3>

          <p className="muted">
            Professional link insertion
            collaboration template.
          </p>
        </div>
      </div>
    );
  }

  // =========================
  // Reports
  // =========================

  function renderReports() {
  return (
    <div className="card">
      <h2>Reports</h2>
      <p className="muted">Track your outreach performance.</p>

      {loadingReports ? (
        <p className="muted">Loading reports...</p>
      ) : (
        <>
          <h3 style={{ marginTop: 16 }}>Overall Stats</h3>
          <section className="grid stats">
            <div className="card">
              <div className="muted">Contacts</div>
              <div className="stat">{reportStats.totalContacts}</div>
            </div>
            <div className="card">
              <div className="muted">Emails Sent</div>
              <div className="stat">{reportStats.emailsSent}</div>
            </div>
            <div className="card">
              <div className="muted">Reply Rate</div>
              <div className="stat">{reportStats.replyRate}%</div>
            </div>
            <div className="card">
              <div className="muted">Interested</div>
              <div className="stat">{reportStats.interestedCount}</div>
            </div>
          </section>

          <h3 style={{ marginTop: 24 }}>Campaigns</h3>
          <section className="grid stats">
            <div className="card">
              <div className="muted">Total Campaigns</div>
              <div className="stat">{reportStats.totalCampaigns}</div>
            </div>
            <div className="card">
              <div className="muted">Active Campaigns</div>
              <div className="stat">{reportStats.activeCampaigns}</div>
            </div>
          </section>

          <h3 style={{ marginTop: 24 }}>Last 30 Days</h3>
          <section className="grid stats">
            <div className="card">
              <div className="muted">Emails Sent</div>
              <div className="stat">{reportStats.recentSent}</div>
            </div>
            <div className="card">
              <div className="muted">Replies Received</div>
              <div className="stat">{reportStats.recentReplies}</div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
  // =========================
  // Settings
  // =========================

  function renderSettings() {
    return (
      <div className="card">
        <h2>
          Settings
        </h2>

        <p className="muted">
          Configure your AI outreach
          system.
        </p>

        <hr />

        {/* =========================
            Gmail Accounts
        ========================= */}

        <h3>
          Gmail Accounts
        </h3>

        <p className="muted">
          Connect multiple Gmail accounts
          and manage each account's
          signature separately.
        </p>

        {loadingGmailAccounts ? (
          <p className="muted">
            Loading Gmail accounts...
          </p>
        ) : gmailAccounts.length ===
          0 ? (
          <div
            style={{
              padding: 14,
              background:
                "#fff8e8",
              borderRadius: 10,
              marginBottom: 16,
            }}
          >
            <strong>
              No Gmail accounts connected
            </strong>

            <div className="muted">
              Connect a Gmail account to
              send outreach emails.
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 16,
            }}
          >
            {gmailAccounts.map(
              (account) => {
                const isSelected =
                  selectedGmailAccountId ===
                  account.id;

                const isSaving =
                  savingGmailAccountId ===
                  account.id;

                return (
                  <div
                    key={
                      account.id
                    }
                    style={{
                      padding: 16,
                      border:
                        "1px solid #dbe8f0",
                      borderRadius: 10,
                      background:
                        isSelected
                          ? "#f7fbfd"
                          : "#fff",
                    }}
                  >
                    <div className="top">
                      <div>
                        <strong>
                          {
                            account.email
                          }
                        </strong>

                        <div
                          className="muted small"
                          style={{
                            marginTop: 4,
                          }}
                        >
                          Connected Gmail Account
                        </div>
                      </div>

                      <span className="pill">
                        {isSelected
                          ? "Selected"
                          : "Connected"}
                      </span>
                    </div>

                    <label
                      style={{
                        display:
                          "block",
                        marginTop: 14,
                      }}
                    >
                      <strong>
                        Email Signature
                      </strong>

                      <textarea
                        value={
                          account.signature ||
                          DEFAULT_SIGNATURE
                        }
                        onChange={(
                          e
                        ) => {
                          const value =
                            e.target
                              .value;

                          setGmailAccounts(
                            (current) =>
                              current.map(
                                (
                                  item
                                ) =>
                                  item.id ===
                                  account.id
                                    ? {
                                        ...item,
                                        signature:
                                          value,
                                      }
                                    : item
                              )
                          );
                        }}
                        rows={6}
                        style={{
                          display:
                            "block",
                          width:
                            "100%",
                          padding:
                            12,
                          marginTop:
                            8,
                          border:
                            "1px solid #dbe8f0",
                          borderRadius:
                            8,
                          resize:
                            "vertical",
                          fontFamily:
                            "inherit",
                          color: "#666",
                          fontSize: "14px",
                        }}
                      />

                      {/* 🔥 Signature preview — gray color mein */}
                      {account.signature && (
                        <div
                          style={{
                            marginTop: 8,
                            padding: 12,
                            background: "#f8fafc",
                            borderRadius: 8,
                            border: "1px solid #eef2f6",
                          }}
                        >
                          <div
                            className="muted small"
                            style={{
                              marginBottom: 4,
                              color: "#888",
                              fontSize: "12px",
                            }}
                          >
                            Preview:
                          </div>
                          <div
                            style={{
                              color: "#666",
                              fontSize: "14px",
                              whiteSpace: "pre-wrap",
                              fontFamily: "inherit",
                            }}
                          >
                            {account.signature}
                          </div>
                        </div>
                      )}
                    </label>

                    <div
                      style={{
                        display:
                          "flex",
                        gap: 8,
                        marginTop:
                          12,
                        flexWrap:
                          "wrap",
                      }}
                    >
                      <button
                        onClick={() =>
                          saveGmailSignature(
                            account
                          )
                        }
                        disabled={
                          isSaving
                        }
                        style={{
                          opacity:
                            isSaving
                              ? 0.7
                              : 1,
                        }}
                      >
                        {isSaving
                          ? "Saving..."
                          : "Save Signature"}
                      </button>

                      <button
                        onClick={() =>
                          setSelectedGmailAccountId(
                            account.id
                          )
                        }
                        style={{
                          background:
                            isSelected
                              ? "#168aad"
                              : undefined,
                        }}
                      >
                        {isSelected
                          ? "Selected Account"
                          : "Use Account"}
                      </button>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}

        {gmailAccountMessage && (
          <div
            style={{
              background:
                gmailAccountMessage.includes(
                  "successfully"
                )
                  ? "#e8f7fb"
                  : "#fbe9e9",
              color:
                gmailAccountMessage.includes(
                  "successfully"
                )
                  ? "#087ea4"
                  : "#a52a2a",
              padding: 10,
              borderRadius: 8,
              marginTop: 12,
            }}
          >
            {
              gmailAccountMessage
            }
          </div>
        )}

        <button
          onClick={() => {
            window.location.href =
              "/api/gmail/auth";
          }}
          style={{
            marginTop: 16,
          }}
        >
          + Add Gmail Account
        </button>

        <hr
          style={{
            marginTop: 24,
            marginBottom: 24,
          }}
        />

        {/* =========================
            AI Auto Replies
        ========================= */}

        <h3>
          AI Auto Replies
        </h3>

        <label>
          <input
            type="checkbox"
            checked={auto}
            onChange={(e) =>
              setAuto(
                e.target.checked
              )
            }
          />{" "}
          Enable AI auto-replies
        </label>

        {/* =========================
            Daily Sending Limit
        ========================= */}

        <h3
          style={{
            marginTop: 20,
          }}
        >
          Daily Sending Limit
        </h3>

        <input
          type="number"
          defaultValue={
            30
          }
          min="1"
          style={{
            padding: 10,
            border:
              "1px solid #dbe8f0",
            borderRadius: 8,
            width: 120,
          }}
        />
      </div>
    );
  }

  // =========================
  // Page Router
  // =========================

  function renderPage() {
    switch (
      activePage
    ) {
      case "Dashboard":
        return renderDashboard();

      case "Contacts":
        return renderContacts();

      case "AI Conversations":
        return renderAIConversations();

      case "Campaigns":
        return renderCampaigns();

      case "Templates":
        return renderTemplates();

      case "Reports":
        return renderReports();

      case "Settings":
        return renderSettings();

      default:
        return null;
    }
  }

  return (
    <div className="layout">
      {/* Sidebar */}

      <aside className="side">
  <div className="brand">
    OutreachAI
  </div>

  <div className="nav">
    {menuItems.map(
      (item) => (
        <div
          key={item}
          onClick={() =>
            setActivePage(
              item
            )
          }
          style={{
            cursor:
              "pointer",
            background:
              activePage ===
              item
                ? "#e8f7fb"
                : "transparent",
            color:
              activePage ===
              item
                ? "#087ea4"
                : "#102a43",
            fontWeight:
              activePage ===
              item
                ? 600
                : 400,
          }}
        >
          {item}
        </div>
      )
    )}
  </div>

  {/* 🔥 Logout Button */}
  <div
    onClick={async () => {
      if (window.confirm("Logout from OutreachAI?")) {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
      }
    }}
    style={{
      cursor: "pointer",
      padding: "12px 16px",
      marginTop: "auto",
      color: "#a52a2a",
      fontWeight: 600,
      borderTop: "1px solid #dbe8f0",
      paddingTop: 16,
      fontSize: 14,
    }}
  >
    🚪 Logout
  </div>
</aside>

      {/* Main */}

      <main className="main">
        <div className="top">
          <div>
            <h1>
              {activePage ===
              "Dashboard"
                ? "AI Outreach Dashboard"
                : activePage}
            </h1>

            <div className="muted">
              Guest post & content
              collaboration
            </div>
          </div>

          {activePage !==
            "Campaigns" &&
            activePage !==
              "Settings" && (
              <button
                onClick={
                  openCampaignForm
                }
              >
                + New Campaign
              </button>
            )}
        </div>

        {renderPage()}
      </main>

      {/* =========================
          New Campaign Modal
      ========================= */}

      {showCampaign && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.35)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      zIndex: 1000,
    }}
  >
    <div
      className="card"
      style={{
        width: "100%",
        maxWidth: 520,
        maxHeight: "90vh",    
        overflowY: "auto",    
        padding: "20px",       
      }}
    >
      <div className="top">
              <h2>
                New Campaign
              </h2>

              <button
                onClick={
                  closeCampaignForm
                }
                disabled={
                  creatingCampaign
                }
              >
                ×
              </button>
            </div>

            <label>
  Subject Line

  <input
    value={
      campaignSubject
    }
    onChange={(
      e
    ) =>
      setCampaignSubject(
        e.target
          .value
      )
    }
    placeholder="Quick collaboration idea for [Website]"
    style={{
      display:
        "block",
      width:
        "100%",
      padding: 12,
      marginTop: 6,
      marginBottom:
        15,
      border:
        "1px solid #dbe8f0",
      borderRadius:
        8,
    }}
  />
</label>

            <label>
              Daily Limit

              <input
                type="number"
                min="1"
                value={
                  campaignDailyLimit
                }
                onChange={(
                  e
                ) =>
                  setCampaignDailyLimit(
                    Number(
                      e.target
                        .value
                    )
                  )
                }
                style={{
                  display:
                    "block",
                  width:
                    "100%",
                  padding: 12,
                  marginTop: 6,
                  marginBottom:
                    15,
                  border:
                    "1px solid #dbe8f0",
                  borderRadius:
                    8,
                }}
              />
            </label>

            {/* =========================
                Campaign Gmail Account
            ========================= */}

            <label>
              Gmail Account

              <select
                value={
                  campaignGmailAccountId
                }
                onChange={(e) =>
                  setCampaignGmailAccountId(
                    e.target.value
                  )
                }
                disabled={
                  gmailAccounts.length ===
                  0
                }
                style={{
                  display:
                    "block",
                  width:
                    "100%",
                  padding: 12,
                  marginTop: 6,
                  marginBottom:
                    15,
                  border:
                    "1px solid #dbe8f0",
                  borderRadius:
                    8,
                  background:
                    "#fff",
                }}
              >
                {gmailAccounts.length ===
                0 ? (
                  <option value="">
                    No Gmail account connected
                  </option>
                ) : (
                  gmailAccounts.map(
                    (account) => (
                      <option
                        key={
                          account.id
                        }
                        value={
                          account.id
                        }
                      >
                        {
                          account.email
                        }
                        {account.id ===
                        selectedGmailAccountId
                          ? " (Selected)"
                          : ""}
                      </option>
                    )
                  )
                )}
              </select>

              {gmailAccounts.length ===
                0 && (
                <div
                  className="muted small"
                  style={{
                    marginTop: 6,
                    marginBottom: 8,
                  }}
                >
                  Go to Settings and
                  connect a Gmail
                  account first.
                </div>
              )}
            </label>

            <label>
              Email Template

              <textarea
                value={
                  campaignTemplate
                }
                onChange={(
                  e
                ) =>
                  setCampaignTemplate(
                    e.target
                      .value
                  )
                }
                placeholder="Hi, I'm reaching out regarding a guest post and content collaboration opportunity..."
                rows={
                  7
                }
                style={{
                  display:
                    "block",
                  width:
                    "100%",
                  padding: 12,
                  marginTop: 6,
                  marginBottom:
                    15,
                  border:
                    "1px solid #dbe8f0",
                  borderRadius:
                    8,
                  resize:
                    "vertical",
                }}
              />
            </label>

            {/* 🔥 Follow-up Settings */}
            <hr style={{ marginTop: 8, marginBottom: 16 }} />

            <h4 style={{ marginBottom: 8 }}>Follow-up Settings</h4>

            <label>
              1st Follow-up Subject
              <input
                value={campaignFollowupSubject1}
                onChange={(e) => setCampaignFollowupSubject1(e.target.value)}
                placeholder="Following up: Guest Post for [Website]"
                style={{
                  display: "block",
                  width: "100%",
                  padding: 12,
                  marginTop: 6,
                  marginBottom: 15,
                  border: "1px solid #dbe8f0",
                  borderRadius: 8,
                }}
              />
            </label>

            <label>
              1st Follow-up Template
              <textarea
                value={campaignFollowupTemplate1}
                onChange={(e) => setCampaignFollowupTemplate1(e.target.value)}
                placeholder="Hi [Name], I hope you're doing well. I just wanted to follow up..."
                rows={4}
                style={{
                  display: "block",
                  width: "100%",
                  padding: 12,
                  marginTop: 6,
                  marginBottom: 15,
                  border: "1px solid #dbe8f0",
                  borderRadius: 8,
                  resize: "vertical",
                }}
              />
            </label>

            <label>
              2nd Follow-up Subject
              <input
                value={campaignFollowupSubject2}
                onChange={(e) => setCampaignFollowupSubject2(e.target.value)}
                placeholder="Last chance: Guest Post Opportunity"
                style={{
                  display: "block",
                  width: "100%",
                  padding: 12,
                  marginTop: 6,
                  marginBottom: 15,
                  border: "1px solid #dbe8f0",
                  borderRadius: 8,
                }}
              />
            </label>

            <label>
              2nd Follow-up Template
              <textarea
                value={campaignFollowupTemplate2}
                onChange={(e) => setCampaignFollowupTemplate2(e.target.value)}
                placeholder="Hi [Name], This will be my last follow-up..."
                rows={4}
                style={{
                  display: "block",
                  width: "100%",
                  padding: 12,
                  marginTop: 6,
                  marginBottom: 15,
                  border: "1px solid #dbe8f0",
                  borderRadius: 8,
                  resize: "vertical",
                }}
              />
            </label>

            {campaignError && (
              <div
                style={{
                  background:
                    "#fbe9e9",
                  color:
                    "#a52a2a",
                  padding: 10,
                  borderRadius:
                    8,
                  marginBottom:
                    12,
                }}
              >
                {
                  campaignError
                }
              </div>
            )}

            {campaignMessage && (
              <div
                style={{
                  background:
                    "#e8f7fb",
                  color:
                    "#087ea4",
                  padding: 10,
                  borderRadius:
                    8,
                  marginBottom:
                    12,
                }}
              >
                {
                  campaignMessage
                }
              </div>
            )}

            <button
              onClick={
                createCampaign
              }
              disabled={
                creatingCampaign ||
                gmailAccounts.length ===
                  0
              }
              style={{
                opacity:
                  creatingCampaign ||
                  gmailAccounts.length ===
                    0
                    ? 0.7
                    : 1,
              }}
            >
              {creatingCampaign
                ? "Creating..."
                : "Create Campaign"}
            </button>
          </div>
        </div>
      )}

      {/* =========================
          Message History Modal
      ========================= */}

      {historyLead && (
        <div
          style={{
            position:
              "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.35)",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            padding: 20,
            zIndex:
              1200,
          }}
        >
          <div
            className="card"
            style={{
              width:
                "100%",
              maxWidth:
                760,
              maxHeight:
                "90vh",
              overflowY:
                "auto",
            }}
          >
            <div className="top">
              <div>
                <h2>
                  Message History
                </h2>

                <p className="muted">
                  {historyLead.name ||
                    historyLead.email}
                </p>
              </div>

              <button
                onClick={() =>
                  setHistoryLead(
                    null
                  )
                }
              >
                ×
              </button>
            </div>

            {loadingHistory ? (
              <p className="muted">
                Loading message history...
              </p>
            ) : !historyLead.messages ||
              historyLead.messages.length === 0 ? (
              <p className="muted">
                No saved messages for this contact.
              </p>
            ) : (
              <div className="chat">
                {historyLead.messages.map(
                  (message) => (
                    <div
                      key={
                        message.id
                      }
                      className={
                        message.direction
                          .toUpperCase()
                          .includes("OUT")
                          ? "msg out"
                          : "msg in"
                      }
                    >
                      <div
                        className="small"
                        style={{
                          marginBottom:
                            4,
                        }}
                      >
                        {message.direction.toUpperCase()}{" "}
                        ·{" "}
                        {new Date(
                          message.createdAt
                        ).toLocaleString()}
                      </div>

                      <div
                        style={{
                          whiteSpace:
                            "pre-wrap",
                        }}
                      >
                        {
                          message.body
                        }
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            <button
              onClick={() =>
                setHistoryLead(
                  null
                )
              }
              style={{
                marginTop: 16,
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* =========================
          Manage Campaign Contacts Modal
      ========================= */}

      {manageCampaign && (
        <div
          style={{
            position:
              "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,0.35)",
            display:
              "flex",
            alignItems:
              "center",
            justifyContent:
              "center",
            padding: 20,
            zIndex:
              1100,
          }}
        >
          <div
            className="card"
            style={{
              width:
                "100%",
              maxWidth:
                700,
              maxHeight:
                "90vh",
              overflowY:
                "auto",
            }}
          >
            <div className="top">
              <div>
                <h2>
                  Manage Contacts
                </h2>

                <p className="muted">
                  {
                    manageCampaign.name
                  }
                </p>
              </div>

              <button
                onClick={() => {
                  setManageCampaign(
                    null
                  );

                  setCampaignLeads(
                    []
                  );

                  setSelectedCampaignLeadIds(
                    []
                  );

                  setCampaignNicheFilter(
                    "ALL"
                  );

                  setCampaignLeadsError(
                    ""
                  );
                }}
              >
                ×
              </button>
            </div>

            {campaignLeadsError && (
              <div
                style={{
                  background:
                    "#fbe9e9",
                  color:
                    "#a52a2a",
                  padding: 10,
                  borderRadius:
                    8,
                  marginBottom:
                    12,
                }}
              >
                {
                  campaignLeadsError
                }
              </div>
            )}

            {loadingCampaignLeads ? (
              <p className="muted">
                Loading campaign
                contacts...
              </p>
            ) : leads.length ===
              0 ? (
              <div className="card">
                <h3>
                  No contacts available
                </h3>

                <p className="muted">
                  Import contacts first
                  from the Contacts
                  section.
                </p>
              </div>
            ) : (
              <>
                <div
                  style={{
                    marginBottom:
                      12,
                  }}
                >
                  <span className="pill">
                    {
                      selectedCampaignLeadIds.length
                    }{" "}
                    selected
                  </span>

                  <span
                    className="pill"
                    style={{
                      marginLeft:
                        8,
                    }}
                  >
                    {
                      campaignLeads.length
                    }{" "}
                    already assigned
                  </span>
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    gap: 8,
                    marginBottom:
                      12,
                    flexWrap:
                      "wrap",
                    alignItems:
                      "center",
                  }}
                >
                  <select
                    value={
                      campaignNicheFilter
                    }
                    onChange={(event) =>
                      setCampaignNicheFilter(
                        event.target.value
                      )
                    }
                    style={{
                      minWidth:
                        220,
                    }}
                  >
                    <option value="ALL">
                      All Niches ({leads.length})
                    </option>
                    {campaignNicheOptions.map(
                      (niche) => {
                        const count = leads.filter(
                          (lead) =>
                            (lead.niche?.trim() || "") ===
                            niche
                        ).length;

                        return (
                          <option
                            key={niche}
                            value={niche}
                          >
                            {niche} ({count})
                          </option>
                        );
                      }
                    )}
                  </select>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCampaignLeadIds(
                        (current) =>
                          Array.from(
                            new Set([
                              ...current,
                              ...filteredCampaignContacts.map(
                                (lead) => lead.id
                              ),
                            ])
                          )
                      )
                    }
                  >
                    Select All Filtered
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedCampaignLeadIds(
                        (current) =>
                          current.filter(
                            (id) =>
                              !filteredCampaignContacts.some(
                                (lead) => lead.id === id
                              )
                          )
                      )
                    }
                  >
                    Clear Filtered
                  </button>

                  <span className="muted small">
                    Showing {filteredCampaignContacts.length} of {leads.length} • {filteredCampaignSelectedCount} selected
                  </span>
                </div>

                <div
                  style={{
                    display:
                      "grid",
                    gap: 8,
                  }}
                >
                  {filteredCampaignContacts.map(
                    (lead) => {
                      const checked =
                        selectedCampaignLeadIds.includes(
                          lead.id
                        );

                      return (
                        <label
                          key={
                            lead.id
                          }
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            gap: 10,
                            padding:
                              12,
                            border:
                              "1px solid #dbe8f0",
                            borderRadius:
                              8,
                            cursor:
                              "pointer",
                            background:
                              checked
                                ? "#f7fbfd"
                                : "#fff",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={
                              checked
                            }
                            onChange={() =>
                              toggleCampaignLead(
                                lead.id
                              )
                            }
                          />

                          <div>
                            <strong>
                              {lead.name ||
                                "Unnamed Contact"}
                            </strong>

                            <div className="muted">
                              {
                                lead.email
                              }
                            </div>

                            <div className="muted small">
                              {lead.website ||
                                "No website"}
                            </div>

                            <div className="muted small">
                              Niche: {lead.niche ||
                                "Not set"}
                            </div>
                          </div>
                        </label>
                      );
                    }
                  )}
                </div>

                <div
                  style={{
                    display:
                      "flex",
                    gap: 8,
                    marginTop:
                      16,
                    flexWrap:
                      "wrap",
                  }}
                >
                  <button
                    onClick={
                      saveCampaignContacts
                    }
                    disabled={
                      savingCampaignLeads
                    }
                  >
                    {savingCampaignLeads
                      ? "Saving..."
                      : "Save Contacts"}
                  </button>

                  <button
                    onClick={() => {
                      setManageCampaign(
                        null
                      );

                      setCampaignLeads(
                        []
                      );

                      setSelectedCampaignLeadIds(
                        []
                      );

                      setCampaignLeadsError(
                        ""
                      );
                    }}
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}