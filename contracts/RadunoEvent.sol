// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "./interfaces/IRadunoEvent.sol";
import "./interfaces/IL2Registrar.sol";
import "./interfaces/IL2Registry.sol";

contract RadunoEvent is Ownable, IERC721Receiver, AccessControl, IRadunoEvent {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    mapping(address => bool) private participants;
    mapping(address => bool) private blacklisted;
    address[] private participantList;

    /// @notice The ENS L2 registrar contract
    IL2Registrar public l2Registrar;
    /// @notice The ENS L2 registry contract
    IL2Registry public l2Registry;

    /// @notice The parent node under which subdomains are created (e.g. namehash("raduno.eth"))
    bytes32 public parentNode;
    /// @notice The label chosen (string) for this specific event subdomain
    string public label;

    bool private ensInitialized;

    constructor(
        address _l2Registrar,
        address _l2Registry,
        bytes32 _parentNode,
        string memory _label
    ) Ownable(msg.sender) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        l2Registrar = IL2Registrar(_l2Registrar);
        l2Registry = IL2Registry(_l2Registry);

        parentNode = _parentNode;
        label = _label;
        ensInitialized = false;
    }

    /// @notice Initialize ENS subdomain registration and set approval
    /// @dev Must be called by owner after deployment. Cannot be called twice.
    function initializeENS() external {
        require(!ensInitialized, "ENS already initialized");
        ensInitialized = true;

        // 1. Register the subdomain under parentNode with this contract as owner
        l2Registrar.register(label, address(this));

        // 2. Compute the node (namehash) of “label.parent” (off-chain or on-chain)
        // Here we assume the caller supplies uint256 node value via a helper, but
        // you might compute it offchain and pass as argument to this function.
        // For simplicity, we compute a labelhash and combine with parentNode:
        bytes32 labelHash = keccak256(bytes(label));
        // namehash for subnode = keccak256(parentNode, labelHash)
        bytes32 subnode = keccak256(abi.encodePacked(parentNode, labelHash));

        // 3. Approve the owner (msg.sender) as operator for this subnode
        // Convert bytes32 to uint256 for registry function
        uint256 subnodeUint = uint256(subnode);
        l2Registry.approve(this.owner(), subnodeUint);
    }

    // ---------------------- ERC721 Receiver ----------------------

    /// @notice Required to receive ERC721 tokens from the ENS registry
    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        // Return the selector to confirm safe receipt
        return IERC721Receiver.onERC721Received.selector;
    }

    // ---------------------- Core Functions ----------------------

    /// @notice Default registration (no payment required)
    /// @dev Can be overridden to require payments or other conditions
    function register() public payable virtual override {
        require(!blacklisted[msg.sender], "Blacklisted");
        require(!participants[msg.sender], "Already registered");

        participants[msg.sender] = true;
        participantList.push(msg.sender);

        emit Registered(msg.sender);
    }

    /// @notice Remove and blacklist a participant
    /// @dev Only admins can call this
    function removeParticipant(
        address participant
    ) public virtual override onlyRole(ADMIN_ROLE) {
        require(participants[participant], "Not registered");

        participants[participant] = false;
        blacklisted[participant] = true;

        emit Removed(participant);
    }

    // ---------------------- Read Functions ----------------------

    function isParticipant(address user) external view override returns (bool) {
        return participants[user];
    }

    function isBlacklisted(address user) external view override returns (bool) {
        return blacklisted[user];
    }

    function getAllParticipants()
        external
        view
        override
        returns (address[] memory)
    {
        return participantList;
    }
}
