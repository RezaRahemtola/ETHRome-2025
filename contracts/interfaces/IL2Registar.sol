// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @notice Interface for a simple ENS-style L2 Registrar
interface IL2Registrar {
    /// @notice Register a subdomain `label` under `parentNode` to `owner`
    function register(string calldata label, address owner) external;

    /// @notice optionally other functions...
}
