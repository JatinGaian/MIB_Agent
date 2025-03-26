const express = require("express");
const cors = require("cors");
require("dotenv").config();
const axios = require("axios");


const app = express();
const PORT = 8080;

app.use(express.json());
app.use(cors());



app.post("/mib/webhook/schemaId/:schemaId", async (req, res) => {
    try {
        const { schemaId } = req.params;
        console.log(`Webhook received with schemaId: ${schemaId} at ${new Date().toISOString()}`);

        const temp = req.body;

        // console.log("Raw Webhook Event:", JSON.stringify(temp, null, 2)); // Log full request body

        let eventKey;
        if (temp.issue_event_type_name) {
            eventKey = temp.issue_event_type_name;
        } else if (temp.webhookEvent) {
            eventKey = temp.webhookEvent;
        }

        const response = {
            webhookUpdation: temp.timestamp,
            eventType: temp.issue_event_type_name || temp.webhookEvent,
            comment: temp?.comment?.body || "NotAvailable",
            issueKey: temp.issue?.key,
            summary: temp.issue?.fields?.summary,
            issueType: temp.issue?.fields?.issuetype?.name,
            status: temp.issue?.fields?.status?.name,
            description: temp.issue?.fields?.description?.content?.[0]?.content?.[0]?.text || "No description",
            created: temp.issue?.fields?.created || temp.comment?.created,
            updated: temp.issue?.fields?.updated || temp.comment?.updated,
            parentKey: temp.issue?.fields?.parent?.key || "NotAvailable",
            parentSummary: temp.issue?.fields?.parent?.fields?.summary || "NotAvailable",
            parentIssueType: temp.issue?.fields?.parent?.fields?.issuetype?.name || "NotAvailable",
            parentIssueStatus: temp.issue?.fields?.parent?.fields?.status?.name || "NotAvailable",
        };

        console.log("Webhook Event Processed:", JSON.stringify(response, null, 2));

        const issueKey = temp.issue?.key;
        const issueSummary = temp.issue?.fields?.summary;
        const issueType = temp.issue?.fields?.issuetype?.name;
        const issueStatus = temp.issue?.fields?.status?.name;

        if (issueKey) {
            console.log(`Processing IssueKey: ${issueKey} (${issueType}) - ${issueSummary} - Status: ${issueStatus}`);
        }

        // Prevent duplicate calls by checking for duplicate timestamps
        if (global.lastWebhookTimestamp === temp.timestamp) {
            console.warn("Duplicate webhook event detected, ignoring...");
            return res.status(200).send({ message: "Duplicate webhook event ignored" });
        }
        global.lastWebhookTimestamp = temp.timestamp;

        // Call function to create an instance in the schema
        const token = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI3Ny1NUVdFRTNHZE5adGlsWU5IYmpsa2dVSkpaWUJWVmN1UmFZdHl5ejFjIn0.eyJleHAiOjE3MjYxODIzMzEsImlhdCI6MTcyNjE0NjMzMSwianRpIjoiOGVlZTU1MDctNGVlOC00NjE1LTg3OWUtNTVkMjViMjQ2MGFmIiwiaXNzIjoiaHR0cDovL2tleWNsb2FrLmtleWNsb2FrLnN2Yy5jbHVzdGVyLmxvY2FsOjgwODAvcmVhbG1zL21hc3RlciIsImF1ZCI6ImFjY291bnQiLCJzdWIiOiJmNzFmMzU5My1hNjdhLTQwYmMtYTExYS05YTQ0NjY4YjQxMGQiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJIT0xBQ1JBQ1kiLCJzZXNzaW9uX3N0YXRlIjoiYmI1ZjJkMzktYTQ3ZC00MjI0LWFjZGMtZTdmNzQwNDc2OTgwIiwibmFtZSI6ImtzYW14cCBrc2FteHAiLCJnaXZlbl9uYW1lIjoia3NhbXhwIiwiZmFtaWx5X25hbWUiOiJrc2FteHAiLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJwYXNzd29yZF90ZW5hbnRfa3NhbXhwQG1vYml1c2R0YWFzLmFpIiwiZW1haWwiOiJwYXNzd29yZF90ZW5hbnRfa3NhbXhwQG1vYml1c2R0YWFzLmFpIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImFjciI6IjEiLCJhbGxvd2VkLW9yaWdpbnMiOlsiLyoiXSwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtbWFzdGVyIiwib2ZmbGluZV9hY2Nlc3MiLCJ1bWFfYXV0aG9yaXphdGlvbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7IkhPTEFDUkFDWSI6eyJyb2xlcyI6WyJIT0xBQ1JBQ1lfVVNFUiJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIiwic2lkIjoiYmI1ZjJkMzktYTQ3ZC00MjI0LWFjZGMtZTdmNzQwNDc2OTgwIiwidGVuYW50SWQiOiJmNzFmMzU5My1hNjdhLTQwYmMtYTExYS05YTQ0NjY4YjQxMGQiLCJyZXF1ZXN0ZXJUeXBlIjoiVEVOQU5UIn0=.FXeDyHBhlG9L4_NCeSyHEaNEBVmhFpfSBqlcbhHaPaoydhKcA0BfuyHgxg_32kQk6z5S9IQ7nVKS2ybtOvwo0WyLWwLQchSq7Noa7LooHIMzmeWMQb_bLKtbaOti59zwIdS8CkfGaXut7RUQKISQVWmbUGsVJQa2JkG6Ng_QN0y5hFVksMWPZiXVsofQkJXHXV1CQ3gabhhHKo3BqlJwzpsCKLDfg1-4PmSl1Wqbw03Ef2yolroj5i8FoeHukOQPkwCUHrrNw-ilIp917nqZa89YbCMtDjWyaj8pEH7GJR5vMZPE2WcJPn5dSA1IHVunfatEB1cDAitaFjVNWNnddQ"; // Replace with actual token

        // await helperToCreateInstance(response, schemaId, token);

        res.status(200).send({ message: "Webhook received and data ingested" });
    } catch (error) {
        console.error("Error processing webhook:", error.message);
        res.status(500).send({ error: "Internal Server Error" });
    }
});




app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}...`);
});