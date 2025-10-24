import {
  Agent,
  IdentifierKind
} from "@xmtp/agent-sdk";
import { getTestUrl } from "@xmtp/agent-sdk/debug";
import { createSigner, createUser } from "@xmtp/agent-sdk/user";
import type { Group } from "@xmtp/node-sdk";
import Database from "better-sqlite3";
import OpenAI from "openai";
import { createPublicClient, encodeFunctionData, http, type Address } from "viem";
import { base } from "viem/chains";

import { ContentTypeMarkdown, MarkdownCodec } from "@xmtp/content-type-markdown";
import {
  ContentTypeWalletSendCalls,
  WalletSendCallsCodec,
  WalletSendCallsParams,
} from "@xmtp/content-type-wallet-send-calls";
import { CONTRACT_ABI } from "./event";
import { loadEnvFile } from "./utils";

loadEnvFile();

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Represents a group configuration from the CRON system
 */
interface GroupConfig {
  /** Primary address/identifier for this group */
  address: string;
  /** Name of the group */
  name: string;
  /** Label for URL routing */
  label: string;
  /** Description of the group */
  description?: string;
  /** Date of the event (ISO string) */
  date?: string;
  /** List of member addresses that should be in this group */
  memberAddresses: string[];
}

/**
 * Internal representation of a managed group
 */
interface ManagedGroup {
  /** The XMTP group instance */
  group: Group;
  /** Primary address this group is associated with */
  primaryAddress: string;
  /** Last time this group was synced */
  lastSyncedAt: Date;
}

// ============================================================================
// Storage
// ============================================================================

/**
 * Map of address -> managed group
 * This stores all groups currently managed by the agent
 */
const groupMap = new Map<string, ManagedGroup>();

// ============================================================================
// SQLite Database for Persistence
// ============================================================================

const DB_PATH = process.env.GROUP_DB_PATH || "./group-mappings.db";
const db = new Database(DB_PATH);

