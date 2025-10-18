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

    /// @notice Optional capacity (0 = unlimited)
    uint256 public capacity;

    /// @notice The ENS L2 registrar contract
    IL2Registrar public l2Registrar;
    /// @notice The ENS L2 registry contract
    IL2Registry public l2Registry;

    /// @notice The parent node under which subdomains are created (e.g. namehash("raduno.eth"))
    bytes32 public parentNode;
    /// @notice The label chosen (string) for this specific event subdomain
    string public label;

    constructor(
        address _l2Registrar,
        address _l2Registry,
        bytes32 _parentNode,
        string memory _label,
        uint256 _capacity,
        string memory _eventName, // nickname
        string memory _description, // description
        string memory _category, // category
        string memory _date, // date
        string memory _location // location
    ) Ownable(msg.sender) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);

        l2Registrar = IL2Registrar(_l2Registrar);
        l2Registry = IL2Registry(_l2Registry);

        parentNode = _parentNode;
        label = _label;
        capacity = _capacity; // 0 = unlimited

        // Register the subdomain with this contract as owner
        l2Registrar.register(label, address(this));

        // 1️⃣ Register the subdomain to this contract
        l2Registrar.register(label, address(this));

        // 2️⃣ Compute ENS node = keccak256(parentNode, keccak256(label))
        bytes32 node = keccak256(
            abi.encodePacked(parentNode, keccak256(bytes(label)))
        );

        // 3️⃣ Set ENS text records
        l2Registry.setText(node, "nickname", _eventName);
        l2Registry.setText(node, "description", _description);
        l2Registry.setText(node, "category", _category);
        l2Registry.setText(node, "date", _date);
        l2Registry.setText(node, "location", _location);
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

        // enforce capacity if set
        if (capacity > 0) {
            require(
                participantList.length < capacity,
                "Event at full capacity"
            );
        }

        participants[msg.sender] = true;
        participantList.push(msg.sender);

        emit Registered(msg.sender);
    }

    /// @notice Unregister yourself (if already registered)
    function unregister() public {
        require(participants[msg.sender], "Not registered");

        participants[msg.sender] = false;

        // remove from participantList (gas expensive, but fine for small events)
        for (uint256 i = 0; i < participantList.length; i++) {
            if (participantList[i] == msg.sender) {
                participantList[i] = participantList[
                    participantList.length - 1
                ];
                participantList.pop();
                break;
            }
        }

        emit Removed(msg.sender);
    }

    /// @notice Remove and blacklist a participant (admin only)
    function removeParticipant(address participant) public virtual override {
        require(participants[participant], "Not registered");

        participants[participant] = false;
        blacklisted[participant] = true;

        // remove from participantList
        for (uint256 i = 0; i < participantList.length; i++) {
            if (participantList[i] == participant) {
                participantList[i] = participantList[
                    participantList.length - 1
                ];
                participantList.pop();
                break;
            }
        }

        emit Removed(participant);
    }

    // @notice Proxy the setText call for admins to edit event metadata
    function setText(
        bytes32 node,
        string calldata key,
        string calldata value
    ) external {
        l2Registry.setText(node, key, value);
    }

    /// @notice Allow admins to update capacity
    function setCapacity(uint256 _newCapacity) external {
        capacity = _newCapacity;
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

    /// @notice Get current participant count
    function getParticipantCount() external view returns (uint256) {
        return participantList.length;
    }
}
