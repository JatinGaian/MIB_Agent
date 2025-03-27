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
        if (temp?.issue?.fields?.project?.key !== "MAT") {
            console.log("only MAT project updates can be saved")
            return res.json({
                message: "only MAT project updates can be saved"
            })
        }
        // console.log("webhook is working fine", temp)

        // console.log("Raw Webhook Event:", JSON.stringify(temp, null, 2)); // Log full request body

        let eventKey;
        if (temp.issue_event_type_name) {
            eventKey = temp.issue_event_type_name;
        } else if (temp.webhookEvent) {
            eventKey = temp.webhookEvent;
        }

        const dataObject = {
            webhookUpdation: `${temp.timestamp}`,
            eventType: temp.issue_event_type_name || temp.webhookEvent,
            comment: temp?.comment?.body || "NotAvailable",
            issueKey: temp.issue?.key,
            summary: temp.issue?.fields?.summary,
            issueType: temp.issue?.fields?.issuetype?.name,
            status: temp.issue?.fields?.status?.name,
            description: temp.issue?.fields?.description?.content?.[0]?.content?.[0]?.text ? temp.issue?.fields?.description?.content?.[0]?.content?.[0]?.text : temp.issue?.fields?.description ? temp.issue?.fields?.description : "No Description",
            created: temp.issue?.fields?.created || temp.comment?.created,
            updated: temp.issue?.fields?.updated || temp.comment?.updated,
            parentKey: temp.issue?.fields?.parent?.key || "NotAvailable",
            parentSummary: temp.issue?.fields?.parent?.fields?.summary || "NotAvailable",
            parentIssueType: temp.issue?.fields?.parent?.fields?.issuetype?.name || "NotAvailable",
            parentIssueStatus: temp.issue?.fields?.parent?.fields?.status?.name || "NotAvailable",
        };

        console.log("Webhook Event Processed:", JSON.stringify(dataObject, null, 2));

        const issueKey = temp.issue?.key;
        const issueSummary = temp.issue?.fields?.summary;
        const issueType = temp.issue?.fields?.issuetype?.name;
        const issueStatus = temp.issue?.fields?.status?.name;

        if (issueKey) {
            console.log(`Processing IssueKey: ${issueKey} (${issueType}) - ${issueSummary} - Status: ${issueStatus}`);
        }

        // Prevent duplicate calls by checking for duplicate timestamps
        // if (global.lastWebhookTimestamp === temp.timestamp) {
        //     console.warn("Duplicate webhook event detected, ignoring...");
        //     return res.status(200).send({ message: "Duplicate webhook event ignored" });
        // }
        // global.lastWebhookTimestamp = temp.timestamp;

        // Call function to create an instance in the schema
        const token = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICI3Ny1NUVdFRTNHZE5adGlsWU5IYmpsa2dVSkpaWUJWVmN1UmFZdHl5ejFjIn0.eyJleHAiOjE3MzMxNzE1MzQsImlhdCI6MTczMzEzNTUzNCwianRpIjoiOTk4ZDk0NDktNTM2OS00OTdhLTg4YzAtN2FmNjYzZDM2MDM3IiwiaXNzIjoiaHR0cDovL2tleWNsb2FrLmtleWNsb2FrLnN2Yy5jbHVzdGVyLmxvY2FsOjgwODAvcmVhbG1zL21hc3RlciIsImF1ZCI6WyJQQVNDQUxfSU5URUxMSUdFTkNFIiwiWFBYLUNNUyIsImNkZmciLCJhY2NvdW50Il0sInN1YiI6IjdjMmEwY2M1LTY5ODgtNDk5OS04ZjZkLTQ4MjM2MzQ4MmVlZiIsInR5cCI6IkJlYXJlciIsImF6cCI6IkhPTEFDUkFDWSIsInNlc3Npb25fc3RhdGUiOiIzZjRkYjdlMC0zM2IxLTRhYjQtYjgwYi0zODhhNGUyYjNlNDgiLCJuYW1lIjoibW9iaXVzIG1vYml1cyIsImdpdmVuX25hbWUiOiJtb2JpdXMiLCJmYW1pbHlfbmFtZSI6Im1vYml1cyIsInByZWZlcnJlZF91c2VybmFtZSI6InBhc3N3b3JkX3RlbmFudF9tb2JpdXNAbW9iaXVzZHRhYXMuYWkiLCJlbWFpbCI6InBhc3N3b3JkX3RlbmFudF9tb2JpdXNAbW9iaXVzZHRhYXMuYWkiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYWNyIjoiMSIsImFsbG93ZWQtb3JpZ2lucyI6WyIvKiJdLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiZGVmYXVsdC1yb2xlcy1tYXN0ZXIiLCJvZmZsaW5lX2FjY2VzcyIsInVtYV9hdXRob3JpemF0aW9uIl19LCJyZXNvdXJjZV9hY2Nlc3MiOnsiUEFTQ0FMX0lOVEVMTElHRU5DRSI6eyJyb2xlcyI6WyJTVVBFUkFETUlOIl19LCJYUFgtQ01TIjp7InJvbGVzIjpbIlhQWC1DTVNfVVNFUiJdfSwiSE9MQUNSQUNZIjp7InJvbGVzIjpbIkhPTEFDUkFDWV9VU0VSIl19LCJjZGZnIjp7InJvbGVzIjpbIkJPTFRaTUFOTl9CT1RfVVNFUiJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIiwic2lkIjoiM2Y0ZGI3ZTAtMzNiMS00YWI0LWI4MGItMzg4YTRlMmIzZTQ4IiwidGVuYW50SWQiOiI3YzJhMGNjNS02OTg4LTQ5OTktOGY2ZC00ODIzNjM0ODJlZWYiLCJyZXF1ZXN0ZXJUeXBlIjoiVEVOQU5UIn0=.NEhACUI5FtTEcbbeZedP8kyGBX4CO0OSZ72pNyX49MQjKGHAwpiiuIa2TpRsi7HY6x-DwfDpiCjWCjVT3GVlYwId6FCwUh8nz8gUQx-6gRp9Y5GlR2YWUrYDea-ltvxKXtExIVcP-DmLN-vfiONPC-PuXq9iG-g9-Rbn0jAgm85lOHSrmHjHJjN7kMsUuP21OdHx-7If0w6Hp7U28raHudhzq0CN_lSMdj3ydgjI81f5WtShJVbbmOK-JJp3Qf870pN4ppsZPkwQagCmWjArCkfagrPox3sbjoOTzfnPqhefKUbuCtU7mtrQ8_4Dm5wcf0DrFvJ94c7M6YQsUL6RyA"; // Replace with actual token

        await helperToCreateInstance(dataObject, schemaId, token, issueKey);

        res.status(200).send({ message: "Webhook received and data ingested" });
    } catch (error) {
        console.error("Error processing webhook:", error.message);
        res.status(500).send({ error: "Internal Server Error" });
    }
});

async function helperToCreateInstance(response, schemaId, token, issueKey) {

    const deletionURL = `https://ig.gov-cloud.ai/pi-entity-instances-service/v2.0/schemas/${schemaId}/instances`
    const ingestionURL = `https://ig.gov-cloud.ai/pi-entity-instances-service/v2.0/schemas/${schemaId}/instances?upsert=true`;

    const headers = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
    const responseArray = []
    responseArray.push(response);
    // console.log("responseArray",responseArray);
    const ingestionPayload = { data: responseArray };
    const deletionPayload = {
        data: {
            "dbType": "TIDB",
            "filter": {
                "issueKey": `${issueKey}`
            }
        }
    }

    try {
        const deleteInstance = await axios.delete(deletionURL, deletionPayload, { headers })
        const apiResponse = await axios.post(ingestionURL, ingestionPayload, { headers });
        console.log("CreatedInstance response:", apiResponse.data);
    } catch (error) {
        console.error("Failed to send the CreateInstance request:", error.response?.data || error.message);
    }
}




app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}...`);
});