// Create table for storing group mappings
db.exec(`
  CREATE TABLE IF NOT EXISTS group_mappings (
    event_address TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    group_name TEXT,
    agent_address TEXT,
    last_synced_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log(`📦 Group mappings database initialized at: ${DB_PATH}`);

/**
 * Save a group mapping to the database
 */
function saveGroupMapping(eventAddress: string, managedGroup: ManagedGroup, agentAddress: string): void {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO group_mappings (event_address, group_id, group_name, agent_address, last_synced_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(
    eventAddress.toLowerCase(),
    managedGroup.group.id,
    managedGroup.group.name || null,
    agentAddress.toLowerCase(),
    managedGroup.lastSyncedAt.toISOString()
  );
}

/**
 * Get a group ID from the database by event address (only if created by this agent)
 */
function getGroupIdByAddress(eventAddress: string, agentAddress: string): string | null {
  const stmt = db.prepare(`
    SELECT group_id, agent_address FROM group_mappings WHERE event_address = ?
  `);

  const row = stmt.get(eventAddress.toLowerCase()) as { group_id: string; agent_address: string | null } | undefined;

  if (!row) return null;

  // Check if this group was created by the current agent
  if (row.agent_address && row.agent_address !== agentAddress.toLowerCase()) {
    console.log(`   ⚠️  Group was created by different agent (${row.agent_address.slice(0, 10)}...), ignoring`);
    return null;
  }

  return row.group_id;
}

/**
 * Update last synced time for a group
 */
function updateLastSynced(eventAddress: string, lastSyncedAt: Date): void {
  const stmt = db.prepare(`
    UPDATE group_mappings
    SET last_synced_at = ?
    WHERE event_address = ?
  `);

  stmt.run(lastSyncedAt.toISOString(), eventAddress.toLowerCase());
}

/**
 * Get all group mappings from database
 */
function getAllGroupMappings(): Array<{ event_address: string; group_id: string; group_name: string | null; last_synced_at: string }> {
  const stmt = db.prepare(`
    SELECT event_address, group_id, group_name, last_synced_at
    FROM group_mappings
  `);

  return stmt.all() as Array<{ event_address: string; group_id: string; group_name: string | null; last_synced_at: string }>;
}

// ============================================================================
// Contract ABIs
// ============================================================================

const FACTORY_ABI = [
  {
    inputs: [],
    name: "getDeployedEvents",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const EVENT_ABI = [
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getAllParticipants",
    outputs: [{ internalType: "address[]", name: "", type: "address[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "label",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const L2_REGISTRY_ABI = [
  {
    inputs: [
      { internalType: "bytes32", name: "node", type: "bytes32" },
      { internalType: "string", name: "key", type: "string" }
    ],
    name: "text",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const L2_REGISTRY_ADDRESS = "0xC02f3b4CbE3431a46A19416211AeE7F004d829C3" as Address;

// ============================================================================
// Blockchain Client
// ============================================================================

// Get RPC URL from environment or use a default Base RPC
const RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const FACTORY_CONTRACT_ADDRESS = process.env.FACTORY_CONTRACT_ADDRESS as Address;

if (!FACTORY_CONTRACT_ADDRESS) {
  throw new Error("FACTORY_CONTRACT_ADDRESS environment variable is required");
}

const publicClient = createPublicClient({
  chain: base,
  transport: http(RPC_URL),
});

// ============================================================================
// OpenAI Client
// ============================================================================

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn("⚠️  OPENAI_API_KEY not set - DM event recommendations will be disabled");
}

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

// ============================================================================
// Blockchain Query Functions
// ============================================================================

/**
 * Fetch ENS text records for an event
 *
 * @param label - The event label (e.g., "eventname")
 * @returns Object with nickname, description, and date from ENS, or null if not available
 */
async function fetchENSData(label: string): Promise<{ nickname: string | null; description: string | null; date: string | null }> {
  try {
    // Import namehash dynamically to avoid linter issues
    const { namehash: getNamehash } = await import("viem");

    // Construct the full ENS name
    const ensName = `${label}.raduno.eth`;

    // Get the namehash for the ENS name
    const node = getNamehash(ensName);

    console.log(`    📖 Fetching ENS data for: ${ensName}`);

    // Query the L2Registry for nickname, description, and date in parallel
    const [nickname, description, date] = await Promise.all([
      publicClient.readContract({
        address: L2_REGISTRY_ADDRESS,
        abi: L2_REGISTRY_ABI,
        functionName: "text",
        args: [node, "nickname"],
      }).catch(() => null),
      publicClient.readContract({
        address: L2_REGISTRY_ADDRESS,
        abi: L2_REGISTRY_ABI,
        functionName: "text",
        args: [node, "description"],
      }).catch(() => null),
      publicClient.readContract({
        address: L2_REGISTRY_ADDRESS,
        abi: L2_REGISTRY_ABI,
        functionName: "text",
        args: [node, "date"],
      }).catch(() => null),
    ]);

    return {
      nickname: nickname || null,
      description: description || null,
      date: date || null,
    };
  } catch (error) {
    console.error(`    ⚠️  Error fetching ENS data for ${label}:`, error);
    return { nickname: null, description: null, date: null };
  }
}

/**
 * Fetch group configurations from blockchain
 * Queries the factory contract for all events, then queries each event for participants
 *
 * @returns Promise<GroupConfig[]> List of group configurations
 */
async function fetchGroupConfigurations(): Promise<GroupConfig[]> {
  try {
    console.log("🔗 Querying factory contract for deployed events...");

    // Get all deployed event addresses from factory
    const eventAddresses = await publicClient.readContract({
      address: FACTORY_CONTRACT_ADDRESS,
      abi: FACTORY_ABI,
      functionName: "getDeployedEvents",
    });

    console.log(`Found ${eventAddresses.length} deployed events`);

    const configs: GroupConfig[] = [];

    // Query each event contract for participants and owner
    for (const eventAddress of eventAddresses) {
      try {
        console.log(`  Querying event contract: ${eventAddress}`);

        // Query in parallel for better performance
        const [owner, participants, label] = await Promise.all([
          publicClient.readContract({
            address: eventAddress,
            abi: EVENT_ABI,
            functionName: "owner",
          }),
          publicClient.readContract({
            address: eventAddress,
            abi: EVENT_ABI,
            functionName: "getAllParticipants",
          }),
          publicClient.readContract({
            address: eventAddress,
            abi: EVENT_ABI,
            functionName: "label",
          }),
        ]);

        // Combine owner and participants into member list
        // Use a Set to avoid duplicates
        const memberSet = new Set<string>();
        memberSet.add(owner.toLowerCase());

        for (const participant of participants) {
          memberSet.add(participant.toLowerCase());
        }

        const memberAddresses = Array.from(memberSet);

        console.log(`    Owner: ${owner}`);
        console.log(`    Participants: ${participants.length}`);
        console.log(`    Total members: ${memberAddresses.length}`);
        console.log(`    Label: ${label || 'No label'}`);

        // Fetch ENS data for this event
        const ensData = await fetchENSData(label);

        // Use ENS nickname as name, fall back to label
        const eventName = `Raduno - ${ensData.nickname}` || label || `Event ${eventAddress.slice(0, 8)}...`;

        // Use ENS description, fall back to default
        const eventDescription = ensData.description || `Event group for ${label || eventAddress}`;

        console.log(`    ENS Name: ${ensData.nickname || '(not set)'}`);
        console.log(`    ENS Description: ${ensData.description || '(not set)'}`);

        configs.push({
          address: eventAddress.toLowerCase(),
          name: eventName,
          label: label,
          description: eventDescription,
          date: ensData.date || undefined,
          memberAddresses,
        });
      } catch (error) {
        console.error(`  ❌ Error querying event ${eventAddress}:`, error);
        // Continue with next event instead of failing completely
      }
    }

    console.log(`✅ Successfully fetched ${configs.length} event configurations`);
    return configs;
  } catch (error) {
    console.error("❌ Error fetching group configurations from blockchain:", error);
    return [];
  }
}

// ============================================================================
// Group Management Functions
// ============================================================================

/**
 * Check if identities can receive messages on XMTP
 *
 * @param addresses - Array of addresses to check
 * @returns Map of address -> boolean indicating if they can message
 */
async function checkCanMessage(
  addresses: string[]
): Promise<Map<string, boolean>> {
  try {
    console.log(`   🔍 Checking ${addresses.length} addresses for XMTP availability...`);

    const identifiers = addresses.map((addr) => ({
      identifier: addr,
      identifierKind: IdentifierKind.Ethereum,
    }));

    const response = await agent.client.canMessage(identifiers);

    // Debug: show results
    console.log(`   📊 Results:`);
    addresses.forEach((addr, idx) => {
      const canMsg = response.get(addr);
      console.log(`      ${addr.slice(0, 10)}...${addr.slice(-8)}: ${canMsg ? '✅ YES' : '❌ NO'}`);
    });

    return response;
  } catch (error) {
    console.error("Error checking canMessage:", error);
    return new Map();
  }
}

/**
 * Get inbox IDs for a list of addresses
 *
 * @param addresses - Array of Ethereum addresses
 * @returns Array of inbox IDs
 */
async function getInboxIds(addresses: string[]): Promise<string[]> {
  const inboxIds: string[] = [];

  for (const address of addresses) {
    try {
      const inboxId = await agent.client.getInboxIdByIdentifier({
        identifier: address,
        identifierKind: IdentifierKind.Ethereum,
      });

      if (inboxId) {
        inboxIds.push(inboxId);
      }
    } catch (error) {
      console.error(`Error getting inbox ID for ${address}:`, error);
    }
  }

  return inboxIds;
}

/**
 * Create a new group for a given configuration
 *
 * @param config - Group configuration
 * @returns The created group or null if creation failed
 */
async function createGroup(config: GroupConfig): Promise<Group | null> {
  try {
    console.log(`Creating new group for address: ${config.address}`);

    // Check which addresses can message
    const canMessageMap = await checkCanMessage(config.memberAddresses);
    const reachableAddresses = config.memberAddresses.filter(
      (addr) => canMessageMap.get(addr) === true
    );

    if (reachableAddresses.length === 0) {
      console.log(`No reachable members for group ${config.address}`);
      return null;
    }

    // Get inbox IDs for reachable addresses
    const inboxIds = await getInboxIds(reachableAddresses);

    // Need at least 2 members (besides the agent) to create a group
    // Otherwise it becomes a DM
    const ALLOW_SMALL_GROUPS = process.env.ALLOW_SMALL_GROUPS === 'true';

    if (inboxIds.length < 2 && !ALLOW_SMALL_GROUPS) {
      console.log(`⏳ Only ${inboxIds.length} member(s) available. Need at least 2 to create a group.`);
      console.log(`   Will create group when more members join XMTP.`);
      console.log(`   💡 Set ALLOW_SMALL_GROUPS=true to create groups with 1 member for testing`);
      return null;
    }

    if (inboxIds.length < 2 && ALLOW_SMALL_GROUPS) {
      console.log(`⚠️  DEBUG MODE: Creating group with only ${inboxIds.length} member(s) (will be a DM)`);
    }

    if (inboxIds.length === 0) {
      console.log(`No valid inbox IDs for group ${config.address}`);
      return null;
    }

    // Create the group with the member inbox IDs
    const group = await agent.client.conversations.newGroup([]);
    group.updateName(config.name);
    if (config.description) {
      group.updateDescription(config.description);
    }
    await group.addMembers(inboxIds);

    console.log(`✅ Created group ${group.id} for ${config.address}`);
    console.log(`   Added ${inboxIds.length} members`);

    // Send welcome message
    await group.send(
      `Welcome to ${config.name}! This group is managed by an XMTP agent.`
    );

    return group;
  } catch (error) {
    console.error(`Error creating group for ${config.address}:`, error);
    return null;
  }
}

/**
 * Sync members for an existing group based on configuration
 *
 * @param managedGroup - The managed group to sync
 * @param config - The target configuration
 */
async function syncGroupMembers(
  managedGroup: ManagedGroup,
  config: GroupConfig
): Promise<void> {
  try {
    const { group } = managedGroup;

    // Sync the group to get latest state
    await group.sync();

    // Get current members
    const currentMembers = await group.members();
    const currentMemberAddresses = new Set<string>();

    // Map current member inbox IDs to their addresses
    for (const member of currentMembers) {
      // Find the Ethereum address identity
      const ethIdentifier = member.accountIdentifiers.find(
        (id) => id.identifierKind === IdentifierKind.Ethereum
      );

      if (ethIdentifier) {
        currentMemberAddresses.add(ethIdentifier.identifier.toLowerCase());
      }
    }

    // Normalize target addresses
    const targetAddresses = new Set(
      config.memberAddresses.map((addr) => addr.toLowerCase())
    );

    // Find members to add (in target but not in current)
    const addressesToAdd = Array.from(targetAddresses).filter(
      (addr) => !currentMemberAddresses.has(addr)
    );

    // Find members to remove (in current but not in target)
    // IMPORTANT: Never remove the agent itself!
    const addressesToRemove = Array.from(currentMemberAddresses).filter(
      (addr) => !targetAddresses.has(addr) && addr !== agent.address!.toLowerCase()
    );

    // Add new members
    if (addressesToAdd.length > 0) {
      console.log(
        `Adding ${addressesToAdd.length} members to group ${config.address}`
      );

      // Check which addresses can message
      const canMessageMap = await checkCanMessage(addressesToAdd);
      const reachableAddresses = addressesToAdd.filter(
        (addr) => canMessageMap.get(addr) === true
      );

      if (reachableAddresses.length > 0) {
        const inboxIdsToAdd = await getInboxIds(reachableAddresses);

        if (inboxIdsToAdd.length > 0) {
          await group.addMembers(inboxIdsToAdd);
          console.log(`✅ Added ${inboxIdsToAdd.length} new members`);

          // Send notification in group
          await group.send(
            `👋 ${inboxIdsToAdd.length} new member(s) have been added to the group!`
          );
        }
      }
    }

    // Remove members that are no longer in the list
    if (addressesToRemove.length > 0) {
      console.log(
        `Removing ${addressesToRemove.length} members (${addressesToRemove}) from group ${config.address}`
      );

      // Get inbox IDs for addresses to remove
      const inboxIdsToRemove = await getInboxIds(addressesToRemove);

      if (inboxIdsToRemove.length > 0) {
        await group.removeMembers(inboxIdsToRemove);
        console.log(`✅ Removed ${inboxIdsToRemove.length} members`);

        // Send notification in group
        await group.send(
          `👋 ${inboxIdsToRemove.length} member(s) have been removed from the group.`
        );
      }
    }

    // Update group metadata if needed
    if (group.name !== config.name) {
      await group.updateName(config.name);
      console.log(`Updated group name to: ${config.name}`);
    }

    if (config.description && group.description !== config.description) {
      await group.updateDescription(config.description);
      console.log(`Updated group description`);
    }

    // Update last synced timestamp
    managedGroup.lastSyncedAt = new Date();

    // Persist to database
    updateLastSynced(config.address, managedGroup.lastSyncedAt);

  } catch (error) {
    console.error(
      `Error syncing members for group ${config.address}:`,
      error
    );
  }
}

/**
 * Process all group configurations from CRON
 * This is the main sync function that:
 * 1. Creates groups that don't exist
 * 2. Syncs members for existing groups
 */
async function processGroupConfigurations(): Promise<void> {
  console.log("\n🔄 Starting group configuration sync...");

  try {
    // First, sync all conversations to make sure we have the latest state
    console.log("📥 Syncing conversations...");
    await agent.client.conversations.sync();

    // Fetch configurations from CRON
    const configs = await fetchGroupConfigurations();
    console.log(`Fetched ${configs.length} group configurations`);

    // Process each configuration
    for (const config of configs) {
      const normalizedAddress = config.address.toLowerCase();
      let managedGroup = groupMap.get(normalizedAddress);

      // If not in memory, check if it exists in the database
      if (!managedGroup) {
        const existingGroupId = getGroupIdByAddress(normalizedAddress, agent.address!);

        if (existingGroupId) {
          // Group exists in DB but not in memory - load it
          console.log(`\n📂 Found group mapping in DB for ${config.address}`);
          console.log(`   Group ID: ${existingGroupId}`);

          try {
            // Get all conversations (groups AND DMs) and find the one with matching ID
            const conversations = await agent.client.conversations.list();
            const conversation = conversations.find(c => c.id === existingGroupId);

            if (conversation) {
              managedGroup = {
                group: conversation as Group,
                primaryAddress: config.address,
                lastSyncedAt: new Date(),
              };
              groupMap.set(normalizedAddress, managedGroup);
              console.log(`✅ Loaded existing conversation from XMTP (ID: ${existingGroupId.slice(0, 16)}...)`);
            } else {
              console.log(`⚠️  Conversation ${existingGroupId} not found in XMTP`);
              console.log(`   Will create a new one.`);
            }
          } catch (error) {
            console.error(`❌ Error loading conversation from XMTP:`, error);
          }
        }
      }

      if (!managedGroup) {
        // Group doesn't exist, create it
        console.log(`\n📝 Creating new group: ${config.address}`);
        const group = await createGroup(config);

        if (group) {
          const newManagedGroup = {
            group,
            primaryAddress: config.address,
            lastSyncedAt: new Date(),
          };
          groupMap.set(normalizedAddress, newManagedGroup);

          // Save to database
          saveGroupMapping(normalizedAddress, newManagedGroup, agent.address!);
          console.log(`💾 Saved group mapping to database`);
        }
      } else {
        // Group exists, sync members
        console.log(`\n🔄 Syncing existing group: ${config.address}`);
        await syncGroupMembers(managedGroup, config);
      }
    }

    console.log("\n✅ Group configuration sync completed");
    console.log(`Total managed groups: ${groupMap.size}`);

  } catch (error) {
    console.error("Error processing group configurations:", error);
  }
}

// ============================================================================
// AI-Powered Event Recommendation
// ============================================================================

/**
 * Format events data for AI context
 *
 * @param events - Array of event configurations
 * @returns Formatted string with event details for AI
 */
function formatEventsForAI(events: GroupConfig[]): string {
  if (events.length === 0) {
    return "No events are currently available.";
  }

  return events.map((event, idx) => {
    const dateStr = event.date ? new Date(event.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : "Date TBA";

    return `${idx + 1}. ${event.name}
   Label: ${event.label}
   Address: ${event.address}
   Date: ${dateStr}
   Description: ${event.description || "No description available"}
   Number of participants: ${event.memberAddresses.length}`;
  }).join("\n\n");
}

/**
 * Handle incoming DM with AI-powered event recommendations
 *
 * @param userMessage - The user's message
 * @param senderAddress - The sender's Ethereum address
 * @returns Response message with event recommendations
 */
async function handleEventRecommendation(userMessage: string, senderAddress: string): Promise<string> {
  try {
    console.log(`\n🤖 Processing DM from ${senderAddress.slice(0, 10)}...`);
    console.log(`   Message: "${userMessage}"`);

    // Check if OpenAI is configured
    if (!openai) {
      return "Sorry, the AI event recommendation service is currently unavailable. Please check back later or contact the administrator.";
    }

    // Fetch all available events
    const events = await fetchGroupConfigurations();

    if (events.length === 0) {
      return "I'm sorry, but there are currently no events available. Please check back later!";
    }

    console.log(`   Found ${events.length} events to recommend from`);

    // Format events for AI
    const eventsContext = formatEventsForAI(events);

    // Get current date
    const currentDate = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Create AI prompt
    const systemPrompt = `You are a helpful event recommendation assistant for Raduno, a decentralized event management platform on the Base app. Your role is to help users find the best events based on their interests and needs.

Today's date is: ${currentDate}

You have access to the following events:

${eventsContext}

When recommending events:
1. Understand what the user is looking for
2. Match their interests with available events
3. IMPORTANT: Check the event dates against today's date (${currentDate}). Do NOT recommend past events for registration. If a user asks about a past event, you can provide information about it but clearly state that it has already happened and they cannot register.
4. Recommend 1-3 most suitable UPCOMING events with their names
5. Be friendly and conversational
6. For each recommended upcoming event, include the registration link using the event's label: https://raduno.reza.dev/events/<label>
7. Format it nicely, like: "**Event Name** - Description here. Date: [date]. [Register here](https://raduno.reza.dev/events/label)"

Important:
- Use the event's Label field (not the name) in the URL. The name is for display only.
- Never recommend registration for events that have already passed.
- If a user asks about a past event, provide the information but make it clear it has already happened.`;

    // Call OpenAI API
    console.log(`   Calling OpenAI API...`);
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    const aiResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't process your request. Please try again.";

    console.log(`   AI Response generated successfully`);

    return aiResponse;

  } catch (error) {
    console.error("Error in handleEventRecommendation:", error);
    return "I apologize, but I encountered an error while processing your request. Please try again later.";
  }
}

/**
 * Send a registration transaction request to the user for a specific event
 *
 * @param eventAddress - The event contract address
 * @param eventName - The event name
 * @param eventLabel - The event label for URL
 * @param eventDate - The event date (optional, ISO string)
 * @param userAddress - The user's Ethereum address
 * @param conversation - The conversation to send the transaction to
 */
async function sendRegistrationTransaction(
  eventAddress: string,
  eventName: string,
  eventLabel: string,
  eventDate: string | undefined,
  userAddress: string,
  conversation: any
): Promise<void> {
  try {
    console.log(`\n📝 Preparing registration transaction for ${userAddress.slice(0, 10)}...`);
    console.log(`   Event: ${eventName}`);
    console.log(`   Contract: ${eventAddress}`);

    // Check if the event has already passed
    if (eventDate) {
      const eventDateTime = new Date(eventDate);
      const now = new Date();

      if (!isNaN(eventDateTime.getTime()) && eventDateTime < now) {
        console.log(`   ⚠️  Event has already passed (${eventDate})`);
        await conversation.send(
          `❌ Sorry, but **${eventName}** has already passed. You cannot register for past events.`,
          ContentTypeMarkdown
        );
        return;
      }
    }

    // Check if user is already registered
    const isAlreadyParticipant = await publicClient.readContract({
      address: eventAddress as Address,
      abi: CONTRACT_ABI,
      functionName: "isParticipant",
      args: [userAddress as Address],
    });

    if (isAlreadyParticipant) {
      console.log(`   ℹ️  User is already registered for this event`);
      await conversation.send(
        `✅ You're already registered for **${eventName}**!`,
        ContentTypeMarkdown
      );
      return;
    }

    // Encode the register() function call
    const data = encodeFunctionData({
      abi: CONTRACT_ABI,
      functionName: "register",
      args: [],
    });

    // Create the transaction request
    const transactionRequest: WalletSendCallsParams = {
      version: '1.0',
      from: userAddress as Address,
      chainId: '0x2105',
      capabilities: {
        // @ts-expect-error Wrong type from XMTP package
        paymasterService: {
          url: process.env.PAYMASTER_URL,
        },
  },
      calls: [
        {
          to: eventAddress as Address,
          data: data as `0x${string}`,
          metadata: {
            description: `Register for ${eventName}`,
            transactionType: "register",
            eventName: eventName,
            eventLabel: eventLabel,
            hostname: "raduno.reza.dev",
            title: "Raduno Event Registration",
          },
        },
      ],
    };

    console.log(`   📤 Sending transaction request to user...`);

    // Send the transaction request
    await conversation.send(transactionRequest, ContentTypeWalletSendCalls);

    // Send follow-up message
    await conversation.send(
      `🎉 I've prepared your registration for **${eventName}**!\n\nPlease approve the transaction in your Base app to complete your registration.`,
      ContentTypeMarkdown
    );

    console.log(`   ✅ Transaction request sent!`);

  } catch (error: any) {
    console.error("Error sending registration transaction:", error);
    await conversation.send(
      `❌ Sorry, there was an error preparing your registration. Please try again later.`,
      ContentTypeMarkdown
    );
  }
}

