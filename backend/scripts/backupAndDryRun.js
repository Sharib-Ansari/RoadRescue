import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../src/config/db.js';
import User from '../src/models/User.js';
import ServiceRequest from '../src/models/ServiceRequest.js';
import Vehicle from '../src/models/Vehicle.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runBackupAndDryRun() {
  console.log('================================================================');
  console.log('   ROADRESCUE — DATABASE BACKUP & DELETION DRY-RUN REPORT');
  console.log('================================================================\n');

  await connectDB();

  const backupDir = path.join(__dirname, '..', 'backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // 1. Fetch all documents
  const allUsers = await User.find({}).lean();
  const allRequests = await ServiceRequest.find({}).lean();
  const allVehicles = await Vehicle.find({}).lean();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilePath = path.join(backupDir, `mongodb_backup_${timestamp}.json`);

  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      userCount: allUsers.length,
      requestCount: allRequests.length,
      vehicleCount: allVehicles.length
    },
    users: allUsers,
    servicerequests: allRequests,
    vehicles: allVehicles
  };

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`✅ [BACKUP CREATED] Successfully archived full database state to:\n   ${backupFilePath}\n`);

  // 2. Classify Users
  const genuineUsers = [];
  const testFixturesUsers = [];
  const unconfirmedUsers = [];

  // Known genuine accounts explicitly required to preserve
  const knownGenuineEmails = [
    'ansari.kokab7@gmail.com',
    'ansarisharib8445@gmail.com',
    'sharibansari@gmail.com'
  ];

  for (const user of allUsers) {
    const email = (user.email || '').toLowerCase().trim();
    const id = user._id.toString();

    if (knownGenuineEmails.includes(email)) {
      genuineUsers.push({
        id,
        name: user.name,
        email: user.email,
        role: user.role,
        reason: 'Confirmed real registered account (Preserved)'
      });
    } else if (
      email === 'demo@roadrescue.in' ||
      email === 'mechanic@roadrescue.in'
    ) {
      testFixturesUsers.push({
        id,
        name: user.name,
        email: user.email,
        role: user.role,
        type: 'Seeded Demo Account'
      });
    } else if (
      email.startsWith('customer_') ||
      email.startsWith('mechanic_') ||
      email.startsWith('phase5_cust_') ||
      email.startsWith('phase5_mech_') ||
      email.startsWith('phase5_far_mech_') ||
      email.startsWith('stranger_')
    ) {
      testFixturesUsers.push({
        id,
        name: user.name,
        email: user.email,
        role: user.role,
        type: 'Automated Test Fixture'
      });
    } else {
      unconfirmedUsers.push({
        id,
        name: user.name,
        email: user.email,
        role: user.role,
        reason: 'Unconfirmed status - preserved by default'
      });
    }
  }

  // 3. Classify Requests
  const testUserIds = new Set(testFixturesUsers.map((u) => u.id));
  const candidateDeleteRequests = [];
  const preservedRequests = [];

  for (const req of allRequests) {
    const custId = req.customerId ? req.customerId.toString() : null;
    const mechId = req.mechanicId ? req.mechanicId.toString() : null;

    // If request belongs to a genuine user or unconfirmed user, preserve it!
    const isLinkedToTestUser = testUserIds.has(custId) || (mechId && testUserIds.has(mechId));

    if (isLinkedToTestUser) {
      candidateDeleteRequests.push({
        id: req._id.toString(),
        requestId: req.requestId,
        vehicleName: req.vehicleName,
        problemCategory: req.problemCategory,
        status: req.status,
        customerId: custId,
        createdAt: req.createdAt
      });
    } else {
      preservedRequests.push({
        id: req._id.toString(),
        requestId: req.requestId,
        vehicleName: req.vehicleName,
        status: req.status,
        customerId: custId,
        mechanicId: mechId,
        createdAt: req.createdAt
      });
    }
  }

  // Summary Report
  console.log('----------------------------------------------------------------');
  console.log('   DRY-RUN ANALYSIS SUMMARY (NO DATA DELETED)');
  console.log('----------------------------------------------------------------');
  console.log(`TOTAL USERS IN DATABASE:            ${allUsers.length}`);
  console.log(`  - Confirmed Genuine (PRESERVED):  ${genuineUsers.length}`);
  console.log(`  - Unconfirmed Status (PRESERVED): ${unconfirmedUsers.length}`);
  console.log(`  - Test Fixture Candidates:        ${testFixturesUsers.length}`);
  console.log(`\nTOTAL SERVICE REQUESTS:             ${allRequests.length}`);
  console.log(`  - Preserved Service Requests:     ${preservedRequests.length}`);
  console.log(`  - Test Fixture Candidates:        ${candidateDeleteRequests.length}`);
  console.log('----------------------------------------------------------------\n');

  console.log('CONFIRMED GENUINE ACCOUNTS (PRESERVED):');
  genuineUsers.forEach((u) => console.log(`  ✅ [${u.role.toUpperCase()}] ${u.name} <${u.email}> (ID: ${u.id})`));

  if (unconfirmedUsers.length > 0) {
    console.log('\nUNCONFIRMED ACCOUNTS (PRESERVED BY DEFAULT):');
    unconfirmedUsers.forEach((u) => console.log(`  🛡️ [${u.role.toUpperCase()}] ${u.name} <${u.email}> (ID: ${u.id})`));
  }

  console.log('\nCANDIDATE TEST FIXTURES (DRY-RUN MANIFEST ONLY - NOT DELETED):');
  testFixturesUsers.forEach((u) => console.log(`  ❌ [${u.type}] ${u.name} <${u.email}> (ID: ${u.id})`));

  console.log('\nCANDIDATE TEST SERVICE REQUESTS:');
  candidateDeleteRequests.forEach((r) => console.log(`  ❌ Request ${r.requestId} (${r.vehicleName} - ${r.status}) [ID: ${r.id}]`));

  process.exit(0);
}

runBackupAndDryRun().catch((err) => {
  console.error('Fatal backup error:', err);
  process.exit(1);
});