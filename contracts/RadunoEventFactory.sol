// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import "./RadunoEvent.sol";

contract RadunoEventFactory {
    // Store addresses of deployed events
    address[] public allEvents;

    event EventCreated(
        address indexed eventAddress,
        address indexed owner,
        string label
    );

    function createEvent(
        address _l2Registrar,
        address _l2Registry,
        bytes32 _parentNode,
        string memory _label,
        uint256 _capacity
    ) external returns (address) {
        // Deploy new event
        RadunoEvent ev = new RadunoEvent(
            _l2Registrar,
            _l2Registry,
            _parentNode,
            _label,
            _capacity
        );

        // Store and emit
        allEvents.push(address(ev));
        emit EventCreated(address(ev), msg.sender, _label);

        return address(ev);
    }

    // Helper to get count
    function getDeployedEvents() external view returns (address[] memory) {
        return allEvents;
    }
}
