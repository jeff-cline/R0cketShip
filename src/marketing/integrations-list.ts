export const CRM_INTEGRATIONS = [
  { name: "GoHighLevel", how: "Add an Inbound Webhook trigger to a workflow and paste its URL below." },
  { name: "HubSpot", how: "Use a Workflow webhook action, or Zapier 'Catch Hook', and paste the URL." },
  { name: "Zapier", how: "Create a Zap with 'Webhooks by Zapier → Catch Hook' and paste the hook URL." },
  { name: "Make (Integromat)", how: "Add a 'Custom webhook' module and paste its address." },
  { name: "Pipedrive", how: "Use Zapier/Make 'Catch Hook' (or Pipedrive webhooks) and paste the URL." },
  { name: "Salesforce", how: "Use a Flow HTTP callout or Zapier, and paste the endpoint URL." },
  { name: "Keap / Infusionsoft", how: "Use Zapier 'Catch Hook' and paste the URL." },
  { name: "ActiveCampaign", how: "Use Zapier or Make 'Catch Hook' and paste the URL." },
  { name: "Zoho CRM", how: "Use Zoho Flow webhook or Zapier and paste the URL." },
];

export const LEAD_PAYLOAD_FIELDS = [
  "firstName", "lastName", "address", "city", "state", "zip",
  "phones[]", "mobilePhones[]", "emails[]", "segment", "scoreCategory", "tier", "status", "deliveredAt",
];