// ============================================================================
// Agent Setup
// ============================================================================

// Get environment variables
const walletKey = process.env.XMTP_WALLET_KEY as `0x${string}`;
const xmtpEnv = (process.env.XMTP_ENV || "dev") as "local" | "dev" | "production";

if (!walletKey) {
  throw new Error("XMTP_WALLET_KEY environment variable is required");
}

// Create user and signer from wallet key
const user = createUser(walletKey);
const signer = createSigner(user);

// Create agent
const agent = await Agent.create(signer, {
  env: xmtpEnv,
  dbPath: process.env.XMTP_DB_PATH || null,
  codecs: [new MarkdownCodec(), new WalletSendCallsCodec()]
});

// ============================================================================
// Startup and CRON Setup
// ============================================================================

agent.on("start", async () => {
  console.log(`\n🤖 XMTP Group Management Agent Started`);
  console.log(`Address: ${agent.address}`);
  console.log(`🔗 ${getTestUrl(agent.client)}`);
  console.log(`\n` + "=".repeat(60));

  // Check what's in the database
  const existingMappings = getAllGroupMappings();
  if (existingMappings.length > 0) {
    console.log(`\n📦 Found ${existingMappings.length} existing group mapping(s) in database:`);
    existingMappings.forEach((mapping, idx) => {
      console.log(`   ${idx + 1}. ${mapping.event_address} -> ${mapping.group_id.slice(0, 20)}...`);
      console.log(`      Name: ${mapping.group_name || 'N/A'}`);
      console.log(`      Last synced: ${new Date(mapping.last_synced_at).toLocaleString()}`);
    });
  } else {
    console.log(`\n📦 No existing group mappings found in database`);
  }

  // Run initial sync
  console.log("\n🚀 Running initial group sync...");
  await processGroupConfigurations();

  // Set up periodic sync (every 1 minutes = 60000ms)
  // Adjust this interval based on your needs
  const SYNC_INTERVAL = 30 * 1000; // 1 minute

  setInterval(async () => {
    console.log("\n⏰ Periodic sync triggered");
    await processGroupConfigurations();
  }, SYNC_INTERVAL);

  console.log(
    `\n⏰ Periodic sync scheduled every ${SYNC_INTERVAL / 1000} seconds`
  );
  console.log("=".repeat(60) + "\n");

  console.log(`\n🎧 Agent is now listening for messages...`);
  console.log(`Send a DM to ${agent.address} to test!\n`);
});

