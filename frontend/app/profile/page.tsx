"use client";
import { useEffect, useState } from "react";
import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useAccount, useDeployContract, usePublicClient, useWaitForTransactionReceipt } from "wagmi";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";
import { CONSTRUCTOR_ARGS, CONTRACT_ABI, CONTRACT_BYTECODE } from "@/lib/contract";
import { getAddress } from "viem";

export default function ProfilePage() {
  const { isFrameReady, setFrameReady, context } = useMiniKit();
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const publicClient = usePublicClient();
  const [deployedContractAddress, setDeployedContractAddress] = useState<string | null>(null);

  // Contract deployment hook
  const {
    deployContract,
    data: hash,
    isPending: isDeploying,
    isError: isDeployError,
    error: deployError
  } = useDeployContract();

  // Wait for deployment transaction to be confirmed
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt
  } = useWaitForTransactionReceipt({
    hash
  });

  // Initialize the miniapp
  useEffect(() => {
    if (!isFrameReady) {
      setFrameReady();
    }
  }, [setFrameReady, isFrameReady]);

  // Redirect if wallet not connected
  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

  // Handle successful deployment and extract contract address
  useEffect(() => {
    const extractContractAddress = async () => {
      if (isConfirmed && receipt) {
        try {
          console.log("Checking receipt...");

          // Show receipt keys for debugging
          const receiptKeys = Object.keys(receipt).join(", ");
          console.log(`Receipt keys: ${receiptKeys}`);
          console.log(receipt);

          // Try to get contract address directly from receipt
          if (receipt.contractAddress) {
            const addr = getAddress(receipt.contractAddress);
            console.log("Deployed contract address:", addr);
            setDeployedContractAddress(addr);
            console.log(`Found at receipt.contractAddress: ${addr}`);
            return;
          }

          // Try alternative property names
          if ((receipt as any).contract) {
            const addr = getAddress((receipt as any).contract);
            setDeployedContractAddress(addr);
            console.log(`Found at receipt.contract: ${addr}`);
            return;
          }

          // For smart wallets, fetch full receipt using the hash
          if (publicClient && hash) {
            console.log("Fetching full receipt...");
            const fullReceipt = await publicClient.getTransactionReceipt({ hash });

            const fullReceiptKeys = Object.keys(fullReceipt).join(", ");
            console.log(`Full receipt keys: ${fullReceiptKeys}`);

            if (fullReceipt.contractAddress) {
              const addr = getAddress(fullReceipt.contractAddress);
              setDeployedContractAddress(addr);
              console.log(`Found at fullReceipt.contractAddress: ${addr}`);
              return;
            }

            // Show more details
            console.log(`Receipt status: ${fullReceipt.status}, Logs count: ${fullReceipt.logs?.length || 0}, To: ${fullReceipt.to || "null"}`);
          }

          console.log("Contract address not found in receipt");
        } catch (error) {
          console.log(`Error: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    };

    extractContractAddress();
  }, [isConfirmed, receipt, publicClient, hash]);

  const stats = [
    { label: "Events Attended", value: 12 },
    { label: "Events Hosted", value: 3 },
    { label: "Network Size", value: 48 }
  ];

  // Handle contract deployment
  const handleDeploy = async () => {
    try {
      if (CONTRACT_BYTECODE === "0x") {
        alert("Please add your contract bytecode to /lib/contract.ts first!");
        return;
      }

      deployContract({
        abi: CONTRACT_ABI,
        bytecode: CONTRACT_BYTECODE,
        args: CONSTRUCTOR_ARGS
      });
    } catch (error) {
      console.error("Deployment error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-xl border-b border-border z-10 safe-top">
        <div className="px-6 py-5">
          <h1 className="text-3xl font-bold">Profile</h1>
        </div>
      </div>

      <div className="px-6 py-6 pb-nav space-y-6">
        {/* User Card with gradient background */}
        <div
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 border border-border">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/50" />

          <div className="relative p-8">
            <div className="flex flex-col items-center text-center">
              {/* Avatar with enhanced styling */}
              {context?.user?.pfpUrl ? (
                <div className="relative mb-5">
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-30 blur-xl rounded-full" />
                  <img
                    src={context.user.pfpUrl}
                    alt={context.user.displayName || "Profile"}
                    className="relative w-28 h-28 rounded-full object-cover border-4 border-background shadow-xl"
                  />
                </div>
              ) : (
                <div className="relative mb-5">
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-secondary opacity-20 blur-2xl rounded-full" />
                  <div
                    className="relative w-28 h-28 rounded-full bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center text-4xl font-bold text-white shadow-2xl shadow-primary/25">
                    {context?.user?.displayName?.[0] || "?"}
                  </div>
                </div>
              )}

              {/* Name */}
              <h2 className="text-3xl font-bold mb-2">
                {context?.user?.displayName || "Anonymous User"}
              </h2>

              {/* Username or Wallet Address */}
              {context?.user?.username ? (
                <p className="text-base text-muted-foreground font-medium mb-1">
                  @{context.user.username}
                </p>
              ) : null}

              {address && !context?.user?.username && (
                <div
                  className="inline-flex items-center gap-2 bg-muted/80 backdrop-blur-sm px-4 py-2 rounded-full border border-border shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-sm text-muted-foreground font-mono font-semibold">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid with enhanced design */}
        <div className="grid grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-card rounded-2xl p-5 border border-border text-center hover:border-primary/30 hover:shadow-md transition-all"
            >
              <div className="text-3xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground font-semibold leading-tight uppercase tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Contract Deployment Section */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-xl font-bold mb-4">Deploy Event Contract</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Deploy a new event smart contract to the Base network. This will prompt your wallet to sign the deployment
            transaction.
          </p>

          {/* Deployment Status */}
          {hash && (
            <div className="mb-4 p-4 bg-muted/50 rounded-xl border border-border space-y-3">
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2">Transaction Hash:</div>
                <div className="text-xs font-mono break-all">{hash}</div>
              </div>

              {isConfirming && (
                <div className="text-sm text-primary animate-pulse">
                  ⏳ Waiting for confirmation...
                </div>
              )}

              {isConfirmed && (
                <div className="space-y-3">
                  <div className="text-sm text-green-500 font-semibold">
                    ✓ Contract deployed successfully!
                  </div>
                  {deployedContractAddress ? (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-2">Contract Address:</div>
                      <div
                        className="text-xs font-mono break-all bg-background/50 p-3 rounded-lg border border-primary/20">
                        {deployedContractAddress}
                      </div>
                      <a
                        href={`https://basescan.org/address/${deployedContractAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 text-xs text-primary hover:underline inline-block"
                      >
                        View on Basescan →
                      </a>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        Extracting contract address...
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {isDeployError && deployError && (
            <div className="mb-4 p-4 bg-destructive/10 rounded-xl border border-destructive/20">
              <div className="text-sm text-destructive font-semibold mb-2">Deployment Failed</div>
              <div className="text-xs text-destructive/80">{deployError.message}</div>
            </div>
          )}

          <button
            onClick={handleDeploy}
            disabled={isDeploying || isConfirming}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-4 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
          >
            {isDeploying || isConfirming ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⚙️</span>
                {isDeploying ? "Waiting for Approval..." : "Deploying..."}
              </span>
            ) : (
              "Deploy Contract"
            )}
          </button>
        </div>

        {/* Additional Info Section */}

        {/* Footer */}
        <div className="text-center pt-6 space-y-2">
          <div className="text-xs text-muted-foreground font-medium">
            Raduno v1.0.0
          </div>
          <div className="text-xs text-muted-foreground">
            Powered by <span className="font-semibold text-primary">Base</span>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
