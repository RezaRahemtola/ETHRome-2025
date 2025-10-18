import { createPublicClient, http, namehash } from "viem";
import { base } from "wagmi/chains";
import { CONTRACT_ABI as EVENT_ABI } from "./contracts/event";
import { CONTRACT_ABI as REGISTRY_ABI, CONTRACT_ADDRESS as REGISTRY_ADDRESS } from "./contracts/registry";

export interface EventData {
  id: string;
  title: string;
  description?: string;
  date: string;
  time: string;
  location: string;
  attendees: number;
  maxAttendees: number;
  image: string;
  host: string;
  category: string;
  address?: string;
}

// Category emoji mapping
const categoryEmojis: Record<string, string> = {
  "meetup": "👥",
  "workshop": "🛠️",
  "conference": "🎤",
  "social": "🎉",
  "hackathon": "⚡",
  "other": "📌"
};

/**
 * Create a public client configured with the custom RPC
 */
function getPublicClient() {
  return createPublicClient({
    chain: base,
    transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://mainnet.base.org")
  });
}

/**
 * Fetch text records from L2Registry for a given ENS name
 */
async function fetchRegistryData(ensName: string) {
  const publicClient = getPublicClient();
  const node = namehash(ensName);

  const [nickname, description, category, date, location, host] = await Promise.all([
    publicClient.readContract({
      address: REGISTRY_ADDRESS as `0x${string}`,
      abi: REGISTRY_ABI,
      functionName: "text",
      args: [node, "nickname"]
    }).catch(() => null),
    publicClient.readContract({
      address: REGISTRY_ADDRESS as `0x${string}`,
      abi: REGISTRY_ABI,
      functionName: "text",
      args: [node, "description"]
    }).catch(() => null),
    publicClient.readContract({
      address: REGISTRY_ADDRESS as `0x${string}`,
      abi: REGISTRY_ABI,
      functionName: "text",
      args: [node, "category"]
    }).catch(() => null),
    publicClient.readContract({
      address: REGISTRY_ADDRESS as `0x${string}`,
      abi: REGISTRY_ABI,
      functionName: "text",
      args: [node, "date"]
    }).catch(() => null),
    publicClient.readContract({
      address: REGISTRY_ADDRESS as `0x${string}`,
      abi: REGISTRY_ABI,
      functionName: "text",
      args: [node, "location"]
    }).catch(() => null),
    publicClient.readContract({
      address: REGISTRY_ADDRESS as `0x${string}`,
      abi: REGISTRY_ABI,
      functionName: "text",
      args: [node, "host"]
    }).catch(() => null)
  ]);


  return {
    nickname: nickname,
    description: description,
    category: category,
    date: date,
    location: location,
    host: host
  };
}

/**
 * Fetch event contract data (label, capacity, participant count)
 */
async function fetchEventContractData(address: `0x${string}`) {
  const publicClient = getPublicClient();

  const [label, capacity, participantCount] = await Promise.all([
    publicClient.readContract({
      address,
      abi: EVENT_ABI,
      functionName: "label"
    }),
    publicClient.readContract({
      address,
      abi: EVENT_ABI,
      functionName: "capacity"
    }),
    publicClient.readContract({
      address,
      abi: EVENT_ABI,
      functionName: "getParticipantCount"
    })
  ]);

  return {
    label: label as string,
    capacity: Number(capacity),
    participantCount: Number(participantCount)
  };
}

/**
 * Parse date string into date and time
 */
function parseEventDate(dateStr: string | null): { date: string; time: string } {
  if (!dateStr) {
    return { date: "2025-11-15", time: "18:00" };
  }

  try {
    const dateObj = new Date(dateStr);
    return {
      date: dateObj.toISOString().split("T")[0],
      time: dateObj.toTimeString().slice(0, 5)
    };
  } catch (e) {
    console.error("Error parsing date:", e);
    return { date: "2025-11-15", time: "18:00" };
  }
}

/**
 * Fetch complete event data by event label/ID
 */
export async function fetchEventByLabel(label: string): Promise<EventData | null> {
  try {
    const ensName = `${label}.raduno.eth`;
    console.log("Fetching event data for:", ensName);

    const registryData = await fetchRegistryData(ensName);
    const { date, time } = parseEventDate(registryData.date);

    return {
      id: label,
      title: registryData.nickname || `Event ${label}`,
      description: registryData.description || "No description available",
      date,
      time,
      location: registryData.location || "TBA",
      attendees: 0, // Will be fetched from event contract if address is known
      maxAttendees: 100, // Will be fetched from event contract if address is known
      image: categoryEmojis[registryData.category || "other"] || "🎉",
      host: registryData.host || "Unknown",
      category: registryData.category || "other"
    };
  } catch (error) {
    console.error(`Error fetching event ${label}:`, error);
    return null;
  }
}

/**
 * Fetch complete event data by contract address
 */
export async function fetchEventByAddress(address: `0x${string}`): Promise<EventData | null> {
  try {
    console.log("Fetching event data for address:", address);

    // Fetch contract data
    const contractData = await fetchEventContractData(address);
    const ensName = `${contractData.label}.raduno.eth`;

    // Fetch registry data
    const registryData = await fetchRegistryData(ensName);
    const { date, time } = parseEventDate(registryData.date);

    return {
      id: contractData.label,
      title: registryData.nickname || `Event ${address.slice(0, 6)}`,
      description: registryData.description || undefined,
      date,
      time,
      location: registryData.location || "TBA",
      attendees: contractData.participantCount,
      maxAttendees: contractData.capacity,
      image: categoryEmojis[registryData.category || "other"] || "🎉",
      host: registryData.host || address.slice(0, 6),
      category: registryData.category || "other",
      address
    };
  } catch (error) {
    console.error(`Error fetching event ${address}:`, error);
    return null;
  }
}

/**
 * Fetch multiple events by their contract addresses
 */
export async function fetchEventsByAddresses(addresses: `0x${string}`[]): Promise<EventData[]> {
  const eventDetails = await Promise.all(
    addresses.map(address => fetchEventByAddress(address))
  );

  return eventDetails.filter((event): event is EventData => event !== null);
}
