/**
 * Kapture Finance — "Maya" Collections Voicebot
 * Mock Webhook Backend for Vapi Tool Calls
 *
 * Implements: verify_customer, log_promise_to_pay, send_payment_link,
 * escalate_to_agent, mark_disposition
 *
 * Run:  npm install && npm start
 * Expose: ngrok http 3000   -> point Vapi tool "server URL" to <ngrok-url>/webhook
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Mock "database" — in-memory only, resets on restart. Good enough for a demo.
// ---------------------------------------------------------------------------
const ACCOUNTS = {
  'ACC-88392': {
    customer_name: 'Rahul Sharma',
    valid_codes: ['1234', '1995'], // last-4-PAN or birth year, either works
    overdue_amount: 8499,
    dpd: 12,
  },
};

const CALL_LOG = []; // append-only log of dispositions / actions for the demo

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Masks a name for logging, e.g. "Rahul Sharma" -> "Rahul S****" */
function maskName(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return parts[0] || '';
  const last = parts[parts.length - 1];
  const maskedLast = last[0] + '*'.repeat(Math.max(last.length - 1, 1));
  return [...parts.slice(0, -1), maskedLast].join(' ');
}

function log(event, data) {
  const safe = { ...data };
  if (safe.customer_name) safe.customer_name = maskName(safe.customer_name);
  if (safe.verification_code) safe.verification_code = '****';
  console.log(`[${new Date().toISOString()}] ${event}`, JSON.stringify(safe));
}

// ---------------------------------------------------------------------------
// Tool implementations
// ---------------------------------------------------------------------------

function verifyCustomer(args) {
  const account = ACCOUNTS[args.account_id];
  if (!account) {
    return { verified: false, message: 'Account not found.' };
  }
  const verified = account.valid_codes.includes(String(args.verification_code).trim());
  log('verify_customer', {
    account_id: args.account_id,
    customer_name: account.customer_name,
    verification_code: args.verification_code,
    result: verified,
  });
  return verified
    ? {
        verified: true,
        customer_name: account.customer_name,
        message: 'Identity verified successfully.',
      }
    : { verified: false, message: 'Verification failed. Code did not match records.' };
}

function logPromiseToPay(args) {
  const ptpId = `PTP-${Math.floor(1000 + Math.random() * 9000)}`;
  const entry = {
    type: 'PTP',
    account_id: args.account_id,
    ptp_id: ptpId,
    ptp_date: args.ptp_date,
    amount: args.amount,
    timestamp: new Date().toISOString(),
  };
  CALL_LOG.push(entry);
  log('log_promise_to_pay', entry);
  return {
    success: true,
    ptp_id: ptpId,
    confirmed_date: args.ptp_date,
    amount: args.amount,
  };
}

function sendPaymentLink(args) {
  const link = `https://pay.kapturefinance.example/${args.account_id}/${Date.now()}`;
  log('send_payment_link', { account_id: args.account_id, channel: args.channel, link });
  return {
    success: true,
    channel: args.channel,
    payment_link: link,
    message: `Payment link sent successfully via ${args.channel} to the registered mobile number.`,
  };
}

function escalateToAgent(args) {
  const ticketId = `ESC-${Math.floor(10000 + Math.random() * 90000)}`;
  log('escalate_to_agent', { ...args, ticket_id: ticketId });
  return {
    success: true,
    ticket_id: ticketId,
    reason: args.reason,
    message: 'Case escalated to a human collections agent / grievance desk.',
  };
}

function markDisposition(args) {
  const entry = {
    type: 'DISPOSITION',
    account_id: args.account_id,
    status: args.status,
    notes: args.notes || '',
    timestamp: new Date().toISOString(),
  };
  CALL_LOG.push(entry);
  log('mark_disposition', entry);
  return {
    success: true,
    disposition_logged: args.status,
    timestamp: entry.timestamp,
  };
}

const TOOL_HANDLERS = {
  verify_customer: verifyCustomer,
  log_promise_to_pay: logPromiseToPay,
  send_payment_link: sendPaymentLink,
  escalate_to_agent: escalateToAgent,
  mark_disposition: markDisposition,
};

// ---------------------------------------------------------------------------
// Main webhook endpoint — handles Vapi's tool-calls message format
// ---------------------------------------------------------------------------
app.post('/webhook', (req, res) => {
  try {
    const { message } = req.body || {};

    if (message && message.type === 'tool-calls') {
      const results = (message.toolCalls || []).map((toolCall) => {
        const { name, arguments: rawArgs } = toolCall.function;
        const args = typeof rawArgs === 'string' ? JSON.parse(rawArgs) : rawArgs;
        const handler = TOOL_HANDLERS[name];

        let result;
        if (!handler) {
          result = { success: false, message: `Unknown function call: ${name}` };
        } else {
          try {
            result = handler(args);
          } catch (err) {
            console.error(`Error executing ${name}:`, err);
            result = { success: false, message: 'Internal error executing tool.' };
          }
        }

        return {
          toolCallId: toolCall.id,
          result: JSON.stringify(result),
        };
      });

      return res.status(200).json({ results });
    }

    // Other Vapi event notifications (status-update, end-of-call-report, etc.)
    if (message && message.type) {
      log('vapi_event', { type: message.type });
    }
    return res.status(200).json({ status: 'acknowledged' });
  } catch (err) {
    console.error('Webhook error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Simple health check + call log viewer for the demo
app.get('/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));
app.get('/log', (_req, res) => res.json(CALL_LOG));

app.listen(PORT, () => {
  console.log(`Kapture Mock Collections Webhook Server running on port ${PORT}`);
  console.log(`Webhook endpoint: POST http://localhost:${PORT}/webhook`);
});
