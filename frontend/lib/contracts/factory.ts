/**
 * Contract deployment configuration
 *
 * To use this:
 * 1. Compile your Solidity contract (using Hardhat, Foundry, or Remix)
 * 2. Copy the ABI from the compilation output
 * 3. Copy the bytecode from the compilation output (starts with 0x608...)
 * 4. If your contract has constructor parameters, specify them in the deployment call
 */

// Replace this with your actual contract ABI
export const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_realOwner",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_l2Registrar",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_l2Registry",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "_parentNode",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "_label",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "_capacity",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "_eventName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_description",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_category",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_date",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_location",
        "type": "string"
      }
    ],
    "name": "createEvent",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "eventAddress",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "owner",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "label",
        "type": "string"
      }
    ],
    "name": "EventCreated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "allEvents",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getDeployedEvents",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// Replace with your deployed contract address
export const CONTRACT_ADDRESS = "0x6C4D54B781c373D25d6654D2A143a2DA112dFd2A";

// If your contract constructor requires arguments, define their types here
// Example: export const CONSTRUCTOR_ARGS = ["Initial Value", 100] as const;
export const CONSTRUCTOR_ARGS = ["0x0A20Ab270Ac8Ffeb026fe5e57Ea31C2e58a686e0", "0xc02f3b4cbe3431a46a19416211aee7f004d829c3", "0xf8eb8832c80df1738b0aca49ffe0f4d8f134c83fb711e11be62cc4efa4555a82"] as [`0x${string}`, `0x${string}`, `0x${string}`];
