const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const logger = require("firebase-functions/logger");

initializeApp();

// ──────────────────────────────────────────────
// Trigger: when system_config/version is updated
// Validates the version, logs deployment event
// ──────────────────────────────────────────────
exports.onVersionUpdated = onDocumentWritten(
  "system_config/version",
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!after) {
      logger.info("Version doc deleted");
      return;
    }

    const newVersion = after.version;
    const oldVersion = before?.version || "none";

    logger.info(`Version updated: ${oldVersion} → ${newVersion}`, {
      deployedBy: after.deployedBy || "unknown",
      commitSha: after.commitSha || "n/a",
    });

    // Store deployment log
    try {
      await getFirestore().collection("deployment_log").add({
        type: "version_update",
        oldVersion,
        newVersion,
        deployedBy: after.deployedBy || "unknown",
        commitSha: after.commitSha || "n/a",
        commitMsg: after.commitMsg || "",
        hostingUrl: after.hostingUrl || "",
        timestamp: new Date().toISOString(),
      });
      logger.info("Deployment logged to deployment_log collection");
    } catch (err) {
      logger.error("Failed to log deployment", { error: err.message });
    }
  }
);

// ──────────────────────────────────────────────
// Trigger: validate hosting file in Storage
// Called after the file is uploaded to Storage
// ──────────────────────────────────────────────
exports.onUpdateFileUploaded = onDocumentWritten(
  "system_config/pending_update",
  async (event) => {
    const after = event.data?.after?.data();
    if (!after || !after.fileUrl) {
      logger.info("No pending update found");
      return;
    }

    logger.info("Update file available", {
      version: after.targetVersion,
      url: after.fileUrl,
    });

    // Mark as ready for clients to pick up
    try {
      await getFirestore().collection("system_config").doc("version").set(
        {
          version: after.targetVersion,
          updatedAt: new Date().toISOString(),
          fileUrl: after.fileUrl,
          status: "ready",
        },
        { merge: true }
      );
      logger.info(`Update marked as ready: v${after.targetVersion}`);
    } catch (err) {
      logger.error("Failed to mark update as ready", { error: err.message });
    }
  }
);

// ──────────────────────────────────────────────
// HTTP: Health check
// ──────────────────────────────────────────────
exports.healthCheck = onRequest({ cors: true }, async (req, res) => {
  try {
    const doc = await getFirestore()
      .collection("system_config")
      .doc("version")
      .get();
    const version = doc.exists ? doc.data().version : "unknown";

    res.json({
      status: "ok",
      service: "marts-crm-functions",
      version,
      timestamp: new Date().toISOString(),
      region: process.env.FUNCTION_REGION || "unknown",
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ──────────────────────────────────────────────
// HTTP: Get current deployment status
// ──────────────────────────────────────────────
exports.deploymentStatus = onRequest({ cors: true }, async (req, res) => {
  try {
    const db = getFirestore();

    const versionDoc = await db.collection("system_config").doc("version").get();
    const version = versionDoc.exists ? versionDoc.data() : null;

    const logs = await db
      .collection("deployment_log")
      .orderBy("timestamp", "desc")
      .limit(10)
      .get();

    const recentDeploys = logs.docs.map((d) => d.data());

    res.json({
      currentVersion: version,
      recentDeploys,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ status: "error", message: err.message });
  }
});

// ──────────────────────────────────────────────
// HTTP: Trigger manual deploy (internal use)
// Accepts POST with { version, fileUrl }
// ──────────────────────────────────────────────
exports.triggerDeploy = onRequest(
  { cors: true, auth: false },
  async (req, res) => {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "POST only" });
    }

    const { version, fileUrl, notes } = req.body || {};
    if (!version || !fileUrl) {
      return res.status(400).json({ error: "version and fileUrl required" });
    }

    // Verify caller (simple token check)
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.DEPLOY_TOKEN;
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      await getFirestore()
        .collection("system_config")
        .doc("version")
        .set(
          {
            version,
            fileUrl,
            notes: notes || "",
            updatedAt: new Date().toISOString(),
            deployedBy: "manual_trigger",
          },
          { merge: true }
        );

      res.json({
        success: true,
        message: `Deploy triggered for v${version}`,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
);