// ============================================================================
// DM Message Handler
// ============================================================================

console.log("🔧 Registering 'text' event handler...");

agent.on("text", async (ctx) => {
  console.log("🚨 TEXT EVENT TRIGGERED!");  // Debug: confirm handler is called
  try {
    // Check if this is a DM (not a group message)
    if (!ctx.isDm()) {
      // This is a group message, ignore it
      console.log(`📝 Received group message (ignoring): "${ctx.message.content}"`);
      return;
    }

    // Get sender's address
    const senderAddress = await ctx.getSenderAddress();

    if (!senderAddress) {
      console.log(`⚠️  Could not identify sender in DM`);
      return;
    }

    const messageText = ctx.message.content;

    console.log(`💬 Received DM from ${senderAddress.slice(0, 10)}...`);
    console.log(`   Message: "${messageText}"`);

    // Use AI to detect user intent
    if (openai) {
      const intentPrompt = `Analyze the user's message and determine if they want to register for a specific event.

User message: "${messageText}"

Respond with ONLY one of these two words:
- "REGISTER" if the user clearly wants to register/sign up/join a specific event
- "RECOMMEND" if the user is asking for recommendations or general information about events

Be strict: only respond "REGISTER" if they explicitly indicate they want to register for an event.`;

      console.log(`   🤖 Detecting user intent with AI...`);
      const intentCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: intentPrompt },
          { role: "user", content: messageText }
        ],
        temperature: 0.1,
        max_tokens: 10,
      });

      const intent = intentCompletion.choices[0]?.message?.content?.trim().toUpperCase();
      console.log(`   Intent detected: ${intent}`);

      if (intent === "REGISTER") {
        console.log(`   🎟️ User wants to register for an event`);

        // Fetch all available events
        const events = await fetchGroupConfigurations();

        if (events.length === 0) {
          await ctx.conversation.send(
            "I'm sorry, but there are currently no events available to register for. Please check back later!",
            ContentTypeMarkdown
          );
          return;
        }

        // Use AI to select the best event based on user message
        const eventsContext = formatEventsForAI(events);
        const currentDate = new Date().toISOString().split('T')[0];
        const systemPrompt = `You are an event selection assistant. Based on the user's message, select the MOST SUITABLE UPCOMING event for them.

Today's date is: ${currentDate}

Available events:
${eventsContext}

IMPORTANT: Only select events that have NOT passed yet (check the date). Do not select past events.

Respond with ONLY the event's address (42-char hex starting with 0x). Nothing else. If there are no suitable upcoming events, respond with "NONE".`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: messageText }
          ],
          temperature: 0.3,
          max_tokens: 100,
        });

        const selectedEventAddress = completion.choices[0]?.message?.content?.trim().toLowerCase();

        // Check if AI returned "NONE" (no suitable upcoming events)
        if (selectedEventAddress === "none") {
          console.log(`   ℹ️  AI found no suitable upcoming events for registration`);
          await ctx.conversation.send(
            "I'm sorry, but there are no suitable upcoming events for you to register for at the moment. The events that match your interests have already passed. Please check back later for new events!",
            ContentTypeMarkdown
          );
          return;
        }

        const selectedEvent = events.find(e => e.address.toLowerCase() === selectedEventAddress) || events[0];

        console.log(`   ✅ AI selected event: ${selectedEvent.name}`);

        // Send registration transaction
        await sendRegistrationTransaction(
          selectedEvent.address,
          selectedEvent.name,
          selectedEvent.label,
          selectedEvent.date,
          senderAddress,
          ctx.conversation
        );
        return;
      }
    }

    // Default: Handle with AI-powered recommendations
    const response = await handleEventRecommendation(messageText, senderAddress);

    // Send the response
    await ctx.conversation.send(response, ContentTypeMarkdown);
    console.log(`✅ Sent response to ${senderAddress.slice(0, 10)}...`);

  } catch (error) {
    console.error("Error handling text message:", error);
    try {
      await ctx.sendText("Sorry, I encountered an error processing your message. Please try again.");
    } catch (replyError) {
      console.error("Error sending error reply:", replyError);
    }
  }
});

agent.start();
