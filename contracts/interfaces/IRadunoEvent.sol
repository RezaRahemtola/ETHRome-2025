// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface IRadunoEvent {
    // -- Actions --
    function register() external payable;
    function removeParticipant(address participant) external;

    // -- Views (for frontend reads) --
    function isParticipant(address user) external view returns (bool);
    function isBlacklisted(address user) external view returns (bool);
    function getAllParticipants() external view returns (address[] memory);

    // -- Events --
    event Registered(address indexed participant);
    event Removed(address indexed participant);
}
